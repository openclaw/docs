---
read_when:
    - Vuoi usare Hugging Face Inference con OpenClaw
    - Ti servono il token HF env var o la scelta di autenticazione CLI
summary: Configurazione di Hugging Face Inference (autenticazione + selezione del modello)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T14:01:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

Gli [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) offrono chat completions compatibili con OpenAI tramite una singola API router. Ottieni accesso a molti modelli (DeepSeek, Llama e altri) con un solo token. OpenClaw usa l'**endpoint compatibile con OpenAI** (solo chat completions); per text-to-image, embeddings o speech usa direttamente i [client di inferenza HF](https://huggingface.co/docs/api-inference/quicktour).

- Provider: `huggingface`
- Autenticazione: `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` (token a granularità fine con **Make calls to Inference Providers**)
- API: compatibile con OpenAI (`https://router.huggingface.co/v1`)
- Fatturazione: singolo token HF; i [prezzi](https://huggingface.co/docs/inference-providers/pricing) seguono le tariffe del provider con un piano gratuito.

## Avvio rapido

1. Crea un token a granularità fine in [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) con il permesso **Make calls to Inference Providers**.
2. Esegui l'onboarding e scegli **Hugging Face** nel menu a discesa del provider, quindi inserisci la tua chiave API quando richiesto:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Nel menu a discesa **Default Hugging Face model**, scegli il modello desiderato (l'elenco viene caricato dalla Inference API quando hai un token valido; altrimenti viene mostrato un elenco integrato). La tua scelta viene salvata come modello predefinito.
4. Puoi anche impostare o modificare il modello predefinito in seguito nella configurazione:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Questo imposterà `huggingface/deepseek-ai/DeepSeek-R1` come modello predefinito.

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`
siano disponibili per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).

## Rilevamento dei modelli e menu a discesa dell'onboarding

OpenClaw rileva i modelli chiamando direttamente l'**endpoint di inferenza**:

```bash
GET https://router.huggingface.co/v1/models
```

(Facoltativo: invia `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` o `$HF_TOKEN` per l'elenco completo; alcuni endpoint restituiscono un sottoinsieme senza autenticazione.) La risposta è nello stile OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Quando configuri una chiave API Hugging Face (tramite onboarding, `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`), OpenClaw usa questa GET per rilevare i modelli chat-completion disponibili. Durante la **configurazione interattiva**, dopo aver inserito il token, vedi un menu a discesa **Default Hugging Face model** popolato da quell'elenco (oppure dal catalogo integrato se la richiesta fallisce). A runtime (ad esempio all'avvio del Gateway), quando è presente una chiave, OpenClaw chiama di nuovo **GET** `https://router.huggingface.co/v1/models` per aggiornare il catalogo. L'elenco viene unito a un catalogo integrato (per metadati come finestra di contesto e costo). Se la richiesta fallisce o non è impostata alcuna chiave, viene usato solo il catalogo integrato.

## Nomi dei modelli e opzioni modificabili

- **Nome dall'API:** il nome visualizzato del modello viene **idrato da GET /v1/models** quando l'API restituisce `name`, `title` o `display_name`; altrimenti viene derivato dall'id del modello (ad esempio `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Sovrascrivi il nome visualizzato:** puoi impostare un'etichetta personalizzata per ogni modello nella configurazione, in modo che appaia come vuoi nella CLI e nella UI:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **Suffissi di policy:** la documentazione e gli helper integrati di OpenClaw per Hugging Face trattano attualmente questi due suffissi come varianti di policy integrate:
  - **`:fastest`** — throughput massimo.
  - **`:cheapest`** — costo più basso per token in output.

  Puoi aggiungerli come voci separate in `models.providers.huggingface.models` oppure impostare `model.primary` con il suffisso. Puoi anche impostare l'ordine predefinito del provider nelle [impostazioni di Inference Provider](https://hf.co/settings/inference-providers) (nessun suffisso = usa quell'ordine).

- **Merge della configurazione:** le voci esistenti in `models.providers.huggingface.models` (ad esempio in `models.json`) vengono mantenute quando la configurazione viene unita. Quindi qualsiasi `name`, `alias` o opzione di modello che imposti lì viene preservata.

## ID modello ed esempi di configurazione

I riferimenti ai modelli usano la forma `huggingface/<org>/<model>` (ID in stile Hub). L'elenco seguente proviene da **GET** `https://router.huggingface.co/v1/models`; il tuo catalogo potrebbe includerne altri.

**Esempi di ID (dall'endpoint di inferenza):**

| Modello               | Ref (prefisso con `huggingface/`)   |
| --------------------- | ----------------------------------- |
| DeepSeek R1           | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2         | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B              | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct   | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B             | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct| `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B          | `openai/gpt-oss-120b`               |
| GLM 4.7               | `zai-org/GLM-4.7`                   |
| Kimi K2.5             | `moonshotai/Kimi-K2.5`              |

Puoi aggiungere `:fastest` o `:cheapest` all'id del modello. Imposta l'ordine predefinito nelle [impostazioni di Inference Provider](https://hf.co/settings/inference-providers); vedi [Inference Providers](https://huggingface.co/docs/inference-providers) e **GET** `https://router.huggingface.co/v1/models` per l'elenco completo.

### Esempi completi di configurazione

**DeepSeek R1 primario con fallback Qwen:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen come predefinito, con varianti `:cheapest` e `:fastest`:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS con alias:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**Più modelli Qwen e DeepSeek con suffissi di policy:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
