---
read_when:
    - Budowanie lub uruchamianie wizualnej kontroli jakości na żywo dotyczącej błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania ściągnięcia
    - Dodawanie scenariuszy Discord, Slack, WhatsApp lub innych transportów na żywo
    - Debugowanie uruchomień QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to system wizualnej, kompleksowej weryfikacji służący do odtwarzania błędów OpenClaw na aktywnych transportach, rejestrowania dowodów sprzed zmiany i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-05T09:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2db0e0ba75da831f29cc5312e9468db7d3a91d97f0b7a8c8f30c51bd128d148c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to kompleksowy system weryfikacji OpenClaw dla błędów, które wymagają rzeczywistego środowiska uruchomieniowego, rzeczywistego transportu i widocznego dowodu. Uruchamia scenariusz względem znanego wadliwego refa, przechwytuje dowody, uruchamia ten sam scenariusz względem kandydującego refa i publikuje porównanie jako artefakty, które maintainer może sprawdzić z poziomu PR lub lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszą ścieżkę o wysokiej wartości: rzeczywiste uwierzytelnianie bota, rzeczywiste kanały gildii, reakcje, wątki, natywne polecenia oraz interfejs przeglądarki, w którym ludzie mogą wizualnie potwierdzić, co pokazał transport.

## Cele

- Odtworzyć błąd z issue GitHub lub PR z takim samym kształtem transportu, jaki widzą użytkownicy.
- Przechwycić artefakt **przed** na bazowym refie przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na kandydującym refie po zastosowaniu poprawki.
- Gdy to możliwe, używać deterministycznego oracle, takiego jak odczyt reakcji przez Discord REST lub sprawdzenie transkryptu kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczająco dużo stanu maszyny do ratowania przez VNC, gdy logowanie, automatyzacja przeglądarki lub uwierzytelnianie providera utkną.
- Publikować zwięzły status na kanale operatorów Discord, gdy przebieg jest zablokowany, wymaga ręcznej pomocy przez VNC albo się zakończy.

## Poza zakresem

- Mantis nie zastępuje testów jednostkowych. Przebieg Mantis po zrozumieniu poprawki zwykle powinien zostać przekształcony w mniejszy test regresji.
- Mantis nie jest normalną szybką bramką CI. Jest wolniejszy, używa poświadczeń live i jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka w normalnym działaniu. Ręczne VNC to ścieżka ratunkowa, a nie oczekiwany przebieg.
- Mantis nie zapisuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów i lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem elementów harnessa transportu live, helperów przechwytywania przeglądarki i writerów artefaktów.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów, wysyłania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania, debugowania albo raportowania utkniętego stanu.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w Crabbox, a klej workflow maintainera w ClawSweeper.

## Kształt polecenia

Pierwsze lokalne polecenie weryfikuje bota Discord, gildię, kanał, wysłanie wiadomości, wysłanie reakcji i ścieżkę artefaktów:

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

Runner tworzy odłączone worktree bazowe i kandydujące pod katalogiem wyjściowym, instaluje zależności, buduje każdy ref, uruchamia scenariusz z `--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json` i `mantis-report.md`. Dla pierwszego scenariusza Discord pomyślna weryfikacja oznacza, że status baseline to `fail`, a status candidate to `pass`.

Pierwszą prymitywną operacją VM/przeglądarki jest smoke desktopu:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi lub ponownie używa desktopowej maszyny Crabbox, uruchamia widoczną przeglądarkę wewnątrz sesji VNC, przechwytuje desktop, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa providera Hetzner, ponieważ jest to pierwszy provider z działającym pokryciem desktop/VNC w ścieżce Mantis. Nadpisz go przez `--provider`, `--crabbox-bin` albo `OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz względem innej floty Crabbox.

Przydatne flagi smoke desktopu:

- `--lease-id <cbx_...>` lub `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje repo-lokalny artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwytywania wygenerowanej osi czasu reakcji statusu Discord przez rzeczywisty desktop Crabbox.
- `--keep-lease` lub `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną, zakończoną powodzeniem dzierżawę otwartą do inspekcji VNC. Nieudane przebiegi domyślnie utrzymują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny i czas życia dzierżawy.

Pierwszą pełną prymitywną operacją transportu desktopowego jest smoke desktopu Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi lub ponownie używa desktopowej maszyny Crabbox, synchronizuje bieżący checkout do VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce VNC, przechwytuje widoczny desktop i kopiuje zarówno artefakty Slack QA, jak i zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis, w którym SUT OpenClaw Gateway i przeglądarka żyją wewnątrz tej samej desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy home OpenClaw w `$HOME/.openclaw-mantis/slack-openclaw`, łata konfigurację Slack Socket Mode dla wybranego kanału, uruchamia `openclaw gateway run` na porcie `38973` i utrzymuje Chrome działający w sesji VNC. To tryb „zostaw mi desktop Linux ze Slack i działającym claw”; ścieżka Slack QA bot-do-bota pozostaje domyślna, gdy `--gateway-setup` jest pominięte.

Wymagane wejścia dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu. Jeśli lokalnie ustawiono tylko `OPENAI_API_KEY`, Mantis mapuje go na `OPENCLAW_LIVE_OPENAI_KEY` przed wywołaniem Crabbox, aby przekazywanie env `OPENCLAW_*` Crabbox mogło przenieść go do VM.

Z `--gateway-setup --credential-source convex` Mantis dzierżawi poświadczenie Slack SUT ze współdzielonej puli przed utworzeniem VM i przekazuje wydzierżawiony identyfikator kanału, token aplikacji Socket Mode i token bota jako runtime env `OPENCLAW_MANTIS_SLACK_*` wewnątrz desktopu. Dzięki temu workflow GitHub pozostają cienkie: potrzebują tylko sekretu brokera Convex, a nie surowych tokenów bota ani aplikacji Slack.

Przydatne flagi desktopu Slack:

- `--lease-id <cbx_...>` uruchamia ponownie względem maszyny, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały OpenClaw Slack Gateway w VM zamiast tylko ścieżki QA bot-do-bota.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez tego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlist kanałów Slack używaną przez konfigurację Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Wartość domyślna to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie do Slack Web przetrwa ponowne przebiegi na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli poświadczeń zamiast bezpośrednich tokenów env Slack.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do ścieżki Slack live.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po dla pierwszego rzeczywistego scenariusza to `Mantis Discord Status Reactions`. Akceptuje:

- `baseline_ref`: ref, od którego oczekuje się odtworzenia zachowania tylko w kolejce.
- `candidate_ref`: ref, od którego oczekuje się pokazania `queued -> thinking -> done`.

Checkoutuje ref harnessa workflow, buduje osobne worktree bazowe i kandydujące, uruchamia `discord-status-reactions-tool-only` względem każdego worktree i uploaduje `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako artefakty Actions. Renderuje też HTML osi czasu każdej ścieżki w desktopowej przeglądarce Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych PNG osi czasu w komentarzu PR. Ten sam komentarz PR osadza lekkie podglądy GIF z przyciętym ruchem wygenerowane przez `crabbox media preview`, linkuje do odpowiadających im klipów MP4 z przyciętym ruchem i zachowuje pełne pliki MP4 desktopu do głębokiej inspekcji. Zrzuty ekranu pozostają inline do szybkiego przeglądu. Workflow buduje CLI Crabbox z `openclaw/crabbox` main, aby mógł używać bieżących flag dzierżawy desktop/przeglądarki przed wydaniem następnego binarnego release Crabbox.

`Mantis Scenario` to ogólny ręczny punkt wejścia. Przyjmuje `scenario_id`, `candidate_ref`, opcjonalny `baseline_ref` i opcjonalny `pr_number`, a następnie wysyła workflow należący do scenariusza. Wrapper jest celowo cienki: workflow scenariuszy nadal są właścicielami konfiguracji transportu, poświadczeń, klasy VM, oczekiwanego oracle i manifestu artefaktów.

`Mantis Slack Desktop Smoke` to pierwszy workflow Slack VM. Checkoutuje zaufany kandydujący ref w osobnym worktree, dzierżawi desktop Linux Crabbox, uruchamia `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` względem tego kandydata, otwiera Slack Web w przeglądarce VNC, nagrywa desktop, generuje podgląd z przyciętym ruchem przez `crabbox media preview`, uploaduje pełny katalog artefaktów i opcjonalnie publikuje komentarz z dowodami inline na docelowym PR. Użyj tej ścieżki, gdy chcesz „desktop Linux ze Slack i działającym claw” zamiast tylko transkryptu Slack bot-do-bota.

Każdy scenariusz publikujący do PR zapisuje `mantis-evidence.json` obok raportu. Ten schemat jest przekazaniem między kodem scenariusza a komentarzami GitHub:

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

Wartości `path` artefaktów są względne wobec katalogu manifestu. Wartości `targetPath` to ścieżki względne pod katalogiem publikacji gałęzi `qa-artifacts`. Publisher odrzuca path traversal i pomija wpisy oznaczone `"required": false`, gdy opcjonalne podglądy lub filmy są niedostępne.

Obsługiwane rodzaje artefaktów:

- `timeline`: deterministyczny zrzut ekranu scenariusza, zwykle przed/po.
- `desktopScreenshot`: zrzut ekranu desktopu VNC/przeglądarki.
- `motionPreview`: animowany GIF inline wygenerowany z nagrania desktopu.
- `motionClip`: MP4 z przyciętym ruchem, który usuwa statyczny początek i koniec.
- `fullVideo`: pełne nagranie MP4 do głębokiej inspekcji.
- `metadata`: plik towarzyszący JSON/log.
- `report`: raport Markdown.

Wielokrotnego użytku publisher to `scripts/mantis/publish-pr-evidence.mjs`. Workflow wywołują go z manifestem, docelowym PR, docelowym rootem `qa-artifacts`, markerem komentarza, URL artefaktu Actions, URL przebiegu i źródłem żądania. Kopiuje zadeklarowane artefakty do gałęzi `qa-artifacts`, buduje komentarz PR z najpierw podanym podsumowaniem, z obrazami/podglądami inline i linkowanymi filmami, a następnie aktualizuje istniejący komentarz markera albo tworzy nowy.

Możesz też wywołać przebieg status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Uruchamia się tylko dla komentarzy do pull requestów od użytkowników z dostępem write, maintain lub admin i rozpoznaje wyłącznie żądania reakcji statusu Discord. Domyślnie używa znanego złego refa bazowego oraz bieżącego SHA nagłówka PR jako kandydata. Maintainerzy mogą nadpisać dowolny ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skupione na scenariuszu. Drugie może później mapować PR lub issue na zalecane scenariusze Mantis na podstawie etykiet, zmienionych plików oraz ustaleń z przeglądu ClawSweeper.

## Cykl Życia Uruchomienia

1. Pobierz poświadczenia.
2. Przydziel lub użyj ponownie VM.
3. Przygotuj profil desktopu/przeglądarki, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla refa bazowego.
5. Zainstaluj zależności i zbuduj tylko to, czego wymaga scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, dostawcę, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj gateway i zachowaj logi.
10. Przygotuj ref kandydata na tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki oracle i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty trace.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzły komunikat statusu w PR lub Discord.

Scenariusz powinien móc zakończyć się niepowodzeniem na dwa różne sposoby:

- **Błąd odtworzony**: baseline zakończył się niepowodzeniem w oczekiwany sposób.
- **Awaria harnessa**: konfiguracja środowiska, poświadczenia, Discord API, przeglądarka lub dostawca zawiodły, zanim oracle błędu był miarodajny.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili niestabilnego środowiska z zachowaniem produktu.

## Discord MVP

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach serwera, gdzie tryb dostarczania odpowiedzi źródła to `message_tool_only`.

Dlaczego to dobry początkowy przypadek Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma mocny oracle REST przez stan reakcji wiadomości Discord.
- Ćwiczy rzeczywisty OpenClaw Gateway, autoryzację bota Discord, wysyłanie wiadomości, tryb dostarczania odpowiedzi źródła, stan reakcji statusu i cykl życia tury modelu.
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

Dowody bazowe powinny pokazywać zakolejkowaną reakcję potwierdzenia, ale bez przejścia cyklu życia w trybie tool-only. Dowody kandydata powinny pokazywać uruchamianie reakcji statusu cyklu życia, gdy `messages.statusReactions.enabled` ma jawnie wartość true.

Pierwszy wykonywalny wycinek to opt-in scenariusz live QA Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT ze stale włączoną obsługą serwera, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` oraz jawnymi reakcjami statusu. Oracle sonduje rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji `👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` oraz `discord-status-reactions-tool-only-timeline.png`.

## Istniejące Elementy QA

Mantis powinien bazować na istniejącym prywatnym stosie QA zamiast zaczynać od zera:

- `pnpm openclaw qa discord` uruchamia już live lane Discord z botami driver i SUT.
- Runner transportu live zapisuje już raporty oraz artefakty obserwowanych wiadomości w `.artifacts/qa-e2e/`.
- Dzierżawy poświadczeń Convex zapewniają już wyłączny dostęp do współdzielonych poświadczeń transportu live.
- Usługa sterowania przeglądarką obsługuje już zrzuty ekranu, snapshots, zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera oraz magistralę do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem before/after nad tymi elementami oraz jedną warstwą dowodów wizualnych.

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

`mantis-summary.json` powinien być maszynowo czytelnym źródłem prawdy. Raport Markdown jest przeznaczony do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- testowane refy i SHA
- transport i identyfikator scenariusza
- dostawcę maszyny oraz identyfikator maszyny lub identyfikator dzierżawy
- źródło poświadczeń bez wartości sekretów
- wynik bazowy
- wynik kandydata
- czy błąd odtworzono na baseline
- czy kandydat go naprawił
- ścieżki artefaktów
- oczyszczone problemy konfiguracji lub sprzątania

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji: mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. Dla publicznych PR preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji nie będzie mocniejsza.

## Przeglądarka I VNC

Lane przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowe VNC**: włączone na tej samej VM, gdy logowanie, MFA, mechanizmy antyautomatyzacyjne Discord lub wizualne debugowanie wymagają człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby uniknąć logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil należy do puli maszyn Mantis, a nie do laptopa developera.

Gdy Mantis utknie, publikuje komunikat statusu Discord z:

- identyfikatorem uruchomienia
- identyfikatorem scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim tekstem blokera

Pierwsze prywatne wdrożenie może publikować te wiadomości w istniejącym kanale operatorów, a później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej zdalnej implementacji. Crabbox daje nam rozgrzane maszyny, śledzenie dzierżaw, hydrację, logi, wyniki i sprzątanie. Jeśli pojemność AWS będzie zbyt wolna lub niedostępna, dodaj dostawcę Hetzner za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z desktopem
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do ratunku
- Node 22 i pnpm
- checkout OpenClaw oraz cache zależności
- cache przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająca ilość CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera poświadczeń

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami poświadczeń lub profili przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji lub repozytorium GitHub dla uruchomień zdalnych oraz w lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

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

Długoterminowo pula poświadczeń Convex powinna pozostać normalnym źródłem poświadczeń transportu live. Sekrety GitHub bootstrapują brokera i lane’y awaryjne. Workflow reakcji statusu Discord mapuje sekrety Mantis Crabbox z powrotem na zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`, których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają akceptowane jako awaryjna zgodność.

Runner Mantis nigdy nie może drukować:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili auth
- haseł VNC
- surowych payloadów poświadczeń

Publiczne przesyłanie artefaktów powinno także redagować metadane celu Discord, takie jak identyfikatory bota, serwera, kanału i wiadomości. Workflow smoke GitHub włącza `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` z tego powodu.

Jeśli token zostanie przypadkowo wklejony do issue, PR, czatu lub logu, obróć go po zapisaniu nowego sekretu.

## Artefakty GitHub I Komentarze PR

Workflowy Mantis powinny przesyłać pełny pakiet dowodów jako krótkotrwały artefakt Actions. Gdy workflow jest uruchamiany dla zgłoszenia błędu lub PR z poprawką, powinien również publikować zredagowane zrzuty ekranu PNG do gałęzi `qa-artifacts` i upsertować komentarz w tym błędzie lub PR z poprawką z inline zrzutami before/after. Nie publikuj głównego dowodu wyłącznie w ogólnym PR automatyzacji QA. Surowe logi, obserwowane wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Workflowy produkcyjne powinny publikować te komentarze za pomocą GitHub App Mantis, a nie jako `github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions `MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow używa ukrytego markera jako klucza upsert, aktualizuje ten komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy starszego markera należącego do bota nie można edytować.

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

Gdy uruchomienie kończy się niepowodzeniem, ponieważ zawiódł harness, komentarz musi to powiedzieć zamiast sugerować, że kandydat zawiódł.

## Prywatne Notatki Wdrożeniowe

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej aplikacji zamiast tworzyć kolejną, gdy ma właściwe uprawnienia bota i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia. Najpierw może wskazywać istniejący kanał maintainerów lub operacyjny, a następnie przenieść się do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie identyfikatorów serwerów, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC. Przechowuj je w sekretach GitHub, brokerze poświadczeń albo lokalnym magazynie sekretów operatora.

## Dodawanie Scenariusza

Scenariusz Mantis powinien deklarować:

- identyfikator i tytuł
- transport
- wymagane poświadczenia
- politykę refa bazowego
- politykę refa kandydata
- patch konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwany oracle bazowy
- oczekiwany oracle kandydata
- cele przechwytywania wizualnego
- budżet timeoutu
- kroki sprzątania

Scenariusze powinny preferować małe, typowane oracle:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- thread ts Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości email i nagłówki dla błędów email
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym sygnałem

Kontrole wizyjne powinny mieć charakter addytywny. Jeśli API platformy może potwierdzić błąd, użyj
API jako wyroczni zaliczenia/niezaliczenia i zachowaj zrzuty ekranu dla ludzkiej pewności.

## Rozszerzanie dostawców

Po Discord ten sam mechanizm uruchamiający może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, okna modalne, przesyłanie plików.
- E-mail: uwierzytelnianie Gmail i wątkowanie wiadomości przy użyciu `gog`, gdy łączniki nie
  wystarczają.
- WhatsApp: logowanie kodem QR, ponowna identyfikacja, dostarczanie wiadomości, multimedia, reakcje.
- Telegram: bramkowanie wzmianek w grupach, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke oraz jeden lub więcej scenariuszy
klas błędów. Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który testowanym systemem (SUT), gdy
  ponownie używany jest istniejący bot Mantis?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego,
  czy w pierwszej fazie wyłącznie dowodów z REST czytelnych dla bota?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR-ów?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie maintenera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem dla publicznych PR-ów?
