---
read_when:
    - Vuoi usare Groq con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API o la scelta di autenticazione della CLI
summary: Configurazione di Groq (autenticazione + selezione del modello)
title: Groq
x-i18n:
    generated_at: "2026-05-02T08:31:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fornisce inferenza ultrarapida su modelli open-source
(Llama, Gemma, Mistral e altri) usando hardware LPU personalizzato. OpenClaw si connette
a Groq tramite la sua API compatibile con OpenAI.

| Proprietà | Valore            |
| -------- | ----------------- |
| Provider | `groq`            |
| Auth     | `GROQ_API_KEY`    |
| API      | Compatibile con OpenAI |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API su [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Imposta la chiave API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Esempio di file di configurazione

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Catalogo integrato

OpenClaw include un catalogo Groq basato su manifest per un elenco rapido dei modelli
filtrato per provider. Esegui `openclaw models list --all --provider groq` per vedere le righe
incluse, oppure consulta
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modello                     | Note                               |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Uso generico, contesto ampio       |
| **Llama 3.1 8B Instant**    | Veloce, leggero                    |
| **Gemma 2 9B**              | Compatto, efficiente               |
| **Mixtral 8x7B**            | Architettura MoE, ragionamento solido |

<Tip>
Usa `openclaw models list --all --provider groq` per le righe Groq basate su manifest
note a questa versione di OpenClaw.
</Tip>

## Modelli di ragionamento

OpenClaw mappa i suoi livelli `/think` condivisi ai valori `reasoning_effort`
specifici del modello di Groq. Per `qwen/qwen3-32b`, il ragionamento disattivato invia
`none` e il ragionamento attivato invia `default`. Per i modelli di ragionamento Groq GPT-OSS,
OpenClaw invia `low`, `medium` o `high`; il ragionamento disattivato omette
`reasoning_effort` perché quei modelli non supportano un valore disattivato.

## Trascrizione audio

Groq fornisce anche una trascrizione audio veloce basata su Whisper. Quando è configurato come
provider di comprensione multimediale, OpenClaw usa il modello `whisper-large-v3-turbo`
di Groq per trascrivere i messaggi vocali tramite la superficie condivisa `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Dettagli della trascrizione audio">
    | Proprietà | Valore |
    |----------|-------|
    | Percorso di configurazione condiviso | `tools.media.audio` |
    | URL di base predefinito | `https://api.groq.com/openai/v1` |
    | Modello predefinito | `whisper-large-v3-turbo` |
    | Endpoint API | Compatibile con OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GROQ_API_KEY` sia
    disponibile per quel processo (ad esempio, in `~/.openclaw/.env` o tramite
    `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella tua shell interattiva non sono visibili ai processi
    gateway gestiti da daemon. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per
    una disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento alla configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni di provider e audio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dashboard Groq, documentazione API e prezzi.
  </Card>
  <Card title="Elenco dei modelli Groq" href="https://console.groq.com/docs/models" icon="list">
    Catalogo ufficiale dei modelli Groq.
  </Card>
</CardGroup>
