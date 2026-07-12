---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem inferrs
    - Udostępniasz model Gemma lub inny model za pośrednictwem inferrs
    - Potrzebujesz dokładnych flag zgodności OpenClaw dla inferrs
summary: Uruchamianie OpenClaw za pośrednictwem inferrs (lokalnego serwera zgodnego z OpenAI)
title: Wnioskuje
x-i18n:
    generated_at: "2026-07-12T15:30:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) udostępnia lokalne modele za pośrednictwem interfejsu API `/v1` zgodnego z OpenAI. OpenClaw komunikuje się z nim przez ogólny adapter `openai-completions`.

| Właściwość                 | Wartość                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Identyfikator dostawcy     | `inferrs` (niestandardowy; konfiguracja w `models.providers.inferrs`)                        |
| Plugin                     | brak — nie jest to dołączony Plugin dostawcy OpenClaw                                       |
| Zmienna środowiskowa auth  | niewymagana; dowolna wartość zadziała, jeśli serwer inferrs nie wymaga uwierzytelniania      |
| API                        | zgodne z OpenAI (`openai-completions`)                                                       |
| Sugerowany bazowy adres URL | `http://127.0.0.1:8080/v1` (lub adres, pod którym nasłuchuje serwer inferrs)                 |

<Note>
  `inferrs` to niestandardowy, samodzielnie hostowany backend zgodny z OpenAI, a nie dedykowany Plugin dostawcy OpenClaw: konfiguruje się go w `models.providers.inferrs`, zamiast wybierać opcję uwierzytelniania podczas wdrażania. Informacje o dołączonym Pluginie z automatycznym wykrywaniem można znaleźć w sekcji [SGLang](/pl/providers/sglang) lub [vLLM](/pl/providers/vllm).
</Note>

## Pierwsze kroki

<Steps>
  <Step title="Uruchom inferrs z modelem">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Sprawdź, czy serwer jest osiągalny">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Dodaj wpis dostawcy OpenClaw">
    Dodaj jawny wpis dostawcy i ustaw go jako źródło domyślnego modelu. Zobacz poniższy przykład konfiguracji.
  </Step>
</Steps>

## Pełny przykład konfiguracji

Gemma 4 na lokalnym serwerze `inferrs`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Uruchamianie na żądanie

OpenClaw może samodzielnie uruchomić `inferrs` tylko po wybraniu modelu `inferrs/...`. Dodaj `localService` do tego samego wpisu dostawcy:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` musi być ścieżką bezwzględną. Uruchom `which inferrs` na hoście Gateway i użyj zwróconej ścieżki. Pełny opis pól: [Usługi modeli lokalnych](/pl/gateway/local-model-services).

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Dlaczego requiresStringContent ma znaczenie">
    Niektóre trasy Chat Completions w `inferrs` akceptują w `messages[].content` wyłącznie ciągi znaków, a nie ustrukturyzowane tablice części treści.

    <Warning>
    Jeśli uruchomienia OpenClaw kończą się błędem:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    ustaw `compat.requiresStringContent: true` we wpisie modelu. OpenClaw przed wysłaniem żądania spłaszczy wtedy części zawierające wyłącznie tekst do zwykłych ciągów znaków.
    </Warning>

  </Accordion>

  <Accordion title="Zastrzeżenie dotyczące Gemma i schematu narzędzi">
    Niektóre kombinacje `inferrs` i Gemma akceptują małe, bezpośrednie żądania `/v1/chat/completions`, ale nie obsługują pełnych tur środowiska wykonawczego agenta OpenClaw. Najpierw spróbuj wyłączyć powierzchnię schematu narzędzi:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Zmniejsza to obciążenie promptu w bardziej restrykcyjnych lokalnych backendach. Jeśli niewielkie bezpośrednie żądania nadal działają, ale zwykłe tury agenta OpenClaw wciąż powodują awarię wewnątrz `inferrs`, potraktuj to jako ograniczenie modelu lub serwera nadrzędnego, a nie problem warstwy transportowej OpenClaw.

  </Accordion>

  <Accordion title="Ręczny test podstawowy">
    Po skonfigurowaniu przetestuj obie warstwy:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Jeśli pierwsze polecenie działa, a drugie kończy się niepowodzeniem, zobacz poniższą sekcję Rozwiązywanie problemów.

  </Accordion>

  <Accordion title="Działanie w stylu serwera proxy">
    Ponieważ `inferrs` używa ogólnego adaptera `openai-completions` (a nie `openai-responses`), formatowanie żądań przeznaczone wyłącznie dla natywnego OpenAI nigdy nie jest stosowane: nie są wysyłane `service_tier`, `store` z Responses, wskazówki dotyczące pamięci podręcznej promptów ani formatowanie ładunku zgodności rozumowania OpenAI.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="curl /v1/models kończy się niepowodzeniem">
    `inferrs` nie działa, jest nieosiągalny albo nie jest powiązany ze skonfigurowanym hostem lub portem. Upewnij się, że serwer jest uruchomiony i nasłuchuje pod tym adresem.
  </Accordion>

  <Accordion title="messages[].content wymaga ciągu znaków">
    Ustaw `compat.requiresStringContent: true` we wpisie modelu (patrz wyżej).
  </Accordion>

  <Accordion title="Bezpośrednie wywołania /v1/chat/completions działają, ale openclaw infer model run kończy się niepowodzeniem">
    Ustaw `compat.supportsTools: false`, aby wyłączyć powierzchnię schematu narzędzi (zobacz powyższe zastrzeżenie dotyczące Gemma).
  </Accordion>

  <Accordion title="inferrs nadal ulega awarii podczas większych tur agenta">
    Jeśli błędy schematu zniknęły, ale `inferrs` nadal ulega awarii podczas większych tur agenta, potraktuj to jako ograniczenie nadrzędnego serwera `inferrs` lub modelu. Zmniejsz obciążenie promptu albo zmień backend lub model.
  </Accordion>
</AccordionGroup>

<Tip>
Ogólną pomoc znajdziesz w sekcjach [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Często zadawane pytania](/pl/help/faq).
</Tip>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Modele lokalne" href="/pl/gateway/local-models" icon="server">
    Uruchamianie OpenClaw z lokalnymi serwerami modeli.
  </Card>
  <Card title="Usługi modeli lokalnych" href="/pl/gateway/local-model-services" icon="play">
    Uruchamianie na żądanie lokalnych serwerów modeli dla skonfigurowanych dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów z Gateway" href="/pl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Diagnozowanie lokalnych backendów zgodnych z OpenAI, które przechodzą testy kontrolne, ale nie obsługują uruchomień agenta.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i działania przełączania awaryjnego.
  </Card>
</CardGroup>
