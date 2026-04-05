---
read_when:
    - Integracja narzędzi oczekujących OpenAI Chat Completions
summary: Udostępnienie zgodnego z OpenAI endpointu HTTP `/v1/chat/completions` z Gateway
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T13:53:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway OpenClaw może udostępniać niewielki endpoint Chat Completions zgodny z OpenAI.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia także:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co `openclaw agent`), więc routing/uprawnienia/konfiguracja są zgodne z Twoim Gateway.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP niosące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj przez skonfigurowane proxy świadome tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego ingressu (`gateway.auth.mode="none"`):
  nie jest wymagany nagłówek uwierzytelniania

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy spoza loopback; proxy loopback na tym samym hoście
  nie spełniają tego trybu.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele błędów uwierzytelniania, endpoint zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten endpoint jako powierzchnię **pełnego dostępu operatora** do instancji gateway.

- Uwierzytelnianie bearer HTTP nie jest tutaj wąskim modelem zakresów per użytkownik.
- Prawidłowy token/hasło Gateway dla tego endpointu należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta płaszczyzny sterowania co zaufane działania operatora.
- Na tym endpoincie nie ma oddzielnej granicy narzędzi dla użytkownika niewłaściciela/per użytkownik; gdy wywołujący przejdzie tutaj uwierzytelnianie Gateway, OpenClaw traktuje go jako zaufanego operatora tego gateway.
- Dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) endpoint przywraca normalne pełne ustawienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Tryby HTTP zaufanej tożsamości (na przykład trusted proxy auth lub `gateway.auth.mode="none"`) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka docelowego agenta dopuszcza wrażliwe narzędzia, ten endpoint może ich używać.
- Utrzymuj ten endpoint tylko na loopback/tailnet/prywatnym ingressie; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpoincie jako tury nadawcy-właściciela
- tryby HTTP zaufanej tożsamości (na przykład trusted proxy auth lub `gateway.auth.mode="none"` na prywatnym ingressie)
  - uwierzytelniają pewną zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

Zobacz [Security](/gateway/security) i [Remote access](/gateway/remote).

## Kontrakt modelu agent-first

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu dostawcy.

- `model: "openclaw"` kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/default"` również kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje backendowy model dla wybranego agenta.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwane jako nadpisanie zgodności.
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

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Dlaczego ta powierzchnia ma znaczenie

To zestaw zgodności o najwyższej użyteczności dla self-hostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejące klienty czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Coraz więcej klientów bardziej natywnych dla agentów preferuje `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="Co zwraca `/v1/models`?">
    Listę celów agentów OpenClaw.

    Zwracane identyfikatory to wpisy `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Czy `/v1/models` wyświetla agentów czy sub-agentów?">
    Wyświetla cele agentów najwyższego poziomu, a nie backendowe modele dostawców ani sub-agentów.

    Sub-agenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudo-modele.

  </Accordion>
  <Accordion title="Dlaczego uwzględniono `openclaw/default`?">
    `openclaw/default` to stabilny alias dla skonfigurowanego domyślnego agenta.

    Oznacza to, że klienty mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator domyślnego agenta zmienia się między środowiskami.

  </Accordion>
  <Accordion title="Jak nadpisać backendowy model?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Jeśli go pominiesz, wybrany agent działa z normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="Jak embeddings wpisują się w ten kontrakt?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` będących celami agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embeddings, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji embeddings wybranego agenta.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL dla Docker na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlić `openclaw/default`
- Open WebUI powinno używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz konkretny backendowy dostawca/model dla tego agenta, ustaw normalny model domyślny agenta albo wyślij `x-openclaw-model`

Szybki smoke test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli to zwraca `openclaw/default`, większość konfiguracji Open WebUI może połączyć się przy użyciu tego samego bazowego URL i tokenu.

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

Ze strumieniowaniem:

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

Pobranie jednego modelu:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Tworzenie embeddings:

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
- `openclaw/default` jest zawsze obecne, więc jeden stabilny identyfikator działa w różnych środowiskach.
- Nadpisania backendowego dostawcy/modelu należą do `x-openclaw-model`, a nie do pola OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg lub tablicę ciągów.
