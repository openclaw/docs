---
read_when:
    - Integracja narzędzi wymagających OpenAI Chat Completions
summary: Udostępnij zgodny z OpenAI punkt końcowy HTTP /v1/chat/completions z Gateway
title: Uzupełnienia czatu OpenAI
x-i18n:
    generated_at: "2026-05-06T09:13:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw może udostępniać niewielki punkt końcowy Chat Completions zgodny z OpenAI.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy powierzchnia HTTP Gateway zgodna z OpenAI jest włączona, udostępnia także:

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
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowany proxy świadomy tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego wejścia (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy local loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele nieudanych prób uwierzytelniania, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatora** dla instancji gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresów dla poszczególnych użytkowników.
- Prawidłowy token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta płaszczyzny sterowania co zaufane działania operatora.
- Dla tego punktu końcowego nie ma osobnej granicy narzędzi dla nie-właściciela/poszczególnego użytkownika; gdy wywołujący przejdzie tutaj uwierzytelnianie Gateway, OpenClaw traktuje go jako zaufanego operatora tego gateway.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca normalne pełne domyślne ustawienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufany proxy lub `gateway.auth.mode="none"`) respektują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka agenta docelowego zezwala na wrażliwe narzędzia, ten punkt końcowy może ich używać.
- Trzymaj ten punkt końcowy wyłącznie na loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym punkcie końcowym jako tury nadawcy-właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufany proxy albo `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - respektują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Dostęp zdalny](/pl/gateway/remote).

## Kontrakt modelu agent-first

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu dostawcy.

- `model: "openclaw"` kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/default"` także kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje model backendu dla wybranego agenta.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwane jako zgodnościowe nadpisanie.
- `x-openclaw-session-key: <sessionKey>` w pełni kontroluje routing sesji.
- `x-openclaw-message-channel: <channel>` ustawia syntetyczny kontekst kanału wejściowego dla promptów i polityk świadomych kanału.

Nadal akceptowane aliasy zgodnościowe:

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

To zestaw zgodności o największej dźwigni dla samodzielnie hostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejące klienty czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Bardziej natywne dla agentów klienty coraz częściej preferują `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="Co zwraca `/v1/models`?">
    Listę celów agentów OpenClaw.

    Zwracane identyfikatory to wpisy `openclaw`, `openclaw/default` oraz `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Czy `/v1/models` wyświetla agentów czy podagentów?">
    Wyświetla cele agentów najwyższego poziomu, a nie modele dostawców backendu ani podagentów.

    Podagenci pozostają wewnętrzną topologią wykonywania. Nie pojawiają się jako pseudomodele.

  </Accordion>
  <Accordion title="Dlaczego uwzględniono `openclaw/default`?">
    `openclaw/default` to stabilny alias skonfigurowanego domyślnego agenta.

    Oznacza to, że klienty mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator domyślnego agenta różni się między środowiskami.

  </Accordion>
  <Accordion title="Jak nadpisać model backendu?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent uruchomi się ze swoim normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="Jak embeddings pasują do tego kontraktu?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` celów agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embeddingów, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji embeddingów wybranego agenta.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Ustaw `stream: true`, aby odbierać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL Dockera na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlić `openclaw/default`
- Open WebUI powinno używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz określonego dostawcę/model backendu dla tego agenta, ustaw normalny domyślny model agenta albo wyślij `x-openclaw-model`

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

Wyświetlanie modeli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Pobieranie jednego modelu:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Tworzenie embeddingów:

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
- `openclaw/default` jest zawsze obecny, dzięki czemu jeden stabilny identyfikator działa w różnych środowiskach.
- Nadpisania dostawcy/modelu backendu należą do `x-openclaw-model`, a nie do pola OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg lub tablicę ciągów.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
