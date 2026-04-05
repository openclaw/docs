---
read_when:
    - Integrujesz klientów, którzy używają API OpenResponses
    - Chcesz wejść opartych na elementach, wywołań narzędzi po stronie klienta lub zdarzeń SSE
summary: Udostępniaj z Gateway punkt końcowy HTTP `/v1/responses` zgodny z OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-05T13:54:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

Gateway OpenClaw może udostępniać punkt końcowy `POST /v1/responses` zgodny z OpenResponses.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/responses`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co
`openclaw agent`), więc routing/uprawnienia/konfiguracja są zgodne z twoją Gateway.

## Uwierzytelnianie, bezpieczeństwo i routing

Zachowanie operacyjne odpowiada [OpenAI Chat Completions](/gateway/openai-http-api):

- używaj pasującej ścieżki uwierzytelniania HTTP Gateway:
  - uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
  - uwierzytelnianie trusted-proxy (`gateway.auth.mode="trusted-proxy"`): nagłówki proxy świadome tożsamości z skonfigurowanego nie-loopback źródła trusted proxy
  - otwarte uwierzytelnianie dla prywatnego ingressu (`gateway.auth.mode="none"`): brak nagłówka auth
- traktuj ten punkt końcowy jako pełny dostęp operatora do instancji gateway
- dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) ignoruj węższe wartości `x-openclaw-scopes` zadeklarowane w bearer i przywracaj zwykłe pełne domyślne ustawienia operatora
- dla zaufanych trybów HTTP przenoszących tożsamość (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"`) honoruj `x-openclaw-scopes`, jeśli nagłówek jest obecny, a w przeciwnym razie wracaj do zwykłego domyślnego zestawu zakresów operatora
- wybieraj agentów za pomocą `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` lub `x-openclaw-agent-id`
- użyj `x-openclaw-model`, jeśli chcesz nadpisać backendowy model wybranego agenta
- użyj `x-openclaw-session-key` do jawnego routingu sesji
- użyj `x-openclaw-message-channel`, jeśli chcesz nie-domyślnego kontekstu syntetycznego kanału ingress

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu w tym punkcie końcowym jako tury nadawcy-właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"` na prywatnym ingressie)
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do zwykłego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

Włączaj lub wyłączaj ten punkt końcowy za pomocą `gateway.http.endpoints.responses.enabled`.

Ta sama powierzchnia zgodności obejmuje również:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Aby uzyskać kanoniczne wyjaśnienie, jak współgrają modele kierowane do agentów, `openclaw/default`, pass-through embeddings i nadpisania modeli backendowych, zobacz [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) oraz [Lista modeli i routing agentów](/gateway/openai-http-api#model-list-and-agent-routing).

## Zachowanie sesji

Domyślnie punkt końcowy jest **bezstanowy dla każdego żądania** (dla każdego wywołania generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenResponses `user`, Gateway wyprowadza z niego stabilny klucz sesji,
dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Kształt żądania (obsługiwany)

Żądanie jest zgodne z API OpenResponses z wejściem opartym na elementach. Obecna obsługa:

- `input`: ciąg lub tablica obiektów elementów.
- `instructions`: scalane z promptem systemowym.
- `tools`: definicje narzędzi po stronie klienta (narzędzia funkcji).
- `tool_choice`: filtrowanie lub wymaganie narzędzi klienta.
- `stream`: włącza streaming SSE.
- `max_output_tokens`: limit wyjścia według najlepszych starań (zależny od providera).
- `user`: stabilny routing sesji.

Akceptowane, ale **obecnie ignorowane**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Obsługiwane:

- `previous_response_id`: OpenClaw ponownie używa sesji wcześniejszej odpowiedzi, gdy żądanie pozostaje w tym samym zakresie agent/użytkownik/żądana sesja.

## Elementy (`input`)

### `message`

Role: `system`, `developer`, `user`, `assistant`.

- `system` i `developer` są dopisywane do promptu systemowego.
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

Podawaj narzędzia przez `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

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
Maksymalny rozmiar (obecnie): 10 MB.

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

Maksymalny rozmiar (obecnie): 5 MB.

Obecne zachowanie:

- Zawartość pliku jest dekodowana i dodawana do **promptu systemowego**, a nie do wiadomości użytkownika,
  dzięki czemu pozostaje efemeryczna (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowywany jako **niezaufana zawartość zewnętrzna** przed dodaniem,
  więc bajty pliku są traktowane jako dane, a nie zaufane instrukcje.
- Wstrzyknięty blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera
  linię metadanych `Source: External`.
- Ta ścieżka wejścia plików celowo pomija długi banner `SECURITY NOTICE:`,
  aby zachować budżet promptu; znaczniki graniczne i metadane nadal pozostają na miejscu.
- Dla plików PDF najpierw parsowany jest tekst. Jeśli znajdzie się go niewiele, pierwsze strony są
  rasteryzowane do obrazów i przekazywane do modelu, a wstrzyknięty blok pliku używa
  placeholdera `[PDF content rendered to images]`.

Parsowanie PDF używa przyjaznej dla Node starszej kompilacji `pdfjs-dist` (bez workera). Nowoczesna
kompilacja PDF.js oczekuje workerów przeglądarki/globali DOM, dlatego nie jest używana w Gateway.

Domyślne ustawienia pobierania z URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba elementów `input_file` + `input_image` opartych na URL w jednym żądaniu)
- Żądania są chronione (rozwiązywanie DNS, blokowanie prywatnych adresów IP, limity przekierowań, limity czasu).
- Opcjonalne listy dozwolonych nazw hostów są obsługiwane dla każdego typu wejścia (`files.urlAllowlist`, `images.urlAllowlist`).
  - Dokładny host: `"cdn.example.com"`
  - Subdomeny wildcard: `"*.assets.example.com"` (nie pasuje do domeny apex)
  - Puste lub pominięte allowlisty oznaczają brak ograniczenia listą dozwolonych nazw hostów.
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

Wartości domyślne po pominięciu:

- `maxBodyBytes`: 20 MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5 MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10 s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4 000 000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10 MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10 s
- Źródła `input_image` HEIC/HEIF są akceptowane i normalizowane do JPEG przed dostarczeniem do providera.

Uwaga dotycząca bezpieczeństwa:

- Listy dozwolonych URL są egzekwowane przed pobraniem i przy przekierowaniach.
- Dodanie nazwy hosta do allowlisty nie omija blokowania prywatnych/wewnętrznych adresów IP.
- Dla gateway wystawionych do internetu stosuj kontrolę ruchu wychodzącego sieci oprócz zabezpieczeń na poziomie aplikacji.
  Zobacz [Security](/gateway/security).

## Streaming (SSE)

Ustaw `stream: true`, aby odbierać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `event: <type>` i `data: <json>`
- Strumień kończy się `data: [DONE]`

Obecnie emitowane typy zdarzeń:

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

`usage` jest wypełniane, gdy bazowy provider raportuje liczbę tokenów.
OpenClaw normalizuje typowe aliasy w stylu OpenAI, zanim te liczniki dotrą do
powierzchni statusu/sesji downstream, w tym `input_tokens` / `output_tokens`
oraz `prompt_tokens` / `completion_tokens`.

## Błędy

Błędy używają obiektu JSON w postaci:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Typowe przypadki:

- `401` brakujące/nieprawidłowe uwierzytelnianie
- `400` nieprawidłowe ciało żądania
- `405` nieprawidłowa metoda

## Przykłady

Bez streamingu:

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

Streaming:

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
