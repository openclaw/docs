---
read_when:
    - Usas el plugin de llamadas de voz y quieres los puntos de entrada de la CLI
    - Quieres ejemplos rápidos de `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referencia de CLI para `openclaw voicecall` (superficie de comandos del Plugin de llamadas de voz)
title: Llamada de voz
x-i18n:
    generated_at: "2026-05-02T05:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` es un comando proporcionado por un Plugin. Solo aparece si el Plugin de llamadas de voz está instalado y habilitado.

Cuando el Gateway está en ejecución, los comandos operativos (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` y `status`) se envían al runtime de llamadas
de voz de ese Gateway. Si no se puede alcanzar ningún Gateway, recurren a un
runtime de CLI independiente.

Documento principal:

- Plugin de llamadas de voz: [Llamada de voz](/es/plugins/voice-call)

## Comandos comunes

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

De forma predeterminada, `setup` imprime comprobaciones de disponibilidad legibles por humanos. Usa `--json` para
scripts:

```bash
openclaw voicecall setup --json
```

De forma predeterminada, `status` imprime las llamadas activas como JSON. Pasa `--call-id <id>` para inspeccionar
una llamada.

Para proveedores externos (`twilio`, `telnyx`, `plivo`), la configuración debe resolver una URL pública de
webhook desde `publicUrl`, un túnel o una exposición de Tailscale. Se rechaza una alternativa de servicio
loopback/privada porque los operadores no pueden alcanzarla.

`smoke` ejecuta las mismas comprobaciones de disponibilidad. No hará una llamada telefónica real
a menos que estén presentes tanto `--to` como `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Exposición de webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota de seguridad: expón el endpoint de webhook solo a redes en las que confíes. Prefiere Tailscale Serve en lugar de Funnel cuando sea posible.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
