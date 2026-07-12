---
read_when:
    - Tworzenie lub przeprowadzanie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji stanu przed i po zmianach w pull requeście
    - Dodawanie scenariuszy transportu na żywo dla Discorda, Slacka, WhatsAppa lub innych platform
    - Uruchamianie ukierunkowanej weryfikacji w przeglądarce interfejsu Control UI dla kandydującego odwołania
    - Debugowanie przebiegów kontroli jakości wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu przez VNC
summary: Mantis rejestruje wizualne dowody kompleksowych testów na potrzeby porównań aktywnych transportów oraz ukierunkowanych testów przeglądarkowych dotyczących wyłącznie kandydata, a następnie dołącza artefakty do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-07-12T14:58:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publikuje wizualne dowody z CI oraz komentarz w PR dotyczący zachowania OpenClaw.
Scenariusze transportu na żywo porównują znany błędny stan bazowy z kandydującą
referencją; ukierunkowane ścieżki przeglądarkowe mogą zamiast tego weryfikować jednego kandydata
względem deterministycznego, pozorowanego transportu. Discord został wdrożony jako pierwszy
z rzeczywistym uwierzytelnianiem bota, kanałami serwera, reakcjami, wątkami i obserwatorem
w przeglądarce. Istnieją również ścieżki Slack, Telegram oraz ukierunkowane ścieżki czatu
Control UI; WhatsApp i Matrix nie są zaimplementowane.

## Odpowiedzialność

- OpenClaw (`extensions/qa-lab/src/mantis/*`): środowisko uruchomieniowe scenariuszy, CLI `pnpm openclaw qa mantis <command>`, schemat dowodów.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): mechanizm transportu na żywo, boty sterujące/SUT, generatory raportów i dowodów.
- Crabbox (`openclaw/crabbox`): przygotowane maszyny z systemem Linux, dzierżawy, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): zdalne punkty wejścia, przechowywanie artefaktów.
- ClawSweeper: analizuje polecenia opiekunów w PR, uruchamia przepływy pracy i publikuje końcowy komentarz w PR.

## Polecenia CLI

Wszystkie polecenia mają postać `pnpm openclaw qa mantis <command>` i są zdefiniowane w
`extensions/qa-lab/src/mantis/cli.ts`. Wymagają `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
podczas kompilacji/uruchamiania (dołączone przepływy pracy ustawiają
`OPENCLAW_BUILD_PRIVATE_QA=1` oraz `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` przed kompilacją).

| Polecenie                       | Przeznaczenie                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Sprawdza, czy bot Mantis dla Discorda widzi serwer/kanał, może opublikować wiadomość i dodać reakcję.                                                            |
| `run`                           | Uruchamia scenariusz przed/po względem referencji bazowej i kandydującej (tylko Discord).                                                                         |
| `desktop-browser-smoke`         | Dzierżawi/ponownie wykorzystuje pulpit Crabbox, otwiera widoczną przeglądarkę oraz rejestruje zrzut ekranu i nagranie.                                            |
| `slack-desktop-smoke`           | Dzierżawi/ponownie wykorzystuje pulpit Crabbox, uruchamia w nim QA Slack, otwiera Slack Web i rejestruje dowody.                                                  |
| `telegram-desktop-builder`      | Dzierżawi/ponownie wykorzystuje pulpit Crabbox, instaluje Telegram Desktop i opcjonalnie konfiguruje Gateway OpenClaw.                                            |
| `visual-task` / `visual-driver` | Ogólne przechwytywanie pulpitu Crabbox z opcjonalnymi asercjami rozpoznawania obrazu; `visual-driver` to część sterująca uruchamiana przez `crabbox record --while`. |

Każde polecenie przyjmuje `--repo-root <path>` i `--output-dir <path>`; polecenia
Crabbox przyjmują również `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` oraz `--keep-lease`. Domyślne lokalne wartości CLI
dla dostawcy/klasy to `hetzner`/`beast`, o ile nie zaznaczono inaczej; przepływy pracy CI
zwykle zastępują obie wartości.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Wywołuje interfejs REST API Discorda (`https://discord.com/api/v10`), aby pobrać użytkownika
bota, serwer, kanały serwera oraz kanał docelowy, sprawdza, czy kanał należy do serwera,
a następnie (o ile nie podano `--skip-post`) publikuje wiadomość i dodaje reakcję `👀`.
Zapisuje pliki `mantis-discord-smoke-summary.json` oraz
`mantis-discord-smoke-report.md`.

Kolejność rozwiązywania tokenu: wartość `--token-file`, następnie `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(można zastąpić przez `--token-env`), a następnie plik wskazany przez
`OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` (można zastąpić przez `--token-file-env`).
Identyfikatory serwera/kanału pochodzą z `OPENCLAW_QA_DISCORD_GUILD_ID` /
`OPENCLAW_QA_DISCORD_CHANNEL_ID` (można zastąpić przez `--guild-id` / `--channel-id`)
i muszą być 17–20-cyfrowymi identyfikatorami snowflake Discorda. Ustaw
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, aby zastąpić identyfikatory i nazwy
bota/serwera/kanału/wiadomości wartością `<redacted>` w opublikowanym podsumowaniu
i raporcie.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` obecnie przyjmuje wyłącznie `discord`. `--scenario` jest jednym z dwóch
wbudowanych identyfikatorów, z których każdy ma własną domyślną referencję bazową oraz
oczekiwane etykiety przed/po (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Scenariusz                                 | Domyślny stan bazowy                       | Oczekiwanie dla stanu bazowego                 | Oczekiwanie dla kandydata |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------------- | ------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                                  | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | odpowiedź w wątku pomija załącznik `filePath` | odpowiedź w wątku go zawiera |

Domyślną wartością `--candidate` jest `HEAD`. Pozostałe flagi: `--credential-source`
(domyślnie `convex`), `--credential-role` (domyślnie `ci`), `--provider-mode`
(domyślnie `live-frontier`), `--fast` (domyślnie włączone), `--skip-install`, `--skip-build`.

Program uruchamiający tworzy odłączone katalogi robocze `git worktree` dla stanu bazowego
i kandydata w `<output-dir>/worktrees/`, uruchamia w każdym z nich
`pnpm install`/`pnpm build` (o ile nie pominięto), a następnie uruchamia
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
względem każdego katalogu roboczego. Każda ścieżka zapisuje
`discord-qa-reaction-timelines.json` oraz parę
`<scenario-id>-timeline.html`/`.png`; program uruchamiający kopiuje te dowody
z powrotem do `baseline/`/`candidate/`, zapisuje `comparison.json`,
`mantis-report.md` oraz `mantis-evidence.json` w katalogu wyjściowym
i kończy działanie z kodem różnym od zera, jeśli porównanie nie zakończyło się powodzeniem
(stan bazowy `fail`, a kandydat `pass`).

Drugi scenariusz Discorda (`discord-thread-reply-filepath-attachment`) publikuje
wiadomość nadrzędną przy użyciu bota sterującego, tworzy rzeczywisty wątek, wywołuje akcję
`message.thread-reply` systemu SUT z lokalną dla repozytorium ścieżką `filePath`,
a następnie cyklicznie sprawdza wątek w poszukiwaniu odpowiedzi i nazwy pliku załącznika.
Oczekuje załącznika o nazwie `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi lub ponownie wykorzystuje pulpit Crabbox, uruchamia przeglądarkę w sesji VNC
skierowaną na `--browser-url` (domyślnie `https://openclaw.ai`) albo wyrenderowany
`--html-file`, czeka, wykonuje zrzut ekranu za pomocą `scrot`, opcjonalnie nagrywa plik MP4
za pomocą `ffmpeg`, a następnie synchronizuje przez rsync pliki
`desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
z powrotem do `--output-dir`.

Flagi:

- `--lease-id <cbx_...>` ponownie wykorzystuje przygotowany pulpit zamiast tworzyć nowy.
- `--browser-profile-dir <remote-path>` ponownie wykorzystuje zdalny katalog danych użytkownika Chrome, dzięki czemu trwały pulpit pozostaje zalogowany między uruchomieniami (używane dla długotrwałego profilu obserwatora Discord Web).
- `--browser-profile-archive-env <name>` przed uruchomieniem odtwarza archiwum profilu Chrome `.tgz` zakodowane w base64 ze wskazanej zmiennej środowiskowej (domyślnie `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); używane dla zalogowanych obserwatorów, takich jak Discord Web.
- `--video-duration <seconds>` określa długość przechwytywania MP4 (domyślnie 10 s).
- `--keep-lease` (lub `OPENCLAW_MANTIS_KEEP_VM=1`) pozostawia otwartą dzierżawę utworzoną podczas tego uruchomienia, aby umożliwić inspekcję przez VNC; nieudane uruchomienia, które utworzyły dzierżawę, również domyślnie ją zachowują.

Do rejestrowania dowodów z Discord Web Mantis używa dedykowanego konta obserwatora,
a nie tokenu bota. Wyrocznia REST Discorda (przez `qa discord`) pozostaje źródłem
rozstrzygającym; gdy ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenariusz
zapisuje również artefakt z adresem URL Discord Web, a
`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` pozostawia wątek otwarty wystarczająco długo,
aby przeglądarka mogła go otworzyć.

Przepływ pracy GitHub preferuje trwały profil obserwatora określony przez
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (pełne archiwa profili mogą przekraczać
limit rozmiaru sekretów GitHub); w przypadku małych/początkowych profili może zamiast tego
odtworzyć archiwum `.tgz` zakodowane w base64 z
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jeśli nie skonfigurowano żadnego
z tych źródeł, przepływ pracy nadal publikuje deterministyczne zrzuty ekranu stanu
bazowego i kandydata oraz odnotowuje w dzienniku, że pominięto zalogowanego obserwatora.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi lub ponownie wykorzystuje pulpit Crabbox, synchronizuje kopię roboczą z maszyną
wirtualną, uruchamia w niej `pnpm openclaw qa slack`, otwiera Slack Web w przeglądarce VNC,
przechwytuje pulpit oraz kopiuje lokalnie zarówno artefakty QA Slack (`slack-qa/`),
jak i zrzut ekranu/nagranie VNC. Jest to jedyny wariant Mantis, w którym Gateway SUT
i przeglądarka działają wewnątrz tej samej maszyny wirtualnej.

Z opcją `--gateway-setup` polecenie tworzy trwały, jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw` na maszynie wirtualnej, modyfikuje konfigurację
Slack Socket Mode dla kanału docelowego, uruchamia
`openclaw gateway run --dev --allow-unconfigured --port 38973` i pozostawia Chrome
uruchomiony w sesji VNC; pominięcie `--gateway-setup` uruchamia zamiast tego standardową
ścieżkę QA Slack między botami.

Wymagane zmienne środowiskowe dla `--credential-source env` (lokalna wartość domyślna
to `env`; domyślna rola to `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu (jeśli lokalnie ustawiono wyłącznie
  `OPENAI_API_KEY`, Mantis kopiuje ją do `OPENCLAW_LIVE_OPENAI_KEY` przed
  wywołaniem Crabbox)

Z opcją `--credential-source convex` Mantis dzierżawi dane uwierzytelniające SUT Slack
ze współdzielonej puli przed utworzeniem maszyny wirtualnej i przekazuje identyfikator
kanału, token aplikacji oraz token bota do maszyny wirtualnej jako zmienne środowiskowe
`OPENCLAW_MANTIS_SLACK_*`, dzięki czemu przepływy pracy GitHub potrzebują wyłącznie
sekretu brokera Convex, a nie nieprzetworzonych tokenów Slack.

Pozostałe flagi: `--slack-url <url>` otwiera konkretny adres URL (w przeciwnym razie
Mantis wyznacza `https://app.slack.com/client/<team>/<channel>` na podstawie `auth.test`);
`--slack-channel-id <id>` ustawia kanał listy dozwolonych Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steruje trwałym profilem Chrome
wewnątrz maszyny wirtualnej (domyślnie `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` uruchamia natywne scenariusze zatwierdzania Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) i renderuje zrzuty ekranu
oczekujących/rozstrzygniętych punktów kontrolnych zamiast konfiguracji Gateway
(wzajemnie wyklucza się z `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` oraz `--fast` są przekazywane do ścieżki
Slack na żywo.

Zrzuty ekranu punktów kontrolnych zatwierdzania są renderowane na podstawie wiadomości
z API Slack zaobserwowanej przez scenariusz, a nie z interfejsu Slack na żywo;
`slack-desktop-smoke.png` jest dowodem działania samego Slack Web tylko wtedy,
gdy profil przeglądarki dzierżawy był już zalogowany.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Dzierżawi lub ponownie wykorzystuje pulpit Crabbox, instaluje natywną aplikację Telegram Desktop dla systemu Linux,
opcjonalnie przywraca archiwum sesji użytkownika, konfiguruje OpenClaw przy użyciu
tokena bota SUT Telegram z dzierżawy, uruchamia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publikuje
wiadomość o gotowości bota sterującego w prywatnej grupie z dzierżawy, a następnie wykonuje
zrzut ekranu i nagranie MP4. Token bota służy wyłącznie do konfiguracji OpenClaw; nigdy nie
loguje aplikacji Telegram Desktop. Przeglądarka pulpitu korzysta z oddzielnej sesji użytkownika Telegram,
przywróconej za pomocą `--telegram-profile-archive-env <name>` lub zalogowanej ręcznie
przez VNC i utrzymywanej przy życiu za pomocą `--keep-lease`.

Flagi: `--lease-id <cbx_...>` ponownie uruchamia scenariusz na maszynie wirtualnej, na której użytkownik jest już zalogowany do
Telegram Desktop; `--telegram-profile-archive-env <name>` przywraca zakodowane w base64
archiwum profilu `.tgz` przed uruchomieniem; `--telegram-profile-dir <remote-path>`
ustawia zdalny katalog profilu (domyślnie `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` tylko instaluje i otwiera Telegram Desktop;
domyślne wartości `--credential-source`/`--credential-role` to `convex`/`maintainer`.

## Manifest materiałów dowodowych

Każdy scenariusz publikujący wyniki w PR zapisuje plik `mantis-evidence.json` obok
swojego raportu:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Pole `path` artefaktu jest ścieżką względną wobec katalogu manifestu; `targetPath` jest
ścieżką względną wobec skonfigurowanego prefiksu artefaktów R2/S3. Skrypt `scripts/mantis/publish-pr-evidence.mjs`
odrzuca próby przechodzenia poza katalog i pomija wpisy z `"required": false`, gdy
brakuje pliku.

Rodzaje artefaktów: `timeline` (deterministyczny zrzut ekranu przed zmianą i po niej),
`desktopScreenshot` (zrzut ekranu VNC/przeglądarki), `motionPreview` (osadzony animowany
GIF z nagrania), `motionClip` (przycięte do ruchu nagranie MP4), `fullVideo` (pełne
nagranie), `metadata` (towarzyszący plik JSON/dziennika), `report` (raport Markdown).

Układ artefaktów przebiegu na dysku:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Zrzuty ekranu są materiałami dowodowymi, a nie sekretami, ale nadal wymagają starannej redakcji:
mogą zawierać nazwy prywatnych kanałów, nazwy użytkowników lub treść wiadomości. Ustaw
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznego przesyłania artefaktów; ta opcja jest
domyślnie włączona w przepływach pracy GitHub dla Discord/Slack/Telegram.

## Automatyzacja GitHub

`scripts/mantis/publish-pr-evidence.mjs` jest współdzielonym narzędziem publikującym. Przepływy pracy
wywołują go z manifestem, docelowym PR, katalogiem głównym docelowych artefaktów, znacznikiem komentarza,
adresem URL artefaktów, adresem URL przebiegu i źródłem żądania. Przesyła zadeklarowane artefakty do
zasobnika Mantis R2, tworzy komentarz PR rozpoczynający się od podsumowania, z osadzonymi
obrazami/podglądami i odnośnikami do nagrań, a następnie aktualizuje istniejący komentarz ze znacznikiem lub
tworzy nowy. Wymagane zmienne środowiskowe:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (przepływy pracy ustawiają `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (przepływy pracy ustawiają `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (przepływy pracy ustawiają `https://artifacts.openclaw.ai`)

Komentarze są publikowane przez aplikację Mantis GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), a nie przez `github-actions[bot]`; ukryty
komentarz ze znacznikiem służy jako klucz operacji aktualizacji lub wstawienia.

| Przepływ pracy                    | Wyzwalacz                                                                                  | Działanie                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | ręczne uruchomienie                                                                        | Uruchamia `discord-smoke` dla wybranego odwołania.                                                                                                                                                                                                                                                               |
| `Mantis Discord Status Reactions` | komentarz w PR lub ręczne uruchomienie                                                     | Tworzy oddzielne drzewa robocze wersji bazowej i kandydującej, uruchamia `discord-status-reactions-tool-only` dla każdej z nich, renderuje oś czasu każdej ścieżki w przeglądarce pulpitu Crabbox, generuje przycięte do ruchu podglądy GIF/MP4 za pomocą `crabbox media preview`, przesyła artefakty i publikuje osadzone materiały dowodowe w PR. |
| `Mantis Scenario`                 | ręczne uruchomienie                                                                        | Ogólny dyspozytor: przyjmuje `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` i przekazuje je do przepływu pracy odpowiedniego scenariusza. |
| `Mantis Slack Desktop Smoke`      | ręczne uruchomienie                                                                        | Dzierżawi pulpit Crabbox z systemem Linux (domyślnie `aws`, opcjonalnie `hetzner`), uruchamia `slack-desktop-smoke --gateway-setup` dla kandydata, nagrywa pulpit, generuje podgląd ruchu, przesyła artefakty i publikuje materiały dowodowe w PR, jeśli podano numer PR. |
| `Mantis Telegram Live`            | komentarz w PR lub ręczne uruchomienie                                                     | Uruchamia ścieżkę kontroli jakości Telegram na żywo korzystającą z API bota (`openclaw qa telegram`), zapisuje `mantis-evidence.json` na podstawie podsumowania kontroli jakości, renderuje zredagowany kod HTML materiałów dowodowych w przeglądarce pulpitu Crabbox, generuje animację GIF i publikuje materiały dowodowe w PR. Ta ścieżka nie wymaga logowania w Telegram Web. |
| `Mantis Telegram Desktop Proof`   | etykieta PR opiekuna (`mantis: telegram-visible-proof`) wraz z komentarzem w PR albo ręczne uruchomienie | Agentowy dowód działania natywnej aplikacji Telegram Desktop przed zmianą i po niej. Przekazuje PR, odwołania wersji bazowej i kandydującej oraz instrukcje opiekuna do Codex, który uruchamia dla obu odwołań rzeczywistą ścieżkę dowodową Telegram Desktop użytkownika w Crabbox i publikuje dwukolumnową tabelę materiałów dowodowych w PR. |
| `Mantis Web UI Chat Proof`        | komentarz w PR lub ręczne uruchomienie                                                     | Uruchamia ukierunkowany dowód czatu OpenClaw Control UI w Playwright dla kandydata, sprawdza, czy przeglądarka wysyła dane przez pozorowany Gateway, przechwytuje artefakty w postaci zrzutów ekranu i nagrań oraz publikuje materiały dowodowe w PR. Ta ścieżka stanowi wyłącznie dowód działania czatu internetowego, a nie WinUI/aplikacji natywnej ani dowolnego interfejsu wizualnego. |

Zarówno `Mantis Discord Status Reactions`, jak i `Mantis Telegram Live` akceptują
`baseline_ref`/`candidate_ref` (lub `baseline=`/`candidate=` w komentarzu PR)
i przed uruchomieniem z poświadczeniami zawierającymi sekrety sprawdzają, czy rozwiązany SHA jest przodkiem `origin/main`,
tagiem wydania (`v*`) lub stanowi wierzchołek otwartego PR.

Wyzwalacze w komentarzach z PR, których autor ma uprawnienia do zapisu/utrzymania/administrowania:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Wyzwalacze Telegram w komentarzach domyślnie używają SHA wierzchołka PR jako kandydata i
`telegram-status-command` jako scenariusza; akceptują `provider=aws|hetzner` oraz
`lease=<cbx_...>`, aby wskazać konkretnego dostawcę Crabbox lub wstępnie rozgrzany
pulpit. `Mantis Telegram Desktop Proof` reaguje na komentarz w PR wyłącznie wtedy, gdy
PR ma już etykietę `mantis: telegram-visible-proof`.

Wyzwalacze czatu Web UI w komentarzach domyślnie używają SHA wierzchołka PR jako kandydata. Uruchamiają
dowód czatu Control UI z pozorowanym Gateway i publikują artefakty przeglądarki; w przypadku
innych stron internetowych i interfejsów aplikacji natywnych użyj standardowego dowodu Playwright/przeglądarki, zrzutów ekranu
opiekuna, Crabbox lub artefaktów lokalnych.

ClawSweeper może również uruchomić scenariusz bezpośrednio:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Maszyny i sekrety

Domyślne wartości lokalnego CLI Crabbox to `--provider hetzner --class beast`; można je zastąpić
za pomocą `--provider`, `--class`/`--machine-class` albo
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Przepływy pracy GitHub
często zastępują obie wartości (na przykład `--class standard` oraz pole wyboru dostawcy
`aws`/`hetzner` w przepływie pracy Slack). Jeśli dostawca jest zbyt wolny
lub niedostępny, dodaj go za tym samym interfejsem Crabbox zamiast
kodować na stałe rozwiązanie zapasowe.

Konfiguracja bazowa maszyny wirtualnej: Linux z obsługującą pulpit przeglądarką Chrome/Chromium, dostępem CDP, VNC/
noVNC, Node 22+ i pnpm, kopią roboczą OpenClaw oraz dostępem wychodzącym do
docelowego transportu, GitHub, dostawców modeli i brokera poświadczeń.

Nazwy sekretów używane w przepływach pracy Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznego przesyłania artefaktów
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (przepływy pracy akceptują również
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` jako wartości zapasowe i mapują
  je na nazwy bez prefiksu przed wywołaniem Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Program uruchamiający Mantis nigdy nie może wypisywać tokenów botów Discord/Slack/Telegram,
kluczy API dostawców, plików cookie przeglądarki, zawartości profili uwierzytelniania, haseł VNC ani
nieprzetworzonych ładunków poświadczeń. Jeśli token wycieknie do zgłoszenia, PR, czatu lub dziennika,
należy go unieważnić po zapisaniu sekretu zastępczego.

## Wyniki uruchomienia

Scenariusze transportowe przed zmianą i po niej rozróżniają następujące wyniki, aby niestabilne
środowisko nie zostało zinterpretowane jako regresja produktu:

- **Błąd odtworzony**: wersja bazowa nie przeszła testu w sposób oczekiwany przez scenariusz.
- **Awaria infrastruktury testowej**: konfiguracja środowiska, poświadczenia, API transportu, przeglądarka
  lub dostawca zawiodły, zanim mechanizm oceny mógł dostarczyć miarodajny wynik.

Dowód przeglądarkowy tylko dla kandydata informuje, czy kandydat przeszedł asercje pozorowanego
Gateway i widocznego interfejsu użytkownika; nie stwierdza odtworzenia problemu w wersji bazowej.

## Dodawanie scenariusza

Scenariusze transportu na żywo są definiowane w TypeScript osobno dla każdego transportu (zobacz
`MANTIS_SCENARIO_CONFIGS` w `extensions/qa-lab/src/mantis/run.runtime.ts`, aby poznać
strukturę Discord przed zmianą i po niej), a nie w niezależnym deklaratywnym formacie pliku.
Każdy scenariusz wymaga: identyfikatora i tytułu, transportu, wymaganych poświadczeń, zasad
odwołania wersji bazowej, zasad odwołania wersji kandydującej, poprawki konfiguracji OpenClaw, kroków konfiguracji/bodźca,
oczekiwanego mechanizmu oceny wersji bazowej i kandydującej, celów przechwytywania wizualnego, limitu czasu
oraz kroków czyszczenia.

Skoncentrowany dowód przeglądarkowy obejmujący wyłącznie kandydata może wykorzystywać dedykowany, deterministyczny test E2E
i przepływ pracy. Należy wyraźnie określić jego zakres, zweryfikować referencję kandydata przed
wykonaniem, odizolować publikowanie oparte na sekretach i wygenerować ten sam kontrakt
manifestu dowodów.

Preferuj małe, typowane kryteria weryfikacji zamiast kontroli wizyjnych: stan reakcji w Discordzie lub
odwołania do wiadomości, `ts` wątku w Slacku/stan reakcji w API, identyfikatory
i nagłówki wiadomości e-mail. Używaj zrzutów ekranu z przeglądarki, gdy interfejs użytkownika jest jedynym wiarygodnym źródłem obserwacji,
a kontrole wizyjne traktuj jako uzupełnienie kryterium weryfikacji opartego na API platformy, jeśli takie istnieje.

Po Discordzie, Slacku i Telegramie ten sam schemat modułu uruchamiającego można rozszerzyć na WhatsApp
(logowanie za pomocą kodu QR, ponowna identyfikacja, dostarczanie, multimedia, reakcje) oraz Matrix
(szyfrowane pokoje, relacje wątków/odpowiedzi, wznawianie po ponownym uruchomieniu); żadne z nich nie jest
jeszcze zaimplementowane.

## Otwarte pytania

- Który bot Discorda powinien pełnić rolę sterownika, a który testowanego systemu, gdy istniejący bot Mantis
  jest używany ponownie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dotyczące PR-ów?
- Kiedy ClawSweeper powinien automatycznie zalecać scenariusz Mantis zamiast
  czekać na polecenie opiekuna?
- Czy przed przesłaniem zrzutów ekranu do publicznych PR-ów należy zamazywać lub przycinać ich zawartość?
