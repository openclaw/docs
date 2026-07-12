---
read_when:
    - Captura de registros de macOS o investigación del registro de datos privados
    - Depuración de problemas del ciclo de vida de la activación por voz y de las sesiones
summary: 'Registro de OpenClaw: archivo de registro de diagnóstico rotativo + indicadores unificados de privacidad del registro'
title: Registro de macOS
x-i18n:
    generated_at: "2026-07-11T23:15:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Registro (macOS)

## Registro de archivo de diagnóstico rotativo (panel de depuración)

La aplicación para macOS registra mediante swift-log (con el registro unificado de forma predeterminada) y también puede escribir un archivo de registro local rotativo para conservar los datos capturados (`DiagnosticsFileLog`).

- Activar: **Panel de depuración -> Registros -> Registro de la aplicación -> "Escribir registro de diagnóstico rotativo (JSONL)"** (desactivado de forma predeterminada).
- Nivel de detalle: selector **Panel de depuración -> Registros -> Registro de la aplicación -> Nivel de detalle**.
- Ubicación: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotación: rota al alcanzar 5 MB; conserva hasta 5 copias de seguridad con los sufijos `.1`...`.5` (se elimina la más antigua).
- Borrar: **Panel de depuración -> Registros -> Registro de la aplicación -> "Borrar"** elimina el archivo activo y todas las copias de seguridad.

Trate el archivo como información confidencial; no lo comparta sin revisarlo.

## Datos privados del registro unificado en macOS

El registro unificado oculta la mayoría de las cargas útiles, salvo que un subsistema habilite `privacy -off`. Esto se controla mediante un plist en `/Library/Preferences/Logging/Subsystems/`, identificado por el nombre del subsistema. Solo las nuevas entradas de registro aplican la opción, por lo que debe activarla antes de reproducir un problema. Más información: [peculiaridades de privacidad del registro de macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Activar para OpenClaw (`ai.openclaw`)

Primero escriba el plist en un archivo temporal y, a continuación, instálelo atómicamente como root:

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

No es necesario reiniciar; logd detecta el archivo rápidamente, pero solo las nuevas líneas de registro incluyen cargas útiles privadas. Consulte la salida más detallada con `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` establece el intervalo de tiempo, con `5m` como valor predeterminado; `--category`/`-c` filtra por categoría).

## Desactivar después de la depuración

- Elimine la anulación: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente, ejecute `sudo log config --reload` para forzar que logd descarte la anulación de inmediato.
- Esta información puede incluir números de teléfono y cuerpos de mensajes; mantenga el plist instalado únicamente mientras sea necesario.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Registro del Gateway](/es/gateway/logging)
