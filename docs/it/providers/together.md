---
read_when:
    - Vuoi usare Together AI con OpenClaw
    - Hai bisogno della variabile env della chiave API o della scelta auth CLI
summary: Configurazione di Together AI (auth + selezione del modello)
title: Together AI
x-i18n:
    generated_at: "2026-04-24T08:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai) fornisce accesso a importanti modelli open-source
inclusi Llama, DeepSeek, Kimi e altri tramite un'API unificata.

| Proprietà | Valore                        |
| --------- | ----------------------------- |
| Provider  | `together`                    |
| Auth      | `TOGETHER_API_KEY`            |
| API       | Compatibile con OpenAI        |
| URL base  | `https://api.together.xyz/v1` |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API su
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
Il preset di onboarding imposta `together/moonshotai/Kimi-K2.5` come modello
predefinito.
</Note>

## Catalogo integrato

OpenClaw distribuisce questo catalogo Together bundled:

| Riferimento modello                                          | Nome                                   | Input       | Contesto   | Note                             |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | Modello predefinito; reasoning abilitato |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | Modello testuale general-purpose |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Modello instruction veloce       |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodale                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodale                      |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | Modello testuale generale        |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | Modello di reasoning             |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | Modello testuale Kimi secondario |

## Generazione video

Il plugin bundled `together` registra anche la generazione video tramite lo
strumento condiviso `video_generate`.

| Proprietà            | Valore                                |
| -------------------- | ------------------------------------- |
| Modello video predefinito | `together/Wan-AI/Wan2.2-T2V-A14B` |
| Modalità             | text-to-video, riferimento con immagine singola |
| Parametri supportati | `aspectRatio`, `resolution`           |

Per usare Together come provider video predefinito:

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
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento,
la selezione del provider e il comportamento di failover.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che
    `TOGETHER_API_KEY` sia disponibile a quel processo (ad esempio in
    `~/.openclaw/.env` oppure tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella tua shell interattiva non sono visibili ai processi
    gateway gestiti come demone. Usa `~/.openclaw/.env` oppure la configurazione `env.shellEnv` per
    disponibilità persistente.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Verifica che la tua chiave funzioni: `openclaw models list --provider together`
    - Se i modelli non compaiono, conferma che la chiave API sia impostata nell'
      ambiente corretto per il tuo processo Gateway.
    - I riferimenti modello usano la forma `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento di generazione video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni del provider.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard Together AI, documentazione API e prezzi.
  </Card>
</CardGroup>
