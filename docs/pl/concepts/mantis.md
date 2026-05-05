---
read_when:
    - Tworzenie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania ściągnięcia
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych
    - Debugowanie przebiegów QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu przez VNC
summary: Mantis jest wizualnym systemem kompleksowej weryfikacji do odtwarzania błędów OpenClaw na aktywnych transportach, przechwytywania dowodów sprzed zmiany i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-05T08:25:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów, które wymagają rzeczywistego
środowiska runtime, rzeczywistego transportu i widocznego dowodu. Uruchamia scenariusz względem znanego
złego refa, przechwytuje dowody, uruchamia ten sam scenariusz względem kandydującego refa i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR-a lub
z lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszą ścieżkę o wysokiej wartości:
rzeczywiste uwierzytelnianie bota, rzeczywiste kanały guild, reakcje, wątki, natywne polecenia i
interfejs przeglądarkowy, w którym ludzie mogą wizualnie potwierdzić to, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR-a GitHub z takim samym kształtem transportu, jaki widzą użytkownicy.
- Przechwycić artefakt **przed** na bazowym refie przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na kandydującym refie po zastosowaniu poprawki.
- Używać deterministycznej wyroczni, gdy tylko to możliwe, takiej jak odczyt reakcji przez Discord REST
  lub sprawdzenie transkrypcji kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczający stan maszyny do ratunkowego VNC, gdy logowanie, automatyzacja przeglądarki lub
  uwierzytelnianie providera się zablokuje.
- Publikować zwięzły status na operatorskim kanale Discord, gdy uruchomienie jest zablokowane,
  wymaga ręcznej pomocy przez VNC albo się kończy.

## Poza zakresem

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis zwykle powinno zostać
  przekształcone w mniejszy test regresji po zrozumieniu poprawki.
- Mantis nie jest zwykłą szybką bramką CI. Jest wolniejszy, używa poświadczeń live i
  jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka do normalnego działania. Ręczne VNC to ścieżka ratunkowa,
  nie ścieżka domyślna.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw odpowiada za runtime scenariuszy, adaptery transportu, schemat dowodów i
  lokalne CLI pod `pnpm openclaw qa mantis`.
- QA Lab odpowiada za elementy harnessu transportu live, pomocniki przechwytywania przeglądarki i
  zapis artefaktów.
- Crabbox odpowiada za rozgrzane maszyny Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions odpowiada za zdalny punkt wejścia workflow i retencję artefaktów.
- ClawSweeper odpowiada za routing komentarzy GitHub: parsowanie poleceń maintainerów,
  wywoływanie workflow i publikowanie końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania,
  debugowania lub raportowania stanu zablokowania.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w
Crabbox, a klej workflow maintainerów w ClawSweeper.

## Forma polecenia

Pierwsze lokalne polecenie weryfikuje bota Discord, guild, kanał, wysyłkę wiadomości,
wysyłkę reakcji i ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po przyjmuje tę formę:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone worktree bazowe i kandydujące pod katalogiem wyjściowym,
instaluje zależności, buduje każdy ref, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord udana weryfikacja
oznacza, że status baseline to `fail`, a status candidate to `pass`.

Pierwszą prymitywną operacją VM/przeglądarki jest smoke pulpitu:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi albo ponownie używa maszyny desktopowej Crabbox, uruchamia widoczną przeglądarkę w
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego
i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa
providera Hetzner, ponieważ jest to pierwszy provider z działającym pokryciem desktop/VNC
w ścieżce Mantis. Nadpisz go za pomocą `--provider`, `--crabbox-bin` lub
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` podczas uruchamiania względem innej floty Crabbox.

Przydatne flagi smoke pulpitu:

- `--lease-id <cbx_...>` lub `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje lokalny dla repo artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwycenia wygenerowanej osi czasu reakcji statusu Discord przez rzeczywisty desktop Crabbox.
- `--keep-lease` lub `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną, zakończoną powodzeniem dzierżawę otwartą do inspekcji przez VNC. Nieudane uruchomienia domyślnie utrzymują dzierżawę, jeśli została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny i czas życia dzierżawy.

Pierwszą pełną prymitywną operacją transportu desktopowego jest Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi albo ponownie używa maszyny desktopowej Crabbox, synchronizuje bieżący checkout do
VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce
VNC, przechwytuje widoczny pulpit i kopiuje zarówno artefakty Slack QA, jak i
zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwsza forma Mantis,
w której SUT OpenClaw Gateway i przeglądarka działają w tej samej desktopowej VM
Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw`, patchuje konfigurację Slack Socket Mode
dla wybranego kanału, uruchamia `openclaw gateway run` na porcie
`38973` i utrzymuje Chrome uruchomiony w sesji VNC. To tryb „zostaw mi
pulpit Linux ze Slackiem i działającym claw”; ścieżka Slack QA bot-to-bot
pozostaje domyślna, gdy `--gateway-setup` jest pominięte.

Wymagane dane wejściowe dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu. Jeśli lokalnie ustawione jest tylko
  `OPENAI_API_KEY`, Mantis mapuje je na `OPENCLAW_LIVE_OPENAI_KEY`
  przed wywołaniem Crabbox, aby forwarding env `OPENCLAW_*` Crabbox mógł przenieść je
  do VM.

Przydatne flagi Slack desktop:

- `--lease-id <cbx_...>` ponownie uruchamia względem maszyny, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały OpenClaw Slack Gateway w VM zamiast wyłącznie uruchamiać ścieżkę QA bot-to-bot.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez tego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlistę kanałów Slack używaną przez konfigurację Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślnie jest to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie do Slack Web przetrwa ponowne uruchomienia na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli poświadczeń zamiast bezpośrednich tokenów env Slack.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do ścieżki live Slack.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po
dla pierwszego rzeczywistego scenariusza to `Mantis Discord Status Reactions`. Przyjmuje:

- `baseline_ref`: ref, który ma odtworzyć zachowanie tylko queued.
- `candidate_ref`: ref, który ma pokazać `queued -> thinking -> done`.

Wykonuje checkout refa harnessu workflow, buduje osobne worktree bazowe i kandydujące,
uruchamia `discord-status-reactions-tool-only` względem każdego worktree i
wysyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions. Renderuje też HTML osi czasu każdej ścieżki w desktopowej przeglądarce
Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych
PNG osi czasu w komentarzu PR. Ten sam komentarz PR osadza lekkie
podglądy GIF przycięte do ruchu, wygenerowane przez `crabbox media preview`, linkuje do
odpowiadających im klipów MP4 przyciętych do ruchu i zachowuje pełne pliki MP4 pulpitu do głębokiej
inspekcji. Zrzuty ekranu pozostają osadzone do szybkiego przeglądu. Workflow buduje
CLI Crabbox z
`openclaw/crabbox` main, aby mógł użyć bieżących flag dzierżawy desktop/przeglądarka
przed wydaniem następnej binarki Crabbox.

`Mantis Scenario` to ogólny ręczny punkt wejścia. Przyjmuje `scenario_id`,
`candidate_ref`, opcjonalny `baseline_ref` i opcjonalny `pr_number`, a następnie
wywołuje workflow należący do scenariusza. Wrapper jest celowo cienki:
workflow scenariuszy nadal odpowiadają za własną konfigurację transportu, poświadczenia, klasę VM,
oczekiwaną wyrocznię i manifest artefaktów.

`Mantis Slack Desktop Smoke` to pierwszy workflow Slack VM. Wykonuje checkout
zaufanego refa kandydata w osobnym worktree, dzierżawi desktop Linux Crabbox,
uruchamia `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` względem tego
kandydata, otwiera Slack Web w przeglądarce VNC, nagrywa pulpit, generuje
podgląd przycięty do ruchu za pomocą `crabbox media preview`, wysyła pełny katalog
artefaktów i opcjonalnie publikuje osadzony komentarz dowodowy na docelowym PR.
Użyj tej ścieżki, gdy chcesz „pulpit Linux ze Slackiem i działającym claw”
zamiast tylko transkrypcji Slack bot-to-bot.

Każdy scenariusz publikujący do PR zapisuje `mantis-evidence.json` obok swojego raportu.
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

Wartości `path` artefaktów są względne wobec katalogu manifestu. Wartości `targetPath`
to ścieżki względne pod katalogiem publikacji gałęzi `qa-artifacts`.
Publisher odrzuca path traversal i pomija wpisy oznaczone
`"required": false`, gdy opcjonalne podglądy lub wideo są niedostępne.

Obsługiwane rodzaje artefaktów:

- `timeline`: deterministyczny zrzut ekranu scenariusza, zwykle przed/po.
- `desktopScreenshot`: zrzut ekranu pulpitu VNC/przeglądarki.
- `motionPreview`: osadzony animowany GIF wygenerowany z nagrania pulpitu.
- `motionClip`: MP4 przycięty do ruchu, który usuwa statyczny początek i koniec.
- `fullVideo`: pełne nagranie MP4 do głębokiej inspekcji.
- `metadata`: boczny plik JSON/log.
- `report`: raport Markdown.

Wielokrotnego użytku publisher to `scripts/mantis/publish-pr-evidence.mjs`. Workflow
wywołują go z manifestem, docelowym PR, katalogiem głównym targetu `qa-artifacts`, markerem komentarza,
URL-em artefaktu Actions, URL-em uruchomienia i źródłem żądania. Kopiuje zadeklarowane artefakty
do gałęzi `qa-artifacts`, buduje komentarz PR z podsumowaniem na początku i osadzonymi
obrazami/podglądami oraz linkowanymi wideo, a następnie aktualizuje istniejący komentarz z markerem albo
tworzy nowy.

Możesz też uruchomić status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Uruchamia się tylko na komentarzach pull requestów
od użytkowników z dostępem write, maintain lub admin i rozpoznaje tylko
żądania reakcji statusu Discord. Domyślnie używa znanego złego refa bazowego
i bieżącego SHA head PR jako kandydata. Maintainerzy mogą nadpisać dowolny
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skoncentrowane na scenariuszu. Drugie może później mapować PR lub zgłoszenie na zalecane scenariusze Mantis na podstawie etykiet, zmienionych plików i ustaleń z przeglądu ClawSweeper.

## Cykl Uruchomienia

1. Uzyskaj dane uwierzytelniające.
2. Przydziel lub użyj ponownie VM.
3. Przygotuj profil pulpitu/przeglądarki, gdy scenariusz wymaga dowodów z UI.
4. Przygotuj czyste checkout dla referencji bazowej.
5. Zainstaluj zależności i zbuduj tylko to, czego wymaga scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, dostawcę, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj Gateway i zachowaj logi.
10. Przygotuj referencję kandydującą w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śladu.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzły komunikat statusu w PR lub Discord.

Scenariusz powinien móc zakończyć się niepowodzeniem na dwa różne sposoby:

- **Błąd odtworzony**: wariant bazowy nie powiódł się w oczekiwany sposób.
- **Awaria uprzęży**: konfiguracja środowiska, dane uwierzytelniające, Discord API, przeglądarka lub dostawca zawiodły, zanim wyrocznia błędu miała znaczenie.

Raport końcowy musi oddzielać te przypadki, aby opiekunowie nie mylili niestabilnego środowiska z zachowaniem produktu.

## MVP Discord

Pierwszy scenariusz powinien dotyczyć reakcji statusu Discord w kanałach gildii, gdzie tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego jest to dobry zalążek Mantis:

- Jest widoczny w Discord jako reakcje na wiadomość wyzwalającą.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy rzeczywisty OpenClaw Gateway, uwierzytelnianie bota Discord, wysyłanie wiadomości, tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest wystarczająco wąski, aby utrzymać pierwszą implementację w uczciwych granicach.

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

Dowody bazowe powinny pokazać zakolejkowaną reakcję potwierdzenia, ale brak przejścia cyklu życia w trybie tylko narzędziowym. Dowody kandydata powinny pokazać działające reakcje statusu cyklu życia, gdy `messages.statusReactions.enabled` ma jawnie wartość true.

Pierwszy wykonywalny wycinek to opcjonalny scenariusz Discord live QA:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT z zawsze włączoną obsługą gildii, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` i jawnymi reakcjami statusu. Wyrocznia odpytuje rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji `👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` i `discord-status-reactions-tool-only-timeline.png`.

## Istniejące Elementy QA

Mantis powinien bazować na istniejącym prywatnym stosie QA zamiast zaczynać od zera:

- `pnpm openclaw qa discord` uruchamia już ścieżkę live Discord z botami sterownika i SUT.
- Runner transportu live zapisuje już raporty i artefakty zaobserwowanych wiadomości w `.artifacts/qa-e2e/`.
- Dzierżawy danych uwierzytelniających Convex zapewniają już wyłączny dostęp do współdzielonych danych uwierzytelniających transportu live.
- Usługa sterowania przeglądarką obsługuje już zrzuty ekranu, migawki, zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera i magistralę do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po na tych elementach oraz jedną warstwą dowodów wizualnych.

## Model Dowodów

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

`mantis-summary.json` powinien być maszynowo czytelnym źródłem prawdy. Raport Markdown służy do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- testowane referencje i SHA
- transport i id scenariusza
- dostawcę maszyny oraz id maszyny lub id dzierżawy
- źródło danych uwierzytelniających bez wartości sekretów
- wynik bazowy
- wynik kandydata
- czy błąd został odtworzony na wariancie bazowym
- czy kandydat go naprawił
- ścieżki artefaktów
- oczyszczone problemy konfiguracji lub sprzątania

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji: mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. Dla publicznych PR-ów preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji nie będzie mocniejsza.

## Przeglądarka I VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunek VNC**: włączony na tej samej VM, gdy logowanie, MFA, zabezpieczenia Discord przed automatyzacją lub debugowanie wizualne wymagają człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby uniknąć logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil należy do puli maszyn Mantis, nie do laptopa dewelopera.

Gdy Mantis utknie, publikuje komunikat statusu Discord z:

- id uruchomienia
- id scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim tekstem blokera

Pierwsze prywatne wdrożenie może publikować te komunikaty w istniejącym kanale operatorów, a później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej implementacji zdalnej. Crabbox daje nam rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i sprzątanie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z pulpitem
- dostęp CDP dla automatyzacji przeglądarki
- VNC lub noVNC do ratunku
- Node 22 i pnpm
- checkout OpenClaw i cache zależności
- cache przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera danych uwierzytelniających

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami danych uwierzytelniających lub profili przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji lub repozytorium GitHub dla uruchomień zdalnych oraz w lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesyłań artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Długoterminowo pula danych uwierzytelniających Convex powinna pozostać normalnym źródłem danych uwierzytelniających transportu live. Sekrety GitHub bootstrapują brokera i ścieżki awaryjne. Workflow reakcji statusu Discord mapuje sekrety Mantis Crabbox z powrotem na zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`, których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają akceptowane jako awaryjna kompatybilność.

Runner Mantis nigdy nie może wypisywać:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych ładunków danych uwierzytelniających

Publiczne przesyłanie artefaktów powinno także redagować metadane celu Discord, takie jak id botów, gildii, kanałów i wiadomości. Workflow smoke GitHub włącza z tego powodu `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Jeśli token zostanie przypadkowo wklejony do zgłoszenia, PR, czatu lub logu, obróć go po zapisaniu nowego sekretu.

## Artefakty GitHub I Komentarze PR

Workflow Mantis powinny przesyłać pełny pakiet dowodów jako krótkotrwały artefakt Actions. Gdy workflow jest uruchamiany dla raportu błędu lub PR z poprawką, powinien także publikować zredagowane zrzuty ekranu PNG do gałęzi `qa-artifacts` i aktualizować albo wstawiać komentarz w tym błędzie lub PR z poprawką z obrazami przed/po inline. Nie publikuj podstawowego dowodu wyłącznie w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Workflow produkcyjne powinny publikować te komentarze za pomocą Mantis GitHub App, a nie jako `github-actions[bot]`. Przechowuj id aplikacji i klucz prywatny jako sekrety GitHub Actions `MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow używa ukrytego znacznika jako klucza upsert, aktualizuje ten komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy starszego znacznika należącego do bota nie da się edytować.

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

Gdy uruchomienie nie powiedzie się, ponieważ zawiodła uprząż, komentarz musi to powiedzieć zamiast sugerować, że kandydat zawiódł.

## Uwagi Dotyczące Prywatnego Wdrożenia

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej aplikacji zamiast tworzyć kolejną, gdy ma właściwe uprawnienia bota i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia. Może najpierw wskazywać istniejący kanał opiekunów lub operacyjny, a następnie przenieść się do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie id gildii, id kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC. Przechowuj je w sekretach GitHub, brokerze danych uwierzytelniających lub lokalnym magazynie sekretów operatora.

## Dodawanie Scenariusza

Scenariusz Mantis powinien deklarować:

- id i tytuł
- transport
- wymagane dane uwierzytelniające
- politykę referencji bazowej
- politykę referencji kandydującej
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwaną wyrocznię bazową
- oczekiwaną wyrocznię kandydata
- cele przechwytywania wizualnego
- budżet czasu oczekiwania
- kroki sprzątania

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- ts wątku Slack i stan API reakcji dla błędów Slack
- id wiadomości e-mail i nagłówki dla błędów e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedyną wiarygodną obserwacją

Kontrole wizyjne powinny być dodatkiem. Jeśli API platformy może udowodnić błąd, użyj API jako wyroczni sukcesu/porażki i zachowaj zrzuty ekranu dla pewności człowieka.

## Rozszerzanie Dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki o aplikacji, okna modalne, przesyłanie plików.
- Email: uwierzytelnianie Gmaila i wątki wiadomości przy użyciu `gog`, gdy konektory nie
  wystarczają.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, multimedia, reakcje.
- Telegram: bramkowanie wzmianek w grupach, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke oraz jeden lub więcej
scenariuszy klas błędów. Kosztowne scenariusze wizualne powinny pozostać włączane opcjonalnie.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który SUT, gdy ponownie używany jest
  istniejący bot Mantis?
- Czy logowanie przeglądarki obserwatora w pierwszej fazie powinno używać ludzkiego konta Discord, konta testowego,
  czy tylko dowodów REST możliwych do odczytu przez bota?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR-ów?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie maintenera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem dla publicznych PR-ów?
