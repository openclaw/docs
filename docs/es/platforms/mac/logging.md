---
read_when:
    - Capturar registros de macOS o investigar el registro de datos privados
    - Depurar problemas de activación por voz o del ciclo de vida de sesión
summary: 'Registro de OpenClaw: registro rotativo de diagnóstico en archivo + flags de privacidad del registro unificado'
title: Registro en macOS
x-i18n:
    generated_at: "2026-04-24T05:38:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Registro (macOS)

## Registro rotativo de diagnóstico en archivo (panel Debug)

OpenClaw enruta los registros de la app de macOS mediante swift-log (registro unificado de forma predeterminada) y puede escribir un registro local rotativo en archivo cuando necesitas una captura duradera.

- Nivel de detalle: **panel Debug → Logs → App logging → Verbosity**
- Habilitar: **panel Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Ubicación: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rota automáticamente; los archivos antiguos se sufijan con `.1`, `.2`, …)
- Borrar: **panel Debug → Logs → App logging → “Clear”**

Notas:

- Esto está **desactivado por defecto**. Habilítalo solo mientras estés depurando activamente.
- Trata el archivo como sensible; no lo compartas sin revisarlo.

## Datos privados del registro unificado en macOS

El registro unificado redacta la mayoría de las cargas útiles salvo que un subsistema active `privacy -off`. Según el artículo de Peter sobre macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), esto se controla mediante un plist en `/Library/Preferences/Logging/Subsystems/` indexado por el nombre del subsistema. Solo las nuevas entradas del registro recogen la flag, así que actívala antes de reproducir un problema.

## Habilitar para OpenClaw (`ai.openclaw`)

- Escribe primero el plist en un archivo temporal y luego instálalo atómicamente como root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- No hace falta reiniciar; logd detecta el archivo rápidamente, pero solo las nuevas líneas del registro incluirán cargas útiles privadas.
- Visualiza la salida enriquecida con el helper existente, por ejemplo `./scripts/clawlog.sh --category WebChat --last 5m`.

## Deshabilitar después de depurar

- Elimina la sobrescritura: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente ejecuta `sudo log config --reload` para forzar a logd a descartar inmediatamente la sobrescritura.
- Recuerda que esta superficie puede incluir números de teléfono y cuerpos de mensajes; mantén el plist activo solo mientras necesites realmente ese nivel adicional de detalle.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Registro del Gateway](/es/gateway/logging)
