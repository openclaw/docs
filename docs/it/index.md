---
read_when:
    - Presentazione di OpenClaw ai nuovi arrivati
summary: OpenClaw è un gateway multicanale per agenti AI che funziona su qualsiasi sistema operativo.
title: OpenClaw
x-i18n:
    generated_at: "2026-04-05T13:54:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c29a8d9fc41a94b650c524bb990106f134345560e6d615dac30e8815afff481
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

> _"ESFOLIA! ESFOLIA!"_ — Un'aragosta spaziale, probabilmente

<p align="center">
  <strong>Gateway per agenti AI su qualsiasi sistema operativo, attraverso Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora.</strong><br />
  Invia un messaggio, ricevi la risposta di un agente ovunque tu sia. Esegui un solo Gateway con canali integrati, plugin di canale inclusi, WebChat e nodi mobili.
</p>

<Columns>
  <Card title="Inizia" href="/start/getting-started" icon="rocket">
    Installa OpenClaw e avvia il Gateway in pochi minuti.
  </Card>
  <Card title="Esegui l'onboarding" href="/start/wizard" icon="sparkles">
    Configurazione guidata con `openclaw onboard` e flussi di pairing.
  </Card>
  <Card title="Apri la UI di controllo" href="/web/control-ui" icon="layout-dashboard">
    Avvia la dashboard nel browser per chat, configurazione e sessioni.
  </Card>
</Columns>

## Che cos'è OpenClaw?

OpenClaw è un **gateway self-hosted** che collega le tue app di chat e superfici di canale preferite — canali integrati più plugin di canale inclusi o esterni come Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora — ad agenti AI di coding come Pi. Esegui un singolo processo Gateway sulla tua macchina (o su un server), e questo diventa il ponte tra le tue app di messaggistica e un assistente AI sempre disponibile.

**Per chi è pensato?** Sviluppatori e utenti esperti che vogliono un assistente AI personale a cui poter scrivere da ovunque — senza rinunciare al controllo dei propri dati o dipendere da un servizio ospitato.

**Cosa lo rende diverso?**

- **Self-hosted**: gira sul tuo hardware, secondo le tue regole
- **Multicanale**: un solo Gateway serve contemporaneamente canali integrati più plugin di canale inclusi o esterni
- **Nativo per agenti**: progettato per agenti di coding con uso di strumenti, sessioni, memoria e instradamento multi-agente
- **Open source**: con licenza MIT, guidato dalla community

**Di cosa hai bisogno?** Node 24 (consigliato), oppure Node 22 LTS (`22.14+`) per compatibilità, una API key del provider scelto e 5 minuti. Per la migliore qualità e sicurezza, usa il modello di ultima generazione più potente disponibile.

## Come funziona

```mermaid
flowchart LR
  A["App di chat + plugin"] --> B["Gateway"]
  B --> C["Agente Pi"]
  B --> D["CLI"]
  B --> E["UI di controllo Web"]
  B --> F["App macOS"]
  B --> G["Nodi iOS e Android"]
```

Il Gateway è l'unica fonte di verità per sessioni, instradamento e connessioni ai canali.

## Funzionalità principali

<Columns>
  <Card title="Gateway multicanale" icon="network">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altro ancora con un solo processo Gateway.
  </Card>
  <Card title="Plugin di canale" icon="plug">
    I plugin inclusi aggiungono Matrix, Nostr, Twitch, Zalo e altro ancora nelle normali release correnti.
  </Card>
  <Card title="Instradamento multi-agente" icon="route">
    Sessioni isolate per agente, spazio di lavoro o mittente.
  </Card>
  <Card title="Supporto multimediale" icon="image">
    Invia e ricevi immagini, audio e documenti.
  </Card>
  <Card title="UI di controllo Web" icon="monitor">
    Dashboard nel browser per chat, configurazione, sessioni e nodi.
  </Card>
  <Card title="Nodi mobili" icon="smartphone">
    Associa nodi iOS e Android per flussi di lavoro con Canvas, fotocamera e voce.
  </Card>
</Columns>

## Avvio rapido

<Steps>
  <Step title="Installa OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Esegui onboarding e installa il servizio">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chatta">
    Apri la UI di controllo nel browser e invia un messaggio:

    ```bash
    openclaw dashboard
    ```

    Oppure collega un canale ([Telegram](/it/channels/telegram) è il più rapido) e chatta dal tuo telefono.

  </Step>
</Steps>

Hai bisogno della configurazione completa di installazione e sviluppo? Vedi [Per iniziare](/start/getting-started).

## Dashboard

Apri la UI di controllo nel browser dopo l'avvio del Gateway.

- Predefinito locale: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Accesso remoto: [Superfici Web](/web) e [Tailscale](/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configurazione (facoltativa)

La configurazione si trova in `~/.openclaw/openclaw.json`.

- Se **non fai nulla**, OpenClaw usa il binario Pi incluso in modalità RPC con sessioni per mittente.
- Se vuoi limitarlo, inizia con `channels.whatsapp.allowFrom` e, per i gruppi, con le regole sulle menzioni.

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

## Inizia da qui

<Columns>
  <Card title="Hub della documentazione" href="/start/hubs" icon="book-open">
    Tutta la documentazione e le guide, organizzate per caso d'uso.
  </Card>
  <Card title="Configurazione" href="/gateway/configuration" icon="settings">
    Impostazioni principali del Gateway, token e configurazione del provider.
  </Card>
  <Card title="Accesso remoto" href="/gateway/remote" icon="globe">
    Modelli di accesso tramite SSH e tailnet.
  </Card>
  <Card title="Canali" href="/it/channels/telegram" icon="message-square">
    Configurazione specifica per canale per Feishu, Microsoft Teams, WhatsApp, Telegram, Discord e altro ancora.
  </Card>
  <Card title="Nodi" href="/nodes" icon="smartphone">
    Nodi iOS e Android con pairing, Canvas, fotocamera e azioni del dispositivo.
  </Card>
  <Card title="Aiuto" href="/help" icon="life-buoy">
    Correzioni comuni e punto di ingresso per la risoluzione dei problemi.
  </Card>
</Columns>

## Scopri di più

<Columns>
  <Card title="Elenco completo delle funzionalità" href="/concepts/features" icon="list">
    Funzionalità complete di canali, instradamento e contenuti multimediali.
  </Card>
  <Card title="Instradamento multi-agente" href="/concepts/multi-agent" icon="route">
    Isolamento dello spazio di lavoro e sessioni per agente.
  </Card>
  <Card title="Sicurezza" href="/gateway/security" icon="shield">
    Token, allowlist e controlli di sicurezza.
  </Card>
  <Card title="Risoluzione dei problemi" href="/gateway/troubleshooting" icon="wrench">
    Diagnostica del Gateway ed errori comuni.
  </Card>
  <Card title="Informazioni e crediti" href="/reference/credits" icon="info">
    Origini del progetto, collaboratori e licenza.
  </Card>
</Columns>
