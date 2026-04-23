---
read_when:
    - Quieres ejecutar un turno de agente desde scripts (opcionalmente entregar la respuesta)
summary: Referencia de la CLI para `openclaw agent` (enviar un turno de agente a través del Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-23T14:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Ejecuta un turno de agente a través del Gateway (usa `--local` para el modo integrado).
Usa `--agent <id>` para dirigirte directamente a un agente configurado.

Pasa al menos un selector de sesión:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Herramienta de envío de agente: [Agent send](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje obligatorio
- `-t, --to <dest>`: destinatario usado para derivar la clave de sesión
- `--session-id <id>`: id de sesión explícito
- `--agent <id>`: id del agente; anula las vinculaciones de enrutamiento
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados compatibles con el proveedor como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: persistir el nivel detallado para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: anulación del destino de entrega
- `--reply-channel <channel>`: anulación del canal de entrega
- `--reply-account <id>`: anulación de la cuenta de entrega
- `--local`: ejecutar directamente el agente integrado (después de la precarga del registro de plugins)
- `--deliver`: enviar la respuesta de vuelta al canal/destino seleccionado
- `--timeout <seconds>`: anular el tiempo de espera del agente (predeterminado 600 o el valor de configuración)
- `--json`: salida en JSON

## Ejemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notas

- El modo Gateway recurre al agente integrado cuando falla la solicitud al Gateway. Usa `--local` para forzar la ejecución integrada desde el principio.
- `--local` sigue precargando primero el registro de plugins, por lo que los proveedores, herramientas y canales proporcionados por plugins siguen estando disponibles durante las ejecuciones integradas.
- `--channel`, `--reply-channel` y `--reply-account` afectan a la entrega de la respuesta, no al enrutamiento de la sesión.
- Cuando este comando desencadena la regeneración de `models.json`, las credenciales del proveedor gestionadas por SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), no como texto plano de secretos resueltos.
- Las escrituras de marcadores son autoritativas desde la fuente: OpenClaw conserva los marcadores de la instantánea de configuración de origen activa, no de los valores secretos resueltos en tiempo de ejecución.
