---
read_when:
    - Está instalando, configurando o auditando el Plugin de WhatsApp
summary: Añade la interfaz del canal de WhatsApp para enviar y recibir mensajes de OpenClaw.
title: Plugin de WhatsApp
x-i18n:
    generated_at: "2026-05-05T05:24:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin de WhatsApp

Agrega la superficie de canal de WhatsApp para enviar y recibir mensajes de OpenClaw.

## Distribución

- Paquete: `@openclaw/whatsapp`
- Ruta de instalación: npm; ClawHub

## Superficie

channels: whatsapp

## Nota de instalación en Windows

En Windows, el Plugin de WhatsApp necesita Git en `PATH` durante la instalación de npm porque una de sus dependencias de Baileys/libsignal se obtiene desde una URL de git. Instala Git for Windows, luego reinicia el shell y vuelve a ejecutar la instalación:

```powershell
winget install --id Git.Git -e
```

Git portátil también funciona si su directorio `bin` está en `PATH`.

## Documentación relacionada

- [WhatsApp](/es/channels/whatsapp)
