---
read_when:
    - ¿Busca compatibilidad con sistemas operativos o rutas de instalación?
    - Decidir dónde ejecutar el Gateway
summary: Descripción general de la compatibilidad con plataformas (Gateway + aplicaciones complementarias)
title: Plataformas
x-i18n:
    generated_at: "2026-07-14T13:52:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

El núcleo de OpenClaw está escrito en TypeScript. **Node es el entorno de ejecución requerido** porque
el almacén de estado canónico utiliza `node:sqlite`. Bun sigue estando disponible para
la instalación de dependencias y los scripts de paquetes; consulte [Bun](/es/install/bun).

Existen aplicaciones complementarias para Windows Hub, macOS (aplicación de la barra de menús) y nodos móviles
(iOS/Android). Está previsto desarrollar aplicaciones complementarias para Linux, pero el Gateway ya
es totalmente compatible. En Windows, elija Windows Hub como aplicación de escritorio, la instalación nativa
mediante PowerShell para un uso centrado en la terminal o WSL2 para disponer del entorno de ejecución del Gateway
con mayor compatibilidad con Linux.

## Elija su sistema operativo

- macOS: [macOS](/es/platforms/macos)
- iOS: [iOS](/es/platforms/ios)
- Android: [Android](/es/platforms/android)
- Windows: [Windows](/es/platforms/windows)
- Linux: [Linux](/es/platforms/linux)

## VPS y alojamiento

- Concentrador VPS: [Alojamiento VPS](/es/vps)
- Fly.io: [Fly.io](/es/install/fly)
- Hetzner (Docker): [Hetzner](/es/install/hetzner)
- GCP (Compute Engine): [GCP](/es/install/gcp)
- Azure (máquina virtual Linux): [Azure](/es/install/azure)
- exe.dev (máquina virtual + proxy HTTPS): [exe.dev](/es/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/es/platforms/easyrunner)

## Enlaces habituales

- Guía de instalación: [Primeros pasos](/es/start/getting-started)
- Windows Hub: [Windows](/es/platforms/windows)
- Manual de operaciones del Gateway: [Gateway](/es/gateway)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)
- Estado del servicio: `openclaw gateway status`

## Instalación del servicio Gateway (CLI)

Utilice una de estas opciones (todas son compatibles):

- Asistente (recomendado): `openclaw onboard --install-daemon`
- Directa: `openclaw gateway install`
- Flujo de configuración: `openclaw configure` → seleccione **Servicio Gateway**
- Reparación/migración: `openclaw doctor` (ofrece instalar o corregir el servicio)

El destino del servicio depende del sistema operativo:

- macOS: LaunchAgent (`ai.openclaw.gateway` o `ai.openclaw.<profile>` para un perfil con nombre)
- Linux/WSL2: servicio de usuario de systemd (`openclaw-gateway[-<profile>].service`)
- Windows nativo: tarea programada (`OpenClaw Gateway` o `OpenClaw Gateway (<profile>)`), con un elemento de inicio de sesión por usuario en la carpeta Inicio como alternativa si se deniega la creación de la tarea

## Temas relacionados

- [Descripción general de la instalación](/es/install)
- [Windows Hub](/es/platforms/windows)
- [Aplicación para macOS](/es/platforms/macos)
- [Aplicación para iOS](/es/platforms/ios)
