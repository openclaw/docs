---
read_when:
    - Tworzenie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania ściągnięcia
    - Dodawanie scenariuszy dla Discord, Slack, WhatsApp lub innych transportów w czasie rzeczywistym
    - Debugowanie uruchomień QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu przez VNC
summary: Mantis to wizualny system weryfikacji end-to-end służący do odtwarzania błędów OpenClaw w aktywnych transportach, przechwytywania dowodów przed zmianą i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-06T09:08:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów wymagających prawdziwego środowiska uruchomieniowego, prawdziwego transportu i widocznego dowodu. Uruchamia scenariusz względem znanego wadliwego refa, przechwytuje dowody, uruchamia ten sam scenariusz względem refa kandydującego i publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR-a lub z polecenia lokalnego.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszą ścieżkę o wysokiej wartości: prawdziwe uwierzytelnianie bota, prawdziwe kanały gildii, reakcje, wątki, polecenia natywne oraz interfejs przeglądarkowy, w którym ludzie mogą wizualnie potwierdzić to, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR-a GitHub z tym samym kształtem transportu, który widzą użytkownicy.
- Przechwycić artefakt **przed** na refie bazowym przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na refie kandydującym po zastosowaniu poprawki.
- Użyć deterministycznego oracle zawsze, gdy to możliwe, na przykład odczytu reakcji przez Discord REST albo sprawdzenia transkrypcji kanału.
- Przechwycić zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta oraz zdalnie z GitHub.
- Zachować wystarczający stan maszyny do ratowania przez VNC, gdy logowanie, automatyzacja przeglądarki lub uwierzytelnianie dostawcy się zablokują.
- Publikować zwięzły status w kanale operatora Discord, gdy uruchomienie jest zablokowane, wymaga ręcznej pomocy przez VNC albo się kończy.

## Poza zakresem

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis zwykle powinno stać się mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest normalną szybką bramką CI. Jest wolniejszy, używa żywych danych uwierzytelniających i jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka do normalnego działania. Ręczne VNC to ścieżka ratunkowa, nie ścieżka standardowa.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów i lokalnego CLI w `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem elementów harnessu transportu live, helperów przechwytywania przeglądarki i writerów artefaktów.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów, dispatchowania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania, debugowania lub raportowania stanu zablokowania.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, harmonogramowanie maszyn w Crabbox, a klej workflow maintainerów w ClawSweeper.

## Kształt polecenia

Pierwsze polecenie lokalne weryfikuje bota Discord, gildię, kanał, wysyłanie wiadomości, wysyłanie reakcji i ścieżkę artefaktów:

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

Runner tworzy odłączone worktree bazowe i kandydujące w katalogu wyjściowym, instaluje zależności, buduje każdy ref, uruchamia scenariusz z `--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json` i `mantis-report.md`. Dla pierwszego scenariusza Discord pomyślna weryfikacja oznacza, że status bazowy to `fail`, a status kandydata to `pass`.

Drugi probe Discord przed/po celuje w załączniki wątków:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Ten scenariusz publikuje wiadomość nadrzędną za pomocą bota sterującego, tworzy prawdziwy wątek Discord, wywołuje akcję `message.thread-reply` OpenClaw z repozytoryjnym `filePath`, a następnie odpytuje wątek o odpowiedź SUT i nazwę pliku załącznika. Zrzut ekranu bazowy pokazuje odpowiedź bez załącznika; zrzut ekranu kandydata pokazuje oczekiwany załącznik `mantis-thread-report.md`.

Pierwszy prymityw VM/przeglądarki to smoke pulpitu:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi albo ponownie używa desktopowej maszyny Crabbox, uruchamia widoczną przeglądarkę w sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa dostawcy Hetzner, ponieważ jest to pierwszy dostawca z działającym pokryciem desktop/VNC w ścieżce Mantis. Nadpisz go za pomocą `--provider`, `--crabbox-bin` lub `OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz względem innej floty Crabbox.

Przydatne flagi smoke pulpitu:

- `--lease-id <cbx_...>` albo `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje repozytoryjny artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwytywania wygenerowanej osi czasu reakcji statusu Discord przez prawdziwy desktop Crabbox.
- `--browser-profile-dir <remote-path>` ponownie używa zdalnego Chrome user-data-dir, aby trwały desktop Mantis mógł pozostać zalogowany między uruchomieniami. Używaj tego dla długowiecznego profilu podglądu Discord Web.
- `--browser-profile-archive-env <name>` przywraca archiwum `.tgz` Chrome user-data-dir w base64 z nazwanej zmiennej środowiskowej przed uruchomieniem przeglądarki. Używaj tego dla zalogowanych świadków, takich jak Discord Web. Domyślna zmienna env to `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` kontroluje długość przechwytywania MP4. Użyj dłuższego czasu trwania dla wolnych zalogowanych aplikacji webowych, które potrzebują czasu na ustabilizowanie.
- `--keep-lease` albo `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną, przechodzącą dzierżawę otwartą do inspekcji przez VNC. Nieudane uruchomienia domyślnie utrzymują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny oraz czas życia dzierżawy.

Dla dowodów Discord Web Mantis używa dedykowanego konta podglądu zamiast tokena bota. Scenariusz live Discord API pozostaje oracle: tworzy prawdziwy wątek, wysyła `thread-reply` SUT i sprawdza załącznik przez Discord REST. Gdy ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenariusz zapisuje też artefakt URL Discord Web. Gdy ustawiono `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, pozostawia ten wątek dostępny wystarczająco długo, aby zalogowana przeglądarka mogła go otworzyć i nagrać.

Workflow GitHub otwiera URL wątku kandydata w Discord Web, przechwytuje zrzut ekranu, nagrywa MP4 i generuje przycięty podgląd GIF, gdy narzędzia multimedialne Crabbox są dostępne. Preferuj trwałą ścieżkę profilu podglądu skonfigurowaną przez `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, ponieważ pełne archiwa profili Chrome mogą przekroczyć limit rozmiaru sekretu GitHub. Dla małych/bootstrapowych profili workflow może też przywrócić archiwum `.tgz` w base64 z `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jeśli żadne źródło profilu nie jest skonfigurowane, workflow nadal publikuje deterministyczne zrzuty ekranu załączników bazowego/kandydata i zapisuje powiadomienie, że zalogowany świadek Discord Web został pominięty.

Pierwszy pełny prymityw transportu desktopowego to smoke pulpitu Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi albo ponownie używa desktopowej maszyny Crabbox, synchronizuje bieżący checkout do VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce VNC, przechwytuje widoczny pulpit i kopiuje zarówno artefakty Slack QA, jak i zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis, w którym Gateway OpenClaw SUT i przeglądarka znajdują się w tej samej desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy katalog domowy OpenClaw w `$HOME/.openclaw-mantis/slack-openclaw`, patchuje konfigurację Slack Socket Mode dla wybranego kanału, uruchamia `openclaw gateway run` na porcie `38973` i pozostawia Chrome działający w sesji VNC. To tryb „zostaw mi desktop Linux ze Slack i działającym claw”; ścieżka Slack QA bot-to-bot pozostaje domyślna, gdy `--gateway-setup` jest pominięte.

Wymagane dane wejściowe dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu. Jeśli lokalnie ustawiono tylko `OPENAI_API_KEY`, Mantis mapuje go na `OPENCLAW_LIVE_OPENAI_KEY` przed wywołaniem Crabbox, aby przekazywanie env `OPENCLAW_*` Crabbox mogło przenieść go do VM.

Z `--gateway-setup --credential-source convex` Mantis dzierżawi dane uwierzytelniające Slack SUT ze współdzielonej puli przed utworzeniem VM i przekazuje wydzierżawiony identyfikator kanału, token aplikacji Socket Mode oraz token bota jako runtime env `OPENCLAW_MANTIS_SLACK_*` wewnątrz desktopu. Dzięki temu workflow GitHub pozostają cienkie: potrzebują tylko sekretu brokera Convex, nie surowych tokenów bota Slack ani aplikacji.

Przydatne flagi pulpitu Slack:

- `--lease-id <cbx_...>` uruchamia ponownie względem maszyny, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały Gateway Slack OpenClaw w VM zamiast wyłącznie uruchamiać ścieżkę QA bot-to-bot.
- `--keep-lease` utrzymuje VM Gateway otwartą do inspekcji VNC po sukcesie; `--no-keep-lease` zatrzymuje ją po zebraniu artefaktów.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez niego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlistę kanałów Slack używaną przez konfigurację Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślnie to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie Slack Web przetrwa ponowne uruchomienia na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli danych uwierzytelniających zamiast bezpośrednich tokenów env Slack.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do ścieżki live Slack.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po dla pierwszego prawdziwego scenariusza to `Mantis Discord Status Reactions`. Akceptuje:

- `baseline_ref`: ref, który ma odtworzyć zachowanie wyłącznie queued.
- `candidate_ref`: ref, który ma pokazać `queued -> thinking -> done`.

Checkoutuje ref harnessu workflow, buduje oddzielne worktree bazowe i kandydujące, uruchamia `discord-status-reactions-tool-only` względem każdego worktree i przesyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako artefakty Actions. Renderuje też HTML osi czasu każdej ścieżki w przeglądarce desktopowej Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych PNG osi czasu w komentarzu PR. Ten sam komentarz PR osadza lekkie, przycięte ruchem podglądy GIF wygenerowane przez `crabbox media preview`, linkuje do odpowiadających im przyciętych ruchem klipów MP4 i zachowuje pełne desktopowe pliki MP4 do głębokiej inspekcji. Zrzuty ekranu pozostają inline do szybkiej recenzji. Workflow buduje CLI Crabbox z `openclaw/crabbox` main, aby mógł używać bieżących flag dzierżawy desktop/przeglądarka, zanim zostanie wydane następne binarium Crabbox.

`Mantis Scenario` to ogólny ręczny punkt wejścia. Przyjmuje `scenario_id`, `candidate_ref`, opcjonalne `baseline_ref` i opcjonalne `pr_number`, a następnie dispatchuje workflow należący do scenariusza. Wrapper jest celowo cienki: workflow scenariuszy nadal są właścicielami konfiguracji transportu, danych uwierzytelniających, klasy VM, oczekiwanego oracle i manifestu artefaktów.

`Mantis Slack Desktop Smoke` to pierwszy workflow Slack VM. Pobiera zaufany ref kandydata w osobnym worktree, dzierżawi pulpit Linux przez Crabbox, uruchamia `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` względem tego kandydata, otwiera Slack Web w przeglądarce VNC, nagrywa pulpit, generuje podgląd przycięty do ruchu za pomocą `crabbox media preview`, przesyła pełny katalog artefaktów i opcjonalnie publikuje w docelowym PR komentarz z dowodami inline. Domyślnie używa AWS do dzierżawy pulpitu i udostępnia ręczne wejście dostawcy, aby operatorzy mogli przełączyć się na Hetzner, gdy pojemność AWS jest wolna lub niedostępna. Użyj tej ścieżki, gdy chcesz „pulpit Linux ze Slackiem i działającym claw” zamiast wyłącznie transkryptu Slack bot-do-bota.

Każdy scenariusz publikujący PR zapisuje `mantis-evidence.json` obok swojego raportu. Ten schemat jest przekazaniem między kodem scenariusza a komentarzami GitHub:

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

Wartości `path` artefaktów są względne względem katalogu manifestu. Wartości `targetPath` to ścieżki względne pod katalogiem publikacji gałęzi `qa-artifacts`. Publisher odrzuca przechodzenie poza katalog i pomija wpisy oznaczone jako `"required": false`, gdy opcjonalne podglądy lub filmy są niedostępne.

Obsługiwane rodzaje artefaktów:

- `timeline`: deterministyczny zrzut ekranu scenariusza, zwykle przed/po.
- `desktopScreenshot`: zrzut ekranu pulpitu VNC/przeglądarki.
- `motionPreview`: animowany GIF inline wygenerowany z nagrania pulpitu.
- `motionClip`: MP4 przycięty do ruchu, który usuwa statyczny wstęp i końcówkę.
- `fullVideo`: pełne nagranie MP4 do szczegółowej inspekcji.
- `metadata`: plik pomocniczy JSON/logu.
- `report`: raport Markdown.

Wielorazowy publisher to `scripts/mantis/publish-pr-evidence.mjs`. Workflow wywołują go z manifestem, docelowym PR, docelowym katalogiem głównym `qa-artifacts`, markerem komentarza, URL-em artefaktu Actions, URL-em uruchomienia i źródłem żądania. Kopiuje zadeklarowane artefakty do gałęzi `qa-artifacts`, buduje komentarz PR zaczynający się od podsumowania z obrazami/podglądami inline i podlinkowanymi filmami, a następnie aktualizuje istniejący komentarz z markerem lub tworzy nowy.

Możesz też uruchomić przebieg status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Uruchamia się tylko dla komentarzy pull requestów od użytkowników z dostępem write, maintain lub admin i rozpoznaje tylko żądania Discord status-reaction. Domyślnie używa znanego złego refa bazowego oraz bieżącego SHA nagłówka PR jako kandydata. Maintainerzy mogą nadpisać dowolny ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skupione na scenariuszu. Drugie może później mapować PR lub issue na zalecane scenariusze Mantis na podstawie etykiet, zmienionych plików i ustaleń przeglądu ClawSweeper.

## Cykl życia uruchomienia

1. Pozyskaj dane uwierzytelniające.
2. Przydziel lub wykorzystaj ponownie VM.
3. Przygotuj profil pulpitu/przeglądarki, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla refa bazowego.
5. Zainstaluj zależności i zbuduj tylko to, czego potrzebuje scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj live transport, dostawcę, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj Gateway i zachowaj logi.
10. Przygotuj ref kandydata w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty trace.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzły komunikat statusu PR lub Discord.

Scenariusz powinien móc zakończyć się niepowodzeniem na dwa różne sposoby:

- **Błąd odtworzony**: wariant bazowy zawiódł w oczekiwany sposób.
- **Awaria harnessa**: konfiguracja środowiska, dane uwierzytelniające, Discord API, przeglądarka lub dostawca zawiodły, zanim wyrocznia błędu miała sens.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili niestabilnego środowiska z zachowaniem produktu.

## MVP Discorda

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach guild, gdzie tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego to dobry zalążek Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy prawdziwy OpenClaw Gateway, uwierzytelnianie bota Discord, wysyłanie wiadomości, tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
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

Dowody bazowe powinny pokazywać reakcję potwierdzenia queued, ale bez przejścia cyklu życia w trybie tool-only. Dowody kandydata powinny pokazywać działające reakcje statusu cyklu życia, gdy `messages.statusReactions.enabled` jest jawnie ustawione na true.

Pierwszy wykonywalny wycinek to opcjonalny scenariusz live QA Discord:

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
"message_tool"`, `ackReaction: "👀"` i jawnymi reakcjami statusu. Wyrocznia odpytuje prawdziwą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji `👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` i `discord-status-reactions-tool-only-timeline.png`.

## Istniejące elementy QA

Mantis powinien budować na istniejącym prywatnym stosie QA zamiast zaczynać od zera:

- `pnpm openclaw qa discord` już uruchamia live ścieżkę Discord z botami driver i SUT.
- Live transport runner już zapisuje raporty i artefakty observed-message pod `.artifacts/qa-e2e/`.
- Dzierżawy danych uwierzytelniających Convex już zapewniają wyłączny dostęp do współdzielonych danych uwierzytelniających live transport.
- Usługa sterowania przeglądarką już obsługuje zrzuty ekranu, snapshoty, headless zarządzane profile i zdalne profile CDP.
- QA Lab ma już UI debuggera i bus do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po na tych elementach plus jedną warstwą dowodów wizualnych.

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

`mantis-summary.json` powinien być maszynowo odczytywalnym źródłem prawdy. Raport Markdown jest przeznaczony do komentarzy PR i przeglądu przez człowieka.

Podsumowanie musi zawierać:

- testowane refy i SHA
- transport i id scenariusza
- dostawcę maszyny oraz id maszyny lub id dzierżawy
- źródło danych uwierzytelniających bez wartości sekretów
- wynik bazowy
- wynik kandydata
- informację, czy błąd odtworzono na wariancie bazowym
- informację, czy kandydat go naprawił
- ścieżki artefaktów
- oczyszczone problemy konfiguracji lub sprzątania

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji: mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. W publicznych PR preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji nie będzie mocniejsza.

## Przeglądarka i VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowy VNC**: włączony na tej samej VM, gdy logowanie, MFA, mechanizmy antyautomatyzacyjne Discord lub debugowanie wizualne wymagają człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby unikać logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil należy do puli maszyn Mantis, nie do laptopa dewelopera.

Gdy Mantis utknie, publikuje komunikat statusu Discord z:

- id uruchomienia
- id scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim tekstem blokera

Pierwsze prywatne wdrożenie może publikować te komunikaty w istniejącym kanale operatorów i później przenieść się do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej implementacji zdalnej. Crabbox daje nam rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i sprzątanie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z pulpitem
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do ratunku
- Node 22 i pnpm
- checkout OpenClaw i cache zależności
- cache przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająca ilość CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego przebiegu modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera danych uwierzytelniających

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami danych uwierzytelniających lub profili przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji GitHub lub repozytorium dla uruchomień zdalnych oraz w lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesyłanych artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Docelowo pula danych uwierzytelniających Convex powinna pozostać normalnym źródłem danych uwierzytelniających live transport. Sekrety GitHub inicjalizują brokera i ścieżki fallback. Workflow Discord status-reactions mapuje sekrety Mantis Crabbox z powrotem na zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`, których oczekuje CLI Crabbox. Proste nazwy sekretów GitHub `CRABBOX_*` pozostają akceptowane jako fallback zgodności.

Runner Mantis nigdy nie może drukować:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych ładunków danych uwierzytelniających

Publiczne przesyłanie artefaktów powinno także redagować metadane celu Discord, takie jak id botów, guild, kanałów i wiadomości. Workflow smoke GitHub włącza z tego powodu `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Jeśli token zostanie przypadkowo wklejony do issue, PR, czatu lub logu, obróć go po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Przepływy pracy Mantis powinny przesyłać pełny pakiet dowodów jako krótkotrwały artefakt Actions. Gdy przepływ pracy jest uruchamiany dla zgłoszenia błędu lub PR-a z poprawką, powinien także publikować zredagowane zrzuty ekranu PNG w gałęzi `qa-artifacts` oraz utworzyć albo zaktualizować komentarz przy tym błędzie lub PR-ze z poprawką, zawierający osadzone zrzuty ekranu przed/po. Nie publikuj głównego dowodu wyłącznie w ogólnym PR-ze automatyzacji QA. Surowe logi, zaobserwowane komunikaty i inne obszerne dowody pozostają w artefakcie Actions.

Produkcyjne przepływy pracy powinny publikować te komentarze za pomocą aplikacji GitHub Mantis, a nie przez `github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions `MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`. Przepływ pracy używa ukrytego znacznika jako klucza aktualizacji lub utworzenia, aktualizuje ten komentarz, gdy token może go edytować, oraz tworzy nowy komentarz należący do Mantis, gdy starszego znacznika należącego do bota nie da się edytować.

Komentarz PR-a powinien być krótki i wizualny:

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

Gdy uruchomienie kończy się niepowodzeniem, ponieważ zawiódł harness, komentarz musi to wskazać zamiast sugerować, że nie powiódł się kandydat.

## Uwagi dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Discord Mantis. Użyj ponownie tej aplikacji zamiast tworzyć kolejną, jeśli ma odpowiednie uprawnienia bota i można ją bezpiecznie rotować.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia. Może on najpierw wskazywać istniejący kanał maintainerów lub operacyjny, a potem zostać przeniesiony do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie identyfikatorów serwerów, identyfikatorów kanałów, tokenów botów, plików cookie przeglądarki ani haseł VNC. Przechowuj je w sekretach GitHub, brokerze poświadczeń albo lokalnym magazynie sekretów operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- id i tytuł
- transport
- wymagane poświadczenia
- zasady referencji bazowej
- zasady referencji kandydata
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwaną wyrocznię bazową
- oczekiwaną wyrocznię kandydata
- cele przechwytywania wizualnego
- budżet limitu czasu
- kroki czyszczenia

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- odwołania do wiadomości Discord dla błędów wątkowania
- ts wątku Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości e-mail i nagłówki dla błędów poczty e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym elementem

Kontrole wizyjne powinny być dodatkiem. Jeśli API platformy może potwierdzić błąd, użyj API jako wyroczni zaliczenia/niezaliczenia, a zrzuty ekranu zachowaj dla zwiększenia zaufania człowieka.

## Rozszerzanie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, przesyłanie plików.
- E-mail: uwierzytelnianie Gmail i wątkowanie wiadomości z użyciem `gog`, gdy konektory nie wystarczają.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, multimedia, reakcje.
- Telegram: bramkowanie wzmianek grupowych, polecenia, reakcje, gdy są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke i jeden lub więcej scenariuszy klas błędów. Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który SUT, gdy istniejący bot Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego, czy w pierwszej fazie wyłącznie dowodów REST czytelnych dla bota?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR-ów?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem do publicznych PR-ów?
