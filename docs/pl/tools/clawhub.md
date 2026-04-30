---
read_when:
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills lub Pluginów
    - Publikowanie Skills lub pluginów w rejestrze
    - Konfigurowanie CLI clawhub lub jego nadpisań środowiskowych
sidebarTitle: ClawHub
summary: 'ClawHub: publiczny rejestr Skills i pluginów OpenClaw, natywne przepływy instalacji oraz CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T10:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub jest publicznym rejestrem dla **OpenClaw Skills i pluginów**.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować Skills oraz instalować pluginy z ClawHub.
- Używaj osobnego CLI `clawhub` do przepływów pracy związanych z uwierzytelnianiem w rejestrze, publikowaniem, usuwaniem/przywracaniem usunięcia i synchronizacją.

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
    Uruchom nową sesję OpenClaw — wykryje nowy skill.
  </Step>
  <Step title="Opublikuj (opcjonalnie)">
    W przypadku przepływów pracy uwierzytelnianych w rejestrze (publikowanie, synchronizacja, zarządzanie) zainstaluj
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
    zachowują metadane źródła, aby późniejsze wywołania `update` mogły pozostać przy ClawHub.

  </Tab>
  <Tab title="Pluginy">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Proste, bezpieczne dla npm specyfikacje pluginów są także sprawdzane w ClawHub przed npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Użyj `npm:<package>`, gdy chcesz rozstrzygania wyłącznie przez npm bez
    wyszukiwania w ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Instalacje pluginów weryfikują deklarowaną zgodność `pluginApi` i
    `minGatewayVersion` przed uruchomieniem instalacji archiwum, dzięki czemu
    niezgodne hosty wcześnie kończą działanie bez zmian zamiast częściowo instalować
    pakiet.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akceptuje tylko instalowalne rodziny pluginów. Jeśli pakiet ClawHub jest w rzeczywistości skillem, OpenClaw zatrzyma się i
wskaże zamiast tego `openclaw skills install <slug>`.

Anonimowe instalacje pluginów ClawHub również kończą się bez zmian w przypadku pakietów prywatnych.
Kanały społecznościowe lub inne nieoficjalne nadal mogą się instalować, ale OpenClaw
ostrzega, aby operatorzy mogli sprawdzić źródło i weryfikację przed ich
włączeniem.
</Note>

## Czym jest ClawHub

- Publiczny rejestr Skills i pluginów OpenClaw.
- Wersjonowany magazyn pakietów skill i metadanych.
- Powierzchnia odkrywania dla wyszukiwania, tagów i sygnałów użycia.

Typowy skill to wersjonowany pakiet plików, który zawiera:

- Plik `SKILL.md` z głównym opisem i sposobem użycia.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez skill.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub używa metadanych do obsługi odkrywania i bezpiecznego udostępniania
możliwości skilli. Rejestr śledzi sygnały użycia (gwiazdki, pobrania), aby
poprawiać ranking i widoczność. Każda publikacja tworzy nową wersję semver,
a rejestr zachowuje historię wersji, aby użytkownicy mogli audytować
zmiany.

## Obszar roboczy i ładowanie skilli

Osobne CLI `clawhub` również instaluje skille w `./skills` w
bieżącym katalogu roboczym. Jeśli skonfigurowano obszar roboczy OpenClaw,
`clawhub` używa go jako rozwiązania zastępczego, chyba że nadpiszesz `--workdir`
(lub `CLAWHUB_WORKDIR`). OpenClaw ładuje skille obszaru roboczego z
`<workspace>/skills` i wykrywa je w **następnej** sesji.

Jeśli już używasz `~/.openclaw/skills` lub dołączonych skilli, skille
obszaru roboczego mają pierwszeństwo. Więcej szczegółów o tym, jak skille są ładowane,
udostępniane i bramkowane, znajdziesz w [Skills](/pl/tools/skills).

## Funkcje usługi

| Funkcja                  | Uwagi                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Publiczne przeglądanie   | Skills i ich zawartość `SKILL.md` są publicznie widoczne.           |
| Wyszukiwanie             | Oparte na osadzaniach (wyszukiwanie wektorowe), nie tylko na słowach kluczowych. |
| Wersjonowanie            | Semver, dzienniki zmian i tagi (w tym `latest`).                    |
| Pobrania                 | Zip dla każdej wersji.                                              |
| Gwiazdki i komentarze    | Opinie społeczności.                                                |
| Podsumowania skanów bezpieczeństwa | Strony szczegółów pokazują najnowszy stan skanu przed instalacją lub pobraniem. |
| Strony szczegółów skanera | Wyniki VirusTotal, ClawScan i analizy statycznej mają głębokie linki. |
| Panel odzyskiwania właściciela | Publikujący mogą zobaczyć własne treści zatrzymane przez skan z `/dashboard`. |
| Ponowne skany na żądanie właściciela | Właściciele mogą prosić o ograniczone ponowne skany w celu usunięcia fałszywych alarmów. |
| Moderacja                | Zatwierdzenia i audyty.                                             |
| API przyjazne dla CLI    | Odpowiednie do automatyzacji i skryptów.                            |

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty — każdy może przesyłać skille, ale konto GitHub
musi mieć **co najmniej tydzień**, aby publikować. Spowalnia to
nadużycia bez blokowania prawowitych kontrybutorów.

<AccordionGroup>
  <Accordion title="Skany bezpieczeństwa">
    ClawHub uruchamia automatyczne kontrole bezpieczeństwa opublikowanych skilli i wydań
    pluginów. Publiczne strony szczegółów podsumowują bieżący wynik, a wiersze skanerów
    linkują do dedykowanych stron szczegółów dla VirusTotal, ClawScan i analizy
    statycznej.

    Wydania zatrzymane przez skan lub zablokowane mogą być niedostępne w publicznym katalogu i
    powierzchniach instalacji, pozostając jednocześnie widoczne dla właściciela w `/dashboard`.

  </Accordion>
  <Accordion title="Zgłaszanie">
    - Każdy zalogowany użytkownik może zgłosić skill.
    - Powody zgłoszeń są wymagane i zapisywane.
    - Każdy użytkownik może mieć naraz do 20 aktywnych zgłoszeń.
    - Skille z więcej niż 3 unikalnymi zgłoszeniami są domyślnie automatycznie ukrywane.

  </Accordion>
  <Accordion title="Moderacja">
    - Moderatorzy mogą wyświetlać ukryte skille, odkrywać je, usuwać lub banować użytkowników.
    - Nadużywanie funkcji zgłaszania może skutkować banem konta.
    - Chcesz zostać moderatorem? Zapytaj na Discordzie OpenClaw i skontaktuj się z moderatorem lub maintainerem.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Potrzebujesz go tylko do przepływów pracy uwierzytelnianych w rejestrze, takich jak
publikowanie/synchronizacja.

### Opcje globalne

<ParamField path="--workdir <dir>" type="string">
  Katalog roboczy. Domyślnie: bieżący katalog; z opcją zastępczą w postaci obszaru roboczego OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Katalog Skills, względny względem katalogu roboczego.
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
    - `--label <label>` — etykieta przechowywana dla tokenów logowania przez przeglądarkę (domyślnie: `CLI token`).
    - `--no-browser` — nie otwieraj przeglądarki (wymaga `--token`).

  </Accordion>
  <Accordion title="Wyszukiwanie">
    ```bash
    clawhub search "query"
    ```

    Wyszukuje skille. Do odkrywania pluginów/pakietów użyj `clawhub package explore`.

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
    - `--version <version>` / `--tag <tag>` — sprawdź konkretną wersję pakietu.
    - `--versions`, `--files`, `--file <path>` — sprawdź historię i pliki pakietu.
    - `--json` — wyjście czytelne maszynowo.

  </Accordion>
  <Accordion title="Instalacja / aktualizacja / lista">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opcje:

    - `--version <version>` — zainstaluj lub zaktualizuj do konkretnej wersji (tylko pojedynczy slug w `update`).
    - `--force` — nadpisz, jeśli folder już istnieje, lub gdy pliki lokalne nie pasują do żadnej opublikowanej wersji.
    - `clawhub list` odczytuje `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikowanie skilli">
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
  <Accordion title="Publikowanie pluginów">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` może być folderem lokalnym, `owner/repo`, `owner/repo@ref` albo
    URL-em GitHub.

    Opcje:

    - `--dry-run` — zbuduj dokładny plan publikacji bez przesyłania czegokolwiek.
    - `--json` — emituj wyjście czytelne maszynowo dla CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

  </Accordion>
  <Accordion title="Żądanie ponownych skanów">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Polecenia ponownego skanu wymagają tokena właściciela z zalogowanej sesji i wskazują najnowszą
    opublikowaną wersję skilla lub wydanie pluginu. W uruchomieniach nieinteraktywnych przekaż
    `--yes`.

    Odpowiedzi JSON zawierają rodzaj celu, nazwę, wersję, status ponownego skanu oraz
    pozostałą/maksymalną liczbę żądań dla tej wersji lub wydania.

  </Accordion>
  <Accordion title="Usuwanie / przywracanie usunięcia (właściciel lub administrator)">
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
    - `--concurrency <n>` — kontrole rejestru (domyślnie: `4`).

  </Accordion>
</AccordionGroup>

## Typowe przepływy pracy

<Tabs>
  <Tab title="Wyszukaj">
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
  <Tab title="Opublikuj plugin z GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadane pakietu pluginu

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

Opublikowane pakiety powinny zawierać **zbudowany JavaScript** i wskazywać
`runtimeExtensions` na ten wynik. Instalacje z checkoutu Git nadal mogą
awaryjnie używać źródeł TypeScript, gdy nie ma zbudowanych plików, ale zbudowane
wpisy runtime pozwalają uniknąć kompilacji TypeScript w czasie działania podczas uruchamiania, diagnostyki doctor i
ścieżek ładowania pluginów.

## Wersjonowanie, plik blokady i telemetria

<AccordionGroup>
  <Accordion title="Wersjonowanie i tagi">
    - Każda publikacja tworzy nową wersję **semver** `SkillVersion`.
    - Tagi (takie jak `latest`) wskazują wersję; przenoszenie tagów pozwala wykonać rollback.
    - Dzienniki zmian są dołączane do każdej wersji i mogą być puste podczas synchronizowania lub publikowania aktualizacji.

  </Accordion>
  <Accordion title="Lokalne zmiany a wersje w rejestrze">
    Aktualizacje porównują lokalną zawartość skill z wersjami w rejestrze za pomocą
    hasha zawartości. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji,
    CLI pyta przed nadpisaniem (albo wymaga `--force` w
    uruchomieniach nieinteraktywnych).
  </Accordion>
  <Accordion title="Skanowanie synchronizacji i katalogi główne fallback">
    `clawhub sync` najpierw skanuje bieżący katalog roboczy. Jeśli nie znajdzie żadnych skills,
    przechodzi awaryjnie do znanych starszych lokalizacji (na przykład
    `~/openclaw/skills` i `~/.openclaw/skills`). Ma to umożliwić
    znajdowanie starszych instalacji skills bez dodatkowych flag.
  </Accordion>
  <Accordion title="Przechowywanie i plik blokady">
    - Zainstalowane skills są zapisywane w `.clawhub/lock.json` w Twoim katalogu roboczym.
    - Tokeny uwierzytelniające są przechowywane w pliku konfiguracyjnym ClawHub CLI (można nadpisać przez `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (liczba instalacji)">
    Gdy uruchomisz `clawhub sync` po zalogowaniu, CLI wysyła minimalną
    migawkę do obliczania liczby instalacji. Możesz całkowicie to wyłączyć:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe

| Zmienna                       | Efekt                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Zastępuje URL witryny.                          |
| `CLAWHUB_REGISTRY`            | Zastępuje URL API rejestru.                     |
| `CLAWHUB_CONFIG_PATH`         | Zastępuje miejsce, w którym CLI przechowuje token/konfigurację. |
| `CLAWHUB_WORKDIR`             | Zastępuje domyślny katalog roboczy.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię podczas `sync`.              |

## Powiązane

- [Pluginy społeczności](/pl/plugins/community)
- [Pluginy](/pl/tools/plugin)
- [Skills](/pl/tools/skills)
