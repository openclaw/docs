---
read_when:
    - Potrzebujesz kontraktu obsługi środowiska uruchomieniowego uprzęży Codex
    - Debugujesz natywne narzędzia Codex, hooki, Compaction lub przesyłanie opinii zwrotnych
    - Zmieniasz zachowanie pluginu w turach środowiska testowego OpenClaw i Codex
summary: Granice środowiska uruchomieniowego, hooki, narzędzia, uprawnienia i diagnostyka dla harnessu Codex
title: Środowisko wykonawcze uprzęży Codex
x-i18n:
    generated_at: "2026-07-12T15:20:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Kontrakt środowiska wykonawczego dla tur mechanizmu Codex. Informacje o konfiguracji i routingu zawiera strona
[Mechanizm Codex](/pl/plugins/codex-harness). Pola konfiguracji opisano w
[Dokumentacji referencyjnej mechanizmu Codex](/pl/plugins/codex-harness-reference).

## Omówienie

Codex odpowiada za natywną pętlę modelu, natywne wznawianie wątków, natywną
kontynuację narzędzi oraz natywną Compaction. OpenClaw odpowiada za routing
kanałów, pliki sesji, dostarczanie widocznych wiadomości, dynamiczne narzędzia
OpenClaw, zatwierdzenia, dostarczanie multimediów oraz kopię transkrypcji
obejmującą tę granicę.

Routing promptów zależy od wybranego środowiska wykonawczego, a nie tylko od
ciągu identyfikującego dostawcę. Natywna tura Codex otrzymuje instrukcje
deweloperskie serwera aplikacji Codex. Jawna ścieżka zgodności OpenClaw
zachowuje zwykły prompt systemowy OpenClaw, nawet jeśli używa uwierzytelniania
lub transportu OpenAI w wariancie Codex.

OpenClaw uruchamia i wznawia natywne wątki Codex z wyłączoną wbudowaną
osobowością Codex (`personality: "none"`), dzięki czemu nadrzędne pozostają
pliki osobowości przestrzeni roboczej oraz tożsamość agenta OpenClaw. Poza tym
natywny Codex zachowuje bazowe instrukcje i instrukcje modelu należące do Codex
oraz wczytywanie dokumentacji projektu. Lekkie uruchomienia OpenClaw
(np. cron) nadal pomijają wczytywanie dokumentacji projektu.

Instrukcje deweloperskie OpenClaw obejmują zagadnienia środowiska wykonawczego
OpenClaw: dostarczanie do kanału źródłowego, dynamiczne narzędzia OpenClaw,
delegowanie ACP, kontekst adaptera oraz aktywne pliki profilu przestrzeni
roboczej agenta. Katalogi Skills i wskaźniki do `MEMORY.md` obsługiwane przez
narzędzia są przekazywane jako instrukcje deweloperskie współpracy ograniczone
do danej tury. Gdy narzędzia pamięci są niedostępne, aktywna zawartość
`BOOTSTRAP.md` oraz pełny plik `MEMORY.md` są zamiast tego przekazywane jako
zwykły kontekst wejściowy tury.

Większość dynamicznych narzędzi OpenClaw używa przeszukiwalnej przestrzeni nazw
`openclaw`. Narzędzia oznaczone jako `catalogMode: "direct-only"` używają
`openclaw_direct`, którą Codex zachowuje jako bezpośrednio widoczną dla modelu
wartość `DirectModelOnly`, zamiast udostępniać ją zagnieżdżonemu wykonywaniu
w trybie Code Mode.

## Powiązania wątków i zmiany modelu

Gdy sesja OpenClaw jest dołączona do istniejącego wątku Codex, następna tura
ponownie przesyła do serwera aplikacji aktualnie wybrany model, zasady
zatwierdzania, piaskownicę, recenzenta zatwierdzeń oraz poziom usługi. Zmiana
z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje powiązanie wątku, ale nakazuje
Codex kontynuowanie pracy z nowo wybranym modelem.

Wyjątkiem są powiązania nadzorowane. Selektor modelu OpenClaw pozostaje
zablokowany, a wznowienia pomijają nadpisania modelu i dostawcy, dzięki czemu
Codex przywraca utrwalony model i dostawcę kanonicznego wątku. Osobny natywny
mechanizm sterujący Codex może zmienić tę utrwaloną parę, a początkowa migawka
może wywołać standardowe ostrzeżenie Codex o różnicy modeli. Zewnętrzny model
OpenClaw ani łańcuch modeli rezerwowych nigdy nie zastępują żadnego z tych
elementów.

## Nadzór i bezpieczna kontynuacja

Nadzór Codex to opcjonalna funkcja tego samego pluginu `codex`. Wykrywa natywne
wątki przez osobne połączenie i przekazuje do katalogu Gateway wyłącznie
niezarchiwizowane sesje. Bez jawnych ustawień połączenia `appServer` połączenie
to używa zarządzanego standardowego wejścia i wyjścia w katalogu domowym
użytkownika, natomiast zwykły mechanizm pozostaje ograniczony do agenta.
Wyświetlanie listy i odczyty metadanych są pasywne: nie wznawiają wątku, nie
subskrybują OpenClaw do jego zdarzeń na żywo ani nie odpowiadają na jego prośby
o zatwierdzenie.

W przypadku zapisanej lub bezczynnej sesji na komputerze z Gateway opcja
**Kontynuuj jako gałąź** tworzy zwykły czat z zablokowanym modelem i kopiuje
ograniczoną historię użytkownika oraz asystenta do ostatniej utrwalonej,
zakończonej tury źródła. Pierwsza zwykła tura czatu instaluje właściwe
procedury obsługi zatwierdzeń i używa tymczasowej natywnej kopii wątku, aby
przypiąć migawkę bez nadpisywania modelu ani dostawcy. Codex App Server używa
swojej bieżącej konfiguracji natywnej i zwraca wybraną parę. Jeśli model różni
się od ostatniego modelu zapisanego dla źródła, emituje standardowe ostrzeżenie.
W ramach tego samego połączenia nadzoru OpenClaw uruchamia kanoniczny wątek
mechanizmu Codex ze źródłem `appServer`, używając jego katalogu roboczego
i zasad środowiska wykonawczego oraz dokładnie zwróconego modelu i dostawcy dla
tego początkowego uruchomienia, wstrzykuje ograniczoną widoczną historię
i archiwizuje tymczasową kopię wątku. Źródło nigdy nie jest wznawiane.
Kanoniczny wątek ma dostęp do pełnego zestawu narzędzi mechanizmu OpenClaw.
Rozumowanie, wywołania narzędzi i wyniki narzędzi ze źródła nie są do niego
kopiowane. Prywatny zakres połączenia pozostaje zachowany zarówno w oczekującym,
jak i zatwierdzonym stanie powiązania, dlatego każda późniejsza tura nadal
korzysta z tego połączenia wraz z natywnym uwierzytelnianiem i konfiguracją
dostawcy. Wyłączony nadzór lub rozbieżność powiązania bądź połączenia powodują
bezpieczne przerwanie działania zamiast przełączenia na zwykły mechanizm
w katalogu domowym agenta.

Pierwotne źródło CLI lub VS Code nadal może znajdować się w obu katalogach.
Kanoniczna gałąź jest natywnym wątkiem Codex, ale jej rodzaj źródła to
`appServer`. Klienci natywni mogą filtrować ten rodzaj źródła, dlatego nie ma
gwarancji, że pojawi się ona w Codex Desktop.

Aktywne źródła nie mogą rozpoczynać nowej gałęzi ani być archiwizowane. Nadal
można otworzyć istniejący nadzorowany czat. `notLoaded` oznacza, że aktywność
jest nieznana, a nie że sesja jest bezczynna. OpenClaw zezwala na archiwizację
lokalnego wiersza `idle` lub `notLoaded` dopiero po jawnym potwierdzeniu braku
innego procesu wykonawczego oraz ponownym, lokalnym dla procesu odczycie stanu.
Codex serializuje modyfikacje wątków w obrębie jednego procesu App Server, ale
nie zapewnia wyłącznej dzierżawy między procesami dla procesu wykonawczego ani
właściciela zatwierdzeń, dlatego ten odczyt nie może dowieść, że inny proces nie
korzysta z wątku. OpenClaw blokuje znanego aktywnego właściciela powiązania dla
dokładnie wskazanego celu lub dowolnego niezarchiwizowanego potomka utworzonego
przez ten cel i zwróconego przez stronicowane zapytanie Codex o potomków. Błędy
wyliczania, cykle i wyczerpanie limitu bezpieczeństwa powodują bezpieczne
przerwanie działania. Natywna archiwizacja nadal może wejść w konflikt z nową
turą w innym procesie, dlatego potwierdzenie obejmuje nieznanych klientów oraz
przedział między odczytem stanu a archiwizacją. Nadzorowanego czatu
z zablokowanym modelem nie można usunąć, dopóki chroni natywne powiązanie.

Katalogi sparowanych Node w pierwszym wydaniu zawierają wyłącznie metadane.
Obecna granica wywołań Node działa w modelu żądanie/odpowiedź i nie może
przenosić długotrwałych zdarzeń tury, próśb o zatwierdzenie ani strumieniowego
wyjścia wymaganych przez rzeczywiste powiązanie mechanizmu Codex. Zdalne opcje
**Kontynuuj** i **Archiwizuj** pozostają zatem niedostępne nawet wtedy, gdy
wiersz jest bezczynny.

Informacje o konfiguracji dla operatora i widocznym działaniu interfejsu
sterowania zawiera strona [Nadzór Codex](/pl/plugins/codex-supervision).

## Widoczne odpowiedzi i Heartbeat

Bezpośrednie i źródłowe tury czatu obsługiwane przez mechanizm Codex domyślnie
automatycznie dostarczają końcową odpowiedź asystenta do wewnętrznych
interfejsów WebChat, zgodnie z kontraktem mechanizmu Pi: agent odpowiada
normalnie, a OpenClaw publikuje końcowy tekst w rozmowie źródłowej. Ustaw
`messages.visibleReplies: "message_tool"`, aby końcowy tekst asystenta pozostał
prywatny, chyba że agent wywoła `message(action="send")`.

Tury Heartbeat Codex domyślnie otrzymują `heartbeat_respond` w przeszukiwalnym
katalogu narzędzi OpenClaw, dzięki czemu agent może zapisać, czy wybudzenie ma
pozostać ciche, czy wysłać powiadomienie. Wskazówki dotyczące inicjatywy
Heartbeat są przesyłane jako instrukcja deweloperska trybu współpracy Codex
ograniczona do tury Heartbeat. Zwykłe tury czatu pozostają w domyślnym trybie
Codex. Gdy plik `HEARTBEAT.md` nie jest pusty, instrukcje Heartbeat wskazują
Codex ten plik zamiast umieszczać jego zawartość bezpośrednio w instrukcjach.

## Granice hooków

| Warstwa                               | Właściciel               | Przeznaczenie                                                        |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooki pluginów OpenClaw               | OpenClaw                 | Zgodność produktu i pluginów między mechanizmami OpenClaw i Codex.   |
| Middleware rozszerzeń App Server Codex | Wbudowane pluginy OpenClaw | Zachowanie adaptera w każdej turze wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywne zasady narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do
routingu zachowania pluginów. Dla mostu natywnych narzędzi i uprawnień OpenClaw
wstrzykuje konfigurację Codex dla poszczególnych wątków dotyczącą
`PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`.

Gdy zatwierdzenia App Server Codex są włączone (`approvalPolicy` nie ma
wartości `"never"`), domyślna wstrzykiwana konfiguracja natywnych hooków pomija
`PermissionRequest`, dzięki czemu recenzent App Server Codex i most zatwierdzeń
OpenClaw obsługują rzeczywiste eskalacje po przeglądzie. Dodaj
`permission_request` do `nativeHookRelay.events`, aby mimo to wymusić
przekaźnik zgodności. Inne hooki Codex, takie jak `SessionStart`
i `UserPromptSubmit`, pozostają mechanizmami sterującymi na poziomie Codex.
W kontrakcie v1 nie są udostępniane jako hooki pluginów OpenClaw.

W przypadku dynamicznych narzędzi OpenClaw to OpenClaw wykonuje narzędzie po
zażądaniu wywołania przez Codex, dlatego zachowanie pluginu i middleware jest
realizowane w adapterze mechanizmu. W przypadku narzędzi natywnych Codex to
Codex jest właścicielem kanonicznego rekordu narzędzia. OpenClaw może kopiować
wybrane zdarzenia, ale nie może zmieniać natywnego wątku, chyba że Codex
udostępni taką możliwość przez App Server lub wywołania zwrotne natywnych
hooków.

Zdarzenia `PreToolUse` App Server Codex w trybie raportowania odraczają
zatwierdzenie pluginu do odpowiadającego mu zatwierdzenia App Server. Jeśli hook
OpenClaw `before_tool_call` zwróci `requireApproval`, gdy natywne dane zawierają
`openclaw_approval_mode: "report"`, przekaźnik natywnego hooka zapisuje wymóg
zatwierdzenia pluginu i nie zwraca natywnej decyzji. Gdy Codex później wyśle
żądanie zatwierdzenia App Server dotyczące tego samego użycia narzędzia,
OpenClaw otwiera monit o zatwierdzenie pluginu i odwzorowuje decyzję z powrotem
do Codex. Zdarzenia Codex `PermissionRequest` stanowią osobną ścieżkę
zatwierdzania i po skonfigurowaniu tego mostu nadal mogą być kierowane przez
zatwierdzenia OpenClaw.

Powiadomienia o elementach App Server Codex zapewniają także asynchroniczne
obserwacje `after_tool_call` dotyczące zakończenia działania natywnych narzędzi,
które nie zostały już obsłużone przez natywny przekaźnik `PostToolUse`. Służą
one wyłącznie do telemetrii i zgodności. Nie mogą blokować, opóźniać ani
modyfikować wywołania natywnego narzędzia.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień App Server Codex
oraz stanu adaptera OpenClaw, a nie z poleceń natywnych hooków Codex.
`before_compaction`, `after_compaction`, `llm_input` i `llm_output` są
obserwacjami na poziomie adaptera, a nie dokładnymi co do bajtu kopiami
wewnętrznych żądań lub danych Compaction Codex.

Natywne powiadomienia App Server Codex `hook/started` i `hook/completed` są
przekazywane jako zdarzenia agenta `codex_app_server.hook` na potrzeby śledzenia
przebiegu i debugowania. Nie wywołują hooków pluginów OpenClaw.

## Kontrakt obsługi wersji V1

Obsługiwane w środowisku wykonawczym Codex v1:

| Obszar                                        | Obsługa                                                                          | Uzasadnienie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                      | Codex app-server zarządza turą OpenAI, natywnym wznawianiem wątku i natywną kontynuacją narzędzi.                                                                                                                                                                                                                                                                                                                                                                                           |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem wykonawczym modelu.                                                                                                                                                                                                                                                                                                                                                                                  |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                                                                      | Codex zleca OpenClaw wykonanie tych narzędzi, dzięki czemu OpenClaw pozostaje na ścieżce wykonania.                                                                                                                                                                                                                                                                                                                                                                                          |
| Pluginy promptów i kontekstu                  | Obsługiwane                                                                      | OpenClaw przekazuje prompt i kontekst specyficzny dla OpenClaw do tury Codex, pozostawiając bazowe prompty, prompty modelu oraz skonfigurowane prompty dokumentacji projektu zarządzane przez Codex w natywnej ścieżce Codex. OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków, dzięki czemu pliki osobowości w przestrzeni roboczej agenta pozostają nadrzędne. Natywne instrukcje deweloperskie Codex akceptują wyłącznie wskazówki dotyczące poleceń jawnie ograniczone do `codex_app_server`; starsze globalne wskazówki dotyczące poleceń pozostają dostępne dla powierzchni promptów innych niż Codex. |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                      | Składanie, przyswajanie i konserwacja po turze odbywają się wokół tur Codex. Silniki kontekstu nie zastępują natywnego Compaction Codex.                                                                                                                                                                                                                                                                                                                                                     |
| Hooki narzędzi dynamicznych                   | Obsługiwane                                                                      | Middleware `before_tool_call`, `after_tool_call` i wyników narzędzi działa wokół dynamicznych narzędzi zarządzanych przez OpenClaw.                                                                                                                                                                                                                                                                                                                                                          |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                              | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` są wywoływane z rzetelnymi ładunkami trybu Codex.                                                                                                                                                                                                                                                                                                                                                            |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez natywne przekazywanie hooków                                    | Zdarzenie Codex `Stop` jest przekazywane do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                                                                                                                                                                                                                                                                                               |
| Blokowanie lub obserwowanie natywnej powłoki, łatek i MCP | Obsługiwane przez natywne przekazywanie hooków                                    | Zdarzenia Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w Codex app-server `0.142.0` lub nowszym. Blokowanie jest obsługiwane, ale przepisywanie argumentów nie.                                                                                                                                                                                                                                                       |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia Codex app-server i zgodnościowe natywne przekazywanie hooków | Żądania zatwierdzenia Codex app-server są kierowane przez OpenClaw po weryfikacji Codex. Natywne przekazywanie hooka `PermissionRequest` jest opcjonalne dla natywnych trybów zatwierdzania, ponieważ Codex emituje je przed weryfikacją przez mechanizm ochronny.                                                                                                                                                                                                                                  |
| Rejestrowanie przebiegu app-server            | Obsługiwane                                                                      | OpenClaw rejestruje żądanie wysłane do app-server oraz otrzymywane z niego powiadomienia.                                                                                                                                                                                                                                                                                                                                                                                                   |

Nieobsługiwane w środowisku wykonawczym Codex v1:

| Obszar                                              | Ograniczenie v1                                                                                                                                 | Przyszłe rozwiązanie                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Modyfikacja argumentów natywnych narzędzi           | Natywne hooki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów natywnych narzędzi Codex.                     | Wymaga obsługi przez hook lub schemat Codex zastępczych danych wejściowych narzędzia.       |
| Edytowalna historia natywnej transkrypcji Codex     | Codex zarządza kanoniczną historią natywnego wątku. OpenClaw zarządza kopią i może przekazywać przyszły kontekst, ale nie powinien modyfikować nieobsługiwanych elementów wewnętrznych. | Należy dodać jawne interfejsy API Codex app-server, jeśli potrzebna jest ingerencja w natywny wątek. |
| `tool_result_persist` dla rekordów natywnych narzędzi Codex | Ten hook przekształca zapisy transkrypcji zarządzane przez OpenClaw, a nie rekordy natywnych narzędzi Codex.                                     | Można utworzyć kopię przekształconych rekordów, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Rozbudowane metadane natywnego Compaction           | OpenClaw może zażądać natywnego Compaction, ale nie otrzymuje stabilnej listy zachowanych i odrzuconych elementów, różnicy liczby tokenów, podsumowania ukończenia ani ładunku podsumowania. | Wymaga bardziej rozbudowanych zdarzeń Compaction Codex.                                    |
| Ingerencja w Compaction                              | OpenClaw nie pozwala pluginom ani silnikom kontekstu zawetować, przepisać ani zastąpić natywnego Compaction Codex.                              | Należy dodać hooki Codex przed i po Compaction, jeśli pluginy muszą zawetować lub przepisać natywne Compaction. |
| Rejestrowanie żądania API modelu bajt po bajcie      | OpenClaw może rejestrować żądania i powiadomienia app-server, ale rdzeń Codex wewnętrznie tworzy końcowe żądanie API OpenAI.                    | Wymaga zdarzenia śledzenia żądania modelu Codex lub interfejsu API debugowania.             |

## Natywne uprawnienia i żądania pozyskania danych MCP

W przypadku `PermissionRequest` OpenClaw zwraca jawne decyzje zezwalające lub
odmawiające tylko wtedy, gdy określa je polityka. Brak decyzji nie oznacza
zezwolenia: Codex traktuje go jako brak decyzji hooka i przechodzi do własnej
ścieżki mechanizmu ochronnego lub zatwierdzenia przez użytkownika.

Tryby zatwierdzania Codex app-server domyślnie pomijają ten natywny hook.
Ma to zastosowanie, chyba że `permission_request` zostanie jawnie uwzględnione
w `nativeHookRelay.events` lub zostanie zainstalowane przez zgodnościowe środowisko wykonawcze.

Gdy operator wybierze `allow-always` dla żądania natywnego uprawnienia Codex,
OpenClaw zapamiętuje dokładny odcisk danych wejściowych dostawcy, sesji,
narzędzia i cwd przez ograniczony czas sesji. Zapamiętana decyzja celowo
obowiązuje tylko dla dokładnego dopasowania: zmiana polecenia, argumentów,
ładunku narzędzia lub cwd powoduje utworzenie nowego żądania zatwierdzenia.

Żądania zatwierdzenia narzędzi Codex MCP są kierowane przez przepływ
zatwierdzania pluginów OpenClaw, gdy Codex oznaczy
`_meta.codex_approval_kind` jako `"mcp_tool_call"`. Prompty Codex
`request_user_input` są odsyłane do czatu źródłowego, a następna wiadomość
oczekująca w kolejce odpowiada na to żądanie natywnego serwera, zamiast być
przekazywana jako dodatkowy kontekst. Inne żądania pozyskania danych MCP są
domyślnie odrzucane.

Ogólny przepływ zatwierdzania pluginów, który przenosi te prompty, opisano w
sekcji [Żądania uprawnień pluginów](/pl/plugins/plugin-permission-requests).

## Sterowanie kolejką

Sterowanie kolejką aktywnego uruchomienia jest odwzorowywane na
`turn/steer` w Codex app-server. Przy domyślnym ustawieniu
`messages.queue.mode: "steer"` OpenClaw grupuje wiadomości czatu w trybie
sterowania w skonfigurowanym okresie bezczynności i wysyła je jako jedno
żądanie `turn/steer` w kolejności nadejścia.

Tury przeglądu Codex i ręcznej Compaction mogą odrzucać sterowanie w tej samej turze. W
takim przypadku OpenClaw czeka na zakończenie aktywnego przebiegu przed rozpoczęciem
przetwarzania monitu. Użyj `/queue followup` lub `/queue collect`, gdy wiadomości mają być domyślnie
kolejkowane zamiast służyć do sterowania. Zobacz [Kolejka sterowania](/pl/concepts/queue-steering).

## Przesyłanie opinii Codex

Gdy `/diagnostics [note]` zostanie zatwierdzone dla sesji w natywnym środowisku
Codex, OpenClaw wywołuje również `feedback/upload` serwera aplikacji Codex dla odpowiednich
wątków Codex, dołączając dzienniki każdego wymienionego wątku oraz utworzonych
podwątków Codex, jeśli są dostępne.

Przesyłanie odbywa się zwykłą ścieżką opinii Codex do serwerów OpenAI. Jeśli
opinie Codex są wyłączone na tym serwerze aplikacji, polecenie zwraca błąd
serwera aplikacji. Odpowiedź po zakończeniu diagnostyki zawiera kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia
`codex resume <thread-id>` dla wysłanych wątków.

Jeśli odrzucisz lub zignorujesz zatwierdzenie, OpenClaw nie wyświetli tych identyfikatorów Codex
ani nie wyśle opinii Codex. Przesyłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway. Informacje o zatwierdzaniu, prywatności, lokalnym pakiecie
i działaniu w czatach grupowych zawiera [Eksport diagnostyki](/pl/gateway/diagnostics).

Używaj `/codex diagnostics [note]` tylko wtedy, gdy chcesz przesłać opinię Codex
dla aktualnie dołączonego wątku bez pełnego pakietu diagnostyki Gateway.

## Compaction i kopia transkrypcji

Gdy wybrany model korzysta ze środowiska Codex, natywna Compaction wątku
należy do serwera aplikacji Codex. OpenClaw nie uruchamia wstępnej Compaction dla
tur Codex, nie zastępuje Compaction Codex kompresją silnika kontekstu ani nie
korzysta awaryjnie z podsumowywania OpenClaw lub publicznego podsumowywania OpenAI, gdy nie można
uruchomić natywnej Compaction. OpenClaw przechowuje kopię transkrypcji na potrzeby historii kanału, wyszukiwania,
`/new`, `/reset` oraz przyszłego przełączania modelu lub środowiska.

Jawne żądania Compaction, takie jak `/compact` lub ręczna operacja
Compaction zażądana przez plugin, uruchamiają natywną Compaction Codex za pomocą `thread/compact/start`.
OpenClaw utrzymuje żądanie i dzierżawę współdzielonego klienta do czasu, aż Codex wyemituje
pasujący element ukończenia `contextCompaction`, a następnie zgłasza turę Compaction
jako zakończoną. Jeśli ta końcowa tura przekroczy skonfigurowany limit czasu
Compaction, OpenClaw żąda natywnego przerwania tury. Dzierżawa i blokada
Compaction dla danego wątku pozostają utrzymane, dopóki Codex nie zgłosi stanu końcowego lub nie potwierdzi
wywołania RPC przerwania. Jeśli Codex nie potwierdzi go w okresie karencji
przerwania, OpenClaw wycofuje połączenie przed zwolnieniem blokady. Połączenia
zdalne odłączają również powiązanie odpowiedniego wątku, aby późniejsze operacje nie mogły
nakładać się na niepotwierdzoną zdalną turę. Inne tury w wycofanym połączeniu kończą się
niepowodzeniem i mogą zostać ponowione przy użyciu nowego klienta. Zamknięcie klienta, anulowanie żądania lub
nieudana tura Compaction zwraca operację zakończoną niepowodzeniem. Automatyczna Compaction pod presją
kontekstu należy do Codex; OpenClaw uruchamia natywną Compaction wyłącznie dla ręcznie
żądanych wyzwalaczy.

Gdy silnik kontekstu żąda projekcji inicjalizacyjnej wątku Codex, OpenClaw
projektuje nazwy i identyfikatory wywołań narzędzi, struktury danych wejściowych oraz zredagowaną zawartość
wyników narzędzi do nowego wątku Codex. Nie kopiuje do tej projekcji nieprzetworzonych wartości
argumentów wywołań narzędzi.

Kopia zawiera monit użytkownika, końcowy tekst asystenta oraz uproszczone
rekordy rozumowania lub planu Codex, gdy serwer aplikacji je emituje. OpenClaw
rejestruje rozpoczęcie i końcowy stan natywnej Compaction, ale nie
udostępnia czytelnego dla człowieka podsumowania Compaction ani możliwej do audytu listy wpisów,
które Codex zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` nie
przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko wtedy, gdy OpenClaw
zapisuje wynik narzędzia w transkrypcji sesji należącej do OpenClaw.

## Multimedia i dostarczanie

OpenClaw nadal odpowiada za dostarczanie multimediów i wybór ich dostawcy. Generowanie obrazów,
wideo, muzyki i plików PDF, TTS oraz rozumienie multimediów używają odpowiednich ustawień dostawcy/modelu,
takich jak `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` i `messages.tts`.

Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe narzędzi komunikacyjnych nadal
przechodzą zwykłą ścieżką dostarczania OpenClaw; generowanie multimediów nie wymaga
starszego środowiska uruchomieniowego. Gdy Codex emituje natywny element generowania obrazu z
`savedPath`, OpenClaw przekazuje ten dokładny plik zwykłą ścieżką multimediów odpowiedzi,
nawet jeśli tura Codex nie zawiera tekstu asystenta.

## Powiązane

- [Środowisko Codex](/pl/plugins/codex-harness)
- [Dokumentacja środowiska Codex](/pl/plugins/codex-harness-reference)
- [Nadzorowanie Codex](/pl/plugins/codex-supervision)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Punkty zaczepienia pluginów](/pl/plugins/hooks)
- [Pluginy środowiska agenta](/pl/plugins/sdk-agent-harness)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Eksport trajektorii](/pl/tools/trajectory)
