---
read_when:
    - Polecenia CLI ClawHub lub rejestru OpenClaw kończą się niepowodzeniem
    - Nie można zainstalować, opublikować ani zaktualizować pakietu
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalacją, publikowaniem, aktualizacją i API.
x-i18n:
    generated_at: "2026-06-27T17:18:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale nigdy się nie kończy

CLI uruchamia krótkotrwały lokalny serwer wywołania zwrotnego podczas logowania w przeglądarce.

- Upewnij się, że przeglądarka może otworzyć `http://127.0.0.1:<port>/callback`.
- Sprawdź lokalną zaporę sieciową, VPN i reguły proxy, jeśli wywołanie zwrotne nigdy nie dociera.
- W środowiskach bez interfejsu graficznego utwórz token API w webowym interfejsie ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, potwierdź, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający Twój bieżący token.
- Jeśli używasz tokena API, potwierdź, że nie został unieważniony w interfejsie webowym.

## Wyszukiwanie lub instalacja zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponownej próbie w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowną próbą.
- `RateLimit-Limit`: limit zastosowany do tego żądania.
- `RateLimit-Remaining`: dokładny pozostały budżet, gdy nagłówek jest obecny. Przy `429` wynosi `0`.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas resetu.

Jeśli wielu użytkowników współdzieli jeden wychodzący adres IP, anonimowe limity IP mogą zostać osiągnięte nawet wtedy, gdy każda
osoba wysyła tylko kilka żądań. Zaloguj się tam, gdzie to możliwe, i ponów próbę po
zgłoszonym opóźnieniu.

## Wyszukiwanie lub instalacja nie działa za proxy

CLI respektuje standardowe zmienne proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` oraz
`http_proxy`.

## Umiejętność nie pojawia się w wynikach wyszukiwania

- Sprawdź dokładny slug lub stronę właściciela, jeśli je znasz.
- Potwierdź, że wydanie jest publiczne i nie zostało wstrzymane przez skanowanie lub moderację.
- Jeśli jesteś właścicielem umiejętności, zaloguj się i sprawdź ją:

```bash
clawhub inspect @openclaw/demo
```

Diagnostyka widoczna dla właściciela może wyjaśnić stan skanowania, bramki przesyłania lub moderacji.

## Publikowanie nie działa, ponieważ brakuje wymaganych metadanych

W przypadku umiejętności sprawdź frontmatter w `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku pluginów sprawdź metadane zgodności w `package.json`. Publikacje code-plugin
wymagają pól zgodności z OpenClaw, takich jak `openclaw.compat.pluginApi` oraz
`openclaw.build.openclawVersion`.

Najpierw podejrzyj ładunek publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikowanie nie działa z powodu błędu właściciela GitHub lub źródła

ClawHub używa tożsamości GitHub i atrybucji źródła, aby łączyć pakiety z ich
wydawcami.

- Upewnij się, że jesteś zalogowany na konto GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy URL źródła jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` albo pełnego URL GitHub.

## Publikowanie nie działa, ponieważ przestrzeń nazw jest zajęta lub zarezerwowana

Jeśli publikowanie nie działa, ponieważ uchwyt właściciela, przestrzeń nazw organizacji, zakres pakietu, slug umiejętności
lub nazwa pakietu są już zajęte albo zarezerwowane, najpierw potwierdź, że publikujesz
jako właściciel pasujący do przestrzeni nazw. W przypadku pakietów pluginów
nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane jako
pasujący właściciel `example-org`.

Jeśli uważasz, że Twoja organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw, ale
nie możesz zarządzać bieżącym właścicielem ClawHub, otwórz
[zgłoszenie roszczenia do organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
z publicznym, niewrażliwym dowodem. Zobacz
[Roszczenia do organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), aby poznać wskazówki dotyczące dowodów i informacje o tym,
czego nie umieszczać w publicznych zgłoszeniach.

## `sync` mówi, że nie znaleziono umiejętności

`sync` szuka folderów zawierających `SKILL.md` lub `skill.md`.

Wskaż katalogi główne, które chcesz przeskanować:

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
clawhub update @openclaw/demo --force
```

- Opublikuj edytowaną kopię jako nowy slug lub fork.

## Instalacja plugina nie działa w OpenClaw

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stronę szczegółów pakietu pod kątem stanu skanowania i metadanych zgodności.
- Potwierdź, że Twoja wersja OpenClaw spełnia deklarowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, wstrzymany lub zablokowany, może nie być możliwy do zainstalowania, dopóki
  właściciel nie rozwiąże problemu.

## Publiczne żądania API nie działają

- Respektuj nagłówki ponownej próby `429` i buforuj publiczne odpowiedzi listy/wyszukiwania.
- Kieruj użytkowników z powrotem do kanonicznej pozycji w ClawHub.
- Nie odzwierciedlaj ukrytej, prywatnej, wstrzymanej ani zablokowanej przez moderację treści poza
  publiczną powierzchnię API.

Zobacz [HTTP API](/pl/clawhub/http-api), aby poznać szczegóły punktów końcowych.
