---
read_when:
    - Tworzenie lub przeprowadzanie wizualnej kontroli jakości na żywo pod kątem błędów OpenClaw
    - Dodawanie weryfikacji przed i po zmianach w pull requeście
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych platform
    - Uruchamianie ukierunkowanej weryfikacji Control UI w przeglądarce dla kandydującej referencji
    - Debugowanie przebiegów kontroli jakości wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu przez VNC
summary: Mantis rejestruje wizualne dowody kompleksowego działania na potrzeby porównań transportu na żywo i ukierunkowanych testów przeglądarkowych dotyczących wyłącznie kandydata, a następnie dołącza artefakty do PR-ów.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T18:13:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publikuje wizualne dowody CI oraz komentarz do PR dotyczący działania OpenClaw.
Scenariusze transportu na żywo porównują znany wadliwy punkt odniesienia z refem kandydującym;
ukierunkowane ścieżki przeglądarkowe mogą zamiast tego weryfikować jednego kandydata względem deterministycznego,
symulowanego transportu. Discord został wdrożony jako pierwszy z rzeczywistym uwierzytelnianiem bota, kanałami serwera,
reakcjami, wątkami i obserwatorem przeglądarkowym. Istnieją również ścieżki dla Slack, Telegram oraz ukierunkowane ścieżki
czatu interfejsu Control UI; WhatsApp i Matrix nie są zaimplementowane.

## Odpowiedzialność

- OpenClaw (`extensions/qa-lab/src/mantis/*`): środowisko uruchomieniowe scenariuszy, `pnpm openclaw qa mantis <command>` CLI, schemat dowodów.
- Laboratorium QA (`extensions/qa-lab/src/live-transports/*`): infrastruktura testowa transportu na żywo, boty sterownika/SUT, generatory raportów/dowodów.
- Crabbox (`openclaw/crabbox`): przygotowane maszyny z systemem Linux, dzierżawy, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): zdalne punkty wejścia, przechowywanie artefaktów.
- ClawSweeper: analizuje polecenia opiekuna w PR, uruchamia przepływy pracy, publikuje końcowy komentarz do PR.

## Polecenia CLI

Wszystkie polecenia są `pnpm openclaw qa mantis <command>`, zdefiniowane w
`extensions/qa-lab/src/mantis/cli.ts`. Wymagają `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
podczas kompilacji/uruchamiania (dołączone przepływy pracy ustawiają `OPENCLAW_BUILD_PRIVATE_QA=1` i
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` przed kompilacją).

| Polecenie                       | Przeznaczenie                                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Sprawdza, czy bot Mantis na Discordzie widzi serwer/kanał oraz może publikować wiadomości i reakcje.                                                      |
| `run`                           | Uruchamia scenariusz „przed/po” względem refów punktu odniesienia i kandydata (tylko Discord).                                                            |
| `desktop-browser-smoke`         | Dzierżawi/ponownie wykorzystuje pulpit Crabbox, otwiera widoczną przeglądarkę, rejestruje zrzut ekranu i film.                                             |
| `slack-desktop-smoke`           | Dzierżawi/ponownie wykorzystuje pulpit Crabbox, uruchamia w nim QA Slack, otwiera Slack Web i rejestruje dowody.                                         |
| `telegram-desktop-builder`      | Dzierżawi/ponownie wykorzystuje pulpit Crabbox, instaluje Telegram Desktop i opcjonalnie konfiguruje Gateway OpenClaw.                                    |
| `visual-task` / `visual-driver` | Ogólne przechwytywanie pulpitu Crabbox z opcjonalnymi asercjami rozumienia obrazu; `visual-driver` to część sterownika uruchamiana w ramach `crabbox record --while`. |

Każde polecenie przyjmuje `--repo-root <path>` i `--output-dir <path>`; polecenia
Crabbox przyjmują również `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` i `--keep-lease`. Lokalne wartości domyślne CLI
dla dostawcy/klasy to `hetzner`/`beast`, o ile nie zaznaczono inaczej; przepływy pracy CI
zwykle zastępują obie wartości.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Wywołuje interfejs REST API Discorda (`https://discord.com/api/v10`), aby pobrać użytkownika
bota, serwer, kanały serwera i kanał docelowy, sprawdza, czy
kanał należy do serwera, a następnie (o ile nie ustawiono `--skip-post`) publikuje wiadomość i
dodaje reakcję `👀`. Zapisuje `mantis-discord-smoke-summary.json` i
`mantis-discord-smoke-report.md`.

Kolejność rozpoznawania tokenu: wartość `--token-file`, następnie `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(zastępowana przez `--token-env`), a potem plik wskazany przez `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(zastępowany przez `--token-file-env`). Identyfikatory serwera/kanału pochodzą z
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (zastępowanych przez
`--guild-id` / `--channel-id`) i muszą być 17–20-cyfrowymi identyfikatorami snowflake Discorda. Ustaw
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, aby zastąpić identyfikatory i nazwy bota, serwera, kanału oraz wiadomości
wartością `<redacted>` w opublikowanym podsumowaniu i raporcie.

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
wbudowanych identyfikatorów, z których każdy ma własny domyślny ref punktu odniesienia i oczekiwane etykiety
„przed/po” (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Scenariusz                                 | Domyślny punkt odniesienia                  | Oczekiwania dla punktu odniesienia       | Oczekiwania dla kandydata   |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | odpowiedź w wątku pomija załącznik `filePath` | odpowiedź w wątku go zawiera |

Domyślna wartość `--candidate` to `HEAD`. Pozostałe flagi: `--credential-source`
(domyślnie `convex`), `--credential-role` (domyślnie `ci`), `--provider-mode`
(domyślnie `live-frontier`), `--fast` (domyślnie włączona), `--skip-install`, `--skip-build`.

Program uruchamiający tworzy odłączone kopie robocze `git worktree` dla punktu odniesienia i
kandydata w katalogu `<output-dir>/worktrees/`, uruchamia `pnpm install`/`pnpm build` w
każdej z nich (o ile nie pominięto), a następnie uruchamia
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
względem każdej kopii roboczej. Każda ścieżka zapisuje `discord-qa-reaction-timelines.json`
oraz parę `<scenario-id>-timeline.html`/`.png`; program uruchamiający kopiuje te
dowody z powrotem do `baseline/`/`candidate/`, zapisuje `comparison.json`,
`mantis-report.md` i `mantis-evidence.json` w katalogu wyjściowym oraz
kończy działanie z kodem różnym od zera, jeśli porównanie nie zakończyło się powodzeniem (punkt odniesienia `fail` i kandydat
`pass`).

Drugi scenariusz Discorda (`discord-thread-reply-filepath-attachment`) publikuje
wiadomość nadrzędną za pomocą bota sterownika, tworzy rzeczywisty wątek, wywołuje akcję SUT
`message.thread-reply` z lokalnym dla repozytorium plikiem `filePath`, a następnie odpytuje
wątek w poszukiwaniu odpowiedzi i nazwy pliku załącznika. Oczekuje załącznika
o nazwie `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi lub ponownie wykorzystuje pulpit Crabbox, uruchamia przeglądarkę w sesji VNC
skierowaną na `--browser-url` (domyślnie `https://openclaw.ai`) albo wyrenderowany
`--html-file`, czeka, wykonuje zrzut ekranu za pomocą `scrot`, opcjonalnie nagrywa plik MP4 za pomocą
`ffmpeg`, a następnie synchronizuje przez rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
z powrotem do `--output-dir`.

Flagi:

- `--lease-id <cbx_...>` ponownie wykorzystuje przygotowany pulpit zamiast tworzyć nowy.
- `--browser-profile-dir <remote-path>` ponownie wykorzystuje zdalny katalog danych użytkownika Chrome, dzięki czemu trwały pulpit zachowuje zalogowanie między uruchomieniami (używane dla długotrwałego profilu obserwatora Discord Web).
- `--browser-profile-archive-env <name>` przed uruchomieniem odtwarza z tej zmiennej środowiskowej zakodowane w base64 archiwum profilu Chrome `.tgz` (domyślnie `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); używane dla zalogowanych obserwatorów, takich jak Discord Web.
- `--video-duration <seconds>` określa długość przechwytywania MP4 (domyślnie 10 s).
- `--keep-lease` (lub `OPENCLAW_MANTIS_KEEP_VM=1`) pozostawia dzierżawę utworzoną w tym uruchomieniu otwartą do inspekcji przez VNC; nieudane uruchomienia, które utworzyły dzierżawę, również domyślnie ją zachowują.

Do rejestrowania dowodów z Discord Web Mantis używa dedykowanego konta obserwatora, a nie tokenu
bota. Źródło prawdy REST Discorda (za pośrednictwem `qa discord`) pozostaje nadrzędne; gdy
ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenariusz zapisuje również
artefakt adresu URL Discord Web, a `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` pozostawia
wątek otwarty wystarczająco długo, aby przeglądarka mogła go otworzyć.

Przepływ pracy GitHub preferuje trwały profil obserwatora za pośrednictwem
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (pełne archiwa profili mogą przekroczyć
limit rozmiaru sekretów GitHub); w przypadku małych/profilów inicjalizacyjnych może zamiast tego odtworzyć
zakodowany w base64 profil `.tgz` z `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jeśli
nie skonfigurowano żadnego ze źródeł, przepływ pracy nadal publikuje deterministyczne
zrzuty ekranu i dzienniki punktu odniesienia/kandydata, informując, że zalogowany obserwator został
pominięty.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi lub ponownie wykorzystuje pulpit Crabbox, synchronizuje kopię roboczą z maszyną wirtualną, uruchamia
w niej `pnpm openclaw qa slack`, otwiera Slack Web w przeglądarce VNC,
przechwytuje pulpit i kopiuje lokalnie zarówno artefakty QA Slack (`slack-qa/`), jak i
zrzut ekranu/film VNC. Jest to jedyny wariant Mantis, w którym
Gateway SUT i przeglądarka działają wewnątrz tej samej maszyny wirtualnej.

Z `--gateway-setup` polecenie tworzy trwały, jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw` na maszynie wirtualnej, modyfikuje konfigurację Slack
Socket Mode dla kanału docelowego, uruchamia
`openclaw gateway run --dev --allow-unconfigured --port 38973` i pozostawia
Chrome uruchomionego w sesji VNC; pominięcie `--gateway-setup` powoduje zamiast tego uruchomienie zwykłej
ścieżki QA Slack między botami.

Wymagane zmienne środowiskowe dla `--credential-source env` (lokalna wartość domyślna to `env`; domyślna
rola to `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu (jeśli lokalnie ustawiono tylko `OPENAI_API_KEY`,
  Mantis kopiuje ją do `OPENCLAW_LIVE_OPENAI_KEY` przed
  wywołaniem Crabbox)

Z `--credential-source convex` Mantis dzierżawi dane uwierzytelniające SUT Slack ze
wspólnej puli przed utworzeniem maszyny wirtualnej i przekazuje identyfikator kanału, token aplikacji oraz
token bota do maszyny wirtualnej jako zmienne środowiskowe `OPENCLAW_MANTIS_SLACK_*`, dzięki czemu przepływy pracy
GitHub wymagają wyłącznie sekretu brokera Convex, a nie nieprzetworzonych tokenów Slack.

Pozostałe flagi: `--slack-url <url>` otwiera określony adres URL (w przeciwnym razie Mantis wyprowadza
`https://app.slack.com/client/<team>/<channel>` z `auth.test`);
`--slack-channel-id <id>` ustawia kanał na liście dozwolonych Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` określa trwały profil Chrome
wewnątrz maszyny wirtualnej (domyślnie `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` uruchamia natywne scenariusze zatwierdzania Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) i renderuje
zrzuty ekranu punktów kontrolnych oczekujących/rozstrzygniętych zamiast konfiguracji Gateway (wzajemnie
wyklucza się z `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do
ścieżki Slack na żywo.

Zrzuty ekranu punktów kontrolnych zatwierdzania są renderowane z wiadomości API Slack zaobserwowanej przez
scenariusz, a nie z działającego interfejsu Slack; `slack-desktop-smoke.png` stanowi wyłącznie
dowód działania Slack Web, jeśli profil przeglądarki dzierżawy był już zalogowany.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Dzierżawi lub ponownie wykorzystuje pulpit Crabbox, instaluje natywną aplikację Telegram Desktop dla systemu Linux,
opcjonalnie odtwarza archiwum sesji użytkownika, konfiguruje OpenClaw przy użyciu
dzierżawionego tokenu bota SUT Telegram, uruchamia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publikuje
wiadomość gotowości bota sterownika w dzierżawionej grupie prywatnej, a następnie wykonuje
zrzut ekranu i nagranie MP4. Token bota jedynie konfiguruje OpenClaw; nigdy nie loguje
do Telegram Desktop. Obserwator na pulpicie jest oddzielną sesją użytkownika Telegram,
odtwarzaną z `--telegram-profile-archive-env <name>` lub logowaną ręcznie
przez VNC i utrzymywaną aktywną za pomocą `--keep-lease`.

Flagi: `--lease-id <cbx_...>` ponownie uruchamia scenariusz na maszynie wirtualnej już zalogowanej do
Telegram Desktop; `--telegram-profile-archive-env <name>` przed uruchomieniem odtwarza zakodowane w base64
archiwum profilu `.tgz`; `--telegram-profile-dir <remote-path>`
ustawia zdalny katalog profilu (domyślnie `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` jedynie instaluje i otwiera Telegram Desktop;
domyślne wartości `--credential-source`/`--credential-role` to `convex`/`maintainer`.

## Manifest dowodów

Każdy scenariusz publikujący w PR zapisuje `mantis-evidence.json` obok
swojego raportu:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Kontrola jakości reakcji statusu Discord w Mantis",
  "summary": "Czytelne dla człowieka podsumowanie główne do komentarza w PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "tylko w kolejce" },
    "candidate": { "sha": "...", "status": "pass", "expected": "w kolejce -> myślenie -> gotowe" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Wartość bazowa tylko w kolejce",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Bazowa oś czasu Discord",
      "width": 420
    }
  ]
}
```

Artefakt `path` jest względny względem katalogu manifestu; `targetPath` jest
względny względem skonfigurowanego prefiksu artefaktów R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
odrzuca przechodzenie między katalogami i pomija wpisy z `"required": false`, gdy
brakuje pliku.

Rodzaje artefaktów: `timeline` (deterministyczny zrzut ekranu przed/po),
`desktopScreenshot` (zrzut ekranu VNC/przeglądarki), `motionPreview` (osadzony animowany
GIF z nagrania), `motionClip` (MP4 przycięty do ruchu), `fullVideo` (pełne
nagranie), `metadata` (plik towarzyszący JSON/dziennika), `report` (raport Markdown).

Układ artefaktów przebiegu na dysku:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Zrzuty ekranu są materiałem dowodowym, a nie sekretami, ale nadal wymagają
dyscypliny anonimizacji: mogą pojawić się nazwy prywatnych kanałów, nazwy
użytkowników lub treść wiadomości. Ustaw `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznego
przesyłania artefaktów; jest to domyślnie włączone w przepływach pracy GitHub
dla Discord/Slack/Telegram.

## Automatyzacja GitHub

`scripts/mantis/publish-pr-evidence.mjs` jest wydawcą wielokrotnego użytku. Przepływy pracy
wywołują go z manifestem, docelowym PR, głównym katalogiem docelowym artefaktów,
znacznikiem komentarza, adresem URL artefaktów, adresem URL przebiegu i źródłem żądania. Przesyła
zadeklarowane artefakty do zasobnika R2 Mantis, tworzy komentarz w PR zaczynający się od
podsumowania, z osadzonymi obrazami/podglądami i filmami dostępnymi przez odnośniki, a następnie aktualizuje istniejący komentarz ze znacznikiem lub
tworzy nowy. Wymagane zmienne środowiskowe:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (przepływy pracy ustawiają `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (przepływy pracy ustawiają `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (przepływy pracy ustawiają `https://artifacts.openclaw.ai`)

Komentarze są publikowane za pośrednictwem aplikacji GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), a nie `github-actions[bot]`, przy użyciu ukrytego
znacznika komentarza jako klucza operacji upsert.

| Przepływ pracy                          | Wyzwalacz                                                                                    | Działanie                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | ręczne uruchomienie                                                                            | Uruchamia `discord-smoke` względem wybranego odwołania.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | komentarz w PR lub ręczne uruchomienie                                                              | Tworzy osobne drzewa robocze wartości bazowej/kandydata, uruchamia `discord-status-reactions-tool-only` w każdym z nich, renderuje oś czasu każdej ścieżki w przeglądarce pulpitu Crabbox, generuje podglądy GIF/MP4 przycięte do ruchu za pomocą `crabbox media preview`, przesyła artefakty i publikuje osadzony materiał dowodowy w PR.                                 |
| `Mantis Scenario`                 | ręczne uruchomienie                                                                            | Ogólny dyspozytor: przyjmuje `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` i przekazuje je do odpowiedniego przepływu pracy scenariusza. |
| `Mantis Slack Desktop Smoke`      | ręczne uruchomienie                                                                            | Dzierżawi pulpit Linux Crabbox (domyślnie `aws`, z możliwością wyboru `hetzner`), uruchamia `slack-desktop-smoke --gateway-setup` względem kandydata, nagrywa pulpit, generuje podgląd ruchu, przesyła artefakty i publikuje materiał dowodowy w PR, gdy podano numer PR.                                                      |
| `Mantis Telegram Live`            | komentarz w PR lub ręczne uruchomienie                                                              | Uruchamia aktywną ścieżkę kontroli jakości Telegram przez API bota (`openclaw qa telegram`), zapisuje `mantis-evidence.json` z podsumowania kontroli jakości, renderuje zanonimizowany kod HTML materiału dowodowego w przeglądarce pulpitu Crabbox, generuje GIF z ruchem i publikuje materiał dowodowy w PR. Ta ścieżka nie wymaga logowania w Telegram Web.                               |
| `Mantis Telegram Desktop Proof`   | etykieta PR opiekuna (`mantis: telegram-visible-proof`) oraz komentarz w PR lub ręczne uruchomienie | Agentowy, natywny materiał dowodowy przed/po z Telegram Desktop. Przekazuje PR, odwołania wartości bazowej/kandydata i instrukcje opiekuna do Codex, który uruchamia ścieżkę rzeczywistego użytkownika Crabbox Telegram Desktop dla obu odwołań i publikuje dwukolumnową tabelę materiału dowodowego w PR.                                                              |
| `Mantis Web UI Chat Proof`        | komentarz w PR lub ręczne uruchomienie                                                              | Uruchamia ukierunkowany test Playwright czatu w interfejsie Control UI OpenClaw względem kandydata, sprawdza, czy przeglądarka wysyła dane przez atrapę Gateway, przechwytuje artefakty zrzutów ekranu/filmów i publikuje materiał dowodowy w PR. Ta ścieżka stanowi wyłącznie materiał dowodowy czatu internetowego, a nie WinUI/aplikacji natywnej ani dowolny wizualny materiał dowodowy.                           |

Zarówno `Mantis Discord Status Reactions`, jak i `Mantis Telegram Live` akceptują
`baseline_ref`/`candidate_ref` (lub `baseline=`/`candidate=` w komentarzu do PR)
i sprawdzają przed uruchomieniem z poświadczeniami zawierającymi sekrety, czy rozwiązany SHA jest przodkiem `origin/main`, znacznikiem
wydania (`v*`) lub nagłówkiem otwartego PR.

Wyzwalacze w komentarzach z PR z uprawnieniami write/maintain/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Wyzwalacze Telegram w komentarzach domyślnie używają SHA nagłówka PR jako kandydata oraz
`telegram-status-command` jako scenariusza; akceptują `provider=aws|hetzner` i
`lease=<cbx_...>`, aby wskazać konkretnego dostawcę Crabbox lub wstępnie rozgrzany
pulpit. `Mantis Telegram Desktop Proof` odpowiada na komentarz w PR tylko wtedy, gdy
PR ma już etykietę `mantis: telegram-visible-proof`.

Wyzwalacze czatu Web UI w komentarzach domyślnie używają SHA nagłówka PR jako kandydata. Uruchamiają
test czatu Control UI z atrapą Gateway i publikują artefakty przeglądarki; dla
innych stron internetowych i powierzchni aplikacji natywnych należy używać
zwykłych testów Playwright/przeglądarkowych, zrzutów ekranu opiekuna, Crabbox lub lokalnych
artefaktów.

ClawSweeper może również uruchomić scenariusz bezpośrednio:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Maszyny i sekrety

Domyślne ustawienia lokalnego CLI Crabbox to `--provider hetzner --class beast`; można je zastąpić
za pomocą `--provider`, `--class`/`--machine-class` lub
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Przepływy pracy GitHub
często zastępują oba ustawienia (na przykład `--class standard` oraz dane wejściowe wyboru dostawcy
`aws`/`hetzner` w przepływie pracy Slack). Jeśli dostawca jest zbyt
wolny lub niedostępny, należy dodać go za tym samym interfejsem Crabbox zamiast
kodować na stałe mechanizm awaryjny.

Konfiguracja bazowa maszyny wirtualnej: Linux z Chrome/Chromium obsługującym pulpit, dostępem CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ lub 25.9+ i pnpm, kopią roboczą OpenClaw oraz
dostępem wychodzącym do docelowego transportu, GitHub, dostawców modeli i
brokera poświadczeń.

Nazwy poświadczeń i zmiennych środowiskowych używane w poleceniach i przepływach pracy Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Lokalne `qa mantis run --credential-source env` wymaga również
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  oraz `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Przepływy pracy GitHub zwykle używają
  `--credential-source convex` oraz poniższych poświadczeń brokera zamiast nieprzetworzonych
  tokenów bota Discord.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` do publicznego przesyłania artefaktów
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (lub właściwego dla testu Telegram Desktop
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (przepływy pracy akceptują również
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` jako mechanizm awaryjny i mapują
  je na zwykłe nazwy przed wywołaniem Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Program uruchamiający Mantis nigdy nie może wyświetlać tokenów botów Discord/Slack/Telegram,
kluczy API dostawców, plików cookie przeglądarki, zawartości profili uwierzytelniania, haseł VNC ani
nieprzetworzonych ładunków poświadczeń. Jeśli token wycieknie do zgłoszenia, PR, czatu lub dziennika,
należy go obrócić po zapisaniu zastępczego sekretu.

## Wyniki przebiegu

Scenariusze transportu przed/po rozróżniają poniższe wyniki, aby niestabilne
środowisko nie wyglądało jak regresja produktu:

- **Błąd odtworzony**: wartość bazowa nie powiodła się w sposób oczekiwany przez scenariusz.
- **Awaria środowiska testowego**: konfiguracja środowiska, poświadczenia, API transportu, przeglądarka
  lub dostawca zawiodły, zanim wynik mechanizmu weryfikacji stał się miarodajny.

Test przeglądarkowy tylko dla kandydata informuje, czy kandydat przeszedł asercje atrapy
Gateway i widocznego interfejsu użytkownika; nie twierdzi, że odtworzono zachowanie bazowe.

## Dodawanie scenariusza

Aktywne scenariusze transportu są definiowane w TypeScript osobno dla każdego transportu (zobacz
`MANTIS_SCENARIO_CONFIGS` w `extensions/qa-lab/src/mantis/run.runtime.ts`, aby poznać
strukturę przed/po dla Discord), a nie w samodzielnym deklaratywnym formacie pliku.
Każdy scenariusz wymaga: identyfikatora i tytułu, transportu, wymaganych poświadczeń, zasad
odwołania bazowego, zasad odwołania kandydata, poprawki konfiguracji OpenClaw, kroków
konfiguracji/bodźca, oczekiwanego mechanizmu weryfikacji wartości bazowej i kandydata, celów przechwytywania
wizualnego, budżetu limitu czasu oraz kroków czyszczenia.

Ukierunkowany test przeglądarkowy tylko dla kandydata może korzystać z dedykowanego deterministycznego testu E2E
i przepływu pracy. Należy jasno określić jego zakres, sprawdzić odwołanie kandydata przed
wykonaniem, odizolować publikowanie wspierane sekretami i wygenerować manifest materiału dowodowego
zgodny z tym samym kontraktem.

Preferowane są małe, typowane mechanizmy weryfikacji zamiast kontroli wizyjnych: stan reakcji Discord lub
odwołania do wiadomości, stan API `ts`/reakcji w wątku Slack, identyfikatory
i nagłówki wiadomości e-mail. Zrzutów ekranu przeglądarki należy używać, gdy interfejs użytkownika jest jedyną wiarygodną obserwacją,
a kontrole wizyjne powinny być dodatkiem do mechanizmu weryfikacji opartego na API platformy, jeśli taki istnieje.

Po Discord, Slack i Telegram ten sam model programu uruchamiającego można rozszerzyć na WhatsApp
(logowanie kodem QR, ponowna identyfikacja, dostarczanie, multimedia, reakcje) oraz Matrix
(szyfrowane pokoje, relacje wątków/odpowiedzi, wznowienie po restarcie); żaden z nich nie jest
jeszcze zaimplementowany.

## Otwarte pytania

- Który bot Discord powinien pełnić rolę sterownika, a który SUT, gdy istniejący bot Mantis
  jest używany ponownie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR-ów?
- Kiedy ClawSweeper powinien automatycznie zalecać scenariusz Mantis zamiast
  czekać na polecenie opiekuna?
- Czy przed przesłaniem do publicznych PR-ów zrzuty ekranu powinny zostać zanonimizowane lub przycięte?
