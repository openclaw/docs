---
read_when:
    - Presentación de OpenClaw para nuevos usuarios
summary: OpenClaw es un Gateway multicanal para agentes de IA que se ejecuta en cualquier sistema operativo.
title: OpenClaw
x-i18n:
    generated_at: "2026-05-07T13:19:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bf82c8551703257e55289d2b82f6436c9900a8afae7ab9b6a655332716ff37b
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"¡EXFOLIA! ¡EXFOLIA!"_ — Una langosta espacial, probablemente

<p align="center">
  <strong>Gateway para cualquier sistema operativo para agentes de IA en Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más.</strong><br />
  Envía un mensaje y recibe una respuesta del agente desde tu bolsillo. Ejecuta un Gateway en canales integrados, plugins de canal incluidos, WebChat y nodos móviles.
</p>

<Columns>
  <Card title="Primeros pasos" href="/es/start/getting-started" icon="rocket">
    Instala OpenClaw y pon en marcha el Gateway en minutos.
  </Card>
  <Card title="Ejecutar la incorporación" href="/es/start/wizard" icon="sparkles">
    Configuración guiada con `openclaw onboard` y flujos de emparejamiento.
  </Card>
  <Card title="Abrir la interfaz de control" href="/es/web/control-ui" icon="layout-dashboard">
    Inicia el panel del navegador para chat, configuración y sesiones.
  </Card>
</Columns>

## ¿Qué es OpenClaw?

OpenClaw es un **gateway autohospedado** que conecta tus aplicaciones de chat y superficies de canal favoritas —canales integrados más plugins de canal incluidos o externos como Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más— con agentes de codificación de IA como Pi. Ejecutas un único proceso Gateway en tu propia máquina (o en un servidor), y se convierte en el puente entre tus aplicaciones de mensajería y un asistente de IA siempre disponible.

**¿Para quién es?** Para desarrolladores y usuarios avanzados que quieren un asistente personal de IA al que puedan enviar mensajes desde cualquier lugar, sin ceder el control de sus datos ni depender de un servicio alojado.

**¿Qué lo hace diferente?**

- **Autohospedado**: se ejecuta en tu hardware, con tus reglas
- **Multicanal**: un Gateway sirve simultáneamente canales integrados más plugins de canal incluidos o externos
- **Nativo para agentes**: creado para agentes de codificación con uso de herramientas, sesiones, memoria y enrutamiento multiagente
- **Código abierto**: con licencia MIT e impulsado por la comunidad

**¿Qué necesitas?** Node 24 (recomendado), o Node 22 LTS (`22.16+`) para compatibilidad, una clave de API de tu proveedor elegido y 5 minutos. Para obtener la mejor calidad y seguridad, usa el modelo de última generación más potente disponible.

## Cómo funciona

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

El Gateway es la única fuente de verdad para sesiones, enrutamiento y conexiones de canales.

## Capacidades clave

<Columns>
  <Card title="Gateway multicanal" icon="network" href="/es/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat y más con un único proceso Gateway.
  </Card>
  <Card title="Canales de Plugin" icon="plug" href="/es/tools/plugin">
    Los plugins incluidos añaden Matrix, Nostr, Twitch, Zalo y más en las versiones actuales normales.
  </Card>
  <Card title="Enrutamiento multiagente" icon="route" href="/es/concepts/multi-agent">
    Sesiones aisladas por agente, espacio de trabajo o remitente.
  </Card>
  <Card title="Soporte multimedia" icon="image" href="/es/nodes/images">
    Envía y recibe imágenes, audio y documentos.
  </Card>
  <Card title="Interfaz de control web" icon="monitor" href="/es/web/control-ui">
    Panel del navegador para chat, configuración, sesiones y nodos.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Empareja nodos iOS y Android para Canvas, cámara y flujos de trabajo con voz.
  </Card>
</Columns>

## Inicio rápido

<Steps>
  <Step title="Instalar OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Incorporar e instalar el servicio">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatear">
    Abre la interfaz de control en tu navegador y envía un mensaje:

    ```bash
    openclaw dashboard
    ```

    O conecta un canal ([Telegram](/es/channels/telegram) es el más rápido) y chatea desde tu teléfono.

  </Step>
</Steps>

¿Necesitas la instalación completa y la configuración de desarrollo? Consulta [Primeros pasos](/es/start/getting-started).

## Panel

Abre la interfaz de control en el navegador después de que se inicie el Gateway.

- Valor local predeterminado: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Acceso remoto: [Superficies web](/es/web) y [Tailscale](/es/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configuración (opcional)

La configuración se encuentra en `~/.openclaw/openclaw.json`.

- Si **no haces nada**, OpenClaw usa el binario Pi incluido en modo RPC con sesiones por remitente.
- Si quieres restringirlo, empieza con `channels.whatsapp.allowFrom` y (para grupos) reglas de mención.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Empieza aquí

<Columns>
  <Card title="Centros de documentación" href="/es/start/hubs" icon="book-open">
    Toda la documentación y las guías, organizadas por caso de uso.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="settings">
    Ajustes principales del Gateway, tokens y configuración del proveedor.
  </Card>
  <Card title="Acceso remoto" href="/es/gateway/remote" icon="globe">
    Patrones de acceso SSH y tailnet.
  </Card>
  <Card title="Canales" href="/es/channels/telegram" icon="message-square">
    Configuración específica de canal para Feishu, Microsoft Teams, WhatsApp, Telegram, Discord y más.
  </Card>
  <Card title="Nodos" href="/es/nodes" icon="smartphone">
    Nodos iOS y Android con emparejamiento, Canvas, cámara y acciones de dispositivo.
  </Card>
  <Card title="Ayuda" href="/es/help" icon="life-buoy">
    Punto de entrada para soluciones comunes y resolución de problemas.
  </Card>
</Columns>

## Más información

<Columns>
  <Card title="Lista completa de funciones" href="/es/concepts/features" icon="list">
    Capacidades completas de canales, enrutamiento y multimedia.
  </Card>
  <Card title="Enrutamiento multiagente" href="/es/concepts/multi-agent" icon="route">
    Aislamiento de espacios de trabajo y sesiones por agente.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="shield">
    Tokens, listas de permitidos y controles de seguridad.
  </Card>
  <Card title="Resolución de problemas" href="/es/gateway/troubleshooting" icon="wrench">
    Diagnósticos del Gateway y errores comunes.
  </Card>
  <Card title="Acerca de y créditos" href="/es/reference/credits" icon="info">
    Orígenes del proyecto, colaboradores y licencia.
  </Card>
</Columns>
