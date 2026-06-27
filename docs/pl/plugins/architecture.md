---
read_when:
    - Tworzenie lub debugowanie natywnych Pluginów OpenClaw
    - Zrozumienie modelu możliwości Plugin lub granic własności
    - Praca nad potokiem ładowania Pluginu lub rejestrem
    - Wdrażanie haków runtime dostawcy lub Pluginów kanałów
sidebarTitle: Internals
summary: 'Elementy wewnętrzne Plugin: model możliwości, własność, kontrakty, potok ładowania i pomocnicze funkcje środowiska uruchomieniowego'
title: Wewnętrzne mechanizmy Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

To jest **szczegółowe odniesienie architektoniczne** dla systemu Plugin OpenClaw. Aby skorzystać z praktycznych przewodników, zacznij od jednej z poniższych stron tematycznych.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie Plugin" icon="plug" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący dodawania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Budowanie pluginów" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek pierwszego Plugin z najmniejszym działającym manifestem.
  </Card>
  <Card title="Pluginy kanałów" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału wiadomości.
  </Card>
  <Card title="Pluginy dostawców" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin dostawcy modeli.
  </Card>
  <Card title="Omówienie SDK" icon="book" href="/pl/plugins/sdk-overview">
    Odniesienie do mapy importów i API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości są publicznym modelem **natywnego Plugin** wewnątrz OpenClaw. Każdy natywny Plugin OpenClaw rejestruje się względem jednego lub większej liczby typów możliwości:

| Możliwość              | Metoda rejestracji                             | Przykładowe pluginy                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencja tekstu      | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferencji CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Osadzenia              | `api.registerEmbeddingProvider(...)`             | Pluginy wektorowe należące do dostawcy |
| Mowa                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Rozumienie mediów      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Źródło transkryptów    | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanał / wiadomości     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Wykrywanie Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin, który rejestruje zero możliwości, ale udostępnia haki, narzędzia, usługi wykrywania lub usługi działające w tle, jest **starszym Plugin tylko z hakami**. Ten wzorzec jest nadal w pełni obsługiwany.
</Note>

### Stanowisko dotyczące zgodności zewnętrznej

Model możliwości jest wdrożony w rdzeniu i używany obecnie przez dołączone/natywne pluginy, ale zgodność zewnętrznych pluginów nadal wymaga wyższego progu niż „jest eksportowane, więc jest zamrożone”.

| Sytuacja Plugin                                    | Wskazówki                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Istniejące zewnętrzne pluginy                     | Utrzymuj działanie integracji opartych na hakach; to jest baza zgodności.                        |
| Nowe dołączone/natywne pluginy                    | Preferuj jawną rejestrację możliwości zamiast sięgania do elementów specyficznych dla dostawcy lub nowych projektów tylko z hakami. |
| Zewnętrzne pluginy przyjmujące rejestrację możliwości | Dozwolone, ale traktuj powierzchnie pomocnicze specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości jest zamierzonym kierunkiem. Starsze haki pozostają najbezpieczniejszą ścieżką bez ryzyka przerwania działania dla zewnętrznych pluginów podczas przejścia. Eksportowane podścieżki pomocnicze nie są sobie równe — preferuj wąskie, udokumentowane kontrakty zamiast przypadkowych eksportów pomocniczych.

### Kształty Plugin

OpenClaw klasyfikuje każdy załadowany Plugin do kształtu na podstawie jego rzeczywistego zachowania rejestracyjnego (nie tylko statycznych metadanych):

<AccordionGroup>
  <Accordion title="plain-capability">
    Rejestruje dokładnie jeden typ możliwości (na przykład Plugin wyłącznie dostawcy, taki jak `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Rejestruje wiele typów możliwości (na przykład `openai` odpowiada za inferencję tekstu, mowę, rozumienie mediów i generowanie obrazów).
  </Accordion>
  <Accordion title="hook-only">
    Rejestruje tylko haki (typowane lub niestandardowe), bez możliwości, narzędzi, poleceń ani usług.
  </Accordion>
  <Accordion title="non-capability">
    Rejestruje narzędzia, polecenia, usługi lub trasy, ale bez możliwości.
  </Accordion>
</AccordionGroup>

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin i rozbicie możliwości. Szczegóły znajdziesz w [odniesieniu CLI](/pl/cli/plugins#inspect).

### Starsze haki

Hak `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla pluginów tylko z hakami. Starsze pluginy używane w praktyce nadal od niego zależą.

Kierunek:

- utrzymać jego działanie
- udokumentować go jako starszy
- preferować `before_model_resolve` do pracy nad nadpisywaniem modelu/dostawcy
- preferować `before_prompt_build` do pracy nad mutacją promptu
- usuwać dopiero po spadku rzeczywistego użycia i gdy pokrycie fiksturami potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchomisz `openclaw doctor` lub `openclaw plugins inspect <id>`, możesz zobaczyć jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja parsuje się poprawnie, a pluginy się rozwiązują |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, który jest przestarzały   |
| **hard error**             | Konfiguracja jest nieprawidłowa albo Plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie przerwą dziś działania Twojego Plugin: `hook-only` jest informacyjne, a `before_agent_start` wywołuje tylko ostrzeżenie. Te sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Omówienie architektury

System Plugin OpenClaw ma cztery warstwy:

<Steps>
  <Step title="Manifest + wykrywanie">
    OpenClaw znajduje kandydackie pluginy ze skonfigurowanych ścieżek, katalogów głównych obszarów roboczych, globalnych katalogów głównych pluginów oraz dołączonych pluginów. Wykrywanie najpierw odczytuje natywne manifesty `openclaw.plugin.json` oraz obsługiwane manifesty pakietów.
  </Step>
  <Step title="Włączanie + walidacja">
    Rdzeń decyduje, czy wykryty Plugin jest włączony, wyłączony, zablokowany albo wybrany dla wyłącznego slotu, takiego jak pamięć.
  </Step>
  <Step title="Ładowanie w czasie działania">
    Natywne pluginy OpenClaw są ładowane w procesie i rejestrują możliwości w centralnym rejestrze. Spakowany JavaScript ładuje się przez natywne `require`; lokalne źródło TypeScript firm trzecich jest awaryjną ścieżką zastępczą Jiti. Zgodne pakiety są normalizowane do rekordów rejestru bez importowania kodu wykonywanego w czasie działania.
  </Step>
  <Step title="Konsumowanie powierzchni">
    Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację dostawców, haki, trasy HTTP, polecenia CLI i usługi.
  </Step>
</Steps>

W przypadku samego CLI Plugin wykrywanie poleceń głównych jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI Plugin może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do Plugin pozostaje wewnątrz Plugin, a OpenClaw nadal może zarezerwować nazwy poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- walidacja manifestu/konfiguracji powinna działać na podstawie **metadanych manifestu/schematu** bez wykonywania kodu Plugin
- natywne wykrywanie możliwości może załadować zaufany kod wejściowy Plugin, aby zbudować nieaktywującą migawkę rejestru
- natywne zachowanie w czasie działania pochodzi ze ścieżki `register(api)` modułu Plugin z `api.registrationMode === "full"`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy oraz budować podpowiedzi UI/schematu, zanim pełne środowisko wykonawcze będzie aktywne.

### Migawka metadanych Plugin i tabela wyszukiwania

Podczas startu Gateway buduje jeden `PluginMetadataSnapshot` dla bieżącej migawki konfiguracji. Migawka zawiera tylko metadane: przechowuje indeks zainstalowanych pluginów, rejestr manifestów, diagnostykę manifestów, mapy właścicieli, normalizator identyfikatorów Plugin oraz rekordy manifestów. Nie przechowuje załadowanych modułów Plugin, SDK dostawców, zawartości pakietów ani eksportów czasu działania.

Walidacja konfiguracji świadoma pluginów, automatyczne włączanie przy starcie oraz bootstrap Plugin Gateway korzystają z tej migawki zamiast niezależnie odbudowywać metadane manifestu/indeksu. `PluginLookUpTable` jest wyprowadzana z tej samej migawki i dodaje plan pluginów startowych dla bieżącej konfiguracji czasu działania.

Po starcie Gateway utrzymuje bieżącą migawkę metadanych jako wymienny produkt czasu działania. Powtarzane wykrywanie dostawców w czasie działania może wypożyczyć tę migawkę zamiast rekonstruować zainstalowany indeks i rejestr manifestów dla każdego przebiegu katalogu dostawców. Migawka jest czyszczona lub zastępowana przy zamknięciu Gateway, zmianach konfiguracji/inwentarza pluginów oraz zapisach zainstalowanego indeksu; wywołujący wracają do zimnej ścieżki manifestu/indeksu, gdy nie istnieje zgodna bieżąca migawka. Kontrole zgodności muszą obejmować katalogi główne wykrywania pluginów, takie jak `plugins.load.paths` i domyślny obszar roboczy agenta, ponieważ pluginy obszaru roboczego są częścią zakresu metadanych.

Migawka i tabela wyszukiwania utrzymują powtarzane decyzje startowe na szybkiej ścieżce:

- własność kanału
- odroczony start kanału
- identyfikatory pluginów startowych
- własność dostawcy i backendu CLI
- własność konfiguracji dostawcy, aliasu polecenia, dostawcy katalogu modeli i kontraktu manifestu
- walidacja schematu konfiguracji Plugin i schematu konfiguracji kanału
- decyzje o automatycznym włączaniu przy starcie

Granicą bezpieczeństwa jest zastąpienie migawki, nie mutacja. Odbuduj migawkę, gdy zmieni się konfiguracja, inwentarz pluginów, rekordy instalacji lub utrwalona polityka indeksu. Nie traktuj jej jako szerokiego, mutowalnego globalnego rejestru i nie przechowuj nieograniczonych historycznych migawek. Ładowanie Plugin w czasie działania pozostaje oddzielone od migawek metadanych, aby przestarzały stan czasu działania nie mógł zostać ukryty za cache metadanych.

Reguła cache jest udokumentowana w [wewnętrznej architekturze Plugin](/pl/plugins/architecture-internals#plugin-cache-boundary): metadane manifestu i wykrywania są świeże, chyba że wywołujący posiada jawną migawkę, tabelę wyszukiwania lub rejestr manifestów dla bieżącego przepływu. Ukryte cache metadanych i TTL oparte na zegarze ściennym nie są częścią ładowania Plugin. Tylko cache loadera czasu działania, modułów i artefaktów zależności mogą utrzymywać się po faktycznym załadowaniu kodu lub zainstalowanych artefaktów.

Niektórzy wywołujący ze ścieżki zimnej nadal rekonstruują rejestry manifestów bezpośrednio z utrwalonego indeksu zainstalowanych pluginów zamiast otrzymywać `PluginLookUpTable` Gateway. Ta ścieżka teraz rekonstruuje rejestr na żądanie; preferuj przekazywanie bieżącej tabeli wyszukiwania lub jawnego rejestru manifestów przez przepływy czasu działania, gdy wywołujący już go ma.

### Planowanie aktywacji

Planowanie aktywacji jest częścią płaszczyzny sterowania. Wywołujący mogą zapytać, które pluginy są istotne dla konkretnego polecenia, dostawcy, kanału, trasy, uprzęży agenta lub możliwości, zanim załadują szersze rejestry czasu działania.

Planer zachowuje zgodność z bieżącym zachowaniem manifestu:

- pola `activation.*` są jawnymi wskazówkami dla planisty
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki pozostają awaryjnym mechanizmem własności z manifestu
- API planisty oparte wyłącznie na identyfikatorach pozostaje dostępne dla istniejących wywołujących
- API planu raportuje etykiety powodów, aby diagnostyka mogła odróżniać jawne wskazówki od awaryjnego mechanizmu własności

<Warning>
Nie traktuj `activation` jako hooka cyklu życia ani zamiennika `register(...)`. To metadane używane do zawężania ładowania. Preferuj pola własności, gdy już opisują relację; używaj `activation` tylko jako dodatkowych wskazówek dla planisty.
</Warning>

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia wysyłania/edycji/reakcji dla zwykłych akcji czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu, a pluginy kanałów odpowiadają za specyficzne dla kanału wykrywanie i wykonywanie za nim.

Obecna granica wygląda tak:

- rdzeń odpowiada za host współdzielonego narzędzia `message`, okablowanie promptów, księgowanie sesji/wątków oraz przekazywanie wykonania
- pluginy kanałów odpowiadają za wykrywanie akcji w zakresie, wykrywanie możliwości i wszystkie specyficzne dla kanału fragmenty schematu
- pluginy kanałów odpowiadają za gramatykę konwersacji sesji specyficzną dla dostawcy, na przykład za to, jak identyfikatory konwersacji kodują identyfikatory wątków albo dziedziczą z konwersacji nadrzędnych
- pluginy kanałów wykonują końcową akcję przez swój adapter akcji

Dla pluginów kanałów powierzchnią SDK jest `ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania pozwala pluginowi zwrócić widoczne akcje, możliwości i wkłady do schematu razem, aby te elementy nie rozjeżdżały się względem siebie.

Gdy specyficzny dla kanału parametr narzędzia wiadomości przenosi źródło multimediów, takie jak lokalna ścieżka albo zdalny URL multimediów, plugin powinien także zwrócić `mediaSourceParams` z `describeMessageTool(...)`. Rdzeń używa tej jawnej listy do stosowania normalizacji ścieżek sandboxa i wskazówek dostępu do multimediów wychodzących bez hardkodowania nazw parametrów należących do pluginu. Preferuj tam mapy ograniczone do akcji, a nie jedną płaską listę dla całego kanału, aby parametr multimediów tylko dla profilu nie był normalizowany przy niepowiązanych akcjach takich jak `send`.

Rdzeń przekazuje zakres runtime do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufany przychodzący `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać akcje wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości albo zaufanej tożsamości żądającego bez hardkodowania specyficznych dla kanału gałęzi w rdzeniowym narzędziu `message`.

Dlatego zmiany routingu osadzonego runnera nadal są pracą pluginu: runner odpowiada za przekazanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, aby współdzielone narzędzie `message` ujawniało właściwą, należącą do kanału powierzchnię dla bieżącej tury.

W przypadku należących do kanału helperów wykonywania pluginy wbudowane powinny utrzymywać runtime wykonywania wewnątrz własnych modułów rozszerzeń. Rdzeń nie jest już właścicielem runtime'ów akcji wiadomości Discord, Slack, Telegram ani WhatsApp pod `src/agents/tools`. Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a pluginy wbudowane powinny importować swój własny lokalny kod runtime bezpośrednio z modułów należących do ich rozszerzeń.

Ta sama granica dotyczy ogólnie nazwanych od dostawcy styków SDK: rdzeń nie powinien importować specyficznych dla kanału wygodnych barrelów dla Slack, Discord, Signal, WhatsApp ani podobnych rozszerzeń. Jeśli rdzeń potrzebuje zachowania, powinien albo użyć własnego barrela `api.ts` / `runtime-api.ts` wbudowanego pluginu, albo promować potrzebę do wąskiej, generycznej możliwości we współdzielonym SDK.

Pluginy wbudowane stosują tę samą regułę. `runtime-api.ts` wbudowanego pluginu nie powinien reeksportować własnej markowej fasady `openclaw/plugin-sdk/<plugin-id>`. Te markowe fasady pozostają shimami zgodności dla zewnętrznych pluginów i starszych konsumentów, ale pluginy wbudowane powinny używać lokalnych eksportów oraz wąskich generycznych podścieżek SDK, takich jak `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` albo `openclaw/plugin-sdk/webhook-ingress`. Nowy kod nie powinien dodawać specyficznych dla identyfikatora pluginu fasad SDK, chyba że wymaga tego granica zgodności dla istniejącego zewnętrznego ekosystemu.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonywania:

- `outbound.sendPoll` to współdzielona podstawa dla kanałów pasujących do wspólnego modelu ankiety
- `actions.handleAction("poll")` to preferowana ścieżka dla specyficznej semantyki ankiet kanału albo dodatkowych parametrów ankiety

Rdzeń odracza teraz współdzielone parsowanie ankiet do momentu, gdy dyspozycja ankiety przez plugin odrzuci akcję, dzięki czemu należące do pluginu handlery ankiet mogą akceptować specyficzne dla kanału pola ankiety bez wcześniejszego blokowania przez generyczny parser ankiet.

Zobacz [Wewnętrzne mechanizmy architektury pluginów](/pl/plugins/architecture-internals), aby poznać pełną sekwencję startową.

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** albo **funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- plugin firmy powinien zwykle posiadać wszystkie powierzchnie tej firmy skierowane do OpenClaw
- plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny używać współdzielonych możliwości rdzenia zamiast ponownie implementować zachowanie dostawcy ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` odpowiada za inferencję tekstu, mowę, głos realtime, rozumienie multimediów i generowanie obrazów. `google` odpowiada za inferencję tekstu oraz rozumienie multimediów, generowanie obrazów i wyszukiwanie w sieci. `qwen` odpowiada za inferencję tekstu oraz rozumienie multimediów i generowanie wideo.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` i `microsoft` odpowiadają za mowę; `firecrawl` odpowiada za web-fetch; `minimax` / `mistral` / `moonshot` / `zai` odpowiadają za backendy rozumienia multimediów.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` odpowiada za transport połączeń, narzędzia, CLI, trasy i mostkowanie strumieni multimediów Twilio, ale używa współdzielonych możliwości mowy, transkrypcji realtime i głosu realtime zamiast importować pluginy dostawców bezpośrednio.
  </Accordion>
</AccordionGroup>

Docelowy stan to:

- OpenAI żyje w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru powierzchni
- kanałów nie obchodzi, który plugin dostawcy posiada dostawcę; używają współdzielonego kontraktu możliwości wystawionego przez rdzeń

To jest kluczowa różnica:

- **plugin** = granica własności
- **możliwość** = kontrakt rdzenia, który wiele pluginów może implementować albo używać

Jeśli więc OpenClaw dodaje nową domenę, taką jak wideo, pierwsze pytanie nie brzmi „który dostawca powinien hardkodować obsługę wideo?”. Pierwsze pytanie brzmi „jaki jest kontrakt rdzenia dla możliwości wideo?”. Gdy ten kontrakt istnieje, pluginy dostawców mogą rejestrować się względem niego, a pluginy kanałów/funkcji mogą go używać.

Jeśli możliwość jeszcze nie istnieje, właściwym krokiem jest zwykle:

<Steps>
  <Step title="Define the capability">
    Zdefiniuj brakującą możliwość w rdzeniu.
  </Step>
  <Step title="Expose through the SDK">
    Wystaw ją przez API/runtime pluginu w typowany sposób.
  </Step>
  <Step title="Wire consumers">
    Podepnij kanały/funkcje do tej możliwości.
  </Step>
  <Step title="Vendor implementations">
    Pozwól pluginom dostawców rejestrować implementacje.
  </Step>
</Steps>

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania rdzenia zależnego od jednego dostawcy albo jednorazowej, specyficznej dla pluginu ścieżki kodu.

### Warstwowanie możliwości

Używaj tego modelu myślowego, decydując, gdzie należy kod:

<Tabs>
  <Tab title="Core capability layer">
    Współdzielona orkiestracja, polityka, fallback, reguły scalania konfiguracji, semantyka dostarczania i typowane kontrakty.
  </Tab>
  <Tab title="Vendor plugin layer">
    Specyficzne dla dostawcy API, uwierzytelnianie, katalogi modeli, synteza mowy, generowanie obrazów, przyszłe backendy wideo, endpointy użycia.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Integracja Slack/Discord/voice-call/itd., która używa możliwości rdzenia i prezentuje je na powierzchni.
  </Tab>
</Tabs>

Na przykład TTS ma taki kształt:

- rdzeń odpowiada za politykę TTS w czasie odpowiedzi, kolejność fallbacków, preferencje i dostarczanie kanałem
- `openai`, `elevenlabs` i `microsoft` odpowiadają za implementacje syntezy
- `voice-call` używa helpera runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład wielomożliwościowego pluginu firmy

Plugin firmy powinien być spójny z zewnątrz. Jeśli OpenClaw ma współdzielone kontrakty dla modeli, mowy, transkrypcji realtime, głosu realtime, rozumienia multimediów, generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci, dostawca może posiadać wszystkie swoje powierzchnie w jednym miejscu:

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

Znaczenie mają nie dokładne nazwy helperów. Liczy się kształt:

- jeden plugin posiada powierzchnię dostawcy
- rdzeń nadal posiada kontrakty możliwości
- kanały i pluginy funkcji używają helperów `api.runtime.*`, a nie kodu dostawcy
- testy kontraktowe mogą potwierdzać, że plugin zarejestrował możliwości, których posiadanie deklaruje

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną możliwość. Ten sam model własności ma zastosowanie także tam:

<Steps>
  <Step title="Core defines the contract">
    Rdzeń definiuje kontrakt rozumienia multimediów.
  </Step>
  <Step title="Vendor plugins register">
    Pluginy dostawców rejestrują `describeImage`, `transcribeAudio` i `describeVideo`, gdy ma to zastosowanie.
  </Step>
  <Step title="Consumers use the shared behavior">
    Kanały i pluginy funkcji używają współdzielonego zachowania rdzenia zamiast podpinać się bezpośrednio do kodu dostawcy.
  </Step>
</Steps>

Pozwala to uniknąć wypalania założeń jednego dostawcy dotyczących wideo w rdzeniu. Plugin posiada powierzchnię dostawcy; rdzeń posiada kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: rdzeń posiada typowany kontrakt możliwości i helper runtime, a pluginy dostawców rejestrują wobec niego implementacje `api.registerVideoGenerationProvider(...)`.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz [Capability Cookbook](/pl/plugins/adding-capabilities).

## Kontrakty i egzekwowanie

Powierzchnia API pluginu jest celowo typowana i scentralizowana w `OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji i helpery runtime, na których plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy pluginów otrzymują jeden stabilny standard wewnętrzny
- rdzeń może odrzucać zduplikowaną własność, na przykład dwa pluginy rejestrujące ten sam identyfikator dostawcy
- startup może pokazywać użyteczną diagnostykę dla nieprawidłowej rejestracji
- testy kontraktowe mogą egzekwować własność wbudowanego pluginu i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

<AccordionGroup>
  <Accordion title="Wymuszanie rejestracji w czasie wykonywania">
    Rejestr pluginów weryfikuje rejestracje podczas ładowania pluginów. Przykłady: zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy oraz nieprawidłowo sformułowane rejestracje generują diagnostykę pluginu zamiast niezdefiniowanego zachowania.
  </Accordion>
  <Accordion title="Testy kontraktowe">
    Dołączone pluginy są ujmowane w rejestrach kontraktów podczas uruchomień testowych, aby OpenClaw mógł jawnie potwierdzać własność. Obecnie jest to używane dla dostawców modeli, dostawców mowy, dostawców wyszukiwania w sieci oraz własności dołączonych rejestracji.
  </Accordion>
</AccordionGroup>

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin jest właścicielem której powierzchni. Dzięki temu rdzeń i kanały mogą płynnie się komponować, ponieważ własność jest deklarowana, typowana i testowalna, a nie domyślna.

### Co należy do kontraktu

<Tabs>
  <Tab title="Dobre kontrakty">
    - typowane
    - małe
    - specyficzne dla możliwości
    - należące do rdzenia
    - wielokrotnego użytku przez wiele pluginów
    - możliwe do użycia przez kanały/funkcje bez wiedzy o dostawcy

  </Tab>
  <Tab title="Złe kontrakty">
    - polityka specyficzna dla dostawcy ukryta w rdzeniu
    - jednorazowe obejścia pluginów, które omijają rejestr
    - kod kanału sięgający bezpośrednio do implementacji dostawcy
    - doraźne obiekty czasu wykonywania, które nie są częścią `OpenClawPluginApi` ani `api.runtime`

  </Tab>
</Tabs>

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a następnie pozwól pluginom się do niej podłączać.

## Model wykonywania

Natywne pluginy OpenClaw działają **w tym samym procesie** co Gateway. Nie są izolowane w piaskownicy. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co kod rdzenia.

<Warning>
Konsekwencje natywnych pluginów: plugin może rejestrować narzędzia, obsługę sieci, haki i usługi; błąd pluginu może zawiesić lub zdestabilizować gateway; a złośliwy natywny plugin jest równoważny wykonaniu dowolnego kodu wewnątrz procesu OpenClaw.
</Warning>

Zgodne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie dołączone Skills.

Używaj list dozwolonych i jawnych ścieżek instalacji/ładowania dla pluginów niedołączonych. Traktuj pluginy z obszaru roboczego jako kod czasu programowania, a nie domyślne ustawienia produkcyjne.

W przypadku dołączonych nazw pakietów obszaru roboczego utrzymuj identyfikator pluginu zakotwiczony w nazwie npm: domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks, taki jak `-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy pakiet celowo udostępnia węższą rolę pluginu.

<Note>
**Uwaga o zaufaniu:** `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła. Plugin obszaru roboczego z tym samym identyfikatorem co dołączony plugin celowo przesłania dołączoną kopię, gdy ten plugin obszaru roboczego jest włączony/dodany do listy dozwolonych. Jest to normalne i przydatne w lokalnym programowaniu, testowaniu poprawek i hotfixach. Zaufanie do dołączonego pluginu jest rozstrzygane na podstawie migawki źródła — manifestu i kodu na dysku w czasie ładowania — a nie metadanych instalacji. Uszkodzony lub podmieniony rekord instalacji nie może po cichu rozszerzyć powierzchni zaufania dołączonego pluginu poza to, co deklaruje rzeczywiste źródło.
</Note>

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodę implementacji.

Utrzymuj rejestrację możliwości jako publiczną. Przycinaj eksporty pomocnicze niebędące kontraktami:

- podścieżki pomocnicze specyficzne dla dołączonych pluginów
- podścieżki infrastruktury czasu wykonywania nieprzeznaczone jako publiczne API
- pomocnicze funkcje wygody specyficzne dla dostawcy
- funkcje pomocnicze konfiguracji/wdrażania, które są szczegółami implementacji

Zarezerwowane podścieżki pomocnicze dołączonych pluginów zostały wycofane z wygenerowanej mapy eksportów SDK. Trzymaj funkcje pomocnicze specyficzne dla właściciela wewnątrz pakietu pluginu będącego właścicielem; promuj tylko zachowania hosta wielokrotnego użytku do ogólnych kontraktów SDK, takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.

## Wnętrze i odniesienie

Informacje o potoku ładowania, modelu rejestru, hakach czasu wykonywania dostawców, trasach HTTP Gateway, schematach narzędzi wiadomości, rozwiązywaniu celów kanałów, katalogach dostawców, pluginach silnika kontekstu oraz przewodniku dodawania nowej możliwości znajdziesz w [Wnętrze architektury pluginów](/pl/plugins/architecture-internals).

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Manifest pluginu](/pl/plugins/manifest)
- [Konfiguracja SDK pluginu](/pl/plugins/sdk-setup)
