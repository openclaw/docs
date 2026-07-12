---
read_when:
    - Polecenia CLI ClawHub lub rejestru OpenClaw kończą się niepowodzeniem
    - Nie można zainstalować, opublikować ani zaktualizować pakietu
summary: Rozwiązywanie problemów z logowaniem do ClawHub, instalowaniem, publikowaniem, aktualizowaniem i interfejsem API.
x-i18n:
    generated_at: "2026-07-12T14:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale proces nigdy się nie kończy

Podczas logowania w przeglądarce CLI uruchamia krótkotrwały lokalny serwer wywołania zwrotnego.

- Upewnij się, że przeglądarka może uzyskać dostęp do `http://127.0.0.1:<port>/callback`.
- Jeśli wywołanie zwrotne nie dociera, sprawdź reguły lokalnej zapory sieciowej, VPN i serwera proxy.
- W środowiskach bez interfejsu graficznego utwórz token API w interfejsie WWW ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, upewnij się, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający Twój aktualny token.
- Jeśli używasz tokenu API, upewnij się, że nie został unieważniony w interfejsie WWW.

## Wyszukiwanie lub instalowanie zwraca `Rate limit exceeded` (429)

Odczytaj z odpowiedzi informacje dotyczące ponowienia próby:

- `Retry-After`: liczba sekund oczekiwania przed ponowieniem próby.
- `RateLimit-Limit`: limit zastosowany do tego żądania.
- `RateLimit-Remaining`: dokładna pozostała pula, gdy nagłówek jest obecny. Przy `429` wynosi `0`.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas zresetowania limitu.

Jeśli wielu użytkowników korzysta z jednego wychodzącego adresu IP, anonimowe limity dla adresu IP mogą zostać osiągnięte, nawet gdy każda
osoba wysyła tylko kilka żądań. W miarę możliwości zaloguj się i ponów próbę po
wskazanym czasie oczekiwania.

## Wyszukiwanie lub instalowanie nie działa za serwerem proxy

CLI uwzględnia standardowe zmienne serwera proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` oraz
`http_proxy`.

## Skill nie pojawia się w wynikach wyszukiwania

- Jeśli znasz dokładny slug lub stronę właściciela, sprawdź je.
- Upewnij się, że wydanie jest publiczne i nie zostało wstrzymane przez skanowanie ani moderację.
- Jeśli Skill należy do Ciebie, zaloguj się i sprawdź go:

```bash
clawhub inspect @openclaw/demo
```

Diagnostyka widoczna dla właściciela może wyjaśnić stan skanowania, blokady przesyłania lub moderacji.

## Publikowanie kończy się niepowodzeniem z powodu braku wymaganych metadanych

W przypadku Skills sprawdź frontmatter pliku `SKILL.md`. Wymagane zmienne środowiskowe i
narzędzia powinny być zadeklarowane, aby użytkownicy i skanery mogli zrozumieć pakiet.

W przypadku pluginów sprawdź metadane zgodności w pliku `package.json`. Publikowanie pluginów zawierających kod
wymaga pól zgodności z OpenClaw, takich jak `openclaw.compat.pluginApi` oraz
`openclaw.build.openclawVersion`.

Najpierw wyświetl podgląd danych publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikowanie kończy się niepowodzeniem z powodu błędu właściciela lub źródła GitHub

ClawHub używa tożsamości GitHub i informacji o pochodzeniu źródła, aby powiązać pakiety z ich
wydawcami.

- Upewnij się, że zalogowano się przy użyciu konta GitHub, które jest właścicielem pakietu lub może go
  publikować.
- Sprawdź, czy adres URL źródła jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` lub pełnego adresu URL GitHub.

## Publikowanie kończy się niepowodzeniem, ponieważ przestrzeń nazw jest zajęta lub zastrzeżona

Jeśli publikowanie kończy się niepowodzeniem, ponieważ identyfikator właściciela, przestrzeń nazw organizacji, zakres pakietu, slug Skilla
lub nazwa pakietu są już zajęte albo zastrzeżone, najpierw upewnij się, że
publikujesz jako właściciel odpowiadający przestrzeni nazw. W przypadku pakietów pluginów
nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane przez
odpowiadającego im właściciela `example-org`.

Jeśli uważasz, że Twoja organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw, ale
nie możesz zarządzać obecnym właścicielem w ClawHub, utwórz
[zgłoszenie roszczenia do organizacji lub przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
z publicznymi dowodami niezawierającymi informacji poufnych. Zobacz
[Roszczenia do organizacji i przestrzeni nazw](/clawhub/namespace-claims), aby uzyskać wskazówki dotyczące dowodów i informacji,
których nie należy umieszczać w publicznych zgłoszeniach.

## `sync` informuje, że nie znaleziono żadnych Skills

`sync` wyszukuje foldery zawierające plik `SKILL.md` lub `skill.md`.

Wskaż katalogi główne, które chcesz przeskanować:

```bash
clawhub sync --root /path/to/skills
```

Jeśli nie masz pewności, co zostanie opublikowane, najpierw wyświetl podgląd:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` odmawia działania z powodu lokalnych zmian

Pliki lokalne nie odpowiadają żadnej wersji znanej ClawHub. Wybierz jedną z opcji:

- Zachowaj lokalne zmiany i pomiń aktualizację.
- Nadpisz je opublikowaną wersją:

```bash
clawhub update @openclaw/demo --force
```

- Opublikuj zmodyfikowaną kopię z nowym slugiem lub jako fork.

## Instalacja plugina w OpenClaw kończy się niepowodzeniem

- Użyj jawnie określonego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź na stronie szczegółów pakietu stan skanowania i metadane zgodności.
- Upewnij się, że Twoja wersja OpenClaw mieści się w deklarowanym przez pakiet
  zakresie zgodności.
- Jeśli pakiet jest ukryty, wstrzymany lub zablokowany, jego instalacja może nie być możliwa, dopóki
  właściciel nie rozwiąże problemu.

## Żądania do publicznego API kończą się niepowodzeniem

- Przestrzegaj nagłówków ponawiania prób dla `429` i buforuj publiczne odpowiedzi listowania oraz wyszukiwania.
- Kieruj użytkowników z powrotem do kanonicznej strony pakietu w ClawHub.
- Nie powielaj ukrytych, prywatnych, wstrzymanych ani zablokowanych przez moderację treści poza
  publicznym interfejsem API.

Szczegółowe informacje o punktach końcowych znajdziesz w [API HTTP](/clawhub/http-api).
