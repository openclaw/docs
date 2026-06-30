---
read_when:
    - Zrozumienie, jak łączy się stos QA
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie automatyzacji QA o wyższym realizmie wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-06-30T14:28:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma ćwiczyć OpenClaw w bardziej realistyczny,
ukształtowany przez kanały sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe Pluginy runnerów: adaptery transportu na żywo, które
  sterują rzeczywistym kanałem wewnątrz podrzędnego Gateway QA.
- `qa/`: zasoby początkowe wspierane przez repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja na żywo przed i po dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu z przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy
skryptów `pnpm qa:*`; obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany autotest QA bez `--qa-profile`; runner profilu dojrzałości wspieranego taksonomią z `--qa-profile smoke-ci`, `--qa-profile release` lub `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Uruchom scenariusze wspierane przez repozytorium względem toru Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM Linux.                                                                                                               |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy YAML (`--json` dla wyjścia maszynowego).                                                                                                                                                                                          |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parytetu albo użyj `--runtime-axis --token-efficiency`, aby zapisać raporty parytetu czasu wykonania Codex-vs-OpenClaw i efektywności tokenów z jednego podsumowania pary środowisk wykonawczych. |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach na żywo z raportem ocenionym przez sędziego. Zobacz [Raportowanie](#reporting).                                                                                                                                         |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranego toru dostawcy/modelu.                                                                                                                                                                                                     |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla pulpitu QA + toru Gateway.                                                                                                                                                                                                           |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos wspierany przez Docker, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                            |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą danych uwierzytelniających Convex.                                                                                                                                                                                                         |
| `qa matrix`                                         | Tor transportu na żywo względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                                                                                             |
| `qa telegram`                                       | Tor transportu na żywo względem rzeczywistej prywatnej grupy Telegram.                                                                                                                                                                                                  |
| `qa discord`                                        | Tor transportu na żywo względem rzeczywistego prywatnego kanału gildii Discord.                                                                                                                                                                                         |
| `qa slack`                                          | Tor transportu na żywo względem rzeczywistego prywatnego kanału Slack.                                                                                                                                                                                                  |
| `qa whatsapp`                                       | Tor transportu na żywo względem rzeczywistych kont WhatsApp Web.                                                                                                                                                                                                        |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu na żywo, z dowodami reakcji statusu Discord, testem smoke pulpitu/przeglądarki Crabbox i testem smoke Slack-in-VNC. Zobacz [Mantis](/pl/concepts/mantis) i [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

`qa run` wspierane przez profil odczytuje przynależność z `taxonomy.yaml`, a następnie wysyła
rozwiązane scenariusze przez `qa suite`. `--surface` i
`--category` filtrują wybrany profil zamiast definiować osobne tory.
Wynikowy `qa-evidence.json` zawiera podsumowanie scorecard profilu z
licznikami wybranych kategorii i brakującymi ID pokrycia; poszczególne wpisy
dowodów pozostają źródłem prawdy dla testów, ról pokrycia i wyników.
ID pokrycia funkcji taksonomii są dokładnymi celami dowodowymi, nie aliasami. Główne
pokrycie scenariusza spełnia pasujące ID; pokrycie wtórne pozostaje doradcze.
ID pokrycia używają kropkowanej formy `namespace.behavior` z segmentami
alfanumerycznymi/myślnikowymi zapisanymi małymi literami; ID profilu, powierzchni i kategorii nadal mogą używać
istniejących myślnikowych lub kropkowanych ID taksonomii.
Odchudzone dowody pomijają `execution` dla każdego wpisu i ustawiają `evidenceMode: "slim"`;
`smoke-ci` domyślnie używa trybu odchudzonego, a `--evidence-mode full` przywraca pełne wpisy:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Używaj `smoke-ci` do deterministycznego dowodu profilu z mockowymi dostawcami modeli i
lokalnymi serwerami dostawcy Crabline. Używaj `release` do dowodu Stable/LTS względem kanałów
na żywo. Używaj `all` tylko do jawnych przebiegów dowodowych pełnej taksonomii; wybiera
każdą aktywną kategorię dojrzałości i może zostać wysłane przez workflow `QA Profile
Evidence` z `qa_profile=all`. Gdy polecenie potrzebuje też głównego profilu OpenClaw,
umieść profil główny przed poleceniem QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: pulpit Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujący transkrypcję w stylu Slack i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia wspierany przez Docker tor Gateway i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może dać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału i zapisywać, co zadziałało, nie powiodło się lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z pakietem QA Lab zamontowanym przez bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i montuje przez bind mount
`extensions/qa-lab/web/dist` w kontenerze `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmienia się
hash zasobów QA Lab.

Aby wykonać lokalny test smoke sygnału OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik OTLP/HTTP, uruchamia scenariusz QA `otel-trace-smoke`
z włączonym Pluginem `diagnostics-otel`, a następnie sprawdza, czy ślady,
metryki i logi są eksportowane. Dekoduje wyeksportowane spany śladów protobuf
i sprawdza kształt krytyczny dla wydania:
`openclaw.run`, `openclaw.harness.run`, span wywołania modelu zgodny z najnowszą konwencją semantyczną GenAI,
`openclaw.context.assembled` i `openclaw.message.delivery`
muszą być obecne. Test smoke wymusza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, więc span wywołania modelu
musi używać nazwy `{gen_ai.operation.name} {gen_ai.request.model}`;
wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe ID diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Surowe ładunki OTLP
nie mogą zawierać sentinela promptu, sentinela odpowiedzi ani klucza sesji QA.
Zapisuje `otel-smoke-summary.json` obok artefaktów pakietu QA.

Aby wykonać test smoke OpenTelemetry wspierany przez kolektor, uruchom:

```bash
pnpm qa:otel:collector-smoke
```

Ten tor umieszcza rzeczywisty kontener Docker OpenTelemetry Collector przed tym
samym lokalnym odbiornikiem. Używaj go przy zmianie okablowania endpointów, zgodności
kolektora lub zachowania eksportu OTLP, które odbiornik wewnątrzprocesowy mógłby maskować.

Aby wykonać chroniony test smoke zeskrobywania Prometheus, uruchom:

```bash
pnpm qa:prometheus:smoke
```

Ten alias uruchamia scenariusz QA `docker-prometheus-smoke` z włączonym
`diagnostics-prometheus`, sprawdza, czy nieuwierzytelnione pobrania metryk są
odrzucane, a następnie sprawdza, czy uwierzytelnione pobranie metryk zawiera
krytyczne dla wydania rodziny metryk bez treści promptów, treści odpowiedzi,
surowych identyfikatorów diagnostycznych, tokenów uwierzytelniania ani ścieżek
lokalnych.

Aby uruchomić oba testy weryfikacyjne obserwowalności jeden po drugim, użyj:

```bash
pnpm qa:observability:smoke
```

Dla ścieżki OpenTelemetry opartej na kolektorze oraz chronionego testu
weryfikacyjnego pobierania metryk Prometheus użyj:

```bash
pnpm qa:observability:collector-smoke
```

QA obserwowalności pozostaje dostępne tylko w checkoutcie źródłowym. Archiwum
npm celowo pomija QA Lab, więc ścieżki wydań pakietu w Dockerze nie uruchamiają
poleceń `qa`. Użyj `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` lub
`pnpm qa:observability:smoke` z zbudowanego checkoutu źródłowego, gdy zmieniasz
instrumentację diagnostyczną.

Dla ścieżki weryfikacyjnej Matrix z prawdziwym transportem, która nie wymaga
poświadczeń dostawcy modeli, uruchom szybki profil z deterministycznym
pozorowanym dostawcą OpenAI:

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

Pełna dokumentacja CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: udostępnia jednorazowy serwer domowy Tuwunel w Dockerze, rejestruje tymczasowych użytkowników sterownika/SUT/obserwatora, uruchamia prawdziwy Plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt zaobserwowanych zdarzeń i połączony dziennik wyjściowy w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Scenariusze obejmują zachowania transportu, których testy jednostkowe nie mogą udowodnić kompleksowo: bramkowanie wzmianek, zasady zezwalania botom, listy dozwolonych, odpowiedzi najwyższego poziomu i w wątkach, kierowanie DM, obsługę reakcji, tłumienie edycji przychodzących, deduplikację odtworzenia po restarcie, odzyskiwanie po przerwaniu serwera domowego, dostarczanie metadanych zatwierdzeń, obsługę multimediów oraz przepływy bootstrapu/odzyskiwania/weryfikacji Matrix E2EE. Profil CLI E2EE uruchamia także `openclaw matrix encryption setup` i polecenia weryfikacyjne przez ten sam jednorazowy serwer domowy przed sprawdzeniem odpowiedzi Gateway.

Discord ma też opcjonalne scenariusze tylko dla Mantis do reprodukcji błędów.
Użyj `--scenario discord-status-reactions-tool-only` dla jawnej osi czasu
reakcji statusu albo `--scenario discord-thread-reply-filepath-attachment`, aby
utworzyć prawdziwy wątek Discord i sprawdzić, czy `message.thread-reply`
zachowuje załącznik `filePath`. Te scenariusze pozostają poza domyślną ścieżką
live Discord, ponieważ są sondami reprodukcji przed/po, a nie szerokim pokryciem
weryfikacyjnym. Przepływ Mantis dla załącznika w wątku może także dodać wideo
świadka z zalogowanego Discord Web, gdy w środowisku QA skonfigurowano
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` lub
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Ten profil przeglądarki służy
tylko do przechwytywania wizualnego; decyzja o powodzeniu lub niepowodzeniu
nadal pochodzi z wyroczni Discord REST.

CI używa tej samej powierzchni poleceń w `.github/workflows/qa-live-transports-convex.yml`.
Zaplanowane i domyślne uruchomienia ręczne wykonują szybki profil Matrix z
poświadczeniami live-frontier dostarczonymi przez QA, `--fast` oraz
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ręczne `matrix_profile=all`
rozszerza się na pięć shardów profilu.

Dla ścieżek weryfikacyjnych Telegram, Discord, Slack i WhatsApp z prawdziwym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Celują one w istniejący prawdziwy kanał z dwoma botami lub kontami (sterownik + SUT). Wymagane zmienne środowiskowe, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane poniżej w [dokumentacji QA Telegram, Discord, Slack i WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Dla pełnego uruchomienia maszyny wirtualnej Slack desktop z ratunkowym VNC uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę desktop/przeglądarkę Crabbox, uruchamia ścieżkę
live Slack wewnątrz maszyny wirtualnej, otwiera Slack Web w przeglądarce VNC,
przechwytuje pulpit i kopiuje `slack-qa/`, `slack-desktop-smoke.png` oraz
`slack-desktop-smoke.mp4`, gdy przechwytywanie wideo jest dostępne, z powrotem
do katalogu artefaktów Mantis. Dzierżawy Crabbox desktop/przeglądarka z góry
dostarczają narzędzia przechwytywania oraz pakiety pomocnicze przeglądarki/
budowania natywnego, więc scenariusz powinien instalować rozwiązania awaryjne
tylko na starszych dzierżawach. Mantis raportuje łączne i per-fazowe czasy w
`mantis-slack-desktop-smoke-report.md`, aby wolne uruchomienia pokazywały, czy
czas trafił do rozgrzewania dzierżawy, pozyskiwania poświadczeń, zdalnej
konfiguracji czy kopiowania artefaktów. Użyj ponownie `--lease-id <cbx_...>` po
ręcznym zalogowaniu do Slack Web przez VNC; ponownie użyte dzierżawy utrzymują
też ciepłą pamięć podręczną sklepu pnpm Crabbox. Domyślne
`--hydrate-mode source` weryfikuje z checkoutu źródłowego i uruchamia
install/build wewnątrz maszyny wirtualnej. Używaj `--hydrate-mode prehydrated`
tylko wtedy, gdy ponownie użyty zdalny workspace ma już `node_modules` i
zbudowane `dist/`; ten tryb pomija kosztowny krok install/build i kończy się
błędem zamkniętym, gdy workspace nie jest gotowy. Z `--gateway-setup` Mantis
pozostawia trwały Gateway OpenClaw Slack uruchomiony wewnątrz maszyny wirtualnej
na porcie `38973`; bez niego polecenie uruchamia normalną ścieżkę QA Slack
bot-do-bota i kończy działanie po przechwyceniu artefaktów.

Aby udowodnić natywny interfejs zatwierdzeń Slack z dowodami desktopowymi,
uruchom tryb punktów kontrolnych zatwierdzeń Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ten tryb wzajemnie wyklucza się z `--gateway-setup`. Uruchamia scenariusze
zatwierdzeń Slack, odrzuca identyfikatory scenariuszy niebędących
zatwierdzeniami, czeka przy każdym oczekującym i rozwiązanym stanie
zatwierdzenia, renderuje zaobserwowaną wiadomość Slack API do
`approval-checkpoints/<scenario>-pending.png` i
`approval-checkpoints/<scenario>-resolved.png`, a następnie kończy się błędem,
jeśli brakuje jakiegokolwiek punktu kontrolnego, dowodu wiadomości,
potwierdzenia lub wyrenderowanego zrzutu ekranu albo jest on pusty. Zimne
dzierżawy CI mogą nadal pokazywać logowanie Slack w `slack-desktop-smoke.png`;
obrazy punktów kontrolnych zatwierdzeń są wizualnym dowodem dla tej ścieżki.

Lista kontrolna operatora, polecenie uruchomienia workflow GitHub, kontrakt komentarza z dowodami, tabela decyzyjna hydrate-mode, interpretacja czasów i kroki obsługi awarii znajdują się w [Runbooku Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Dla zadania desktopowego w stylu agenta/CV uruchom:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` dzierżawi lub ponownie używa maszyny desktop/przeglądarki Crabbox,
uruchamia `crabbox record --while`, steruje widoczną przeglądarką przez
zagnieżdżony `visual-driver`, przechwytuje `visual-task.png`, uruchamia
`openclaw infer image describe` względem zrzutu ekranu, gdy wybrano
`--vision-mode image-describe`, oraz zapisuje `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` i
`mantis-visual-task-report.md`. Gdy ustawiono `--expect-text`, prompt wizyjny
prosi o ustrukturyzowany werdykt JSON i przechodzi tylko wtedy, gdy model
zgłasza pozytywny widoczny dowód; negatywna odpowiedź, która jedynie cytuje
docelowy tekst, nie spełnia asercji. Użyj `--vision-mode metadata` dla
weryfikacji bez modelu, która dowodzi działania pulpitu, przeglądarki, zrzutu
ekranu i instalacji wideo bez wywoływania dostawcy rozumienia obrazów.
Nagranie jest wymaganym artefaktem dla `visual-task`; jeśli Crabbox nie nagra
niepustego `visual-task.mp4`, zadanie kończy się błędem nawet wtedy, gdy
sterownik wizualny przeszedł. Przy awarii Mantis zachowuje dzierżawę dla VNC,
chyba że zadanie już przeszło i nie ustawiono `--keep-lease`.

Przed użyciem pulowanych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, waliduje ustawienia punktu końcowego i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintenera. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportów live

Ścieżki transportów live współdzielą jeden kontrakt zamiast wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia transportów live.

Runnery transportów live powinny importować współdzielone identyfikatory scenariuszy, pomocniki pokrycia bazowego i pomocnik wyboru scenariuszy z
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Ścieżka  | Kanarek | Bramkowanie wzmianek | Bot-do-bota | Blokada listy dozwolonych | Odpowiedź najwyższego poziomu | Odpowiedź cytatem | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Natywna rejestracja poleceń |
| -------- | ------- | -------------------- | ----------- | ------------------------- | ----------------------------- | ----------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | ---------------------------- |
| Matrix   | x       | x                    | x           | x                         | x                             |                   | x                       | x                 | x              | x                  |                  |                              |
| Telegram | x       | x                    | x           |                           |                               |                   |                         |                   |                |                    | x                |                              |
| Discord  | x       | x                    | x           |                           |                               |                   |                         |                   |                |                    |                  | x                            |
| Slack    | x       | x                    | x           | x                         | x                             |                   | x                       | x                 | x              |                    |                  |                              |
| WhatsApp | x       | x                    |             | x                         | x                             | x                 | x                       |                   |                | x                  | x                |                              |

To utrzymuje `qa-channel` jako szeroki zestaw zachowań produktu, podczas gdy Matrix,
Telegram i inne transporty live współdzielą jedną jawną listę kontrolną kontraktu transportu.

Dla ścieżki jednorazowej maszyny wirtualnej Linux bez wprowadzania Dockera do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Ponownie używa tego samego zachowania wyboru scenariuszy co `qa suite` na
hoście. Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele
wybranych scenariuszy równolegle z izolowanymi workerami Gateway. `qa-channel`
domyślnie używa współbieżności 4, ograniczonej liczbą wybranych scenariuszy.
Użyj `--concurrency <count>`, aby dostroić liczbę workerów, albo
`--concurrency 1` dla wykonania szeregowego. Użyj `--pack personal-agent`, aby
uruchomić pakiet benchmarku osobistego asystenta. Selektor pakietu jest
addytywny względem powtarzanych flag `--scenario`: jawne scenariusze uruchamiają
się najpierw, a potem scenariusze pakietu w kolejności pakietu z usuniętymi
duplikatami. Użyj `--pack observability`, gdy niestandardowy runner QA już
dostarcza konfigurację kolektora OpenTelemetry i chce wybrać razem scenariusze
weryfikacyjne diagnostyki OpenTelemetry oraz Prometheus.
Polecenie kończy się kodem niezerowym, gdy jakikolwiek scenariusz się nie
powiedzie. Użyj `--allow-failures`, gdy chcesz artefakty bez niepowodzenia kodu
wyjścia. Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA,
które są praktyczne dla gościa: klucze dostawców oparte na środowisku, ścieżkę
konfiguracji dostawcy live QA oraz `CODEX_HOME`, gdy jest obecne. Trzymaj
`--output-dir` pod katalogiem głównym repozytorium, aby gość mógł zapisywać
z powrotem przez zamontowany workspace.

## Materiał referencyjny QA dla Telegram, Discord, Slack i WhatsApp

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i obsługiwane przez Docker udostępnianie homeservera. Telegram, Discord, Slack i WhatsApp działają na istniejących rzeczywistych transportach, więc ich materiał referencyjny znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślnie                                         | Opis                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Uruchamia tylko ten scenariusz. Można powtarzać.                                                                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Miejsce zapisu raportów, podsumowań, dowodów, artefaktów specyficznych dla transportu oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                                                                          |
| `--sut-account <id>`                  | `sut`                                             | Tymczasowy identyfikator konta w konfiguracji Gateway QA.                                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` albo `live-frontier` (starsze `live-openai` nadal działa).                                                                                               |
| `--model <ref>` / `--alt-model <ref>` | domyślne ustawienie dostawcy                      | Referencje modelu podstawowego/alternatywnego.                                                                                                                         |
| `--fast`                              | wyłączone                                         | Szybki tryb dostawcy tam, gdzie jest obsługiwany.                                                                                                                      |
| `--credential-source <env\|convex>`   | `env`                                             | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`        | Rola używana, gdy ustawiono `--credential-source convex`.                                                                                                              |

Każda ścieżka kończy się kodem różnym od zera przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania błędnego kodu wyjścia.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma odrębnymi botami (sterownik + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-bot działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

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

Domyślny zestaw niejawny zawsze obejmuje canary, bramkowanie wzmianek, odpowiedzi na natywne polecenia, adresowanie poleceń i odpowiedzi bot-bot w grupie. Domyślne ustawienia `mock-openai` obejmują też deterministyczne kontrole łańcucha odpowiedzi i strumieniowania wiadomości końcowej. `telegram-current-session-status-tool` pozostaje opcjonalny, ponieważ jest stabilny tylko wtedy, gdy jest wykonywany bezpośrednio po canary, a nie po dowolnych odpowiedziach na natywne polecenia. Użyj `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, aby wypisać bieżący podział domyślne/opcjonalne wraz z referencjami regresji.

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live, w tym pola profilu, pokrycia, dostawcy, kanału, artefaktów, wyniku i RTT.

Pakietowe uruchomienia Telegram używają tego samego kontraktu poświadczeń Telegram. Powtarzany pomiar RTT
jest częścią normalnej ścieżki pakietowej Telegram live; rozkład RTT
jest włączany do `qa-evidence.json` w `result.timing` dla
wybranej kontroli RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Gdy ustawiono `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, pakietowy wrapper live
dzierżawi poświadczenie `kind: "telegram"`, eksportuje wydzierżawione środowisko
grupy/sterownika/bota SUT do uruchomienia zainstalowanego pakietu, wysyła Heartbeat
dzierżawy i zwalnia ją przy zamykaniu. Pakietowy wrapper domyślnie wykonuje 20 kontroli RTT
dla `telegram-mentioned-message-reply`, ma limit czasu RTT 30s oraz rolę Convex
`maintainer` poza CI, gdy wybrano Convex. Nadpisz
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
lub `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostroić pomiar RTT bez
tworzenia osobnego polecenia RTT ani formatu podsumowania specyficznego dla Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem sterownika kontrolowanym przez mechanizm testowy oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek na kanale, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodowe Mantis.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko zakończy się błędem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach obserwowanych wiadomości.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wybiera kanał głosowy/sceniczny dla `discord-voice-autojoin`; bez tego scenariusz wybiera pierwszy widoczny kanał głosowy/sceniczny dla bota SUT.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opcjonalny scenariusz głosowy. Uruchamia się samodzielnie, włącza `channels.discord.voice.autoJoin` i weryfikuje, że bieżący stan głosowy Discord bota SUT to docelowy kanał głosowy/sceniczny. Poświadczenia Discord z Convex mogą zawierać opcjonalne `voiceChannelId`; w przeciwnym razie runner wykrywa pierwszy widoczny kanał głosowy/sceniczny w gildii.
- `discord-status-reactions-tool-only` - opcjonalny scenariusz Mantis. Uruchamia się samodzielnie, ponieważ przełącza SUT na zawsze włączone odpowiedzi gildii tylko dla narzędzi z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed/po zachowują także dostarczone przez scenariusz artefakty MP4 jako `baseline.mp4` i `candidate.mp4`.

Uruchom jawnie scenariusz automatycznego dołączania do głosu w Discord:

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
- `discord-qa-observed-messages.json` - treść zredagowana, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy uruchamiany jest scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem sterownika kontrolowanym przez mechanizm testowy oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączony Plugin Slack.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach obserwowanych wiadomości.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` włącza wizualne punkty kontrolne zatwierdzeń
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
- `slack-approval-exec-native` - opcjonalny scenariusz natywnego zatwierdzenia exec w Slack.
  Żąda zatwierdzenia exec przez Gateway, weryfikuje, że wiadomość Slack ma
  natywne przyciski zatwierdzania, rozwiązuje je i weryfikuje rozwiązaną aktualizację Slack.
- `slack-approval-plugin-native` - opcjonalny scenariusz natywnego zatwierdzenia Plugin w Slack.
  Włącza jednocześnie przekazywanie zatwierdzeń exec i Plugin, aby zdarzenia Plugin nie były
  tłumione przez trasowanie zatwierdzeń exec, a następnie weryfikuje tę samą oczekującą/rozwiązaną
  natywną ścieżkę UI Slack.

Artefakty wyjściowe:

- `slack-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live.
- `slack-qa-observed-messages.json` - treść zredagowana, chyba że ustawiono `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - tylko gdy Mantis ustawia
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; zawiera JSON punktów kontrolnych,
  JSON potwierdzeń oraz zrzuty ekranu oczekujące/rozwiązane.

#### Konfigurowanie obszaru roboczego Slack

Ścieżka wymaga dwóch odrębnych aplikacji Slack w jednym obszarze roboczym oraz kanału, którego członkami są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje wiadomości przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być osobną aplikacją Slack względem sterownika, aby identyfikator jej użytkownika bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj obszar roboczy Slack dedykowany QA zamiast ponownego używania obszaru produkcyjnego.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`) do uprawnień i zdarzeń objętych zestawem live Slack QA. Konfigurację kanału produkcyjnego widzianą przez użytkowników opisuje [szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para Driver/SUT w QA jest celowo oddzielna, ponieważ ścieżka wymaga dwóch odrębnych identyfikatorów użytkowników botów w jednym obszarze roboczym.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Utwórz nową aplikację_ → _Z manifestu_ → wybierz obszar roboczy QA, wklej następujący manifest, a następnie _Zainstaluj w obszarze roboczym_:

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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) - stanie się on `driverBotToken`. Sterownik musi tylko publikować wiadomości i identyfikować sam siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Utwórz nową aplikację → Z manifestu_ w tym samym obszarze roboczym. Ta aplikacja QA celowo używa węższej wersji produkcyjnego manifestu dołączonego Pluginu Slack (`extensions/slack/src/setup-shared.ts:10`): zakresy i zdarzenia reakcji są pominięte, ponieważ zestaw testów live Slack QA nie obejmuje jeszcze obsługi reakcji.

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

- _Zainstaluj w obszarze roboczym_ → skopiuj _Bot User OAuth Token_ → stanie się on `sutBotToken`.
- _Informacje podstawowe → Tokeny na poziomie aplikacji → Wygeneruj token i zakresy_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → stanie się ona `sutAppToken`.

Zweryfikuj, że oba boty mają różne identyfikatory użytkowników, wywołując `auth.test` dla każdego tokenu. Runtime rozróżnia sterownik i SUT według identyfikatora użytkownika; ponowne użycie jednej aplikacji dla obu natychmiast przerwie bramkowanie wzmianek.

**3. Utwórz kanał**

W obszarze roboczym QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba boty z poziomu kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _informacje o kanale → O kanale → Identyfikator kanału_ - stanie się on `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje mają już `groups:history`, więc odczyty historii przez harness nadal się powiodą.

**4. Zarejestruj dane uwierzytelniające**

Dwie opcje. Użyj zmiennych środowiskowych do debugowania na jednej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasil współdzieloną pulę Convex, aby CI i inni maintainerzy mogli je dzierżawić.

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

**5. Zweryfikuj end to end**

Uruchom lane lokalnie, aby potwierdzić, że oba boty mogą komunikować się ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielony przebieg kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli lane zawiesza się na około 90 sekund i kończy z `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest dzierżawiony - `qa credentials list --kind slack --status all --json` wskaże, która sytuacja zachodzi.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Celuje w dwa dedykowane konta WhatsApp Web: konto sterownika kontrolowane przez
harness oraz konto SUT uruchamiane przez podrzędny OpenClaw Gateway za pomocą
dołączonego Pluginu WhatsApp.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcjonalnie:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` włącza scenariusze grupowe, takie jak
  `whatsapp-mention-gating` i `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` zachowuje treści wiadomości w
  artefaktach zaobserwowanych wiadomości.

Katalog scenariuszy (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Linia bazowa i bramkowanie grupowe: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Polecenia natywne: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Odpowiedzi i zachowanie końcowego wyniku: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Media przychodzące i wiadomości strukturalne: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Wysyłają one prawdziwe zdarzenia obrazu, audio,
  dokumentu, lokalizacji, kontaktu i naklejki WhatsApp przez sterownik.
- Pokrycie wychodzącego Gateway i akcji wiadomości:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Pokrycie kontroli dostępu: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Zatwierdzenia natywne: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reakcje statusu: `whatsapp-status-reactions`.

Katalog zawiera obecnie 36 scenariuszy. Domyślny lane `live-frontier` jest
utrzymywany jako mały, obejmujący 10 scenariuszy dla szybkiego pokrycia smoke.
Domyślny lane `mock-openai` uruchamia 31 deterministycznych scenariuszy przez
rzeczywisty transport WhatsApp, mockując tylko wynik modelu. Scenariusze
zatwierdzeń oraz kilka cięższych/blokujących kontroli pozostają jawne według
identyfikatora scenariusza.

Sterownik WhatsApp QA obserwuje strukturalne zdarzenia live (`text`, `media`,
`location`, `reaction` i `poll`) i może aktywnie wysyłać media, ankiety,
kontakty, lokalizacje oraz naklejki. QA Lab importuje ten sterownik przez
powierzchnię pakietu `@openclaw/whatsapp/api.js`, zamiast sięgać do prywatnych
plików runtime WhatsApp. Treść wiadomości jest domyślnie redagowana. Pokrycie
ankiet wychodzących i przesyłania plików przechodzi przez deterministyczne
wywołania Gateway `poll` i `message.action`, zamiast wywołań narzędzi wyłącznie
z promptu modelu.

Artefakty wyjściowe:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu live.
- `whatsapp-qa-observed-messages.json` - treści redagowane, chyba że ustawiono `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pula danych uwierzytelniających Convex

Lane'y Telegram, Discord, Slack i WhatsApp mogą dzierżawić dane uwierzytelniające ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas trwania przebiegu i zwalnia ją przy zamknięciu. Rodzaje puli to `"telegram"`, `"discord"`, `"slack"` i `"whatsapp"`.

Kształty payloadu walidowane przez brokera przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Rzeczywisty użytkownik Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - tylko dowód Mantis Telegram Desktop. Ogólne lane'y QA Lab nie mogą pozyskiwać tego rodzaju.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - numery telefonów muszą być różnymi ciągami E.164.

Workflow dowodu Mantis Telegram Desktop utrzymuje jedną wyłączną dzierżawę Convex
`telegram-user` zarówno dla sterownika TDLib CLI, jak i świadka Telegram Desktop,
a następnie zwalnia ją po opublikowaniu dowodu.

Gdy PR wymaga deterministycznego diffu wizualnego, Mantis może użyć tej samej
mockowanej odpowiedzi modelu na `main` i na head PR, podczas gdy formatter
Telegram lub warstwa dostarczania ulegają zmianie. Domyślne ustawienia
przechwytywania są dostrojone do komentarzy PR: standardowa klasa Crabbox,
nagranie pulpitu 24 fps, animowany GIF ruchu 24 fps i szerokość podglądu 1920 px.
Komentarze przed/po powinny publikować czysty pakiet zawierający tylko zamierzone
GIF-y.

Lane'y Slack również mogą używać puli. Kontrole kształtu payloadu Slack znajdują się obecnie w runnerze Slack QA, a nie w brokerze; użyj `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, z identyfikatorem kanału Slack takim jak `Cxxxxxxxxxx`. Zobacz [Konfigurowanie obszaru roboczego Slack](#setting-up-the-slack-workspace), aby uzyskać informacje o provisioningu aplikacji i zakresów.

Zmienne środowiskowe operacyjne oraz kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone dane uwierzytelniające Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed puli wielokanałowej; semantyka dzierżawy jest wspólna dla wszystkich rodzajów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Są one celowo w git, aby plan QA był widoczny zarówno dla ludzi, jak i
agenta.

`qa-lab` powinien pozostać ogólnym runnerem scenariuszy YAML. Każdy plik YAML
scenariusza jest źródłem prawdy dla jednego przebiegu testowego i powinien
definiować:

- najwyższego poziomu `title`
- metadane `scenario`
- opcjonalne metadane kategorii, capability, lane i ryzyka w `scenario`
- odwołania do dokumentacji i kodu w `scenario`
- opcjonalne wymagania Pluginu w `scenario`
- opcjonalną łatkę konfiguracji Gateway w `scenario`
- wykonywalny `flow` najwyższego poziomu dla scenariuszy flow albo `scenario.execution.kind` /
  `scenario.execution.path` dla scenariuszy Vitest i Playwright

Powierzchnia wielokrotnego użytku runtime, na której opiera się `flow`, może pozostać ogólna
i przekrojowa. Na przykład scenariusze YAML mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
szew Gateway `browser.request` bez dodawania specjalnego runnera dla tego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie według folderu
drzewa źródeł. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modelu
- przekazanie do subagenta
- czytanie repozytorium i czytanie dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Tory mock providerów

`qa suite` ma dwa lokalne tory mock providerów:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślnym
  deterministycznym torem mock dla QA opartego na repozytorium i bramek zgodności.
- `aimock` uruchamia serwer providera oparty na AIMock dla eksperymentalnego pokrycia protokołu,
  fixture, nagrywania/odtwarzania i chaosu. Jest dodatkiem i nie zastępuje
  dyspozytora scenariuszy `mock-openai`.

Implementacja toru providera znajduje się w `extensions/qa-lab/src/providers/`.
Każdy provider jest właścicielem swoich wartości domyślnych, uruchamiania lokalnego serwera, konfiguracji modelu gateway,
potrzeb stagingu profilu auth oraz flag możliwości live/mock. Wspólny kod suite i
gateway powinien przechodzić przez rejestr providerów zamiast rozgałęziać się po
nazwach providerów.

## Adaptery transportu

`qa-lab` posiada ogólny szew transportu dla scenariuszy QA YAML. `qa-channel` jest
syntetycznym domyślnym transportem. `crabline` uruchamia lokalne serwery w kształcie providerów i wykonuje
normalne pluginy kanałów OpenClaw przeciwko nim. `live` jest zarezerwowane dla prawdziwych
poświadczeń providerów i kanałów zewnętrznych.

Na poziomie architektury podział wygląda tak:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu odpowiada za konfigurację gateway, gotowość, obserwację ruchu przychodzącego i wychodzącego, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy YAML w `qa/scenarios/` definiują przebieg testu; `qa-lab` zapewnia powierzchnię wielokrotnego użytku runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA YAML wymaga implementacji kanału oraz
pakietu scenariuszy, który sprawdza kontrakt kanału. Dla pokrycia smoke CI dodaj
odpowiadający lokalny serwer providera Crabline i udostępnij go przez sterownik `crabline`.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy wspólny host `qa-lab` może być właścicielem przepływu.

`qa-lab` odpowiada za wspólne mechanizmy hosta:

- korzeń poleceń `openclaw qa`
- uruchamianie i kończenie suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportu
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów odpowiadają za kontrakt transportu:

- jak `openclaw qa <runner>` jest montowane pod wspólnym korzeniem `qa`
- jak gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypcje i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Pozostaw `qa-lab` jako właściciela wspólnego korzenia `qa`.
2. Zaimplementuj runner transportu na wspólnym szwie hosta `qa-lab`.
3. Trzymaj mechanizmy specyficzne dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` jako lekki plik; leniwe CLI i wykonywanie runnera powinny pozostać za oddzielnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze YAML w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych pomocników scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repozytorium wykonuje zamierzoną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj ogólnego pomocnika zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymuj scenariusz jako specyficzny dla transportu i wyraźnie zaznacz to w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ale nowe scenariusze powinny używać nazw ogólnych. Aliasy istnieją, aby uniknąć migracji typu flag day, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy - przydatny przy szacowaniu pracy uzupełniającej lub podłączaniu nowego transportu - uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo).
Wybierając ukierunkowany dowód dla dotkniętego zachowania lub ścieżki pliku, uruchom `pnpm openclaw qa coverage --match <query>`.
Raport dopasowań przeszukuje metadane scenariuszy, refs dokumentacji, refs kodu, identyfikatory pokrycia, pluginy i wymagania providerów, a następnie wypisuje pasujące cele `qa suite --scenario ...`.
Każde uruchomienie `qa suite` zapisuje artefakty najwyższego poziomu `qa-evidence.json`,
`qa-suite-summary.json` i `qa-suite-report.md` dla wybranego
zestawu scenariuszy. Scenariusze deklarujące `execution.kind: vitest` lub
`execution.kind: playwright` uruchamiają pasującą ścieżkę testu i zapisują także
logi per scenariusz. Scenariusze deklarujące `execution.kind: script` uruchamiają
producenta dowodów z `execution.path` przez `node --import tsx` (z rozwiniętymi
`${outputDir}` i `${scenarioId}` w `execution.args`); producent
zapisuje własny `qa-evidence.json`, którego wpisy są importowane do wyjścia suite,
a ścieżki artefaktów są rozwiązywane względem tego producenckiego
`qa-evidence.json`. Gdy `qa suite` jest osiągane przez
`qa run --qa-profile`, ten sam `qa-evidence.json` zawiera także podsumowanie
scorecard profilu dla wybranych kategorii taksonomii.
Traktuj to jako pomoc w odkrywaniu, a nie zamiennik bramki; wybrany scenariusz nadal potrzebuje właściwego trybu providera, transportu live, Multipass, Testbox lub toru wydania dla testowanego zachowania.
Kontekst scorecard znajdziesz w [Maturity scorecard](/pl/maturity/scorecard).

Dla kontroli charakteru i stylu uruchom ten sam scenariusz na wielu refach modeli live
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

Polecenie uruchamia lokalne procesy potomne QA gateway, nie Docker. Scenariusze character eval
powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc w workspace i małe zadania na plikach. Model kandydacki nie powinien
być informowany, że jest oceniany. Polecenie zachowuje każdą pełną
transkrypcję, zapisuje podstawowe statystyki przebiegu, a następnie prosi modele sędziowskie w trybie szybkim z
rozumowaniem `xhigh`, gdzie jest obsługiwane, o uszeregowanie przebiegów według naturalności, vibe i humoru.
Używaj `--blind-judge-models` podczas porównywania providerów: prompt sędziego nadal otrzymuje
każdą transkrypcję i status przebiegu, ale refy kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste refy po
parsowaniu.
Przebiegi kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5 i `xhigh`
dla starszych refów ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Refy kandydatów OpenAI domyślnie używają trybu szybkiego, aby tam, gdzie provider go obsługuje,
używać przetwarzania priorytetowego. Dodaj `,fast`, `,no-fast` lub `,fast=false` inline, gdy
pojedynczy kandydat lub sędzia wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb szybki dla każdego modelu kandydackiego. Czasy trwania kandydatów i sędziów są
zapisywane w raporcie do analizy benchmarków, ale prompty sędziowskie wyraźnie mówią,
aby nie szeregować według szybkości.
Przebiegi modeli kandydackich i sędziowskich domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity providera albo lokalne obciążenie gateway
sprawiają, że przebieg jest zbyt zaszumiony.
Gdy nie przekazano kandydata `--model`, character eval domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` i
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie przekazano `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` i
`anthropic/claude-opus-4-8,thinking=high`.

## Powiązana dokumentacja

- [Macierz QA](/pl/concepts/qa-matrix)
- [Maturity scorecard](/pl/maturity/scorecard)
- [Pakiet benchmarków osobistego agenta](/pl/concepts/personal-agent-benchmark-pack)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
