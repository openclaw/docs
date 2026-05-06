---
read_when:
    - Integracja klientów obsługujących OpenResponses API
    - Chcesz dane wejściowe oparte na elementach, wywołania narzędzi klienta lub zdarzenia SSE
summary: Udostępnij zgodny z OpenResponses punkt końcowy HTTP /v1/responses w Gateway
title: Interfejs API OpenResponses
x-i18n:
    generated_at: "2026-05-06T09:13:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway OpenClaw może udostępniać zgodny z OpenResponses punkt końcowy `POST /v1/responses`.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/responses`
- Ten sam port co Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co
`openclaw agent`), więc routing/uprawnienia/konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie, bezpieczeństwo i routing

Zachowanie operacyjne odpowiada [OpenAI Chat Completions](/pl/gateway/openai-http-api):

- użyj pasującej ścieżki uwierzytelniania HTTP Gateway:
  - uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
  - uwierzytelnianie przez zaufany proxy (`gateway.auth.mode="trusted-proxy"`): nagłówki proxy świadome tożsamości ze skonfigurowanego zaufanego źródła proxy; proxy local loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`
  - otwarte uwierzytelnianie dla prywatnego wejścia (`gateway.auth.mode="none"`): brak nagłówka uwierzytelniania
- traktuj punkt końcowy jako pełny dostęp operatora do instancji Gateway
- dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) ignoruj węższe wartości `x-openclaw-scopes` deklarowane przez bearer i przywróć normalne pełne domyślne uprawnienia operatora
- dla trybów HTTP z zaufaną tożsamością (na przykład uwierzytelnianie przez zaufany proxy lub `gateway.auth.mode="none"`) honoruj `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wróć do normalnego domyślnego zestawu zakresów operatora
- wybieraj agentów za pomocą `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` albo `x-openclaw-agent-id`
- użyj `x-openclaw-model`, gdy chcesz zastąpić model backendu wybranego agenta
- użyj `x-openclaw-session-key` do jawnego routingu sesji
- użyj `x-openclaw-message-channel`, gdy chcesz użyć niedomyślnego kontekstu syntetycznego kanału wejściowego

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu w tym punkcie końcowym jako tury nadawcy-właściciela
- tryby HTTP z zaufaną tożsamością (na przykład uwierzytelnianie przez zaufany proxy albo `gateway.auth.mode="none"` na prywatnym wejściu)
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Włącz lub wyłącz ten punkt końcowy za pomocą `gateway.http.endpoints.responses.enabled`.

Ta sama powierzchnia zgodności obejmuje także:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Kanoniczne wyjaśnienie, jak modele kierowane do agentów, `openclaw/default`, przekazywanie embeddings i zastąpienia modeli backendu pasują do siebie, znajdziesz w [OpenAI Chat Completions](/pl/gateway/openai-http-api#agent-first-model-contract) oraz [Lista modeli i routing agentów](/pl/gateway/openai-http-api#model-list-and-agent-routing).

## Zachowanie sesji

Domyślnie punkt końcowy jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenResponses `user`, Gateway wyprowadza z niego stabilny klucz sesji,
dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Kształt żądania (obsługiwany)

Żądanie jest zgodne z API OpenResponses z wejściem opartym na elementach. Obecna obsługa:

- `input`: ciąg znaków lub tablica obiektów elementów.
- `instructions`: scalane z promptem systemowym.
- `tools`: definicje narzędzi klienta (narzędzia funkcji).
- `tool_choice`: filtruje lub wymaga narzędzi klienta.
- `stream`: włącza strumieniowanie SSE.
- `max_output_tokens`: limit wyjścia typu best-effort (zależny od dostawcy).
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
- Wcześniejsze wiadomości użytkownika/asystenta są uwzględniane jako historia dla kontekstu.

### `function_call_output` (narzędzia oparte na turach)

Wyślij wyniki narzędzi z powrotem do modelu:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` i `item_reference`

Akceptowane ze względu na zgodność schematu, ale ignorowane podczas budowania promptu.

## Narzędzia (narzędzia funkcji po stronie klienta)

Przekaż narzędzia za pomocą `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jeśli agent zdecyduje się wywołać narzędzie, odpowiedź zwraca element wyjściowy `function_call`.
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

- Zawartość pliku jest dekodowana i dodawana do **promptu systemowego**, nie do wiadomości użytkownika,
  więc pozostaje efemeryczna (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowywany jako **niezaufana zawartość zewnętrzna** przed dodaniem,
  więc bajty pliku są traktowane jako dane, a nie jako zaufane instrukcje.
- Wstrzyknięty blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera wiersz metadanych
  `Source: External`.
- Ta ścieżka wejścia pliku celowo pomija długi baner `SECURITY NOTICE:`, aby
  oszczędzić budżet promptu; znaczniki graniczne i metadane nadal pozostają na miejscu.
- PDF-y są najpierw parsowane pod kątem tekstu. Jeśli znaleziono mało tekstu, pierwsze strony są
  rasteryzowane do obrazów i przekazywane do modelu, a wstrzyknięty blok pliku używa
  placeholdera `[PDF content rendered to images]`.

Parsowanie PDF zapewnia dołączony Plugin `document-extract`, który używa przyjaznej dla
Node starszej kompilacji `pdfjs-dist` (bez workera). Nowoczesna kompilacja PDF.js
oczekuje workerów przeglądarki/globali DOM, więc nie jest używana w Gateway.

Domyślne ustawienia pobierania URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba części `input_file` + `input_image` opartych na URL na żądanie)
- Żądania są chronione (rozwiązywanie DNS, blokowanie prywatnych adresów IP, limity przekierowań, limity czasu).
- Opcjonalne listy dozwolonych nazw hostów są obsługiwane osobno dla każdego typu wejścia (`files.urlAllowlist`, `images.urlAllowlist`).
  - Dokładny host: `"cdn.example.com"`
  - Poddomeny z symbolem wieloznacznym: `"*.assets.example.com"` (nie pasuje do domeny głównej)
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
- Źródła HEIC/HEIF `input_image` są akceptowane i normalizowane do JPEG przed dostarczeniem do dostawcy.

Uwaga dotycząca bezpieczeństwa:

- Listy dozwolonych URL są egzekwowane przed pobraniem oraz przy kolejnych przekierowaniach.
- Dodanie nazwy hosta do listy dozwolonych nie omija blokowania prywatnych/wewnętrznych adresów IP.
- Dla Gateway wystawionych do internetu stosuj kontrolę ruchu wychodzącego sieci oprócz zabezpieczeń na poziomie aplikacji.
  Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby odbierać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `event: <type>` i `data: <json>`
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
- `response.failed` (w przypadku błędu)

## Użycie

`usage` jest wypełniane, gdy bazowy dostawca zgłasza liczby tokenów.
OpenClaw normalizuje typowe aliasy w stylu OpenAI, zanim te liczniki dotrą
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
- `405` zła metoda

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
