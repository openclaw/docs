---
read_when:
    - Presentare OpenClaw ai nuovi utenti
summary: OpenClaw è un gateway multicanale per agenti IA che funziona su qualsiasi sistema operativo.
title: OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:38:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fcaa54a0a6d7aa62193fd9f03428bbcbfdcb2c00a184bcd6f49e4e093fefc473
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"ESFOLIA! ESFOLIA!"_ — Probabilmente un'aragosta spaziale

<p align="center">
  <strong>Gateway per qualsiasi sistema operativo per agenti IA su Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora.</strong><br />
  Invia un messaggio, ricevi una risposta dall'agente dalla tua tasca. Esegui un unico Gateway su canali integrati, Plugin di canale inclusi, WebChat e nodi mobili.
</p>

<Columns>
  <Card title="Inizia" href="/it/start/getting-started" icon="rocket">
    Installa OpenClaw e avvia il Gateway in pochi minuti.
  </Card>
  <Card title="Esegui l'onboarding" href="/it/start/wizard" icon="sparkles">
    Configurazione guidata con `openclaw onboard` e flussi di associazione.
  </Card>
  <Card title="Apri l'interfaccia di controllo" href="/it/web/control-ui" icon="layout-dashboard">
    Avvia la dashboard del browser per chat, configurazione e sessioni.
  </Card>
</Columns>

## Che cos'è OpenClaw?

OpenClaw è un **Gateway self-hosted** che collega le tue app di chat e superfici di canale preferite — canali integrati più Plugin di canale inclusi o esterni come Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora — agli agenti di coding IA. Esegui un singolo processo Gateway sulla tua macchina (o su un server) e diventa il ponte tra le tue app di messaggistica e un assistente IA sempre disponibile.

**A chi è rivolto?** A sviluppatori e utenti esperti che vogliono un assistente IA personale a cui poter inviare messaggi da ovunque, senza rinunciare al controllo dei propri dati o dipendere da un servizio hosted.

**Che cosa lo rende diverso?**

- **Self-hosted**: funziona sul tuo hardware, con le tue regole
- **Multi-canale**: un unico Gateway serve simultaneamente canali integrati più Plugin di canale inclusi o esterni
- **Nativo per agenti**: creato per agenti di coding con uso di strumenti, sessioni, memoria e routing multi-agente
- **Open source**: con licenza MIT e guidato dalla community

**Che cosa ti serve?** Node 24 (consigliato), oppure Node 22 LTS (`22.19+`) per compatibilità, una chiave API del provider scelto e 5 minuti. Per la migliore qualità e sicurezza, usa il modello di ultima generazione più potente disponibile.

## Come funziona

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["OpenClaw agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Il Gateway è l'unica fonte di verità per sessioni, routing e connessioni di canale.

## Capacità principali

<Columns>
  <Card title="Gateway multi-canale" icon="network" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro ancora con un singolo processo Gateway.
  </Card>
  <Card title="Canali Plugin" icon="plug" href="/it/tools/plugin">
    I Plugin inclusi aggiungono Matrix, Nostr, Twitch, Zalo e altro ancora nelle normali release correnti.
  </Card>
  <Card title="Routing multi-agente" icon="route" href="/it/concepts/multi-agent">
    Sessioni isolate per agente, workspace o mittente.
  </Card>
  <Card title="Supporto multimediale" icon="image" href="/it/nodes/images">
    Invia e ricevi immagini, audio e documenti.
  </Card>
  <Card title="Interfaccia di controllo web" icon="monitor" href="/it/web/control-ui">
    Dashboard del browser per chat, configurazione, sessioni e nodi.
  </Card>
  <Card title="Nodi mobili" icon="smartphone" href="/it/nodes">
    Associa nodi iOS e Android per workflow con Canvas, fotocamera e voce.
  </Card>
</Columns>

## Avvio rapido

<Steps>
  <Step title="Installa OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Esegui l'onboarding e installa il servizio">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chat">
    Apri l'interfaccia di controllo nel browser e invia un messaggio:

    ```bash
    openclaw dashboard
    ```

    Oppure collega un canale ([Telegram](/it/channels/telegram) è il più rapido) e chatta dal telefono.

  </Step>
</Steps>

Ti servono l'installazione completa e la configurazione per lo sviluppo? Vedi [Guida introduttiva](/it/start/getting-started).

## Dashboard

Apri l'interfaccia di controllo del browser dopo l'avvio del Gateway.

- Predefinito locale: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Accesso remoto: [Superfici web](/it/web) e [Tailscale](/it/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configurazione (facoltativa)

La configurazione si trova in `~/.openclaw/openclaw.json`.

- Se **non fai nulla**, OpenClaw usa il runtime dell'agente OpenClaw incluso con sessioni per mittente.
- Se vuoi limitarlo, inizia con `channels.whatsapp.allowFrom` e (per i gruppi) le regole di menzione.

Esempio:

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

## Inizia qui

<Columns>
  <Card title="Hub della documentazione" href="/it/start/hubs" icon="book-open">
    Tutta la documentazione e le guide, organizzate per caso d'uso.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="settings">
    Impostazioni principali del Gateway, token e configurazione dei provider.
  </Card>
  <Card title="Accesso remoto" href="/it/gateway/remote" icon="globe">
    Pattern di accesso SSH e tailnet.
  </Card>
  <Card title="Canali" href="/it/channels/telegram" icon="message-square">
    Configurazione specifica per canale per Feishu, Microsoft Teams, WhatsApp, Telegram, Discord e altro ancora.
  </Card>
  <Card title="Nodi" href="/it/nodes" icon="smartphone">
    Nodi iOS e Android con associazione, Canvas, fotocamera e azioni del dispositivo.
  </Card>
  <Card title="Aiuto" href="/it/help" icon="life-buoy">
    Punto di ingresso per correzioni comuni e risoluzione dei problemi.
  </Card>
</Columns>

## Scopri di più

<Columns>
  <Card title="Elenco completo delle funzionalità" href="/it/concepts/features" icon="list">
    Capacità complete di canale, routing e contenuti multimediali.
  </Card>
  <Card title="Routing multi-agente" href="/it/concepts/multi-agent" icon="route">
    Isolamento del workspace e sessioni per agente.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security" icon="shield">
    Token, allowlist e controlli di sicurezza.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/gateway/troubleshooting" icon="wrench">
    Diagnostica del Gateway ed errori comuni.
  </Card>
  <Card title="Informazioni e riconoscimenti" href="/it/reference/credits" icon="info">
    Origini del progetto, contributori e licenza.
  </Card>
</Columns>
