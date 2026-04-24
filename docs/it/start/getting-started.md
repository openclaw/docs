---
read_when:
    - Configurazione iniziale da zero
    - Vuoi il percorso più rapido per ottenere una chat funzionante
summary: Installa OpenClaw e avvia la tua prima chat in pochi minuti.
title: Per iniziare
x-i18n:
    generated_at: "2026-04-24T09:02:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Installa OpenClaw, esegui l'onboarding e chatta con il tuo assistente IA — tutto in
circa 5 minuti. Alla fine avrai un Gateway in esecuzione, auth configurata
e una sessione di chat funzionante.

## Cosa ti serve

- **Node.js** — consigliato Node 24 (supportato anche Node 22.14+)
- **Una chiave API** di un provider di modelli (Anthropic, OpenAI, Google, ecc.) — l'onboarding te la chiederà

<Tip>
Controlla la tua versione di Node con `node --version`.
**Utenti Windows:** sono supportati sia Windows nativo sia WSL2. WSL2 è più
stabile ed è consigliato per l'esperienza completa. Vedi [Windows](/it/platforms/windows).
Devi installare Node? Vedi [Configurazione di Node](/it/install/node).
</Tip>

## Configurazione rapida

<Steps>
  <Step title="Installa OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Processo dello script di installazione"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Altri metodi di installazione (Docker, Nix, npm): [Installazione](/it/install).
    </Note>

  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Il wizard ti guida nella scelta di un provider di modelli, nell'impostazione di una chiave API
    e nella configurazione del Gateway. Richiede circa 2 minuti.

    Vedi [Onboarding (CLI)](/it/start/wizard) per il riferimento completo.

  </Step>
  <Step title="Verifica che il Gateway sia in esecuzione">
    ```bash
    openclaw gateway status
    ```

    Dovresti vedere il Gateway in ascolto sulla porta 18789.

  </Step>
  <Step title="Apri la dashboard">
    ```bash
    openclaw dashboard
    ```

    Questo apre la Control UI nel tuo browser. Se si carica, significa che tutto funziona.

  </Step>
  <Step title="Invia il tuo primo messaggio">
    Scrivi un messaggio nella chat della Control UI e dovresti ricevere una risposta dall'IA.

    Vuoi chattare dal telefono invece? Il canale più rapido da configurare è
    [Telegram](/it/channels/telegram) (serve solo un token bot). Vedi [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata della Control UI">
  Se mantieni una build della dashboard localizzata o personalizzata, punta
  `gateway.controlUi.root` a una directory che contenga i tuoi asset statici
  compilati e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copia i tuoi file statici compilati in quella directory.
```

Poi imposta:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Riavvia il gateway e riapri la dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Cosa fare dopo

<Columns>
  <Card title="Collega un canale" href="/it/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro.
  </Card>
  <Card title="Abbinamento e sicurezza" href="/it/channels/pairing" icon="shield">
    Controlla chi può inviare messaggi al tuo agente.
  </Card>
  <Card title="Configura il Gateway" href="/it/gateway/configuration" icon="settings">
    Modelli, strumenti, sandbox e impostazioni avanzate.
  </Card>
  <Card title="Sfoglia gli strumenti" href="/it/tools" icon="wrench">
    Browser, exec, ricerca web, Skills e plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili di ambiente">
  Se esegui OpenClaw come account di servizio o vuoi percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione dei percorsi interni
- `OPENCLAW_STATE_DIR` — sovrascrive la directory di stato
- `OPENCLAW_CONFIG_PATH` — sovrascrive il percorso del file di configurazione

Riferimento completo: [Variabili di ambiente](/it/help/environment).
</Accordion>

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Panoramica dei canali](/it/channels)
- [Setup](/it/start/setup)
