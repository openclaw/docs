---
read_when:
    - Budowanie lub debugowanie natywnych Plugin OpenClaw
    - Zrozumienie modelu możliwości Plugin lub granic własności
    - Praca nad potokiem ładowania Plugin lub rejestrem
    - Implementowanie hooków runtime providera lub Plugin kanałów
sidebarTitle: Internals
summary: 'Wnętrze Plugin: model możliwości, własność, kontrakty, potok ładowania i helpery runtime'
title: Wnętrze Plugin
x-i18n:
    generated_at: "2026-04-24T09:22:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

To jest **dogłębna dokumentacja architektury** systemu Plugin OpenClaw. Aby zacząć od praktycznych przewodników, wybierz jedną z poniższych stron.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie Plugin" icon="plug" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący dodawania, włączania i rozwiązywania problemów z Plugin.
  </Card>
  <Card title="Budowanie Plugin" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek pierwszego Plugin z najmniejszym działającym manifestem.
  </Card>
  <Card title="Plugins kanałów" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału wiadomości.
  </Card>
  <Card title="Plugins providerów" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin providera modeli.
  </Card>
  <Card title="Przegląd SDK" icon="book" href="/pl/plugins/sdk-overview">
    Dokumentacja mapy importów i API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości to publiczny model **natywnego Plugin** wewnątrz OpenClaw. Każdy
natywny Plugin OpenClaw rejestruje się względem jednego lub więcej typów możliwości:

| Możliwość             | Metoda rejestracji                             | Przykładowe Plugins                  |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| Wnioskowanie tekstowe | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| Backend CLI wnioskowania | `api.registerCliBackend(...)`               | `openai`, `anthropic`                |
| Mowa                  | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                  |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`  | `openai`                             |
| Rozumienie multimediów | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                   |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki    | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Pobieranie web        | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Wyszukiwanie web      | `api.registerWebSearchProvider(...)`           | `google`                             |
| Kanał / wiadomości    | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |
| Wykrywanie Gateway    | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                            |

Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia, usługi wykrywania
lub usługi w tle, jest **starszym Plugin typu hook-only**. Ten wzorzec
nadal jest w pełni obsługiwany.

### Stanowisko zgodności zewnętrznej

Model możliwości jest wdrożony w core i używany dziś przez dołączone/natywne Plugins,
ale zgodność zewnętrznych Plugin nadal wymaga wyższego progu niż „jest eksportowane, więc jest zamrożone”.

| Sytuacja Plugin                                  | Wskazówki                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Istniejące zewnętrzne Plugins                    | Utrzymuj działanie integracji opartych na hookach; to bazowy poziom zgodności.                 |
| Nowe dołączone/natywne Plugins                   | Preferuj jawną rejestrację możliwości zamiast vendor-specyficznych obejść lub nowych projektów hook-only. |
| Zewnętrzne Plugins przyjmujące rejestrację możliwości | Dozwolone, ale helpery specyficzne dla możliwości traktuj jako ewoluujące, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości jest zamierzonym kierunkiem. Starsze hooki pozostają
najbezpieczniejszą ścieżką bez łamania zgodności dla zewnętrznych Plugin podczas przejścia. Eksportowane ścieżki pomocnicze nie są sobie równe — preferuj wąskie udokumentowane kontrakty zamiast przypadkowych eksportów helperów.

### Kształty Plugin

OpenClaw klasyfikuje każdy załadowany Plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability**: rejestruje dokładnie jeden typ możliwości (na przykład
  Plugin tylko providera, jak `mistral`).
- **hybrid-capability**: rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie multimediów i
  generowanie obrazów).
- **hook-only**: rejestruje tylko hooki (typowane lub niestandardowe), bez
  możliwości, narzędzi, poleceń lub usług.
- **non-capability**: rejestruje narzędzia, polecenia, usługi lub trasy, ale nie
  możliwości.

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin i podział możliwości.
Szczegóły znajdziesz w [Dokumentacja CLI](/pl/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla
Plugin typu hook-only. Starsze rzeczywiste Plugins nadal od niego zależą.

Kierunek:

- utrzymać jego działanie
- udokumentować go jako starszy
- preferować `before_model_resolve` dla pracy nad nadpisywaniem modelu/providera
- preferować `before_prompt_build` dla pracy nad mutacją promptu
- usuwać dopiero, gdy rzeczywiste użycie spadnie, a pokrycie fixture potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchomisz `openclaw doctor` lub `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | Konfiguracja parsuje się poprawnie i Plugins są rozwiązywane  |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe    |
| **hard error**             | Konfiguracja jest nieprawidłowa albo Plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego Plugin:
`hook-only` jest tylko wskazówką, a `before_agent_start` wywołuje jedynie ostrzeżenie. Te
sygnały pojawiają się też w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System Plugin OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydatów na Plugin w skonfigurowanych ścieżkach, katalogach root obszaru roboczego,
   globalnych katalogach root Plugin oraz w dołączonych Plugin. Wykrywanie najpierw odczytuje
   natywne manifesty `openclaw.plugin.json` oraz obsługiwane manifesty pakietów.
2. **Włączanie + walidacja**
   Core decyduje, czy wykryty Plugin jest włączony, wyłączony, zablokowany, czy
   wybrany do wyłącznego slotu, takiego jak memory.
3. **Ładowanie runtime**
   Natywne Plugins OpenClaw są ładowane in-process przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne pakiety są normalizowane do rekordów
   rejestru bez importowania kodu runtime.
4. **Konsumpcja powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację providera,
   hooki, trasy HTTP, polecenia CLI i usługi.

Dla samego Plugin CLI wykrywanie poleceń root jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI Plugin może pozostać leniwy i rejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do Plugin pozostaje wewnątrz Plugin, a OpenClaw
nadal może rezerwować nazwy poleceń root przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu Plugin
- natywne zachowanie runtime pochodzi ze ścieżki `register(api)` modułu Plugin

Taki podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone Plugins i
budować wskazówki UI/schematu zanim pełny runtime będzie aktywny.

### Planowanie aktywacji

Planowanie aktywacji jest częścią control plane. Wywołujący mogą pytać, które Plugins
są istotne dla konkretnego polecenia, providera, kanału, trasy, harness agenta lub
możliwości, zanim załadują szersze rejestry runtime.

Planner zachowuje zgodność z obecnym zachowaniem manifestów:

- pola `activation.*` są jawnymi wskazówkami planera
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` i hooki pozostają awaryjnym wskazaniem własności z manifestu
- API planera zwracające tylko identyfikatory pozostaje dostępne dla istniejących wywołujących
- API planu raportuje etykiety przyczyn, aby diagnostyka mogła odróżniać jawne
  wskazówki od awaryjnej własności

Nie traktuj `activation` jako hooka cyklu życia ani zamiennika dla
`register(...)`. To metadane służące do zawężenia ładowania. Preferuj pola własności,
gdy już opisują relację; używaj `activation` tylko do dodatkowych wskazówek planera.

### Plugins kanałów i współdzielone narzędzie message

Plugins kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych akcji czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core,
a Plugins kanałów zarządzają wykrywaniem i wykonywaniem specyficznym dla kanału pod spodem.

Obecna granica wygląda tak:

- core zarządza hostem współdzielonego narzędzia `message`, okablowaniem promptów, ewidencją sesji/wątków
  i dispatch wykonania
- Plugins kanałów zarządzają wykrywaniem akcji zakresowych, wykrywaniem możliwości oraz wszelkimi
  fragmentami schematów specyficznymi dla kanału
- Plugins kanałów zarządzają gramatyką konwersacji sesji specyficzną dla providera, np.
  tym, jak identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą z konwersacji nadrzędnych
- Plugins kanałów wykonują końcową akcję przez swój adapter akcji

Dla Plugin kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania
pozwala Plugin zwrócić widoczne akcje, możliwości i wkłady w schemat
razem, aby te elementy nie dryfowały względem siebie.

Gdy parametr specyficzny dla kanału w narzędziu message niesie źródło multimediów, takie jak
lokalna ścieżka lub zdalny URL multimediów, Plugin powinien również zwrócić
`mediaSourceParams` z `describeMessageTool(...)`. Core używa tej jawnej listy
do stosowania normalizacji ścieżek sandbox oraz wskazówek dostępu do multimediów wychodzących
bez hardkodowania nazw parametrów należących do Plugin.
Preferuj tam mapy zakresowane do akcji, a nie jedną płaską listę dla całego kanału, tak aby
parametr multimediów dotyczący tylko profilu nie był normalizowany przy niepowiązanych akcjach, takich jak
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

To ma znaczenie dla Plugin zależnych od kontekstu. Kanał może ukrywać lub ujawniać
akcje narzędzia message na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości lub
zaufanej tożsamości nadawcy, bez hardkodowania gałęzi specyficznych dla kanału w głównym narzędziu `message`.

Dlatego zmiany routingu embedded-runner nadal są pracą po stronie Plugin: runner
odpowiada za przekazanie bieżącej tożsamości czatu/sesji do granicy wykrywania Plugin, tak aby współdzielone narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku helperów wykonania należących do kanału, dołączone Plugins powinny utrzymywać runtime wykonania
wewnątrz własnych modułów extension. Core nie zarządza już runtime akcji wiadomości
Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy osobnych ścieżek `plugin-sdk/*-action-runtime`, a dołączone
Plugins powinny importować własny lokalny kod runtime bezpośrednio z modułów należących do ich extension.

Ta sama granica dotyczy ogólnie nazwanych powierzchni SDK providerów: core nie
powinien importować wygodnych beczek specyficznych dla kanału dla Slack, Discord, Signal,
WhatsApp ani podobnych extension. Jeśli core potrzebuje jakiegoś zachowania, powinien albo
zużyć własną beczkę `api.ts` / `runtime-api.ts` dołączonego Plugin, albo promować potrzebę
do wąskiej ogólnej możliwości we współdzielonym SDK.

W szczególności dla ankiet istnieją dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego
  modelu ankiety
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału lub dodatkowych parametrów ankiet

Core teraz odkłada współdzielone parsowanie ankiet do momentu, aż dispatch ankiet Plugin odrzuci
akcję, dzięki czemu handlery ankiet należące do Plugin mogą akceptować pola ankiet
specyficzne dla kanału bez wcześniejszego blokowania przez ogólny parser ankiet.

Pełną sekwencję startową znajdziesz w [Wnętrze architektury Plugin](/pl/plugins/architecture-internals).

## Model własności możliwości

OpenClaw traktuje natywny Plugin jako granicę własności dla **firmy** lub
**funkcji**, a nie jako zbiór niezwiązanych integracji.

Oznacza to, że:

- Plugin firmy powinien zwykle być właścicielem wszystkich powierzchni OpenClaw-facing tej firmy
- Plugin funkcji powinien zwykle być właścicielem pełnej powierzchni funkcji, którą wprowadza
- kanały powinny konsumować współdzielone możliwości core zamiast ad hoc ponownie implementować
  zachowanie providera

<Accordion title="Przykładowe wzorce własności w dołączonych Plugin">
  - **Vendor multi-capability**: `openai` jest właścicielem wnioskowania tekstowego, mowy, głosu realtime,
    rozumienia multimediów i generowania obrazów. `google` jest właścicielem wnioskowania tekstowego
    oraz rozumienia multimediów, generowania obrazów i wyszukiwania web.
    `qwen` jest właścicielem wnioskowania tekstowego oraz rozumienia multimediów i generowania wideo.
  - **Vendor single-capability**: `elevenlabs` i `microsoft` są właścicielami mowy;
    `firecrawl` jest właścicielem web-fetch; `minimax` / `mistral` / `moonshot` / `zai` są właścicielami backendów rozumienia multimediów.
  - **Feature plugin**: `voice-call` jest właścicielem transportu połączeń, narzędzi, CLI, tras
    i mostu strumieni mediów Twilio, ale konsumuje współdzielone możliwości mowy, transkrypcji realtime i głosu realtime zamiast bezpośrednio importować Plugins vendorów.
</Accordion>

Zamierzony stan końcowy jest następujący:

- OpenAI żyje w jednym Plugin, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny vendor może zrobić to samo dla własnej powierzchni
- kanały nie obchodzą się tym, który Plugin vendora jest właścicielem providera; konsumują
  współdzielony kontrakt możliwości ujawniany przez core

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **capability** = kontrakt core, który wiele Plugin może implementować lub konsumować

Jeśli więc OpenClaw dodaje nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który provider powinien hardkodować obsługę wideo?” Pierwsze pytanie brzmi „jaki jest
kontrakt core dla możliwości wideo?” Gdy ten kontrakt istnieje, Plugins vendorów
mogą się względem niego rejestrować, a Plugins kanałów/funkcji mogą go konsumować.

Jeśli możliwości jeszcze nie istnieją, właściwym ruchem jest zwykle:

1. zdefiniować brakującą możliwość w core
2. ujawnić ją przez API/runtime pluginu w sposób typowany
3. podłączyć kanały/funkcje do tej możliwości
4. pozwolić Plugin vendorów rejestrować implementacje

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania core zależnego od
jednego vendora albo jednorazowej ścieżki kodu specyficznej dla Plugin.

### Warstwowanie możliwości

Używaj tego modelu mentalnego przy decydowaniu, gdzie powinien znaleźć się kod:

- **warstwa możliwości core**: współdzielona orkiestracja, polityka, fallback, reguły
  łączenia konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa Plugin vendora**: API specyficzne dla vendora, auth, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, punkty końcowe użycia
- **warstwa Plugin kanału/funkcji**: integracja Slack/Discord/voice-call/itd.,
  która konsumuje możliwości core i prezentuje je na danej powierzchni

Na przykład TTS ma taki kształt:

- core zarządza polityką TTS w czasie odpowiedzi, kolejnością fallback, preferencjami i dostarczaniem kanałowym
- `openai`, `elevenlabs` i `microsoft` są właścicielami implementacji syntezy
- `voice-call` konsumuje helper runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład firmowego Plugin o wielu możliwościach

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji realtime, głosu realtime, rozumienia multimediów,
generowania obrazów, generowania wideo, web fetch i web search, vendor może być właścicielem
wszystkich swoich powierzchni w jednym miejscu:

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

Istotne nie są dokładne nazwy helperów. Istotny jest kształt:

- jeden Plugin jest właścicielem powierzchni vendora
- core nadal jest właścicielem kontraktów możliwości
- kanały i Plugins funkcji konsumują helpery `api.runtime.*`, a nie kod vendora
- testy kontraktowe mogą asertywnie sprawdzać, że Plugin zarejestrował możliwości, które
  deklaruje jako własne

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazu/audio/wideo jako jedną współdzieloną
możliwość. Ten sam model własności ma tu zastosowanie:

1. core definiuje kontrakt rozumienia multimediów
2. Plugins vendorów rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo`, zależnie od zastosowania
3. kanały i Plugins funkcji konsumują współdzielone zachowanie core zamiast
   łączyć się bezpośrednio z kodem vendora

To zapobiega wbudowywaniu założeń o wideo jednego providera w core. Plugin jest właścicielem
powierzchni vendora; core jest właścicielem kontraktu możliwości i zachowania fallback.

Generowanie wideo już używa tej samej sekwencji: core jest właścicielem typowanego
kontraktu możliwości i helpera runtime, a Plugins vendorów rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API Plugin jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz
helpery runtime, na których Plugin może polegać.

Dlaczego to ważne:

- autorzy Plugin otrzymują jeden stabilny standard wewnętrzny
- core może odrzucać zduplikowaną własność, na przykład dwa Plugins rejestrujące ten sam
  identyfikator providera
- start może ujawniać praktyczną diagnostykę dla nieprawidłowej rejestracji
- testy kontraktowe mogą egzekwować własność dołączonych Plugin i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w runtime**
   Rejestr Plugin waliduje rejestracje podczas ładowania Plugin. Przykłady:
   zduplikowane identyfikatory providerów, zduplikowane identyfikatory providerów mowy i nieprawidłowe
   rejestracje tworzą diagnostykę Plugin zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Dołączone Plugins są przechwytywane w rejestrach kontraktów podczas uruchomień testów, dzięki czemu
   OpenClaw może jawnie asertywnie sprawdzać własność. Obecnie dotyczy to modeli
   providerów, providerów mowy, providerów web search oraz własności rejestracji dołączonych Plugin.

Efekt praktyczny jest taki, że OpenClaw z góry wie, który Plugin jest właścicielem której
powierzchni. Dzięki temu core i kanały mogą składać się bezproblemowo, ponieważ własność jest
deklarowana, typowana i testowalna zamiast domyślnej.

### Co należy do kontraktu

Dobre kontrakty Plugin są:

- typowane
- małe
- specyficzne dla możliwości
- należące do core
- możliwe do ponownego użycia przez wiele Plugin
- konsumowalne przez kanały/funkcje bez wiedzy o vendorze

Złe kontrakty Plugin to:

- polityka specyficzna dla vendora ukryta w core
- jednorazowe furtki Plugin omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji vendora
- ad hoc obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem
pozwól Plugin się do niej podłączać.

## Model wykonania

Natywne Plugins OpenClaw działają **in-process** z Gateway. Nie są
sandboxowane. Załadowany natywny Plugin ma tę samą granicę zaufania na poziomie procesu co
kod core.

Implikacje:

- natywny Plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego Plugin może zawiesić lub zdestabilizować gateway
- złośliwy natywny Plugin jest równoważny dowolnemu wykonywaniu kodu wewnątrz
  procesu OpenClaw

Zgodne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie dołączone
Skills.

Dla Plugin niedołączonych używaj allowlist i jawnych ścieżek instalacji/ładowania. Traktuj
Plugins obszaru roboczego jako kod czasu developmentu, a nie domyślne ustawienia produkcyjne.

Dla nazw pakietów dołączonych obszaru roboczego utrzymuj id Plugin zakotwiczone w nazwie npm:
domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo ujawnia węższą rolę Plugin.

Ważna uwaga o zaufaniu:

- `plugins.allow` ufa **identyfikatorom Plugin**, a nie pochodzeniu źródła.
- Plugin obszaru roboczego z tym samym id co dołączony Plugin celowo zasłania
  dołączoną kopię, gdy taki Plugin obszaru roboczego jest włączony/na allowliście.
- Jest to normalne i przydatne w lokalnym developmentcie, testowaniu poprawek i hotfixach.
- Zaufanie dołączonych Plugin jest rozwiązywane z migawki źródła — manifestu i
  kodu na dysku w czasie ładowania — a nie z metadanych instalacji. Uszkodzony
  lub podmieniony rekord instalacji nie może cicho poszerzyć powierzchni zaufania dołączonego Plugin
  poza to, co deklaruje rzeczywiste źródło.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacyjne obejścia.

Zachowuj publiczną rejestrację możliwości. Ogranicz eksporty helperów niebędących kontraktami:

- ścieżki helperów specyficznych dla dołączonych Plugin
- ścieżki okablowania runtime nieprzeznaczone jako publiczne API
- wygodne helpery specyficzne dla vendora
- helpery setup/onboardingu będące szczegółami implementacji

Niektóre ścieżki helperów dołączonych Plugin nadal pozostają w wygenerowanej mapie eksportów SDK
dla zgodności i utrzymania dołączonych Plugin. Obecne przykłady to
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka seamów `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty będące szczegółami implementacji, a nie zalecany wzorzec SDK dla
nowych zewnętrznych Plugin.

## Wnętrza i dokumentacja

Dla potoku ładowania, modelu rejestru, hooków runtime providerów, tras HTTP Gateway,
schematów narzędzia message, rozwiązywania celów kanałów, katalogów providerów,
Plugin silnika kontekstu i przewodnika dodawania nowej możliwości zobacz
[Wnętrze architektury Plugin](/pl/plugins/architecture-internals).

## Powiązane

- [Budowanie Plugin](/pl/plugins/building-plugins)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Manifest Plugin](/pl/plugins/manifest)
