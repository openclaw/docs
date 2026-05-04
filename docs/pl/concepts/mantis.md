---
read_when:
    - Budowanie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania scalenia
    - Dodawanie scenariuszy transportu na żywo dla usług Discord, Slack, WhatsApp lub innych
    - Debugowanie uruchomień QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to wizualny system kompleksowej weryfikacji służący do odtwarzania błędów OpenClaw w rzeczywistych transportach, rejestrowania materiału dowodowego przed zmianą i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-04T07:03:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system pełnej weryfikacji OpenClaw dla błędów, które wymagają prawdziwego
środowiska uruchomieniowego, prawdziwego transportu i widocznego dowodu. Uruchamia scenariusz na znanym
złym odwołaniu, przechwytuje dowody, uruchamia ten sam scenariusz na odwołaniu kandydującym i
publikuje porównanie jako artefakty, które opiekun może sprawdzić z poziomu PR lub
z lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszy tor o dużej wartości:
prawdziwe uwierzytelnianie bota, prawdziwe kanały gildii, reakcje, wątki, natywne polecenia i
interfejs przeglądarki, w którym ludzie mogą wizualnie potwierdzić, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR w GitHub z tym samym kształtem transportu, który widzą
  użytkownicy.
- Przechwycić artefakt **przed** na odwołaniu bazowym przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na odwołaniu kandydującym po zastosowaniu poprawki.
- Użyć deterministycznej wyroczni, gdy tylko to możliwe, takiej jak odczyt reakcji
  Discord przez REST lub sprawdzenie transkrypcji kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię interfejsu użytkownika.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczający stan maszyny do ratunku przez VNC, gdy logowanie, automatyzacja przeglądarki lub
  uwierzytelnianie dostawcy utknie.
- Publikować zwięzły status w kanale operatora Discord, gdy uruchomienie jest zablokowane,
  potrzebuje ręcznej pomocy przez VNC albo się kończy.

## Cele poza zakresem

- Mantis nie zastępuje testów jednostkowych. Uruchomienie Mantis zwykle powinno stać się
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest zwykłą szybką bramką CI. Jest wolniejszy, używa żywych poświadczeń i
  jest zarezerwowany dla błędów, w których znaczenie ma środowisko live.
- Mantis nie powinien wymagać człowieka do normalnego działania. Ręczne VNC to ścieżka
  ratunkowa, a nie ścieżka domyślna.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach
  Markdown ani komentarzach PR.

## Własność

Mantis należy do stosu QA OpenClaw.

- OpenClaw odpowiada za środowisko uruchomieniowe scenariuszy, adaptery transportu, schemat dowodów i
  lokalne CLI pod `pnpm openclaw qa mantis`.
- QA Lab odpowiada za elementy uprzęży transportu live, pomocniki przechwytywania przeglądarki i
  zapisujące artefakty.
- Crabbox odpowiada za rozgrzane maszyny Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions odpowiada za zdalny punkt wejścia przepływu pracy i retencję artefaktów.
- ClawSweeper odpowiada za kierowanie komentarzy GitHub: parsowanie poleceń opiekunów,
  uruchamianie przepływu pracy i publikowanie końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowego przygotowania,
  debugowania lub raportowania zablokowanego stanu.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w
Crabbox, a klej przepływu pracy opiekunów w ClawSweeper.

## Kształt poleceń

Pierwsze lokalne polecenie weryfikuje bota Discord, gildię, kanał, wysłanie wiadomości,
wysłanie reakcji i ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po przyjmuje taki kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone drzewa robocze bazowe i kandydujące pod katalogiem wyjściowym,
instaluje zależności, buduje każde odwołanie, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord pomyślna weryfikacja
oznacza, że status bazowy to `fail`, a status kandydata to `pass`.

Pierwszym prymitywem VM/przeglądarki jest desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi lub ponownie wykorzystuje maszynę desktopową Crabbox, uruchamia widoczną przeglądarkę w
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu
wyjściowego i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie
używa dostawcy Hetzner, ponieważ jest pierwszym dostawcą z działającym pokryciem desktop/VNC
w torze Mantis. Nadpisz go za pomocą `--provider`, `--crabbox-bin` lub
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz na innej flocie Crabbox.

Przydatne flagi desktop smoke:

- `--lease-id <cbx_...>` lub `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie wykorzystuje rozgrzany desktop.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje artefakt HTML lokalny dla repozytorium w widocznej przeglądarce. Mantis używa tego do przechwycenia wygenerowanej osi czasu reakcji statusu Discord przez prawdziwy desktop Crabbox.
- `--keep-lease` lub `OPENCLAW_MANTIS_KEEP_VM=1` pozostawia nowo utworzoną pomyślną dzierżawę otwartą do inspekcji przez VNC. Nieudane uruchomienia domyślnie zachowują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny i czas życia dzierżawy.

Pierwszym pełnym prymitywem transportu desktopowego jest Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi lub ponownie wykorzystuje maszynę desktopową Crabbox, synchronizuje bieżący checkout do
VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce
VNC, przechwytuje widoczny pulpit i kopiuje zarówno artefakty Slack QA, jak i
zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis,
w którym SUT OpenClaw gateway i przeglądarka działają wewnątrz tej samej
desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw`, poprawia konfigurację Slack Socket Mode
dla wybranego kanału, uruchamia `openclaw gateway run` na porcie
`38973` i utrzymuje Chrome działający w sesji VNC. To tryb „zostaw mi
desktop Linux ze Slack i działającym claw”; tor Slack QA bot-do-bota
pozostaje domyślny, gdy `--gateway-setup` zostanie pominięte.

Wymagane wejścia dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnego toru modelu. Jeśli lokalnie ustawiono tylko
  `OPENAI_API_KEY`, Mantis mapuje je na `OPENCLAW_LIVE_OPENAI_KEY`
  przed wywołaniem Crabbox, aby przekazywanie zmiennych env `OPENCLAW_*` przez Crabbox mogło przenieść je
  do VM.

Przydatne flagi Slack desktop:

- `--lease-id <cbx_...>` uruchamia ponownie na maszynie, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały Slack gateway OpenClaw w VM zamiast tylko uruchamiać tor QA bot-do-bota.
- `--slack-url <url>` otwiera określony URL Slack Web. Bez niego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlist kanałów Slack używaną przez konfigurację gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślna wartość to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie do Slack Web przetrwa ponowne uruchomienia na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli poświadczeń zamiast bezpośrednich tokenów Slack z env.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane dalej do toru live Slack.

Przepływ pracy smoke GitHub to `Mantis Discord Smoke`. Przepływ pracy przed i po GitHub
dla pierwszego prawdziwego scenariusza to `Mantis Discord Status Reactions`. Przyjmuje:

- `baseline_ref`: odwołanie, które ma odtworzyć zachowanie tylko z kolejką.
- `candidate_ref`: odwołanie, które ma pokazać `queued -> thinking -> done`.

Sprawdza odwołanie uprzęży przepływu pracy, buduje osobne drzewa robocze bazowe i kandydujące,
uruchamia `discord-status-reactions-tool-only` dla każdego drzewa roboczego i
przesyła `baseline/`, `candidate/`, `comparison.json` i `mantis-report.md` jako
artefakty Actions. Renderuje też HTML osi czasu każdego toru w przeglądarce desktopowej
Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych
PNG osi czasu w komentarzu PR. Przepływ pracy buduje CLI Crabbox z
`openclaw/crabbox` main, aby mógł używać bieżących flag dzierżawy desktop/przeglądarki
zanim zostanie wydane następne binarium Crabbox.

Możesz też uruchomić status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Działa tylko na komentarzach pull request
od użytkowników z dostępem write, maintain lub admin i rozpoznaje tylko
żądania reakcji statusu Discord. Domyślnie używa znanego złego odwołania bazowego
i bieżącego SHA głowy PR jako kandydata. Opiekunowie mogą nadpisać dowolne
odwołanie:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skoncentrowane na scenariuszu. Drugie może później mapować PR
lub issue na zalecane scenariusze Mantis na podstawie etykiet, zmienionych plików i
ustaleń przeglądu ClawSweeper.

## Cykl życia uruchomienia

1. Pozyskaj poświadczenia.
2. Przydziel lub ponownie wykorzystaj VM.
3. Przygotuj profil desktop/przeglądarki, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla odwołania bazowego.
5. Zainstaluj zależności i zbuduj tylko to, czego potrzebuje scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, dostawcę, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj gateway i zachowaj logi.
10. Przygotuj odwołanie kandydujące w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śladu.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzłą wiadomość statusu w PR lub Discord.

Scenariusz powinien móc zakończyć się niepowodzeniem na dwa różne sposoby:

- **Błąd odtworzony**: baza nie powiodła się w oczekiwany sposób.
- **Awaria uprzęży**: konfiguracja środowiska, poświadczenia, API Discord, przeglądarka lub
  dostawca zawiodły, zanim wyrocznia błędu miała znaczenie.

Raport końcowy musi rozdzielać te przypadki, aby opiekunowie nie mylili niestabilnego
środowiska z zachowaniem produktu.

## MVP Discord

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach gildii, gdzie
tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego to dobry punkt startowy Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy prawdziwy OpenClaw Gateway, uwierzytelnianie bota Discord, wysyłanie wiadomości,
  tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest wystarczająco wąski, aby utrzymać pierwszą implementację w ryzach.

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
przejścia cyklu życia w trybie tylko narzędzia. Dowody kandydata powinny pokazywać działające reakcje statusu
cyklu życia, gdy `messages.statusReactions.enabled` jest jawnie
`true`.

Pierwszy wykonywalny wycinek to opcjonalny scenariusz QA live Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT z zawsze włączoną obsługą serwera, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` oraz jawnymi reakcjami statusu. Oracle
odpytuje rzeczywistą wiadomość wyzwalającą w Discord i oczekuje zaobserwowanej sekwencji
`👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` oraz
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące elementy QA

Mantis powinien bazować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia ścieżkę live Discord z botami sterownika i
  SUT.
- Runner transportu live już zapisuje raporty i artefakty zaobserwowanych wiadomości
  w `.artifacts/qa-e2e/`.
- Dzierżawy poświadczeń Convex już zapewniają wyłączny dostęp do współdzielonych poświadczeń
  transportów live.
- Usługa sterowania przeglądarką już obsługuje zrzuty ekranu, snapshoty,
  zarządzane profile headless oraz zdalne profile CDP.
- QA Lab ma już interfejs debuggera i magistralę do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po na tych
elementach plus jedna warstwa dowodów wizualnych.

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

`mantis-summary.json` powinien być czytelnym maszynowo źródłem prawdy. Raport
Markdown służy do komentarzy PR i przeglądu przez człowieka.

Podsumowanie musi zawierać:

- testowane refy i SHA
- transport i identyfikator scenariusza
- dostawcę maszyny oraz identyfikator maszyny lub identyfikator dzierżawy
- źródło poświadczeń bez wartości sekretów
- wynik baseline
- wynik candidate
- czy błąd odtworzył się na baseline
- czy candidate go naprawił
- ścieżki artefaktów
- oczyszczone problemy z konfiguracją lub czyszczeniem

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. W przypadku publicznych PR
preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji
nie będzie mocniejsza.

## Przeglądarka i VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna w CI. Chrome działa z włączonym CDP, a
  Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowe VNC**: włączone na tej samej VM, gdy logowanie, MFA, antyautomatyzacja Discord
  lub debugowanie wizualne wymaga człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby uniknąć
logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil
należy do puli maszyn Mantis, a nie do laptopa dewelopera.

Gdy Mantis utknie, publikuje wiadomość statusu Discord z:

- identyfikatorem uruchomienia
- identyfikatorem scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim tekstem blokera

Pierwsze prywatne wdrożenie może publikować te wiadomości w istniejącym kanale operatorów,
a później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej zdalnej implementacji.
Crabbox daje nam rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i
czyszczenie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z pulpitem
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do ratowania
- Node 22 i pnpm
- checkout OpenClaw i pamięć podręczna zależności
- pamięć podręczna przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco dużo CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera poświadczeń

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami poświadczeń lub
profilu przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji lub repozytorium GitHub dla uruchomień zdalnych oraz w
lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych uploadów artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

W długim terminie pula poświadczeń Convex powinna pozostać normalnym źródłem poświadczeń
transportów live. Sekrety GitHub bootstrapują brokera i ścieżki fallback.
Workflow reakcji statusu Discord mapuje sekrety Mantis Crabbox z powrotem na
zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`,
których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają
akceptowane jako fallback zgodności.

Runner Mantis nigdy nie może wypisywać:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych payloadów poświadczeń

Publiczne uploady artefaktów powinny też redagować metadane celu Discord, takie jak identyfikatory botów,
serwerów, kanałów i wiadomości. Workflow smoke GitHub włącza
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` z tego powodu.

Jeśli token zostanie przypadkowo wklejony do zgłoszenia, PR, czatu lub logu, obróć go
po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Workflowy Mantis powinny uploadować pełny pakiet dowodów jako krótkotrwały artefakt Actions.
Gdy workflow jest uruchamiany dla zgłoszenia błędu lub PR z poprawką, powinien również
opublikować zredagowane zrzuty ekranu PNG do gałęzi `qa-artifacts` i upsertować
komentarz do tego błędu lub PR z poprawką ze zrzutami ekranu przed/po inline. Nie publikuj
głównego dowodu tylko w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane
wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Workflowy produkcyjne powinny publikować te komentarze za pomocą Mantis GitHub App, a nie
`github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions
`MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow używa ukrytego znacznika jako klucza upsert, aktualizuje ten
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

Gdy uruchomienie kończy się niepowodzeniem, ponieważ zawiodła uprząż, komentarz musi to powiedzieć
zamiast sugerować, że candidate zawiódł.

## Uwagi dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej
aplikacji zamiast tworzyć kolejną aplikację, gdy ma właściwe uprawnienia bota
i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia.
Może najpierw wskazywać istniejący kanał maintainerów lub operacyjny,
a następnie przenieść się do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj identyfikatorów serwerów, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC
w tym dokumencie. Przechowuj je w sekretach GitHub, brokerze poświadczeń lub
lokalnym magazynie sekretów operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- identyfikator i tytuł
- transport
- wymagane poświadczenia
- politykę ref baseline
- politykę ref candidate
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwany oracle baseline
- oczekiwany oracle candidate
- cele przechwytywania wizualnego
- budżet timeoutu
- kroki czyszczenia

Scenariusze powinny preferować małe, typowane oracle:

- stan reakcji Discord dla błędów reakcji
- odwołania do wiadomości Discord dla błędów wątkowania
- thread ts Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości e-mail i nagłówki dla błędów e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym sygnałem

Sprawdzenia vision powinny być addytywne. Jeśli API platformy może udowodnić błąd, użyj
API jako oracle pass/fail i zachowaj zrzuty ekranu dla pewności człowieka.

## Rozszerzenie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, uploady plików.
- E-mail: uwierzytelnianie Gmail i wątkowanie wiadomości za pomocą `gog`, gdy konektory nie są
  wystarczające.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, media, reakcje.
- Telegram: bramkowanie wzmianek grupowych, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke i co najmniej jeden scenariusz klasy błędów.
Kosztowne scenariusze wizualne powinny pozostać opcjonalne.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który SUT, gdy
  istniejący bot Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego,
  czy tylko dowodów REST czytelnych dla botów w pierwszej fazie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed uploadem dla publicznych PR?
