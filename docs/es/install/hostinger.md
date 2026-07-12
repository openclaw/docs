---
read_when:
    - Configuración de OpenClaw en Hostinger
    - ¿Buscas un VPS administrado para OpenClaw?
    - Uso de OpenClaw con 1 clic de Hostinger
summary: Aloja OpenClaw en Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-11T23:10:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Ejecuta un Gateway de OpenClaw persistente en [Hostinger](https://www.hostinger.com/openclaw), ya sea como un despliegue administrado con **1 clic** o como una instalación en un **VPS** que administras por tu cuenta.

## Requisitos previos

- Cuenta de Hostinger ([registro](https://www.hostinger.com/openclaw))
- Entre 5 y 10 minutos aproximadamente

## Opción A: OpenClaw con 1 clic

Hostinger se encarga de la infraestructura, Docker y las actualizaciones automáticas. Es la forma más rápida de obtener una instancia en funcionamiento.

<Steps>
  <Step title="Comprar e iniciar">
    1. En la [página de OpenClaw de Hostinger](https://www.hostinger.com/openclaw), elige un plan administrado de OpenClaw y completa la compra.

    <Note>
    Durante la compra, puedes seleccionar créditos de **Ready-to-Use AI**, que se adquieren por adelantado y se integran al instante en OpenClaw; no necesitas cuentas externas ni claves de API de otros proveedores. Puedes empezar a chatear de inmediato. Como alternativa, proporciona tu propia clave de Anthropic, OpenAI, Google Gemini o xAI durante la configuración.
    </Note>

  </Step>

  <Step title="Seleccionar un canal de mensajería">
    Elige uno o varios canales para conectarlos:

    - **WhatsApp**: escanea el código QR que aparece en el asistente de configuración.
    - **Telegram**: pega el token del bot proporcionado por [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Completar la instalación">
    Haz clic en **Finish** para desplegar la instancia. Cuando esté lista, accede al panel de OpenClaw desde **OpenClaw Overview** en hPanel.
  </Step>

</Steps>

## Opción B: OpenClaw en un VPS

Ofrece más control sobre el servidor. Hostinger despliega OpenClaw mediante Docker en tu VPS; tú lo administras mediante **Docker Manager** en hPanel.

<Steps>
  <Step title="Comprar un VPS">
    1. En la [página de OpenClaw de Hostinger](https://www.hostinger.com/openclaw), elige un plan de OpenClaw en VPS y completa la compra.

    <Note>
    Durante la compra, puedes seleccionar créditos de **Ready-to-Use AI**. Estos se adquieren por adelantado y se integran al instante en OpenClaw, por lo que puedes empezar a chatear sin cuentas externas ni claves de API de otros proveedores.
    </Note>

  </Step>

  <Step title="Configurar OpenClaw">
    Una vez aprovisionado el VPS, completa los campos de configuración:

    - **Gateway token**: se genera automáticamente; guárdalo para usarlo más adelante.
    - **WhatsApp number**: tu número con el código de país (opcional).
    - **Telegram bot token**: proporcionado por [BotFather](https://t.me/BotFather) (opcional).
    - **API keys**: solo son necesarias si no seleccionaste créditos de Ready-to-Use AI durante la compra.

  </Step>

  <Step title="Iniciar OpenClaw">
    Haz clic en **Deploy**. Cuando esté en funcionamiento, abre el panel de OpenClaw desde hPanel haciendo clic en **Open**.
  </Step>

</Steps>

Los registros, reinicios y actualizaciones se gestionan desde la interfaz de Docker Manager en hPanel. Para actualizar, pulsa **Update** en Docker Manager a fin de descargar la imagen más reciente.

## Verificar la configuración

Envía «Hola» a tu asistente mediante el canal que conectaste. OpenClaw responderá y te guiará por las preferencias iniciales.

## Solución de problemas

**El panel no se carga**: espera unos minutos hasta que el contenedor termine de aprovisionarse y, a continuación, consulta los registros de Docker Manager en hPanel.

**El contenedor de Docker se reinicia continuamente**: abre los registros de Docker Manager y busca errores de configuración (tokens ausentes o claves de API no válidas).

**El bot de Telegram no responde**: si es necesario emparejar los mensajes directos, los remitentes desconocidos recibirán un código de emparejamiento breve en lugar de una respuesta. Apruébalo desde el chat del panel de OpenClaw o mediante `openclaw pairing approve telegram <CODE>` si tienes acceso al shell del contenedor. Consulta [Emparejamiento](/es/channels/pairing).

## Próximos pasos

- [Canales](/es/channels): conecta Telegram, WhatsApp, Discord y otros servicios
- [Configuración del Gateway](/es/gateway/configuration): todas las opciones de configuración

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Alojamiento en VPS](/es/vps)
- [DigitalOcean](/es/install/digitalocean)
