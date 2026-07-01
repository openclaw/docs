---
read_when:
    - Vuoi usare modelli aperti in OpenClaw gratuitamente
    - Devi configurare NVIDIA_API_KEY
    - Vuoi usare Nemotron 3 Ultra tramite NVIDIA
summary: Usa l'API compatibile con OpenAI di NVIDIA in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:24:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fornisce un'API compatibile con OpenAI all'indirizzo `https://integrate.api.nvidia.com/v1` per
modelli aperti gratuitamente. Esegui l'autenticazione con una chiave API da
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
imposta per impostazione predefinita il provider NVIDIA su Nemotron 3 Ultra, il modello di reasoning attivo di NVIDIA da 550B totali / 55B
per lavoro agentico con contesto lungo.

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Esporta la chiave ed esegui l'onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Imposta un modello NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Se passi `--nvidia-api-key` invece della variabile d'ambiente, il valore finisce nella cronologia della shell
e nell'output di `ps`. Preferisci la variabile d'ambiente `NVIDIA_API_KEY` quando
possibile.
</Warning>

Per una configurazione non interattiva, puoi anche passare direttamente la chiave:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Esempio di configurazione

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Catalogo in evidenza

Quando è configurata una chiave API NVIDIA, i percorsi di configurazione e selezione del modello di OpenClaw
provano il catalogo pubblico dei modelli in evidenza di NVIDIA da
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` e
memorizzano nella cache il risultato classificato per 24 ore. I nuovi modelli in evidenza da build.nvidia.com
appaiono quindi nelle superfici di configurazione e selezione del modello senza attendere una
release di OpenClaw. Quando il feed live è disponibile, il primo modello restituito è
l'opzione predefinita mostrata durante la configurazione di NVIDIA.

Il recupero usa una policy host HTTPS fissa per `assets.ngc.nvidia.com`. Se non è
configurata alcuna chiave API NVIDIA, oppure se quel catalogo pubblico non è disponibile o
è malformato, OpenClaw ripiega sul catalogo incluso e sul valore predefinito incluso qui sotto.

## Nemotron 3 Ultra

Nemotron 3 Ultra è il modello NVIDIA predefinito in OpenClaw. La pagina build di NVIDIA per
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo elenca come endpoint gratuito disponibile con una specifica di contesto da 1M di token.
Il catalogo incluso registra un output massimo di 16.384 token per corrispondere all'attuale
richiesta di esempio compatibile con OpenAI di NVIDIA per l'endpoint ospitato.

Usa Ultra per il valore predefinito NVIDIA con le capacità più elevate. Mantieni selezionato Super quando
vuoi l'opzione Nemotron 3 più piccola, oppure scegli uno dei modelli di terze parti
ospitati nel catalogo di NVIDIA quando il loro contesto, latenza o comportamento si adattano meglio.
La riga Ultra inclusa invia `chat_template_kwargs.enable_thinking: false` e
`force_nonempty_content: true` per impostazione predefinita, così l'output normale della chat resta nella
risposta visibile invece di esporre testo di reasoning.

## Catalogo di fallback incluso

| Model ref                                  | Nome                         | Contesto  | Output massimo | Note                                          |
| ------------------------------------------ | ---------------------------- | --------- | -------------- | --------------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384         | Predefinito                                   |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192          | Fallback in evidenza                          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192          | Fallback in evidenza                          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192          | Fallback in evidenza                          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192          | Fallback in evidenza                          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192          | Obsoleto, compatibilità di upgrade            |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192          | Obsoleto, compatibilità di upgrade            |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento di abilitazione automatica">
    Il provider si abilita automaticamente quando la variabile d'ambiente `NVIDIA_API_KEY` è impostata.
    Non è richiesta alcuna configurazione esplicita del provider oltre alla chiave.
  </Accordion>

  <Accordion title="Catalogo e prezzi">
    OpenClaw preferisce il catalogo pubblico dei modelli in evidenza di NVIDIA quando l'autenticazione NVIDIA è
    configurata e lo memorizza nella cache per 24 ore. Il catalogo di fallback incluso è statico
    e mantiene i ref distribuiti obsoleti per la compatibilità di upgrade. I costi hanno valore predefinito
    `0` nel sorgente poiché NVIDIA attualmente offre accesso API gratuito per i
    modelli elencati.
  </Accordion>

  <Accordion title="Endpoint compatibile con OpenAI">
    NVIDIA usa l'endpoint standard `/v1` completions. Qualsiasi tooling compatibile con OpenAI
    dovrebbe funzionare subito con l'URL di base NVIDIA.
  </Accordion>

  <Accordion title="Parametri di reasoning di Nemotron 3 Ultra">
    La richiesta di esempio Ultra di NVIDIA usa `chat_template_kwargs.enable_thinking`
    e `reasoning_budget` per l'output di reasoning. La riga Ultra inclusa in OpenClaw
    disabilita per impostazione predefinita il thinking del template per l'uso normale della chat. Se devi
    abilitare l'output di reasoning NVIDIA o forzare altri campi di richiesta specifici di NVIDIA,
    imposta parametri per modello e mantieni gli override specifici del provider limitati
    al modello NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` è l'override finale del corpo della richiesta compatibile con OpenAI, quindi
    usalo solo per campi che NVIDIA documenta per l'endpoint selezionato.

  </Accordion>

  <Accordion title="Risposte lente del provider personalizzato">
    Alcuni modelli personalizzati ospitati da NVIDIA possono richiedere più tempo del watchdog di inattività
    predefinito del modello prima di emettere il primo chunk di risposta. Per voci di provider NVIDIA
    personalizzate, aumenta il timeout del provider invece di aumentare il timeout dell'intero runtime
    dell'agente:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
I modelli NVIDIA sono attualmente gratuiti da usare. Controlla
[build.nvidia.com](https://build.nvidia.com/) per i dettagli più recenti su disponibilità e
limiti di frequenza.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo di configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
