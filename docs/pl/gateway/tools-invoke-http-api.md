---
read_when:
    - Wywoływanie narzędzi bez uruchamiania pełnej tury agenta
    - Tworzenie automatyzacji wymagających egzekwowania zasad narzędzi
summary: Wywołaj pojedyncze narzędzie bezpośrednio przez endpoint HTTP Gateway
title: API wywoływania narzędzi
x-i18n:
    generated_at: "2026-04-24T09:12:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Gateway OpenClaw udostępnia prosty endpoint HTTP do bezpośredniego wywoływania pojedynczego narzędzia. Jest zawsze włączony i używa uwierzytelniania Gateway oraz zasad narzędzi. Podobnie jak powierzchnia zgodna z OpenAI `/v1/*`, uwierzytelnianie bearer oparte na współdzielonym sekrecie jest traktowane jako zaufany dostęp operatora do całej Gateway.

- `POST /tools/invoke`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Domyślny maksymalny rozmiar ładunku to 2 MB.

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
  skonfigurowanego źródła zaufanego proxy spoza loopback; proxy loopback na tym samym hoście
  nie spełniają wymagań tego trybu.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele błędów uwierzytelniania, endpoint zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten endpoint jako powierzchnię **pełnego dostępu operatora** do instancji Gateway.

- Uwierzytelnianie bearer HTTP tutaj nie jest wąskim modelem zakresu per użytkownik.
- Prawidłowy token/hasło Gateway dla tego endpointu należy traktować jak poświadczenie właściciela/operatora.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) endpoint przywraca normalne pełne domyślne ustawienia operatora nawet wtedy, gdy wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Uwierzytelnianie współdzielonym sekretem traktuje także bezpośrednie wywołania narzędzi na tym endpointzie jako tury owner-sender.
- Zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie trusted proxy albo `gateway.auth.mode="none"` na prywatnym wejściu) honorują `x-openclaw-scopes`, gdy nagłówek jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Utrzymuj ten endpoint wyłącznie na loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje bezpośrednie wywołania narzędzi na tym endpointzie jako tury owner-sender
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie trusted proxy albo `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają pewną zewnętrzną zaufaną tożsamość albo granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
  - tracą semantykę owner tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

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
- `action` (string, opcjonalne): mapowane do args, jeśli schemat narzędzia obsługuje `action`, a ładunek args go pomija.
- `args` (object, opcjonalne): argumenty specyficzne dla narzędzia.
- `sessionKey` (string, opcjonalne): docelowy klucz sesji. Jeśli pominięto albo ustawiono `"main"`, Gateway używa skonfigurowanego głównego klucza sesji (honoruje `session.mainKey` i domyślnego agenta albo `global` w zakresie globalnym).
- `dryRun` (boolean, opcjonalne): zarezerwowane do przyszłego użycia; obecnie ignorowane.

## Zachowanie zasad + routowania

Dostępność narzędzi jest filtrowana przez ten sam łańcuch zasad, którego używają agenci Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- zasady grupowe (jeśli klucz sesji mapuje się do grupy albo kanału)
- zasady subagenta (przy wywołaniu z kluczem sesji subagenta)

Jeśli narzędzie nie jest dozwolone przez zasady, endpoint zwraca **404**.

Ważne uwagi o granicach:

- Zatwierdzenia exec są zabezpieczeniami operatora, a nie osobną granicą autoryzacji dla tego endpointu HTTP. Jeśli narzędzie jest osiągalne tutaj przez uwierzytelnianie Gateway + zasady narzędzi, `/tools/invoke` nie dodaje dodatkowego promptu zatwierdzenia per wywołanie.
- Nie udostępniaj poświadczeń bearer Gateway niezaufanym wywołującym. Jeśli potrzebujesz separacji pomiędzy granicami zaufania, uruchamiaj oddzielne Gateway (i najlepiej oddzielnych użytkowników OS/hosty).

Gateway HTTP domyślnie stosuje także twardą denylist (nawet jeśli zasady sesji dopuszczają narzędzie):

- `exec` — bezpośrednie wykonywanie poleceń (powierzchnia RCE)
- `spawn` — arbitralne tworzenie procesów potomnych (powierzchnia RCE)
- `shell` — wykonywanie poleceń powłoki (powierzchnia RCE)
- `fs_write` — arbitralna modyfikacja plików na hoście
- `fs_delete` — arbitralne usuwanie plików na hoście
- `fs_move` — arbitralne przenoszenie/zmiana nazw plików na hoście
- `apply_patch` — stosowanie łatek może przepisywać arbitralne pliki
- `sessions_spawn` — orkiestracja sesji; zdalne uruchamianie agentów to RCE
- `sessions_send` — wstrzykiwanie wiadomości między sesjami
- `cron` — trwała płaszczyzna sterowania automatyzacją
- `gateway` — płaszczyzna sterowania Gateway; zapobiega rekonfiguracji przez HTTP
- `nodes` — przekaźnik poleceń Node może docierać do `system.run` na sparowanych hostach
- `whatsapp_login` — interaktywna konfiguracja wymagająca skanowania kodu QR w terminalu; zawiesza się na HTTP

Możesz dostosować tę denylist przez `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Dodatkowe narzędzia do zablokowania przez HTTP /tools/invoke
      deny: ["browser"],
      // Usuń narzędzia z domyślnej denylist
      allow: ["gateway"],
    },
  },
}
```

Aby pomóc zasadom grupowym rozwiązywać kontekst, możesz opcjonalnie ustawić:

- `x-openclaw-message-channel: <channel>` (przykład: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (gdy istnieje wiele kont)

## Odpowiedzi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (nieprawidłowe żądanie albo błąd danych wejściowych narzędzia)
- `401` → brak autoryzacji
- `429` → limit szybkości uwierzytelniania (`Retry-After` ustawione)
- `404` → narzędzie niedostępne (nie znaleziono albo nie znajduje się na allowlist)
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
