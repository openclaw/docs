---
read_when:
    - Configurazione iniziale da zero
    - Si desidera il modo più rapido per ottenere una chat funzionante
summary: Installa OpenClaw e avvia la prima chat in pochi minuti.
title: Introduzione
x-i18n:
    generated_at: "2026-07-16T15:02:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Installa OpenClaw, esegui la procedura di onboarding e chatta con il tuo assistente IA in circa 5
minuti. Al termine, avrai un Gateway in esecuzione, l'autenticazione configurata e una
sessione di chat funzionante.

## Cosa serve

- **Node.js 22.22.3+, 24.15+ o 25.9+** (24 è la versione predefinita consigliata)
- **Una chiave API** di un fornitore di modelli (Anthropic, OpenAI, Google e così via) — verrà richiesta durante l'onboarding

<Tip>
Verifica la versione di Node con `node --version`.
**Utenti Windows:** l'app Hub nativa per Windows è la soluzione desktop più semplice. Sono
supportati anche il programma di installazione PowerShell e i percorsi Gateway WSL2. Consulta [Windows](/it/platforms/windows).
È necessario installare Node? Consulta [Configurazione di Node](/it/install/node).
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

    La procedura guidata consente di scegliere un fornitore di modelli, impostare una chiave API
    e configurare il Gateway. QuickStart richiede in genere solo pochi minuti, ma
    l'accesso al fornitore, l'associazione del canale, l'installazione del daemon, i download dalla rete, le Skills
    o i Plugin facoltativi possono prolungare l'onboarding completo. È possibile saltare i
    passaggi facoltativi e riprenderli in seguito con `openclaw configure`.

    Consulta [Onboarding (CLI)](/it/start/wizard) per il riferimento completo.

  </Step>
  <Step title="Verifica che il Gateway sia in esecuzione">
    ```bash
    openclaw gateway status
    ```

    Il Gateway dovrebbe risultare in ascolto sulla porta 18789.

  </Step>
  <Step title="Apri la dashboard">
    ```bash
    openclaw dashboard
    ```

    Questo comando apre l'interfaccia di controllo nel browser. Se viene caricata, tutto funziona correttamente.

  </Step>
  <Step title="Invia il primo messaggio">
    Digita un messaggio nella chat dell'interfaccia di controllo: dovresti ricevere una risposta dall'IA.

    Si preferisce chattare dal telefono? Il canale più rapido da configurare è
    [Telegram](/it/channels/telegram) (è sufficiente un token del bot). Consulta [Canali](/it/channels)
    per tutte le opzioni.

  </Step>
</Steps>

<Accordion title="Avanzato: monta una build personalizzata dell'interfaccia di controllo">
  Se si gestisce una build della dashboard localizzata o personalizzata, impostare
  `gateway.controlUi.root` su una directory contenente gli asset statici
  compilati e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copiare i file statici compilati in tale directory.
```

Quindi impostare:

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

Riavviare il Gateway e riaprire la dashboard:

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
    Controlla chi può inviare messaggi all'agente.
  </Card>
  <Card title="Configura il Gateway" href="/it/gateway/configuration" icon="settings">
    Modelli, strumenti, sandbox e impostazioni avanzate.
  </Card>
  <Card title="Esplora gli strumenti" href="/it/tools" icon="wrench">
    Browser, esecuzione di comandi, ricerca web, Skills e Plugin.
  </Card>
</Columns>

<Accordion title="Avanzato: variabili di ambiente">
  Se si esegue OpenClaw con un account di servizio o si desiderano percorsi personalizzati:

- `OPENCLAW_HOME` — directory home per la risoluzione interna dei percorsi
- `OPENCLAW_STATE_DIR` — sostituisce la directory dello stato
- `OPENCLAW_CONFIG_PATH` — sostituisce il percorso del file di configurazione

Riferimento completo: [Variabili di ambiente](/it/help/environment).
</Accordion>

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Panoramica dei canali](/it/channels)
- [Configurazione](/it/start/setup)
