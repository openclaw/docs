---
read_when:
    - Vuoi usare i modelli Tencent Hy con OpenClaw
    - Hai bisogno della configurazione della chiave API di TokenHub
summary: Configurazione di Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T08:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud viene distribuito come **plugin provider incluso** in OpenClaw. Fornisce accesso ai modelli Tencent Hy tramite l'endpoint TokenHub (`tencent-tokenhub`).

Il provider usa un'API compatibile con OpenAI.

## Avvio rapido

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider ed endpoint

| Provider           | Endpoint                      | Caso d'uso              |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy tramite Tencent TokenHub |

## Modelli disponibili

### tencent-tokenhub

- **hy3-preview** — Anteprima di Hy3 (contesto 256K, reasoning, predefinito)

## Note

- I riferimenti ai modelli TokenHub usano `tencent-tokenhub/<modelId>`.
- Il plugin include metadati incorporati per i prezzi a livelli di Hy3, quindi le stime dei costi vengono popolate senza override manuali dei prezzi.
- Sovrascrivi i metadati di prezzo e contesto in `models.providers` se necessario.

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `TOKENHUB_API_KEY`
sia disponibile per quel processo (per esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).

## Documentazione correlata

- [Configurazione di OpenClaw](/it/gateway/configuration)
- [Provider di modelli](/it/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
