---
read_when:
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills lub Plugin
    - Publikowanie Skills lub Plugin w rejestrze
    - Konfigurowanie CLI clawhub lub jego nadpisań środowiskowych
sidebarTitle: ClawHub
summary: 'ClawHub: publiczny rejestr Skills i pluginów OpenClaw, natywne przepływy instalacji oraz CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub to publiczny rejestr dla **Skills i wtyczek OpenClaw**.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować skills oraz instalować wtyczki z ClawHub.
- Używaj oddzielnego CLI `clawhub` do przepływów uwierzytelniania w rejestrze, publikowania, usuwania/przywracania i synchronizacji.

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
    Rozpocznij nową sesję OpenClaw - wykryje ona nową skill.
  </Step>
  <Step title="Opublikuj (opcjonalnie)">
    W przypadku przepływów uwierzytelnianych w rejestrze (publikowanie, synchronizacja, zarządzanie) zainstaluj
    oddzielne CLI `clawhub`:

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
    utrwalają metadane źródła, dzięki czemu późniejsze wywołania `update` mogą pozostać przy ClawHub.

  </Tab>
  <Tab title="Wtyczki">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` odpytuje katalog wtyczek ClawHub i wypisuje gotowe do instalacji
    nazwy pakietów. Użyj `clawhub:<package>`, gdy chcesz rozwiązywania przez ClawHub.
    Specyfikacje wtyczek bez prefiksu, bezpieczne dla npm, instalują się z npm podczas przejścia startowego:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` również korzysta wyłącznie z npm i jest przydatne, gdy specyfikacja mogłaby być
    niejednoznaczna:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Instalacje wtyczek sprawdzają zgodność deklarowanych `pluginApi` i
    `minGatewayVersion`, zanim uruchomi się instalacja archiwum, więc
    niezgodne hosty wcześnie kończą się zamkniętą odmową zamiast częściowo instalować
    pakiet. Gdy wersja pakietu publikuje artefakt ClawPack,
    OpenClaw preferuje dokładnie przesłany plik npm-pack `.tgz`, weryfikuje nagłówek
    skrótu ClawHub i pobrane bajty oraz zapisuje rodzaj artefaktu, integralność npm,
    shasum npm, nazwę tarballa i metadane skrótu ClawPack do późniejszych
    aktualizacji. Starsze wersje pakietów bez metadanych ClawPack nadal używają
    starszej ścieżki weryfikacji archiwum pakietu.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akceptuje tylko instalowalne rodziny
wtyczek. Jeśli pakiet ClawHub jest w rzeczywistości skill, OpenClaw zatrzymuje się i
zamiast tego wskazuje `openclaw skills install <slug>`.

Anonimowe instalacje wtyczek ClawHub również kończą się zamkniętą odmową w przypadku pakietów prywatnych.
Kanały społecznościowe lub inne nieoficjalne kanały nadal mogą się instalować, ale OpenClaw
ostrzega, aby operatorzy mogli sprawdzić źródło i weryfikację przed ich włączeniem.
</Note>

## Czym jest ClawHub

- Publiczny rejestr skills i wtyczek OpenClaw.
- Wersjonowany magazyn pakietów skills i metadanych.
- Powierzchnia odkrywania dla wyszukiwania, tagów i sygnałów użycia.

Typowa skill to wersjonowany pakiet plików, który zawiera:

- Plik `SKILL.md` z głównym opisem i użyciem.
- Opcjonalne konfiguracje, skrypty lub pliki pomocnicze używane przez skill.
- Metadane, takie jak tagi, podsumowanie i wymagania instalacyjne.

ClawHub używa metadanych do obsługi odkrywania i bezpiecznego eksponowania
możliwości skills. Rejestr śledzi sygnały użycia (gwiazdki, pobrania), aby
poprawiać ranking i widoczność. Każde opublikowanie tworzy nową wersję semver,
a rejestr zachowuje historię wersji, aby użytkownicy mogli audytować
zmiany.

## Obszar roboczy i ładowanie skills

Oddzielne CLI `clawhub` również instaluje skills w `./skills` pod
bieżącym katalogiem roboczym. Jeśli skonfigurowano obszar roboczy OpenClaw,
`clawhub` używa tego obszaru jako opcji zapasowej, chyba że nadpiszesz `--workdir`
(lub `CLAWHUB_WORKDIR`). OpenClaw ładuje skills obszaru roboczego z
`<workspace>/skills` i wykrywa je w **następnej** sesji.

Jeśli już używasz `~/.openclaw/skills` lub wbudowanych skills, skills
obszaru roboczego mają pierwszeństwo. Więcej szczegółów o tym, jak skills są ładowane,
udostępniane i bramkowane, znajdziesz w [Skills](/pl/tools/skills).

## Funkcje usługi

| Funkcja                  | Uwagi                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Publiczne przeglądanie   | Skills i ich zawartość `SKILL.md` są publicznie widoczne.           |
| Wyszukiwanie             | Oparte na embeddingach (wyszukiwanie wektorowe), nie tylko słowa kluczowe. |
| Wersjonowanie            | Semver, dzienniki zmian i tagi (w tym `latest`).                    |
| Pobrania                 | Zip dla każdej wersji.                                              |
| Gwiazdki i komentarze    | Opinie społeczności.                                                |
| Podsumowania skanów bezpieczeństwa | Strony szczegółów pokazują najnowszy stan skanu przed instalacją lub pobraniem. |
| Strony szczegółów skanera | Wyniki VirusTotal, ClawScan i analizy statycznej mają głębokie linki. |
| Panel odzyskiwania właściciela | Publikujący mogą zobaczyć własne treści zatrzymane przez skanowanie z `/dashboard`. |
| Ponowne skany na żądanie właściciela | Właściciele mogą zażądać ograniczonych ponownych skanów w celu odzyskania po fałszywym alarmie. |
| Moderacja                | Zatwierdzenia i audyty.                                             |
| API przyjazne CLI        | Odpowiednie do automatyzacji i skryptowania.                        |

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty - każdy może przesyłać skills, ale konto GitHub
musi mieć **co najmniej tydzień**, aby publikować. Spowalnia to
nadużycia bez blokowania prawidłowych kontrybutorów.

<AccordionGroup>
  <Accordion title="Skany bezpieczeństwa">
    ClawHub uruchamia automatyczne kontrole bezpieczeństwa opublikowanych skills i wydań
    wtyczek. Publiczne strony szczegółów podsumowują bieżący wynik, a wiersze skanerów
    prowadzą do dedykowanych stron szczegółów dla VirusTotal, ClawScan i analizy
    statycznej.

    Wydania zatrzymane przez skan lub zablokowane mogą być niedostępne w publicznym katalogu i
    powierzchniach instalacji, pozostając jednocześnie widoczne dla właściciela w `/dashboard`.

  </Accordion>
  <Accordion title="Zgłaszanie">
    - Każdy zalogowany użytkownik może zgłosić skill.
    - Powody zgłoszenia są wymagane i zapisywane.
    - Każdy użytkownik może mieć jednocześnie maksymalnie 20 aktywnych zgłoszeń.
    - Skills z więcej niż 3 unikatowymi zgłoszeniami są domyślnie automatycznie ukrywane.

  </Accordion>
  <Accordion title="Moderacja">
    - Moderatorzy mogą wyświetlać ukryte skills, odkrywać je, usuwać je lub blokować użytkowników.
    - Nadużywanie funkcji zgłaszania może skutkować blokadą konta.
    - Chcesz zostać moderatorem? Zapytaj na Discord OpenClaw i skontaktuj się z moderatorem lub maintainerem.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Potrzebujesz go tylko do przepływów uwierzytelnianych w rejestrze, takich jak
publikowanie/synchronizacja.

### Opcje globalne

<ParamField path="--workdir <dir>" type="string">
  Katalog roboczy. Domyślnie: bieżący katalog; używa obszaru roboczego OpenClaw jako opcji zapasowej.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Katalog skills, względny względem katalogu roboczego.
</ParamField>
<ParamField path="--site <url>" type="string">
  Bazowy URL strony (logowanie w przeglądarce).
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
  <Accordion title="Uwierzytelnianie (logowanie / wylogowanie / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opcje logowania:

    - `--token <token>` - wklej token API.
    - `--label <label>` - etykieta przechowywana dla tokenów logowania w przeglądarce (domyślnie: `CLI token`).
    - `--no-browser` - nie otwieraj przeglądarki (wymaga `--token`).

  </Accordion>
  <Accordion title="Wyszukiwanie">
    ```bash
    clawhub search "query"
    ```

    Wyszukuje skills. Do odkrywania wtyczek/pakietów użyj `clawhub package explore`.

    - `--limit <n>` - maksymalna liczba wyników.

  </Accordion>
  <Accordion title="Przeglądaj / sprawdzaj wtyczki">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` i `package inspect` to powierzchnie CLI ClawHub do odkrywania wtyczek/pakietów i sprawdzania metadanych. Natywne instalacje OpenClaw nadal używają `openclaw plugins install clawhub:<package>`.

    Opcje:

    - `--family skill|code-plugin|bundle-plugin` - filtruj rodzinę pakietu.
    - `--official` - pokaż tylko oficjalne pakiety.
    - `--executes-code` - pokaż tylko pakiety wykonujące kod.
    - `--version <version>` / `--tag <tag>` - sprawdź konkretną wersję pakietu.
    - `--versions`, `--files`, `--file <path>` - sprawdź historię pakietu i pliki.
    - `--json` - wyjście czytelne maszynowo.

  </Accordion>
  <Accordion title="Instaluj / aktualizuj / lista">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opcje:

    - `--version <version>` - zainstaluj lub zaktualizuj do konkretnej wersji (tylko pojedynczy slug przy `update`).
    - `--force` - nadpisz, jeśli folder już istnieje, albo gdy lokalne pliki nie pasują do żadnej opublikowanej wersji.
    - `clawhub list` odczytuje `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publikuj skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opcje:

    - `--slug <slug>` - slug skill.
    - `--name <name>` - nazwa wyświetlana.
    - `--version <version>` - wersja semver.
    - `--changelog <text>` - tekst dziennika zmian (może być pusty).
    - `--tags <tags>` - tagi rozdzielone przecinkami (domyślnie: `latest`).

  </Accordion>
  <Accordion title="Publikuj wtyczki">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` może być lokalnym folderem, `owner/repo`, `owner/repo@ref` lub
    URL-em GitHub.

    Opcje:

    - `--dry-run` - zbuduj dokładny plan publikacji bez przesyłania czegokolwiek.
    - `--json` - emituj wyjście czytelne maszynowo dla CI.
    - `--source-repo`, `--source-commit`, `--source-ref` - opcjonalne nadpisania, gdy automatyczne wykrywanie nie wystarcza.

  </Accordion>
  <Accordion title="Żądaj ponownych skanów">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Polecenia ponownego skanowania wymagają tokenu zalogowanego właściciela i celują w najnowszą
    opublikowaną wersję skill lub wydanie wtyczki. W uruchomieniach nieinteraktywnych przekaż
    `--yes`.

    Odpowiedzi JSON zawierają rodzaj celu, nazwę, wersję, status ponownego skanowania oraz
    pozostałe/maksymalne liczby żądań dla tej wersji lub wydania.

  </Accordion>
  <Accordion title="Usuń / przywróć (właściciel lub administrator)">
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

    - `--root <dir...>` - dodatkowe korzenie skanowania.
    - `--all` - prześlij wszystko bez monitów.
    - `--dry-run` - pokaż, co zostałoby przesłane.
    - `--bump <type>` - `patch|minor|major` dla aktualizacji (domyślnie: `patch`).
    - `--changelog <text>` - dziennik zmian dla aktualizacji nieinteraktywnych.
    - `--tags <tags>` - tagi rozdzielone przecinkami (domyślnie: `latest`).
    - `--concurrency <n>` - kontrole rejestru (domyślnie: `4`).

  </Accordion>
</AccordionGroup>

## Typowe przepływy pracy

<Tabs>
  <Tab title="Search">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Find a plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Install">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Update all">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publish a single skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sync many skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publish a plugin from GitHub">
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
`runtimeExtensions` na ten wynik. Instalacje z checkoutu Git nadal mogą korzystać
awaryjnie ze źródeł TypeScript, gdy nie istnieją zbudowane pliki, ale zbudowane wpisy środowiska uruchomieniowego
pozwalają uniknąć kompilacji TypeScript w czasie uruchamiania, doctor oraz
ścieżek ładowania pluginów.

## Wersjonowanie, lockfile i telemetria

<AccordionGroup>
  <Accordion title="Versioning and tags">
    - Każda publikacja tworzy nową wersję **semver** `SkillVersion`.
    - Tagi (takie jak `latest`) wskazują wersję; przenoszenie tagów umożliwia wycofanie zmian.
    - Dzienniki zmian są dołączane do każdej wersji i mogą być puste podczas synchronizowania lub publikowania aktualizacji.

  </Accordion>
  <Accordion title="Local changes vs registry versions">
    Aktualizacje porównują lokalną zawartość Skills z wersjami w rejestrze za pomocą
    hasha zawartości. Jeśli lokalne pliki nie pasują do żadnej opublikowanej wersji,
    CLI pyta przed nadpisaniem (albo wymaga `--force` w
    uruchomieniach nieinteraktywnych).
  </Accordion>
  <Accordion title="Sync scanning and fallback roots">
    `clawhub sync` najpierw skanuje bieżący katalog roboczy. Jeśli nie znajdzie żadnych Skills,
    wraca do znanych starszych lokalizacji (na przykład
    `~/openclaw/skills` i `~/.openclaw/skills`). Ma to na celu
    znajdowanie starszych instalacji Skills bez dodatkowych flag.
  </Accordion>
  <Accordion title="Storage and lockfile">
    - Zainstalowane Skills są zapisywane w `.clawhub/lock.json` w katalogu roboczym.
    - Tokeny uwierzytelniania są przechowywane w pliku konfiguracji CLI ClawHub (można nadpisać przez `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (install counts)">
    Gdy uruchomisz `clawhub sync` po zalogowaniu, CLI wysyła minimalną
    migawkę do obliczania liczby instalacji. Możesz całkowicie to wyłączyć:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe

| Zmienna                       | Efekt                                                    |
| ----------------------------- | -------------------------------------------------------- |
| `CLAWHUB_SITE`                | Nadpisuje URL witryny.                                  |
| `CLAWHUB_REGISTRY`            | Nadpisuje URL API rejestru.                             |
| `CLAWHUB_CONFIG_PATH`         | Nadpisuje miejsce, w którym CLI przechowuje token/konfigurację. |
| `CLAWHUB_WORKDIR`             | Nadpisuje domyślny katalog roboczy.                     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię przy `sync`.                         |

## Powiązane

- [Pluginy społeczności](/pl/plugins/community)
- [Plugins](/pl/tools/plugin)
- [Skills](/pl/tools/skills)
