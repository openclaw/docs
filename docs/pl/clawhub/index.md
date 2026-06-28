---
read_when:
    - Wyjaśnienie, czym jest ClawHub
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills albo Pluginów
    - Publikowanie Skills lub plugins w rejestrze
    - Wybór między przepływami CLI openclaw i clawhub
sidebarTitle: ClawHub
summary: Publiczny przegląd ClawHub dotyczący odkrywania, instalacji, publikowania, bezpieczeństwa i CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T10:02:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub to publiczny rejestr Skills i Pluginów dla OpenClaw.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować Skills oraz instalować Pluginy z ClawHub.
- Używaj osobnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania oraz przepływów usuwania i cofania usunięcia.

Witryna: [clawhub.ai](https://clawhub.ai)

## Szybki start

Wyszukuj i instaluj Skills za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Wyszukuj i instaluj Pluginy za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zainstaluj CLI ClawHub, gdy potrzebujesz przepływów uwierzytelnionych w rejestrze,
takich jak publikowanie albo usuwanie/cofanie usunięcia:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Co hostuje ClawHub

| Powierzchnia   | Co przechowuje                                                       | Typowe polecenie                              |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| Skills         | Wersjonowane pakiety tekstowe z `SKILL.md` oraz plikami pomocniczymi | `openclaw skills install @openclaw/demo`     |
| Pluginy kodu   | Pakiety Pluginów OpenClaw z metadanymi zgodności                     | `openclaw plugins install clawhub:<package>` |
| Pluginy pakietu | Spakowane pakiety Pluginów do dystrybucji OpenClaw                   | `clawhub package publish <source>`           |

ClawHub śledzi wersje semver, tagi takie jak `latest`, dzienniki zmian, pliki,
pobrania, gwiazdki oraz podsumowania skanów bezpieczeństwa. Strony publiczne
pokazują bieżący stan rejestru, aby użytkownicy mogli sprawdzić Skills lub Plugin
przed instalacją.

## Natywne przepływy OpenClaw

Natywne polecenia OpenClaw instalują w aktywnym obszarze roboczym OpenClaw i zapisują
metadane źródła, aby późniejsze polecenia aktualizacji mogły pozostać przy ClawHub.

Użyj `clawhub:<package>`, gdy instalacja Pluginu ma być rozwiązywana przez ClawHub.
Same specyfikacje Pluginów bezpieczne dla npm mogą być rozwiązywane przez npm
podczas przejściowych zmian uruchomieniowych, a `npm:<package>` pozostaje wyłącznie
npm, gdy źródło musi być jawne.

Instalacje Pluginów weryfikują deklarowaną zgodność `pluginApi` i `minGatewayVersion`
przed uruchomieniem instalacji archiwum. Gdy wersja pakietu publikuje artefakt
ClawPack, OpenClaw preferuje dokładnie przesłany plik npm-pack `.tgz`, weryfikuje
nagłówek skrótu ClawHub i pobrane bajty oraz zapisuje metadane artefaktu na potrzeby
późniejszych aktualizacji.

## CLI ClawHub

CLI ClawHub służy do pracy wymagającej uwierzytelnienia w rejestrze:

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

CLI ma też polecenia instalacji i aktualizacji Skills dla bezpośrednich przepływów rejestrowych:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>`: nazwa URL opublikowanego Skills.
- `--name <name>`: nazwa wyświetlana.
- `--version <version>`: wersja semver.
- `--changelog <text>`: tekst dziennika zmian.
- `--tags <tags>`: tagi rozdzielone przecinkami, domyślnie `latest`.

Publikuj Pluginy z lokalnego folderu, `owner/repo`, `owner/repo@ref` albo adresu URL
GitHub:

```bash
clawhub package publish <source>
```

Użyj `--dry-run`, aby zbudować dokładny plan publikacji bez przesyłania, oraz `--json`
dla danych wyjściowych przyjaznych dla CI.

Pluginy kodu muszą zawierać wymagane metadane zgodności OpenClaw w
`package.json`, w tym `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`. Zobacz [CLI](/pl/clawhub/cli), aby uzyskać pełną
referencję poleceń, oraz [Format Skills](/pl/clawhub/skill-format), aby poznać metadane Skills.

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty: każdy może przesyłać, ale publikowanie wymaga konta
GitHub wystarczająco starego, aby przejść bramkę przesyłania. Publiczne strony szczegółów
podsumowują najnowszy stan skanowania przed instalacją lub pobraniem.

ClawHub uruchamia automatyczne kontrole opublikowanych Skills i wydań Pluginów. Wydania
wstrzymane przez skanowanie albo zablokowane mogą zniknąć z publicznego katalogu
i powierzchni instalacji, pozostając widoczne dla właściciela w `/dashboard`.

Zalogowani użytkownicy mogą zgłaszać Skills i pakiety. Moderatorzy mogą przeglądać zgłoszenia,
ukrywać lub przywracać treści oraz blokować nadużywające konta. Zobacz
[Bezpieczeństwo](/pl/clawhub/security),
[Audyty bezpieczeństwa](/pl/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage), aby poznać szczegóły zasad i egzekwowania.

## Telemetria i środowisko

Gdy uruchamiasz `clawhub install` po zalogowaniu, CLI może wysłać zdarzenie instalacji
na zasadzie najlepszej próby, aby ClawHub mógł obliczać zbiorcze liczby instalacji.
Wyłącz to za pomocą:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Przydatne nadpisania środowiska:

| Zmienna                       | Efekt                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Nadpisuje URL witryny używany do logowania w przeglądarce. |
| `CLAWHUB_REGISTRY`            | Nadpisuje URL API rejestru.                       |
| `CLAWHUB_CONFIG_PATH`         | Nadpisuje miejsce, w którym CLI przechowuje stan tokenu/konfiguracji. |
| `CLAWHUB_WORKDIR`             | Nadpisuje domyślny katalog roboczy.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię instalacji.                    |

Zobacz [Telemetria](/pl/clawhub/telemetry), [HTTP API](/pl/clawhub/http-api) i
[Rozwiązywanie problemów](/pl/clawhub/troubleshooting), aby uzyskać głębsze materiały referencyjne.
