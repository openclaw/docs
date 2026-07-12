---
read_when:
    - Wyjaśnienie, czym jest ClawHub
    - Wyszukiwanie, instalowanie lub aktualizowanie Skills bądź pluginów
    - Publikowanie Skills lub pluginów w rejestrze
    - Wybór między przepływami CLI openclaw i clawhub
sidebarTitle: ClawHub
summary: Publiczny przegląd ClawHub dotyczący odkrywania, instalowania, publikowania, bezpieczeństwa i CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T14:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub to publiczny rejestr Skills i pluginów OpenClaw.

- Używaj natywnych poleceń `openclaw`, aby wyszukiwać, instalować i aktualizować Skills oraz instalować pluginy z ClawHub.
- Używaj osobnego CLI `clawhub` do uwierzytelniania w rejestrze, publikowania oraz usuwania i przywracania.

Witryna: [clawhub.ai](https://clawhub.ai)

## Szybki start

Wyszukuj i instaluj Skills za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Wyszukuj i instaluj pluginy za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Zainstaluj CLI ClawHub, jeśli chcesz korzystać z przepływów pracy uwierzytelnianych w rejestrze, takich jak publikowanie, usuwanie lub przywracanie:

```bash
npm i -g clawhub
# lub
pnpm add -g clawhub
```

## Co przechowuje ClawHub

| Obszar           | Co przechowuje                                                     | Typowe polecenie                              |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| Skills           | Wersjonowane pakiety tekstowe z `SKILL.md` i plikami pomocniczymi  | `openclaw skills install @openclaw/demo`      |
| Pluginy kodowe   | Pakiety pluginów OpenClaw z metadanymi zgodności                   | `openclaw plugins install clawhub:<package>`  |
| Pakiety pluginów | Spakowane zestawy pluginów przeznaczone do dystrybucji OpenClaw    | `clawhub package publish <source>`            |

ClawHub śledzi wersje semver, tagi takie jak `latest`, dzienniki zmian, pliki, pobrania, gwiazdki i podsumowania skanów bezpieczeństwa. Publiczne strony pokazują bieżący stan rejestru, dzięki czemu użytkownicy mogą sprawdzić Skill lub plugin przed jego instalacją.

## Natywne przepływy pracy OpenClaw

Natywne polecenia OpenClaw instalują zawartość w aktywnym obszarze roboczym OpenClaw i zapisują metadane źródła, dzięki czemu późniejsze polecenia aktualizacji mogą nadal korzystać z ClawHub.

Użyj `clawhub:<package>`, gdy instalacja pluginu ma być realizowana przez ClawHub. Specyfikacje pluginów bez prefiksu, bezpieczne dla npm, mogą podczas przełączania wdrożenia być rozwiązywane przez npm, a `npm:<package>` pozostaje ograniczone wyłącznie do npm, gdy źródło musi być wskazane jawnie.

Przed instalacją archiwum instalator pluginów sprawdza deklarowaną zgodność `pluginApi` i `minGatewayVersion`. Gdy wersja pakietu publikuje artefakt ClawPack, OpenClaw preferuje dokładnie przesłany plik `.tgz` utworzony przez npm-pack, weryfikuje nagłówek skrótu ClawHub i pobrane bajty oraz zapisuje metadane artefaktu na potrzeby późniejszych aktualizacji.

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

CLI udostępnia również polecenia instalowania i aktualizowania Skills przeznaczone do bezpośrednich przepływów pracy z rejestrem:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Te polecenia instalują Skills w katalogu `./skills` w bieżącym katalogu roboczym i zapisują zainstalowane wersje w `.clawhub/lock.json`.

## Publikowanie

Publikuj Skills z lokalnego folderu zawierającego `SKILL.md`:

```bash
clawhub skill publish <path>
```

Typowe opcje publikowania:

- `--slug <slug>`: nazwa publikowanego adresu URL Skill.
- `--name <name>`: nazwa wyświetlana.
- `--version <version>`: wersja semver.
- `--changelog <text>`: treść dziennika zmian.
- `--tags <tags>`: tagi rozdzielone przecinkami; domyślnie `latest`.

Publikuj pluginy z lokalnego folderu, `owner/repo`, `owner/repo@ref` lub adresu URL GitHub:

```bash
clawhub package publish <source>
```

Użyj `--dry-run`, aby utworzyć dokładny plan publikacji bez przesyłania danych, oraz `--json`, aby uzyskać dane wyjściowe odpowiednie dla CI.

Pluginy kodowe muszą zawierać w pliku `package.json` wymagane metadane zgodności z OpenClaw, w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`. Pełny opis poleceń znajdziesz w sekcji [CLI](/pl/clawhub/cli), a metadane Skills w sekcji [Format Skill](/clawhub/skill-format).

## Bezpieczeństwo i moderacja

ClawHub jest domyślnie otwarty: każdy może przesyłać zawartość, ale publikowanie wymaga konta GitHub istniejącego wystarczająco długo, aby przejść kontrolę przesyłania. Publiczne strony szczegółów podsumowują najnowszy stan skanowania przed instalacją lub pobraniem.

ClawHub przeprowadza automatyczne kontrole opublikowanych Skills i wydań pluginów. Wydania wstrzymane przez skanowanie lub zablokowane mogą zniknąć z publicznego katalogu i interfejsów instalacji, pozostając jednocześnie widoczne dla właściciela w `/dashboard`.

Zalogowani użytkownicy mogą zgłaszać Skills i pakiety. Moderatorzy mogą przeglądać zgłoszenia, ukrywać lub przywracać zawartość oraz blokować konta dopuszczające się nadużyć. Szczegółowe informacje o zasadach i ich egzekwowaniu znajdziesz w sekcjach
[Bezpieczeństwo](/clawhub/security),
[Audyty bezpieczeństwa](/pl/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/clawhub/moderation) oraz
[Dozwolone użytkowanie](/clawhub/acceptable-usage).

## Telemetria i środowisko

Gdy uruchamiasz `clawhub install` po zalogowaniu, CLI może podjąć próbę wysłania zdarzenia instalacji, aby ClawHub mógł obliczać zagregowaną liczbę instalacji. Wyłącz tę funkcję za pomocą:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Przydatne zmienne zastępujące ustawienia środowiska:

| Zmienna                       | Działanie                                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| `CLAWHUB_SITE`                | Zastępuje adres URL witryny używany do logowania w przeglądarce. |
| `CLAWHUB_REGISTRY`            | Zastępuje adres URL API rejestru.                                |
| `CLAWHUB_CONFIG_PATH`         | Zastępuje miejsce przechowywania tokenu i konfiguracji przez CLI.|
| `CLAWHUB_WORKDIR`             | Zastępuje domyślny katalog roboczy.                              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Wyłącza telemetrię instalacji.                                   |

Więcej szczegółowych informacji znajdziesz w sekcjach [Telemetria](/pl/clawhub/telemetry), [API HTTP](/clawhub/http-api) i [Rozwiązywanie problemów](/clawhub/troubleshooting).
