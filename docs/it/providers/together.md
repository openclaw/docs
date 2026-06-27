---
read_when:
    - Vuoi usare Together AI con OpenClaw
    - È necessaria la variabile d’ambiente della chiave API o la scelta di autenticazione della CLI
summary: Configurazione di Together AI (autenticazione + selezione del modello)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:10:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fornisce accesso ai principali modelli open-source,
inclusi Llama, DeepSeek, Kimi e altri, tramite un'API unificata.

| Proprietà | Valore                        |
| -------- | ----------------------------- |
| Provider | `together`                    |
| Autenticazione | `TOGETHER_API_KEY`            |
| API      | compatibile con OpenAI        |
| URL di base | `https://api.together.xyz/v1` |

## Primi passi

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
Il preset di onboarding imposta
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` come modello predefinito.
</Note>

## Catalogo integrato

OpenClaw include questo catalogo Together in bundle:

| Rif. modello                                       | Nome                         | Input       | Contesto | Note                         |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ----------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | text        | 131,072 | Modello predefinito           |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | text, image | 262,144 | Modello di ragionamento Kimi  |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | text        | 512,000 | Modello testuale di ragionamento |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | text        | 32,768  | Modello testuale veloce       |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | text        | 202,752 | Modello testuale di ragionamento |

## Generazione video

Il Plugin `together` incluso in bundle registra anche la generazione video tramite lo
strumento condiviso `video_generate`.

| Proprietà            | Valore                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| Modello video predefinito | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Modalità             | text-to-video; riferimento a immagine singola solo con `Wan-AI/Wan2.2-I2V-A14B` |
| Parametri supportati | `aspectRatio`, `resolution`                                              |

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
Consulta [Generazione video](/it/tools/video-generation) per i parametri dello strumento condiviso,
la selezione del provider e il comportamento di failover.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
    `TOGETHER_API_KEY` sia disponibile per quel processo (ad esempio in
    `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella shell interattiva non sono visibili ai processi
    Gateway gestiti da daemon. Usa `~/.openclaw/.env` o la configurazione
    `env.shellEnv` per una disponibilità persistente.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Verifica che la tua chiave funzioni: `openclaw models list --provider together`
    - Se i modelli non compaiono, conferma che la chiave API sia impostata
      nell'ambiente corretto per il processo Gateway.
    - I riferimenti ai modelli usano la forma `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Regole del provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento condiviso per la generazione video e selezione del provider.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni del provider.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard di Together AI, documentazione API e prezzi.
  </Card>
</CardGroup>
