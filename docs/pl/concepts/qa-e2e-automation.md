---
read_when:
    - Zrozumienie, jak stos QA współdziała ze sobą
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie automatyzacji QA o wyższym realizmie wokół pulpitu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu live, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-07-01T08:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma ćwiczyć OpenClaw w bardziej realistyczny,
kanałowy sposób, niż pozwala na to pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy runnerów: adaptery transportu na żywo, które
  sterują rzeczywistym kanałem wewnątrz podrzędnego gatewaya QA.
- `qa/`: zasoby początkowe oparte na repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja przed i po na żywo dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Dołączony samosprawdzian QA bez `--qa-profile`; runner profilu dojrzałości opartego na taksonomii z `--qa-profile smoke-ci`, `--qa-profile release` lub `--qa-profile all`.                                                                                            |
| `qa suite`                                          | Uruchom scenariusze oparte na repozytorium względem linii gatewaya QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM Linux.                                                                                                                    |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy YAML (`--json` dla wyjścia maszynowego).                                                                                                                                                                                          |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz raport parytetu agentowego albo użyj `--runtime-axis --token-efficiency`, aby zapisać raporty parytetu runtime Codex-vs-OpenClaw i wydajności tokenów z jednego podsumowania pary runtime.                         |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach na żywo z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                                                                                                                       |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranej linii dostawcy/modelu.                                                                                                                                                                                                     |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                          |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla dashboardu QA + linii gatewaya.                                                                                                                                                                                                      |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos oparty na Dockerze, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Uruchom tylko serwer dostawcy `mock-openai` świadomy scenariuszy.                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                                                                                                                       |
| `qa matrix`                                         | Linia transportu na żywo względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                                                                                          |
| `qa telegram`                                       | Linia transportu na żywo względem rzeczywistej prywatnej grupy Telegram.                                                                                                                                                                                               |
| `qa discord`                                        | Linia transportu na żywo względem rzeczywistego prywatnego kanału gildii Discord.                                                                                                                                                                                       |
| `qa slack`                                          | Linia transportu na żywo względem rzeczywistego prywatnego kanału Slack.                                                                                                                                                                                               |
| `qa whatsapp`                                       | Linia transportu na żywo względem rzeczywistych kont WhatsApp Web.                                                                                                                                                                                                      |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu na żywo, z dowodami reakcji statusu Discord, testem dymnym desktopu/przeglądarki Crabbox i testem dymnym Slack-in-VNC. Zobacz [Mantis](/pl/concepts/mantis) i [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

`qa run` oparty na profilach odczytuje przynależność z `taxonomy.yaml`, a następnie wysyła
rozwiązane scenariusze przez `qa suite`. `--surface` i
`--category` filtrują wybrany profil zamiast definiować osobne linie.
Wynikowy `qa-evidence.json` zawiera podsumowanie karty wyników profilu z
liczbami wybranych kategorii i brakującymi ID pokrycia; poszczególne wpisy
dowodów pozostają źródłem prawdy dla testów, ról pokrycia i wyników.
ID pokrycia funkcji taksonomii są dokładnymi celami dowodowymi, nie aliasami. Pokrycie
scenariusza podstawowego spełnia pasujące ID; pokrycie pomocnicze pozostaje doradcze.
ID pokrycia używają postaci kropkowanego `namespace.behavior` z segmentami
alfanumerycznymi/myślnikowymi pisanymi małymi literami; ID profilu, powierzchni i kategorii nadal mogą używać
istniejących myślnikowych lub kropkowanych ID taksonomii.
Odchudzone dowody pomijają `execution` dla każdego wpisu i ustawiają `evidenceMode: "slim"`;
`smoke-ci` domyślnie używa trybu slim, a `--evidence-mode full` przywraca pełne wpisy:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Użyj `smoke-ci` do deterministycznego dowodu profilu z mockowanymi dostawcami modeli i
lokalnymi serwerami dostawców Crabline. Użyj `release` do dowodu Stable/LTS względem kanałów na żywo.
Używaj `all` tylko dla jawnych przebiegów dowodów pełnej taksonomii; wybiera
każdą aktywną kategorię dojrzałości i może zostać wysłane przez workflow `QA Profile
Evidence` z `qa_profile=all`. Gdy polecenie potrzebuje też profilu głównego OpenClaw,
umieść profil główny przed poleceniem QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: dashboard Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujący transkrypcję podobną do Slacka i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia linię gatewaya opartą na Dockerze i udostępnia stronę
QA Lab, gdzie operator lub pętla automatyzacji może przekazać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału i rejestrować, co zadziałało, co się nie powiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker za każdym razem,
uruchom stos z podmontowanym przez bind pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i podmontowuje przez bind
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmieni się hash zasobu QA Lab.

Dla lokalnego testu dymnego sygnału OpenTelemetry uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik OTLP/HTTP, uruchamia scenariusz QA `otel-trace-smoke`
z włączonym pluginem `diagnostics-otel`, a następnie sprawdza, czy wyeksportowano ślady,
metryki i logi. Dekoduje wyeksportowane spany śladu protobuf
i sprawdza kształt krytyczny dla wydania:
`openclaw.run`, `openclaw.harness.run`, span wywołania modelu zgodny z najnowszą konwencją semantyczną GenAI,
`openclaw.context.assembled` i `openclaw.message.delivery`
muszą być obecne. Test dymny wymusza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, więc span wywołania modelu
musi używać nazwy `{gen_ai.operation.name} {gen_ai.request.model}`;
wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe diagnostyczne ID i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Surowe payloady OTLP
nie mogą zawierać sentinela promptu, sentinela odpowiedzi ani klucza sesji QA.
Zapisuje `otel-smoke-summary.json` obok artefaktów pakietu QA.

Dla testu dymnego OpenTelemetry opartego na kolektorze uruchom:

```bash
pnpm qa:otel:collector-smoke
```

Ta linia umieszcza rzeczywisty kontener Docker OpenTelemetry Collector przed tym samym
lokalnym odbiornikiem. Użyj jej przy zmianie okablowania endpointu, kompatybilności kolektora
lub zachowania eksportu OTLP, które odbiornik w procesie mógłby zamaskować.

Dla chronionego testu dymnego scrapingu Prometheus uruchom:

```bash
pnpm qa:prometheus:smoke
```

Ten alias uruchamia scenariusz QA `docker-prometheus-smoke` z włączonym
`diagnostics-prometheus`, weryfikuje, że nieuwierzytelnione pobrania są odrzucane,
a następnie sprawdza, czy uwierzytelnione pobranie zawiera rodziny metryk
krytyczne dla wydania bez treści promptów, treści odpowiedzi, surowych
identyfikatorów diagnostycznych, tokenów uwierzytelniania ani ścieżek lokalnych.

Aby uruchomić oba testy podstawowe obserwowalności jeden po drugim, użyj:

```bash
pnpm qa:observability:smoke
```

Dla ścieżki OpenTelemetry wspieranej przez kolektor oraz chronionego testu
podstawowego pobierania Prometheus użyj:

```bash
pnpm qa:observability:collector-smoke
```

QA obserwowalności pozostaje dostępne tylko w checkoutcie źródłowym. Tarball npm
celowo pomija QA Lab, więc ścieżki wydań pakietów Docker nie uruchamiają poleceń
`qa`. Użyj `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` albo
`pnpm qa:observability:smoke` z zbudowanego checkoutu źródłowego podczas zmiany
instrumentacji diagnostycznej.

Dla transportowo rzeczywistej ścieżki testu podstawowego Matrix, która nie wymaga
poświadczeń dostawcy modeli, uruchom szybki profil z deterministycznym
mockowanym dostawcą OpenAI:

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

Pełna dokumentacja referencyjna CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [QA Matrix](/pl/concepts/qa-matrix). W skrócie: udostępnia jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników sterownika/SUT/obserwatora, uruchamia rzeczywisty Plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt zaobserwowanych zdarzeń i połączony dziennik wyjściowy w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Scenariusze obejmują zachowanie transportu, którego testy jednostkowe nie mogą udowodnić end to end: bramkowanie wzmianek, zasady allow-bot, allowlisty, odpowiedzi najwyższego poziomu i w wątkach, routowanie DM, obsługę reakcji, tłumienie przychodzących edycji, deduplikację odtworzenia po restarcie, odzyskiwanie po przerwaniu homeservera, dostarczanie metadanych zatwierdzeń, obsługę mediów oraz przepływy inicjowania/odzyskiwania/weryfikacji E2EE Matrix. Profil CLI E2EE uruchamia także `openclaw matrix encryption setup` i polecenia weryfikacji przez ten sam jednorazowy homeserver przed sprawdzeniem odpowiedzi Gateway.

Discord ma również opcjonalne scenariusze tylko dla Mantis do reprodukcji błędów. Użyj
`--scenario discord-status-reactions-tool-only` dla jawnej osi czasu reakcji statusu
albo `--scenario discord-thread-reply-filepath-attachment`, aby utworzyć
rzeczywisty wątek Discord i zweryfikować, że `message.thread-reply` zachowuje
załącznik `filePath`. Te scenariusze pozostają poza domyślną ścieżką live Discord,
ponieważ są sondami reprodukcji przed/po, a nie szerokim pokryciem testów podstawowych.
Workflow Mantis dla załącznika w wątku może też dodać nagranie wideo świadka
Discord Web z zalogowanym użytkownikiem, gdy w środowisku QA skonfigurowano
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` albo
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Ten profil przeglądarki służy
wyłącznie do przechwytywania wizualnego; decyzja pass/fail nadal pochodzi
z wyroczni Discord REST.

CI używa tej samej powierzchni poleceń w `.github/workflows/qa-live-transports-convex.yml`.
Zaplanowane i domyślne uruchomienia ręczne wykonują szybki profil Matrix
z dostarczonymi przez QA poświadczeniami live-frontier, `--fast` i
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ręczne `matrix_profile=all` rozdziela
uruchomienie na pięć shardów profili.

Dla transportowo rzeczywistych ścieżek testów podstawowych Telegram, Discord, Slack i WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Celują one w istniejący wcześniej rzeczywisty kanał z dwoma botami lub kontami (sterownik + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane poniżej w [dokumentacji referencyjnej QA dla Telegram, Discord, Slack i WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Dla pełnego uruchomienia VM pulpitu Slack z ratunkowym VNC uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę desktop/przeglądarka Crabbox, uruchamia ścieżkę
live Slack wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit
i kopiuje `slack-qa/`, `slack-desktop-smoke.png` oraz `slack-desktop-smoke.mp4`,
gdy przechwytywanie wideo jest dostępne, z powrotem do katalogu artefaktów Mantis.
Dzierżawy desktop/przeglądarka Crabbox dostarczają z góry narzędzia przechwytywania
oraz pakiety pomocnicze przeglądarki/natywnego buildu, więc scenariusz powinien
instalować rozwiązania awaryjne tylko na starszych dzierżawach. Mantis raportuje
całkowite czasy i czasy poszczególnych faz w `mantis-slack-desktop-smoke-report.md`,
aby wolne uruchomienia pokazywały, czy czas został zużyty na rozgrzewanie dzierżawy,
pozyskanie poświadczeń, zdalną konfigurację czy kopiowanie artefaktów. Użyj ponownie
`--lease-id <cbx_...>` po ręcznym zalogowaniu do Slack Web przez VNC; ponownie
użyte dzierżawy utrzymują też ciepły cache pnpm store Crabbox. Domyślne
`--hydrate-mode source` weryfikuje z checkoutu źródłowego i uruchamia install/build
wewnątrz VM. Używaj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używany
zdalny workspace ma już `node_modules` i zbudowany `dist/`; ten tryb pomija kosztowny
krok install/build i kończy się bezpieczną porażką, gdy workspace nie jest gotowy.
Z `--gateway-setup` Mantis pozostawia trwały Gateway OpenClaw Slack działający
wewnątrz VM na porcie `38973`; bez tego polecenie uruchamia normalną ścieżkę QA
Slack bot-to-bot i kończy działanie po przechwyceniu artefaktów.

Aby udowodnić natywny interfejs zatwierdzania Slack z dowodami desktopowymi, uruchom
tryb punktów kontrolnych zatwierdzeń Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ten tryb wzajemnie wyklucza się z `--gateway-setup`. Uruchamia scenariusze
zatwierdzeń Slack, odrzuca identyfikatory scenariuszy niebędących zatwierdzeniami,
czeka przy każdym stanie oczekującego i rozwiązanego zatwierdzenia, renderuje
zaobserwowaną wiadomość Slack API do `approval-checkpoints/<scenario>-pending.png`
i `approval-checkpoints/<scenario>-resolved.png`, a następnie kończy się porażką,
jeśli brakuje któregokolwiek punktu kontrolnego, dowodu wiadomości, potwierdzenia
albo wyrenderowanego zrzutu ekranu lub jeśli jest pusty. Zimne dzierżawy CI mogą
nadal pokazywać logowanie Slack w `slack-desktop-smoke.png`; obrazy punktów
kontrolnych zatwierdzeń są dowodem wizualnym dla tej ścieżki.

Lista kontrolna operatora, polecenie dispatch workflow GitHub, kontrakt komentarza
dowodowego, tabela decyzji trybu hydrate, interpretacja czasów i kroki obsługi
awarii znajdują się w [runbooku Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Dla zadania desktopowego w stylu agenta/CV uruchom:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` dzierżawi albo ponownie używa maszyny desktop/przeglądarka Crabbox,
uruchamia `crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, przechwytuje `visual-task.png`, uruchamia `openclaw infer image describe`
na zrzucie ekranu, gdy wybrano `--vision-mode image-describe`, i zapisuje
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` oraz `mantis-visual-task-report.md`.
Gdy ustawiono `--expect-text`, prompt wizyjny prosi o ustrukturyzowany werdykt JSON
i przechodzi tylko wtedy, gdy model zgłasza pozytywny widoczny dowód; negatywna
odpowiedź, która jedynie cytuje tekst docelowy, nie spełnia asercji.
Użyj `--vision-mode metadata` dla testu podstawowego bez modelu, który dowodzi
działania pulpitu, przeglądarki, zrzutu ekranu i nagrywania wideo bez wywoływania
dostawcy rozumienia obrazu. Nagranie jest wymaganym artefaktem dla `visual-task`;
jeśli Crabbox nie nagra niepustego `visual-task.mp4`, zadanie kończy się porażką
nawet wtedy, gdy sterownik wizualny przeszedł. W razie niepowodzenia Mantis
zachowuje dzierżawę dla VNC, chyba że zadanie już przeszło, a `--keep-lease`
nie zostało ustawione.

Przed użyciem pulowanych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, weryfikuje ustawienia endpointów i sprawdza osiągalność admin/list, gdy obecny jest sekret maintainer. Raportuje tylko status ustawione/brak dla sekretów.

## Pokrycie transportów live

Ścieżki transportów live współdzielą jeden kontrakt zamiast wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia transportów live.

Runnery transportów live powinny importować współdzielone identyfikatory scenariuszy,
pomocniki pokrycia bazowego i pomocnik wyboru scenariuszy z
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Ścieżka  | Canary | Bramkowanie wzmianek | Bot-to-bot | Blokada allowlisty | Odpowiedź najwyższego poziomu | Odpowiedź z cytatem | Wznowienie po restarcie | Dalsza odpowiedź w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja natywnego polecenia |
| -------- | ------ | -------------------- | ---------- | ------------------ | ----------------------------- | ------------------- | ----------------------- | ------------------------ | -------------- | ------------------ | ---------------- | ------------------------------- |
| Matrix   | x      | x                    | x          | x                  | x                             |                     | x                       | x                        | x              | x                  |                  |                                 |
| Telegram | x      | x                    | x          |                    |                               |                     |                         |                          |                |                    | x                |                                 |
| Discord  | x      | x                    | x          |                    |                               |                     |                         |                          |                |                    |                  | x                               |
| Slack    | x      | x                    | x          | x                  | x                             |                     | x                       | x                        | x              |                    |                  |                                 |
| WhatsApp | x      | x                    |            | x                  | x                             | x                   | x                       |                          |                | x                  | x                |                                 |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix,
Telegram i inne transporty live współdzielą jedną jawną listę kontrolną kontraktu transportu.

Dla jednorazowej ścieżki VM Linux bez wprowadzania Dockera do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Uruchamia to świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA
i podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych
scenariuszy równolegle z izolowanymi workerami Gateway. `qa-channel` domyślnie
używa współbieżności 4, ograniczonej liczbą wybranych scenariuszy. Użyj
`--concurrency <count>`, aby dostroić liczbę workerów, albo `--concurrency 1`
dla wykonania szeregowego.
Użyj `--pack personal-agent`, aby uruchomić pakiet benchmarku osobistego asystenta.
Selektor pakietów jest addytywny względem powtarzanych flag `--scenario`: jawne
scenariusze uruchamiają się najpierw, a potem scenariusze pakietu w kolejności
pakietu z usuniętymi duplikatami.
Użyj `--pack observability`, gdy niestandardowy runner QA już dostarcza konfigurację
kolektora OpenTelemetry i chce razem wybrać scenariusze testów podstawowych
diagnostyki OpenTelemetry oraz Prometheus.
Polecenie kończy się kodem niezerowym, gdy jakikolwiek scenariusz zakończy się
niepowodzeniem. Użyj `--allow-failures`, gdy chcesz uzyskać artefakty bez
niepowodzącego kodu wyjścia.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA praktyczne
dla gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live
oraz `CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym
repozytorium, aby gość mógł zapisywać z powrotem przez zamontowany workspace.

## Dokumentacja referencyjna QA dla Telegram, Discord, Slack i WhatsApp

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera wspierane przez Docker. Telegram, Discord, Slack i WhatsApp działają na wcześniej istniejących rzeczywistych transportach, dlatego ich dokumentacja referencyjna znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślna                                          | Opis                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Uruchom tylko ten scenariusz. Można powtarzać.                                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Miejsce zapisu raportów, podsumowań, dowodów, artefaktów specyficznych dla transportu i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                                                                    |
| `--sut-account <id>`                  | `sut`                                             | Tymczasowy identyfikator konta w konfiguracji QA gateway.                                                                                                        |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` albo `live-frontier` (starsze `live-openai` nadal działa).                                                                                         |
| `--model <ref>` / `--alt-model <ref>` | domyślna dostawcy                                 | Referencje modelu podstawowego/alternatywnego.                                                                                                                   |
| `--fast`                              | wyłączone                                         | Szybki tryb dostawcy tam, gdzie jest obsługiwany.                                                                                                                |
| `--credential-source <env\|convex>`   | `env`                                             | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`        | Rola używana, gdy `--credential-source convex`.                                                                                                                  |

Każda ścieżka kończy działanie kodem niezerowym przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania błędnego kodu wyjścia.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma odrębnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony tryb **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane zmienne env, gdy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numeryczny identyfikator czatu (string).
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

Niejawny zestaw domyślny zawsze obejmuje canary, bramkowanie wzmianek, odpowiedzi poleceń natywnych, adresowanie poleceń i odpowiedzi grupowe bot-do-bota. Domyślne `mock-openai` obejmują również deterministyczne kontrole łańcucha odpowiedzi i strumieniowania wiadomości końcowej. `telegram-current-session-status-tool` pozostaje opcjonalny, ponieważ jest stabilny tylko wtedy, gdy jest wykonywany w wątku bezpośrednio po canary, a nie po dowolnych natywnych odpowiedziach poleceń. Użyj `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, aby wypisać bieżący podział domyślne/opcjonalne z referencjami regresji.

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu na żywo, w tym pola profilu, pokrycia, dostawcy, kanału, artefaktów, wyniku i RTT.

Pakietowe uruchomienia Telegram używają tego samego kontraktu poświadczeń Telegram. Powtarzany pomiar RTT jest częścią normalnej pakietowej ścieżki Telegram na żywo; rozkład RTT jest składany do `qa-evidence.json` pod `result.timing` dla wybranej kontroli RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Gdy ustawione jest `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, pakietowy wrapper live dzierżawi poświadczenie `kind: "telegram"`, eksportuje wydzierżawione zmienne env grupy/drivera/bota SUT do uruchomienia z zainstalowanego pakietu, wysyła Heartbeat dzierżawy i zwalnia ją przy zamknięciu. Pakietowy wrapper domyślnie wykonuje 20 kontroli RTT scenariusza `telegram-mentioned-message-reply`, ma timeout RTT 30 s oraz rolę Convex `maintainer` poza CI, gdy wybrano Convex. Nadpisz `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` lub `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostroić pomiar RTT bez tworzenia osobnego polecenia RTT ani formatu podsumowania specyficznego dla Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem drivera kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodowe Mantis.

Wymagane zmienne env, gdy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi odpowiadać identyfikatorowi użytkownika bota SUT zwracanemu przez Discord (w przeciwnym razie ścieżka szybko kończy się niepowodzeniem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach obserwowanych wiadomości.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wybiera kanał głosowy/sceniczny dla `discord-voice-autojoin`; bez tego scenariusz wybiera pierwszy widoczny kanał głosowy/sceniczny dla bota SUT.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opcjonalny scenariusz głosowy. Uruchamia się samodzielnie, włącza `channels.discord.voice.autoJoin` i weryfikuje, że bieżący stan głosowy Discord bota SUT to docelowy kanał głosowy/sceniczny. Poświadczenia Convex Discord mogą zawierać opcjonalne `voiceChannelId`; w przeciwnym razie runner wykrywa pierwszy widoczny kanał głosowy/sceniczny w gildii.
- `discord-status-reactions-tool-only` - opcjonalny scenariusz Mantis. Uruchamia się samodzielnie, ponieważ przełącza SUT na zawsze aktywne odpowiedzi gildii tylko narzędziowe z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed/po zachowują również artefakty MP4 dostarczone przez scenariusz jako `baseline.mp4` i `candidate.mp4`.

Uruchom scenariusz automatycznego dołączania do głosu Discord jawnie:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Uruchom scenariusz reakcji statusu Mantis jawnie:

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
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu na żywo.
- `discord-qa-observed-messages.json` - treści zredagowane, chyba że `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy działa scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem drivera kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączony Plugin Slack.

Wymagane zmienne env, gdy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach obserwowanych wiadomości.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` włącza wizualne punkty kontrolne zatwierdzania dla Mantis. Runner zapisuje `<scenario>.pending.json` i `<scenario>.resolved.json`, a następnie czeka na pasujące pliki `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` nadpisuje timeout potwierdzenia punktu kontrolnego. Wartość domyślna to `120000`.

Scenariusze (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opcjonalny scenariusz natywnego zatwierdzania exec Slack. Żąda zatwierdzenia exec przez Gateway, weryfikuje, że wiadomość Slack ma natywne przyciski zatwierdzania, rozwiązuje je i weryfikuje rozwiązaną aktualizację Slack.
- `slack-approval-plugin-native` - opcjonalny scenariusz natywnego zatwierdzania pluginu Slack. Włącza przekazywanie zatwierdzeń exec i plugin razem, aby zdarzenia pluginu nie były tłumione przez routing zatwierdzeń exec, a następnie weryfikuje tę samą oczekującą/rozwiązaną ścieżkę natywnego UI Slack.

Artefakty wyjściowe:

- `slack-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu na żywo.
- `slack-qa-observed-messages.json` - treści zredagowane, chyba że `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - tylko gdy Mantis ustawia `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; zawiera JSON punktu kontrolnego, JSON potwierdzenia i zrzuty ekranu oczekujące/rozwiązane.

#### Konfigurowanie workspace Slack

Ścieżka potrzebuje dwóch odrębnych aplikacji Slack w jednym workspace oraz kanału, którego członkami są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być osobną aplikacją Slack niż driver, aby identyfikator jej użytkownika bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj workspace Slack dedykowany do QA zamiast ponownego używania workspace produkcyjnego.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonego Pluginu Slack (`extensions/slack/src/setup-shared.ts:10`) do uprawnień i zdarzeń objętych zestawem live Slack QA. Konfigurację kanału produkcyjnego widzianą przez użytkowników opisuje [szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ ścieżka potrzebuje dwóch odrębnych identyfikatorów użytkowników botów w jednym workspace.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wybierz obszar roboczy QA, wklej poniższy manifest, a następnie _Install to Workspace_:

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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) - stanie się on `driverBotToken`. Sterownik musi tylko publikować wiadomości i identyfikować samego siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Create New App → From a manifest_ w tym samym obszarze roboczym. Ta aplikacja QA celowo używa węższej wersji produkcyjnego manifestu dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`): zakresy i zdarzenia reakcji zostały pominięte, ponieważ zestaw live QA Slack nie obejmuje jeszcze obsługi reakcji.

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

- _Install to Workspace_ → skopiuj _Bot User OAuth Token_ → stanie się on `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → stanie się ona `sutAppToken`.

Zweryfikuj, że oba boty mają różne identyfikatory użytkownika, wywołując `auth.test` dla każdego tokena. Runtime rozróżnia sterownik i SUT według identyfikatora użytkownika; ponowne użycie jednej aplikacji do obu ról natychmiast spowoduje niepowodzenie bramkowania wzmianek.

**3. Utwórz kanał**

W obszarze roboczym QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba boty z poziomu kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _channel info → About → Channel ID_ - stanie się on `channelId`. Kanał publiczny zadziała; jeśli użyjesz kanału prywatnego, obie aplikacje mają już `groups:history`, więc odczyty historii przez harness nadal się powiodą.

**4. Zarejestruj poświadczenia**

Są dwie opcje. Użyj zmiennych środowiskowych do debugowania na jednej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasil współdzieloną pulę Convex, aby CI i inni opiekunowie mogli je dzierżawić.

Dla puli Convex zapisz cztery pola do pliku JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Po wyeksportowaniu `OPENCLAW_QA_CONVEX_SITE_URL` i `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` w swojej powłoce zarejestruj i zweryfikuj:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Oczekuj `count: 1`, `status: "active"`, bez pola `lease`.

**5. Zweryfikuj całość end to end**

Uruchom ścieżkę lokalnie, aby potwierdzić, że oba boty mogą rozmawiać ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielony przebieg kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli ścieżka zawiesza się na około 90 sekund i kończy z komunikatem `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest wydzierżawiony - `qa credentials list --kind slack --status all --json` pokaże, która sytuacja występuje.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Celuje w dwa dedykowane konta WhatsApp Web: konto sterownika kontrolowane przez
harness oraz konto SUT uruchamiane przez podrzędny OpenClaw Gateway przez
dołączony Plugin WhatsApp.

Wymagane zmienne env przy `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcjonalne:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` włącza scenariusze grupowe, takie jak
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenariusze grupowych akcji, mediów i ankiet oraz
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` zachowuje treść wiadomości w
  artefaktach zaobserwowanych wiadomości.

Katalog scenariuszy (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Linia bazowa i bramkowanie grupowe: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Natywne polecenia: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Zachowanie odpowiedzi i końcowego wyjścia: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Akcje wiadomości na ścieżce użytkownika: `whatsapp-agent-message-action-react` zaczyna od
  prawdziwej wiadomości DM sterownika, pozwala modelowi wywołać narzędzie `message` i obserwuje
  natywną reakcję WhatsApp. `whatsapp-agent-message-action-upload-file` używa
  tej samej postawy dla `message(action=upload-file)` i obserwuje natywne
  media WhatsApp. `whatsapp-group-agent-message-action-react` oraz
  `whatsapp-group-agent-message-action-upload-file` dowodzą tych samych widocznych dla użytkownika
  akcji w prawdziwej grupie WhatsApp.
- Fanout grupowy: `whatsapp-broadcast-group-fanout` zaczyna od jednej wspomnianej
  wiadomości w grupie WhatsApp i weryfikuje odrębne widoczne odpowiedzi z `main` oraz
  `qa-second`.
- Aktywacja grupowa: `whatsapp-group-activation-always` zmienia prawdziwą sesję grupową
  na `/activation always`, dowodzi, że wiadomość grupowa bez wzmianki wybudza
  agenta, a następnie przywraca `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  zasiewa odpowiedź bota, wysyła natywną cytowaną odpowiedź do niej bez jawnej
  wzmianki i weryfikuje, że agent wybudza się z tego kontekstu odpowiedzi.
- Media przychodzące i wiadomości strukturalne: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Wysyłają one przez sterownik prawdziwe zdarzenia obrazu, audio, dokumentu, lokalizacji, kontaktu, naklejki
  i reakcji WhatsApp.
- Bezpośrednie sondy kontraktu Gateway:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Celowo omijają promptowanie modelu i
  dowodzą deterministycznych kontraktów Gateway/kanału `send`, `poll` oraz `message.action`.
- Pokrycie kontroli dostępu: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Natywne zatwierdzenia: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reakcje statusu: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Katalog zawiera obecnie 50 scenariuszy. Domyślna ścieżka `live-frontier` jest
utrzymywana jako mała, z 10 scenariuszami, na potrzeby szybkiego pokrycia smoke. Domyślna
ścieżka `mock-openai` uruchamia 44 deterministyczne scenariusze przez prawdziwy transport WhatsApp,
mockując tylko wyjście modelu. Scenariusze zatwierdzeń i kilka cięższych/blokujących kontroli
pozostają jawne przez identyfikator scenariusza.

Sterownik QA WhatsApp obserwuje strukturalne zdarzenia live (`text`, `media`,
`location`, `reaction` i `poll`) oraz może aktywnie wysyłać media, ankiety,
kontakty, lokalizacje i naklejki. QA Lab importuje ten sterownik przez powierzchnię pakietu
`@openclaw/whatsapp/api.js`, zamiast sięgać do prywatnych
plików runtime WhatsApp. Dla obserwacji grupowych `fromJid` jest JID grupy, a
`participantJid` i `fromPhoneE164` identyfikują uczestnika wysyłającego. Treść
wiadomości jest domyślnie redagowana. Bezpośrednie sondy Gateway dla
ankiety, upload-file, mediów, ankiety grupowej, mediów grupowych i kształtu odpowiedzi są kontrolami kontraktu transportu/API;
nie są traktowane jako dowód, że prompt użytkownika sprawił, iż agent wybrał
tę samą akcję. Dowód akcji na ścieżce użytkownika pochodzi ze scenariuszy takich jak
`whatsapp-agent-message-action-react` i
`whatsapp-group-agent-message-action-react`, w których sterownik wysyła zwykłą
wiadomość WhatsApp, a QA Lab obserwuje wynikowy natywny artefakt WhatsApp.
Raporty WhatsApp zawierają postawę każdego scenariusza (`user-path`, `direct-gateway`
lub `native-approval`), aby dowody nie mogły zostać pomylone z silniejszym kontraktem
niż ten, którego faktycznie dowodzą.

Artefakty wyjściowe:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live.
- `whatsapp-qa-observed-messages.json` - treści redagowane, chyba że ustawiono `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pula poświadczeń Convex

Ścieżki Telegram, Discord, Slack i WhatsApp mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne env. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas trwania przebiegu i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"`, `"slack"` i `"whatsapp"`.

Kształty payloadów walidowane przez brokera przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Prawdziwy użytkownik Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - tylko dowód Mantis Telegram Desktop. Ogólne ścieżki QA Lab nie mogą pozyskiwać tego rodzaju.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - numery telefonów muszą być odrębnymi ciągami E.164.

Przepływ dowodu Mantis Telegram Desktop utrzymuje jedną wyłączną dzierżawę Convex
`telegram-user` zarówno dla sterownika TDLib CLI, jak i świadka Telegram Desktop,
a następnie zwalnia ją po opublikowaniu dowodu.

Gdy PR potrzebuje deterministycznego wizualnego diffu, Mantis może użyć tej samej makiety odpowiedzi modelu
na `main` i na głowicy PR, podczas gdy zmienia się formater Telegram lub warstwa dostarczania.
Domyślne ustawienia przechwytywania są dostrojone do komentarzy PR: standardowa klasa Crabbox,
nagranie pulpitu 24fps, ruchomy GIF 24fps i szerokość podglądu 1920px.
Komentarze przed/po powinny publikować czysty pakiet zawierający tylko
zamierzone GIF-y.

Ścieżki Slack również mogą używać puli. Kontrole kształtu ładunku Slack obecnie znajdują się w runnerze Slack QA, a nie w brokerze; użyj `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, z identyfikatorem kanału Slack takim jak `Cxxxxxxxxxx`. Zobacz [Konfigurowanie przestrzeni roboczej Slack](#setting-up-the-slack-workspace), aby poznać provisioning aplikacji i zakresów.

Operacyjne zmienne środowiskowe oraz kontrakt punktu końcowego brokera Convex znajdują się w [Testowanie → Wspólne poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji poprzedza pulę wielokanałową; semantyka dzierżawy jest wspólna dla wszystkich rodzajów).

## Seedy wspierane przez repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Są celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać ogólnym runnerem scenariuszy YAML. Każdy plik YAML scenariusza jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- najwyższego poziomu `title`
- metadane `scenario`
- opcjonalne metadane kategorii, capability, ścieżki i ryzyka w `scenario`
- odwołania do dokumentacji i kodu w `scenario`
- opcjonalne wymagania Pluginu w `scenario`
- opcjonalną łatkę konfiguracji Gateway w `scenario`
- wykonywalny najwyższego poziomu `flow` dla scenariuszy przepływu albo `scenario.execution.kind` /
  `scenario.execution.path` dla scenariuszy Vitest i Playwright

Wielokrotnego użytku powierzchnia runtime obsługująca `flow` może pozostać ogólna
i przekrojowa. Na przykład scenariusze YAML mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
szew Gateway `browser.request` bez dodawania specjalnego runnera.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie folderu
drzewa źródeł. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Ścieżki makiet dostawców

`qa suite` ma dwie lokalne ścieżki makiet dostawców:

- `mock-openai` to świadoma scenariuszy makieta OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką makiety dla QA wspieranego przez repozytorium i bramek parytetu.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego protokołu,
  fixture’ów, nagrywania/odtwarzania i pokrycia chaosu. Jest dodatkiem i nie
  zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada swoje wartości domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway,
potrzeby stagingu profilu auth oraz flagi capability live/mock. Wspólny kod suite i
Gateway powinien trasować przez rejestr dostawców zamiast rozgałęziać się po
nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada ogólny szew transportu dla scenariuszy QA YAML. `qa-channel` jest
syntetycznym ustawieniem domyślnym. `crabline` uruchamia lokalne serwery w kształcie dostawców i uruchamia
normalne Pluginy kanałów OpenClaw względem nich. `live` jest zarezerwowany dla rzeczywistych
poświadczeń dostawców i kanałów zewnętrznych.

Na poziomie architektury podział jest następujący:

- `qa-lab` posiada ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu posiada konfigurację Gateway, gotowość, obserwację przychodzącą i wychodzącą, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy YAML pod `qa/scenarios/` definiują uruchomienie testu; `qa-lab` udostępnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA YAML wymaga implementacji kanału oraz
pakietu scenariuszy, który ćwiczy kontrakt kanału. Dla pokrycia smoke CI dodaj
odpowiedni lokalny serwer dostawcy Crabline i wystaw go przez sterownik `crabline`.

Nie dodawaj nowego najwyższego poziomu katalogu poleceń QA, gdy współdzielony host `qa-lab` może posiadać przepływ.

`qa-lab` posiada współdzielone mechanizmy hosta:

- katalog poleceń `openclaw qa`
- uruchamianie i zamykanie suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowany pod współdzielonym katalogiem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego katalogu `qa`.
2. Zaimplementuj runner transportu na współdzielonym szwie hosta `qa-lab`.
3. Trzymaj mechanizmy specyficzne dla transportu wewnątrz Pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie katalogowe. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe CLI i wykonywanie runnera powinny pozostać za osobnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze YAML w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych pomocników scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repozytorium wykonuje intencjonalną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym Pluginie runnera lub harnessie Pluginu.
- Jeśli scenariusz potrzebuje nowej capability, z której może korzystać więcej niż jeden kanał, dodaj ogólny pomocnik zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymaj scenariusz jako specyficzny dla transportu i zaznacz to jawnie w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ale nowe scenariusze powinny używać ogólnych nazw. Aliasy istnieją, aby uniknąć migracji flag-day, a nie jako docelowy model.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z zaobserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co zawiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy - przydatny przy szacowaniu pracy uzupełniającej lub podłączaniu nowego transportu - uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane czytelne maszynowo).
Wybierając ukierunkowany dowód dla dotkniętego zachowania lub ścieżki pliku, uruchom `pnpm openclaw qa coverage --match <query>`.
Raport dopasowań przeszukuje metadane scenariuszy, odwołania do dokumentacji, odwołania do kodu, identyfikatory pokrycia, Pluginy i wymagania dostawców, a następnie wypisuje pasujące cele `qa suite --scenario ...`.
Każde uruchomienie `qa suite` zapisuje najwyższego poziomu artefakty
`qa-evidence.json`, `qa-suite-summary.json` i `qa-suite-report.md` dla wybranego
zestawu scenariuszy. Scenariusze deklarujące `execution.kind: vitest` lub
`execution.kind: playwright` uruchamiają pasującą ścieżkę testu i zapisują też
logi per scenariusz. Scenariusze deklarujące `execution.kind: script` uruchamiają
producenta dowodu pod `execution.path` przez `node --import tsx` (z
`${outputDir}` i `${scenarioId}` rozwiniętymi w `execution.args`); producent
zapisuje własny `qa-evidence.json`, którego wpisy są importowane do wyjścia
suite, a ścieżki artefaktów są rozwiązywane względem tego producenckiego
`qa-evidence.json`. Gdy `qa suite` jest osiągnięte przez
`qa run --qa-profile`, ten sam `qa-evidence.json` zawiera również podsumowanie
scorecard profilu dla wybranych kategorii taksonomii.
Traktuj to jako pomoc w odkrywaniu, a nie zamiennik bramki; wybrany scenariusz nadal potrzebuje właściwego trybu dostawcy, transportu live, Multipass, Testbox lub ścieżki wydania dla testowanego zachowania.
Kontekst scorecard znajduje się w [Scorecard dojrzałości](/pl/maturity/scorecard).

Dla kontroli charakteru i stylu uruchom ten sam scenariusz względem wielu refs modeli live
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

Polecenie uruchamia lokalne procesy potomne QA Gateway, a nie Docker. Scenariusze
ewaluacji postaci powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać
zwykłe tury użytkownika, takie jak czat, pomoc w obszarze roboczym i małe zadania
na plikach. Model kandydujący nie powinien być informowany, że jest oceniany.
Polecenie zachowuje każdy pełny transkrypt, zapisuje podstawowe statystyki
uruchomienia, a następnie prosi modele oceniające w trybie szybkim z rozumowaniem
`xhigh`, tam gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności,
klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt oceniający nadal
otrzymuje każdy transkrypt i status uruchomienia, ale referencje kandydatów są
zastępowane neutralnymi etykietami, takimi jak `candidate-01`; raport mapuje rankingi
z powrotem na rzeczywiste referencje po parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5
i `xhigh` dla starszych referencji ewaluacyjnych OpenAI, które je obsługują.
Nadpisz konkretnego kandydata w miejscu użycia za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>`
jest zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, aby tam, gdzie
dostawca go obsługuje, używać przetwarzania priorytetowego. Dodaj `,fast`,
`,no-fast` albo `,fast=false` w miejscu użycia, gdy pojedynczy kandydat lub
oceniający potrzebuje nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz wymusić
tryb szybki dla każdego modelu kandydującego. Czasy trwania kandydatów i modeli
oceniających są zapisywane w raporcie na potrzeby analizy benchmarków, ale prompty
oceniające wyraźnie mówią, aby nie ustalać rankingu według szybkości.
Uruchomienia modeli kandydatów i oceniających domyślnie używają współbieżności 16.
Obniż `--concurrency` albo `--judge-concurrency`, gdy limity dostawcy lub obciążenie
lokalnego Gateway sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie przekazano żadnego kandydującego `--model`, ewaluacja postaci domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano żadnego `--model`.
Gdy nie przekazano `--judge-model`, modele oceniające domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-8,thinking=high`.

## Powiązana dokumentacja

- [Macierz QA](/pl/concepts/qa-matrix)
- [Karta oceny dojrzałości](/pl/maturity/scorecard)
- [Pakiet benchmarków osobistego agenta](/pl/concepts/personal-agent-benchmark-pack)
- [Kanał QA](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Panel](/pl/web/dashboard)
