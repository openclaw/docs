---
read_when:
    - Integracja narzędzi oczekujących OpenAI Chat Completions
summary: Udostępnij zgodny z OpenAI punkt końcowy HTTP /v1/chat/completions z Gateway
title: Uzupełnienia czatu OpenAI
x-i18n:
    generated_at: "2026-06-27T17:35:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw może udostępniać mały punkt końcowy Chat Completions zgodny z OpenAI.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia także:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Pod spodem żądania są wykonywane jako normalne uruchomienie agenta Gateway (ta sama ścieżka kodu co `openclaw agent`), więc routing/uprawnienia/konfiguracja odpowiadają Twojemu Gateway.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj przez skonfigurowany serwer proxy świadomy tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego ingressu (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wewnętrzni wywołujący z tego samego hosta, którzy omijają proxy, mogą używać
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` jako lokalnego bezpośredniego
  mechanizmu awaryjnego. Dowolny dowód w nagłówku `Forwarded`, `X-Forwarded-*` lub `X-Real-IP`
  zamiast tego utrzymuje żądanie na ścieżce zaufanego proxy.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele niepowodzeń uwierzytelniania, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatora** dla instancji gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresu dla pojedynczego użytkownika.
- Poprawny token/hasło Gateway dla tego punktu końcowego należy traktować jak dane uwierzytelniające właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta płaszczyzny sterowania co zaufane działania operatora.
- Dla tego punktu końcowego nie istnieje osobna granica narzędzi dla niewłaściciela/pojedynczego użytkownika; gdy wywołujący przejdzie tutaj uwierzytelnianie Gateway, OpenClaw traktuje go jako zaufanego operatora tego gateway.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca normalne pełne wartości domyślne operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Tryby HTTP przenoszące zaufaną tożsamość (na przykład uwierzytelnianie zaufanym proxy lub `gateway.auth.mode="none"`) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka agenta docelowego pozwala na wrażliwe narzędzia, ten punkt końcowy może ich używać.
- Utrzymuj ten punkt końcowy wyłącznie na loopback/tailnet/prywatnym ingressie; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu w tym punkcie końcowym jako tury wysyłane przez właściciela
- tryby HTTP przenoszące zaufaną tożsamość (na przykład uwierzytelnianie zaufanym proxy albo `gateway.auth.mode="none"` na prywatnym ingressie)
  - uwierzytelniają zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`
  - wymagają `operator.admin` dla kontrolek żądania na poziomie właściciela, takich jak `x-openclaw-model`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Zdalny dostęp](/pl/gateway/remote).

## Kiedy używać tego punktu końcowego

Używaj `/v1/chat/completions`, gdy integrujesz narzędzia lub zaufany backend po stronie aplikacji z istniejącym gateway i możesz bezpiecznie przechowywać dane uwierzytelniające operatora gateway.

- Preferuj to zamiast dodawania nowego wbudowanego kanału, gdy Twoja integracja jest po prostu kolejną powierzchnią operatora/klienta dla tego samego gateway.
- W przypadku natywnych klientów mobilnych, które łączą się bezpośrednio ze zdalnym gateway, preferuj [WebChat](/pl/web/webchat) lub [Protokół Gateway](/pl/gateway/protocol) i zaimplementuj przepływ bootstrapu sparowanego urządzenia/tokenu urządzenia, aby urządzenie nie potrzebowało współdzielonego tokenu/hasła HTTP.
- Zamiast tego zbuduj Plugin kanału, gdy integrujesz zewnętrzną sieć komunikacyjną z własnymi użytkownikami, pokojami, dostarczaniem Webhook lub transportem wychodzącym. Zobacz [Tworzenie pluginów](/pl/plugins/building-plugins).

## Kontrakt modelu z agentem na pierwszym miejscu

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu dostawcy.

- `model: "openclaw"` kieruje do skonfigurowanego agenta domyślnego.
- `model: "openclaw/default"` także kieruje do skonfigurowanego agenta domyślnego.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje model backendu dla wybranego agenta. Wywołujący bearer ze współdzielonym sekretem mogą używać tego nagłówka. Wywołujący przenoszący tożsamość, tacy jak zaufane proxy lub prywatne żądania ingress bez uwierzytelniania z `x-openclaw-scopes`, potrzebują `operator.admin`; wywołujący tylko z uprawnieniami zapisu otrzymują `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwane jako nadpisanie zgodności.
- `x-openclaw-session-key: <sessionKey>` jawnie kontroluje routing sesji. Wartość nie może używać zarezerwowanych wewnętrznych przestrzeni nazw sesji, takich jak `subagent:`, `cron:` lub `acp:`; takie żądania są odrzucane z `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` ustawia syntetyczny kontekst kanału ingress dla promptów i polityk świadomych kanału.

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

W aplikacjach niestandardowych najbezpieczniejszą wartością domyślną jest ponowne używanie tej samej wartości `user` dla danego wątku konwersacji. Unikaj identyfikatorów na poziomie konta, chyba że jawnie chcesz, aby wiele konwersacji lub urządzeń współdzieliło jedną sesję OpenClaw. Używaj `x-openclaw-session-key` tylko wtedy, gdy potrzebujesz jawnej kontroli routingu między wieloma klientami lub wątkami, i wybieraj klucze należące do aplikacji, które nie zaczynają się od zarezerwowanych wewnętrznych przestrzeni nazw, takich jak `subagent:`, `cron:` lub `acp:`.

## Dlaczego ta powierzchnia ma znaczenie

To zestaw zgodności o największym przełożeniu dla samodzielnie hostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejący klienci czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Bardziej natywne dla agentów klienty coraz częściej preferują `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="Co zwraca `/v1/models`?">
    Listę celów agentów OpenClaw.

    Zwrócone identyfikatory to wpisy `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Czy `/v1/models` wyświetla agentów czy subagentów?">
    Wyświetla cele agentów najwyższego poziomu, a nie modele dostawców backendu ani subagentów.

    Subagenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudomodele.

  </Accordion>
  <Accordion title="Dlaczego uwzględniono `openclaw/default`?">
    `openclaw/default` to stabilny alias dla skonfigurowanego agenta domyślnego.

    Oznacza to, że klienci mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator agenta domyślnego zmienia się między środowiskami.

  </Accordion>
  <Accordion title="Jak nadpisać model backendu?">
    Użyj `x-openclaw-model`. To nadpisanie na poziomie właściciela: działa ze ścieżką tokenu/hasła bearer ze współdzielonym sekretem Gateway i wymaga `operator.admin` na ścieżkach HTTP przenoszących tożsamość, takich jak uwierzytelnianie zaufanym proxy.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent działa ze swoim normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="Jak embeddingi pasują do tego kontraktu?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` celów agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embeddingów, wyślij go w `x-openclaw-model` od wywołującego ze współdzielonym sekretem albo wywołującego przenoszącego tożsamość z `operator.admin`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji embeddingów wybranego agenta.

  </Accordion>
</AccordionGroup>

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Kontrakt narzędzi czatu

`/v1/chat/completions` obsługuje podzbiór narzędzi funkcyjnych zgodny z typowymi klientami OpenAI Chat.

### Obsługiwane pola żądania

- `tools`: tablica `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` lub `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` kolejne tury
- `messages[*].tool_call_id` do powiązania wyników narzędzi z wcześniejszym wywołaniem narzędzia
- `max_completion_tokens`: liczba; limit na wywołanie dla łącznej liczby tokenów uzupełnienia (w tym tokenów rozumowania). Aktualna nazwa pola OpenAI Chat Completions; preferowana, gdy wysłano zarówno `max_completion_tokens`, jak i `max_tokens`.
- `max_tokens`: liczba; starszy alias akceptowany dla zgodności wstecznej. Ignorowany, gdy obecne jest także `max_completion_tokens`.
- `temperature`: liczba; temperatura próbkowania best-effort przekazywana do dostawcy upstream przez kanał parametrów strumienia agenta.
- `top_p`: liczba; próbkowanie jądrowe best-effort przekazywane do dostawcy upstream przez kanał parametrów strumienia agenta.
- `frequency_penalty`: liczba; kara za częstotliwość best-effort przekazywana do dostawcy upstream przez kanał parametrów strumienia agenta. Sprawdzany zakres: od -2.0 do 2.0. Zwraca `400 invalid_request_error` dla wartości spoza zakresu.
- `presence_penalty`: liczba; kara za obecność best-effort przekazywana do dostawcy upstream przez kanał parametrów strumienia agenta. Sprawdzany zakres: od -2.0 do 2.0. Zwraca `400 invalid_request_error` dla wartości spoza zakresu.
- `seed`: liczba (całkowita); seed best-effort przekazywany do dostawcy upstream przez kanał parametrów strumienia agenta. Zwraca `400 invalid_request_error` dla wartości niecałkowitych.
- `stop`: ciąg lub tablica maksymalnie 4 ciągów; sekwencje stop best-effort przekazywane do dostawcy upstream przez kanał parametrów strumienia agenta. Zwraca `400 invalid_request_error` dla więcej niż 4 sekwencji albo wpisów niebędących ciągami/pustych.

Gdy ustawione jest którekolwiek pole limitu tokenów, wartość jest przekazywana do dostawcy upstream przez kanał stream-param agenta. Rzeczywista nazwa pola wysyłana przewodowo do dostawcy upstream jest wybierana przez transport dostawcy: `max_completion_tokens` dla punktów końcowych z rodziny OpenAI oraz `max_tokens` dla dostawców, którzy akceptują tylko starszą nazwę (takich jak Mistral i Chutes). Pola próbkowania (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) korzystają z tego samego kanału stream-param; backend Codex Responses oparty na ChatGPT usuwa je po stronie serwera, ponieważ używa stałego próbkowania. `stop` również przechodzi kanałem stream-param i mapuje się na pole zatrzymania transportu (`stop` dla backendów Chat Completions, `stop_sequences` dla Anthropic); API OpenAI Responses nie ma parametru zatrzymania, więc `stop` nie jest stosowane w modelach obsługiwanych przez Responses.

### Nieobsługiwane warianty

Punkt końcowy zwraca `400 invalid_request_error` dla nieobsługiwanych wariantów narzędzi, w tym:

- `tools`, które nie jest tablicą
- wpisów narzędzi innych niż function
- brakującego `tool.function.name`
- wariantów `tool_choice`, takich jak `allowed_tools` i `custom`
- wartości `tool_choice.function.name`, które nie pasują do podanych `tools`

Dla `tool_choice: "required"` i `tool_choice` przypiętego do funkcji punkt końcowy zawęża ujawniony klientowi zestaw narzędzi funkcyjnych, instruuje środowisko wykonawcze, aby wywołało narzędzie klienta przed odpowiedzią, i zwraca błąd, jeśli odpowiedź agenta nie zawiera pasującego ustrukturyzowanego wywołania narzędzia klienta. Ten kontrakt dotyczy dostarczonej przez wywołującego listy HTTP `tools`, a nie każdego wewnętrznego narzędzia agenta OpenClaw.

### Kształt odpowiedzi narzędzia bez strumieniowania

Gdy agent zdecyduje się wywołać narzędzia, odpowiedź używa:

- wpisu `choices[0].finish_reason = "tool_calls"`
- wpisów `choices[0].message.tool_calls[]` z:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (ciąg JSON)

Komentarz asystenta przed wywołaniem narzędzia jest zwracany w `choices[0].message.content` (potencjalnie pusty).

### Kształt odpowiedzi narzędzia ze strumieniowaniem

Gdy `stream: true`, wywołania narzędzi są emitowane jako przyrostowe fragmenty SSE:

- początkowa delta roli asystenta
- opcjonalne delty komentarza asystenta
- jeden lub więcej fragmentów `delta.tool_calls` przenoszących tożsamość narzędzia i fragmenty argumentów
- końcowy fragment z `finish_reason: "tool_calls"`
- `data: [DONE]`

Jeśli `stream_options.include_usage=true`, końcowy fragment użycia jest emitowany przed `[DONE]`.

### Pętla dalszej obsługi narzędzia

Po otrzymaniu `tool_calls` klient powinien wykonać żądane funkcje i wysłać kolejne żądanie, które zawiera:

- poprzednią wiadomość asystenta z wywołaniem narzędzia
- jedną lub więcej wiadomości `role: "tool"` z pasującym `tool_call_id`

Pozwala to uruchomieniu agenta Gateway kontynuować tę samą pętlę rozumowania i wygenerować końcową odpowiedź asystenta.

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL Docker na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: Twój token bearer Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlić `openclaw/default`
- Open WebUI powinien używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz użyć konkretnego dostawcy/modelu backendu dla tego agenta, ustaw normalny domyślny model agenta albo wyślij `x-openclaw-model` z wywołującego ze współdzielonym sekretem lub wywołującego z tożsamością i `operator.admin`

Szybki test dymny:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli zwraca to `openclaw/default`, większość konfiguracji Open WebUI może połączyć się z tym samym bazowym URL i tokenem.

## Przykłady

Stabilna sesja dla jednej rozmowy w aplikacji:

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

Używaj ponownie tej samej wartości `user` w późniejszych wywołaniach dla tej rozmowy, aby kontynuować tę samą sesję agenta.

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

- `/v1/models` zwraca cele agentów OpenClaw, a nie surowe katalogi dostawców.
- `openclaw/default` jest zawsze obecny, więc jeden stabilny identyfikator działa w różnych środowiskach.
- Nadpisania dostawcy/modelu backendu należą do `x-openclaw-model`, a nie do pola OpenAI `model`. Na ścieżkach uwierzytelniania HTTP z tożsamością ten nagłówek wymaga `operator.admin`.
- `/v1/embeddings` obsługuje `input` jako ciąg lub tablicę ciągów.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
