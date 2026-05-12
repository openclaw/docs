---
read_when:
    - Wyjaśnienie, czym jest ClawHub
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills lub Pluginów
    - Publikowanie Skills lub Pluginów w rejestrze
    - Wybór między przepływami CLI openclaw a clawhub
sidebarTitle: ClawHub
summary: Publiczny przegląd ClawHub dotyczący odkrywania, instalowania, publikowania, bezpieczeństwa oraz clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub to publiczny rejestr Skills i pluginów OpenClaw.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować Skills oraz instalować pluginy z ClawHub.
- Używaj oddzielnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania, usuwania/przywracania oraz przepływów synchronizacji.

Strona: [clawhub.ai](https://clawhub.ai)

## Szybki start

Wyszukuj i instaluj Skills za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Wyszukuj i instaluj pluginy za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zainstaluj CLI ClawHub, gdy potrzebujesz przepływów uwierzytelnionych w rejestrze, takich jak
publikowanie, synchronizacja lub usuwanie/przywracanie:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Co hostuje ClawHub

| Powierzchnia    | Co przechowuje                                                | Typowe polecenie                            |
| --------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Skills          | Wersjonowane pakiety tekstowe z `SKILL.md` i plikami pomocniczymi | `openclaw skills install <slug>`            |
| Pluginy kodu    | Pakiety pluginów OpenClaw z metadanymi zgodności              | `openclaw plugins install clawhub:<package>` |
| Pluginy pakietowe | Spakowane pakiety pluginów do dystrybucji OpenClaw          | `clawhub package publish <source>`          |
| Souls           | Pakiety `SOUL.md` pokazywane na onlycrabs.ai                  | Przepływy publikowania przez Web i API      |

ClawHub śledzi wersje semver, tagi takie jak `latest`, dzienniki zmian, pliki,
pobrania, gwiazdki oraz podsumowania skanów bezpieczeństwa. Publiczne strony pokazują bieżący stan rejestru,
aby użytkownicy mogli sprawdzić Skill lub plugin przed instalacją.

## Natywne przepływy OpenClaw

Natywne polecenia OpenClaw instalują w aktywnej przestrzeni roboczej OpenClaw i utrwalają
metadane źródła, aby późniejsze polecenia aktualizacji mogły pozostać przy ClawHub.

Użyj `clawhub:<package>`, gdy instalacja pluginu ma być rozwiązywana przez ClawHub.
Nieprefiksowane, bezpieczne dla npm specyfikacje pluginów mogą być rozwiązywane przez npm podczas przełączeń uruchomieniowych, a
`npm:<package>` pozostaje wyłącznie npm, gdy źródło musi być jawne.

Instalacje pluginów weryfikują deklarowaną zgodność `pluginApi` i `minGatewayVersion`
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

CLI ma także polecenia instalowania/aktualizowania Skills do bezpośrednich przepływów rejestrowych:

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

Publikuj pluginy z lokalnego folderu, `owner/repo`, `owner/repo@ref` lub adresu URL GitHub:

```bash
clawhub package publish <source>
```

Użyj `--dry-run`, aby zbudować dokładny plan publikacji bez przesyłania, oraz `--json`
dla wyjścia przyjaznego CI.

Pluginy kodu muszą zawierać wymagane metadane zgodności OpenClaw w
`package.json`, w tym `openclaw.compat.pluginApi` oraz
`openclaw.build.openclawVersion`. Zobacz [CLI](/pl/clawhub/cli), aby uzyskać pełną dokumentację
poleceń, oraz [Format Skill](/pl/clawhub/skill-format), aby uzyskać metadane Skill.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty: każdy może przesyłać, ale publikowanie wymaga konta GitHub
wystarczająco starego, aby przejść bramkę przesyłania. Publiczne strony szczegółów podsumowują
najnowszy stan skanu przed instalacją lub pobraniem.

ClawHub uruchamia automatyczne kontrole opublikowanych Skills i wydań pluginów. Wydania
wstrzymane przez skan lub zablokowane mogą zniknąć z publicznego katalogu i powierzchni instalacji,
pozostając widoczne dla właściciela w `/dashboard`.

Zalogowani użytkownicy mogą zgłaszać Skills i pakiety. Moderatorzy mogą przeglądać zgłoszenia,
ukrywać lub przywracać treści oraz blokować nadużywające konta. Zobacz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage) i
[Bezpieczeństwo + moderacja](/pl/clawhub/security), aby uzyskać szczegóły zasad i egzekwowania.

## Telemetria i środowisko

Gdy uruchamiasz `clawhub sync` po zalogowaniu, CLI wysyła minimalny zrzut, aby
ClawHub mógł obliczać liczbę instalacji. Wyłącz to za pomocą:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Przydatne nadpisania środowiska:

| Zmienna                       | Efekt                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Nadpisuje adres URL strony używany do logowania w przeglądarce. |
| `CLAWHUB_REGISTRY`            | Nadpisuje adres URL API rejestru.                 |
| `CLAWHUB_CONFIG_PATH`         | Nadpisuje miejsce, w którym CLI przechowuje stan tokenu/konfiguracji. |
| `CLAWHUB_WORKDIR`             | Nadpisuje domyślny katalog roboczy.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię dla `sync`.                    |

Zobacz [Telemetria](/pl/clawhub/telemetry), [HTTP API](/pl/clawhub/http-api) i
[Rozwiązywanie problemów](/pl/clawhub/troubleshooting), aby uzyskać głębsze materiały referencyjne.
