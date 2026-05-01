---
read_when:
    - Usas el Plugin de llamadas de voz y quieres los puntos de entrada de la CLI
    - Quieres ejemplos rápidos para `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referencia de CLI para `openclaw voicecall` (superficie de comandos del Plugin de llamada de voz)
title: Llamada de voz
x-i18n:
    generated_at: "2026-05-01T05:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4090858a58b7defaff955a370c8cb0ff025ef68061e68a6c69a637de24707c0b
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` es un comando proporcionado por un plugin. Solo aparece si el plugin de llamadas de voz está instalado y habilitado.

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

`setup` imprime comprobaciones de preparación legibles por humanos de forma predeterminada. Usa `--json` para
scripts:

```bash
openclaw voicecall setup --json
```

`status` imprime las llamadas activas como JSON de forma predeterminada. Pasa `--call-id <id>` para inspeccionar
una llamada.

Para proveedores externos (`twilio`, `telnyx`, `plivo`), la configuración debe resolver una URL de webhook pública
desde `publicUrl`, un túnel o una exposición de Tailscale. Se rechaza una alternativa de servicio en loopback/privada
porque los operadores no pueden alcanzarla.

`smoke` ejecuta las mismas comprobaciones de preparación. No realizará una llamada telefónica real
a menos que tanto `--to` como `--yes` estén presentes:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Exponer webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota de seguridad: expón el endpoint del webhook solo a redes en las que confíes. Prefiere Tailscale Serve en lugar de Funnel cuando sea posible.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
