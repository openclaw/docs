---
read_when:
    - Integracja klientów obsługujących interfejs API OpenResponses
    - Chcesz używać danych wejściowych opartych na elementach, wywołań narzędzi klienta lub zdarzeń SSE
summary: Udostępnij z Gateway punkt końcowy HTTP /v1/responses zgodny z OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-30T09:55:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw Gateway może udostępniać zgodny z OpenResponses endpoint `POST /v1/responses`.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/responses`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co
`openclaw agent`), więc routing/uprawnienia/konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie, bezpieczeństwo i routing

Zachowanie operacyjne odpowiada [OpenAI Chat Completions](/pl/gateway/openai-http-api):

- użyj odpowiedniej ścieżki uwierzytelniania HTTP Gateway:
  - uwierzytelnianie wspólnym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
  - uwierzytelnianie trusted-proxy (`gateway.auth.mode="trusted-proxy"`): nagłówki proxy świadome tożsamości ze skonfigurowanego zaufanego źródła proxy; proxy same-host loopback wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`
  - otwarte uwierzytelnianie private-ingress (`gateway.auth.mode="none"`): brak nagłówka uwierzytelniania
- traktuj endpoint jako pełny dostęp operatora do instancji gateway
- dla trybów uwierzytelniania wspólnym sekretem (`token` i `password`) ignoruj węższe wartości `x-openclaw-scopes` zadeklarowane przez bearer i przywróć normalne pełne domyślne ustawienia operatora
- dla trybów HTTP z zaufaną tożsamością (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"`) honoruj `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wróć do normalnego domyślnego zestawu zakresów operatora
- wybieraj agentów za pomocą `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` lub `x-openclaw-agent-id`
- użyj `x-openclaw-model`, gdy chcesz nadpisać model backendu wybranego agenta
- użyj `x-openclaw-session-key` do jawnego routingu sesji
- użyj `x-openclaw-message-channel`, gdy chcesz użyć niedomyślnego kontekstu syntetycznego kanału wejściowego

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania wspólnego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpoincie jako tury owner-sender
- tryby HTTP z zaufaną tożsamością (na przykład uwierzytelnianie trusted proxy albo `gateway.auth.mode="none"` na private ingress)
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Włącz lub wyłącz ten endpoint za pomocą `gateway.http.endpoints.responses.enabled`.

Ta sama powierzchnia zgodności obejmuje także:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Kanoniczne wyjaśnienie, jak modele kierujące do agentów, `openclaw/default`, przekazywanie embeddings i nadpisania modeli backendu współpracują ze sobą, znajdziesz w [OpenAI Chat Completions](/pl/gateway/openai-http-api#agent-first-model-contract) oraz [Lista modeli i routing agentów](/pl/gateway/openai-http-api#model-list-and-agent-routing).

## Zachowanie sesji

Domyślnie endpoint jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenResponses `user`, Gateway wyprowadza z niego stabilny klucz sesji,
dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Kształt żądania (obsługiwany)

Żądanie jest zgodne z API OpenResponses z wejściem opartym na elementach. Obecna obsługa:

- `input`: ciąg znaków lub tablica obiektów elementów.
- `instructions`: scalane z promptem systemowym.
- `tools`: definicje narzędzi klienta (narzędzia funkcyjne).
- `tool_choice`: filtruje lub wymaga narzędzi klienta.
- `stream`: włącza strumieniowanie SSE.
- `max_output_tokens`: limit wyjścia best-effort (zależny od providera).
- `user`: stabilny routing sesji.

Akceptowane, ale **obecnie ignorowane**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Obsługiwane:

- `previous_response_id`: OpenClaw ponownie używa wcześniejszej sesji odpowiedzi, gdy żądanie pozostaje w tym samym zakresie agenta/użytkownika/żądanej sesji.

## Elementy (wejście)

### `message`

Role: `system`, `developer`, `user`, `assistant`.

- `system` i `developer` są dołączane do promptu systemowego.
- Najnowszy element `user` lub `function_call_output` staje się „bieżącą wiadomością”.
- Wcześniejsze wiadomości użytkownika/asystenta są dołączane jako historia dla kontekstu.

### `function_call_output` (narzędzia oparte na turach)

Odeślij wyniki narzędzi do modelu:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` i `item_reference`

Akceptowane dla zgodności schematu, ale ignorowane podczas budowania promptu.

## Narzędzia (funkcyjne narzędzia po stronie klienta)

Dostarcz narzędzia za pomocą `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jeśli agent zdecyduje się wywołać narzędzie, odpowiedź zwróci element wyjściowy `function_call`.
Następnie wyślij kolejne żądanie z `function_call_output`, aby kontynuować turę.

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

Obecne zachowanie:

- Zawartość pliku jest dekodowana i dodawana do **promptu systemowego**, a nie do wiadomości użytkownika,
  więc pozostaje efemeryczna (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim zostanie dodany,
  więc bajty pliku są traktowane jako dane, a nie jako zaufane instrukcje.
- Wstrzyknięty blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych
  `Source: External`.
- Ta ścieżka wejścia plikowego celowo pomija długi baner `SECURITY NOTICE:`, aby
  zachować budżet promptu; znaczniki graniczne i metadane nadal pozostają na miejscu.
- Pliki PDF są najpierw analizowane pod kątem tekstu. Jeśli znaleziono niewiele tekstu, pierwsze strony są
  rasteryzowane do obrazów i przekazywane do modelu, a wstrzyknięty blok pliku używa
  placeholdera `[PDF content rendered to images]`.

Parsowanie PDF zapewnia dołączony plugin `document-extract`, który używa przyjaznej dla
Node starszej wersji `pdfjs-dist` (bez workera). Nowoczesna wersja PDF.js
oczekuje workerów przeglądarkowych/globali DOM, więc nie jest używana w Gateway.

Domyślne pobieranie URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba części opartych na URL `input_file` + `input_image` na żądanie)
- Żądania są chronione (rozwiązywanie DNS, blokowanie prywatnych adresów IP, limity przekierowań, timeouty).
- Opcjonalne listy dozwolonych nazw hostów są obsługiwane dla każdego typu wejścia (`files.urlAllowlist`, `images.urlAllowlist`).
  - Dokładny host: `"cdn.example.com"`
  - Poddomeny z wildcardem: `"*.assets.example.com"` (nie pasuje do domeny apex)
  - Puste lub pominięte listy dozwolone oznaczają brak ograniczenia listą dozwolonych nazw hostów.
- Aby całkowicie wyłączyć pobieranie oparte na URL, ustaw `files.allowUrl: false` i/lub `images.allowUrl: false`.

## Limity plików i obrazów (konfiguracja)

Domyślne wartości można dostroić pod `gateway.http.endpoints.responses`:

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

Wartości domyślne po pominięciu:

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
- Źródła HEIC/HEIF `input_image` są akceptowane i normalizowane do JPEG przed dostarczeniem do providera.

Uwaga dotycząca bezpieczeństwa:

- Listy dozwolonych URL są egzekwowane przed pobraniem oraz przy skokach przekierowań.
- Dodanie nazwy hosta do listy dozwolonych nie omija blokowania prywatnych/wewnętrznych adresów IP.
- Dla gateway wystawionych do internetu zastosuj kontrolę ruchu wychodzącego sieci oprócz zabezpieczeń na poziomie aplikacji.
  Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby odbierać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `event: <type>` i `data: <json>`
- Strumień kończy się `data: [DONE]`

Typy zdarzeń obecnie emitowane:

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

`usage` jest wypełniane, gdy bazowy provider raportuje liczniki tokenów.
OpenClaw normalizuje typowe aliasy w stylu OpenAI, zanim te liczniki trafią do
dalszych powierzchni statusu/sesji, w tym `input_tokens` / `output_tokens`
oraz `prompt_tokens` / `completion_tokens`.

## Błędy

Błędy używają obiektu JSON, takiego jak:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Typowe przypadki:

- `401` brakujące/nieprawidłowe uwierzytelnianie
- `400` nieprawidłowe ciało żądania
- `405` niewłaściwa metoda

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

Strumieniowanie:

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
