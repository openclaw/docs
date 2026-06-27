---
read_when:
    - Wywoływanie narzędzi bez uruchamiania pełnej tury agenta
    - Tworzenie automatyzacji wymagających egzekwowania zasad użycia narzędzi
summary: Wywołaj pojedyncze narzędzie bezpośrednio przez punkt końcowy HTTP Gateway
title: Interfejs API wywoływania narzędzi
x-i18n:
    generated_at: "2026-06-27T17:38:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway OpenClaw udostępnia prosty punkt końcowy HTTP do bezpośredniego wywoływania pojedynczego narzędzia. Jest zawsze włączony i używa uwierzytelniania Gateway oraz zasad narzędzi. Podobnie jak powierzchnia zgodna z OpenAI `/v1/*`, uwierzytelnianie bearer współdzielonym sekretem jest traktowane jako zaufany dostęp operatora do całego Gateway.

- `POST /tools/invoke`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Domyślny maksymalny rozmiar ładunku to 2 MB.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowane proxy świadome tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie dla prywatnego wejścia (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy local loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Wewnętrzni wywołujący z tego samego hosta, którzy omijają proxy, mogą używać
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` jako lokalnej bezpośredniej
  ścieżki awaryjnej. Jakikolwiek dowód w nagłówkach `Forwarded`, `X-Forwarded-*` lub `X-Real-IP`
  utrzymuje żądanie na ścieżce trusted-proxy.
- Jeśli `gateway.auth.rateLimit` jest skonfigurowane i wystąpi zbyt wiele nieudanych prób uwierzytelnienia, punkt końcowy zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatora** dla instancji Gateway.

- Uwierzytelnianie HTTP bearer tutaj nie jest wąskim modelem zakresów przypisanych do użytkownika.
- Prawidłowy token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenie właściciela/operatora.
- Dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca normalne pełne domyślne uprawnienia operatora, nawet jeśli wywołujący wysyła węższy nagłówek `x-openclaw-scopes`.
- Uwierzytelnianie współdzielonym sekretem traktuje też bezpośrednie wywołania narzędzi w tym punkcie końcowym jako tury nadawcy-właściciela.
- Zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufane proxy albo `gateway.auth.mode="none"` na prywatnym wejściu) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Utrzymuj ten punkt końcowy wyłącznie na loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje bezpośrednie wywołania narzędzi w tym punkcie końcowym jako tury nadawcy-właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufane proxy albo `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
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
- `action` (ciąg znaków, opcjonalne): mapowane do argumentów, jeśli schemat narzędzia obsługuje `action`, a ładunek argumentów go pominął.
- `args` (obiekt, opcjonalne): argumenty specyficzne dla narzędzia.
- `sessionKey` (ciąg znaków, opcjonalne): docelowy klucz sesji. Jeśli pominięty lub `"main"`, Gateway używa skonfigurowanego głównego klucza sesji (honoruje `session.mainKey` i domyślnego agenta albo `global` w zakresie globalnym).
- `dryRun` (wartość logiczna, opcjonalne): zarezerwowane do przyszłego użycia; obecnie ignorowane.

## Zasady i zachowanie routingu

Dostępność narzędzi jest filtrowana przez ten sam łańcuch zasad, którego używają agenci Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- zasady grup (jeśli klucz sesji mapuje się na grupę lub kanał)
- zasady subagenta (podczas wywoływania z kluczem sesji subagenta)

Jeśli narzędzie nie jest dozwolone przez zasady, punkt końcowy zwraca **404**.

Ważne uwagi dotyczące granic:

- Zatwierdzenia exec są zabezpieczeniami operatora, a nie osobną granicą autoryzacji dla tego punktu końcowego HTTP. Jeśli narzędzie jest tutaj osiągalne przez uwierzytelnianie Gateway + zasady narzędzi, `/tools/invoke` nie dodaje dodatkowego monitu o zatwierdzenie dla każdego wywołania.
- Jeśli `exec` jest tutaj osiągalne, traktuj je jako mutującą powierzchnię powłoki. Odmowa `write`, `edit`, `apply_patch` lub narzędzi HTTP zapisujących do systemu plików nie czyni wykonywania poleceń powłoki tylko do odczytu.
- Nie udostępniaj poświadczeń bearer Gateway niezaufanym wywołującym. Jeśli potrzebujesz separacji między granicami zaufania, uruchamiaj osobne Gateway (najlepiej także jako osobnych użytkowników/na osobnych hostach systemu operacyjnego).

Gateway HTTP domyślnie stosuje też twardą listę odmów (nawet jeśli zasady sesji zezwalają na narzędzie):

- `exec` - bezpośrednie wykonywanie poleceń (powierzchnia RCE)
- `spawn` - dowolne tworzenie procesów potomnych (powierzchnia RCE)
- `shell` - wykonywanie poleceń powłoki (powierzchnia RCE)
- `fs_write` - dowolna modyfikacja plików na hoście
- `fs_delete` - dowolne usuwanie plików na hoście
- `fs_move` - dowolne przenoszenie/zmiana nazwy plików na hoście
- `apply_patch` - zastosowanie poprawki może przepisać dowolne pliki
- `sessions_spawn` - orkiestracja sesji; zdalne uruchamianie agentów jest RCE
- `sessions_send` - wstrzykiwanie wiadomości między sesjami
- `cron` - płaszczyzna sterowania trwałą automatyzacją
- `gateway` - płaszczyzna sterowania gateway; zapobiega rekonfiguracji przez HTTP
- `nodes` - przekaźnik poleceń węzła może dotrzeć do system.run na sparowanych hostach
- `whatsapp_login` - interaktywna konfiguracja wymagająca skanowania kodu QR w terminalu; zawiesza się przez HTTP

Możesz dostosować tę listę odmów przez `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` jest nadpisaniem ekspozycji, a nie podniesieniem zakresu. W
trybach HTTP przenoszących tożsamość `cron`, `gateway` i `nodes` pozostają niedostępne
dla wywołujących, którzy nie mają tożsamości właściciela/administratora (`operator.admin`), nawet gdy
są wymienione w `gateway.tools.allow`. Uwierzytelnianie bearer współdzielonym sekretem nadal stosuje
pełną regułę zaufanego operatora opisaną wyżej.

Aby ułatwić zasadom grup rozpoznawanie kontekstu, opcjonalnie możesz ustawić:

- `x-openclaw-message-channel: <channel>` (przykład: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (gdy istnieje wiele kont)

## Odpowiedzi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (nieprawidłowe żądanie lub błąd danych wejściowych narzędzia)
- `401` → brak autoryzacji
- `429` → uwierzytelnianie ograniczone limitem szybkości (`Retry-After` ustawione)
- `404` → narzędzie niedostępne (nie znaleziono lub brak na liście dozwolonych)
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
- [Narzędzia i pluginy](/pl/tools)
