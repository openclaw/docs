---
read_when:
    - Capturar registros de macOS o investigar el registro de datos privados
    - Depuración de problemas del ciclo de vida de activación por voz/sesión
summary: 'Registro de OpenClaw: registro en archivo de diagnósticos rotativo + indicadores de privacidad del registro unificado'
title: Registro de macOS
x-i18n:
    generated_at: "2026-07-05T11:26:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Registro (macOS)

## Registro de archivo de diagnóstico rotativo (panel Depuración)

La app de macOS registra mediante swift-log (registro unificado de forma predeterminada) y también puede escribir un registro de archivo local rotativo para una captura duradera (`DiagnosticsFileLog`).

- Activar: **Panel Depuración -> Registros -> Registro de la app -> "Escribir registro de diagnóstico rotativo (JSONL)"** (desactivado de forma predeterminada).
- Verbosidad: selector **Panel Depuración -> Registros -> Registro de la app -> Verbosidad**.
- Ubicación: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotación: rota a los 5 MB; hasta 5 copias de seguridad con sufijo `.1`...`.5` (se elimina la más antigua).
- Borrar: **Panel Depuración -> Registros -> Registro de la app -> "Borrar"** elimina el archivo activo y todas las copias de seguridad.

Trata el archivo como sensible; no lo compartas sin revisarlo.

## Datos privados del registro unificado en macOS

El registro unificado redacta la mayoría de las cargas útiles salvo que un subsistema opte por `privacy -off`. Esto se controla mediante un plist en `/Library/Preferences/Logging/Subsystems/` identificado por el nombre del subsistema. Solo las nuevas entradas de registro aplican la marca, así que actívala antes de reproducir un problema. Contexto: [travesuras de privacidad del registro en macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Activar para OpenClaw (`ai.openclaw`)

Escribe primero el plist en un archivo temporal y luego instálalo atómicamente como root:

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

No se requiere reiniciar; logd detecta el archivo rápidamente, pero solo las nuevas líneas de registro incluyen cargas útiles privadas. Consulta la salida más completa con `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` establece el intervalo de tiempo, predeterminado `5m`; `--category`/`-c` filtra por categoría).

## Desactivar después de depurar

- Elimina la sobrescritura: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente, ejecuta `sudo log config --reload` para forzar que logd descarte la sobrescritura de inmediato.
- Esta superficie puede incluir números de teléfono y cuerpos de mensajes; mantén el plist instalado solo mientras sea necesario activamente.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Registro de Gateway](/es/gateway/logging)
