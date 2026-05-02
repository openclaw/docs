---
read_when:
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills lub Pluginów
    - Publikowanie Skills lub Pluginów w rejestrze
    - Konfigurowanie CLI clawhub lub jego nadpisań środowiskowych
sidebarTitle: ClawHub
summary: 'ClawHub: publiczny rejestr Skills i pluginów OpenClaw, natywne przepływy instalacji oraz CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T20:58:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub to publiczny rejestr dla **Skills i plugins OpenClaw**.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować Skills oraz instalować plugins z ClawHub.
- Używaj osobnego CLI `clawhub` do przepływów pracy związanych z uwierzytelnianiem w rejestrze, publikowaniem, usuwaniem/cofaniem usunięcia oraz synchronizacją.

Strona: [clawhub.ai](https://clawhub.ai)

## Szybki start

<Steps>
  <Step title="Wyszukaj">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Zainstaluj">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Użyj">
    Rozpocznij nową sesję OpenClaw — wykryje nowy skill.
  </Step>
  <Step title="Opublikuj (opcjonalnie)">
    Dla przepływów pracy uwierzytelnionych w rejestrze (publikowanie, synchronizacja, zarządzanie) zainstaluj
    osobne CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # or
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

    Natywne polecenia `openclaw` instalują w aktywnym obszarze roboczym i
    zapisują metadane źródła, aby późniejsze wywołania `update` mogły pozostać przy ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` odpytuje katalog plugins ClawHub i wypisuje gotowe do instalacji
    nazwy pakietów. Użyj `clawhub:<package>`, gdy chcesz rozwiązywania przez ClawHub.
    Same specyfikacje plugins zgodne z npm instalują z npm podczas przełączenia startowego:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` również oznacza wyłącznie npm i jest przydatne, gdy specyfikacja mogłaby w przeciwnym razie
    być niejednoznaczna:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Instalacje plugins sprawdzają deklarowaną zgodność `pluginApi` i
    `minGatewayVersion`, zanim rozpocznie się instalacja archiwum, więc
    niezgodne hosty zawodzą bezpiecznie na wczesnym etapie zamiast częściowo instalować
    pakiet. Gdy wersja pakietu publikuje artefakt ClawPack,
    OpenClaw preferuje dokładnie przesłany npm-pack `.tgz`, weryfikuje nagłówek skrótu ClawHub
    oraz pobrane bajty, a także zapisuje rodzaj artefaktu, integralność npm,
    sumę shasum npm, nazwę tarballa i metadane skrótu ClawPack na potrzeby późniejszych
    aktualizacji. Starsze wersje pakietów bez metadanych ClawPack nadal używają
    starszej ścieżki weryfikacji archiwum pakietu.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akceptuje tylko instalowalne rodziny plugins.
Jeśli pakiet ClawHub jest w rzeczywistości skillem, OpenClaw zatrzymuje się i
zamiast tego wskazuje `openclaw skills install <slug>`.

Anonimowe instalacje plugins ClawHub również zawodzą bezpiecznie dla pakietów prywatnych.
Kanały społecznościowe lub inne nieoficjalne kanały nadal mogą być instalowane, ale OpenClaw
ostrzega, aby operatorzy mogli sprawdzić źródło i weryfikację przed ich włączeniem.
</Note>

## Czym jest ClawHub

- Publiczny rejestr Skills i plugins OpenClaw.
- Wersjonowany magazyn pakietów skills i metadanych.
- Powierzchnia odkrywania dla wyszukiwania, tagów i sygnałów użycia.

Typowy skill to wersjonowany pakiet plików, który zawiera:

- Plik `SKILL.md` z głównym opisem i sposobem użycia.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez skill.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub używa metadanych do zasilania odkrywania i bezpiecznego eksponowania
możliwości skills. Rejestr śledzi sygnały użycia (gwiazdki, pobrania), aby
poprawiać ranking i widoczność. Każda publikacja tworzy nową wersję semver,
a rejestr przechowuje historię wersji, aby użytkownicy mogli audytować
zmiany.

## Obszar roboczy i ładowanie skills

Osobne CLI `clawhub` instaluje również skills w `./skills` w
bieżącym katalogu roboczym. Jeśli skonfigurowano obszar roboczy OpenClaw,
`clawhub` używa tego obszaru roboczego jako opcji awaryjnej, chyba że nadpiszesz `--workdir`
(lub `CLAWHUB_WORKDIR`). OpenClaw ładuje skills obszaru roboczego z
`<workspace>/skills` i wykrywa je w **następnej** sesji.

Jeśli używasz już `~/.openclaw/skills` lub dołączonych skills, skills
obszaru roboczego mają pierwszeństwo. Więcej szczegółów o tym, jak skills są ładowane,
udostępniane i bramkowane, znajdziesz w [Skills](/pl/tools/skills).

## Funkcje usługi

| Funkcja                  | Uwagi                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Publiczne przeglądanie   | Skills i ich zawartość `SKILL.md` są publicznie widoczne.           |
| Wyszukiwanie             | Oparte na embeddingach (wyszukiwanie wektorowe), nie tylko na słowach kluczowych. |
| Wersjonowanie            | Semver, dzienniki zmian i tagi (w tym `latest`).                    |
| Pobrania                 | Zip dla każdej wersji.                                              |
| Gwiazdki i komentarze    | Opinie społeczności.                                                |
| Podsumowania skanów bezpieczeństwa | Strony szczegółów pokazują najnowszy stan skanu przed instalacją lub pobraniem. |
| Strony szczegółów skanerów | Wyniki VirusTotal, ClawScan i analizy statycznej mają głębokie linki. |
| Panel odzyskiwania właściciela | Publikujący mogą zobaczyć własne treści zatrzymane przez skan z `/dashboard`. |
| Ponowne skany na żądanie właściciela | Właściciele mogą żądać ograniczonych ponownych skanów w celu odzyskania po fałszywym alarmie. |
| Moderacja                | Zatwierdzenia i audyty.                                             |
| API przyjazne CLI        | Odpowiednie do automatyzacji i skryptowania.                        |

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty — każdy może przesyłać skills, ale konto GitHub
musi mieć **co najmniej tydzień**, aby publikować. Spowalnia to
nadużycia bez blokowania prawowitych kontrybutorów.

<AccordionGroup>
  <Accordion title="Skany bezpieczeństwa">
    ClawHub uruchamia automatyczne kontrole bezpieczeństwa na opublikowanych skills i wydaniach
    plugins. Publiczne strony szczegółów podsumowują bieżący wynik, a wiersze skanerów
    linkują do dedykowanych stron szczegółów dla VirusTotal, ClawScan i analizy
    statycznej.

    Wydania zatrzymane przez skan lub zablokowane mogą być niedostępne w publicznym katalogu i
    powierzchniach instalacji, pozostając widoczne dla właściciela w `/dashboard`.

  </Accordion>
  <Accordion title="Zgłaszanie">
    - Każdy zalogowany użytkownik może zgłosić skill.
    - Powody zgłoszenia są wymagane i zapisywane.
    - Każdy użytkownik może mieć jednocześnie do 20 aktywnych zgłoszeń.
    - Skills z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.

  </Accordion>
  <Accordion title="Moderacja">
    - Moderatorzy mogą wyświetlać ukryte skills, odkrywać je, usuwać je lub blokować użytkowników.
    - Nadużywanie funkcji zgłaszania może skutkować blokadą konta.
    - Chcesz zostać moderatorem? Zapytaj na Discord OpenClaw i skontaktuj się z moderatorem lub maintainerem.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Potrzebujesz go tylko do przepływów pracy uwierzytelnionych w rejestrze, takich jak
publikowanie/synchronizacja.

### Opcje globalne

<ParamField path="--workdir <dir>" type="string">
  Katalog roboczy. Domyślnie: bieżący katalog; awaryjnie używa obszaru roboczego OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Katalog skills, względny wobec workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Bazowy URL strony (logowanie w przeglądarce).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Bazowy URL API rejestru.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Wyłącz prompty (tryb nieinteraktywny).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Wypisz wersję CLI.
</ParamField>

### Polecenia

<AccordionGroup>
  <Accordion title="Uwierzytelnianie (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opcje logowania:

    - `--token <token>` — wklej token API.
    - `--label <label>` — etykieta przechowywana dla tokenów logowania w przeglądarce (domyślnie: `CLI token`).
    - `--no-browser` — nie otwieraj przeglądarki (wymaga `--token`).

  </Accordion>
  <Accordion title="Wyszukiwanie">
    ```bash
    clawhub search "query"
    ```

    Wyszukuje skills. Do odkrywania plugins/pakietów użyj `clawhub package explore`.

    - `--limit <n>` — maksymalna liczba wyników.

  </Accordion>
  <Accordion title="Przeglądaj / sprawdzaj plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` i `package inspect` to powierzchnie CLI ClawHub do odkrywania plugins/pakietów i sprawdzania metadanych. Natywne instalacje OpenClaw nadal używają `openclaw plugins install clawhub:<package>`.

    Opcje:

    - `--family skill|code-plugin|bundle-plugin` — filtruj rodzinę pakietu.
    - `--official` — pokazuj tylko oficjalne pakiety.
    - `--executes-code` — pokazuj tylko pakiety, które wykonują kod.
    - `--version <version>` / `--tag <tag>` — sprawdź konkretną wersję pakietu.
    - `--versions`, `--files`, `--file <path>` — sprawdź historię pakietu i pliki.
    - `--json` — wynik czytelny maszynowo.

  </Accordion>
  <Accordion title="Instaluj / aktualizuj / wyświetl listę">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opcje:

    - `--version <version>` — zainstaluj lub zaktualizuj do konkretnej wersji (tylko pojedynczy slug w `update`).
    - `--force` — nadpisz, jeśli folder już istnieje, albo gdy pliki lokalne nie pasują do żadnej opublikowanej wersji.
    - `clawhub list` odczytuje `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikuj skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opcje:

    - `--slug <slug>` — slug skilla.
    - `--name <name>` — nazwa wyświetlana.
    - `--version <version>` — wersja semver.
    - `--changelog <text>` — tekst dziennika zmian (może być pusty).
    - `--tags <tags>` — tagi rozdzielone przecinkami (domyślnie: `latest`).

  </Accordion>
  <Accordion title="Publikuj plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` może być folderem lokalnym, `owner/repo`, `owner/repo@ref` albo
    adresem URL GitHub.

    Opcje:

    - `--dry-run` — zbuduj dokładny plan publikacji bez przesyłania czegokolwiek.
    - `--json` — emituj wynik czytelny maszynowo dla CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

  </Accordion>
  <Accordion title="Żądaj ponownych skanów">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Polecenia ponownego skanu wymagają zalogowanego tokena właściciela i celują w najnowszą
    opublikowaną wersję skilla lub wydanie plugin. W uruchomieniach nieinteraktywnych przekaż
    `--yes`.

    Odpowiedzi JSON obejmują rodzaj celu, nazwę, wersję, status ponownego skanu oraz
    pozostałe/maksymalne liczby żądań dla tej wersji lub wydania.

  </Accordion>
  <Accordion title="Usuń / cofnij usunięcie (właściciel lub administrator)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchronizuj (skanuj lokalnie + publikuj nowe lub zaktualizowane)">
    ```bash
    clawhub sync
    ```

    Opcje:

    - `--root <dir...>` — dodatkowe korzenie skanowania.
    - `--all` — prześlij wszystko bez promptów.
    - `--dry-run` — pokaż, co zostałoby przesłane.
    - `--bump <type>` — `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
    - `--changelog <text>` — dziennik zmian dla aktualizacji nieinteraktywnych.
    - `--tags <tags>` — tagi rozdzielone przecinkami (domyślnie: `latest`).
    - `--concurrency <n>` — kontrole rejestru (domyślnie: `4`).

  </Accordion>
</AccordionGroup>

## Typowe przepływy pracy

<Tabs>
  <Tab title="Wyszukiwanie">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Znajdź plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Instalacja">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Zaktualizuj wszystko">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Opublikuj pojedynczą umiejętność">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Synchronizuj wiele umiejętności">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Opublikuj Plugin z GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadane pakietu Plugin

Pluginy kodu muszą zawierać wymagane metadane OpenClaw w
`package.json`:

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

Opublikowane pakiety powinny dostarczać **zbudowany JavaScript** i wskazywać
`runtimeExtensions` na ten wynik. Instalacje z checkoutu Git nadal mogą
cofać się do źródeł TypeScript, gdy nie istnieją zbudowane pliki, ale zbudowane
wpisy runtime pozwalają uniknąć kompilacji TypeScript podczas uruchamiania, działania doctor oraz ścieżek ładowania
Plugin.

## Wersjonowanie, plik blokady i telemetria

<AccordionGroup>
  <Accordion title="Wersjonowanie i tagi">
    - Każda publikacja tworzy nową wersję **semver** `SkillVersion`.
    - Tagi (takie jak `latest`) wskazują wersję; przenoszenie tagów pozwala wykonać rollback.
    - Dzienniki zmian są dołączane do każdej wersji i mogą być puste podczas synchronizowania lub publikowania aktualizacji.

  </Accordion>
  <Accordion title="Zmiany lokalne a wersje w rejestrze">
    Aktualizacje porównują lokalną zawartość umiejętności z wersjami w rejestrze przy użyciu
    skrótu zawartości. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji,
    CLI pyta przed nadpisaniem (lub wymaga `--force` w
    uruchomieniach nieinteraktywnych).
  </Accordion>
  <Accordion title="Skanowanie synchronizacji i zapasowe katalogi główne">
    `clawhub sync` najpierw skanuje bieżący katalog roboczy. Jeśli nie znajdzie żadnych umiejętności,
    używa znanych starszych lokalizacji (na przykład
    `~/openclaw/skills` i `~/.openclaw/skills`). Ma to na celu
    odnajdywanie starszych instalacji umiejętności bez dodatkowych flag.
  </Accordion>
  <Accordion title="Przechowywanie i plik blokady">
    - Zainstalowane umiejętności są zapisywane w `.clawhub/lock.json` w katalogu roboczym.
    - Tokeny uwierzytelniania są przechowywane w pliku konfiguracji CLI ClawHub (nadpisanie przez `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (liczba instalacji)">
    Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalną
    migawkę w celu obliczenia liczby instalacji. Możesz całkowicie to wyłączyć:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe

| Zmienna                       | Efekt                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Nadpisuje URL witryny.                          |
| `CLAWHUB_REGISTRY`            | Nadpisuje URL API rejestru.                     |
| `CLAWHUB_CONFIG_PATH`         | Nadpisuje miejsce, w którym CLI przechowuje token/konfigurację. |
| `CLAWHUB_WORKDIR`             | Nadpisuje domyślny katalog roboczy.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię przy `sync`.                 |

## Powiązane

- [Pluginy społeczności](/pl/plugins/community)
- [Pluginy](/pl/tools/plugin)
- [Skills](/pl/tools/skills)
