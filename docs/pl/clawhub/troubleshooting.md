---
read_when:
    - Polecenia ClawHub CLI lub rejestru OpenClaw kończą się niepowodzeniem
    - Nie można zainstalować, opublikować ani zaktualizować pakietu
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalacją, publikowaniem, synchronizacją, aktualizacją oraz problemami z API.
x-i18n:
    generated_at: "2026-05-12T00:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale nigdy się nie kończy

CLI uruchamia krótkotrwały lokalny serwer wywołania zwrotnego podczas logowania przez przeglądarkę.

- Upewnij się, że przeglądarka może połączyć się z `http://127.0.0.1:<port>/callback`.
- Sprawdź lokalną zaporę, VPN i reguły proxy, jeśli wywołanie zwrotne nigdy nie dociera.
- W środowiskach bez interfejsu graficznego utwórz token API w interfejsie WWW ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, upewnij się, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający bieżący token.
- Jeśli używasz tokena API, upewnij się, że nie został unieważniony w interfejsie WWW.

## Wyszukiwanie lub instalacja zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponowieniu w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowną próbą.
- `RateLimit-Remaining` i `RateLimit-Limit`: bieżący limit.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas resetu.

Jeśli wielu użytkowników współdzieli jeden wychodzący adres IP, anonimowe limity IP mogą zostać osiągnięte nawet wtedy, gdy każda
osoba wysyła tylko kilka żądań. Zaloguj się tam, gdzie to możliwe, i spróbuj ponownie po
zgłoszonym opóźnieniu.

## Wyszukiwanie lub instalacja nie działa za proxy

CLI respektuje standardowe zmienne proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` i
`http_proxy`.

## Skill nie pojawia się w wyszukiwaniu

- Sprawdź dokładny slug lub stronę właściciela, jeśli ją znasz.
- Upewnij się, że wydanie jest publiczne i nie zostało wstrzymane przez skanowanie ani moderację.
- Jeśli jesteś właścicielem Skill, zaloguj się i sprawdź go:

```bash
clawhub inspect <skill-slug>
```

Diagnostyka widoczna dla właściciela może wyjaśnić stan skanowania, bramki przesyłania lub moderacji.

## Publikowanie kończy się niepowodzeniem, ponieważ brakuje wymaganych metadanych

W przypadku Skills sprawdź frontmatter w `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku pluginów sprawdź metadane zgodności w `package.json`. Publikacje pluginów kodowych
wymagają pól zgodności OpenClaw, takich jak `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`.

Najpierw podejrzyj ładunek publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikowanie kończy się niepowodzeniem z powodu błędu właściciela GitHub lub źródła

ClawHub używa tożsamości GitHub i atrybucji źródła, aby łączyć pakiety z ich
wydawcami.

- Upewnij się, że jesteś zalogowany na konto GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy URL źródła jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` albo pełnego adresu URL GitHub.

## `sync` informuje, że nie znaleziono Skills

`sync` szuka folderów zawierających `SKILL.md` lub `skill.md`.

Wskaż katalogi główne, które chcesz przeskanować:

```bash
clawhub sync --root /path/to/skills
```

Najpierw wykonaj podgląd, jeśli nie masz pewności, co zostanie opublikowane:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` odmawia wykonania z powodu lokalnych zmian

Lokalne pliki nie pasują do żadnej wersji znanej ClawHub. Wybierz jedną opcję:

- Zachowaj lokalne zmiany i pomiń aktualizację.
- Nadpisz opublikowaną wersją:

```bash
clawhub update <slug> --force
```

- Opublikuj swoją zmodyfikowaną kopię jako nowy slug lub fork.

## Instalacja pluginu kończy się niepowodzeniem w OpenClaw

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stronę szczegółów pakietu pod kątem stanu skanowania i metadanych zgodności.
- Upewnij się, że Twoja wersja OpenClaw spełnia deklarowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, wstrzymany lub zablokowany, może nie dać się zainstalować, dopóki
  właściciel nie rozwiąże problemu.

## Żądania publicznego API kończą się niepowodzeniem

- Respektuj nagłówki ponawiania `429` i buforuj publiczne odpowiedzi listy/wyszukiwania.
- Odsyłaj użytkowników do kanonicznej listy ClawHub.
- Nie odzwierciedlaj ukrytych, prywatnych, wstrzymanych ani zablokowanych przez moderację treści poza
  powierzchnią publicznego API.

Zobacz [HTTP API](/pl/clawhub/http-api), aby uzyskać szczegóły endpointów.
