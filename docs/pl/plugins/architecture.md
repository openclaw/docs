---
read_when:
    - Tworzysz lub debugujesz natywne pluginy OpenClaw
    - Chcesz zrozumieć model możliwości pluginów lub granice własności
    - Pracujesz nad pipeline ładowania pluginów lub rejestrem
    - Implementujesz hooki środowiska uruchomieniowego dostawców lub pluginy kanałów
sidebarTitle: Internals
summary: 'Wnętrze pluginów: model możliwości, własność, kontrakty, pipeline ładowania i pomocniki środowiska uruchomieniowego'
title: Wnętrze pluginów
x-i18n:
    generated_at: "2026-04-05T14:05:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Wnętrze pluginów

<Info>
  To jest **szczegółowa dokumentacja architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalowanie i używanie pluginów](/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/plugins/building-plugins) — pierwszy samouczek pluginu
  - [Pluginy kanałów](/plugins/sdk-channel-plugins) — budowanie kanału wiadomości
  - [Pluginy dostawców](/plugins/sdk-provider-plugins) — budowanie dostawcy modeli
  - [Przegląd SDK](/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu pluginów OpenClaw.

## Publiczny model możliwości

Możliwości są publicznym modelem **natywnych pluginów** wewnątrz OpenClaw. Każdy
natywny plugin OpenClaw rejestruje się względem jednego lub większej liczby typów możliwości:

| Możliwość             | Metoda rejestracji                              | Przykładowe pluginy                    |
| --------------------- | ----------------------------------------------- | -------------------------------------- |
| Wnioskowanie tekstowe | `api.registerProvider(...)`                     | `openai`, `anthropic`                  |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`                  |
| Mowa                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`              |
| Transkrypcja realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Głos realtime         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                               |
| Rozumienie mediów     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                     |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax`   |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`      | `qwen`                                 |
| Pobieranie z Web      | `api.registerWebFetchProvider(...)`             | `firecrawl`                            |
| Wyszukiwanie w Web    | `api.registerWebSearchProvider(...)`            | `google`                               |
| Kanał / wiadomości    | `api.registerChannel(...)`                      | `msteams`, `matrix`                    |

Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia lub
usługi, jest **starszym pluginem typu hook-only**. Ten wzorzec jest nadal w pełni obsługiwany.

### Stanowisko wobec zgodności zewnętrznej

Model możliwości został wdrożony w rdzeniu i jest dziś używany przez
bundlowane/natywne pluginy, ale zgodność zewnętrznych pluginów nadal wymaga
ściślejszego kryterium niż „jest eksportowane, więc jest zamrożone”.

Obecne wskazówki:

- **istniejące zewnętrzne pluginy:** utrzymuj działanie integracji opartych na hookach; traktuj
  to jako bazę zgodności
- **nowe bundlowane/natywne pluginy:** preferuj jawną rejestrację możliwości zamiast
  zależności specyficznych dla dostawcy lub nowych projektów typu hook-only
- **zewnętrzne pluginy przyjmujące rejestrację możliwości:** dozwolone, ale traktuj
  powierzchnie pomocnicze specyficzne dla możliwości jako rozwijające się, chyba że dokumentacja jawnie oznacza kontrakt jako stabilny

Praktyczna zasada:

- API rejestracji możliwości jest zamierzonym kierunkiem
- starsze hooki pozostają najbezpieczniejszą ścieżką bez ryzyka naruszenia zgodności dla zewnętrznych pluginów w trakcie przejścia
- eksportowane subścieżki pomocnicze nie są sobie równe; preferuj wąski udokumentowany
  kontrakt, a nie przypadkowe eksporty pomocnicze

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  plugin tylko dostawcy, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` odpowiada za wnioskowanie tekstowe, mowę, rozumienie mediów i generowanie
  obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub niestandardowe), bez
  możliwości, narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale bez
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i rozbicie możliwości.
Szczegóły znajdziesz w [dokumentacji CLI](/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla
pluginów typu hook-only. Starsze realne pluginy nadal od niego zależą.

Kierunek:

- utrzymuj jego działanie
- dokumentuj go jako starszy
- preferuj `before_model_resolve` dla nadpisywania modelu/dostawcy
- preferuj `before_prompt_build` dla mutacji promptu
- usuwaj dopiero wtedy, gdy rzeczywiste użycie spadnie, a pokrycie przez fixture wykaże bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchamiasz `openclaw doctor` lub `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | Konfiguracja parsuje się poprawnie, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe    |
| **hard error**             | Konfiguracja jest nieprawidłowa lub plugin nie załadował się  |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego pluginu --
`hook-only` ma charakter informacyjny, a `before_agent_start` wywołuje tylko ostrzeżenie. Te
sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydackie pluginy na podstawie skonfigurowanych ścieżek, korzeni workspace,
   globalnych korzeni rozszerzeń i bundlowanych rozszerzeń. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundle.
2. **Włączanie + walidacja**
   Rdzeń decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany lub
   wybrany dla ekskluzywnego slotu, takiego jak memory.
3. **Ładowanie środowiska uruchomieniowego**
   Natywne pluginy OpenClaw są ładowane w tym samym procesie przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do rekordów
   rejestru bez importowania kodu środowiska uruchomieniowego.
4. **Konsumpcja powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację
   dostawców, hooki, trasy HTTP, polecenia CLI i usługi.

Dla pluginowego CLI wykrywanie poleceń głównych jest konkretnie podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- prawdziwy moduł CLI pluginu może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw nadal może
zarezerwować nazwy poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie środowiska uruchomieniowego pochodzi ze ścieżki `register(api)` modułu pluginu

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować wskazówki UI/schematu przed aktywacją pełnego środowiska uruchomieniowego.

### Pluginy kanałów i współdzielone narzędzie message

Pluginy kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych akcji czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu,
a pluginy kanałów odpowiadają za specyficzne dla kanału wykrywanie i wykonywanie za nim.

Obecna granica wygląda tak:

- rdzeń odpowiada za host współdzielonego narzędzia `message`, podłączanie promptów, księgowanie
  sesji/wątków i dyspozycję wykonania
- pluginy kanałów odpowiadają za wykrywanie akcji zależnych od zakresu, wykrywanie możliwości
  i wszelkie fragmenty schematu specyficzne dla kanału
- pluginy kanałów odpowiadają za gramatykę konwersacji sesji specyficzną dla dostawcy, na przykład
  za to, jak identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą po nadrzędnych konwersacjach
- pluginy kanałów wykonują końcową akcję przez swój adapter akcji

Dla pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania
pozwala pluginowi zwrócić razem widoczne akcje, możliwości i wkład do schematu,
aby te elementy nie rozjeżdżały się między sobą.

Rdzeń przekazuje zakres środowiska uruchomieniowego do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać
akcje wiadomości w zależności od aktywnego konta, bieżącego pokoju/wątku/wiadomości lub
zaufanej tożsamości nadawcy, bez twardego kodowania rozgałęzień specyficznych dla kanału
w narzędziu `message` rdzenia.

Dlatego zmiany routingu embedded-runner nadal są pracą po stronie pluginu: runner
odpowiada za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, aby współdzielone narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku pomocników wykonania należących do kanału, bundlowane pluginy powinny utrzymywać
środowisko uruchomieniowe wykonania we własnych modułach rozszerzeń. Rdzeń nie odpowiada już
za środowiska uruchomieniowe akcji wiadomości Discord, Slack, Telegram ani WhatsApp
pod `src/agents/tools`.
Nie publikujemy osobnych subścieżek `plugin-sdk/*-action-runtime`, a bundlowane
pluginy powinny importować własny lokalny kod środowiska uruchomieniowego bezpośrednio z należących do nich modułów rozszerzeń.

Ta sama granica dotyczy ogólnie nazwanych przez dostawcę szwów SDK: rdzeń nie powinien
importować wygodnych barrelów specyficznych dla kanału dla Slack, Discord, Signal,
WhatsApp ani podobnych rozszerzeń. Jeśli rdzeń potrzebuje określonego zachowania, powinien
albo skorzystać z własnego barrela `api.ts` / `runtime-api.ts` bundlowanego pluginu, albo
podnieść potrzebę do poziomu wąskiej ogólnej możliwości we współdzielonym SDK.

Dla ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego
  modelu ankiety
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału lub dodatkowych parametrów ankiet

Rdzeń odkłada teraz współdzielone parsowanie ankiet do chwili, gdy wysyłka ankiety przez plugin odmówi
obsługi akcji, tak aby handlery ankiet należące do pluginu mogły przyjmować pola ankiet
specyficzne dla kanału bez wcześniejszego zablokowania ich przez generyczny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w sekcji [Pipeline ładowania](#load-pipeline).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** lub
**funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- plugin firmy powinien zwykle odpowiadać za wszystkie powierzchnie OpenClaw skierowane do tej firmy
- plugin funkcji powinien zwykle odpowiadać za pełną powierzchnię funkcji, którą wprowadza
- kanały powinny konsumować współdzielone możliwości rdzenia zamiast doraźnie implementować
  zachowanie dostawcy

Przykłady:

- bundlowany plugin `openai` odpowiada za zachowanie dostawcy modeli OpenAI oraz zachowanie OpenAI
  dla mowy + realtime-voice + media-understanding + image-generation
- bundlowany plugin `elevenlabs` odpowiada za zachowanie mowy ElevenLabs
- bundlowany plugin `microsoft` odpowiada za zachowanie mowy Microsoft
- bundlowany plugin `google` odpowiada za zachowanie dostawcy modeli Google oraz
  zachowanie Google dla media-understanding + image-generation + web-search
- bundlowany plugin `firecrawl` odpowiada za zachowanie web-fetch Firecrawl
- bundlowane pluginy `minimax`, `mistral`, `moonshot` i `zai` odpowiadają za swoje
  backendy media-understanding
- plugin `qwen` odpowiada za zachowanie dostawcy tekstu Qwen oraz
  za zachowanie media-understanding i video-generation
- plugin `voice-call` jest pluginem funkcji: odpowiada za transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumieni mediów Twilio, ale konsumuje współdzielone możliwości speech
  oraz realtime-transcription i realtime-voice zamiast bezpośrednio importować pluginy dostawców

Zamierzony stan końcowy wygląda tak:

- OpenAI znajduje się w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  w przyszłości wideo
- inny dostawca może zrobić to samo dla własnej powierzchni
- kanały nie przejmują się tym, który plugin dostawcy odpowiada za dostawcę; konsumują
  współdzielony kontrakt możliwości udostępniany przez rdzeń

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **możliwość** = kontrakt rdzenia, który wiele pluginów może implementować lub konsumować

Jeśli więc OpenClaw doda nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który dostawca powinien na sztywno zakodować obsługę wideo?”. Pierwsze pytanie brzmi
„jaki jest kontrakt możliwości wideo w rdzeniu?”. Gdy taki kontrakt powstanie, pluginy dostawców
mogą się wobec niego rejestrować, a pluginy kanałów/funkcji mogą go konsumować.

Jeśli możliwość jeszcze nie istnieje, właściwym krokiem zwykle jest:

1. zdefiniowanie brakującej możliwości w rdzeniu
2. udostępnienie jej przez API/runtime pluginu w sposób typowany
3. podłączenie kanałów/funkcji do tej możliwości
4. pozwolenie pluginom dostawców na rejestrowanie implementacji

To utrzymuje własność w sposób jawny i jednocześnie unika zachowań rdzenia zależnych
od pojedynczego dostawcy lub jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Używaj tego modelu mentalnego, gdy decydujesz, gdzie powinien znajdować się kod:

- **warstwa możliwości rdzenia**: współdzielona orkiestracja, polityka, failover, reguły
  scalania konfiguracji, semantyka dostarczania i kontrakty typowane
- **warstwa pluginu dostawcy**: API specyficzne dla dostawcy, uwierzytelnianie, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa pluginu kanału/funkcji**: integracja Slack/Discord/voice-call/etc.,
  która konsumuje możliwości rdzenia i prezentuje je na określonej powierzchni

Na przykład TTS ma taki kształt:

- rdzeń odpowiada za politykę TTS w czasie odpowiedzi, kolejność fallback, preferencje i dostarczanie do kanałów
- `openai`, `elevenlabs` i `microsoft` odpowiadają za implementacje syntezy
- `voice-call` konsumuje pomocnik środowiska uruchomieniowego TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład firmowego pluginu o wielu możliwościach

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji realtime, głosu realtime, rozumienia mediów,
generowania obrazów, generowania wideo, web fetch i web search, dostawca może
obsłużyć wszystkie swoje powierzchnie w jednym miejscu:

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
      // hooki auth/katalogu modeli/środowiska uruchomieniowego
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // konfiguracja mowy dostawcy — bezpośrednia implementacja interfejsu SpeechProviderPlugin
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
        // logika poświadczeń + pobierania
      }),
    );
  },
};

export default plugin;
```

Najważniejsze nie są dokładne nazwy helperów. Liczy się kształt:

- jeden plugin odpowiada za powierzchnię dostawcy
- rdzeń nadal odpowiada za kontrakty możliwości
- kanały i pluginy funkcji konsumują helpery `api.runtime.*`, a nie kod dostawcy
- testy kontraktów mogą sprawdzać, czy plugin zarejestrował możliwości, do których własności się przyznaje

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazu/dźwięku/wideo jako jedną współdzieloną
możliwość. Ten sam model własności ma tu zastosowanie:

1. rdzeń definiuje kontrakt media-understanding
2. pluginy dostawców rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo`, tam gdzie ma to zastosowanie
3. pluginy kanałów i funkcji konsumują współdzielone zachowanie rdzenia zamiast
   wiązać się bezpośrednio z kodem dostawcy

To pozwala uniknąć wpisywania założeń o wideo jednego dostawcy do rdzenia. Plugin odpowiada
za powierzchnię dostawcy; rdzeń odpowiada za kontrakt możliwości i zachowanie fallback.

Generowanie wideo korzysta już z tej samej sekwencji: rdzeń odpowiada za typowany
kontrakt możliwości i helper środowiska uruchomieniowego, a pluginy dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy wdrożeniowej? Zobacz
[Capability Cookbook](/tools/capability-cookbook).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji i
helpery środowiska uruchomieniowego, na których plugin może polegać.

Dlaczego to ważne:

- autorzy pluginów otrzymują jeden stabilny wewnętrzny standard
- rdzeń może odrzucać zduplikowaną własność, na przykład dwa pluginy rejestrujące to samo
  id dostawcy
- uruchamianie może pokazywać przydatną diagnostykę dla błędnej rejestracji
- testy kontraktów mogą wymuszać własność bundlowanych pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w środowisku uruchomieniowym**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   zduplikowane id dostawców, zduplikowane id dostawców mowy i błędne
   rejestracje skutkują diagnostyką pluginu zamiast niezdefiniowanego zachowania.
2. **testy kontraktów**
   Bundlowane pluginy są przechwytywane w rejestrach kontraktów podczas uruchomień testów, aby
   OpenClaw mógł jawnie potwierdzać własność. Dziś jest to używane dla modeli
   dostawców, dostawców mowy, dostawców web search i własności bundlowanych rejestracji.

W praktyce oznacza to, że OpenClaw z góry wie, który plugin odpowiada za którą
powierzchnię. To pozwala rdzeniowi i kanałom składać się bezproblemowo, ponieważ własność jest
zadeklarowana, typowana i testowalna, a nie ukryta.

### Co powinno należeć do kontraktu

Dobre kontrakty pluginów są:

- typowane
- małe
- specyficzne dla możliwości
- należące do rdzenia
- wielokrotnie używalne przez wiele pluginów
- konsumowalne przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty pluginów to:

- polityka specyficzna dla dostawcy ukryta w rdzeniu
- jednorazowe furtki dla pluginów omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty środowiska uruchomieniowego, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a dopiero potem
pozwól pluginom się do niej podpiąć.

## Model wykonania

Natywne pluginy OpenClaw działają **w tym samym procesie** co Gateway. Nie są
sandboxowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co kod rdzenia.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd w natywnym pluginie może zawiesić lub zdestabilizować gateway
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako paczki metadanych/treści. W bieżących wydaniach oznacza to głównie bundlowane
Skills.

Używaj allowlist i jawnych ścieżek instalacji/ładowania dla pluginów niebundlowanych. Traktuj
pluginy workspace jako kod czasu rozwoju, a nie produkcyjne ustawienia domyślne.

Dla bundlowanych nazw pakietów workspace utrzymuj id pluginu zakotwiczone w nazwie npm:
domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo udostępnia węższą rolę pluginu.

Ważna uwaga o zaufaniu:

- `plugins.allow` ufa **id pluginów**, a nie pochodzeniu źródła.
- Plugin workspace z tym samym id co bundlowany plugin celowo przesłania
  bundlowaną kopię, gdy ten plugin workspace jest włączony/na allowlist.
- To normalne i użyteczne przy lokalnym rozwoju, testach poprawek i hotfixach.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacyjne skróty.

Utrzymuj publiczną rejestrację możliwości. Przycinaj eksporty helperów niebędących kontraktem:

- subścieżki pomocnicze specyficzne dla bundlowanego pluginu
- subścieżki infrastruktury środowiska uruchomieniowego, które nie są publicznym API
- helpery wygody specyficzne dla dostawcy
- helpery konfiguracji/onboardingu będące szczegółami implementacji

Niektóre subścieżki helperów bundlowanych pluginów nadal pozostają w wygenerowanej
mapie eksportów SDK dla zgodności i utrzymania bundlowanych pluginów. Obecne przykłady to
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i kilka szwów `plugin-sdk/matrix*`. Traktuj je jako
zarezerwowane eksporty będące szczegółami implementacji, a nie jako zalecany wzorzec SDK dla
nowych pluginów zewnętrznych.

## Pipeline ładowania

Przy starcie OpenClaw w przybliżeniu wykonuje następujące kroki:

1. wykrywa kandydackie korzenie pluginów
2. odczytuje natywne lub zgodne manifesty bundle i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone natywne moduły przez jiti
7. wywołuje natywne hooki `register(api)` (lub `activate(api)` — starszy alias) i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom poleceń/środowiska uruchomieniowego

<Note>
`activate` jest starszym aliasem dla `register` — loader rozwiązuje dostępne pole (`def.register ?? def.activate`) i wywołuje je w tym samym miejscu. Wszystkie bundlowane pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem kodu środowiska uruchomieniowego. Kandydaci są blokowani,
gdy wpis wykracza poza korzeń pluginu, ścieżka jest zapisywalna dla wszystkich lub własność ścieżki wygląda podejrzanie dla pluginów niebundlowanych.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikacji pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- wzbogacania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu

Dla natywnych pluginów moduł środowiska uruchomieniowego jest częścią płaszczyzny danych. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy dostawców.

### Co loader buforuje

OpenClaw utrzymuje krótkotrwałe cache w procesie dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów pluginów

Te cache ograniczają skokowy koszt uruchamiania i powtarzanych poleceń. Można je bezpiecznie
traktować jako krótkotrwałe cache wydajnościowe, a nie warstwę trwałości.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` lub
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache.
- Dostosuj okna cache przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio przypadkowych globali rdzenia. Rejestrują się do
centralnego rejestru pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i hooki typowane
- kanały
- dostawców
- handlery gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- polecenia należące do pluginów

Funkcje rdzenia następnie odczytują z tego rejestru zamiast rozmawiać bezpośrednio z modułami pluginów.
To utrzymuje ładowanie jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- środowisko uruchomieniowe rdzenia -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla łatwości utrzymania. Oznacza, że większość powierzchni rdzenia potrzebuje
tylko jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł pluginu”.

## Callbacki powiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować po rozstrzygnięciu zatwierdzenia.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu żądania powiązania:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Powiązanie dla tego pluginu + konwersacji już istnieje.
        console.log(event.binding?.conversationId);
        return;
      }

      // Żądanie zostało odrzucone; wyczyść lokalny oczekujący stan.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Pola ładunku callbacku:

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, wskazówka odłączenia, id nadawcy i
  metadane konwersacji

Ten callback ma wyłącznie charakter powiadomienia. Nie zmienia tego, kto może wiązać konwersację, i działa po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki środowiska uruchomieniowego dostawców

Pluginy dostawców mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` do taniego wyszukiwania uwierzytelniania env przed
  załadowaniem środowiska uruchomieniowego oraz `providerAuthChoices` do tanich etykiet onboardingu/wyboru uwierzytelniania
  i metadanych flag CLI przed załadowaniem środowiska uruchomieniowego
- hooki czasu konfiguracji: `catalog` / starsze `discovery` oraz `applyConfigDefaults`
- hooki środowiska uruchomieniowego: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
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

OpenClaw nadal odpowiada za ogólną pętlę agenta, failover, obsługę transkryptu i
politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowań specyficznych dla dostawcy bez potrzeby tworzenia całkowicie niestandardowego transportu wnioskowania.

Używaj manifestowego `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/model-picker powinny widzieć bez ładowania środowiska uruchomieniowego pluginu.
Używaj manifestowego `providerAuthChoices`, gdy powierzchnie onboardingu/wyboru uwierzytelniania CLI
powinny znać id wyboru dostawcy, etykiety grup i prostą konfigurację
uwierzytelniania jedną flagą bez ładowania środowiska uruchomieniowego dostawcy. Zachowaj runtime
`envVars` dostawcy dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu czy zmienne
konfiguracji OAuth client-id/client-secret.

### Kolejność hooków i sposób użycia

Dla pluginów modeli/dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                | Kiedy używać                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json` | Dostawca odpowiada za katalog lub domyślne base URL                                                                                       |
| 2   | `applyConfigDefaults`             | Stosuje globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli dostawcy                                                         |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje normalnej ścieżki rejestru/katalogu                         | _(to nie jest hook pluginu)_                                                                                                              |
| 3   | `normalizeModelId`                | Normalizuje starsze lub podglądowe aliasy id modelu przed wyszukaniem                  | Dostawca odpowiada za porządkowanie aliasów przed kanonicznym rozwiązywaniem modelu                                                       |
| 4   | `normalizeTransport`              | Normalizuje rodzinę dostawcy `api` / `baseUrl` przed ogólnym składaniem modelu         | Dostawca odpowiada za porządkowanie transportu dla niestandardowych id dostawców w tej samej rodzinie transportu                         |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/dostawcy              | Dostawca potrzebuje porządkowania konfiguracji, które powinno należeć do pluginu; bundlowane helpery rodziny Google nadal wspierają obsługiwane wpisy config Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje zgodnościowe przepisania użycia natywnego streamingu do dostawców konfiguracyjnych | Dostawca potrzebuje poprawek metadanych użycia natywnego streamingu zależnych od endpointu                                              |
| 7   | `resolveConfigApiKey`             | Rozwiązuje env-marker auth dla dostawców konfiguracyjnych przed załadowaniem runtime auth | Dostawca ma własne rozwiązywanie klucza API przez env-marker; `amazon-bedrock` ma tu także wbudowany resolver AWS env-marker             |
| 8   | `resolveSyntheticAuth`            | Ujawnia auth lokalne/self-hosted lub oparte na konfiguracji bez utrwalania jawnych sekretów | Dostawca może działać z syntetycznym/lokalnym markerem poświadczenia                                                                      |
| 9   | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych placeholderów profili względem auth z env/config | Dostawca przechowuje syntetyczne placeholdery profili, które nie powinny wygrywać w pierwszeństwie                                       |
| 10  | `resolveDynamicModel`             | Synchroniczny fallback dla id modeli dostawcy, których jeszcze nie ma w lokalnym rejestrze | Dostawca akceptuje dowolne id modeli upstream                                                                                             |
| 11  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po którym `resolveDynamicModel` uruchamia się ponownie      | Dostawca potrzebuje metadanych sieciowych przed rozwiązaniem nieznanych id                                                                |
| 12  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez embedded runner            | Dostawca potrzebuje przepisań transportu, ale nadal korzysta z transportu rdzenia                                                         |
| 13  | `contributeResolvedModelCompat`   | Wnosi flagi zgodności dla modeli dostawcy za innym kompatybilnym transportem           | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                         |
| 14  | `capabilities`                    | Metadane transkryptu/narzędzi należące do dostawcy, używane przez współdzieloną logikę rdzenia | Dostawca potrzebuje specyfiki transkryptu/rodziny dostawcy                                                                                |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim embedded runner je zobaczy                        | Dostawca potrzebuje porządkowania schematów zależnego od rodziny transportu                                                               |
| 16  | `inspectToolSchemas`              | Pokazuje diagnostykę schematów należącą do dostawcy po normalizacji                    | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                         |
| 17  | `resolveReasoningOutputMode`      | Wybiera natywny lub otagowany kontrakt wyjścia reasoning                               | Dostawca potrzebuje otagowanego reasoning/final output zamiast natywnych pól                                                              |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji streamingu             | Dostawca potrzebuje domyślnych parametrów żądania lub porządkowania parametrów dla dostawcy                                               |
| 19  | `createStreamFn`                  | Całkowicie zastępuje normalną ścieżkę streamingu niestandardowym transportem           | Dostawca potrzebuje niestandardowego protokołu, a nie tylko wrappera                                                                       |
| 20  | `wrapStreamFn`                    | Wrapper streamingu po zastosowaniu wrapperów ogólnych                                  | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modelu bez niestandardowego transportu                                           |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu dla każdej tury                       | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dla dostawcy                                                         |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cooldown sesji                         | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę fallback                                                   |
| 23  | `formatApiKey`                    | Formatter profilu auth: zapisany profil staje się ciągiem `apiKey` dla runtime         | Dostawca przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokena runtime                                        |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki błędów | Dostawca nie pasuje do współdzielonych refresherów `pi-ai`                                                                                 |
| 25  | `buildAuthDoctorHint`             | Dopisywana wskazówka naprawcza przy błędzie odświeżania OAuth                           | Dostawca potrzebuje własnych wskazówek naprawy auth po błędzie odświeżania                                                                 |
| 26  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                              | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki nie wykryją                                                             |
| 27  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                    | Dostawca potrafi mapować surowe błędy API/transportu na rate-limit/przeciążenie/etc.                                                      |
| 28  | `isCacheTtlEligible`              | Polityka cache promptów dla dostawców proxy/backhaul                                   | Dostawca potrzebuje specyficznego dla proxy bramkowania TTL cache                                                                          |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu naprawczego przy braku auth                              | Dostawca potrzebuje własnej wskazówki odzyskiwania przy braku auth                                                                         |
| 30  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli upstream + opcjonalna wskazówka błędu dla użytkownika   | Dostawca musi ukryć nieaktualne wiersze upstream lub zastąpić je wskazówką dostawcy                                                        |
| 31  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dopisywane po wykryciu                            | Dostawca potrzebuje syntetycznych wierszy zgodności do przodu w `models list` i pickerach                                                 |
| 32  | `isBinaryThinking`                | Przełącznik reasoning włącz/wyłącz dla dostawców binary-thinking                        | Dostawca udostępnia tylko binarne myślenie włącz/wyłącz                                                                                    |
| 33  | `supportsXHighThinking`           | Obsługa reasoning `xhigh` dla wybranych modeli                                         | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                           |
| 34  | `resolveDefaultThinkingLevel`     | Domyślny poziom `/think` dla określonej rodziny modeli                                 | Dostawca odpowiada za domyślne zasady `/think` dla rodziny modeli                                                                          |
| 35  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów live i wyboru smoke                            | Dostawca odpowiada za dopasowanie preferowanych modeli live/smoke                                                                          |
| 36  | `prepareRuntimeAuth`              | Zamienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed inferencją | Dostawca potrzebuje wymiany tokena lub krótkotrwałego poświadczenia żądania                                                                |
| 37  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu | Dostawca potrzebuje niestandardowego parsowania tokena usage/quota lub innego poświadczenia usage                                         |
| 38  | `fetchUsageSnapshot`              | Pobiera i normalizuje migawki użycia/kwot dostawcy po rozwiązaniu auth                 | Dostawca potrzebuje własnego endpointu usage lub parsera ładunku                                                                           |
| 39  | `createEmbeddingProvider`         | Buduje adapter embeddingów należący do dostawcy dla memory/search                      | Zachowanie embeddingów memory powinno należeć do pluginu dostawcy                                                                          |
| 40  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla dostawcy                   | Dostawca potrzebuje niestandardowej polityki transkryptu (np. usuwania bloków thinking)                                                   |
| 41  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym czyszczeniu transkryptu                          | Dostawca potrzebuje przepisów replay specyficznych dla dostawcy poza współdzielonymi helperami kompakcji                                  |
| 42  | `validateReplayTurns`             | Końcowa walidacja lub przekształcenie tur replay przed embedded runnerem               | Transport dostawcy potrzebuje ściślejszej walidacji tur po ogólnej sanityzacji                                                            |
| 43  | `onModelSelected`                 | Uruchamia efekty uboczne należące do dostawcy po wyborze modelu                        | Dostawca potrzebuje telemetrii lub własnego stanu po aktywacji modelu                                                                      |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą przez inne pluginy dostawców obsługujące hooki,
dopóki któryś faktycznie nie zmieni id modelu lub transportu/konfiguracji. Dzięki temu
shimy aliasów/zgodności dostawców działają bez wymagania od wywołującego wiedzy,
który bundlowany plugin odpowiada za przepisanie. Jeśli żaden hook dostawcy nie przepisze
obsługiwanego wpisu konfiguracyjnego rodziny Google, bundlowany normalizator konfiguracji Google nadal stosuje tę poprawkę zgodności.

Jeśli dostawca potrzebuje całkowicie niestandardowego protokołu lub wykonawcy żądań,
jest to inna klasa rozszerzenia. Te hooki służą zachowaniom dostawcy, które nadal
działają na zwykłej pętli wnioskowania OpenClaw.

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
  oraz `wrapStreamFn`, ponieważ odpowiada za zgodność do przodu Claude 4.6,
  wskazówki rodziny dostawcy, wskazówki naprawy auth, integrację endpointu usage,
  kwalifikację cache promptów, wartości domyślne config zależne od auth, domyślne/adaptacyjne
  zasady thinking Claude oraz kształtowanie streamingu specyficzne dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Pomocniki streamingu Claude specyficzne dla Anthropic pozostają na razie we własnym
  publicznym szwie `api.ts` / `contract-api.ts` bundlowanego pluginu. Ta powierzchnia
  pakietu eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` i niższopoziomowe
  buildery wrapperów Anthropic zamiast rozszerzać ogólne SDK wokół reguł nagłówków beta jednego dostawcy.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities` oraz `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` i `isModernModelRef`,
  ponieważ odpowiada za zgodność do przodu GPT-5.4, bezpośrednią normalizację
  `openai-completions` -> `openai-responses`, wskazówki auth uwzględniające Codex,
  tłumienie Spark, syntetyczne wiersze list OpenAI, oraz zasady thinking /
  live-model GPT-5; rodzina streamingu `openai-responses-defaults` odpowiada za
  współdzielone natywne wrappery OpenAI Responses dla nagłówków atrybucji,
  `/fast`/`serviceTier`, szczegółowości tekstu, natywnego wyszukiwania w Web w Codex,
  kształtowania ładunków zgodności reasoning i zarządzania kontekstem Responses.
- OpenRouter używa `catalog`, `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ dostawca działa jako pass-through i może udostępniać nowe
  id modeli, zanim statyczny katalog OpenClaw zostanie zaktualizowany; używa także
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby utrzymać
  specyficzne dla dostawcy nagłówki żądań, metadane routingu, poprawki reasoning oraz politykę cache promptów poza rdzeniem. Jego polityka replay pochodzi z rodziny
  `passthrough-gemini`, natomiast rodzina streamingu `openrouter-thinking` odpowiada za
  wstrzykiwanie reasoning proxy oraz pomijanie nieobsługiwanych modeli / `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities` oraz `prepareRuntimeAuth` i `fetchUsageSnapshot`, ponieważ
  potrzebuje własnego logowania urządzenia, zachowania fallback modeli, specyfiki
  transkryptu Claude, wymiany tokena GitHub -> token Copilot oraz własnego endpointu usage.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog` oraz
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach OpenAI rdzenia, ale odpowiada za własną
  normalizację transportu/base URL, politykę fallback odświeżania OAuth,
  domyślny wybór transportu, syntetyczne wiersze katalogu Codex oraz integrację
  endpointu usage ChatGPT; współdzieli tę samą rodzinę streamingu `openai-responses-defaults` co bezpośrednie OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ rodzina replay
  `google-gemini` odpowiada za zgodność do przodu Gemini 3.1, natywną walidację
  replay Gemini, sanityzację replay bootstrap, otagowany tryb wyjścia reasoning
  i dopasowanie nowoczesnych modeli, natomiast rodzina streamingu
  `google-thinking` odpowiada za normalizację ładunku thinking Gemini;
  Gemini CLI OAuth używa też `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokenów, parsowania tokenów i podłączenia
  endpointu kwot.
- Anthropic Vertex używa `buildReplayPolicy` przez rodzinę replay
  `anthropic-by-model`, dzięki czemu czyszczenie replay specyficzne dla Claude pozostaje
  ograniczone do id Claude zamiast do całego transportu `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveDefaultThinkingLevel`, ponieważ odpowiada
  za klasyfikację błędów throttling/not-ready/context-overflow specyficznych dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli
  tę samą ochronę tylko dla Claude z `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  przez rodzinę replay `passthrough-gemini`, ponieważ przekazują modele Gemini
  przez transporty kompatybilne z OpenAI i potrzebują sanityzacji sygnatur myśli Gemini
  bez natywnej walidacji replay Gemini ani przepisów bootstrap.
- MiniMax używa `buildReplayPolicy` przez rodzinę replay
  `hybrid-anthropic-openai`, ponieważ jeden dostawca odpowiada zarówno za semantykę
  Anthropic-message, jak i zgodność z OpenAI; zachowuje usuwanie bloków myślenia tylko dla Claude po stronie Anthropic, jednocześnie nadpisując tryb wyjścia reasoning z powrotem na natywny, a rodzina streamingu `minimax-fast-mode` odpowiada za
  przepisania modeli fast-mode na współdzielonej ścieżce streamingu.
- Moonshot używa `catalog` oraz `wrapStreamFn`, ponieważ nadal korzysta ze współdzielonego
  transportu OpenAI, ale potrzebuje normalizacji ładunku thinking należącej do dostawcy; rodzina streamingu `moonshot-thinking` mapuje config oraz stan `/think` na jego natywny binarny ładunek thinking.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje nagłówków żądań należących do dostawcy,
  normalizacji ładunku reasoning, wskazówek transkryptu Gemini i bramkowania
  Anthropic cache-TTL; rodzina streamingu `kilocode-thinking` utrzymuje wstrzykiwanie
  Kilo thinking na współdzielonej ścieżce streamingu proxy, jednocześnie pomijając `kilo/auto` i
  inne id modeli proxy, które nie obsługują jawnych ładunków reasoning.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ odpowiada za fallback GLM-5,
  domyślne `tool_stream`, UX binarnego thinking, dopasowanie nowoczesnych modeli
  oraz zarówno auth usage, jak i pobieranie kwot; rodzina streamingu
  `tool-stream-default-on` utrzymuje wrapper `tool_stream` domyślnie włączony poza
  ręcznie pisanym klejem dla dostawców.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ odpowiada za natywną normalizację transportu xAI Responses, przepisania
  aliasów Grok fast-mode, domyślne `tool_stream`, czyszczenie ścisłych narzędzi / ładunku reasoning, ponowne użycie auth fallback dla narzędzi należących do pluginu, rozwiązywanie modeli Grok zgodne do przodu oraz poprawki zgodności należące do dostawcy, takie jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` i dekodowanie argumentów wywołań narzędzi z encjami HTML.
- Mistral, OpenCode Zen i OpenCode Go używają wyłącznie `capabilities`, aby utrzymać
  specyfikę transkryptu/narzędzi poza rdzeniem.
- Bundlowani dostawcy z samym katalogiem, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  wyłącznie `catalog`.
- Qwen używa `catalog` dla swojego dostawcy tekstu oraz współdzielonych rejestracji media-understanding i
  video-generation dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków usage, ponieważ ich zachowanie `/usage`
  należy do pluginu, mimo że inferencja nadal działa przez współdzielone transporty.

## Pomocniki środowiska uruchomieniowego

Pluginy mogą uzyskiwać dostęp do wybranych helperów rdzenia przez `api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca zwykły ładunek wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji `messages.tts` i wyboru dostawcy z rdzenia.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą wykonać resampling/kodowanie dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go do selektorów głosów lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla selektorów zależnych od dostawcy.
- Dziś telefonię obsługują OpenAI i ElevenLabs. Microsoft nie.

Pluginy mogą też rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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

- Utrzymuj politykę TTS, fallback i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do id dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może odpowiadać
  za tekst, mowę, obrazy i przyszłych dostawców mediów, gdy OpenClaw dodaje takie kontrakty możliwości.

Dla rozumienia obrazu/dźwięku/wideo pluginy rejestrują jednego typowanego
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

- Utrzymuj orkiestrację, fallback, konfigurację i podłączanie kanałów w rdzeniu.
- Zachowanie dostawcy utrzymuj w pluginie dostawcy.
- Rozszerzenia addytywne powinny pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyniku, nowe opcjonalne możliwości.
- Generowanie wideo już korzysta z tego samego wzorca:
  - rdzeń odpowiada za kontrakt możliwości i helper środowiska uruchomieniowego
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów konsumują `api.runtime.videoGeneration.*`

Dla helperów środowiska uruchomieniowego media-understanding pluginy mogą wywoływać:

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

Dla transkrypcji audio pluginy mogą używać albo runtime media-understanding,
albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcjonalne, gdy MIME nie da się wiarygodnie ustalić:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` to preferowana współdzielona powierzchnia dla
  rozumienia obrazu/dźwięku/wideo.
- Używa konfiguracji audio media-understanding z rdzenia (`tools.media.audio`) i kolejności fallback dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład wejście zostało pominięte/nieobsługiwane).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą również uruchamiać podagentów działających w tle przez `api.runtime.subagent`:

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

- `provider` i `model` są opcjonalnymi nadpisaniami dla pojedynczego uruchomienia, a nie trwałymi zmianami sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla uruchomień fallback należących do pluginów operatorzy muszą wyraźnie włączyć `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Uruchomienia podagentów z niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić na fallback.

Dla web search pluginy mogą korzystać ze współdzielonego helpera runtime zamiast
sięgać do podłączeń narzędzia agenta:

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

Pluginy mogą również rejestrować dostawców web-search przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Utrzymuj wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj dostawców web-search dla transportów wyszukiwania specyficznych dla dostawcy.
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
- `listProviders(...)`: wyświetl dostępnych dostawców generowania obrazów i ich możliwości.

## Trasy HTTP gateway

Pluginy mogą wystawiać endpointy HTTP przez `api.registerHttpRoute(...)`.

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
- `match`: opcjonalne. `"exact"` (domyślnie) lub `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Używaj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnie tych samych `path + match` są odrzucane, chyba że `replaceExisting: true`, i jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy fallback `exact`/`prefix` utrzymuj tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów operatora runtime. Służą do webhooków/weryfikacji podpisów zarządzanych przez plugin, a nie do uprzywilejowanych wywołań pomocników Gateway.
- Trasy `auth: "gateway"` działają w zakresie runtime żądania Gateway, ale ten zakres jest celowo konserwatywny:
  - uwierzytelnianie bearer współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny na takich żądaniach tras pluginów przenoszących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu uwierzytelniana przez gateway jest domyślnie powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania tylko dla administratora, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

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
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonego podłączania setup/auth/reply/webhook.
  `channel-inbound` jest wspólnym miejscem dla debounce, dopasowywania wzmianek,
  formatowania kopert i helperów kontekstu kopert przychodzących.
  `channel-setup` to wąski szew opcjonalnej instalacji.
  `setup-runtime` to bezpieczna dla runtime powierzchnia konfiguracji używana przez `setupEntry` /
  opóźniony start, w tym adaptery poprawek konfiguracji bezpieczne względem importu.
  `setup-adapter-runtime` to szew adaptera konfiguracji konta uwzględniający env.
  `setup-tools` to mały szew pomocników CLI/archiwów/dokumentacji (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subścieżki domenowe takie jak `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych helperów runtime/config.
  `telegram-command-config` to wąski publiczny szew dla normalizacji/walidacji niestandardowych
  poleceń Telegram i pozostaje dostępny nawet wtedy, gdy powierzchnia kontraktu
  bundlowanego Telegram jest chwilowo niedostępna.
  `text-runtime` to współdzielony szew tekst/markdown/logowanie, obejmujący
  usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkowania markdown,
  helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu.
- Szwy kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt
  `approvalCapability` na pluginie. Rdzeń odczytuje wtedy auth zatwierdzeń, dostarczanie, renderowanie i natywne zachowanie routingu przez tę jedną możliwość zamiast mieszać zachowanie zatwierdzeń z niepowiązanymi polami pluginu.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje tylko jako
  shim zgodności dla starszych pluginów. Nowy kod powinien importować węższe
  ogólne prymitywy, a kod repo nie powinien dodawać nowych importów tego shimu.
- Wnętrze bundlowanych rozszerzeń pozostaje prywatne. Zewnętrzne pluginy powinny używać tylko subścieżek `openclaw/plugin-sdk/*`. Kod/testy rdzenia OpenClaw mogą używać publicznych punktów wejścia repo pod korzeniem pakietu pluginu, takich jak `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` oraz wąsko zakresionych plików takich jak
  `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu pluginu z rdzenia ani z innego rozszerzenia.
- Podział punktów wejścia repo:
  `<plugin-package-root>/api.js` to barrel helperów/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko runtime,
  `<plugin-package-root>/index.js` to punkt wejścia bundlowanego pluginu,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia pluginu konfiguracji.
- Obecne bundlowane przykłady dostawców:
  - Anthropic używa `api.js` / `contract-api.js` dla helperów strumienia Claude, takich jak
    `wrapAnthropicProviderStream`, helperów nagłówków beta oraz parsowania `service_tier`.
  - OpenAI używa `api.js` dla builderów dostawcy, helperów modeli domyślnych i builderów dostawców realtime.
  - OpenRouter używa `api.js` dla swojego buildera dostawcy oraz helperów onboardingu/config, natomiast `register.runtime.js` nadal może re-eksportować ogólne helpery `plugin-sdk/provider-stream` do użytku lokalnego w repo.
- Publiczne punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji runtime,
  jeśli taka istnieje, a w przeciwnym razie wracają do rozwiązanego pliku konfiguracji na dysku,
  gdy OpenClaw nie udostępnia jeszcze migawki runtime.
- Ogólne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje mały zarezerwowany zestaw szwów helperów bundlowanych kanałów oznaczonych marką. Traktuj je jako szwy utrzymaniowe/zgodnościowe dla bundle, a nie nowe cele importu dla pluginów zewnętrznych; nowe kontrakty międzykanałowe powinny nadal trafiać do ogólnych subścieżek `plugin-sdk/*` lub lokalnych barrelów `api.js` /
  `runtime-api.js` pluginu.

Uwaga dotycząca zgodności:

- W nowym kodzie unikaj głównego barrela `openclaw/plugin-sdk`.
- Preferuj najpierw wąskie stabilne prymitywy. Nowsze subścieżki
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool są zamierzonym kontraktem dla nowych
  prac nad bundlowanymi i zewnętrznymi pluginami.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki akcji wiadomości i helpery id wiadomości reakcji należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrels helperów specyficznych dla bundlowanych rozszerzeń nie są domyślnie stabilne. Jeśli helper jest potrzebny tylko bundlowanemu rozszerzeniu, trzymaj go za lokalnym szwem `api.js` lub `runtime-api.js` tego rozszerzenia zamiast promować go do `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone szwy helperów powinny być ogólne, a nie oznaczone marką kanału. Wspólne
  parsowanie celów należy do `openclaw/plugin-sdk/channel-targets`; kanałowe szczegóły wewnętrzne pozostają za lokalnym szwem `api.js` lub `runtime-api.js` należącego pluginu.
- Subścieżki specyficzne dla możliwości, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ bundlowane/natywne pluginy używają
  ich dziś. Sama ich obecność nie oznacza automatycznie, że każdy eksportowany helper jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia message

Pluginy powinny odpowiadać za wkład do schematu `describeMessageTool(...)`
specyficzny dla kanału. Pola specyficzne dla dostawcy trzymaj w pluginie, a nie we współdzielonym rdzeniu.

Dla współdzielonych przenośnych fragmentów schematów używaj ogólnych helperów eksportowanych przez
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` dla ładunków w stylu siatki przycisków
- `createMessageToolCardSchema()` dla ustrukturyzowanych ładunków kart

Jeśli kształt schematu ma sens tylko dla jednego dostawcy, definiuj go we własnym źródle tego pluginu zamiast promować do współdzielonego SDK.

## Rozwiązywanie celów kanału

Pluginy kanałów powinny odpowiadać za semantykę celów specyficzną dla kanału. Utrzymuj
wspólny host outbound jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  należy traktować jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi rdzeniowi, czy
  dane wejście powinno pominąć wyszukiwanie w katalogu i od razu przejść do rozwiązywania podobnego do id.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy rdzeń
  potrzebuje końcowego rozstrzygnięcia należącego do dostawcy po normalizacji lub po chybieniu w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za konstrukcję trasy sesji specyficzną dla dostawcy po rozstrzygnięciu celu.

Zalecany podział:

- Używaj `inferTargetChatType` dla decyzji kategorialnych, które powinny zapadać przed
  przeszukiwaniem peerów/grup.
- Używaj `looksLikeId` dla kontroli typu „traktuj to jak jawne/natywne id celu”.
- Używaj `resolveTarget` dla fallbacku normalizacji specyficznego dla dostawcy, a nie do
  szerokiego przeszukiwania katalogu.
- Natywne dla dostawcy id, takie jak id czatu, id wątku, JID, uchwyty i id pokoi, przechowuj
  w wartościach `target` lub parametrach specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogowe z konfiguracji, powinny utrzymywać tę logikę we własnym pluginie i używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM oparte na allowlist
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu ograniczone do konta

Współdzielone helpery w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- nakładanie limitów
- deduplikację/helpery normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja konta i normalizacja id specyficzna dla kanału powinna pozostać w implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin odpowiada za id modeli specyficzne dla dostawcy, domyślne base URL lub metadane modeli zależne od auth.

`catalog.order` kontroluje, kiedy katalog pluginu jest scalany względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy oparci na kluczu API lub env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisać
wbudowany wpis dostawcy z tym samym id dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanałów tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane i może szybko zakończyć się błędem przy braku wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/naprawy konfiguracji
  nie powinny wymagać materializacji poświadczeń runtime tylko po to, aby opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, tam gdzie to istotne, na przykład:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu. Wystarczy zwrócić `tokenStatus: "available"` (oraz odpowiadające pole źródła).
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia”, zamiast ulegać awarii lub błędnie zgłaszać konto jako nieskonfigurowane.

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

Każdy wpis staje się pluginem. Jeśli pack zawiera wiele rozszerzeń, id pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu po rozpoznaniu symlinków. Wpisy wychodzące poza katalog pakietu są odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginów przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności dev w runtime). Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów wymagających buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko-konfiguracyjny.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główny punkt wejścia pluginu podłącza także narzędzia, hooki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do używania tej samej ścieżki `setupEntry` podczas fazy uruchamiania gateway przed nasłuchem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startową, która musi istnieć
przed rozpoczęciem nasłuchiwania przez gateway. W praktyce oznacza to, że punkt setup musi rejestrować każdą zdolność należącą do kanału, od której zależy start, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie czasowym

Jeśli pełny punkt wejścia nadal odpowiada za jakąkolwiek wymaganą zdolność startową, nie włączaj
tej flagi. Pozostaw plugin przy domyślnym zachowaniu i pozwól OpenClaw załadować
pełny punkt wejścia podczas startu.

Bundlowane kanały mogą również publikować helpery powierzchni kontraktowej tylko do konfiguracji, z których rdzeń może korzystać zanim pełny runtime kanału zostanie załadowany. Obecna powierzchnia promocji setup to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń korzysta z tej powierzchni, gdy musi promować starszą konfigurację kanału z jednym kontem do
`channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu.
Matrix jest obecnym bundlowanym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery poprawek setup utrzymują leniwe wykrywanie powierzchni kontraktowej bundli. Czas importu pozostaje lekki; powierzchnia promocji jest ładowana tylko przy pierwszym użyciu zamiast ponownie uruchamiać start bundlowanego kanału podczas importu modułu.

Gdy te powierzchnie startowe obejmują metody gateway RPC, utrzymuj je na
prefiksie specyficznym dla pluginu. Przestrzenie nazw administratora rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do `operator.admin`, nawet jeśli plugin żąda węższego zakresu.

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

Pluginy kanałów mogą reklamować metadane konfiguracji/wykrywania przez `openclaw.channel` oraz
wskazówki instalacji przez `openclaw.install`. Dzięki temu dane katalogu nie są wpisane w rdzeniu.

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

- `detailLabel`: etykieta wtórna dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisanie tekstu linku do dokumentacji
- `preferOver`: id pluginów/kanałów o niższym priorytecie, które ten wpis katalogowy powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki treści powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący markdown dla decyzji o formatowaniu outbound
- `showConfigured`: ukrywa kanał na powierzchniach listy skonfigurowanych kanałów, gdy ustawione na `false`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu quickstart `allowFrom`
- `forceAccountBinding`: wymaga jawnego wiązania konta, nawet gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów ogłoszeń

OpenClaw może również scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM).
Umieść plik JSON w jednym z miejsc:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (oddzielanych przecinkami/średnikami/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje też `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu odpowiadają za orkiestrację kontekstu sesji dla ingest, składania
i kompakcji. Rejestruj je ze swojego pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy plugin musi zastąpić lub rozszerzyć domyślny pipeline kontekstu,
a nie tylko dodać wyszukiwanie memory lub hooki.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jeśli Twój silnik **nie** odpowiada za algorytm kompakcji, zachowaj implementację `compact()` i deleguj ją jawnie:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Dodawanie nowej możliwości

Gdy plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu pluginów prywatnym reach-in. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, za jakie współdzielone zachowanie ma odpowiadać rdzeń: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę skierowaną do kanałów oraz kształt helperów runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów w rdzeniu oraz kanałach/funkcjach
   Kanały i pluginy funkcji powinny konsumować nową możliwość przez rdzeń,
   a nie bezpośrednio importować implementację dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują wtedy swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji pozostawały z czasem jawne.

W ten sposób OpenClaw zachowuje swoją opiniotwórczość bez twardego związania z
wizją jednego dostawcy. Konkretną listę plików i przykład znajdziesz w [Capability Cookbook](/tools/capability-cookbook).

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna dotknąć wspólnie tych
powierzchni:

- typów kontraktów rdzenia w `src/<capability>/types.ts`
- runnera/helpera runtime rdzenia w `src/<capability>/runtime.ts`
- powierzchni rejestracji API pluginu w `src/plugins/types.ts`
- podłączenia rejestru pluginów w `src/plugins/registry.ts`
- udostępnienia runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą to konsumować
- helperów przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercji własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacji operatora/pluginów w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że możliwość nie jest jeszcze
w pełni zintegrowana.

### Szablon możliwości

Minimalny wzorzec:

```ts
// kontrakt rdzenia
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API pluginu
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// współdzielony helper runtime dla pluginów funkcji/kanałów
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

- rdzeń odpowiada za kontrakt możliwości + orkiestrację
- pluginy dostawców odpowiadają za implementacje dostawcy
- pluginy funkcji/kanałów konsumują helpery runtime
- testy kontraktów utrzymują własność w sposób jawny
