---
read_when:
    - Chcesz uruchomić OpenClaw względem lokalnego serwera inferrs
    - Udostępniasz Gemma lub inny model przez inferrs
    - Potrzebujesz dokładnych flag zgodności OpenClaw dla inferrs
summary: Uruchamianie OpenClaw przez inferrs (lokalny serwer zgodny z OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T09:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) może udostępniać lokalne modele za
zgodnym z OpenAI API `/v1`. OpenClaw działa z `inferrs` przez ogólną
ścieżkę `openai-completions`.

`inferrs` najlepiej obecnie traktować jako niestandardowy samodzielnie hostowany
backend zgodny z OpenAI, a nie dedykowany Plugin dostawcy OpenClaw.

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
    Dodaj jawny wpis dostawcy i skieruj na niego model domyślny. Pełny przykład konfiguracji znajdziesz poniżej.
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
    Niektóre ścieżki Chat Completions `inferrs` akceptują tylko string
    `messages[].content`, a nie ustrukturyzowane tablice elementów treści.

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

    OpenClaw spłaszczy czysto tekstowe elementy treści do zwykłych stringów przed wysłaniem
    żądania.

  </Accordion>

  <Accordion title="Zastrzeżenie dotyczące Gemma i schematu narzędzi">
    Niektóre obecne kombinacje `inferrs` + Gemma akceptują małe bezpośrednie
    żądania `/v1/chat/completions`, ale nadal kończą się błędem przy pełnych turach
    runtime agenta OpenClaw.

    Jeśli tak się dzieje, najpierw spróbuj tego:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    To wyłącza powierzchnię schematu narzędzi OpenClaw dla modelu i może zmniejszyć
    nacisk promptu na bardziej restrykcyjnych lokalnych backendach.

    Jeśli małe bezpośrednie żądania nadal działają, ale zwykłe tury agenta OpenClaw
    nadal powodują awarię wewnątrz `inferrs`, pozostały problem zwykle leży po stronie
    upstream modelu/serwera, a nie warstwy transportowej OpenClaw.

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

    Jeśli pierwsze polecenie działa, a drugie kończy się błędem, sprawdź sekcję rozwiązywania problemów poniżej.

  </Accordion>

  <Accordion title="Zachowanie w stylu proxy">
    `inferrs` jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie
    natywny endpoint OpenAI.

    - Natywne kształtowanie żądań właściwe tylko dla OpenAI nie ma tu zastosowania
    - Brak `service_tier`, brak Responses `store`, brak wskazówek prompt-cache i brak
      kształtowania payloadu reasoning-compat OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane do niestandardowych base URL `inferrs`

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="curl /v1/models kończy się błędem">
    `inferrs` nie działa, nie jest osiągalny albo nie jest zbindowany do oczekiwanego
    hosta/portu. Upewnij się, że serwer jest uruchomiony i nasłuchuje na adresie,
    który skonfigurowałeś.
  </Accordion>

  <Accordion title="messages[].content oczekiwało string">
    Ustaw `compat.requiresStringContent: true` we wpisie modelu. Szczegóły
    znajdziesz w sekcji `requiresStringContent` powyżej.
  </Accordion>

  <Accordion title="Bezpośrednie wywołania /v1/chat/completions przechodzą, ale openclaw infer model run kończy się błędem">
    Spróbuj ustawić `compat.supportsTools: false`, aby wyłączyć powierzchnię schematu narzędzi.
    Zobacz zastrzeżenie dotyczące schematu narzędzi Gemma powyżej.
  </Accordion>

  <Accordion title="inferrs nadal kończy się awarią przy większych turach agenta">
    Jeśli OpenClaw nie zwraca już błędów schematu, ale `inferrs` nadal kończy się awarią przy większych
    turach agenta, traktuj to jako ograniczenie upstream `inferrs` lub modelu. Zmniejsz
    nacisk promptu albo przełącz się na inny lokalny backend lub model.
  </Accordion>
</AccordionGroup>

<Tip>
Ogólną pomoc znajdziesz w [Troubleshooting](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Lokalne modele" href="/pl/gateway/local-models" icon="server">
    Uruchamianie OpenClaw względem lokalnych serwerów modeli.
  </Card>
  <Card title="Rozwiązywanie problemów z Gateway" href="/pl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debugowanie lokalnych backendów zgodnych z OpenAI, które przechodzą sondy, ale kończą się błędem przy uruchomieniach agentów.
  </Card>
  <Card title="Wybór modeli" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, referencji modeli i zachowania failover.
  </Card>
</CardGroup>
