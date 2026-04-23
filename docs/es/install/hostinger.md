---
read_when:
    - Configurar OpenClaw en Hostinger
    - Buscas un VPS administrado para OpenClaw
    - Usar OpenClaw 1-Click de Hostinger
summary: Alojar OpenClaw en Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T14:04:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

Ejecuta un Gateway persistente de OpenClaw en [Hostinger](https://www.hostinger.com/openclaw) mediante una implementación administrada de **1-Click** o una instalación en **VPS**.

## Requisitos previos

- Cuenta de Hostinger ([registro](https://www.hostinger.com/openclaw))
- Aproximadamente 5-10 minutos

## Opción A: OpenClaw 1-Click

La forma más rápida de empezar. Hostinger se encarga de la infraestructura, Docker y las actualizaciones automáticas.

<Steps>
  <Step title="Purchase and launch">
    1. Desde la [página de OpenClaw en Hostinger](https://www.hostinger.com/openclaw), elige un plan Managed OpenClaw y completa la compra.

    <Note>
    Durante la compra puedes seleccionar créditos de **Ready-to-Use AI** que se compran por adelantado y se integran al instante dentro de OpenClaw; no necesitas cuentas externas ni claves de API de otros proveedores. Puedes empezar a chatear de inmediato. Como alternativa, puedes proporcionar tu propia clave de Anthropic, OpenAI, Google Gemini o xAI durante la configuración.
    </Note>

  </Step>

  <Step title="Select a messaging channel">
    Elige uno o varios canales para conectar:

    - **WhatsApp** -- escanea el código QR que se muestra en el asistente de configuración.
    - **Telegram** -- pega el token del bot de [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Complete installation">
    Haz clic en **Finish** para implementar la instancia. Cuando esté lista, accede al panel de OpenClaw desde **OpenClaw Overview** en hPanel.
  </Step>

</Steps>

## Opción B: OpenClaw en VPS

Más control sobre tu servidor. Hostinger implementa OpenClaw mediante Docker en tu VPS y tú lo administras desde **Docker Manager** en hPanel.

<Steps>
  <Step title="Purchase a VPS">
    1. Desde la [página de OpenClaw en Hostinger](https://www.hostinger.com/openclaw), elige un plan OpenClaw on VPS y completa la compra.

    <Note>
    Puedes seleccionar créditos de **Ready-to-Use AI** durante la compra; se compran por adelantado y se integran al instante dentro de OpenClaw, para que puedas empezar a chatear sin cuentas externas ni claves de API de otros proveedores.
    </Note>

  </Step>

  <Step title="Configure OpenClaw">
    Cuando el VPS esté aprovisionado, completa los campos de configuración:

    - **Gateway token** -- se genera automáticamente; guárdalo para usarlo más adelante.
    - **WhatsApp number** -- tu número con código de país (opcional).
    - **Telegram bot token** -- de [BotFather](https://t.me/BotFather) (opcional).
    - **API keys** -- solo son necesarias si no seleccionaste créditos de Ready-to-Use AI durante la compra.

  </Step>

  <Step title="Start OpenClaw">
    Haz clic en **Deploy**. Cuando esté en ejecución, abre el panel de OpenClaw desde hPanel haciendo clic en **Open**.
  </Step>

</Steps>

Los registros, reinicios y actualizaciones se administran directamente desde la interfaz de Docker Manager en hPanel. Para actualizar, pulsa **Update** en Docker Manager y eso descargará la imagen más reciente.

## Verifica tu configuración

Envía "Hi" a tu asistente en el canal que conectaste. OpenClaw responderá y te guiará por las preferencias iniciales.

## Solución de problemas

**El panel no carga** -- Espera unos minutos a que el contenedor termine de aprovisionarse. Revisa los registros de Docker Manager en hPanel.

**El contenedor de Docker se reinicia continuamente** -- Abre los registros de Docker Manager y busca errores de configuración (tokens faltantes, claves de API no válidas).

**El bot de Telegram no responde** -- Envía tu mensaje de código de emparejamiento desde Telegram directamente como mensaje dentro de tu chat de OpenClaw para completar la conexión.

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración del Gateway](/es/gateway/configuration) -- todas las opciones de configuración
