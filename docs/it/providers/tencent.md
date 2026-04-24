---
read_when:
    - Vuoi usare l’anteprima Tencent Hy3 con OpenClaw
    - Hai bisogno della configurazione della chiave API di TokenHub
summary: Configurazione di Tencent Cloud TokenHub per l’anteprima Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T08:58:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud viene distribuito come **Plugin provider incluso** in OpenClaw. Fornisce accesso all’anteprima Tencent Hy3 tramite l’endpoint TokenHub (`tencent-tokenhub`).

Il provider usa un’API OpenAI-compatible.

| Proprietà     | Valore                                     |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| Modello predefinito | `tencent-tokenhub/hy3-preview`       |
| Auth          | `TOKENHUB_API_KEY`                         |
| API           | Chat Completions OpenAI-compatible         |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| URL globale   | `https://tokenhub-intl.tencentmaas.com/v1` |

## Avvio rapido

<Steps>
  <Step title="Crea una chiave API TokenHub">
    Crea una chiave API in Tencent Cloud TokenHub. Se scegli un ambito di accesso limitato per la chiave, includi **Hy3 preview** nei modelli consentiti.
  </Step>
  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Verifica il modello">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configurazione non interattiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Riferimento modello               | Nome                   | Input | Contesto | Output max | Note                         |
| --------------------------------- | ---------------------- | ----- | -------- | ---------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview`    | Hy3 preview (TokenHub) | text  | 256,000  | 64,000     | Predefinito; ragionamento abilitato |

Hy3 preview è il grande modello linguistico MoE Hunyuan di Tencent per ragionamento, esecuzione di istruzioni con contesto lungo, codice e workflow agente. Gli esempi OpenAI-compatible di Tencent usano `hy3-preview` come ID modello e supportano il tool calling standard di chat-completions più `reasoning_effort`.

<Tip>
L’ID del modello è `hy3-preview`. Non confonderlo con i modelli Tencent `HY-3D-*`, che sono API di generazione 3D e non il modello chat OpenClaw configurato da questo provider.
</Tip>

## Override dell’endpoint

OpenClaw usa come predefinito l’endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent documenta anche un endpoint TokenHub internazionale:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Sostituisci l’endpoint solo quando il tuo account TokenHub o la tua regione lo richiedono.

## Note

- I riferimenti modello TokenHub usano `tencent-tokenhub/<modelId>`.
- Il catalogo incluso attualmente contiene `hy3-preview`.
- Il Plugin contrassegna Hy3 preview come capace di ragionamento e compatibile con l’uso in streaming.
- Il Plugin viene distribuito con metadati di prezzo Hy3 a livelli, quindi le stime di costo vengono popolate senza override manuali dei prezzi.
- Sostituisci metadati di prezzo, contesto o endpoint in `models.providers` solo quando necessario.

## Nota sull’ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `TOKENHUB_API_KEY`
sia disponibile per quel processo (per esempio in `~/.openclaw/.env` oppure tramite
`env.shellEnv`).

## Documentazione correlata

- [Configurazione OpenClaw](/it/gateway/configuration)
- [Provider di modelli](/it/concepts/model-providers)
- [Pagina prodotto Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Generazione testo Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Configurazione Tencent TokenHub Cline per Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Scheda modello Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
