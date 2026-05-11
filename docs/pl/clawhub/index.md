---
read_when:
    - Wyjaśnienie, czym jest ClawHub
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills albo Pluginów
    - Publikowanie Skills lub pluginów w rejestrze
    - Wybór między przepływami CLI openclaw a clawhub
sidebarTitle: ClawHub
summary: Publiczny przegląd ClawHub dotyczący odkrywania, instalowania, publikowania, bezpieczeństwa oraz CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub jest publicznym rejestrem Skills i Plugin OpenClaw.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować Skills oraz instalować Plugin z ClawHub.
- Używaj osobnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania, usuwania/przywracania, ponownych skanowań i przepływów synchronizacji.

Strona: [clawhub.ai](https://clawhub.ai)

## Szybki start

Wyszukuj i instaluj Skills za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Wyszukuj i instaluj Plugin za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zainstaluj CLI ClawHub, gdy potrzebujesz przepływów uwierzytelnionych w rejestrze, takich jak
publikowanie, synchronizacja, usuwanie/przywracanie lub ponowne skanowania żądane przez właściciela:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Co hostuje ClawHub

| Powierzchnia   | Co przechowuje                                                | Typowe polecenie                             |
| -------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Skills         | Wersjonowane pakiety tekstowe z `SKILL.md` i plikami pomocniczymi | `openclaw skills install <slug>`             |
| Plugin kodu    | Pakiety Plugin OpenClaw z metadanymi zgodności                | `openclaw plugins install clawhub:<package>` |
| Plugin pakietu | Spakowane pakiety Plugin do dystrybucji OpenClaw              | `clawhub package publish <source>`           |
| Souls          | Pakiety `SOUL.md` wyświetlane na onlycrabs.ai                 | Przepływy publikowania przez WWW i API       |

ClawHub śledzi wersje semver, tagi takie jak `latest`, dzienniki zmian, pliki,
pobrania, gwiazdki i podsumowania skanów bezpieczeństwa. Strony publiczne pokazują bieżący
stan rejestru, aby użytkownicy mogli sprawdzić Skill lub Plugin przed instalacją.

## Natywne przepływy OpenClaw

Natywne polecenia OpenClaw instalują w aktywnym obszarze roboczym OpenClaw i utrwalają
metadane źródła, aby późniejsze polecenia aktualizacji mogły pozostać na ClawHub.

Użyj `clawhub:<package>`, gdy instalacja Plugin powinna być rozwiązywana przez ClawHub.
Nieprefiksowane specyfikacje Plugin zgodne z npm mogą być rozwiązywane przez npm podczas przełączeń przy uruchamianiu, a
`npm:<package>` pozostaje wyłącznie npm, gdy źródło musi być jawne.

Instalacje Plugin weryfikują deklarowaną zgodność `pluginApi` i `minGatewayVersion`
przed uruchomieniem instalacji archiwum. Gdy wersja pakietu publikuje artefakt
ClawPack, OpenClaw preferuje dokładnie przesłany npm-pack `.tgz`, weryfikuje
nagłówek skrótu ClawHub i pobrane bajty oraz zapisuje metadane artefaktu do
późniejszych aktualizacji.

## CLI ClawHub

CLI ClawHub służy do pracy uwierzytelnionej w rejestrze:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI ma też polecenia instalowania/aktualizowania Skills do bezpośrednich przepływów rejestrowych:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Te polecenia instalują Skills w `./skills` w bieżącym katalogu roboczym
i zapisują zainstalowane wersje w `.clawhub/lock.json`.

## Publikowanie

Publikuj Skills z lokalnego folderu zawierającego `SKILL.md`:

```bash
clawhub skill publish <path>
```

Typowe opcje publikowania:

- `--slug <slug>`: slug Skill.
- `--name <name>`: nazwa wyświetlana.
- `--version <version>`: wersja semver.
- `--changelog <text>`: tekst dziennika zmian.
- `--tags <tags>`: tagi rozdzielone przecinkami, domyślnie `latest`.

Publikuj Plugin z lokalnego folderu, `owner/repo`, `owner/repo@ref` lub adresu URL GitHub:

```bash
clawhub package publish <source>
```

Użyj `--dry-run`, aby zbudować dokładny plan publikacji bez przesyłania, oraz `--json`,
aby uzyskać dane wyjściowe przyjazne dla CI.

Plugin kodu muszą zawierać wymagane metadane zgodności OpenClaw w
`package.json`, w tym `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`. Zobacz [CLI](/pl/clawhub/cli), aby uzyskać pełny
opis poleceń, oraz [Format Skill](/pl/clawhub/skill-format), aby poznać metadane Skill.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty: każdy może przesyłać, ale publikowanie wymaga konta GitHub
wystarczająco starego, aby przejść bramkę przesyłania. Publiczne strony szczegółów podsumowują
najnowszy stan skanowania przed instalacją lub pobraniem.

ClawHub uruchamia automatyczne kontrole opublikowanych Skills i wydań Plugin. Wydania wstrzymane przez skan
lub zablokowane mogą zniknąć z publicznego katalogu i powierzchni instalacji, pozostając
widoczne dla właściciela w `/dashboard`.

Właściciele mogą żądać ograniczonych ponownych skanowań w celu odzyskania po fałszywie dodatnim wyniku. Moderatorzy
platformy i administratorzy mogą żądać ponownych skanowań dowolnego Skill lub pakietu podczas obsługi
zgłoszeń wsparcia:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Zalogowani użytkownicy mogą zgłaszać Skills i pakiety. Moderatorzy mogą przeglądać zgłoszenia,
ukrywać lub przywracać treści, rozpatrywać odwołania i banować konta nadużywające systemu. Zobacz
[Zasady dopuszczalnego użycia](/pl/clawhub/acceptable-usage) i
[Bezpieczeństwo + moderacja](/pl/clawhub/security), aby poznać szczegóły zasad i egzekwowania.

## Telemetria i środowisko

Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalną migawkę, aby
ClawHub mógł obliczać liczbę instalacji. Wyłącz to za pomocą:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Przydatne nadpisania środowiskowe:

| Zmienna                       | Efekt                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Nadpisuje adres URL strony używany do logowania w przeglądarce. |
| `CLAWHUB_REGISTRY`            | Nadpisuje adres URL API rejestru.                 |
| `CLAWHUB_CONFIG_PATH`         | Nadpisuje miejsce, w którym CLI przechowuje stan tokenu/konfiguracji. |
| `CLAWHUB_WORKDIR`             | Nadpisuje domyślny katalog roboczy.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię przy `sync`.                   |

Zobacz [Telemetria](/pl/clawhub/telemetry), [HTTP API](/pl/clawhub/http-api) i
[Rozwiązywanie problemów](/pl/clawhub/troubleshooting), aby uzyskać głębsze materiały referencyjne.
