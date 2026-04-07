---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu capabilities pluginów lub granic własności
    - Praca nad pipeline ładowania pluginów lub rejestrem
    - Implementacja hooków runtime dostawców lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wnętrze pluginów: model capabilities, własność, kontrakty, pipeline ładowania i pomocniki runtime'
title: Wnętrze pluginów
x-i18n:
    generated_at: "2026-04-07T09:50:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a48b387152c5a6a9782c5aaa9d6c215c16adb7cb256302d3e85f80b03f9b6898
    source_path: plugins/architecture.md
    workflow: 15
---

# Wnętrze pluginów

<Info>
  To jest **szczegółowa dokumentacja architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalowanie i używanie pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — pierwszy samouczek tworzenia pluginu
  - [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie kanału wiadomości
  - [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — tworzenie dostawcy modeli
  - [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu pluginów OpenClaw.

## Publiczny model capabilities

Capabilities to publiczny model **natywnych pluginów** wewnątrz OpenClaw. Każdy
natywny plugin OpenClaw rejestruje się względem co najmniej jednego typu capability:

| Capability             | Metoda rejestracji                            | Przykładowe pluginy                 |
| ---------------------- | --------------------------------------------- | ----------------------------------- |
| Wnioskowanie tekstowe  | `api.registerProvider(...)`                   | `openai`, `anthropic`               |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`               | `openai`, `anthropic`               |
| Mowa                   | `api.registerSpeechProvider(...)`             | `elevenlabs`, `microsoft`           |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`               |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`   | `openai`                            |
| Rozumienie mediów      | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                  |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`    | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`    | `google`, `minimax`                 |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`    | `qwen`                              |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`           | `firecrawl`                         |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`          | `google`                            |
| Kanał / wiadomości     | `api.registerChannel(...)`                    | `msteams`, `matrix`                 |

Plugin, który rejestruje zero capabilities, ale dostarcza hooki, narzędzia lub
usługi, to **starszy plugin tylko z hookami**. Ten wzorzec nadal jest w pełni obsługiwany.

### Stan kompatybilności zewnętrznej

Model capabilities jest już wdrożony w core i używany przez dołączone/natywne pluginy
już dziś, ale kompatybilność z zewnętrznymi pluginami nadal wymaga wyższego progu niż „jest
eksportowane, więc jest zamrożone”.

Aktualne wytyczne:

- **istniejące pluginy zewnętrzne:** utrzymuj integracje oparte na hookach w działaniu; traktuj
  to jako bazowy poziom kompatybilności
- **nowe dołączone/natywne pluginy:** preferuj jawną rejestrację capabilities zamiast
  zależności specyficznych dla dostawcy lub nowych projektów tylko z hookami
- **zewnętrzne pluginy przyjmujące rejestrację capabilities:** dozwolone, ale traktuj
  pomocnicze powierzchnie specyficzne dla capability jako rozwijające się, dopóki dokumentacja
  wyraźnie nie oznaczy kontraktu jako stabilnego

Praktyczna zasada:

- API rejestracji capabilities to zamierzony kierunek
- starsze hooki pozostają najbezpieczniejszą ścieżką bez ryzyka złamania dla zewnętrznych pluginów w trakcie
  przejścia
- eksportowane subścieżki pomocnicze nie są sobie równe; preferuj wąski udokumentowany
  kontrakt, a nie przypadkowe eksporty pomocnicze

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin według jego faktycznego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ capability (na przykład
  plugin tylko dostawcy, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów capability (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie mediów i
  generowanie obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub niestandardowe), bez capabilities,
  narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale bez
  capabilities

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i rozkład
capabilities. Szczegóły znajdziesz w [dokumentacji CLI](/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka kompatybilności dla
pluginów tylko z hookami. Istniejące rzeczywiste pluginy nadal od niego zależą.

Kierunek:

- zachować działanie
- dokumentować jako starszy
- preferować `before_model_resolve` dla pracy z nadpisywaniem modelu/dostawcy
- preferować `before_prompt_build` dla modyfikacji promptów
- usunąć dopiero, gdy rzeczywiste użycie spadnie, a pokrycie testami fixture potwierdzi bezpieczeństwo migracji

### Sygnały kompatybilności

Gdy uruchamiasz `openclaw doctor` albo `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | Konfiguracja parsuje się poprawnie, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe    |
| **hard error**             | Konfiguracja jest nieprawidłowa albo plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie złamią dziś Twojego pluginu --
`hook-only` ma charakter informacyjny, a `before_agent_start` wywołuje tylko ostrzeżenie. Te
sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydackie pluginy w skonfigurowanych ścieżkach, korzeniach workspace,
   globalnych korzeniach rozszerzeń i wśród dołączonych rozszerzeń. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundle.
2. **Włączanie + walidacja**
   Core decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany czy
   wybrany do ekskluzywnego slotu, takiego jak pamięć.
3. **Ładowanie runtime**
   Natywne pluginy OpenClaw są ładowane w tym samym procesie przez jiti i rejestrują
   capabilities w centralnym rejestrze. Zgodne bundle są normalizowane do rekordów
   rejestru bez importowania kodu runtime.
4. **Zużycie powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępnić narzędzia, kanały, konfigurację
   dostawców, hooki, trasy HTTP, polecenia CLI i usługi.

W przypadku pluginowego CLI wykrywanie poleceń głównych jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI pluginu może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje wewnątrz pluginu, a OpenClaw nadal może
zarezerwować nazwy głównych poleceń przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie runtime pochodzi ze ścieżki modułu pluginu `register(api)`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować wskazówki UI/schematu, zanim pełny runtime stanie się aktywny.

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia wysyłania/edycji/reakcji dla
zwykłych akcji czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core, a
pluginy kanałów obsługują specyficzne dla kanału wykrywanie i wykonanie za nim.

Obecna granica wygląda tak:

- core odpowiada za host współdzielonego narzędzia `message`, podłączenie promptów, ewidencję
  sesji/wątków oraz dyspozycję wykonania
- pluginy kanałów odpowiadają za wykrywanie akcji z odpowiednim zakresem, wykrywanie capabilities oraz
  wszelkie fragmenty schematu specyficzne dla kanału
- pluginy kanałów odpowiadają za gramatykę konwersacji sesji specyficzną dla dostawcy, na przykład
  sposób, w jaki identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą po konwersacjach nadrzędnych
- pluginy kanałów wykonują końcową akcję przez swój adapter akcji

W przypadku pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania
pozwala pluginowi zwrócić widoczne akcje, capabilities i wkłady do schematu
razem, tak aby te elementy nie rozjeżdżały się między sobą.

Core przekazuje zakres runtime do tego kroku wykrywania. Ważne pola to:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufany przychodzący `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać
akcje wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości lub
zaufanej tożsamości żądającego, bez twardego kodowania gałęzi specyficznych dla kanału w
narzędziu `message` w core.

Dlatego zmiany routingu embedded-runner nadal są pracą pluginową: runner jest
odpowiedzialny za przekazanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, tak aby współdzielone
narzędzie `message` udostępniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku pomocników wykonania należących do kanału dołączone pluginy powinny utrzymywać runtime
wykonania we własnych modułach rozszerzenia. Core nie odpowiada już za
runtime akcji wiadomości Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy osobnych subścieżek `plugin-sdk/*-action-runtime`, a dołączone
pluginy powinny importować własny lokalny kod runtime bezpośrednio ze swoich
modułów rozszerzeń.

Ta sama granica dotyczy ogólnie nazwanych po dostawcach szczelin SDK: core nie
powinno importować wygodnych barrelów specyficznych dla kanałów takich jak Slack, Discord, Signal,
WhatsApp ani podobnych rozszerzeń. Jeśli core potrzebuje jakiegoś zachowania, powinno albo
skorzystać z własnego barrela `api.ts` / `runtime-api.ts` dołączonego pluginu, albo podnieść potrzebę
do poziomu wąskiego ogólnego capability we współdzielonym SDK.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów pasujących do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału lub dodatkowych parametrów ankiet

Core odracza teraz współdzielone parsowanie ankiet do momentu, gdy pluginowa dyspozycja ankiety odrzuci
akcję, aby należące do pluginu handlery ankiet mogły akceptować pola ankiet specyficzne dla kanału
bez blokowania najpierw przez ogólny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w sekcji [Pipeline ładowania](#load-pipeline).

## Model własności capabilities

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** albo
**funkcji**, a nie jako worek niepowiązanych integracji.

To oznacza, że:

- plugin firmy powinien zazwyczaj posiadać wszystkie powierzchnie OpenClaw-facing tej firmy
- plugin funkcji powinien zazwyczaj posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny korzystać ze współdzielonych capabilities core zamiast doraźnie
  ponownie implementować zachowania dostawców

Przykłady:

- dołączony plugin `openai` posiada zachowanie dostawcy modeli OpenAI i zachowanie OpenAI
  dla mowy + głosu w czasie rzeczywistym + rozumienia mediów + generowania obrazów
- dołączony plugin `elevenlabs` posiada zachowanie mowy ElevenLabs
- dołączony plugin `microsoft` posiada zachowanie mowy Microsoft
- dołączony plugin `google` posiada zachowanie dostawcy modeli Google oraz Google
  media-understanding + image-generation + web-search
- dołączony plugin `firecrawl` posiada zachowanie web-fetch Firecrawl
- dołączone pluginy `minimax`, `mistral`, `moonshot` i `zai` posiadają swoje
  backendy media-understanding
- plugin `voice-call` jest pluginem funkcji: posiada transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumieni mediów Twilio, ale korzysta ze współdzielonych capabilities
  mowy oraz transkrypcji i głosu w czasie rzeczywistym zamiast bezpośrednio importować pluginy dostawców

Zamierzony stan końcowy jest taki:

- OpenAI znajduje się w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru
- kanałów nie obchodzi, który plugin dostawcy posiada dostawcę; korzystają ze
  współdzielonego kontraktu capability udostępnianego przez core

To kluczowe rozróżnienie:

- **plugin** = granica własności
- **capability** = kontrakt core, który wiele pluginów może implementować lub wykorzystywać

Jeśli więc OpenClaw doda nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który dostawca powinien zakodować na sztywno obsługę wideo?”. Pierwsze pytanie brzmi „jaki jest
kontrakt core capability dla wideo?”. Gdy taki kontrakt istnieje, pluginy dostawców
mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą z niego korzystać.

Jeśli capability jeszcze nie istnieje, właściwym ruchem jest zazwyczaj:

1. zdefiniowanie brakującego capability w core
2. udostępnienie go przez API/runtime pluginów w sposób typowany
3. podłączenie kanałów/funkcji do tego capability
4. pozwolenie pluginom dostawców na rejestrowanie implementacji

Pozwala to zachować jawną własność, unikając jednocześnie zachowań core zależnych od
jednego dostawcy lub jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie capabilities

Używaj tego modelu mentalnego przy decydowaniu, gdzie powinien znajdować się kod:

- **warstwa core capability**: współdzielona orkiestracja, zasady, fallback, konfiguracja,
  reguły scalania, semantyka dostarczania i typowane kontrakty
- **warstwa pluginu dostawcy**: API specyficzne dla dostawcy, auth, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa pluginu kanału/funkcji**: integracja Slack/Discord/voice-call/itp.,
  która korzysta z capabilities core i prezentuje je na określonej powierzchni

Na przykład TTS wygląda tak:

- core posiada politykę TTS podczas odpowiedzi, kolejność fallback, preferencje i dostarczanie przez kanały
- `openai`, `elevenlabs` i `microsoft` posiadają implementacje syntezy
- `voice-call` korzysta z pomocnika runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych capabilities.

### Przykład firmowego pluginu o wielu capabilities

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów,
generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci,
dostawca może posiadać wszystkie swoje powierzchnie w jednym miejscu:

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

Ważne nie są dokładne nazwy helperów. Ważny jest kształt:

- jeden plugin posiada powierzchnię dostawcy
- core nadal posiada kontrakty capabilities
- kanały i pluginy funkcji korzystają z helperów `api.runtime.*`, a nie z kodu dostawcy
- testy kontraktowe mogą sprawdzać, że plugin zarejestrował capabilities,
  których własność deklaruje

### Przykład capability: rozumienie wideo

OpenClaw już traktuje rozumienie obrazu/dźwięku/wideo jako jedno współdzielone
capability. Stosuje się tu ten sam model własności:

1. core definiuje kontrakt media-understanding
2. pluginy dostawców rejestrują odpowiednio `describeImage`, `transcribeAudio` i
   `describeVideo`
3. kanały i pluginy funkcji korzystają ze współdzielonego zachowania core zamiast
   podłączać się bezpośrednio do kodu dostawcy

Pozwala to uniknąć wbudowania założeń jednego dostawcy o wideo w core. Plugin posiada
powierzchnię dostawcy; core posiada kontrakt capability i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: core posiada typowany
kontrakt capability i helper runtime, a pluginy dostawców rejestrują implementacje
`api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy wdrożeniowej? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji i
pomocniki runtime, na których plugin może polegać.

Dlaczego to ważne:

- autorzy pluginów dostają jeden stabilny standard wewnętrzny
- core może odrzucać duplikaty własności, na przykład dwa pluginy rejestrujące ten sam
  identyfikator dostawcy
- uruchamianie może pokazywać diagnostykę nadającą się do działania dla błędnych rejestracji
- testy kontraktowe mogą wymuszać własność dołączonych pluginów i zapobiegać cichemu dryfowi

Są tu dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w runtime**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy i błędne
   rejestracje generują diagnostykę pluginu zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Dołączone pluginy są przechwytywane do rejestrów kontraktowych podczas uruchamiania testów, aby
   OpenClaw mogło jawnie sprawdzać własność. Dziś jest to używane dla dostawców modeli,
   dostawców mowy, dostawców wyszukiwania w sieci i własności rejestracji dołączonych pluginów.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin posiada którą
powierzchnię. Dzięki temu core i kanały mogą komponować się bezproblemowo, ponieważ własność jest
zadeklarowana, typowana i testowalna, a nie ukryta.

### Co powinno należeć do kontraktu

Dobre kontrakty pluginów są:

- typowane
- małe
- specyficzne dla capability
- należące do core
- wielokrotnego użytku przez wiele pluginów
- możliwe do wykorzystania przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty pluginów to:

- zasady specyficzne dla dostawcy ukryte w core
- jednorazowe furtki pluginów omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- ad hoc obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj capability, a
potem pozwól pluginom się do niego podłączyć.

## Model wykonania

Natywne pluginy OpenClaw działają **w tym samym procesie** co Gateway. Nie są
sandboxowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co
kod core.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może doprowadzić do awarii albo destabilizacji gateway
- złośliwy natywny plugin jest równoważny wykonaniu dowolnego kodu wewnątrz
  procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W obecnych wydaniach oznacza to głównie dołączone
Skills.

W przypadku niedołączonych pluginów używaj list dozwolonych i jawnych ścieżek instalacji/ładowania. Traktuj
pluginy workspace jako kod czasu developmentu, a nie jako domyślne ustawienia produkcyjne.

W przypadku nazw pakietów dołączonych workspace zachowuj identyfikator pluginu zakotwiczony w nazwie npm:
domyślnie `@openclaw/<id>`, albo zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo ujawnia węższą rolę pluginu.

Ważna uwaga dotycząca zaufania:

- `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła.
- Plugin workspace z tym samym identyfikatorem co dołączony plugin celowo przesłania
  dołączoną kopię, gdy taki plugin workspace jest włączony/na liście dozwolonych.
- To normalne i przydatne przy lokalnym developmentcie, testowaniu poprawek i hotfixach.

## Granica eksportu

OpenClaw eksportuje capabilities, a nie wygodne implementacje.

Zachowuj publiczną rejestrację capabilities. Ogranicz eksporty helperów niebędących kontraktem:

- subścieżki helperów specyficznych dla dołączonych pluginów
- subścieżki infrastruktury runtime, które nie są przeznaczone jako publiczne API
- wygodne helpery specyficzne dla dostawcy
- helpery konfiguracji/onboardingu będące szczegółami implementacji

Niektóre subścieżki helperów dołączonych pluginów nadal pozostają w wygenerowanej mapie eksportu SDK
dla kompatybilności i utrzymania dołączonych pluginów. Obecne przykłady to
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka szczelin `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty będące szczegółami implementacji, a nie jako zalecany wzorzec SDK dla
nowych pluginów third-party.

## Pipeline ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu to:

1. wykrywa korzenie kandydackich pluginów
2. odczytuje manifesty natywne lub zgodnych bundle oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone moduły natywne przez jiti
7. wywołuje natywne hooki `register(api)` (lub `activate(api)` — starszy alias) i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje to, co jest obecne (`def.register ?? def.activate`) i wywołuje w tym samym miejscu. Wszystkie dołączone pluginy używają `register`; w przypadku nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza korzeń pluginu, ścieżka jest zapisywalna globalnie albo
własność ścieżki wygląda podejrzanie w przypadku niedołączonych pluginów.

### Zachowanie manifest-first

Manifest jest źródłem prawdy dla control plane. OpenClaw używa go do:

- identyfikacji pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub capabilities bundle
- walidacji `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu

Dla natywnych pluginów moduł runtime jest częścią data plane. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia czy przepływy dostawców.

### Co cache’uje loader

OpenClaw utrzymuje krótkie cache w procesie dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów pluginów

Te cache zmniejszają skokowy koszt uruchamiania i powtarzanych poleceń. Można bezpiecznie
myśleć o nich jako o krótkotrwałych cache wydajnościowych, a nie o trwałym przechowywaniu.

Uwaga wydajnościowa:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` lub
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache.
- Dostrajaj okna cache przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie modyfikują bezpośrednio losowych globali core. Rejestrują się do
centralnego rejestru pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i hooki typowane
- kanały
- dostawców
- handlery RPC gateway
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- polecenia należące do pluginów

Funkcje core następnie odczytują z tego rejestru zamiast komunikować się bezpośrednio
z modułami pluginów. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime core -> korzystanie z rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje tylko
jednego punktu integracji: „odczytaj rejestr”, a nie „twórz specjalny przypadek dla każdego modułu pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po tym, jak żądanie powiązania zostanie zatwierdzone lub odrzucone:

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

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozwiązane powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane konwersacji

Ten callback służy tylko do powiadamiania. Nie zmienia, kto może wiązać konwersację, i działa po zakończeniu obsługi zatwierdzenia przez core.

## Hooki runtime dostawców

Pluginy dostawców mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` do taniego wyszukiwania auth dostawcy z env
  przed załadowaniem runtime, `channelEnvVars` do taniego wyszukiwania env/konfiguracji kanału
  przed załadowaniem runtime oraz `providerAuthChoices` do tanich etykiet onboardingu/wyboru auth
  i metadanych flag CLI przed załadowaniem runtime
- hooki czasu konfiguracji: `catalog` / starsze `discovery` plus `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw nadal posiada ogólną pętlę agenta, failover, obsługę transkryptu i
politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowań specyficznych dla dostawcy bez
potrzeby całkowicie niestandardowego transportu wnioskowania.

Używaj manifestowego `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/model-picker powinny widzieć bez ładowania runtime pluginu.
Używaj manifestowego `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru auth powinny
znać identyfikator wyboru dostawcy, etykiety grup i proste powiązanie auth jedną flagą bez ładowania runtime dostawcy.
Zachowaj runtime dostawcy `envVars` dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne
konfiguracji OAuth client-id/client-secret.

Używaj manifestowego `channelEnvVars`, gdy kanał ma auth lub konfigurację opartą na env, które
ogólny fallback shell-env, kontrole konfiguracji/statusu lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i użycie

Dla pluginów modeli/dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” jest szybką wskazówką decyzyjną.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca posiada katalog albo domyślne `baseUrl`                                                                                           |
| 2   | `applyConfigDefaults`             | Stosuje domyślne wartości konfiguracji należące do dostawcy podczas materializacji konfiguracji               | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli dostawcy                                                         |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook pluginu)_                                                                                                               |
| 3   | `normalizeModelId`                | Normalizuje starsze lub preview aliasy identyfikatorów modeli przed wyszukaniem                               | Dostawca posiada czyszczenie aliasów przed rozwiązaniem modelu kanonicznego                                                                |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawców przed ogólnym składaniem modelu                               | Dostawca posiada czyszczenie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                    |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązaniem runtime/dostawcy                                        | Dostawca potrzebuje czyszczenia konfiguracji, które powinno znajdować się przy pluginie; dołączone helpery rodziny Google dodatkowo wspierają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywania kompatybilności natywnego użycia streamingu do dostawców konfiguracji                   | Dostawca potrzebuje poprawek metadanych natywnego użycia streamingu zależnych od endpointu                                                |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth markerów env dla dostawców konfiguracji przed ładowaniem auth runtime                         | Dostawca ma własne rozwiązywanie kluczy API markerów env; `amazon-bedrock` ma tu także wbudowany resolver markerów env AWS               |
| 8   | `resolveSyntheticAuth`            | Ujawnia lokalne/self-hosted lub wspierane konfiguracją auth bez utrwalania jawnego tekstu                     | Dostawca może działać z syntetycznym/lokalnym markerem poświadczenia                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Nakłada należące do dostawcy profile zewnętrznego auth; domyślna `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie wykorzystuje poświadczenia zewnętrznego auth bez utrwalania skopiowanych refresh tokenów                                |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych placeholderów profili względem auth wspieranego przez env/konfigurację | Dostawca przechowuje syntetyczne placeholdery profili, które nie powinny wygrywać priorytetu                                              |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                  |
| 12  | `prepareDynamicModel`             | Asynchroniczny warm-up, po którym `resolveDynamicModel` uruchamia się ponownie                                | Dostawca potrzebuje metadanych z sieci przed rozwiązaniem nieznanych identyfikatorów                                                      |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez embedded runner                                   | Dostawca potrzebuje przepisania transportu, ale nadal używa transportu core                                                                |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi kompatybilności dla modeli dostawcy ukrytych za innym zgodnym transportem                        | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania roli dostawcy                                                    |
| 15  | `capabilities`                    | Należące do dostawcy metadane transkryptu/narzędzi używane przez współdzieloną logikę core                   | Dostawca potrzebuje niuansów transkryptu/rodziny dostawcy                                                                                  |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je embedded runner                                               | Dostawca potrzebuje czyszczenia schematów rodziny transportu                                                                               |
| 17  | `inspectToolSchemas`              | Ujawnia diagnostykę schematów należącą do dostawcy po normalizacji                                            | Dostawca chce ostrzeżenia o słowach kluczowych bez uczenia core reguł specyficznych dla dostawcy                                          |
| 18  | `resolveReasoningOutputMode`      | Wybiera natywny lub tagowany kontrakt wyniku reasoning                                                        | Dostawca potrzebuje tagowanego reasoning/final output zamiast natywnych pól                                                                |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji streamu                                       | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów per dostawca                                                 |
| 20  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę streamu niestandardowym transportem                                       | Dostawca potrzebuje niestandardowego protokołu sieciowego, a nie tylko wrappera                                                           |
| 21  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu ogólnych wrapperów                                                         | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modelu bez niestandardowego transportu                                           |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu per tura                                                     | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cooldown sesji                                                | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji albo politykę fallback                                                  |
| 24  | `formatApiKey`                    | Formater profilu auth: zapisany profil staje się ciągiem `apiKey` w runtime                                   | Dostawca przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokenu runtime                                        |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki błędów odświeżania     | Dostawca nie pasuje do współdzielonych refresherów `pi-ai`                                                                                 |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana po niepowodzeniu odświeżenia OAuth                                              | Dostawca potrzebuje własnych wskazówek naprawy auth po błędzie odświeżania                                                                 |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                     | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki nie wykryją                                                             |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyn failover należąca do dostawcy                                                           | Dostawca może mapować surowe błędy API/transportu na rate-limit/przeciążenie/itp.                                                         |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                            | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania przy braku auth                                                    | Dostawca potrzebuje własnej wskazówki odzyskiwania po braku auth                                                                           |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli upstream plus opcjonalna wskazówka błędu dla użytkownika                       | Dostawca potrzebuje ukryć nieaktualne wiersze upstream albo zastąpić je wskazówką dostawcy                                                |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykrywaniu                                                  | Dostawca potrzebuje syntetycznych wierszy forward-compat w `models list` i pickerach                                                      |
| 33  | `isBinaryThinking`                | Przełącznik reasoning włącz/wyłącz dla dostawców z binarnym thinking                                          | Dostawca udostępnia tylko binarne thinking włącz/wyłącz                                                                                    |
| 34  | `supportsXHighThinking`           | Obsługa reasoning `xhigh` dla wybranych modeli                                                                | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                           |
| 35  | `resolveDefaultThinkingLevel`     | Domyślny poziom `/think` dla określonej rodziny modeli                                                        | Dostawca posiada domyślną politykę `/think` dla rodziny modeli                                                                             |
| 36  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów live profile i wyboru smoke                                           | Dostawca posiada dopasowanie preferowanych modeli live/smoke                                                                               |
| 37  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed wnioskowaniem             | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                               |
| 38  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/kwoty lub innego poświadczenia użycia                                      |
| 39  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty użycia/kwoty specyficzne dla dostawcy po rozwiązaniu auth                    | Dostawca potrzebuje własnego endpointu użycia lub parsera ładunku                                                                          |
| 40  | `createEmbeddingProvider`         | Buduje należący do dostawcy adapter embeddingów dla memory/search                                             | Zachowanie embeddingów pamięci powinno należeć do pluginu dostawcy                                                                         |
| 41  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla dostawcy                                          | Dostawca potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków thinking)                                           |
| 42  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym czyszczeniu transkryptu                                                 | Dostawca potrzebuje przepisania replay specyficznego dla dostawcy poza współdzielonymi helperami kompaktowania                            |
| 43  | `validateReplayTurns`             | Końcowa walidacja lub przekształcanie tur replay przed embedded runnerem                                      | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po ogólnej sanityzacji                                                |
| 44  | `onModelSelected`                 | Uruchamia efekty uboczne po wyborze modelu należące do dostawcy                                               | Dostawca potrzebuje telemetrii albo własnego stanu, gdy model staje się aktywny                                                           |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą przez inne pluginy dostawców zdolne do hooków,
dopóki któryś rzeczywiście nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shim aliasów/kompatybilności dostawców nadal działają bez wymagania, aby wywołujący wiedział, który
dołączony plugin posiada dane przepisanie. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji rodziny Google, dołączony normalizator konfiguracji Google nadal zastosuje
to czyszczenie kompatybilności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu sieciowego lub niestandardowego wykonawcy żądań,
to jest inna klasa rozszerzenia. Te hooki służą dla zachowań dostawców, które nadal działają na
zwykłej pętli wnioskowania OpenClaw.

### Przykład dostawcy

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  i `wrapStreamFn`, ponieważ posiada forward-compat Claude 4.6,
  wskazówki rodziny dostawców, wskazówki naprawy auth, integrację endpointu użycia,
  kwalifikowalność prompt-cache, domyślne wartości konfiguracji zależne od auth, domyślną/adaptacyjną
  politykę thinking Claude oraz kształtowanie strumienia specyficzne dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Helpery strumienia specyficzne dla Claude w Anthropic pozostają na razie we własnej
  publicznej szczelinie `api.ts` / `contract-api.ts` dołączonego pluginu. Ta powierzchnia pakietu
  eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższopoziomowe
  buildery wrapperów Anthropic zamiast poszerzać ogólne SDK wokół reguł nagłówków beta jednego
  dostawcy.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities`, a także `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` i `isModernModelRef`,
  ponieważ posiada forward-compat GPT-5.4, bezpośrednią normalizację OpenAI
  `openai-completions` -> `openai-responses`, wskazówki auth świadome Codex,
  tłumienie Spark, syntetyczne wiersze list OpenAI oraz politykę GPT-5 thinking /
  live-model; rodzina strumienia `openai-responses-defaults` posiada
  współdzielone natywne wrappery OpenAI Responses dla nagłówków atrybucji,
  `/fast`/`serviceTier`, szczegółowości tekstu, natywnego wyszukiwania webowego Codex,
  kształtowania ładunku reasoning-compat oraz zarządzania kontekstem Responses.
- OpenRouter używa `catalog` oraz `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ dostawca jest pass-through i może ujawniać nowe
  identyfikatory modeli przed aktualizacją statycznego katalogu OpenClaw; używa także
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby trzymać
  nagłówki żądań specyficzne dla dostawcy, metadane routingu, poprawki reasoning i
  politykę prompt-cache poza core. Jego polityka replay pochodzi z rodziny
  `passthrough-gemini`, podczas gdy rodzina strumienia `openrouter-thinking`
  posiada wstrzykiwanie proxy reasoning i pomijanie nieobsługiwanych modeli / `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities`, a także `prepareRuntimeAuth` i `fetchUsageSnapshot`, ponieważ
  potrzebuje własnego logowania urządzenia, zachowania fallback modelu, niuansów
  transkryptu Claude, wymiany tokenu GitHub -> token Copilot oraz własnego endpointu użycia.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog`, a także
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach core OpenAI, ale posiada normalizację
  transportu/base URL, politykę fallback odświeżania OAuth, domyślny wybór transportu,
  syntetyczne wiersze katalogu Codex i integrację endpointu użycia ChatGPT; współdzieli
  tę samą rodzinę strumienia `openai-responses-defaults` co bezpośredni OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ
  rodzina replay `google-gemini` posiada fallback forward-compat Gemini 3.1,
  natywną walidację replay Gemini, sanityzację bootstrap replay, tagowany
  tryb reasoning-output i dopasowanie nowoczesnych modeli, podczas gdy
  rodzina strumienia `google-thinking` posiada normalizację ładunku thinking Gemini;
  Gemini CLI OAuth używa także `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokenów, parsowania tokenów i
  podłączenia endpointu kwot.
- Anthropic Vertex używa `buildReplayPolicy` przez rodzinę replay
  `anthropic-by-model`, dzięki czemu czyszczenie replay specyficzne dla Claude pozostaje
  ograniczone do identyfikatorów Claude zamiast obejmować cały transport `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveDefaultThinkingLevel`, ponieważ posiada
  klasyfikację błędów throttle/not-ready/context-overflow specyficzną dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli tę samą
  ochronę `anthropic-by-model` ograniczoną do Claude.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  przez rodzinę replay `passthrough-gemini`, ponieważ proxy’ują modele Gemini
  przez transporty zgodne z OpenAI i potrzebują sanityzacji
  thought-signature Gemini bez natywnej walidacji replay Gemini lub przepisania bootstrapu.
- MiniMax używa `buildReplayPolicy` przez rodzinę
  `hybrid-anthropic-openai`, ponieważ jeden dostawca posiada zarówno semantykę
  wiadomości Anthropic, jak i zgodną z OpenAI; zachowuje usuwanie bloków thinking
  ograniczone do Claude po stronie Anthropic, jednocześnie nadpisując tryb wyniku reasoning z powrotem na natywny,
  a rodzina strumienia `minimax-fast-mode` posiada przepisywanie modeli fast-mode na współdzielonej ścieżce strumienia.
- Moonshot używa `catalog` oraz `wrapStreamFn`, ponieważ nadal używa
  współdzielonego transportu OpenAI, ale potrzebuje normalizacji ładunku thinking należącej do dostawcy; rodzina
  strumienia `moonshot-thinking` mapuje konfigurację oraz stan `/think` na
  natywny binarny ładunek thinking.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje nagłówków żądań należących do dostawcy,
  normalizacji ładunku reasoning, wskazówek transkryptu Gemini i bramkowania
  Anthropic cache-TTL; rodzina strumienia `kilocode-thinking` utrzymuje wstrzykiwanie Kilo thinking
  na współdzielonej ścieżce strumienia proxy, pomijając `kilo/auto` i
  inne identyfikatory modeli proxy, które nie obsługują jawnych ładunków reasoning.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ posiada fallback GLM-5,
  domyślne `tool_stream`, UX binarnego thinking, dopasowanie nowoczesnych modeli oraz
  zarówno auth użycia, jak i pobieranie kwot; rodzina strumienia `tool-stream-default-on` utrzymuje
  domyślnie włączony wrapper `tool_stream` poza ręcznie pisanym klejem per dostawca.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ posiada normalizację natywnego transportu xAI Responses, przepisywanie aliasów
  Grok fast-mode, domyślne `tool_stream`, czyszczenie strict-tool / reasoning-payload,
  ponowne użycie fallback auth dla narzędzi należących do pluginu, rozwiązywanie modeli Grok
  z forward-compat oraz poprawki kompatybilności należące do dostawcy, takie jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` oraz dekodowanie argumentów wywołań narzędzi z encji HTML.
- Mistral, OpenCode Zen i OpenCode Go używają tylko `capabilities`, aby utrzymać
  niuanse transkryptu/narzędzi poza core.
- Dołączone dostawcy tylko katalogowi, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  tylko `catalog`.
- Qwen używa `catalog` dla swojego dostawcy tekstowego oraz współdzielonych rejestracji
  media-understanding i video-generation dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków użycia, ponieważ ich zachowanie
  `/usage` należy do pluginu, mimo że samo wnioskowanie nadal działa przez współdzielone transporty.

## Pomocniki runtime

Pluginy mogą uzyskać dostęp do wybranych helperów core przez `api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca zwykły ładunek wyjściowy TTS core dla powierzchni typu plik/voice-note.
- Używa konfiguracji core `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą wykonać resampling/kodowanie dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go do pickerów głosów należących do dostawcy lub przepływów konfiguracji.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla pickerów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą także rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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
- Używaj dostawców mowy dla zachowań syntezy należących do dostawcy.
- Starszy input Microsoft `edge` jest normalizowany do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może posiadać
  tekst, mowę, obraz i przyszłych dostawców mediów, gdy OpenClaw doda te
  kontrakty capability.

W przypadku rozumienia obrazu/dźwięku/wideo pluginy rejestrują jednego typowanego
dostawcę media-understanding zamiast ogólnego worka klucz/wartość:

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

- Zachowaj orkiestrację, fallback, konfigurację i podłączenie kanałów w core.
- Zachowaj zachowanie dostawcy w pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne capabilities.
- Generowanie wideo już stosuje ten sam wzorzec:
  - core posiada kontrakt capability i helper runtime
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów korzystają z `api.runtime.videoGeneration.*`

W przypadku helperów runtime media-understanding pluginy mogą wywoływać:

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

W przypadku transkrypcji audio pluginy mogą używać albo runtime media-understanding,
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
  rozumienia obrazu/dźwięku/wideo.
- Używa konfiguracji audio media-understanding core (`tools.media.audio`) i kolejności fallback dostawców.
- Zwraca `{ text: undefined }`, gdy nie zostanie utworzony wynik transkrypcji (na przykład przy pominiętym/nieobsługiwanym wejściu).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem kompatybilności.

Pluginy mogą też uruchamiać w tle przebiegi subagentów przez `api.runtime.subagent`:

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

- `provider` i `model` to opcjonalne nadpisania per przebieg, a nie trwałe zmiany sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla przebiegów fallback należących do pluginów operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Niezaufane przebiegi subagentów pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przechodzić na fallback.

W przypadku wyszukiwania w sieci pluginy mogą korzystać ze współdzielonego helpera runtime zamiast
sięgać do podłączenia narzędzia agenta:

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

Pluginy mogą także rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w core.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
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

- `generate(...)`: wygeneruj obraz przy użyciu skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: wyświetl dostępnych dostawców generowania obrazów i ich capabilities.

## Trasy HTTP gateway

Pluginy mogą udostępniać endpointy HTTP przez `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego auth gateway, albo `"plugin"` dla auth/weryfikacji webhooków zarządzanych przez plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Użyj zamiast tego `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnego `path + match` są odrzucane, chyba że `replaceExisting: true`, i jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Zachowuj łańcuchy przejścia `exact`/`prefix` tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Służą do webhooków/weryfikacji podpisów zarządzanych przez plugin, a nie do uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo konserwatywny:
  - bearer auth ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` nie występuje w takich żądaniach trasy pluginu przenoszących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu z auth gateway jest domyślną powierzchnią admina. Jeśli Twoja trasa potrzebuje zachowania tylko dla admina, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia pluginów używaj subścieżek SDK zamiast monolitycznego importu `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` dla prymitywów rejestracji pluginów.
- `openclaw/plugin-sdk/core` dla ogólnego współdzielonego kontraktu skierowanego do pluginów.
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
  `openclaw/plugin-sdk/secret-input` i
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonego okablowania konfiguracji/auth/odpowiedzi/webhooków.
  `channel-inbound` to współdzielony dom dla debounce, dopasowywania wzmianek,
  helperów polityki wzmianek przychodzących, formatowania envelope oraz helperów
  kontekstu envelope przychodzącego.
  `channel-setup` to wąska szczelina konfiguracji opcjonalnej instalacji.
  `setup-runtime` to bezpieczna dla runtime powierzchnia konfiguracji używana przez `setupEntry` /
  odroczone uruchamianie, w tym adaptery łatek konfiguracji bezpieczne przy importowaniu.
  `setup-adapter-runtime` to świadoma env szczelina adaptera konfiguracji kont.
  `setup-tools` to mała szczelina helperów CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subścieżki domenowe, takie jak `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` i
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych helperów runtime/konfiguracji.
  `telegram-command-config` to wąska publiczna szczelina do normalizacji/walidacji
  niestandardowych poleceń Telegram i pozostaje dostępna nawet wtedy, gdy
  powierzchnia kontraktowa dołączonego Telegram jest tymczasowo niedostępna.
  `text-runtime` to współdzielona szczelina tekst/markdown/logowanie, obejmująca
  usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkowania markdown, helpery redakcji,
  helpery tagów dyrektyw i narzędzia safe-text.
- Szczeliny kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt `approvalCapability`
  na pluginie. Core odczytuje wtedy auth, dostarczanie, renderowanie i
  natywne zachowanie routingu zatwierdzeń przez to jedno capability zamiast mieszać
  zachowanie zatwierdzeń z niezwiązanymi polami pluginu.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje tylko jako shim kompatybilności dla starszych pluginów. Nowy kod powinien importować zamiast tego węższe ogólne prymitywy, a kod repo nie powinien dodawać nowych importów tego shimu.
- Wnętrze dołączonych rozszerzeń pozostaje prywatne. Zewnętrzne pluginy powinny używać tylko subścieżek `openclaw/plugin-sdk/*`. Kod core/testów OpenClaw może używać publicznych punktów wejścia repo pod korzeniem pakietu pluginu, takich jak `index.js`, `api.js`, `runtime-api.js`, `setup-entry.js` i wąsko zakresowanych plików, takich jak `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu pluginu z core ani z innego rozszerzenia.
- Podział punktów wejścia repo:
  `<plugin-package-root>/api.js` to barrel helperów/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko dla runtime,
  `<plugin-package-root>/index.js` to punkt wejścia dołączonego pluginu,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia pluginu konfiguracji.
- Obecne przykłady dołączonych dostawców:
  - Anthropic używa `api.js` / `contract-api.js` dla helperów strumienia Claude, takich
    jak `wrapAnthropicProviderStream`, helpery nagłówków beta i parsowanie `service_tier`.
  - OpenAI używa `api.js` dla builderów dostawców, helperów modeli domyślnych i builderów dostawców realtime.
  - OpenRouter używa `api.js` dla swojego buildera dostawcy oraz helperów onboardingu/konfiguracji, podczas gdy `register.runtime.js` nadal może re-eksportować ogólne helpery `plugin-sdk/provider-stream` do użytku lokalnego w repo.
- Publiczne punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime, gdy taki istnieje, a w przeciwnym razie wracają do rozwiązanej konfiguracji z pliku na dysku, gdy OpenClaw nie udostępnia jeszcze snapshotu runtime.
- Ogólne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje mały zastrzeżony zestaw kompatybilnościowych szczelin helperów dołączonych kanałów. Traktuj je jako szczeliny utrzymaniowe/kompatybilnościowe dla dołączonych elementów, a nie jako nowe cele importu dla third-party; nowe kontrakty międzykanałowe powinny nadal trafiać do ogólnych subścieżek `plugin-sdk/*` albo lokalnych barrelów pluginu `api.js` / `runtime-api.js`.

Uwaga dotycząca kompatybilności:

- Unikaj głównego barrela `openclaw/plugin-sdk` w nowym kodzie.
- Najpierw preferuj wąskie stabilne prymitywy. Nowsze subścieżki konfiguracji/parowania/odpowiedzi/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool są zamierzonym kontraktem dla nowych
  dołączonych i zewnętrznych pluginów.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki akcji wiadomości i helpery message-id reakcji należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrels helperów specyficznych dla dołączonych rozszerzeń domyślnie nie są stabilne. Jeśli
  helper jest potrzebny tylko dołączonemu rozszerzeniu, trzymaj go za lokalną szczeliną
  `api.js` lub `runtime-api.js` tego rozszerzenia zamiast promować go do
  `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone szczeliny helperów powinny być ogólne, a nie markowane nazwą kanału. Wspólne
  parsowanie celów należy do `openclaw/plugin-sdk/channel-targets`; wnętrza specyficzne dla kanału
  pozostają za lokalną szczeliną `api.js` lub `runtime-api.js` właściciela pluginu.
- Subścieżki specyficzne dla capability, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ dołączone/natywne pluginy używają ich dziś.
  Sama ich obecność nie oznacza automatycznie, że każdy eksportowany helper jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia wiadomości

Pluginy powinny posiadać wkłady do schematu `describeMessageTool(...)`
specyficzne dla kanału. Zachowuj pola specyficzne dla dostawcy w pluginie, a nie we współdzielonym core.

W przypadku współdzielonych przenośnych fragmentów schematu używaj ponownie ogólnych helperów eksportowanych przez
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` dla ładunków w stylu siatki przycisków
- `createMessageToolCardSchema()` dla strukturalnych ładunków kart

Jeśli dany kształt schematu ma sens tylko dla jednego dostawcy, zdefiniuj go we własnym
kodzie źródłowym tego pluginu zamiast promować go do współdzielonego SDK.

## Rozwiązywanie celów kanału

Pluginy kanałów powinny posiadać semantykę celów specyficzną dla kanału. Zachowuj
wspólny host outbound jako ogólny i używaj powierzchni adaptera wiadomości do reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukaniem katalogowym.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informuje core, czy dane wejście
  powinno od razu przejść do rozwiązywania podobnego do ID zamiast do wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy
  core potrzebuje końcowego rozwiązania należącego do dostawcy po normalizacji lub
  po nieudanym wyszukiwaniu katalogowym.
- `messaging.resolveOutboundSessionRoute(...)` posiada tworzenie trasy sesji
  specyficznej dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` dla decyzji kategorii, które powinny zapaść przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` dla kontroli typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` jako fallbacku normalizacji specyficznego dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Zachowuj natywne identyfikatory dostawców, takie jak chat ids, thread ids, JID-y, handle i room ids
  wewnątrz wartości `target` albo parametrów specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny zachować tę logikę w
pluginie i używać ponownie współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM oparte na liście dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogowe o zakresie konta

Współdzielone helpery w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitów
- helpery deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do wnioskowania przez
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin posiada identyfikatory modeli specyficzne dla dostawcy, wartości domyślne base URL albo metadane modeli chronione auth.

`catalog.order` kontroluje, kiedy katalog pluginu scala się względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy oparty na kluczu API albo env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisywać
wbudowany wpis dostawcy z tym samym identyfikatorem dostawcy.

Kompatybilność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowane są zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko kończyć się błędem, gdy wymagane sekrety są niedostępne.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/naprawy konfiguracji
  nie powinny wymagać materializacji poświadczeń runtime tylko po to, by opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy mają znaczenie, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu.
  Zwrot `tokenStatus: "available"` (i odpowiadającego pola źródła)
  wystarczy dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia” zamiast kończyć się awarią lub błędnie zgłaszać konto jako nieskonfigurowane.

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

Każdy wpis staje się pluginem. Jeśli pack zawiera wiele rozszerzeń, identyfikator pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, tak aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Guardrail bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginów przez
`npm install --omit=dev --ignore-scripts` (bez skryptów lifecycle i bez zależności dev w runtime). Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów, które wymagają budowania przez `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główny punkt wejścia pluginu podłącza także narzędzia, hooki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pozwala pluginowi kanału wejść na tę samą ścieżkę `setupEntry` podczas
fazy uruchamiania gateway przed rozpoczęciem nasłuchiwania, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startową, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że punkt konfiguracji
musi zarejestrować każde capability należące do kanału, od którego zależy start, takie jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twój pełny punkt wejścia nadal posiada jakiekolwiek wymagane capability startowe, nie włączaj
tej flagi. Pozostaw plugin przy zachowaniu domyślnym i pozwól OpenClaw załadować pełny punkt wejścia podczas uruchamiania.

Dołączone kanały mogą także publikować helpery powierzchni kontraktowej tylko do konfiguracji, z których core
może korzystać przed załadowaniem pełnego runtime kanału. Obecna powierzchnia promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi promować starszą konfigurację kanału z jednym kontem do
`channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu.
Matrix jest obecnym dołączonym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy istnieją już nazwane konta, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery łatek konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktowej dołączonych elementów. Czas importu pozostaje niski; powierzchnia promocji jest ładowana tylko przy pierwszym użyciu zamiast ponownie wchodzić w uruchamianie dołączonego kanału przy imporcie modułu.

Gdy te powierzchnie startowe obejmują metody RPC gateway, utrzymuj je na
prefiksie specyficznym dla pluginu. Przestrzenie nazw admina core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze są rozwiązywane
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

Pluginy kanałów mogą reklamować metadane konfiguracji/wykrywania przez `openclaw.channel` i
wskazówki instalacyjne przez `openclaw.install`. Dzięki temu dane katalogu core pozostają wolne od twardego kodowania.

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
- `docsLabel`: nadpisuje tekst linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący markdown dla decyzji formatowania outbound
- `exposure.configured`: ukrywa kanał z powierzchni list kanałów skonfigurowanych, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych pickerów konfiguracji, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla kompatybilności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu quickstart `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów ogłaszania

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM).
Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkiem/średnikiem/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu posiadają orkiestrację kontekstu sesji dla ingestu, składania
i kompaktowania. Rejestruj je ze swojego pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój plugin musi zastąpić lub rozszerzyć domyślny pipeline kontekstu, a nie tylko dodawać wyszukiwanie pamięci lub hooki.

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

Jeśli Twój silnik **nie** posiada algorytmu kompaktowania, zachowaj implementację `compact()`
i jawnie ją deleguj:

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

## Dodawanie nowego capability

Gdy plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu pluginów przez prywatne sięganie do wnętrza. Dodaj brakujące capability.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie współdzielone zachowanie powinno należeć do core: zasady, fallback, scalanie konfiguracji,
   lifecycle, semantyka widoczna dla kanałów i kształt helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię capability.
3. podłącz konsumentów core + kanałów/funkcji
   Kanały i pluginy funkcji powinny korzystać z nowego capability przez core,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują następnie swoje backendy względem capability.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji pozostawały z czasem jawne.

W ten sposób OpenClaw pozostaje opiniotwórczy, nie stając się jednocześnie zakodowanym na sztywno do
światopoglądu jednego dostawcy. Konkretną listę plików i gotowy przykład znajdziesz w [Capability Cookbook](/pl/plugins/architecture).

### Lista kontrolna capability

Gdy dodajesz nowe capability, implementacja powinna zwykle dotknąć razem tych
powierzchni:

- typów kontraktów core w `src/<capability>/types.ts`
- runnera/helpera runtime core w `src/<capability>/runtime.ts`
- powierzchni rejestracji API pluginów w `src/plugins/types.ts`
- podłączenia rejestru pluginów w `src/plugins/registry.ts`
- ekspozycji runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą z niego korzystać
- helperów przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercji własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacji operatora/pluginów w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że capability nie jest
jeszcze w pełni zintegrowane.

### Szablon capability

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

- core posiada kontrakt capability + orkiestrację
- pluginy dostawców posiadają implementacje dostawców
- pluginy funkcji/kanałów korzystają z helperów runtime
- testy kontraktowe utrzymują własność jako jawną
