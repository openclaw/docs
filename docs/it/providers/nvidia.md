---
read_when:
    - Vuoi usare modelli aperti in OpenClaw gratuitamente
    - È necessario configurare NVIDIA_API_KEY
summary: Usa l'API compatibile con OpenAI di NVIDIA in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:25:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fornisce un'API compatibile con OpenAI all'indirizzo `https://integrate.api.nvidia.com/v1` per
modelli aperti gratuiti. Esegui l'autenticazione con una chiave API da
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

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
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Se passi `--nvidia-api-key` invece della variabile di ambiente, il valore finisce nella cronologia
della shell e nell'output di `ps`. Preferisci la variabile di ambiente `NVIDIA_API_KEY` quando
possibile.
</Warning>

Per la configurazione non interattiva, puoi anche passare direttamente la chiave:

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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Catalogo integrato

| Riferimento modello                        | Nome                         | Contesto | Output massimo |
| ------------------------------------------ | ---------------------------- | -------- | -------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192          |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192          |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192          |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento di abilitazione automatica">
    Il provider si abilita automaticamente quando la variabile di ambiente `NVIDIA_API_KEY` è impostata.
    Non è richiesta alcuna configurazione esplicita del provider oltre alla chiave.
  </Accordion>

  <Accordion title="Catalogo e prezzi">
    Il catalogo incluso è statico. I costi hanno valore predefinito `0` nel sorgente, poiché NVIDIA
    attualmente offre accesso API gratuito per i modelli elencati.
  </Accordion>

  <Accordion title="Endpoint compatibile con OpenAI">
    NVIDIA usa l'endpoint completions standard `/v1`. Qualsiasi strumento compatibile con OpenAI
    dovrebbe funzionare subito con l'URL di base NVIDIA.
  </Accordion>

  <Accordion title="Risposte lente dei provider personalizzati">
    Alcuni modelli personalizzati ospitati da NVIDIA possono richiedere più tempo del watchdog di inattività
    predefinito del modello prima di emettere il primo frammento di risposta. Per le voci di provider NVIDIA
    personalizzate, aumenta il timeout del provider invece di aumentare il timeout dell'intero runtime
    dell'agent:

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
I modelli NVIDIA sono attualmente gratuiti da usare. Consulta
[build.nvidia.com](https://build.nvidia.com/) per i dettagli più recenti su disponibilità e
limiti di frequenza.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento alla configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo alla configurazione per agent, modelli e provider.
  </Card>
</CardGroup>
