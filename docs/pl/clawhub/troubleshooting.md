---
read_when:
    - Polecenia ClawHub CLI lub rejestru OpenClaw kończą się niepowodzeniem
    - Nie można zainstalować, opublikować ani zaktualizować pakietu
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalacją, publikowaniem, synchronizacją, aktualizacją oraz interfejsem API.
x-i18n:
    generated_at: "2026-05-11T20:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale nigdy się nie kończy

CLI uruchamia krótkotrwały lokalny serwer zwrotny podczas logowania przez przeglądarkę.

- Upewnij się, że przeglądarka może połączyć się z `http://127.0.0.1:<port>/callback`.
- Sprawdź lokalną zaporę sieciową, VPN i reguły proxy, jeśli wywołanie zwrotne nigdy nie dociera.
- W środowiskach bez interfejsu graficznego utwórz token API w interfejsie webowym ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, potwierdź, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający bieżący token.
- Jeśli używasz tokena API, potwierdź, że nie został unieważniony w interfejsie webowym.

## Wyszukiwanie lub instalacja zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponowieniu w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowieniem.
- `RateLimit-Remaining` i `RateLimit-Limit`: bieżący limit.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas resetu.

Jeśli wielu użytkowników współdzieli jeden wychodzący adres IP, anonimowe limity IP mogą zostać osiągnięte nawet wtedy, gdy każda
osoba wysyła tylko kilka żądań. Zaloguj się, gdy to możliwe, i ponów próbę po
zgłoszonym opóźnieniu.

## Wyszukiwanie lub instalacja nie działa za proxy

CLI respektuje standardowe zmienne proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` oraz
`http_proxy`.

## Umiejętność nie pojawia się w wyszukiwaniu

- Sprawdź dokładny slug lub stronę właściciela, jeśli ją znasz.
- Potwierdź, że wydanie jest publiczne i nie zostało zatrzymane przez skanowanie ani moderację.
- Jeśli jesteś właścicielem umiejętności, zaloguj się i ją sprawdź:

```bash
clawhub inspect <skill-slug>
```

Diagnostyka widoczna dla właściciela może wyjaśnić stan skanowania, blokady przesyłania lub moderacji.

## Publikacja kończy się niepowodzeniem, ponieważ brakuje wymaganych metadanych

W przypadku umiejętności sprawdź frontmatter w `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku pluginów sprawdź metadane zgodności w `package.json`. Publikacje pluginów kodu
wymagają pól zgodności OpenClaw, takich jak `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`.

Najpierw podejrzyj ładunek publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikacja kończy się niepowodzeniem z powodu błędu właściciela lub źródła GitHub

ClawHub używa tożsamości GitHub i atrybucji źródła, aby połączyć pakiety z ich
wydawcami.

- Upewnij się, że jesteś zalogowany na konto GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy źródłowy URL jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` albo pełnego URL GitHub.

## `sync` informuje, że nie znaleziono żadnych umiejętności

`sync` szuka folderów zawierających `SKILL.md` lub `skill.md`.

Wskaż katalogi główne, które chcesz przeskanować:

```bash
clawhub sync --root /path/to/skills
```

Najpierw użyj podglądu, jeśli nie masz pewności, co zostanie opublikowane:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` odmawia wykonania z powodu zmian lokalnych

Pliki lokalne nie pasują do żadnej wersji znanej ClawHub. Wybierz jedną opcję:

- Zachowaj lokalne zmiany i pomiń aktualizację.
- Nadpisz opublikowaną wersją:

```bash
clawhub update <slug> --force
```

- Opublikuj edytowaną kopię jako nowy slug lub fork.

## Instalacja pluginu kończy się niepowodzeniem w OpenClaw

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stronę szczegółów pakietu pod kątem stanu skanowania i metadanych zgodności.
- Potwierdź, że Twoja wersja OpenClaw spełnia deklarowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, zatrzymany lub zablokowany, może nie dać się go zainstalować, dopóki
  właściciel nie rozwiąże problemu.

## Publiczne żądania API kończą się niepowodzeniem

- Respektuj nagłówki ponowienia `429` i buforuj publiczne odpowiedzi listy/wyszukiwania.
- Odsyłaj użytkowników do kanonicznej strony ClawHub.
- Nie kopiuj treści ukrytych, prywatnych, zatrzymanych ani zablokowanych przez moderację poza
  publiczną powierzchnię API.

Zobacz [HTTP API](/pl/clawhub/http-api), aby poznać szczegóły endpointów.
