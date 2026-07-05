---
read_when:
    - Buscando compatibilidad con sistemas operativos o rutas de instalación
    - Decidir dónde ejecutar el Gateway
summary: Resumen de compatibilidad de plataformas (Gateway + aplicaciones complementarias)
title: Plataformas
x-i18n:
    generated_at: "2026-07-05T11:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core está escrito en TypeScript. **Node es el runtime recomendado**.
Bun no se recomienda para el Gateway: hay problemas conocidos con los canales de WhatsApp y
Telegram; consulta [Bun (experimental)](/es/install/bun) para obtener detalles.

Existen aplicaciones complementarias para Windows Hub, macOS (aplicación de barra de menús) y nodos móviles
(iOS/Android). Las aplicaciones complementarias para Linux están planificadas, pero el Gateway es totalmente
compatible hoy. En Windows, elige Windows Hub para la aplicación de escritorio, la instalación nativa de
PowerShell para un uso centrado en la terminal, o WSL2 para el runtime de Gateway más
compatible con Linux.

## Elige tu sistema operativo

- macOS: [macOS](/es/platforms/macos)
- iOS: [iOS](/es/platforms/ios)
- Android: [Android](/es/platforms/android)
- Windows: [Windows](/es/platforms/windows)
- Linux: [Linux](/es/platforms/linux)

## VPS y hosting

- Hub VPS: [Hosting VPS](/es/vps)
- Fly.io: [Fly.io](/es/install/fly)
- Hetzner (Docker): [Hetzner](/es/install/hetzner)
- GCP (Compute Engine): [GCP](/es/install/gcp)
- Azure (VM Linux): [Azure](/es/install/azure)
- exe.dev (VM + proxy HTTPS): [exe.dev](/es/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/es/platforms/easyrunner)

## Enlaces comunes

- Guía de instalación: [Primeros pasos](/es/start/getting-started)
- Windows Hub: [Windows](/es/platforms/windows)
- Runbook del Gateway: [Gateway](/es/gateway)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)
- Estado del servicio: `openclaw gateway status`

## Instalación del servicio Gateway (CLI)

Usa una de estas opciones (todas son compatibles):

- Asistente (recomendado): `openclaw onboard --install-daemon`
- Directo: `openclaw gateway install`
- Flujo de configuración: `openclaw configure` → selecciona **servicio Gateway**
- Reparar/migrar: `openclaw doctor` (ofrece instalar o corregir el servicio)

El destino del servicio depende del sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway`, o `ai.openclaw.<profile>` para un perfil con nombre)
- Linux/WSL2: servicio de usuario systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: Tarea programada (`OpenClaw Gateway` u `OpenClaw Gateway (<profile>)`), con una alternativa de elemento de inicio de sesión en la carpeta de Inicio por usuario si se deniega la creación de la tarea

## Relacionado

- [Resumen de instalación](/es/install)
- [Windows Hub](/es/platforms/windows)
- [Aplicación para macOS](/es/platforms/macos)
- [Aplicación para iOS](/es/platforms/ios)
