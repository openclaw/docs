---
read_when:
    - Quieres un bot asistente personal de Zalo con inicio de sesión mediante código QR
    - Estás instalando o solucionando problemas del plugin de canal openclaw-zaloclawbot
summary: Configuración del canal Zalo ClawBot mediante el Plugin externo openclaw-zaloclawbot
title: ClawBot de Zalo
x-i18n:
    generated_at: "2026-07-11T22:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se conecta a Zalo ClawBot mediante el plugin externo `@zalo-platforms/openclaw-zaloclawbot` incluido en el catálogo. El inicio de sesión utiliza un código QR de Zalo Mini App; el id. del plugin en la configuración es `openclaw-zaloclawbot`.

## Compatibilidad

| Versión del plugin | Versión de OpenClaw | Etiqueta de distribución de npm | Estado        |
| ------------------ | ------------------- | ------------------------------- | ------------- |
| 0.1.4              | >=2026.4.10         | `latest`                        | Activo / Beta |

## Requisitos previos

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) instalado (CLI `openclaw` disponible)
- Una cuenta de Zalo en un dispositivo móvil para escanear el código QR de inicio de sesión

## Instalación con el asistente de incorporación (recomendada)

```bash
openclaw onboard
```

Selecciona **Zalo ClawBot** en el menú de canales. El asistente instala el plugin desde el catálogo oficial (con verificación de integridad), muestra el código QR de inicio de sesión en la terminal y completa la configuración del canal cuando lo escaneas con la aplicación de Zalo.

## Instalación manual

Para añadir el canal a un Gateway que ya haya completado la incorporación:

### 1. Instala el plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Usa la versión fijada exacta para que OpenClaw verifique el paquete con el hash de integridad del catálogo durante la instalación.

### 2. Habilita el plugin en la configuración

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Genera un código QR e inicia sesión

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Escanea el código QR mostrado en la terminal con la aplicación móvil de Zalo, acepta las condiciones de uso dentro de Zalo Mini App y autoriza la sesión.

### 4. Reinicia el Gateway

```bash
openclaw gateway restart
```

## Funcionamiento

A diferencia del canal estándar de Zalo, que requiere registrar tu propia cuenta oficial de Zalo (OA) y configurar credenciales estáticas de desarrollador, Zalo ClawBot es un **asistente personal vinculado a su propietario** que se ejecuta en una infraestructura oficial compartida:

1. **Incorporación:** el código QR dirige a una Zalo Mini App que vincula un bot privado recién aprovisionado, alojado bajo una OA oficial compartida, directamente con tu identificador de usuario de Zalo.
2. **Privacidad vinculada al propietario:** el bot solo se comunica con su propietario. Los mensajes de otros usuarios se descartan en la plataforma.
3. **Ruta de API oficial:** el plugin utiliza las API de Zalo Bot Platform, no automatización del navegador ni de sesiones web.

## Funcionamiento interno

El plugin se comunica con Zalo mediante un bucle persistente de sondeo largo (`getUpdates`). Los Webhooks están deshabilitados de forma predeterminada en las ejecuciones locales del Gateway desde el escritorio o la terminal. Los mensajes se procesan en el cliente y se asignan al entorno de ejecución de tu agente local.

El plugin administra las credenciales del bot en el directorio de estado de OpenClaw. Considera confidencial ese directorio y protégelo con la misma política de control de acceso y copias de seguridad que el resto del estado de OpenClaw.

El entorno de ejecución de este plugin reside íntegramente en el paquete externo `@zalo-platforms/openclaw-zaloclawbot`; los detalles de comportamiento que aparecen a continuación, aparte de la instalación y la configuración, proceden de la información facilitada por los responsables del plugin y no se han verificado con el código fuente del núcleo de OpenClaw.

## Solución de problemas

- **Tiempo de espera agotado al iniciar sesión mediante QR:** el token de inicio de sesión (`zbsk`) caduca después de 5 minutos por motivos de seguridad. Si el código QR caduca antes de que lo escanees, vuelve a ejecutar el comando de inicio de sesión para generar uno nuevo.
- **El Gateway no se carga:** confirma que la versión de OpenClaw del host sea `2026.4.10` o posterior. Las versiones anteriores no admiten el registro de instalación de plugins externos de npm que requiere este identificador.

## Temas relacionados

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Zalo](/es/channels/zalo) - el canal integrado de Zalo Bot Creator / Marketplace
- [Emparejamiento](/es/channels/pairing) - autenticación mediante mensajes directos y flujo de emparejamiento
- [Plugins](/es/tools/plugin) - instalación y administración de plugins
