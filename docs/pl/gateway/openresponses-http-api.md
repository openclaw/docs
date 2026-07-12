---
read_when:
    - Integracja klientów korzystających z interfejsu OpenResponses API
    - Potrzebujesz danych wejściowych opartych na elementach, wywołań narzędzi klienta lub zdarzeń SSE
summary: Udostępnij z Gateway punkt końcowy HTTP `/v1/responses` zgodny z OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T15:06:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway może udostępniać zgodny z OpenResponses punkt końcowy `POST /v1/responses`. Jest on **domyślnie wyłączony** i współdzieli port z Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Żądania są wykonywane jak zwykłe uruchomienie agenta Gateway (tą samą ścieżką kodu co `openclaw agent`), więc routing, uprawnienia i konfiguracja odpowiadają ustawieniom Gateway.

Włącz lub wyłącz tę funkcję za pomocą `gateway.http.endpoints.responses.enabled`. Po włączeniu ta sama warstwa zgodności udostępnia również `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` i `POST /v1/chat/completions`.

## Uwierzytelnianie, bezpieczeństwo i routing

Działanie jest zgodne z opisem w sekcji [OpenAI Chat Completions](/pl/gateway/openai-http-api):

- Ścieżka uwierzytelniania odpowiada `gateway.auth.mode`: tryb wspólnego sekretu (`token`/`password`) używa `Authorization: Bearer <token-or-password>`; tryb zaufanego serwera proxy używa nagłówków proxy uwzględniających tożsamość (serwery proxy działające na tym samym hoście w trybie local loopback wymagają `gateway.auth.trustedProxy.allowLoopback = true`, a gdy nie ma nagłówka `Forwarded`/`X-Forwarded-*`/`X-Real-IP`, dostępny jest bezpośredni mechanizm rezerwowy na tym samym hoście przez `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); tryb `none` przy prywatnym ruchu przychodzącym nie wymaga nagłówka uwierzytelniania. Zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth).
- Traktuj ten punkt końcowy jako pełny dostęp operatora do instancji Gateway.
- Tryby uwierzytelniania wspólnym sekretem ignorują węższy zakres zadeklarowany przez token okaziciela w `x-openclaw-scopes` i przywracają pełny domyślny zestaw zakresów operatora: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Tury czatu w tym punkcie końcowym są traktowane jako tury nadawcy będącego właścicielem.
- Tryby HTTP przekazujące zaufaną tożsamość (zaufany serwer proxy lub `gateway.auth.mode="none"`) respektują `x-openclaw-scopes`, jeśli jest obecny, a w przeciwnym razie używają domyślnego zestawu zakresów operatora. Semantyka właściciela zostaje utracona tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`.
- Wybieraj agentów za pomocą `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` lub nagłówka `x-openclaw-agent-id`.
- Użyj `x-openclaw-model`, aby zastąpić model zaplecza wybranego agenta (w ścieżkach uwierzytelniania przekazujących tożsamość wymaga `operator.admin`).
- Użyj `x-openclaw-session-key` do jawnego routingu sesji (wartość zostanie odrzucona z błędem `400 invalid_request_error`, jeśli używa zastrzeżonej przestrzeni nazw: `subagent:`, `cron:`, `acp:`).
- Użyj `x-openclaw-message-channel`, aby ustawić kontekst syntetycznego kanału ruchu przychodzącego inny niż domyślny.

Kanoniczne wyjaśnienie modeli docelowych agentów, `openclaw/default`, przekazywania osadzeń i zastępowania modelu zaplecza zawiera sekcja [OpenAI Chat Completions](/pl/gateway/openai-http-api#agent-first-model-contract).

Zobacz [Zakresy operatora](/pl/gateway/operator-scopes) i [Bezpieczeństwo](/pl/gateway/security).

## Działanie sesji

Domyślnie punkt końcowy jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenResponses `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

`previous_response_id` ponownie wykorzystuje sesję wcześniejszej odpowiedzi, jeśli żądanie pozostaje w tym samym zakresie agenta, użytkownika i żądanej sesji (dopasowanie według podmiotu uwierzytelniania, identyfikatora agenta i `x-openclaw-session-key`).

## Struktura żądania

| Pole                                                             | Obsługa                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | Ciąg znaków lub tablica obiektów elementów.                                                                                                            |
| `instructions`                                                   | Scalane z monitem systemowym.                                                                                                                          |
| `tools`                                                          | Definicje narzędzi klienta (narzędzia funkcyjne).                                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` lub `{ "type": "function", "name": "..." }`, aby filtrować narzędzia klienta lub wymagać ich użycia.                  |
| `stream`                                                         | Włącza strumieniowanie SSE.                                                                                                                            |
| `max_output_tokens`                                              | Orientacyjny limit danych wyjściowych (zależny od dostawcy).                                                                                           |
| `temperature`                                                    | Orientacyjna temperatura próbkowania. Ignorowana przez zaplecze Codex Responses oparte na ChatGPT, które używa stałych parametrów próbkowania serwera. |
| `top_p`                                                          | Orientacyjne próbkowanie jądrowe. Obowiązuje to samo zastrzeżenie dotyczące Codex Responses co dla `temperature`.                                      |
| `user`                                                           | Stabilny routing sesji.                                                                                                                                |
| `previous_response_id`                                           | Ciągłość sesji (zobacz wyżej).                                                                                                                         |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Akceptowane, ale obecnie ignorowane.                                                                                                                   |

## Elementy (`input`)

### `message`

Role: `system`, `developer`, `user`, `assistant`.

- `system` i `developer` są dołączane do monitu systemowego.
- Najnowszy element `user` lub `function_call_output` staje się „bieżącą wiadomością”.
- Wcześniejsze wiadomości użytkownika i asystenta są dołączane jako historia zapewniająca kontekst.

### `function_call_output` (narzędzia działające w turach)

Odeślij wyniki narzędzi do modelu:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` i `item_reference`

Akceptowane w celu zachowania zgodności ze schematem, ale ignorowane podczas tworzenia monitu.

## Narzędzia (narzędzia funkcyjne po stronie klienta)

Przekaż narzędzia za pomocą `tools: [{ type: "function", name, description?, parameters? }]`.

Jeśli agent wywoła narzędzie, odpowiedź zwróci element wyjściowy `function_call`. Aby kontynuować turę, wyślij kolejne żądanie z `function_call_output`.

W przypadku `tool_choice: "required"` oraz `tool_choice` przypiętego do funkcji punkt końcowy zawęża udostępniony zestaw funkcyjnych narzędzi klienta, nakazuje środowisku wykonawczemu wywołanie narzędzia klienta przed udzieleniem odpowiedzi i odrzuca turę, jeśli nie zawiera ona pasującego ustrukturyzowanego wywołania narzędzia klienta, zgodnie z kontraktem `/v1/chat/completions`. Żądania niestrumieniowe zwracają `502` z błędem `api_error`; żądania strumieniowe emitują zdarzenie `response.failed`.

## Obrazy (`input_image`)

Obsługuje źródła base64 lub adresy URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Dozwolone typy MIME (domyślnie): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Maksymalny rozmiar (domyślnie): 10 MB.

## Pliki (`input_file`)

Obsługuje źródła base64 lub adresy URL:

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

Dozwolone typy MIME (domyślnie): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Maksymalny rozmiar (domyślnie): 5 MB.

Bieżące działanie:

- Zawartość pliku jest dekodowana i dodawana do **monitu systemowego**, a nie do wiadomości użytkownika, dzięki czemu pozostaje tymczasowa (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowywany jako **niezaufana zawartość zewnętrzna** przed dodaniem, dzięki czemu bajty pliku są traktowane jako dane, a nie zaufane instrukcje. Wstrzyknięty blok używa jawnych znaczników granic (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) oraz wiersza metadanych `Source: External`. Celowo pomija długi baner `SECURITY NOTICE:`, aby oszczędzić budżet monitu; znaczniki granic i metadane nadal obowiązują.
- Pliki PDF są najpierw analizowane w celu wyodrębnienia tekstu. Jeśli znaleziono niewiele tekstu, pierwsze strony są rasteryzowane do obrazów i przekazywane do modelu, a wstrzyknięty blok pliku używa symbolu zastępczego `[PDF content rendered to images]`.

Analizowanie plików PDF zapewnia dołączony Plugin `document-extract`, który używa `clawpdf` i dołączonego do niego środowiska wykonawczego PDFium WebAssembly do wyodrębniania tekstu i renderowania stron.

Domyślne ustawienia pobierania z adresów URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba części `input_file` i `input_image` opartych na adresach URL w jednym żądaniu)
- Żądania są zabezpieczone (rozwiązywanie DNS, blokowanie prywatnych adresów IP, limity przekierowań i limity czasu).
- Dla każdego typu danych wejściowych obsługiwane są opcjonalne listy dozwolonych nazw hostów (`files.urlAllowlist`, `images.urlAllowlist`): dokładny host (`"cdn.example.com"`) lub wieloznaczne subdomeny (`"*.assets.example.com"`, bez dopasowania domeny głównej). Puste lub pominięte listy dozwolonych oznaczają brak ograniczeń według nazwy hosta.
- Aby całkowicie wyłączyć pobieranie z adresów URL, ustaw `files.allowUrl: false` lub `images.allowUrl: false`, albo obie te wartości.

## Limity plików i obrazów (konfiguracja)

Wartości domyślne można dostosować w `gateway.http.endpoints.responses`:

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
            maxChars: 60000,
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

Wartości domyślne w przypadku pominięcia:

| Klucz                    | Wartość domyślna |
| ------------------------ | ---------------- |
| `maxBodyBytes`           | 20 MB            |
| `maxUrlParts`            | 8                |
| `files.maxBytes`         | 5 MB             |
| `files.maxChars`         | 60 tys.          |
| `files.maxRedirects`     | 3                |
| `files.timeoutMs`        | 10 s             |
| `files.pdf.maxPages`     | 4                |
| `files.pdf.maxPixels`    | 4 000 000        |
| `files.pdf.minTextChars` | 200              |
| `images.maxBytes`        | 10 MB            |
| `images.maxRedirects`    | 3                |
| `images.timeoutMs`       | 10 s             |

Źródła `input_image` w formatach HEIC/HEIF są normalizowane do JPEG przed przekazaniem dostawcy przez współdzielony procesor obrazów OpenClaw (Rastermill), który w przypadku formatów wymagających obsługi zewnętrznych kodeków używa rezerwowo konwertera systemowego (`sips`, ImageMagick, GraphicsMagick lub ffmpeg).

Uwaga dotycząca bezpieczeństwa: listy dozwolonych adresów URL są egzekwowane przed pobraniem i na kolejnych etapach przekierowań. Dodanie nazwy hosta do listy dozwolonych nie omija blokowania prywatnych ani wewnętrznych adresów IP. W przypadku instancji Gateway dostępnych z Internetu oprócz zabezpieczeń na poziomie aplikacji zastosuj kontrolę wychodzącego ruchu sieciowego. Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby odbierać zdarzenia wysyłane przez serwer:

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `event: <type>` i `data: <json>`
- Strumień kończy się wpisem `data: [DONE]`

Obecnie emitowane typy zdarzeń: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (w przypadku błędu).

## Użycie

Pole `usage` jest wypełniane, gdy bazowy dostawca raportuje liczbę tokenów. OpenClaw normalizuje typowe aliasy w stylu OpenAI, zanim te liczniki trafią do podrzędnych interfejsów stanu i sesji, w tym `input_tokens` / `output_tokens` oraz `prompt_tokens` / `completion_tokens`.

## Błędy

Błędy używają obiektu JSON w postaci:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Typowe przypadki: `400` nieprawidłowa treść żądania, `401` brakujące lub nieprawidłowe uwierzytelnienie, `403` brak zakresu operatora, `405` nieprawidłowa metoda, `429` zbyt wiele nieudanych prób uwierzytelnienia (z nagłówkiem `Retry-After`).

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

- [Uzupełnienia czatu OpenAI](/pl/gateway/openai-http-api)
- [Zakresy operatora](/pl/gateway/operator-scopes)
- [OpenAI](/pl/providers/openai)
