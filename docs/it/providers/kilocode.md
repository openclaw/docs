---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite Kilo Gateway in OpenClaw
summary: Usa l'API unificata di Kilo Gateway per accedere a molti modelli in OpenClaw
title: Gateway Kilo
x-i18n:
    generated_at: "2026-05-10T19:49:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway fornisce un'**API unificata** che instrada le richieste a molti modelli dietro un singolo
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

| Proprietà | Valore                             |
| -------- | ---------------------------------- |
| Fornitore | `kilocode`                         |
| Autenticazione | `KILOCODE_API_KEY`                 |
| API      | Compatibile con OpenAI             |
| URL di base | `https://api.kilo.ai/api/gateway/` |

## Per iniziare

<Steps>
  <Step title="Crea un account">
    Vai su [app.kilo.ai](https://app.kilo.ai), accedi o crea un account, quindi vai a Chiavi API e genera una nuova chiave.
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Oppure imposta direttamente la variabile di ambiente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modello predefinito

Il modello predefinito è `kilocode/kilo/auto`, un modello di instradamento intelligente
gestito dal fornitore e amministrato da Kilo Gateway.

<Note>
OpenClaw tratta `kilocode/kilo/auto` come riferimento predefinito stabile, ma non
pubblica una mappatura tra attività e modello upstream supportata da fonti per quella route. L'instradamento
upstream esatto dietro `kilocode/kilo/auto` è di competenza di Kilo Gateway, non è
codificato in OpenClaw.
</Note>

## Catalogo integrato

OpenClaw rileva dinamicamente i modelli disponibili da Kilo Gateway all'avvio. Usa
`/models kilocode` per vedere l'elenco completo dei modelli disponibili con il tuo account.

Qualsiasi modello disponibile sul Gateway può essere usato con il prefisso `kilocode/`:

| Riferimento modello                    | Note                               |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Predefinito — instradamento intelligente |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic tramite Kilo             |
| `kilocode/openai/gpt-5.5`                | OpenAI tramite Kilo                |
| `kilocode/google/gemini-3.1-pro-preview` | Google tramite Kilo                |
| ...e molti altri                         | Usa `/models kilocode` per elencarli tutti |

<Tip>
All'avvio, OpenClaw interroga `GET https://api.kilo.ai/api/gateway/models` e unisce
i modelli rilevati prima del catalogo di fallback statico. Il fallback incluso
include sempre `kilocode/kilo/auto` (`Kilo Auto`) con `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` e `maxTokens: 128000`.
</Tip>

## Esempio di configurazione

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Trasporto e compatibilità">
    Kilo Gateway è documentato nel codice sorgente come compatibile con OpenRouter, quindi rimane sul
    percorso proxy compatibile con OpenAI invece di usare la modellazione nativa delle richieste OpenAI.

    - I riferimenti Kilo basati su Gemini rimangono sul percorso proxy-Gemini, quindi OpenClaw mantiene
      lì la sanitizzazione delle firme di pensiero Gemini senza abilitare la
      validazione della riproduzione Gemini nativa o le riscritture bootstrap.
    - Kilo Gateway usa internamente un token Bearer con la tua chiave API.

  </Accordion>

  <Accordion title="Wrapper di stream e ragionamento">
    Il wrapper di stream condiviso di Kilo aggiunge l'header dell'app del fornitore e normalizza
    i payload di ragionamento proxy per i riferimenti a modelli concreti supportati.

    <Warning>
    `kilocode/kilo/auto` e altri suggerimenti proxy non supportati per il ragionamento saltano l'iniezione del ragionamento. Se hai bisogno del supporto al ragionamento, usa un riferimento a modello concreto come
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se il rilevamento dei modelli non riesce all'avvio, OpenClaw ripiega sul catalogo statico incluso contenente `kilocode/kilo/auto`.
    - Conferma che la tua chiave API sia valida e che il tuo account Kilo abbia i modelli desiderati abilitati.
    - Quando il Gateway viene eseguito come daemon, assicurati che `KILOCODE_API_KEY` sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei fornitori, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard, chiavi API e gestione dell'account di Kilo Gateway.
  </Card>
</CardGroup>
