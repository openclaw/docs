---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem SGLang.
    - Chcesz zgodnych z OpenAI endpointów `/v1` z własnymi modelami.
summary: Uruchamianie OpenClaw z SGLang (self-hosted serwer zgodny z OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T09:29:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang może udostępniać modele open-source przez **zgodne z OpenAI** API HTTP.
OpenClaw może łączyć się z SGLang, używając API `openai-completions`.

OpenClaw może także **automatycznie wykrywać** dostępne modele z SGLang, jeśli
wyrazisz na to zgodę przez `SGLANG_API_KEY` (dowolna wartość działa, jeśli serwer nie wymusza auth)
i nie zdefiniujesz jawnego wpisu `models.providers.sglang`.

OpenClaw traktuje `sglang` jako lokalnego dostawcę zgodnego z OpenAI, który obsługuje
strumieniowane rozliczanie usage, więc status/liczniki tokenów kontekstu mogą aktualizować się na podstawie odpowiedzi `stream_options.include_usage`.

## Pierwsze kroki

<Steps>
  <Step title="Uruchom SGLang">
    Uruchom SGLang z serwerem zgodnym z OpenAI. Twój `baseUrl` powinien udostępniać
    endpointy `/v1` (na przykład `/v1/models`, `/v1/chat/completions`). SGLang
    często działa pod adresem:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Ustaw klucz API">
    Dowolna wartość działa, jeśli na serwerze nie skonfigurowano auth:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Uruchom onboarding albo ustaw model bezpośrednio">
    ```bash
    openclaw onboard
    ```

    Albo skonfiguruj model ręcznie:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Wykrywanie modeli (niejawny dostawca)

Gdy ustawiono `SGLANG_API_KEY` (albo istnieje profil auth) i **nie**
zdefiniowano `models.providers.sglang`, OpenClaw odpytuje:

- `GET http://127.0.0.1:30000/v1/models`

i przekształca zwrócone identyfikatory w wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.sglang`, auto-discovery jest pomijane i
musisz zdefiniować modele ręcznie.
</Note>

## Konfiguracja jawna (modele ręczne)

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

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie w stylu proxy">
    SGLang jest traktowany jako backend proxy `/v1` zgodny z OpenAI, a nie
    natywny endpoint OpenAI.

    | Zachowanie | SGLang |
    |----------|--------|
    | Kształtowanie żądań tylko dla OpenAI | Nie jest stosowane |
    | `service_tier`, Responses `store`, wskazówki cache promptu | Nie są wysyłane |
    | Kształtowanie ładunku kompatybilności reasoning | Nie jest stosowane |
    | Ukryte nagłówki atrybucji (`originator`, `version`, `User-Agent`) | Nie są wstrzykiwane dla niestandardowych `baseUrl` SGLang |

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    **Serwer nieosiągalny**

    Sprawdź, czy serwer działa i odpowiada:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Błędy auth**

    Jeśli żądania kończą się błędami auth, ustaw prawdziwy `SGLANG_API_KEY`, zgodny
    z konfiguracją twojego serwera, albo skonfiguruj dostawcę jawnie pod
    `models.providers.sglang`.

    <Tip>
    Jeśli uruchamiasz SGLang bez uwierzytelniania, dowolna niepusta wartość
    `SGLANG_API_KEY` wystarcza, aby wyrazić zgodę na wykrywanie modeli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym wpisów dostawców.
  </Card>
</CardGroup>
