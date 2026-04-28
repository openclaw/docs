---
read_when:
    - Vuoi una singola chiave API per molti LLMs
    - Vuoi eseguire modelli tramite Kilo Gateway in OpenClaw
summary: Usa l'API unificata di Kilo Gateway per accedere a molti modelli in OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T08:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando la base URL.

| Proprietà | Valore                             |
| --------- | ---------------------------------- |
| Provider  | `kilocode`                         |
| Auth      | `KILOCODE_API_KEY`                 |
| API       | Compatibile con OpenAI             |
| URL base  | `https://api.kilo.ai/api/gateway/` |

## Per iniziare

<Steps>
  <Step title="Crea un account">
    Vai su [app.kilo.ai](https://app.kilo.ai), accedi o crea un account, poi vai su API Keys e genera una nuova chiave.
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

Il modello predefinito è `kilocode/kilo/auto`, un modello di smart-routing posseduto dal provider
e gestito da Kilo Gateway.

<Note>
OpenClaw tratta `kilocode/kilo/auto` come riferimento predefinito stabile, ma non
pubblica una mappatura supportata dalla sorgente tra attività e modello upstream per quel percorso. L'instradamento esatto
upstream dietro `kilocode/kilo/auto` è gestito da Kilo Gateway, non
hard-coded in OpenClaw.
</Note>

## Catalogo integrato

OpenClaw scopre dinamicamente i modelli disponibili dal Kilo Gateway all'avvio. Usa
`/models kilocode` per vedere l'elenco completo dei modelli disponibili con il tuo account.

Qualsiasi modello disponibile sul gateway può essere usato con il prefisso `kilocode/`:

| Riferimento modello                      | Note                               |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Predefinito — smart routing        |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic tramite Kilo             |
| `kilocode/openai/gpt-5.5`                | OpenAI tramite Kilo                |
| `kilocode/google/gemini-3-pro-preview`   | Google tramite Kilo                |
| ...e molti altri                         | Usa `/models kilocode` per elencarli tutti |

<Tip>
All'avvio, OpenClaw interroga `GET https://api.kilo.ai/api/gateway/models` e unisce
i modelli rilevati prima del catalogo statico di fallback. Il fallback bundled include sempre
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
    percorso in stile proxy compatibile con OpenAI anziché usare il request shaping nativo di OpenAI.

    - I riferimenti Kilo basati su Gemini restano sul percorso proxy-Gemini, quindi OpenClaw mantiene
      lì la sanificazione della thought-signature di Gemini senza abilitare la
      validazione replay nativa di Gemini o le riscritture bootstrap.
    - Kilo Gateway usa internamente un token Bearer con la tua chiave API.

  </Accordion>

  <Accordion title="Wrapper dello stream e reasoning">
    Il wrapper di stream condiviso di Kilo aggiunge l'header dell'app del provider e normalizza
    i payload di reasoning del proxy per i riferimenti di modello concreti supportati.

    <Warning>
    `kilocode/kilo/auto` e altri hint che non supportano il proxy-reasoning saltano l'iniezione del reasoning.
    Se ti serve il supporto al reasoning, usa un riferimento di modello concreto come
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se il rilevamento del modello fallisce all'avvio, OpenClaw usa come fallback il catalogo statico bundled che contiene `kilocode/kilo/auto`.
    - Conferma che la tua chiave API sia valida e che il tuo account Kilo abbia abilitati i modelli desiderati.
    - Quando il Gateway viene eseguito come demone, assicurati che `KILOCODE_API_KEY` sia disponibile a quel processo (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard di Kilo Gateway, chiavi API e gestione dell'account.
  </Card>
</CardGroup>
