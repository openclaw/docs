---
read_when:
    - Configurar OpenClaw en Hostinger
    - Buscar un VPS gestionado para OpenClaw
    - Usar OpenClaw con 1-Clic en Hostinger
summary: Alojar OpenClaw en Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T05:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
---

Ejecuta un Gateway persistente de OpenClaw en [Hostinger](https://www.hostinger.com/openclaw) mediante un despliegue gestionado **1-Clic** o una instalación en **VPS**.

## Requisitos previos

- Cuenta de Hostinger ([registro](https://www.hostinger.com/openclaw))
- Aproximadamente 5-10 minutos

## Opción A: OpenClaw con 1-Clic

La forma más rápida de empezar. Hostinger se encarga de la infraestructura, Docker y las actualizaciones automáticas.

<Steps>
  <Step title="Comprar y lanzar">
    1. En la [página de OpenClaw de Hostinger](https://www.hostinger.com/openclaw), elige un plan de OpenClaw gestionado y completa la compra.

    <Note>
    Durante la compra puedes seleccionar créditos de **Ready-to-Use AI** que se compran por adelantado y se integran al instante en OpenClaw; no necesitas cuentas externas ni claves de API de otros proveedores. Puedes empezar a chatear de inmediato. Como alternativa, puedes proporcionar tu propia clave de Anthropic, OpenAI, Google Gemini o xAI durante la configuración.
    </Note>

  </Step>

  <Step title="Seleccionar un canal de mensajería">
    Elige uno o varios canales para conectar:

    - **WhatsApp** -- escanea el código QR que se muestra en el asistente de configuración.
    - **Telegram** -- pega el token del bot de [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Completar la instalación">
    Haz clic en **Finish** para desplegar la instancia. Cuando esté lista, accede al dashboard de OpenClaw desde **OpenClaw Overview** en hPanel.
  </Step>

</Steps>

## Opción B: OpenClaw en VPS

Más control sobre tu servidor. Hostinger despliega OpenClaw mediante Docker en tu VPS y tú lo gestionas a través de **Docker Manager** en hPanel.

<Steps>
  <Step title="Comprar un VPS">
    1. En la [página de OpenClaw de Hostinger](https://www.hostinger.com/openclaw), elige un plan de OpenClaw en VPS y completa la compra.

    <Note>
    Puedes seleccionar créditos de **Ready-to-Use AI** durante la compra; se compran por adelantado y se integran al instante en OpenClaw, para que puedas empezar a chatear sin cuentas externas ni claves de API de otros proveedores.
    </Note>

  </Step>

  <Step title="Configurar OpenClaw">
    Una vez aprovisionado el VPS, rellena los campos de configuración:

    - **Gateway token** -- se genera automáticamente; guárdalo para usarlo más tarde.
    - **WhatsApp number** -- tu número con el código de país (opcional).
    - **Telegram bot token** -- de [BotFather](https://t.me/BotFather) (opcional).
    - **API keys** -- solo son necesarias si no seleccionaste créditos de Ready-to-Use AI durante la compra.

  </Step>

  <Step title="Iniciar OpenClaw">
    Haz clic en **Deploy**. Una vez en ejecución, abre el dashboard de OpenClaw desde hPanel haciendo clic en **Open**.
  </Step>

</Steps>

Los registros, reinicios y actualizaciones se gestionan directamente desde la interfaz de Docker Manager en hPanel. Para actualizar, pulsa **Update** en Docker Manager y eso descargará la imagen más reciente.

## Verificar tu configuración

Envía "Hi" a tu asistente en el canal que conectaste. OpenClaw responderá y te guiará por las preferencias iniciales.

## Solución de problemas

**El dashboard no carga** -- Espera unos minutos a que el contenedor termine de aprovisionarse. Revisa los registros de Docker Manager en hPanel.

**El contenedor de Docker sigue reiniciándose** -- Abre los registros de Docker Manager y busca errores de configuración (tokens ausentes, claves de API no válidas).

**El bot de Telegram no responde** -- Envía tu mensaje con el código de vinculación desde Telegram directamente como un mensaje dentro de tu chat de OpenClaw para completar la conexión.

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración del Gateway](/es/gateway/configuration) -- todas las opciones de configuración

## Relacionado

- [Resumen de instalación](/es/install)
- [Alojamiento VPS](/es/vps)
- [DigitalOcean](/es/install/digitalocean)
