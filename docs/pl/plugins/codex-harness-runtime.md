---
read_when:
    - Potrzebujesz kontraktu obsługi środowiska uruchomieniowego harness Codex
    - Debugujesz natywne narzędzia Codex, hooki, Compaction lub przesyłanie opinii
    - Zmieniasz zachowanie pluginów w turach uprzęży OpenClaw i Codex
summary: Granice środowiska uruchomieniowego, haki, narzędzia, uprawnienia i diagnostyka dla uprzęży Codex
title: Środowisko uruchomieniowe aparatu Codex
x-i18n:
    generated_at: "2026-07-04T20:45:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Ta strona dokumentuje kontrakt runtime dla tur harness Codex. W kwestii konfiguracji i
routingu zacznij od [harness Codex](/pl/plugins/codex-harness). Pola konfiguracji
opisuje [referencja harness Codex](/pl/plugins/codex-harness-reference).

## Omówienie

Tryb Codex nie jest OpenClaw z innym wywołaniem modelu pod spodem. Codex posiada większą część
natywnej pętli modelu, a OpenClaw dostosowuje wokół tej granicy swoje powierzchnie Plugin,
narzędzi, sesji i diagnostyki.

OpenClaw nadal posiada routing kanałów, pliki sesji, dostarczanie widocznych wiadomości,
dynamiczne narzędzia OpenClaw, zatwierdzenia, dostarczanie mediów oraz lustrzaną kopię transkryptu.
Codex posiada kanoniczny natywny wątek, natywną pętlę modelu, natywną kontynuację narzędzi
i natywną Compaction.

Routing promptów podąża za wybranym runtime, a nie tylko za ciągiem dostawcy. Natywna
tura Codex otrzymuje instrukcje deweloperskie app-server Codex, podczas gdy
jawna trasa zgodności OpenClaw zachowuje normalny prompt systemowy OpenClaw nawet
wtedy, gdy używa uwierzytelniania lub transportu OpenAI w stylu Codex.

Natywny Codex zachowuje należące do Codex instrukcje bazowe/modelu oraz zachowanie
dokumentów projektu zgodnie z aktywną konfiguracją wątku Codex. OpenClaw rozpoczyna i wznawia natywne
wątki Codex z wyłączoną wbudowaną osobowością Codex, tak aby pliki
osobowości obszaru roboczego i tożsamość agenta OpenClaw pozostały autorytatywne. Lekkie
uruchomienia OpenClaw nadal zachowują swoje istniejące wyciszenie dokumentów projektu. Instrukcje
deweloperskie OpenClaw obejmują kwestie runtime OpenClaw, takie jak dostarczanie
do kanału źródłowego, dynamiczne narzędzia OpenClaw, delegowanie ACP, kontekst adaptera oraz
aktywne pliki profilu obszaru roboczego agenta. Katalogi Skills OpenClaw i kierowane przez narzędzia
wskaźniki `MEMORY.md` są projektowane jako ograniczone do tury instrukcje deweloperskie
współpracy dla natywnego Codex. Aktywna zawartość `BOOTSTRAP.md` i pełne
awaryjne wstrzyknięcie `MEMORY.md` nadal używają kontekstu referencyjnego wejścia tury.

## Powiązania wątków i zmiany modelu

Gdy sesja OpenClaw jest dołączona do istniejącego wątku Codex, następna tura
ponownie wysyła do app-server aktualnie wybrany model OpenAI, politykę zatwierdzeń, sandbox i warstwę usługi.
Przełączenie z `openai/gpt-5.5` na
`openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z
nowo wybranym modelem.

## Widoczne odpowiedzi i Heartbeat

Gdy bezpośrednia/źródłowa tura czatu działa przez harness Codex, widoczne odpowiedzi
domyślnie używają automatycznego dostarczania końcowej odpowiedzi asystenta dla wewnętrznych powierzchni WebChat.
Utrzymuje to zgodność Codex z kontraktem promptu harness Pi: agenci odpowiadają
normalnie, a OpenClaw publikuje końcowy tekst w rozmowie źródłowej. Ustaw
`messages.visibleReplies: "message_tool"`, gdy bezpośredni/źródłowy czat powinien
celowo utrzymywać końcowy tekst asystenta jako prywatny, chyba że agent wywoła
`message(action="send")`.

Tury Heartbeat Codex domyślnie otrzymują także `heartbeat_respond` w przeszukiwalnym
katalogu narzędzi OpenClaw, aby agent mógł zapisać, czy wybudzenie powinno pozostać
ciche, czy wysłać powiadomienie, bez kodowania tego przepływu sterowania w końcowym tekście.

Wskazówki inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja deweloperska
trybu współpracy Codex w samej turze Heartbeat. Zwykłe tury czatu przywracają
tryb Default Codex zamiast przenosić filozofię Heartbeat w swoim normalnym
prompcie runtime. Gdy istnieje niepusty `HEARTBEAT.md`, instrukcje
trybu współpracy Heartbeat wskazują Codex ten plik zamiast wstawiać jego
zawartość bezpośrednio.

## Granice haków

Harness Codex ma trzy warstwy haków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Haki Plugin OpenClaw                  | OpenClaw                 | Zgodność produktu/Plugin między harnessami OpenClaw i Codex.        |
| Middleware rozszerzeń app-server Codex | Dołączone Pluginy OpenClaw | Zachowanie adaptera dla każdej tury wokół dynamicznych narzędzi OpenClaw. |
| Natywne haki Codex                    | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do routingu
zachowania Plugin OpenClaw. Dla obsługiwanego natywnego mostu narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex dla każdego wątku dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`.

Gdy zatwierdzenia app-server Codex są włączone, czyli `approvalPolicy` nie jest
`"never"`, domyślnie wstrzyknięta konfiguracja natywnych haków pomija `PermissionRequest`, aby
recenzent app-server Codex i most zatwierdzeń OpenClaw obsługiwały rzeczywiste
eskalacje po recenzji. Operatorzy mogą jawnie dodać `permission_request` do
`nativeHookRelay.events`, gdy potrzebują przekaźnika zgodności.

Inne haki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają
kontrolami na poziomie Codex. Nie są eksponowane jako haki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw, OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware, które posiada w
adapterze harness. W przypadku narzędzi natywnych dla Codex, Codex posiada kanoniczny rekord narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni tę operację przez app-server lub wywołania zwrotne natywnych haków.

Zdarzenia `PreToolUse` app-server Codex w trybie raportu odraczają żądania zatwierdzenia Plugin
do pasującego zatwierdzenia app-server. Jeśli hak OpenClaw `before_tool_call`
zwraca `requireApproval`, gdy natywny payload ustawia tryb zatwierdzenia raportu
(`openclaw_approval_mode` ma wartość `"report"`), przekaźnik natywnego haka zapisuje
wymaganie zatwierdzenia Plugin i nie zwraca natywnej decyzji. Gdy Codex wysyła
żądanie zatwierdzenia app-server dla tego samego użycia narzędzia, OpenClaw otwiera prompt
zatwierdzenia Plugin i mapuje decyzję z powrotem do Codex. Zdarzenia Codex `PermissionRequest`
są osobną ścieżką zatwierdzeń i nadal mogą być routowane przez zatwierdzenia OpenClaw,
gdy runtime jest skonfigurowany dla tego mostu.

Powiadomienia o elementach app-server Codex zapewniają także asynchroniczne obserwacje
`after_tool_call` dla ukończeń narzędzi natywnych, które nie są już objęte
natywnym przekaźnikiem `PostToolUse`. Te obserwacje służą wyłącznie telemetrii i zgodności
Plugin; nie mogą blokować, opóźniać ani modyfikować natywnego wywołania narzędzia.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień app-server Codex
oraz stanu adaptera OpenClaw, a nie z poleceń natywnych haków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie przechwyceniami bajt po bajcie
wewnętrznego żądania Codex lub payloadów Compaction.

Powiadomienia app-server Codex natywnych `hook/started` i `hook/completed`
są projektowane jako zdarzenia agenta `codex_app_server.hook` dla trajektorii i debugowania.
Nie wywołują haków Plugin OpenClaw.

## Kontrakt obsługi v1

Obsługiwane w runtime Codex v1:

| Obszar                                        | Obsługa                                                                          | Dlaczego                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                      | Serwer aplikacji Codex odpowiada za turę OpenAI, natywne wznawianie wątku i natywną kontynuację narzędzi.                                                                                                                                                                                                                                                                                                                                                                          |
| Routing i dostarczanie kanałów OpenClaw       | Obsługiwane                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                                                                                                                                                                                                                                                                                                     |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                                                                      | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonywania.                                                                                                                                                                                                                                                                                                                                                                                     |
| Pluginy promptów i kontekstu                  | Obsługiwane                                                                      | OpenClaw projektuje prompt/kontekst specyficzny dla OpenClaw do tury Codex, pozostawiając bazowe, modelowe i skonfigurowane prompty dokumentacji projektu należące do Codex w natywnej ścieżce Codex. OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków, aby pliki osobowości obszaru roboczego agenta pozostały nadrzędne. Natywne instrukcje deweloperskie Codex akceptują tylko wskazówki poleceń jawnie ograniczone do `codex_app_server`; starsze globalne podpowiedzi poleceń pozostają dla powierzchni promptów innych niż Codex. |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                      | Składanie, pobieranie i konserwacja po turze działają wokół tur Codex. Silniki kontekstu nie zastępują natywnego Compaction Codex.                                                                                                                                                                                                                                                                                                                                                  |
| Hooki narzędzi dynamicznych                   | Obsługiwane                                                                      | Middleware `before_tool_call`, `after_tool_call` i wyników narzędzi działa wokół dynamicznych narzędzi należących do OpenClaw.                                                                                                                                                                                                                                                                                                                                                      |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzetelnymi ładunkami trybu Codex.                                                                                                                                                                                                                                                                                                                                                 |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez natywny przekaźnik hooków                                      | Codex `Stop` jest przekazywane do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                                                                                                                                                                                                                                                                                                  |
| Natywna powłoka, łatka oraz blokada lub obserwacja MCP | Obsługiwane przez natywny przekaźnik hooków                                      | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie jest.                                                                                                                                                                                                                                           |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia serwera aplikacji Codex i zgodnościowy natywny przekaźnik hooków | Żądania zatwierdzeń serwera aplikacji Codex są kierowane przez OpenClaw po przeglądzie Codex. Natywny przekaźnik hooka `PermissionRequest` jest opcjonalny dla natywnych trybów zatwierdzania, ponieważ Codex emituje go przed przeglądem strażnika.                                                                                                                                                                                                                                |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                                                                      | OpenClaw zapisuje żądanie wysłane do serwera aplikacji oraz otrzymywane od niego powiadomienia.                                                                                                                                                                                                                                                                                                                                                                                     |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Obszar                                              | Granica V1                                                                                                                                      | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutacja argumentów natywnego narzędzia              | Natywne hooki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów natywnych narzędzi Codex.                    | Wymaga obsługi hooka/schematu Codex dla zastępczych danych wejściowych narzędzia.         |
| Edytowalna natywna historia transkryptu Codex       | Codex jest właścicielem kanonicznej natywnej historii wątku. OpenClaw ma kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API serwera aplikacji Codex, jeśli potrzebna jest operacja na natywnym wątku. |
| `tool_result_persist` dla natywnych rekordów narzędzi Codex | Ten hook przekształca zapisy transkryptu należące do OpenClaw, a nie natywne rekordy narzędzi Codex.                                           | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw może zażądać natywnego Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów, podsumowania ukończenia ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                               |
| Interwencja w Compaction                            | OpenClaw nie pozwala pluginom ani silnikom kontekstu wetować, przepisywać ani zastępować natywnego Compaction Codex.                           | Dodać hooki Codex przed/po Compaction, jeśli pluginy muszą wetować lub przepisywać natywne Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex buduje końcowe żądanie API OpenAI wewnętrznie.          | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Natywne uprawnienia i elicytacje MCP

Dla `PermissionRequest` OpenClaw zwraca tylko jawne decyzje zezwolenia lub odmowy,
gdy zdecyduje polityka. Wynik bez decyzji nie jest zezwoleniem. Codex traktuje go
jako brak decyzji hooka i przechodzi do własnej ścieżki strażnika albo zatwierdzenia
użytkownika.

Tryby zatwierdzania serwera aplikacji Codex domyślnie pomijają ten natywny hook.
To zachowanie ma zastosowanie, gdy `permission_request` jest jawnie uwzględnione w
`nativeHookRelay.events` albo instaluje je zgodnościowe środowisko uruchomieniowe.

Gdy operator wybiera `allow-always` dla natywnego żądania uprawnień Codex,
OpenClaw zapamiętuje dokładny odcisk provider/sesja/dane wejściowe narzędzia/cwd
dla ograniczonego okna sesji. Zapamiętana decyzja jest celowo oparta wyłącznie na
dokładnym dopasowaniu: zmienione polecenie, argumenty, ładunek narzędzia albo cwd
tworzą nowe zatwierdzenie.

Elicytacje zatwierdzania narzędzi MCP Codex są kierowane przez przepływ zatwierdzania
pluginów OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do czatu
źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to
natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne żądania
elicytacji MCP kończą się bezpiecznym niepowodzeniem.

Ogólny przepływ zatwierdzania pluginów, który przenosi te prompty, opisano w
[Żądaniach uprawnień pluginu](/pl/plugins/plugin-permission-requests).

## Sterowanie kolejką

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera
aplikacji Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
wiadomości czatu w trybie sterowania przez skonfigurowane okno ciszy i wysyła je
jako jedno żądanie `turn/steer` w kolejności przyjścia.

Tury przeglądu Codex i ręcznej Compaction mogą odrzucić sterowanie w tej samej
turze. W takim przypadku OpenClaw czeka na zakończenie aktywnego uruchomienia,
zanim rozpocznie prompt. Użyj `/queue followup` lub `/queue collect`, gdy
wiadomości powinny domyślnie trafiać do kolejki zamiast sterować. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

## Przesyłanie opinii Codex

Gdy `/diagnostics [note]` zostanie zatwierdzone dla sesji używającej natywnej
uprzęży Codex, OpenClaw wywołuje także `feedback/upload` app-server Codex dla
odpowiednich wątków Codex. Przesyłanie prosi app-server o dołączenie logów dla
każdego wymienionego wątku oraz utworzonych podwątków Codex, gdy są dostępne.

Przesyłanie przechodzi przez zwykłą ścieżkę opinii Codex do serwerów OpenAI.
Jeśli opinie Codex są wyłączone w tym app-server, polecenie zwraca błąd
app-server. Ukończona odpowiedź diagnostyczna zawiera listę kanałów,
identyfikatorów sesji OpenClaw, identyfikatorów wątków Codex oraz lokalnych
poleceń `codex resume <thread-id>` dla wysłanych wątków.

Jeśli odmówisz zatwierdzenia lub je zignorujesz, OpenClaw nie wypisze tych
identyfikatorów Codex i nie wyśle opinii Codex. Przesyłanie nie zastępuje
lokalnego eksportu diagnostycznego Gateway. Zobacz
[Eksport diagnostyczny](/pl/gateway/diagnostics), aby poznać zachowanie dotyczące
zatwierdzania, prywatności, lokalnego pakietu i czatu grupowego.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
Gateway.

## Compaction i kopia transkryptu

Gdy wybrany model używa uprzęży Codex, natywna Compaction wątku należy do
app-server Codex. OpenClaw nie uruchamia wstępnej Compaction dla tur Codex, nie
zastępuje Compaction Codex przez Compaction silnika kontekstu i nie wraca do
podsumowywania OpenClaw ani publicznego podsumowywania OpenAI, gdy natywnej
Compaction Codex nie można uruchomić. OpenClaw utrzymuje kopię transkryptu na
potrzeby historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego
przełączania modelu lub uprzęży.

Jawne żądania Compaction, takie jak `/compact` albo ręczna operacja Compaction
żądana przez plugin, uruchamiają natywną Compaction Codex za pomocą
`thread/compact/start`. OpenClaw utrzymuje żądanie i dzierżawę współdzielonego
klienta otwarte, dopóki Codex nie wyemituje pasującego elementu ukończenia
`contextCompaction`, a następnie zgłasza turę Compaction jako ukończoną. Jeśli
ta terminalna tura przekroczy skonfigurowany limit czasu Compaction, OpenClaw
żąda natywnego przerwania tury. Dzierżawa i ogrodzenie Compaction dla wątku
pozostają utrzymywane, dopóki Codex nie zgłosi stanu terminalnego albo nie
potwierdzi RPC przerwania. Jeśli Codex nie potwierdzi w okresie karencji
przerwania, OpenClaw wycofuje połączenie przed zwolnieniem ogrodzenia.
Połączenia zdalne odłączają także pasujące powiązanie wątku, aby późniejsza
praca nie mogła nakładać się z niepotwierdzoną turą zdalną. Inne tury na
wycofanym połączeniu kończą się niepowodzeniem i mogą zostać ponowione na
świeżym kliencie. Zamknięcie klienta, anulowanie żądania albo nieudana tura
Compaction zwraca nieudaną operację.

Gdy silnik kontekstu żąda projekcji rozruchowej wątku Codex, OpenClaw projektuje
nazwy i identyfikatory wywołań narzędzi, kształty wejścia oraz zredagowaną
zawartość wyników narzędzi do świeżego wątku Codex. Nie kopiuje surowych
wartości argumentów wywołań narzędzi do tej projekcji.

Kopia zawiera prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy app-server je emituje. OpenClaw zapisuje
rozpoczęcie natywnej Compaction i status terminalny, ale nie ujawnia czytelnego
dla człowieka podsumowania Compaction ani możliwej do audytu listy wpisów, które
Codex zachował po Compaction.

Ponieważ Codex posiada kanoniczny natywny wątek, `tool_result_persist` obecnie
nie przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko
wtedy, gdy OpenClaw zapisuje wynik narzędzia w transkrypcie sesji należącej do
OpenClaw.

## Media i dostarczanie

OpenClaw nadal odpowiada za dostarczanie multimediów i wybór dostawcy
multimediów. Obrazy, wideo, muzyka, PDF, TTS i rozumienie multimediów używają
pasujących ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe narzędzi
wiadomości nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.
Generowanie multimediów nie wymaga starszego środowiska uruchomieniowego. Gdy
Codex emituje natywny element generowania obrazu z `savedPath`, OpenClaw
przekazuje dokładnie ten plik przez zwykłą ścieżkę multimediów odpowiedzi, nawet
jeśli tura Codex nie ma tekstu asystenta.

## Powiązane

- [Uprząż Codex](/pl/plugins/codex-harness)
- [Dokumentacja uprzęży Codex](/pl/plugins/codex-harness-reference)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Hooki pluginów](/pl/plugins/hooks)
- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
- [Eksport diagnostyczny](/pl/gateway/diagnostics)
- [Eksport trajektorii](/pl/tools/trajectory)
