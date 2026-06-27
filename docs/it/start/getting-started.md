---
read_when:
    - Prima configurazione da zero
    - Vuoi il percorso più rapido per avere una chat funzionante
summary: Installa OpenClaw ed esegui la tua prima chat in pochi minuti.
title: Guida introduttiva
x-i18n:
    generated_at: "2026-06-27T18:16:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Installa OpenClaw, esegui l'onboarding e chatta con il tuo assistente AI: tutto in
circa 5 minuti. Alla fine avrai un Gateway in esecuzione, l'autenticazione configurata
e una sessione di chat funzionante.

## Cosa ti serve

- **Node.js** — Node 24 consigliato (supportato anche Node 22.19+)
- **Una chiave API** di un provider di modelli (Anthropic, OpenAI, Google, ecc.) — l'onboarding te la chiederà

<Tip>
Controlla la tua versione di Node con `node --version`.
**Utenti Windows:** l'app Hub nativa per Windows è il percorso desktop più semplice. Sono
supportati anche l'installer PowerShell e i percorsi Gateway WSL2. Vedi [Windows](/it/platforms/windows).
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
    Digita un messaggio nella chat della Control UI e dovresti ricevere una risposta AI.

    Vuoi invece chattare dal telefono? Il canale più rapido da configurare è
    [Telegram](/it/channels/telegram) (basta un token del bot). Vedi [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata della Control UI">
  Se mantieni una build della dashboard localizzata o personalizzata, punta
  `gateway.controlUi.root` a una directory che contiene gli asset statici
  compilati e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Quindi imposta:

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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altri.
  </Card>
  <Card title="Associazione e sicurezza" href="/it/channels/pairing" icon="shield">
    Controlla chi può inviare messaggi al tuo agente.
  </Card>
  <Card title="Configura il Gateway" href="/it/gateway/configuration" icon="settings">
    Modelli, strumenti, sandbox e impostazioni avanzate.
  </Card>
  <Card title="Sfoglia gli strumenti" href="/it/tools" icon="wrench">
    Browser, exec, ricerca web, Skills e Plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili di ambiente">
  Se esegui OpenClaw come account di servizio o vuoi percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione interna dei percorsi
- `OPENCLAW_STATE_DIR` — sostituisce la directory di stato
- `OPENCLAW_CONFIG_PATH` — sostituisce il percorso del file di configurazione

Riferimento completo: [Variabili di ambiente](/it/help/environment).
</Accordion>

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Panoramica dei canali](/it/channels)
- [Configurazione](/it/start/setup)
