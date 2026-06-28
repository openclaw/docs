---
read_when:
    - Polecenia CLI ClawHub lub rejestru OpenClaw kończą się niepowodzeniem
    - Pakiet nie może zostać zainstalowany, opublikowany ani zaktualizowany
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalacją, publikacją, aktualizacją i API.
x-i18n:
    generated_at: "2026-06-28T05:07:59Z"
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

- Upewnij się, że przeglądarka może uzyskać dostęp do `http://127.0.0.1:<port>/callback`.
- Sprawdź lokalną zaporę, VPN i reguły proxy, jeśli wywołanie zwrotne nigdy nie dociera.
- W środowiskach bez interfejsu graficznego utwórz token API w interfejsie WWW ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, potwierdź, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający Twój bieżący token.
- Jeśli używasz tokena API, potwierdź, że nie został unieważniony w interfejsie WWW.

## Wyszukiwanie lub instalacja zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponownej próbie w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowną próbą.
- `RateLimit-Limit`: limit zastosowany do tego żądania.
- `RateLimit-Remaining`: dokładny pozostały budżet, gdy nagłówek jest obecny. Przy `429` wynosi `0`.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas resetu.

Jeśli wielu użytkowników współdzieli jeden adres IP wyjściowy, anonimowe limity IP mogą zostać osiągnięte nawet wtedy, gdy każda
osoba wysyła tylko kilka żądań. Zaloguj się tam, gdzie to możliwe, i ponów próbę po
zgłoszonym opóźnieniu.

## Wyszukiwanie lub instalacja kończy się niepowodzeniem za proxy

CLI respektuje standardowe zmienne proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` oraz
`http_proxy`.

## Skill nie pojawia się w wynikach wyszukiwania

- Sprawdź dokładny slug lub stronę właściciela, jeśli ją znasz.
- Potwierdź, że wydanie jest publiczne i nie zostało zatrzymane przez skanowanie ani moderację.
- Jeśli jesteś właścicielem Skill, zaloguj się i sprawdź go:

```bash
clawhub inspect @openclaw/demo
```

Diagnostyka widoczna dla właściciela może wyjaśnić stan skanowania, bramki przesyłania lub moderacji.

## Publikowanie kończy się niepowodzeniem, ponieważ brakuje wymaganych metadanych

W przypadku Skills sprawdź frontmatter `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku pluginów sprawdź metadane zgodności w `package.json`. Publikacje code-plugin
wymagają pól zgodności OpenClaw, takich jak `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`.

Najpierw podejrzyj ładunek publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikowanie kończy się niepowodzeniem z błędem właściciela GitHub lub źródła

ClawHub używa tożsamości GitHub i przypisania źródła, aby łączyć pakiety z ich
wydawcami.

- Upewnij się, że jesteś zalogowany za pomocą konta GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy URL źródła jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` albo pełnego URL GitHub.

## Publikowanie kończy się niepowodzeniem, ponieważ przestrzeń nazw jest zajęta lub zarezerwowana

Jeśli publikowanie kończy się niepowodzeniem, ponieważ uchwyt właściciela, przestrzeń nazw organizacji, zakres pakietu, slug Skill
lub nazwa pakietu są już zajęte albo zarezerwowane, najpierw potwierdź, że publikujesz
jako właściciel zgodny z przestrzenią nazw. W przypadku pakietów Plugin
nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane jako
pasujący właściciel `example-org`.

Jeśli uważasz, że Twoja organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw, ale
nie możesz zarządzać bieżącym właścicielem ClawHub, otwórz
[zgłoszenie roszczenia dotyczącego organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
z publicznym, niewrażliwym dowodem. Zobacz
[Roszczenia dotyczące organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), aby uzyskać wskazówki dotyczące dowodów i informacji, których
nie należy umieszczać w publicznych zgłoszeniach.

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

## `update` odmawia z powodu lokalnych zmian

Lokalne pliki nie pasują do żadnej wersji znanej ClawHub. Wybierz jedno:

- Zachowaj lokalne edycje i pomiń aktualizację.
- Nadpisz opublikowaną wersją:

```bash
clawhub update @openclaw/demo --force
```

- Opublikuj edytowaną kopię jako nowy slug lub fork.

## Instalacja Plugin kończy się niepowodzeniem w OpenClaw

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stronę szczegółów pakietu pod kątem stanu skanowania i metadanych zgodności.
- Potwierdź, że Twoja wersja OpenClaw spełnia reklamowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, zatrzymany lub zablokowany, może nie być możliwy do zainstalowania, dopóki
  właściciel nie rozwiąże problemu.

## Publiczne żądania API kończą się niepowodzeniem

- Respektuj nagłówki ponownej próby `429` i buforuj publiczne odpowiedzi list/wyszukiwania.
- Odsyłaj użytkowników do kanonicznej listy ClawHub.
- Nie mirroruj ukrytych, prywatnych, zatrzymanych ani zablokowanych przez moderację treści poza
  publiczną powierzchnią API.

Zobacz [HTTP API](/pl/clawhub/http-api), aby uzyskać szczegóły punktów końcowych.
