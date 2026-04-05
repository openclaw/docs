---
read_when:
    - Prima configurazione da zero
    - Vuoi il percorso più rapido per avere una chat funzionante
summary: Installa OpenClaw ed esegui la tua prima chat in pochi minuti.
title: Guida introduttiva
x-i18n:
    generated_at: "2026-04-05T14:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# Guida introduttiva

Installa OpenClaw, esegui l'onboarding e chatta con il tuo assistente AI, il tutto in
circa 5 minuti. Alla fine avrai un Gateway in esecuzione, l'autenticazione
configurata e una sessione di chat funzionante.

## Cosa ti serve

- **Node.js** — si consiglia Node 24 (è supportato anche Node 22.14+)
- **Una chiave API** di un provider di modelli (Anthropic, OpenAI, Google, ecc.) — l'onboarding te la richiederà

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

    La procedura guidata ti accompagna nella scelta di un provider di modelli, nell'impostazione di una chiave API
    e nella configurazione del Gateway. Richiede circa 2 minuti.

    Vedi [Onboarding (CLI)](/start/wizard) per il riferimento completo.

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

    Questo apre la Control UI nel browser. Se si carica, significa che tutto funziona.

  </Step>
  <Step title="Invia il tuo primo messaggio">
    Digita un messaggio nella chat della Control UI e dovresti ricevere una risposta AI.

    Vuoi invece chattare dal telefono? Il canale più rapido da configurare è
    [Telegram](/it/channels/telegram) (serve solo un token bot). Vedi [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata della Control UI">
  Se mantieni una build della dashboard localizzata o personalizzata, imposta
  `gateway.controlUi.root` su una directory che contenga le risorse statiche
  compilate e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copia i file statici compilati in quella directory.
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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora.
  </Card>
  <Card title="Abbinamento e sicurezza" href="/it/channels/pairing" icon="shield">
    Controlla chi può inviare messaggi al tuo agente.
  </Card>
  <Card title="Configura il Gateway" href="/it/gateway/configuration" icon="settings">
    Modelli, strumenti, sandbox e impostazioni avanzate.
  </Card>
  <Card title="Esplora gli strumenti" href="/tools" icon="wrench">
    Browser, exec, ricerca web, skills e plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili d'ambiente">
  Se esegui OpenClaw come account di servizio o vuoi percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione dei percorsi interni
- `OPENCLAW_STATE_DIR` — sovrascrive la directory dello stato
- `OPENCLAW_CONFIG_PATH` — sovrascrive il percorso del file di configurazione

Riferimento completo: [Variabili d'ambiente](/it/help/environment).
</Accordion>
