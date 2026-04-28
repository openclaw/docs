---
read_when:
    - Budowanie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości pluginów lub granic własności
    - Praca nad potokiem ładowania pluginów lub rejestrem
    - Implementowanie haków środowiska uruchomieniowego dostawcy lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wewnętrzne elementy Plugin: model możliwości, własność, kontrakty, potok ładowania i pomocniki środowiska uruchomieniowego'
title: Wewnętrzne elementy Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

To jest **szczegółowe odniesienie architektoniczne** dla systemu pluginów OpenClaw. Aby uzyskać praktyczne przewodniki, zacznij od jednej z poniższych stron tematycznych.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie pluginów" icon="plug" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący dodawania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Budowanie pluginów" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek pierwszego pluginu z najmniejszym działającym manifestem.
  </Card>
  <Card title="Pluginy kanałów" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału komunikacyjnego.
  </Card>
  <Card title="Pluginy dostawców" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modeli.
  </Card>
  <Card title="Przegląd SDK" icon="book" href="/pl/plugins/sdk-overview">
    Mapa importów i odniesienie do API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości to publiczny model **natywnych pluginów** wewnątrz OpenClaw. Każdy natywny plugin OpenClaw rejestruje się względem co najmniej jednego typu możliwości:

| Możliwość             | Metoda rejestracji                              | Przykładowe pluginy                 |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Wnioskowanie tekstowe | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`               |
| Mowa                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`   | `openai`                            |
| Rozumienie multimediów | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                  |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki    | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Pobieranie z sieci    | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Wyszukiwanie w sieci  | `api.registerWebSearchProvider(...)`            | `google`                            |
| Kanał / komunikacja   | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |
| Wykrywanie Gateway    | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                           |

<Note>
Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia, usługi wykrywania lub usługi działające w tle, jest **starszym pluginem wyłącznie z hookami**. Ten wzorzec jest nadal w pełni obsługiwany.
</Note>

### Podejście do zgodności zewnętrznej

Model możliwości został wdrożony w rdzeniu i jest dziś używany przez dołączone/natywne pluginy, ale zgodność zewnętrznych pluginów nadal wymaga wyższego progu niż „jest eksportowane, więc jest zamrożone”.

| Sytuacja pluginu                              | Wskazówki                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Istniejące pluginy zewnętrzne                 | Utrzymuj działanie integracji opartych na hookach; to jest bazowy poziom zgodności.             |
| Nowe dołączone/natywne pluginy                | Preferuj jawną rejestrację możliwości zamiast sięgania do elementów specyficznych dla dostawcy lub nowych projektów wyłącznie opartych na hookach. |
| Zewnętrzne pluginy przyjmujące rejestrację możliwości | Dozwolone, ale traktuj powierzchnie pomocnicze specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości jest zamierzonym kierunkiem. Starsze hooki pozostają najbezpieczniejszą ścieżką bez naruszeń dla zewnętrznych pluginów w trakcie przejścia. Eksportowane podścieżki pomocnicze nie są sobie równe — preferuj wąskie, udokumentowane kontrakty zamiast przypadkowych eksportów pomocniczych.

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do określonego kształtu na podstawie jego rzeczywistego zachowania przy rejestracji (a nie tylko statycznych metadanych):

<AccordionGroup>
  <Accordion title="plain-capability">
    Rejestruje dokładnie jeden typ możliwości (na przykład plugin tylko dostawcy, taki jak `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Rejestruje wiele typów możliwości (na przykład `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie multimediów i generowanie obrazów).
  </Accordion>
  <Accordion title="hook-only">
    Rejestruje wyłącznie hooki (typowane lub niestandardowe), bez możliwości, narzędzi, poleceń ani usług.
  </Accordion>
  <Accordion title="non-capability">
    Rejestruje narzędzia, polecenia, usługi lub trasy, ale bez możliwości.
  </Accordion>
</AccordionGroup>

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i podział możliwości. Szczegóły znajdziesz w [odniesieniu do CLI](/pl/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla pluginów wyłącznie z hookami. Nadal zależą od niego starsze pluginy używane w praktyce.

Kierunek:

- utrzymać jego działanie
- dokumentować go jako starszy
- preferować `before_model_resolve` dla pracy nad zastępowaniem modelu/dostawcy
- preferować `before_prompt_build` dla pracy nad modyfikacją promptu
- usuwać dopiero wtedy, gdy rzeczywiste użycie spadnie, a pokrycie przez fixture potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Po uruchomieniu `openclaw doctor` lub `openclaw plugins inspect <id>` możesz zobaczyć jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja poprawnie się parsuje, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe   |
| **hard error**             | Konfiguracja jest nieprawidłowa lub plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego pluginu: `hook-only` ma charakter doradczy, a `before_agent_start` wywołuje jedynie ostrzeżenie. Te sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

<Steps>
  <Step title="Manifest + wykrywanie">
    OpenClaw znajduje kandydatów na pluginy z skonfigurowanych ścieżek, katalogów głównych przestrzeni roboczych, globalnych katalogów głównych pluginów i dołączonych pluginów. Wykrywanie najpierw odczytuje natywne manifesty `openclaw.plugin.json` oraz obsługiwane manifesty pakietów.
  </Step>
  <Step title="Włączanie + walidacja">
    Rdzeń decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany czy wybrany dla wyłącznego gniazda, takiego jak pamięć.
  </Step>
  <Step title="Ładowanie środowiska uruchomieniowego">
    Natywne pluginy OpenClaw są ładowane w procesie przez jiti i rejestrują możliwości w centralnym rejestrze. Zgodne pakiety są normalizowane do rekordów rejestru bez importowania kodu środowiska uruchomieniowego.
  </Step>
  <Step title="Wykorzystanie powierzchni">
    Pozostała część OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację dostawców, hooki, trasy HTTP, polecenia CLI i usługi.
  </Step>
</Steps>

W przypadku CLI pluginów wykrywanie poleceń głównych jest konkretnie podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI pluginu może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw nadal może zarezerwować nazwy poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- walidacja manifestu/konfiguracji powinna działać na podstawie **metadanych manifestu/schematu** bez wykonywania kodu pluginu
- wykrywanie natywnych możliwości może ładować kod wejściowy zaufanego pluginu, aby zbudować nieaktywujący snapshot rejestru
- natywne zachowanie środowiska uruchomieniowego pochodzi ze ścieżki modułu pluginu `register(api)` z `api.registrationMode === "full"`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy oraz budować wskazówki interfejsu/schematu, zanim pełne środowisko uruchomieniowe stanie się aktywne.

### Planowanie aktywacji

Planowanie aktywacji jest częścią płaszczyzny sterowania. Wywołujący mogą zapytać, które pluginy są istotne dla konkretnego polecenia, dostawcy, kanału, trasy, harnessu agenta lub możliwości, zanim załadują szersze rejestry środowiska uruchomieniowego.

Planista zachowuje zgodność bieżącego zachowania manifestu:

- pola `activation.*` są jawnymi wskazówkami planisty
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki pozostają zapasowym źródłem własności manifestu
- API planisty zwracające tylko identyfikatory pozostaje dostępne dla istniejących wywołujących
- API planu raportuje etykiety powodów, aby diagnostyka mogła odróżniać jawne wskazówki od zapasowego źródła własności

<Warning>
Nie traktuj `activation` jako hooka cyklu życia ani zamiennika dla `register(...)`. To metadane używane do zawężania ładowania. Preferuj pola własności, gdy już opisują relację; używaj `activation` tylko do dodatkowych wskazówek planisty.
</Warning>

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia do wysyłania/edycji/reakcji dla zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu, a pluginy kanałów obsługują specyficzne dla kanału wykrywanie i wykonanie za nim.

Obecna granica wygląda następująco:

- rdzeń obsługuje współdzielony host narzędzia `message`, połączenie z promptem, księgowanie sesji/wątków i dyspozycję wykonania
- pluginy kanałów obsługują wykrywanie działań w określonym zakresie, wykrywanie możliwości oraz wszelkie fragmenty schematu specyficzne dla kanału
- pluginy kanałów obsługują gramatykę rozmów sesji specyficzną dla dostawcy, na przykład to, jak identyfikatory rozmów kodują identyfikatory wątków lub dziedziczą je z rozmów nadrzędnych
- pluginy kanałów wykonują końcowe działanie przez swój adapter działań

Dla pluginów kanałów powierzchnią SDK jest `ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania pozwala pluginowi zwrócić razem jego widoczne działania, możliwości i wkłady do schematu, tak aby te elementy nie rozjeżdżały się względem siebie.

Gdy parametr narzędzia wiadomości specyficzny dla kanału przenosi źródło multimediów, takie jak ścieżka lokalna lub zdalny adres URL multimediów, plugin powinien również zwrócić `mediaSourceParams` z `describeMessageTool(...)`. Rdzeń używa tej jawnej listy do stosowania normalizacji ścieżek piaskownicy i wskazówek dotyczących dostępu do multimediów wychodzących bez twardego kodowania nazw parametrów należących do pluginu. Preferuj tam mapy ograniczone do działań, a nie jedną płaską listę dla całego kanału, aby parametr multimediów dotyczący tylko profilu nie był normalizowany przy niezwiązanych działaniach, takich jak `send`.

Rdzeń przekazuje zakres środowiska uruchomieniowego do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać działania wiadomości w zależności od aktywnego konta, bieżącego pokoju/wątku/wiadomości lub zaufanej tożsamości żądającego bez twardego kodowania gałęzi specyficznych dla kanału w narzędziu `message` rdzenia.

Dlatego właśnie zmiany routingu embedded-runner nadal są pracą po stronie pluginu: runner odpowiada za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, aby współdzielone narzędzie `message` udostępniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku pomocników wykonania należących do kanału dołączone pluginy powinny utrzymywać środowisko uruchomieniowe wykonania we własnych modułach rozszerzeń. Rdzeń nie obsługuje już środowisk uruchomieniowych działań wiadomości Discord, Slack, Telegram ani WhatsApp pod `src/agents/tools`. Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a dołączone pluginy powinny importować własny lokalny kod środowiska uruchomieniowego bezpośrednio z modułów należących do ich rozszerzeń.

Ta sama granica obowiązuje ogólnie dla nazwanych przez dostawcę elementów SDK: rdzeń nie powinien importować wygodnych barrelów specyficznych dla kanałów dla Slack, Discord, Signal, WhatsApp ani podobnych rozszerzeń. Jeśli rdzeń potrzebuje jakiegoś zachowania, powinien albo użyć własnego barrel `api.ts` / `runtime-api.ts` dołączonego pluginu, albo wynieść tę potrzebę do wąskiej, ogólnej możliwości we współdzielonym SDK.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału lub dodatkowych parametrów ankiet

Rdzeń odracza teraz współdzielone parsowanie ankiet do momentu, gdy dyspozycja ankiet pluginu odrzuci działanie, dzięki czemu obsługiwane przez plugin handlery ankiet mogą akceptować pola ankiet specyficzne dla kanału bez wcześniejszego blokowania przez ogólny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w [Wewnętrzne elementy architektury pluginów](/pl/plugins/architecture-internals).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** lub **funkcji**, a nie jako zbiór niepowiązanych integracji.

To oznacza, że:

- plugin firmy powinien zwykle posiadać wszystkie powierzchnie OpenClaw skierowane do tej firmy
- plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny używać współdzielonych możliwości rdzenia zamiast doraźnie ponownie implementować zachowanie dostawców

<AccordionGroup>
  <Accordion title="Dostawca z wieloma możliwościami">
    `openai` obsługuje wnioskowanie tekstowe, mowę, głos w czasie rzeczywistym, rozumienie multimediów i generowanie obrazów. `google` obsługuje wnioskowanie tekstowe oraz rozumienie multimediów, generowanie obrazów i wyszukiwanie w sieci. `qwen` obsługuje wnioskowanie tekstowe oraz rozumienie multimediów i generowanie wideo.
  </Accordion>
  <Accordion title="Dostawca z jedną możliwością">
    `elevenlabs` i `microsoft` obsługują mowę; `firecrawl` obsługuje web-fetch; `minimax` / `mistral` / `moonshot` / `zai` obsługują backendy media-understanding.
  </Accordion>
  <Accordion title="Plugin funkcji">
    `voice-call` obsługuje transport połączeń, narzędzia, CLI, trasy i mostkowanie strumienia mediów Twilio, ale korzysta ze współdzielonych możliwości mowy, transkrypcji w czasie rzeczywistym i głosu w czasie rzeczywistym zamiast bezpośrednio importować pluginy dostawców.
  </Accordion>
</AccordionGroup>

Zamierzony stan końcowy jest następujący:

- OpenAI działa w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru funkcjonalnego
- kanały nie muszą wiedzieć, który plugin dostawcy obsługuje dostawcę; korzystają ze współdzielonego kontraktu możliwości udostępnianego przez rdzeń

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **capability** = kontrakt rdzenia, który wiele pluginów może implementować lub wykorzystywać

Jeśli więc OpenClaw doda nową dziedzinę, taką jak wideo, pierwsze pytanie nie brzmi „który dostawca powinien na sztywno zakodować obsługę wideo?”. Pierwsze pytanie brzmi „jaki jest kontrakt możliwości wideo w rdzeniu?”. Gdy taki kontrakt istnieje, pluginy dostawców mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą z niego korzystać.

Jeśli możliwość jeszcze nie istnieje, właściwym krokiem jest zwykle:

<Steps>
  <Step title="Zdefiniuj możliwość">
    Zdefiniuj brakującą możliwość w rdzeniu.
  </Step>
  <Step title="Udostępnij ją przez SDK">
    Udostępnij ją w typowany sposób przez API/plugin runtime.
  </Step>
  <Step title="Podłącz konsumentów">
    Podłącz kanały/funkcje do tej możliwości.
  </Step>
  <Step title="Implementacje dostawców">
    Pozwól pluginom dostawców rejestrować implementacje.
  </Step>
</Steps>

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania rdzenia zależnego od pojedynczego dostawcy lub jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Używaj tego modelu mentalnego przy decydowaniu, gdzie powinien znajdować się kod:

<Tabs>
  <Tab title="Warstwa możliwości rdzenia">
    Współdzielona orkiestracja, polityka, fallback, reguły scalania konfiguracji, semantyka dostarczania i typowane kontrakty.
  </Tab>
  <Tab title="Warstwa pluginu dostawcy">
    API specyficzne dla dostawcy, uwierzytelnianie, katalogi modeli, synteza mowy, generowanie obrazów, przyszłe backendy wideo, endpointy użycia.
  </Tab>
  <Tab title="Warstwa pluginu kanału/funkcji">
    Integracje Slack/Discord/voice-call/itd., które korzystają z możliwości rdzenia i udostępniają je na danej powierzchni.
  </Tab>
</Tabs>

Na przykład TTS ma taki kształt:

- rdzeń obsługuje politykę TTS w czasie odpowiedzi, kolejność fallbacku, preferencje i dostarczanie przez kanał
- `openai`, `elevenlabs` i `microsoft` obsługują implementacje syntezy
- `voice-call` korzysta z pomocnika środowiska uruchomieniowego TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład pluginu firmy z wieloma możliwościami

Plugin firmy powinien sprawiać wrażenie spójnego z zewnątrz. Jeśli OpenClaw ma współdzielone kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów, generowania obrazów, generowania wideo, web fetch i wyszukiwania w sieci, dostawca może obsługiwać wszystkie swoje powierzchnie w jednym miejscu:

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

Znaczenie mają nie dokładne nazwy helperów. Znaczenie ma kształt:

- jeden plugin posiada powierzchnię dostawcy
- rdzeń nadal posiada kontrakty możliwości
- kanały i pluginy funkcji korzystają z helperów `api.runtime.*`, a nie z kodu dostawcy
- testy kontraktowe mogą potwierdzać, że plugin zarejestrował możliwości, których własność deklaruje

### Przykład możliwości: rozumienie wideo

OpenClaw już teraz traktuje rozumienie obrazu/dźwięku/wideo jako jedną współdzieloną możliwość. Ten sam model własności obowiązuje również tutaj:

<Steps>
  <Step title="Rdzeń definiuje kontrakt">
    Rdzeń definiuje kontrakt media-understanding.
  </Step>
  <Step title="Pluginy dostawców rejestrują się">
    Pluginy dostawców rejestrują odpowiednio `describeImage`, `transcribeAudio` i `describeVideo`.
  </Step>
  <Step title="Konsumenci używają współdzielonego zachowania">
    Kanały i pluginy funkcji korzystają ze współdzielonego zachowania rdzenia zamiast bezpośrednio łączyć się z kodem dostawcy.
  </Step>
</Steps>

Pozwala to uniknąć wpisywania do rdzenia założeń jednego dostawcy dotyczących wideo. Plugin posiada powierzchnię dostawcy; rdzeń posiada kontrakt możliwości i zachowanie fallbacku.

Generowanie wideo już teraz używa tej samej sekwencji: rdzeń posiada typowany kontrakt możliwości i pomocnik środowiska uruchomieniowego, a pluginy dostawców rejestrują względem niego implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz [Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w `OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji i pomocniki środowiska uruchomieniowego, na których plugin może polegać.

Dlaczego to ważne:

- autorzy pluginów otrzymują jeden stabilny wewnętrzny standard
- rdzeń może odrzucić zduplikowaną własność, na przykład dwa pluginy rejestrujące ten sam identyfikator dostawcy
- uruchamianie może zwracać przydatną diagnostykę dla nieprawidłowej rejestracji
- testy kontraktowe mogą egzekwować własność dołączonych pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

<AccordionGroup>
  <Accordion title="Egzekwowanie rejestracji w środowisku uruchomieniowym">
    Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady: zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy oraz nieprawidłowe rejestracje generują diagnostykę pluginu zamiast niezdefiniowanego zachowania.
  </Accordion>
  <Accordion title="Testy kontraktowe">
    Dołączone pluginy są przechwytywane w rejestrach kontraktowych podczas uruchamiania testów, dzięki czemu OpenClaw może jawnie potwierdzać własność. Dziś jest to używane dla dostawców modeli, dostawców mowy, dostawców wyszukiwania w sieci i własności rejestracji dołączonych pluginów.
  </Accordion>
</AccordionGroup>

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin posiada którą powierzchnię. Dzięki temu rdzeń i kanały mogą się płynnie składać, ponieważ własność jest deklarowana, typowana i testowalna, a nie domyślna.

### Co należy do kontraktu

<Tabs>
  <Tab title="Dobre kontrakty">
    - typowane
    - małe
    - specyficzne dla możliwości
    - należące do rdzenia
    - wielokrotnego użytku przez wiele pluginów
    - możliwe do wykorzystania przez kanały/funkcje bez wiedzy o dostawcy
  </Tab>
  <Tab title="Złe kontrakty">
    - polityka specyficzna dla dostawcy ukryta w rdzeniu
    - jednorazowe furtki dla pluginów omijające rejestr
    - kod kanału sięgający bezpośrednio do implementacji dostawcy
    - doraźne obiekty środowiska uruchomieniowego, które nie są częścią `OpenClawPluginApi` ani `api.runtime`
  </Tab>
</Tabs>

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem pozwól pluginom się do niej podłączać.

## Model wykonania

Natywne pluginy OpenClaw działają **w procesie** razem z Gateway. Nie są izolowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co kod rdzenia.

<Warning>
Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może spowodować awarię lub destabilizację gateway
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu w procesie OpenClaw
</Warning>

Zgodne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie dołączone Skills.

W przypadku pluginów niedołączonych używaj list dozwolonych i jawnych ścieżek instalacji/ładowania. Traktuj pluginy przestrzeni roboczej jako kod czasu rozwoju, a nie domyślne ustawienia produkcyjne.

Dla nazw pakietów dołączonych przestrzeni roboczej zachowaj identyfikator pluginu zakotwiczony w nazwie npm: domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks, taki jak `-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy pakiet celowo udostępnia węższą rolę pluginu.

<Note>
**Uwaga dotycząca zaufania:**

- `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła.
- Plugin przestrzeni roboczej z tym samym identyfikatorem co dołączony plugin celowo przesłania dołączoną kopię, gdy ten plugin przestrzeni roboczej jest włączony/znajduje się na liście dozwolonych.
- Jest to normalne i przydatne przy lokalnym rozwoju, testowaniu poprawek i hotfiksach.
- Zaufanie dołączonego pluginu jest rozstrzygane na podstawie snapshotu źródła — manifestu i kodu na dysku w momencie ładowania — a nie na podstawie metadanych instalacji. Uszkodzony lub podmieniony rekord instalacji nie może po cichu rozszerzyć powierzchni zaufania dołączonego pluginu ponad to, co deklaruje rzeczywiste źródło.
</Note>

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacje.

Zachowaj publiczną rejestrację możliwości. Ogranicz eksporty helperów niebędących kontraktami:

- podścieżki pomocnicze specyficzne dla dołączonych pluginów
- podścieżki infrastruktury środowiska uruchomieniowego, które nie są przeznaczone jako publiczne API
- wygodne helpery specyficzne dla dostawców
- helpery konfiguracji/onboardingu będące szczegółami implementacji

Niektóre podścieżki helperów dołączonych pluginów nadal pozostają w wygenerowanej mapie eksportów SDK ze względu na zgodność i utrzymanie dołączonych pluginów. Obecne przykłady obejmują `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` oraz kilka elementów `plugin-sdk/matrix*`. Traktuj je jako zastrzeżone eksporty będące szczegółami implementacji, a nie jako zalecany wzorzec SDK dla nowych pluginów firm trzecich.

## Wewnętrzne elementy i odniesienie

Informacje o potoku ładowania, modelu rejestru, hakach środowiska uruchomieniowego dostawców, trasach HTTP Gateway, schematach narzędzia wiadomości, rozwiązywaniu celów kanałów, katalogach dostawców, pluginach silnika kontekstu oraz przewodniku dodawania nowej możliwości znajdziesz w [Wewnętrzne elementy architektury pluginów](/pl/plugins/architecture-internals).

## Powiązane

- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Manifest pluginu](/pl/plugins/manifest)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
