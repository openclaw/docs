---
read_when:
    - Integrowanie narzędzi oczekujących interfejsu OpenAI Chat Completions
summary: Udostępnij z Gateway zgodny z OpenAI punkt końcowy HTTP /v1/chat/completions
title: Uzupełnienia czatu OpenAI
x-i18n:
    generated_at: "2026-05-11T20:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw może udostępniać niewielki, zgodny z OpenAI endpoint Chat Completions.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia ona również:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co `openclaw agent`), więc routing, uprawnienia i konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP niosące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj przez skonfigurowany proxy świadomy tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego wejścia (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Jeśli `gateway.auth.rateLimit` jest skonfigurowane i wystąpi zbyt wiele niepowodzeń uwierzytelniania, endpoint zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten endpoint jako powierzchnię z **pełnym dostępem operatora** do instancji gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresów per użytkownik.
- Poprawny token/hasło Gateway dla tego endpointu należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta płaszczyzny sterowania co zaufane działania operatora.
- Na tym endpoincie nie ma oddzielnej granicy narzędzi dla osób niebędących właścicielem ani per użytkownik; po przejściu uwierzytelniania Gateway OpenClaw traktuje wywołującego jako zaufanego operatora dla tego gateway.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) endpoint przywraca normalne, pełne domyślne uprawnienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie zaufanym proxy lub `gateway.auth.mode="none"`) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka agenta docelowego pozwala na narzędzia wrażliwe, ten endpoint może ich używać.
- Trzymaj ten endpoint wyłącznie na loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpoincie jako tury nadawcy-właściciela
- zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie zaufanym proxy lub `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają pewną zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Dostęp zdalny](/pl/gateway/remote).

## Kontrakt modelu z agentem na pierwszym miejscu

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu dostawcy.

- `model: "openclaw"` kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/default"` również kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje model backendu dla wybranego agenta.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwany jako nadpisanie zgodności.
- `x-openclaw-session-key: <sessionKey>` w pełni kontroluje routing sesji.
- `x-openclaw-message-channel: <channel>` ustawia syntetyczny kontekst kanału wejściowego dla promptów i polityk świadomych kanału.

Nadal akceptowane aliasy zgodności:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Włączanie endpointu

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

## Wyłączanie endpointu

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

Domyślnie endpoint jest **bezstanowy per żądanie** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Dlaczego ta powierzchnia ma znaczenie

To zestaw zgodności o największej dźwigni dla samodzielnie hostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejące klienty czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Bardziej agentowe klienty coraz częściej preferują `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Listę celów agentów OpenClaw.

    Zwracane identyfikatory to wpisy `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Wyświetla cele agentów najwyższego poziomu, a nie modele dostawców backendu ani podagentów.

    Podagenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudomodele.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` jest stabilnym aliasem skonfigurowanego domyślnego agenta.

    Oznacza to, że klienty mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator domyślnego agenta zmienia się między środowiskami.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent działa ze swoim normalnym skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` celów agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu osadzeń, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji osadzeń wybranego agenta.

  </Accordion>
</AccordionGroup>

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby odbierać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Kontrakt narzędzi czatu

`/v1/chat/completions` obsługuje podzbiór narzędzi funkcyjnych zgodny z popularnymi klientami OpenAI Chat.

### Obsługiwane pola żądania

- `tools`: tablica `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` tury uzupełniające
- `messages[*].tool_call_id` do wiązania wyników narzędzi z wcześniejszym wywołaniem narzędzia

### Nieobsługiwane warianty

Endpoint zwraca `400 invalid_request_error` dla nieobsługiwanych wariantów narzędzi, w tym:

- `tools` niebędące tablicą
- wpisy narzędzi inne niż funkcyjne
- brakujące `tool.function.name`
- warianty `tool_choice`, takie jak `allowed_tools` i `custom`
- `tool_choice: "required"` (nie jest jeszcze wymuszane w czasie wykonywania; będzie obsługiwane po wdrożeniu twardego wymuszania)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (ta sama przesłanka co przy `required`)
- wartości `tool_choice.function.name`, które nie pasują do podanych `tools`

### Kształt odpowiedzi narzędzia bez strumieniowania

Gdy agent zdecyduje się wywołać narzędzia, odpowiedź używa:

- wpisów `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` z:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (ciąg JSON)

Komentarz asystenta przed wywołaniem narzędzia jest zwracany w `choices[0].message.content` (może być pusty).

### Kształt odpowiedzi narzędzia w strumieniu

Gdy `stream: true`, wywołania narzędzi są emitowane jako przyrostowe fragmenty SSE:

- początkowa delta roli asystenta
- opcjonalne delty komentarza asystenta
- jeden lub więcej fragmentów `delta.tool_calls` przenoszących tożsamość narzędzia i fragmenty argumentów
- końcowy fragment z `finish_reason: "tool_calls"`
- `data: [DONE]`

Jeśli `stream_options.include_usage=true`, końcowy fragment użycia jest emitowany przed `[DONE]`.

### Pętla uzupełniająca narzędzia

Po otrzymaniu `tool_calls` klient powinien wykonać żądane funkcje i wysłać żądanie uzupełniające, które zawiera:

- wcześniejszą wiadomość asystenta z wywołaniem narzędzia
- jedną lub więcej wiadomości `role: "tool"` z pasującym `tool_call_id`

Pozwala to uruchomieniu agenta gateway kontynuować tę samą pętlę rozumowania i wygenerować końcową odpowiedź asystenta.

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL Dockera na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlać `openclaw/default`
- Open WebUI powinien używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz konkretnego dostawcy/modelu backendu dla tego agenta, ustaw normalny domyślny model agenta albo wyślij `x-openclaw-model`

Szybki test dymny:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli zwróci `openclaw/default`, większość konfiguracji Open WebUI może połączyć się z tym samym bazowym URL-em i tokenem.

## Przykłady

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

Wyświetl modele:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Pobierz jeden model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Utwórz osadzenia:

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
- `openclaw/default` jest zawsze obecny, dzięki czemu jeden stabilny identyfikator działa między środowiskami.
- Nadpisania dostawcy/modelu backendu należą do `x-openclaw-model`, a nie pola OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg lub tablicę ciągów.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
