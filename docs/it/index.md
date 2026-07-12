---
read_when:
    - Presentazione di OpenClaw ai nuovi utenti
summary: OpenClaw è un gateway multicanale per agenti di IA che funziona su qualsiasi sistema operativo.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T07:09:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
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
  <strong>Gateway per qualsiasi sistema operativo, pensato per agenti di IA su Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altri servizi.</strong><br />
  Invia un messaggio e ricevi la risposta di un agente direttamente sul tuo dispositivo mobile. Esegui un unico Gateway per i plugin dei canali, WebChat e i nodi mobili.
</p>

<Columns>
  <Card title="Inizia" href="/it/start/getting-started" icon="rocket">
    Installa OpenClaw e avvia il Gateway in pochi minuti.
  </Card>
  <Card title="Esegui la configurazione iniziale" href="/it/start/wizard" icon="list-checks">
    Configurazione guidata con `openclaw onboard` e procedure di associazione.
  </Card>
  <Card title="Connetti un canale" href="/it/channels" icon="message-circle">
    Collega Discord, Signal, Telegram, WhatsApp e altri servizi per comunicare ovunque ti trovi.
  </Card>
  <Card title="Apri l'interfaccia di controllo" href="/it/web/control-ui" icon="layout-dashboard">
    Avvia il pannello di controllo nel browser per chat, configurazione e sessioni.
  </Card>
</Columns>

## Esplora la documentazione

Nei browser mobili il menu delle sezioni potrebbe essere visualizzato senza l'intera barra delle schede della versione desktop. Usa
questi collegamenti principali per accedere alle stesse aree di primo livello della documentazione dal corpo della pagina.

<Columns>
  <Card title="Inizia" href="/it" icon="rocket">
    Panoramica, presentazione, primi passi e guide alla configurazione.
  </Card>
  <Card title="Installazione" href="/it/install" icon="download">
    Metodi di installazione, aggiornamenti, container, hosting e configurazione avanzata.
  </Card>
  <Card title="Canali" href="/it/channels" icon="messages-square">
    Canali di messaggistica, associazione, instradamento, gruppi di accesso e controllo qualità dei canali.
  </Card>
  <Card title="Agenti" href="/it/concepts/architecture" icon="bot">
    Architettura, sessioni, contesto, memoria e instradamento multi-agente.
  </Card>
  <Card title="Funzionalità" href="/it/tools" icon="wand-sparkles">
    Strumenti, Skills, Cron, Webhook e funzionalità di automazione.
  </Card>
  <Card title="ClawHub" href="/it/clawhub" icon="store">
    Marketplace dei Plugin, pubblicazione, selezione e indicazioni sull'affidabilità.
  </Card>
  <Card title="Modelli" href="/it/providers" icon="brain">
    Fornitori, configurazione dei modelli, failover e servizi per modelli locali.
  </Card>
  <Card title="Piattaforme" href="/it/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, nodi e interfacce web.
  </Card>
  <Card title="Gateway e operazioni" href="/it/gateway" icon="server">
    Configurazione, sicurezza, diagnostica e gestione del Gateway.
  </Card>
  <Card title="Riferimenti" href="/it/cli" icon="terminal">
    Riferimento della CLI, schemi, RPC, note di rilascio e modelli.
  </Card>
  <Card title="Assistenza" href="/it/help" icon="life-buoy">
    Risoluzione dei problemi, domande frequenti, test, diagnostica e controlli dell'ambiente.
  </Card>
</Columns>

## Che cos'è OpenClaw?

OpenClaw è un **gateway self-hosted** che collega le tue applicazioni di chat preferite — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altre tramite i plugin dei canali — agli agenti di IA per la programmazione. Esegui un unico processo Gateway sul tuo computer (o su un server), che funge da ponte tra le applicazioni di messaggistica e un assistente IA sempre disponibile.

**A chi è destinato?** A sviluppatori e utenti esperti che desiderano un assistente IA personale con cui comunicare ovunque si trovino, senza rinunciare al controllo dei propri dati né dipendere da un servizio in hosting.

**Che cosa lo rende diverso?**

- **Self-hosted**: viene eseguito sul tuo hardware, secondo le tue regole
- **Multicanale**: un solo Gateway gestisce simultaneamente tutti i plugin dei canali configurati
- **Nativo per gli agenti**: progettato per agenti di programmazione con utilizzo di strumenti, sessioni, memoria e instradamento multi-agente
- **Open source**: distribuito con licenza MIT e sviluppato dalla comunità

**Di cosa hai bisogno?** Node 24 (consigliato), oppure Node 22 LTS (`22.19+`) per la compatibilità, una chiave API del fornitore scelto e 5 minuti. Per ottenere la massima qualità e sicurezza, usa il modello di ultima generazione più potente disponibile.

## Come funziona

```mermaid
flowchart LR
  A["App di chat + plugin"] --> B["Gateway"]
  B --> C["Agente OpenClaw"]
  B --> D["CLI"]
  B --> E["Interfaccia di controllo web"]
  B --> F["App macOS"]
  B --> G["Nodi iOS e Android"]
```

Il Gateway è l'unica fonte autorevole per sessioni, instradamento e connessioni ai canali.

## Funzionalità principali

<Columns>
  <Card title="Gateway multicanale" icon="network" href="/it/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e altri servizi con un unico processo Gateway.
  </Card>
  <Card title="Canali tramite Plugin" icon="plug" href="/it/tools/plugin">
    I plugin dei canali aggiungono Matrix, Nostr, Twitch, Zalo e altri servizi; i plugin ufficiali vengono installati su richiesta.
  </Card>
  <Card title="Instradamento multi-agente" icon="route" href="/it/concepts/multi-agent">
    Sessioni isolate per agente, area di lavoro o mittente.
  </Card>
  <Card title="Supporto multimediale" icon="image" href="/it/nodes/images">
    Invia e ricevi immagini, audio e documenti.
  </Card>
  <Card title="Interfaccia di controllo web" icon="monitor" href="/it/web/control-ui">
    Pannello di controllo nel browser per chat, configurazione, sessioni e nodi.
  </Card>
  <Card title="Nodi mobili" icon="smartphone" href="/it/nodes">
    Associa nodi iOS e Android per flussi di lavoro con Canvas, fotocamera e funzionalità vocali.
  </Card>
</Columns>

## Avvio rapido

<Steps>
  <Step title="Installa OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Esegui la configurazione iniziale e installa il servizio">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Avvia una chat">
    Apri l'interfaccia di controllo nel browser e invia un messaggio:

    ```bash
    openclaw dashboard
    ```

    In alternativa, connetti un canale ([Telegram](/it/channels/telegram) è il più rapido) e avvia una chat dal telefono.

  </Step>
</Steps>

Ti servono le istruzioni complete per l'installazione e la configurazione dell'ambiente di sviluppo? Consulta [Guida introduttiva](/it/start/getting-started).

## Pannello di controllo

Apri l'interfaccia di controllo nel browser dopo l'avvio del Gateway.

- Indirizzo locale predefinito: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Accesso remoto: [Interfacce web](/it/web) e [Tailscale](/it/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configurazione (facoltativa)

La configurazione si trova in `~/.openclaw/openclaw.json`.

- Se **non fai nulla**, OpenClaw usa il runtime dell'agente OpenClaw incluso; i messaggi diretti condividono la sessione principale dell'agente e ogni chat di gruppo dispone di una propria sessione.
- Se vuoi limitarne l'accesso, inizia con `channels.whatsapp.allowFrom` e, per i gruppi, con le regole relative alle menzioni.

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

## Da dove iniziare

<Columns>
  <Card title="Sezioni della documentazione" href="/it/start/hubs" icon="book-open">
    Tutta la documentazione e le guide, organizzate per caso d'uso.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="settings">
    Impostazioni principali del Gateway, token e configurazione dei fornitori.
  </Card>
  <Card title="Accesso remoto" href="/it/gateway/remote" icon="globe">
    Modalità di accesso tramite SSH e tailnet.
  </Card>
  <Card title="Canali" href="/it/channels/telegram" icon="message-square">
    Configurazione specifica dei canali per Discord, Feishu, Microsoft Teams, Telegram, WhatsApp e altri servizi.
  </Card>
  <Card title="Nodi" href="/it/nodes" icon="smartphone">
    Nodi iOS e Android con associazione, Canvas, fotocamera e azioni del dispositivo.
  </Card>
  <Card title="Assistenza" href="/it/help" icon="life-buoy">
    Soluzioni comuni e punto di partenza per la risoluzione dei problemi.
  </Card>
</Columns>

## Ulteriori informazioni

<Columns>
  <Card title="Elenco completo delle funzionalità" href="/it/concepts/features" icon="list">
    Funzionalità complete per canali, instradamento e contenuti multimediali.
  </Card>
  <Card title="Instradamento multi-agente" href="/it/concepts/multi-agent" icon="route">
    Isolamento delle aree di lavoro e sessioni per agente.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security" icon="shield">
    Token, elenchi di elementi consentiti e controlli di sicurezza.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/gateway/troubleshooting" icon="wrench">
    Diagnostica del Gateway ed errori comuni.
  </Card>
  <Card title="Informazioni e riconoscimenti" href="/it/reference/credits" icon="info">
    Origini del progetto, collaboratori e licenza.
  </Card>
</Columns>
