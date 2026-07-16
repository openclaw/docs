---
read_when:
    - Polecenia CLI ClawHub lub rejestru OpenClaw kończą się niepowodzeniem
    - Nie można zainstalować, opublikować ani zaktualizować pakietu
summary: Rozwiązywanie problemów z logowaniem, instalowaniem, publikowaniem, aktualizowaniem i interfejsem API ClawHub.
x-i18n:
    generated_at: "2026-07-16T18:07:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Rozwiązywanie problemów

## `clawhub login` otwiera przeglądarkę, ale nigdy się nie kończy

Podczas logowania w przeglądarce CLI uruchamia krótkotrwały lokalny serwer wywołania zwrotnego.

- Upewnij się, że przeglądarka może uzyskać dostęp do `http://127.0.0.1:<port>/callback`.
- Jeśli wywołanie zwrotne nigdy nie dociera, sprawdź reguły lokalnej zapory sieciowej, sieci VPN i serwera proxy.
- W środowiskach bez interfejsu graficznego utwórz token API w interfejsie internetowym ClawHub i uruchom:

```bash
clawhub login --token clh_...
```

## `whoami` lub `publish` zwraca `Unauthorized` (401)

- Zaloguj się ponownie za pomocą `clawhub login`.
- Jeśli używasz niestandardowej ścieżki konfiguracji, potwierdź, że `CLAWHUB_CONFIG_PATH` wskazuje
  plik zawierający bieżący token.
- Jeśli używasz tokenu API, potwierdź w interfejsie internetowym, że nie został unieważniony.

## Wyszukiwanie lub instalowanie zwraca `Rate limit exceeded` (429)

Przeczytaj informacje o ponowieniu próby zawarte w odpowiedzi:

- `Retry-After`: liczba sekund oczekiwania przed ponowieniem próby.
- `RateLimit-Limit`: limit zastosowany do tego żądania.
- `RateLimit-Remaining`: dokładny pozostały budżet, gdy nagłówek jest obecny. W przypadku `429` wynosi on `0`.
- `RateLimit-Reset` lub `X-RateLimit-Reset`: czas zresetowania limitu.

Jeśli wielu użytkowników współdzieli jeden wychodzący adres IP, anonimowe limity dla adresu IP mogą zostać osiągnięte, nawet gdy każda
osoba wysyła tylko kilka żądań. W miarę możliwości zaloguj się i ponów próbę po
podanym czasie oczekiwania.

## Wyszukiwanie lub instalowanie nie działa za serwerem proxy

CLI uwzględnia standardowe zmienne serwera proxy:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Obsługiwane nazwy obejmują `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` oraz
`http_proxy`.

## Umiejętność nie pojawia się w wynikach wyszukiwania

- Jeśli znasz dokładny identyfikator slug lub stronę właściciela, sprawdź je.
- Potwierdź, że wydanie jest publiczne i nie zostało wstrzymane przez skanowanie ani moderację.
- Jeśli umiejętność należy do Ciebie, zaloguj się i sprawdź ją:

```bash
clawhub inspect @openclaw/demo
```

Diagnostyka widoczna dla właściciela może wyjaśnić stan skanowania, bramki przesyłania lub moderacji.

## Publikowanie nie powiodło się z powodu braku wymaganych metadanych

W przypadku umiejętności sprawdź frontmatter `SKILL.md`. Należy zadeklarować wymagane zmienne środowiskowe i
narzędzia, aby użytkownicy oraz skanery mogli zrozumieć pakiet.

W przypadku pluginów sprawdź metadane zgodności `package.json`. Publikowane pluginy kodu
wymagają pól zgodności z OpenClaw, takich jak `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`.

Najpierw wyświetl podgląd danych publikacji:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikowanie nie powiodło się z powodu błędu właściciela lub źródła GitHub

ClawHub używa tożsamości GitHub i informacji o pochodzeniu źródła, aby powiązać pakiety z ich
wydawcami.

- Upewnij się, że zalogowano się na konto GitHub, które jest właścicielem pakietu lub może go publikować.
- Sprawdź, czy źródłowy adres URL jest publiczny lub dostępny dla ClawHub.
- W przypadku źródeł GitHub użyj `owner/repo`, `owner/repo@ref` lub pełnego adresu URL GitHub.

## Publikowanie nie powiodło się, ponieważ przestrzeń nazw jest zajęta lub zastrzeżona

Jeśli publikowanie nie powiedzie się, ponieważ identyfikator właściciela, przestrzeń nazw organizacji, zakres pakietu, identyfikator slug umiejętności
lub nazwa pakietu są już zajęte albo zastrzeżone, najpierw potwierdź, że
publikowanie odbywa się jako właściciel odpowiadający przestrzeni nazw. W przypadku pakietów pluginów
nazwy z zakresem, takie jak `@example-org/example-plugin`, muszą być publikowane przez
odpowiadającego im właściciela `example-org`.

Jeśli uważasz, że Twoja organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw, ale
nie możesz zarządzać obecnym właścicielem w ClawHub, otwórz
[zgłoszenie roszczenia do organizacji lub przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
i dołącz publiczne, niewrażliwe dowody. Zobacz
[Roszczenia do organizacji i przestrzeni nazw](/clawhub/namespace-claims), aby poznać wytyczne dotyczące dowodów oraz informacje,
których nie należy umieszczać w publicznych zgłoszeniach.

## `sync` informuje, że nie znaleziono umiejętności

`sync` wyszukuje foldery zawierające `SKILL.md` lub `skill.md`.

Wskaż katalogi główne, które mają zostać przeskanowane:

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
- Zastąp je opublikowaną wersją:

```bash
clawhub update @openclaw/demo --force
```

- Opublikuj zmodyfikowaną kopię pod nowym identyfikatorem slug lub jako fork.

## Instalowanie pluginu w OpenClaw nie powiodło się

- Użyj jawnego źródła ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Sprawdź stan skanowania i metadane zgodności na stronie szczegółów pakietu.
- Potwierdź, że wersja OpenClaw spełnia deklarowany przez pakiet
  zakres zgodności.
- Jeśli pakiet jest ukryty, wstrzymany lub zablokowany, jego instalacja może nie być możliwa, dopóki
  właściciel nie rozwiąże problemu.

## Żądania do publicznego API nie działają

- Przestrzegaj nagłówków ponawiania prób `429` i buforuj publiczne odpowiedzi listowania oraz wyszukiwania.
- Kieruj użytkowników z powrotem do kanonicznej strony pakietu w ClawHub.
- Nie kopiuj ukrytych, prywatnych, wstrzymanych ani zablokowanych przez moderację treści poza
  publiczny interfejs API.

Szczegółowe informacje o punktach końcowych zawiera [API HTTP](/clawhub/http-api).
