---
read_when:
    - Wyjaśnienie, czym jest ClawHub
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills albo pluginów
    - Publikowanie Skills lub plugins do rejestru
    - Wybór między przepływami CLI openclaw i clawhub
sidebarTitle: ClawHub
summary: Publiczny przegląd ClawHub dotyczący odkrywania, instalowania, publikowania, bezpieczeństwa oraz CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T08:32:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub to publiczny rejestr Skills i wtyczek OpenClaw.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować skills oraz instalować wtyczki z ClawHub.
- Używaj oddzielnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania oraz przepływów usuwania/przywracania.

Strona: [clawhub.ai](https://clawhub.ai)

## Szybki start

Wyszukuj i instaluj skills za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Wyszukuj i instaluj wtyczki za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zainstaluj CLI ClawHub, gdy potrzebujesz przepływów uwierzytelnionych w rejestrze, takich jak
publikowanie albo usuwanie/przywracanie:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Co hostuje ClawHub

| Powierzchnia       | Co przechowuje                                                    | Typowe polecenie                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Wersjonowane pakiety tekstowe z `SKILL.md` oraz plikami pomocniczymi | `openclaw skills install @openclaw/demo`     |
| Wtyczki kodu   | Pakiety wtyczek OpenClaw z metadanymi zgodności                   | `openclaw plugins install clawhub:<package>` |
| Wtyczki pakietowe | Spakowane pakiety wtyczek do dystrybucji OpenClaw                 | `clawhub package publish <source>`           |

ClawHub śledzi wersje semver, tagi takie jak `latest`, dzienniki zmian, pliki,
pobrania, gwiazdki i podsumowania skanowania bezpieczeństwa. Strony publiczne pokazują bieżący stan
rejestru, aby użytkownicy mogli sprawdzić skill lub wtyczkę przed instalacją.

## Natywne przepływy OpenClaw

Natywne polecenia OpenClaw instalują do aktywnego obszaru roboczego OpenClaw i utrwalają
metadane źródła, aby późniejsze polecenia aktualizacji mogły pozostać przy ClawHub.

Użyj `clawhub:<package>`, gdy instalacja wtyczki powinna być rozwiązywana przez ClawHub.
Same specyfikacje wtyczek zgodne z npm mogą być rozwiązywane przez npm podczas przełączeń startowych, a
`npm:<package>` pozostaje wyłącznie npm, gdy źródło musi być jawne.

Instalacje wtyczek walidują deklarowaną zgodność `pluginApi` i `minGatewayVersion`
przed uruchomieniem instalacji archiwum. Gdy wersja pakietu publikuje artefakt
ClawPack, OpenClaw preferuje dokładnie przesłany npm-pack `.tgz`, weryfikuje
nagłówek skrótu ClawHub i pobrane bajty oraz zapisuje metadane artefaktu na potrzeby
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
```

CLI ma też polecenia instalowania/aktualizowania skills dla bezpośrednich przepływów rejestru:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Te polecenia instalują skills w `./skills` pod bieżącym katalogiem roboczym
i zapisują zainstalowane wersje w `.clawhub/lock.json`.

## Publikowanie

Publikuj skills z lokalnego folderu zawierającego `SKILL.md`:

```bash
clawhub skill publish <path>
```

Typowe opcje publikowania:

- `--slug <slug>`: nazwa adresu URL opublikowanego skill.
- `--name <name>`: nazwa wyświetlana.
- `--version <version>`: wersja semver.
- `--changelog <text>`: tekst dziennika zmian.
- `--tags <tags>`: tagi rozdzielone przecinkami, domyślnie `latest`.

Publikuj wtyczki z lokalnego folderu, `owner/repo`, `owner/repo@ref` lub adresu URL GitHub:

```bash
clawhub package publish <source>
```

Użyj `--dry-run`, aby zbudować dokładny plan publikacji bez przesyłania, oraz `--json`
dla danych wyjściowych przyjaznych CI.

Wtyczki kodu muszą zawierać wymagane metadane zgodności OpenClaw w
`package.json`, w tym `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`. Zobacz [CLI](/pl/clawhub/cli), aby uzyskać pełny opis
poleceń, oraz [Format skill](/clawhub/skill-format), aby poznać metadane skill.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty: każdy może przesyłać treści, ale publikowanie wymaga konta GitHub
wystarczająco starego, aby przejść bramkę przesyłania. Publiczne strony szczegółów podsumowują
najnowszy stan skanowania przed instalacją lub pobraniem.

ClawHub uruchamia automatyczne kontrole opublikowanych skills i wydań wtyczek. Wydania wstrzymane przez skanowanie
lub zablokowane mogą zniknąć z publicznego katalogu i powierzchni instalacji, pozostając
widoczne dla ich właściciela w `/dashboard`.

Zalogowani użytkownicy mogą zgłaszać skills i pakiety. Moderatorzy mogą przeglądać zgłoszenia,
ukrywać lub przywracać treści oraz blokować konta nadużywające usługi. Zobacz
[Bezpieczeństwo](/pl/clawhub/security),
[Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/clawhub/moderation) oraz
[Akceptowalne użycie](/clawhub/acceptable-usage), aby poznać szczegóły zasad i egzekwowania.

## Telemetria i środowisko

Gdy uruchamiasz `clawhub install` po zalogowaniu, CLI może wysłać w trybie best-effort
zdarzenie instalacji, aby ClawHub mógł obliczać zagregowane liczby instalacji. Wyłącz to za pomocą:

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię instalacji.                    |

Zobacz [Telemetria](/clawhub/telemetry), [HTTP API](/clawhub/http-api) i
[Rozwiązywanie problemów](/pl/clawhub/troubleshooting), aby uzyskać bardziej szczegółowe materiały referencyjne.
