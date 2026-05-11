---
read_when:
    - Tworzenie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po zmianach dla prośby o scalenie
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych
    - Debugowanie przebiegów QA, które wymagają zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to wizualny system kompleksowej weryfikacji służący do odtwarzania błędów OpenClaw na aktywnych transportach, rejestrowania dowodów przed zmianą i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-11T20:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to kompleksowy system weryfikacji OpenClaw dla błędów, które wymagają rzeczywistego
środowiska uruchomieniowego, rzeczywistego transportu i widocznego dowodu. Uruchamia scenariusz na znanym
wadliwym refie, przechwytuje dowody, uruchamia ten sam scenariusz na refie kandydującym i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR-a lub
z polecenia lokalnego.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszą ścieżkę o wysokiej wartości:
rzeczywiste uwierzytelnianie bota, rzeczywiste kanały gildii, reakcje, wątki, natywne polecenia oraz
interfejs przeglądarki, w którym ludzie mogą wizualnie potwierdzić, co pokazał transport.

## Cele

- Odtworzyć błąd ze zgłoszenia GitHub lub PR-a z tym samym kształtem transportu, który widzą
  użytkownicy.
- Przechwycić artefakt **przed** na refie bazowym przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na refie kandydującym po zastosowaniu poprawki.
- Używać deterministycznego orakla zawsze, gdy to możliwe, na przykład odczytu reakcji przez Discord REST
  lub sprawdzenia transkrypcji kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczająco dużo stanu maszyny do ratowania przez VNC, gdy logowanie, automatyzacja przeglądarki lub
  uwierzytelnianie dostawcy się zablokuje.
- Publikować zwięzły status na operatorskim kanale Discord, gdy uruchomienie jest zablokowane,
  wymaga ręcznej pomocy przez VNC albo się kończy.

## Poza celami

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis powinno zwykle stać się
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest zwykłą szybką bramką CI. Jest wolniejszy, używa rzeczywistych poświadczeń i
  jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka do normalnego działania. Ręczne VNC jest ścieżką
  ratunkową, a nie standardową ścieżką.
- Mantis nie zapisuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów oraz
  lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem elementów live harness transportu, pomocników przechwytywania przeglądarki oraz
  zapisujących artefakty.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów,
  wywoływania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania,
  debugowania lub raportowania zablokowanego stanu.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w
Crabbox, a klej workflow maintainerów w ClawSweeper.

## Kształt polecenia

Pierwsze polecenie lokalne weryfikuje bota Discord, gildię, kanał, wysłanie wiadomości,
wysłanie reakcji oraz ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po akceptuje taki kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone drzewa robocze baseline i candidate w katalogu wyjściowym,
instaluje zależności, buduje każdy ref, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord udana weryfikacja
oznacza, że status baseline to `fail`, a status candidate to `pass`.

Druga sonda Discord przed/po celuje w załączniki wątków:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Ten scenariusz publikuje wiadomość nadrzędną botem sterującym, tworzy rzeczywisty wątek Discord,
wywołuje akcję `message.thread-reply` OpenClaw z repo-lokalnym
`filePath`, a następnie odpytuje wątek o odpowiedź SUT i nazwę pliku załącznika. Zrzut ekranu
baseline pokazuje odpowiedź bez załącznika; zrzut ekranu candidate
pokazuje oczekiwany załącznik `mantis-thread-report.md`.

Pierwszą prymitywną operacją VM/przeglądarki jest desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi albo ponownie używa maszyny desktop Crabbox, uruchamia widoczną przeglądarkę wewnątrz
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego
i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa
dostawcy Hetzner, ponieważ jest to pierwszy dostawca z działającym pokryciem desktop/VNC
w ścieżce Mantis. Nadpisz go przez `--provider`, `--crabbox-bin` albo
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz na innej flocie Crabbox.

Przydatne flagi desktop smoke:

- `--lease-id <cbx_...>` albo `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje repo-lokalny artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwytywania wygenerowanej osi czasu reakcji statusu Discord przez rzeczywisty desktop Crabbox.
- `--browser-profile-dir <remote-path>` ponownie używa zdalnego Chrome user-data-dir, aby trwały desktop Mantis mógł pozostać zalogowany między uruchomieniami. Używaj tego dla długotrwałego profilu podglądu Discord Web.
- `--browser-profile-archive-env <name>` przywraca archiwum Chrome user-data-dir `.tgz` w base64 z nazwanej zmiennej środowiskowej przed uruchomieniem przeglądarki. Używaj tego dla zalogowanych świadków, takich jak Discord Web. Domyślną zmienną env jest `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` kontroluje długość przechwytywania MP4. Użyj dłuższego czasu dla wolnych zalogowanych aplikacji webowych, które potrzebują czasu na ustabilizowanie.
- `--keep-lease` albo `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną udaną dzierżawę otwartą do inspekcji VNC. Nieudane uruchomienia domyślnie utrzymują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny oraz czas życia dzierżawy.

Dla dowodów Discord Web Mantis używa dedykowanego konta podglądu zamiast
tokena bota. Scenariusz live Discord API pozostaje oraklem: tworzy rzeczywisty
wątek, wysyła `thread-reply` SUT i sprawdza załącznik przez Discord
REST. Gdy ustawione jest `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenariusz zapisuje także
artefakt URL Discord Web. Gdy ustawione jest `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`,
pozostawia ten wątek dostępny wystarczająco długo, aby zalogowana przeglądarka mogła go otworzyć
i nagrać.

Workflow GitHub otwiera URL wątku candidate w Discord Web, przechwytuje
zrzut ekranu, nagrywa MP4 i generuje przycięty pod ruch podgląd GIF, gdy narzędzia
mediów Crabbox są dostępne. Preferuj trwałą ścieżkę profilu podglądu skonfigurowaną
przez `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, ponieważ pełne archiwa profilu Chrome
mogą przekroczyć limit rozmiaru sekretu GitHub. Dla małych/bootstrapowych profili
workflow może także przywrócić archiwum `.tgz` w base64 z
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jeśli żadne źródło profilu nie jest
skonfigurowane, workflow nadal publikuje deterministyczne zrzuty ekranu załączników baseline/candidate
i loguje powiadomienie, że zalogowany świadek Discord Web
został pominięty.

Pierwszą pełną prymitywną operacją transportu desktopowego jest Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi albo ponownie używa maszyny desktop Crabbox, synchronizuje bieżący checkout do
VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce
VNC, przechwytuje widoczny pulpit oraz kopiuje zarówno artefakty Slack QA, jak i
zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis,
w którym Gateway SUT OpenClaw i przeglądarka działają wewnątrz tej samej
desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw`, poprawia konfigurację Slack Socket Mode
dla wybranego kanału, uruchamia `openclaw gateway run` na porcie
`38973` i utrzymuje Chrome działający w sesji VNC. To jest tryb „zostaw mi
desktop Linux ze Slack i działającym claw”; ścieżka Slack QA bot-do-bota
pozostaje domyślna, gdy `--gateway-setup` zostanie pominięte.

Wymagane wejścia dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu. Jeśli lokalnie ustawione jest tylko
  `OPENAI_API_KEY`, Mantis mapuje je na `OPENCLAW_LIVE_OPENAI_KEY`
  przed wywołaniem Crabbox, aby przekazywanie env `OPENCLAW_*` przez Crabbox mogło przenieść je
  do VM.

Z `--gateway-setup --credential-source convex` Mantis dzierżawi poświadczenie Slack SUT
ze współdzielonej puli przed utworzeniem VM i przekazuje wydzierżawiony
identyfikator kanału, token aplikacji Socket Mode oraz token bota jako środowisko uruchomieniowe `OPENCLAW_MANTIS_SLACK_*`
wewnątrz desktopu. Dzięki temu workflow GitHub pozostają cienkie: potrzebują tylko
sekretu brokera Convex, a nie surowych tokenów bota lub aplikacji Slack.

Przydatne flagi Slack desktop:

- `--lease-id <cbx_...>` uruchamia ponownie na maszynie, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały Gateway Slack OpenClaw w VM zamiast uruchamiać tylko ścieżkę QA bot-do-bota.
- `--keep-lease` utrzymuje VM Gateway otwartą do inspekcji VNC po sukcesie; `--no-keep-lease` zatrzymuje ją po zebraniu artefaktów.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez tego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlist kanałów Slack używaną przez konfigurację Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślnie jest to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie Slack Web przetrwa ponowne uruchomienia na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli poświadczeń zamiast bezpośrednich tokenów env Slack.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do ścieżki live Slack.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po
dla pierwszego rzeczywistego scenariusza to `Mantis Discord Status Reactions`. Akceptuje:

- `baseline_ref`: ref, który powinien odtworzyć zachowanie tylko `queued`.
- `candidate_ref`: ref, który powinien pokazać `queued -> thinking -> done`.

Checkoutuje ref harness workflow, buduje osobne drzewa robocze baseline i candidate,
uruchamia `discord-status-reactions-tool-only` na każdym drzewie roboczym i
przesyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions. Renderuje także HTML osi czasu każdej ścieżki w przeglądarce desktopowej
Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych
PNG osi czasu w komentarzu PR. Ten sam komentarz PR osadza lekkie
przycięte pod ruch podglądy GIF wygenerowane przez `crabbox media preview`, linkuje do
odpowiednich przyciętych pod ruch klipów MP4 i zachowuje pełne pliki MP4 desktopu do głębokiej
inspekcji. Zrzuty ekranu pozostają inline do szybkiego przeglądu. Workflow buduje
CLI Crabbox z
`openclaw/crabbox` main, aby mógł używać bieżących flag dzierżawy desktop/przeglądarka
przed wydaniem następnej binarki Crabbox.

`Mantis Scenario` to generyczny ręczny punkt wejścia. Przyjmuje `scenario_id`,
`candidate_ref`, opcjonalny `baseline_ref` i opcjonalny `pr_number`, a następnie
wywołuje workflow należący do scenariusza. Wrapper jest celowo cienki:
workflow scenariuszy nadal są właścicielami konfiguracji transportu, poświadczeń, klasy VM,
oczekiwanego orakla i manifestu artefaktów.

`Mantis Slack Desktop Smoke` to pierwszy workflow VM dla Slack. Pobiera
zaufany ref kandydata w osobnym worktree, dzierżawi pulpit Linux Crabbox,
uruchamia `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` wobec
tego kandydata, otwiera Slack Web w przeglądarce VNC, nagrywa pulpit, generuje
podgląd przycięty do ruchu za pomocą `crabbox media preview`, przesyła pełny
katalog artefaktów i opcjonalnie publikuje w docelowym PR wbudowany komentarz z
dowodami. Domyślnie używa AWS do dzierżawy pulpitu i udostępnia ręczne wejście
providera, aby operatorzy mogli przełączyć się na Hetzner, gdy pojemność AWS
jest wolna lub niedostępna. Użyj tej ścieżki, gdy chcesz „pulpit Linux ze Slack
i działającym claw” zamiast wyłącznie transkryptu Slack bot-do-bota.

`Mantis Telegram Live` opakowuje istniejącą ścieżkę live QA Telegram w ten sam
potok dowodów PR. Pobiera zaufany ref kandydata w osobnym worktree, uruchamia
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, zapisuje manifest `mantis-evidence.json` z podsumowania
QA Telegram i artefaktu obserwowanej wiadomości, renderuje zredagowany HTML
transkryptu przez przeglądarkę pulpitu Crabbox, generuje GIF przycięty do ruchu
za pomocą `crabbox media preview` i publikuje wbudowany komentarz z dowodami PR,
gdy dostępny jest numer PR. Ta ścieżka jest wizualizacją transkryptu, a nie
dowodem zalogowanego Telegram Web: Telegram Bot API daje stabilne dowody
wiadomości live, ale stan logowania Telegram Web nie jest wymagany dla normalnej
automatyzacji Mantis.

`Mantis Telegram Desktop Proof` to agentowe natywne opakowanie przed/po dla
Telegram Desktop. Maintainer może uruchomić je z komentarza PR za pomocą
`@Mantis telegram desktop proof`, z interfejsu Actions UI z instrukcjami w
dowolnej formie albo przez ogólny dyspozytor `Mantis Scenario`. Workflow
przekazuje PR, ref bazowy, ref kandydata i instrukcje maintainera do Codex.
Agent czyta PR, decyduje, jakie zachowanie widoczne w Telegram dowodzi zmiany,
uruchamia ścieżkę dowodu Telegram Desktop Crabbox dla prawdziwego użytkownika
dla wersji bazowej i kandydata, iteruje, aż natywne GIF-y są użyteczne, zapisuje
sparowane artefakty `motionPreview` do `mantis-evidence.json`, przesyła pakiet i
publikuje 2-kolumnową tabelę dowodów PR, gdy dostępny jest numer PR.

Do konfiguracji Telegram Desktop z udziałem człowieka użyj buildera scenariusza:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder dzierżawi lub ponownie używa pulpitu Crabbox, instaluje natywny binarny
Telegram Desktop dla Linux, opcjonalnie przywraca archiwum sesji użytkownika,
konfiguruje OpenClaw z dzierżawionym tokenem bota Telegram SUT, uruchamia
`openclaw gateway run` na porcie `38974`, publikuje wiadomość gotowości bota
sterującego do dzierżawionej grupy prywatnej, a następnie przechwytuje zrzut
ekranu i MP4 z widocznego pulpitu VNC. Token bota nigdy nie loguje Telegram
Desktop; tylko konfiguruje OpenClaw. Przeglądarka pulpitu to osobna sesja
użytkownika Telegram przywrócona z `--telegram-profile-archive-env <name>` albo
utworzona ręcznie przez VNC i utrzymywana przy życiu za pomocą `--keep-lease`.

Przydatne flagi buildera Telegram Desktop:

- `--lease-id <cbx_...>` uruchamia ponownie wobec VM, na której operator już zalogował się do Telegram Desktop.
- `--telegram-profile-archive-env <name>` odczytuje archiwum profilu Telegram Desktop `.tgz` w base64 z tej zmiennej env i przywraca je przed uruchomieniem.
- `--telegram-profile-dir <remote-path>` kontroluje zdalny katalog profilu Telegram Desktop. Domyślnie jest to `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instaluje i otwiera Telegram Desktop bez konfigurowania OpenClaw.
- `--credential-source convex --credential-role ci` używa współdzielonego brokera poświadczeń zamiast bezpośrednich tokenów env Telegram.

Każdy scenariusz publikujący PR zapisuje `mantis-evidence.json` obok swojego
raportu. Ten schemat jest przekazaniem między kodem scenariusza a komentarzami
GitHub:

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

Wartości `path` artefaktów są względne wobec katalogu manifestu. Wartości
`targetPath` to ścieżki względne w katalogu publikacji gałęzi `qa-artifacts`.
Publisher odrzuca przechodzenie po ścieżkach i pomija wpisy oznaczone jako
`"required": false`, gdy opcjonalne podglądy lub filmy są niedostępne.

Obsługiwane rodzaje artefaktów:

- `timeline`: deterministyczny zrzut ekranu scenariusza, zwykle przed/po.
- `desktopScreenshot`: zrzut ekranu pulpitu VNC/przeglądarki.
- `motionPreview`: wbudowany animowany GIF wygenerowany z nagrania pulpitu.
- `motionClip`: MP4 przycięty do ruchu, który usuwa statyczny początek i koniec.
- `fullVideo`: pełne nagranie MP4 do głębokiej inspekcji.
- `metadata`: poboczny JSON/log.
- `report`: raport Markdown.

Wielokrotnego użytku publisher to `scripts/mantis/publish-pr-evidence.mjs`.
Workflowy wywołują go z manifestem, docelowym PR, docelowym katalogiem głównym
`qa-artifacts`, markerem komentarza, URL-em artefaktu Actions, URL-em
uruchomienia i źródłem żądania. Kopiuje zadeklarowane artefakty do gałęzi
`qa-artifacts`, buduje komentarz PR z podsumowaniem na początku, wbudowanymi
obrazami/podglądami i podlinkowanymi filmami, a następnie aktualizuje istniejący
komentarz z markerem albo tworzy nowy.

Możesz też uruchomić przebieg status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Działa tylko na komentarzach pull
requestów od użytkowników z dostępem write, maintain lub admin i rozpoznaje
wyłącznie żądania reakcji statusu Discord. Domyślnie używa znanego złego refa
bazowego i bieżącego SHA głowy PR jako kandydata. Maintainerzy mogą nadpisać
dowolny ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

QA live Telegram można też uruchomić z komentarza PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Domyślnie używa bieżącego SHA głowy PR jako kandydata i uruchamia
`telegram-status-command`. Maintainerzy mogą nadpisać `candidate=...`,
`provider=aws|hetzner` i `lease=<cbx_...>`, gdy potrzebują konkretnego refa albo
wstępnie rozgrzanego pulpitu Crabbox.

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skupione na scenariuszu. Drugie może później
mapować PR lub issue na zalecane scenariusze Mantis na podstawie etykiet,
zmienionych plików i ustaleń przeglądu ClawSweeper.

## Cykl życia uruchomienia

1. Uzyskaj poświadczenia.
2. Przydziel lub ponownie użyj VM.
3. Przygotuj profil pulpitu/przeglądarki, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla refa bazowego.
5. Zainstaluj zależności i zbuduj tylko to, czego potrzebuje scenariusz.
6. Uruchom potomny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, providera, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj Gateway i zachowaj logi.
10. Przygotuj ref kandydata na tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki oracle i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śledzenia.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzły komunikat statusu PR lub Discord.

Scenariusz powinien móc zakończyć się niepowodzeniem na dwa różne sposoby:

- **Błąd odtworzony**: wersja bazowa zawiodła w oczekiwany sposób.
- **Awaria harnessa**: konfiguracja środowiska, poświadczenia, Discord API, przeglądarka lub
  provider zawiodły, zanim oracle błędu było znaczące.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili
niestabilnego środowiska z zachowaniem produktu.

## Discord MVP

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach guild,
gdzie tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego to dobry zalążek Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silne oracle REST przez stan reakcji wiadomości Discord.
- Ćwiczy rzeczywisty OpenClaw Gateway, auth bota Discord, wysyłkę wiadomości,
  tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest na tyle wąski, aby pierwsza implementacja pozostała rzetelna.

Oczekiwany kształt scenariusza:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Dowody bazowe powinny pokazywać reakcję potwierdzenia w kolejce, ale bez
przejścia cyklu życia w trybie tool-only. Dowody kandydata powinny pokazywać
działające reakcje statusu cyklu życia, gdy `messages.statusReactions.enabled`
jest jawnie ustawione na true.

Wykonywalny pierwszy wycinek to scenariusz live QA Discord z włączeniem przez
opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT z zawsze włączoną obsługą guild, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` i jawnymi reakcjami statusu. Oracle odpytuje
rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji
`👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` i
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące elementy QA

Mantis powinien budować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia ścieżkę live Discord z botami driver i SUT.
- Runner transportu live już zapisuje raporty i artefakty obserwowanych wiadomości
  pod `.artifacts/qa-e2e/`.
- Dzierżawy poświadczeń Convex już zapewniają wyłączny dostęp do współdzielonych
  poświadczeń transportów live.
- Usługa sterowania przeglądarką już obsługuje zrzuty ekranu, snapshoty,
  zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera i bus do testowania o kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po nad tymi
elementami plus jedna warstwa dowodów wizualnych.

## Model dowodów

Każde uruchomienie zapisuje stabilny katalog artefaktów:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` powinien być maszynowo odczytywalnym źródłem prawdy.
Raport Markdown jest przeznaczony do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- przetestowane refy i SHA
- transport i identyfikator scenariusza
- providera maszyny oraz identyfikator maszyny lub identyfikator dzierżawy
- źródło poświadczeń bez wartości sekretów
- wynik bazowy
- wynik kandydata
- czy błąd został odtworzony na wersji bazowej
- czy kandydat go naprawił
- ścieżki artefaktów
- oczyszczone problemy konfiguracji lub czyszczenia

Zrzuty ekranu są dowodem, a nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. W publicznych PR-ach
preferuj linki do artefaktów GitHub Actions zamiast obrazów osadzonych, dopóki historia redakcji
nie będzie mocniejsza.

## Przeglądarka i VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja bez interfejsu graficznego**: domyślna dla CI. Chrome działa z włączonym CDP, a
  Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowy VNC**: włączany na tej samej VM, gdy logowanie, MFA, zabezpieczenia Discord przeciw automatyzacji
  lub wizualne debugowanie wymagają człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby uniknąć
logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil
należy do puli maszyn Mantis, nie do laptopa dewelopera.

Gdy Mantis się zablokuje, publikuje wiadomość statusową na Discord z:

- identyfikatorem uruchomienia
- identyfikatorem scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim opisem blokady

Pierwsze prywatne wdrożenie może publikować te wiadomości w istniejącym kanale operatorów
i później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox dla pierwszej zdalnej implementacji.
Crabbox zapewnia nam rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i
czyszczenie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z pulpitem
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do działań ratunkowych
- Node 22 i pnpm
- checkout OpenClaw i pamięć podręczna zależności
- pamięć podręczna przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera poświadczeń

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami poświadczeń lub
profilu przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji lub repozytorium GitHub dla zdalnych uruchomień oraz w
lokalnym, kontrolowanym przez operatora pliku sekretów dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesyłek artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Długoterminowo pula poświadczeń Convex powinna pozostać normalnym źródłem poświadczeń
transportu na żywo. Sekrety GitHub inicjalizują brokera i ścieżki awaryjne.
Przepływ pracy reakcji statusowych Discord mapuje sekrety Mantis Crabbox z powrotem na
zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`,
których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają
akceptowane jako awaryjna zgodność.

Runner Mantis nigdy nie może drukować:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych ładunków poświadczeń

Publiczne przesyłanie artefaktów powinno również redagować metadane celu Discord, takie jak identyfikatory botów,
gildii, kanałów i wiadomości. Przepływ pracy smoke GitHub włącza
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` z tego powodu.

Jeśli token zostanie przypadkowo wklejony do zgłoszenia, PR-a, czatu lub logu, obróć go
po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Przepływy pracy Mantis powinny przesyłać pełny pakiet dowodowy jako krótkotrwały artefakt Actions.
Gdy przepływ pracy jest uruchamiany dla zgłoszenia błędu lub PR-a z poprawką, powinien także
opublikować zredagowane zrzuty ekranu PNG w gałęzi `qa-artifacts` i utworzyć lub zaktualizować
komentarz w tym zgłoszeniu błędu albo PR-ze z poprawką, z osadzonymi zrzutami ekranu przed/po. Nie publikuj
głównego dowodu wyłącznie w ogólnym PR-ze automatyzacji QA. Surowe logi, zaobserwowane
wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Produkcyjne przepływy pracy powinny publikować te komentarze za pomocą GitHub App Mantis, nie
za pomocą `github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety
GitHub Actions `MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Przepływ pracy używa ukrytego znacznika jako klucza operacji upsert, aktualizuje ten
komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy
starszego znacznika należącego do bota nie można edytować.

Komentarz PR powinien być krótki i wizualny:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Gdy uruchomienie nie powiedzie się, ponieważ zawiódł harness, komentarz musi to wskazać
zamiast sugerować, że kandydat zawiódł.

## Uwagi dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej
aplikacji zamiast tworzyć kolejną, gdy ma właściwe uprawnienia bota
i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatorów przez sekrety lub konfigurację wdrożenia.
Najpierw może wskazywać istniejący kanał opiekunów lub operacyjny,
a następnie przejść do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj identyfikatorów gildii, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC
w tym dokumencie. Przechowuj je w sekretach GitHub, brokerze poświadczeń lub
lokalnym magazynie sekretów operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- identyfikator i tytuł
- transport
- wymagane poświadczenia
- politykę refa linii bazowej
- politykę refa kandydata
- łatkę konfiguracji OpenClaw
- kroki przygotowania
- bodziec
- oczekiwaną wyrocznię linii bazowej
- oczekiwaną wyrocznię kandydata
- cele przechwytywania wizualnego
- budżet limitu czasu
- kroki czyszczenia

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- odwołania do wiadomości Discord dla błędów wątkowania
- thread ts Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości email i nagłówki dla błędów email
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym sygnałem

Kontrole wizyjne powinny być dodatkiem. Jeśli API platformy może udowodnić błąd, użyj
API jako wyroczni zaliczenia/niezaliczenia i zachowaj zrzuty ekranu dla zaufania człowieka.

## Rozszerzenie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, przesyłanie plików.
- Email: uwierzytelnianie Gmail i wątkowanie wiadomości przy użyciu `gog`, gdy konektory nie są
  wystarczające.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, media, reakcje.
- Telegram: bramkowanie wzmianek w grupach, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątku lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke i jeden lub więcej scenariuszy
klas błędów. Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który SUT, gdy istniejący bot Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego
  czy tylko dowodów REST czytelnych dla bota w pierwszej fazie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR-ów?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie opiekuna?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem dla publicznych PR-ów?
