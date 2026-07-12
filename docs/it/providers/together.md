---
read_when:
    - Vuoi usare Together AI con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API oppure la scelta di autenticazione della CLI
summary: Configurazione di Together AI (autenticazione + selezione del modello)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T07:27:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fornisce accesso ai principali modelli open source,
tra cui Llama, DeepSeek, Kimi e altri, tramite un'API unificata.
OpenClaw lo include come provider `together`.

| Proprietà | Valore                        |
| --------- | ----------------------------- |
| Provider  | `together`                    |
| Autenticazione | `TOGETHER_API_KEY`       |
| API       | Compatibile con OpenAI        |
| URL di base | `https://api.together.xyz/v1` |

## Introduzione

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API all'indirizzo
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Esegui la configurazione iniziale">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
La configurazione iniziale imposta `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
come modello predefinito.
</Note>

## Catalogo integrato

Il costo è espresso in USD per milione di token.

| Riferimento del modello                             | Nome                         | Input              | Contesto | Output massimo | Costo (input/output) | Note                         |
| -------------------------------------------------- | ---------------------------- | ------------------ | -------- | -------------- | -------------------- | ---------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | testo              | 131,072  | 8,192          | 0.88 / 0.88          | Modello predefinito          |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | testo, immagine    | 262,144  | 32,768         | 1.20 / 4.50          | Modello di ragionamento      |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | testo              | 512,000  | 8,192          | 2.10 / 4.40          | Modello di ragionamento      |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | testo              | 32,768   | 8,192          | 0.30 / 0.30          | Veloce, senza ragionamento   |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | testo              | 202,752  | 8,192          | 1.40 / 4.40          | Modello di ragionamento      |

## Generazione di video

Il plugin `together` incluso registra anche la generazione di video tramite lo
strumento condiviso `video_generate`.

| Proprietà                    | Valore                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Modello video predefinito    | `Wan-AI/Wan2.2-T2V-A14B`                                                                                            |
| Altri modelli                | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                              |
| Modalità                     | da testo a video; da immagine a video solo con `Wan-AI/Wan2.2-I2V-A14B` (una singola immagine di riferimento)       |
| Durata                       | 1-10 secondi                                                                                                         |
| Parametri supportati         | `size` (interpretato come `<width>x<height>`); `aspectRatio`/`resolution` non vengono letti                          |

Per utilizzare Together come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Consulta [Generazione di video](/it/tools/video-generation) per i parametri dello strumento condiviso,
la selezione del provider e il comportamento di failover.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che
    `TOGETHER_API_KEY` sia disponibile per tale processo (ad esempio, in
    `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella shell interattiva non sono visibili ai processi
    del Gateway gestiti come demoni. Utilizza la configurazione `~/.openclaw/.env` o
    `env.shellEnv` per garantirne la disponibilità permanente.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Verifica che la chiave funzioni: `openclaw models list --provider together`
    - Se i modelli non vengono visualizzati, verifica che la chiave API sia impostata
      nell'ambiente corretto per il processo del Gateway.
    - I riferimenti dei modelli usano il formato `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento condiviso di generazione video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni dei provider.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard, documentazione dell'API e prezzi di Together AI.
  </Card>
</CardGroup>
