---
read_when:
    - Przedstawianie ClawHub nowym użytkownikom
    - Instalowanie, wyszukiwanie lub publikowanie Skills albo pluginów
    - Wyjaśnianie flag CLI ClawHub i zachowania synchronizacji
summary: 'Przewodnik po ClawHub: publiczny rejestr, natywne przepływy instalacji OpenClaw i przepływy pracy w CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T14:07:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub to publiczny rejestr **Skills i pluginów OpenClaw**.

- Używaj natywnych poleceń `openclaw` do wyszukiwania/instalowania/aktualizowania Skills oraz instalowania
  pluginów z ClawHub.
- Używaj osobnego CLI `clawhub`, gdy potrzebujesz uwierzytelniania rejestru, publikowania, usuwania,
  przywracania lub przepływów synchronizacji.

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

Jawne specyfikacje pluginów bezpieczne dla npm są również sprawdzane najpierw w ClawHub, a dopiero potem w npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Natywne polecenia `openclaw` instalują do aktywnej przestrzeni roboczej i zapisują
metadane źródła, dzięki czemu późniejsze wywołania `update` mogą pozostać w ClawHub.

Instalacje pluginów weryfikują zgodność reklamowanych `pluginApi` i `minGatewayVersion`
przed uruchomieniem instalacji archiwum, więc niezgodne hosty wcześnie kończą się
bezpieczną odmową zamiast częściowo instalować pakiet.

`openclaw plugins install clawhub:...` akceptuje tylko instalowalne rodziny pluginów.
Jeśli pakiet ClawHub jest w rzeczywistości skill, OpenClaw zatrzymuje się i wskazuje
zamiast tego `openclaw skills install <slug>`.

## Czym jest ClawHub

- Publicznym rejestrem Skills i pluginów OpenClaw.
- Wersjonowanym magazynem pakietów Skills i metadanych.
- Powierzchnią odkrywania dla wyszukiwania, tagów i sygnałów użycia.

## Jak to działa

1. Użytkownik publikuje pakiet skill (pliki + metadane).
2. ClawHub przechowuje pakiet, analizuje metadane i przypisuje wersję.
3. Rejestr indeksuje skill na potrzeby wyszukiwania i odkrywania.
4. Użytkownicy przeglądają, pobierają i instalują Skills w OpenClaw.

## Co możesz zrobić

- Publikować nowe Skills i nowe wersje istniejących Skills.
- Odkrywać Skills po nazwie, tagach lub wyszukiwaniu.
- Pobierać pakiety Skills i przeglądać ich pliki.
- Zgłaszać Skills, które są nadużyciem lub są niebezpieczne.
- Jeśli jesteś moderatorem, ukrywać, odkrywać, usuwać lub banować.

## Dla kogo to jest (przyjazne dla początkujących)

Jeśli chcesz dodać nowe możliwości do swojego agenta OpenClaw, ClawHub to najłatwiejszy sposób znajdowania i instalowania Skills. Nie musisz wiedzieć, jak działa backend. Możesz:

- Wyszukiwać Skills zwykłym językiem.
- Instalować skill w swojej przestrzeni roboczej.
- Później aktualizować Skills jednym poleceniem.
- Tworzyć kopie zapasowe własnych Skills przez ich publikowanie.

## Szybki start (nietechniczny)

1. Wyszukaj coś, czego potrzebujesz:
   - `openclaw skills search "calendar"`
2. Zainstaluj skill:
   - `openclaw skills install <skill-slug>`
3. Rozpocznij nową sesję OpenClaw, aby wykrył nowy skill.
4. Jeśli chcesz publikować lub zarządzać uwierzytelnianiem rejestru, zainstaluj także osobne
   CLI `clawhub`.

## Zainstaluj CLI ClawHub

Potrzebujesz tego tylko do przepływów uwierzytelnianych przez rejestr, takich jak publikowanie/synchronizacja:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Jak to pasuje do OpenClaw

Natywne `openclaw skills install` instaluje do katalogu `skills/` aktywnej przestrzeni roboczej.
`openclaw plugins install clawhub:...` zapisuje zwykłą zarządzaną instalację
pluginu oraz metadane źródła ClawHub na potrzeby aktualizacji.

Anonimowe instalacje pluginów z ClawHub również kończą się bezpieczną odmową dla prywatnych pakietów.
Społecznościowe lub inne nieoficjalne kanały nadal mogą się instalować, ale OpenClaw ostrzega,
aby operatorzy mogli sprawdzić źródło i weryfikację przed ich włączeniem.

Osobne CLI `clawhub` również instaluje Skills do `./skills` w bieżącym katalogu roboczym. Jeśli skonfigurowano przestrzeń roboczą OpenClaw, `clawhub`
wraca do tej przestrzeni roboczej, chyba że nadpiszesz to przez `--workdir` (lub
`CLAWHUB_WORKDIR`). OpenClaw ładuje Skills przestrzeni roboczej z `<workspace>/skills`
i wykryje je w **następnej** sesji. Jeśli już używasz
`~/.openclaw/skills` lub dołączonych Skills, Skills przestrzeni roboczej mają pierwszeństwo.

Więcej szczegółów o tym, jak Skills są ładowane, współdzielone i ograniczane, znajdziesz w
[Skills](/tools/skills).

## Przegląd systemu Skills

Skill to wersjonowany pakiet plików, który uczy OpenClaw, jak wykonać
konkretne zadanie. Każda publikacja tworzy nową wersję, a rejestr przechowuje
historię wersji, aby użytkownicy mogli kontrolować zmiany.

Typowy skill zawiera:

- Plik `SKILL.md` z głównym opisem i użyciem.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez skill.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub wykorzystuje metadane do wspierania odkrywania i bezpiecznego udostępniania możliwości Skills.
Rejestr śledzi także sygnały użycia (takie jak gwiazdki i pobrania), aby poprawiać
ranking i widoczność.

## Co zapewnia usługa (funkcje)

- **Publiczne przeglądanie** Skills i ich zawartości `SKILL.md`.
- **Wyszukiwanie** oparte na embeddingach (wyszukiwanie wektorowe), a nie tylko słowach kluczowych.
- **Wersjonowanie** z semver, changelogami i tagami (w tym `latest`).
- **Pobrania** jako zip dla każdej wersji.
- **Gwiazdki i komentarze** dla opinii społeczności.
- **Hooki moderacyjne** dla zatwierdzeń i audytów.
- **API przyjazne dla CLI** do automatyzacji i skryptów.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty. Każdy może przesyłać Skills, ale konto GitHub musi
mieć co najmniej tydzień, aby można było publikować. Pomaga to spowolnić nadużycia bez blokowania
uczciwych współtwórców.

Zgłaszanie i moderacja:

- Każdy zalogowany użytkownik może zgłosić skill.
- Powody zgłoszeń są wymagane i zapisywane.
- Każdy użytkownik może mieć jednocześnie do 20 aktywnych zgłoszeń.
- Skills z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.
- Moderatorzy mogą przeglądać ukryte Skills, odkrywać je, usuwać lub banować użytkowników.
- Nadużywanie funkcji zgłaszania może skutkować banem konta.

Chcesz zostać moderatorem? Zapytaj na Discordzie OpenClaw i skontaktuj się z
moderatorem lub maintainerem.

## Polecenia i parametry CLI

Opcje globalne (dotyczą wszystkich poleceń):

- `--workdir <dir>`: Katalog roboczy (domyślnie: bieżący katalog; wraca do przestrzeni roboczej OpenClaw).
- `--dir <dir>`: Katalog Skills, względny względem workdir (domyślnie: `skills`).
- `--site <url>`: Bazowy URL strony (logowanie w przeglądarce).
- `--registry <url>`: Bazowy URL API rejestru.
- `--no-input`: Wyłącz prompty (tryb nieinteraktywny).
- `-V, --cli-version`: Wypisz wersję CLI.

Uwierzytelnianie:

- `clawhub login` (przepływ przeglądarkowy) lub `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opcje:

- `--token <token>`: Wklej token API.
- `--label <label>`: Etykieta przechowywana dla tokenów logowania przeglądarkowego (domyślnie: `CLI token`).
- `--no-browser`: Nie otwieraj przeglądarki (wymaga `--token`).

Wyszukiwanie:

- `clawhub search "query"`
- `--limit <n>`: Maksymalna liczba wyników.

Instalacja:

- `clawhub install <slug>`
- `--version <version>`: Zainstaluj konkretną wersję.
- `--force`: Nadpisz, jeśli folder już istnieje.

Aktualizacja:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Zaktualizuj do konkretnej wersji (tylko pojedynczy slug).
- `--force`: Nadpisz, gdy lokalne pliki nie pasują do żadnej opublikowanej wersji.

Listowanie:

- `clawhub list` (odczytuje `.clawhub/lock.json`)

Publikowanie Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug skill.
- `--name <name>`: Nazwa wyświetlana.
- `--version <version>`: Wersja semver.
- `--changelog <text>`: Tekst changeloga (może być pusty).
- `--tags <tags>`: Tagi rozdzielane przecinkami (domyślnie: `latest`).

Publikowanie pluginów:

- `clawhub package publish <source>`
- `<source>` może być lokalnym folderem, `owner/repo`, `owner/repo@ref` lub URL-em GitHub.
- `--dry-run`: Zbuduj dokładny plan publikacji bez wysyłania czegokolwiek.
- `--json`: Zwróć wynik czytelny maszynowo dla CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

Usuwanie/przywracanie (tylko właściciel/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Synchronizacja (skanowanie lokalnych Skills + publikowanie nowych/zaktualizowanych):

- `clawhub sync`
- `--root <dir...>`: Dodatkowe katalogi główne do skanowania.
- `--all`: Prześlij wszystko bez promptów.
- `--dry-run`: Pokaż, co zostałoby przesłane.
- `--bump <type>`: `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
- `--changelog <text>`: Changelog dla aktualizacji nieinteraktywnych.
- `--tags <tags>`: Tagi rozdzielane przecinkami (domyślnie: `latest`).
- `--concurrency <n>`: Sprawdzenia rejestru (domyślnie: 4).

## Typowe przepływy pracy dla agentów

### Wyszukiwanie Skills

```bash
clawhub search "postgres backups"
```

### Pobieranie nowych Skills

```bash
clawhub install my-skill-pack
```

### Aktualizowanie zainstalowanych Skills

```bash
clawhub update --all
```

### Tworzenie kopii zapasowej swoich Skills (publikowanie lub synchronizacja)

Dla pojedynczego folderu skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Aby przeskanować i wykonać kopię zapasową wielu Skills naraz:

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
    "extensions": ["./index.ts"],
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

## Szczegóły zaawansowane (techniczne)

### Wersjonowanie i tagi

- Każda publikacja tworzy nową **wersję semver** `SkillVersion`.
- Tagi (takie jak `latest`) wskazują wersję; przesuwanie tagów pozwala wycofywać zmiany.
- Changelogi są dołączane do każdej wersji i mogą być puste podczas synchronizacji lub publikowania aktualizacji.

### Zmiany lokalne vs wersje rejestru

Aktualizacje porównują lokalną zawartość skill z wersjami rejestru przy użyciu skrótu treści. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji, CLI pyta przed nadpisaniem (lub wymaga `--force` w trybie nieinteraktywnym).

### Skanowanie synchronizacji i zapasowe katalogi główne

`clawhub sync` najpierw skanuje bieżący workdir. Jeśli nie znajdzie żadnych Skills, wraca do znanych starszych lokalizacji (na przykład `~/openclaw/skills` i `~/.openclaw/skills`). Zostało to zaprojektowane tak, aby znajdować starsze instalacje Skills bez dodatkowych flag.

### Przechowywanie i plik blokady

- Zainstalowane Skills są zapisywane w `.clawhub/lock.json` w workdir.
- Tokeny uwierzytelniania są przechowywane w pliku konfiguracji CLI ClawHub (nadpisanie przez `CLAWHUB_CONFIG_PATH`).

### Telemetria (liczba instalacji)

Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalną migawkę do obliczania liczby instalacji. Możesz to całkowicie wyłączyć:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Zmienne środowiskowe

- `CLAWHUB_SITE`: Nadpisz URL strony.
- `CLAWHUB_REGISTRY`: Nadpisz URL API rejestru.
- `CLAWHUB_CONFIG_PATH`: Nadpisz lokalizację, w której CLI przechowuje token/konfigurację.
- `CLAWHUB_WORKDIR`: Nadpisz domyślny workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Wyłącz telemetrię przy `sync`.
