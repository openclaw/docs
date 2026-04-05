---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T14:01:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando il base URL.

## Configurazione CLI

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Frammento di config

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Note

- I ref modello sono `openrouter/<provider>/<model>`.
- L'onboarding imposta come predefinito `openrouter/auto`. Passa in seguito a un modello concreto con
  `openclaw models set openrouter/<provider>/<model>`.
- Per ulteriori opzioni di modelli/provider, vedi [/concepts/model-providers](/concepts/model-providers).
- OpenRouter usa internamente un token Bearer con la tua chiave API.
- Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw
  aggiunge anche gli header di attribuzione dell'app documentati da OpenRouter:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw`, e
  `X-OpenRouter-Categories: cli-agent`.
- Sulle route OpenRouter verificate, anche i ref dei modelli Anthropic mantengono i
  marker `cache_control` specifici di Anthropic usati da OpenClaw per
  un migliore riutilizzo della prompt cache nei blocchi di prompt system/developer.
- Se ripunti il provider OpenRouter verso un altro proxy/base URL, OpenClaw
  non inietta quegli header specifici di OpenRouter né i marker di cache Anthropic.
- OpenRouter continua comunque a passare attraverso il percorso compatibile con OpenAI in stile proxy, quindi
  il model shaping nativo delle richieste solo OpenAI come `serviceTier`, `store` di Responses,
  i payload di compatibilità reasoning di OpenAI e i suggerimenti per la prompt cache non vengono inoltrati.
- I ref OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
  lì la sanitizzazione della thought-signature Gemini, ma non abilita la
  validazione replay Gemini nativa o le riscritture bootstrap.
- Sulle route supportate non `auto`, OpenClaw mappa il livello di thinking selezionato ai
  payload reasoning proxy di OpenRouter. Gli hint di modelli non supportati e
  `openrouter/auto` saltano quell'iniezione di reasoning.
- Se passi l'instradamento del provider OpenRouter sotto i parametri del modello, OpenClaw lo inoltra
  come metadati di instradamento OpenRouter prima che vengano eseguiti i wrapper stream condivisi.
