---
read_when:
    - Integracja klientów korzystających z API OpenResponses
    - Chcesz wejść oparte na elementach, wywołania narzędzi po stronie klienta lub zdarzenia SSE
summary: Udostępnij zgodny z OpenResponses endpoint HTTP `/v1/responses` z Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-24T09:11:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

Gateway OpenClaw może udostępniać zgodny z OpenResponses endpoint `POST /v1/responses`.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/responses`
- Ten sam port co Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co
`openclaw agent`), więc routing/uprawnienia/konfiguracja są zgodne z Twoim Gateway.

## Uwierzytelnianie, bezpieczeństwo i routing

Zachowanie operacyjne odpowiada [OpenAI Chat Completions](/pl/gateway/openai-http-api):

- używaj pasującej ścieżki uwierzytelniania HTTP Gateway:
  - uwierzytelnianie wspólnym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
  - uwierzytelnianie `trusted-proxy` (`gateway.auth.mode="trusted-proxy"`): nagłówki proxy rozpoznające tożsamość z skonfigurowanego źródła trusted proxy poza loopback
  - otwarte uwierzytelnianie private-ingress (`gateway.auth.mode="none"`): brak nagłówka uwierzytelniania
- traktuj endpoint jako pełny dostęp operatora do instancji gateway
- dla trybów uwierzytelniania wspólnym sekretem (`token` i `password`) ignoruj węższe wartości `x-openclaw-scopes` deklarowane przez bearer i przywracaj zwykłe pełne domyślne uprawnienia operatora
- dla trybów HTTP opartych na zaufanej tożsamości (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"`) respektuj `x-openclaw-scopes`, jeśli nagłówek jest obecny, a w przeciwnym razie przechodź do zwykłego domyślnego zestawu zakresów operatora
- wybieraj agentów przez `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` lub `x-openclaw-agent-id`
- używaj `x-openclaw-model`, gdy chcesz nadpisać model backendu wybranego agenta
- używaj `x-openclaw-session-key` do jawnego routingu sesji
- używaj `x-openclaw-message-channel`, gdy chcesz nie domyślny syntetyczny kontekst kanału wejściowego

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania wspólnego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpointzie jako tury nadawcy-właściciela
- tryby HTTP oparte na zaufanej tożsamości (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"` na prywatnym ingressie)
  - respektują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - przechodzą do zwykłego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

Włączaj lub wyłączaj ten endpoint przez `gateway.http.endpoints.responses.enabled`.

Ta sama powierzchnia zgodności obejmuje również:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Aby zapoznać się z kanonicznym wyjaśnieniem, jak pasują do siebie modele celowane na agentów, `openclaw/default`, pass-through embeddings i nadpisania modeli backendu, zobacz [OpenAI Chat Completions](/pl/gateway/openai-http-api#agent-first-model-contract) oraz [Model list and agent routing](/pl/gateway/openai-http-api#model-list-and-agent-routing).

## Zachowanie sesji

Domyślnie endpoint jest **bezstanowy per żądanie** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenResponses `user`, Gateway wyprowadza z niego stabilny klucz sesji,
dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Kształt żądania (obsługiwany)

Żądanie podąża za API OpenResponses z wejściem opartym na elementach. Obecnie obsługiwane:

- `input`: string lub tablica obiektów elementów.
- `instructions`: scala się z promptem systemowym.
- `tools`: definicje narzędzi po stronie klienta (narzędzia funkcji).
- `tool_choice`: filtrowanie lub wymaganie narzędzi po stronie klienta.
- `stream`: włącza strumieniowanie SSE.
- `max_output_tokens`: limit danych wyjściowych best-effort (zależny od dostawcy).
- `user`: stabilny routing sesji.

Akceptowane, ale **obecnie ignorowane**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Obsługiwane:

- `previous_response_id`: OpenClaw ponownie używa wcześniejszej sesji odpowiedzi, gdy żądanie pozostaje w tym samym zakresie agent/user/requested-session.

## Elementy (input)

### `message`

Role: `system`, `developer`, `user`, `assistant`.

- `system` i `developer` są dołączane do promptu systemowego.
- Najnowszy element `user` lub `function_call_output` staje się „bieżącą wiadomością”.
- Wcześniejsze wiadomości user/assistant są uwzględniane jako historia dla kontekstu.

### `function_call_output` (narzędzia oparte na turach)

Odeślij wyniki narzędzi z powrotem do modelu:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` i `item_reference`

Akceptowane dla zgodności schematu, ale ignorowane przy budowaniu promptu.

## Narzędzia (funkcyjne narzędzia po stronie klienta)

Podaj narzędzia w postaci `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jeśli agent zdecyduje się wywołać narzędzie, odpowiedź zwraca element wyjściowy `function_call`.
Następnie wysyłasz kolejne żądanie z `function_call_output`, aby kontynuować turę.

## Obrazy (`input_image`)

Obsługuje źródła base64 lub URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Dozwolone typy MIME (obecnie): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maksymalny rozmiar (obecnie): 10MB.

## Pliki (`input_file`)

Obsługuje źródła base64 lub URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Dozwolone typy MIME (obecnie): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maksymalny rozmiar (obecnie): 5MB.

Bieżące zachowanie:

- Zawartość pliku jest dekodowana i dodawana do **promptu systemowego**, a nie do wiadomości użytkownika,
  dzięki czemu pozostaje efemeryczna (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowany jako **niezaufana zewnętrzna treść**, zanim zostanie dodany,
  więc bajty pliku są traktowane jako dane, a nie zaufane instrukcje.
- Wstrzykiwany blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera linię metadanych
  `Source: External`.
- Ta ścieżka wejścia plików celowo pomija długi baner `SECURITY NOTICE:`,
  aby oszczędzać budżet promptu; znaczniki graniczne i metadane nadal pozostają na miejscu.
- Pliki PDF są najpierw analizowane pod kątem tekstu. Jeśli tekstu jest niewiele, pierwsze strony są
  rasteryzowane do obrazów i przekazywane do modelu, a wstrzykiwany blok pliku używa
  placeholdera `[PDF content rendered to images]`.

Parsowanie PDF używa przyjaznej dla Node starszej kompilacji `pdfjs-dist` (bez workera). Nowoczesna
kompilacja PDF.js oczekuje workerów przeglądarkowych/globali DOM, więc nie jest używana w Gateway.

Domyślne ustawienia pobierania URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba elementów `input_file` + `input_image` opartych na URL na żądanie)
- Żądania są chronione (rozwiązywanie DNS, blokowanie prywatnych IP, limity przekierowań, limity czasu).
- Obsługiwane są opcjonalne listy dozwolonych nazw hostów per typ wejścia (`files.urlAllowlist`, `images.urlAllowlist`).
  - Dokładny host: `"cdn.example.com"`
  - Wieloznaczne subdomeny: `"*.assets.example.com"` (nie dopasowuje apex)
  - Puste lub pominięte listy dozwolonych oznaczają brak ograniczenia listy dozwolonych nazw hostów.
- Aby całkowicie wyłączyć pobieranie oparte na URL, ustaw `files.allowUrl: false` i/lub `images.allowUrl: false`.

## Limity plików i obrazów (konfiguracja)

Wartości domyślne można dostroić w `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Wartości domyślne przy pominięciu:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Źródła `input_image` HEIC/HEIF są akceptowane i normalizowane do JPEG przed dostarczeniem do dostawcy.

Uwaga dotycząca bezpieczeństwa:

- Listy dozwolonych URL są egzekwowane przed pobraniem i na etapach przekierowań.
- Dodanie nazwy hosta do listy dozwolonych nie omija blokowania prywatnych/wewnętrznych adresów IP.
- W przypadku gateway wystawionych do Internetu stosuj kontrolę ruchu wychodzącego na poziomie sieci oprócz zabezpieczeń aplikacyjnych.
  Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `event: <type>` oraz `data: <json>`
- Strumień kończy się `data: [DONE]`

Typy zdarzeń emitowane obecnie:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (przy błędzie)

## Użycie

`usage` jest uzupełniane, gdy bazowy dostawca raportuje liczbę tokenów.
OpenClaw normalizuje typowe aliasy w stylu OpenAI, zanim te liczniki trafią
do dalszych powierzchni statusu/sesji, w tym `input_tokens` / `output_tokens`
oraz `prompt_tokens` / `completion_tokens`.

## Błędy

Błędy używają obiektu JSON w postaci:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Typowe przypadki:

- `401` brakujące/nieprawidłowe uwierzytelnianie
- `400` nieprawidłowe body żądania
- `405` nieprawidłowa metoda

## Przykłady

Bez strumieniowania:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Ze strumieniowaniem:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Powiązane

- [OpenAI chat completions](/pl/gateway/openai-http-api)
- [OpenAI](/pl/providers/openai)
