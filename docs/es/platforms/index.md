---
read_when:
    - Buscando compatibilidad con sistemas operativos o rutas de instalación
    - Decidir dónde ejecutar el Gateway
summary: Resumen de compatibilidad con plataformas (Gateway + aplicaciones complementarias)
title: Plataformas
x-i18n:
    generated_at: "2026-07-11T23:14:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

El núcleo de OpenClaw está escrito en TypeScript. **Node es el entorno de ejecución recomendado**.
Bun no se recomienda para el Gateway debido a problemas conocidos con los canales de WhatsApp y
Telegram; consulta [Bun (experimental)](/es/install/bun) para obtener más información.

Existen aplicaciones complementarias para Windows Hub, macOS (aplicación de la barra de menús) y nodos móviles
(iOS/Android). Se están planificando aplicaciones complementarias para Linux, pero actualmente el Gateway es
totalmente compatible. En Windows, elige Windows Hub para usar la aplicación de escritorio, la instalación nativa
con PowerShell si prefieres trabajar desde la terminal o WSL2 para obtener el entorno de ejecución del Gateway
más compatible con Linux.

## Elige tu sistema operativo

- macOS: [macOS](/es/platforms/macos)
- iOS: [iOS](/es/platforms/ios)
- Android: [Android](/es/platforms/android)
- Windows: [Windows](/es/platforms/windows)
- Linux: [Linux](/es/platforms/linux)

## VPS y alojamiento

- Concentrador VPS: [Alojamiento en VPS](/es/vps)
- Fly.io: [Fly.io](/es/install/fly)
- Hetzner (Docker): [Hetzner](/es/install/hetzner)
- GCP (Compute Engine): [GCP](/es/install/gcp)
- Azure (máquina virtual Linux): [Azure](/es/install/azure)
- exe.dev (máquina virtual + proxy HTTPS): [exe.dev](/es/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/es/platforms/easyrunner)

## Enlaces habituales

- Guía de instalación: [Primeros pasos](/es/start/getting-started)
- Windows Hub: [Windows](/es/platforms/windows)
- Guía operativa del Gateway: [Gateway](/es/gateway)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)
- Estado del servicio: `openclaw gateway status`

## Instalación del servicio Gateway (CLI)

Usa una de estas opciones (todas son compatibles):

- Asistente (recomendado): `openclaw onboard --install-daemon`
- Directa: `openclaw gateway install`
- Flujo de configuración: `openclaw configure` → selecciona **Servicio Gateway**
- Reparación/migración: `openclaw doctor` (ofrece instalar o reparar el servicio)

El destino del servicio depende del sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>` para un perfil con nombre)
- Linux/WSL2: servicio de usuario de systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: tarea programada (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con un elemento de inicio de sesión por usuario en la carpeta Inicio como alternativa si se deniega la creación de la tarea

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Windows Hub](/es/platforms/windows)
- [Aplicación para macOS](/es/platforms/macos)
- [Aplicación para iOS](/es/platforms/ios)
