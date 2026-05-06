---
read_when:
    - Wywoływanie narzędzi bez uruchamiania pełnej tury agenta
    - Tworzenie automatyzacji wymagających egzekwowania zasad dotyczących narzędzi
summary: Wywołaj pojedyncze narzędzie bezpośrednio przez punkt końcowy HTTP Gateway
title: API wywoływania narzędzi
x-i18n:
    generated_at: "2026-05-06T09:15:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway OpenClaw udostępnia prosty punkt końcowy HTTP do bezpośredniego wywoływania pojedynczego narzędzia. Jest zawsze włączony i używa uwierzytelniania Gateway oraz zasad dla narzędzi. Podobnie jak powierzchnia zgodna z OpenAI `/v1/*`, uwierzytelnianie bearer współdzielonym sekretem jest traktowane jako zaufany dostęp operatorski do całego gatewaya.

- `POST /tools/invoke`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Domyślny maksymalny rozmiar payloadu to 2 MB.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowany serwer proxy świadomy tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego ingressu (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy local loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele nieudanych prób uwierzytelniania, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatorskiego** dla instancji gatewaya.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresów per użytkownik.
- Prawidłowy token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenie właściciela/operatora.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca zwykłe pełne domyślne ustawienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Uwierzytelnianie współdzielonym sekretem traktuje też bezpośrednie wywołania narzędzi w tym punkcie końcowym jako tury nadawcy-właściciela.
- Zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufane proxy lub `gateway.auth.mode="none"` na prywatnym ingressie) respektują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do zwykłego domyślnego zestawu zakresów operatora.
- Utrzymuj ten punkt końcowy wyłącznie na local loopback/tailnecie/prywatnym ingressie; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gatewaya
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje bezpośrednie wywołania narzędzi w tym punkcie końcowym jako tury nadawcy-właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufane proxy albo `gateway.auth.mode="none"` na prywatnym ingressie)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - respektują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do zwykłego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęża zakresy i pomija `operator.admin`

## Treść żądania

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Pola:

- `tool` (ciąg znaków, wymagane): nazwa narzędzia do wywołania.
- `action` (ciąg znaków, opcjonalne): mapowane do args, jeśli schemat narzędzia obsługuje `action`, a payload args je pominął.
- `args` (obiekt, opcjonalne): argumenty specyficzne dla narzędzia.
- `sessionKey` (ciąg znaków, opcjonalne): docelowy klucz sesji. Jeśli pominięty lub `"main"`, Gateway używa skonfigurowanego głównego klucza sesji (respektuje `session.mainKey` i domyślnego agenta albo `global` w zakresie globalnym).
- `dryRun` (wartość logiczna, opcjonalne): zarezerwowane do przyszłego użycia; obecnie ignorowane.

## Zasady i zachowanie routingu

Dostępność narzędzi jest filtrowana przez ten sam łańcuch zasad, którego używają agenci Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- zasady grupowe (jeśli klucz sesji mapuje się na grupę lub kanał)
- zasady subagenta (podczas wywoływania z kluczem sesji subagenta)

Jeśli narzędzie nie jest dozwolone przez zasady, punkt końcowy zwraca **404**.

Ważne uwagi dotyczące granic:

- Zatwierdzenia exec są zabezpieczeniami operatorskimi, a nie oddzielną granicą autoryzacji dla tego punktu końcowego HTTP. Jeśli narzędzie jest tutaj osiągalne przez uwierzytelnianie Gateway + zasady narzędzi, `/tools/invoke` nie dodaje dodatkowego monitu o zatwierdzenie per wywołanie.
- Nie udostępniaj poświadczeń bearer Gateway niezaufanym wywołującym. Jeśli potrzebujesz separacji między granicami zaufania, uruchom oddzielne gatewaye (najlepiej także oddzielnych użytkowników/hosty systemu operacyjnego).

HTTP Gateway domyślnie stosuje też twardą listę odmów (nawet jeśli zasady sesji dopuszczają narzędzie):

- `exec` - bezpośrednie wykonywanie poleceń (powierzchnia RCE)
- `spawn` - dowolne tworzenie procesów potomnych (powierzchnia RCE)
- `shell` - wykonywanie poleceń powłoki (powierzchnia RCE)
- `fs_write` - dowolna mutacja plików na hoście
- `fs_delete` - dowolne usuwanie plików na hoście
- `fs_move` - dowolne przenoszenie/zmiana nazw plików na hoście
- `apply_patch` - stosowanie patchy może przepisywać dowolne pliki
- `sessions_spawn` - orkiestracja sesji; zdalne uruchamianie agentów jest RCE
- `sessions_send` - wstrzykiwanie wiadomości między sesjami
- `cron` - płaszczyzna sterowania trwałą automatyzacją
- `gateway` - płaszczyzna sterowania gatewayem; zapobiega rekonfiguracji przez HTTP
- `nodes` - przekaźnik poleceń węzłów może dotrzeć do system.run na sparowanych hostach
- `whatsapp_login` - interaktywna konfiguracja wymagająca skanowania kodu QR w terminalu; zawiesza się przez HTTP

Możesz dostosować tę listę odmów przez `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Aby ułatwić zasadom grupowym rozwiązywanie kontekstu, możesz opcjonalnie ustawić:

- `x-openclaw-message-channel: <channel>` (przykład: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (gdy istnieje wiele kont)

## Odpowiedzi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (nieprawidłowe żądanie lub błąd wejścia narzędzia)
- `401` → brak autoryzacji
- `429` → uwierzytelnianie ograniczone limitem szybkości (`Retry-After` ustawione)
- `404` → narzędzie niedostępne (nie znaleziono lub nie znajduje się na liście dozwolonych)
- `405` → metoda niedozwolona
- `500` → `{ ok: false, error: { type, message } }` (nieoczekiwany błąd wykonania narzędzia; komunikat oczyszczony)

## Przykład

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Powiązane

- [Protokół Gateway](/pl/gateway/protocol)
- [Narzędzia i Pluginy](/pl/tools)
