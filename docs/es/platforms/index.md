---
read_when:
    - Buscas compatibilidad de sistemas operativos o rutas de instalación
    - Decidir dónde ejecutar el Gateway
summary: Resumen de compatibilidad de plataformas (Gateway + aplicaciones complementarias)
title: Plataformas
x-i18n:
    generated_at: "2026-04-24T05:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

El núcleo de OpenClaw está escrito en TypeScript. **Node es el runtime recomendado**.
Bun no se recomienda para el Gateway: hay problemas conocidos con los canales de WhatsApp y
Telegram; consulta [Bun (experimental)](/es/install/bun) para más detalles.

Existen aplicaciones complementarias para macOS (app de barra de menús) y nodos móviles (iOS/Android). Las aplicaciones complementarias para Windows y
Linux están planificadas, pero el Gateway ya es totalmente compatible hoy.
También están planificadas aplicaciones complementarias nativas para Windows; se recomienda ejecutar el Gateway mediante WSL2.

## Elige tu sistema operativo

- macOS: [macOS](/es/platforms/macos)
- iOS: [iOS](/es/platforms/ios)
- Android: [Android](/es/platforms/android)
- Windows: [Windows](/es/platforms/windows)
- Linux: [Linux](/es/platforms/linux)

## VPS y alojamiento

- Centro de VPS: [Alojamiento VPS](/es/vps)
- Fly.io: [Fly.io](/es/install/fly)
- Hetzner (Docker): [Hetzner](/es/install/hetzner)
- GCP (Compute Engine): [GCP](/es/install/gcp)
- Azure (Linux VM): [Azure](/es/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/es/install/exe-dev)

## Enlaces comunes

- Guía de instalación: [Primeros pasos](/es/start/getting-started)
- Runbook del Gateway: [Gateway](/es/gateway)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)
- Estado del servicio: `openclaw gateway status`

## Instalación del servicio Gateway (CLI)

Usa una de estas opciones (todas son compatibles):

- Asistente (recomendado): `openclaw onboard --install-daemon`
- Directo: `openclaw gateway install`
- Flujo de configuración: `openclaw configure` → selecciona **Servicio Gateway**
- Reparar/migrar: `openclaw doctor` (ofrece instalar o corregir el servicio)

El destino del servicio depende del sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>`; heredado `com.openclaw.*`)
- Linux/WSL2: servicio de usuario systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: tarea programada (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con alternativa de elemento de inicio de sesión en la carpeta Startup por usuario si se deniega la creación de la tarea

## Relacionado

- [Resumen de instalación](/es/install)
- [App de macOS](/es/platforms/macos)
- [App de iOS](/es/platforms/ios)
