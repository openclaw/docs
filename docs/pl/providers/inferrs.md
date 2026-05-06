---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem inferrs
    - Udostępniasz model Gemma lub inny model za pomocą inferrs
    - Potrzebujesz dokładnych flag zgodności OpenClaw dla inferrs
summary: Uruchamianie OpenClaw za pośrednictwem inferrs (lokalnego serwera zgodnego z OpenAI)
title: Wnioskuje
x-i18n:
    generated_at: "2026-05-06T09:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) może udostępniać modele lokalne za zgodnym z OpenAI API `/v1`. OpenClaw działa z `inferrs` przez ogólną ścieżkę `openai-completions`.

| Właściwość                 | Wartość                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| Identyfikator dostawcy     | `inferrs` (niestandardowy; skonfiguruj w `models.providers.inferrs`)          |
| Plugin                     | brak — `inferrs` nie jest dołączonym Pluginem dostawcy OpenClaw               |
| Zmienna środowiskowa auth  | Opcjonalna. Dowolna wartość działa, jeśli Twój serwer inferrs nie ma auth     |
| API                        | zgodne z OpenAI (`openai-completions`)                                        |
| Sugerowany bazowy URL      | `http://127.0.0.1:8080/v1` (lub tam, gdzie działa Twój serwer inferrs)        |

<Note>
  `inferrs` najlepiej obecnie traktować jako niestandardowy, samodzielnie hostowany backend zgodny z OpenAI, a nie dedykowany Plugin dostawcy OpenClaw. Konfigurujesz go przez `models.providers.inferrs`, a nie przez flagę wyboru onboardingu. Jeśli potrzebujesz prawdziwego dołączonego Pluginu z automatycznym wykrywaniem, zobacz [SGLang](/pl/providers/sglang) lub [vLLM](/pl/providers/vllm).
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
    Dodaj jawny wpis dostawcy i skieruj na niego swój domyślny model. Zobacz pełny przykład konfiguracji poniżej.
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

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Dlaczego requiresStringContent ma znaczenie">
    Niektóre trasy Chat Completions w `inferrs` akceptują tylko ciąg znaków
    `messages[].content`, a nie tablice strukturalnych części treści.

    <Warning>
    Jeśli uruchomienia OpenClaw kończą się niepowodzeniem z błędem takim jak:

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

    OpenClaw spłaszczy części treści zawierające wyłącznie tekst do zwykłych ciągów znaków przed wysłaniem
    żądania.

  </Accordion>

  <Accordion title="Gemma i zastrzeżenie dotyczące schematu narzędzi">
    Niektóre bieżące kombinacje `inferrs` + Gemma akceptują małe bezpośrednie
    żądania `/v1/chat/completions`, ale nadal zawodzą przy pełnych turach środowiska
    wykonawczego agenta OpenClaw.

    Jeśli tak się dzieje, najpierw spróbuj tego:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Wyłącza to powierzchnię schematu narzędzi OpenClaw dla modelu i może zmniejszyć presję promptu
    na bardziej rygorystyczne lokalne backendy.

    Jeśli bardzo małe bezpośrednie żądania nadal działają, ale normalne tury agenta OpenClaw wciąż
    powodują awarię wewnątrz `inferrs`, pozostały problem zwykle dotyczy zachowania modelu/serwera
    upstream, a nie warstwy transportu OpenClaw.

  </Accordion>

  <Accordion title="Ręczny test dymny">
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

    Jeśli pierwsze polecenie działa, ale drugie kończy się niepowodzeniem, sprawdź sekcję rozwiązywania problemów poniżej.

  </Accordion>

  <Accordion title="Zachowanie w stylu proxy">
    `inferrs` jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie
    natywny punkt końcowy OpenAI.

    - Natywne kształtowanie żądań specyficzne tylko dla OpenAI nie ma tutaj zastosowania
    - Brak `service_tier`, brak Responses `store`, brak wskazówek pamięci podręcznej promptu i brak
      kształtowania ładunku reasoning zgodnego z OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane dla niestandardowych bazowych URL-i `inferrs`

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="curl /v1/models kończy się niepowodzeniem">
    `inferrs` nie działa, jest nieosiągalny albo nie jest powiązany z oczekiwanym
    hostem/portem. Upewnij się, że serwer został uruchomiony i nasłuchuje pod adresem,
    który skonfigurowano.
  </Accordion>

  <Accordion title="messages[].content oczekuje ciągu znaków">
    Ustaw `compat.requiresStringContent: true` we wpisie modelu. Szczegóły znajdziesz
    w sekcji `requiresStringContent` powyżej.
  </Accordion>

  <Accordion title="Bezpośrednie wywołania /v1/chat/completions przechodzą, ale openclaw infer model run kończy się niepowodzeniem">
    Spróbuj ustawić `compat.supportsTools: false`, aby wyłączyć powierzchnię schematu narzędzi.
    Zobacz zastrzeżenie dotyczące schematu narzędzi Gemma powyżej.
  </Accordion>

  <Accordion title="inferrs nadal ulega awarii przy większych turach agenta">
    Jeśli OpenClaw nie otrzymuje już błędów schematu, ale `inferrs` nadal ulega awarii przy większych
    turach agenta, traktuj to jako ograniczenie upstream w `inferrs` albo modelu. Zmniejsz
    presję promptu albo przełącz się na inny lokalny backend lub model.
  </Accordion>
</AccordionGroup>

<Tip>
Ogólną pomoc znajdziesz w [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Modele lokalne" href="/pl/gateway/local-models" icon="server">
    Uruchamianie OpenClaw z lokalnymi serwerami modeli.
  </Card>
  <Card title="Rozwiązywanie problemów z Gateway" href="/pl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debugowanie lokalnych backendów zgodnych z OpenAI, które przechodzą próby, ale zawodzą przy uruchomieniach agenta.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i zachowania failover.
  </Card>
</CardGroup>
