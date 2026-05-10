---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem inferrs
    - Udostępniasz model Gemma lub inny model przez inferrs
    - Potrzebujesz dokładnych flag zgodności OpenClaw dla inferrs
summary: Uruchamianie OpenClaw przez inferrs (lokalny serwer zgodny z OpenAI)
title: Wnioskuje
x-i18n:
    generated_at: "2026-05-10T19:52:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) może udostępniać modele lokalne za API `/v1` zgodnym z OpenAI. OpenClaw współpracuje z `inferrs` przez ogólną ścieżkę `openai-completions`.

| Właściwość          | Wartość                                                           |
| ------------------ | ------------------------------------------------------------------ |
| Identyfikator dostawcy | `inferrs` (niestandardowy; skonfiguruj w `models.providers.inferrs`) |
| Plugin             | brak — `inferrs` nie jest dołączonym pluginem dostawcy OpenClaw    |
| Zmienna środowiskowa uwierzytelniania | Opcjonalna. Dowolna wartość działa, jeśli Twój serwer inferrs nie ma uwierzytelniania |
| API                | Zgodne z OpenAI (`openai-completions`)                             |
| Sugerowany bazowy URL | `http://127.0.0.1:8080/v1` (lub tam, gdzie działa Twój serwer inferrs) |

<Note>
  `inferrs` najlepiej obecnie traktować jako niestandardowy, samodzielnie hostowany backend zgodny z OpenAI, a nie dedykowany plugin dostawcy OpenClaw. Konfigurujesz go przez `models.providers.inferrs`, a nie przez flagę wyboru podczas onboardingu. Jeśli potrzebujesz prawdziwego dołączonego pluginu z automatycznym wykrywaniem, zobacz [SGLang](/pl/providers/sglang) lub [vLLM](/pl/providers/vllm).
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
    Dodaj jawny wpis dostawcy i skieruj na niego domyślny model. Zobacz pełny przykład konfiguracji poniżej.
  </Step>
</Steps>

## Pełny przykład konfiguracji

Ten przykład używa Gemma 4 na lokalnym serwerze `inferrs`.

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

Inferrs może być też uruchamiany przez OpenClaw tylko wtedy, gdy zostanie
wybrany model `inferrs/...`. Dodaj `localService` do tego samego wpisu dostawcy:

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

`command` musi być ścieżką bezwzględną. Użyj `which inferrs` na hoście Gateway i umieść tę
ścieżkę w konfiguracji. Pełny opis pól znajdziesz w
[Usługach modeli lokalnych](/pl/gateway/local-model-services).

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Dlaczego requiresStringContent ma znaczenie">
    Niektóre trasy Chat Completions w `inferrs` akceptują tylko ciąg znaków
    `messages[].content`, a nie strukturalne tablice części treści.

    <Warning>
    Jeśli uruchomienia OpenClaw kończą się błędem takim jak:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    ustaw `compat.requiresStringContent: true` we wpisie modelu.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw spłaszczy części treści zawierające czysty tekst do zwykłych ciągów znaków przed wysłaniem
    żądania.

  </Accordion>

  <Accordion title="Gemma i zastrzeżenie dotyczące schematu narzędzi">
    Niektóre obecne kombinacje `inferrs` + Gemma akceptują małe bezpośrednie
    żądania `/v1/chat/completions`, ale nadal zawodzą przy pełnych turach środowiska wykonawczego agenta OpenClaw.

    Jeśli tak się stanie, najpierw spróbuj tego:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    To wyłącza powierzchnię schematu narzędzi OpenClaw dla modelu i może zmniejszyć presję promptu
    na bardziej rygorystyczne lokalne backendy.

    Jeśli bardzo małe bezpośrednie żądania nadal działają, ale zwykłe tury agenta OpenClaw nadal
    kończą się awarią wewnątrz `inferrs`, pozostały problem zwykle dotyczy zachowania modelu lub serwera upstream,
    a nie warstwy transportowej OpenClaw.

  </Accordion>

  <Accordion title="Ręczny test smoke">
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

    Jeśli pierwsze polecenie działa, a drugie kończy się niepowodzeniem, sprawdź poniższą sekcję rozwiązywania problemów.

  </Accordion>

  <Accordion title="Zachowanie w stylu proxy">
    `inferrs` jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie jako
    natywny punkt końcowy OpenAI.

    - Natywne kształtowanie żądań tylko dla OpenAI nie ma tutaj zastosowania
    - Brak `service_tier`, brak Responses `store`, brak podpowiedzi prompt-cache i brak
      kształtowania payloadu zgodnego z rozumowaniem OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane dla niestandardowych bazowych URL `inferrs`

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="curl /v1/models kończy się niepowodzeniem">
    `inferrs` nie działa, jest nieosiągalny albo nie jest powiązany z oczekiwanym
    hostem/portem. Upewnij się, że serwer jest uruchomiony i nasłuchuje pod adresem, który
    skonfigurowano.
  </Accordion>

  <Accordion title="messages[].content oczekiwano ciągu znaków">
    Ustaw `compat.requiresStringContent: true` we wpisie modelu. Szczegóły znajdziesz w
    sekcji `requiresStringContent` powyżej.
  </Accordion>

  <Accordion title="Bezpośrednie wywołania /v1/chat/completions przechodzą, ale openclaw infer model run kończy się niepowodzeniem">
    Spróbuj ustawić `compat.supportsTools: false`, aby wyłączyć powierzchnię schematu narzędzi.
    Zobacz zastrzeżenie dotyczące schematu narzędzi Gemma powyżej.
  </Accordion>

  <Accordion title="inferrs nadal ulega awarii przy większych turach agenta">
    Jeśli OpenClaw nie otrzymuje już błędów schematu, ale `inferrs` nadal ulega awarii przy większych
    turach agenta, potraktuj to jako ograniczenie upstream `inferrs` lub modelu. Zmniejsz
    presję promptu albo przełącz się na inny lokalny backend lub model.
  </Accordion>
</AccordionGroup>

<Tip>
Ogólną pomoc znajdziesz w [Rozwiązywaniu problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Modele lokalne" href="/pl/gateway/local-models" icon="server">
    Uruchamianie OpenClaw z lokalnymi serwerami modeli.
  </Card>
  <Card title="Usługi modeli lokalnych" href="/pl/gateway/local-model-services" icon="play">
    Uruchamianie lokalnych serwerów modeli na żądanie dla skonfigurowanych dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów z Gateway" href="/pl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debugowanie lokalnych backendów zgodnych z OpenAI, które przechodzą próby, ale zawodzą przy uruchomieniach agenta.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, referencji modeli i zachowania failover.
  </Card>
</CardGroup>
