---
read_when:
    - Wyjaśnienie, czym jest ClawHub
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills albo pluginów
    - Publikowanie Skills lub Pluginów w rejestrze
    - Wybór między przepływami CLI openclaw i clawhub
sidebarTitle: ClawHub
summary: Publiczny przegląd ClawHub obejmujący wyszukiwanie, instalowanie, publikowanie, bezpieczeństwo i CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T18:04:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub jest publicznym rejestrem umiejętności i pluginów OpenClaw.

- Używaj natywnych poleceń `openclaw` do wyszukiwania, instalowania i aktualizowania umiejętności oraz instalowania pluginów z ClawHub.
- Używaj osobnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania oraz usuwania i przywracania.

Witryna: [clawhub.ai](https://clawhub.ai)

## Szybki start

Wyszukiwanie i instalowanie umiejętności za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Wyszukiwanie i instalowanie pluginów za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zainstaluj CLI ClawHub, aby korzystać z przepływów pracy wymagających uwierzytelnienia w rejestrze, takich jak
publikowanie oraz usuwanie i przywracanie:

```bash
npm i -g clawhub
# lub
pnpm add -g clawhub
```

## Zawartość ClawHub

| Obszar         | Co przechowuje                                                | Typowe polecenie                              |
| -------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Umiejętności   | Wersjonowane pakiety tekstowe z `SKILL.md` oraz plikami pomocniczymi | `openclaw skills install @openclaw/demo`     |
| Pluginy kodowe | Pakiety pluginów OpenClaw z metadanymi zgodności              | `openclaw plugins install clawhub:<package>` |
| Pluginy pakietowe | Spakowane pakiety pluginów do dystrybucji OpenClaw         | `clawhub package publish <source>`           |

ClawHub śledzi wersje semver, tagi takie jak `latest`, dzienniki zmian, pliki,
pobrania, gwiazdki i podsumowania skanów bezpieczeństwa. Strony publiczne pokazują bieżący stan
rejestru, dzięki czemu przed instalacją można sprawdzić umiejętność lub plugin.

## Natywne przepływy OpenClaw

Natywne polecenia OpenClaw instalują elementy w aktywnym obszarze roboczym OpenClaw i zachowują
metadane źródła, dzięki czemu późniejsze polecenia aktualizacji mogą nadal korzystać z ClawHub.

Użyj `clawhub:<package>`, gdy instalacja pluginu ma zostać rozwiązana przez ClawHub.
Specyfikacje pluginów bez prefiksu, bezpieczne dla npm, mogą być rozwiązywane przez npm podczas zmian wdrożeniowych, a
`npm:<package>` pozostaje przeznaczone wyłącznie dla npm, gdy źródło musi być jawnie określone.

Przed instalacją archiwum instalator pluginów sprawdza deklarowaną zgodność
`pluginApi` i `minGatewayVersion`. Gdy wersja pakietu publikuje artefakt
ClawPack, OpenClaw preferuje dokładnie przesłany plik npm-pack `.tgz`, weryfikuje
nagłówek skrótu ClawHub oraz pobrane bajty i zapisuje metadane artefaktu na potrzeby
późniejszych aktualizacji.

## CLI ClawHub

CLI ClawHub służy do operacji wymagających uwierzytelnienia w rejestrze:

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

CLI udostępnia również polecenia instalowania i aktualizowania umiejętności bezpośrednio z rejestru:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Te polecenia instalują umiejętności w `./skills` w bieżącym katalogu roboczym
i zapisują zainstalowane wersje w `.clawhub/lock.json`.

## Publikowanie

Publikuj umiejętności z lokalnego folderu zawierającego `SKILL.md`:

```bash
clawhub skill publish <path>
```

Typowe opcje publikowania:

- `--slug <slug>`: nazwa w adresie URL opublikowanej umiejętności.
- `--name <name>`: nazwa wyświetlana.
- `--version <version>`: wersja semver.
- `--changelog <text>`: tekst dziennika zmian.
- `--tags <tags>`: tagi rozdzielone przecinkami; domyślnie `latest`.

Publikuj pluginy z lokalnego folderu, `owner/repo`, `owner/repo@ref` lub adresu URL
GitHub:

```bash
clawhub package publish <source>
```

Użyj `--dry-run`, aby utworzyć dokładny plan publikacji bez przesyłania, oraz `--json`
w celu uzyskania danych wyjściowych przyjaznych dla CI.

Pluginy kodowe muszą zawierać wymagane metadane zgodności z OpenClaw w
`package.json`, w tym `openclaw.compat.pluginApi` i
`openclaw.build.openclawVersion`. Pełny opis poleceń znajduje się w sekcji [CLI](/pl/clawhub/cli),
a metadane umiejętności — w sekcji [Format umiejętności](/clawhub/skill-format).

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty: każdy może przesyłać zawartość, ale publikowanie wymaga konta
GitHub o wieku wystarczającym do przejścia kontroli przesyłania. Publiczne strony szczegółów podsumowują
najnowszy stan skanowania przed instalacją lub pobraniem.

ClawHub przeprowadza automatyczne kontrole opublikowanych umiejętności i wydań pluginów. Wydania
wstrzymane przez skanowanie lub zablokowane mogą zniknąć z publicznego katalogu i interfejsów instalacji,
pozostając widoczne dla właściciela w `/dashboard`.

Zalogowani użytkownicy mogą zgłaszać umiejętności i pakiety. Moderatorzy mogą przeglądać zgłoszenia,
ukrywać lub przywracać zawartość oraz blokować konta dopuszczające się nadużyć. Szczegółowe informacje
o zasadach i ich egzekwowaniu znajdują się w sekcjach
[Bezpieczeństwo](/pl/clawhub/security),
[Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/clawhub/moderation) oraz
[Dozwolone użycie](/clawhub/acceptable-usage).

## Telemetria i środowisko

Po uruchomieniu `clawhub install` w stanie zalogowanym CLI może podjąć próbę wysłania
zdarzenia instalacji, aby ClawHub mógł obliczać zagregowaną liczbę instalacji. Można to wyłączyć za pomocą:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Przydatne zmienne zastępujące ustawienia środowiska:

| Zmienna                       | Działanie                                          |
| ----------------------------- | -------------------------------------------------- |
| `CLAWHUB_SITE`                | Zastępuje adres URL witryny używany do logowania w przeglądarce. |
| `CLAWHUB_REGISTRY`            | Zastępuje adres URL API rejestru.                  |
| `CLAWHUB_CONFIG_PATH`         | Zastępuje lokalizację, w której CLI przechowuje token i stan konfiguracji. |
| `CLAWHUB_WORKDIR`             | Zastępuje domyślny katalog roboczy.                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię instalacji.                     |

Więcej szczegółowych informacji znajduje się w sekcjach [Telemetria](/clawhub/telemetry), [HTTP API](/clawhub/http-api) i
[Rozwiązywanie problemów](/pl/clawhub/troubleshooting).
