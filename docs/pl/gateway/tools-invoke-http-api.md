---
read_when:
    - Wywoływanie narzędzi bez uruchamiania pełnej tury agenta
    - Tworzenie automatyzacji wymagających egzekwowania zasad narzędzi
summary: Wywołaj pojedyncze narzędzie bezpośrednio przez punkt końcowy HTTP Gateway
title: API wywoływania narzędzi
x-i18n:
    generated_at: "2026-04-30T09:57:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Wywoływanie narzędzi (HTTP)

Gateway OpenClaw udostępnia prosty endpoint HTTP do bezpośredniego wywoływania pojedynczego narzędzia. Jest zawsze włączony i używa uwierzytelniania Gateway oraz polityki narzędzi. Podobnie jak powierzchnia zgodna z OpenAI `/v1/*`, uwierzytelnianie bearer za pomocą współdzielonego sekretu jest traktowane jako zaufany dostęp operatorski do całego gatewaya.

- `POST /tools/invoke`
- Ten sam port co Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Domyślny maksymalny rozmiar payloadu to 2 MB.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowane proxy świadome tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie na prywatnym ingressie (`gateway.auth.mode="none"`):
  nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego zaufanego źródła proxy; proxy loopback na tym samym hoście wymagają jawnego
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele nieudanych prób uwierzytelnienia, endpoint zwraca `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten endpoint jako powierzchnię **pełnego dostępu operatorskiego** dla instancji gatewaya.

- Uwierzytelnianie bearer HTTP tutaj nie jest wąskim modelem zakresów per użytkownik.
- Prawidłowy token/hasło Gateway dla tego endpointu należy traktować jak poświadczenie właściciela/operatora.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) endpoint przywraca normalne, pełne domyślne ustawienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Uwierzytelnianie współdzielonym sekretem traktuje też bezpośrednie wywołania narzędzi na tym endpoincie jako tury nadawcy-właściciela.
- Zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufane proxy lub `gateway.auth.mode="none"` na prywatnym ingressie) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Trzymaj ten endpoint wyłącznie na loopback/tailnet/prywatnym ingressie; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gatewaya
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje bezpośrednie wywołania narzędzi na tym endpoincie jako tury nadawcy-właściciela
- zaufane tryby HTTP przenoszące tożsamość (na przykład uwierzytelnianie przez zaufane proxy albo `gateway.auth.mode="none"` na prywatnym ingressie)
  - uwierzytelniają jakąś zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka nie ma
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

- `tool` (string, wymagane): nazwa narzędzia do wywołania.
- `action` (string, opcjonalne): mapowane do args, jeśli schemat narzędzia obsługuje `action`, a payload args go pominął.
- `args` (object, opcjonalne): argumenty specyficzne dla narzędzia.
- `sessionKey` (string, opcjonalne): docelowy klucz sesji. Jeśli pominięty lub `"main"`, Gateway używa skonfigurowanego głównego klucza sesji (honoruje `session.mainKey` i domyślnego agenta albo `global` w zakresie globalnym).
- `dryRun` (boolean, opcjonalne): zarezerwowane do przyszłego użycia; obecnie ignorowane.

## Polityka i zachowanie routingu

Dostępność narzędzi jest filtrowana przez ten sam łańcuch polityk, którego używają agenci Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- polityki grup (jeśli klucz sesji mapuje się na grupę lub kanał)
- polityka subagenta (podczas wywoływania z kluczem sesji subagenta)

Jeśli polityka nie zezwala na narzędzie, endpoint zwraca **404**.

Ważne uwagi dotyczące granic:

- Zatwierdzenia exec są zabezpieczeniami operatorskimi, a nie osobną granicą autoryzacji dla tego endpointu HTTP. Jeśli narzędzie jest tutaj osiągalne przez uwierzytelnianie Gateway + politykę narzędzi, `/tools/invoke` nie dodaje dodatkowego monitu zatwierdzenia per wywołanie.
- Nie udostępniaj poświadczeń bearer Gateway niezaufanym wywołującym. Jeśli potrzebujesz separacji między granicami zaufania, uruchom osobne gatewaye (a najlepiej osobnych użytkowników/hosty systemu operacyjnego).

HTTP Gateway stosuje też domyślnie twardą listę odmów (nawet jeśli polityka sesji zezwala na narzędzie):

- `exec` — bezpośrednie wykonywanie poleceń (powierzchnia RCE)
- `spawn` — dowolne tworzenie procesów potomnych (powierzchnia RCE)
- `shell` — wykonywanie poleceń powłoki (powierzchnia RCE)
- `fs_write` — dowolna mutacja plików na hoście
- `fs_delete` — dowolne usuwanie plików na hoście
- `fs_move` — dowolne przenoszenie/zmiana nazwy plików na hoście
- `apply_patch` — stosowanie łatek może przepisywać dowolne pliki
- `sessions_spawn` — orkiestracja sesji; zdalne tworzenie agentów to RCE
- `sessions_send` — wstrzykiwanie komunikatów między sesjami
- `cron` — płaszczyzna sterowania trwałą automatyzacją
- `gateway` — płaszczyzna sterowania gatewayem; zapobiega rekonfiguracji przez HTTP
- `nodes` — przekazywanie poleceń węzłów może dotrzeć do system.run na sparowanych hostach
- `whatsapp_login` — interaktywna konfiguracja wymagająca skanowania kodu QR w terminalu; zawiesza się przez HTTP

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

Aby ułatwić politykom grup rozpoznawanie kontekstu, opcjonalnie możesz ustawić:

- `x-openclaw-message-channel: <channel>` (przykład: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (gdy istnieje wiele kont)

## Odpowiedzi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (nieprawidłowe żądanie lub błąd danych wejściowych narzędzia)
- `401` → brak autoryzacji
- `429` → ograniczenie częstotliwości uwierzytelniania (`Retry-After` ustawione)
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
