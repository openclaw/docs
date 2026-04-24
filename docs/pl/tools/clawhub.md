---
read_when:
    - Przedstawianie ClawHub nowym użytkownikom
    - Instalowanie, wyszukiwanie lub publikowanie Skills albo Pluginów
    - Wyjaśnianie flag CLI ClawHub i zachowania synchronizacji
summary: 'Przewodnik po ClawHub: publiczny rejestr, natywne przepływy instalacji OpenClaw i przepływy CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T09:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub to publiczny rejestr **Skills i Pluginów OpenClaw**.

- Używaj natywnych poleceń `openclaw` do wyszukiwania/instalowania/aktualizowania Skills oraz instalowania
  Pluginów z ClawHub.
- Używaj osobnego CLI `clawhub`, gdy potrzebujesz auth rejestru, publikowania, usuwania,
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

Specyfikacje Pluginów bezpieczne dla npm bez prefiksu są również najpierw sprawdzane w ClawHub, a potem w npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Natywne polecenia `openclaw` instalują do aktywnego obszaru roboczego i zapisują metadane źródła,
dzięki czemu późniejsze wywołania `update` mogą pozostać na ClawHub.

Instalacje Pluginów walidują reklamowaną zgodność `pluginApi` i `minGatewayVersion`
przed uruchomieniem instalacji archiwum, dzięki czemu niezgodne hosty kończą się wcześnie
w trybie fail-closed zamiast częściowo instalować pakiet.

`openclaw plugins install clawhub:...` akceptuje tylko rodziny instalowalnych Pluginów.
Jeśli pakiet ClawHub jest w rzeczywistości Skill, OpenClaw zatrzyma się i wskaże Ci
zamiast tego `openclaw skills install <slug>`.

## Czym jest ClawHub

- Publicznym rejestrem Skills i Pluginów OpenClaw.
- Wersjonowanym magazynem bundle’ów Skills i metadanych.
- Powierzchnią odkrywania dla wyszukiwania, tagów i sygnałów użycia.

## Jak to działa

1. Użytkownik publikuje bundle Skill (pliki + metadane).
2. ClawHub przechowuje bundle, parsuje metadane i przypisuje wersję.
3. Rejestr indeksuje Skill na potrzeby wyszukiwania i odkrywania.
4. Użytkownicy przeglądają, pobierają i instalują Skills w OpenClaw.

## Co możesz zrobić

- Publikować nowe Skills i nowe wersje istniejących Skills.
- Odkrywać Skills po nazwie, tagach lub przez wyszukiwanie.
- Pobierać bundle Skills i sprawdzać ich pliki.
- Zgłaszać Skills, które są nadużyciowe lub niebezpieczne.
- Jeśli jesteś moderatorem, ukrywać, odkrywać, usuwać lub banować.

## Dla kogo to jest (przyjazne początkującym)

Jeśli chcesz dodać nowe możliwości do swojego agenta OpenClaw, ClawHub jest najłatwiejszym sposobem na znalezienie i zainstalowanie Skills. Nie musisz wiedzieć, jak działa backend. Możesz:

- Wyszukiwać Skills zwykłym językiem.
- Instalować Skill do swojego obszaru roboczego.
- Aktualizować Skills później jednym poleceniem.
- Tworzyć kopie zapasowe własnych Skills przez ich publikację.

## Szybki start (nietechniczny)

1. Wyszukaj coś, czego potrzebujesz:
   - `openclaw skills search "calendar"`
2. Zainstaluj Skill:
   - `openclaw skills install <skill-slug>`
3. Rozpocznij nową sesję OpenClaw, aby pobrać nową Skill.
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

Natywne `openclaw skills install` instaluje do aktywnego katalogu obszaru roboczego `skills/`.
`openclaw plugins install clawhub:...` zapisuje zwykłą zarządzaną instalację
Pluginu oraz metadane źródła ClawHub dla aktualizacji.

Anonimowe instalacje Pluginów ClawHub również kończą się odmową fail-closed dla pakietów prywatnych.
Kanały społecznościowe lub inne nieoficjalne nadal mogą się instalować, ale OpenClaw ostrzega,
aby operatorzy mogli przejrzeć źródło i sposób weryfikacji przed włączeniem.

Osobne CLI `clawhub` instaluje również Skills do `./skills` pod bieżącym katalogiem roboczym. Jeśli skonfigurowano obszar roboczy OpenClaw, `clawhub`
wraca do tego obszaru roboczego, chyba że nadpiszesz `--workdir` (lub
`CLAWHUB_WORKDIR`). OpenClaw ładuje Skills obszaru roboczego z `<workspace>/skills`
i pobierze je w **następnej** sesji. Jeśli już używasz
`~/.openclaw/skills` albo dołączonych Skills, Skills obszaru roboczego mają pierwszeństwo.

Więcej szczegółów o tym, jak Skills są ładowane, współdzielone i bramkowane, znajdziesz w
[Skills](/pl/tools/skills).

## Przegląd systemu Skills

Skill to wersjonowany bundle plików, który uczy OpenClaw, jak wykonać określone
zadanie. Każda publikacja tworzy nową wersję, a rejestr zachowuje historię
wersji, dzięki czemu użytkownicy mogą audytować zmiany.

Typowa Skill zawiera:

- Plik `SKILL.md` z głównym opisem i sposobem użycia.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez Skill.
- Metadane, takie jak tagi, summary i wymagania instalacyjne.

ClawHub używa metadanych do wspierania odkrywania i bezpiecznego udostępniania możliwości Skill.
Rejestr śledzi też sygnały użycia (takie jak gwiazdki i pobrania), aby poprawiać
ranking i widoczność.

## Co zapewnia usługa (funkcje)

- **Publiczne przeglądanie** Skills i ich zawartości `SKILL.md`.
- **Wyszukiwanie** oparte na embeddingach (vector search), a nie tylko na słowach kluczowych.
- **Wersjonowanie** z semver, changelogami i tagami (w tym `latest`).
- **Pobrania** jako zip dla każdej wersji.
- **Gwiazdki i komentarze** dla informacji zwrotnej od społeczności.
- **Hooki moderacji** dla zatwierdzeń i audytów.
- **API przyjazne CLI** dla automatyzacji i skryptowania.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarte. Każdy może przesyłać Skills, ale konto GitHub musi
mieć co najmniej tydzień, aby publikować. To pomaga spowolnić nadużycia bez blokowania
uczciwych współtwórców.

Zgłaszanie i moderacja:

- Każdy zalogowany użytkownik może zgłosić Skill.
- Powody zgłoszenia są wymagane i zapisywane.
- Każdy użytkownik może mieć jednocześnie maksymalnie 20 aktywnych zgłoszeń.
- Skills z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.
- Moderatorzy mogą przeglądać ukryte Skills, odkrywać je, usuwać lub banować użytkowników.
- Nadużywanie funkcji zgłaszania może skutkować banem konta.

Chcesz zostać moderatorem? Zapytaj na Discordzie OpenClaw i skontaktuj się z
moderatorem lub maintainerem.

## Polecenia CLI i parametry

Opcje globalne (dotyczą wszystkich poleceń):

- `--workdir <dir>`: katalog roboczy (domyślnie: bieżący katalog; wraca do obszaru roboczego OpenClaw).
- `--dir <dir>`: katalog Skills, względem workdir (domyślnie: `skills`).
- `--site <url>`: bazowy URL strony (logowanie w przeglądarce).
- `--registry <url>`: bazowy URL API rejestru.
- `--no-input`: wyłącza prompty (nieinteraktywne).
- `-V, --cli-version`: wypisuje wersję CLI.

Auth:

- `clawhub login` (przepływ przeglądarkowy) lub `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opcje:

- `--token <token>`: wklej token API.
- `--label <label>`: etykieta zapisywana dla tokenów logowania przez przeglądarkę (domyślnie: `CLI token`).
- `--no-browser`: nie otwieraj przeglądarki (wymaga `--token`).

Wyszukiwanie:

- `clawhub search "query"`
- `--limit <n>`: maksymalna liczba wyników.

Instalacja:

- `clawhub install <slug>`
- `--version <version>`: zainstaluj konkretną wersję.
- `--force`: nadpisz, jeśli folder już istnieje.

Aktualizacja:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: zaktualizuj do konkretnej wersji (tylko pojedynczy slug).
- `--force`: nadpisz, gdy lokalne pliki nie pasują do żadnej opublikowanej wersji.

Lista:

- `clawhub list` (odczytuje `.clawhub/lock.json`)

Publikowanie Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug Skill.
- `--name <name>`: nazwa wyświetlana.
- `--version <version>`: wersja semver.
- `--changelog <text>`: tekst changelogu (może być pusty).
- `--tags <tags>`: tagi rozdzielane przecinkami (domyślnie: `latest`).

Publikowanie Pluginów:

- `clawhub package publish <source>`
- `<source>` może być lokalnym folderem, `owner/repo`, `owner/repo@ref` lub URL-em GitHub.
- `--dry-run`: buduje dokładny plan publikacji bez wysyłania czegokolwiek.
- `--json`: emituje dane wyjściowe czytelne maszynowo dla CI.
- `--source-repo`, `--source-commit`, `--source-ref`: opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

Usuwanie/przywracanie (tylko właściciel/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Synchronizacja (skanowanie lokalnych Skills + publikowanie nowych/zaktualizowanych):

- `clawhub sync`
- `--root <dir...>`: dodatkowe katalogi główne do skanowania.
- `--all`: wysyłaj wszystko bez promptów.
- `--dry-run`: pokaż, co zostałoby wysłane.
- `--bump <type>`: `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
- `--changelog <text>`: changelog dla aktualizacji nieinteraktywnych.
- `--tags <tags>`: tagi rozdzielane przecinkami (domyślnie: `latest`).
- `--concurrency <n>`: kontrole rejestru (domyślnie: 4).

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

### Tworzenie kopii zapasowej własnych Skills (publish lub sync)

Dla pojedynczego folderu Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Aby przeskanować i utworzyć kopię zapasową wielu Skills naraz:

```bash
clawhub sync --all
```

### Opublikuj Plugin z GitHub

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

Opublikowane pakiety powinny dostarczać zbudowany JavaScript i kierować `runtimeExtensions`
na ten wynik. Instalacje z checkoutu git nadal mogą wracać do źródła TypeScript,
gdy nie istnieją zbudowane pliki, ale zbudowane wpisy runtime pozwalają uniknąć
kompilacji TypeScript w czasie działania w ścieżkach startup, doctor i ładowania Pluginów.

## Szczegóły zaawansowane (techniczne)

### Wersjonowanie i tagi

- Każda publikacja tworzy nowy **semver** `SkillVersion`.
- Tagi (takie jak `latest`) wskazują na wersję; przesuwanie tagów pozwala na rollback.
- Changelogi są dołączane per wersja i mogą być puste przy sync lub publikowaniu aktualizacji.

### Zmiany lokalne vs wersje rejestru

Aktualizacje porównują lokalną zawartość Skill z wersjami rejestru przy użyciu hashu treści. Jeśli lokalne pliki nie odpowiadają żadnej opublikowanej wersji, CLI pyta przed nadpisaniem (albo wymaga `--force` w uruchomieniach nieinteraktywnych).

### Skanowanie sync i zapasowe katalogi główne

`clawhub sync` najpierw skanuje bieżący workdir. Jeśli nie znajdzie żadnych Skills, wraca do znanych starszych lokalizacji (na przykład `~/openclaw/skills` i `~/.openclaw/skills`). To rozwiązanie ma odnajdywać starsze instalacje Skills bez dodatkowych flag.

### Pamięć i lockfile

- Zainstalowane Skills są zapisywane w `.clawhub/lock.json` w workdir.
- Tokeny auth są przechowywane w pliku konfiguracyjnym CLI ClawHub (nadpisanie przez `CLAWHUB_CONFIG_PATH`).

### Telemetria (liczniki instalacji)

Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalny snapshot do obliczania liczby instalacji. Możesz to całkowicie wyłączyć:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Zmienne środowiskowe

- `CLAWHUB_SITE`: nadpisuje URL strony.
- `CLAWHUB_REGISTRY`: nadpisuje URL API rejestru.
- `CLAWHUB_CONFIG_PATH`: nadpisuje miejsce przechowywania tokenu/konfiguracji przez CLI.
- `CLAWHUB_WORKDIR`: nadpisuje domyślny workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: wyłącza telemetrię przy `sync`.

## Powiązane

- [Plugin](/pl/tools/plugin)
- [Skills](/pl/tools/skills)
- [Pluginy społecznościowe](/pl/plugins/community)
