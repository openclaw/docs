---
doc-schema-version: 1
read_when:
    - Jak współdziałają elementy stosu QA
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji kontroli jakości wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd kontroli jakości
x-i18n:
    generated_at: "2026-07-16T18:33:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA testuje OpenClaw w realistyczny sposób, odzwierciedlający kanały,
czego nie może zapewnić test jednostkowy.

Elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z obsługą wiadomości prywatnych, kanałów, wątków,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debugera, magistrala QA, profile scenariuszy oraz aktywne
  adaptery transportu do obserwowania transkrypcji, wstrzykiwania wiadomości przychodzących
  i eksportowania raportu Markdown.
- `qa/`: przechowywane w repozytorium zasoby początkowe dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja na żywo przed zmianą i po niej dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu przeglądarki, stanu maszyny wirtualnej i dowodów w PR.

## Interfejs poleceń

Każdy przepływ QA działa w ramach `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów
`pnpm qa:*`; działają obie formy.

| Polecenie                                             | Przeznaczenie                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowana samokontrola QA bez `--qa-profile`; oparty na taksonomii mechanizm uruchamiania profili dojrzałości z `--qa-profile smoke-ci`, `--qa-profile release` lub `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Uruchamia scenariusze przechowywane w repozytorium w ścieżce Gateway QA. `--runner multipass` używa jednorazowej maszyny wirtualnej z systemem Linux zamiast hosta.                                                                                                                                         |
| `qa coverage`                                       | Wyświetla spis pokrycia scenariuszy YAML (`--json` do danych wyjściowych odczytywanych maszynowo; `--match <query>` do wyszukiwania scenariuszy dla zmienionego zachowania; `--tools` do pokrycia danych testowych narzędzi środowiska uruchomieniowego).                                                                                  |
| `qa parity-report`                                  | Porównuje dwa pliki `qa-suite-summary.json` na potrzeby bramki zgodności między modelami albo używa `--runtime-axis --token-efficiency` do zapisania raportów zgodności środowisk uruchomieniowych Codex i OpenClaw oraz efektywności wykorzystania tokenów.                                                                          |
| `qa confidence-report`                              | Klasyfikuje artefakty dowodowe QA względem manifestu, tworząc raport pewności bez nierozpoznanych elementów.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Zapisuje zainicjowane kanarki kontroli negatywnej, które dowodzą, że bramka pewności wykrywa rozbieżności.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Odtwarza wyselekcjonowane transkrypcje JSONL za pomocą mechanizmu odtwarzania zgodności środowiska uruchomieniowego.                                                                                                                                                                                         |
| `qa character-eval`                                 | Uruchamia scenariusz QA postaci w wielu aktywnych modelach i tworzy oceniony raport. Zobacz [Raportowanie](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Uruchamia jednorazowy monit w wybranej ścieżce dostawcy/modelu.                                                                                                                                                                                                      |
| `qa ui`                                             | Uruchamia interfejs debugera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Buduje wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Zapisuje szkielet docker-compose dla panelu QA i ścieżki Gateway.                                                                                                                                                                                                |
| `qa up`                                             | Buduje witrynę QA, uruchamia stos oparty na Dockerze i wyświetla adres URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Uruchamia wyłącznie serwer dostawcy AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Uruchamia wyłącznie serwer dostawcy `mock-openai` uwzględniający scenariusze.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządza współdzieloną pulą poświadczeń Convex.                                                                                                                                                                                                                           |
| `qa discord`                                        | Aktywna ścieżka transportu korzystająca z rzeczywistego kanału w prywatnym serwerze Discord.                                                                                                                                                                                                   |
| `qa matrix`                                         | Profile Matrix laboratorium QA korzystające z jednorazowego serwera macierzystego Tuwunel. Zobacz [Ścieżki testów dymnych Matrix](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Aktywna ścieżka transportu korzystająca z rzeczywistego prywatnego kanału Slack.                                                                                                                                                                                                           |
| `qa telegram`                                       | Aktywna ścieżka transportu korzystająca z rzeczywistej prywatnej grupy Telegram.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Aktywna ścieżka transportu korzystająca z rzeczywistych kont WhatsApp Web.                                                                                                                                                                                                             |
| `qa mantis`                                         | Mechanizm weryfikacji przed zmianą i po niej dla błędów aktywnych transportów, obejmujący dowody w postaci reakcji statusowych Discord, testy dymne pulpitu/przeglądarki Crabbox i testy dymne Slack w VNC. Zobacz [Mantis](/pl/concepts/mantis) oraz [Podręcznik uruchamiania Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

### `qa run` oparte na profilach

`qa run` oparte na profilach odczytuje przynależność z `taxonomy.yaml`, a następnie przekazuje
rozpoznane scenariusze przez `qa suite`. `--surface` i `--category` filtrują
wybrany profil zamiast definiować osobne ścieżki. Wynikowy
`qa-evidence.json` zawiera podsumowanie karty wyników profilu z liczebnością wybranych kategorii
i identyfikatorami brakującego pokrycia; poszczególne wpisy dowodowe pozostają
źródłem prawdy dla testów, ról pokrycia i wyników. Identyfikatory
pokrycia funkcji taksonomii są dokładnymi celami dowodowymi, a nie aliasami: pokrycie scenariusza głównego
spełnia wymagania odpowiadających identyfikatorów, natomiast pokrycie dodatkowe pozostaje informacyjne. Identyfikatory pokrycia używają
kropkowanej formy `namespace.behavior` z segmentami składającymi się z małych liter, cyfr i łączników;
identyfikatory profili, powierzchni i kategorii mogą nadal używać istniejących identyfikatorów taksonomii
z łącznikami lub kropkami.

Odchudzone dowody pomijają `execution` dla poszczególnych wpisów i ustawiają `evidenceMode: "slim"`;
`smoke-ci` domyślnie używa trybu odchudzonego, a `--evidence-mode full` przywraca pełne wpisy:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Użyj `smoke-ci` do deterministycznego dowodu profilu z pozorowanymi dostawcami modeli i
lokalnymi serwerami dostawców Crabline. Użyj `release` do dowodów Stable/LTS z użyciem
aktywnych kanałów. Używaj `all` wyłącznie do jawnych przebiegów dowodowych pełnej taksonomii; opcja ta
wybiera każdą aktywną kategorię dojrzałości i może zostać przekazana przez przepływ pracy GitHub Actions `QA
Profile Evidence` z `qa_profile=all`. Gdy
polecenie wymaga także głównego profilu OpenClaw, umieść go przed
poleceniem QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Przepływ operatora

Bieżący przepływ operatora QA jest witryną QA z dwoma panelami:

- Po lewej: panel Gateway (interfejs sterowania) z agentem.
- Po prawej: laboratorium QA przedstawiające transkrypcję w stylu Slack i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To polecenie buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Dockerze i udostępnia
stronę laboratorium QA, na której operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować rzeczywiste zachowanie kanału i rejestrować, co zadziałało, co zawiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem laboratorium QA bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z pakietem laboratorium QA zamontowanym przez bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i
montuje `extensions/qa-lab/web/dist` przez bind mount w kontenerze `qa-lab`.
`qa:lab:watch` przebudowuje ten pakiet po zmianach, a przeglądarka automatycznie ładuje stronę ponownie,
gdy zmienia się skrót zasobów laboratorium QA.

### Testy dymne obserwowalności

<Note>
Testy QA obserwowalności pozostają dostępne wyłącznie z kopii roboczej kodu źródłowego. Archiwum npm celowo
pomija laboratorium QA (oraz `qa-channel`), dlatego ścieżki wydania pakietu Docker
nie uruchamiają poleceń `qa`. Przy zmianie instrumentacji diagnostycznej należy uruchamiać je
ze zbudowanej kopii roboczej kodu źródłowego.
</Note>

| Alias                                   | Co uruchamia                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Lokalny odbiornik OpenTelemetry oraz scenariusz `otel-trace-smoke` z włączonym `diagnostics-otel`.                                      |
| `pnpm qa:otel:collector-smoke`          | Ten sam przebieg za rzeczywistym kontenerem Docker z OpenTelemetry Collector. Należy go używać przy zmianie połączeń punktów końcowych lub zgodności kolektora/OTLP. |
| `pnpm qa:prometheus:smoke`              | Scenariusz `docker-prometheus-smoke` z włączonym `diagnostics-prometheus`.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke`, a następnie `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke`, a następnie `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` uruchamia lokalny odbiornik OTLP/HTTP, wykonuje minimalny
przebieg agenta kanału QA, a następnie sprawdza, czy wyeksportowano ślady,
metryki i dzienniki. Dekoduje wyeksportowane zakresy śladów protobuf i
sprawdza strukturę krytyczną dla wydania: muszą występować wszystkie elementy:
`openclaw.run`, `openclaw.harness.run`, zakres wywołania modelu zgodny z
najnowszą konwencją semantyczną GenAI, `openclaw.context.assembled` oraz
`openclaw.message.delivery`. Test wymusza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, dlatego zakres wywołania
modelu musi używać nazwy `{gen_ai.operation.name} {gen_ai.request.model}`; podczas pomyślnych przebiegów
wywołania modelu nie mogą eksportować `StreamAbandoned`; nieprzetworzone
identyfikatory diagnostyczne i atrybuty `openclaw.content.*` nie mogą znaleźć
się w śladzie. Monit scenariusza prosi model o odpowiedź ze stałym znacznikiem
i nieujawnianie stałego tajnego ciągu; nieprzetworzone ładunki OTLP nie mogą
zawierać żadnego z nich ani klucza sesji QA pochodzącego z identyfikatora
scenariusza. Zapisuje `otel-smoke-summary.json` obok artefaktów zestawu QA.

`qa:prometheus:smoke` sprawdza, czy nieuwierzytelnione pobieranie metryk jest
odrzucane, a następnie sprawdza, czy uwierzytelnione pobieranie zawiera
rodziny metryk krytyczne dla wydania, bez treści monitu, treści odpowiedzi,
nieprzetworzonych identyfikatorów diagnostycznych, tokenów uwierzytelniających
ani ścieżek lokalnych.

### Przebiegi testów dymnych Matrix

Aby uruchomić rzeczywisty pod względem transportu przebieg testu dymnego
Matrix, który nie wymaga danych uwierzytelniających dostawcy modelu, należy
uruchomić profil wydania z deterministycznym atrapowym dostawcą OpenAI:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Dla przebiegu z rzeczywistym dostawcą modelu frontier należy jawnie podać
dane uwierzytelniające zgodne z OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Zwykły `pnpm openclaw qa matrix` uruchamia pełny profil `all` i kontynuuje
po niepowodzeniach scenariuszy. Aby uzyskać krótszą pętlę informacji zwrotnej,
należy użyć `--fail-fast`, albo powtarzać `--scenario <id>`, aby wybierać
poszczególne scenariusze; jawne identyfikatory scenariuszy mają pierwszeństwo
przed `--profile`.

| Profil      | Scenariusze | Przeznaczenie                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Pełny katalog (domyślny).                                                                                                              |
| `release`    | 2         | Krytyczny dla wydania podstawowy zestaw kanału i przeładowanie listy dozwolonych na żywo.                                                                             |
| `fast`       | 12        | Ukierunkowane pokrycie wątków, reakcji, zatwierdzeń, zasad, ograniczania botów i zaszyfrowanych odpowiedzi.                                               |
| `transport`  | 50        | Wątki, trasowanie wiadomości prywatnych/pokoi, automatyczne dołączanie, zatwierdzenia, reakcje, ponowne uruchomienia, zasady wzmianek/list dozwolonych, edycje i kolejność wielu uczestników.         |
| `media`      | 7         | Pokrycie obrazów, generowanych obrazów, głosu, załączników, nieobsługiwanych multimediów i zaszyfrowanych multimediów.                                              |
| `e2ee-smoke` | 8         | Minimalne pokrycie zaszyfrowanych odpowiedzi, wątków, inicjalizacji, odzyskiwania, ponownych uruchomień, redakcji i niepowodzeń.                                       |
| `e2ee-deep`  | 18        | Utrata stanu, kopie zapasowe, odzyskiwanie kluczy, higiena urządzeń oraz weryfikacja SAS/QR/wiadomości prywatnych.                                                            |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, klucz odzyskiwania, wiele kont, pełny przebieg przez Gateway oraz polecenia samoweryfikacji wykonywane przez środowisko testowe. |

Przynależność do profili i wymagania kanału są zdefiniowane wraz z
deklaratywnymi scenariuszami Matrix w `qa/scenarios/channels/`. Przebieg wybiera
sterownik kanału. Ich implementacje rzeczywistego przebiegu znajdują się w
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

Adapter udostępnia jednorazowy serwer macierzysty Tuwunel w Dockerze
(domyślny obraz `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nazwa serwera `matrix-qa.test`,
port `28008`), rejestruje tymczasowych użytkowników sterownika,
testowanego systemu i obserwatora, przygotowuje wymagane pokoje oraz zapisuje
zanonimizowaną granicę żądania/odpowiedzi. Następnie uruchamia rzeczywisty
Plugin Matrix w podrzędnym Gateway QA ograniczonym do tego transportu
(bez `qa-channel`) i usuwa środowisko.

Typowe opcje:

| Flaga                     | Wartość domyślna           | Przeznaczenie                                                                              |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Wybiera jeden z powyższych profili.                                                    |
| `--scenario <id>`        | -                 | Wybiera jeden scenariusz; opcję można powtarzać.                                                     |
| `--fail-fast`            | wyłączone               | Zatrzymuje po pierwszym nieudanym sprawdzeniu lub scenariuszu.                                       |
| `--allow-failures`       | wyłączone               | Zapisuje artefakty bez zwracania kodu wyjścia oznaczającego błąd w przypadku niepowodzenia scenariuszy.         |
| `--provider-mode <mode>` | `live-frontier`   | Używa `mock-openai` do deterministycznego kierowania lub `live-frontier` do pracy z rzeczywistym dostawcą. |
| `--model <ref>`          | wartość domyślna dostawcy  | Ustawia podstawowe odwołanie `provider/model`.                                          |
| `--alt-model <ref>`      | wartość domyślna dostawcy  | Ustawia model alternatywny używany przez scenariusze przełączające modele.                        |
| `--fast`                 | wyłączone               | Włącza szybki tryb dostawcy, jeśli jest obsługiwany.                                           |
| `--output-dir <path>`    | generowany         | Wybiera katalog raportu; ścieżki względne są rozwiązywane względem `--repo-root`.           |
| `--repo-root <path>`     | bieżący katalog | Uruchamia z neutralnego katalogu roboczego.                                                |
| `--sut-account <id>`     | `sut`             | Wybiera identyfikator konta Matrix w konfiguracji podrzędnego Gateway.                            |

QA Matrix nie dzierżawi współdzielonych danych uwierzytelniających Matrix:
adapter tworzy lokalnie jednorazowych użytkowników, dlatego nie przyjmuje
`--credential-source` ani `--credential-role`. Obraz serwera macierzystego można
zastąpić za pomocą `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; czas oczekiwania negatywnych asercji
braku odpowiedzi można dostosować za pomocą `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (domyślnie
`8000`, ograniczony do limitu czasu aktywnego scenariusza).
Polecenie jednorazowe zwykle wymusza czyste zakończenie po zapisaniu
artefaktów, ponieważ natywne uchwyty kryptograficzne Matrix mogą przetrwać
czyszczenie; `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` należy ustawić tylko dla bezpośredniego
środowiska testowego, które wymaga, aby polecenie zamiast tego powróciło.

Każdy przebieg zapisuje standardowe artefakty QA Lab w wybranym katalogu
wyjściowym: `qa-suite-report.md`, `qa-suite-summary.json`, `qa-evidence.json`
oraz zanonimizowany manifest `matrix-harness-*/matrix-qa-harness.json`. Jeśli
czyszczenie się nie powiedzie, należy uruchomić wyświetlone polecenie
odzyskiwania `docker compose ... down --remove-orphans`. Na wolnych maszynach wykonawczych należy
zwiększyć okno braku odpowiedzi; w szybkim CI mniejsze okno może skrócić
negatywne asercje.

Scenariusze obejmują zachowania transportu, których testy jednostkowe nie są
w stanie potwierdzić kompleksowo: ograniczanie przez wzmianki, zasady
dopuszczania botów, listy dozwolonych, odpowiedzi najwyższego poziomu i w
wątkach, trasowanie wiadomości prywatnych, obsługę reakcji, pomijanie
przychodzących edycji, deduplikację ponownego odtwarzania po restarcie,
odzyskiwanie po przerwaniu działania serwera macierzystego, dostarczanie
metadanych zatwierdzeń, obsługę multimediów oraz przepływy inicjalizacji,
odzyskiwania i weryfikacji E2EE Matrix. Profil CLI E2EE wykonuje również
`openclaw matrix encryption setup` i polecenia weryfikacji za pośrednictwem tego samego
jednorazowego serwera macierzystego przed sprawdzeniem odpowiedzi Gateway.

`matrix-room-block-streaming` i `subagent-thread-spawn` pozostają dostępne przez jawny wybór
`--scenario`, ale nie należą do domyślnego profilu `all`.

CI używa tego samego interfejsu poleceń w
`.github/workflows/qa-live-transports-convex.yml`. Zaplanowane przebiegi i przebiegi wydania wykonują
scenariusze wydania. Ręczne uruchomienia `matrix_profile=all` rozdzielają
profile `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` i `e2ee-cli`; ukierunkowane uruchomienia wybierają
`fast`, `release` lub `transport` w jednym zadaniu.

### Scenariusze Mantis dla Discord

Discord udostępnia również opcjonalne scenariusze przeznaczone wyłącznie dla
Mantis, służące do odtwarzania błędów. Należy użyć
`--scenario discord-status-reactions-tool-only` dla jawnej osi czasu reakcji stanu
lub `--scenario discord-thread-reply-filepath-attachment`, aby utworzyć rzeczywisty wątek Discord i sprawdzić,
czy `message.thread-reply` zachowuje załącznik `filePath`. Scenariusze te
nie należą do domyślnego rzeczywistego przebiegu Discord, ponieważ są sondami
odtwarzającymi stan przed i po zmianie, a nie szerokimi testami dymnymi.
Przepływ Mantis z załącznikiem w wątku może również dodać nagranie wideo
świadka z zalogowanego Discord Web, gdy w środowisku QA skonfigurowano
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` lub `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`.
Ten profil obserwatora służy wyłącznie do rejestrowania obrazu; decyzja o
powodzeniu lub niepowodzeniu nadal pochodzi z mechanizmu kontrolnego
Discord REST.

Dla pozostałych rzeczywistych pod względem transportu przebiegów testów
dymnych:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Są one kierowane do istniejącego rzeczywistego kanału z dwoma botami lub
kontami (sterownik + testowany system). Wymagane zmienne środowiskowe, listy
scenariuszy, artefakty wyjściowe oraz pula danych uwierzytelniających Convex
dla tych czterech transportów są opisane poniżej w
[dokumentacji referencyjnej QA dla Discord, Slack, Telegram i WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference).

### Mantis: maszyna wykonawcza pulpitu Slack i zadań wizualnych

Aby uruchomić pełny przebieg na maszynie wirtualnej z pulpitem Slack i
awaryjnym dostępem VNC, należy wykonać:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę Crabbox ze środowiskiem graficznym/przeglądarką, uruchamia kanał testów na żywo Slack
wewnątrz maszyny wirtualnej, otwiera Slack Web w przeglądarce VNC, rejestruje pulpit
oraz kopiuje `slack-qa/`, `slack-desktop-smoke.png` i
`slack-desktop-smoke.mp4` (gdy dostępne jest nagrywanie wideo) z powrotem do
katalogu artefaktów Mantis. Dzierżawy Crabbox ze środowiskiem graficznym/przeglądarką zapewniają z góry narzędzia
do rejestrowania oraz pakiety pomocnicze przeglądarki/kompilacji natywnej, dlatego scenariusz
powinien instalować rozwiązania zastępcze tylko w starszych dzierżawach. Mantis raportuje łączne
czasy i czasy poszczególnych faz w `mantis-slack-desktop-smoke-report.md`, dzięki czemu w przypadku powolnych uruchomień widać,
czy czas poświęcono na przygotowanie dzierżawy, pozyskanie poświadczeń, konfigurację zdalną czy
kopiowanie artefaktów. Po ręcznym zalogowaniu się do Slack Web
przez VNC należy ponownie użyć `--lease-id <cbx_...>`; ponownie używane dzierżawy zachowują też
rozgrzaną pamięć podręczną magazynu pnpm Crabbox. Domyślne `--hydrate-mode source` przeprowadza weryfikację z kopii roboczej kodu źródłowego i
wykonuje instalację/kompilację wewnątrz maszyny wirtualnej. `--hydrate-mode prehydrated` należy używać tylko wtedy, gdy
ponownie używana zdalna przestrzeń robocza ma już `node_modules` i skompilowany `dist/`;
ten tryb pomija kosztowny etap instalacji/kompilacji i kończy się błędem w sposób bezpieczny, gdy
przestrzeń robocza nie jest gotowa. Z ustawieniem `--gateway-setup` Mantis pozostawia stale działający
Gateway Slack OpenClaw wewnątrz maszyny wirtualnej na porcie `38973`; bez niego
polecenie uruchamia standardowy kanał QA Slack między botami i kończy działanie po
zarejestrowaniu artefaktów.

Aby potwierdzić natywny interfejs zatwierdzania Slack za pomocą materiału dowodowego z pulpitu, należy uruchomić tryb
punktów kontrolnych zatwierdzania Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ten tryb wyklucza się wzajemnie z `--gateway-setup`. Uruchamia scenariusze
zatwierdzania Slack, odrzuca identyfikatory scenariuszy niezwiązanych z zatwierdzaniem, czeka przy każdym oczekującym
i rozstrzygniętym stanie zatwierdzenia, renderuje zaobserwowaną wiadomość API Slack do
`approval-checkpoints/<scenario>-pending.png` i
`approval-checkpoints/<scenario>-resolved.png`, a następnie kończy się niepowodzeniem, jeśli brakuje któregokolwiek punktu kontrolnego,
materiału dowodowego wiadomości, potwierdzenia lub wyrenderowanego zrzutu ekranu albo jeśli są one
puste. Zimne dzierżawy CI mogą nadal wyświetlać logowanie do Slack w
`slack-desktop-smoke.png`; obrazy punktów kontrolnych zatwierdzania stanowią wizualny
dowód dla tego kanału.

Domyślne uruchomienie punktów kontrolnych zachowuje dwa standardowe scenariusze zatwierdzania Slack.
Aby zarejestrować jedną z opcjonalnych ścieżek zatwierdzania Codex, należy wybrać ją jawnie za pomocą
`--scenario slack-codex-approval-exec-native` lub
`--scenario slack-codex-approval-plugin-native`; Mantis akceptuje obie i generuje
tę samą parę zrzutów ekranu stanu oczekującego/rozstrzygniętego. Program uruchamiający wydłuża terminy
punktów kontrolnych i poleceń zdalnych dla każdej wybranej ścieżki Codex, aby mogła zakończyć się pełna
sekwencja zatwierdzania, ukończenia pracy agenta i aktualizacji stanu rozstrzygniętego.

Lista kontrolna operatora, polecenie uruchamiania przepływu pracy GitHub, kontrakt komentarza
z materiałem dowodowym, tabela decyzyjna trybu uzupełniania, interpretacja czasów i kroki
obsługi błędów znajdują się w
[Podręczniku uruchamiania Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Aby wykonać zadanie w środowisku graficznym w stylu agenta/CV, należy uruchomić:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` dzierżawi lub ponownie wykorzystuje maszynę Crabbox ze środowiskiem graficznym/przeglądarką, uruchamia
`crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, rejestruje `visual-task.png`, uruchamia `openclaw infer image
describe` względem zrzutu ekranu, gdy wybrano `--vision-mode image-describe`,
oraz zapisuje `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` i
`mantis-visual-task-report.md`. Gdy ustawiono `--expect-text`, monit modelu wizyjnego
żąda ustrukturyzowanego werdyktu JSON (`visible`, `evidence`, `reason`)
i test przechodzi tylko wtedy, gdy model zgłosi `visible: true` z materiałem dowodowym,
który wskazuje oczekiwany tekst; odpowiedź `visible: false`, która jedynie cytuje
tekst docelowy, nadal nie spełnia asercji. `--vision-mode metadata` służy do
testu dymnego bez modelu, który potwierdza działanie pulpitu, przeglądarki, zrzutów ekranu i
mechanizmu nagrywania wideo bez wywoływania dostawcy rozumienia obrazów. Nagranie jest
wymaganym artefaktem dla `visual-task`; jeśli Crabbox nie zarejestruje niepustego
`visual-task.mp4`, zadanie zakończy się niepowodzeniem, nawet gdy sterownik wizualny zadziałał poprawnie. W razie
niepowodzenia Mantis zachowuje dzierżawę na potrzeby VNC, chyba że zadanie wcześniej zakończyło się powodzeniem,
a `--keep-lease` nie było ustawione.

### Kontrola kondycji puli poświadczeń

Przed użyciem poświadczeń na żywo z puli należy uruchomić:

```bash
pnpm openclaw qa credentials doctor
```

Narzędzie diagnostyczne sprawdza zmienne środowiskowe brokera Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), weryfikuje ustawienia punktu końcowego, raportuje
wyłącznie stan ustawione/brakujące dla `OPENCLAW_QA_CONVEX_SECRET_CI` i
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` oraz weryfikuje dostępność operacji administracyjnych/wyświetlania listy,
gdy obecny jest sekret opiekuna.

## Kanoniczny zakres scenariuszy

Główny plik `taxonomy.yaml` definiuje semantyczne identyfikatory zakresu. Pliki YAML scenariuszy
w `qa/scenarios/` odwzorowują każdy scenariusz na te identyfikatory i są właścicielami metadanych
wykonania: `channel` jest jedynym wymaganiem dotyczącym kanału, a `profiles` deklarują
przynależność do nazwanych uruchomień. Sterownik kanału jest wymiennym wyborem implementacji
na poziomie uruchomienia. Programy uruchamiające TypeScript
odpytują ten katalog; nie utrzymują równoległych spisów scenariuszy ani zakresu.

Statyczne dane wyjściowe `qa coverage` raportują odwzorowanie taksonomii na scenariusze. Faktyczny
dowód pochodzi z `qa-evidence.json`, który rejestruje wykonany scenariusz,
identyfikatory zakresu, kanał, faktycznie użyty sterownik i wynik. Kanał i sterownik są
wymiarami raportu, a nie dodatkowymi słownikami identyfikatorów zakresu ani osiami
kwalifikowania scenariuszy.

Aby uruchomić kanał w jednorazowej maszynie wirtualnej z systemem Linux bez wprowadzania Dockera do ścieżki QA, należy wykonać:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Polecenie uruchamia świeżego gościa Multipass, instaluje zależności, kompiluje OpenClaw
wewnątrz systemu gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście. Ponownie wykorzystuje ten sam
sposób wyboru scenariuszy co `qa suite` na hoście.

Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy
równolegle, korzystając z izolowanych procesów roboczych Gateway. `qa-channel` ma domyślną
współbieżność 4, ograniczoną liczbą wybranych scenariuszy. `--concurrency
<count>` służy do dostosowania liczby procesów roboczych, a `--concurrency 1` do wykonywania szeregowego.
`--pack personal-agent` uruchamia pakiet testów porównawczych osobistego asystenta (10
scenariuszy). Selektor pakietu działa addytywnie z powtarzanymi flagami `--scenario`:
najpierw uruchamiane są jawnie wskazane scenariusze, a następnie scenariusze pakietu w jego kolejności,
z usuniętymi duplikatami. `--pack observability` pozwala wybrać razem scenariusze
`otel-trace-smoke` i `docker-prometheus-smoke`, gdy
niestandardowy program uruchamiający QA zapewnia już konfigurację kolektora OpenTelemetry.

Polecenie kończy się kodem różnym od zera, gdy nie powiedzie się dowolny scenariusz. `--allow-failures`
należy użyć, gdy potrzebne są artefakty bez kodu zakończenia oznaczającego niepowodzenie.

Uruchomienia na żywo przekazują obsługiwane dane uwierzytelniające QA, których użycie
w systemie gościa jest praktyczne: klucze dostawców oparte na zmiennych środowiskowych, ścieżkę konfiguracji dostawcy QA na żywo oraz
`CODEX_HOME`, gdy jest obecne. `--output-dir` należy przechowywać w katalogu głównym repozytorium, aby
system gościa mógł zapisywać dane zwrotnie przez zamontowaną przestrzeń roboczą.

## Dokumentacja referencyjna QA dla Discord, Slack, Telegram i WhatsApp

Adapter Matrix korzysta z opisanego wcześniej jednorazowego kanału opartego na Dockerze.
Discord, Slack, Telegram i WhatsApp działają na istniejących rzeczywistych
transportach, dlatego ich dokumentacja referencyjna znajduje się tutaj.

### Współdzielone flagi CLI

Te kanały są rejestrowane przez
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i
przyjmują te same flagi:

| Flaga                                  | Domyślnie                                            | Opis                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Uruchamia tylko ten scenariusz. Można powtarzać.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Miejsce zapisu raportów, podsumowań, materiałów dowodowych, artefaktów właściwych dla transportu i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Katalog główny repozytorium podczas wywoływania z neutralnego katalogu roboczego.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | Identyfikator konta tymczasowego w konfiguracji Gateway QA.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` lub `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | domyślna wartość dostawcy                                   | Odwołania do modelu głównego/alternatywnego.                                                                                                                   |
| `--fast`                              | wyłączone                                                | Tryb szybki dostawcy, jeśli jest obsługiwany.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Zobacz [Pulę poświadczeń Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                 | Rola używana, gdy `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | wyłączone                                                | Zapisuje artefakty bez zwracania kodu zakończenia oznaczającego niepowodzenie, gdy scenariusze się nie powiodą.                                                                      |

Każdy kanał kończy się kodem różnym od zera w przypadku niepowodzenia dowolnego scenariusza. `--allow-failures` zapisuje
artefakty bez ustawiania kodu zakończenia oznaczającego niepowodzenie. Telegram przyjmuje również
`--list-scenarios`, aby wyświetlić dostępne identyfikatory scenariuszy i zakończyć działanie; pozostałe kanały
nie udostępniają tej flagi.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma różnymi botami (sterownik +
testowany system). Bot testowanego systemu musi mieć nazwę użytkownika Telegram; obserwacja między botami działa
najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w
`@BotFather`.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Profil `release` wybiera utrzymywane scenariusze YAML Telegram; `all`
dodaje opcjonalne testy obciążeniowe sesji, użycia, łańcucha odpowiedzi i strumieniowania. Jawne
wartości `--scenario` zastępują profil.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Profil `release` zawsze obejmuje test canary, bramkowanie wzmianek, odpowiedzi
na natywne polecenia, adresowanie poleceń oraz odpowiedzi botów do botów w grupach. `mock-openai`
obejmuje również deterministyczną kontrolę podglądu długiej odpowiedzi końcowej.
`telegram-current-session-status-tool` i
`telegram-tool-only-usage-footer` pozostają opcjonalne: pierwszy jest stabilny tylko
w przypadku uruchomienia bezpośrednio po teście canary, a drugi stanowi test w rzeczywistym Telegramie
stopki `/usage` w odpowiedziach zawierających wyłącznie wyniki narzędzi. Użyj `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai`, aby wyświetlić bieżący
podział na elementy domyślne i opcjonalne wraz z odwołaniami do regresji. Używaj `--profile all` dla każdego
scenariusza adaptera działającego na żywo w Telegramie.

Artefakty wyjściowe:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu na żywo,
  obejmujące pola profilu, zakresu, dostawcy, kanału, artefaktów, wyniku i RTT.

Uruchomienia Telegrama z pakietu korzystają z tego samego kontraktu poświadczeń Telegrama. Wielokrotny pomiar RTT
jest częścią standardowej ścieżki Telegrama na żywo dla pakietu; rozkład RTT
jest uwzględniany w `qa-evidence.json` w sekcji `result.timing` dla
wybranej kontroli RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Gdy ustawiono `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, otoka pakietu działającego na żywo
dzierżawi poświadczenie `kind: "telegram"`, eksportuje zmienne środowiskowe dzierżawionej grupy, sterownika i bota SUT
do uruchomienia z zainstalowanego pakietu, wysyła Heartbeat dzierżawy i zwalnia ją
podczas zamykania. Domyślnie otoka pakietu wykonuje 20 kontroli RTT
`channel-canary` z limitem czasu RTT wynoszącym 30s oraz używa roli Convex
`maintainer` poza CI, gdy wybrano Convex. Zastąp wartości
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
lub `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostosować pomiar RTT bez
tworzenia osobnego polecenia RTT ani formatu podsumowania specyficznego dla Telegrama.

### Kontrola jakości Discorda

```bash
pnpm openclaw qa discord
```

Obejmuje jeden rzeczywisty prywatny kanał serwera Discord z dwoma botami: botem sterownika
kontrolowanym przez środowisko testowe oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw
za pośrednictwem dołączonego pluginu Discorda. Sprawdza obsługę wzmianek na kanale,
czy bot SUT zarejestrował natywne polecenie `/help` w Discordzie, oraz
opcjonalne scenariusze dowodowe Mantis.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi być zgodny z identyfikatorem użytkownika bota SUT
  zwracanym przez Discord (w przeciwnym razie ścieżka natychmiast kończy się niepowodzeniem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wybiera kanał głosowy/sceniczny dla
  `discord-voice-autojoin`; bez tej wartości scenariusz wybiera pierwszy widoczny
  dla bota SUT kanał głosowy/sceniczny.

Scenariusze modułu YAML Discorda (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opcjonalny scenariusz głosowy. Działa samodzielnie, włącza
  `channels.discord.voice.autoJoin` i sprawdza, czy bieżący stan głosowy
  bota SUT w Discordzie wskazuje docelowy kanał głosowy/sceniczny. Poświadczenia Discorda w Convex
  mogą zawierać opcjonalne `voiceChannelId`; w przeciwnym razie adapter
  wykonawczy wykrywa pierwszy widoczny kanał głosowy/sceniczny na serwerze.
- `discord-status-reactions-tool-only` - opcjonalny scenariusz Mantis. Działa
  samodzielnie, ponieważ przełącza SUT na zawsze aktywne odpowiedzi na serwerze zawierające wyłącznie wyniki narzędzi
  przy użyciu `messages.statusReactions.enabled=true`, a następnie rejestruje oś czasu
  reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed wykonaniem i po nim
  zachowują również dostarczone przez scenariusz artefakty MP4 jako `baseline.mp4`
  i `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - opcjonalny scenariusz Mantis; zobacz
  [Scenariusze Mantis dla Discorda](#discord-mantis-scenarios).

Jawne uruchomienie scenariusza automatycznego dołączania do kanału głosowego Discorda:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Jawne uruchomienie scenariusza reakcji na status Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefakty wyjściowe:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu na żywo.
- `discord-qa-reaction-timelines.json` i
  `discord-status-reactions-tool-only-timeline.png` podczas działania scenariusza
  reakcji na status.

### Kontrola jakości Slacka

```bash
pnpm openclaw qa slack
```

Obejmuje jeden rzeczywisty prywatny kanał Slacka z dwoma odrębnymi botami: botem sterownika
kontrolowanym przez środowisko testowe oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw
za pośrednictwem dołączonego pluginu Slacka.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` włącza punkty kontrolne
  zatwierdzania wizualnego dla Mantis. Adapter zapisuje `<scenario>.pending.json` i
  `<scenario>.resolved.json`, a następnie oczekuje na zgodne pliki `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` zastępuje limit czasu
  potwierdzenia punktu kontrolnego. Wartość domyślna to `120000`.

Kanoniczne scenariusze YAML udostępniane przez adapter Slacka działający na żywo:

- `thread-follow-up`
- `thread-isolation`

Scenariusze modułu YAML Slacka (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - opcjonalna próba w rzeczywistym Slacku, która potwierdza, że
  skonfigurowany wyłączony kanał emituje ustrukturyzowane ostrzeżenie bez wysyłania odpowiedzi.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` i
  `slack-progress-commentary-verbose-dedupe` - opcjonalne próby w rzeczywistym Slacku dotyczące
  niezależnych mechanizmów sterowania komentarzem/postępem narzędzia, starszej wartości domyślnej
  przy pominięciu klucza oraz jednokrotnego dostarczenia, gdy włączono trwały szczegółowy postęp.
- `slack-reaction-glyph-native` - opcjonalny scenariusz reakcji narzędzia wiadomości na żywo.
  Poleca agentowi przekazać dokładny glif `✅` i potwierdza, że Slack zapisał
  `white_check_mark` dla bota SUT w wiadomości docelowej.
- `slack-chart-presentation-native` - opcjonalny przenośny scenariusz wykresu, który
  sprawdza natywny blok `data_visualization` oraz dokładny tekst dostępności.
- `slack-table-presentation-native` - opcjonalny przenośny scenariusz tabeli, który
  sprawdza natywny blok `data_table`, dokładne wiersze oraz tekst dostępności.
- `slack-table-invalid-blocks-fallback` - opcjonalny scenariusz transportu bezpośredniego,
  który wysyła czytelną strukturalnie, przekraczającą limit nieprzetworzoną tabelę ze 101 wierszami danych
  i nagłówkiem przez
  produkcyjną ścieżkę wysyłania Slacka, potwierdza, że sam Slack zwraca `invalid_blocks`,
  oraz sprawdza, czy zapisana rezerwowa postać z wyłączonym formatowaniem jest kompletna i nie zawiera
  natywnego bloku danych. Szczegóły scenariusza zachowują wyłącznie bezpieczne dowody w postaci kodu błędu, liczby
  oraz wartości logicznych.
- `slack-approval-exec-native` - opcjonalny scenariusz natywnego zatwierdzania wykonania w Slacku.
  Żąda zatwierdzenia wykonania za pośrednictwem Gateway, sprawdza, czy wiadomość w Slacku
  zawiera natywne przyciski zatwierdzania, rozstrzyga żądanie i sprawdza zaktualizowaną wiadomość
  w Slacku po rozstrzygnięciu.
- `slack-approval-plugin-native` - opcjonalny scenariusz natywnego zatwierdzania pluginu
  w Slacku. Włącza jednocześnie przekazywanie zatwierdzeń wykonania i pluginu, aby zdarzenia pluginu
  nie były pomijane przez trasowanie zatwierdzeń wykonania, a następnie sprawdza tę samą natywną
  ścieżkę interfejsu Slacka dla stanu oczekującego i rozstrzygniętego.
- `slack-codex-approval-exec-native` - opcjonalny scenariusz zatwierdzania poleceń Codex Guardian.
  Włącza plugin Codex w trybie Guardian, trasuje
  turę agenta Gateway pochodzącą ze Slacka przez środowisko testowe serwera aplikacji Codex,
  oczekuje na natywny monit zatwierdzenia pluginu w Slacku dla
  `openclaw-codex-app-server`, rozstrzyga go i sprawdza, czy tura Codex
  kończy się oczekiwanymi znacznikami wyniku polecenia i asystenta.
- `slack-codex-approval-plugin-native` - opcjonalny scenariusz zatwierdzania plików Codex Guardian.
  Używa instrukcji `apply_patch` dotyczącej lokalizacji poza obszarem roboczym, aby Codex wyemitował
  ścieżkę zatwierdzania zmiany pliku serwera aplikacji, a następnie sprawdza tę samą natywną
  ścieżkę zatwierdzania w Slacku dla stanu oczekującego i rozstrzygniętego, końcowy znacznik asystenta oraz dokładną zawartość
  pliku przed czyszczeniem.

Scenariusze zatwierdzania Codex wymagają `openai/*` lub `codex/*` `--model`,
standardowych poświadczeń modelu działającego na żywo oraz uwierzytelnienia Codex albo uwierzytelnienia kluczem API akceptowanego przez plugin Codex.
Szczegóły scenariusza obejmują metodę serwera aplikacji Codex, wybrany klucz modelu Codex,
końcowy stan tury Codex i weryfikację znacznika operacji wraz ze
zredagowanymi metadanymi zatwierdzenia Slacka.

Artefakty wyjściowe:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - wpisy dowodowe dla kontroli transportu na żywo.
- `approval-checkpoints/` - tylko gdy Mantis ustawi
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; zawiera kod JSON punktu kontrolnego,
  kod JSON potwierdzenia oraz zrzuty ekranu stanu oczekującego i rozstrzygniętego.

#### Konfigurowanie obszaru roboczego Slacka

Ścieżka wymaga dwóch odrębnych aplikacji Slacka w jednym obszarze roboczym oraz kanału, którego członkami
są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty.
  Użyj dedykowanego kanału; ścieżka publikuje wiadomości przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być
  inną aplikacją Slacka niż sterownik, aby identyfikator użytkownika jej bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z
  `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Zaleca się korzystanie z obszaru roboczego Slacka przeznaczonego do kontroli jakości zamiast ponownego używania
produkcyjnego obszaru roboczego.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonego pluginu Slacka
(`extensions/slack/src/setup-shared.ts:12`) do
uprawnień i zdarzeń objętych zestawem kontroli jakości Slacka na żywo. Informacje o konfiguracji
kanału produkcyjnego widocznej dla użytkowników zawiera
[Krótka konfiguracja kanału Slacka](/pl/channels/slack#quick-setup); para QA Driver/SUT
jest celowo odrębna, ponieważ ścieżka wymaga dwóch różnych identyfikatorów użytkowników botów
w jednym obszarze roboczym.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → wybierz obszar roboczy QA, wklej poniższy manifest,
a następnie wybierz _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot sterownika testowego dla ścieżki kontroli jakości OpenClaw Slack na żywo"
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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) — stanie się on
`driverBotToken`. Sterownik musi jedynie publikować wiadomości i identyfikować
siebie; bez zdarzeń i bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Create New App → From a manifest_ w tym samym obszarze roboczym. Ta aplikacja QA
celowo korzysta z węższej wersji produkcyjnego manifestu dołączonego pluginu Slacka
(`extensions/slack/src/setup-shared.ts:12`): zakresy
i zdarzenia reakcji zostały pominięte, ponieważ zestaw kontroli jakości Slacka na żywo nie obejmuje
jeszcze obsługi reakcji.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Łącznik OpenClaw QA SUT dla OpenClaw"
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

Gdy Slack utworzy aplikację, wykonaj dwie czynności na jej stronie ustawień:

- _Install to Workspace_ → skopiuj _Bot User OAuth Token_ → stanie się on
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → dodaj
  zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → stanie się ona
  `sutAppToken`.

Sprawdź, czy oba boty mają różne identyfikatory użytkownika, wywołując `auth.test` dla każdego
tokenu. Środowisko uruchomieniowe rozróżnia sterownik i SUT na podstawie identyfikatora użytkownika; ponowne użycie jednej aplikacji
dla obu spowoduje natychmiastowy błąd bramkowania wzmianek.

**3. Utwórz kanał**

W przestrzeni roboczej QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba
boty z poziomu kanału:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _channel info → About → Channel ID_ — stanie się on
`channelId`. Kanał publiczny jest odpowiedni; jeśli używany jest kanał prywatny,
obie aplikacje mają już `groups:history`, więc odczyty historii przez zestaw testowy
nadal zakończą się powodzeniem.

**4. Zarejestruj dane uwierzytelniające**

Dostępne są dwie opcje. Do debugowania na jednym komputerze użyj zmiennych środowiskowych (ustaw cztery
zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasil
współdzieloną pulę Convex, aby CI i inni opiekunowie mogli je dzierżawić.

W przypadku puli Convex zapisz cztery pola w pliku JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Po wyeksportowaniu `OPENCLAW_QA_CONVEX_SITE_URL` i `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
w powłoce zarejestruj i zweryfikuj:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Zasilenie puli QA Slack"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Oczekiwane są `count: 1`, `status: "active"` i brak pola `lease`.

**5. Zweryfikuj działanie kompleksowe**

Uruchom ścieżkę lokalnie, aby potwierdzić, że oba boty mogą komunikować się ze sobą za pośrednictwem
brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Pomyślne uruchomienie kończy się znacznie szybciej niż w ciągu 30 sekund, a `qa-suite-report.md`
pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze stanem `pass`. Jeśli
ścieżka zawiesza się na około 90 sekund i kończy z `Convex credential pool exhausted
for kind "slack"`, pula jest pusta albo wszystkie wiersze są dzierżawione — `qa
credentials list --kind slack --status all --json` wskaże właściwą przyczynę.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Obejmuje dwa dedykowane konta WhatsApp Web: konto sterownika kontrolowane przez
zestaw testowy oraz konto SUT uruchamiane przez podrzędny Gateway OpenClaw za pośrednictwem
dołączonego pluginu WhatsApp.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcjonalnie:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` włącza scenariusze grupowe, takie jak
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenariusze grupowych akcji, multimediów i ankiet
  oraz `whatsapp-group-allowlist-block`.

Scenariusze YAML WhatsApp (`qa/scenarios/channels/whatsapp-*.yaml`):

- Podstawowe działanie i bramkowanie grupowe: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Polecenia natywne: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Zachowanie odpowiedzi i końcowych danych wyjściowych: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Akcje na wiadomościach w ścieżce użytkownika: `whatsapp-agent-message-action-react` rozpoczyna się
  od rzeczywistej wiadomości prywatnej sterownika, pozwala modelowi wywołać narzędzie `message` i
  obserwuje natywną reakcję WhatsApp. `whatsapp-agent-message-action-upload-file`
  używa tego samego podejścia dla `message(action=upload-file)` i obserwuje
  natywne multimedia WhatsApp. `whatsapp-group-agent-message-action-react` i
  `whatsapp-group-agent-message-action-upload-file` potwierdzają te same
  działania widoczne dla użytkownika w rzeczywistej grupie WhatsApp.
- Rozsyłanie grupowe: `whatsapp-broadcast-group-fanout` rozpoczyna się od jednej wiadomości
  grupowej WhatsApp zawierającej wzmiankę i weryfikuje odrębne widoczne odpowiedzi od `main`
  i `qa-second`.
- Aktywacja grupy: `whatsapp-group-activation-always` zmienia rzeczywistą sesję
  grupową na `/activation always`, potwierdza, że wiadomość grupowa bez wzmianki budzi
  agenta, a następnie przywraca `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` inicjuje odpowiedź bota, wysyła do niej natywną
  cytowaną odpowiedź bez jawnej wzmianki i weryfikuje, że agent
  budzi się na podstawie kontekstu tej odpowiedzi.
- Przychodzące multimedia i wiadomości strukturalne: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Wysyłają one za pośrednictwem sterownika rzeczywiste zdarzenia WhatsApp dotyczące obrazów, dźwięku, dokumentów, lokalizacji, kontaktów,
  naklejek i reakcji.
- Bezpośrednie sondy kontraktu Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Celowo pomijają one wysyłanie monitów do modelu
  i potwierdzają deterministyczne kontrakty `send`, `poll` oraz
  `message.action` dla Gateway/kanału.
- Pokrycie kontroli dostępu: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Natywne zatwierdzenia: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reakcje stanu: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Katalog zawiera obecnie 52 scenariusze. Domyślna ścieżka `live-frontier`
pozostaje niewielka i obejmuje 8 scenariuszy, aby zapewnić szybkie podstawowe pokrycie. Domyślna ścieżka `mock-openai`
uruchamia deterministycznie 39 scenariuszy przez rzeczywisty transport WhatsApp,
imitując wyłącznie dane wyjściowe modelu; scenariusze zatwierdzania i kilka
bardziej wymagających lub blokujących kontroli nadal trzeba wskazywać jawnie za pomocą identyfikatora scenariusza.

Sterownik QA WhatsApp obserwuje strukturalne zdarzenia na żywo (`text`, `media`,
`location`, `reaction` i `poll`) oraz może aktywnie wysyłać multimedia, ankiety,
kontakty, lokalizacje i naklejki. QA Lab importuje ten sterownik przez
powierzchnię pakietu `@openclaw/whatsapp/api.js`, zamiast sięgać do prywatnych
plików środowiska uruchomieniowego WhatsApp. W przypadku obserwacji grupowych `fromJid` jest identyfikatorem JID grupy,
natomiast `participantJid` i `fromPhoneE164` identyfikują uczestnika będącego nadawcą.
Treść wiadomości jest domyślnie redagowana. Bezpośrednie sondy Gateway dotyczące ankiet, przesyłania plików,
multimediów, ankiet grupowych, multimediów grupowych i kształtu odpowiedzi są kontrolami kontraktu
transportu/API; nie są traktowane jako dowód, że monit użytkownika skłonił
agenta do wybrania tej samej akcji. Dowody działań w ścieżce użytkownika pochodzą ze scenariuszy
takich jak `whatsapp-agent-message-action-react` i
`whatsapp-group-agent-message-action-react`, w których sterownik wysyła zwykłą
wiadomość WhatsApp, a QA Lab obserwuje powstały natywny artefakt WhatsApp.
Szczegóły scenariuszy WhatsApp zawierają podejście każdego scenariusza (`user-path`,
`direct-gateway` lub `native-approval`), aby dowodów nie można było pomylić z
silniejszym kontraktem niż ten, który faktycznie potwierdzają.

Artefakty wyjściowe:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` — wpisy dowodowe dla kontroli transportu na żywo.

### Pula danych uwierzytelniających Convex

Ścieżki Discord, Slack, Telegram i WhatsApp mogą dzierżawić dane uwierzytelniające ze
współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż
`--credential-source convex` (lub ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab uzyskuje wyłączną dzierżawę, wysyła jej Heartbeat przez cały czas
uruchomienia i zwalnia ją podczas zamykania. Rodzaje puli to `"discord"`, `"slack"`,
`"telegram"` i `"whatsapp"`.

Kształty ładunków weryfikowane przez brokera przy `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Rzeczywisty użytkownik Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  wyłącznie na potrzeby dowodu Mantis w aplikacji Telegram Desktop. Ogólne ścieżki QA Lab nie mogą pozyskiwać
  tego rodzaju.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — numery telefonów muszą być różnymi ciągami E.164.

Przepływ pracy dowodu Mantis w aplikacji Telegram Desktop utrzymuje jedną wyłączną dzierżawę Convex
`telegram-user` zarówno dla sterownika CLI TDLib, jak i świadka Telegram Desktop,
a następnie zwalnia ją po opublikowaniu dowodu.

Gdy PR wymaga deterministycznego porównania wizualnego, Mantis może użyć tej samej imitowanej
odpowiedzi modelu na `main` i w wersji głównej PR, podczas gdy zmienia się formater Telegram lub
warstwa dostarczania. Domyślne ustawienia przechwytywania są dostosowane do komentarzy w PR: standardowa
klasa Crabbox, nagranie pulpitu 24fps, animowany GIF 24fps i szerokość podglądu
1920px. Komentarze przed/po powinny publikować czysty pakiet zawierający
wyłącznie zamierzone pliki GIF.

Ścieżki Slack również mogą korzystać z puli. Kontrole kształtu ładunku Slack znajdują się obecnie
w programie uruchamiającym QA Slack, a nie w brokerze; użyj `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` z
identyfikatorem kanału Slack, takim jak `Cxxxxxxxxxx`. Zobacz
[Konfigurowanie przestrzeni roboczej Slack](#setting-up-the-slack-workspace), aby uzyskać informacje o udostępnianiu
aplikacji i zakresów.

Operacyjne zmienne środowiskowe i kontrakt punktu końcowego brokera Convex opisano w sekcji
[Testowanie → Współdzielone dane uwierzytelniające Telegram za pośrednictwem Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1)
(nazwa sekcji pochodzi sprzed wprowadzenia puli wielokanałowej; semantyka dzierżawy jest
wspólna dla wszystkich rodzajów).

## Materiały inicjujące przechowywane w repozytorium

Materiały inicjujące znajdują się w `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Celowo są przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i
agenta.

`qa-lab` pozostaje ogólnym programem uruchamiającym scenariusze YAML. Każdy plik YAML scenariusza jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- `title` najwyższego poziomu
- metadane `scenario`
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka w `scenario`
- odwołania do dokumentacji i kodu w `scenario`
- opcjonalne wymagania dotyczące pluginów w `scenario`
- opcjonalną poprawkę konfiguracji Gateway w `scenario`
- wykonywalny element `flow` najwyższego poziomu dla scenariuszy przepływu albo
  `scenario.execution.kind` / `scenario.execution.path` dla scenariuszy Vitest i
  Playwright

Wielokrotnego użytku warstwa środowiska uruchomieniowego, na której opiera się `flow`, pozostaje ogólna i
przekrojowa. Na przykład scenariusze YAML mogą łączyć pomocnicze funkcje
po stronie transportu z funkcjami po stronie przeglądarki, które sterują osadzonym interfejsem Control UI przez
punkt integracji Gateway `browser.request`, bez dodawania specjalnego mechanizmu uruchamiającego.

Pliki scenariuszy należy grupować według możliwości produktu, a nie folderu
w drzewie źródłowym. Identyfikatory scenariuszy powinny pozostawać stabilne po przeniesieniu plików; do
śledzenia implementacji należy używać `docsRefs` i `codeRefs`.

Lista bazowa powinna być na tyle szeroka, aby obejmować:

- wiadomości prywatne i czat na kanale
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazywanie zadań podagentom
- odczytywanie repozytorium i dokumentacji
- jedno małe zadanie kompilacji, takie jak Lobster Invaders

## Ścieżki atrap dostawców

`qa suite` ma dwie lokalne ścieżki atrap dostawców:

- `mock-openai` to atrapa OpenClaw uwzględniająca scenariusze. Pozostaje domyślną
  deterministyczną ścieżką atrap na potrzeby kontroli jakości opartej na repozytorium i bramek zgodności.
- `aimock` uruchamia serwer dostawcy oparty na AIMock do eksperymentalnego
  pokrycia protokołu, danych testowych, nagrywania/odtwarzania i chaosu. Stanowi uzupełnienie i
  nie zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada własne wartości domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway,
potrzeby przygotowania profilu uwierzytelniania oraz flagi możliwości trybu rzeczywistego/atrapy. Wspólny kod zestawu i
Gateway korzysta z rejestru dostawców zamiast rozgałęziać się na podstawie
nazw dostawców.

## Adaptery transportu

`qa-lab` zapewnia ogólny punkt integracji transportu dla scenariuszy kontroli jakości YAML. `qa-channel` jest
syntetycznym ustawieniem domyślnym. `crabline` uruchamia lokalne serwery odwzorowujące dostawców i
wykonuje na nich standardowe pluginy kanałów OpenClaw. `live` jest zarezerwowane dla
rzeczywistych poświadczeń dostawców i kanałów zewnętrznych.

Na poziomie architektury podział wygląda następująco:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność procesów roboczych, zapisywanie
  artefaktów i raportowanie.
- Adapter transportu odpowiada za konfigurację Gateway, gotowość, obserwację ruchu przychodzącego i wychodzącego,
  akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy YAML w `qa/scenarios/` definiują przebieg testu; `qa-lab`
  zapewnia wielokrotnego użytku warstwę środowiska uruchomieniowego, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu kontroli jakości YAML wymaga implementacji kanału
oraz pakietu scenariuszy sprawdzających kontrakt kanału. Aby zapewnić pokrycie w testach dymnych CI,
należy dodać odpowiedni lokalny serwer dostawcy Crabline i udostępnić go
przez sterownik `crabline`.

Nie należy dodawać nowego głównego korzenia poleceń kontroli jakości, jeśli współdzielony host `qa-lab` może
obsłużyć ten przepływ.

`qa-lab` odpowiada za współdzielone mechanizmy hosta:

- korzeń poleceń `openclaw qa`
- uruchamianie i zamykanie zestawu
- współbieżność procesów roboczych
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy mechanizmu uruchamiającego odpowiadają za kontrakt transportu:

- sposób montowania `openclaw qa <runner>` pod współdzielonym korzeniem `qa`
- sposób konfigurowania Gateway dla tego transportu
- sposób sprawdzania gotowości
- sposób wstrzykiwania zdarzeń przychodzących
- sposób obserwowania wiadomości wychodzących
- sposób udostępniania transkrypcji i znormalizowanego stanu transportu
- sposób wykonywania akcji opartych na transporcie
- sposób obsługi resetowania lub czyszczenia właściwego dla transportu

Minimalne wymagania dotyczące wdrożenia nowego kanału:

1. Należy zachować `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Należy zaimplementować mechanizm uruchamiający transportu w ramach współdzielonego punktu integracji hosta `qa-lab`.
3. Mechanizmy właściwe dla transportu należy utrzymywać wewnątrz pluginu mechanizmu uruchamiającego lub
   uprzęży kanału.
4. Mechanizm uruchamiający należy zamontować jako `openclaw qa <runner>` zamiast rejestrować
   konkurencyjne polecenie główne. Pluginy mechanizmu uruchamiającego powinny deklarować `qaRunners` w
   `openclaw.plugin.json` i eksportować zgodną tablicę `qaRunnerCliRegistrations`
   z `runtime-api.ts`. Plik `runtime-api.ts` powinien pozostać lekki; leniwe wykonywanie CLI i
   mechanizmu uruchamiającego powinno pozostawać za oddzielnymi punktami wejścia. Opcjonalny
   `adapterFactory` udostępnia transport współdzielonym scenariuszom bez zmieniania
   istniejącego katalogu scenariuszy polecenia.
5. Należy tworzyć lub dostosowywać scenariusze YAML w tematycznych katalogach `qa/scenarios/`.
6. W nowych scenariuszach należy używać ogólnych funkcji pomocniczych scenariuszy.
7. Należy zachować działanie istniejących aliasów zgodności, chyba że repozytorium przeprowadza
   celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić jednokrotnie w `qa-lab`, należy umieścić je w `qa-lab`.
- Jeśli zachowanie zależy od transportu jednego kanału, należy utrzymywać je w odpowiednim pluginie
  mechanizmu uruchamiającego lub uprzęży pluginu.
- Jeśli scenariusz wymaga nowej możliwości, z której może korzystać więcej niż jeden kanał,
  należy dodać ogólną funkcję pomocniczą zamiast gałęzi właściwej dla kanału w `suite.ts`.
- Jeśli zachowanie ma znaczenie tylko dla jednego transportu, scenariusz powinien pozostać
  właściwy dla transportu, a kontrakt scenariusza powinien wskazywać to wprost.

### Nazwy funkcji pomocniczych scenariuszy

Preferowane ogólne funkcje pomocnicze dla nowych scenariuszy:

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy —
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` — ale nowe scenariusze
powinny używać nazw ogólnych. Aliasy istnieją, aby uniknąć jednorazowej
migracji wszystkich elementów, a nie jako docelowy model.

## Raportowanie

`qa-lab` eksportuje raport protokołu w formacie Markdown z zaobserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co nie zadziałało
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać spis dostępnych scenariuszy — przydatny przy określaniu zakresu dalszych prac
lub podłączaniu nowego transportu — należy uruchomić `pnpm openclaw qa coverage` (dodać `--json`
w celu uzyskania danych w formacie przeznaczonym do odczytu maszynowego). Przy wyborze ukierunkowanego potwierdzenia dla zmienionego
zachowania lub ścieżki pliku należy uruchomić `pnpm openclaw qa coverage --match <query>`. Raport
dopasowania przeszukuje metadane scenariuszy, odwołania do dokumentacji, odwołania do kodu, identyfikatory pokrycia,
pluginy i wymagania dostawców, a następnie wyświetla pasujące cele `qa suite
--scenario ...`.

Każde uruchomienie `qa suite` zapisuje artefakty najwyższego poziomu `qa-evidence.json`,
`qa-suite-summary.json` i `qa-suite-report.md` dla wybranego
zestawu scenariuszy. Scenariusze deklarujące `execution.kind: vitest` lub
`execution.kind: playwright` uruchamiają odpowiednią ścieżkę testową i zapisują również
dzienniki poszczególnych scenariuszy. Scenariusze deklarujące `execution.kind: script` uruchamiają
producenta materiału dowodowego w `execution.path` przez `node --import tsx` (z
`${outputDir}` i `${scenarioId}` rozwiniętymi w `execution.args`); producent
zapisuje własny `qa-evidence.json`, którego wpisy są importowane do
danych wyjściowych zestawu, a ścieżki artefaktów są rozwiązywane względem
`qa-evidence.json` tego producenta. Gdy `qa suite` zostanie osiągnięte przez `qa run
--qa-profile`, ten sam `qa-evidence.json` zawiera również podsumowanie
karty wyników profilu dla wybranych kategorii taksonomii.

Dane wyjściowe pokrycia należy traktować jako pomoc w odkrywaniu, a nie zamiennik bramki; wybrany
scenariusz nadal wymaga odpowiedniego trybu dostawcy, rzeczywistego transportu,
Multipass, Testbox lub ścieżki wydania dla testowanego zachowania. Kontekst
karty wyników opisano w dokumencie [Karta wyników dojrzałości](/pl/maturity/scorecard).

Aby sprawdzić charakter i styl, należy uruchomić ten sam scenariusz dla wielu rzeczywistych
referencji modeli i zapisać oceniony raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Polecenie uruchamia lokalne procesy potomne Gateway kontroli jakości, a nie Docker. Scenariusze
oceny charakteru powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe
interakcje użytkownika, takie jak czat, pomoc dotycząca obszaru roboczego i małe zadania na plikach. Model
kandydujący nie powinien być informowany, że jest oceniany. Polecenie zachowuje
każdą pełną transkrypcję, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w
trybie szybkim, z rozumowaniem `xhigh`, jeśli jest obsługiwane, o uszeregowanie uruchomień według
naturalności, atmosfery i humoru. Przy porównywaniu dostawców należy używać `--blind-judge-models`: monit oceniający nadal otrzymuje każdą transkrypcję i stan uruchomienia, ale
referencje kandydatów są zastępowane neutralnymi etykietami, takimi jak `candidate-01`; po
przetworzeniu raport mapuje rankingi z powrotem na rzeczywiste referencje.

Uruchomienia kandydatów domyślnie używają poziomu rozumowania `high`, z `medium` dla GPT-5.6 Luna i
`xhigh` dla starszych referencji ewaluacyjnych OpenAI, które go obsługują. Ustawienie konkretnego
kandydata można nadpisać bezpośrednio za pomocą `--model provider/model,thinking=<level>`; opcje
bezpośrednie obsługują również `fast`, `no-fast` i `fast=<bool>`. `--thinking
<level>` nadal ustawia globalną wartość zastępczą, a starsza forma `--model-thinking
<provider/model=level>` pozostaje ze względu na zgodność. Referencje kandydatów OpenAI
domyślnie używają trybu szybkiego, dzięki czemu przetwarzanie priorytetowe jest stosowane tam, gdzie dostawca
je obsługuje. Opcję `--fast` należy przekazać tylko wtedy, gdy tryb szybki ma zostać wymuszony dla
każdego modelu kandydującego. Czasy trwania uruchomień kandydatów i modeli oceniających są rejestrowane w
raporcie na potrzeby analizy porównawczej, ale monity oceniające wyraźnie zabraniają tworzenia rankingu
według szybkości. Uruchomienia modeli kandydujących i oceniających domyślnie mają współbieżność 16.
Wartość `--concurrency` lub `--judge-concurrency` należy zmniejszyć, gdy limity dostawcy lub lokalne
obciążenie Gateway powodują zbyt dużo zakłóceń w uruchomieniu.

Jeśli nie przekazano żadnego `--model` kandydata, ocena charakteru używa domyślnie
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` i `google/gemini-3.1-pro-preview`. Jeśli nie przekazano
`--judge-model`, modele oceniające domyślnie używają
`openai/gpt-5.6-sol,thinking=xhigh,fast` i
`anthropic/claude-opus-4-8,thinking=high`.

## Powiązana dokumentacja

- [Karta wyników dojrzałości](/pl/maturity/scorecard)
- [Pakiet testów porównawczych osobistego agenta](/pl/concepts/personal-agent-benchmark-pack)
- [Kanał kontroli jakości](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Panel sterowania](/pl/web/dashboard)
