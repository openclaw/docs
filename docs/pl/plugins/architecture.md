---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości pluginów lub granic własności
    - Praca nad potokiem ładowania pluginów lub rejestrem
    - Implementowanie hooków runtime providera lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wnętrze pluginów: model możliwości, własność, kontrakty, potok ładowania i pomocniki runtime'
title: Wnętrze pluginów
x-i18n:
    generated_at: "2026-04-21T09:56:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Wnętrze pluginów

<Info>
  To jest **szczegółowe odniesienie architektoniczne**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalowanie i używanie pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — pierwszy samouczek pluginów
  - [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — zbuduj kanał wiadomości
  - [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — zbuduj providera modeli
  - [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu pluginów OpenClaw.

## Publiczny model możliwości

Możliwości to publiczny model **natywnych pluginów** w OpenClaw. Każdy
natywny plugin OpenClaw rejestruje się względem jednego lub większej liczby typów możliwości:

| Możliwość               | Metoda rejestracji                               | Przykładowe pluginy                   |
| ----------------------- | ------------------------------------------------ | ------------------------------------- |
| Wnioskowanie tekstowe   | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| Backend CLI wnioskowania | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                 |
| Mowa                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| Transkrypcja realtime   | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                              |
| Głos realtime           | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| Rozumienie mediów       | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                    |
| Generowanie obrazów     | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| Generowanie muzyki      | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                   |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| Pobieranie z sieci      | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| Wyszukiwanie w sieci    | `api.registerWebSearchProvider(...)`             | `google`                              |
| Kanał / wiadomości      | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |

Plugin, który rejestruje zero możliwości, ale dostarcza hooki, narzędzia lub
usługi, jest pluginem **legacy hook-only**. Ten wzorzec jest nadal w pełni obsługiwany.

### Stanowisko wobec zgodności zewnętrznej

Model możliwości jest już obecny w core i jest dziś używany przez
wbudowane/natywne pluginy, ale zgodność zewnętrznych pluginów nadal wymaga wyższego progu niż „jest
eksportowane, więc jest zamrożone”.

Aktualne wytyczne:

- **istniejące pluginy zewnętrzne:** utrzymuj działanie integracji opartych na hookach; traktuj
  to jako bazowy poziom zgodności
- **nowe pluginy wbudowane/natywne:** preferuj jawną rejestrację możliwości zamiast
  wejść specyficznych dla dostawcy albo nowych projektów tylko z hookami
- **zewnętrzne pluginy przyjmujące rejestrację możliwości:** dozwolone, ale traktuj
  powierzchnie helperów specyficzne dla możliwości jako rozwijające się, chyba że dokumentacja
  wyraźnie oznacza kontrakt jako stabilny

Praktyczna zasada:

- API rejestracji możliwości to zamierzony kierunek
- legacy hooks pozostają najbezpieczniejszą ścieżką bez ryzyka złamań dla zewnętrznych pluginów w czasie przejścia
- eksportowane podścieżki helperów nie są sobie równe; preferuj wąski, udokumentowany
  kontrakt, a nie przypadkowe eksporty helperów

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  plugin tylko providera, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie mediów i generowanie
  obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane albo własne), bez możliwości,
  narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale bez
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i rozbicie możliwości.
Szczegóły znajdziesz w [dokumentacji CLI](/cli/plugins#inspect).

### Legacy hooks

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla
pluginów hook-only. Nadal zależą od niego rzeczywiste legacy pluginy.

Kierunek:

- utrzymywać jego działanie
- dokumentować go jako legacy
- preferować `before_model_resolve` do pracy nad nadpisaniem modelu/providera
- preferować `before_prompt_build` do pracy nad mutacją promptu
- usuwać dopiero wtedy, gdy realne użycie spadnie i pokrycie przez fixture potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchamiasz `openclaw doctor` albo `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja poprawnie się parsuje, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe   |
| **hard error**             | Konfiguracja jest nieprawidłowa albo plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego pluginu --
`hook-only` ma charakter doradczy, a `before_agent_start` wywołuje tylko ostrzeżenie. Te
sygnały pojawiają się także w `openclaw status --all` oraz `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydackie pluginy w skonfigurowanych ścieżkach, katalogach głównych workspace,
   globalnych katalogach rozszerzeń i wbudowanych rozszerzeniach. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundle.
2. **Włączanie + walidacja**
   Core decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany czy
   wybrany do ekskluzywnego slotu, takiego jak memory.
3. **Ładowanie runtime**
   Natywne pluginy OpenClaw są ładowane in-process przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do
   rekordów rejestru bez importowania kodu runtime.
4. **Konsumpcja powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację
   providerów, hooki, trasy HTTP, polecenia CLI i usługi.

Dla CLI pluginów samo wykrywanie komend głównych jest podzielone na dwie fazy:

- metadane w czasie parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI pluginu może pozostać leniwy i rejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje wewnątrz pluginu, a OpenClaw nadal może
zarezerwować nazwy komend głównych przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie runtime pochodzi ze ścieżki modułu pluginu `register(api)`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować wskazówki UI/schematu zanim pełny runtime stanie się aktywny.

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core, a
pluginy kanałów obsługują specyficzne dla kanału wykrywanie i wykonywanie za nim.

Obecna granica wygląda tak:

- core zarządza hostem współdzielonego narzędzia `message`, powiązaniem promptu, prowadzeniem księgowości
  sesji/wątków i dyspozycją wykonania
- pluginy kanałów zarządzają wykrywaniem działań w danym zakresie, wykrywaniem możliwości i wszelkimi
  fragmentami schematu specyficznymi dla kanału
- pluginy kanałów zarządzają gramatyką rozmowy sesji specyficzną dla providera, na przykład
  tym, jak identyfikatory rozmów kodują identyfikatory wątków albo dziedziczą z rozmów nadrzędnych
- pluginy kanałów wykonują końcowe działanie przez swój adapter akcji

Dla pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To zunifikowane wywołanie wykrywania
pozwala pluginowi zwrócić jego widoczne działania, możliwości i wkład do schematu
razem, aby te elementy się nie rozchodziły.

Gdy parametr narzędzia wiadomości specyficzny dla kanału niesie źródło mediów, takie jak
lokalna ścieżka lub zdalny URL mediów, plugin powinien również zwrócić
`mediaSourceParams` z `describeMessageTool(...)`. Core używa tej jawnej
listy, aby stosować normalizację ścieżek sandboxa i wskazówki dostępu do mediów wychodzących
bez zakodowywania na sztywno nazw parametrów należących do pluginu.
Preferuj tam mapy ograniczone do działań, a nie jedną płaską listę dla całego kanału, aby
parametr mediów tylko dla profilu nie był normalizowany przy niezwiązanych działaniach takich jak
`send`.

Core przekazuje zakres runtime do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

To ma znaczenie dla pluginów wrażliwych na kontekst. Kanał może ukrywać albo ujawniać
działania wiadomości w zależności od aktywnego konta, bieżącego pokoju/wątku/wiadomości albo
zaufanej tożsamości nadawcy żądającego bez zakodowanych na sztywno rozgałęzień specyficznych dla kanału w
narzędziu `message` w core.

Dlatego zmiany routingu embedded-runner nadal są pracą po stronie pluginu: runner odpowiada
za przekazanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, tak aby współdzielone
narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku helperów wykonawczych należących do kanału wbudowane pluginy powinny utrzymywać runtime
wykonania wewnątrz własnych modułów rozszerzeń. Core nie zarządza już runtime'ami akcji wiadomości
Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a wbudowane
pluginy powinny importować własny lokalny kod runtime bezpośrednio z modułów należących do ich
rozszerzeń.

Ta sama granica dotyczy ogólnie nazwanych przez providera szwów SDK: core nie powinien
importować barrel convenience specyficznych dla kanałów dla rozszerzeń Slack, Discord, Signal,
WhatsApp ani podobnych. Jeśli core potrzebuje jakiegoś zachowania, powinien albo
użyć własnego barrel `api.ts` / `runtime-api.ts` wbudowanego pluginu, albo wypromować tę potrzebę
do wąskiej ogólnej możliwości we współdzielonym SDK.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego
  modelu ankiety
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału
  albo dodatkowych parametrów ankiet

Core odracza teraz współdzielone parsowanie ankiet do momentu, aż dyspozycja ankiety pluginu odrzuci
działanie, dzięki czemu handlery ankiet należące do pluginu mogą akceptować pola ankiet
specyficzne dla kanału, nie będąc wcześniej blokowane przez generyczny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w [potoku ładowania](#load-pipeline).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** albo **funkcji**,
a nie jako worek niepowiązanych integracji.

Oznacza to, że:

- plugin firmowy powinien zwykle posiadać wszystkie powierzchnie OpenClaw-facing tej firmy
- plugin funkcjonalny powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny zużywać współdzielone możliwości core zamiast ad hoc ponownie implementować zachowanie providera

Przykłady:

- wbudowany plugin `openai` zarządza zachowaniem providera modeli OpenAI oraz zachowaniem OpenAI dla
  mowy + głosu realtime + rozumienia mediów + generowania obrazów
- wbudowany plugin `elevenlabs` zarządza zachowaniem mowy ElevenLabs
- wbudowany plugin `microsoft` zarządza zachowaniem mowy Microsoft
- wbudowany plugin `google` zarządza zachowaniem providera modeli Google oraz zachowaniem Google dla
  rozumienia mediów + generowania obrazów + wyszukiwania w sieci
- wbudowany plugin `firecrawl` zarządza zachowaniem pobierania z sieci Firecrawl
- wbudowane pluginy `minimax`, `mistral`, `moonshot` i `zai` zarządzają swoimi
  backendami rozumienia mediów
- wbudowany plugin `qwen` zarządza zachowaniem providera tekstowego Qwen oraz
  zachowaniem rozumienia mediów i generowania wideo
- plugin `voice-call` jest pluginem funkcjonalnym: zarządza transportem połączeń, narzędziami,
  CLI, trasami i mostkowaniem strumieni mediów Twilio, ale używa współdzielonych możliwości mowy
  oraz transkrypcji realtime i głosu realtime zamiast importować pluginy dostawców bezpośrednio

Zamierzony stan końcowy jest taki:

- OpenAI żyje w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnej powierzchni
- kanały nie obchodzą, który plugin dostawcy zarządza providerem; używają
  współdzielonego kontraktu możliwości udostępnianego przez core

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **możliwość** = kontrakt core, który wiele pluginów może implementować albo zużywać

Więc jeśli OpenClaw dodaje nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który provider powinien na sztywno zakodować obsługę wideo?” Pierwsze pytanie brzmi „jaki jest
kontrakt możliwości wideo w core?” Gdy ten kontrakt już istnieje, pluginy dostawców
mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą go zużywać.

Jeśli taka możliwość jeszcze nie istnieje, właściwy ruch zwykle wygląda tak:

1. zdefiniować brakującą możliwość w core
2. udostępnić ją przez API/runtime pluginów w sposób typowany
3. podłączyć kanały/funkcje do tej możliwości
4. pozwolić pluginom dostawców rejestrować implementacje

To utrzymuje jawną własność, a jednocześnie unika zachowań core zależnych od
jednego dostawcy albo jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Używaj tego modelu mentalnego przy decydowaniu, gdzie powinien znajdować się kod:

- **warstwa możliwości core**: współdzielona orkiestracja, polityka, fallback, reguły
  scalania konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa pluginu dostawcy**: API specyficzne dla dostawcy, auth, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, punkty końcowe użycia
- **warstwa pluginu kanału/funkcji**: integracja Slack/Discord/voice-call/itd.,
  która zużywa możliwości core i wystawia je na swojej powierzchni

Na przykład TTS ma taki kształt:

- core zarządza polityką TTS w czasie odpowiedzi, kolejnością fallbacku, preferencjami i dostarczaniem kanałowym
- `openai`, `elevenlabs` i `microsoft` zarządzają implementacjami syntezy
- `voice-call` zużywa helper runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład firmowego pluginu wielomożliwościowego

Plugin firmowy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji realtime, głosu realtime, rozumienia mediów,
generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci,
dostawca może zarządzać wszystkimi swoimi powierzchniami w jednym miejscu:

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

Nie są najważniejsze dokładne nazwy helperów. Liczy się kształt:

- jeden plugin zarządza powierzchnią dostawcy
- core nadal zarządza kontraktami możliwości
- kanały i pluginy funkcjonalne używają helperów `api.runtime.*`, a nie kodu dostawcy
- testy kontraktowe mogą sprawdzić, że plugin zarejestrował możliwości, którymi
  twierdzi, że zarządza

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną
możliwość. Obowiązuje tu ten sam model własności:

1. core definiuje kontrakt rozumienia mediów
2. pluginy dostawców rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo`, tam gdzie to ma zastosowanie
3. kanały i pluginy funkcjonalne zużywają współdzielone zachowanie core zamiast
   łączyć się bezpośrednio z kodem dostawcy

To zapobiega wbudowaniu założeń o wideo jednego providera w core. Plugin zarządza
powierzchnią dostawcy; core zarządza kontraktem możliwości i zachowaniem fallbacku.

Generowanie wideo już używa tej samej sekwencji: core zarządza typowanym
kontraktem możliwości i helperem runtime, a pluginy dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej checklisty wdrożeniowej? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz
helpery runtime, na których plugin może polegać.

Dlaczego to ważne:

- autorzy pluginów otrzymują jeden stabilny standard wewnętrzny
- core może odrzucać duplikaty własności, takie jak dwa pluginy rejestrujące ten sam
  provider id
- uruchamianie może pokazywać praktyczne diagnostyki dla nieprawidłowej rejestracji
- testy kontraktowe mogą egzekwować własność wbudowanych pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji runtime**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   duplikaty provider id, duplikaty identyfikatorów providerów mowy i nieprawidłowe
   rejestracje tworzą diagnostyki pluginów zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Wbudowane pluginy są przechwytywane w rejestrach kontraktowych podczas uruchomień testów, aby
   OpenClaw mógł jawnie sprawdzać własność. Dziś jest to używane dla providerów modeli,
   providerów mowy, providerów wyszukiwania w sieci i własności rejestracji wbudowanych pluginów.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin zarządza którą
powierzchnią. Dzięki temu core i kanały mogą się bezproblemowo składać, ponieważ własność jest
zadeklarowana, typowana i testowalna, a nie ukryta.

### Co należy do kontraktu

Dobre kontrakty pluginów są:

- typowane
- małe
- specyficzne dla możliwości
- należące do core
- wielokrotnego użytku przez wiele pluginów
- zużywalne przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty pluginów to:

- polityka specyficzna dla dostawcy ukryta w core
- jednorazowe furtki pluginów omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a dopiero potem
pozwól pluginom się do niej podłączać.

## Model wykonania

Natywne pluginy OpenClaw działają **in-process** z Gateway. Nie są objęte
sandboxem. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co
kod core.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może spowodować awarię Gateway albo jego destabilizację
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie
wbudowane Skills.

Dla pluginów spoza bundla używaj list dozwolonych i jawnych ścieżek instalacji/ładowania. Traktuj
pluginy workspace jako kod czasu developmentu, a nie domyślne ustawienie produkcyjne.

Dla nazw pakietów wbudowanych workspace utrzymuj identyfikator pluginu zakotwiczony w nazwie npm:
`@openclaw/<id>` domyślnie, albo zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo wystawia węższą rolę pluginu.

Ważna uwaga o zaufaniu:

- `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła.
- Plugin workspace o tym samym identyfikatorze co wbudowany plugin celowo zasłania
  kopię wbudowaną, gdy ten plugin workspace jest włączony/na liście dozwolonych.
- To normalne i przydatne przy lokalnym developmentcie, testowaniu poprawek i hotfixach.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacje.

Utrzymuj publiczną rejestrację możliwości. Ogranicz eksporty helperów spoza kontraktu:

- podścieżki helperów specyficznych dla wbudowanych pluginów
- podścieżki infrastruktury runtime nieprzeznaczone jako publiczne API
- helpery convenience specyficzne dla dostawcy
- helpery setup/onboard będące szczegółami implementacyjnymi

Niektóre podścieżki helperów wbudowanych pluginów nadal pozostają w generowanej mapie eksportów SDK
dla zachowania zgodności i utrzymania wbudowanych pluginów. Obecne przykłady to
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka szwów `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty szczegółów implementacyjnych, a nie jako rekomendowany wzorzec SDK dla
nowych pluginów third-party.

## Potok ładowania

Podczas uruchamiania OpenClaw robi w przybliżeniu to:

1. wykrywa katalogi główne kandydatów na pluginy
2. odczytuje natywne lub zgodne manifesty bundle oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone natywne moduły przez jiti
7. wywołuje hooki natywne `register(api)` (albo `activate(api)` — starszy alias) i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom komend/runtime

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje to, które jest obecne (`def.register ?? def.activate`) i wywołuje je w tym samym miejscu. Wszystkie wbudowane pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy punkt wejścia wychodzi poza katalog główny pluginu, ścieżka ma prawa zapisu dla wszystkich albo
własność ścieżki wygląda podejrzanie dla pluginów spoza bundla.

### Zachowanie manifest-first

Manifest jest źródłem prawdy control plane. OpenClaw używa go do:

- identyfikacji pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów Control UI
- wyświetlania metadanych instalacji/katalogu
- zachowania tanich deskryptorów aktywacji i setup bez ładowania runtime pluginu

Dla natywnych pluginów moduł runtime jest częścią data plane. Rejestruje rzeczywiste
zachowania, takie jak hooki, narzędzia, polecenia albo przepływy providera.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w control plane.
Są to wyłącznie deskryptory metadanych do planowania aktywacji i wykrywania setup; nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz wskazówek manifestu dotyczących komend, kanałów i providerów,
aby zawężać ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów, które zarządzają żądaną komendą główną
- rozwiązywanie setup/pluginu kanału zawęża się do pluginów, które zarządzają żądanym
  channel id
- jawne rozwiązywanie setup/runtime providera zawęża się do pluginów, które zarządzają
  żądanym provider id

Odkrywanie setup teraz preferuje identyfikatory należące do deskryptorów, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydackie pluginy, zanim przejdzie do
`setup-api` dla pluginów, które nadal potrzebują hooków runtime w czasie setup. Jeśli więcej niż
jeden wykryty plugin deklaruje ten sam znormalizowany identyfikator providera setup lub backendu CLI,
wyszukiwanie setup odmawia wyboru niejednoznacznego właściciela zamiast polegać na kolejności
wykrywania.

### Co cache'uje loader

OpenClaw utrzymuje krótkie cache'e in-process dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów pluginów

Te cache'e ograniczają skokowe obciążenie przy uruchamianiu i narzut powtarzanych poleceń. Można o nich
myśleć jako o krótkotrwałych cache'ach wydajności, a nie trwałej pamięci.

Uwaga wydajnościowa:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` albo
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache'e.
- Dostosuj okna cache przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali core. Rejestrują się w
centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- legacy hooks i hooki typowane
- kanały
- providerów
- handlery Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- polecenia należące do pluginów

Funkcje core odczytują następnie z tego rejestru zamiast rozmawiać bezpośrednio z modułami pluginów.
Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime core -> zużycie rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje
tylko jednego punktu integracji: „czytaj rejestr”, a nie „obsługuj specjalnie każdy moduł pluginu”.

## Callbacki wiązania rozmów

Pluginy, które wiążą rozmowę, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu albo odrzuceniu żądania powiązania:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Pola ładunku callbacku:

- `status`: `"approved"` albo `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` albo `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane rozmowy

Ten callback służy wyłącznie do powiadamiania. Nie zmienia tego, kto może wiązać rozmowę,
i uruchamia się po zakończeniu obsługi zatwierdzenia przez core.

## Hooki runtime providera

Pluginy providerów mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` do taniego wyszukiwania auth providera przez env
  przed załadowaniem runtime, `providerAuthAliases` dla wariantów providera współdzielących
  auth, `channelEnvVars` do taniego wyszukiwania env/setup kanału przed załadowaniem runtime,
  oraz `providerAuthChoices` do tanich etykiet onboarding/auth-choice i metadanych flag CLI przed załadowaniem runtime
- hooki czasu konfiguracji: `catalog` / starsze `discovery` oraz `applyConfigDefaults`
- hooki runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw nadal zarządza generyczną pętlą agenta, failoverem, obsługą transkrypcji i
polityką narzędzi. Te hooki stanowią powierzchnię rozszerzeń dla zachowania specyficznego dla providera bez
potrzeby tworzenia całego niestandardowego transportu inferencji.

Używaj manifestu `providerAuthEnvVars`, gdy provider ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/model-picker powinny widzieć bez ładowania runtime pluginu.
Używaj manifestu `providerAuthAliases`, gdy jeden provider id powinien ponownie używać zmiennych env,
profili auth, auth opartego na konfiguracji i wyboru onboardingu klucza API innego providera id.
Używaj manifestu `providerAuthChoices`, gdy powierzchnie onboarding/auth-choice
CLI powinny znać identyfikator wyboru providera, etykiety grup oraz proste
powiązanie auth jedną flagą bez ładowania runtime providera. Zachowaj `envVars` w runtime providera
dla wskazówek operator-facing, takich jak etykiety onboardingu lub zmienne
setup client-id/client-secret OAuth.

Używaj manifestu `channelEnvVars`, gdy kanał ma auth albo setup sterowane przez env,
które ogólny fallback shell-env, kontrole config/status albo prompty setup powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i użycie

Dla pluginów modelu/providera OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację providera do `models.providers` podczas generowania `models.json`                      | Provider zarządza katalogiem albo domyślnymi ustawieniami `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne ustawienia należące do providera podczas materializacji konfiguracji                | Ustawienia domyślne zależą od trybu auth, env albo semantyki rodziny modeli providera                                                      |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook pluginu)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizuje starsze albo preview aliasy `model-id` przed wyszukiwaniem                                        | Provider zarządza porządkowaniem aliasów przed kanonicznym rozwiązywaniem modelu                                                           |
| 4   | `normalizeTransport`              | Normalizuje rodzinę providera `api` / `baseUrl` przed ogólnym składaniem modelu                               | Provider zarządza porządkowaniem transportu dla niestandardowych provider id w tej samej rodzinie transportu                              |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/providera                                    | Provider potrzebuje porządkowania konfiguracji, które powinno należeć do pluginu; wbudowane helpery rodziny Google dodatkowo wspierają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje zgodnościowe przepisania native streaming-usage do providerów konfiguracji                            | Provider potrzebuje poprawek metadanych native streaming usage zależnych od punktu końcowego                                               |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth env-marker dla providerów konfiguracji przed załadowaniem auth runtime                        | Provider ma własne rozwiązywanie klucza API env-marker; `amazon-bedrock` ma tu też wbudowany resolver env-marker AWS                     |
| 8   | `resolveSyntheticAuth`            | Ujawnia lokalne/self-hosted albo oparte na konfiguracji auth bez utrwalania jawnego tekstu                    | Provider może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile auth należące do providera; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Provider ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych refresh tokenów                                         |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych placeholderów syntetycznych profili względem auth opartego na env/konfiguracji    | Provider przechowuje placeholdery syntetycznych profili, które nie powinny wygrywać priorytetu                                            |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do providera identyfikatorów modeli, których jeszcze nie ma w lokalnym rejestrze | Provider akceptuje dowolne identyfikatory modeli upstream                                                                                  |
| 12  | `prepareDynamicModel`             | Asynchroniczne przygotowanie, po którym `resolveDynamicModel` uruchamia się ponownie                          | Provider potrzebuje metadanych z sieci przed rozwiązywaniem nieznanych identyfikatorów                                                    |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez embedded runner                                    | Provider potrzebuje przepisania transportu, ale nadal używa transportu core                                                               |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi compat dla modeli dostawcy działających za innym zgodnym transportem                             | Provider rozpoznaje własne modele na transportach proxy bez przejmowania providera                                                        |
| 15  | `capabilities`                    | Metadane transkrypcji/narzędzi należące do providera, używane przez współdzieloną logikę core                | Provider potrzebuje niuansów transkrypcji/rodziny providera                                                                                |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi przed przekazaniem ich do embedded runnera                                      | Provider potrzebuje porządkowania schematów dla rodziny transportu                                                                        |
| 17  | `inspectToolSchemas`              | Ujawnia diagnostykę schematów należącą do providera po normalizacji                                           | Provider chce mieć ostrzeżenia o słowach kluczowych bez uczenia core reguł specyficznych dla providera                                   |
| 18  | `resolveReasoningOutputMode`      | Wybiera natywny albo tagowany kontrakt wyjścia reasoning                                                      | Provider potrzebuje tagowanego reasoning/final output zamiast natywnych pól                                                               |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji stream                                        | Provider potrzebuje domyślnych parametrów żądania albo porządkowania parametrów per provider                                             |
| 20  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę stream niestandardowym transportem                                        | Provider potrzebuje własnego protokołu na przewodzie, a nie tylko wrappera                                                               |
| 21  | `wrapStreamFn`                    | Wrapper stream po zastosowaniu ogólnych wrapperów                                                             | Provider potrzebuje wrapperów zgodności nagłówków/ciała/modelu żądania bez własnego transportu                                           |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu per tura                                                     | Provider chce, aby ogólne transporty wysyłały natywną tożsamość tury providera                                                           |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket albo politykę cool-down sesji                                              | Provider chce dostrajać nagłówki sesji albo politykę fallbacku w ogólnych transportach WS                                                |
| 24  | `formatApiKey`                    | Formater profilu auth: zapisany profil staje się ciągiem runtime `apiKey`                                     | Provider przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokena runtime                                      |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych punktów końcowych refresh albo polityki błędów refresh     | Provider nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana, gdy odświeżanie OAuth kończy się błędem                                        | Provider potrzebuje własnej wskazówki naprawy auth po błędzie odświeżania                                                                |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do providera                                                    | Provider ma surowe błędy przepełnienia, których ogólne heurystyki nie wykryją                                                            |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do providera                                                         | Provider potrafi mapować surowe błędy API/transportu na rate-limit/przeciążenie/itd.                                                     |
| 29  | `isCacheTtlEligible`              | Polityka cache promptu dla providerów proxy/backhaul                                                          | Provider potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                         |
| 30  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po brakującym auth                                                 | Provider potrzebuje własnej wskazówki odzyskiwania po brakującym auth                                                                     |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnego modelu upstream plus opcjonalna wskazówka błędu dla użytkownika                      | Provider musi ukryć nieaktualne wiersze upstream albo zastąpić je wskazówką dostawcy                                                     |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                    | Provider potrzebuje syntetycznych wierszy forward-compat w `models list` i selektorach                                                   |
| 33  | `resolveThinkingProfile`          | Zestaw poziomów `/think`, etykiety wyświetlane i ustawienie domyślne specyficzne dla modelu                  | Provider wystawia niestandardową drabinę myślenia albo etykietę binarną dla wybranych modeli                                            |
| 34  | `isBinaryThinking`                | Hook zgodności przełącznika reasoning w trybie włącz/wyłącz                                                   | Provider wystawia tylko binarne włącz/wyłącz myślenie                                                                                     |
| 35  | `supportsXHighThinking`           | Hook zgodności wsparcia reasoning `xhigh`                                                                     | Provider chce `xhigh` tylko dla podzbioru modeli                                                                                          |
| 36  | `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                    | Provider zarządza domyślną polityką `/think` dla rodziny modeli                                                                           |
| 37  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów profili live i selekcji smoke                                         | Provider zarządza dopasowaniem preferowanych modeli live/smoke                                                                            |
| 38  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed inferencją                 | Provider potrzebuje wymiany tokena albo krótkotrwałego poświadczenia żądania                                                               |
| 39  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Provider potrzebuje niestandardowego parsowania tokena użycia/limitu albo innego poświadczenia użycia                                     |
| 40  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty użycia/limitu specyficzne dla providera po rozstrzygnięciu auth              | Provider potrzebuje punktu końcowego użycia albo parsera ładunku specyficznego dla providera                                              |
| 41  | `createEmbeddingProvider`         | Buduje adapter embeddingów należący do providera dla memory/search                                             | Zachowanie embeddingów memory należy do pluginu providera                                                                                  |
| 42  | `buildReplayPolicy`               | Zwraca politykę replay sterującą obsługą transkrypcji dla providera                                           | Provider potrzebuje niestandardowej polityki transkrypcji (na przykład usuwania bloków thinking)                                          |
| 43  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym czyszczeniu transkrypcji                                                | Provider potrzebuje przepisania replay specyficznego dla providera, wykraczającego poza współdzielone helpery Compaction                 |
| 44  | `validateReplayTurns`             | Końcowa walidacja albo przekształcanie tur replay przed embedded runnerem                                     | Transport providera potrzebuje bardziej rygorystycznej walidacji tur po ogólnym sanityzowaniu                                             |
| 45  | `onModelSelected`                 | Uruchamia skutki uboczne po wyborze modelu należące do providera                                              | Provider potrzebuje telemetrii albo stanu należącego do providera, gdy model staje się aktywny                                            |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin providera, a potem przechodzą przez inne pluginy providerów zdolne do hooków,
dopóki któryś rzeczywiście nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shim alias/compat providerów nadal działają bez wymagania od wywołującego wiedzy, który
wbudowany plugin zarządza przepisaniem. Jeśli żaden hook providera nie przepisze obsługiwanego
wpisu konfiguracji rodziny Google, wbudowany normalizator konfiguracji Google nadal zastosuje
to porządkowanie zgodności.

Jeśli provider potrzebuje w pełni niestandardowego protokołu na przewodzie albo niestandardowego wykonawcy żądań,
to jest inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowania providera, które
nadal działa na zwykłej pętli inferencji OpenClaw.

### Przykład providera

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Wbudowane przykłady

- Anthropic używa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  oraz `wrapStreamFn`, ponieważ zarządza zgodnością przyszłościową Claude 4.6,
  wskazówkami rodziny providera, wskazówkami naprawy auth, integracją
  punktu końcowego usage, kwalifikowalnością cache promptu, domyślnymi ustawieniami konfiguracji
  zależnymi od auth, domyślną/adaptacyjną polityką thinking Claude
  oraz kształtowaniem streamu specyficznym dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Helpery streamu specyficzne dla Claude w Anthropic na razie pozostają we własnym
  publicznym szwie `api.ts` / `contract-api.ts` wbudowanego pluginu. Ta powierzchnia pakietu
  eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` i niższego poziomu
  buildery wrapperów Anthropic zamiast rozszerzać ogólne SDK o reguły nagłówków beta jednego providera.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities` oraz `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` i `isModernModelRef`,
  ponieważ zarządza zgodnością przyszłościową GPT-5.4, bezpośrednią normalizacją OpenAI
  `openai-completions` -> `openai-responses`, wskazówkami auth uwzględniającymi Codex,
  tłumieniem Spark, syntetycznymi wierszami listy OpenAI i polityką myślenia / modeli live GPT-5; rodzina streamów `openai-responses-defaults`
  zarządza współdzielonymi natywnymi wrapperami OpenAI Responses dla
  nagłówków atrybucji, `/fast`/`serviceTier`, szczegółowości tekstu, natywnego wyszukiwania w sieci Codex,
  kształtowania ładunku reasoning-compat i zarządzania kontekstem Responses.
- OpenRouter używa `catalog` oraz `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ provider jest pass-through i może wystawiać nowe
  identyfikatory modeli, zanim statyczny katalog OpenClaw zostanie zaktualizowany; używa też
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby utrzymać
  nagłówki żądań specyficzne dla providera, metadane routingu, poprawki reasoning i
  politykę cache promptu poza core. Jego polityka replay pochodzi z rodziny
  `passthrough-gemini`, podczas gdy rodzina streamów `openrouter-thinking`
  zarządza wstrzykiwaniem reasoning proxy oraz pomijaniem nieobsługiwanych modeli / `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities` oraz `prepareRuntimeAuth` i `fetchUsageSnapshot`, ponieważ
  potrzebuje logowania urządzenia należącego do providera, zachowania fallbacku modeli,
  niuansów transkrypcji Claude, wymiany tokena GitHub -> token Copilot i
  punktu końcowego usage należącego do providera.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog` oraz
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach core OpenAI, ale zarządza własną normalizacją
  transportu/base URL, polityką fallbacku odświeżania OAuth, domyślnym wyborem transportu,
  syntetycznymi wierszami katalogu Codex i integracją punktu końcowego usage ChatGPT; współdzieli tę samą rodzinę streamów `openai-responses-defaults` co bezpośrednie OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ rodzina replay
  `google-gemini` zarządza fallbackiem zgodności przyszłościowej Gemini 3.1,
  natywną walidacją replay Gemini, sanityzacją replay bootstrap, tagowanym
  trybem wyjścia reasoning i dopasowaniem nowoczesnych modeli, podczas gdy
  rodzina streamów `google-thinking` zarządza normalizacją ładunku thinking Gemini;
  Gemini CLI OAuth używa też `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokena, parsowania tokena i
  podłączenia punktu końcowego limitu.
- Anthropic Vertex używa `buildReplayPolicy` przez rodzinę replay
  `anthropic-by-model`, tak aby porządkowanie replay specyficzne dla Claude pozostawało
  ograniczone do identyfikatorów Claude, zamiast dotyczyć każdego transportu `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveThinkingProfile`, ponieważ zarządza
  klasyfikacją błędów throttle/not-ready/context-overflow specyficzną dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli tę samą
  ochronę `anthropic-by-model` tylko dla Claude.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  przez rodzinę replay `passthrough-gemini`, ponieważ proxy'ują modele Gemini
  przez transporty zgodne z OpenAI i potrzebują sanityzacji
  thought-signature Gemini bez natywnej walidacji replay Gemini ani przepisów bootstrap.
- MiniMax używa `buildReplayPolicy` przez rodzinę replay
  `hybrid-anthropic-openai`, ponieważ jeden provider zarządza zarówno
  semantyką wiadomości Anthropic, jak i zgodną z OpenAI; zachowuje usuwanie bloków
  thinking tylko dla Claude po stronie Anthropic, jednocześnie nadpisując tryb
  wyjścia reasoning z powrotem na natywny, a rodzina streamów `minimax-fast-mode`
  zarządza przepisaniami modeli fast-mode na współdzielonej ścieżce streamu.
- Moonshot używa `catalog`, `resolveThinkingProfile` i `wrapStreamFn`, ponieważ nadal korzysta ze współdzielonego
  transportu OpenAI, ale potrzebuje normalizacji ładunku thinking należącej do providera; rodzina
  streamów `moonshot-thinking` mapuje konfigurację plus stan `/think` na własny
  natywny binarny ładunek thinking.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje nagłówków żądań należących do providera,
  normalizacji ładunku reasoning, wskazówek transkrypcji Gemini i
  bramkowania cache-TTL Anthropic; rodzina streamów `kilocode-thinking` utrzymuje
  wstrzykiwanie Kilo thinking na współdzielonej ścieżce streamu proxy, jednocześnie pomijając `kilo/auto` i
  inne proxy identyfikatory modeli, które nie obsługują jawnych ładunków reasoning.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ zarządza fallbackiem GLM-5,
  domyślnymi ustawieniami `tool_stream`, binarnym UX myślenia, dopasowaniem nowoczesnych modeli oraz
  zarówno auth usage, jak i pobieraniem limitu; rodzina streamów `tool-stream-default-on` utrzymuje
  wrapper `tool_stream` domyślnie włączony poza ręcznie pisanym klejem per provider.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ zarządza natywną normalizacją transportu xAI Responses, przepisaniami aliasów
  Grok fast-mode, domyślnym `tool_stream`, porządkowaniem strict-tool / reasoning-payload,
  ponownym użyciem fallback auth dla narzędzi należących do pluginu, rozwiązywaniem modeli Grok
  zgodnym z przyszłością oraz poprawkami compat należącymi do providera, takimi jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` i dekodowanie argumentów wywołań narzędzi z encji HTML.
- Mistral, OpenCode Zen i OpenCode Go używają wyłącznie `capabilities`, aby utrzymać
  niuanse transkrypcji/narzędzi poza core.
- Dostawcy wbudowani tylko z katalogiem, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  wyłącznie `catalog`.
- Qwen używa `catalog` dla swojego providera tekstowego oraz współdzielonych rejestracji rozumienia mediów i
  generowania wideo dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków usage, ponieważ ich zachowanie `/usage`
  należy do pluginu, mimo że inferencja nadal działa przez współdzielone transporty.

## Helpery runtime

Pluginy mogą uzyskiwać dostęp do wybranych helperów core przez `api.runtime`. Dla TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Uwagi:

- `textToSpeech` zwraca normalny ładunek wyjścia TTS core dla powierzchni plików/notatek głosowych.
- Używa konfiguracji core `messages.tts` i wyboru providera.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą wykonać resampling/kodowanie dla providerów.
- `listVoices` jest opcjonalne dla danego providera. Używaj go dla selektorów głosów albo przepływów setup należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla selektorów świadomych providera.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą też rejestrować providerów mowy przez `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Uwagi:

- Zachowaj politykę TTS, fallback i dostarczanie odpowiedzi w core.
- Używaj providerów mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora providera `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może zarządzać
  tekstem, mową, obrazem i przyszłymi providerami mediów, gdy OpenClaw doda te
  kontrakty możliwości.

Dla rozumienia obrazu/audio/wideo pluginy rejestrują jednego typowanego
providera rozumienia mediów zamiast generycznego worka klucz/wartość:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Uwagi:

- Zachowaj orkiestrację, fallback, konfigurację i powiązanie kanałów w core.
- Zachowaj zachowanie dostawcy w pluginie providera.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyniku, nowe opcjonalne możliwości.
- Generowanie wideo już podąża za tym samym wzorcem:
  - core zarządza kontraktem możliwości i helperem runtime
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

Dla helperów runtime rozumienia mediów pluginy mogą wywoływać:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Dla transkrypcji audio pluginy mogą używać albo runtime rozumienia mediów,
albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` to preferowana współdzielona powierzchnia dla
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rozumienia mediów z core (`tools.media.audio`) oraz kolejności fallbacku providera.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład dla pominiętego/nieobsługiwanego wejścia).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą też uruchamiać subagentów w tle przez `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Uwagi:

- `provider` i `model` to opcjonalne nadpisania dla danego uruchomienia, a nie trwałe zmiany sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla uruchomień fallback należących do pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Uruchomienia subagentów z niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przechodzić do fallbacku.

Dla wyszukiwania w sieci pluginy mogą używać współdzielonego helpera runtime zamiast
sięgać do powiązań narzędzia agenta:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Pluginy mogą też rejestrować providerów wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór providera, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w core.
- Używaj providerów wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: generuje obraz przy użyciu skonfigurowanego łańcucha providerów generowania obrazów.
- `listProviders(...)`: wyświetla dostępnych providerów generowania obrazów i ich możliwości.

## Trasy HTTP Gateway

Pluginy mogą wystawiać punkty końcowe HTTP przez `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Pola trasy:

- `path`: ścieżka trasy pod serwerem HTTP gateway.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego auth gateway, albo `"plugin"` dla auth zarządzanego przez plugin / weryfikacji webhooka.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnego `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Służą do webhooków/weryfikacji podpisów zarządzanych przez plugin, a nie do uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - bearer auth ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP niosące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach tras pluginów niosących tożsamość, zakres runtime wraca do `operator.write`
- Zasada praktyczna: nie zakładaj, że trasa pluginu z auth gateway jest niejawną powierzchnią administracyjną. Jeśli Twoja trasa potrzebuje zachowania tylko dla administratora, wymagaj trybu auth niosącego tożsamość i opisz jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia pluginów używaj podścieżek SDK zamiast monolitycznego importu `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` dla prymitywów rejestracji pluginów.
- `openclaw/plugin-sdk/core` dla ogólnego współdzielonego kontraktu widocznego dla pluginów.
- `openclaw/plugin-sdk/config-schema` dla eksportu głównego schematu Zod `openclaw.json`
  (`OpenClawSchema`).
- Stabilne prymitywy kanałów, takie jak `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` oraz
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonego
  powiązania setup/auth/odpowiedzi/webhooków. `channel-inbound` jest współdzielonym miejscem dla debounce, dopasowywania wzmianek,
  helperów polityki wzmianek przychodzących, formatowania kopert przychodzących i helperów kontekstu
  kopert przychodzących.
  `channel-setup` to wąski szew setup opcjonalnej instalacji.
  `setup-runtime` to bezpieczna runtime powierzchnia setup używana przez `setupEntry` /
  opóźnione uruchamianie, w tym bezpieczne importowo adaptery patch setup.
  `setup-adapter-runtime` to zależny od env szew adaptera setup kont.
  `setup-tools` to mały szew helperów CLI/archiwów/dokumentacji (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Podścieżki domenowe, takie jak `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` oraz
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych helperów runtime/konfiguracji.
  `telegram-command-config` to wąski publiczny szew dla normalizacji/walidacji niestandardowych
  poleceń Telegram i pozostaje dostępny nawet wtedy, gdy powierzchnia kontraktu wbudowanego Telegram jest tymczasowo niedostępna.
  `text-runtime` to współdzielony szew tekst/markdown/logowanie, obejmujący
  usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkowania markdown, helpery redakcji,
  helpery tagów dyrektyw i narzędzia bezpiecznego tekstu.
- Szwy kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt `approvalCapability`
  na pluginie. Core odczytuje wtedy auth zatwierdzeń, dostarczanie, renderowanie,
  natywne routowanie i zachowanie leniwego natywnego handlera przez tę jedną możliwość
  zamiast mieszać zachowanie zatwierdzeń z niepowiązanymi polami pluginu.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje tylko jako
  shim zgodności dla starszych pluginów. Nowy kod powinien importować węższe
  ogólne prymitywy, a kod repozytorium nie powinien dodawać nowych importów tego
  shimu.
- Wnętrza wbudowanych rozszerzeń pozostają prywatne. Zewnętrzne pluginy powinny używać tylko podścieżek `openclaw/plugin-sdk/*`. Kod core/testów OpenClaw może używać publicznych punktów wejścia repozytorium pod katalogiem głównym pakietu pluginu, takich jak `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` oraz wąsko ograniczonych plików takich jak
  `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu pluginu z core ani z
  innego rozszerzenia.
- Podział punktów wejścia repozytorium:
  `<plugin-package-root>/api.js` to barrel helperów/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko runtime,
  `<plugin-package-root>/index.js` to punkt wejścia wbudowanego pluginu,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia pluginu setup.
- Aktualne przykłady wbudowanych providerów:
  - Anthropic używa `api.js` / `contract-api.js` dla helperów streamu Claude, takich
    jak `wrapAnthropicProviderStream`, helpery nagłówków beta i parsowanie `service_tier`.
  - OpenAI używa `api.js` dla builderów providerów, helperów modeli domyślnych i
    builderów providerów realtime.
  - OpenRouter używa `api.js` dla swojego buildera providera oraz helperów onboardingu/konfiguracji,
    podczas gdy `register.runtime.js` może nadal re-eksportować ogólne
    helpery `plugin-sdk/provider-stream` do użytku lokalnego w repozytorium.
- Publiczne punkty wejścia ładowane przez facade preferują aktywny snapshot konfiguracji runtime,
  gdy taki istnieje, a następnie wracają do rozwiązanego pliku konfiguracji na dysku, gdy
  OpenClaw nie udostępnia jeszcze snapshotu runtime.
- Ogólne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje mały
  zastrzeżony zestaw szwów helperów markowanych kanałami wbudowanymi. Traktuj je jako
  szwy utrzymaniowe/zgodności dla wbudowanych komponentów, a nie jako nowe cele importu dla third-party; nowe kontrakty międzykanałowe powinny nadal trafiać do
  ogólnych podścieżek `plugin-sdk/*` albo lokalnych barrelów pluginu `api.js` /
  `runtime-api.js`.

Uwaga o zgodności:

- Unikaj głównego barrela `openclaw/plugin-sdk` w nowym kodzie.
- Najpierw preferuj wąskie stabilne prymitywy. Nowsze podścieżki setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool są zamierzonym kontraktem dla nowych prac nad
  pluginami wbudowanymi i zewnętrznymi.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki akcji wiadomości i helpery message-id reakcji należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrele helperów specyficznych dla wbudowanych rozszerzeń nie są domyślnie stabilne. Jeśli
  helper jest potrzebny tylko wbudowanemu rozszerzeniu, trzymaj go za lokalnym
  szwem `api.js` albo `runtime-api.js` tego rozszerzenia zamiast promować go do
  `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone szwy helperów powinny być ogólne, a nie markowane kanałami. Współdzielone parsowanie celów
  należy do `openclaw/plugin-sdk/channel-targets`; wnętrza specyficzne dla kanału
  pozostają za lokalnym szwem `api.js` albo `runtime-api.js` należącego do pluginu.
- Podścieżki specyficzne dla możliwości, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ wbudowane/natywne pluginy używają
  ich dziś. Sama ich obecność nie oznacza, że każdy eksportowany helper jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia wiadomości

Pluginy powinny zarządzać wkładem do schematu `describeMessageTool(...)` specyficznym dla kanału.
Trzymaj pola specyficzne dla providera w pluginie, a nie we współdzielonym core.

Dla współdzielonych przenośnych fragmentów schematu używaj ponownie ogólnych helperów eksportowanych przez
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` dla ładunków w stylu siatki przycisków
- `createMessageToolCardSchema()` dla strukturalnych ładunków kart

Jeśli dany kształt schematu ma sens tylko dla jednego providera, zdefiniuj go we
własnym źródle tego pluginu zamiast promować go do współdzielonego SDK.

## Rozwiązywanie celów kanału

Pluginy kanałów powinny zarządzać semantyką celów specyficzną dla kanału. Zachowaj współdzielony
host outbound w formie ogólnej i używaj powierzchni adaptera wiadomości dla reguł providera:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` albo `channel` przed wyszukaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy dane
  wejście powinno przejść od razu do rozwiązywania podobnego do id zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy
  core potrzebuje ostatecznego rozstrzygnięcia należącego do providera po normalizacji albo po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` zarządza konstrukcją trasy sesji
  specyficzną dla providera po rozstrzygnięciu celu.

Zalecany podział:

- Używaj `inferTargetChatType` dla decyzji o kategorii, które powinny nastąpić przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` dla kontroli typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` dla fallbacku normalizacji specyficznego dla providera, a nie dla
  szerokiego wyszukiwania w katalogu.
- Trzymaj natywne identyfikatory providera, takie jak chat id, thread id, JID, handle i room
  id, wewnątrz wartości `target` albo parametrów specyficznych dla providera, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu ograniczone do konta

Współdzielone helpery w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitów
- deduplikację/helpery normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji pluginu.

## Katalogi providerów

Pluginy providerów mogą definiować katalogi modeli dla inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu providera
- `{ providers }` dla wielu wpisów providerów

Używaj `catalog`, gdy plugin zarządza identyfikatorami modeli specyficznymi dla providera, domyślnymi
wartościami base URL albo metadanymi modeli zależnymi od auth.

`catalog.order` kontroluje, kiedy katalog pluginu jest scalany względem
wbudowanych niejawnych providerów OpenClaw:

- `simple`: zwykli providerzy sterowani kluczem API albo env
- `profile`: providerzy pojawiający się, gdy istnieją profile auth
- `paired`: providerzy syntetyzujący wiele powiązanych wpisów providerów
- `late`: ostatnie przejście, po innych niejawnych providerach

Późniejsi providerzy wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisywać
wbudowany wpis providera o tym samym identyfikatorze providera.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowane są jednocześnie `catalog` i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko zakończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/naprawy config,
  nie powinny potrzebować materializowania poświadczeń runtime tylko po to, by
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Dołączaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu.
  Zwrócenie `tokenStatus: "available"` (oraz odpowiadającego pola źródła)
  wystarcza dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia” zamiast się wykrzaczać lub błędnie raportować konto jako nieskonfigurowane.

## Package packs

Katalog pluginu może zawierać `package.json` z `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się pluginem. Jeśli pakiet zawiera wiele rozszerzeń, identyfikator pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Ograniczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginów przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności dev w runtime). Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów wymagających buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do setup.
Gdy OpenClaw potrzebuje powierzchni setup dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia pluginu. Dzięki temu uruchamianie i setup są lżejsze,
gdy główny punkt wejścia pluginu konfiguruje też narzędzia, hooki albo inny kod
tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do tej samej ścieżki `setupEntry` podczas fazy
uruchamiania Gateway przed listen, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startową, która musi istnieć
zanim Gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis setup
musi rejestrować każdą możliwość należącą do kanału, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne zanim Gateway zacznie nasłuchiwać
- wszelkie metody Gateway, narzędzia albo usługi, które muszą istnieć w tym samym oknie

Jeśli pełny wpis nadal zarządza jakąkolwiek wymaganą możliwością startową, nie włączaj
tej flagi. Zachowaj domyślne zachowanie pluginu i pozwól OpenClaw załadować
pełny wpis podczas uruchamiania.

Wbudowane kanały mogą też publikować helpery powierzchni kontraktu tylko do setup, z których core
może korzystać zanim pełny runtime kanału zostanie załadowany. Obecna powierzchnia
promocji setup to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi promować starszą konfigurację kanału z jednym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu.
Matrix jest obecnym przykładem wbudowanym: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery patch setup utrzymują leniwe wykrywanie powierzchni kontraktu wbudowanych komponentów. Czas
importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast
ponownie wchodzić w uruchamianie wbudowanego kanału przy imporcie modułu.

Gdy te powierzchnie startowe obejmują metody Gateway RPC, trzymaj je na
prefiksie specyficznym dla pluginu. Przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze rozwiązują się
do `operator.admin`, nawet jeśli plugin żąda węższego zakresu.

Przykład:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadane katalogu kanałów

Pluginy kanałów mogą reklamować metadane setup/wykrywania przez `openclaw.channel` i
wskazówki instalacji przez `openclaw.install`. Dzięki temu dane katalogu pozostają poza core.

Przykład:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Przydatne pola `openclaw.channel` poza minimalnym przykładem:

- `detailLabel`: etykieta pomocnicza dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisanie tekstu linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrola treści powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący markdown dla decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach listy skonfigurowanych kanałów po ustawieniu na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych selektorach setup/konfiguracji po ustawieniu na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu quickstart `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów announce

OpenClaw może też scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkiem/średnikiem/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje też `"packages"` albo `"plugins"` jako starsze aliasy klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu zarządzają orkiestracją kontekstu sesji dla ingestu, składania
i Compaction. Rejestruj je ze swojego pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój plugin musi zastąpić albo rozszerzyć domyślny potok
kontekstu, a nie tylko dodać wyszukiwanie memory albo hooki.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jeśli Twój silnik **nie** zarządza algorytmem Compaction, zachowaj implementację `compact()`
i jawnie go deleguj:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Dodawanie nowej możliwości

Gdy plugin potrzebuje zachowania, które nie pasuje do bieżącego API, nie omijaj
systemu pluginów prywatnym reach-in. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakim współdzielonym zachowaniem powinien zarządzać core: polityką, fallbackiem, scalaniem konfiguracji,
   cyklem życia, semantyką widoczną dla kanałów i kształtem helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów core + kanałów/funkcji
   Kanały i pluginy funkcjonalne powinny używać nowej możliwości przez core,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują potem swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji z czasem pozostawały jawne.

W ten sposób OpenClaw pozostaje opiniotwórczy bez twardego zakodowania według
światopoglądu jednego providera. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby poznać konkretną checklistę plików i gotowy przykład.

### Checklist możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna jednocześnie dotknąć tych
powierzchni:

- typy kontraktu core w `src/<capability>/types.ts`
- runner/helper runtime core w `src/<capability>/runtime.ts`
- powierzchnię rejestracji API pluginów w `src/plugins/types.ts`
- powiązanie rejestru pluginów w `src/plugins/registry.ts`
- ekspozycję runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą jej używać
- helpery przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentację operatora/pluginów w `docs/`

Jeśli brakuje jednej z tych powierzchni, zwykle jest to znak, że możliwość nie jest
jeszcze w pełni zintegrowana.

### Szablon możliwości

Minimalny wzorzec:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Wzorzec testu kontraktowego:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

To utrzymuje prostą zasadę:

- core zarządza kontraktem możliwości + orkiestracją
- pluginy dostawców zarządzają implementacjami dostawców
- pluginy funkcji/kanałów używają helperów runtime
- testy kontraktowe utrzymują jawną własność
