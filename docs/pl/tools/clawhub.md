---
read_when:
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills albo Pluginów
    - Publikowanie Skills lub Pluginów w rejestrze
    - Konfigurowanie CLI clawhub lub jego nadpisań środowiskowych
sidebarTitle: ClawHub
summary: 'ClawHub: publiczny rejestr Skills i Plugin dla OpenClaw, natywne przepływy instalacji oraz CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:42:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub to publiczny rejestr **Skills i Plugin dla OpenClaw**.

- Używaj natywnych poleceń `openclaw` do wyszukiwania, instalowania i aktualizowania Skills oraz do instalowania Pluginów z ClawHub.
- Używaj osobnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania, usuwania/przywracania oraz przepływów synchronizacji.

Strona: [clawhub.ai](https://clawhub.ai)

## Szybki start

<Steps>
  <Step title="Wyszukiwanie">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalacja">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Użycie">
    Rozpocznij nową sesję OpenClaw — wykryje nowy Skill.
  </Step>
  <Step title="Publikowanie (opcjonalnie)">
    Dla przepływów wymagających uwierzytelnienia w rejestrze (publikowanie, synchronizacja, zarządzanie) zainstaluj osobne CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # lub
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Natywne przepływy OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Natywne polecenia `openclaw` instalują do aktywnego workspace i zapisują metadane źródła, dzięki czemu późniejsze wywołania `update` mogą pozostać w ClawHub.

  </Tab>
  <Tab title="Pluginy">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Zwykłe specyfikacje Plugin bezpieczne dla npm są również sprawdzane najpierw w ClawHub, a dopiero potem w npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Instalacje Plugin walidują reklamowaną zgodność `pluginApi` i `minGatewayVersion` przed uruchomieniem instalacji archiwum, dzięki czemu niezgodne hosty kończą działanie w trybie fail closed wcześnie, zamiast częściowo instalować pakiet.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akceptuje tylko instalowalne rodziny Plugin. Jeśli pakiet ClawHub jest w rzeczywistości Skill, OpenClaw zatrzyma się i wskaże zamiast tego `openclaw skills install <slug>`.

Anonimowe instalacje Plugin z ClawHub również kończą się w trybie fail closed dla pakietów prywatnych.
Kanały społecznościowe lub inne nieoficjalne nadal mogą być instalowane, ale OpenClaw ostrzega, aby operatorzy mogli przejrzeć źródło i weryfikację przed włączeniem.
</Note>

## Czym jest ClawHub

- Publicznym rejestrem Skills i Plugin dla OpenClaw.
- Wersjonowanym magazynem pakietów Skills i metadanych.
- Powierzchnią odkrywania dla wyszukiwania, tagów i sygnałów użycia.

Typowy Skill to wersjonowany pakiet plików, który zawiera:

- Plik `SKILL.md` z głównym opisem i sposobem użycia.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez Skill.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub używa metadanych do obsługi odkrywania i bezpiecznego udostępniania możliwości Skills. Rejestr śledzi sygnały użycia (gwiazdki, pobrania), aby poprawiać ranking i widoczność. Każda publikacja tworzy nową wersję semver, a rejestr zachowuje historię wersji, aby użytkownicy mogli kontrolować zmiany.

## Workspace i ładowanie Skills

Osobne CLI `clawhub` instaluje również Skills do `./skills` w bieżącym katalogu roboczym. Jeśli workspace OpenClaw jest skonfigurowany, `clawhub` przechodzi awaryjnie do tego workspace, chyba że nadpiszesz to przez `--workdir` (lub `CLAWHUB_WORKDIR`). OpenClaw ładuje Skills workspace z `<workspace>/skills` i wykrywa je w **następnej** sesji.

Jeśli używasz już `~/.openclaw/skills` lub dołączonych Skills, Skills workspace mają pierwszeństwo. Więcej informacji o tym, jak Skills są ładowane, współdzielone i ograniczane, znajdziesz w [Skills](/pl/tools/skills).

## Funkcje usługi

| Funkcja            | Uwagi                                                      |
| ------------------ | ---------------------------------------------------------- |
| Publiczne przeglądanie | Skills i ich treść `SKILL.md` są publicznie widoczne. |
| Wyszukiwanie       | Oparte na embeddingach (wyszukiwanie wektorowe), nie tylko na słowach kluczowych. |
| Wersjonowanie      | Semver, changelogi i tagi (w tym `latest`).               |
| Pobrania           | Zip dla każdej wersji.                                     |
| Gwiazdki i komentarze | Opinie społeczności.                                    |
| Moderacja          | Zatwierdzenia i audyty.                                    |
| API przyjazne CLI  | Odpowiednie do automatyzacji i skryptów.                   |

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty — każdy może przesyłać Skills, ale konto GitHub musi mieć **co najmniej tydzień**, aby publikować. Spowalnia to nadużycia bez blokowania legalnych współtwórców.

<AccordionGroup>
  <Accordion title="Zgłaszanie">
    - Każdy zalogowany użytkownik może zgłosić Skill.
    - Powody zgłoszeń są wymagane i zapisywane.
    - Każdy użytkownik może mieć jednocześnie maksymalnie 20 aktywnych zgłoszeń.
    - Skills z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.

  </Accordion>
  <Accordion title="Moderacja">
    - Moderatorzy mogą przeglądać ukryte Skills, przywracać ich widoczność, usuwać je lub banować użytkowników.
    - Nadużywanie funkcji zgłaszania może skutkować banem konta.
    - Chcesz zostać moderatorem? Zapytaj na Discord OpenClaw i skontaktuj się z moderatorem lub maintainerem.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Potrzebujesz go tylko do przepływów wymagających uwierzytelnienia w rejestrze, takich jak publikowanie/synchronizacja.

### Opcje globalne

<ParamField path="--workdir <dir>" type="string">
  Katalog roboczy. Domyślnie: bieżący katalog; awaryjnie workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Katalog Skills, względem workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Bazowy URL strony (logowanie w przeglądarce).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Bazowy URL API rejestru.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Wyłącza prompty (tryb nieinteraktywny).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Wyświetla wersję CLI.
</ParamField>

### Polecenia

<AccordionGroup>
  <Accordion title="Uwierzytelnianie (login / logout / whoami)">
    ```bash
    clawhub login              # przepływ w przeglądarce
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opcje logowania:

    - `--token <token>` — wklej token API.
    - `--label <label>` — etykieta zapisywana dla tokenów logowania w przeglądarce (domyślnie: `CLI token`).
    - `--no-browser` — nie otwieraj przeglądarki (wymaga `--token`).

  </Accordion>
  <Accordion title="Wyszukiwanie">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — maksymalna liczba wyników.

  </Accordion>
  <Accordion title="Instalacja / aktualizacja / lista">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opcje:

    - `--version <version>` — instalacja lub aktualizacja do konkretnej wersji (na `update` tylko dla pojedynczego slug).
    - `--force` — nadpisuje, jeśli folder już istnieje lub gdy lokalne pliki nie pasują do żadnej opublikowanej wersji.
    - `clawhub list` odczytuje `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikowanie Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opcje:

    - `--slug <slug>` — slug Skill.
    - `--name <name>` — nazwa wyświetlana.
    - `--version <version>` — wersja semver.
    - `--changelog <text>` — tekst changelogu (może być pusty).
    - `--tags <tags>` — tagi rozdzielone przecinkami (domyślnie: `latest`).

  </Accordion>
  <Accordion title="Publikowanie Pluginów">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` może być lokalnym folderem, `owner/repo`, `owner/repo@ref` lub URL-em GitHub.

    Opcje:

    - `--dry-run` — buduje dokładny plan publikacji bez wysyłania czegokolwiek.
    - `--json` — zwraca wynik czytelny maszynowo dla CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

  </Accordion>
  <Accordion title="Usuwanie / przywracanie (właściciel lub administrator)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchronizacja (skanowanie lokalne + publikowanie nowych lub zaktualizowanych)">
    ```bash
    clawhub sync
    ```

    Opcje:

    - `--root <dir...>` — dodatkowe katalogi główne do skanowania.
    - `--all` — przesyła wszystko bez promptów.
    - `--dry-run` — pokazuje, co zostałoby przesłane.
    - `--bump <type>` — `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
    - `--changelog <text>` — changelog dla aktualizacji nieinteraktywnych.
    - `--tags <tags>` — tagi rozdzielone przecinkami (domyślnie: `latest`).
    - `--concurrency <n>` — sprawdzenia rejestru (domyślnie: `4`).

  </Accordion>
</AccordionGroup>

## Typowe przepływy

<Tabs>
  <Tab title="Wyszukiwanie">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Instalacja">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Aktualizacja wszystkich">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publikowanie pojedynczego Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Synchronizacja wielu Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publikowanie Plugin z GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadane pakietu Plugin

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

Opublikowane pakiety powinny dostarczać **zbudowany JavaScript** i wskazywać `runtimeExtensions` na to wyjście. Instalacje z checkoutu Git nadal mogą awaryjnie korzystać ze źródła TypeScript, gdy nie istnieją zbudowane pliki, ale zbudowane wpisy runtime pozwalają uniknąć kompilacji TypeScript w runtime na ścieżkach uruchamiania, doctor i ładowania Plugin.

## Wersjonowanie, plik blokady i telemetry

<AccordionGroup>
  <Accordion title="Wersjonowanie i tagi">
    - Każda publikacja tworzy nową wersję **semver** `SkillVersion`.
    - Tagi (takie jak `latest`) wskazują na wersję; przesuwanie tagów pozwala cofać zmiany.
    - Changelogi są dołączane do każdej wersji i mogą być puste przy synchronizacji lub publikowaniu aktualizacji.

  </Accordion>
  <Accordion title="Zmiany lokalne vs wersje rejestru">
    Aktualizacje porównują lokalną zawartość Skill z wersjami w rejestrze przy użyciu skrótu treści. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji, CLI pyta przed nadpisaniem (albo wymaga `--force` w trybie nieinteraktywnym).
  </Accordion>
  <Accordion title="Skanowanie synchronizacji i awaryjne katalogi główne">
    `clawhub sync` najpierw skanuje bieżący workdir. Jeśli nie znajdzie żadnych Skills, przechodzi awaryjnie do znanych starszych lokalizacji (na przykład `~/openclaw/skills` i `~/.openclaw/skills`). Zostało to zaprojektowane tak, aby znajdować starsze instalacje Skills bez dodatkowych flag.
  </Accordion>
  <Accordion title="Przechowywanie i plik blokady">
    - Zainstalowane Skills są zapisywane w `.clawhub/lock.json` w workdir.
    - Tokeny uwierzytelniania są przechowywane w pliku konfiguracji CLI ClawHub (nadpisanie przez `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (liczba instalacji)">
    Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalny zrzut do obliczania liczby instalacji. Możesz całkowicie to wyłączyć:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe

| Zmienna                      | Efekt                                          |
| ---------------------------- | ---------------------------------------------- |
| `CLAWHUB_SITE`               | Nadpisuje URL strony.                          |
| `CLAWHUB_REGISTRY`           | Nadpisuje URL API rejestru.                    |
| `CLAWHUB_CONFIG_PATH`        | Nadpisuje miejsce, w którym CLI przechowuje token/konfigurację. |
| `CLAWHUB_WORKDIR`            | Nadpisuje domyślny workdir.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetry przy `sync`.                |

## Powiązane

- [Pluginy społecznościowe](/pl/plugins/community)
- [Pluginy](/pl/tools/plugin)
- [Skills](/pl/tools/skills)
