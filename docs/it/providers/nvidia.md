---
read_when:
    - Vuoi usare modelli aperti in OpenClaw gratuitamente
    - È necessario configurare NVIDIA_API_KEY
summary: Usa l'API compatibile con OpenAI di NVIDIA in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T09:09:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fornisce un’API compatibile con OpenAI all’indirizzo `https://integrate.api.nvidia.com/v1` per
modelli aperti gratuitamente. Esegui l’autenticazione con una chiave API da
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Per iniziare

<Steps>
  <Step title="Get your API key">
    Crea una chiave API su [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Se passi `--nvidia-api-key` invece della variabile di ambiente, il valore finisce nella cronologia
della shell e nell’output di `ps`. Preferisci la variabile di ambiente `NVIDIA_API_KEY` quando
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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Catalogo integrato

| Riferimento modello                         | Nome                         | Contesto | Output massimo |
| ------------------------------------------ | ---------------------------- | -------- | -------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192          |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192          |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192          |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    Il provider si abilita automaticamente quando la variabile di ambiente `NVIDIA_API_KEY` è impostata.
    Non è richiesta alcuna configurazione esplicita del provider oltre alla chiave.
  </Accordion>

  <Accordion title="Catalog and pricing">
    Il catalogo incluso è statico. I costi sono impostati per impostazione predefinita su `0` nel sorgente, poiché NVIDIA
    attualmente offre accesso API gratuito per i modelli elencati.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA usa l’endpoint standard di completamento `/v1`. Qualsiasi strumento compatibile con OpenAI
    dovrebbe funzionare subito con l’URL di base NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
I modelli NVIDIA sono attualmente gratuiti. Controlla
[build.nvidia.com](https://build.nvidia.com/) per i dettagli più recenti su disponibilità e
limiti di frequenza.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
