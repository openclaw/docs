---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości Pluginu lub granic odpowiedzialności
    - Praca nad potokiem ładowania pluginów lub rejestrem
    - Implementowanie hooków środowiska uruchomieniowego dostawcy lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wewnętrzne mechanizmy Pluginu: model możliwości, własność, kontrakty, proces ładowania i pomocnicze funkcje środowiska wykonawczego'
title: Wewnętrzne mechanizmy Pluginu
x-i18n:
    generated_at: "2026-07-12T15:22:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

To jest **szczegółowa dokumentacja architektury** systemu pluginów OpenClaw. Praktyczne informacje znajdziesz na jednej z poniższych stron tematycznych.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie pluginów" icon="plug" href="/pl/tools/plugin">
    Przewodnik dla użytkowników dotyczący dodawania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Tworzenie pluginów" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek tworzenia pierwszego pluginu z najmniejszym działającym manifestem.
  </Card>
  <Card title="Pluginy kanałów" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Tworzenie pluginu kanału komunikacyjnego.
  </Card>
  <Card title="Pluginy dostawców" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Tworzenie pluginu dostawcy modeli.
  </Card>
  <Card title="Omówienie SDK" icon="book" href="/pl/plugins/sdk-overview">
    Dokumentacja mapy importów i interfejsu API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości stanowią publiczny model **natywnych pluginów** w OpenClaw. Każdy natywny plugin OpenClaw rejestruje co najmniej jeden typ możliwości:

| Możliwość                    | Metoda rejestracji                               | Przykładowe pluginy                   |
| ---------------------------- | ------------------------------------------------ | ------------------------------------- |
| Wnioskowanie tekstowe        | `api.registerProvider(...)`                      | `anthropic`, `openai`                 |
| Mechanizm wnioskowania CLI   | `api.registerCliBackend(...)`                    | `anthropic`, `openai`                 |
| Osadzenia                    | `api.registerEmbeddingProvider(...)`             | Pluginy wektorowe należące do dostawcy |
| Mowa                         | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Głos w czasie rzeczywistym   | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`                    |
| Rozumienie multimediów       | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`                    |
| Źródło transkrypcji          | `api.registerTranscriptSourceProvider(...)`      | `discord`                             |
| Generowanie obrazów          | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`             |
| Generowanie muzyki           | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`            |
| Generowanie wideo            | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`               |
| Pobieranie zawartości z internetu | `api.registerWebFetchProvider(...)`         | `firecrawl`                           |
| Wyszukiwanie w internecie    | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`        |
| Kanał / komunikacja          | `api.registerChannel(...)`                       | `matrix`, `msteams`                   |
| Wykrywanie Gateway           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                             |

<Note>
Plugin, który nie rejestruje żadnych możliwości, ale udostępnia haki, narzędzia, usługi wykrywania lub usługi działające w tle, jest **starszym pluginem opartym wyłącznie na hakach**. Ten wzorzec jest nadal w pełni obsługiwany.
</Note>

### Podejście do zgodności zewnętrznej

Model możliwości został wdrożony w rdzeniu i jest obecnie używany przez dołączone i natywne pluginy, ale zgodność zewnętrznych pluginów wymaga bardziej rygorystycznego kryterium niż „jest eksportowany, więc jest niezmienny”.

| Sytuacja pluginu                                 | Zalecenie                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Istniejące zewnętrzne pluginy                    | Utrzymuj działanie integracji opartych na hakach; jest to punkt odniesienia dla zgodności.                           |
| Nowe dołączone lub natywne pluginy               | Preferuj jawną rejestrację możliwości zamiast odwołań specyficznych dla dostawcy lub nowych projektów opartych wyłącznie na hakach. |
| Zewnętrzne pluginy wdrażające rejestrację możliwości | Jest to dozwolone, ale interfejsy pomocnicze specyficzne dla możliwości należy traktować jako rozwijające się, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości jest docelowym kierunkiem. Starsze haki pozostają najbezpieczniejszą ścieżką bez ryzyka zakłóceń dla zewnętrznych pluginów w okresie przejściowym. Nie wszystkie eksportowane podścieżki pomocnicze są równoważne — preferuj wąskie, udokumentowane kontrakty zamiast przypadkowo eksportowanych funkcji pomocniczych.

### Formy pluginów

OpenClaw klasyfikuje każdy załadowany plugin według formy na podstawie jego rzeczywistego zachowania podczas rejestracji, a nie tylko statycznych metadanych:

<AccordionGroup>
  <Accordion title="plain-capability">
    Rejestruje dokładnie jeden typ możliwości (na przykład plugin wyłącznie dostawcy, taki jak `arcee` lub `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Rejestruje wiele typów możliwości (na przykład `openai` odpowiada za wnioskowanie tekstowe, mowę, rozumienie multimediów i generowanie obrazów).
  </Accordion>
  <Accordion title="hook-only">
    Rejestruje wyłącznie haki (typowane lub niestandardowe), bez możliwości, narzędzi, poleceń ani usług.
  </Accordion>
  <Accordion title="non-capability">
    Rejestruje narzędzia, polecenia, usługi lub trasy, ale nie rejestruje możliwości.
  </Accordion>
</AccordionGroup>

Użyj `openclaw plugins inspect <id>`, aby zobaczyć formę pluginu i zestawienie jego możliwości. Szczegółowe informacje zawiera [dokumentacja CLI](/pl/cli/plugins#inspect).

### Starsze haki

Hak `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla pluginów opartych wyłącznie na hakach. Nadal zależą od niego starsze pluginy używane w praktyce.

Kierunek rozwoju:

- utrzymanie jego działania
- udokumentowanie go jako starszego rozwiązania
- preferowanie `before_model_resolve` do nadpisywania modelu lub dostawcy
- preferowanie `before_prompt_build` do modyfikowania promptu
- usunięcie dopiero po spadku rzeczywistego użycia i potwierdzeniu bezpieczeństwa migracji przez testy z użyciem danych wzorcowych

### Sygnały zgodności

Polecenia `openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` oraz `openclaw plugins doctor` wyświetlają następujące powiadomienia dotyczące zgodności:

| Sygnał                                     | Znaczenie                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **prawidłowa konfiguracja**                | Konfiguracja jest prawidłowo analizowana, a pluginy są rozpoznawane                                                           |
| **tylko haki** (informacja)                | Plugin rejestruje wyłącznie haki; jest to obsługiwana ścieżka, ale nie została jeszcze przeniesiona na rejestrację możliwości  |
| **starszy `before_agent_start`** (ostrzeżenie) | Plugin używa przestarzałego haka `before_agent_start` zamiast `before_model_resolve`/`before_prompt_build`                 |
| **przestarzały interfejs API osadzeń pamięci** (ostrzeżenie) | Plugin spoza zestawu dołączonych pluginów używa starego, specyficznego dla pamięci interfejsu API dostawcy osadzeń zamiast `registerEmbeddingProvider` |
| **błąd krytyczny**                         | Konfiguracja jest nieprawidłowa lub nie udało się załadować pluginu                                                          |

Żaden z sygnałów informacyjnych ani ostrzeżeń nie zakłóca obecnie działania pluginu. Sygnały te pojawiają się również w wynikach poleceń `openclaw status --all` i `openclaw plugins doctor`.

## Omówienie architektury

System pluginów OpenClaw składa się z czterech warstw:

<Steps>
  <Step title="Manifest i wykrywanie">
    OpenClaw wyszukuje potencjalne pluginy w skonfigurowanych ścieżkach, katalogach głównych przestrzeni roboczych, globalnych katalogach głównych pluginów oraz wśród dołączonych pluginów. Proces wykrywania odczytuje najpierw natywne manifesty `openclaw.plugin.json` i obsługiwane manifesty pakietów.
  </Step>
  <Step title="Włączanie i walidacja">
    Rdzeń określa, czy wykryty plugin jest włączony, wyłączony, zablokowany, czy wybrany do wyłącznego miejsca, takiego jak pamięć.
  </Step>
  <Step title="Ładowanie w czasie działania">
    Natywne pluginy OpenClaw są ładowane w procesie i rejestrują możliwości w centralnym rejestrze. Spakowany kod JavaScript jest ładowany za pomocą natywnego mechanizmu `require`; lokalny kod źródłowy TypeScript firm trzecich korzysta awaryjnie z Jiti. Zgodne pakiety są normalizowane do rekordów rejestru bez importowania kodu wykonywalnego.
  </Step>
  <Step title="Korzystanie z udostępnianych elementów">
    Pozostała część OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację dostawców, haki, trasy HTTP, polecenia CLI i usługi.
  </Step>
</Steps>

W szczególności wykrywanie głównych poleceń CLI pluginów jest podzielone na dwie fazy:

- metadane dostępne podczas analizowania pochodzą z `registerCli(..., { descriptors: [...] })`
- właściwy moduł CLI pluginu może pozostać ładowany leniwie i rejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw może zarezerwować nazwy głównych poleceń przed rozpoczęciem analizy.

Ważna granica projektowa:

- walidacja manifestu i konfiguracji powinna działać na podstawie **metadanych manifestu i schematu** bez wykonywania kodu pluginu
- wykrywanie natywnych możliwości może ładować zaufany kod wejściowy pluginu w celu utworzenia nieaktywującego obrazu rejestru
- natywne zachowanie w czasie działania pochodzi ze ścieżki `register(api)` modułu pluginu, gdy `api.registrationMode === "full"`

Ten podział pozwala OpenClaw sprawdzać poprawność konfiguracji, wyjaśniać brakujące lub wyłączone pluginy oraz tworzyć wskazówki dla interfejsu użytkownika i schematu przed uruchomieniem pełnego środowiska wykonawczego.

### Obraz metadanych pluginów i tabela wyszukiwania

Podczas uruchamiania Gateway tworzony jest jeden obiekt `PluginMetadataSnapshot` dla bieżącego obrazu konfiguracji. Obraz zawiera wyłącznie metadane: przechowuje indeks zainstalowanych pluginów, rejestr manifestów, diagnostykę manifestów, mapy właścicieli, mechanizm normalizacji identyfikatorów pluginów oraz rekordy manifestów. Nie zawiera załadowanych modułów pluginów, zestawów SDK dostawców, zawartości pakietów ani eksportowanych elementów środowiska wykonawczego.

Walidacja konfiguracji uwzględniająca pluginy, automatyczne włączanie podczas uruchamiania oraz inicjalizacja pluginów Gateway korzystają z tego obrazu zamiast niezależnie przebudowywać metadane manifestów i indeksu. Obiekt `PluginLookUpTable` jest tworzony na podstawie tego samego obrazu i dodaje plan uruchamiania pluginów dla bieżącej konfiguracji środowiska wykonawczego.

Po uruchomieniu Gateway zachowuje bieżący obraz metadanych jako wymienialny produkt środowiska wykonawczego. Powtarzane wykrywanie dostawców w czasie działania może korzystać z tego obrazu zamiast odtwarzać indeks instalacji i rejestr manifestów przy każdym przebiegu katalogu dostawców. Obraz jest czyszczony lub zastępowany przy zamykaniu Gateway, zmianach konfiguracji lub spisu pluginów oraz zapisach indeksu instalacji; jeśli nie istnieje zgodny bieżący obraz, kod wywołujący powraca do zimnej ścieżki manifestu i indeksu. Kontrole zgodności muszą uwzględniać katalogi główne wykrywania pluginów, takie jak `plugins.load.paths`, oraz domyślną przestrzeń roboczą agenta, ponieważ pluginy przestrzeni roboczej należą do zakresu metadanych.

Obraz i tabela wyszukiwania utrzymują powtarzane decyzje podczas uruchamiania na szybkiej ścieżce:

- własność kanałów
- odroczone uruchamianie kanałów
- identyfikatory pluginów uruchamianych podczas startu
- własność dostawców i mechanizmów CLI
- własność dostawcy konfiguracji, aliasów poleceń, dostawcy katalogu modeli oraz kontraktu manifestu
- walidacja schematu konfiguracji pluginów i schematu konfiguracji kanałów
- decyzje o automatycznym włączaniu podczas uruchamiania

Granicę bezpieczeństwa stanowi zastępowanie obrazu, a nie jego modyfikowanie. Przebuduj obraz po zmianie konfiguracji, spisu pluginów, rekordów instalacji lub utrwalonych zasad indeksu. Nie traktuj go jako ogólnego, modyfikowalnego rejestru globalnego i nie przechowuj nieograniczonej liczby obrazów historycznych. Ładowanie pluginów w czasie działania pozostaje oddzielone od obrazów metadanych, dzięki czemu nieaktualny stan środowiska wykonawczego nie może zostać ukryty za pamięcią podręczną metadanych.

Regułę pamięci podręcznej opisano w dokumencie [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals#plugin-cache-boundary): metadane manifestu i wykrywania są aktualne, chyba że kod wywołujący przechowuje jawny obraz, tabelę wyszukiwania lub rejestr manifestów dla bieżącego przepływu. Ukryte pamięci podręczne metadanych i czasy TTL oparte na zegarze nie są częścią ładowania pluginów. Po faktycznym załadowaniu kodu lub zainstalowanych artefaktów mogą być zachowywane wyłącznie pamięci podręczne modułu ładującego środowiska wykonawczego, modułów i artefaktów zależności.

Niektóre wywołania zimnej ścieżki nadal odtwarzają rejestry manifestów bezpośrednio z utrwalonego indeksu zainstalowanych pluginów zamiast otrzymywać obiekt `PluginLookUpTable` z Gateway. Ta ścieżka odtwarza teraz rejestr na żądanie; jeśli kod wywołujący już go posiada, preferuj przekazywanie bieżącej tabeli wyszukiwania lub jawnego rejestru manifestów przez przepływy środowiska wykonawczego.

### Planowanie aktywacji

Planowanie aktywacji jest częścią płaszczyzny sterowania. Kod wywołujący może przed załadowaniem szerszych rejestrów środowiska uruchomieniowego sprawdzić, które pluginy są istotne dla konkretnego polecenia, dostawcy, kanału, trasy, środowiska agenta lub możliwości.

Planista zachowuje zgodność z bieżącym działaniem manifestu:

- pola `activation.*` są jawnymi wskazówkami dla planisty
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` oraz punkty zaczepienia pozostają mechanizmem rezerwowym opartym na własności określonej w manifeście
- interfejs API planisty zwracający wyłącznie identyfikatory pozostaje dostępny dla istniejącego kodu wywołującego
- interfejs API planu zgłasza etykiety przyczyn, dzięki czemu diagnostyka może odróżnić jawne wskazówki od mechanizmu rezerwowego opartego na własności

<Warning>
Nie traktuj `activation` jako punktu zaczepienia cyklu życia ani zamiennika `register(...)`. Są to metadane służące do zawężania zakresu ładowania. Preferuj pola własności, jeśli już opisują daną relację; używaj `activation` wyłącznie jako dodatkowych wskazówek dla planisty.
</Warning>

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia do wysyłania, edytowania ani reagowania w przypadku zwykłych działań na czacie. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu, a pluginy kanałów odpowiadają za właściwe dla kanału wykrywanie i wykonywanie działań.

Obecny podział odpowiedzialności wygląda następująco:

- rdzeń odpowiada za hosta współdzielonego narzędzia `message`, integrację z promptem, ewidencję sesji i wątków oraz przekazywanie wykonania
- pluginy kanałów odpowiadają za wykrywanie działań w danym zakresie, wykrywanie możliwości oraz wszelkie fragmenty schematu właściwe dla kanału
- pluginy kanałów odpowiadają za gramatykę konwersacji sesji właściwą dla dostawcy, na przykład sposób kodowania identyfikatorów wątków w identyfikatorach konwersacji lub ich dziedziczenia z konwersacji nadrzędnych
- pluginy kanałów wykonują końcowe działanie za pośrednictwem własnego adaptera działań

W przypadku pluginów kanałów powierzchnią SDK jest `ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania pozwala pluginowi zwrócić jednocześnie widoczne działania, możliwości i wkład w schemat, aby elementy te nie ulegały wzajemnemu rozjechaniu.

Gdy parametr narzędzia wiadomości właściwy dla kanału zawiera źródło multimediów, takie jak ścieżka lokalna lub zdalny adres URL multimediów, plugin powinien również zwrócić `mediaSourceParams` z `describeMessageTool(...)`. Rdzeń używa tej jawnej listy do normalizacji ścieżek piaskownicy oraz stosowania wskazówek dotyczących dostępu do wychodzących multimediów bez wpisywania na stałe nazw parametrów należących do pluginu. Preferuj w tym miejscu mapy ograniczone do konkretnych działań zamiast jednej płaskiej listy dla całego kanału, aby parametr multimediów używany tylko przez profil nie był normalizowany w niepowiązanych działaniach, takich jak `send`.

Rdzeń przekazuje zakres środowiska uruchomieniowego do tego etapu wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufany przychodzący `requesterSenderId`

Ma to znaczenie w przypadku pluginów zależnych od kontekstu. Kanał może ukrywać lub udostępniać działania dotyczące wiadomości zależnie od aktywnego konta, bieżącego pokoju, wątku lub wiadomości albo zaufanej tożsamości zgłaszającego, bez wpisywania na stałe w rdzeniowym narzędziu `message` rozgałęzień właściwych dla kanałów.

Dlatego zmiany routingu osadzonego modułu uruchamiającego nadal należą do zadań pluginu: moduł uruchamiający odpowiada za przekazanie bieżącej tożsamości czatu lub sesji do granicy wykrywania pluginu, aby współdzielone narzędzie `message` udostępniało w bieżącej turze właściwą powierzchnię należącą do kanału.

W przypadku pomocniczych mechanizmów wykonawczych należących do kanału wbudowane pluginy powinny przechowywać środowisko wykonawcze we własnych modułach. Rdzeń nie odpowiada już za środowiska uruchomieniowe działań na wiadomościach Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`. Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a wbudowane pluginy powinny importować własny lokalny kod środowiska uruchomieniowego bezpośrednio z należących do nich modułów.

Ta sama granica ma ogólne zastosowanie do elementów SDK nazwanych według dostawcy: rdzeń nie powinien importować charakterystycznych dla kanałów zbiorczych modułów pomocniczych dla Discord, Signal, Slack, WhatsApp ani podobnych pluginów. Jeśli rdzeń potrzebuje określonego zachowania, powinien korzystać z należącego do wbudowanego pluginu modułu zbiorczego `api.ts` / `runtime-api.ts` albo przekształcić tę potrzebę w wąską, ogólną możliwość we współdzielonym SDK.

Wbudowane pluginy podlegają tej samej zasadzie. Plik `runtime-api.ts` wbudowanego pluginu nie powinien ponownie eksportować jego własnej, markowej fasady `openclaw/plugin-sdk/<plugin-id>`. Takie markowe fasady pozostają warstwami zgodności dla zewnętrznych pluginów i starszych odbiorców, lecz wbudowane pluginy powinny używać lokalnych eksportów oraz wąskich, ogólnych podścieżek SDK, takich jak `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` lub `openclaw/plugin-sdk/webhook-ingress`. Nowy kod nie powinien dodawać fasad SDK właściwych dla identyfikatora pluginu, chyba że wymaga tego granica zgodności istniejącego zewnętrznego ekosystemu.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` jest współdzieloną ścieżką bazową dla kanałów pasujących do wspólnego modelu ankiet
- `actions.handleAction("poll")` jest preferowaną ścieżką dla właściwej dla kanału semantyki ankiet lub dodatkowych parametrów ankiety

Rdzeń odkłada teraz współdzielone analizowanie ankiety do momentu, gdy przekazanie ankiety do pluginu odrzuci działanie, dzięki czemu należące do pluginów procedury obsługi ankiet mogą przyjmować pola ankiety właściwe dla kanału bez wcześniejszego blokowania przez ogólny parser ankiet.

Pełną sekwencję uruchamiania opisano w dokumencie [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności **firmy** lub **funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- plugin firmy powinien zwykle odpowiadać za wszystkie powierzchnie tej firmy dostępne w OpenClaw
- plugin funkcji powinien zwykle odpowiadać za całą wprowadzaną przez siebie powierzchnię funkcji
- kanały powinny korzystać ze współdzielonych możliwości rdzenia zamiast doraźnie ponownie implementować zachowanie dostawcy

<AccordionGroup>
  <Accordion title="Dostawca obsługujący wiele możliwości">
    `google` odpowiada za wnioskowanie tekstowe, zaplecze CLI, osadzenia, mowę, głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów, muzyki i wideo oraz wyszukiwanie w internecie. `openai` odpowiada za wnioskowanie tekstowe, osadzenia, mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie multimediów oraz generowanie obrazów i wideo. `minimax` odpowiada za wnioskowanie tekstowe, a także rozumienie multimediów, mowę, generowanie obrazów, muzyki i wideo oraz wyszukiwanie w internecie.
  </Accordion>
  <Accordion title="Dostawca obsługujący jedną możliwość">
    `arcee` i `chutes` odpowiadają wyłącznie za wnioskowanie tekstowe; `microsoft` odpowiada wyłącznie za mowę. Plugin dostawcy może pozostać tak wąski, dopóki nie będzie musiał objąć większej części powierzchni tego dostawcy.
  </Accordion>
  <Accordion title="Plugin funkcji">
    `voice-call` odpowiada za transport połączeń, narzędzia, CLI, trasy i mostkowanie strumieni multimedialnych Twilio, lecz korzysta ze współdzielonych możliwości mowy, transkrypcji w czasie rzeczywistym i głosu w czasie rzeczywistym zamiast bezpośrednio importować pluginy dostawców.
  </Accordion>
</AccordionGroup>

Docelowy stan wygląda następująco:

- powierzchnia dostawcy dostępna w OpenClaw znajduje się w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i wideo
- inni dostawcy mogą zrobić to samo dla własnego zakresu powierzchni
- kanałów nie interesuje, który plugin dostawcy odpowiada za danego dostawcę; korzystają ze współdzielonego kontraktu możliwości udostępnianego przez rdzeń

Kluczowe rozróżnienie jest następujące:

- **plugin** = granica własności
- **możliwość** = kontrakt rdzenia, który może być implementowany lub używany przez wiele pluginów

Jeśli więc OpenClaw dodaje nową dziedzinę, taką jak wideo, pierwsze pytanie nie brzmi „który dostawca powinien mieć na stałe zakodowaną obsługę wideo?”. Pierwsze pytanie brzmi „jaki jest kontrakt podstawowej możliwości wideo?”. Po utworzeniu tego kontraktu pluginy dostawców mogą się względem niego rejestrować, a pluginy kanałów i funkcji mogą z niego korzystać.

Jeśli dana możliwość jeszcze nie istnieje, właściwy sposób działania zwykle wygląda następująco:

<Steps>
  <Step title="Zdefiniuj możliwość">
    Zdefiniuj brakującą możliwość w rdzeniu.
  </Step>
  <Step title="Udostępnij przez SDK">
    Udostępnij ją w sposób typowany przez interfejs API lub środowisko uruchomieniowe pluginu.
  </Step>
  <Step title="Podłącz odbiorców">
    Podłącz kanały i funkcje do tej możliwości.
  </Step>
  <Step title="Implementacje dostawców">
    Pozwól pluginom dostawców rejestrować implementacje.
  </Step>
</Steps>

Pozwala to zachować jawną własność, unikając jednocześnie zachowania rdzenia zależnego od jednego dostawcy lub jednorazowej ścieżki kodu właściwej dla pluginu.

### Warstwy możliwości

Przy podejmowaniu decyzji o umiejscowieniu kodu używaj następującego modelu myślowego:

<Tabs>
  <Tab title="Warstwa możliwości rdzenia">
    Współdzielona orkiestracja, zasady, mechanizmy rezerwowe, reguły scalania konfiguracji, semantyka dostarczania i typowane kontrakty.
  </Tab>
  <Tab title="Warstwa pluginu dostawcy">
    Interfejsy API właściwe dla dostawcy, uwierzytelnianie, katalogi modeli, synteza mowy, generowanie obrazów, zaplecza wideo i punkty końcowe użycia.
  </Tab>
  <Tab title="Warstwa pluginu kanału lub funkcji">
    Integracja Discord, Slack, `voice-call` itp., która korzysta z możliwości rdzenia i udostępnia je na danej powierzchni.
  </Tab>
</Tabs>

Na przykład TTS działa według tego modelu:

- rdzeń odpowiada za zasady TTS podczas generowania odpowiedzi, kolejność mechanizmów rezerwowych, preferencje i dostarczanie do kanałów
- `elevenlabs`, `google`, `microsoft` i `openai` odpowiadają za implementacje syntezy
- `voice-call` korzysta z pomocniczego środowiska uruchomieniowego TTS dla telefonii

Ten sam wzorzec powinien być preferowany w przypadku przyszłych możliwości.

### Przykład firmowego pluginu obsługującego wiele możliwości

Plugin firmy powinien z zewnątrz tworzyć spójną całość. Jeśli OpenClaw ma współdzielone kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, generowania wideo, pobierania treści z internetu i wyszukiwania w internecie, dostawca może odpowiadać za wszystkie swoje powierzchnie w jednym miejscu:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Nie są istotne dokładne nazwy funkcji pomocniczych. Istotna jest struktura:

- jeden plugin odpowiada za powierzchnię dostawcy
- rdzeń nadal odpowiada za kontrakty możliwości
- kanały i pluginy funkcji korzystają z funkcji pomocniczych `api.runtime.*`, a nie z kodu dostawcy
- testy kontraktowe mogą potwierdzać, że plugin zarejestrował możliwości, za które deklaruje odpowiedzialność

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów, dźwięku i wideo jako jedną współdzieloną możliwość. Obowiązuje tam ten sam model własności:

<Steps>
  <Step title="Rdzeń definiuje kontrakt">
    Rdzeń definiuje kontrakt rozumienia multimediów.
  </Step>
  <Step title="Pluginy dostawców się rejestrują">
    Pluginy dostawców rejestrują odpowiednio `describeImage`, `transcribeAudio` i `describeVideo`.
  </Step>
  <Step title="Odbiorcy korzystają ze współdzielonego zachowania">
    Kanały i pluginy funkcji korzystają ze współdzielonego zachowania rdzenia zamiast łączyć się bezpośrednio z kodem dostawcy.
  </Step>
</Steps>

Pozwala to uniknąć wbudowywania założeń jednego dostawcy dotyczących wideo w rdzeń. Plugin odpowiada za powierzchnię dostawcy, a rdzeń za kontrakt możliwości i zachowanie mechanizmu rezerwowego.

Generowanie wideo korzysta już z tej samej sekwencji: rdzeń odpowiada za typowany kontrakt możliwości i pomocniczy mechanizm środowiska uruchomieniowego, a pluginy dostawców rejestrują względem niego implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz [Przewodnik po możliwościach](/pl/plugins/adding-capabilities).

## Kontrakty i ich egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w `OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz pomocnicze funkcje środowiska wykonawczego, na których plugin może polegać.

Dlaczego ma to znaczenie:

- autorzy pluginów otrzymują jeden stabilny standard wewnętrzny
- rdzeń może odrzucać zduplikowane prawa własności, na przykład gdy dwa pluginy rejestrują ten sam identyfikator dostawcy
- podczas uruchamiania mogą być wyświetlane praktyczne informacje diagnostyczne dotyczące nieprawidłowej rejestracji
- testy kontraktowe mogą egzekwować prawa własności wbudowanych pluginów i zapobiegać niezauważalnym rozbieżnościom

Egzekwowanie odbywa się na dwóch poziomach:

<AccordionGroup>
  <Accordion title="Egzekwowanie rejestracji w czasie wykonywania">
    Rejestr pluginów weryfikuje rejestracje podczas ich ładowania. Przykładowo zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców syntezy mowy oraz nieprawidłowe rejestracje generują informacje diagnostyczne pluginów zamiast niezdefiniowanego zachowania.
  </Accordion>
  <Accordion title="Testy kontraktowe">
    Podczas testów wbudowane pluginy są rejestrowane w rejestrach kontraktowych, dzięki czemu OpenClaw może jednoznacznie weryfikować prawa własności. Obecnie mechanizm ten jest używany w przypadku dostawców modeli, dostawców syntezy mowy, dostawców wyszukiwania internetowego oraz praw własności do wbudowanych rejestracji.
  </Accordion>
</AccordionGroup>

W praktyce OpenClaw z góry wie, który plugin jest właścicielem danej powierzchni. Dzięki temu rdzeń i kanały mogą płynnie ze sobą współdziałać, ponieważ prawa własności są deklarowane, typowane i testowalne, a nie niejawne.

### Co powinien obejmować kontrakt

<Tabs>
  <Tab title="Dobre kontrakty">
    - typowane
    - niewielkie
    - właściwe dla określonej możliwości
    - należące do rdzenia
    - wielokrotnego użytku przez wiele pluginów
    - możliwe do użycia przez kanały i funkcje bez znajomości dostawcy

  </Tab>
  <Tab title="Złe kontrakty">
    - zasady właściwe dla dostawcy ukryte w rdzeniu
    - jednorazowe mechanizmy obejścia dla pluginów, które pomijają rejestr
    - kod kanału odwołujący się bezpośrednio do implementacji dostawcy
    - doraźne obiekty środowiska wykonawczego, które nie są częścią `OpenClawPluginApi` ani `api.runtime`

  </Tab>
</Tabs>

W razie wątpliwości należy podnieść poziom abstrakcji: najpierw zdefiniować możliwość, a następnie pozwolić pluginom się z nią integrować.

## Model wykonywania

Natywne pluginy OpenClaw działają **w procesie** wraz z Gateway. Nie są izolowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co kod rdzenia.

<Warning>
Konsekwencje używania natywnych pluginów: plugin może rejestrować narzędzia, procedury obsługi sieci, punkty zaczepienia i usługi; błąd pluginu może spowodować awarię lub destabilizację Gateway; złośliwy natywny plugin jest równoważny wykonaniu dowolnego kodu wewnątrz procesu OpenClaw.
</Warning>

Zgodne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je jako pakiety metadanych lub treści. W bieżących wydaniach oznacza to głównie dołączone Skills.

W przypadku pluginów, które nie są wbudowane, należy używać list dozwolonych elementów oraz jawnych ścieżek instalacji i ładowania. Pluginy przestrzeni roboczej należy traktować jako kod używany podczas programowania, a nie jako domyślny kod produkcyjny.

W przypadku nazw wbudowanych pakietów przestrzeni roboczej identyfikator pluginu powinien być zakotwiczony w nazwie npm: domyślnie `@openclaw/<id>` albo z zatwierdzonym, typowanym sufiksem, takim jak `-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy pakiet celowo udostępnia węższą rolę pluginu.

<Note>
**Uwaga dotycząca zaufania:** `plugins.allow` ustanawia zaufanie do **identyfikatorów pluginów**, a nie do pochodzenia źródła. Plugin przestrzeni roboczej o tym samym identyfikatorze co wbudowany plugin celowo zastępuje wbudowaną kopię, gdy ten plugin przestrzeni roboczej jest włączony lub znajduje się na liście dozwolonych elementów. Jest to normalne i przydatne podczas lokalnego programowania, testowania poprawek oraz wdrażania pilnych poprawek. Zaufanie do wbudowanego pluginu jest ustalane na podstawie migawki źródła — manifestu i kodu znajdujących się na dysku w chwili ładowania — a nie metadanych instalacji. Uszkodzony lub podmieniony rekord instalacji nie może niezauważalnie rozszerzyć powierzchni zaufania wbudowanego pluginu poza zakres deklarowany przez rzeczywiste źródło.
</Note>

## Granica eksportu

OpenClaw eksportuje możliwości, a nie udogodnienia implementacyjne.

Rejestracja możliwości powinna pozostać publiczna. Należy ograniczyć eksport pomocniczych elementów, które nie stanowią kontraktu:

- podścieżki funkcji pomocniczych właściwych dla wbudowanych pluginów
- podścieżki infrastruktury środowiska wykonawczego, które nie są przeznaczone jako publiczne API
- funkcje pomocnicze właściwe dla dostawcy
- funkcje pomocnicze konfiguracji i wdrażania początkowego, które są szczegółami implementacyjnymi

Zarezerwowane podścieżki funkcji pomocniczych wbudowanych pluginów zostały wycofane z wygenerowanej mapy eksportu SDK. Funkcje pomocnicze właściwe dla właściciela należy przechowywać w pakiecie pluginu należącym do tego właściciela; tylko zachowania hosta wielokrotnego użytku należy przenosić do ogólnych kontraktów SDK, takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.

## Szczegóły wewnętrzne i materiały referencyjne

Informacje o potoku ładowania, modelu rejestru, punktach zaczepienia środowiska wykonawczego dostawców, trasach HTTP Gateway, schematach narzędzi wiadomości, rozpoznawaniu elementów docelowych kanałów, katalogach dostawców, pluginach mechanizmu kontekstu oraz przewodnik dotyczący dodawania nowej możliwości zawiera strona [Szczegóły wewnętrzne architektury pluginów](/pl/plugins/architecture-internals).

## Powiązane materiały

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Manifest pluginu](/pl/plugins/manifest)
- [Konfiguracja SDK pluginów](/pl/plugins/sdk-setup)
