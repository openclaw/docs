---
read_when:
    - Integracja narzędzi wymagających OpenAI Chat Completions
summary: Udostępnij w Gateway punkt końcowy HTTP /v1/chat/completions zgodny z OpenAI
title: Uzupełnienia czatu OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw może udostępniać mały punkt końcowy Chat Completions zgodny z OpenAI.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia też:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co `openclaw agent`), więc routing/uprawnienia/konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` albo `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj przez skonfigurowany proxy świadomy tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego wejścia (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (albo `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (albo `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Jeśli `gateway.auth.rateLimit` jest skonfigurowany i wystąpi zbyt wiele nieudanych prób uwierzytelnienia, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię z **pełnym dostępem operatora** dla instancji Gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresu per użytkownik.
- Prawidłowy token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta płaszczyzny sterowania co zaufane działania operatora.
- Na tym punkcie końcowym nie ma osobnej granicy narzędzi dla nie-właściciela/per użytkownik; gdy wywołujący przejdzie tutaj uwierzytelnianie Gateway, OpenClaw traktuje go jako zaufanego operatora tego Gateway.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca normalne pełne domyślne uprawnienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufany proxy albo `gateway.auth.mode="none"`) respektują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka agenta docelowego dopuszcza narzędzia wrażliwe, ten punkt końcowy może ich używać.
- Utrzymuj ten punkt końcowy wyłącznie na loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` albo `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym punkcie końcowym jako tury wysyłane przez właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufany proxy albo `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - respektują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Dostęp zdalny](/pl/gateway/remote).

## Kontrakt modelu z agentem na pierwszym miejscu

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu providera.

- `model: "openclaw"` kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/default"` także kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje model backendu dla wybranego agenta.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwane jako nadpisanie kompatybilności.
- `x-openclaw-session-key: <sessionKey>` w pełni kontroluje routing sesji.
- `x-openclaw-message-channel: <channel>` ustawia syntetyczny kontekst kanału wejściowego dla promptów i polityk świadomych kanału.

Nadal akceptowane aliasy zgodności:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Włączanie punktu końcowego

Ustaw `gateway.http.endpoints.chatCompletions.enabled` na `true`:

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

## Wyłączanie punktu końcowego

Ustaw `gateway.http.endpoints.chatCompletions.enabled` na `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Zachowanie sesji

Domyślnie punkt końcowy jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Dlaczego ta powierzchnia ma znaczenie

To zestaw zgodności o najwyższej wartości dla samodzielnie hostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejące klienty czatu OpenAI mogą zwykle zacząć od `/v1/chat/completions`.
- Klienty bardziej natywne dla agentów coraz częściej preferują `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Listę celów agentów OpenClaw.

    Zwrócone identyfikatory to wpisy `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Wyświetla cele agentów najwyższego poziomu, nie modele backendowych providerów ani podagentów.

    Podagenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudomodele.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` jest stabilnym aliasem dla skonfigurowanego domyślnego agenta.

    Oznacza to, że klienci mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator domyślnego agenta różni się między środowiskami.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent działa ze swoim normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` celów agentów.

    Użyj `model: "openclaw/default"` albo `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embeddingów, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji embeddingów wybranego agenta.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Ustaw `stream: true`, aby odbierać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Kontrakt narzędzi czatu

`/v1/chat/completions` obsługuje podzbiór narzędzi funkcyjnych zgodny z popularnymi klientami OpenAI Chat.

### Obsługiwane pola żądania

- `tools`: tablica `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` kolejne tury
- `messages[*].tool_call_id` do wiązania wyników narzędzi z wcześniejszym wywołaniem narzędzia
- `max_completion_tokens`: liczba; limit na wywołanie dla łącznych tokenów ukończenia (w tym tokenów rozumowania). Obecna nazwa pola OpenAI Chat Completions; preferowana, gdy wysłane są zarówno `max_completion_tokens`, jak i `max_tokens`.
- `max_tokens`: liczba; starszy alias akceptowany dla zgodności wstecznej. Ignorowany, gdy obecne jest również `max_completion_tokens`.

Gdy ustawione jest którekolwiek z tych pól, wartość jest przekazywana do providera upstream przez kanał parametrów strumienia agenta. Rzeczywista nazwa pola wysłana przewodowo do providera upstream jest wybierana przez transport providera: `max_completion_tokens` dla punktów końcowych rodziny OpenAI oraz `max_tokens` dla providerów, którzy akceptują tylko starszą nazwę (takich jak Mistral i Chutes).

### Nieobsługiwane warianty

Punkt końcowy zwraca `400 invalid_request_error` dla nieobsługiwanych wariantów narzędzi, w tym:

- `tools` niebędące tablicą
- wpisy narzędzi niebędące funkcją
- brakujące `tool.function.name`
- warianty `tool_choice`, takie jak `allowed_tools` i `custom`
- `tool_choice: "required"` (nieegzekwowane jeszcze w czasie wykonywania; będzie obsługiwane po wdrożeniu twardego wymuszania)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (to samo uzasadnienie co przy `required`)
- wartości `tool_choice.function.name`, które nie pasują do podanych `tools`

### Kształt odpowiedzi narzędzi bez streamingu

Gdy agent zdecyduje się wywołać narzędzia, odpowiedź używa:

- `choices[0].finish_reason = "tool_calls"`
- wpisów `choices[0].message.tool_calls[]` z:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (ciąg JSON)

Komentarz asystenta przed wywołaniem narzędzia jest zwracany w `choices[0].message.content` (może być pusty).

### Kształt odpowiedzi narzędzi ze streamingiem

Gdy `stream: true`, wywołania narzędzi są emitowane jako przyrostowe fragmenty SSE:

- początkowa delta roli asystenta
- opcjonalne delty komentarza asystenta
- jeden lub więcej fragmentów `delta.tool_calls` przenoszących tożsamość narzędzia i fragmenty argumentów
- końcowy fragment z `finish_reason: "tool_calls"`
- `data: [DONE]`

Jeśli `stream_options.include_usage=true`, końcowy fragment użycia jest emitowany przed `[DONE]`.

### Pętla kontynuacji narzędzi

Po otrzymaniu `tool_calls` klient powinien wykonać żądane funkcje i wysłać żądanie kontynuacji zawierające:

- wcześniejszą wiadomość asystenta z wywołaniem narzędzia
- jedną lub więcej wiadomości `role: "tool"` z pasującym `tool_call_id`

Pozwala to uruchomieniu agenta Gateway kontynuować tę samą pętlę rozumowania i wygenerować końcową odpowiedź asystenta.

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL Dockera na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlić `openclaw/default`
- Open WebUI powinien używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz określonego providera/modelu backendu dla tego agenta, ustaw normalny domyślny model agenta albo wyślij `x-openclaw-model`

Szybki smoke test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli zwróci `openclaw/default`, większość konfiguracji Open WebUI może połączyć się z tym samym bazowym URL i tokenem.

## Przykłady

Bez streamingu:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

Lista modeli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Pobierz jeden model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Utwórz embeddingi:

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

Uwagi:

- `/v1/models` zwraca cele agentów OpenClaw, a nie surowe katalogi dostawców.
- `openclaw/default` jest zawsze obecny, więc jeden stabilny identyfikator działa w różnych środowiskach.
- Nadpisania dostawcy/modelu backendu należy umieszczać w `x-openclaw-model`, a nie w polu OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg znaków lub tablicę ciągów znaków.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
