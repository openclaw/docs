---
read_when:
    - Buscando compatibilidad con sistemas operativos o rutas de instalación
    - Decidir dónde ejecutar el Gateway
summary: Resumen de compatibilidad de plataformas (Gateway + aplicaciones complementarias)
title: Plataformas
x-i18n:
    generated_at: "2026-06-27T12:00:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core está escrito en TypeScript. **Node es el runtime recomendado**.
Bun no se recomienda para el Gateway: hay problemas conocidos con los canales
WhatsApp y Telegram; consulta [Bun (experimental)](/es/install/bun) para más detalles.

Existen aplicaciones complementarias para Windows Hub, macOS (aplicación de barra de menús) y nodos móviles
(iOS/Android). Las aplicaciones complementarias para Linux están previstas, pero el Gateway cuenta hoy con soporte completo. En Windows, elige Windows Hub para la aplicación de escritorio, la instalación nativa con PowerShell para uso centrado en la terminal, o WSL2 para el runtime de Gateway más compatible con Linux.

## Elige tu SO

- macOS: [macOS](/es/platforms/macos)
- iOS: [iOS](/es/platforms/ios)
- Android: [Android](/es/platforms/android)
- Windows: [Windows](/es/platforms/windows)
- Linux: [Linux](/es/platforms/linux)

## VPS y alojamiento

- Hub VPS: [Alojamiento VPS](/es/vps)
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

Usa una de estas opciones (todas compatibles):

- Asistente (recomendado): `openclaw onboard --install-daemon`
- Directo: `openclaw gateway install`
- Flujo de configuración: `openclaw configure` → selecciona **Servicio Gateway**
- Reparar/migrar: `openclaw doctor` (ofrece instalar o corregir el servicio)

El destino del servicio depende del SO:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>`; heredado `com.openclaw.*`)
- Linux/WSL2: servicio de usuario systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: tarea programada (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con un fallback de elemento de inicio de sesión en la carpeta Inicio por usuario si se deniega la creación de la tarea

## Relacionado

- [Resumen de instalación](/es/install)
- [Windows Hub](/es/platforms/windows)
- [Aplicación macOS](/es/platforms/macos)
- [Aplicación iOS](/es/platforms/ios)
