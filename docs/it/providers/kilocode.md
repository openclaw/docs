---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Vuoi eseguire modelli tramite Kilo Gateway in OpenClaw
summary: Usa l'API unificata di Kilo Gateway per accedere a molti modelli in OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:07:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL base.

| Proprietà | Valore                             |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Autenticazione | `KILOCODE_API_KEY`          |
| API      | Compatibile con OpenAI             |
| URL base | `https://api.kilo.ai/api/gateway/` |

## Installa il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Introduzione

<Steps>
  <Step title="Crea un account">
    Vai su [app.kilo.ai](https://app.kilo.ai), accedi o crea un account, quindi passa a API Keys e genera una nuova chiave.
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Oppure imposta direttamente la variabile d'ambiente:

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
gestito dal provider e amministrato da Kilo Gateway.

<Note>
OpenClaw tratta `kilocode/kilo/auto` come riferimento predefinito stabile, ma non
pubblica una mappatura, supportata da fonti, tra attività e modello upstream per quella route. L'esatto
instradamento upstream dietro `kilocode/kilo/auto` è di proprietà di Kilo Gateway, non
codificato in modo rigido in OpenClaw.
</Note>

## Catalogo integrato

OpenClaw rileva dinamicamente i modelli disponibili da Kilo Gateway all'avvio. Usa
`/models kilocode` per vedere l'elenco completo dei modelli disponibili con il tuo account.

Qualsiasi modello disponibile sul gateway può essere usato con il prefisso `kilocode/`:

| Riferimento modello                     | Note                               |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Predefinito — instradamento intelligente |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic tramite Kilo             |
| `kilocode/openai/gpt-5.5`                | OpenAI tramite Kilo                |
| `kilocode/google/gemini-3.1-pro-preview` | Google tramite Kilo                |
| ...e molti altri                         | Usa `/models kilocode` per elencarli tutti |

<Tip>
All'avvio, OpenClaw interroga `GET https://api.kilo.ai/api/gateway/models` e unisce
i modelli rilevati prima del catalogo statico di fallback. Il fallback statico include sempre
`kilocode/kilo/auto` (`Kilo Auto`) con `input: ["text", "image"]`,
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
    Kilo Gateway è documentato nel sorgente come compatibile con OpenRouter, quindi resta sul
    percorso in stile proxy compatibile con OpenAI invece della modellazione nativa delle richieste OpenAI.

    - I riferimenti Kilo basati su Gemini restano sul percorso proxy-Gemini, quindi OpenClaw mantiene
      lì la sanificazione delle firme di pensiero Gemini senza abilitare la convalida nativa della
      riproduzione Gemini o riscritture di bootstrap.
    - Kilo Gateway usa internamente un token Bearer con la tua chiave API.

  </Accordion>

  <Accordion title="Wrapper di stream e ragionamento">
    Il wrapper di stream condiviso di Kilo aggiunge l'header dell'app del provider e normalizza
    i payload di ragionamento proxy per i riferimenti a modelli concreti supportati.

    <Warning>
    `kilocode/kilo/auto` e altri suggerimenti proxy non supportati dal ragionamento saltano l'iniezione del ragionamento.
    Se hai bisogno del supporto al ragionamento, usa un riferimento a un modello concreto come
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se il rilevamento dei modelli fallisce all'avvio, OpenClaw ripiega sul catalogo statico contenente `kilocode/kilo/auto`.
    - Conferma che la tua chiave API sia valida e che il tuo account Kilo abbia i modelli desiderati abilitati.
    - Quando Gateway viene eseguito come demone, assicurati che `KILOCODE_API_KEY` sia disponibile per quel processo (per esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard di Kilo Gateway, chiavi API e gestione dell'account.
  </Card>
</CardGroup>
