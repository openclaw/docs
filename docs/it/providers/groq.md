---
read_when:
    - Vuoi usare Groq con OpenClaw
    - Ti servono la variabile env della chiave API o la scelta auth della CLI
summary: Configurazione di Groq (autenticazione + selezione del modello)
title: Groq
x-i18n:
    generated_at: "2026-04-24T08:56:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) fornisce inferenza ultra-rapida su modelli open-source
(Llama, Gemma, Mistral e altri) usando hardware LPU personalizzato. OpenClaw si collega
a Groq tramite la sua API compatibile con OpenAI.

| Proprietà | Valore |
| -------- | ----------------- |
| Provider | `groq` |
| Auth | `GROQ_API_KEY` |
| API | Compatibile con OpenAI |

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

Il catalogo dei modelli Groq cambia spesso. Esegui `openclaw models list | grep groq`
per vedere i modelli attualmente disponibili, oppure controlla
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modello | Note |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Uso generale, contesto ampio |
| **Llama 3.1 8B Instant** | Veloce, leggero |
| **Gemma 2 9B** | Compatto, efficiente |
| **Mixtral 8x7B** | Architettura MoE, reasoning solido |

<Tip>
Usa `openclaw models list --provider groq` per l'elenco più aggiornato dei
modelli disponibili sul tuo account.
</Tip>

## Trascrizione audio

Groq fornisce anche una rapida trascrizione audio basata su Whisper. Quando configurato come provider di
comprensione dei media, OpenClaw usa il modello `whisper-large-v3-turbo` di Groq
per trascrivere i messaggi vocali tramite la superficie condivisa `tools.media.audio`.

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
    | Base URL predefinito | `https://api.groq.com/openai/v1` |
    | Modello predefinito | `whisper-large-v3-turbo` |
    | Endpoint API | Compatibile con OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway è eseguito come daemon (launchd/systemd), assicurati che `GROQ_API_KEY` sia
    disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella tua shell interattiva non sono visibili ai
    processi gateway gestiti come daemon. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per
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
    Schema completo della configurazione, incluse le impostazioni del provider e dell'audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dashboard Groq, documentazione API e prezzi.
  </Card>
  <Card title="Elenco dei modelli Groq" href="https://console.groq.com/docs/models" icon="list">
    Catalogo ufficiale dei modelli Groq.
  </Card>
</CardGroup>
