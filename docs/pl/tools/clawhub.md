---
read_when:
    - Przedstawianie ClawHub nowym użytkownikom
    - Instalowanie, wyszukiwanie lub publikowanie Skills albo pluginów
    - Wyjaśnianie flag CLI ClawHub i zachowania synchronizacji
summary: 'Przewodnik po ClawHub: publiczny rejestr, natywne przepływy instalacji OpenClaw i przepływy pracy CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub to publiczny rejestr **Skills i pluginów OpenClaw**.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać/instalować/aktualizować Skills i instalować
  pluginy z ClawHub.
- Używaj osobnego CLI `clawhub`, gdy potrzebujesz auth rejestru, publikowania, usuwania,
  przywracania usuniętych pakietów lub przepływów synchronizacji.

Strona: [clawhub.ai](https://clawhub.ai)

## Natywne przepływy OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Pluginy:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zwykłe specyfikacje pluginów bezpieczne dla npm są również sprawdzane najpierw w ClawHub, a dopiero potem w npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Natywne polecenia `openclaw` instalują do aktywnego workspace i zapisują metadane
źródła, dzięki czemu późniejsze wywołania `update` mogą pozostać w ClawHub.

Instalacje pluginów sprawdzają zgodność reklamowanych `pluginApi` i `minGatewayVersion`
przed uruchomieniem instalacji archiwum, więc niezgodne hosty kończą się wcześnie w trybie fail-closed
zamiast częściowo instalować pakiet.

`openclaw plugins install clawhub:...` akceptuje tylko rodziny pluginów możliwe do zainstalowania.
Jeśli pakiet ClawHub jest w rzeczywistości Skill, OpenClaw zatrzyma się i wskaże
`openclaw skills install <slug>`.

## Czym jest ClawHub

- Publicznym rejestrem Skills i pluginów OpenClaw.
- Wersjonowanym magazynem bundle’ów Skills i metadanych.
- Powierzchnią odkrywania dla wyszukiwania, tagów i sygnałów użycia.

## Jak to działa

1. Użytkownik publikuje bundle Skill (pliki + metadane).
2. ClawHub przechowuje bundle, parsuje metadane i przypisuje wersję.
3. Rejestr indeksuje Skill do wyszukiwania i odkrywania.
4. Użytkownicy przeglądają, pobierają i instalują Skills w OpenClaw.

## Co możesz zrobić

- Publikować nowe Skills i nowe wersje istniejących Skills.
- Odkrywać Skills po nazwie, tagach lub wyszukiwaniu.
- Pobierać bundle’y Skills i przeglądać ich pliki.
- Zgłaszać Skills, które są nadużyciowe lub niebezpieczne.
- Jeśli jesteś moderatorem, ukrywać, odkrywać, usuwać lub banować.

## Dla kogo to jest (przyjazne dla początkujących)

Jeśli chcesz dodać nowe możliwości do swojego agenta OpenClaw, ClawHub to najprostszy sposób na znalezienie i zainstalowanie Skills. Nie musisz wiedzieć, jak działa backend. Możesz:

- Wyszukiwać Skills w prostym języku.
- Instalować Skill do swojego workspace.
- Później aktualizować Skills jednym poleceniem.
- Tworzyć kopie zapasowe własnych Skills przez ich publikację.

## Szybki start (bez technikaliów)

1. Wyszukaj coś, czego potrzebujesz:
   - `openclaw skills search "calendar"`
2. Zainstaluj Skill:
   - `openclaw skills install <skill-slug>`
3. Rozpocznij nową sesję OpenClaw, aby wykrył nowy Skill.
4. Jeśli chcesz publikować lub zarządzać auth rejestru, zainstaluj też osobne
   CLI `clawhub`.

## Zainstaluj CLI ClawHub

Potrzebujesz go tylko do przepływów wymagających auth rejestru, takich jak publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Jak to pasuje do OpenClaw

Natywne `openclaw skills install` instaluje do katalogu `skills/`
aktywnego workspace. `openclaw plugins install clawhub:...` zapisuje zwykłą zarządzaną
instalację pluginu plus metadane źródła ClawHub na potrzeby aktualizacji.

Anonimowe instalacje pluginów ClawHub również kończą się w trybie fail-closed dla pakietów prywatnych.
Kanały społecznościowe lub inne nieoficjalne nadal mogą instalować, ale OpenClaw ostrzega,
aby operatorzy mogli przejrzeć źródło i weryfikację przed włączeniem.

Osobne CLI `clawhub` również instaluje Skills do `./skills` pod
bieżącym katalogiem roboczym. Jeśli skonfigurowano workspace OpenClaw, `clawhub`
wraca do tego workspace, chyba że nadpiszesz `--workdir` (lub
`CLAWHUB_WORKDIR`). OpenClaw ładuje Skills workspace z `<workspace>/skills`
i wykryje je w **następnej** sesji. Jeśli już używasz
`~/.openclaw/skills` lub dołączonych Skills, Skills workspace mają pierwszeństwo.

Więcej szczegółów o tym, jak Skills są ładowane, współdzielone i bramkowane, znajdziesz w
[Skills](/pl/tools/skills).

## Przegląd systemu Skills

Skill to wersjonowany bundle plików, który uczy OpenClaw wykonywania
określonego zadania. Każda publikacja tworzy nową wersję, a rejestr przechowuje
historię wersji, aby użytkownicy mogli audytować zmiany.

Typowy Skill zawiera:

- Plik `SKILL.md` z głównym opisem i sposobem użycia.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez Skill.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub wykorzystuje metadane do wspierania odkrywania i bezpiecznego ujawniania możliwości Skills.
Rejestr śledzi też sygnały użycia (takie jak gwiazdki i pobrania), aby poprawiać
ranking i widoczność.

## Co udostępnia usługa (funkcje)

- **Publiczne przeglądanie** Skills i ich zawartości `SKILL.md`.
- **Wyszukiwanie** oparte na embeddingach (wyszukiwanie wektorowe), a nie tylko słowach kluczowych.
- **Wersjonowanie** z semver, changelogami i tagami (w tym `latest`).
- **Pobrania** jako zip dla każdej wersji.
- **Gwiazdki i komentarze** dla opinii społeczności.
- **Hooki moderacyjne** dla zatwierdzeń i audytów.
- **API przyjazne dla CLI** do automatyzacji i skryptów.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty. Każdy może przesyłać Skills, ale konto GitHub musi
mieć co najmniej tydzień, aby publikować. Pomaga to spowolnić nadużycia bez blokowania
uczciwych współtwórców.

Zgłaszanie i moderacja:

- Każdy zalogowany użytkownik może zgłosić Skill.
- Powody zgłoszeń są wymagane i zapisywane.
- Każdy użytkownik może mieć maksymalnie 20 aktywnych zgłoszeń jednocześnie.
- Skills z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.
- Moderatorzy mogą przeglądać ukryte Skills, odkrywać je, usuwać lub banować użytkowników.
- Nadużywanie funkcji zgłaszania może skutkować banem konta.

Chcesz zostać moderatorem? Zapytaj na Discordzie OpenClaw i skontaktuj się z
moderatorem lub maintainerem.

## Polecenia i parametry CLI

Opcje globalne (dotyczą wszystkich poleceń):

- `--workdir <dir>`: Katalog roboczy (domyślnie: bieżący katalog; wartość rezerwowa to workspace OpenClaw).
- `--dir <dir>`: Katalog Skills względem workdir (domyślnie: `skills`).
- `--site <url>`: Bazowy URL strony (logowanie przez przeglądarkę).
- `--registry <url>`: Bazowy URL API rejestru.
- `--no-input`: Wyłącza prompty (tryb nieinteraktywny).
- `-V, --cli-version`: Wypisuje wersję CLI.

Auth:

- `clawhub login` (przepływ przeglądarkowy) lub `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opcje:

- `--token <token>`: Wklej token API.
- `--label <label>`: Etykieta zapisywana dla tokenów logowania przez przeglądarkę (domyślnie: `CLI token`).
- `--no-browser`: Nie otwieraj przeglądarki (wymaga `--token`).

Wyszukiwanie:

- `clawhub search "query"`
- `--limit <n>`: Maksymalna liczba wyników.

Instalacja:

- `clawhub install <slug>`
- `--version <version>`: Instaluje konkretną wersję.
- `--force`: Nadpisuje, jeśli folder już istnieje.

Aktualizacja:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Aktualizuje do konkretnej wersji (tylko dla pojedynczego slug).
- `--force`: Nadpisuje, gdy lokalne pliki nie pasują do żadnej opublikowanej wersji.

Lista:

- `clawhub list` (odczytuje `.clawhub/lock.json`)

Publikowanie Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug Skill.
- `--name <name>`: Nazwa wyświetlana.
- `--version <version>`: Wersja semver.
- `--changelog <text>`: Treść changelogu (może być pusta).
- `--tags <tags>`: Tagi oddzielone przecinkami (domyślnie: `latest`).

Publikowanie pluginów:

- `clawhub package publish <source>`
- `<source>` może być lokalnym folderem, `owner/repo`, `owner/repo@ref` lub URL-em GitHub.
- `--dry-run`: Buduje dokładny plan publikacji bez wysyłania czegokolwiek.
- `--json`: Zwraca wynik czytelny maszynowo dla CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

Usuwanie/przywracanie usuniętego (tylko owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Synchronizacja (skanuje lokalne Skills + publikuje nowe/zaktualizowane):

- `clawhub sync`
- `--root <dir...>`: Dodatkowe katalogi skanowania.
- `--all`: Wysyła wszystko bez promptów.
- `--dry-run`: Pokazuje, co zostałoby wysłane.
- `--bump <type>`: `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
- `--changelog <text>`: Changelog dla nieinteraktywnych aktualizacji.
- `--tags <tags>`: Tagi oddzielone przecinkami (domyślnie: `latest`).
- `--concurrency <n>`: Sprawdzanie rejestru (domyślnie: 4).

## Typowe przepływy pracy dla agentów

### Wyszukiwanie Skills

```bash
clawhub search "postgres backups"
```

### Pobieranie nowych Skills

```bash
clawhub install my-skill-pack
```

### Aktualizacja zainstalowanych Skills

```bash
clawhub update --all
```

### Tworzenie kopii zapasowej własnych Skills (publish lub sync)

Dla pojedynczego folderu Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Aby przeskanować i utworzyć kopię zapasową wielu Skills naraz:

```bash
clawhub sync --all
```

### Publikowanie pluginu z GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Pluginy kodowe muszą zawierać wymagane metadane OpenClaw w `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Opublikowane pakiety powinny dostarczać zbudowany JavaScript i wskazywać `runtimeExtensions`
na to wyjście. Instalacje z checkoutu Git mogą nadal wracać do źródła TypeScript,
gdy nie istnieją zbudowane pliki, ale zbudowane punkty wejścia runtime pozwalają uniknąć
kompilacji TypeScript w runtime w ścieżkach uruchamiania, doctor i ładowania pluginów.

## Szczegóły zaawansowane (techniczne)

### Wersjonowanie i tagi

- Każda publikacja tworzy nową **semver** `SkillVersion`.
- Tagi (takie jak `latest`) wskazują wersję; przesuwanie tagów pozwala robić rollback.
- Changelogi są dołączane per wersja i mogą być puste podczas synchronizacji lub publikowania aktualizacji.

### Zmiany lokalne a wersje w rejestrze

Aktualizacje porównują lokalną zawartość Skill z wersjami w rejestrze przy użyciu hasha zawartości. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji, CLI pyta przed nadpisaniem (lub wymaga `--force` w trybie nieinteraktywnym).

### Skanowanie sync i zapasowe katalogi główne

`clawhub sync` najpierw skanuje bieżący workdir. Jeśli nie znajdzie żadnych Skills, wraca do znanych starszych lokalizacji (na przykład `~/openclaw/skills` i `~/.openclaw/skills`). Zostało to zaprojektowane tak, aby znajdować starsze instalacje Skills bez dodatkowych flag.

### Storage i lockfile

- Zainstalowane Skills są zapisywane w `.clawhub/lock.json` pod twoim workdir.
- Tokeny auth są przechowywane w pliku konfiguracji CLI ClawHub (nadpisanie przez `CLAWHUB_CONFIG_PATH`).

### Telemetria (liczba instalacji)

Gdy uruchamiasz `clawhub sync` będąc zalogowanym, CLI wysyła minimalną migawkę do obliczania liczby instalacji. Możesz to całkowicie wyłączyć:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Zmienne środowiskowe

- `CLAWHUB_SITE`: Nadpisuje URL strony.
- `CLAWHUB_REGISTRY`: Nadpisuje URL API rejestru.
- `CLAWHUB_CONFIG_PATH`: Nadpisuje miejsce przechowywania tokenu/konfiguracji przez CLI.
- `CLAWHUB_WORKDIR`: Nadpisuje domyślny workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Wyłącza telemetrię w `sync`.
