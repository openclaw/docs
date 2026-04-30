---
read_when:
    - Desea ejecutar un turno de agente desde scripts (opcionalmente enviar la respuesta)
summary: Referencia de CLI para `openclaw agent` (envía un turno de agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-30T05:32:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Ejecuta un turno de agente mediante el Gateway (usa `--local` para modo embebido).
Usa `--agent <id>` para apuntar directamente a un agente configurado.

Pasa al menos un selector de sesión:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Herramienta de envío del agente: [Envío del agente](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje obligatorio
- `-t, --to <dest>`: destinatario usado para derivar la clave de sesión
- `--session-id <id>`: id de sesión explícito
- `--agent <id>`: id del agente; anula las vinculaciones de enrutamiento
- `--model <id>`: anulación del modelo para esta ejecución (`provider/model` o id de modelo)
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados compatibles con el proveedor, como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conservar el nivel detallado para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: anulación del destino de entrega
- `--reply-channel <channel>`: anulación del canal de entrega
- `--reply-account <id>`: anulación de la cuenta de entrega
- `--local`: ejecuta directamente el agente embebido (después de precargar el registro de Plugins)
- `--deliver`: envía la respuesta de vuelta al canal/destino seleccionado
- `--timeout <seconds>`: anula el tiempo de espera del agente (predeterminado 600 o el valor de configuración)
- `--json`: genera JSON

## Ejemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notas

- El modo Gateway recurre al agente embebido cuando falla la solicitud al Gateway. Usa `--local` para forzar la ejecución embebida desde el inicio.
- `--local` sigue precargando primero el registro de Plugins, por lo que los proveedores, herramientas y canales proporcionados por Plugins siguen estando disponibles durante las ejecuciones embebidas.
- `--local` y las ejecuciones de reserva embebidas se tratan como ejecuciones de una sola vez. Los recursos de loopback de MCP incluidos y las sesiones cálidas de stdio de Claude abiertas para ese proceso local se retiran después de la respuesta, por lo que las invocaciones mediante scripts no mantienen activos procesos secundarios locales.
- Las ejecuciones respaldadas por Gateway dejan los recursos de loopback de MCP propiedad del Gateway bajo el proceso Gateway en ejecución; los clientes antiguos aún pueden enviar la marca histórica de limpieza, pero el Gateway la acepta como una operación sin efecto por compatibilidad.
- `--channel`, `--reply-channel` y `--reply-account` afectan a la entrega de respuestas, no al enrutamiento de la sesión.
- `--json` mantiene stdout reservado para la respuesta JSON. Los diagnósticos del Gateway, del Plugin y de la reserva embebida se enrutan a stderr para que los scripts puedan analizar stdout directamente.
- El JSON de reserva embebida incluye `meta.transport: "embedded"` y `meta.fallbackFrom: "gateway"` para que los scripts puedan distinguir las ejecuciones de reserva de las ejecuciones del Gateway.
- Si el Gateway acepta una ejecución de agente pero la CLI agota el tiempo de espera para la respuesta final, la reserva embebida usa un id explícito y nuevo de sesión/ejecución `gateway-fallback-*` e informa `meta.fallbackReason: "gateway_timeout"` junto con los campos de sesión de reserva. Esto evita competir con el bloqueo de transcripción propiedad del Gateway o reemplazar silenciosamente la sesión de conversación enrutada original.
- Cuando este comando activa la regeneración de `models.json`, las credenciales de proveedor gestionadas por SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), no como texto sin formato de secretos resueltos.
- Las escrituras de marcadores tienen autoridad de origen: OpenClaw conserva marcadores desde la instantánea de configuración de origen activa, no desde valores secretos resueltos en tiempo de ejecución.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tiempo de ejecución del agente](/es/concepts/agent)
