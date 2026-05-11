---
read_when:
    - Potrzebujesz kontraktu wsparcia środowiska uruchomieniowego uprzęży Codex
    - Debugujesz natywne narzędzia Codex, hooki, Compaction albo przesyłanie opinii
    - Zmieniasz zachowanie Pluginu w turach PI i harnessa Codex
summary: Granice środowiska wykonawczego, hooki, narzędzia, uprawnienia i diagnostyka dla harnessa Codex
title: Środowisko uruchomieniowe mechanizmu Codex
x-i18n:
    generated_at: "2026-05-11T20:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Ta strona dokumentuje kontrakt środowiska uruchomieniowego dla tur harnessu Codex. Informacje o konfiguracji i
routingu znajdziesz w [harness Codex](/pl/plugins/codex-harness). Pola konfiguracji
opisuje [dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference).

## Omówienie

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex odpowiada za większą część
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie pluginów, narzędzi, sesji i
diagnostyki wokół tej granicy.

OpenClaw nadal odpowiada za routing kanałów, pliki sesji, dostarczanie widocznych wiadomości,
dynamiczne narzędzia OpenClaw, zatwierdzenia, dostarczanie multimediów oraz kopię transkrypcji.
Codex odpowiada za kanoniczny natywny wątek, natywną pętlę modelu, natywną kontynuację narzędzi
oraz natywną Compaction.

## Powiązania wątków i zmiany modelu

Gdy sesja OpenClaw jest dołączona do istniejącego wątku Codex, następna tura
ponownie wysyła do app-server aktualnie wybrany model OpenAI, politykę zatwierdzania, sandbox i warstwę usługi.
Przełączenie z `openai/gpt-5.5` na
`openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z
nowo wybranym modelem.

## Widoczne odpowiedzi i Heartbeat

Gdy tura czatu źródłowego przechodzi przez harness Codex, widoczne odpowiedzi domyślnie
używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało jawnie
`messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex prywatnie;
publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`. Ustaw
`messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi w czacie bezpośrednim na
starszej automatycznej ścieżce dostarczania.

Tury Codex Heartbeat domyślnie otrzymują też `heartbeat_respond` w przeszukiwalnym
katalogu narzędzi OpenClaw, dzięki czemu agent może zapisać, czy wybudzenie powinno pozostać
ciche, czy powiadomić, bez kodowania tego przepływu sterowania w tekście końcowym.

Wskazówki inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja deweloperska trybu współpracy Codex
w samej turze Heartbeat. Zwykłe tury czatu przywracają
tryb domyślny Codex zamiast przenosić filozofię Heartbeat w swoim normalnym
propmcie środowiska uruchomieniowego.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel              | Cel                                                                 |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Hooki pluginów OpenClaw               | OpenClaw                | Zgodność produktu/pluginów między harnessami PI i Codex.            |
| Middleware rozszerzeń app-server Codex | Pluginy dołączone do OpenClaw | Zachowanie adaptera w pojedynczej turze wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                   | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa plików projektowych ani globalnych Codex `hooks.json` do routingu
zachowania pluginów OpenClaw. Dla obsługiwanego mostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex dla pojedynczego wątku dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` oraz `Stop`.

Gdy zatwierdzenia app-server Codex są włączone, czyli `approvalPolicy` nie wynosi
`"never"`, domyślna wstrzykiwana konfiguracja natywnych hooków pomija `PermissionRequest`, aby
recenzent app-server Codex i most zatwierdzeń OpenClaw obsługiwały rzeczywiste
eskalacje po recenzji. Operatorzy mogą jawnie dodać `permission_request` do
`nativeHookRelay.events`, gdy potrzebują przekaźnika zgodności.

Inne hooki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają
kontrolkami na poziomie Codex. Nie są udostępniane jako hooki pluginów OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw, OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie pluginów i middleware, za które odpowiada w
adapterze harnessu. W przypadku narzędzi natywnych Codex, Codex jest właścicielem kanonicznego rekordu narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni taką operację przez app-server lub wywołania zwrotne natywnych hooków.

Powiadomienia elementów app-server Codex zapewniają też asynchroniczne obserwacje `after_tool_call`
dla ukończeń natywnych narzędzi, które nie są już objęte
natywnym przekaźnikiem `PostToolUse`. Te obserwacje służą wyłącznie telemetrii i zgodności
pluginów; nie mogą blokować, opóźniać ani modyfikować natywnego wywołania narzędzia.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień app-server Codex
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie dokładnymi co do bajtu przechwyceniami
wewnętrznych żądań Codex ani ładunków Compaction.

Natywne powiadomienia app-server Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków pluginów OpenClaw.

## Kontrakt obsługi V1

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Obsługa                                                                          | Dlaczego                                                                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                      | App-server Codex odpowiada za turę OpenAI, wznowienie natywnego wątku i kontynuację natywnych narzędzi.                                                                                                    |
| Routing i dostarczanie kanałów OpenClaw       | Obsługiwane                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                             |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                                                                      | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                              |
| Pluginy promptów i kontekstu                  | Obsługiwane                                                                      | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed uruchomieniem lub wznowieniem wątku.                                                                                           |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                      | Składanie, ingestia, konserwacja po turze i koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                                |
| Hooki narzędzi dynamicznych                   | Obsługiwane                                                                      | `before_tool_call`, `after_tool_call` oraz middleware wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.                                                                         |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzetelnymi ładunkami trybu Codex.                                                                        |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez natywny przekaźnik hooków                                      | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                         |
| Natywna powłoka, patch oraz blokowanie lub obserwowanie MCP | Obsługiwane przez natywny przekaźnik hooków                                      | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w app-server Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia app-server Codex i natywny przekaźnik hooków zgodności | Żądania zatwierdzenia app-server Codex są routowane przez OpenClaw po recenzji Codex. Natywny przekaźnik hooka `PermissionRequest` jest opcjonalny dla natywnych trybów zatwierdzania, ponieważ Codex emituje go przed recenzją guardian. |
| Przechwytywanie trajektorii app-server        | Obsługiwane                                                                      | OpenClaw zapisuje żądanie wysłane do app-server oraz otrzymywane powiadomienia app-server.                                                                                                                  |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                         | Granica V1                                                                                                                                     | Przyszła ścieżka                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Mutacja argumentów natywnych narzędzi               | Natywne hooki przed użyciem narzędzia w Codex mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                  | Wymaga obsługi hooków/schematu Codex dla zastępczych danych wejściowych narzędzia.       |
| Edytowalna historia transkrypcji natywnej Codex     | Codex jest właścicielem kanonicznej historii natywnego wątku. OpenClaw posiada kopię i może projektować przyszły kontekst, ale nie powinien modyfikować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API app-server Codex, jeśli potrzebna jest chirurgiczna edycja natywnego wątku. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkrypcji należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                       | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                              |
| Interwencja w Compaction                            | Obecne hooki Compaction OpenClaw są na poziomie powiadomień w trybie Codex.                                                                      | Dodać hooki Codex przed i po Compaction, jeśli pluginy muszą zawetować lub przepisać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia app-server, ale rdzeń Codex buduje końcowe żądanie API OpenAI wewnętrznie.                 | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                    |

## Natywne uprawnienia i elicytacje MCP

Dla `PermissionRequest` OpenClaw zwraca wyłącznie jawne decyzje zezwolenia lub odmowy,
gdy polityka podejmuje decyzję. Wynik bez decyzji nie jest zezwoleniem. Codex traktuje go jako brak
decyzji hooka i przechodzi do własnej ścieżki guardian lub zatwierdzania przez użytkownika.

Codex app-server domyślnie pomija ten natywny hook w trybach zatwierdzania. To zachowanie
ma zastosowanie, gdy `permission_request` jest jawnie uwzględnione w
`nativeHookRelay.events` lub gdy instaluje je środowisko uruchomieniowe zgodności.

Gdy operator wybierze `allow-always` dla natywnego żądania uprawnienia Codex,
OpenClaw zapamiętuje dokładny odcisk provider/session/tool input/cwd dla
ograniczonego okna sesji. Zapamiętana decyzja jest celowo dopasowywana
wyłącznie dokładnie: zmienione polecenie, argumenty, ładunek narzędzia lub cwd
tworzą nowe zatwierdzenie.

Wywołania zatwierdzania narzędzi Codex MCP są kierowane przez przepływ
zatwierdzania Plugin OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Monity Codex `request_user_input` są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na
to natywne żądanie serwera, zamiast być kierowana jako dodatkowy kontekst. Inne
żądania wywołania MCP kończą się odmową.

## Kierowanie kolejką

Kierowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` Codex app-server. Przy
domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu
dla skonfigurowanego okna ciszy i wysyła je jako jedno żądanie `turn/steer` w
kolejności nadejścia. Starszy tryb `queue` wysyła osobne żądania `turn/steer`.

Tury przeglądu Codex i ręcznej Compaction mogą odrzucać kierowanie w tej samej turze. W takim
przypadku OpenClaw używa kolejki uzupełniającej, gdy wybrany tryb zezwala na tryb awaryjny.
Zobacz [Kolejka kierowania](/pl/concepts/queue-steering).

## Przesyłanie opinii Codex

Gdy `/diagnostics [note]` zostanie zatwierdzone dla sesji używającej natywnego harness Codex,
OpenClaw wywołuje również `feedback/upload` Codex app-server dla odpowiednich
wątków Codex. Przesyłanie prosi app-server o dołączenie logów dla każdego
wymienionego wątku oraz utworzonych podwątków Codex, gdy są dostępne.

Przesyłanie odbywa się normalną ścieżką opinii Codex do serwerów OpenAI. Jeśli
opinie Codex są wyłączone w tym app-server, polecenie zwraca błąd app-server.
Ukończona odpowiedź diagnostyczna wymienia kanały, identyfikatory sesji OpenClaw,
identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>` dla wątków,
które zostały wysłane.

Jeśli odrzucisz lub zignorujesz zatwierdzenie, OpenClaw nie wypisze tych identyfikatorów Codex i
nie wyśle opinii Codex. Przesyłanie nie zastępuje lokalnego eksportu diagnostyki Gateway.
Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać zachowanie dotyczące
zatwierdzania, prywatności, lokalnego pakietu i czatu grupowego.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla obecnie dołączonego wątku bez pełnego pakietu diagnostyki Gateway.

## Compaction i lustrzana kopia transkryptu

Gdy wybrany model używa harness Codex, natywna Compaction wątku jest
delegowana do Codex app-server. OpenClaw utrzymuje lustrzaną kopię transkryptu dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłej zmiany modelu lub harness.

Lustrzana kopia obejmuje monit użytkownika, końcowy tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy app-server je emituje. Obecnie OpenClaw rejestruje tylko
sygnały rozpoczęcia i ukończenia natywnej Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów, które Codex
zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` obecnie nie
przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia w transkrypcie sesji należącej do OpenClaw.

## Multimedia i dostarczanie

OpenClaw nadal odpowiada za dostarczanie multimediów oraz wybór providera multimediów. Obrazy,
wideo, muzyka, PDF, TTS i rozumienie multimediów używają pasujących ustawień provider/model,
takich jak `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` i `messages.tts`.

Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe narzędzi wiadomości nadal
przechodzą normalną ścieżką dostarczania OpenClaw. Generowanie multimediów nie wymaga PI.
Gdy Codex emituje natywny element generowania obrazu z `savedPath`, OpenClaw
przekazuje dokładnie ten plik normalną ścieżką multimediów odpowiedzi, nawet jeśli tura Codex
nie ma tekstu asystenta.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harness Codex](/pl/plugins/codex-harness-reference)
- [Natywne Plugin Codex](/pl/plugins/codex-native-plugins)
- [Hooki Plugin](/pl/plugins/hooks)
- [Plugin harness agenta](/pl/plugins/sdk-agent-harness)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Eksport trajektorii](/pl/tools/trajectory)
