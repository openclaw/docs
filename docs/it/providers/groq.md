---
read_when:
    - Vuoi usare Groq con OpenClaw
    - Hai bisogno della variabile d'ambiente della chiave API o della scelta di autenticazione CLI
    - Stai configurando la trascrizione audio Whisper su Groq
summary: Configurazione di Groq (autenticazione + selezione del modello + trascrizione Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:07:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fornisce inferenza ultra-rapida su modelli a pesi aperti (Llama, Gemma, Kimi, Qwen, GPT OSS e altri) usando hardware LPU personalizzato. Il Plugin Groq registra sia un provider di chat compatibile con OpenAI sia un provider di comprensione dei media audio.

| Proprietà              | Valore                                   |
| ---------------------- | ---------------------------------------- |
| ID provider            | `groq`                                   |
| Plugin                 | pacchetto esterno ufficiale              |
| Variabile env auth     | `GROQ_API_KEY`                           |
| API                    | compatibile con OpenAI (`openai-completions`) |
| URL di base            | `https://api.groq.com/openai/v1`         |
| Trascrizione audio     | `whisper-large-v3-turbo` (predefinito)   |
| Default chat suggerito | `groq/llama-3.3-70b-versatile`           |

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API su [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Imposta la chiave API">
    ```bash
export GROQ_API_KEY=gsk_...
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
  <Step title="Verifica che il catalogo sia raggiungibile">
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

OpenClaw include un catalogo Groq basato su manifest con voci sia con ragionamento sia senza ragionamento. Esegui `openclaw models list --provider groq` per vedere le righe statiche per la versione installata, oppure consulta [console.groq.com/docs/models](https://console.groq.com/docs/models) per l'elenco autorevole di Groq.

| Ref modello                                      | Nome                    | Ragionamento | Input        | Contesto |
| ------------------------------------------------ | ----------------------- | ------------ | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | no           | testo        | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | no           | testo        | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | no           | testo + immagine | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | sì           | testo        | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | sì           | testo        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | sì           | testo        | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | sì           | testo        | 131,072  |
| `groq/groq/compound`                             | Compound                | sì           | testo        | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | sì           | testo        | 131,072  |

<Tip>
  Il catalogo evolve con ogni release di OpenClaw. `openclaw models list --provider groq` mostra le righe note alla versione installata; verifica anche [console.groq.com/docs/models](https://console.groq.com/docs/models) per i modelli aggiunti di recente o deprecati.
</Tip>

## Modelli di ragionamento

OpenClaw mappa i suoi livelli condivisi di `/think` ai valori `reasoning_effort` specifici del modello di Groq:

- Per `qwen/qwen3-32b`, il pensiero disabilitato invia `none` e il pensiero abilitato invia `default`.
- Per i modelli di ragionamento Groq GPT OSS (`openai/gpt-oss-*`), OpenClaw invia `low`, `medium` o `high` in base al livello di `/think`. Il pensiero disabilitato omette `reasoning_effort` perché quei modelli non supportano un valore disabilitato.
- DeepSeek R1 Distill, Qwen QwQ e Compound usano la superficie di ragionamento nativa di Groq; `/think` controlla la visibilità, ma il modello ragiona sempre.

Consulta [Modalità di pensiero](/it/tools/thinking) per i livelli condivisi di `/think` e per come OpenClaw li traduce per ciascun provider.

## Trascrizione audio

Il Plugin Groq registra anche un **provider di comprensione dei media audio** in modo che i messaggi vocali possano essere trascritti tramite la superficie condivisa `tools.media.audio`.

| Proprietà                 | Valore                                    |
| ------------------------- | ----------------------------------------- |
| Percorso config condiviso | `tools.media.audio`                       |
| URL di base predefinito   | `https://api.groq.com/openai/v1`          |
| Modello predefinito       | `whisper-large-v3-turbo`                  |
| Priorità automatica       | 20                                        |
| Endpoint API              | compatibile con OpenAI `/audio/transcriptions` |

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
    Se Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), `GROQ_API_KEY` deve essere visibile a quel processo, non solo alla tua shell interattiva.

    <Warning>
      Una chiave esportata solo in una shell interattiva non aiuterà un daemon launchd o systemd, a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per renderla leggibile dal processo gateway.
    </Warning>

  </Accordion>

  <Accordion title="ID modello Groq personalizzati">
    OpenClaw accetta qualsiasi ID modello Groq in fase di runtime. Usa l'ID esatto mostrato da Groq e anteponi `groq/`. Il catalogo statico copre i casi comuni; gli ID non presenti nel catalogo ricadono sul template predefinito compatibile con OpenAI.

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

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, delle ref modello e del comportamento di failover.
  </Card>
  <Card title="Modalità di pensiero" href="/it/tools/thinking" icon="brain">
    Livelli di sforzo di ragionamento e interazione con la policy del provider.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse impostazioni di provider e audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dashboard Groq, documentazione API e prezzi.
  </Card>
</CardGroup>
