---
read_when:
    - Integracja narzędzi korzystających z interfejsu OpenAI Chat Completions
summary: Udostępnij z poziomu Gateway zgodny z OpenAI punkt końcowy HTTP `/v1/chat/completions`
title: Uzupełnienia czatu OpenAI
x-i18n:
    generated_at: "2026-07-12T15:09:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway może udostępniać niewielki interfejs Chat Completions zgodny z OpenAI. Jest on **domyślnie wyłączony**.

Po włączeniu udostępnia wszystkie poniższe punkty końcowe na tym samym porcie co Gateway (multipleksowanie WS + HTTP):

| Metoda | Ścieżka                |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Żądania są wykonywane jako zwykłe uruchomienia agenta Gateway (tą samą ścieżką kodu co `openclaw agent`), dlatego routing, uprawnienia i konfiguracja odpowiadają ustawieniom Gateway.

## Włączanie punktu końcowego

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

Aby wyłączyć, ustaw `enabled: false` (lub pomiń tę opcję).

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako zapewniający **pełny dostęp operatora** do instancji Gateway:

- Prawidłowy token lub hasło Gateway dla tego punktu końcowego jest równoważne poświadczeniu właściciela/operatora, a nie wąskiemu zakresowi przypisanemu do użytkownika.
- Żądania przechodzą tą samą ścieżką agenta warstwy sterowania co zaufane działania operatora, więc jeśli zasady agenta docelowego zezwalają na użycie wrażliwych narzędzi, ten punkt końcowy również może z nich korzystać.
- Udostępniaj go wyłącznie przez local loopback, tailnet lub prywatny punkt wejścia. Nie udostępniaj go w publicznym Internecie.

Macierz uwierzytelniania:

| Ścieżka uwierzytelniania                                                                              | Zachowanie                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`                             | Potwierdza posiadanie współdzielonego sekretu Gateway. Ignoruje każdy nagłówek `x-openclaw-scopes` i przywraca pełny domyślny zestaw zakresów operatora: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Traktuje tury czatu jako tury nadawcy będącego właścicielem. |
| Zaufane żądanie HTTP z tożsamością (uwierzytelnianie przez zaufane proxy lub `gateway.auth.mode="none"` w prywatnym punkcie wejścia) | Uwzględnia `x-openclaw-scopes`, jeśli jest obecny; w przeciwnym razie używa domyślnego zestawu zakresów operatora. Traci semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`. Wymaga `operator.admin` do mechanizmów sterowania na poziomie właściciela, takich jak `x-openclaw-model`. |

Zobacz [Zakresy operatora](/pl/gateway/operator-scopes), [Bezpieczeństwo](/pl/gateway/security) i [Dostęp zdalny](/pl/gateway/remote).

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway (szczegóły tego trybu znajdziesz w sekcji [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)):

| Tryb                                | Sposób uwierzytelniania                                                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Ustawiane przez `gateway.auth.token` lub `OPENCLAW_GATEWAY_TOKEN`.                                                                                                        |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Ustawiane przez `gateway.auth.password` lub `OPENCLAW_GATEWAY_PASSWORD`.                                                                                              |
| `gateway.auth.mode="trusted-proxy"` | Kieruj ruch przez skonfigurowane proxy uwzględniające tożsamość, które wstrzykuje wymagane nagłówki tożsamości. Proxy local loopback na tym samym hoście wymaga jawnego ustawienia `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Nagłówek uwierzytelniania nie jest wymagany (wyłącznie prywatny punkt wejścia).                                                                                                                            |

Uwagi:

- Wywołujący z tego samego hosta, którzy omijają proxy w Gateway działającym w trybie `trusted-proxy`, mogą użyć bezpośrednio `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Obecność w nagłówkach jakichkolwiek danych `Forwarded`, `X-Forwarded-*` lub `X-Real-IP` powoduje jednak, że żądanie pozostaje na ścieżce zaufanego proxy.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i zbyt wiele prób uwierzytelnienia zakończy się niepowodzeniem, punkt końcowy zwraca `429` z nagłówkiem `Retry-After`.

## Kiedy używać tego punktu końcowego

- Preferuj go zamiast dodawania nowego wbudowanego kanału, jeśli integracja jest tylko kolejnym interfejsem operatora/klienta dla tego samego Gateway.
- W przypadku natywnych klientów mobilnych łączących się bezpośrednio ze zdalnym Gateway preferuj [WebChat](/pl/web/webchat) lub [protokół Gateway](/pl/gateway/protocol) z przepływem inicjalizacji sparowanego urządzenia i tokenu urządzenia, aby urządzenie nie potrzebowało współdzielonego tokenu ani hasła HTTP.
- Zamiast tego utwórz Plugin kanału, jeśli integrujesz zewnętrzną sieć komunikacyjną mającą własnych użytkowników, pokoje, dostarczanie przez Webhook lub transport wychodzący. Zobacz [Tworzenie pluginów](/pl/plugins/building-plugins).

## Kontrakt modelu zorientowany na agenta

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu dostawcy.

| Wartość `model`                              | Kieruje do                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                   | Skonfigurowanego domyślnego agenta                                                                                                       |
| `openclaw/default`                           | Skonfigurowanego domyślnego agenta (stabilny alias; można go bezpiecznie zapisać na stałe, nawet jeśli rzeczywisty identyfikator domyślnego agenta różni się między środowiskami) |
| `openclaw/<agentId>` lub `openclaw:<agentId>` | Określonego agenta                                                                                                                       |
| `agent:<agentId>`                            | Określonego agenta (alias zgodności)                                                                                                     |

Opcjonalne nagłówki żądania:

| Nagłówek                                        | Działanie                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Zastępuje model zaplecza wybranego agenta. Wywołujący używający współdzielonego sekretu typu bearer mogą korzystać z tego bezpośrednio; wywołujący z tożsamością (`trusted-proxy` lub prywatny punkt wejścia bez uwierzytelniania z `x-openclaw-scopes`) potrzebują `operator.admin`, w przeciwnym razie otrzymają `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Zastąpienie wyboru agenta na potrzeby zgodności.                                                                                                                                                                                                                                                                                          |
| `x-openclaw-session-key: <sessionKey>`          | Jawny routing sesji. Odrzucany z błędem `400 invalid_request_error`, jeśli używa zarezerwowanej wewnętrznej przestrzeni nazw (`subagent:`, `cron:`, `acp:`).                                                                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | Ustawia syntetyczny kontekst kanału punktu wejścia dla monitów i zasad uwzględniających kanał.                                                                                                                                                                                                                                            |

`/v1/models` wyświetla cele agentów najwyższego poziomu (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), a nie modele dostawców zaplecza ani podagentów; podagenci pozostają wewnętrzną topologią wykonywania. Jeśli pominiesz `x-openclaw-model`, wybrany agent będzie działać ze swoim zwykłym skonfigurowanym modelem.

`/v1/embeddings` używa tych samych identyfikatorów `model` wskazujących cele agentów. Wyślij `x-openclaw-model` (jako wywołujący używający współdzielonego sekretu lub wywołujący z tożsamością i zakresem `operator.admin`), aby wybrać określony model osadzania; w przeciwnym razie żądanie użyje zwykłej konfiguracji osadzania wybranego agenta.

## Zachowanie sesji

Domyślnie punkt końcowy jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu kolejne wywołania mogą współdzielić sesję agenta. W aplikacjach niestandardowych używaj ponownie tej samej wartości `user` w ramach jednego wątku konwersacji; unikaj identyfikatorów na poziomie konta, chyba że chcesz, aby wiele konwersacji lub urządzeń współdzieliło jedną sesję OpenClaw. Używaj `x-openclaw-session-key` tylko wtedy, gdy potrzebujesz jawnej kontroli routingu między wieloma klientami lub wątkami, korzystając z kluczy należących do aplikacji i unikających wymienionych powyżej zarezerwowanych przestrzeni nazw.

## Limity żądań (konfiguracja)

Wartości domyślne można dostosować w `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
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

| Klucz                 | Wartość domyślna                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20 MB                                                                                                |
| `maxImageParts`       | 8 (maksymalna liczba części `image_url` odczytywanych z najnowszej wiadomości użytkownika)           |
| `maxTotalImageBytes`  | 20 MB (łączna liczba zdekodowanych bajtów ze wszystkich części `image_url` w jednym żądaniu)         |
| `images.allowUrl`     | `false` (części `image_url` pochodzące z adresu URL są odrzucane, jeśli ta opcja nie jest włączona)   |
| `images.maxBytes`     | 10 MB na obraz                                                                                       |
| `images.maxRedirects` | 3                                                                                                    |
| `images.timeoutMs`    | 10 s                                                                                                 |

Źródła `image_url` w formacie HEIC/HEIF są akceptowane i normalizowane do JPEG przed przekazaniem dostawcy przez współdzielony procesor obrazów OpenClaw (Rastermill), który w przypadku formatów wymagających obsługi zewnętrznego kodeka korzysta awaryjnie z konwertera systemowego (`sips`, ImageMagick, GraphicsMagick lub ffmpeg).

Uwaga dotycząca bezpieczeństwa: dodanie nazwy hosta do listy dozwolonych nie omija blokowania prywatnych/wewnętrznych adresów IP. W przypadku Gateway wystawionych na internet oprócz zabezpieczeń na poziomie aplikacji zastosuj kontrolę wychodzącego ruchu sieciowego. Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Kontrakt narzędzi czatu

`/v1/chat/completions` obsługuje podzbiór narzędzi funkcyjnych zgodny z popularnymi klientami OpenAI Chat.

### Obsługiwane pola żądania

| Pole                       | Uwagi                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Tablica elementów `{ "type": "function", "function": { ... } }`                                                                                                        |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` lub `{ "type": "function", "function": { "name": "..." } }`                                                                            |
| `messages[*].role: "tool"` | Kolejne tury                                                                                                                                                            |
| `messages[*].tool_call_id` | Wiąże wynik narzędzia z wcześniejszym wywołaniem narzędzia                                                                                                              |
| `max_completion_tokens`    | Liczba; limit łącznej liczby tokenów ukończenia na wywołanie (w tym tokenów rozumowania). Obecna nazwa pola; używana, gdy przesłano zarówno to pole, jak i `max_tokens`. |
| `max_tokens`               | Liczba; starszy alias, ignorowany, gdy obecne jest również `max_completion_tokens`.                                                                                     |
| `temperature`              | Liczba 0–2; obsługa w miarę możliwości, przekazywana do dostawcy nadrzędnego. `400 invalid_request_error`, jeśli wartość jest poza zakresem.                            |
| `top_p`                    | Liczba 0–1; obsługa w miarę możliwości. `400 invalid_request_error`, jeśli wartość jest poza zakresem.                                                                  |
| `frequency_penalty`        | Liczba od -2.0 do 2.0; obsługa w miarę możliwości. `400 invalid_request_error`, jeśli wartość jest poza zakresem.                                                       |
| `presence_penalty`         | Liczba od -2.0 do 2.0; obsługa w miarę możliwości. `400 invalid_request_error`, jeśli wartość jest poza zakresem.                                                       |
| `seed`                     | Liczba całkowita; obsługa w miarę możliwości. `400 invalid_request_error` dla wartości niebędących liczbami całkowitymi.                                               |
| `stop`                     | Ciąg znaków lub tablica maksymalnie 4 ciągów; obsługa w miarę możliwości. `400 invalid_request_error` dla ponad 4 sekwencji albo elementów niebędących ciągami lub pustych. |

Wszystkie pola próbkowania i limitów tokenów korzystają z tego samego kanału parametrów strumienia agenta i są przekazywane w miarę możliwości:

- Limit tokenów: nazwę pola przesyłanego protokołem wybiera warstwa transportowa dostawcy: `max_completion_tokens` dla punktów końcowych z rodziny OpenAI, a `max_tokens` dla dostawców akceptujących wyłącznie starszą nazwę (Mistral, Chutes).
- `stop` jest mapowane na pole zatrzymania warstwy transportowej: `stop` dla backendów Chat Completions, `stop_sequences` dla Anthropic. Interfejs OpenAI Responses API nie ma parametru zatrzymania, więc `stop` nie jest stosowane w modelach opartych na Responses.
- Backend Codex Responses oparty na ChatGPT używa stałego próbkowania po stronie serwera i usuwa `temperature`/`top_p` (wraz z `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`), zanim żądanie dotrze do tego backendu.

### Nieobsługiwane warianty

Zwraca `400 invalid_request_error` w przypadku:

- `tools`, które nie jest tablicą, elementów narzędzi niebędących funkcjami lub braku `tool.function.name`
- wariantów `tool_choice`, takich jak `allowed_tools` i `custom`
- wartości `tool_choice.function.name`, które nie odpowiadają żadnemu dostarczonemu narzędziu

W przypadku `tool_choice: "required"` i `tool_choice` przypiętego do funkcji punkt końcowy zawęża udostępniony zestaw narzędzi funkcyjnych klienta, nakazuje środowisku wykonawczemu wywołać narzędzie klienta przed udzieleniem odpowiedzi i zgłasza błąd, jeśli odpowiedź agenta nie zawiera pasującego ustrukturyzowanego wywołania narzędzia klienta. Dotyczy to dostarczonej przez wywołującego listy HTTP `tools`, a nie wszystkich wewnętrznych narzędzi agenta OpenClaw.

### Format odpowiedzi narzędzia bez strumieniowania

Gdy agent wywołuje narzędzia, odpowiedź zawiera:

- `choices[0].finish_reason = "tool_calls"`
- elementy `choices[0].message.tool_calls[]` z polami `id`, `type: "function"`, `function.name`, `function.arguments` (ciąg JSON)
- Komentarz asystenta przed wywołaniem narzędzia w `choices[0].message.content` (może być pusty)

### Format strumieniowej odpowiedzi narzędzia

Gdy `stream: true`, wywołania narzędzi napływają jako przyrostowe fragmenty SSE: początkowa różnica z rolą asystenta, opcjonalne różnice komentarza asystenta, co najmniej jeden fragment `delta.tool_calls` zawierający identyfikację narzędzia i fragmenty argumentów, a następnie końcowy fragment z `finish_reason: "tool_calls"` i `data: [DONE]`.

Jeśli `stream_options.include_usage=true`, przed `[DONE]` emitowany jest końcowy fragment ze statystykami użycia.

### Pętla kontynuacji po wywołaniu narzędzia

Po otrzymaniu `tool_calls` wykonaj żądane funkcje i wyślij kolejne żądanie zawierające wcześniejszą wiadomość asystenta z wywołaniem narzędzia oraz co najmniej jedną wiadomość `role: "tool"` z pasującym `tool_call_id`. Kontynuuje to tę samą pętlę rozumowania agenta w celu utworzenia odpowiedzi końcowej.

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby otrzymywać zdarzenia wysyłane przez serwer:

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `data: <json>`
- Strumień kończy się wpisem `data: [DONE]`

## Szybka konfiguracja Open WebUI

- Bazowy adres URL: `http://127.0.0.1:18789/v1`
- Bazowy adres URL Dockera w systemie macOS: `http://host.docker.internal:18789/v1`
- Klucz API: token okaziciela Gateway
- Model: `openclaw/default`

Oczekiwane działanie: `GET /v1/models` wyświetla `openclaw/default`, a Open WebUI używa go jako identyfikatora modelu czatu. Aby użyć konkretnego dostawcy/modelu backendu, ustaw zwykły domyślny model agenta albo wyślij `x-openclaw-model` (wywołujący ze współdzielonym sekretem lub wywołujący z tożsamością i uprawnieniem `operator.admin`).

Szybki test podstawowy:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli odpowiedź zawiera `openclaw/default`, większość konfiguracji Open WebUI może połączyć się przy użyciu tego samego bazowego adresu URL i tokenu.

## Przykłady

Stabilna sesja dla jednej konwersacji aplikacji:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

W kolejnych wywołaniach dla tej konwersacji używaj ponownie tej samej wartości `user`, aby kontynuować tę samą sesję agenta.

Bez strumieniowania:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Strumieniowanie:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Wyświetlenie listy modeli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Pobranie jednego modelu:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Utworzenie reprezentacji wektorowych:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` obsługuje `input` jako ciąg znaków lub tablicę ciągów znaków.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Zakresy operatora](/pl/gateway/operator-scopes)
- [OpenAI](/pl/providers/openai)
