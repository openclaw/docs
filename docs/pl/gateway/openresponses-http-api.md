---
read_when:
    - Integrowanie klientów obsługujących OpenResponses API
    - Chcesz używać danych wejściowych opartych na elementach, wywołań narzędzi klienta lub zdarzeń SSE
summary: Udostępnij z Gateway punkt końcowy HTTP /v1/responses zgodny z OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:35:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway OpenClaw może udostępniać zgodny z OpenResponses endpoint `POST /v1/responses`.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/responses`
- Ten sam port co Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Pod spodem żądania są wykonywane jako normalne uruchomienie agenta Gateway (ta sama ścieżka kodu co
`openclaw agent`), więc routing/uprawnienia/konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie, bezpieczeństwo i routing

Zachowanie operacyjne odpowiada [OpenAI Chat Completions](/pl/gateway/openai-http-api):

- użyj zgodnej ścieżki uwierzytelniania HTTP Gateway:
  - uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
  - uwierzytelnianie zaufanym proxy (`gateway.auth.mode="trusted-proxy"`): nagłówki proxy świadome tożsamości ze skonfigurowanego zaufanego źródła proxy; proxy same-host loopback wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`
  - lokalny bezpośredni fallback zaufanego proxy: wywołujący z tego samego hosta bez nagłówków `Forwarded`, `X-Forwarded-*` ani `X-Real-IP` mogą użyć `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - otwarte uwierzytelnianie private-ingress (`gateway.auth.mode="none"`): brak nagłówka uwierzytelniania
- traktuj endpoint jako pełny dostęp operatora do instancji Gateway
- w trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) ignoruj węższe wartości `x-openclaw-scopes` deklarowane przez bearer i przywróć normalne domyślne wartości pełnego operatora
- w zaufanych trybach HTTP przenoszących tożsamość (na przykład uwierzytelnianie zaufanym proxy lub `gateway.auth.mode="none"`) honoruj `x-openclaw-scopes`, gdy jest obecne, a w przeciwnym razie wróć do normalnego domyślnego zestawu zakresów operatora
- wybieraj agentów za pomocą `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` lub `x-openclaw-agent-id`
- użyj `x-openclaw-model`, gdy chcesz nadpisać model backendu wybranego agenta
- użyj `x-openclaw-session-key` do jawnego routingu sesji
- użyj `x-openclaw-message-channel`, gdy chcesz użyć niedomyślnego syntetycznego kontekstu kanału wejściowego

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpoincie jako tury nadawcy-właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie zaufanym proxy albo `gateway.auth.mode="none"` na private ingress)
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Włącz lub wyłącz ten endpoint za pomocą `gateway.http.endpoints.responses.enabled`.

Ta sama powierzchnia zgodności obejmuje także:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Kanoniczne wyjaśnienie, jak modele kierowane do agentów, `openclaw/default`, przekazywanie embeddings i nadpisania modelu backendu pasują do siebie, znajdziesz w [OpenAI Chat Completions](/pl/gateway/openai-http-api#agent-first-model-contract) oraz [Lista modeli i routing agentów](/pl/gateway/openai-http-api#model-list-and-agent-routing).

## Zachowanie sesji

Domyślnie endpoint jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenResponses `user`, Gateway wyprowadza z niego stabilny klucz sesji,
dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Kształt żądania (obsługiwany)

Żądanie jest zgodne z API OpenResponses z wejściem opartym na elementach. Obecna obsługa:

- `input`: ciąg znaków albo tablica obiektów elementów.
- `instructions`: scalane z promptem systemowym.
- `tools`: definicje narzędzi klienta (narzędzia funkcyjne).
- `tool_choice`: `"auto"`, `"none"`, `"required"` lub `{ "type": "function", "name": "..." }` do filtrowania albo wymagania narzędzi klienta.
- `stream`: włącza strumieniowanie SSE.
- `max_output_tokens`: limit wyjścia best-effort (zależny od dostawcy).
- `temperature`: temperatura próbkowania best-effort przekazywana do dostawcy. Ignorowana przez backend Codex Responses oparty na ChatGPT, który używa stałego próbkowania po stronie serwera.
- `top_p`: próbkowanie jądrowe best-effort przekazywane do dostawcy. To samo zastrzeżenie dotyczące Codex Responses co przy `temperature`.
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

Wyślij wyniki narzędzia z powrotem do modelu:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` i `item_reference`

Akceptowane dla zgodności schematu, ale ignorowane podczas budowania promptu.

## Narzędzia (narzędzia funkcyjne po stronie klienta)

Dostarcz narzędzia za pomocą `tools: [{ type: "function", name, description?, parameters? }]`.

Jeśli agent zdecyduje się wywołać narzędzie, odpowiedź zwróci element wyjściowy `function_call`.
Następnie wyślij żądanie kontynuacyjne z `function_call_output`, aby kontynuować turę.

Dla `tool_choice: "required"` i `tool_choice` przypiętego do funkcji endpoint zawęża ujawniony zestaw narzędzi funkcyjnych klienta, instruuje runtime, aby wywołał narzędzie klienta przed odpowiedzią, i odrzuca turę, jeśli nie zawiera pasującego ustrukturyzowanego wywołania narzędzia klienta. Ten kontrakt dotyczy dostarczonej przez wywołującego listy HTTP `tools`, a nie każdego wewnętrznego narzędzia agenta OpenClaw. Żądania niestrumieniowe zwracają `502` z `api_error`; żądania strumieniowe emitują zdarzenie `response.failed`. Odpowiada to kontraktowi `/v1/chat/completions`.

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

- Zawartość pliku jest dekodowana i dodawana do **promptu systemowego**, a nie wiadomości użytkownika,
  więc pozostaje efemeryczna (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim zostanie dodany,
  więc bajty pliku są traktowane jako dane, a nie zaufane instrukcje.
- Wstrzyknięty blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych
  `Source: External`.
- Ta ścieżka wejścia plikowego celowo pomija długi baner `SECURITY NOTICE:`, aby
  zachować budżet promptu; znaczniki graniczne i metadane nadal pozostają na miejscu.
- PDF-y są najpierw parsowane pod kątem tekstu. Jeśli znaleziono mało tekstu, pierwsze strony są
  rasteryzowane do obrazów i przekazywane do modelu, a wstrzyknięty blok pliku używa
  placeholdera `[PDF content rendered to images]`.

Parsowanie PDF zapewnia dołączony Plugin `document-extract`, który używa
`clawpdf` i spakowanego z nim runtime PDFium WebAssembly do ekstrakcji tekstu i
renderowania stron.

Domyślne ustawienia pobierania URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba części `input_file` + `input_image` opartych na URL na żądanie)
- Żądania są chronione (rozwiązywanie DNS, blokowanie prywatnych adresów IP, limity przekierowań, timeouty).
- Opcjonalne listy dozwolonych nazw hostów są obsługiwane osobno dla każdego typu wejścia (`files.urlAllowlist`, `images.urlAllowlist`).
  - Dokładny host: `"cdn.example.com"`
  - Subdomeny z wieloznacznikiem: `"*.assets.example.com"` (nie pasuje do apex)
  - Puste lub pominięte listy dozwolonych oznaczają brak ograniczenia listą dozwolonych nazw hostów.
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
- Źródła HEIC/HEIF `input_image` są akceptowane, gdy dostępny jest konwerter systemowy, i normalizowane do JPEG przed dostarczeniem do dostawcy. Obsługiwane konwertery to macOS `sips`, ImageMagick, GraphicsMagick lub ffmpeg.

Uwaga dotycząca bezpieczeństwa:

- Listy dozwolonych URL są egzekwowane przed pobraniem i przy skokach przekierowań.
- Dodanie nazwy hosta do listy dozwolonych nie omija blokowania prywatnych/wewnętrznych adresów IP.
- W przypadku Gateway wystawionych do internetu stosuj kontrolę ruchu wychodzącego sieci oprócz zabezpieczeń na poziomie aplikacji.
  Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `event: <type>` i `data: <json>`
- Strumień kończy się przez `data: [DONE]`

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

`usage` jest wypełniane, gdy bazowy dostawca zgłasza liczby tokenów.
OpenClaw normalizuje popularne aliasy w stylu OpenAI, zanim te liczniki trafią
do dalszych powierzchni statusu/sesji, w tym `input_tokens` / `output_tokens`
oraz `prompt_tokens` / `completion_tokens`.

## Błędy

Błędy używają obiektu JSON takiego jak:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Typowe przypadki:

- `401` brakujące/nieprawidłowe uwierzytelnianie
- `400` nieprawidłowa treść żądania
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

- [Uzupełnienia czatu OpenAI](/pl/gateway/openai-http-api)
- [OpenAI](/pl/providers/openai)
