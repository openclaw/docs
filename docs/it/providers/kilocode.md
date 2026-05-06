---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite Kilo Gateway in OpenClaw
summary: Usa l'API unificata di Kilo Gateway per accedere a molti modelli in OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T18:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway fornisce una **API unificata** che instrada le richieste a molti modelli dietro un unico
endpoint e una sola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l’URL di base.

| Proprietà | Valore                             |
| --------- | ---------------------------------- |
| Provider  | `kilocode`                         |
| Autenticazione | `KILOCODE_API_KEY`            |
| API       | Compatibile con OpenAI             |
| URL di base | `https://api.kilo.ai/api/gateway/` |

## Primi passi

<Steps>
  <Step title="Crea un account">
    Vai su [app.kilo.ai](https://app.kilo.ai), accedi o crea un account, quindi passa a Chiavi API e genera una nuova chiave.
  </Step>
  <Step title="Esegui l’onboarding">
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
di proprietà del provider e gestito da Kilo Gateway.

<Note>
OpenClaw considera `kilocode/kilo/auto` come il riferimento predefinito stabile, ma non
pubblica una mappatura, supportata da fonti, dalle attività al modello upstream per quella route. L’esatto
instradamento upstream dietro `kilocode/kilo/auto` è di proprietà di Kilo Gateway, non
codificato rigidamente in OpenClaw.
</Note>

## Catalogo integrato

OpenClaw rileva dinamicamente i modelli disponibili da Kilo Gateway all’avvio. Usa
`/models kilocode` per vedere l’elenco completo dei modelli disponibili con il tuo account.

Qualsiasi modello disponibile sul Gateway può essere usato con il prefisso `kilocode/`:

| Riferimento modello                    | Note                               |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Predefinito — instradamento intelligente |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic tramite Kilo             |
| `kilocode/openai/gpt-5.5`              | OpenAI tramite Kilo                |
| `kilocode/google/gemini-3-pro-preview` | Google tramite Kilo                |
| ...e molti altri                       | Usa `/models kilocode` per elencarli tutti |

<Tip>
All’avvio, OpenClaw interroga `GET https://api.kilo.ai/api/gateway/models` e unisce
i modelli rilevati prima del catalogo statico di fallback. Il fallback incluso
comprende sempre `kilocode/kilo/auto` (`Kilo Auto`) con `input: ["text", "image"]`,
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
    Kilo Gateway è documentato nel sorgente come compatibile con OpenRouter, quindi rimane sul
    percorso in stile proxy compatibile con OpenAI invece di usare la modellazione nativa delle richieste OpenAI.

    - I riferimenti Kilo basati su Gemini rimangono sul percorso proxy-Gemini, quindi OpenClaw mantiene
      lì la pulizia delle thought signature di Gemini senza abilitare la validazione nativa del replay Gemini
      o le riscritture di bootstrap.
    - Kilo Gateway usa internamente un token Bearer con la tua chiave API.

  </Accordion>

  <Accordion title="Wrapper di stream e reasoning">
    Il wrapper di stream condiviso di Kilo aggiunge l’intestazione dell’app del provider e normalizza
    i payload di proxy reasoning per i riferimenti di modelli concreti supportati.

    <Warning>
    `kilocode/kilo/auto` e altri hint senza supporto al proxy reasoning saltano l’iniezione del reasoning.
    Se hai bisogno del supporto al reasoning, usa un riferimento di modello concreto come
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se il rilevamento dei modelli non riesce all’avvio, OpenClaw ripiega sul catalogo statico incluso che contiene `kilocode/kilo/auto`.
    - Verifica che la tua chiave API sia valida e che nel tuo account Kilo siano abilitati i modelli desiderati.
    - Quando il Gateway viene eseguito come daemon, assicurati che `KILOCODE_API_KEY` sia disponibile per quel processo (per esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo alla configurazione di OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard, chiavi API e gestione dell’account di Kilo Gateway.
  </Card>
</CardGroup>
