---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem SGLang
    - Chcesz używać endpointów `/v1` zgodnych z OpenAI z własnymi modelami
summary: Uruchamianie OpenClaw z SGLang (samodzielnie hostowany serwer zgodny z OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T14:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang może udostępniać modele open source przez **interfejs HTTP zgodny z OpenAI**.
OpenClaw może łączyć się z SGLang przy użyciu API `openai-completions`.

OpenClaw może też **automatycznie wykrywać** dostępne modele z SGLang, gdy jawnie
to włączysz przez `SGLANG_API_KEY` (dowolna wartość działa, jeśli Twój serwer nie wymusza uwierzytelniania)
i nie zdefiniujesz jawnego wpisu `models.providers.sglang`.

## Szybki start

1. Uruchom SGLang z serwerem zgodnym z OpenAI.

Twój `baseUrl` powinien udostępniać endpointy `/v1` (na przykład `/v1/models`,
`/v1/chat/completions`). SGLang zwykle działa pod adresem:

- `http://127.0.0.1:30000/v1`

2. Włącz to jawnie (dowolna wartość działa, jeśli uwierzytelnianie nie jest skonfigurowane):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Uruchom onboarding i wybierz `SGLang` albo ustaw model bezpośrednio:

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

## Wykrywanie modeli (niejawny dostawca)

Gdy `SGLANG_API_KEY` jest ustawione (lub istnieje profil uwierzytelniania) i **nie**
zdefiniujesz `models.providers.sglang`, OpenClaw wykona zapytanie do:

- `GET http://127.0.0.1:30000/v1/models`

i przekształci zwrócone identyfikatory w wpisy modeli.

Jeśli jawnie ustawisz `models.providers.sglang`, automatyczne wykrywanie zostanie pominięte
i musisz zdefiniować modele ręcznie.

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- SGLang działa na innym hoście/porcie.
- Chcesz przypiąć wartości `contextWindow`/`maxTokens`.
- Twój serwer wymaga prawdziwego klucza API (albo chcesz kontrolować nagłówki).

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
            name: "Lokalny model SGLang",
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

## Rozwiązywanie problemów

- Sprawdź, czy serwer jest osiągalny:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwe `SGLANG_API_KEY` zgodne
  z konfiguracją Twojego serwera albo skonfiguruj dostawcę jawnie w
  `models.providers.sglang`.

## Zachowanie w stylu proxy

SGLang jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie
natywny endpoint OpenAI.

- nie stosuje się tutaj kształtowania żądań wyłącznie dla natywnego OpenAI
- brak `service_tier`, brak `store` z Responses, brak hintów cache promptu i brak
  kształtowania payloadu zgodności reasoning dla OpenAI
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane do niestandardowych `baseUrl` SGLang
