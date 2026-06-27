---
read_when:
    - Zrozumienie, jak stos QA współdziała ze sobą
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-06-27T17:28:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA służy do testowania OpenClaw w bardziej realistyczny,
ukształtowany przez kanał sposób, niż pozwala na to pojedynczy test jednostkowy.

Bieżące elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy uruchamiające: adaptery transportu live, które
  obsługują rzeczywisty kanał w podrzędnym gatewayu QA.
- `qa/`: zasoby startowe oparte na repozytorium dla zadania inicjującego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu przeglądarki, stanu maszyny wirtualnej i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowane samosprawdzenie QA bez `--qa-profile`; uruchamiacz profilu dojrzałości opartego na taksonomii z `--qa-profile smoke-ci`, `--qa-profile release` albo `--qa-profile all`.                                                                                      |
| `qa suite`                                          | Uruchom scenariusze oparte na repozytorium względem pasa gatewaya QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej maszyny wirtualnej Linux.                                                                                                    |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy YAML (`--json` dla danych wyjściowych maszynowych).                                                                                                                                                                                |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz raport parytetu agentowego albo użyj `--runtime-axis --token-efficiency`, aby zapisać raporty parytetu środowisk uruchomieniowych Codex-vs-OpenClaw i efektywności tokenów z jednego podsumowania pary środowisk. |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach live z ocenionym raportem. Zobacz [Raportowanie](#reporting).                                                                                                                                                           |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranego pasa dostawcy/modelu.                                                                                                                                                                                                     |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                        |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla panelu QA i pasa gatewaya.                                                                                                                                                                                                           |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos oparty na Dockerze, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                 |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                                                                                                                        |
| `qa matrix`                                         | Pas transportu live względem jednorazowego serwera domowego Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                                                                                           |
| `qa telegram`                                       | Pas transportu live względem rzeczywistej prywatnej grupy Telegram.                                                                                                                                                                                                     |
| `qa discord`                                        | Pas transportu live względem rzeczywistego prywatnego kanału gildii Discord.                                                                                                                                                                                            |
| `qa slack`                                          | Pas transportu live względem rzeczywistego prywatnego kanału Slack.                                                                                                                                                                                                     |
| `qa whatsapp`                                       | Pas transportu live względem rzeczywistych kont WhatsApp Web.                                                                                                                                                                                                           |
| `qa mantis`                                         | Uruchamiacz weryfikacji przed i po dla błędów transportu live, z dowodami w reakcjach statusu Discord, próbą dymną pulpitu/przeglądarki Crabbox oraz próbą dymną Slack-in-VNC. Zobacz [Mantis](/pl/concepts/mantis) i [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

`qa run` oparte na profilach odczytuje członkostwo z `taxonomy.yaml`, a następnie przekazuje
rozwiązane scenariusze przez `qa suite`. `--surface` i
`--category` filtrują wybrany profil zamiast definiować osobne pasy.
Wynikowy `qa-evidence.json` zawiera podsumowanie karty wyników profilu z
liczbami wybranych kategorii i brakującymi identyfikatorami pokrycia; poszczególne wpisy dowodowe
pozostają źródłem prawdy dla testów, ról pokrycia i wyników.
Identyfikatory pokrycia funkcji taksonomii są dokładnymi celami dowodowymi, nie aliasami. Podstawowe
pokrycie scenariusza spełnia pasujące identyfikatory; pokrycie drugorzędne pozostaje doradcze.
Identyfikatory pokrycia używają formy z kropkami `namespace.behavior` z segmentami
alfanumerycznymi małymi literami i myślnikami; identyfikatory profilu, powierzchni i kategorii nadal mogą używać
istniejących identyfikatorów taksonomii z myślnikami lub kropkami.
Odchudzone dowody pomijają `execution` dla każdego wpisu i ustawiają `evidenceMode: "slim"`;
`smoke-ci` domyślnie używa trybu odchudzonego, a `--evidence-mode full` przywraca pełne wpisy:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Użyj `smoke-ci` do deterministycznego dowodu profilu z pozorowanymi dostawcami modeli i
fałszywymi serwerami dostawców Crabline. Użyj `release` do dowodu Stable/LTS względem kanałów live.
Użyj `all` tylko dla jawnych przebiegów dowodowych pełnej taksonomii; wybiera on
każdą aktywną kategorię dojrzałości i może zostać przekazany przez workflow `QA Profile
Evidence` z `qa_profile=all`. Gdy polecenie potrzebuje także profilu głównego OpenClaw,
umieść profil główny przed poleceniem QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Przepływ operatora

Bieżący przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: panel Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujący transkrypcję w stylu Slacka i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia oparty na Dockerze pas gatewaya i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może przekazać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału i zapisać, co zadziałało, co się nie powiodło albo
pozostało zablokowane.

Aby szybciej iterować interfejs QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i podmontowuje
`extensions/qa-lab/web/dist` w kontenerze `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy zmienia się
hash zasobu QA Lab.

Dla lokalnej próby dymnej sygnału OpenTelemetry uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik OTLP/HTTP, uruchamia scenariusz QA `otel-trace-smoke`
z włączonym Pluginem `diagnostics-otel`, a następnie asercyjnie sprawdza eksport śladów,
metryk i logów. Dekoduje wyeksportowane zakresy śladów protobuf
i sprawdza kształt krytyczny dla wydania:
`openclaw.run`, `openclaw.harness.run`, zakres wywołania modelu zgodny z najnowszą konwencją semantyczną GenAI,
`openclaw.context.assembled` i `openclaw.message.delivery`
muszą być obecne. Próba dymna wymusza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, więc zakres wywołania modelu
musi używać nazwy `{gen_ai.operation.name} {gen_ai.request.model}`;
wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Surowe ładunki OTLP
nie mogą zawierać sentinela promptu, sentinela odpowiedzi ani klucza sesji QA.
Zapisuje `otel-smoke-summary.json` obok artefaktów pakietu QA.

Dla próby dymnej OpenTelemetry opartej na kolektorze uruchom:

```bash
pnpm qa:otel:collector-smoke
```

Ten pas umieszcza rzeczywisty kontener Docker OpenTelemetry Collector przed tym
samym lokalnym odbiornikiem. Użyj go przy zmianie okablowania endpointów, zgodności kolektora
albo zachowania eksportu OTLP, które odbiornik w procesie mógłby zamaskować.

Dla chronionej próby dymnej zeskrobywania Prometheus uruchom:

```bash
pnpm qa:prometheus:smoke
```

Ten alias uruchamia scenariusz QA `docker-prometheus-smoke` z włączonym
`diagnostics-prometheus`, weryfikuje, że nieuwierzytelnione scrapowania są odrzucane,
a następnie sprawdza, czy uwierzytelnione scrapowanie zawiera krytyczne dla wydania rodziny metryk
bez treści promptów, treści odpowiedzi, surowych identyfikatorów diagnostycznych, tokenów
uwierzytelniania ani ścieżek lokalnych.

Aby uruchomić oba testy dymne obserwowalności jeden po drugim, użyj:

```bash
pnpm qa:observability:smoke
```

Dla ścieżki OpenTelemetry wspieranej przez kolektor oraz chronionego testu dymnego scrapowania Prometheus
użyj:

```bash
pnpm qa:observability:collector-smoke
```

QA obserwowalności pozostaje dostępne tylko z checkoutu źródłowego. Paczka npm celowo pomija
QA Lab, więc ścieżki wydania Docker dla pakietów nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` albo
`pnpm qa:observability:smoke` z checkoutu źródłowego po zbudowaniu, gdy zmieniasz
instrumentację diagnostyczną.

Dla transportowo rzeczywistej ścieżki dymnej Matrix, która nie wymaga poświadczeń dostawcy modelu,
uruchom szybki profil z deterministycznym pozorowanym dostawcą OpenAI:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Dla ścieżki dostawcy live-frontier podaj jawnie poświadczenia zgodne z OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Pełna dokumentacja CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: provisionuje jednorazowy homeserver Tuwunel w Docker, rejestruje tymczasowych użytkowników sterownika/SUT/obserwatora, uruchamia rzeczywisty plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt zaobserwowanych zdarzeń i połączony dziennik wyjściowy pod `.artifacts/qa-e2e/matrix-<timestamp>/`.

Scenariusze obejmują zachowania transportu, których testy jednostkowe nie mogą udowodnić end-to-end: bramkowanie wzmianek, zasady allow-bot, listy dozwolonych, odpowiedzi najwyższego poziomu i w wątkach, routowanie DM, obsługę reakcji, tłumienie przychodzących edycji, deduplikację odtwarzania po restarcie, odzyskiwanie po przerwaniu homeservera, dostarczanie metadanych zatwierdzeń, obsługę multimediów oraz przepływy bootstrapu/odzyskiwania/weryfikacji Matrix E2EE. Profil CLI E2EE uruchamia także `openclaw matrix encryption setup` i polecenia weryfikacyjne przez ten sam jednorazowy homeserver, zanim sprawdzi odpowiedzi Gateway.

Discord ma także scenariusze opt-in tylko dla Mantis do reprodukcji błędów. Użyj
`--scenario discord-status-reactions-tool-only` dla jawnej osi czasu reakcji statusu
albo `--scenario discord-thread-reply-filepath-attachment`, aby utworzyć
rzeczywisty wątek Discord i zweryfikować, że `message.thread-reply` zachowuje
załącznik `filePath`. Te scenariusze pozostają poza domyślną ścieżką live Discord,
ponieważ są sondami reprodukcyjnymi przed/po, a nie szerokim pokryciem dymnym.
Przepływ Mantis dla załącznika w wątku może też dodać film świadka Discord Web
z zalogowanego konta, gdy w środowisku QA skonfigurowano
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` albo
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Ten profil przeglądarki służy tylko
do przechwytywania wizualnego; decyzja pass/fail nadal pochodzi z wyroczni Discord REST.

CI używa tej samej powierzchni poleceń w `.github/workflows/qa-live-transports-convex.yml`.
Zaplanowane i domyślne ręczne uruchomienia wykonują szybki profil Matrix z
poświadczeniami live-frontier dostarczanymi przez QA, `--fast` oraz
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ręczne `matrix_profile=all` rozdziela
pracę na pięć shardów profili.

Dla transportowo rzeczywistych ścieżek dymnych Telegram, Discord, Slack i WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Celują one w istniejący rzeczywisty kanał z dwoma botami lub kontami (sterownik + SUT). Wymagane zmienne środowiskowe, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane poniżej w [Dokumentacji QA Telegram, Discord, Slack i WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Dla pełnego uruchomienia maszyny VM Slack desktop z ratunkowym VNC uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę desktop/przeglądarka Crabbox, uruchamia ścieżkę live Slack
wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit i kopiuje
`slack-qa/`, `slack-desktop-smoke.png` oraz `slack-desktop-smoke.mp4`,
gdy przechwytywanie wideo jest dostępne, z powrotem do katalogu artefaktów Mantis. Dzierżawy
desktop/przeglądarka Crabbox dostarczają z góry narzędzia przechwytywania oraz pakiety pomocnicze
dla przeglądarki/natywnego buildu, więc scenariusz powinien instalować fallbacki tylko na starszych
dzierżawach. Mantis raportuje czasy całkowite i per faza w
`mantis-slack-desktop-smoke-report.md`, aby wolne uruchomienia pokazywały, czy czas trafił na
rozgrzewanie dzierżawy, pozyskiwanie poświadczeń, zdalną konfigurację czy kopiowanie artefaktów. Użyj ponownie
`--lease-id <cbx_...>` po ręcznym zalogowaniu do Slack Web przez VNC;
ponownie użyte dzierżawy utrzymują też ciepły cache pnpm store Crabbox. Domyślne
`--hydrate-mode source` weryfikuje z checkoutu źródłowego i uruchamia instalację/build
wewnątrz VM. Używaj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używana zdalna
przestrzeń robocza ma już `node_modules` i zbudowane `dist/`; ten tryb pomija
kosztowny krok instalacji/buildu i kończy się fail-closed, gdy przestrzeń robocza nie jest gotowa.
Z `--gateway-setup` Mantis pozostawia trwały Gateway OpenClaw Slack
działający wewnątrz VM na porcie `38973`; bez tego polecenie uruchamia zwykłą
ścieżkę QA Slack bot-do-bota i kończy po przechwyceniu artefaktów.

Aby udowodnić natywny interfejs zatwierdzania Slack z dowodami desktopowymi, uruchom tryb punktów kontrolnych zatwierdzeń Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ten tryb wyklucza się wzajemnie z `--gateway-setup`. Uruchamia scenariusze
zatwierdzeń Slack, odrzuca identyfikatory scenariuszy niebędących zatwierdzeniami, czeka na każdy oczekujący i
rozwiązany stan zatwierdzenia, renderuje zaobserwowaną wiadomość API Slack do
`approval-checkpoints/<scenario>-pending.png` oraz
`approval-checkpoints/<scenario>-resolved.png`, a następnie kończy się błędem, jeśli brakuje któregokolwiek punktu kontrolnego,
dowodu wiadomości, potwierdzenia albo wyrenderowanego zrzutu ekranu, albo jeśli jest pusty.
Zimne dzierżawy CI nadal mogą pokazywać logowanie Slack w `slack-desktop-smoke.png`;
obrazy punktów kontrolnych zatwierdzeń są dowodem wizualnym dla tej ścieżki.

Lista kontrolna operatora, polecenie dispatch workflow GitHub, kontrakt komentarza dowodowego,
tabela decyzyjna hydrate-mode, interpretacja czasów oraz kroki obsługi awarii znajdują się w [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Dla zadania desktopowego w stylu agenta/CV uruchom:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` dzierżawi albo ponownie używa maszyny desktop/przeglądarka Crabbox, uruchamia
`crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, przechwytuje `visual-task.png`, uruchamia `openclaw infer image describe`
na zrzucie ekranu, gdy wybrano `--vision-mode image-describe`, i zapisuje
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` oraz `mantis-visual-task-report.md`.
Gdy ustawiono `--expect-text`, prompt wizyjny prosi o ustrukturyzowany werdykt JSON
i przechodzi tylko wtedy, gdy model zgłasza pozytywny widoczny dowód; negatywna
odpowiedź, która jedynie cytuje docelowy tekst, nie spełnia asercji.
Użyj `--vision-mode metadata` dla testu dymnego bez modelu, który dowodzi działania pulpitu,
przeglądarki, zrzutu ekranu i połączeń wideo bez wywoływania dostawcy rozumienia obrazu.
Nagranie jest wymaganym artefaktem dla `visual-task`; jeśli Crabbox nie nagra
niepustego `visual-task.mp4`, zadanie kończy się błędem nawet wtedy, gdy sterownik wizualny
przeszedł. W razie awarii Mantis utrzymuje dzierżawę dla VNC, chyba że zadanie już
przeszło, a `--keep-lease` nie zostało ustawione.

Przed użyciem pulowanych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, waliduje ustawienia endpointu i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintainera. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportów live

Ścieżki transportów live współdzielą jeden kontrakt, zamiast każdej wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia transportów live.

Runnery transportów live powinny importować współdzielone identyfikatory scenariuszy, pomocniki
pokrycia bazowego i pomocnik wyboru scenariuszy z
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Ścieżka  | Kanarek | Bramkowanie wzmianek | Bot-do-bota | Blokada listy dozwolonych | Odpowiedź najwyższego poziomu | Odpowiedź z cytatem | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja poleceń natywnych |
| -------- | ------- | -------------------- | ----------- | ------------------------- | ----------------------------- | ------------------- | ------------------------ | ----------------- | --------------- | ------------------ | ---------------- | ------------------------------ |
| Matrix   | x       | x                    | x           | x                         | x                             |                     | x                        | x                 | x               | x                  |                  |                                |
| Telegram | x       | x                    | x           |                           |                               |                     |                          |                   |                 |                    | x                |                                |
| Discord  | x       | x                    | x           |                           |                               |                     |                          |                   |                 |                    |                  | x                              |
| Slack    | x       | x                    | x           | x                         | x                             |                     | x                        | x                 | x               |                    |                  |                                |
| WhatsApp | x       | x                    |             | x                         | x                             | x                   | x                        |                   |                 | x                  | x                |                                |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix,
Telegram i inne transporty live współdzielą jedną jawną listę kontrolną kontraktu transportu.

Dla jednorazowej ścieżki VM Linux bez wprowadzania Docker do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia pakietu na hoście i Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` do wykonania szeregowego.
Użyj `--pack personal-agent`, aby uruchomić pakiet benchmarków osobistego asystenta. Selektor
pakietu jest addytywny względem powtarzanych flag `--scenario`: jawne scenariusze
uruchamiają się najpierw, potem scenariusze pakietu uruchamiają się w kolejności pakietu z usuniętymi duplikatami.
Użyj `--pack observability`, gdy niestandardowy runner QA dostarcza już konfigurację
kolektora OpenTelemetry i chce wybrać razem scenariusze dymne diagnostyki
OpenTelemetry oraz Prometheus.
Polecenie kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA praktyczne dla
gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy live QA oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowaną przestrzeń roboczą.

## Dokumentacja referencyjna QA dla Telegram, Discord, Slack i WhatsApp

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i obsługiwane przez Docker udostępnianie homeservera. Telegram, Discord, Slack i WhatsApp działają na istniejących rzeczywistych transportach, więc ich dokumentacja referencyjna znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślnie                                          | Opis                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Uruchom tylko ten scenariusz. Można powtarzać.                                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Miejsce zapisu raportów, podsumowań, materiałów dowodowych, artefaktów specyficznych dla transportu i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                                                                 |
| `--sut-account <id>`                  | `sut`                                              | Tymczasowy identyfikator konta w konfiguracji Gateway QA.                                                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa).                                                                                       |
| `--model <ref>` / `--alt-model <ref>` | domyślna wartość dostawcy                          | Referencje modelu podstawowego/alternatywnego.                                                                                                                |
| `--fast`                              | wyłączone                                          | Tryb szybki dostawcy, gdy jest obsługiwany.                                                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                              | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`         | Rola używana, gdy ustawiono `--credential-source convex`.                                                                                                     |

Każda ścieżka kończy się kodem różnym od zera przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu wyjścia oznaczającego błąd.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma odrębnymi botami (sterownik + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Scenariusze (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Niejawny zestaw domyślny zawsze obejmuje canary, bramkowanie wzmianek, odpowiedzi na natywne polecenia, adresowanie poleceń i odpowiedzi bot-do-bota w grupie. Domyślne ustawienia `mock-openai` obejmują także deterministyczne kontrole łańcucha odpowiedzi i strumieniowania komunikatu końcowego. `telegram-current-session-status-tool` pozostaje opcjonalne, ponieważ jest stabilne tylko wtedy, gdy jest wykonywane bezpośrednio po canary, a nie po dowolnych odpowiedziach na natywne polecenia. Użyj `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, aby wypisać bieżący podział domyślny/opcjonalny z referencjami regresji.

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live, w tym pola profilu, pokrycia, dostawcy, kanału, artefaktów, wyniku i RTT.

Uruchomienia pakietowe Telegram używają tej samej umowy poświadczeń Telegram. Powtarzany pomiar RTT
jest częścią zwykłej pakietowej ścieżki live Telegram; rozkład RTT
jest składany do `qa-evidence.json` w `result.timing` dla
wybranej kontroli RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Gdy ustawiono `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, pakietowy wrapper live
dzierżawi poświadczenie `kind: "telegram"`, eksportuje wydzierżawione zmienne środowiskowe
grupy/sterownika/bota SUT do uruchomienia zainstalowanego pakietu, utrzymuje Heartbeat dzierżawy
i zwalnia ją przy zamykaniu. Wrapper pakietowy domyślnie wykonuje 20 kontroli RTT
`telegram-mentioned-message-reply`, ma limit czasu RTT 30 s i używa roli Convex
`maintainer` poza CI, gdy wybrano Convex. Nadpisz
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
lub `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostroić pomiar RTT bez
tworzenia osobnego polecenia RTT lub formatu podsumowania specyficznego dla Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem sterownika kontrolowanym przez harness i botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączoną wtyczkę Discord. Weryfikuje obsługę wzmianek kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodowe Mantis.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko kończy się błędem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach obserwowanych wiadomości.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wybiera kanał głosowy/sceniczny dla `discord-voice-autojoin`; bez niego scenariusz wybiera pierwszy widoczny kanał głosowy/sceniczny dla bota SUT.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opcjonalny scenariusz głosowy. Działa samodzielnie, włącza `channels.discord.voice.autoJoin` i weryfikuje, że bieżący stan głosowy Discord bota SUT to docelowy kanał głosowy/sceniczny. Poświadczenia Discord z Convex mogą zawierać opcjonalne `voiceChannelId`; w przeciwnym razie runner wykrywa pierwszy widoczny kanał głosowy/sceniczny w gildii.
- `discord-status-reactions-tool-only` - opcjonalny scenariusz Mantis. Działa samodzielnie, ponieważ przełącza SUT na stale włączone odpowiedzi gildii wyłącznie narzędziowe z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz wizualne artefakty HTML/PNG. Raporty Mantis przed/po zachowują także dostarczone przez scenariusz artefakty MP4 jako `baseline.mp4` i `candidate.mp4`.

Uruchom jawnie scenariusz automatycznego dołączania do głosu Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Uruchom jawnie scenariusz reakcji statusu Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artefakty wyjściowe:

- `discord-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live.
- `discord-qa-observed-messages.json` - treści redagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy działa scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem sterownika kontrolowanym przez harness i botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączoną wtyczkę Slack.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach obserwowanych wiadomości.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` włącza wizualne punkty kontrolne zatwierdzania
  dla Mantis. Runner zapisuje `<scenario>.pending.json` i
  `<scenario>.resolved.json`, a następnie czeka na pasujące pliki `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` nadpisuje limit czasu
  potwierdzenia punktu kontrolnego. Wartość domyślna to `120000`.

Scenariusze (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opcjonalny scenariusz natywnego zatwierdzania exec w Slack.
  Żąda zatwierdzenia exec przez Gateway, weryfikuje, że wiadomość Slack ma
  natywne przyciski zatwierdzania, rozwiązuje je i weryfikuje zaktualizowaną wiadomość Slack.
- `slack-approval-plugin-native` - opcjonalny scenariusz natywnego zatwierdzania wtyczki Slack.
  Włącza jednocześnie przekazywanie zatwierdzeń exec i wtyczek, aby zdarzenia wtyczek nie były
  tłumione przez routing zatwierdzeń exec, a następnie weryfikuje tę samą oczekującą/rozwiązaną
  natywną ścieżkę UI Slack.

Artefakty wyjściowe:

- `slack-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live.
- `slack-qa-observed-messages.json` - treści redagowane, chyba że ustawiono `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - tylko gdy Mantis ustawia
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; zawiera JSON punktów kontrolnych,
  JSON potwierdzeń oraz zrzuty ekranu oczekujące/rozwiązane.

#### Konfigurowanie obszaru roboczego Slack

Ścieżka potrzebuje dwóch odrębnych aplikacji Slack w jednym obszarze roboczym oraz kanału, którego członkami są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje wiadomości przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być oddzielną aplikacją Slack od sterownika, aby jej identyfikator użytkownika bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj obszar roboczy Slack dedykowany QA zamiast ponownego użycia obszaru produkcyjnego.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonej wtyczki Slack (`extensions/slack/src/setup-shared.ts:10`) do uprawnień i zdarzeń objętych pakietem live Slack QA. Produkcyjną konfigurację kanału widzianą przez użytkowników opisuje [szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ ścieżka potrzebuje dwóch odrębnych identyfikatorów użytkowników botów w jednym obszarze roboczym.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Utwórz nową aplikację_ → _Z manifestu_ → wybierz obszar roboczy QA, wklej poniższy manifest, a następnie _Zainstaluj w obszarze roboczym_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Skopiuj _Token OAuth użytkownika bota_ (`xoxb-...`) - stanie się on `driverBotToken`. Sterownik musi tylko publikować wiadomości i identyfikować siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Utwórz nową aplikację → Z manifestu_ w tym samym obszarze roboczym. Ta aplikacja QA celowo używa węższej wersji produkcyjnego manifestu dołączonego Pluginu Slack (`extensions/slack/src/setup-shared.ts:10`): zakresy i zdarzenia reakcji pominięto, ponieważ zestaw testów Slack QA na żywo nie obejmuje jeszcze obsługi reakcji.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Po utworzeniu aplikacji przez Slack wykonaj dwie czynności na jej stronie ustawień:

- _Zainstaluj w obszarze roboczym_ → skopiuj _Token OAuth użytkownika bota_ → stanie się on `sutBotToken`.
- _Informacje podstawowe → Tokeny na poziomie aplikacji → Wygeneruj token i zakresy_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → stanie się ona `sutAppToken`.

Zweryfikuj, że oba boty mają różne identyfikatory użytkownika, wywołując `auth.test` na każdym tokenie. Runtime rozróżnia sterownik i SUT po identyfikatorze użytkownika; ponowne użycie jednej aplikacji do obu ról natychmiast zakończy się niepowodzeniem bramkowania wzmianek.

**3. Utwórz kanał**

W obszarze roboczym QA utwórz kanał, np. `#openclaw-qa`, i zaproś oba boty z poziomu kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _informacje o kanale → Informacje → Identyfikator kanału_ - stanie się on `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje mają już `groups:history`, więc odczyty historii przez uprząż nadal się powiodą.

**4. Zarejestruj dane uwierzytelniające**

Są dwie opcje. Użyj zmiennych środowiskowych do debugowania na jednej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasiej współdzieloną pulę Convex, aby CI i inni opiekunowie mogli je dzierżawić.

Dla puli Convex zapisz cztery pola do pliku JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Po wyeksportowaniu `OPENCLAW_QA_CONVEX_SITE_URL` i `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` w powłoce zarejestruj i zweryfikuj:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Oczekuj `count: 1`, `status: "active"`, bez pola `lease`.

**5. Zweryfikuj end-to-end**

Uruchom ścieżkę lokalnie, aby potwierdzić, że oba boty mogą rozmawiać ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielony przebieg kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli ścieżka zawiesza się na około 90 sekund i kończy z komunikatem `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest dzierżawiony - `qa credentials list --kind slack --status all --json` pokaże, która sytuacja występuje.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Celuje w dwa dedykowane konta WhatsApp Web: konto sterownika kontrolowane przez
uprząż oraz konto SUT uruchamiane przez podrzędny Gateway OpenClaw za pomocą
dołączonego Pluginu WhatsApp.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcjonalne:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` włącza scenariusze grupowe, takie jak
  `whatsapp-mention-gating` i `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` zachowuje treść wiadomości w
  artefaktach zaobserwowanych wiadomości.

Katalog scenariuszy (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Linia bazowa i bramkowanie grupowe: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Polecenia natywne: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Zachowanie odpowiedzi i końcowego wyniku: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Media przychodzące i wiadomości strukturalne: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Wysyłają one rzeczywiste zdarzenia obrazu,
  audio, dokumentu, lokalizacji, kontaktu i naklejki WhatsApp przez sterownik.
- Pokrycie wychodzącego Gateway i akcji wiadomości:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Pokrycie kontroli dostępu: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Natywne zatwierdzenia: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reakcje statusu: `whatsapp-status-reactions`.

Katalog zawiera obecnie 36 scenariuszy. Domyślna ścieżka `live-frontier` jest
utrzymywana jako mała, z 10 scenariuszami, aby zapewnić szybkie pokrycie smoke.
Domyślna ścieżka `mock-openai` uruchamia 31 deterministycznych scenariuszy przez
rzeczywisty transport WhatsApp, mockując wyłącznie wynik modelu. Scenariusze
zatwierdzeń oraz kilka cięższych/blokujących kontroli pozostają jawne według
identyfikatora scenariusza.

Sterownik WhatsApp QA obserwuje strukturalne zdarzenia live (`text`, `media`,
`location`, `reaction` i `poll`) oraz może aktywnie wysyłać media, ankiety,
kontakty, lokalizacje i naklejki. QA Lab importuje ten sterownik przez
powierzchnię pakietu `@openclaw/whatsapp/api.js`, zamiast sięgać do prywatnych
plików runtime WhatsApp. Treść wiadomości jest domyślnie redagowana. Pokrycie
wychodzących ankiet i przesyłania plików przechodzi przez deterministyczne
wywołania Gateway `poll` i `message.action`, zamiast wywoływać narzędzia
wyłącznie przez prompt modelu.

Artefakty wyjściowe:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live.
- `whatsapp-qa-observed-messages.json` - treści redagowane, chyba że `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pula danych uwierzytelniających Convex

Ścieżki Telegram, Discord, Slack i WhatsApp mogą dzierżawić dane uwierzytelniające ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas trwania przebiegu i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"`, `"slack"` i `"whatsapp"`.

Kształty ładunków walidowane przez brokera w `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` musi być liczbowym ciągiem identyfikatora czatu.
- Rzeczywisty użytkownik Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - tylko dowód Mantis Telegram Desktop. Ogólne ścieżki QA Lab nie mogą pozyskiwać tego rodzaju.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - numery telefonów muszą być odrębnymi ciągami E.164.

Workflow dowodu Mantis Telegram Desktop utrzymuje jedną wyłączną dzierżawę Convex
`telegram-user` zarówno dla sterownika TDLib CLI, jak i świadka Telegram Desktop,
a następnie zwalnia ją po opublikowaniu dowodu.

Gdy PR wymaga deterministycznego diffu wizualnego, Mantis może użyć tej samej
mockowanej odpowiedzi modelu na `main` i na głowicy PR, podczas gdy zmienia się
formatter Telegram lub warstwa dostarczania. Domyślne ustawienia przechwytywania
są dostrojone do komentarzy PR: standardowa klasa Crabbox, nagranie pulpitu
24 fps, GIF ruchu 24 fps i szerokość podglądu 1920 px. Komentarze przed/po
powinny publikować czysty pakiet zawierający wyłącznie zamierzone GIF-y.

Ścieżki Slack mogą również używać puli. Kontrole kształtu ładunku Slack obecnie znajdują się w runnerze Slack QA, a nie w brokerze; użyj `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, z identyfikatorem kanału Slack w rodzaju `Cxxxxxxxxxx`. Zobacz [Konfigurowanie obszaru roboczego Slack](#setting-up-the-slack-workspace), aby przygotować aplikacje i zakresy.

Operacyjne zmienne środowiskowe oraz kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone dane uwierzytelniające Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed puli wielokanałowej; semantyka dzierżawy jest wspólna dla rodzajów).

## Seedy wspierane repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Są celowo trzymane w git, aby plan QA był widoczny zarówno dla ludzi, jak i
agenta.

`qa-lab` powinien pozostać ogólnym runnerem scenariuszy YAML. Każdy plik YAML
scenariusza jest źródłem prawdy dla jednego przebiegu testowego i powinien
definiować:

- najwyższego poziomu `title`
- metadane `scenario`
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka w `scenario`
- odwołania do dokumentacji i kodu w `scenario`
- opcjonalne wymagania Pluginu w `scenario`
- opcjonalną poprawkę konfiguracji Gateway w `scenario`
- wykonywalny najwyższego poziomu `flow` dla scenariuszy przepływu albo `scenario.execution.kind` /
  `scenario.execution.path` dla scenariuszy Vitest i Playwright

Powierzchnia runtime wielokrotnego użytku, na której opiera się `flow`, może pozostać ogólna
i przekrojowa. Na przykład scenariusze YAML mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
szew Gateway `browser.request`, bez dodawania specjalnego runnera.

Pliki scenariuszy należy grupować według możliwości produktu, a nie folderu
w drzewie źródeł. Zachowuj stabilne identyfikatory scenariuszy, gdy pliki są przenoszone; używaj `docsRefs` i `codeRefs`
do śledzenia powiązań z implementacją.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i czytanie dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Ścieżki atrap dostawców

`qa suite` ma dwie lokalne ścieżki atrap dostawców:

- `mock-openai` to świadoma scenariuszy atrapa OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką atrap dla QA opartego na repozytorium i bramek parzystości.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia
  protokołu, fixture, nagrywania/odtwarzania i chaosu. Jest dodatkiem i nie
  zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada własne wartości domyślne, uruchamianie lokalnego serwera, konfigurację modeli Gateway,
potrzeby stagingu profilu auth oraz flagi możliwości live/mock. Wspólny kod suite i
gateway powinien przechodzić przez rejestr dostawców zamiast rozgałęziać się
po nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada ogólny szew transportu dla scenariuszy QA YAML. `qa-channel` jest
syntetyczną wartością domyślną. `crabline` uruchamia lokalne serwery o kształcie dostawców i uruchamia
normalne pluginy kanałów OpenClaw przeciwko nim. `live` jest zarezerwowane dla rzeczywistych
poświadczeń dostawców i kanałów zewnętrznych.

Na poziomie architektury podział wygląda tak:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu odpowiada za konfigurację gateway, gotowość, obserwację przychodzącą i wychodzącą, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy YAML w `qa/scenarios/` definiują przebieg testu; `qa-lab` dostarcza powierzchnię runtime wielokrotnego użytku, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA YAML wymaga implementacji kanału oraz
pakietu scenariuszy, który ćwiczy kontrakt kanału. Aby uzyskać pokrycie smoke w CI, dodaj
pasujący fałszywy serwer dostawcy Crabline i udostępnij go przez driver `crabline`.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać flow.

`qa-lab` posiada wspólną mechanikę hosta:

- korzeń poleceń `openclaw qa`
- uruchamianie i rozbieranie suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy kompatybilności dla starszych scenariuszy `qa-channel`

Pluginy runnerów posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowany pod współdzielonym korzeniem `qa`
- jak gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym szwie hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe CLI i wykonywanie runnera powinny pozostawać za osobnymi punktami wejścia.
5. Napisz lub dostosuj scenariusze YAML w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych pomocników scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów kompatybilności, chyba że repozytorium wykonuje celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj ogólny pomocnik zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymaj scenariusz jako specyficzny dla transportu i zaznacz to wyraźnie w kontrakcie scenariusza.

### Nazwy pomocników scenariuszy

Preferowane ogólne pomocniki dla nowych scenariuszy:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliasy kompatybilności pozostają dostępne dla istniejących scenariuszy - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ale nowe scenariusze powinny używać nazw ogólnych. Aliasy istnieją po to, aby uniknąć jednorazowej migracji, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z zaobserwowanej osi czasu bus.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze follow-up warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy - przydatny podczas określania rozmiaru prac follow-up lub podłączania nowego transportu - uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać wyjście czytelne maszynowo).
Wybierając ukierunkowany dowód dla dotkniętego zachowania lub ścieżki pliku, uruchom `pnpm openclaw qa coverage --match <query>`.
Raport dopasowania przeszukuje metadane scenariuszy, odwołania do dokumentacji, odwołania do kodu, identyfikatory pokrycia, pluginy i wymagania dostawców, a następnie wypisuje pasujące cele `qa suite --scenario ...`.
Każde uruchomienie `qa suite` zapisuje artefakty najwyższego poziomu `qa-evidence.json`,
`qa-suite-summary.json` i `qa-suite-report.md` dla wybranego
zestawu scenariuszy. Scenariusze deklarujące `execution.kind: vitest` lub
`execution.kind: playwright` uruchamiają pasującą ścieżkę testu i zapisują także
logi per scenariusz. Scenariusze deklarujące `execution.kind: script` uruchamiają
producenta dowodów w `execution.path` przez `node --import tsx` (z
`${outputDir}` i `${scenarioId}` rozwiniętymi w `execution.args`); producent
zapisuje własny `qa-evidence.json`, którego wpisy są importowane do wyjścia suite,
a ścieżki artefaktów są rozwiązywane względem tego producenckiego
`qa-evidence.json`. Gdy `qa suite` jest osiągane przez
`qa run --qa-profile`, ten sam `qa-evidence.json` zawiera także podsumowanie
scorecard profilu dla wybranych kategorii taksonomii.
Traktuj to jako pomoc w odkrywaniu, a nie zastępnik bramki; wybrany scenariusz nadal potrzebuje właściwego trybu dostawcy, transportu live, Multipass, Testbox lub ścieżki wydania dla testowanego zachowania.
Kontekst scorecard znajdziesz w [Maturity scorecard](/pl/maturity/scorecard).

Do sprawdzania charakteru i stylu uruchom ten sam scenariusz na wielu referencjach modeli live
i zapisz oceniony raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Polecenie uruchamia lokalne procesy potomne gateway QA, a nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc w workspace i małe zadania na plikach. Model kandydacki nie powinien
być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh`, gdzie jest wspierane, aby uszeregowały uruchomienia według naturalności, klimatu i humoru.
Używaj `--blind-judge-models` podczas porównywania dostawców: prompt oceniający nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla kompatybilności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby używać priorytetowego przetwarzania tam,
gdzie dostawca je obsługuje. Dodaj `,fast`, `,no-fast` lub `,fast=false` inline, gdy
pojedynczy kandydat lub oceniający potrzebuje nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydackiego. Czasy trwania kandydatów i oceniających są
rejestrowane w raporcie na potrzeby analizy benchmarków, ale prompty oceniające wyraźnie mówią,
aby nie rangować według szybkości.
Uruchomienia modeli kandydackich i oceniających domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity dostawców lub lokalne obciążenie gateway
sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie przekazano kandydata `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie przekazano `--judge-model`, oceniający domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-8,thinking=high`.

## Powiązana dokumentacja

- [Matrix QA](/pl/concepts/qa-matrix)
- [Maturity scorecard](/pl/maturity/scorecard)
- [Personal agent benchmark pack](/pl/concepts/personal-agent-benchmark-pack)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
