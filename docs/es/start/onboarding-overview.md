---
read_when:
    - Elegir una ruta de incorporación
    - Configurar un nuevo entorno
sidebarTitle: Onboarding Overview
summary: Descripción general de las opciones y los flujos de incorporación de OpenClaw
title: Descripción general de la incorporación
x-i18n:
    generated_at: "2026-05-11T20:53:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw tiene dos rutas de incorporación. Ambas configuran la autenticación, el Gateway y
canales de chat opcionales; solo difieren en cómo interactúas con la configuración.

## ¿Qué ruta debo usar?

|                | Incorporación con CLI                         | Incorporación con la app de macOS      |
| -------------- | -------------------------------------- | ------------------------- |
| **Plataformas**  | macOS, Linux, Windows (nativo o WSL2) | Solo macOS                |
| **Interfaz**  | Asistente en terminal                        | IU guiada en la app      |
| **Ideal para**   | Servidores, entornos sin interfaz gráfica, control total        | Mac de escritorio, configuración visual |
| **Automatización** | `--non-interactive` para scripts        | Solo manual               |
| **Comando**    | `openclaw onboard`                     | Iniciar la app            |

La mayoría de los usuarios debería empezar con la **incorporación con CLI**: funciona en todas partes y te da
el máximo control.

## Qué configura la incorporación

Independientemente de la ruta que elijas, la incorporación configura:

1. **Proveedor de modelo y autenticación**: clave de API, OAuth o token de configuración para el proveedor elegido
2. **Espacio de trabajo**: directorio para archivos de agente, plantillas de arranque y memoria
3. **Gateway**: puerto, dirección de enlace, modo de autenticación
4. **Canales** (opcional): canales de chat integrados y empaquetados, como
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y más
5. **Demonio** (opcional): servicio en segundo plano para que el Gateway se inicie automáticamente

## Incorporación con CLI

Ejecuta en cualquier terminal:

```bash
openclaw onboard
```

Añade `--install-daemon` para instalar también el servicio en segundo plano en un solo paso.

Referencia completa: [Incorporación (CLI)](/es/start/wizard)
Documentación del comando CLI: [`openclaw onboard`](/es/cli/onboard)

## Incorporación con la app de macOS

Abre la app OpenClaw. El asistente de primer inicio te guía por los mismos pasos
con una interfaz visual.

Referencia completa: [Incorporación (app de macOS)](/es/start/onboarding)

## Proveedores personalizados o no listados

Si tu proveedor no aparece en la incorporación, elige **Proveedor personalizado** e
introduce:

- Modo de compatibilidad de API (compatible con OpenAI, compatible con Anthropic o detección automática)
- URL base y clave de API
- ID de modelo y alias opcional

Pueden coexistir varios endpoints personalizados: cada uno obtiene su propio ID de endpoint.

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración con CLI](/es/start/wizard-cli-reference)
