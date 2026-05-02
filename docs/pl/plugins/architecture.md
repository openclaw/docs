---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości Plugin lub granic własności
    - Praca nad potokiem ładowania Plugin lub rejestrem
    - Implementowanie hooków środowiska uruchomieniowego dostawcy lub Pluginów kanałów
sidebarTitle: Internals
summary: 'Wewnętrzne mechanizmy Plugin: model możliwości, własność, kontrakty, potok ładowania i pomocnicze funkcje środowiska uruchomieniowego'
title: Mechanizmy wewnętrzne Plugin
x-i18n:
    generated_at: "2026-05-02T09:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

To jest **szczegółowa dokumentacja architektury** systemu Plugin w OpenClaw. Praktyczne przewodniki znajdziesz na jednej z poniższych wyspecjalizowanych stron.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie pluginów" icon="plug" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący dodawania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Tworzenie pluginów" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek pierwszego pluginu z najmniejszym działającym manifestem.
  </Card>
  <Card title="Pluginy kanałów" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału komunikacyjnego.
  </Card>
  <Card title="Pluginy dostawców" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modeli.
  </Card>
  <Card title="Przegląd SDK" icon="book" href="/pl/plugins/sdk-overview">
    Dokumentacja mapy importów i API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości są publicznym modelem **natywnego pluginu** w OpenClaw. Każdy natywny plugin OpenClaw rejestruje się dla co najmniej jednego typu możliwości:

| Możliwość              | Metoda rejestracji                              | Przykładowe pluginy                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Wnioskowanie tekstowe  | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Mowa                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`     | `openai`                             |
| Rozumienie mediów      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Wykrywanie Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin, który nie rejestruje żadnych możliwości, ale udostępnia haki, narzędzia, usługi wykrywania lub usługi działające w tle, jest **starszym pluginem wyłącznie z hakami**. Ten wzorzec jest nadal w pełni obsługiwany.
</Note>

### Stanowisko dotyczące kompatybilności zewnętrznej

Model możliwości jest wdrożony w rdzeniu i używany obecnie przez dołączone/natywne pluginy, ale kompatybilność zewnętrznych pluginów nadal wymaga wyższego standardu niż „jest eksportowane, więc jest zamrożone”.

| Sytuacja pluginu                                  | Wskazówki                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Istniejące pluginy zewnętrzne                     | Utrzymuj działanie integracji opartych na hakach; to jest bazowy poziom kompatybilności.         |
| Nowe dołączone/natywne pluginy                    | Preferuj jawną rejestrację możliwości zamiast sięgania do szczegółów dostawcy lub nowych projektów wyłącznie z hakami. |
| Pluginy zewnętrzne wdrażające rejestrację możliwości | Dozwolone, ale traktuj powierzchnie pomocnicze specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości jest zamierzonym kierunkiem. Starsze haki pozostają najbezpieczniejszą ścieżką bez ryzyka przerwania działania zewnętrznych pluginów w okresie przejściowym. Eksportowane ścieżki pomocnicze nie są równoważne — preferuj wąskie, udokumentowane kontrakty zamiast przypadkowych eksportów pomocniczych.

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do kształtu na podstawie jego rzeczywistego zachowania rejestracyjnego, a nie tylko statycznych metadanych:

<AccordionGroup>
  <Accordion title="plain-capability">
    Rejestruje dokładnie jeden typ możliwości, na przykład plugin wyłącznie dostawcy, taki jak `mistral`.
  </Accordion>
  <Accordion title="hybrid-capability">
    Rejestruje wiele typów możliwości, na przykład `openai` obejmuje wnioskowanie tekstowe, mowę, rozumienie mediów i generowanie obrazów.
  </Accordion>
  <Accordion title="hook-only">
    Rejestruje tylko haki, typowane lub niestandardowe, bez możliwości, narzędzi, poleceń ani usług.
  </Accordion>
  <Accordion title="non-capability">
    Rejestruje narzędzia, polecenia, usługi lub trasy, ale bez możliwości.
  </Accordion>
</AccordionGroup>

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i podział jego możliwości. Szczegóły znajdziesz w [dokumentacji CLI](/pl/cli/plugins#inspect).

### Starsze haki

Hak `before_agent_start` pozostaje obsługiwany jako ścieżka kompatybilności dla pluginów wyłącznie z hakami. Starsze pluginy używane w praktyce nadal od niego zależą.

Kierunek:

- utrzymać jego działanie
- udokumentować go jako starszy mechanizm
- preferować `before_model_resolve` do pracy nad nadpisywaniem modelu/dostawcy
- preferować `before_prompt_build` do pracy nad mutacją promptu
- usunąć dopiero po spadku rzeczywistego użycia i gdy pokrycie fixtures potwierdzi bezpieczeństwo migracji

### Sygnały kompatybilności

Po uruchomieniu `openclaw doctor` lub `openclaw plugins inspect <id>` możesz zobaczyć jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja parsuje się poprawnie, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca, np. `hook-only` |
| **legacy warning**         | Plugin używa `before_agent_start`, który jest przestarzały   |
| **hard error**             | Konfiguracja jest nieprawidłowa lub nie udało się załadować pluginu |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego pluginu: `hook-only` jest komunikatem doradczym, a `before_agent_start` wywołuje tylko ostrzeżenie. Te sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

<Steps>
  <Step title="Manifest i wykrywanie">
    OpenClaw znajduje kandydatów na pluginy w skonfigurowanych ścieżkach, katalogach głównych obszarów roboczych, globalnych katalogach głównych pluginów oraz dołączonych pluginach. Wykrywanie najpierw odczytuje natywne manifesty `openclaw.plugin.json` oraz obsługiwane manifesty pakietów.
  </Step>
  <Step title="Włączanie i walidacja">
    Rdzeń decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany albo wybrany do wyłącznego slotu, takiego jak pamięć.
  </Step>
  <Step title="Ładowanie w czasie działania">
    Natywne pluginy OpenClaw są ładowane w procesie i rejestrują możliwości w centralnym rejestrze. Spakowany JavaScript ładuje się przez natywne `require`; lokalny kod źródłowy TypeScript innych firm jest awaryjną ścieżką Jiti. Kompatybilne pakiety są normalizowane do rekordów rejestru bez importowania kodu wykonywanego w czasie działania.
  </Step>
  <Step title="Korzystanie z powierzchni">
    Pozostała część OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację dostawców, haki, trasy HTTP, polecenia CLI i usługi.
  </Step>
</Steps>

W przypadku CLI pluginów wykrywanie poleceń głównych jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- właściwy moduł CLI pluginu może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw nadal może zarezerwować nazwy poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- walidacja manifestu/konfiguracji powinna działać na podstawie **metadanych manifestu/schematu** bez wykonywania kodu pluginu
- natywne wykrywanie możliwości może ładować zaufany kod wejściowy pluginu, aby zbudować nieaktywującą migawkę rejestru
- natywne zachowanie w czasie działania pochodzi ze ścieżki `register(api)` modułu pluginu z `api.registrationMode === "full"`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy oraz budować wskazówki UI/schematu, zanim pełny runtime będzie aktywny.

### Migawka metadanych pluginów i tabela wyszukiwania

Start Gateway buduje jedną `PluginMetadataSnapshot` dla bieżącej migawki konfiguracji. Migawka zawiera wyłącznie metadane: przechowuje indeks zainstalowanych pluginów, rejestr manifestów, diagnostykę manifestów, mapy właścicieli, normalizator identyfikatorów pluginów i rekordy manifestów. Nie przechowuje załadowanych modułów pluginów, SDK dostawców, zawartości pakietów ani eksportów runtime.

Walidacja konfiguracji świadoma pluginów, automatyczne włączanie podczas startu i bootstrap pluginów Gateway korzystają z tej migawki zamiast niezależnie przebudowywać metadane manifestu/indeksu. `PluginLookUpTable` jest wyprowadzana z tej samej migawki i dodaje plan pluginów startowych dla bieżącej konfiguracji runtime.

Po starcie Gateway utrzymuje bieżącą migawkę metadanych jako wymienny produkt runtime. Powtarzane wykrywanie dostawców w runtime może używać tej migawki zamiast rekonstruować zainstalowany indeks i rejestr manifestów dla każdego przebiegu katalogu dostawców. Migawka jest czyszczona lub zastępowana przy zamknięciu Gateway, zmianach konfiguracji/inwentarza pluginów oraz zapisach zainstalowanego indeksu; wywołujący wracają do zimnej ścieżki manifestu/indeksu, gdy nie istnieje kompatybilna bieżąca migawka. Kontrole kompatybilności muszą uwzględniać katalogi główne wykrywania pluginów, takie jak `plugins.load.paths`, oraz domyślny obszar roboczy agenta, ponieważ pluginy z obszaru roboczego należą do zakresu metadanych.

Migawka i tabela wyszukiwania utrzymują powtarzane decyzje startowe na szybkiej ścieżce:

- własność kanałów
- odroczony start kanałów
- identyfikatory pluginów startowych
- własność dostawców i backendów CLI
- własność dostawcy konfiguracji, aliasu polecenia, dostawcy katalogu modeli i kontraktu manifestu
- walidacja schematu konfiguracji pluginu i schematu konfiguracji kanału
- decyzje automatycznego włączania podczas startu

Granicą bezpieczeństwa jest zastępowanie migawki, a nie jej mutowanie. Przebuduj migawkę, gdy zmienia się konfiguracja, inwentarz pluginów, rekordy instalacji lub utrwalona polityka indeksu. Nie traktuj jej jako szerokiego, mutowalnego rejestru globalnego i nie przechowuj nieograniczonej historii migawek. Ładowanie pluginów w runtime pozostaje oddzielone od migawek metadanych, aby nieaktualny stan runtime nie mógł zostać ukryty za cache metadanych.

Zasada cache jest udokumentowana w [wewnętrznej architekturze pluginów](/pl/plugins/architecture-internals#plugin-cache-boundary): metadane manifestu i wykrywania są świeże, chyba że wywołujący posiada jawną migawkę, tabelę wyszukiwania lub rejestr manifestów dla bieżącego przepływu. Ukryte cache metadanych i TTL oparte na zegarze ściennym nie są częścią ładowania pluginów. Tylko cache loadera runtime, modułów i artefaktów zależności mogą pozostać po faktycznym załadowaniu kodu lub zainstalowanych artefaktów.

Niektórzy wywołujący na zimnej ścieżce nadal rekonstruują rejestry manifestów bezpośrednio z utrwalonego indeksu zainstalowanych pluginów, zamiast otrzymywać `PluginLookUpTable` z Gateway. Ta ścieżka rekonstruuje teraz rejestr na żądanie; preferuj przekazywanie bieżącej tabeli wyszukiwania lub jawnego rejestru manifestów przez przepływy runtime, gdy wywołujący już taki obiekt posiada.

### Planowanie aktywacji

Planowanie aktywacji jest częścią płaszczyzny sterowania. Wywołujący mogą zapytać, które pluginy są istotne dla konkretnego polecenia, dostawcy, kanału, trasy, harnessu agenta lub możliwości, zanim załadują szersze rejestry runtime.

Planner zachowuje kompatybilność z obecnym zachowaniem manifestu:

- pola `activation.*` są jawnymi wskazówkami plannera
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i haki pozostają fallbackiem własności z manifestu
- API plannera obejmujące tylko identyfikatory pozostaje dostępne dla istniejących wywołujących
- API planu raportuje etykiety powodów, aby diagnostyka mogła odróżnić jawne wskazówki od fallbacku własności

<Warning>
Nie traktuj `activation` jako haka cyklu życia ani zamiennika `register(...)`. To metadane używane do zawężania ładowania. Preferuj pola własności, gdy już opisują relację; używaj `activation` tylko do dodatkowych wskazówek dla planera.
</Warning>

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia wysyłania/edycji/reakcji dla zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu, a Pluginy kanałów są właścicielami specyficznego dla kanału wykrywania i wykonywania stojącego za nim.

Obecna granica jest następująca:

- rdzeń jest właścicielem hosta współdzielonego narzędzia `message`, okablowania promptów, ewidencji sesji/wątków oraz dyspozycji wykonania
- Pluginy kanałów są właścicielami wykrywania działań w zakresie, wykrywania możliwości oraz wszelkich specyficznych dla kanału fragmentów schematu
- Pluginy kanałów są właścicielami specyficznej dla dostawcy gramatyki konwersacji sesji, na przykład tego, jak identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą z konwersacji nadrzędnych
- Pluginy kanałów wykonują końcowe działanie przez swój adapter działań

Dla Pluginów kanałów powierzchnią SDK jest `ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania pozwala Pluginowi zwrócić widoczne działania, możliwości i wkłady do schematu razem, aby te elementy się nie rozjeżdżały.

Gdy specyficzny dla kanału parametr narzędzia wiadomości niesie źródło multimediów, takie jak ścieżka lokalna lub zdalny URL multimediów, Plugin powinien także zwrócić `mediaSourceParams` z `describeMessageTool(...)`. Rdzeń używa tej jawnej listy, aby stosować normalizację ścieżek sandboxa i wskazówki dotyczące wychodzącego dostępu do multimediów bez twardego kodowania nazw parametrów należących do Pluginu. Preferuj tam mapy w zakresie działania, a nie jedną płaską listę dla całego kanału, aby parametr multimediów tylko dla profilu nie był normalizowany przy niepowiązanych działaniach, takich jak `send`.

Rdzeń przekazuje zakres środowiska wykonawczego do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufany przychodzący `requesterSenderId`

Ma to znaczenie dla Pluginów wrażliwych na kontekst. Kanał może ukrywać lub ujawniać działania wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości albo zaufanej tożsamości żądającego bez twardego kodowania specyficznych dla kanału gałęzi w rdzeniowym narzędziu `message`.

Dlatego zmiany routingu osadzonego runnera nadal są pracą Pluginu: runner odpowiada za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania Pluginu, aby współdzielone narzędzie `message` ujawniało właściwą, należącą do kanału powierzchnię dla bieżącej tury.

W przypadku należących do kanału helperów wykonania wbudowane Pluginy powinny utrzymywać środowisko wykonawcze wykonania we własnych modułach rozszerzeń. Rdzeń nie jest już właścicielem środowisk wykonawczych działań wiadomości Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`. Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a wbudowane Pluginy powinny importować własny lokalny kod środowiska wykonawczego bezpośrednio z należących do ich rozszerzeń modułów.

Ta sama granica dotyczy ogólnie seamów SDK nazwanych według dostawców: rdzeń nie powinien importować specyficznych dla kanału wygodnych barreli dla Slack, Discord, Signal, WhatsApp ani podobnych rozszerzeń. Jeśli rdzeń potrzebuje zachowania, powinien albo użyć własnego barrela `api.ts` / `runtime-api.ts` wbudowanego Pluginu, albo podnieść potrzebę do wąskiej ogólnej możliwości we współdzielonym SDK.

Wbudowane Pluginy stosują tę samą zasadę. `runtime-api.ts` wbudowanego Pluginu nie powinien ponownie eksportować własnej markowej fasady `openclaw/plugin-sdk/<plugin-id>`. Te markowe fasady pozostają shimami zgodności dla zewnętrznych Pluginów i starszych konsumentów, ale wbudowane Pluginy powinny używać lokalnych eksportów oraz wąskich ogólnych podścieżek SDK, takich jak `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` lub `openclaw/plugin-sdk/webhook-ingress`. Nowy kod nie powinien dodawać fasad SDK specyficznych dla identyfikatora Pluginu, chyba że wymaga tego granica zgodności dla istniejącego zewnętrznego ekosystemu.

W przypadku ankiet konkretnie istnieją dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów pasujących do wspólnego modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla specyficznej dla kanału semantyki ankiet lub dodatkowych parametrów ankiet

Rdzeń odracza teraz współdzielone parsowanie ankiet do momentu, gdy dyspozycja ankiety przez Plugin odrzuci działanie, dzięki czemu należące do Pluginu handlery ankiet mogą przyjmować specyficzne dla kanału pola ankiet bez wcześniejszego blokowania przez ogólny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w [Wewnętrznych aspektach architektury Pluginów](/pl/plugins/architecture-internals).

## Model własności możliwości

OpenClaw traktuje natywny Plugin jako granicę własności dla **firmy** lub **funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- Plugin firmy powinien zwykle posiadać wszystkie powierzchnie tej firmy zwrócone ku OpenClaw
- Plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny używać współdzielonych możliwości rdzenia zamiast implementować zachowanie dostawcy ad hoc

<AccordionGroup>
  <Accordion title="Dostawca z wieloma możliwościami">
    `openai` jest właścicielem inferencji tekstu, mowy, głosu w czasie rzeczywistym, rozumienia multimediów i generowania obrazów. `google` jest właścicielem inferencji tekstu oraz rozumienia multimediów, generowania obrazów i wyszukiwania w sieci. `qwen` jest właścicielem inferencji tekstu oraz rozumienia multimediów i generowania wideo.
  </Accordion>
  <Accordion title="Dostawca z jedną możliwością">
    `elevenlabs` i `microsoft` są właścicielami mowy; `firecrawl` jest właścicielem pobierania treści z sieci; `minimax` / `mistral` / `moonshot` / `zai` są właścicielami backendów rozumienia multimediów.
  </Accordion>
  <Accordion title="Plugin funkcji">
    `voice-call` jest właścicielem transportu połączeń, narzędzi, CLI, tras i mostkowania strumieni multimediów Twilio, ale używa współdzielonych możliwości mowy, transkrypcji w czasie rzeczywistym i głosu w czasie rzeczywistym zamiast bezpośrednio importować Pluginy dostawców.
  </Accordion>
</AccordionGroup>

Docelowy stan to:

- OpenAI żyje w jednym Pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i przyszłe wideo
- inny dostawca może zrobić to samo dla własnej powierzchni
- kanałów nie obchodzi, który Plugin dostawcy jest właścicielem providera; używają współdzielonego kontraktu możliwości ujawnianego przez rdzeń

To kluczowe rozróżnienie:

- **Plugin** = granica własności
- **możliwość** = kontrakt rdzenia, który wiele Pluginów może implementować lub używać

Jeśli więc OpenClaw dodaje nową domenę, taką jak wideo, pierwsze pytanie nie brzmi „który provider powinien twardo kodować obsługę wideo?”. Pierwsze pytanie brzmi „jaki jest rdzeniowy kontrakt możliwości wideo?”. Gdy ten kontrakt istnieje, Pluginy dostawców mogą się wobec niego rejestrować, a Pluginy kanałów/funkcji mogą go używać.

Jeśli możliwość jeszcze nie istnieje, właściwym ruchem jest zwykle:

<Steps>
  <Step title="Zdefiniuj możliwość">
    Zdefiniuj brakującą możliwość w rdzeniu.
  </Step>
  <Step title="Udostępnij przez SDK">
    Udostępnij ją przez API/środowisko wykonawcze Pluginu w typowany sposób.
  </Step>
  <Step title="Podłącz konsumentów">
    Podłącz kanały/funkcje do tej możliwości.
  </Step>
  <Step title="Implementacje dostawców">
    Pozwól Pluginom dostawców rejestrować implementacje.
  </Step>
</Steps>

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania rdzenia zależnego od jednego dostawcy lub jednorazowej ścieżki kodu specyficznej dla Pluginu.

### Warstwowanie możliwości

Używaj tego modelu mentalnego przy decydowaniu, gdzie powinien znaleźć się kod:

<Tabs>
  <Tab title="Warstwa możliwości rdzenia">
    Współdzielona orkiestracja, polityka, fallback, reguły scalania konfiguracji, semantyka dostarczania i typowane kontrakty.
  </Tab>
  <Tab title="Warstwa Pluginu dostawcy">
    Specyficzne dla dostawcy API, uwierzytelnianie, katalogi modeli, synteza mowy, generowanie obrazów, przyszłe backendy wideo, endpointy użycia.
  </Tab>
  <Tab title="Warstwa Pluginu kanału/funkcji">
    Integracja Slack/Discord/voice-call/itp., która używa możliwości rdzenia i prezentuje je na powierzchni.
  </Tab>
</Tabs>

Na przykład TTS ma taki kształt:

- rdzeń jest właścicielem polityki TTS w czasie odpowiedzi, kolejności fallbacków, preferencji i dostarczania kanałowego
- `openai`, `elevenlabs` i `microsoft` są właścicielami implementacji syntezy
- `voice-call` używa helpera środowiska wykonawczego TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład Pluginu firmy z wieloma możliwościami

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, generowania wideo, pobierania treści z sieci i wyszukiwania w sieci, dostawca może posiadać wszystkie swoje powierzchnie w jednym miejscu:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

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
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
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

Liczą się nie dokładne nazwy helperów. Liczy się kształt:

- jeden Plugin jest właścicielem powierzchni dostawcy
- rdzeń nadal jest właścicielem kontraktów możliwości
- kanały i Pluginy funkcji używają helperów `api.runtime.*`, a nie kodu dostawcy
- testy kontraktu mogą potwierdzać, że Plugin zarejestrował możliwości, których własność deklaruje

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazu/audio/wideo jako jedną współdzieloną możliwość. Ten sam model własności ma tam zastosowanie:

<Steps>
  <Step title="Rdzeń definiuje kontrakt">
    Rdzeń definiuje kontrakt rozumienia multimediów.
  </Step>
  <Step title="Pluginy dostawców rejestrują">
    Pluginy dostawców rejestrują `describeImage`, `transcribeAudio` i `describeVideo` tam, gdzie ma to zastosowanie.
  </Step>
  <Step title="Konsumenci używają współdzielonego zachowania">
    Kanały i Pluginy funkcji używają współdzielonego zachowania rdzenia zamiast bezpośrednio łączyć się z kodem dostawcy.
  </Step>
</Steps>

Pozwala to uniknąć wypalania założeń jednego providera dotyczących wideo w rdzeniu. Plugin jest właścicielem powierzchni dostawcy; rdzeń jest właścicielem kontraktu możliwości i zachowania fallbacku.

Generowanie wideo już używa tej samej sekwencji: rdzeń jest właścicielem typowanego kontraktu możliwości i helpera środowiska wykonawczego, a Pluginy dostawców rejestrują wobec niego implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz [Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API Pluginów jest celowo typowana i scentralizowana w `OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz helpery środowiska wykonawczego, na których Plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy Pluginów otrzymują jeden stabilny standard wewnętrzny
- rdzeń może odrzucać zduplikowaną własność, na przykład dwa Pluginy rejestrujące ten sam identyfikator providera
- uruchamianie może pokazywać praktyczne diagnostyki dla nieprawidłowej rejestracji
- testy kontraktu mogą egzekwować własność wbudowanych Pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

<AccordionGroup>
  <Accordion title="Egzekwowanie rejestracji w czasie działania">
    Rejestr Plugin weryfikuje rejestracje podczas ładowania Plugin. Przykłady: zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy oraz nieprawidłowo sformułowane rejestracje powodują diagnostykę Plugin zamiast niezdefiniowanego zachowania.
  </Accordion>
  <Accordion title="Testy kontraktu">
    Dołączone Plugin są przechwytywane w rejestrach kontraktów podczas uruchomień testów, aby OpenClaw mógł jawnie potwierdzić własność. Obecnie jest to używane dla dostawców modeli, dostawców mowy, dostawców wyszukiwania w sieci oraz własności dołączonych rejestracji.
  </Accordion>
</AccordionGroup>

Praktyczny efekt jest taki, że OpenClaw wie z góry, który Plugin jest właścicielem której powierzchni. Dzięki temu rdzeń i kanały mogą płynnie się łączyć, ponieważ własność jest deklarowana, typowana i testowalna, a nie niejawna.

### Co należy do kontraktu

<Tabs>
  <Tab title="Dobre kontrakty">
    - typowane
    - małe
    - specyficzne dla możliwości
    - należące do rdzenia
    - wielokrotnego użytku przez wiele Plugin
    - używalne przez kanały/funkcje bez wiedzy o dostawcy

  </Tab>
  <Tab title="Złe kontrakty">
    - polityka specyficzna dla dostawcy ukryta w rdzeniu
    - jednorazowe obejścia Plugin omijające rejestr
    - kod kanału sięgający bezpośrednio do implementacji dostawcy
    - doraźne obiekty czasu działania, które nie są częścią `OpenClawPluginApi` ani `api.runtime`

  </Tab>
</Tabs>

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a następnie pozwól Plugin się do niej podłączać.

## Model wykonywania

Natywne Plugin OpenClaw działają **w tym samym procesie** co Gateway. Nie są izolowane w piaskownicy. Załadowany natywny Plugin ma tę samą granicę zaufania na poziomie procesu co kod rdzenia.

<Warning>
Konsekwencje natywnego Plugin: Plugin może rejestrować narzędzia, procedury obsługi sieci, haki i usługi; błąd Plugin może spowodować awarię lub zdestabilizować gateway; a złośliwy natywny Plugin jest równoważny wykonaniu dowolnego kodu wewnątrz procesu OpenClaw.
</Warning>

Zgodne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie dołączone Skills.

Używaj list dozwolonych i jawnych ścieżek instalacji/ładowania dla niedołączonych Plugin. Traktuj Plugin obszaru roboczego jako kod na czas rozwoju, a nie domyślne ustawienia produkcyjne.

W przypadku dołączonych nazw pakietów obszaru roboczego utrzymuj identyfikator Plugin zakotwiczony w nazwie npm: domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks, taki jak `-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy pakiet celowo udostępnia węższą rolę Plugin.

<Note>
**Uwaga dotycząca zaufania:** `plugins.allow` ufa **identyfikatorom Plugin**, a nie pochodzeniu źródła. Plugin obszaru roboczego z tym samym identyfikatorem co dołączony Plugin celowo przesłania dołączoną kopię, gdy ten Plugin obszaru roboczego jest włączony/na liście dozwolonych. Jest to normalne i przydatne przy lokalnym rozwoju, testowaniu poprawek i hotfixach. Zaufanie do dołączonego Plugin jest rozstrzygane na podstawie migawki źródła — manifestu i kodu na dysku w czasie ładowania — a nie na podstawie metadanych instalacji. Uszkodzony lub podmieniony rekord instalacji nie może po cichu rozszerzyć powierzchni zaufania dołączonego Plugin poza to, co deklaruje rzeczywiste źródło.
</Note>

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodę implementacji.

Utrzymuj rejestrację możliwości jako publiczną. Przycinaj eksporty pomocnicze niebędące kontraktem:

- ścieżki podrzędne pomocników specyficznych dla dołączonego Plugin
- ścieżki podrzędne instalacji czasu działania nieprzeznaczone jako publiczne API
- pomocniki wygody specyficzne dla dostawcy
- pomocniki konfiguracji/wdrażania użytkownika będące szczegółami implementacji

Zarezerwowane ścieżki podrzędne pomocników dołączonego Plugin zostały wycofane z wygenerowanej mapy eksportów SDK. Trzymaj pomocniki specyficzne dla właściciela w pakiecie Plugin, który jest ich właścicielem; promuj tylko zachowanie hosta wielokrotnego użytku do ogólnych kontraktów SDK, takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.

## Szczegóły wewnętrzne i odniesienie

Informacje o potoku ładowania, modelu rejestru, hakach czasu działania dostawców, trasach HTTP Gateway, schematach narzędzi wiadomości, rozwiązywaniu celów kanałów, katalogach dostawców, Plugin silnika kontekstu oraz przewodniku dodawania nowej możliwości znajdziesz w [Szczegółach wewnętrznych architektury Plugin](/pl/plugins/architecture-internals).

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Manifest Plugin](/pl/plugins/manifest)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
