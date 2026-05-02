---
read_when:
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills albo Pluginów
    - Publikowanie Skills lub Pluginów w rejestrze
    - Konfigurowanie CLI clawhub lub jego nadpisań środowiskowych
sidebarTitle: ClawHub
summary: 'ClawHub: publiczny rejestr Skills i Pluginów OpenClaw, natywne przepływy instalacji oraz CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T10:04:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub jest publicznym rejestrem dla **umiejętności i pluginów OpenClaw**.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować umiejętności oraz instalować pluginy z ClawHub.
- Używaj osobnego CLI `clawhub` do przepływów uwierzytelniania w rejestrze, publikowania, usuwania/przywracania oraz synchronizacji.

Witryna: [clawhub.ai](https://clawhub.ai)

## Szybki start

<Steps>
  <Step title="Wyszukiwanie">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalowanie">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Użycie">
    Rozpocznij nową sesję OpenClaw — wykryje nową umiejętność.
  </Step>
  <Step title="Publikowanie (opcjonalnie)">
    Dla przepływów uwierzytelnionych w rejestrze (publikowanie, synchronizacja, zarządzanie) zainstaluj
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
    zachowują metadane źródła, aby późniejsze wywołania `update` mogły pozostać na ClawHub.

  </Tab>
  <Tab title="Pluginy">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` odpytuje katalog pluginów ClawHub i wypisuje gotowe do instalacji
    nazwy pakietów. Surowe specyfikacje pluginów bezpieczne dla npm są także sprawdzane w ClawHub
    przed npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Użyj `npm:<package>`, gdy chcesz rozwiązywania wyłącznie przez npm bez
    wyszukiwania w ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Instalacje pluginów sprawdzają deklarowaną zgodność `pluginApi` i
    `minGatewayVersion`, zanim rozpocznie się instalacja archiwum, dzięki czemu
    niezgodne hosty wcześnie kończą się bezpiecznym niepowodzeniem zamiast częściowo instalować
    pakiet. Gdy wersja pakietu publikuje artefakt ClawPack,
    OpenClaw preferuje ten artefakt, weryfikuje nagłówek skrótu ClawHub oraz
    pobrane bajty i zapisuje metadane skrótu ClawPack na potrzeby późniejszych
    aktualizacji. Starsze wersje pakietów bez metadanych ClawPack nadal używają
    starszej ścieżki weryfikacji archiwum pakietu.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akceptuje tylko instalowalne rodziny
pluginów. Jeśli pakiet ClawHub jest w rzeczywistości umiejętnością, OpenClaw zatrzymuje się i
wskazuje zamiast tego `openclaw skills install <slug>`.

Anonimowe instalacje pluginów z ClawHub również kończą się bezpiecznym niepowodzeniem dla pakietów prywatnych.
Kanały społeczności lub inne kanały nieoficjalne nadal mogą instalować, ale OpenClaw
ostrzega, aby operatorzy mogli przejrzeć źródło i weryfikację przed ich
włączeniem.
</Note>

## Czym jest ClawHub

- Publiczny rejestr umiejętności i pluginów OpenClaw.
- Wersjonowany magazyn pakietów umiejętności i metadanych.
- Powierzchnia odkrywania dla wyszukiwania, tagów i sygnałów użycia.

Typowa umiejętność to wersjonowany pakiet plików, który zawiera:

- Plik `SKILL.md` z głównym opisem i sposobem użycia.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez umiejętność.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub używa metadanych do obsługi odkrywania i bezpiecznego ujawniania
możliwości umiejętności. Rejestr śledzi sygnały użycia (gwiazdki, pobrania), aby
poprawiać ranking i widoczność. Każde opublikowanie tworzy nową wersję semver,
a rejestr zachowuje historię wersji, aby użytkownicy mogli audytować
zmiany.

## Obszar roboczy i ładowanie umiejętności

Osobne CLI `clawhub` także instaluje umiejętności w `./skills` pod
bieżącym katalogiem roboczym. Jeśli skonfigurowany jest obszar roboczy OpenClaw,
`clawhub` wraca do tego obszaru roboczego, chyba że nadpiszesz `--workdir`
(lub `CLAWHUB_WORKDIR`). OpenClaw ładuje umiejętności obszaru roboczego z
`<workspace>/skills` i wykrywa je w **następnej** sesji.

Jeśli już używasz `~/.openclaw/skills` lub umiejętności dołączonych w pakiecie, umiejętności
obszaru roboczego mają pierwszeństwo. Więcej szczegółów o tym, jak umiejętności są ładowane,
udostępniane i bramkowane, znajdziesz w [Skills](/pl/tools/skills).

## Funkcje usługi

| Funkcja                  | Uwagi                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Publiczne przeglądanie   | Umiejętności i ich zawartość `SKILL.md` są publicznie widoczne.     |
| Wyszukiwanie             | Oparte na embeddingach (wyszukiwanie wektorowe), nie tylko na słowach kluczowych. |
| Wersjonowanie            | Semver, dzienniki zmian i tagi (w tym `latest`).                    |
| Pobrania                 | Zip dla każdej wersji.                                              |
| Gwiazdki i komentarze    | Informacje zwrotne społeczności.                                    |
| Podsumowania skanów bezpieczeństwa | Strony szczegółów pokazują najnowszy stan skanu przed instalacją lub pobraniem. |
| Strony szczegółów skanerów | Wyniki VirusTotal, ClawScan i analizy statycznej mają głębokie linki. |
| Panel odzyskiwania właściciela | Wydawcy mogą widzieć należące do nich treści zatrzymane przez skanowanie z `/dashboard`. |
| Ponowne skanowania na żądanie właściciela | Właściciele mogą żądać ograniczonych ponownych skanów w celu obsługi fałszywych alarmów. |
| Moderacja                | Zatwierdzenia i audyty.                                             |
| API przyjazne dla CLI    | Odpowiednie do automatyzacji i skryptów.                            |

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty — każdy może przesyłać umiejętności, ale konto GitHub
musi mieć **co najmniej tydzień**, aby publikować. Spowalnia to
nadużycia bez blokowania prawidłowych kontrybutorów.

<AccordionGroup>
  <Accordion title="Skany bezpieczeństwa">
    ClawHub uruchamia automatyczne kontrole bezpieczeństwa opublikowanych umiejętności i wydań
    pluginów. Publiczne strony szczegółów podsumowują bieżący wynik, a wiersze skanerów
    linkują do dedykowanych stron szczegółów dla VirusTotal, ClawScan i analizy
    statycznej.

    Wydania zatrzymane przez skanowanie lub zablokowane mogą być niedostępne w publicznym katalogu i
    powierzchniach instalacyjnych, pozostając jednocześnie widoczne dla właściciela w `/dashboard`.

  </Accordion>
  <Accordion title="Zgłaszanie">
    - Każdy zalogowany użytkownik może zgłosić umiejętność.
    - Powody zgłoszeń są wymagane i rejestrowane.
    - Każdy użytkownik może mieć jednocześnie do 20 aktywnych zgłoszeń.
    - Umiejętności z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.

  </Accordion>
  <Accordion title="Moderacja">
    - Moderatorzy mogą wyświetlać ukryte umiejętności, odkrywać je, usuwać je lub banować użytkowników.
    - Nadużywanie funkcji zgłoszeń może skutkować banem konta.
    - Chcesz zostać moderatorem? Zapytaj na Discordzie OpenClaw i skontaktuj się z moderatorem lub maintainerem.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Potrzebujesz tego tylko dla przepływów uwierzytelnionych w rejestrze, takich jak
publikowanie/synchronizacja.

### Opcje globalne

<ParamField path="--workdir <dir>" type="string">
  Katalog roboczy. Domyślnie: bieżący katalog; wraca do obszaru roboczego OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Katalog umiejętności, względny wobec katalogu roboczego.
</ParamField>
<ParamField path="--site <url>" type="string">
  Bazowy URL witryny (logowanie w przeglądarce).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Bazowy URL API rejestru.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Wyłącz monity (tryb nieinteraktywny).
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

    Wyszukuje umiejętności. Do odkrywania pluginów/pakietów użyj `clawhub package explore`.

    - `--limit <n>` — maksymalna liczba wyników.

  </Accordion>
  <Accordion title="Przeglądanie / inspekcja pluginów">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` i `package inspect` to powierzchnie CLI ClawHub do odkrywania pluginów/pakietów i inspekcji metadanych. Natywne instalacje OpenClaw nadal używają `openclaw plugins install clawhub:<package>`.

    Opcje:

    - `--family skill|code-plugin|bundle-plugin` — filtruj rodzinę pakietów.
    - `--official` — pokazuj tylko oficjalne pakiety.
    - `--executes-code` — pokazuj tylko pakiety, które wykonują kod.
    - `--version <version>` / `--tag <tag>` — sprawdź określoną wersję pakietu.
    - `--versions`, `--files`, `--file <path>` — sprawdź historię i pliki pakietu.
    - `--json` — wynik czytelny dla maszyn.

  </Accordion>
  <Accordion title="Instalowanie / aktualizowanie / wyświetlanie listy">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opcje:

    - `--version <version>` — zainstaluj lub zaktualizuj do określonej wersji (tylko pojedynczy slug przy `update`).
    - `--force` — nadpisz, jeśli folder już istnieje albo gdy pliki lokalne nie pasują do żadnej opublikowanej wersji.
    - `clawhub list` odczytuje `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikowanie umiejętności">
    ```bash
    clawhub skill publish <path>
    ```

    Opcje:

    - `--slug <slug>` — slug umiejętności.
    - `--name <name>` — nazwa wyświetlana.
    - `--version <version>` — wersja semver.
    - `--changelog <text>` — tekst dziennika zmian (może być pusty).
    - `--tags <tags>` — tagi rozdzielone przecinkami (domyślnie: `latest`).

  </Accordion>
  <Accordion title="Publikowanie pluginów">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` może być lokalnym folderem, `owner/repo`, `owner/repo@ref` lub
    adresem URL GitHub.

    Opcje:

    - `--dry-run` — zbuduj dokładny plan publikacji bez przesyłania czegokolwiek.
    - `--json` — emituj wynik czytelny dla maszyn dla CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

  </Accordion>
  <Accordion title="Żądanie ponownych skanowań">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Polecenia ponownego skanowania wymagają tokena zalogowanego właściciela i celują w najnowszą
    opublikowaną wersję umiejętności lub wydanie pluginu. W uruchomieniach nieinteraktywnych przekaż
    `--yes`.

    Odpowiedzi JSON zawierają rodzaj celu, nazwę, wersję, status ponownego skanowania oraz
    pozostałą/maksymalną liczbę żądań dla tej wersji lub wydania.

  </Accordion>
  <Accordion title="Usuwanie / przywracanie usuniętych (właściciel lub administrator)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchronizacja (skanuj lokalnie + publikuj nowe lub zaktualizowane)">
    ```bash
    clawhub sync
    ```

    Opcje:

    - `--root <dir...>` — dodatkowe katalogi główne skanowania.
    - `--all` — prześlij wszystko bez monitów.
    - `--dry-run` — pokaż, co zostałoby przesłane.
    - `--bump <type>` — `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
    - `--changelog <text>` — dziennik zmian dla aktualizacji nieinteraktywnych.
    - `--tags <tags>` — tagi rozdzielone przecinkami (domyślnie: `latest`).
    - `--concurrency <n>` — sprawdzenia rejestru (domyślnie: `4`).

  </Accordion>
</AccordionGroup>

## Typowe przepływy pracy

<Tabs>
  <Tab title="Szukaj">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Znajdź Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Zainstaluj">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Zaktualizuj wszystko">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Opublikuj pojedynczą skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Synchronizuj wiele skills">
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
`runtimeExtensions` na ten wynik. Instalacje z checkoutu Git mogą nadal
wracać do źródła TypeScript, gdy nie istnieją zbudowane pliki, ale zbudowane
wpisy runtime unikają kompilacji TypeScript w czasie działania w ścieżkach uruchamiania, doctor i
ładowania Plugin.

## Wersjonowanie, plik lockfile i telemetria

<AccordionGroup>
  <Accordion title="Wersjonowanie i tagi">
    - Każda publikacja tworzy nową **semver** `SkillVersion`.
    - Tagi (takie jak `latest`) wskazują wersję; przenoszenie tagów pozwala wycofać zmianę.
    - Changelogi są dołączane dla każdej wersji i mogą być puste podczas synchronizowania lub publikowania aktualizacji.

  </Accordion>
  <Accordion title="Zmiany lokalne a wersje rejestru">
    Aktualizacje porównują lokalną zawartość skill z wersjami w rejestrze przy użyciu
    hasha zawartości. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji,
    CLI pyta przed nadpisaniem (albo wymaga `--force` w
    uruchomieniach nieinteraktywnych).
  </Accordion>
  <Accordion title="Skanowanie synchronizacji i katalogi główne awaryjne">
    `clawhub sync` najpierw skanuje bieżący katalog roboczy. Jeśli nie zostaną
    znalezione żadne skills, wraca do znanych starszych lokalizacji (na przykład
    `~/openclaw/skills` i `~/.openclaw/skills`). Ma to na celu
    znajdowanie starszych instalacji skills bez dodatkowych flag.
  </Accordion>
  <Accordion title="Przechowywanie i plik lockfile">
    - Zainstalowane skills są zapisywane w `.clawhub/lock.json` w katalogu roboczym.
    - Tokeny uwierzytelniania są przechowywane w pliku konfiguracji CLI ClawHub (nadpisz przez `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (liczniki instalacji)">
    Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalną
    migawkę do obliczania liczników instalacji. Możesz to całkowicie wyłączyć:

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
