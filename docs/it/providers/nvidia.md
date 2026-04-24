---
read_when:
    - Vuoi usare modelli aperti gratuitamente in OpenClaw
    - Hai bisogno della configurazione di `NVIDIA_API_KEY`
summary: Usare l'API compatibile con OpenAI di NVIDIA in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T08:57:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA fornisce un'API compatibile con OpenAI su `https://integrate.api.nvidia.com/v1` per
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
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Imposta un modello NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Se passi `--token` invece della variabile env, il valore finisce nella cronologia della shell e
nell'output di `ps`. Quando possibile, preferisci la variabile d'ambiente `NVIDIA_API_KEY`.
</Warning>

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
| ------------------------------------------- | ---------------------------- | -------- | -------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b`  | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192          |
| `nvidia/moonshotai/kimi-k2.5`               | Kimi K2.5                    | 262,144  | 8,192          |
| `nvidia/minimaxai/minimax-m2.5`             | Minimax M2.5                 | 196,608  | 8,192          |
| `nvidia/z-ai/glm5`                          | GLM 5                        | 202,752  | 8,192          |

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento di auto-abilitazione">
    Il provider si abilita automaticamente quando è impostata la variabile d'ambiente `NVIDIA_API_KEY`.
    Non è richiesta alcuna configurazione esplicita del provider oltre alla chiave.
  </Accordion>

  <Accordion title="Catalogo e prezzi">
    Il catalogo incluso è statico. I costi hanno come valore predefinito `0` nel sorgente poiché NVIDIA
    attualmente offre accesso API gratuito per i modelli elencati.
  </Accordion>

  <Accordion title="Endpoint compatibile con OpenAI">
    NVIDIA usa l'endpoint standard completions `/v1`. Qualsiasi strumento compatibile con OpenAI
    dovrebbe funzionare subito con il base URL NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
I modelli NVIDIA sono attualmente gratuiti. Controlla
[build.nvidia.com](https://build.nvidia.com/) per la disponibilità più recente e
i dettagli sui rate limit.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
