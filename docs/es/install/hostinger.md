---
read_when:
    - Configuración de OpenClaw en Hostinger
    - Buscando un VPS gestionado para OpenClaw
    - Usar OpenClaw con 1 clic de Hostinger
summary: Aloja OpenClaw en Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-05T11:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en [Hostinger](https://www.hostinger.com/openclaw), ya sea como una implementación administrada de **1 clic** o como una instalación en **VPS** que administras tú mismo.

## Requisitos previos

- Cuenta de Hostinger ([registro](https://www.hostinger.com/openclaw))
- Aproximadamente 5-10 minutos

## Opción A: OpenClaw de 1 clic

Hostinger se encarga de la infraestructura, Docker y las actualizaciones automáticas. Es la ruta más rápida para tener una instancia en ejecución.

<Steps>
  <Step title="Comprar e iniciar">
    1. Desde la [página de OpenClaw en Hostinger](https://www.hostinger.com/openclaw), elige un plan de OpenClaw administrado y completa el pago.

    <Note>
    Durante el pago puedes seleccionar créditos de **IA lista para usar** que se compran por adelantado y se integran al instante dentro de OpenClaw -- no se necesitan cuentas externas ni claves de API de otros proveedores. Puedes empezar a chatear de inmediato. Como alternativa, proporciona tu propia clave de Anthropic, OpenAI, Google Gemini o xAI durante la configuración.
    </Note>

  </Step>

  <Step title="Seleccionar un canal de mensajería">
    Elige uno o más canales para conectar:

    - **WhatsApp** -- escanea el código QR que se muestra en el asistente de configuración.
    - **Telegram** -- pega el token del bot de [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Completar la instalación">
    Haz clic en **Finalizar** para implementar la instancia. Cuando esté lista, accede al panel de OpenClaw desde **Descripción general de OpenClaw** en hPanel.
  </Step>

</Steps>

## Opción B: OpenClaw en VPS

Más control sobre el servidor. Hostinger implementa OpenClaw mediante Docker en tu VPS; tú lo administras a través del **Administrador de Docker** en hPanel.

<Steps>
  <Step title="Comprar un VPS">
    1. Desde la [página de OpenClaw en Hostinger](https://www.hostinger.com/openclaw), elige un plan de OpenClaw en VPS y completa el pago.

    <Note>
    Puedes seleccionar créditos de **IA lista para usar** durante el pago -- estos se compran por adelantado y se integran al instante dentro de OpenClaw, para que puedas empezar a chatear sin cuentas externas ni claves de API de otros proveedores.
    </Note>

  </Step>

  <Step title="Configurar OpenClaw">
    Una vez que se aprovisione el VPS, completa los campos de configuración:

    - **Token del Gateway** -- se genera automáticamente; guárdalo para usarlo más adelante.
    - **Número de WhatsApp** -- tu número con código de país (opcional).
    - **Token del bot de Telegram** -- de [BotFather](https://t.me/BotFather) (opcional).
    - **Claves de API** -- solo se necesitan si no seleccionaste créditos de IA lista para usar durante el pago.

  </Step>

  <Step title="Iniciar OpenClaw">
    Haz clic en **Implementar**. Cuando esté en ejecución, abre el panel de OpenClaw desde hPanel haciendo clic en **Abrir**.
  </Step>

</Steps>

Los registros, reinicios y actualizaciones se ejecutan desde la interfaz del Administrador de Docker en hPanel. Para actualizar, presiona **Actualizar** en el Administrador de Docker para descargar la imagen más reciente.

## Verificar tu configuración

Envía "Hola" a tu asistente en el canal que conectaste. OpenClaw responde y te guía por las preferencias iniciales.

## Solución de problemas

**El panel no carga** -- Espera unos minutos a que el contenedor termine de aprovisionarse y luego revisa los registros del Administrador de Docker en hPanel.

**El contenedor de Docker se sigue reiniciando** -- Abre los registros del Administrador de Docker y busca errores de configuración (tokens faltantes, claves de API no válidas).

**El bot de Telegram no responde** -- Si se requiere emparejamiento por DM, un remitente desconocido recibe un código de emparejamiento corto en lugar de una respuesta. Apruébalo desde el chat del panel de OpenClaw, o con `openclaw pairing approve telegram <CODE>` si tienes acceso de shell al contenedor. Consulta [Emparejamiento](/es/channels/pairing).

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración del Gateway](/es/gateway/configuration) -- todas las opciones de configuración

## Relacionado

- [Resumen de instalación](/es/install)
- [Alojamiento VPS](/es/vps)
- [DigitalOcean](/es/install/digitalocean)
