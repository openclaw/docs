---
read_when:
    - Tworzenie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po zmianach dla pull requestu
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych usług
    - Debugowanie przebiegów QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to wizualny system kompleksowej weryfikacji służący do odtwarzania błędów OpenClaw na aktywnych transportach, przechwytywania dowodów sprzed zmian i po nich oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-10T19:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów, które wymagają rzeczywistego
środowiska uruchomieniowego, rzeczywistego transportu i widocznego dowodu. Uruchamia scenariusz względem znanej
wadliwej referencji, przechwytuje dowody, uruchamia ten sam scenariusz względem referencji kandydującej i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR-a albo
z lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam wartościowy pierwszy tor:
rzeczywiste uwierzytelnianie bota, rzeczywiste kanały gildii, reakcje, wątki, natywne polecenia oraz
UI przeglądarki, w którym ludzie mogą wizualnie potwierdzić, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR-a GitHub przy tym samym kształcie transportu, który widzą
  użytkownicy.
- Przechwycić artefakt **przed** na referencji bazowej przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na referencji kandydującej po zastosowaniu poprawki.
- Użyć deterministycznego mechanizmu rozstrzygającego, gdy tylko to możliwe, takiego jak odczyt reakcji przez REST
  Discord albo sprawdzenie transkryptu kanału.
- Przechwycić zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczająco dużo stanu maszyny do ratowania przez VNC, gdy logowanie, automatyzacja przeglądarki albo
  uwierzytelnianie dostawcy się zablokują.
- Publikować zwięzły status na operatorskim kanale Discord, gdy uruchomienie jest zablokowane,
  wymaga ręcznej pomocy przez VNC albo się zakończy.

## Poza zakresem

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis zwykle powinno stać się
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest normalną szybką bramką CI. Jest wolniejszy, używa żywych poświadczeń i
  jest zarezerwowany dla błędów, w których znaczenie ma żywe środowisko.
- Mantis nie powinien wymagać człowieka w normalnym działaniu. Ręczne VNC jest ścieżką
  ratunkową, a nie szczęśliwą ścieżką.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów oraz
  lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem elementów uprzęży żywego transportu, pomocników przechwytywania przeglądarki oraz
  mechanizmów zapisu artefaktów.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia przepływu pracy i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów,
  wysyłania przepływu pracy i publikowania końcowego komentarza PR.
- Agenci OpenClaw prowadzą Mantis przez Codex, gdy scenariusz wymaga agentowej konfiguracji,
  debugowania albo raportowania stanu zablokowania.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w
Crabbox, a klej przepływu pracy maintainerów w ClawSweeper.

## Kształt poleceń

Pierwsze lokalne polecenie weryfikuje bota Discord, gildię, kanał, wysłanie wiadomości,
wysłanie reakcji i ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po przyjmuje ten kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone drzewa robocze baseline i candidate w katalogu wyjściowym,
instaluje zależności, buduje każdą referencję, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord pomyślna weryfikacja
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
wywołuje akcję `message.thread-reply` OpenClaw z lokalnym dla repozytorium
`filePath`, a następnie odpytuje wątek o odpowiedź SUT i nazwę pliku załącznika. Zrzut ekranu
baseline pokazuje odpowiedź bez załącznika; zrzut ekranu candidate
pokazuje oczekiwany załącznik `mantis-thread-report.md`.

Pierwszą prymitywną operacją VM/przeglądarki jest dymny test pulpitu:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi albo ponownie używa maszyny desktopowej Crabbox, uruchamia widoczną przeglądarkę w
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego
i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa
dostawcy Hetzner, ponieważ jest to pierwszy dostawca z działającym pokryciem desktop/VNC
w torze Mantis. Nadpisz go za pomocą `--provider`, `--crabbox-bin` albo
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz względem innej floty Crabbox.

Przydatne flagi dymnego testu pulpitu:

- `--lease-id <cbx_...>` albo `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego pulpitu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje lokalny dla repozytorium artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwytywania wygenerowanej osi czasu reakcji statusu Discord przez rzeczywisty pulpit Crabbox.
- `--browser-profile-dir <remote-path>` ponownie używa zdalnego Chrome user-data-dir, aby trwały pulpit Mantis mógł pozostać zalogowany między uruchomieniami. Używaj tego dla długotrwałego profilu przeglądarki Discord Web.
- `--browser-profile-archive-env <name>` przywraca archiwum Chrome user-data-dir `.tgz` zakodowane w base64 z nazwanej zmiennej środowiskowej przed uruchomieniem przeglądarki. Używaj tego dla zalogowanych świadków, takich jak Discord Web. Domyślna zmienna środowiskowa to `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` kontroluje długość przechwytywania MP4. Użyj dłuższego czasu dla wolnych, zalogowanych aplikacji webowych, które potrzebują czasu na ustabilizowanie.
- `--keep-lease` albo `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną pomyślną dzierżawę otwartą do inspekcji VNC. Nieudane uruchomienia domyślnie utrzymują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny i czas życia dzierżawy.

Dla dowodów Discord Web Mantis używa dedykowanego konta przeglądającego zamiast
tokenu bota. Żywy scenariusz API Discord pozostaje mechanizmem rozstrzygającym: tworzy rzeczywisty
wątek, wysyła `thread-reply` SUT i sprawdza załącznik przez REST Discord.
Gdy ustawione jest `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenariusz dodatkowo
zapisuje artefakt URL Discord Web. Gdy ustawione jest `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`,
pozostawia ten wątek dostępny wystarczająco długo, aby zalogowana przeglądarka mogła go otworzyć
i nagrać.

Przepływ pracy GitHub otwiera URL wątku candidate w Discord Web, przechwytuje
zrzut ekranu, nagrywa MP4 i generuje przycięty do ruchu podgląd GIF, gdy dostępne jest
narzędzie medialne Crabbox. Preferuj trwałą ścieżkę profilu przeglądarki skonfigurowaną
przez `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, ponieważ pełne archiwa profilu Chrome
mogą przerosnąć limit rozmiaru sekretu GitHub. Dla małych/startowych profili
przepływ pracy może również przywrócić archiwum `.tgz` zakodowane w base64 z
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jeśli żadne źródło profilu nie jest
skonfigurowane, przepływ pracy nadal publikuje deterministyczne zrzuty ekranu załączników baseline/candidate
i zapisuje informację, że zalogowany świadek Discord Web został pominięty.

Pierwszą pełną prymitywną operacją transportu desktopowego jest dymny test pulpitu Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi albo ponownie używa maszyny desktopowej Crabbox, synchronizuje bieżący checkout do
VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce
VNC, przechwytuje widoczny pulpit oraz kopiuje zarówno artefakty QA Slack, jak i
zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis,
w którym SUT OpenClaw Gateway i przeglądarka działają wewnątrz tej samej desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw`, poprawia konfigurację Slack Socket Mode
dla wybranego kanału, uruchamia `openclaw gateway run` na porcie
`38973` i utrzymuje Chrome uruchomiony w sesji VNC. To tryb „zostaw mi
pulpit Linux ze Slack i działającym claw”; tor QA Slack bot-do-bota
pozostaje domyślny, gdy `--gateway-setup` jest pominięte.

Wymagane dane wejściowe dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnego toru modelu. Jeśli lokalnie ustawione jest tylko
  `OPENAI_API_KEY`, Mantis mapuje je na `OPENCLAW_LIVE_OPENAI_KEY`
  przed wywołaniem Crabbox, aby przekazywanie zmiennych środowiskowych `OPENCLAW_*` przez Crabbox mogło przenieść je
  do VM.

Z `--gateway-setup --credential-source convex` Mantis dzierżawi poświadczenie SUT Slack
ze współdzielonej puli przed utworzeniem VM i przekazuje wydzierżawiony
identyfikator kanału, token aplikacji Socket Mode oraz token bota jako środowisko uruchomieniowe `OPENCLAW_MANTIS_SLACK_*`
wewnątrz pulpitu. To utrzymuje przepływy pracy GitHub lekkie: potrzebują tylko
sekretu brokera Convex, a nie surowych tokenów bota albo aplikacji Slack.

Przydatne flagi pulpitu Slack:

- `--lease-id <cbx_...>` ponownie uruchamia względem maszyny, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały Gateway Slack OpenClaw w VM zamiast tylko uruchamiać tor QA bot-do-bota.
- `--keep-lease` utrzymuje VM Gateway otwartą do inspekcji VNC po powodzeniu; `--no-keep-lease` zatrzymuje ją po zebraniu artefaktów.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez niego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje listę dozwolonych kanałów Slack używaną przez konfigurację Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślna wartość to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie Slack Web przetrwa ponowne uruchomienia na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli poświadczeń zamiast bezpośrednich tokenów Slack ze środowiska.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do żywego toru Slack.

Dymny przepływ pracy GitHub to `Mantis Discord Smoke`. Przepływ pracy GitHub przed i po
dla pierwszego rzeczywistego scenariusza to `Mantis Discord Status Reactions`. Przyjmuje:

- `baseline_ref`: referencja, która ma odtworzyć zachowanie tylko w kolejce.
- `candidate_ref`: referencja, która ma pokazać `queued -> thinking -> done`.

Pobiera referencję uprzęży przepływu pracy, buduje osobne drzewa robocze baseline i candidate,
uruchamia `discord-status-reactions-tool-only` względem każdego drzewa roboczego i
przesyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions. Renderuje również HTML osi czasu każdego toru w przeglądarce desktopowej
Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych
PNG osi czasu w komentarzu PR. Ten sam komentarz PR osadza lekkie
przycięte do ruchu podglądy GIF wygenerowane przez `crabbox media preview`, linkuje do
pasujących przyciętych do ruchu klipów MP4 i zachowuje pełne pliki MP4 z pulpitu do głębokiej
inspekcji. Zrzuty ekranu pozostają inline do szybkiego przeglądu. Przepływ pracy buduje
CLI Crabbox z
`openclaw/crabbox` main, aby mógł używać bieżących flag dzierżawy desktop/przeglądarka
przed wydaniem następnej wersji binarnej Crabbox.

`Mantis Scenario` to ogólny ręczny punkt wejścia. Przyjmuje `scenario_id`,
`candidate_ref`, opcjonalne `baseline_ref` i opcjonalne `pr_number`, a następnie
wysyła należący do scenariusza przepływ pracy. Wrapper jest celowo cienki:
przepływy pracy scenariuszy nadal są właścicielami konfiguracji transportu, poświadczeń, klasy VM,
oczekiwanego mechanizmu rozstrzygającego i manifestu artefaktów.

`Mantis Slack Desktop Smoke` to pierwszy przepływ pracy VM dla Slack. Wyewidencjonowuje
zaufaną referencję kandydującą w osobnym worktree, dzierżawi pulpit Crabbox
Linux, uruchamia `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`
dla tego kandydata, otwiera Slack Web w przeglądarce VNC, nagrywa pulpit,
generuje podgląd przycięty do ruchu za pomocą `crabbox media preview`, przesyła
pełny katalog artefaktów i opcjonalnie publikuje komentarz z dowodami inline w
docelowym PR. Domyślnie używa AWS do dzierżawy pulpitu i udostępnia ręczne
wejście dostawcy, aby operatorzy mogli przełączyć się na Hetzner, gdy pojemność
AWS jest wolna lub niedostępna. Użyj tej ścieżki, gdy chcesz „pulpit Linux ze
Slack i działającym claw”, zamiast wyłącznie transkrypcji Slack typu bot-bot.

`Mantis Telegram Live` opakowuje istniejącą ścieżkę Telegram live QA w ten sam
pipeline dowodów PR. Wyewidencjonowuje zaufaną referencję kandydującą w osobnym
worktree, uruchamia `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, zapisuje manifest `mantis-evidence.json` z podsumowania
Telegram QA i artefaktu zaobserwowanej wiadomości, renderuje zredagowany HTML
transkrypcji przez przeglądarkę pulpitu Crabbox, generuje GIF przycięty do ruchu
za pomocą `crabbox media preview` i publikuje komentarz z dowodami inline w PR,
gdy dostępny jest numer PR. Ta ścieżka jest wizualizacją transkrypcji, a nie
dowodem zalogowanego Telegram Web: Telegram Bot API daje stabilne dowody
wiadomości live, ale stan logowania Telegram Web nie jest wymagany do zwykłej
automatyzacji Mantis.

Do konfiguracji pulpitu Telegram z udziałem człowieka użyj kreatora scenariusza:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Kreator dzierżawi lub ponownie używa pulpitu Crabbox, instaluje natywny plik
binarny Telegram Desktop dla Linux, opcjonalnie przywraca archiwum sesji
użytkownika, konfiguruje OpenClaw z wydzierżawionym tokenem bota Telegram SUT,
uruchamia `openclaw gateway run` na porcie `38974`, publikuje komunikat gotowości
bota sterującego w wydzierżawionej grupie prywatnej, a następnie przechwytuje
zrzut ekranu i MP4 z widocznego pulpitu VNC. Token bota nigdy nie loguje
Telegram Desktop; tylko konfiguruje OpenClaw. Podgląd pulpitu jest osobną sesją
użytkownika Telegram przywróconą z `--telegram-profile-archive-env <name>` albo
utworzoną ręcznie przez VNC i utrzymywaną przy życiu za pomocą `--keep-lease`.

Przydatne flagi kreatora pulpitu Telegram:

- `--lease-id <cbx_...>` uruchamia ponownie na VM, na której operator już zalogował się do Telegram Desktop.
- `--telegram-profile-archive-env <name>` odczytuje archiwum profilu Telegram Desktop `.tgz` w base64 z tej zmiennej env i przywraca je przed uruchomieniem.
- `--telegram-profile-dir <remote-path>` kontroluje zdalny katalog profilu Telegram Desktop. Wartość domyślna to `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instaluje i otwiera Telegram Desktop bez konfigurowania OpenClaw.
- `--credential-source convex --credential-role ci` używa współdzielonego brokera poświadczeń zamiast bezpośrednich tokenów env Telegram.

Każdy scenariusz publikujący PR zapisuje `mantis-evidence.json` obok swojego raportu.
Ten schemat jest przekazaniem między kodem scenariusza a komentarzami GitHub:

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

Wartości `path` artefaktów są względne względem katalogu manifestu. Wartości
`targetPath` to ścieżki względne pod katalogiem publikacji gałęzi `qa-artifacts`.
Publikator odrzuca path traversal i pomija wpisy oznaczone
`"required": false`, gdy opcjonalne podglądy lub filmy są niedostępne.

Obsługiwane rodzaje artefaktów:

- `timeline`: deterministyczny zrzut ekranu scenariusza, zwykle przed/po.
- `desktopScreenshot`: zrzut ekranu pulpitu VNC/przeglądarki.
- `motionPreview`: animowany GIF inline wygenerowany z nagrania pulpitu.
- `motionClip`: MP4 przycięte do ruchu, które usuwa statyczny wstęp i koniec.
- `fullVideo`: pełne nagranie MP4 do dogłębnej inspekcji.
- `metadata`: pomocniczy JSON/log.
- `report`: raport Markdown.

Wielokrotnego użytku publikator to `scripts/mantis/publish-pr-evidence.mjs`.
Workflowy wywołują go z manifestem, docelowym PR, katalogiem głównym docelowym
`qa-artifacts`, znacznikiem komentarza, adresem URL artefaktu Actions, adresem
URL uruchomienia i źródłem żądania. Kopiuje zadeklarowane artefakty do gałęzi
`qa-artifacts`, buduje komentarz PR zaczynający się od podsumowania, z obrazami
i podglądami inline oraz linkowanymi filmami, a następnie aktualizuje istniejący
komentarz ze znacznikiem albo tworzy nowy.

Możesz także uruchomić przebieg status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Uruchamia się tylko dla komentarzy pull
requestów od użytkowników z dostępem write, maintain lub admin i rozpoznaje tylko
żądania reakcji statusu Discord. Domyślnie używa znanej złej referencji bazowej i
bieżącego SHA nagłówka PR jako kandydata. Maintainerzy mogą nadpisać dowolną
referencję:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA można także wyzwolić z komentarza PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Domyślnie używa bieżącego SHA nagłówka PR jako kandydata i uruchamia
`telegram-status-command`. Maintainerzy mogą nadpisać `candidate=...`,
`provider=aws|hetzner` i `lease=<cbx_...>`, gdy potrzebują konkretnej referencji
lub wstępnie rozgrzanego pulpitu Crabbox.

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skupione na scenariuszu. Drugie może później
mapować PR lub issue na zalecane scenariusze Mantis na podstawie etykiet,
zmienionych plików i ustaleń z przeglądu ClawSweeper.

## Cykl życia uruchomienia

1. Pozyskaj poświadczenia.
2. Przydziel lub ponownie użyj VM.
3. Przygotuj profil pulpitu/przeglądarki, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czyste wyewidencjonowanie dla referencji bazowej.
5. Zainstaluj zależności i zbuduj tylko to, czego wymaga scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, dostawcę, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj gateway i zachowaj logi.
10. Przygotuj referencję kandydującą w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śledzenia.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzły komunikat statusu PR lub Discord.

Scenariusz powinien móc zakończyć się niepowodzeniem na dwa różne sposoby:

- **Błąd odtworzony**: baza nie powiodła się w oczekiwany sposób.
- **Awaria harnessa**: konfiguracja środowiska, poświadczenia, Discord API, przeglądarka lub
  dostawca nie powiodły się, zanim wyrocznia błędu miała znaczenie.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili
niestabilnego środowiska z zachowaniem produktu.

## Discord MVP

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach guild,
gdzie tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego jest dobrym zalążkiem Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy prawdziwy OpenClaw Gateway, autoryzację bota Discord, wysyłanie wiadomości,
  tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest wystarczająco wąski, aby pierwsza implementacja pozostała rzetelna.

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

Dowody bazowe powinny pokazywać reakcję potwierdzenia queued, ale bez przejścia
cyklu życia w trybie tool-only. Dowody kandydata powinny pokazywać działające
reakcje statusu cyklu życia, gdy `messages.statusReactions.enabled` jest jawnie
ustawione na true.

Wykonywalnym pierwszym wycinkiem jest opt-in scenariusz Discord live QA:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT ze stale włączoną obsługą guild, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` i jawnymi reakcjami statusu. Wyrocznia
odpytuje prawdziwą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej
sekwencji `👀 -> 🤔 -> 👍`. Artefakty obejmują
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` i
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące elementy QA

Mantis powinien budować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia ścieżkę Discord live z botami driver i
  SUT.
- Runner transportu live już zapisuje raporty i artefakty zaobserwowanych
  wiadomości w `.artifacts/qa-e2e/`.
- Dzierżawy poświadczeń Convex już zapewniają wyłączny dostęp do współdzielonych
  poświadczeń transportu live.
- Usługa sterowania przeglądarką już obsługuje zrzuty ekranu, snapshoty,
  zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera i magistralę do testowania o kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po nad tymi
elementami, plus jedna warstwa dowodów wizualnych.

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

`mantis-summary.json` powinien być maszynowo czytelnym źródłem prawdy. Raport
Markdown służy do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- przetestowane referencje i SHA
- transport i identyfikator scenariusza
- dostawcę maszyny oraz identyfikator maszyny lub identyfikator dzierżawy
- źródło poświadczeń bez wartości tajnych
- wynik bazowy
- wynik kandydata
- czy błąd odtworzono na bazie
- czy kandydat go naprawił
- ścieżki artefaktów
- zanonimizowane problemy konfiguracji lub czyszczenia

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości.
Dla publicznych PR preferuj linki do artefaktów GitHub Actions zamiast obrazów
inline, dopóki historia redakcji nie będzie silniejsza.

## Przeglądarka i VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a
  Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowe VNC**: włączane na tej samej VM, gdy logowanie, MFA,
  antyautomatyzacja Discord lub wizualne debugowanie wymaga człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby
unikać logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu
przeglądarki. Profil należy do puli maszyn Mantis, a nie do laptopa dewelopera.

Gdy Mantis utknie, publikuje komunikat statusu Discord z:

- identyfikator uruchomienia
- identyfikator scenariusza
- dostawca maszyny
- katalog artefaktów
- instrukcje połączenia VNC lub noVNC, jeśli są dostępne
- krótki opis blokady

Pierwsze prywatne wdrożenie może publikować te wiadomości w istniejącym kanale
operatora, a później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej zdalnej implementacji.
Crabbox zapewnia nam rozgrzane maszyny, śledzenie dzierżaw, hydrację, logi, wyniki i
czyszczenie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium obsługującą pulpit
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do ratowania
- Node 22 i pnpm
- checkout OpenClaw i pamięć podręczna zależności
- pamięć podręczna przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająca ilość CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera poświadczeń

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami poświadczeń lub
profilów przeglądarki.

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
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesłań artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Docelowo pula poświadczeń Convex powinna pozostać normalnym źródłem poświadczeń aktywnego
transportu. Sekrety GitHub inicjują brokera i ścieżki awaryjne.
Przepływ pracy reakcji statusu Discord mapuje sekrety Mantis Crabbox z powrotem na
zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`,
których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają
akceptowane jako awaryjny mechanizm zgodności.

Runner Mantis nigdy nie może wypisywać:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profilu uwierzytelniania
- haseł VNC
- surowych payloadów poświadczeń

Publiczne przesłania artefaktów powinny też redagować metadane celów Discord, takie jak identyfikatory bota,
gildii, kanału i wiadomości. Przepływ pracy smoke GitHub włącza
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` z tego powodu.

Jeśli token zostanie przypadkowo wklejony do issue, PR, czatu lub logu, obróć go
po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Przepływy pracy Mantis powinny przesyłać pełny pakiet dowodowy jako krótkotrwały artefakt Actions.
Gdy przepływ pracy jest uruchamiany dla zgłoszenia błędu lub PR z poprawką, powinien także
opublikować zredagowane zrzuty ekranu PNG do gałęzi `qa-artifacts` i uzupełnić lub utworzyć
komentarz w tym błędzie lub PR z poprawką, z osadzonymi zrzutami ekranu przed/po. Nie publikuj
głównego dowodu tylko w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane
wiadomości i inne duże dowody pozostają w artefakcie Actions.

Produkcyjne przepływy pracy powinny publikować te komentarze za pomocą Mantis GitHub App, a nie
za pomocą `github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety
GitHub Actions `MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Przepływ pracy używa ukrytego znacznika jako klucza uzupełniania, aktualizuje ten
komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy
starszy znacznik należący do bota nie może zostać edytowany.

Komentarz PR powinien być krótki i wizualny:

```md
QA reakcji statusu Discord Mantis

Podsumowanie: Mantis ponownie uruchomił zgłoszony błąd reakcji statusu Discord względem znanej
złej linii bazowej i kandydującej poprawki. Linia bazowa odtworzyła błąd, a
kandydat pokazał oczekiwaną sekwencję queued -> thinking -> done.

- Scenariusz: `discord-status-reactions-tool-only`
- Uruchomienie: <workflow run link>
- Artefakt: <artifact link>
- Linia bazowa: `<status>` przy `<sha>`
- Kandydat: `<status>` przy `<sha>`

| Linia bazowa        | Kandydat            |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Gdy uruchomienie kończy się niepowodzeniem, ponieważ harness zawiódł, komentarz musi to wskazać
zamiast sugerować, że kandydat zawiódł.

## Uwagi dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Discord Mantis. Użyj ponownie tej
aplikacji zamiast tworzyć kolejną, gdy ma odpowiednie uprawnienia bota
i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację
wdrożenia. Najpierw może wskazywać istniejący kanał maintainerów lub operacyjny,
a następnie zostać przeniesiony do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie identyfikatorów gildii, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC.
Przechowuj je w sekretach GitHub, brokerze poświadczeń lub lokalnym magazynie sekretów
operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- id i tytuł
- transport
- wymagane poświadczenia
- politykę ref linii bazowej
- politykę ref kandydata
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwaną wyrocznię linii bazowej
- oczekiwaną wyrocznię kandydata
- cele przechwytywania wizualnego
- budżet limitu czasu
- kroki czyszczenia

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- ts wątku Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości e-mail i nagłówki dla błędów e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym elementem

Kontrole wizyjne powinny być dodatkiem. Jeśli API platformy może udowodnić błąd, użyj
API jako wyroczni zaliczenia/niezaliczenia i zachowaj zrzuty ekranu dla zaufania człowieka.

## Rozszerzanie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, przesyłanie plików.
- E-mail: uwierzytelnianie Gmail i wątkowanie wiadomości przy użyciu `gog`, gdy konektory nie
  wystarczają.
- WhatsApp: logowanie QR, ponowną identyfikację, dostarczanie wiadomości, media, reakcje.
- Telegram: bramkowanie wzmianek grupowych, polecenia, reakcje, gdy są dostępne.
- Matrix: szyfrowane pokoje, relacje wątku lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke i jeden lub więcej scenariuszy klas
błędów. Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Pytania otwarte

- Który bot Discord powinien być sterownikiem, a który SUT, gdy istniejący bot
  Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego,
  czy w pierwszej fazie wyłącznie dowodów REST czytelnych dla bota?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem dla publicznych PR?
