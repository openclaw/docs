---
read_when:
    - Polecenia CLI ClawHub lub rejestru OpenClaw kończą się niepowodzeniem
    - Pakietu nie można zainstalować, opublikować ani zaktualizować
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalacją, publikowaniem, synchronizacją, aktualizacją i API.
x-i18n:
    generated_at: "2026-05-13T04:18:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale nigdy się nie kończy

CLI uruchamia krótkotrwały lokalny serwer wywołania zwrotnego podczas logowania w przeglądarce.

- Upewnij się, że przeglądarka może połączyć się z `http://127.0.0.1:<port>/callback`.
- Sprawdź lokalną zaporę sieciową, VPN i reguły proxy, jeśli wywołanie zwrotne nigdy nie dociera.
- W środowiskach bez interfejsu graficznego utwórz token API w internetowym interfejsie ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, potwierdź, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający bieżący token.
- Jeśli używasz tokenu API, potwierdź, że nie został unieważniony w interfejsie internetowym.

## Wyszukiwanie lub instalacja zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponawianiu w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowieniem.
- `RateLimit-Remaining` i `RateLimit-Limit`: bieżący limit.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas resetu.

Jeśli wielu użytkowników współdzieli jeden wychodzący adres IP, limity anonimowych adresów IP mogą zostać osiągnięte nawet wtedy, gdy każda
osoba wysyła tylko kilka żądań. Zaloguj się tam, gdzie to możliwe, i ponów po
zgłoszonym opóźnieniu.

## Wyszukiwanie lub instalacja kończy się niepowodzeniem za proxy

CLI respektuje standardowe zmienne proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` i
`http_proxy`.

## Skills nie pojawia się w wyszukiwaniu

- Sprawdź dokładny slug lub stronę właściciela, jeśli je znasz.
- Potwierdź, że wydanie jest publiczne i nie zostało wstrzymane przez skanowanie ani moderację.
- Jeśli jesteś właścicielem Skills, zaloguj się i je sprawdź:

```bash
clawhub inspect <skill-slug>
```

Diagnostyka widoczna dla właściciela może wyjaśniać stan skanowania, blokady przesyłania lub moderacji.

## Publikacja kończy się niepowodzeniem, ponieważ brakuje wymaganych metadanych

W przypadku Skills sprawdź frontmatter w `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku plugins sprawdź metadane zgodności w `package.json`. Publikacje code-plugin
wymagają pól zgodności OpenClaw, takich jak `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`.

Najpierw podejrzyj ładunek publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikacja kończy się niepowodzeniem z powodu błędu właściciela GitHub lub źródła

ClawHub używa tożsamości GitHub i atrybucji źródła, aby powiązać pakiety z ich
wydawcami.

- Upewnij się, że jesteś zalogowany na konto GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy adres URL źródła jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` albo pełnego adresu URL GitHub.

## `sync` mówi, że nie znaleziono Skills

`sync` szuka folderów zawierających `SKILL.md` lub `skill.md`.

Wskaż mu katalogi główne, które chcesz przeskanować:

```bash
clawhub sync --root /path/to/skills
```

Najpierw użyj podglądu, jeśli nie masz pewności, co zostanie opublikowane:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` odmawia z powodu lokalnych zmian

Lokalne pliki nie pasują do żadnej wersji znanej ClawHub. Wybierz jedną opcję:

- Zachowaj lokalne edycje i pomiń aktualizację.
- Nadpisz opublikowaną wersją:

```bash
clawhub update <slug> --force
```

- Opublikuj edytowaną kopię jako nowy slug lub fork.

## Instalacja plugin kończy się niepowodzeniem w OpenClaw

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stronę szczegółów pakietu pod kątem stanu skanowania i metadanych zgodności.
- Potwierdź, że Twoja wersja OpenClaw spełnia deklarowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, wstrzymany lub zablokowany, może nie być możliwy do zainstalowania, dopóki
  właściciel nie rozwiąże problemu.

## Publiczne żądania API kończą się niepowodzeniem

- Respektuj nagłówki ponawiania `429` i buforuj publiczne odpowiedzi list/wyszukiwania.
- Odsyłaj użytkowników do kanonicznej listy ClawHub.
- Nie duplikuj ukrytych, prywatnych, wstrzymanych ani zablokowanych przez moderację treści poza
  publiczną powierzchnią API.

Zobacz [HTTP API](/pl/clawhub/http-api), aby poznać szczegóły punktów końcowych.
