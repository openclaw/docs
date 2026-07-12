---
read_when:
    - Vuoi utilizzare Groq con OpenClaw
    - È necessaria la variabile d’ambiente della chiave API o la scelta di autenticazione della CLI
    - Stai configurando la trascrizione audio Whisper su Groq
summary: Configurazione di Groq (autenticazione + selezione del modello + trascrizione con Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T07:24:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) offre inferenza ultra-rapida su modelli con pesi aperti (Llama, Gemma, Kimi, Qwen, GPT OSS e altri) mediante hardware LPU personalizzato. Il Plugin Groq registra sia un provider di chat compatibile con OpenAI sia un provider per la comprensione di contenuti multimediali audio.

| Proprietà                       | Valore                                   |
| ------------------------------- | ---------------------------------------- |
| ID del provider                 | `groq`                                   |
| Plugin                          | pacchetto esterno ufficiale              |
| Variabile di ambiente di autenticazione | `GROQ_API_KEY`                  |
| API                             | compatibile con OpenAI (`openai-completions`) |
| URL di base                     | `https://api.groq.com/openai/v1`         |
| Trascrizione audio              | `whisper-large-v3-turbo` (predefinito)   |
| Modello di chat predefinito consigliato | `groq/llama-3.3-70b-versatile`   |

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Introduzione

<Steps>
  <Step title="Ottenere una chiave API">
    Crea una chiave API all'indirizzo [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Impostare la chiave API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Impostare un modello predefinito">
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
  <Step title="Verificare che il catalogo sia raggiungibile">
    ```bash
    openclaw models list --provider groq
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

OpenClaw include un catalogo Groq basato su manifest con voci sia per modelli di ragionamento sia per modelli senza ragionamento. Esegui `openclaw models list --provider groq` per visualizzare le righe statiche relative alla versione installata oppure consulta [console.groq.com/docs/models](https://console.groq.com/docs/models) per l'elenco ufficiale di Groq.

| Riferimento del modello                           | Nome                    | Ragionamento | Input          | Contesto |
| ------------------------------------------------- | ----------------------- | ------------ | -------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | no           | testo          | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | no           | testo          | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | no           | testo + immagine | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | sì           | testo          | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | sì           | testo          | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | sì           | testo          | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | sì           | testo          | 131,072  |
| `groq/groq/compound`                             | Compound                | sì           | testo          | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | sì           | testo          | 131,072  |

<Tip>
  Il catalogo si evolve con ogni versione di OpenClaw. `openclaw models list --provider groq` mostra le righe note alla versione installata; confrontale con [console.groq.com/docs/models](https://console.groq.com/docs/models) per individuare modelli aggiunti di recente o deprecati.
</Tip>

## Modelli di ragionamento

I modelli di ragionamento Groq (`reasoning: true` nella tabella precedente) associano i livelli condivisi di `/think` di OpenClaw ai valori `low`, `medium` o `high` di `reasoning_effort`. `/think off` o `/think none` omette `reasoning_effort` dalla richiesta anziché inviare un valore disabilitato.

Consulta [Modalità di ragionamento](/it/tools/thinking) per informazioni sui livelli condivisi di `/think` e su come OpenClaw li traduce per ciascun provider.

## Trascrizione audio

Il Plugin Groq registra anche un **provider per la comprensione di contenuti multimediali audio**, consentendo di trascrivere i messaggi vocali tramite l'interfaccia condivisa `tools.media.audio`.

| Proprietà                          | Valore                                    |
| ---------------------------------- | ----------------------------------------- |
| Percorso di configurazione condiviso | `tools.media.audio`                      |
| URL di base predefinito            | `https://api.groq.com/openai/v1`          |
| Modello predefinito                | `whisper-large-v3-turbo`                  |
| Priorità automatica                | 20                                        |
| Endpoint API                       | `/audio/transcriptions` compatibile con OpenAI |

Per rendere Groq il backend audio predefinito:

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
  <Accordion title="Disponibilità dell'ambiente per il daemon">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), `GROQ_API_KEY` deve essere visibile a tale processo, non soltanto alla shell interattiva.

    <Warning>
      Una chiave esportata esclusivamente in una shell interattiva non sarà disponibile a un daemon launchd o systemd, a meno che l'ambiente non venga importato anche in tale servizio. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per renderla leggibile dal processo del Gateway.
    </Warning>

  </Accordion>

  <Accordion title="ID personalizzati dei modelli Groq">
    OpenClaw accetta in fase di esecuzione qualsiasi ID di modello Groq. Usa l'ID esatto indicato da Groq e anteponi `groq/`. Il catalogo statico copre i casi comuni; gli ID non presenti nel catalogo utilizzano il modello compatibile con OpenAI predefinito.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Modalità di ragionamento" href="/it/tools/thinking" icon="brain">
    Livelli di intensità del ragionamento e interazione con i criteri del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni del provider e dell'audio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dashboard, documentazione API e prezzi di Groq.
  </Card>
</CardGroup>
