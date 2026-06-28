---
read_when:
    - Prima configurazione da zero
    - Vuoi il percorso più rapido per ottenere una chat funzionante
summary: Installa OpenClaw ed esegui la tua prima chat in pochi minuti.
title: Per iniziare
x-i18n:
    generated_at: "2026-06-28T20:45:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Installa OpenClaw, esegui l’onboarding e chatta con il tuo assistente AI: tutto in
circa 5 minuti. Alla fine avrai un Gateway in esecuzione, l’autenticazione configurata
e una sessione di chat funzionante.

## Cosa ti serve

- **Node.js** — Node 24 consigliato (supportato anche Node 22.19+)
- **Una chiave API** da un fornitore di modelli (Anthropic, OpenAI, Google, ecc.) — l’onboarding te la chiederà

<Tip>
Controlla la tua versione di Node con `node --version`.
**Utenti Windows:** l’app Hub nativa per Windows è il percorso desktop più semplice. Sono supportati anche il programma di installazione PowerShell e i percorsi Gateway WSL2. Vedi [Windows](/it/platforms/windows).
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
  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata ti accompagna nella scelta di un fornitore di modelli, nell’impostazione di una chiave API
    e nella configurazione del Gateway. QuickStart richiede di solito solo pochi minuti, ma
    accesso al fornitore, abbinamento del canale, installazione del demone, download di rete, Skills
    o Plugin opzionali possono rendere l’onboarding completo più lungo. Puoi saltare i passaggi opzionali
    e tornarci più tardi con `openclaw configure`.

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

    Questo apre la UI di controllo nel browser. Se si carica, tutto funziona.

  </Step>
  <Step title="Invia il tuo primo messaggio">
    Digita un messaggio nella chat della UI di controllo e dovresti ricevere una risposta AI.

    Vuoi invece chattare dal telefono? Il canale più veloce da configurare è
    [Telegram](/it/channels/telegram) (basta un token bot). Vedi [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata della UI di controllo">
  Se mantieni una build localizzata o personalizzata della dashboard, punta
  `gateway.controlUi.root` a una directory che contiene gli asset statici compilati
  e `index.html`.

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

Riavvia il Gateway e riapri la dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Cosa fare dopo

<Columns>
  <Card title="Connetti un canale" href="/it/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora.
  </Card>
  <Card title="Abbinamento e sicurezza" href="/it/channels/pairing" icon="shield">
    Controlla chi può inviare messaggi al tuo agente.
  </Card>
  <Card title="Configura il Gateway" href="/it/gateway/configuration" icon="settings">
    Modelli, strumenti, sandbox e impostazioni avanzate.
  </Card>
  <Card title="Sfoglia gli strumenti" href="/it/tools" icon="wrench">
    Browser, exec, ricerca web, Skills e Plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili d’ambiente">
  Se esegui OpenClaw come account di servizio o vuoi percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione dei percorsi interni
- `OPENCLAW_STATE_DIR` — sovrascrive la directory dello stato
- `OPENCLAW_CONFIG_PATH` — sovrascrive il percorso del file di configurazione

Riferimento completo: [Variabili d’ambiente](/it/help/environment).
</Accordion>

## Correlati

- [Panoramica dell’installazione](/it/install)
- [Panoramica dei canali](/it/channels)
- [Configurazione](/it/start/setup)
