---
read_when:
    - Budowanie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości Plugin lub granic własności
    - Praca nad potokiem ładowania Plugin lub rejestrem
    - Implementowanie haków środowiska uruchomieniowego dostawcy lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wewnętrzne mechanizmy Plugin: model możliwości, własność, kontrakty, potok ładowania i pomocniki środowiska uruchomieniowego'
title: Wewnętrzne mechanizmy Plugin
x-i18n:
    generated_at: "2026-04-30T10:05:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

To jest **szczegółowa referencja architektury** systemu Pluginów OpenClaw. Praktyczne przewodniki znajdziesz na jednej z poniższych stron tematycznych.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie pluginów" icon="plug" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący dodawania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Tworzenie pluginów" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek pierwszego pluginu z najmniejszym działającym manifestem.
  </Card>
  <Card title="Pluginy kanałów" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału komunikacyjnego.
  </Card>
  <Card title="Pluginy dostawców" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin dostawcy modelu.
  </Card>
  <Card title="Omówienie SDK" icon="book" href="/pl/plugins/sdk-overview">
    Referencja mapy importów i API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości są publicznym modelem **natywnych pluginów** w OpenClaw. Każdy natywny Plugin OpenClaw rejestruje się względem jednego lub wielu typów możliwości:

| Możliwość              | Metoda rejestracji                              | Przykładowe pluginy                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Wnioskowanie tekstowe  | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Mowa                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`     | `openai`                             |
| Rozumienie multimediów | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanał / wiadomości     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Wykrywanie Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia, usługi wykrywania lub usługi działające w tle, jest **starszym pluginem wyłącznie hookowym**. Ten wzorzec nadal jest w pełni obsługiwany.
</Note>

### Stanowisko dotyczące zgodności zewnętrznej

Model możliwości znajduje się w rdzeniu i jest obecnie używany przez dołączone/natywne pluginy, ale zgodność zewnętrznych pluginów nadal wymaga wyższego progu niż „jest eksportowane, więc jest zamrożone”.

| Sytuacja pluginu                                  | Wskazówki                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Istniejące zewnętrzne pluginy                     | Utrzymuj działanie integracji opartych na hookach; to jest bazowy poziom zgodności.              |
| Nowe dołączone/natywne pluginy                    | Preferuj jawną rejestrację możliwości zamiast sięgania do elementów specyficznych dla dostawcy lub nowych projektów wyłącznie hookowych. |
| Zewnętrzne pluginy wdrażające rejestrację możliwości | Dozwolone, ale traktuj powierzchnie pomocnicze specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości jest docelowym kierunkiem. Starsze hooki pozostają najbezpieczniejszą ścieżką bez regresji dla zewnętrznych pluginów podczas przejścia. Eksportowane podścieżki pomocnicze nie są równoważne — preferuj wąskie, udokumentowane kontrakty zamiast przypadkowych eksportów pomocniczych.

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany Plugin do kształtu na podstawie jego faktycznego zachowania rejestracyjnego, a nie tylko statycznych metadanych:

<AccordionGroup>
  <Accordion title="plain-capability">
    Rejestruje dokładnie jeden typ możliwości (na przykład Plugin wyłącznie dostawcy, taki jak `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Rejestruje wiele typów możliwości (na przykład `openai` obejmuje wnioskowanie tekstowe, mowę, rozumienie multimediów i generowanie obrazów).
  </Accordion>
  <Accordion title="hook-only">
    Rejestruje tylko hooki (typowane lub niestandardowe), bez możliwości, narzędzi, poleceń ani usług.
  </Accordion>
  <Accordion title="non-capability">
    Rejestruje narzędzia, polecenia, usługi lub trasy, ale bez możliwości.
  </Accordion>
</AccordionGroup>

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i podział jego możliwości. Szczegóły znajdziesz w [referencji CLI](/pl/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla pluginów wyłącznie hookowych. Starsze, rzeczywiste pluginy nadal od niego zależą.

Kierunek:

- utrzymać jego działanie
- udokumentować go jako starszy mechanizm
- preferować `before_model_resolve` do pracy nad nadpisaniami modelu/dostawcy
- preferować `before_prompt_build` do pracy nad modyfikacją promptu
- usuwać dopiero po spadku rzeczywistego użycia i gdy pokrycie fiksturami potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchomisz `openclaw doctor` lub `openclaw plugins inspect <id>`, możesz zobaczyć jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja parsuje się poprawnie, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, który jest przestarzały    |
| **hard error**             | Konfiguracja jest nieprawidłowa albo nie udało się załadować pluginu |

Ani `hook-only`, ani `before_agent_start` nie uszkodzą dziś Twojego pluginu: `hook-only` ma charakter informacyjny, a `before_agent_start` wywołuje tylko ostrzeżenie. Te sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Omówienie architektury

System pluginów OpenClaw ma cztery warstwy:

<Steps>
  <Step title="Manifest + wykrywanie">
    OpenClaw znajduje kandydackie pluginy ze skonfigurowanych ścieżek, katalogów głównych workspace, globalnych katalogów głównych pluginów i dołączonych pluginów. Wykrywanie najpierw odczytuje natywne manifesty `openclaw.plugin.json` oraz obsługiwane manifesty pakietów.
  </Step>
  <Step title="Włączanie + walidacja">
    Rdzeń decyduje, czy wykryty Plugin jest włączony, wyłączony, zablokowany albo wybrany do wyłącznego slotu, takiego jak pamięć.
  </Step>
  <Step title="Ładowanie środowiska uruchomieniowego">
    Natywne pluginy OpenClaw są ładowane w procesie przez jiti i rejestrują możliwości w centralnym rejestrze. Zgodne pakiety są normalizowane do rekordów rejestru bez importowania kodu środowiska uruchomieniowego.
  </Step>
  <Step title="Korzystanie z powierzchni">
    Pozostała część OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację dostawców, hooki, trasy HTTP, polecenia CLI i usługi.
  </Step>
</Steps>

W przypadku CLI pluginów wykrywanie poleceń głównych jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI pluginu może pozostać leniwy i rejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw nadal może zarezerwować nazwy poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- walidacja manifestu/konfiguracji powinna działać na podstawie **metadanych manifestu/schematu** bez wykonywania kodu pluginu
- natywne wykrywanie możliwości może ładować kod wejściowy zaufanego pluginu, aby zbudować nieaktywującą migawkę rejestru
- natywne zachowanie środowiska uruchomieniowego pochodzi ze ścieżki `register(api)` modułu pluginu z `api.registrationMode === "full"`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy oraz budować wskazówki UI/schematu przed aktywacją pełnego środowiska uruchomieniowego.

### Migawka metadanych pluginów i tabela wyszukiwania

Podczas uruchamiania Gateway budowana jest jedna `PluginMetadataSnapshot` dla bieżącej migawki konfiguracji. Migawka zawiera wyłącznie metadane: przechowuje indeks zainstalowanych pluginów, rejestr manifestów, diagnostykę manifestów, mapy właścicieli, normalizator identyfikatorów pluginów i rekordy manifestów. Nie przechowuje załadowanych modułów pluginów, SDK dostawców, zawartości pakietów ani eksportów środowiska uruchomieniowego.

Walidacja konfiguracji świadoma pluginów, automatyczne włączanie przy starcie i bootstrap pluginów Gateway korzystają z tej migawki zamiast niezależnie odbudowywać metadane manifestu/indeksu. `PluginLookUpTable` jest wyprowadzana z tej samej migawki i dodaje plan pluginów startowych dla bieżącej konfiguracji środowiska uruchomieniowego.

Po uruchomieniu Gateway utrzymuje bieżącą migawkę metadanych jako wymienny produkt środowiska uruchomieniowego. Powtarzane wykrywanie dostawców w środowisku uruchomieniowym może pożyczać tę migawkę zamiast rekonstruować zainstalowany indeks i rejestr manifestów dla każdego przebiegu katalogu dostawców. Migawka jest czyszczona lub zastępowana przy zamykaniu Gateway, zmianach konfiguracji/inwentarza pluginów oraz zapisach zainstalowanego indeksu; wywołujący wracają do zimnej ścieżki manifestu/indeksu, gdy nie istnieje zgodna bieżąca migawka. Kontrole zgodności muszą uwzględniać katalogi główne wykrywania pluginów, takie jak `plugins.load.paths`, oraz domyślny workspace agenta, ponieważ pluginy workspace są częścią zakresu metadanych.

Migawka i tabela wyszukiwania utrzymują powtarzane decyzje startowe na szybkiej ścieżce:

- własność kanałów
- odroczone uruchamianie kanałów
- identyfikatory pluginów startowych
- własność dostawców i backendów CLI
- własność dostawcy konfiguracji, aliasu polecenia, dostawcy katalogu modeli i kontraktu manifestu
- walidacja schematu konfiguracji pluginu i schematu konfiguracji kanału
- decyzje automatycznego włączania przy starcie

Granicą bezpieczeństwa jest zastępowanie migawki, a nie mutacja. Odbuduj migawkę, gdy zmienia się konfiguracja, inwentarz pluginów, rekordy instalacji albo utrwalona polityka indeksu. Nie traktuj jej jako szerokiego, mutowalnego globalnego rejestru i nie przechowuj nieograniczonej historii migawek. Ładowanie pluginów środowiska uruchomieniowego pozostaje oddzielone od migawek metadanych, aby przestarzały stan środowiska uruchomieniowego nie mógł zostać ukryty za pamięcią podręczną metadanych.

Reguła pamięci podręcznej jest udokumentowana w [wewnętrznej architekturze pluginów](/pl/plugins/architecture-internals#plugin-cache-boundary): metadane manifestu i wykrywania są świeże, chyba że wywołujący posiada jawną migawkę, tabelę wyszukiwania lub rejestr manifestów dla bieżącego przepływu. Ukryte pamięci podręczne metadanych i TTL oparte na zegarze ściennym nie są częścią ładowania pluginów. Tylko pamięci podręczne loadera środowiska uruchomieniowego, modułów i artefaktów zależności mogą utrzymywać się po faktycznym załadowaniu kodu lub zainstalowanych artefaktów.

Niektórzy wywołujący na zimnej ścieżce nadal rekonstruują rejestry manifestów bezpośrednio z utrwalonego indeksu zainstalowanych pluginów zamiast otrzymywać `PluginLookUpTable` Gateway. Ta ścieżka teraz rekonstruuje rejestr na żądanie; preferuj przekazywanie bieżącej tabeli wyszukiwania albo jawnego rejestru manifestów przez przepływy środowiska uruchomieniowego, gdy wywołujący już taki posiada.

### Planowanie aktywacji

Planowanie aktywacji jest częścią płaszczyzny sterowania. Wywołujący mogą zapytać, które pluginy są istotne dla konkretnego polecenia, dostawcy, kanału, trasy, uprzęży agenta lub możliwości, zanim załadują szersze rejestry środowiska uruchomieniowego.

Planer utrzymuje zgodność z obecnym zachowaniem manifestu:

- pola `activation.*` są jawnymi wskazówkami planera
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki pozostają awaryjnym źródłem własności z manifestu
- API planera tylko z identyfikatorami pozostaje dostępne dla istniejących wywołujących
- API planu raportuje etykiety powodów, aby diagnostyka mogła odróżnić jawne wskazówki od awaryjnego ustalania własności

<Warning>
Nie traktuj `activation` jako hooka cyklu życia ani zamiennika dla `register(...)`. To metadane używane do zawężania ładowania. Preferuj pola własności, gdy już opisują relację; używaj `activation` tylko do dodatkowych wskazówek dla planera.
</Warning>

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia do wysyłania/edycji/reagowania dla zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core, a pluginy kanałów odpowiadają za specyficzne dla kanału wykrywanie i wykonywanie za nim.

Obecna granica wygląda tak:

- core odpowiada za host współdzielonego narzędzia `message`, podłączenie promptu, księgowanie sesji/wątków oraz dispatch wykonywania
- pluginy kanałów odpowiadają za wykrywanie akcji w zakresie, wykrywanie możliwości oraz wszelkie fragmenty schematu specyficzne dla kanału
- pluginy kanałów odpowiadają za specyficzną dla providera gramatykę konwersacji sesji, na przykład sposób, w jaki identyfikatory konwersacji kodują identyfikatory wątków albo dziedziczą z konwersacji nadrzędnych
- pluginy kanałów wykonują końcową akcję przez swój adapter akcji

Dla pluginów kanałów powierzchnią SDK jest `ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania pozwala pluginowi zwrócić widoczne akcje, możliwości i wkłady do schematu razem, aby te elementy się nie rozjeżdżały.

Gdy specyficzny dla kanału parametr narzędzia wiadomości przenosi źródło mediów, takie jak ścieżka lokalna albo zdalny URL mediów, plugin powinien też zwrócić `mediaSourceParams` z `describeMessageTool(...)`. Core używa tej jawnej listy do stosowania normalizacji ścieżek sandboxa oraz wskazówek dostępu do mediów wychodzących bez hardkodowania nazw parametrów należących do pluginu. Preferuj tam mapy o zakresie akcji, a nie jedną płaską listę dla całego kanału, aby parametr mediów tylko dla profilu nie był normalizowany przy niepowiązanych akcjach, takich jak `send`.

Core przekazuje zakres runtime do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać albo eksponować akcje wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości albo zaufanej tożsamości żądającego, bez hardkodowania gałęzi specyficznych dla kanału w core narzędzia `message`.

Dlatego zmiany routingu embedded-runnera nadal są pracą pluginu: runner odpowiada za przekazanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, aby współdzielone narzędzie `message` eksponowało właściwą, należącą do kanału powierzchnię dla bieżącej tury.

W przypadku należących do kanału helperów wykonywania, dołączone pluginy powinny utrzymywać runtime wykonywania wewnątrz własnych modułów rozszerzeń. Core nie odpowiada już za runtime'y akcji wiadomości Discord, Slack, Telegram ani WhatsApp pod `src/agents/tools`. Nie publikujemy osobnych subścieżek `plugin-sdk/*-action-runtime`, a dołączone pluginy powinny importować własny lokalny kod runtime bezpośrednio ze swoich modułów należących do rozszerzenia.

Ta sama granica dotyczy ogólnie nazwanych od providera szwów SDK: core nie powinien importować specyficznych dla kanału wygodnych barreli dla Slack, Discord, Signal, WhatsApp ani podobnych rozszerzeń. Jeśli core potrzebuje jakiegoś zachowania, powinien albo korzystać z własnego barrela `api.ts` / `runtime-api.ts` dołączonego pluginu, albo podnieść tę potrzebę do wąskiej, generycznej możliwości we współdzielonym SDK.

Dołączone pluginy stosują tę samą zasadę. `runtime-api.ts` dołączonego pluginu nie powinien reeksportować własnej brandowanej fasady `openclaw/plugin-sdk/<plugin-id>`. Te brandowane fasady pozostają shimami kompatybilności dla zewnętrznych pluginów i starszych konsumentów, ale dołączone pluginy powinny używać lokalnych eksportów oraz wąskich generycznych subścieżek SDK, takich jak `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` albo `openclaw/plugin-sdk/webhook-ingress`. Nowy kod nie powinien dodawać specyficznych dla identyfikatora pluginu fasad SDK, chyba że wymaga tego granica kompatybilności dla istniejącego zewnętrznego ekosystemu.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonywania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego modelu ankiety
- `actions.handleAction("poll")` to preferowana ścieżka dla specyficznej dla kanału semantyki ankiet albo dodatkowych parametrów ankiety

Core odracza teraz współdzielone parsowanie ankiety do momentu, gdy dispatch ankiety pluginu odrzuci akcję, więc należące do pluginu handlery ankiet mogą akceptować specyficzne dla kanału pola ankiet bez wcześniejszego zablokowania przez generyczny parser ankiet.

Pełną sekwencję startową znajdziesz w [Wewnętrznych szczegółach architektury Plugin](/pl/plugins/architecture-internals).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** albo **funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- plugin firmy zwykle powinien posiadać wszystkie powierzchnie tej firmy skierowane do OpenClaw
- plugin funkcji zwykle powinien posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny konsumować współdzielone możliwości core zamiast doraźnie reimplementować zachowanie providerów

<AccordionGroup>
  <Accordion title="Vendor z wieloma możliwościami">
    `openai` posiada inferencję tekstu, mowę, głos realtime, rozumienie mediów i generowanie obrazów. `google` posiada inferencję tekstu oraz rozumienie mediów, generowanie obrazów i wyszukiwanie w sieci. `qwen` posiada inferencję tekstu oraz rozumienie mediów i generowanie wideo.
  </Accordion>
  <Accordion title="Vendor z jedną możliwością">
    `elevenlabs` i `microsoft` posiadają mowę; `firecrawl` posiada pobieranie z sieci; `minimax` / `mistral` / `moonshot` / `zai` posiadają backendy rozumienia mediów.
  </Accordion>
  <Accordion title="Plugin funkcji">
    `voice-call` posiada transport połączeń, narzędzia, CLI, trasy i mostkowanie strumieni mediów Twilio, ale konsumuje współdzielone możliwości mowy, transkrypcji realtime oraz głosu realtime zamiast importować pluginy vendorów bezpośrednio.
  </Accordion>
</AccordionGroup>

Docelowy stan to:

- OpenAI żyje w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i przyszłe wideo
- inny vendor może zrobić to samo dla własnego obszaru powierzchni
- kanały nie interesują się tym, który plugin vendora posiada providera; konsumują współdzielony kontrakt możliwości eksponowany przez core

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **możliwość** = kontrakt core, który wiele pluginów może implementować albo konsumować

Jeśli więc OpenClaw dodaje nową domenę, taką jak wideo, pierwsze pytanie nie brzmi: „który provider powinien hardkodować obsługę wideo?”. Pierwsze pytanie brzmi: „jaki jest kontrakt możliwości wideo w core?”. Gdy ten kontrakt istnieje, pluginy vendorów mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą go konsumować.

Jeśli możliwość jeszcze nie istnieje, właściwy krok to zwykle:

<Steps>
  <Step title="Zdefiniuj możliwość">
    Zdefiniuj brakującą możliwość w core.
  </Step>
  <Step title="Wyeksponuj przez SDK">
    Wyeksponuj ją przez API/runtime pluginu w typowany sposób.
  </Step>
  <Step title="Podłącz konsumentów">
    Podłącz kanały/funkcje do tej możliwości.
  </Step>
  <Step title="Implementacje vendorów">
    Pozwól pluginom vendorów rejestrować implementacje.
  </Step>
</Steps>

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania core zależnego od jednego vendora albo jednorazowej, specyficznej dla pluginu ścieżki kodu.

### Warstwowanie możliwości

Użyj tego modelu mentalnego, gdy decydujesz, gdzie należy kod:

<Tabs>
  <Tab title="Warstwa możliwości core">
    Współdzielona orkiestracja, polityka, fallback, reguły scalania konfiguracji, semantyka dostarczania i typowane kontrakty.
  </Tab>
  <Tab title="Warstwa pluginu vendora">
    Specyficzne dla vendora API, auth, katalogi modeli, synteza mowy, generowanie obrazów, przyszłe backendy wideo, endpointy użycia.
  </Tab>
  <Tab title="Warstwa pluginu kanału/funkcji">
    Integracja Slack/Discord/voice-call/itp., która konsumuje możliwości core i prezentuje je na powierzchni.
  </Tab>
</Tabs>

Na przykład TTS ma taki kształt:

- core posiada politykę TTS w czasie odpowiedzi, kolejność fallbacków, preferencje i dostarczanie kanałowe
- `openai`, `elevenlabs` i `microsoft` posiadają implementacje syntezy
- `voice-call` konsumuje helper runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład pluginu firmy z wieloma możliwościami

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone kontrakty dla modeli, mowy, transkrypcji realtime, głosu realtime, rozumienia mediów, generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci, vendor może posiadać wszystkie swoje powierzchnie w jednym miejscu:

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

Nie liczą się dokładne nazwy helperów. Liczy się kształt:

- jeden plugin posiada powierzchnię vendora
- core nadal posiada kontrakty możliwości
- kanały i pluginy funkcji konsumują helpery `api.runtime.*`, a nie kod vendora
- testy kontraktowe mogą asercyjnie sprawdzać, że plugin zarejestrował możliwości, które deklaruje jako własne

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną możliwość. Ten sam model własności obowiązuje tutaj:

<Steps>
  <Step title="Core definiuje kontrakt">
    Core definiuje kontrakt rozumienia mediów.
  </Step>
  <Step title="Pluginy vendorów rejestrują">
    Pluginy vendorów rejestrują `describeImage`, `transcribeAudio` i `describeVideo`, gdy ma to zastosowanie.
  </Step>
  <Step title="Konsumenci używają współdzielonego zachowania">
    Kanały i pluginy funkcji konsumują współdzielone zachowanie core zamiast podłączać się bezpośrednio do kodu vendora.
  </Step>
</Steps>

To pozwala uniknąć wbudowywania założeń jednego providera dotyczących wideo w core. Plugin posiada powierzchnię vendora; core posiada kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: core posiada typowany kontrakt możliwości i helper runtime, a pluginy vendorów rejestrują względem niego implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz [Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginu jest celowo typowana i scentralizowana w `OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz helpery runtime, na których plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy pluginów otrzymują jeden stabilny standard wewnętrzny
- core może odrzucać zduplikowaną własność, na przykład dwa pluginy rejestrujące ten sam identyfikator providera
- start może ujawniać użyteczne diagnostyki dla nieprawidłowo sformowanej rejestracji
- testy kontraktowe mogą egzekwować własność dołączonych pluginów i zapobiegać cichemu rozjazdowi

Istnieją dwie warstwy egzekwowania:

<AccordionGroup>
  <Accordion title="Wymuszanie rejestracji w czasie działania">
    Rejestr pluginów weryfikuje rejestracje podczas ładowania pluginów. Przykłady: zduplikowane identyfikatory providerów, zduplikowane identyfikatory providerów mowy oraz nieprawidłowo sformowane rejestracje generują diagnostykę pluginów zamiast niezdefiniowanego zachowania.
  </Accordion>
  <Accordion title="Testy kontraktowe">
    Dołączone pluginy są przechwytywane w rejestrach kontraktowych podczas uruchomień testów, aby OpenClaw mógł jawnie potwierdzać własność. Obecnie jest to używane dla providerów modeli, providerów mowy, providerów wyszukiwania w sieci oraz własności dołączonych rejestracji.
  </Accordion>
</AccordionGroup>

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin jest właścicielem której powierzchni. Dzięki temu core i kanały mogą komponować się płynnie, ponieważ własność jest deklarowana, typowana i testowalna, a nie domniemana.

### Co należy do kontraktu

<Tabs>
  <Tab title="Dobre kontrakty">
    - typowane
    - małe
    - specyficzne dla capability
    - należące do core
    - wielokrotnego użytku przez wiele pluginów
    - możliwe do użycia przez kanały/funkcje bez wiedzy o vendorze

  </Tab>
  <Tab title="Złe kontrakty">
    - polityka specyficzna dla vendora ukryta w core
    - jednorazowe obejścia pluginów, które omijają rejestr
    - kod kanału sięgający bezpośrednio do implementacji vendora
    - doraźne obiekty czasu działania, które nie są częścią `OpenClawPluginApi` ani `api.runtime`

  </Tab>
</Tabs>

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj capability, a następnie pozwól pluginom się do niej podłączyć.

## Model wykonywania

Natywne pluginy OpenClaw działają **w procesie** razem z Gateway. Nie są sandboxowane. Załadowany natywny plugin ma taką samą granicę zaufania na poziomie procesu jak kod core.

<Warning>
Implikacje natywnych pluginów: plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi; błąd pluginu może spowodować awarię lub destabilizację gatewaya; a złośliwy natywny plugin jest równoważny wykonaniu dowolnego kodu wewnątrz procesu OpenClaw.
</Warning>

Kompatybilne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie dołączone Skills.

Używaj list dozwolonych oraz jawnych ścieżek instalacji/ładowania dla pluginów niedołączonych. Traktuj pluginy workspace jako kod używany w czasie programowania, a nie domyślne ustawienia produkcyjne.

W przypadku nazw dołączonych pakietów workspace utrzymuj identyfikator pluginu zakotwiczony w nazwie npm: domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks, taki jak `-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy pakiet celowo udostępnia węższą rolę pluginu.

<Note>
**Uwaga o zaufaniu:** `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła. Plugin workspace z takim samym identyfikatorem jak dołączony plugin celowo przesłania dołączoną kopię, gdy ten plugin workspace jest włączony/umieszczony na liście dozwolonych. Jest to normalne i przydatne przy lokalnym programowaniu, testowaniu poprawek oraz hotfixach. Zaufanie do dołączonego pluginu jest rozstrzygane na podstawie migawki źródła — manifestu i kodu na dysku w chwili ładowania — a nie na podstawie metadanych instalacji. Uszkodzony lub podmieniony rekord instalacji nie może po cichu poszerzyć powierzchni zaufania dołączonego pluginu poza to, co deklaruje rzeczywiste źródło.
</Note>

## Granica eksportu

OpenClaw eksportuje capabilities, a nie wygodę implementacyjną.

Utrzymuj rejestrację capability jako publiczną. Przytnij eksporty helperów niebędących kontraktami:

- ścieżki podrzędne helperów specyficznych dla dołączonych pluginów
- ścieżki podrzędne infrastruktury czasu działania nieprzeznaczone jako publiczne API
- wygodne helpery specyficzne dla vendora
- helpery konfiguracji/onboardingu, które są szczegółami implementacji

Zarezerwowane ścieżki podrzędne helperów dołączonych pluginów zostały wycofane z wygenerowanej mapy eksportów SDK. Trzymaj helpery specyficzne dla właściciela wewnątrz pakietu pluginu będącego ich właścicielem; promuj wyłącznie zachowanie hosta wielokrotnego użytku do ogólnych kontraktów SDK, takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.

## Elementy wewnętrzne i odniesienie

Informacje o potoku ładowania, modelu rejestru, hookach czasu działania providerów, trasach HTTP Gateway, schematach narzędzi wiadomości, rozpoznawaniu celów kanałów, katalogach providerów, pluginach silnika kontekstu oraz przewodniku dodawania nowej capability znajdziesz w [Elementach wewnętrznych architektury pluginów](/pl/plugins/architecture-internals).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Manifest pluginu](/pl/plugins/manifest)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
