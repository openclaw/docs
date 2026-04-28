---
read_when:
    - Presentar OpenClaw a quienes lo conocen por primera vez
summary: OpenClaw es un Gateway multicanal para agentes de IA que funciona en cualquier sistema operativo.
title: OpenClaw
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-22T04:23:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 923d34fa604051d502e4bc902802d6921a4b89a9447f76123aa8d2ff085f0b99
    source_path: index.md
    workflow: 15
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

> _"¡MUDA! ¡MUDA!"_ — Una langosta espacial, probablemente

<p align="center">
  <strong>Gateway para agentes de IA en cualquier sistema operativo a través de Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más.</strong><br />
  Envía un mensaje y recibe una respuesta de un agente desde tu bolsillo. Ejecuta un Gateway en canales integrados, plugins de canal incluidos, WebChat y nodos móviles.
</p>

<Columns>
  <Card title="Comenzar" href="/es/start/getting-started" icon="rocket">
    Instala OpenClaw y levanta el Gateway en minutos.
  </Card>
  <Card title="Ejecutar incorporación" href="/es/start/wizard" icon="sparkles">
    Configuración guiada con `openclaw onboard` y flujos de pairing.
  </Card>
  <Card title="Abrir la IU de control" href="/web/control-ui" icon="layout-dashboard">
    Inicia el panel del navegador para chat, configuración y sesiones.
  </Card>
</Columns>

## ¿Qué es OpenClaw?

OpenClaw es un **Gateway autohospedado** que conecta tus aplicaciones de chat y superficies de canal favoritas — canales integrados más plugins de canal incluidos o externos como Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más — con agentes de IA para programación como Pi. Ejecutas un único proceso de Gateway en tu propia máquina (o en un servidor), y este se convierte en el puente entre tus aplicaciones de mensajería y un asistente de IA siempre disponible.

**¿Para quién es?** Desarrolladores y usuarios avanzados que quieren un asistente personal de IA al que puedan enviar mensajes desde cualquier lugar, sin renunciar al control de sus datos ni depender de un servicio alojado.

**¿Qué lo hace diferente?**

- **Autohospedado**: funciona en tu hardware, bajo tus reglas
- **Multicanal**: un Gateway sirve simultáneamente canales integrados más plugins de canal incluidos o externos
- **Nativo para agentes**: creado para agentes de programación con uso de herramientas, sesiones, memoria y enrutamiento de varios agentes
- **Código abierto**: con licencia MIT, impulsado por la comunidad

**¿Qué necesitas?** Node 24 (recomendado), o Node 22 LTS (`22.14+`) por compatibilidad, una clave de API de tu proveedor elegido y 5 minutos. Para obtener la mejor calidad y seguridad, usa el modelo más potente disponible de la generación más reciente.

## Cómo funciona

```mermaid
flowchart LR
  A["Aplicaciones de chat + plugins"] --> B["Gateway"]
  B --> C["Agente Pi"]
  B --> D["CLI"]
  B --> E["IU de control web"]
  B --> F["Aplicación de macOS"]
  B --> G["Nodos de iOS y Android"]
```

El Gateway es la única fuente de verdad para sesiones, enrutamiento y conexiones de canal.

## Capacidades clave

<Columns>
  <Card title="Gateway multicanal" icon="network" href="/es/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat y más con un solo proceso de Gateway.
  </Card>
  <Card title="Canales Plugin" icon="plug" href="/es/tools/plugin">
    Los plugins incluidos añaden Matrix, Nostr, Twitch, Zalo y más en las versiones actuales normales.
  </Card>
  <Card title="Enrutamiento de varios agentes" icon="route" href="/es/concepts/multi-agent">
    Sesiones aisladas por agente, espacio de trabajo o remitente.
  </Card>
  <Card title="Compatibilidad multimedia" icon="image" href="/es/nodes/images">
    Envía y recibe imágenes, audio y documentos.
  </Card>
  <Card title="IU de control web" icon="monitor" href="/web/control-ui">
    Panel del navegador para chat, configuración, sesiones y nodos.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Empareja nodos de iOS y Android para Canvas, cámara y flujos de trabajo con voz.
  </Card>
</Columns>

## Inicio rápido

<Steps>
  <Step title="Instalar OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Realizar la incorporación e instalar el servicio">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatear">
    Abre la IU de control en tu navegador y envía un mensaje:

    ```bash
    openclaw dashboard
    ```

    O conecta un canal ([Telegram](/es/channels/telegram) es el más rápido) y chatea desde tu teléfono.

  </Step>
</Steps>

¿Necesitas la instalación completa y la configuración de desarrollo? Consulta [Comenzar](/es/start/getting-started).

## Panel

Abre la IU de control del navegador después de que se inicie el Gateway.

- Predeterminado local: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Acceso remoto: [Superficies web](/web) y [Tailscale](/es/gateway/tailscale)

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
    Toda la documentación y guías, organizadas por caso de uso.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="settings">
    Ajustes principales del Gateway, tokens y configuración del proveedor.
  </Card>
  <Card title="Acceso remoto" href="/es/gateway/remote" icon="globe">
    Patrones de acceso con SSH y tailnet.
  </Card>
  <Card title="Canales" href="/es/channels/telegram" icon="message-square">
    Configuración específica de canal para Feishu, Microsoft Teams, WhatsApp, Telegram, Discord y más.
  </Card>
  <Card title="Nodos" href="/es/nodes" icon="smartphone">
    Nodos de iOS y Android con pairing, Canvas, cámara y acciones del dispositivo.
  </Card>
  <Card title="Ayuda" href="/es/help" icon="life-buoy">
    Correcciones comunes y punto de entrada para la solución de problemas.
  </Card>
</Columns>

## Más información

<Columns>
  <Card title="Lista completa de funciones" href="/es/concepts/features" icon="list">
    Capacidades completas de canales, enrutamiento y multimedia.
  </Card>
  <Card title="Enrutamiento de varios agentes" href="/es/concepts/multi-agent" icon="route">
    Aislamiento del espacio de trabajo y sesiones por agente.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="shield">
    Tokens, listas de permitidos y controles de seguridad.
  </Card>
  <Card title="Solución de problemas" href="/es/gateway/troubleshooting" icon="wrench">
    Diagnóstico del Gateway y errores comunes.
  </Card>
  <Card title="Acerca de y créditos" href="/es/reference/credits" icon="info">
    Orígenes del proyecto, colaboradores y licencia.
  </Card>
</Columns>
