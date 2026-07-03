---
read_when:
    - Polecenia ClawHub CLI lub rejestru OpenClaw kończą się niepowodzeniem
    - Pakietu nie można zainstalować, opublikować ani zaktualizować
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalacją, publikowaniem, aktualizacją oraz API.
x-i18n:
    generated_at: "2026-07-03T10:01:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale nigdy się nie kończy

CLI uruchamia krótkotrwały lokalny serwer zwrotny podczas logowania w przeglądarce.

- Upewnij się, że przeglądarka może uzyskać dostęp do `http://127.0.0.1:<port>/callback`.
- Sprawdź lokalną zaporę, VPN i reguły proxy, jeśli wywołanie zwrotne nigdy nie dociera.
- W środowiskach bez interfejsu graficznego utwórz token API w interfejsie WWW ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, potwierdź, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający bieżący token.
- Jeśli używasz tokena API, potwierdź, że nie został cofnięty w interfejsie WWW.

## Wyszukiwanie lub instalacja zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponowieniu próby w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowieniem próby.
- `RateLimit-Limit`: limit zastosowany do tego żądania.
- `RateLimit-Remaining`: dokładny pozostały budżet, gdy nagłówek jest obecny. Przy `429` wynosi `0`.
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

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` i
`http_proxy`.

## Skills nie pojawia się w wyszukiwaniu

- Sprawdź dokładny identyfikator slug lub stronę właściciela, jeśli ją znasz.
- Potwierdź, że wydanie jest publiczne i nie zostało wstrzymane przez skanowanie ani moderację.
- Jeśli jesteś właścicielem Skills, zaloguj się i sprawdź je:

```bash
clawhub inspect @openclaw/demo
```

Diagnostyka widoczna dla właściciela może wyjaśniać stan skanowania, bramki przesyłania lub moderacji.

## Publikowanie kończy się niepowodzeniem, ponieważ brakuje wymaganych metadanych

W przypadku Skills sprawdź frontmatter w `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku plugins sprawdź metadane zgodności w `package.json`. Publikacje code-plugin
wymagają pól zgodności OpenClaw, takich jak `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`.

Najpierw podejrzyj ładunek publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikowanie kończy się błędem właściciela GitHub lub źródła

ClawHub używa tożsamości GitHub i atrybucji źródła do łączenia pakietów z ich
wydawcami.

- Upewnij się, że logujesz się przy użyciu konta GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy URL źródła jest publiczny lub dostępny dla ClawHub.
- Dla źródeł GitHub użyj `owner/repo`, `owner/repo@ref` albo pełnego URL GitHub.

## Publikowanie kończy się niepowodzeniem, ponieważ przestrzeń nazw jest zajęta lub zarezerwowana

Jeśli publikowanie kończy się niepowodzeniem, ponieważ uchwyt właściciela, przestrzeń nazw organizacji, zakres pakietu, slug Skills
lub nazwa pakietu są już zajęte lub zarezerwowane, najpierw potwierdź, że
publikujesz jako właściciel pasujący do przestrzeni nazw. W przypadku pakietów Plugin
nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane jako
pasujący właściciel `example-org`.

Jeśli uważasz, że Twoja organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw, ale
nie możesz zarządzać obecnym właścicielem ClawHub, otwórz
[zgłoszenie roszczenia organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
z publicznym, niewrażliwym dowodem. Zobacz
[Roszczenia organizacji i przestrzeni nazw](/clawhub/namespace-claims), aby uzyskać wskazówki dotyczące dowodów oraz tego, czego
nie umieszczać w publicznych zgłoszeniach.

## `sync` informuje, że nie znaleziono Skills

`sync` szuka folderów zawierających `SKILL.md` lub `skill.md`.

Wskaż katalogi główne, które chcesz przeskanować:

```bash
clawhub sync --root /path/to/skills
```

Najpierw podejrzyj wynik, jeśli nie masz pewności, co zostanie opublikowane:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` odmawia z powodu lokalnych zmian

Pliki lokalne nie pasują do żadnej wersji znanej ClawHub. Wybierz jedną opcję:

- Zachowaj lokalne zmiany i pomiń aktualizację.
- Nadpisz opublikowaną wersją:

```bash
clawhub update @openclaw/demo --force
```

- Opublikuj edytowaną kopię jako nowy slug lub fork.

## Instalacja Plugin w OpenClaw kończy się niepowodzeniem

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stronę szczegółów pakietu pod kątem stanu skanowania i metadanych zgodności.
- Potwierdź, że Twoja wersja OpenClaw spełnia deklarowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, wstrzymany lub zablokowany, może nie dać się go zainstalować, dopóki
  właściciel nie rozwiąże problemu.

## Publiczne żądania API kończą się niepowodzeniem

- Respektuj nagłówki ponawiania `429` i buforuj publiczne odpowiedzi listy/wyszukiwania.
- Kieruj użytkowników z powrotem do kanonicznej listy ClawHub.
- Nie duplikuj ukrytych, prywatnych, wstrzymanych ani zablokowanych przez moderację treści poza
  publiczną powierzchnię API.

Zobacz [HTTP API](/clawhub/http-api), aby poznać szczegóły punktów końcowych.
