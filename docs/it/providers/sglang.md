---
read_when:
    - Vuoi eseguire OpenClaw contro un server SGLang locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con SGLang (server self-hosted compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T14:02:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang può servire modelli open-source tramite un'API HTTP **compatibile con OpenAI**.
OpenClaw può connettersi a SGLang usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da SGLang quando effettui l'opt-in
con `SGLANG_API_KEY` (qualsiasi valore funziona se il tuo server non impone autenticazione)
e non definisci una voce esplicita `models.providers.sglang`.

## Avvio rapido

1. Avvia SGLang con un server compatibile con OpenAI.

Il tuo URL di base dovrebbe esporre endpoint `/v1` (ad esempio `/v1/models`,
`/v1/chat/completions`). SGLang viene comunemente eseguito su:

- `http://127.0.0.1:30000/v1`

2. Effettua l'opt-in (qualsiasi valore funziona se non è configurata l'autenticazione):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Esegui l'onboarding e scegli `SGLang`, oppure imposta direttamente un modello:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Rilevamento dei modelli (provider implicito)

Quando `SGLANG_API_KEY` è impostato (oppure esiste un profilo di autenticazione) e **non**
definisci `models.providers.sglang`, OpenClaw interrogherà:

- `GET http://127.0.0.1:30000/v1/models`

e convertirà gli ID restituiti in voci di modello.

Se imposti esplicitamente `models.providers.sglang`, il rilevamento automatico viene saltato e
devi definire manualmente i modelli.

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- SGLang è in esecuzione su un host/porta diversi.
- Vuoi fissare i valori `contextWindow`/`maxTokens`.
- Il tuo server richiede una vera chiave API (oppure vuoi controllare gli header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Troubleshooting

- Controlla che il server sia raggiungibile:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Se le richieste falliscono con errori di autenticazione, imposta una vera `SGLANG_API_KEY` che corrisponda
  alla configurazione del tuo server, oppure configura esplicitamente il provider sotto
  `models.providers.sglang`.

## Comportamento in stile proxy

SGLang viene trattato come un backend `/v1` in stile proxy compatibile con OpenAI, non come un
endpoint OpenAI nativo.

- il model shaping nativo delle richieste solo-OpenAI non si applica qui
- niente `service_tier`, niente `store` di Responses, niente suggerimenti di prompt-cache e nessun
  payload shaping di compatibilità OpenAI per il reasoning
- gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su URL base SGLang personalizzati
