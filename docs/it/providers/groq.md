---
read_when:
    - Vuoi usare Groq con OpenClaw
    - È necessaria la variabile di ambiente della chiave API o l'opzione di autenticazione della CLI
summary: Configurazione di Groq (autenticazione + selezione del modello)
title: Groq
x-i18n:
    generated_at: "2026-04-30T09:08:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) offre inferenza ultra-rapida su modelli open-source
(Llama, Gemma, Mistral e altri) usando hardware LPU personalizzato. OpenClaw si connette
a Groq tramite la sua API compatibile con OpenAI.

| Proprietà | Valore             |
| -------- | ----------------- |
| Provider | `groq`            |
| Auth     | `GROQ_API_KEY`    |
| API      | Compatibile con OpenAI |

## Primi passi

<Steps>
  <Step title="Get an API key">
    Crea una chiave API su [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
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

Il catalogo dei modelli di Groq cambia frequentemente. Esegui `openclaw models list | grep groq`
per vedere i modelli attualmente disponibili, oppure consulta
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modello                     | Note                               |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Uso generale, contesto ampio       |
| **Llama 3.1 8B Instant**    | Veloce, leggero                    |
| **Gemma 2 9B**              | Compatto, efficiente               |
| **Mixtral 8x7B**            | Architettura MoE, ragionamento robusto |

<Tip>
Usa `openclaw models list --provider groq` per l'elenco più aggiornato dei
modelli disponibili sul tuo account.
</Tip>

## Modelli di ragionamento

OpenClaw mappa i suoi livelli `/think` condivisi sui valori
`reasoning_effort` specifici del modello di Groq. Per `qwen/qwen3-32b`, il thinking disabilitato invia
`none` e il thinking abilitato invia `default`. Per i modelli di ragionamento GPT-OSS di Groq,
OpenClaw invia `low`, `medium` o `high`; il thinking disabilitato omette
`reasoning_effort` perché quei modelli non supportano un valore disabilitato.

## Trascrizione audio

Groq fornisce anche una trascrizione audio rapida basata su Whisper. Quando è configurato come
provider di comprensione dei media, OpenClaw usa il modello `whisper-large-v3-turbo`
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
  <Accordion title="Audio transcription details">
    | Proprietà | Valore |
    |----------|-------|
    | Percorso di configurazione condiviso | `tools.media.audio` |
    | URL base predefinito | `https://api.groq.com/openai/v1` |
    | Modello predefinito | `whisper-large-v3-turbo` |
    | Endpoint API | Compatibile con OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
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
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider e dell'audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dashboard di Groq, documentazione API e prezzi.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Catalogo ufficiale dei modelli Groq.
  </Card>
</CardGroup>
