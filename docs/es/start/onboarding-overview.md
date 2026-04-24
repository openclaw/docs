---
read_when:
    - Elegir una ruta de incorporación
    - Configurar un entorno nuevo
sidebarTitle: Onboarding Overview
summary: Resumen de opciones y flujos de incorporación de OpenClaw
title: Resumen de incorporación
x-i18n:
    generated_at: "2026-04-24T05:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw tiene dos rutas de incorporación. Ambas configuran autenticación, el Gateway y
canales de chat opcionales; solo difieren en cómo interactúas con la configuración.

## ¿Qué ruta debería usar?

|                | Incorporación por CLI                  | Incorporación en la app de macOS |
| -------------- | -------------------------------------- | -------------------------------- |
| **Plataformas** | macOS, Linux, Windows (nativo o WSL2) | Solo macOS                       |
| **Interfaz**   | Asistente en terminal                  | IU guiada en la app              |
| **Ideal para** | Servidores, sin interfaz, control total | Mac de escritorio, configuración visual |
| **Automatización** | `--non-interactive` para scripts   | Solo manual                      |
| **Comando**    | `openclaw onboard`                     | Abrir la app                     |

La mayoría de los usuarios deberían empezar con **incorporación por CLI**: funciona en todas partes y te da
más control.

## Qué configura la incorporación

Independientemente de la ruta que elijas, la incorporación configura:

1. **Proveedor de modelos y autenticación** — clave API, OAuth o token de configuración para el proveedor elegido
2. **Espacio de trabajo** — directorio para archivos del agente, plantillas bootstrap y memoria
3. **Gateway** — puerto, dirección de enlace, modo de autenticación
4. **Canales** (opcional) — canales de chat integrados e incluidos como
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y más
5. **Daemon** (opcional) — servicio en segundo plano para que el Gateway se inicie automáticamente

## Incorporación por CLI

Ejecuta en cualquier terminal:

```bash
openclaw onboard
```

Agrega `--install-daemon` para instalar también el servicio en segundo plano en un solo paso.

Referencia completa: [Onboarding (CLI)](/es/start/wizard)
Documentación del comando CLI: [`openclaw onboard`](/es/cli/onboard)

## Incorporación en la app de macOS

Abre la app de OpenClaw. El asistente de primera ejecución te guía por los mismos pasos
con una interfaz visual.

Referencia completa: [Onboarding (macOS App)](/es/start/onboarding)

## Proveedores personalizados o no listados

Si tu proveedor no aparece en la incorporación, elige **Custom Provider** e
introduce:

- modo de compatibilidad de API (compatible con OpenAI, compatible con Anthropic o detección automática)
- URL base y clave API
- ID de modelo y alias opcional

Pueden coexistir varios endpoints personalizados: cada uno obtiene su propio ID de endpoint.

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración CLI](/es/start/wizard-cli-reference)
