# Configura una tarea programada en Windows para correr redis_apply_ttl.js semanalmente.
# Ejecuta desde PowerShell (no requiere admin si se registra para el usuario actual).
# Si el PC esta apagado al horario, StartWhenAvailable lo dispara apenas se prenda.

$TaskName    = "Redis TTL Maintenance MV"
$NodePath    = "C:\Program Files\nodejs\node.exe"
$ScriptPath  = "C:\Proyectos\n8n\redis_apply_ttl.js"
$WorkingDir  = "C:\Proyectos\n8n"
$LogPath     = "C:\Proyectos\n8n\logs\redis_ttl.log"

# Borra la tarea si ya existe (idempotente)
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Tarea ya existe, la borro para recrear..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Wrapper que captura stdout+stderr a log con timestamp
$argString = "/c echo === %DATE% %TIME% === >> `"$LogPath`" && `"$NodePath`" `"$ScriptPath`" >> `"$LogPath`" 2>&1"

$action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument $argString `
    -WorkingDirectory $WorkingDir

# Domingos 04:00 hora local
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 4am

# CLAVE: StartWhenAvailable = si el PC estaba apagado al horario, corre apenas se prenda
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -MultipleInstances IgnoreNew

# Correr como el usuario actual (no SYSTEM) para que tenga acceso a node y node_modules
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Aplica TTL a keys de Redis sin TTL del workflow ATC. Semanal domingo 04:00. StartWhenAvailable=ON."

Write-Host ""
Write-Host "=== Tarea creada ==="
Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo | Format-List TaskName, NextRunTime, LastRunTime, LastTaskResult

Write-Host ""
Write-Host "Para correr una vez ahora (test):"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "Para ver el log:"
Write-Host "  Get-Content '$LogPath' -Tail 50"
Write-Host ""
Write-Host "Para borrar:"
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
