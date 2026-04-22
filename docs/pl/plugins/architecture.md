---
read_when:
    - Tworzenie lub debugowanie natywnych Plugin OpenClaw
    - Zrozumienie modelu możliwości Plugin lub granic własności
    - Praca nad pipeline ładowania lub rejestrem Plugin
    - Implementowanie hooków runtime dostawcy lub Plugin channel
sidebarTitle: Internals
summary: 'Wnętrze Plugin: model możliwości, własność, kontrakty, pipeline ładowania i helpery runtime'
title: Wnętrze Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Wnętrze Plugin

<Info>
  To jest **szczegółowa dokumentacja architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalowanie i używanie pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — pierwszy samouczek Plugin
  - [Plugin kanałów](/pl/plugins/sdk-channel-plugins) — budowanie kanału wiadomości
  - [Plugin dostawców](/pl/plugins/sdk-provider-plugins) — budowanie dostawcy modeli
  - [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu Plugin OpenClaw.

## Publiczny model możliwości

Możliwości to publiczny model **natywnych Plugin** w OpenClaw. Każdy
natywny Plugin OpenClaw rejestruje się względem jednego lub większej liczby typów możliwości:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Wnioskowanie tekstowe  | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Mowa                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                    |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`     | `openai`                             |
| Rozumienie multimediów | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanał / wiadomości     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia lub
usługi, jest **starszym Plugin typu hook-only**. Ten wzorzec nadal jest w pełni obsługiwany.

### Stanowisko wobec zgodności zewnętrznej

Model możliwości jest wdrożony w core i używany dziś przez dołączone/natywne Plugin,
ale zgodność zewnętrznych Plugin nadal wymaga wyższego standardu niż „jest eksportowane, więc jest zamrożone”.

Obecne zalecenia:

- **istniejące zewnętrzne Plugin:** utrzymuj integracje oparte na hookach w działaniu; traktuj
  to jako bazowy poziom zgodności
- **nowe dołączone/natywne Plugin:** preferuj jawną rejestrację możliwości zamiast
  dostępu specyficznego dla dostawcy lub nowych projektów typu hook-only
- **zewnętrzne Plugin adoptujące rejestrację możliwości:** dozwolone, ale traktuj
  powierzchnie helperów specyficznych dla możliwości jako rozwijające się, chyba że dokumentacja jawnie oznacza kontrakt jako stabilny

Praktyczna zasada:

- API rejestracji możliwości to docelowy kierunek
- starsze hooki pozostają najbezpieczniejszą ścieżką bez naruszeń dla zewnętrznych Plugin podczas
  przejścia
- eksportowane podścieżki helperów nie są równoważne; preferuj wąski udokumentowany
  kontrakt, a nie przypadkowe eksporty helperów

### Kształty Plugin

OpenClaw klasyfikuje każdy załadowany Plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  Plugin tylko dostawcy, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie multimediów i generowanie
  obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub własne), bez możliwości,
  narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale nie
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin i rozbicie możliwości. Szczegóły znajdziesz w [dokumentacji CLI](/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla
Plugin typu hook-only. Wciąż zależą od niego istniejące Plugin używane w praktyce.

Kierunek:

- utrzymywać jego działanie
- dokumentować go jako starszy
- preferować `before_model_resolve` do pracy nad nadpisywaniem modelu/dostawcy
- preferować `before_prompt_build` do pracy nad modyfikacją promptu
- usuwać dopiero wtedy, gdy rzeczywiste użycie spadnie, a pokrycie fixture potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchomisz `openclaw doctor` lub `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **konfiguracja prawidłowa** | Konfiguracja parsuje się poprawnie i Plugin są rozwiązywane |
| **ostrzeżenie zgodności** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **ostrzeżenie o starszej funkcji** | Plugin używa `before_agent_start`, które jest przestarzałe |
| **twardy błąd**             | Konfiguracja jest nieprawidłowa lub Plugin nie udało się załadować |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego Plugin --
`hook-only` ma charakter informacyjny, a `before_agent_start` wywołuje tylko ostrzeżenie. Te
sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System Plugin OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydatów na Plugin w skonfigurowanych ścieżkach, katalogach głównych workspace,
   globalnych katalogach rozszerzeń i dołączonych rozszerzeniach. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundle.
2. **Włączanie + walidacja**
   Core decyduje, czy wykryty Plugin jest włączony, wyłączony, zablokowany czy
   wybrany do wyłącznego slotu, takiego jak memory.
3. **Ładowanie runtime**
   Natywne Plugin OpenClaw są ładowane w procesie przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do rekordów
   rejestru bez importowania kodu runtime.
4. **Zużycie powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację dostawców,
   hooki, trasy HTTP, polecenia CLI i usługi.

Specjalnie dla CLI Plugin wykrywanie poleceń głównych jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI Plugin może pozostać leniwy i rejestrować się przy pierwszym wywołaniu

Pozwala to utrzymać kod CLI należący do Plugin wewnątrz Plugin, a jednocześnie umożliwia OpenClaw
zarezerwowanie nazw poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu Plugin
- natywne zachowanie runtime pochodzi ze ścieżki `register(api)` modułu Plugin

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone Plugin i
budować wskazówki UI/schematu, zanim pełny runtime będzie aktywny.

### Plugin kanałów i współdzielone narzędzie wiadomości

Plugin kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych akcji czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core, a
Plugin kanałów obsługują wykrywanie i wykonanie specyficzne dla kanału za nim.

Obecna granica wygląda następująco:

- core obsługuje współdzielony host narzędzia `message`, połączenie z promptem, księgowość sesji/wątków
  i dispatch wykonania
- Plugin kanałów obsługują wykrywanie akcji ograniczonych zakresem, wykrywanie możliwości oraz wszelkie
  fragmenty schematu specyficzne dla kanału
- Plugin kanałów obsługują gramatykę konwersacji sesji specyficzną dla dostawcy, taką jak
  sposób, w jaki identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą z konwersacji nadrzędnych
- Plugin kanałów wykonują końcową akcję przez swój adapter akcji

Dla Plugin kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania
pozwala Plugin zwrócić widoczne akcje, możliwości i wkłady do schematu
razem, aby te elementy nie rozjeżdżały się.

Gdy parametr specyficzny dla kanału w narzędziu wiadomości niesie źródło multimediów, takie jak
lokalna ścieżka lub zdalny adres URL multimediów, Plugin powinien także zwrócić
`mediaSourceParams` z `describeMessageTool(...)`. Core używa tej jawnej listy
do stosowania normalizacji ścieżek sandbox oraz wskazówek dostępu do multimediów wychodzących
bez kodowania na sztywno nazw parametrów należących do Plugin.
Preferuj tam mapy ograniczone do akcji, a nie jedną płaską listę dla całego kanału, aby
parametr multimediów tylko dla profilu nie był normalizowany przy niezwiązanych akcjach, takich jak
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

Jest to ważne dla Plugin zależnych od kontekstu. Kanał może ukrywać lub ujawniać
akcje wiadomości w zależności od aktywnego konta, bieżącego pokoju/wątku/wiadomości lub
zaufanej tożsamości żądającego, bez kodowania na sztywno rozgałęzień specyficznych dla kanału w
głównym narzędziu `message`.

Dlatego zmiany trasowania embedded runner nadal są pracą po stronie Plugin: runner odpowiada
za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania Plugin, tak aby współdzielone
narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku helperów wykonania należących do kanału dołączone Plugin powinny utrzymywać runtime wykonania
we własnych modułach rozszerzeń. Core nie obsługuje już runtime akcji wiadomości dla Discord,
Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a dołączone
Plugin powinny importować własny lokalny kod runtime bezpośrednio ze swoich
modułów należących do rozszerzenia.

Ta sama granica dotyczy ogólnie nazwanych przez dostawcę szwów SDK: core nie powinno
importować wygodnych barrel specyficznych dla kanałów takich jak Slack, Discord, Signal,
WhatsApp ani podobnych rozszerzeń. Jeśli core potrzebuje danego zachowania, powinno albo
zużywać własny barrel `api.ts` / `runtime-api.ts` dołączonego Plugin, albo promować tę potrzebę
do wąskiej generycznej możliwości we współdzielonym SDK.

W przypadku ankiet istnieją dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów pasujących do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału
  lub dodatkowych parametrów ankiet

Core odracza teraz współdzielone parsowanie ankiet do momentu, aż dispatch ankiety Plugin odrzuci
akcję, tak aby handlery ankiet należące do Plugin mogły akceptować pola ankiet specyficzne dla kanału
bez blokowania przez ogólny parser ankiet.

Zobacz [Pipeline ładowania](#load-pipeline), aby poznać pełną sekwencję uruchamiania.

## Model własności możliwości

OpenClaw traktuje natywny Plugin jako granicę własności dla **firmy** lub
**funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- Plugin firmy powinien zwykle obsługiwać wszystkie powierzchnie OpenClaw-facing tej firmy
- Plugin funkcji powinien zwykle obsługiwać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny zużywać współdzielone możliwości core zamiast doraźnie ponownie implementować zachowanie dostawcy

Przykłady:

- dołączony Plugin `openai` obsługuje zachowanie dostawcy modeli OpenAI oraz zachowanie OpenAI dla
  mowy + głosu w czasie rzeczywistym + rozumienia multimediów + generowania obrazów
- dołączony Plugin `elevenlabs` obsługuje zachowanie mowy ElevenLabs
- dołączony Plugin `microsoft` obsługuje zachowanie mowy Microsoft
- dołączony Plugin `google` obsługuje zachowanie dostawcy modeli Google oraz
  zachowanie Google dla rozumienia multimediów + generowania obrazów + wyszukiwania w sieci
- dołączony Plugin `firecrawl` obsługuje zachowanie pobierania z sieci Firecrawl
- dołączone Plugin `minimax`, `mistral`, `moonshot` i `zai` obsługują swoje
  backendy rozumienia multimediów
- dołączony Plugin `qwen` obsługuje zachowanie dostawcy tekstu Qwen oraz
  zachowanie rozumienia multimediów i generowania wideo
- Plugin `voice-call` jest Plugin funkcji: obsługuje transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumienia multimediów Twilio, ale zużywa współdzielone możliwości mowy
  oraz transkrypcji w czasie rzeczywistym i głosu w czasie rzeczywistym zamiast
  bezpośrednio importować Plugin dostawców

Docelowy stan jest następujący:

- OpenAI znajduje się w jednym Plugin, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnej powierzchni
- kanały nie muszą wiedzieć, który Plugin dostawcy jest właścicielem dostawcy; zużywają
  współdzielony kontrakt możliwości udostępniony przez core

To jest kluczowe rozróżnienie:

- **Plugin** = granica własności
- **Capability** = kontrakt core, który wiele Plugin może implementować lub zużywać

Jeśli więc OpenClaw doda nową domenę, taką jak wideo, pierwszym pytaniem nie jest
„który dostawca powinien zakodować obsługę wideo na sztywno?”. Pierwsze pytanie brzmi: „jaki jest
kontrakt możliwości wideo w core?”. Gdy taki kontrakt istnieje, Plugin dostawców
mogą się względem niego rejestrować, a Plugin kanałów/funkcji mogą go zużywać.

Jeśli możliwości jeszcze nie ma, właściwy ruch to zwykle:

1. zdefiniować brakującą możliwość w core
2. udostępnić ją przez API/runtime Plugin w sposób typowany
3. podłączyć kanały/funkcje do tej możliwości
4. pozwolić Plugin dostawców rejestrować implementacje

Utrzymuje to jawną własność, jednocześnie unikając zachowania core zależnego od
jednego dostawcy lub jednorazowej ścieżki kodu specyficznej dla Plugin.

### Warstwowanie możliwości

Używaj tego modelu myślowego przy decydowaniu, gdzie powinien znajdować się kod:

- **warstwa możliwości core**: współdzielona orkiestracja, polityka, fallback, zasady
  scalania konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa Plugin dostawcy**: API specyficzne dla dostawcy, auth, katalogi modeli, mowa
  syntetyczna, generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa Plugin kanału/funkcji**: integracja Slack/Discord/voice-call/itp.,
  która zużywa możliwości core i prezentuje je na swojej powierzchni

Na przykład TTS przyjmuje taki kształt:

- core obsługuje politykę TTS w czasie odpowiedzi, kolejność fallback, preferencje i dostarczanie kanałowe
- `openai`, `elevenlabs` i `microsoft` obsługują implementacje syntezy
- `voice-call` zużywa helper runtime telephony TTS

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład firmowego Plugin o wielu możliwościach

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia multimediów,
generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci,
dostawca może obsługiwać wszystkie swoje powierzchnie w jednym miejscu:

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

- jeden Plugin obsługuje powierzchnię dostawcy
- core nadal obsługuje kontrakty możliwości
- kanały i Plugin funkcji zużywają helpery `api.runtime.*`, a nie kod dostawcy
- testy kontraktowe mogą potwierdzić, że Plugin zarejestrował możliwości, które
  deklaruje jako swoje

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną
możliwość. Ten sam model własności ma tu zastosowanie:

1. core definiuje kontrakt rozumienia multimediów
2. Plugin dostawców rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo`, gdy ma to zastosowanie
3. kanały i Plugin funkcji zużywają współdzielone zachowanie core zamiast
   łączyć się bezpośrednio z kodem dostawcy

Pozwala to uniknąć wpisywania założeń dotyczących wideo jednego dostawcy do core. Plugin obsługuje
powierzchnię dostawcy; core obsługuje kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: core obsługuje typowany
kontrakt możliwości i helper runtime, a Plugin dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API Plugin jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz
helpery runtime, na których Plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy Plugin otrzymują jeden stabilny wewnętrzny standard
- core może odrzucać zduplikowaną własność, na przykład dwa Plugin rejestrujące ten sam
  identyfikator dostawcy
- startup może wyświetlać użyteczną diagnostykę dla nieprawidłowej rejestracji
- testy kontraktowe mogą egzekwować własność dołączonych Plugin i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w runtime**
   Rejestr Plugin waliduje rejestracje podczas ładowania Plugin. Przykłady:
   zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy i błędne
   rejestracje generują diagnostykę Plugin zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Dołączone Plugin są przechwytywane w rejestrach kontraktowych podczas uruchamiania testów, aby
   OpenClaw mógł jawnie potwierdzać własność. Dziś jest to używane dla
   dostawców modeli, dostawców mowy, dostawców wyszukiwania w sieci i własności rejestracji dołączonych Plugin.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który Plugin jest właścicielem której
powierzchni. Dzięki temu core i kanały mogą komponować się bezproblemowo, ponieważ własność jest
deklarowana, typowana i testowalna, a nie domyślna.

### Co należy do kontraktu

Dobre kontrakty Plugin są:

- typowane
- małe
- specyficzne dla możliwości
- należące do core
- wielokrotnego użytku przez wiele Plugin
- zużywalne przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty Plugin to:

- polityka specyficzna dla dostawcy ukryta w core
- jednorazowe furtki dla Plugin omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnoś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem
pozwól Plugin się do niej podłączać.

## Model wykonania

Natywne Plugin OpenClaw działają **w procesie** razem z Gateway. Nie są
sandboxowane. Załadowany natywny Plugin ma tę samą granicę zaufania na poziomie procesu co
kod core.

Konsekwencje:

- natywny Plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego Plugin może doprowadzić do awarii lub destabilizacji gateway
- złośliwy natywny Plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz
  procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W obecnych wydaniach oznacza to głównie dołączone
Skills.

Dla niedołączonych Plugin używaj allowlist i jawnych ścieżek instalacji/ładowania. Traktuj
Plugin workspace jako kod rozwojowy, a nie domyślne ustawienie produkcyjne.

Dla nazw pakietów dołączonych workspace utrzymuj identyfikator Plugin zakotwiczony w nazwie npm:
domyślnie `@openclaw/<id>` lub zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo udostępnia węższą rolę Plugin.

Ważna uwaga dotycząca zaufania:

- `plugins.allow` ufa **identyfikatorom Plugin**, a nie pochodzeniu źródła.
- Plugin workspace z tym samym identyfikatorem co dołączony Plugin celowo zasłania
  dołączoną kopię, gdy ten Plugin workspace jest włączony/na allowliście.
- To normalne i przydatne dla lokalnego rozwoju, testowania poprawek i hotfixów.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacje.

Utrzymuj publiczną rejestrację możliwości. Ograniczaj eksporty helperów spoza kontraktu:

- podścieżki helperów specyficzne dla dołączonych Plugin
- podścieżki infrastruktury runtime nieprzeznaczone jako publiczne API
- wygodne helpery specyficzne dla dostawcy
- helpery konfiguracji/onboardingu będące szczegółami implementacyjnymi

Niektóre podścieżki helperów dołączonych Plugin nadal pozostają w wygenerowanej mapie eksportów SDK
dla zgodności i utrzymania dołączonych Plugin. Obecne przykłady obejmują
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka szwów `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty będące szczegółami implementacji, a nie zalecany wzorzec SDK dla
nowych zewnętrznych Plugin.

## Pipeline ładowania

Przy uruchomieniu OpenClaw robi z grubsza to:

1. wykrywa katalogi główne kandydatów na Plugin
2. odczytuje natywne lub zgodne manifesty bundle i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone natywne moduły przez jiti
7. wywołuje natywne hooki `register(api)` (lub `activate(api)` — starszy alias) i zbiera rejestracje do rejestru Plugin
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje to, co jest obecne (`def.register ?? def.activate`) i wywołuje je w tym samym miejscu. Wszystkie dołączone Plugin używają `register`; dla nowych Plugin preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny Plugin, ścieżka jest zapisywalna dla wszystkich lub
własność ścieżki wygląda podejrzanie dla niedołączonych Plugin.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikacji Plugin
- wykrywania deklarowanych channel/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime Plugin

Dla natywnych Plugin moduł runtime jest częścią data plane. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają na control plane.
Są to deskryptory tylko metadanych do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji na żywo używają teraz wskazówek poleceń, kanałów i dostawców z manifestu
do zawężania ładowania Plugin przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do Plugin, które są właścicielami żądanego głównego polecenia
- rozwiązywanie konfiguracji/Plugin kanału zawęża się do Plugin, które są właścicielami żądanego
  identyfikatora kanału
- jawne rozwiązywanie konfiguracji/runtime dostawcy zawęża się do Plugin, które są właścicielami
  żądanego identyfikatora dostawcy

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptorów, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydatów na Plugin, zanim wróci do
`setup-api` dla Plugin, które nadal potrzebują hooków runtime w czasie konfiguracji. Jeśli więcej niż
jeden wykryty Plugin deklaruje ten sam znormalizowany identyfikator dostawcy konfiguracji lub backendu CLI,
wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na kolejności wykrywania.

### Co loader buforuje

OpenClaw utrzymuje krótkie bufory w procesie dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów Plugin

Bufory te zmniejszają skokowy koszt uruchamiania i powtarzanych poleceń. Można o nich bezpiecznie myśleć
jako o krótkotrwałych buforach wydajności, a nie trwałym przechowywaniu.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` lub
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te bufory.
- Dostosuj okna buforowania za pomocą `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane Plugin nie mutują bezpośrednio losowych globali core. Rejestrują się w
centralnym rejestrze Plugin.

Rejestr śledzi:

- rekordy Plugin (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i hooki typowane
- kanały
- dostawców
- handlery Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do Plugin

Funkcje core następnie odczytują ten rejestr zamiast rozmawiać bezpośrednio z modułami Plugin.
Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł Plugin -> rejestracja w rejestrze
- runtime core -> zużycie rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje tylko
jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł Plugin”.

## Callbacki wiązania konwersacji

Plugin, które wiążą konwersację, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu żądania
wiązania:

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
- `binding`: rozstrzygnięte wiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, wskazówka odłączenia, identyfikator nadawcy oraz
  metadane konwersacji

Ten callback służy wyłącznie do powiadamiania. Nie zmienia tego, kto może wiązać
konwersację, i uruchamia się po zakończeniu obsługi zatwierdzenia przez core.

## Hooki runtime dostawcy

Plugin dostawców mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` dla taniego wyszukiwania env-auth dostawcy
  przed załadowaniem runtime, `providerAuthAliases` dla wariantów dostawcy współdzielących
  auth, `channelEnvVars` dla taniego wyszukiwania env/setup kanału przed załadowaniem runtime,
  oraz `providerAuthChoices` dla tanich etykiet onboardingu/wyboru auth i metadanych
  flag CLI przed załadowaniem runtime
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

OpenClaw nadal obsługuje generyczną pętlę agenta, failover, obsługę transkryptu i
politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla dostawcy bez
potrzeby posiadania całego własnego transportu wnioskowania.

Używaj manifestu `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które generyczne ścieżki auth/status/model-picker powinny widzieć bez ładowania runtime Plugin.
Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator dostawcy powinien ponownie używać
zmiennych env, profili auth, auth opartych na konfiguracji i opcji onboardingu klucza API
innego identyfikatora dostawcy. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI
onboardingu/wyboru auth powinny znać identyfikator opcji dostawcy, etykiety grup i proste
połączenie auth jednym przełącznikiem bez ładowania runtime dostawcy. Zachowaj runtime dostawcy
`envVars` dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub
zmienne konfiguracji `client-id`/`client-secret` OAuth.

Używaj manifestu `channelEnvVars`, gdy kanał ma auth lub konfigurację sterowaną przez env, które
generyczne fallback do shell-env, kontrole config/status lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i użycie

Dla Plugin modeli/dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca obsługuje katalog lub domyślne wartości `base URL`                                                                                 |
| 2   | `applyConfigDefaults`             | Stosuje należące do dostawcy globalne domyślne wartości konfiguracji podczas materializacji konfiguracji      | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli dostawcy                                                           |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normalizuje starsze lub podglądowe aliasy identyfikatorów modeli przed wyszukaniem                            | Dostawca obsługuje czyszczenie aliasów przed kanonicznym rozwiązywaniem modelu                                                              |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed generycznym składaniem modelu                            | Dostawca obsługuje czyszczenie transportu dla własnych identyfikatorów dostawców w tej samej rodzinie transportu                           |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/dostawcy                                     | Dostawca potrzebuje czyszczenia konfiguracji, które powinno znajdować się w Plugin; dołączone helpery rodziny Google dodatkowo wspierają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje kompatybilne przepisania metadanych użycia natywnego strumieniowania do dostawców konfiguracji        | Dostawca potrzebuje poprawek metadanych użycia natywnego strumieniowania zależnych od endpointu                                            |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth z markerem env dla dostawców konfiguracji przed załadowaniem auth runtime                     | Dostawca ma własne rozwiązywanie klucza API z markerem env; `amazon-bedrock` ma tu także wbudowany resolver markera env AWS               |
| 8   | `resolveSyntheticAuth`            | Udostępnia auth lokalne/self-hosted lub oparte na konfiguracji bez utrwalania zwykłego tekstu                 | Dostawca może działać z syntetycznym/lokalnym markerem poświadczeń                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Nakłada należące do dostawcy zewnętrzne profile auth; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych tokenów odświeżania                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych placeholderów syntetycznych profili względem auth opartego na env/konfiguracji   | Dostawca przechowuje syntetyczne placeholdery profili, które nie powinny wygrywać pierwszeństwa                                            |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                   |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po czym `resolveDynamicModel` uruchamia się ponownie                               | Dostawca potrzebuje metadanych sieciowych przed rozwiązaniem nieznanych identyfikatorów                                                    |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez embedded runner                                    | Dostawca potrzebuje przepisania transportu, ale nadal używa transportu core                                                                |
| 14  | `contributeResolvedModelCompat`   | Wnosi flagi kompatybilności dla modeli dostawcy działających za innym kompatybilnym transportem              | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania roli dostawcy                                                     |
| 15  | `capabilities`                    | Należące do dostawcy metadane transkryptu/narzędzi używane przez współdzieloną logikę core                    | Dostawca potrzebuje niuansów transkryptu/rodziny dostawców                                                                                  |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je embedded runner                                                | Dostawca potrzebuje czyszczenia schematów rodziny transportu                                                                                |
| 17  | `inspectToolSchemas`              | Udostępnia należącą do dostawcy diagnostykę schematów po normalizacji                                          | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia core reguł specyficznych dla dostawcy                                             |
| 18  | `resolveReasoningOutputMode`      | Wybiera natywny lub tagowany kontrakt wyjścia rozumowania                                                      | Dostawca potrzebuje tagowanego wyjścia rozumowania/końcowego zamiast pól natywnych                                                         |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed generycznymi wrapperami opcji strumienia                                | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów per dostawca                                                  |
| 20  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę strumienia własnym transportem                                             | Dostawca potrzebuje własnego protokołu na drucie, a nie tylko wrappera                                                                      |
| 21  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu generycznych wrapperów                                                      | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modeli bez własnego transportu                                                    |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu per tura lub metadane                                                      | Dostawca chce, aby generyczne transporty wysyłały natywną tożsamość tury dostawcy                                                          |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cooldown sesji                                                 | Dostawca chce, aby generyczne transporty WS dostrajały nagłówki sesji lub politykę fallback                                                |
| 24  | `formatApiKey`                    | Formater profilu auth: zapisany profil staje się ciągiem `apiKey` runtime                                     | Dostawca przechowuje dodatkowe metadane auth i potrzebuje własnego kształtu tokena runtime                                                 |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla własnych endpointów odświeżania lub polityki błędów odświeżania             | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                  |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawy dołączana, gdy odświeżanie OAuth się nie powiedzie                                           | Dostawca potrzebuje własnych wskazówek naprawy auth po błędzie odświeżania                                                                  |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                      | Dostawca ma surowe błędy przepełnienia, których generyczne heurystyki by nie wykryły                                                       |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                                           | Dostawca może mapować surowe błędy API/transportu na rate-limit/przeciążenie/itp.                                                          |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                             | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                           |
| 30  | `buildMissingAuthMessage`         | Zastąpienie generycznego komunikatu odzyskiwania przy brakującym auth                                          | Dostawca potrzebuje własnej wskazówki odzyskiwania przy brakującym auth                                                                     |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli upstream oraz opcjonalna wskazówka błędu widoczna dla użytkownika              | Dostawca potrzebuje ukryć nieaktualne wiersze upstream lub zastąpić je wskazówką dostawcy                                                  |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                     | Dostawca potrzebuje syntetycznych wierszy kompatybilności do przodu w `models list` i pickerach                                            |
| 33  | `resolveThinkingProfile`          | Zestaw poziomów `/think`, etykiety wyświetlania i wartość domyślna specyficzne dla modelu                     | Dostawca udostępnia własną drabinkę myślenia lub etykietę binarną dla wybranych modeli                                                     |
| 34  | `isBinaryThinking`                | Hook zgodności przełącznika rozumowania w trybie włącz/wyłącz                                                  | Dostawca udostępnia tylko binarne myślenie włącz/wyłącz                                                                                     |
| 35  | `supportsXHighThinking`           | Hook zgodności obsługi rozumowania `xhigh`                                                                     | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                     | Dostawca obsługuje domyślną politykę `/think` dla rodziny modeli                                                                            |
| 37  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów profili live i wyboru smoke                                            | Dostawca obsługuje dopasowywanie preferowanych modeli live/smoke                                                                            |
| 38  | `prepareRuntimeAuth`              | Zamienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed wnioskowaniem              | Dostawca potrzebuje wymiany tokena lub krótkotrwałego poświadczenia żądania                                                                |
| 39  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Dostawca potrzebuje własnego parsowania tokena użycia/limitu lub innych poświadczeń użycia                                                 |
| 40  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty użycia/limitu specyficzne dla dostawcy po rozwiązaniu auth                    | Dostawca potrzebuje własnego endpointu użycia lub parsera ładunku                                                                          |
| 41  | `createEmbeddingProvider`         | Buduje należący do dostawcy adapter embeddingów dla memory/search                                              | Zachowanie embeddingów pamięci należy do Plugin dostawcy                                                                                   |
| 42  | `buildReplayPolicy`               | Zwraca politykę replay sterującą obsługą transkryptu dla dostawcy                                              | Dostawca potrzebuje własnej polityki transkryptu (na przykład usuwania bloków myślenia)                                                   |
| 43  | `sanitizeReplayHistory`           | Przepisuje historię replay po generycznym czyszczeniu transkryptu                                              | Dostawca potrzebuje własnych przekształceń replay wykraczających poza współdzielone helpery Compaction                                    |
| 44  | `validateReplayTurns`             | Końcowa walidacja lub przekształcanie tur replay przed embedded runnerem                                       | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po generycznej sanityzacji                                            |
| 45  | `onModelSelected`                 | Uruchamia należące do dostawcy skutki uboczne po wyborze modelu                                                | Dostawca potrzebuje telemetrii lub stanu należącego do dostawcy, gdy model staje się aktywny                                              |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Plugin dostawców obsługujące hooki,
aż któryś rzeczywiście zmieni identyfikator modelu albo transport/konfigurację. Dzięki temu
shimy aliasów/kompatybilności dostawców nadal działają bez wymagania, aby wywołujący wiedział,
który dołączony Plugin jest właścicielem przepisania. Jeśli żaden hook dostawcy nie przepisze
obsługiwanego wpisu konfiguracji rodziny Google, dołączony normalizator konfiguracji Google nadal
zastosuje to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni własnego protokołu na drucie lub własnego executora żądań,
to jest inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowania dostawcy, które
nadal działa w zwykłej pętli wnioskowania OpenClaw.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  i `wrapStreamFn`, ponieważ obsługuje zgodność do przodu Claude 4.6,
  wskazówki rodziny dostawcy, wskazówki naprawy auth, integrację z endpointem użycia,
  kwalifikowalność prompt-cache, domyślne wartości konfiguracji uwzględniające auth, domyślną/adaptacyjną
  politykę myślenia Claude oraz kształtowanie strumienia specyficzne dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Helpery strumienia specyficzne dla Claude w Anthropic pozostają na razie we własnym
  publicznym szwie `api.ts` / `contract-api.ts` dołączonego Plugin. Ta powierzchnia pakietu
  eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższego poziomu
  buildery wrapperów Anthropic zamiast rozszerzać generyczne SDK wokół reguł
  nagłówków beta jednego dostawcy.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities` oraz `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` i `isModernModelRef`,
  ponieważ obsługuje zgodność do przodu GPT-5.4, bezpośrednią normalizację OpenAI
  `openai-completions` -> `openai-responses`, wskazówki auth uwzględniające Codex,
  tłumienie Spark, syntetyczne wiersze listy OpenAI oraz politykę myślenia /
  modeli live GPT-5; rodzina strumienia `openai-responses-defaults` obsługuje
  współdzielone natywne wrappery OpenAI Responses dla nagłówków atrybucji,
  `/fast`/`serviceTier`, szczegółowości tekstu, natywnego wyszukiwania w sieci Codex,
  kształtowania ładunku compatibility rozumowania i zarządzania kontekstem Responses.
- OpenRouter używa `catalog`, `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ dostawca jest pass-through i może ujawniać nowe
  identyfikatory modeli przed aktualizacją statycznego katalogu OpenClaw; używa także
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby utrzymać
  nagłówki żądań specyficzne dla dostawcy, metadane trasowania, poprawki rozumowania i
  politykę prompt-cache poza core. Jego polityka replay pochodzi z rodziny
  `passthrough-gemini`, podczas gdy rodzina strumienia `openrouter-thinking`
  obsługuje wstrzykiwanie rozumowania proxy oraz pomijanie nieobsługiwanych modeli / `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities` oraz `prepareRuntimeAuth` i `fetchUsageSnapshot`, ponieważ
  potrzebuje należącego do dostawcy logowania urządzenia, zachowania fallback modeli, niuansów
  transkryptu Claude, wymiany tokena GitHub -> token Copilot oraz własnego
  endpointu użycia.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog` oraz
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach core OpenAI, ale obsługuje własną normalizację
  transportu/base URL, politykę fallback odświeżania OAuth, domyślny wybór transportu,
  syntetyczne wiersze katalogu Codex oraz integrację z endpointem użycia ChatGPT; współdzieli
  tę samą rodzinę strumienia `openai-responses-defaults` co bezpośrednie OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ
  rodzina replay `google-gemini` obsługuje fallback zgodności do przodu Gemini 3.1,
  natywną walidację replay Gemini, sanityzację replay bootstrap, tagowany
  tryb wyjścia rozumowania i dopasowywanie nowoczesnych modeli, podczas gdy
  rodzina strumienia `google-thinking` obsługuje normalizację ładunku myślenia Gemini;
  Gemini CLI OAuth używa także `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokenów, parsowania tokenów i podłączenia
  endpointu limitu.
- Anthropic Vertex używa `buildReplayPolicy` przez
  rodzinę replay `anthropic-by-model`, dzięki czemu czyszczenie replay specyficzne dla Claude pozostaje
  ograniczone do identyfikatorów Claude zamiast do każdego transportu `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveThinkingProfile`, ponieważ obsługuje
  klasyfikację błędów throttle/not-ready/context-overflow specyficznych dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli tę samą
  ochronę `anthropic-by-model` tylko dla Claude.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  przez rodzinę replay `passthrough-gemini`, ponieważ pośredniczą dla modeli Gemini
  przez transporty zgodne z OpenAI i potrzebują sanityzacji
  thought-signature Gemini bez natywnej walidacji replay Gemini ani
  przepisania bootstrap.
- MiniMax używa `buildReplayPolicy` przez
  rodzinę replay `hybrid-anthropic-openai`, ponieważ jeden dostawca obsługuje zarówno
  semantykę wiadomości Anthropic, jak i zgodną z OpenAI; zachowuje usuwanie
  bloków myślenia tylko dla Claude po stronie Anthropic, jednocześnie nadpisując tryb wyjścia rozumowania
  z powrotem na natywny, a rodzina strumienia `minimax-fast-mode` obsługuje
  przepisania modeli fast-mode na współdzielonej ścieżce strumienia.
- Moonshot używa `catalog`, `resolveThinkingProfile` i `wrapStreamFn`, ponieważ nadal używa współdzielonego
  transportu OpenAI, ale potrzebuje należącej do dostawcy normalizacji ładunku myślenia; rodzina
  strumienia `moonshot-thinking` mapuje konfigurację oraz stan `/think` na własny
  natywny binarny ładunek myślenia.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje własnych nagłówków żądań,
  normalizacji ładunku rozumowania, wskazówek transkryptu Gemini oraz
  bramkowania cache-TTL Anthropic; rodzina strumienia `kilocode-thinking` utrzymuje
  wstrzykiwanie myślenia Kilo na współdzielonej ścieżce strumienia proxy, jednocześnie pomijając `kilo/auto` i
  inne identyfikatory modeli proxy, które nie obsługują jawnych ładunków rozumowania.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ obsługuje fallback GLM-5,
  domyślne `tool_stream`, binarny UX myślenia, dopasowywanie nowoczesnych modeli oraz
  zarówno auth użycia, jak i pobieranie limitu; rodzina strumienia `tool-stream-default-on` utrzymuje
  wrapper domyślnie włączonego `tool_stream` poza ręcznie pisanym klejem per dostawca.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ obsługuje normalizację natywnego transportu xAI Responses, przepisania aliasów
  fast-mode Grok, domyślne `tool_stream`, czyszczenie strict-tool / reasoning-payload,
  ponowne użycie fallback auth dla narzędzi należących do Plugin, rozwiązywanie modeli Grok zgodne
  do przodu oraz poprawki kompatybilności należące do dostawcy, takie jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` i dekodowanie argumentów
  wywołań narzędzi z encjami HTML.
- Mistral, OpenCode Zen i OpenCode Go używają tylko `capabilities`, aby utrzymać
  niuanse transkryptu/narzędzi poza core.
- Dołączoni dostawcy tylko katalogowi, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  tylko `catalog`.
- Qwen używa `catalog` dla swojego dostawcy tekstu oraz współdzielonych rejestracji rozumienia multimediów i
  generowania wideo dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków użycia, ponieważ ich zachowanie `/usage`
  należy do Plugin, mimo że wnioskowanie nadal działa przez współdzielone transporty.

## Helpery runtime

Plugin mogą uzyskiwać dostęp do wybranych helperów core przez `api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca normalny ładunek wyjściowy TTS core dla powierzchni plików/notatek głosowych.
- Używa konfiguracji core `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Plugin muszą wykonać resampling/kodowanie dla dostawców.
- `listVoices` jest opcjonalne per dostawca. Używaj go dla należących do dostawcy pickerów głosów lub przepływów konfiguracji.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla pickerów zależnych od dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Plugin mogą także rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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

- Politykę TTS, fallback i dostarczanie odpowiedzi utrzymuj w core.
- Dostawców mowy używaj dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może obsługiwać
  tekst, mowę, obraz i przyszłych dostawców multimediów, gdy OpenClaw doda te
  kontrakty możliwości.

Dla rozumienia obrazów/audio/wideo Plugin rejestrują jednego typowanego
dostawcę rozumienia multimediów zamiast generycznego worka klucz/wartość:

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

- Orkiestrację, fallback, konfigurację i podłączenie kanałów utrzymuj w core.
- Zachowanie dostawcy utrzymuj w Plugin dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już podąża za tym samym wzorcem:
  - core obsługuje kontrakt możliwości i helper runtime
  - Plugin dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Plugin funkcji/kanałów zużywają `api.runtime.videoGeneration.*`

Dla helperów runtime rozumienia multimediów Plugin mogą wywoływać:

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

Dla transkrypcji audio Plugin mogą używać albo runtime rozumienia multimediów,
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
  rozumienia obrazów/audio/wideo.
- Używa konfiguracji audio rozumienia multimediów core (`tools.media.audio`) oraz kolejności fallback dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład dla pominiętego/nieobsługiwanego wejścia).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Plugin mogą także uruchamiać uruchomienia podrzędnych agentów w tle przez `api.runtime.subagent`:

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

- `provider` i `model` to opcjonalne nadpisania dla pojedynczego uruchomienia, a nie trwałe zmiany sesji.
- OpenClaw respektuje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla uruchomień fallback należących do Plugin operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Plugin do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie dopuścić dowolny cel.
- Uruchomienia podrzędnych agentów z niezaufanych Plugin nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić do fallback.

Dla wyszukiwania w sieci Plugin mogą zużywać współdzielony helper runtime zamiast
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

Plugin mogą także rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań utrzymuj w core.
- Dostawców wyszukiwania w sieci używaj dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla Plugin funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

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

- `generate(...)`: generuje obraz przy użyciu skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: wyświetla dostępnych dostawców generowania obrazów i ich możliwości.

## Trasy HTTP Gateway

Plugin mogą udostępniać endpointy HTTP przez `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego auth gateway, albo `"plugin"` dla auth/weryfikacji webhooków zarządzanych przez Plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Plugin zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwraca `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania Plugin. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy Plugin muszą jawnie deklarować `auth`.
- Konflikty dokładnych `path + match` są odrzucane, chyba że `replaceExisting: true`, a jeden Plugin nie może zastąpić trasy innego Plugin.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Służą do webhooków/weryfikacji podpisów zarządzanych przez Plugin, a nie uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale zakres ten jest celowo konserwatywny:
  - bearer auth oparty na współdzielonym sekrecie (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras Plugin przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym ingress) respektują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w tych żądaniach tras Plugin przenoszących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa Plugin z auth gateway to domyślnie powierzchnia admina. Jeśli Twoja trasa potrzebuje zachowania tylko dla admina, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK Plugin

Przy tworzeniu Plugin używaj podścieżek SDK zamiast monolitycznego importu `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` dla prymitywów rejestracji Plugin.
- `openclaw/plugin-sdk/core` dla generycznego współdzielonego kontraktu skierowanego do Plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonego podłączenia konfiguracji/auth/odpowiedzi/webhooków.
  `channel-inbound` to współdzielony dom dla debounce, dopasowywania wzmianek,
  helperów polityki wzmianek przychodzących, formatowania kopert i helperów
  kontekstu kopert przychodzących.
  `channel-setup` to wąski szew konfiguracji opcjonalnej instalacji.
  `setup-runtime` to bezpieczna dla runtime powierzchnia konfiguracji używana przez `setupEntry` /
  odroczony startup, w tym bezpieczne dla importu adaptery łatek konfiguracji.
  `setup-adapter-runtime` to szew adaptera konfiguracji kont uwzględniający env.
  `setup-tools` to mały szew helperów CLI/archive/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/runtime-store` i
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych helperów runtime/config.
  `telegram-command-config` to wąski publiczny szew dla normalizacji/walidacji własnych
  poleceń Telegram i pozostaje dostępny nawet wtedy, gdy powierzchnia kontraktu dołączonego
  Telegram jest tymczasowo niedostępna.
  `text-runtime` to współdzielony szew tekstu/Markdown/logowania, obejmujący
  usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia Markdown na fragmenty, helpery redakcji,
  helpery tagów dyrektyw i narzędzia bezpiecznego tekstu.
- Szwy kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt `approvalCapability`
  na Plugin. Core następnie odczytuje auth zatwierdzeń, dostarczanie, renderowanie,
  natywne trasowanie i leniwe zachowanie natywnego handlera przez tę jedną możliwość
  zamiast mieszać zachowanie zatwierdzeń z niepowiązanymi polami Plugin.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje tylko jako
  shim zgodności dla starszych Plugin. Nowy kod powinien importować węższe
  generyczne prymitywy, a kod repo nie powinien dodawać nowych importów tego
  shima.
- Wnętrza dołączonych rozszerzeń pozostają prywatne. Zewnętrzne Plugin powinny używać tylko podścieżek
  `openclaw/plugin-sdk/*`. Kod core/test OpenClaw może używać publicznych punktów wejścia repo
  pod katalogiem głównym pakietu Plugin, takich jak `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` oraz wąsko ograniczonych plików, takich jak
  `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu Plugin z core ani z
  innego rozszerzenia.
- Podział punktów wejścia repo:
  `<plugin-package-root>/api.js` to barrel helperów/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko runtime,
  `<plugin-package-root>/index.js` to punkt wejścia dołączonego Plugin,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia Plugin konfiguracji.
- Obecne przykłady dołączonych dostawców:
  - Anthropic używa `api.js` / `contract-api.js` dla helperów strumienia Claude, takich
    jak `wrapAnthropicProviderStream`, helpery nagłówków beta i parsowanie `service_tier`.
  - OpenAI używa `api.js` dla builderów dostawców, helperów modeli domyślnych i
    builderów dostawców realtime.
  - OpenRouter używa `api.js` dla swojego buildera dostawcy oraz helperów onboardingu/config,
    podczas gdy `register.runtime.js` może nadal re-eksportować generyczne
    helpery `plugin-sdk/provider-stream` do użytku lokalnego w repo.
- Publiczne punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime,
  gdy taki istnieje, a następnie wracają do rozwiązanej konfiguracji z pliku na dysku, gdy
  OpenClaw nie udostępnia jeszcze snapshotu runtime.
- Generyczne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje
  mały zastrzeżony zestaw zgodności helperów markowanych nazwami dołączonych kanałów. Traktuj je jako
  szwy utrzymania/zgodności dołączonych Plugin, a nie nowe cele importu dla stron trzecich; nowe kontrakty międzykanałowe powinny nadal trafiać do
  generycznych podścieżek `plugin-sdk/*` lub lokalnych barrel `api.js` /
  `runtime-api.js` Plugin.

Uwaga dotycząca zgodności:

- Unikaj głównego barrel `openclaw/plugin-sdk` w nowym kodzie.
- Najpierw preferuj wąskie stabilne prymitywy. Nowsze podścieżki setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool to docelowy kontrakt dla nowych
  dołączonych i zewnętrznych Plugin.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki akcji wiadomości i helpery reaction message-id należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helperów specyficznych dla dołączonych rozszerzeń nie są domyślnie stabilne. Jeśli
  helper jest potrzebny tylko dołączonemu rozszerzeniu, utrzymuj go za lokalnym
  szwem `api.js` lub `runtime-api.js` rozszerzenia zamiast promować go do
  `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone szwy helperów powinny być generyczne, a nie markowane nazwą kanału. Współdzielone parsowanie celów
  należy do `openclaw/plugin-sdk/channel-targets`; wnętrza specyficzne dla kanału
  pozostają za lokalnym szwem `api.js` lub `runtime-api.js` należącego do Plugin.
- Podścieżki specyficzne dla możliwości, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ dołączone/natywne Plugin używają
  ich dziś. Ich obecność sama w sobie nie oznacza, że każdy eksportowany helper jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia wiadomości

Plugin powinny obsługiwać wkłady do schematu `describeMessageTool(...)` specyficzne dla kanału
dla prymitywów innych niż wiadomość, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłki powinna używać generycznego kontraktu `MessagePresentation`
zamiast natywnych pól przycisków, komponentów, bloków lub kart dostawcy.
Zobacz [Message Presentation](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły fallback, mapowanie dostawców i listę kontrolną autora Plugin.

Plugin zdolne do wysyłania deklarują, co potrafią renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań dostarczania przypiętego

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych furtek UI dostawcy z generycznego narzędzia wiadomości.
Przestarzałe helpery SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
zewnętrznych Plugin, ale nowe Plugin nie powinny ich używać.

## Rozwiązywanie celów kanału

Plugin kanałów powinny obsługiwać semantykę celów specyficzną dla kanału. Utrzymuj współdzielony
host wychodzący jako generyczny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy dane
  wejście powinno od razu przejść do rozwiązywania podobnego do ID zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback Plugin, gdy
  core potrzebuje końcowego rozwiązywania należącego do dostawcy po normalizacji lub po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` obsługuje budowę trasy sesji
  specyficznej dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorii, które powinny zapadać przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do fallback normalizacji specyficznej dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Utrzymuj natywne identyfikatory dostawcy, takie jak chat id, thread id, JID, handle i room
  id, wewnątrz wartości `target` lub parametrów specyficznych dla dostawcy, a nie w generycznych
  polach SDK.

## Katalogi oparte na konfiguracji

Plugin, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
Plugin i ponownie używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery prywatnych wiadomości sterowane allowlistą
- skonfigurowane mapy kanałów/grup
- statyczne fallback katalogu ograniczone do konta

Współdzielone helpery w `directory-runtime` obsługują tylko generyczne operacje:

- filtrowanie zapytań
- stosowanie limitów
- helpery deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji Plugin.

## Katalogi dostawców

Plugin dostawców mogą definiować katalogi modeli dla wnioskowania przy użyciu
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy Plugin obsługuje identyfikatory modeli specyficzne dla dostawcy, domyślne wartości `base URL`
lub metadane modeli zależne od auth.

`catalog.order` kontroluje, kiedy katalog Plugin scala się względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy oparte na kluczu API lub env
- `profile`: dostawcy, którzy pojawiają się, gdy istnieją profile auth
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc Plugin mogą celowo nadpisać
wbudowany wpis dostawcy o tym samym identyfikatorze dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanałów tylko do odczytu

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko zakończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/config
  repair, nie powinny wymagać materializacji poświadczeń runtime tylko po to,
  aby opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby raportować
  dostępność tylko do odczytu. Zwrócenie `tokenStatus: "available"` (oraz pasującego pola źródła)
  wystarcza dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia”
zamiast ulegać awarii lub błędnie zgłaszać konto jako nieskonfigurowane.

## Pakiety pack

Katalog Plugin może zawierać `package.json` z `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się Plugin. Jeśli pack zawiera wiele rozszerzeń, identyfikator Plugin
staje się `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Barierka bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu Plugin
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności Plugin przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności dev w runtime). Utrzymuj drzewa zależności Plugin jako „czyste JS/TS” i unikaj pakietów wymagających buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Plugin kanału albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia Plugin. Dzięki temu startup i konfiguracja są lżejsze,
gdy główny punkt wejścia Plugin podłącza też narzędzia, hooki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć dla Plugin kanału tę samą ścieżkę `setupEntry` podczas fazy
uruchamiania gateway przed `listen`, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startup, która musi istnieć
przed rozpoczęciem nasłuchiwania przez gateway. W praktyce oznacza to, że wpis konfiguracji
musi rejestrować każdą zdolność należącą do kanału, od której startup zależy, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne przed rozpoczęciem nasłuchiwania przez gateway
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twój pełny wpis nadal obsługuje jakąkolwiek wymaganą zdolność startup, nie włączaj
tej flagi. Pozostaw Plugin w zachowaniu domyślnym i pozwól OpenClaw załadować
pełny wpis podczas startup.

Dołączone kanały mogą także publikować helpery powierzchni kontraktu tylko do konfiguracji, z których core
może korzystać przed załadowaniem pełnego runtime kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi promować starszą konfigurację kanału z jednym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego wpisu Plugin.
Matrix jest obecnym dołączonym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery łatek konfiguracji utrzymują wykrywanie powierzchni kontraktu dołączonych Plugin w trybie leniwym. Czas importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast ponownego wchodzenia w startup dołączonego kanału przy imporcie modułu.

Gdy te powierzchnie startup obejmują metody Gateway RPC, utrzymuj je na
prefiksie specyficznym dla Plugin. Główne przestrzenie nazw admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze rozwiązują się
do `operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

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

Plugin kanałów mogą ogłaszać metadane konfiguracji/wykrywania przez `openclaw.channel` oraz
wskazówki instalacji przez `openclaw.install`. Dzięki temu główne dane katalogu pozostają poza core.

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

- `detailLabel`: dodatkowa etykieta dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisuje tekst linku dla linku do dokumentacji
- `preferOver`: identyfikatory Plugin/channel o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki treści powierzchni wyboru
- `markdownCapable`: oznacza kanał jako zdolny do Markdown dla decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach listowania skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych pickerach konfiguracji, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu quickstart `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów announce

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM).
Umieść plik JSON w jednym z tych miejsc:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Lub wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (albo `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkami/średnikami/zgodnie z `PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

## Plugin silnika kontekstu

Plugin silnika kontekstu obsługują orkiestrację kontekstu sesji dla ingestu, składania
i Compaction. Rejestruj je ze swojego Plugin przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny pipeline kontekstu,
a nie tylko dodać wyszukiwanie w memory lub hooki.

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

Jeśli Twój silnik **nie** obsługuje własnego algorytmu Compaction, pozostaw `compact()`
zaimplementowane i deleguj je jawnie:

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

Gdy Plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu Plugin przez prywatne sięganie do wnętrza. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie współdzielone zachowanie core powinno obsługiwać: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę skierowaną do kanałów i kształt helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime Plugin
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów core + kanałów/funkcji
   Kanały i Plugin funkcji powinny zużywać nową możliwość przez core,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Plugin dostawców rejestrują następnie swoje backendy względem możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostawały jawne z upływem czasu.

W ten sposób OpenClaw pozostaje opiniotwórczy bez twardego zakodowania jednej
wizji świata konkretnego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby poznać konkretną listę plików i gotowy przykład.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna jednocześnie dotknąć tych
powierzchni:

- typy kontraktu core w `src/<capability>/types.ts`
- helper runner/runtime core w `src/<capability>/runtime.ts`
- powierzchnię rejestracji API Plugin w `src/plugins/types.ts`
- podłączenie rejestru Plugin w `src/plugins/registry.ts`
- udostępnienie runtime Plugin w `src/plugins/runtime/*`, gdy Plugin funkcji/kanałów
  muszą ją zużywać
- helpery capture/test w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentację operatora/Plugin w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że możliwość nie jest jeszcze
w pełni zintegrowana.

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

- core obsługuje kontrakt możliwości + orkiestrację
- Plugin dostawców obsługują implementacje dostawców
- Plugin funkcji/kanałów zużywają helpery runtime
- testy kontraktowe utrzymują jawną własność
