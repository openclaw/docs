---
read_when:
    - Elegir una ruta de incorporación
    - Configuración de un nuevo entorno
sidebarTitle: Onboarding Overview
summary: Descripción general de las opciones y flujos de incorporación de OpenClaw
title: Descripción general de la incorporación
x-i18n:
    generated_at: "2026-07-05T11:44:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62fdb7768aff55620c6195b8017dd95baa1ef393b03e39e5a07b1a9b9e6ef5a4
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw tiene dos rutas de configuración inicial. Ambas configuran la autenticación, el Gateway y
los canales de chat opcionales; solo difieren en cómo interactúas con la configuración.

## ¿Qué ruta debería usar?

|                | Configuración inicial por CLI          | Configuración inicial en la app de macOS |
| -------------- | -------------------------------------- | --------------------------- |
| **Plataformas** | macOS, Linux, Windows (nativo o WSL2) | Solo macOS                  |
| **Interfaz**   | Asistente en la terminal               | UI guiada + chat de Crestodian |
| **Ideal para** | Servidores, sin interfaz gráfica, control total | Mac de escritorio, configuración visual |
| **Automatización** | `--non-interactive` para scripts    | Solo manual                 |
| **Comando**    | `openclaw onboard`                     | Iniciar la app              |

La mayoría de los usuarios debería empezar con la **configuración inicial por CLI**: funciona en todas partes y te da
el mayor control.

## Qué configura la configuración inicial

Independientemente de la ruta que elijas, la configuración inicial prepara:

1. **Proveedor de modelos y autenticación**: clave de API, OAuth o token de configuración para el proveedor elegido
2. **Espacio de trabajo**: directorio para archivos del agente, plantillas de arranque y memoria
3. **Gateway**: puerto, dirección de enlace, modo de autenticación
4. **Canales** (opcional): canales de chat integrados y empaquetados, como
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp y más
5. **Daemon** (opcional): servicio en segundo plano para que el Gateway se inicie automáticamente

## Configuración inicial por CLI

Ejecuta en cualquier terminal:

```bash
openclaw onboard
```

Añade `--install-daemon` para instalar también el servicio en segundo plano en un solo paso.

Referencia completa: [Configuración inicial (CLI)](/es/start/wizard)
Documentación del comando CLI: [`openclaw onboard`](/es/cli/onboard)

## Configuración inicial en la app de macOS

Abre la app OpenClaw. Para la configuración local, el flujo de primer inicio inicia el Gateway,
luego abre una conversación con Crestodian que detecta el acceso existente a IA, propone
el espacio de trabajo y la configuración, y aplica el plan tras la aprobación. Las credenciales
sensibles usan entrada enmascarada. En cambio, la configuración remota se conecta a un
Gateway ya configurado.

Referencia completa: [Configuración inicial (app de macOS)](/es/start/onboarding)

## Proveedores personalizados o no listados

Si tu proveedor no aparece en la configuración inicial, elige **Proveedor personalizado** e
introduce:

- Compatibilidad del endpoint: compatible con OpenAI (`/chat/completions`), compatible con OpenAI Responses (`/responses`), compatible con Anthropic (`/messages`) o desconocida (prueba las tres y detecta automáticamente)
- URL base y clave de API (la clave de API es opcional si el endpoint no requiere una)
- ID de modelo y alias de modelo opcional

Pueden coexistir varios endpoints personalizados; cada uno recibe su propio ID de endpoint.

## Relacionado

- [Primeros pasos](/es/start/getting-started)
- [Referencia de configuración por CLI](/es/start/wizard-cli-reference)
