---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite Kilo Gateway in OpenClaw
summary: Usa l'API unificata di Kilo Gateway per accedere a numerosi modelli in OpenClaw
title: Gateway Kilo
x-i18n:
    generated_at: "2026-07-12T07:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway instrada le richieste verso numerosi modelli tramite un unico endpoint compatibile con OpenAI e un'unica chiave API.

| Proprietà | Valore                             |
| --------- | ---------------------------------- |
| Provider  | `kilocode`                         |
| Autenticazione | `KILOCODE_API_KEY`            |
| API       | Compatibile con OpenAI             |
| URL di base | `https://api.kilo.ai/api/gateway/` |

## Installare il plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Configurazione

<Steps>
  <Step title="Creare un account">
    Vai su [app.kilo.ai](https://app.kilo.ai), accedi o crea un account, quindi genera una chiave API.
  </Step>
  <Step title="Eseguire la configurazione iniziale">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    In alternativa, imposta direttamente la variabile di ambiente:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verificare che il modello sia disponibile">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modello predefinito e catalogo

Il modello predefinito è `kilocode/kilo/auto`, un modello di instradamento intelligente gestito dal provider. OpenClaw non
pubblica una mappatura tra attività e modello upstream; l'instradamento sottostante a `kilo/auto` è gestito da Kilo Gateway.

All'avvio, OpenClaw interroga `GET https://api.kilo.ai/api/gateway/models` e inserisce i modelli individuati
prima di un catalogo statico di ripiego. Il catalogo statico di ripiego contiene solo `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

È possibile fare riferimento a qualsiasi modello del Gateway come `kilocode/<upstream-id>` (ad esempio
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Esegui `/models kilocode` oppure
`openclaw models list --provider kilocode` per visualizzare l'elenco completo dei modelli individuati.

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

## Note sul comportamento

<AccordionGroup>
  <Accordion title="Trasporto e compatibilità">
    Kilo Gateway è compatibile con OpenRouter, pertanto utilizza il percorso delle richieste compatibile con OpenAI
    in stile proxy anziché il formato nativo delle richieste OpenAI (senza `store` e senza payload OpenAI relativo all'intensità di ragionamento).

    - I riferimenti Kilo basati su Gemini rimangono sul percorso proxy-Gemini: OpenClaw corregge le firme
      di ragionamento Gemini in tale percorso, ma non abilita la convalida nativa della riproduzione Gemini né le riscritture di bootstrap.
    - Le richieste utilizzano un token Bearer creato a partire dalla chiave API.

  </Accordion>

  <Accordion title="Wrapper del flusso e ragionamento">
    Il wrapper del flusso Kilo aggiunge alle richieste l'intestazione `X-KILOCODE-FEATURE` (il valore predefinito è `openclaw`,
    modificabile tramite la variabile di ambiente `KILOCODE_FEATURE`) e normalizza i payload relativi all'intensità di ragionamento per
    i modelli che la supportano.

    <Warning>
    I riferimenti `kilocode/kilo/auto` e `x-ai/*` non prevedono l'inserimento dell'intensità di ragionamento. Se ti serve il supporto
    al ragionamento, utilizza il riferimento a un modello specifico, ad esempio `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se l'individuazione dei modelli non riesce all'avvio, OpenClaw utilizza il catalogo statico di ripiego contenente `kilocode/kilo/auto`.
    - Verifica che la chiave API sia valida e che i modelli desiderati siano abilitati nel tuo account Kilo.
    - Quando il Gateway viene eseguito come daemon, assicurati che `KILOCODE_API_KEY` sia disponibile per tale processo (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo per la configurazione di OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Pannello di controllo di Kilo Gateway, chiavi API e gestione dell'account.
  </Card>
</CardGroup>
