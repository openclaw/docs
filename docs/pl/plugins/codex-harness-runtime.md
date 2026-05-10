---
read_when:
    - Potrzebujesz kontraktu wsparcia środowiska uruchomieniowego harnessa Codex
    - Debugujesz natywne narzędzia Codex, hooki, Compaction lub przesyłanie opinii
    - Zmieniasz zachowanie Pluginu w turach Pi i środowiska Codex
summary: Granice środowiska uruchomieniowego, hooki, narzędzia, uprawnienia i diagnostyka dla mechanizmu Codex
title: Środowisko wykonawcze mechanizmu Codex
x-i18n:
    generated_at: "2026-05-10T19:44:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Ta strona dokumentuje kontrakt uruchomieniowy dla tur harnessu Codex. Informacje o konfiguracji i routingu znajdziesz w sekcji [harness Codex](/pl/plugins/codex-harness). Pola konfiguracyjne opisano w sekcji [referencja harnessu Codex](/pl/plugins/codex-harness-reference).

## Omówienie

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex przejmuje większą część natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie pluginów, narzędzi, sesji i diagnostyki wokół tej granicy.

OpenClaw nadal odpowiada za routing kanałów, pliki sesji, dostarczanie widocznych wiadomości, narzędzia dynamiczne OpenClaw, zatwierdzenia, dostarczanie multimediów oraz lustrzaną kopię transkryptu. Codex odpowiada za kanoniczny natywny wątek, natywną pętlę modelu, natywną kontynuację narzędzi oraz natywną Compaction.

## Powiązania wątków i zmiany modelu

Gdy sesja OpenClaw jest dołączona do istniejącego wątku Codex, następna tura ponownie wysyła do app-server aktualnie wybrany model OpenAI, politykę zatwierdzania, piaskownicę i poziom usługi. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Widoczne odpowiedzi i heartbeaty

Gdy tura z czatu źródłowego przechodzi przez harness Codex, widoczne odpowiedzi domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało jawnie `messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex prywatnie; publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`. Ustaw `messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi w czacie bezpośrednim na starszej ścieżce automatycznego dostarczania.

Tury heartbeat Codex domyślnie otrzymują też `heartbeat_respond` w przeszukiwalnym katalogu narzędzi OpenClaw, dzięki czemu agent może zapisać, czy wybudzenie powinno pozostać ciche, czy wysłać powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Wskazówki dotyczące inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja deweloperska trybu współpracy Codex w samej turze heartbeat. Zwykłe tury czatu przywracają tryb domyślny Codex zamiast przenosić filozofię heartbeat w normalnym prompcie uruchomieniowym.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki pluginów OpenClaw               | OpenClaw                 | Zgodność produktu/pluginów między harnessami PI i Codex.            |
| Middleware rozszerzeń app-server Codex | Wbudowane pluginy OpenClaw | Zachowanie adaptera dla pojedynczej tury wokół narzędzi dynamicznych OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do routingu zachowania pluginów OpenClaw. Dla obsługiwanego pomostu narzędzi natywnych i uprawnień OpenClaw wstrzykuje konfigurację Codex na wątek dla `PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`.

Gdy zatwierdzenia app-server Codex są włączone, co oznacza, że `approvalPolicy` nie ma wartości `"never"`, domyślna wstrzyknięta konfiguracja natywnego hooka pomija `PermissionRequest`, aby recenzent app-server Codex i pomost zatwierdzeń OpenClaw obsługiwały rzeczywiste eskalacje po recenzji. Operatorzy mogą jawnie dodać `permission_request` do `nativeHookRelay.events`, gdy potrzebują przekaźnika zgodności.

Inne hooki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają mechanizmami sterowania na poziomie Codex. Nie są udostępniane jako hooki pluginów OpenClaw w kontrakcie v1.

W przypadku narzędzi dynamicznych OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o wywołanie, więc OpenClaw uruchamia zachowanie pluginu i middleware, za które odpowiada, w adapterze harnessu. W przypadku narzędzi natywnych Codex to Codex odpowiada za kanoniczny rekord narzędzia. OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex, chyba że Codex udostępni taką operację przez app-server albo wywołania zwrotne natywnych hooków.

Projekcje cyklu życia Compaction i LLM pochodzą z powiadomień app-server Codex oraz stanu adaptera OpenClaw, a nie z poleceń natywnych hooków Codex. Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i `llm_output` są obserwacjami na poziomie adaptera, a nie bajt po bajcie przechwyconymi wewnętrznymi żądaniami Codex ani ładunkami Compaction.

Natywne powiadomienia app-server Codex `hook/started` i `hook/completed` są projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania. Nie wywołują hooków pluginów OpenClaw.

## Kontrakt wsparcia v1

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Wsparcie                                                                         | Dlaczego                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                      | App-server Codex odpowiada za turę OpenAI, wznowienie natywnego wątku i natywną kontynuację narzędzi.                                                                                                     |
| Routing i dostarczanie kanałów OpenClaw       | Obsługiwane                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                            |
| Narzędzia dynamiczne OpenClaw                 | Obsługiwane                                                                      | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                             |
| Pluginy promptu i kontekstu                   | Obsługiwane                                                                      | OpenClaw buduje nakładki promptu i projektuje kontekst do tury Codex przed uruchomieniem albo wznowieniem wątku.                                                                                          |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                      | Składanie, ingest, utrzymanie po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                              |
| Hooki narzędzi dynamicznych                   | Obsługiwane                                                                      | `before_tool_call`, `after_tool_call` oraz middleware wyników narzędzi działają wokół narzędzi dynamicznych, których właścicielem jest OpenClaw.                                                          |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi ładunkami trybu Codex.                                                                       |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków                                    | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                        |
| Blokowanie lub obserwowanie natywnej powłoki, poprawek i MCP | Obsługiwane przez przekaźnik natywnych hooków                                    | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych powierzchni narzędzi natywnych, w tym ładunków MCP w app-server Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia app-server Codex i przekaźnik zgodności natywnych hooków | Żądania zatwierdzeń app-server Codex są routowane przez OpenClaw po recenzji Codex. Przekaźnik natywnego hooka `PermissionRequest` jest opcjonalny dla natywnych trybów zatwierdzania, ponieważ Codex emituje go przed recenzją strażnika. |
| Przechwytywanie trajektorii app-server        | Obsługiwane                                                                      | OpenClaw zapisuje żądanie wysłane do app-server oraz otrzymane powiadomienia app-server.                                                                                                                  |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                        | Granica v1                                                                                                                                      | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutacja argumentów narzędzi natywnych               | Natywne hooki przed użyciem narzędzia w Codex mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                  | Wymaga obsługi w hookach/schemacie Codex dla zastępczego wejścia narzędzia.               |
| Edytowalna historia natywnego transkryptu Codex     | Codex odpowiada za kanoniczną historię natywnego wątku. OpenClaw odpowiada za lustro i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych internali. | Dodać jawne API app-server Codex, jeśli potrzebna jest chirurgiczna zmiana natywnego wątku. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkryptu, których właścicielem jest OpenClaw, a nie rekordy narzędzi natywnych Codex.                           | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje początek i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                             |
| Interwencja w Compaction                            | Obecne hooki Compaction OpenClaw w trybie Codex mają poziom powiadomień.                                                                        | Dodać hooki Codex przed i po Compaction, jeśli pluginy muszą zawetować albo przepisać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia app-server, ale rdzeń Codex wewnętrznie buduje końcowe żądanie API OpenAI.                 | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Natywne uprawnienia i elicytacje MCP

Dla `PermissionRequest` OpenClaw zwraca tylko jawne decyzje zezwolenia albo odmowy, gdy polityka podejmuje decyzję. Wynik bez decyzji nie jest zezwoleniem. Codex traktuje go jako brak decyzji hooka i przechodzi do własnej ścieżki strażnika albo zatwierdzenia użytkownika.

Tryby zatwierdzania app-server Codex domyślnie pomijają ten natywny hook. To zachowanie ma zastosowanie, gdy `permission_request` jest jawnie uwzględnione w `nativeHookRelay.events` albo instaluje je środowisko uruchomieniowe zgodności.

Gdy operator wybierze `allow-always` dla natywnej prośby Codex o uprawnienie,
OpenClaw zapamiętuje dokładny odcisk provider/session/tool input/cwd dla
ograniczonego okna sesji. Zapamiętana decyzja celowo działa wyłącznie przy
dokładnym dopasowaniu: zmienione polecenie, argumenty, ładunek narzędzia lub cwd
tworzą nową zgodę.

Elicitacje zgody narzędzi Codex MCP są kierowane przez przepływ zgód Plugin
OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
oryginalnego czatu, a następna zakolejkowana wiadomość uzupełniająca odpowiada
na tę natywną prośbę serwera zamiast być kierowana jako dodatkowy kontekst. Inne
prośby elicitation MCP kończą się bezpiecznym niepowodzeniem.

## Sterowanie kolejką

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera
aplikacji Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
zakolejkowane wiadomości czatu przez skonfigurowane okno ciszy i wysyła je jako
jedną prośbę `turn/steer` w kolejności nadejścia. Starszy tryb `queue` wysyła
oddzielne prośby `turn/steer`.

Tury przeglądu Codex i ręcznej Compaction mogą odrzucić sterowanie w tej samej
turze. W takim przypadku OpenClaw używa kolejki wiadomości uzupełniających, gdy
wybrany tryb pozwala na mechanizm awaryjny. Zobacz [Kolejka sterowania](/pl/concepts/queue-steering).

## Przesyłanie opinii Codex

Gdy `/diagnostics [note]` zostanie zatwierdzone dla sesji używającej natywnego
harnessu Codex, OpenClaw wywołuje także `feedback/upload` serwera aplikacji
Codex dla odpowiednich wątków Codex. Przesyłanie prosi serwer aplikacji o
dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex,
gdy są dostępne.

Przesyłanie przechodzi przez normalną ścieżkę opinii Codex do serwerów OpenAI.
Jeśli opinie Codex są wyłączone w tym serwerze aplikacji, polecenie zwraca błąd
serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały, identyfikatory
sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia
`codex resume <thread-id>` dla wysłanych wątków.

Jeśli odmówisz zgody lub ją zignorujesz, OpenClaw nie wypisze tych identyfikatorów
Codex i nie wyśle opinii Codex. Przesyłanie nie zastępuje lokalnego eksportu
diagnostyki Gateway. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby
poznać zachowanie dotyczące zgody, prywatności, lokalnego pakietu i czatu grupowego.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie podłączonego wątku bez pełnego pakietu diagnostyki
Gateway.

## Compaction i lustrzana kopia transkrypcji

Gdy wybrany model używa harnessu Codex, natywna Compaction wątku jest delegowana
do serwera aplikacji Codex. OpenClaw utrzymuje lustrzaną kopię transkrypcji na
potrzeby historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego
przełączania modelu lub harnessu.

Lustrzana kopia obejmuje prompt użytkownika, końcowy tekst asystenta oraz
lekkie rekordy rozumowania lub planu Codex, gdy serwer aplikacji je emituje.
Obecnie OpenClaw zapisuje tylko sygnały rozpoczęcia i zakończenia natywnej
Compaction. Nie udostępnia jeszcze czytelnego dla człowieka podsumowania
Compaction ani audytowalnej listy wpisów, które Codex zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist`
obecnie nie przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie
tylko wtedy, gdy OpenClaw zapisuje wynik narzędzia w transkrypcji sesji należącej
do OpenClaw.

## Media i dostarczanie

OpenClaw nadal odpowiada za dostarczanie mediów i wybór providera mediów. Obrazy,
wideo, muzyka, PDF, TTS oraz rozumienie mediów używają pasujących ustawień
providera/modelu, takich jak `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` i `messages.tts`.

Tekst, obrazy, wideo, muzyka, TTS, zgody i wyjście narzędzia do wiadomości nadal
przechodzą przez normalną ścieżkę dostarczania OpenClaw. Generowanie mediów nie
wymaga PI. Gdy Codex emituje natywny element generowania obrazu z `savedPath`,
OpenClaw przekazuje dokładnie ten plik przez normalną ścieżkę reply-media, nawet
jeśli tura Codex nie ma tekstu asystenta.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Hooki Plugin](/pl/plugins/hooks)
- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Eksport trajektorii](/pl/tools/trajectory)
