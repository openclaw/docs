---
read_when:
    - Wywoływanie narzędzi bez wykonywania pełnego cyklu agenta
    - Tworzenie automatyzacji wymagających egzekwowania zasad użycia narzędzi
summary: Wywołaj pojedyncze narzędzie bezpośrednio przez punkt końcowy HTTP Gateway
title: Narzędzia wywołują API
x-i18n:
    generated_at: "2026-07-12T15:11:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway OpenClaw udostępnia punkt końcowy HTTP do bezpośredniego wywoływania pojedynczego narzędzia. Jest on zawsze włączony i korzysta z uwierzytelniania Gateway oraz zasad narzędzi. Podobnie jak w interfejsie zgodnym z OpenAI `/v1/*`, uwierzytelnianie typu bearer za pomocą współdzielonego sekretu jest traktowane jako zaufany dostęp operatora do całego Gateway.

- `POST /tools/invoke`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`
- Domyślny maksymalny rozmiar treści żądania: 2 MB

## Uwierzytelnianie

Korzysta z konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP przenoszące tożsamość (`gateway.auth.mode="trusted-proxy"`): skieruj ruch przez skonfigurowane proxy rozpoznające tożsamość i pozwól mu wstrzyknąć wymagane nagłówki tożsamości
- otwarte uwierzytelnianie na prywatnym wejściu (`gateway.auth.mode="none"`): nagłówek uwierzytelniania nie jest wymagany

Uwagi:

- `mode="token"` używa `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` używa `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` wymaga, aby żądanie HTTP pochodziło ze skonfigurowanego zaufanego źródła proxy; proxy local loopback na tym samym hoście wymagają jawnego ustawienia `gateway.auth.trustedProxy.allowLoopback = true`.
- Wewnętrzni wywołujący na tym samym hoście, którzy omijają proxy, mogą użyć `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` jako lokalnego bezpośredniego mechanizmu awaryjnego. Obecność dowolnego nagłówka `Forwarded`, `X-Forwarded-*` lub `X-Real-IP` powoduje, że żądanie pozostaje na ścieżce zaufanego proxy.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele nieudanych prób uwierzytelnienia, punkt końcowy zwraca `429` z nagłówkiem `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako interfejs zapewniający **pełny dostęp operatora** do instancji Gateway.

- Uwierzytelnianie HTTP typu bearer nie stanowi tutaj modelu wąskiego zakresu dla poszczególnych użytkowników.
- Prawidłowy token lub hasło Gateway dla tego punktu końcowego należy traktować jak dane uwierzytelniające właściciela lub operatora.
- W trybach uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca standardowe pełne domyślne uprawnienia operatora, nawet jeśli wywołujący wysyła węższy nagłówek `x-openclaw-scopes`.
- Uwierzytelnianie współdzielonym sekretem powoduje również, że bezpośrednie wywołania narzędzi w tym punkcie końcowym są traktowane jako tury nadawcy będącego właścicielem.
- Zaufane tryby HTTP przenoszące tożsamość (uwierzytelnianie przez zaufane proxy lub `gateway.auth.mode="none"` na prywatnym wejściu) respektują nagłówek `x-openclaw-scopes`, jeśli jest obecny, a w przeciwnym razie używają standardowego domyślnego zestawu zakresów operatora.
- Udostępniaj ten punkt końcowy wyłącznie przez local loopback, tailnet lub prywatne wejście; nie wystawiaj go bezpośrednio do publicznego Internetu.

Macierz uwierzytelniania:

| Tryb uwierzytelniania                                                                  | Zachowanie                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` lub `password` + `Authorization: Bearer ...`                                    | Potwierdza posiadanie współdzielonego sekretu operatora Gateway. Ignoruje węższe `x-openclaw-scopes`. Przywraca pełny domyślny zestaw zakresów operatora: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Traktuje bezpośrednie wywołania narzędzi jako tury nadawcy będącego właścicielem. |
| Zaufane HTTP przenoszące tożsamość (uwierzytelnianie przez zaufane proxy lub `mode="none"` na prywatnym wejściu) | Uwierzytelnia zewnętrzną zaufaną tożsamość lub granicę wdrożenia. Respektuje `x-openclaw-scopes`, jeśli jest obecny. Gdy nagłówka nie ma, używa standardowego domyślnego zestawu zakresów operatora. Traci semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`. |

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

- `tool` / `name` (ciąg znaków, wymagane): nazwa narzędzia do wywołania. Jeśli wysłano oba pola, `name` ma pierwszeństwo.
- `action` (ciąg znaków, opcjonalne): scalane z `args.action`, jeśli schemat narzędzia obsługuje właściwość `action`, a w `args` nie została ona jeszcze ustawiona.
- `args` (obiekt, opcjonalne): argumenty specyficzne dla narzędzia.
- `sessionKey` (ciąg znaków, opcjonalne): klucz sesji docelowej. Jeśli zostanie pominięty lub ma wartość `"main"`, Gateway używa skonfigurowanego klucza sesji głównej (uwzględnia `session.mainKey` i domyślnego agenta albo `global` w globalnym zakresie sesji).
- `agentId` (ciąg znaków, opcjonalne): określa klucz sesji dla danego agenta. Zwraca błąd `400`, jeśli występuje konflikt z jawnym `sessionKey`, który jest już przypisany do innego agenta.
- `idempotencyKey` (ciąg znaków, opcjonalne): używany do utworzenia stabilnego identyfikatora wywołania narzędzia.
- `dryRun` (wartość logiczna, opcjonalne): zarezerwowane do przyszłego użytku; obecnie ignorowane.

## Zachowanie zasad i routingu

Dostępność narzędzi jest filtrowana przez ten sam łańcuch zasad, którego używają agenci Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- zasady grup (jeśli klucz sesji jest przypisany do grupy lub kanału)
- zasady podagenta (podczas wywoływania z kluczem sesji podagenta)

Jeśli zasady nie zezwalają na użycie narzędzia, punkt końcowy zwraca **404**.

Ważne uwagi dotyczące granic:

- Zatwierdzenia wykonywania stanowią zabezpieczenia operatora, a nie odrębną granicę autoryzacji dla tego punktu końcowego HTTP. Jeśli narzędzie jest tutaj dostępne na podstawie uwierzytelniania Gateway i zasad narzędzi, `/tools/invoke` nie dodaje dodatkowego monitu o zatwierdzenie dla każdego wywołania.
- Jeśli `exec` jest tutaj dostępne, traktuj je jako interfejs powłoki umożliwiający modyfikacje. Odmowa dostępu do `write`, `edit`, `apply_patch` lub narzędzi HTTP zapisujących w systemie plików nie sprawia, że wykonywanie poleceń powłoki staje się tylko do odczytu.
- Nie udostępniaj danych uwierzytelniających typu bearer Gateway niezaufanym wywołującym. Jeśli potrzebujesz rozdzielenia granic zaufania, uruchom oddzielne instancje Gateway (najlepiej jako oddzielni użytkownicy systemu operacyjnego lub na oddzielnych hostach).

HTTP Gateway domyślnie stosuje również bezwzględną listę blokad (nawet jeśli zasady sesji zezwalają na użycie narzędzia):

| Narzędzie        | Powód                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| `exec`           | Bezpośrednie wykonywanie poleceń (powierzchnia RCE)                        |
| `spawn`          | Dowolne tworzenie procesów potomnych (powierzchnia RCE)                    |
| `shell`          | Wykonywanie poleceń powłoki (powierzchnia RCE)                             |
| `fs_write`       | Dowolna modyfikacja plików na hoście                                       |
| `fs_delete`      | Dowolne usuwanie plików na hoście                                          |
| `fs_move`        | Dowolne przenoszenie lub zmiana nazw plików na hoście                      |
| `apply_patch`    | Zastosowanie poprawki może nadpisać dowolne pliki                          |
| `sessions_spawn` | Orkiestracja sesji; zdalne uruchamianie agentów stanowi RCE                |
| `sessions_send`  | Wstrzykiwanie wiadomości między sesjami                                    |
| `cron`           | Płaszczyzna sterowania trwałą automatyzacją                                |
| `gateway`        | Płaszczyzna sterowania Gateway; zapobiega rekonfiguracji przez HTTP        |
| `nodes`          | Przekazywanie poleceń Node może uzyskać dostęp do `system.run` na sparowanych hostach |

`cron`, `gateway` i `nodes` są również dostępne wyłącznie dla właściciela: nawet poza tą domyślną listą blokad wywołujący niebędący właścicielem nie mogą ich używać w tym interfejsie.

Dostosuj ogólną listę blokad za pomocą `gateway.tools`:

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

`gateway.tools.allow` zastępuje ograniczenia ekspozycji, ale nie rozszerza zakresu uprawnień. W trybach HTTP przenoszących tożsamość narzędzia `cron`, `gateway` i `nodes` pozostają niedostępne dla wywołujących bez tożsamości właściciela lub administratora (`operator.admin`), nawet jeśli znajdują się na liście `gateway.tools.allow`. Uwierzytelnianie typu bearer współdzielonym sekretem nadal podlega opisanej powyżej regule pełnego zaufania do operatora.

Aby ułatwić zasadom grup określenie kontekstu, można opcjonalnie ustawić:

- `x-openclaw-message-channel: <channel>` (przykład: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (gdy istnieje wiele kont)
- `x-openclaw-message-to: <target>` (cel dostarczania dla zasad narzędzia wiadomości)
- `x-openclaw-thread-id: <threadId>` (kontekst wątku dla zasad narzędzia wiadomości)

## Odpowiedzi

| Stan  | Znaczenie                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| `200` | `{ ok: true, result }`                                                                                      |
| `400` | `{ ok: false, error: { type, message } }` (nieprawidłowe żądanie lub błąd danych wejściowych narzędzia)     |
| `401` | Brak autoryzacji                                                                                            |
| `403` | `{ ok: false, error: { type, message, requiresApproval? } }` (wywołanie narzędzia zablokowane przez zasady) |
| `404` | Narzędzie niedostępne (nie znaleziono lub nie znajduje się na liście dozwolonych)                           |
| `405` | Niedozwolona metoda                                                                                         |
| `408` | Upłynął limit czasu odczytu treści żądania                                                                  |
| `413` | Treść żądania przekroczyła maksymalny rozmiar ładunku                                                       |
| `429` | Ograniczenie częstotliwości uwierzytelniania (ustawiono `Retry-After`)                                      |
| `500` | `{ ok: false, error: { type, message } }` (nieoczekiwany błąd wykonania narzędzia; komunikat oczyszczony)   |

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
