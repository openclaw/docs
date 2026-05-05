---
read_when:
    - Budowanie lub uruchamianie wizualnej kontroli jakości na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla żądania scalenia
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych
    - Debugowanie przebiegów QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to wizualny system weryfikacji end-to-end do odtwarzania błędów OpenClaw na działających transportach, rejestrowania dowodów przed zmianą i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-05-05T06:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów, które wymagają prawdziwego
środowiska uruchomieniowego, prawdziwego transportu i widocznego dowodu. Uruchamia scenariusz wobec znanego
złego refa, zbiera dowody, uruchamia ten sam scenariusz wobec kandydującego refa i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR-a lub
z lokalnego polecenia.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszą ścieżkę o dużej wartości:
prawdziwe uwierzytelnianie bota, prawdziwe kanały guild, reakcje, wątki, natywne polecenia oraz
interfejs przeglądarkowy, w którym ludzie mogą wizualnie potwierdzić to, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR-a na GitHubie z takim samym kształtem transportu, jaki widzą
  użytkownicy.
- Przechwycić artefakt **before** na bazowym refie przed zastosowaniem poprawki.
- Przechwycić artefakt **after** na kandydującym refie po zastosowaniu poprawki.
- Używać deterministycznej wyroczni, gdy tylko to możliwe, takiej jak odczyt reakcji przez Discord REST
  lub sprawdzenie transkrypcji kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z kontrolowanego przez agenta CLI oraz zdalnie z GitHuba.
- Zachować wystarczająco dużo stanu maszyny do ratunkowego VNC, gdy logowanie, automatyzacja przeglądarki lub
  uwierzytelnianie providera utknie.
- Publikować zwięzły status w operatorskim kanale Discord, gdy przebieg jest zablokowany,
  wymaga ręcznej pomocy VNC albo się kończy.

## Poza zakresem

- Mantis nie zastępuje testów jednostkowych. Przebieg Mantis zwykle powinien stać się
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest standardową szybką bramką CI. Jest wolniejszy, używa aktywnych danych logowania i
  jest zarezerwowany dla błędów, w których znaczenie ma środowisko live.
- Mantis nie powinien wymagać człowieka w normalnym działaniu. Ręczne VNC to ścieżka ratunkowa,
  a nie ścieżka oczekiwana.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis znajduje się w stosie QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów oraz
  lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem elementów harnessu transportu live, helperów przechwytywania przeglądarki oraz
  zapisujących artefakty.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHuba: parsowania poleceń maintainerów,
  wywoływania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw sterują Mantis przez Codex, gdy scenariusz wymaga agentowej konfiguracji,
  debugowania albo raportowania zablokowanego stanu.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, planowanie maszyn w
Crabbox, a klej workflow maintainerów w ClawSweeper.

## Kształt polecenia

Pierwsze lokalne polecenie weryfikuje bota Discord, guild, kanał, wysyłkę wiadomości,
wysyłkę reakcji i ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner before i after przyjmuje taki kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone worktree bazowe i kandydujące w katalogu wyjściowym,
instaluje zależności, buduje każdy ref, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord udana weryfikacja
oznacza, że status baseline to `fail`, a status candidate to `pass`.

Pierwszy prymityw VM/przeglądarki to smoke pulpitu:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Dzierżawi lub ponownie używa maszyny desktopowej Crabbox, uruchamia widoczną przeglądarkę w
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego
i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa
providera Hetzner, ponieważ jest to pierwszy provider z działającym pokryciem desktop/VNC
w ścieżce Mantis. Nadpisz go za pomocą `--provider`, `--crabbox-bin` albo
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz wobec innej floty Crabbox.

Przydatne flagi smoke pulpitu:

- `--lease-id <cbx_...>` lub `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje repo-lokalny artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwytywania wygenerowanej osi czasu reakcji statusu Discord przez prawdziwy desktop Crabbox.
- `--keep-lease` lub `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną, przechodzącą dzierżawę otwartą do inspekcji VNC. Nieudane przebiegi domyślnie utrzymują dzierżawę, gdy została utworzona, aby operator mógł połączyć się ponownie.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny oraz czas życia dzierżawy.

Pierwszy pełny prymityw transportu desktopowego to smoke pulpitu Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dzierżawi lub ponownie używa maszyny desktopowej Crabbox, synchronizuje bieżący checkout do
VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce
VNC, przechwytuje widoczny pulpit i kopiuje zarówno artefakty Slack QA, jak i
zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis,
w którym testowany Gateway OpenClaw i przeglądarka działają wewnątrz tej samej
desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy home OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw`, łata konfigurację Slack Socket Mode
dla wybranego kanału, uruchamia `openclaw gateway run` na porcie
`38973` i utrzymuje Chrome działający w sesji VNC. To tryb „zostaw mi
desktop Linux ze Slackiem i działającym claw”; ścieżka Slack QA bot-to-bot
pozostaje domyślna, gdy `--gateway-setup` zostanie pominięte.

Wymagane wejścia dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu. Jeśli lokalnie ustawione jest tylko
  `OPENAI_API_KEY`, Mantis mapuje je na `OPENCLAW_LIVE_OPENAI_KEY`
  przed wywołaniem Crabbox, aby przekazywanie env `OPENCLAW_*` w Crabbox mogło przenieść je
  do VM.

Przydatne flagi pulpitu Slack:

- `--lease-id <cbx_...>` ponownie uruchamia wobec maszyny, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały Gateway Slack OpenClaw w VM zamiast wyłącznie uruchamiania ścieżki QA bot-to-bot.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez tego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlistę kanałów Slack używaną przez konfigurację Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślna wartość to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie do Slack Web przetrwa ponowne przebiegi na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli danych logowania zamiast bezpośrednich tokenów env Slack.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do ścieżki Slack live.

Workflow smoke GitHuba to `Mantis Discord Smoke`. Workflow GitHuba before i after
dla pierwszego prawdziwego scenariusza to `Mantis Discord Status Reactions`. Przyjmuje:

- `baseline_ref`: ref, po którym oczekuje się odtworzenia zachowania tylko `queued`.
- `candidate_ref`: ref, po którym oczekuje się pokazania `queued -> thinking -> done`.

Checkoutuje ref harnessu workflow, buduje osobne worktree baseline i candidate,
uruchamia `discord-status-reactions-tool-only` wobec każdego worktree i
przesyła `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions. Renderuje też HTML osi czasu każdej ścieżki w przeglądarce desktopowej
Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych
PNG osi czasu w komentarzu PR. Ten sam komentarz PR linkuje do nagrań MP4 pulpitu
przechwyconych podczas renderowania w przeglądarce VNC, a zrzuty ekranu pozostają
osadzone dla szybkiego przeglądu. Workflow buduje CLI Crabbox z
`openclaw/crabbox` main, aby mogło używać bieżących flag dzierżawy desktop/browser
przed wydaniem następnego binarium Crabbox.

Możesz też uruchomić przebieg status-reactions bezpośrednio z komentarza PR:

```text
@Mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Działa tylko na komentarzach pull requestów
od użytkowników z dostępem write, maintain albo admin i rozpoznaje wyłącznie
żądania reakcji statusu Discord. Domyślnie używa znanego złego refa baseline
oraz bieżącego SHA nagłówka PR jako kandydata. Maintainerzy mogą nadpisać dowolny
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skupione na scenariuszu. Drugie może później mapować PR
lub issue na rekomendowane scenariusze Mantis na podstawie etykiet, zmienionych plików i
ustaleń przeglądu ClawSweeper.

## Cykl życia przebiegu

1. Pobierz dane logowania.
2. Przydziel lub ponownie użyj VM.
3. Przygotuj profil desktop/przeglądarka, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla refa baseline.
5. Zainstaluj zależności i zbuduj tylko to, czego scenariusz potrzebuje.
6. Uruchom podrzędny Gateway OpenClaw z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, provider, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody baseline.
9. Zatrzymaj Gateway i zachowaj logi.
10. Przygotuj ref candidate w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody candidate.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śladu.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzłą wiadomość statusową PR lub Discord.

Scenariusz powinien móc zawieść na dwa różne sposoby:

- **Błąd odtworzony**: baseline zawiódł w oczekiwany sposób.
- **Awaria harnessu**: konfiguracja środowiska, dane logowania, Discord API, przeglądarka lub
  provider zawiodły, zanim wyrocznia błędu miała znaczenie.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili niestabilnego
środowiska z zachowaniem produktu.

## Discord MVP

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach guild, gdzie
tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego to dobry zalążek Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma silną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy prawdziwy Gateway OpenClaw, uwierzytelnianie bota Discord, dispatch wiadomości,
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

Dowody baseline powinny pokazywać reakcję potwierdzenia queued, ale bez
przejścia cyklu życia w trybie tool-only. Dowody candidate powinny pokazywać reakcje statusu
cyklu życia działające, gdy `messages.statusReactions.enabled` jest jawnie
`true`.

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
"message_tool"`, `ackReaction: "👀"` oraz jawnymi reakcjami statusu. Wyrocznia
odpytuje rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej sekwencji
`👀 -> 🤔 -> 👍`. Artefakty obejmują `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` oraz
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące elementy QA

Mantis powinien budować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia aktywną ścieżkę Discord z botami sterującym i
  SUT.
- Aktywny runner transportu już zapisuje raporty i artefakty zaobserwowanych wiadomości
  w `.artifacts/qa-e2e/`.
- Dzierżawy poświadczeń Convex już zapewniają wyłączny dostęp do współdzielonych aktywnych
  poświadczeń transportu.
- Usługa sterowania przeglądarką już obsługuje zrzuty ekranu, migawki,
  zarządzane profile headless oraz zdalne profile CDP.
- QA Lab ma już interfejs debuggera i magistralę do testów o kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po opartym na tych
elementach, plus jedna warstwa dowodów wizualnych.

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

- testowane refs i SHA
- transport i identyfikator scenariusza
- dostawcę maszyny oraz identyfikator maszyny lub identyfikator dzierżawy
- źródło poświadczeń bez wartości sekretów
- wynik baseline
- wynik candidate
- czy błąd odtworzył się na baseline
- czy candidate go naprawił
- ścieżki artefaktów
- oczyszczone problemy konfiguracji lub sprzątania

Zrzuty ekranu są dowodami, nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. Dla publicznych PR
preferuj linki do artefaktów GitHub Actions zamiast obrazów inline, dopóki historia redakcji
nie będzie mocniejsza.

## Przeglądarka i VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja headless**: domyślna dla CI. Chrome działa z włączonym CDP, a
  Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowe VNC**: włączone na tej samej maszynie VM, gdy logowanie, MFA, zabezpieczenia Discord przed automatyzacją
  lub debugowanie wizualne wymagają człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby uniknąć
logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil
należy do puli maszyn Mantis, nie do laptopa dewelopera.

Gdy Mantis się zablokuje, publikuje wiadomość statusową Discord z:

- identyfikatorem uruchomienia
- identyfikatorem scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim tekstem blokera

Pierwsze prywatne wdrożenie może publikować te wiadomości w istniejącym kanale operatorów
i później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox w pierwszej implementacji zdalnej.
Crabbox daje nam rozgrzane maszyny, śledzenie dzierżaw, nawadnianie, logi, wyniki oraz
sprzątanie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z pulpitem
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do ratunku
- Node 22 i pnpm
- checkout OpenClaw i cache zależności
- cache przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco dużo CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli oraz brokera poświadczeń

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
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesłań artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Docelowo pula poświadczeń Convex powinna pozostać normalnym źródłem aktywnych
poświadczeń transportu. Sekrety GitHub uruchamiają brokera i ścieżki zapasowe.
Workflow reakcji statusu Discord mapuje sekrety Mantis Crabbox z powrotem na
zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`,
których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają
akceptowane jako awaryjna zgodność.

Runner Mantis nigdy nie może drukować:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili auth
- haseł VNC
- surowych ładunków poświadczeń

Publiczne przesyłanie artefaktów powinno także redagować metadane celu Discord, takie jak identyfikatory botów,
gildii, kanałów i wiadomości. Workflow smoke GitHub włącza
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` z tego powodu.

Jeśli token zostanie przypadkowo wklejony do zgłoszenia, PR, czatu lub logu, obróć go
po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Workflow Mantis powinny przesyłać pełny pakiet dowodów jako krótkotrwały artefakt Actions.
Gdy workflow jest uruchamiany dla zgłoszenia błędu lub PR z poprawką, powinien również
opublikować zredagowane zrzuty ekranu PNG w gałęzi `qa-artifacts` i zaktualizować lub dodać
komentarz w tym zgłoszeniu błędu albo PR z poprawką, z obrazami przed/po inline. Nie publikuj
głównego dowodu wyłącznie w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane
wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Workflow produkcyjne powinny publikować te komentarze przy użyciu GitHub App Mantis, a nie
`github-actions[bot]`. Przechowuj identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions
`MANTIS_GITHUB_APP_ID` oraz `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow używa ukrytego znacznika
jako klucza aktualizacji, aktualizuje ten komentarz, gdy token może go edytować, i tworzy
nowy komentarz należący do Mantis, gdy starszy znacznik należący do bota nie może być edytowany.

Komentarz PR powinien być krótki i wizualny:

```md
QA reakcji statusu Discord Mantis

Podsumowanie: Mantis ponownie uruchomił zgłoszony błąd reakcji statusu Discord względem znanej
złej baseline i poprawki candidate. Baseline odtworzył błąd, podczas gdy
candidate pokazał oczekiwaną sekwencję queued -> thinking -> done.

- Scenariusz: `discord-status-reactions-tool-only`
- Uruchomienie: <workflow run link>
- Artefakt: <artifact link>
- Baseline: `<status>` przy `<sha>`
- Candidate: `<status>` przy `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Gdy uruchomienie nie powiedzie się, ponieważ zawiódł harness, komentarz musi to powiedzieć zamiast
sugerować, że candidate zawiódł.

## Notatki dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Discord Mantis. Użyj ponownie tej
aplikacji zamiast tworzyć kolejną, jeśli ma właściwe uprawnienia bota
i można ją bezpiecznie obrócić.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację wdrożenia.
Może najpierw wskazywać istniejący kanał maintainerów lub operacyjny,
a następnie przenieść się do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj w tym dokumencie identyfikatorów gildii, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC.
Przechowuj je w sekretach GitHub, brokerze poświadczeń lub lokalnym magazynie sekretów
operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- identyfikator i tytuł
- transport
- wymagane poświadczenia
- zasady ref dla baseline
- zasady ref dla candidate
- łatę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwaną wyrocznię baseline
- oczekiwaną wyrocznię candidate
- cele przechwytywania wizualnego
- budżet limitu czasu
- kroki sprzątania

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- thread ts Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości email i nagłówki dla błędów email
- zrzuty ekranu przeglądarki, gdy UI jest jedynym wiarygodnym obserwowalnym elementem

Kontrole wizyjne powinny być dodatkowe. Jeśli API platformy może udowodnić błąd, użyj
API jako wyroczni zaliczenia/niezaliczenia i zachowaj zrzuty ekranu dla zaufania ludzi.

## Rozszerzanie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, przesyłanie plików.
- Email: autoryzacja Gmail i wątkowanie wiadomości z użyciem `gog`, gdy konektory nie wystarczają.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, media, reakcje.
- Telegram: bramkowanie wzmianek grupowych, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznowienie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke oraz jeden lub więcej scenariuszy klas błędów.
Kosztowne scenariusze wizualne powinny pozostać opt-in.

## Otwarte pytania

- Który bot Discord powinien być sterujący, a który SUT, gdy istniejący bot
  Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego,
  czy tylko dowodów REST czytelnych dla bota w pierwszej fazie?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub przycinane przed przesłaniem dla publicznych PR?
