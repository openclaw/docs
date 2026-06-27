---
read_when:
    - Capturar registros de macOS o investigar el registro de datos privados
    - Depuración de problemas del ciclo de vida de activación por voz/sesión
summary: 'Registro de OpenClaw: archivo de registro de diagnóstico rotativo + indicadores de privacidad del registro unificado'
title: Registro de macOS
x-i18n:
    generated_at: "2026-05-06T09:05:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Registro (macOS)

## Registro de archivo de diagnósticos rotativo (panel de depuración)

OpenClaw enruta los registros de la app de macOS a través de swift-log (registro unificado de forma predeterminada) y puede escribir un registro de archivo local y rotativo en disco cuando necesitas una captura duradera.

- Nivel de detalle: **panel de depuración → Registros → Registro de la app → Nivel de detalle**
- Activar: **panel de depuración → Registros → Registro de la app → "Escribir registro de diagnósticos rotativo (JSONL)"**
- Ubicación: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rota automáticamente; los archivos antiguos reciben los sufijos `.1`, `.2`, …)
- Borrar: **panel de depuración → Registros → Registro de la app → "Borrar"**

Notas:

- Está **desactivado de forma predeterminada**. Actívalo solo mientras estés depurando activamente.
- Trata el archivo como sensible; no lo compartas sin revisarlo.

## Datos privados del registro unificado en macOS

El registro unificado redacta la mayoría de las cargas útiles salvo que un subsistema active `privacy -off`. Según el artículo de Peter sobre [maniobras de privacidad en el registro](https://steipete.me/posts/2025/logging-privacy-shenanigans) de macOS (2025), esto se controla mediante un plist en `/Library/Preferences/Logging/Subsystems/` identificado por el nombre del subsistema. Solo las entradas de registro nuevas toman la marca, así que actívala antes de reproducir un problema.

## Activar para OpenClaw (`ai.openclaw`)

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

- No se requiere reiniciar; logd detecta el archivo rápidamente, pero solo las líneas de registro nuevas incluirán cargas útiles privadas.
- Consulta la salida más completa con el ayudante existente, por ejemplo, `./scripts/clawlog.sh --category WebChat --last 5m`.

## Desactivar después de depurar

- Elimina la anulación: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente, ejecuta `sudo log config --reload` para forzar que logd descarte la anulación de inmediato.
- Recuerda que esta superficie puede incluir números de teléfono y cuerpos de mensajes; mantén el plist en su lugar solo mientras necesites activamente el detalle adicional.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Registro de Gateway](/es/gateway/logging)
