---
read_when:
    - Quieres un bot asistente personal de Zalo con inicio de sesión mediante código QR
    - Estás instalando o solucionando problemas del Plugin de canal openclaw-zaloclawbot
summary: Configuración del canal Zalo ClawBot mediante el Plugin externo openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-05T11:04:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se conecta a Zalo ClawBot mediante el plugin externo `@zalo-platforms/openclaw-zaloclawbot` incluido en el catálogo. El inicio de sesión usa un código QR de Zalo Mini App; el id del plugin en la configuración es `openclaw-zaloclawbot`.

## Compatibilidad

| Versión del Plugin | Versión de OpenClaw | npm dist-tag | Estado        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | Activo / Beta |

## Requisitos previos

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) instalado (CLI `openclaw` disponible)
- Una cuenta de Zalo en un dispositivo móvil para escanear el código QR de inicio de sesión

## Instalar con onboard (recomendado)

```bash
openclaw onboard
```

Elige **Zalo ClawBot** en el menú de canales. El asistente instala el plugin desde el catálogo oficial (con integridad verificada), muestra el QR de inicio de sesión en la terminal y finaliza el canal una vez que lo escaneas con la aplicación de Zalo.

## Instalación manual

Para agregar el canal a un Gateway ya incorporado:

### 1. Instala el plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Usa la versión fijada exacta para que OpenClaw verifique el paquete contra el hash de integridad del catálogo durante la instalación.

### 2. Habilita el plugin en la configuración

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Genera un código QR e inicia sesión

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Escanea el código QR mostrado en la terminal con la aplicación móvil de Zalo, acepta los Términos de uso dentro de Zalo Mini App y autoriza la sesión.

### 4. Reinicia el Gateway

```bash
openclaw gateway restart
```

## Cómo funciona

A diferencia del canal estándar de Zalo, que requiere registrar tu propia Cuenta oficial de Zalo (OA) y configurar credenciales de desarrollador estáticas, Zalo ClawBot es un **asistente personal vinculado al propietario** sobre infraestructura oficial compartida:

1. **Incorporación:** el código QR resuelve a una Zalo Mini App que vincula un bot privado recién aprovisionado, bajo una OA oficial compartida, directamente a tu ID de usuario de Zalo.
2. **Privacidad vinculada al propietario:** el bot solo se comunica con su propietario. Los mensajes de otros usuarios se descartan a nivel de plataforma.
3. **Ruta de API oficial:** el plugin usa las API de Zalo Bot Platform, no automatización de navegador ni de sesión web.

## Detalles internos

El plugin se comunica con Zalo mediante un bucle persistente de sondeo largo (`getUpdates`). Los Webhooks están deshabilitados de forma predeterminada para ejecuciones locales de Gateway de escritorio/terminal. Los mensajes se procesan del lado del cliente y se asignan a tu runtime local de agentes.

El plugin gestiona las credenciales del bot dentro del directorio de estado de OpenClaw. Trata ese directorio como sensible y cúbrelo con la misma política de control de acceso y copias de seguridad que el resto del estado de OpenClaw.

El runtime de este plugin vive por completo en el paquete externo `@zalo-platforms/openclaw-zaloclawbot`; los detalles de comportamiento siguientes, más allá de la instalación/configuración, son los informados por los mantenedores del plugin y no están verificados contra el código fuente del núcleo de OpenClaw.

## Solución de problemas

- **Tiempo de espera agotado en el inicio de sesión por QR:** el token de inicio de sesión (`zbsk`) vence después de 5 minutos por seguridad. Si el código QR vence antes de que lo escanees, vuelve a ejecutar el comando de inicio de sesión para generar uno nuevo.
- **El Gateway no se carga:** confirma que la versión de tu host OpenClaw sea `2026.4.10` o superior. Las versiones anteriores no admiten el registro de instalación de plugins npm externos que este ID requiere.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Zalo](/es/channels/zalo) - el canal incluido de Zalo Bot Creator / Marketplace
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Plugins](/es/tools/plugin) - instalar y gestionar plugins
