---
read_when:
    - Wywoływanie narzędzi bez uruchamiania pełnej tury agenta
    - Budowanie automatyzacji wymagających egzekwowania polityki narzędzi
summary: Bezpośrednie wywołanie pojedynczego narzędzia przez punkt końcowy HTTP Gateway
title: API wywoływania narzędzi
x-i18n:
    generated_at: "2026-04-05T13:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Wywoływanie narzędzi (HTTP)

Gateway OpenClaw udostępnia prosty punkt końcowy HTTP do bezpośredniego wywoływania pojedynczego narzędzia. Jest on zawsze włączony i używa uwierzytelniania Gateway oraz polityki narzędzi. Podobnie jak powierzchnia zgodna z OpenAI `/v1/*`, uwierzytelnianie bearer oparte na współdzielonym sekrecie jest traktowane jako zaufany dostęp operatora do całego gateway.

- `POST /tools/invoke`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Domyślny maksymalny rozmiar ładunku to 2 MB.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP z przenoszeniem tożsamości (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowane proxy świadome tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego ingress (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić z
  skonfigurowanego źródła zaufanego proxy spoza loopback; proxy loopback na tym samym hoście
  nie spełniają wymagań tego trybu.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele błędów uwierzytelniania, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatora** do instancji gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresów per użytkownik.
- Prawidłowy token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenia właściciela/operatora.
- Dla trybów uwierzytelniania opartych na współdzielonym sekrecie (`token` i `password`) punkt końcowy przywraca normalne pełne domyślne uprawnienia operatora nawet wtedy, gdy wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Uwierzytelnianie współdzielonym sekretem traktuje także bezpośrednie wywołania narzędzi na tym punkcie końcowym jako tury owner-sender.
- Zaufane tryby HTTP z przenoszeniem tożsamości (na przykład uwierzytelnianie trusted proxy albo `gateway.auth.mode="none"` na prywatnym ingress) honorują `x-openclaw-scopes`, gdy nagłówek jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Ten punkt końcowy powinien być dostępny tylko przez loopback/tailnet/prywatny ingress; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje bezpośrednie wywołania narzędzi na tym punkcie końcowym jako tury owner-sender
- zaufane tryby HTTP z przenoszeniem tożsamości (na przykład uwierzytelnianie trusted proxy albo `gateway.auth.mode="none"` na prywatnym ingress)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

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

- `tool` (string, wymagane): nazwa narzędzia do wywołania.
- `action` (string, opcjonalne): mapowane do args, jeśli schemat narzędzia obsługuje `action`, a ładunek args je pomija.
- `args` (object, opcjonalne): argumenty specyficzne dla narzędzia.
- `sessionKey` (string, opcjonalne): docelowy klucz sesji. Jeśli pominięte lub `"main"`, Gateway używa skonfigurowanego głównego klucza sesji (honoruje `session.mainKey` i domyślnego agenta albo `global` w zakresie globalnym).
- `dryRun` (boolean, opcjonalne): zarezerwowane do przyszłego użycia; obecnie ignorowane.

## Zachowanie polityki + routingu

Dostępność narzędzi jest filtrowana przez ten sam łańcuch polityk używany przez agentów Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- polityki grup (jeśli klucz sesji mapuje się do grupy lub kanału)
- polityka subagenta (przy wywoływaniu z kluczem sesji subagenta)

Jeśli narzędzie nie jest dozwolone przez politykę, punkt końcowy zwraca **404**.

Ważne uwagi dotyczące granic:

- Zatwierdzenia wykonania to zabezpieczenia operatora, a nie oddzielna granica autoryzacji dla tego punktu końcowego HTTP. Jeśli narzędzie jest dostępne tutaj przez uwierzytelnianie Gateway + politykę narzędzi, `/tools/invoke` nie dodaje dodatkowego monitu zatwierdzania per wywołanie.
- Nie udostępniaj poświadczeń bearer Gateway niezaufanym wywołującym. Jeśli potrzebujesz separacji między granicami zaufania, uruchom osobne gatewaye (a najlepiej także osobnych użytkowników systemu/hosty).

HTTP Gateway stosuje też domyślnie twardą listę blokad (nawet jeśli polityka sesji zezwala na narzędzie):

- `exec` — bezpośrednie wykonywanie poleceń (powierzchnia RCE)
- `spawn` — tworzenie dowolnych procesów potomnych (powierzchnia RCE)
- `shell` — wykonywanie poleceń powłoki (powierzchnia RCE)
- `fs_write` — dowolna modyfikacja plików na hoście
- `fs_delete` — dowolne usuwanie plików na hoście
- `fs_move` — dowolne przenoszenie/zmiana nazw plików na hoście
- `apply_patch` — nakładanie poprawek może przepisywać dowolne pliki
- `sessions_spawn` — płaszczyzna sterowania orkiestracją sesji; zdalne uruchamianie agentów to RCE
- `sessions_send` — wstrzykiwanie wiadomości między sesjami
- `cron` — trwała płaszczyzna sterowania automatyzacją
- `gateway` — płaszczyzna sterowania gateway; zapobiega rekonfiguracji przez HTTP
- `nodes` — przekaźnik poleceń do węzłów może dotrzeć do `system.run` na sparowanych hostach
- `whatsapp_login` — interaktywna konfiguracja wymagająca skanu QR w terminalu; zawiesza się przez HTTP

Możesz dostosować tę listę blokad przez `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Dodatkowe narzędzia do zablokowania przez HTTP /tools/invoke
      deny: ["browser"],
      // Usuń narzędzia z domyślnej listy blokad
      allow: ["gateway"],
    },
  },
}
```

Aby pomóc politykom grup rozpoznać kontekst, możesz opcjonalnie ustawić:

- `x-openclaw-message-channel: <channel>` (przykład: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (gdy istnieje wiele kont)

## Odpowiedzi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (nieprawidłowe żądanie lub błąd wejścia narzędzia)
- `401` → brak autoryzacji
- `429` → ograniczenie szybkości uwierzytelniania (`Retry-After` ustawione)
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
