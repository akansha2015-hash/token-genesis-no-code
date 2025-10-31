import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a new encryption key (in production, this should use HSM or key management service)
function generateKeyHash(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Compliance check logging
async function logComplianceCheck(supabaseClient: any, checkType: string, result: string, details: any) {
  await supabaseClient
    .from('compliance_logs')
    .insert({
      check_type: checkType,
      check_result: result,
      details: details,
      severity: result === 'passed' ? 'info' : 'warning'
    })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify this is an internal/admin request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    let rotatedBy = null
    let isScheduledJob = false

    // If user authentication fails, check if this is a scheduled cron job
    if (userError || !user) {
      // For cron jobs, we can validate using a specific header or secret
      const cronSecret = req.headers.get('X-Cron-Secret')
      if (cronSecret !== Deno.env.get('CRON_SECRET')) {
        await logComplianceCheck(supabaseClient, 'key_rotation_auth', 'failed', { error: 'Unauthorized access attempt' })
        
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      isScheduledJob = true
    } else {
      // If user exists, verify they have admin role
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (!roles || !roles.some((r: any) => r.role === 'admin')) {
        await logComplianceCheck(supabaseClient, 'key_rotation_auth', 'failed', { 
          user_id: user.id,
          error: 'Insufficient privileges'
        })
        
        return new Response(
          JSON.stringify({ error: 'Access denied. Only admins can rotate encryption keys.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
      rotatedBy = user.id
    }

    // Get the current active key
    const { data: currentKey } = await supabaseClient
      .from('encryption_keys')
      .select('*')
      .eq('is_active', true)
      .order('key_version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = currentKey ? currentKey.key_version + 1 : 1

    // Generate new key hash
    const newKeyHash = generateKeyHash()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Key expires in 30 days

    // Insert new key
    const { data: newKey, error: insertError } = await supabaseClient
      .from('encryption_keys')
      .insert({
        key_version: nextVersion,
        key_hash: newKeyHash,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        rotated_by: rotatedBy
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating new key:', insertError)
      await logComplianceCheck(supabaseClient, 'key_rotation', 'failed', { error: insertError.message })
      
      return new Response(
        JSON.stringify({ error: 'Failed to create new encryption key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Deactivate old key
    if (currentKey) {
      await supabaseClient
        .from('encryption_keys')
        .update({ is_active: false })
        .eq('id', currentKey.id)
    }

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        entity_type: 'encryption_key',
        entity_id: newKey.id,
        operation_type: 'rotate',
        user_id: rotatedBy,
        request_ip: requestIp,
        request_data: {
          previous_version: currentKey?.key_version,
          new_version: nextVersion,
          is_scheduled: isScheduledJob
        },
        response_status: 200,
        accessed_fields: ['key_hash', 'key_version'],
        compliance_flags: {
          pci_dss_compliant: true,
          rotation_interval_days: 30,
          automated_rotation: isScheduledJob
        }
      })

    // Log compliance check
    await logComplianceCheck(supabaseClient, 'key_rotation', 'passed', {
      old_key_version: currentKey?.key_version,
      new_key_version: nextVersion,
      rotated_by: rotatedBy || 'scheduled_job',
      rotation_reason: isScheduledJob ? 'scheduled_30_day_rotation' : 'manual_rotation'
    })

    console.log('Encryption key rotated successfully. New version:', nextVersion)

    return new Response(
      JSON.stringify({ 
        message: 'Encryption key rotated successfully',
        key_version: nextVersion,
        expires_at: expiresAt.toISOString(),
        previous_version: currentKey?.key_version
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in key rotation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
