---
read_when:
    - Configurazione iniziale da zero
    - Vuoi il percorso più rapido per ottenere una chat funzionante
summary: Installa OpenClaw e avvia la tua prima chat in pochi minuti.
title: Guida introduttiva
x-i18n:
    generated_at: "2026-05-07T13:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Installa OpenClaw, esegui l'onboarding e chatta con il tuo assistente IA — tutto in
circa 5 minuti. Alla fine avrai un Gateway in esecuzione, l'autenticazione configurata
e una sessione di chat funzionante.

## Cosa ti serve

- **Node.js** — Node 24 consigliato (supportato anche Node 22.16+)
- **Una chiave API** da un provider di modelli (Anthropic, OpenAI, Google, ecc.) — l'onboarding te la richiederà

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
    Altri metodi di installazione (Docker, Nix, npm): [Installa](/it/install).
    </Note>

  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata ti accompagna nella scelta di un provider di modelli, nell'impostazione di una chiave API
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

    Questo apre la Control UI nel tuo browser. Se si carica, tutto funziona.

  </Step>
  <Step title="Invia il tuo primo messaggio">
    Digita un messaggio nella chat della Control UI e dovresti ricevere una risposta dall'IA.

    Vuoi invece chattare dal telefono? Il canale più veloce da configurare è
    [Telegram](/it/channels/telegram) (serve solo un token bot). Vedi [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata della Control UI">
  Se mantieni una build della dashboard localizzata o personalizzata, punta
  `gateway.controlUi.root` a una directory che contiene i tuoi asset statici
  compilati e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora.
  </Card>
  <Card title="Associazione e sicurezza" href="/it/channels/pairing" icon="shield">
    Controlla chi può inviare messaggi al tuo agent.
  </Card>
  <Card title="Configura il Gateway" href="/it/gateway/configuration" icon="settings">
    Modelli, strumenti, sandbox e impostazioni avanzate.
  </Card>
  <Card title="Sfoglia gli strumenti" href="/it/tools" icon="wrench">
    Browser, exec, ricerca web, Skills e Plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili d'ambiente">
  Se esegui OpenClaw come account di servizio o vuoi percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione dei percorsi interni
- `OPENCLAW_STATE_DIR` — sovrascrive la directory di stato
- `OPENCLAW_CONFIG_PATH` — sovrascrive il percorso del file di configurazione

Riferimento completo: [Variabili d'ambiente](/it/help/environment).
</Accordion>

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Panoramica dei canali](/it/channels)
- [Configurazione](/it/start/setup)
