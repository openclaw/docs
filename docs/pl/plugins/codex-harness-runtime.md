---
read_when:
    - Potrzebujesz kontraktu wsparcia środowiska uruchomieniowego harnessu Codex
    - Debugujesz natywne narzędzia Codex, hooki, Compaction lub przesyłanie opinii
    - Zmieniasz zachowanie pluginu w przebiegach harnessu OpenClaw i Codex
summary: Granice środowiska uruchomieniowego, hooki, narzędzia, uprawnienia i diagnostyka dla harnessu Codex
title: Środowisko uruchomieniowe mechanizmu Codex
x-i18n:
    generated_at: "2026-06-27T17:51:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Ta strona dokumentuje kontrakt runtime'u dla tur harnessu Codex. Konfigurację i
routing zacznij od [harnessu Codex](/pl/plugins/codex-harness). Pola konfiguracji
opisuje [dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference).

## Omówienie

Tryb Codex nie jest OpenClaw z innym wywołaniem modelu pod spodem. Codex posiada większą część
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin, narzędzi, sesji i
diagnostyki wokół tej granicy.

OpenClaw nadal posiada routing kanałów, pliki sesji, dostarczanie widocznych wiadomości,
narzędzia dynamiczne OpenClaw, zatwierdzenia, dostarczanie multimediów i lustrzaną kopię transkrypcji.
Codex posiada kanoniczny natywny wątek, natywną pętlę modelu, natywną kontynuację narzędzi
oraz natywną Compaction.

Routing promptów podąża za wybranym runtime'em, a nie tylko za ciągiem dostawcy. Natywna
tura Codex otrzymuje instrukcje deweloperskie serwera aplikacji Codex, natomiast
jawna trasa zgodności OpenClaw zachowuje normalny prompt systemowy OpenClaw nawet
wtedy, gdy używa autoryzacji lub transportu OpenAI w stylu Codex.

Natywny Codex zachowuje należące do Codex instrukcje bazowe/modelu i zachowanie
dokumentów projektu zgodnie z aktywną konfiguracją wątku Codex. OpenClaw uruchamia i wznawia natywne
wątki Codex z wyłączoną wbudowaną osobowością Codex, aby pliki osobowości
workspace'u i tożsamość agenta OpenClaw pozostały autorytatywne. Lekkie
uruchomienia OpenClaw nadal zachowują istniejące wyciszanie dokumentów projektu. Instrukcje
deweloperskie OpenClaw obejmują kwestie runtime'u OpenClaw, takie jak dostarczanie do kanału
źródłowego, narzędzia dynamiczne OpenClaw, delegowanie ACP, kontekst adaptera oraz
pliki profilu aktywnego workspace'u agenta. Katalogi Skills OpenClaw i routowane przez narzędzia
wskaźniki `MEMORY.md` są rzutowane jako instrukcje deweloperskie współpracy o zakresie tury
dla natywnego Codex. Aktywna zawartość `BOOTSTRAP.md` i pełne
wstrzykiwanie awaryjne `MEMORY.md` nadal używają kontekstu referencyjnego wejścia tury.

## Powiązania wątków i zmiany modelu

Gdy sesja OpenClaw jest dołączona do istniejącego wątku Codex, następna tura
ponownie wysyła do serwera aplikacji aktualnie wybrany model OpenAI, politykę zatwierdzania, sandbox i warstwę usługi. Przełączenie z `openai/gpt-5.5` na
`openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z
nowo wybranym modelem.

## Widoczne odpowiedzi i Heartbeat

Gdy bezpośrednia/źródłowa tura czatu działa przez harness Codex, widoczne odpowiedzi
domyślnie są automatycznie dostarczane jako końcowa odpowiedź asystenta dla wewnętrznych powierzchni WebChat.
Utrzymuje to Codex w zgodności z kontraktem promptu harnessu Pi: agenci odpowiadają
normalnie, a OpenClaw publikuje końcowy tekst w rozmowie źródłowej. Ustaw
`messages.visibleReplies: "message_tool"`, gdy bezpośredni/źródłowy czat powinien
celowo zachować końcowy tekst asystenta jako prywatny, chyba że agent wywoła
`message(action="send")`.

Tury Codex Heartbeat domyślnie otrzymują także `heartbeat_respond` w przeszukiwalnym katalogu
narzędzi OpenClaw, aby agent mógł zapisać, czy wybudzenie ma pozostać
ciche, czy wysłać powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Wytyczne inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja deweloperska
trybu współpracy Codex w samej turze Heartbeat. Zwykłe tury czatu przywracają
tryb Codex Default zamiast przenosić filozofię Heartbeat w swoim normalnym
prompcie runtime'u. Gdy istnieje niepusty `HEARTBEAT.md`, instrukcje
trybu współpracy Heartbeat wskazują Codex ten plik zamiast wklejać jego
zawartość.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin między harnessami OpenClaw i Codex.        |
| Middleware rozszerzeń serwera aplikacji Codex | Dołączone Pluginy OpenClaw | Zachowanie adaptera dla każdej tury wokół narzędzi dynamicznych OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do routingu
zachowania Plugin OpenClaw. Dla obsługiwanego pomostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex dla każdego wątku dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`.

Gdy zatwierdzenia serwera aplikacji Codex są włączone, co oznacza, że `approvalPolicy` nie jest
`"never"`, domyślna wstrzyknięta konfiguracja natywnych hooków pomija `PermissionRequest`, aby
recenzent serwera aplikacji Codex i pomost zatwierdzania OpenClaw obsługiwały rzeczywiste
eskalacje po recenzji. Operatorzy mogą jawnie dodać `permission_request` do
`nativeHookRelay.events`, gdy potrzebują przekaźnika zgodności.

Inne hooki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają
kontrolkami poziomu Codex. Nie są eksponowane jako hooki Plugin OpenClaw w kontrakcie v1.

W przypadku narzędzi dynamicznych OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia należące do niego zachowanie Plugin i middleware w
adapterze harnessu. W przypadku narzędzi natywnych Codex Codex posiada kanoniczny rekord narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępnia taką operację przez serwer aplikacji lub natywne wywołania zwrotne hooków.

Zdarzenia `PreToolUse` trybu raportowania serwera aplikacji Codex odraczają żądania zatwierdzenia Plugin
do pasującego zatwierdzenia serwera aplikacji. Jeśli hook OpenClaw `before_tool_call`
zwraca `requireApproval`, gdy natywny ładunek ustawia tryb zatwierdzania raportu
(`openclaw_approval_mode` ma wartość `"report"`), przekaźnik natywnych hooków zapisuje
wymaganie zatwierdzenia Plugin i nie zwraca natywnej decyzji. Gdy Codex wysyła
żądanie zatwierdzenia serwera aplikacji dla tego samego użycia narzędzia, OpenClaw otwiera prompt
zatwierdzenia Plugin i mapuje decyzję z powrotem do Codex. Zdarzenia Codex `PermissionRequest`
są osobną ścieżką zatwierdzania i nadal mogą przechodzić przez zatwierdzenia OpenClaw,
gdy runtime jest skonfigurowany dla tego pomostu.

Powiadomienia elementów serwera aplikacji Codex dostarczają także asynchroniczne obserwacje `after_tool_call`
dla ukończeń natywnych narzędzi, które nie są już objęte
natywnym przekaźnikiem `PostToolUse`. Te obserwacje służą wyłącznie telemetrii i zgodności Plugin;
nie mogą blokować, opóźniać ani mutować natywnego wywołania narzędzia.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień serwera aplikacji Codex
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie dokładnymi co do bajtu przechwyceniami
wewnętrznego żądania Codex lub ładunków Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są
rzutowane jako zdarzenia agenta `codex_app_server.hook` dla trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt obsługi v1

Obsługiwane w runtime Codex v1:

| Obszar                                        | Obsługa                                                                          | Dlaczego                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                      | App-server Codex obsługuje turę OpenAI, natywne wznowienie wątku i kontynuację natywnych narzędzi.                                                                                                                                                                                                                                                                                                                                                                                  |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem wykonawczym modelu.                                                                                                                                                                                                                                                                                                                                                                          |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                                                                      | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.                                                                                                                                                                                                                                                                                                                                                                                        |
| Pluginy promptów i kontekstu                  | Obsługiwane                                                                      | OpenClaw projektuje prompt/kontekst specyficzny dla OpenClaw do tury Codex, pozostawiając bazowe prompty, model i skonfigurowane prompty dokumentacji projektu, które należą do Codex, w natywnej ścieżce Codex. OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków, aby pliki osobowości obszaru roboczego agenta pozostały autorytatywne. Natywne instrukcje deweloperskie Codex akceptują tylko wskazówki poleceń jawnie ograniczone do `codex_app_server`; starsze globalne wskazówki poleceń pozostają dla powierzchni promptów innych niż Codex. |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                      | Składanie, ingestia i konserwacja po turze działają wokół tur Codex. Silniki kontekstu nie zastępują natywnej Compaction Codex.                                                                                                                                                                                                                                                                                                                                                     |
| Hooki narzędzi dynamicznych                   | Obsługiwane                                                                      | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.                                                                                                                                                                                                                                                                                                                                                    |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzeczywistymi ładunkami trybu Codex.                                                                                                                                                                                                                                                                                                                                              |
| Brama rewizji odpowiedzi końcowej             | Obsługiwane przez natywny przekaźnik hooków                                      | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                                                                                                                                                                                                                                                                                                  |
| Natywne blokowanie lub obserwacja shell, patch i MCP | Obsługiwane przez natywny przekaźnik hooków                                      | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w app-server Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie jest.                                                                                                                                                                                                                                                   |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia app-server Codex i zgodnościowy natywny przekaźnik hooków | Żądania zatwierdzenia app-server Codex są trasowane przez OpenClaw po przeglądzie Codex. Natywny przekaźnik hooka `PermissionRequest` jest opcjonalny dla natywnych trybów zatwierdzania, ponieważ Codex emituje go przed przeglądem guardiana.                                                                                                                                                                                                                                     |
| Przechwytywanie trajektorii app-server        | Obsługiwane                                                                      | OpenClaw rejestruje żądanie wysłane do app-server oraz otrzymywane powiadomienia app-server.                                                                                                                                                                                                                                                                                                                                                                                        |

Nieobsługiwane w środowisku wykonawczym Codex v1:

| Obszar                                              | Granica V1                                                                                                                                      | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutacja argumentów narzędzi natywnych               | Natywne hooki przed użyciem narzędzia w Codex mogą blokować, ale OpenClaw nie przepisuje argumentów natywnych narzędzi Codex.                  | Wymaga obsługi hooka/schematu Codex dla zastępczych danych wejściowych narzędzia.         |
| Edytowalna natywna historia transkrypcji Codex      | Codex posiada kanoniczną historię natywnego wątku. OpenClaw posiada kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych mechanizmów wewnętrznych. | Dodać jawne API app-server Codex, jeśli potrzebna jest chirurgia natywnego wątku.         |
| `tool_result_persist` dla natywnych rekordów narzędzi Codex | Ten hook przekształca zapisy transkrypcji należące do OpenClaw, a nie natywne rekordy narzędzi Codex.                                          | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate metadane natywnej Compaction                | OpenClaw może zażądać natywnej Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów, podsumowania ukończenia ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                               |
| Interwencja w Compaction                            | OpenClaw nie pozwala pluginom ani silnikom kontekstu wetować, przepisywać ani zastępować natywnej Compaction Codex.                           | Dodać hooki przed/po Compaction Codex, jeśli pluginy muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia app-server, ale rdzeń Codex wewnętrznie buduje końcowe żądanie API OpenAI.                 | Wymaga zdarzenia śledzenia żądania modelu Codex lub API debugowania.                      |

## Natywne uprawnienia i elicytacje MCP

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy decyduje polityka. Wynik bez decyzji nie jest zezwoleniem. Codex
traktuje go jako brak decyzji hooka i przechodzi do własnej ścieżki guardiana lub
zatwierdzenia przez użytkownika.

Tryby zatwierdzania app-server Codex domyślnie pomijają ten natywny hook. To
zachowanie ma zastosowanie, gdy `permission_request` jest jawnie uwzględnione w
`nativeHookRelay.events` albo gdy instaluje je zgodnościowe środowisko wykonawcze.

Gdy operator wybierze `allow-always` dla natywnego żądania uprawnień Codex,
OpenClaw zapamiętuje dokładny odcisk provider/sesja/dane wejściowe narzędzia/cwd
dla ograniczonego okna sesji. Zapamiętana decyzja celowo działa wyłącznie przy
dokładnym dopasowaniu: zmienione polecenie, argumenty, ładunek narzędzia lub cwd
tworzą nowe zatwierdzenie.

Elicytacje zatwierdzania narzędzi MCP Codex są trasowane przez przepływ
zatwierdzania pluginów OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind`
jako `"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
czatu źródłowego, a następna oczekująca wiadomość uzupełniająca odpowiada na to
natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne
żądania elicytacji MCP kończą się odmową.

Ogólny przepływ zatwierdzania pluginów, który przenosi te prompty, opisuje
[Żądania uprawnień pluginu](/pl/plugins/plugin-permission-requests).

## Sterowanie kolejką

Sterowanie kolejką aktywnego przebiegu mapuje się na `turn/steer` app-server
Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje wiadomości
czatu w trybie sterowania przez skonfigurowane okno ciszy i wysyła je jako jedno
żądanie `turn/steer` w kolejności nadejścia.

Przegląd Codex i ręczne tury Compaction mogą odrzucać sterowanie w tej samej turze. W takim
przypadku OpenClaw czeka na zakończenie aktywnego uruchomienia przed rozpoczęciem promptu.
Użyj `/queue followup` lub `/queue collect`, gdy wiadomości powinny domyślnie trafiać do kolejki
zamiast sterować. Zobacz [Kolejka sterowania](/pl/concepts/queue-steering).

## Przesyłanie opinii Codex

Gdy `/diagnostics [note]` zostanie zatwierdzone dla sesji używającej natywnego
harnessa Codex, OpenClaw wywołuje też `feedback/upload` app-servera Codex dla odpowiednich
wątków Codex. Przesłanie prosi app-server o dołączenie logów dla każdego wymienionego wątku
oraz utworzonych podwątków Codex, gdy są dostępne.

Przesłanie przechodzi przez standardową ścieżkę opinii Codex do serwerów OpenAI. Jeśli opinie Codex
są wyłączone w tym app-serverze, polecenie zwraca błąd app-servera.
Ukończona odpowiedź diagnostyczna wymienia kanały, identyfikatory sesji OpenClaw,
identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>` dla wątków,
które zostały wysłane.

Jeśli odmówisz zatwierdzenia albo je zignorujesz, OpenClaw nie wypisuje tych identyfikatorów Codex i
nie wysyła opinii Codex. Przesłanie nie zastępuje lokalnego eksportu diagnostycznego Gateway.
Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać zachowanie dotyczące
zatwierdzania, prywatności, lokalnego pakietu oraz czatu grupowego.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać opinię Codex
dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego Gateway.

## Compaction i lustro transkrypcji

Gdy wybrany model używa harnessa Codex, natywne Compaction wątku należy
do app-servera Codex. OpenClaw nie uruchamia wstępnego Compaction dla tur Codex,
nie zastępuje Compaction Codex przez Compaction silnika kontekstu i nie
przechodzi awaryjnie na podsumowanie OpenClaw ani publiczne podsumowanie OpenAI, gdy nie można
uruchomić natywnego Compaction Codex. OpenClaw utrzymuje lustro transkrypcji dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harnessa.

Jawne żądania Compaction, takie jak `/compact` albo ręczna operacja kompaktowania
żądana przez Plugin, uruchamiają natywne Compaction Codex za pomocą `thread/compact/start`.
OpenClaw wraca po rozpoczęciu tej natywnej operacji. Nie czeka na
jej ukończenie, nie nakłada osobnego limitu czasu OpenClaw, nie restartuje współdzielonego
app-servera Codex ani nie zapisuje operacji jako Compaction ukończonego przez OpenClaw.

Gdy silnik kontekstu żąda projekcji bootstrapu wątku Codex, OpenClaw
projektuje nazwy i identyfikatory wywołań narzędzi, kształty wejścia oraz zredagowaną treść wyników narzędzi
do świeżego wątku Codex. Nie kopiuje surowych wartości argumentów wywołań narzędzi do
tej projekcji.

Lustro obejmuje prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu Codex,
gdy app-server je emituje. Obecnie OpenClaw zapisuje tylko jawne natywne sygnały rozpoczęcia
Compaction, gdy żąda Compaction. Nie udostępnia czytelnego dla człowieka podsumowania
Compaction ani audytowalnej listy wpisów, które Codex zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` obecnie nie
przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko wtedy,
gdy OpenClaw zapisuje wynik narzędzia w transkrypcji sesji należącej do OpenClaw.

## Media i dostarczanie

OpenClaw nadal odpowiada za dostarczanie mediów i wybór dostawcy mediów. Obrazy,
wideo, muzyka, PDF, TTS oraz rozumienie mediów używają pasujących ustawień dostawcy/modelu,
takich jak `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` i `messages.tts`.

Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia oraz wyjście narzędzi wiadomości nadal przechodzą
przez standardową ścieżkę dostarczania OpenClaw. Generowanie mediów nie wymaga starszego runtime.
Gdy Codex emituje natywny element generowania obrazu z `savedPath`, OpenClaw
przekazuje dokładnie ten plik przez standardową ścieżkę mediów odpowiedzi, nawet jeśli tura Codex
nie ma tekstu asystenta.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessa Codex](/pl/plugins/codex-harness-reference)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Hooki Plugin](/pl/plugins/hooks)
- [Pluginy harnessa agenta](/pl/plugins/sdk-agent-harness)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Eksport trajektorii](/pl/tools/trajectory)
