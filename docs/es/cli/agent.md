---
read_when:
    - Quieres ejecutar un turno de agente desde scripts (opcionalmente entregar la respuesta)
summary: Referencia de la CLI para `openclaw agent` (enviar un turno de agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-24T05:21:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Ejecuta un turno de agente mediante el Gateway (usa `--local` para el modo integrado).
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
- `--agent <id>`: id del agente; sobrescribe los enlaces de enrutamiento
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados compatibles con el proveedor como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conservar el nivel detallado para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: sobrescritura del destino de entrega
- `--reply-channel <channel>`: sobrescritura del canal de entrega
- `--reply-account <id>`: sobrescritura de la cuenta de entrega
- `--local`: ejecutar directamente el agente integrado (después de la precarga del registro de Plugins)
- `--deliver`: enviar la respuesta de vuelta al canal/destino seleccionado
- `--timeout <seconds>`: sobrescribir el timeout del agente (predeterminado: 600 o el valor de configuración)
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

- El modo Gateway vuelve al agente integrado cuando falla la solicitud al Gateway. Usa `--local` para forzar la ejecución integrada desde el principio.
- `--local` sigue precargando primero el registro de Plugins, por lo que los proveedores, herramientas y canales proporcionados por Plugins siguen estando disponibles durante las ejecuciones integradas.
- `--channel`, `--reply-channel` y `--reply-account` afectan a la entrega de la respuesta, no al enrutamiento de la sesión.
- Cuando este comando activa la regeneración de `models.json`, las credenciales de proveedor administradas con SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), no como texto plano secreto resuelto.
- Las escrituras de marcadores son autoritativas desde la fuente: OpenClaw conserva los marcadores a partir de la instantánea activa de configuración de origen, no de los valores secretos resueltos en tiempo de ejecución.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tiempo de ejecución del agente](/es/concepts/agent)
