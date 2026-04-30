---
read_when:
    - Vuoi usare Together AI con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API oppure la scelta di autenticazione della CLI
summary: Configurazione di Together AI (autenticazione + selezione del modello)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T09:10:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fornisce accesso ai principali
modelli open-source, inclusi Llama, DeepSeek, Kimi e altri, tramite un'API unificata.

| Proprietà | Valore                        |
| --------- | ----------------------------- |
| Provider  | `together`                    |
| Auth      | `TOGETHER_API_KEY`            |
| API       | compatibile con OpenAI        |
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

OpenClaw include questo catalogo Together in bundle:

| Riferimento modello                                         | Nome                                   | Input       | Contesto   | Note                                   |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | -------------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | testo, immagine | 262,144 | Modello predefinito; reasoning abilitato |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | testo       | 202,752    | Modello di testo general-purpose       |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | testo       | 131,072    | Modello di istruzioni veloce           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | testo, immagine | 10,000,000 | Multimodale                         |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | testo, immagine | 20,000,000 | Multimodale                         |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | testo       | 131,072    | Modello di testo generale              |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | testo       | 131,072    | Modello di reasoning                   |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | testo       | 262,144    | Modello di testo Kimi secondario       |

## Generazione video

Il Plugin `together` in bundle registra anche la generazione video tramite lo
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
Vedi [Generazione video](/it/tools/video-generation) per i parametri dello strumento condiviso,
la selezione del provider e il comportamento di failover.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
    `TOGETHER_API_KEY` sia disponibile per quel processo (ad esempio, in
    `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella tua shell interattiva non sono visibili ai
    processi gateway gestiti da daemon. Usa `~/.openclaw/.env` o la configurazione
    `env.shellEnv` per una disponibilità persistente.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Verifica che la tua chiave funzioni: `openclaw models list --provider together`
    - Se i modelli non vengono visualizzati, conferma che la chiave API sia impostata nell'ambiente
      corretto per il processo Gateway.
    - I riferimenti dei modelli usano la forma `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento condiviso di generazione video e selezione del provider.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard, documentazione API e prezzi di Together AI.
  </Card>
</CardGroup>
