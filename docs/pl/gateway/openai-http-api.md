---
read_when:
    - Integracja z narzędziami oczekującymi OpenAI Chat Completions
summary: Udostępnij zgodny z OpenAI punkt końcowy HTTP `/v1/chat/completions` z Gateway
title: Ukończenia czatu OpenAI
x-i18n:
    generated_at: "2026-04-24T09:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# Ukończenia czatu OpenAI (HTTP)

Gateway OpenClaw może udostępniać niewielki punkt końcowy Chat Completions zgodny z OpenAI.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia również:

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
- zaufane uwierzytelnianie HTTP niosące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowany proxy świadomy tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego ruchu przychodzącego (`gateway.auth.mode="none"`):
  nagłówek auth nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego, niebędącego loopback źródła zaufanego proxy; proxy loopback na tym samym hoście
  nie spełniają wymagań tego trybu.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele błędów uwierzytelniania, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatora** do instancji Gateway.

- Bearer auth HTTP tutaj nie jest wąskim modelem zakresu per user.
- Poprawny token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta control-plane co zaufane działania operatora.
- Na tym punkcie końcowym nie ma osobnej granicy narzędzi dla użytkownika niewłaściciela/per-user; gdy wywołujący przejdzie uwierzytelnianie Gateway, OpenClaw traktuje go jako zaufanego operatora tego Gateway.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca normalne pełne ustawienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie przez trusted proxy lub `gateway.auth.mode="none"`) honorują `x-openclaw-scopes`, gdy nagłówek jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli docelowa polityka agenta zezwala na wrażliwe narzędzia, ten punkt końcowy może ich używać.
- Utrzymuj ten punkt końcowy wyłącznie na loopback/tailnet/prywatnym ruchu przychodzącym; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz auth:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym punkcie końcowym jako tury nadawcy-właściciela
- zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie przez trusted proxy lub `gateway.auth.mode="none"` na prywatnym ruchu przychodzącym)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka brak
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Dostęp zdalny](/pl/gateway/remote).

## Kontrakt modelu agent-first

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu providera.

- `model: "openclaw"` kieruje do skonfigurowanego agenta domyślnego.
- `model: "openclaw/default"` również kieruje do skonfigurowanego agenta domyślnego.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje model backendu dla wybranego agenta.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwane jako nadpisanie zgodności.
- `x-openclaw-session-key: <sessionKey>` w pełni kontroluje routing sesji.
- `x-openclaw-message-channel: <channel>` ustawia syntetyczny kontekst kanału wejściowego dla promptów i polityk świadomych kanału.

Aliasami zgodności, które nadal są akceptowane, są:

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

Domyślnie punkt końcowy jest **bezstanowy per request** (dla każdego wywołania generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Dlaczego ta powierzchnia ma znaczenie

To zestaw zgodności o największej dźwigni dla self-hosted frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejący klienci czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Coraz więcej klientów bardziej natywnych dla agentów preferuje `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="Co zwraca `/v1/models`?">
    Listę celów agentów OpenClaw.

    Zwracane identyfikatory to wpisy `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Czy `/v1/models` wyświetla agentów czy podagentów?">
    Wyświetla cele agentów najwyższego poziomu, a nie modele providerów backendu i nie podagentów.

    Podagenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudomodele.

  </Accordion>
  <Accordion title="Dlaczego uwzględniono `openclaw/default`?">
    `openclaw/default` to stabilny alias dla skonfigurowanego agenta domyślnego.

    Dzięki temu klienci mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator agenta domyślnego zmienia się między środowiskami.

  </Accordion>
  <Accordion title="Jak nadpisać model backendu?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent działa z normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="Jak embeddings wpisują się w ten kontrakt?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` będących celami agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embeddingów, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do zwykłej konfiguracji embeddingów wybranego agenta.

  </Accordion>
</AccordionGroup>

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno zawierać `openclaw/default`
- Open WebUI powinno używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz określony provider/model backendu dla tego agenta, ustaw zwykły model domyślny agenta lub wyślij `x-openclaw-model`

Szybki smoke:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli to zwraca `openclaw/default`, większość konfiguracji Open WebUI może połączyć się przy użyciu tego samego base URL i tokenu.

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

- `/v1/models` zwraca cele agentów OpenClaw, a nie surowe katalogi providerów.
- `openclaw/default` jest zawsze obecne, dzięki czemu jeden stabilny identyfikator działa w różnych środowiskach.
- Nadpisania provider/model backendu należą do `x-openclaw-model`, a nie do pola OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg znaków lub tablicę ciągów.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
