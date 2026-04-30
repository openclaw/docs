---
read_when:
    - Integracja narzędzi oczekujących OpenAI Chat Completions
summary: Udostępnij z poziomu Gateway zgodny z OpenAI punkt końcowy HTTP /v1/chat/completions
title: Uzupełnienia czatu OpenAI
x-i18n:
    generated_at: "2026-04-30T09:54:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw Gateway może udostępniać mały, zgodny z OpenAI endpoint Chat Completions.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia także:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co `openclaw agent`), więc routing/uprawnienia/konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP z tożsamością (`gateway.auth.mode="trusted-proxy"`):
  kieruj przez skonfigurowane proxy świadome tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie w prywatnym wejściu (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy local loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Jeśli `gateway.auth.rateLimit` jest skonfigurowany i wystąpi zbyt wiele nieudanych prób uwierzytelniania, endpoint zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten endpoint jako powierzchnię z **pełnym dostępem operatora** dla instancji gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresów dla poszczególnych użytkowników.
- Ważny token/hasło Gateway dla tego endpointu należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta płaszczyzny sterowania co zaufane działania operatora.
- Na tym endpoincie nie ma osobnej granicy narzędzi dla nie-właściciela/poszczególnych użytkowników; gdy wywołujący przejdzie tutaj uwierzytelnianie Gateway, OpenClaw traktuje go jako zaufanego operatora dla tego gateway.
- Dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) endpoint przywraca normalne pełne wartości domyślne operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Zaufane tryby HTTP z tożsamością (na przykład uwierzytelnianie przez zaufane proxy lub `gateway.auth.mode="none"`) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka agenta docelowego dopuszcza wrażliwe narzędzia, ten endpoint może ich używać.
- Utrzymuj ten endpoint wyłącznie na local loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpoincie jako tury nadawcy-właściciela
- zaufane tryby HTTP z tożsamością (na przykład uwierzytelnianie przez zaufane proxy albo `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają pewną zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Zdalny dostęp](/pl/gateway/remote).

## Kontrakt modelu z agentem na pierwszym miejscu

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu providera.

- `model: "openclaw"` kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/default"` także kieruje do skonfigurowanego domyślnego agenta.
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

Domyślnie endpoint jest **bezstanowy dla każdego żądania** (przy każdym wywołaniu generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, więc powtarzane wywołania mogą współdzielić sesję agenta.

## Dlaczego ta powierzchnia ma znaczenie

To zestaw zgodności o największej dźwigni dla samodzielnie hostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejące klienty czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Bardziej natywne dla agentów klienty coraz częściej preferują `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="Co zwraca `/v1/models`?">
    Listę celów agentów OpenClaw.

    Zwracane identyfikatory to wpisy `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Czy `/v1/models` wymienia agentów czy subagentów?">
    Wymienia cele agentów najwyższego poziomu, a nie modele backendowych providerów ani subagentów.

    Subagenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudomodele.

  </Accordion>
  <Accordion title="Dlaczego uwzględniono `openclaw/default`?">
    `openclaw/default` to stabilny alias dla skonfigurowanego domyślnego agenta.

    Oznacza to, że klienty mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty domyślny identyfikator agenta zmienia się między środowiskami.

  </Accordion>
  <Accordion title="Jak nadpisać model backendu?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent zostanie uruchomiony ze swoim normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="Jak embeddings pasują do tego kontraktu?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` celów agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embedding, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji embedding wybranego agenta.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL Dockera na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlić `openclaw/default`
- Open WebUI powinien używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz użyć konkretnego backendowego providera/modelu dla tego agenta, ustaw normalny domyślny model agenta albo wyślij `x-openclaw-model`

Szybki test dymny:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli zwraca `openclaw/default`, większość konfiguracji Open WebUI może połączyć się z tym samym bazowym URL i tokenem.

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

Utwórz embeddings:

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

- `/v1/models` zwraca cele agentów OpenClaw, a nie surowe katalogi providerów.
- `openclaw/default` jest zawsze obecny, dzięki czemu jeden stabilny identyfikator działa we wszystkich środowiskach.
- Nadpisania backendowego providera/modelu należą do `x-openclaw-model`, a nie do pola OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg znaków lub tablicę ciągów znaków.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
