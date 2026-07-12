---
read_when:
    - Configurazione iniziale da zero
    - Vuoi il modo più rapido per ottenere una chat funzionante
summary: Installa OpenClaw e avvia la tua prima chat in pochi minuti.
title: Per iniziare
x-i18n:
    generated_at: "2026-07-12T07:29:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Installa OpenClaw, esegui la procedura di onboarding e chatta con il tuo assistente IA in circa 5
minuti. Al termine avrai un Gateway in esecuzione, l'autenticazione configurata e una
sessione di chat funzionante.

## Cosa serve

- **Node.js 22.19+, 23.11+ o 24+** (24 è la versione predefinita consigliata)
- **Una chiave API** di un fornitore di modelli (Anthropic, OpenAI, Google, ecc.) — ti verrà richiesta durante l'onboarding

<Tip>
Controlla la versione di Node con `node --version`.
**Utenti Windows:** l'app Hub nativa per Windows è il modo più semplice per usare l'app desktop. Sono
supportati anche il programma di installazione PowerShell e i percorsi Gateway tramite WSL2. Consulta [Windows](/it/platforms/windows).
Devi installare Node? Consulta [Configurazione di Node](/it/install/node).
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
  alt="Procedura dello script di installazione"
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

    La procedura guidata ti accompagna nella scelta di un fornitore di modelli, nell'impostazione di una chiave API
    e nella configurazione del Gateway. L'avvio rapido richiede in genere solo pochi minuti, ma
    l'accesso al fornitore, l'associazione di un canale, l'installazione del demone, i download di rete, le Skills
    o i Plugin facoltativi possono prolungare l'intera procedura di onboarding. Salta i passaggi
    facoltativi e completali in seguito con `openclaw configure`.

    Per la documentazione completa, consulta [Onboarding (CLI)](/it/start/wizard).

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

    Questo comando apre l'interfaccia di controllo nel browser. Se viene caricata, tutto funziona correttamente.

  </Step>
  <Step title="Invia il tuo primo messaggio">
    Digita un messaggio nella chat dell'interfaccia di controllo e dovresti ricevere una risposta dall'IA.

    Preferisci chattare dal telefono? Il canale più rapido da configurare è
    [Telegram](/it/channels/telegram) (serve solo il token di un bot). Consulta [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata dell'interfaccia di controllo">
  Se mantieni una build localizzata o personalizzata della dashboard, imposta
  `gateway.controlUi.root` su una directory contenente le risorse statiche
  generate e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copia in questa directory i file statici generati.
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

Riavvia il Gateway e riapri la dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Passaggi successivi

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
  <Card title="Esplora gli strumenti" href="/it/tools" icon="wrench">
    Browser, esecuzione, ricerca sul Web, Skills e Plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili di ambiente">
  Se esegui OpenClaw con un account di servizio o desideri percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione dei percorsi interni
- `OPENCLAW_STATE_DIR` — sostituisce la directory dello stato
- `OPENCLAW_CONFIG_PATH` — sostituisce il percorso del file di configurazione

Documentazione completa: [Variabili di ambiente](/it/help/environment).
</Accordion>

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Panoramica dei canali](/it/channels)
- [Configurazione](/it/start/setup)
