---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK wykonać import
    - Potrzebujesz dokumentacji wszystkich metod rejestracji w OpenClawPluginApi
    - Wyszukujesz konkretny eksport SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Omówienie SDK Pluginów
x-i18n:
    generated_at: "2026-07-12T15:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Pluginów jest typowanym kontraktem między pluginami a rdzeniem. Ta strona stanowi
dokumentację referencyjną dotyczącą **tego, co importować** i **co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów korzystających z `openclaw/plugin-sdk/*`
  w OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które mają uruchamiać agentów za pośrednictwem Gateway, należy zamiast tego skorzystać z
  [integracji Gateway dla aplikacji zewnętrznych](/pl/gateway/external-apps).
</Note>

<Tip>
Szukasz przewodnika praktycznego? Zacznij od [Tworzenia pluginów](/pl/plugins/building-plugins). W przypadku kanałów skorzystaj z [Pluginów kanałów](/pl/plugins/sdk-channel-plugins), w przypadku dostawców modeli z [Pluginów dostawców](/pl/plugins/sdk-provider-plugins), w przypadku lokalnych backendów CLI AI z [Pluginów backendów CLI](/pl/plugins/cli-backend-plugins), w przypadku natywnych mechanizmów wykonawczych agentów z [Pluginów środowiska wykonawczego agentów](/pl/plugins/sdk-agent-harness), a w przypadku hooków narzędzi lub cyklu życia z [Hooków pluginów](/pl/plugins/hooks).
</Tip>

## Konwencja importowania

Zawsze importuj z określonej ścieżki podrzędnej:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda ścieżka podrzędna jest małym, samodzielnym modułem. Zapewnia to szybkie uruchamianie
i zapobiega problemom z zależnościami cyklicznymi. W przypadku funkcji pomocniczych punktu wejścia
i kompilacji właściwych dla kanału preferuj `openclaw/plugin-sdk/channel-core`; używaj
`openclaw/plugin-sdk/core` dla szerszej powierzchni zbiorczej i współdzielonych funkcji
pomocniczych, takich jak `buildChannelConfigSchema`.

W przypadku konfiguracji kanału publikuj należący do kanału schemat JSON za pośrednictwem
`openclaw.plugin.json#channelConfigs`. Ścieżka podrzędna
`plugin-sdk/channel-config-schema` służy do współdzielonych elementów bazowych schematów
i ogólnego konstruktora. Do zachowanych schematów wbudowanych kanałów wbudowane pluginy
OpenClaw używają `plugin-sdk/bundled-channel-config-schema`. Przestarzałe eksporty zgodności
pozostają dostępne w `plugin-sdk/channel-config-schema-legacy`; żadna ze ścieżek podrzędnych
schematów wbudowanych nie stanowi wzorca dla nowych pluginów.

<Warning>
  Nie importuj wygodnych interfejsów oznaczonych nazwą dostawcy lub kanału (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Wbudowane pluginy składają ogólne ścieżki podrzędne SDK we własnych modułach zbiorczych
  `api.ts` / `runtime-api.ts`; użytkownicy rdzenia powinni korzystać z tych lokalnych dla
  pluginu modułów zbiorczych albo dodać wąski, ogólny kontrakt SDK, gdy dana potrzeba jest
  rzeczywiście wspólna dla wielu kanałów.

Niewielki zestaw interfejsów pomocniczych wbudowanych pluginów nadal pojawia się w wygenerowanej
mapie eksportów, jeśli ich użycie przez właściciela jest monitorowane. Istnieją one wyłącznie
na potrzeby utrzymania wbudowanych pluginów i nie są zalecanymi ścieżkami importu dla nowych
pluginów zewnętrznych.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są również zachowane
jako przestarzałe fasady zgodności na potrzeby monitorowanego użycia przez właściciela. Nie
kopiuj tych ścieżek importu do nowych pluginów; zamiast tego używaj wstrzykiwanych funkcji
pomocniczych środowiska wykonawczego oraz ogólnych ścieżek podrzędnych SDK kanałów.
</Warning>

## Dokumentacja ścieżek podrzędnych

SDK Pluginów jest udostępniany jako zestaw wąskich ścieżek podrzędnych pogrupowanych według
obszaru (punkt wejścia pluginu, kanał, dostawca, uwierzytelnianie, środowisko wykonawcze,
możliwości, pamięć i zarezerwowane funkcje pomocnicze wbudowanych pluginów). Pełny katalog —
pogrupowany i zawierający odnośniki — znajduje się w sekcji
[Ścieżki podrzędne SDK Pluginów](/pl/plugins/sdk-subpaths).

Wykaz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z publicznego
podzbioru po odjęciu lokalnych dla repozytorium testowych i wewnętrznych ścieżek podrzędnych
wymienionych w `scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Uruchom
`pnpm plugin-sdk:surface`, aby sprawdzić liczbę publicznych eksportów. Przestarzałe publiczne
ścieżki podrzędne, które są dostatecznie stare i nie są używane przez kod produkcyjny
wbudowanych rozszerzeń, są śledzone w
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; szerokie, przestarzałe moduły
zbiorcze ponownego eksportu są śledzone w
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API rejestracji

Funkcja zwrotna `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestrowanie możliwości

| Metoda                                           | Co rejestruje                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)                                                                       |
| `api.registerWorkerProvider(...)`                | Dzierżawy cyklu życia procesów roboczych w chmurze                                                 |
| `api.registerModelCatalogProvider(...)`          | Wiersze katalogu modeli do generowania tekstu i multimediów                                        |
| `api.registerAgentHarness(...)`                  | [Eksperymentalny](/pl/plugins/sdk-agent-harness) natywny mechanizm wykonawczy agenta (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI                                                                  |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                                                                                |
| `api.registerEmbeddingProvider(...)`             | Dostawca osadzeń wektorowych wielokrotnego użytku                                                  |
| `api.registerSpeechProvider(...)`                | Synteza tekstu na mowę / STT                                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym                                                    |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/dźwięku/wideo                                                                       |
| `api.registerTranscriptSourceProvider(...)`      | Źródło transkrypcji spotkań na żywo lub z importu                                                  |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                                                                                 |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                                                                                  |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                                                                                   |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / pozyskiwania danych z sieci                                                  |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                                                                                |
| `api.registerCompactionProvider(...)`            | Wymienny backend Compaction transkrypcji                                                           |

Dostawcy procesów roboczych muszą również zadeklarować swój identyfikator w `contracts.workerProviders`.
Rdzeń utrwala trwały zamiar przed wywołaniem `provision(profile, operationId)`. Dostawcy sprawdzają ustawienia przed przydzieleniem zasobów zewnętrznych i zgłaszają `WorkerProviderError` w przypadku trwałego odrzucenia profilu. Gdy identyfikator operacji się powtarza, `provision` musi przyjąć tę samą dzierżawę.
Rdzeń utrwala sprawdzone ustawienia profilu wraz z dzierżawą i przekazuje tę migawkę do `destroy({ leaseId, profile })`, które musi być idempotentne, oraz `inspect({ leaseId, profile })`, które zwraca `active`, `destroyed` lub `unknown`. Pozwala to dostawcom kierować wywołania cyklu życia po ponownym uruchomieniu Gateway lub usunięciu nazwanego profilu. Punkty końcowe SSH używają `SecretRef` dla `keyRef`, nigdy materiału klucza osadzonego bezpośrednio, oraz zawierają `hostKey` z zaufanych danych wyjściowych aprowizacji dokładnie w postaci `algorithm base64`, bez nazwy hosta ani komentarza. Rdzeń przypina `hostKey` i nigdy nie ufa kluczowi z pierwszego połączenia. Dostawca generujący dynamiczny `keyRef` może zaimplementować `resolveSshIdentity({ leaseId, profile, keyRef })`; jeśli ta funkcja jest dostępna, stanowi źródło rozstrzygające, natomiast dostawcy bez niej korzystają ze skonfigurowanej ogólnej funkcji rozpoznawania sekretów.
Dostawcy z odnawialnymi dzierżawami mogą również zaimplementować `renew(leaseId)`.
`inspect` musi zgłaszać wyjątek w przypadku błędów przejściowych lub nieokreślonych; wartość `unknown` należy zwracać wyłącznie w przypadku autorytatywnie potwierdzonego braku. Rdzeń oznacza aktywny lokalny rekord jako osierocony albo traktuje brak jako zakończenie likwidacji po utrwalonym żądaniu zniszczenia.

Dostawcy osadzeń zarejestrowani za pomocą `api.registerEmbeddingProvider(...)` muszą
być również wymienieni w `contracts.embeddingProviders` w manifeście pluginu. Jest to
ogólny interfejs osadzeń do generowania wektorów wielokrotnego użytku. Wyszukiwanie w pamięci
może korzystać z tego ogólnego interfejsu dostawcy. Starszy interfejs
`api.registerMemoryEmbeddingProvider(...)` i
`contracts.memoryEmbeddingProviders` stanowi przestarzałą warstwę zgodności na czas
migracji istniejących dostawców właściwych dla pamięci.

Dostawcy właściwi dla pamięci, którzy nadal udostępniają w środowisku wykonawczym
`batchEmbed(...)`, pozostają przy istniejącym kontrakcie grupowania osobno dla każdego pliku,
chyba że ich środowisko wykonawcze jawnie ustawi `sourceWideBatchEmbed: true`. Ta opcja pozwala
hostowi pamięci przesyłać fragmenty z wielu zmienionych plików pamięci i włączonych źródeł
w jednym wywołaniu `batchEmbed(...)`, do limitów rozmiaru partii hosta. Adaptery partii, które
przesyłają pliki żądań JSONL, muszą dzielić zadania dostawcy zarówno przed osiągnięciem limitu
rozmiaru przesyłanych danych, jak i limitu liczby żądań. Dostawca musi zwrócić jedno osadzenie
dla każdego fragmentu wejściowego, w tej samej kolejności co `batch.chunks`; pomiń tę flagę,
jeśli dostawca oczekuje partii lokalnych dla pliku lub nie może zachować kolejności danych
wejściowych w większym zadaniu obejmującym całe źródło.

### Narzędzia i polecenia

Używaj [`defineToolPlugin`](/pl/plugins/tool-plugins) w przypadku prostych pluginów zawierających
wyłącznie narzędzia o stałych nazwach. Używaj `api.registerTool(...)` bezpośrednio w przypadku
pluginów mieszanych lub w pełni dynamicznego rejestrowania narzędzi.

| Metoda                                 | Co rejestruje                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Narzędzie agenta (wymagane lub `{ optional: true }`)                                                                                                                  |
| `api.registerCommand(def)`             | Polecenie niestandardowe (pomija LLM)                                                                                                                                |
| `api.registerNodeHostCommand(command)` | Polecenie obsługiwane przez `openclaw node run`; opcjonalne metadane `agentTool` mogą udostępnić je jako narzędzie widoczne dla agenta, gdy Node jest połączony |

Polecenia pluginów mogą ustawiać `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki dotyczącej kierowania. Tekst powinien dotyczyć samego
polecenia; nie dodawaj zasad właściwych dla dostawcy ani pluginu do konstruktorów promptów
rdzenia.

Wpisy wskazówek mogą być starszymi ciągami znaków, które mają zastosowanie do każdej
powierzchni promptu, albo wpisami ustrukturyzowanymi:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Ustrukturyzowane `surfaces` mogą zawierać `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` lub `subagent`. `pi_main` pozostaje przestarzałym aliasem
dla `openclaw_main`. Pomiń `surfaces` w przypadku celowo stosowanych wskazówek dla wszystkich
powierzchni. Nie przekazuj pustej tablicy `surfaces`; zostanie ona odrzucona, aby przypadkowa
utrata zakresu nie spowodowała przekształcenia tekstu w globalny tekst promptu.

Instrukcje deweloperskie natywnego serwera aplikacji Codex podlegają surowszym regułom niż
pozostałe powierzchnie promptów: tylko wskazówki jawnie ograniczone do `codex_app_server`
są przenoszone do tego pasa o wyższym priorytecie. Starsze wskazówki w postaci ciągów znaków
oraz ustrukturyzowane wskazówki bez określonego zakresu pozostają dostępne dla powierzchni
promptów innych niż Codex w celu zachowania zgodności.

Polecenia hosta Node są wykonywane na połączonym hoście Node, a nie wewnątrz procesu Gateway. Jeśli obecne jest `agentTool`, Node publikuje deskryptor po pomyślnym połączeniu z Gateway; Gateway udostępnia go uruchomieniom agenta tylko wtedy, gdy ten Node jest połączony, i tylko jeśli `command` deskryptora znajduje się w zatwierdzonym zestawie poleceń Node. Ustaw `agentTool.defaultPlatforms`, aby dodać niegroźne polecenie do domyślnej listy dozwolonych poleceń Node; w przeciwnym razie wymagane jest jawne `gateway.nodes.allowCommands` lub zasada wywołań Node. `agentTool.name` musi być bezpieczne dla dostawcy: zaczynać się literą, zawierać wyłącznie litery, cyfry, podkreślenia lub łączniki i mieć nie więcej niż 64 znaki. Narzędzia Node oparte na MCP mogą ustawić metadane `agentTool.mcp`, aby katalog i interfejsy wyszukiwania narzędzi mogły wyświetlać tożsamość zdalnego serwera/narzędzia MCP, ale wykonanie nadal odbywa się za pośrednictwem ogłoszonego polecenia Node.

### Infrastruktura

| Metoda                                          | Co rejestruje                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hak zdarzenia                                                        |
| `api.registerHttpRoute(params)`                 | Punkt końcowy HTTP Gateway                                           |
| `api.registerGatewayMethod(name, handler)`      | Metoda RPC Gateway                                                   |
| `api.registerGatewayDiscoveryService(service)`  | Usługa ogłaszająca lokalne wykrywanie Gateway                        |
| `api.registerCli(registrar, opts?)`             | Podpolecenie CLI                                                     |
| `api.registerNodeCliFeature(registrar, opts?)`  | Funkcja CLI Node w ramach `openclaw nodes`                           |
| `api.registerService(service)`                  | Usługa działająca w tle                                              |
| `api.registerInteractiveHandler(registration)`  | Procedura obsługi interakcji                                         |
| `api.registerAgentToolResultMiddleware(...)`    | Oprogramowanie pośredniczące wyników narzędzi środowiska wykonawczego |
| `api.registerMemoryPromptSupplement(builder)`   | Dodatkowa sekcja promptu powiązana z pamięcią                        |
| `api.registerMemoryCorpusSupplement(adapter)`   | Dodatkowy korpus do wyszukiwania i odczytu pamięci                   |
| `api.registerHostedMediaResolver(resolver)`     | Mechanizm rozpoznawania hostowanych adresów URL multimediów używanych przez przeglądarki |
| `api.registerTextTransforms(transforms)`        | Należące do Pluginu przekształcenia tekstu zapewniające zgodność promptów/wiadomości |
| `api.registerConfigMigration(migrate)`          | Lekka migracja konfiguracji uruchamiana przed załadowaniem środowiska wykonawczego Pluginu |
| `api.registerMigrationProvider(provider)`       | Importer dla `openclaw migrate`                                      |
| `api.registerAutoEnableProbe(probe)`            | Sonda konfiguracji, która może automatycznie włączyć ten Plugin      |
| `api.registerReload(registration)`              | Zasada restartu/przeładowania na gorąco/braku działania według prefiksu konfiguracji |
| `api.registerNodeHostCommand(command)`          | Procedura obsługi polecenia udostępniona sparowanym węzłom Node      |
| `api.registerNodeInvokePolicy(policy)`          | Lista dozwolonych/zasada zatwierdzania poleceń wywoływanych przez Node |
| `api.registerSecurityAuditCollector(collector)` | Kolektor ustaleń dla `openclaw security audit`                       |

Konstruktory uzupełnień promptu pamięci otrzymują opcjonalny kontekst `agentId`, `agentSessionKey` i `sandboxed`. Wywołania `search` i `get` uzupełnienia korpusu pamięci otrzymują opcjonalny kontekst `agentId` i `sandboxed`. Pluginy korzystające z pamięci masowej należącej do agenta powinny ustalać tę pamięć dla każdego wywołania, zamiast przechwytywać jedną globalną ścieżkę podczas rejestracji. Jeśli identyfikator agenta jest wymagany, ale nie został podany w operacji wieloagentowej, należy bezpiecznie przerwać operację zamiast wybierać dowolnego agenta.

Procedury obsługi interakcji Telegramu mogą zwracać `{ submitText }`, aby po pomyślnym zakończeniu procedury skierować tekst przez standardową ścieżkę przychodzącą agenta Telegramu. OpenClaw zachowuje przycisk wywołania zwrotnego, gdy zasada obsługi wiadomości przychodzących pomija tekst lub przetwarzanie kończy się niepowodzeniem, dzięki czemu użytkownik może spróbować ponownie po zmianie warunku blokującego. To pole wyniku jest specyficzne dla Telegramu; pozostałe kanały zachowują własne kontrakty wyników interakcji.

### Haki hosta dla Pluginów przepływu pracy

Haki hosta są punktami integracji SDK dla Pluginów, które muszą uczestniczyć w cyklu życia hosta, zamiast jedynie dodawać dostawcę, kanał lub narzędzie. Są to kontrakty ogólnego przeznaczenia; może z nich korzystać Tryb planowania, ale także przepływy zatwierdzania, bramy zasad przestrzeni roboczej, monitory działające w tle, kreatory konfiguracji i Pluginy towarzyszące interfejsu użytkownika.

| Metoda                                                                               | Kontrakt, za który odpowiada                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Należący do Pluginu, zgodny z JSON stan sesji odwzorowywany przez sesje Gateway                                                                            |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Trwały kontekst wstrzykiwany dokładnie raz do następnej tury agenta w jednej sesji                                                                         |
| `api.registerTrustedToolPolicy(...)`                                                 | Zaufana zasada narzędzi przed Pluginami, ograniczona manifestem, która może blokować lub modyfikować parametry narzędzia                                    |
| `api.registerToolMetadata(...)`                                                      | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                                                  |
| `api.registerCommand(...)`                                                           | Polecenia Pluginu o określonym zakresie; wyniki poleceń mogą ustawiać `continueAgent: true` lub `suppressReply: true`; natywne polecenia Discordu obsługują `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskryptory rozszerzeń interfejsu sterowania dla powierzchni sesji, narzędzi, uruchomień, ustawień lub kart                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Wywołania zwrotne czyszczenia zasobów środowiska wykonawczego należących do Pluginu na ścieżkach resetowania/usuwania/przeładowania                         |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Oczyszczone subskrypcje zdarzeń dla stanu przepływu pracy i monitorów                                                                                       |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Tymczasowy stan Pluginu dla danego uruchomienia, czyszczony po zakończeniu cyklu życia uruchomienia                                                         |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadane czyszczenia zadań harmonogramu należących do Pluginu; nie planuje pracy ani nie tworzy rekordów zadań                                              |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Dostępne tylko dla wbudowanych Pluginów, pośredniczone przez hosta dostarczanie załącznika plikowego do aktywnej bezpośredniej trasy wychodzącej sesji       |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Dostępne tylko dla wbudowanych Pluginów, zaplanowane tury sesji oparte na Cron wraz z czyszczeniem według znaczników                                        |
| `api.session.controls.registerSessionAction(...)`                                    | Typowane akcje sesji, które klienci mogą wysyłać przez Gateway                                                                                             |

Deskryptor `surface: "tab"` dodaje kartę na pasku bocznym interfejsu sterowania. Deskryptory kart aktywnych Pluginów są ogłaszane klientom panelu w komunikacie powitalnym Gateway (`controlUiTabs`), więc karta pojawia się tylko wtedy, gdy Plugin jest włączony. Wbudowane Pluginy mogą dostarczać pełnoprawny widok panelu dla swojej karty; pozostałe Pluginy mogą ustawić `path` na trasę HTTP Pluginu (zobacz `api.registerHttpRoute(...)`), którą panel renderuje w izolowanej ramce. `icon` jest podpowiedzią nazwy ikony panelu, `group` wybiera sekcję paska bocznego (`control` lub `agent`), `order` określa kolejność wśród kart Pluginów, a `requiredScopes` ukrywa kartę przed połączeniami, które nie mają tych zakresów operatora:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

W nowym kodzie Pluginów używaj pogrupowanych przestrzeni nazw:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Równoważne metody płaskie pozostają dostępne jako przestarzałe aliasy zgodności dla istniejących Pluginów. Nie dodawaj nowego kodu Pluginu, który bezpośrednio wywołuje `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` ani `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` jest udogodnieniem ograniczonym do sesji, zbudowanym na harmonogramie Cron Gateway. Cron odpowiada za czas wykonania i tworzy rekord zadania działającego w tle, gdy tura zostaje uruchomiona; SDK Pluginu ogranicza jedynie sesję docelową, nazewnictwo należące do Pluginu i czyszczenie. Użyj `api.runtime.tasks.managedFlows` wewnątrz zaplanowanej tury, gdy sama praca wymaga trwałego, wieloetapowego stanu Task Flow.

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne Pluginy mogą odpowiadać za rozszerzenia sesji, deskryptory interfejsu użytkownika, polecenia, metadane narzędzi, wstrzyknięcia do następnej tury i zwykłe haki.
- Zaufane zasady narzędzi są wykonywane przed zwykłymi hakami `before_tool_call` i są zaufane przez hosta. Zasady wbudowane są wykonywane jako pierwsze; zasady zainstalowanych Pluginów wymagają jawnego włączenia oraz umieszczenia ich lokalnych identyfikatorów w `contracts.trustedToolPolicies`, a następnie są wykonywane w kolejności ładowania Pluginów. Identyfikatory zasad są ograniczone do rejestrującego je Pluginu.
- Zastrzeżone polecenia mogą należeć wyłącznie do wbudowanych Pluginów. Zewnętrzne Pluginy powinny używać własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza haki modyfikujące prompt, w tym `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, pola promptu ze starszego `before_agent_start` oraz `enqueueNextTurnInjection`.

Przykłady zastosowań poza Trybem planowania:

| Archetyp Pluginu                    | Używane hooki                                                                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Przepływ zatwierdzania              | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie w następnej turze, deskryptor interfejsu użytkownika                                                       |
| Bramka zasad budżetu/obszaru roboczego | Zasady zaufanych narzędzi, metadane narzędzi, projekcja sesji                                                                                                   |
| Monitor cyklu życia w tle           | Czyszczenie cyklu życia środowiska wykonawczego, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład w monit Heartbeat, deskryptor interfejsu użytkownika |
| Kreator konfiguracji lub wdrażania  | Rozszerzenie sesji, polecenia o ograniczonym zakresie, deskryptor interfejsu Control UI                                                                            |

<Note>
  Zarezerwowane główne przestrzenie nazw administracyjnych (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) zawsze pozostają
  `operator.admin`, nawet jeśli Plugin próbuje przypisać węższy zakres metody
  Gateway. W przypadku metod należących do Pluginu preferuj prefiksy specyficzne
  dla Pluginu.
</Note>

<Accordion title="Kiedy używać oprogramowania pośredniczącego wyników narzędzi">
  Dołączone Pluginy oraz jawnie włączone zainstalowane Pluginy ze zgodnymi
  kontraktami manifestu mogą używać `api.registerAgentToolResultMiddleware(...)`,
  gdy muszą zmodyfikować wynik narzędzia po jego wykonaniu, lecz przed
  przekazaniem go przez środowisko wykonawcze z powrotem do modelu. Jest to
  zaufany, neutralny względem środowiska wykonawczego punkt integracji dla
  asynchronicznych reduktorów danych wyjściowych, takich jak tokenjuice.

Pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego środowiska wykonawczego, na przykład `["openclaw", "codex"]`.
Zainstalowane Pluginy bez tego kontraktu lub bez jawnego włączenia nie mogą
rejestrować tego oprogramowania pośredniczącego; w przypadku zadań, które nie
wymagają przetwarzania wyników narzędzi przed przekazaniem ich do modelu, należy
nadal używać zwykłych hooków Pluginów OpenClaw. Stara ścieżka rejestracji fabryki
rozszerzeń przeznaczona wyłącznie dla osadzonego modułu wykonawczego została
usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` umożliwia Pluginowi rozgłaszanie
aktywnego Gateway za pomocą lokalnego transportu wykrywania, takiego jak
mDNS/Bonjour. OpenClaw wywołuje usługę podczas uruchamiania Gateway, gdy lokalne
wykrywanie jest włączone, przekazuje bieżące porty Gateway i niepoufne dane
pomocnicze TXT oraz wywołuje zwróconą procedurę obsługi `stop` podczas wyłączania
Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Pluginy wykrywania Gateway nie mogą traktować rozgłaszanych wartości TXT jako
danych poufnych ani danych uwierzytelniających. Wykrywanie jest wskazówką
dotyczącą routingu; uwierzytelnianie Gateway i przypinanie TLS nadal odpowiadają
za zaufanie.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` przyjmuje dwa rodzaje metadanych poleceń:

- `commands`: jawne nazwy poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń używane podczas parsowania na potrzeby
  pomocy CLI, routingu i leniwej rejestracji CLI Pluginu
- `parentPath`: opcjonalna ścieżka polecenia nadrzędnego dla zagnieżdżonych grup
  poleceń, takich jak `["nodes"]`

W przypadku funkcji sparowanych węzłów preferuj
`api.registerNodeCliFeature(registrar, opts?)`. Jest to niewielka nakładka na
`api.registerCli(..., { parentPath: ["nodes"] })`, która jednoznacznie określa
polecenia takie jak `openclaw nodes canvas` jako należące do Pluginu funkcje
węzłów.

Jeśli polecenie Pluginu ma pozostać ładowane leniwie w standardowej głównej
ścieżce CLI, podaj `descriptors` obejmujące każdy główny element polecenia
udostępniany przez ten rejestrator.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Zagnieżdżone polecenia otrzymują rozpoznane polecenie nadrzędne jako `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji
głównego CLI. Ta zachowana ze względów zgodności ścieżka natychmiastowego
ładowania jest nadal obsługiwana, ale nie instaluje symboli zastępczych opartych
na deskryptorach na potrzeby leniwego ładowania podczas parsowania.

### Rejestracja zaplecza CLI

`api.registerCliBackend(...)` umożliwia Pluginowi zarządzanie domyślną
konfiguracją lokalnego zaplecza CLI opartego na AI, takiego jak `claude-cli` lub
`my-cli`.

- `id` zaplecza staje się prefiksem dostawcy w odwołaniach do modeli, takich jak
  `my-cli/gpt-5`.
- `config` zaplecza używa tej samej struktury co
  `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. Przed uruchomieniem CLI
  OpenClaw nakłada `agents.defaults.cliBackends.<id>` na domyślną konfigurację
  Pluginu.
- Użyj `normalizeConfig`, gdy zaplecze wymaga po scaleniu przekształceń
  zapewniających zgodność (na przykład normalizacji starych struktur flag).
- Użyj `resolveExecutionArgs` do modyfikacji argumentów argv w zakresie żądania,
  które należą do dialektu CLI, takich jak mapowanie poziomów rozumowania
  OpenClaw na natywną flagę nakładu. Hook otrzymuje `ctx.executionMode`; użyj
  `"side-question"`, aby dodać natywne dla zaplecza flagi izolacji dla
  efemerycznych wywołań `/btw`. Jeśli te flagi niezawodnie wyłączają natywne
  narzędzia w CLI, w którym są one poza tym zawsze włączone, zadeklaruj również
  `sideQuestionToolMode: "disabled"`.
- Zaplecza, które mogą wyłączyć wszystkie natywne narzędzia dla określonego
  uruchomienia, mogą deklarować `nativeToolMode: "selectable"`. Ograniczone
  wywołania przekazują pustą krotkę `ctx.toolAvailability.native` wraz z dokładną
  listą dozwolonych MCP izolowaną przez hosta; `resolveExecutionArgs` musi
  wymuszać oba te ograniczenia w końcowych argumentach argv nowego lub
  wznawianego uruchomienia. Jeśli zaplecze nie może tego zrobić, OpenClaw
  bezpiecznie odmawia wykonania.

Kompletny przewodnik tworzenia znajduje się w sekcji
[Pluginy zaplecza CLI](/pl/plugins/cli-backend-plugins).

### Wyłączne miejsca

| Metoda                                     | Co rejestruje                                                                                                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (w danym momencie może być aktywny tylko jeden). Wywołania zwrotne cyklu życia otrzymują `runtimeSettings`, gdy host może udostępnić diagnostykę modelu/dostawcy/trybu; starsze rygorystyczne silniki są ponawiane bez tego klucza. |
| `api.registerMemoryCapability(capability)` | Ujednolicona funkcja pamięci                                                                                                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji monitu pamięci                                                                                                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Moduł rozpoznawania planu opróżniania pamięci                                                                                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska wykonawczego pamięci                                                                                                                                                                                                    |

### Przestarzałe adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego Pluginu |

- `registerMemoryCapability` jest preferowanym wyłącznym interfejsem API Pluginu
  pamięci.
- `registerMemoryCapability` może również udostępniać
  `publicArtifacts.listArtifacts(...)`, aby towarzyszące Pluginy mogły korzystać
  z wyeksportowanych artefaktów pamięci za pośrednictwem
  `openclaw/plugin-sdk/memory-host-core`, zamiast uzyskiwać dostęp do prywatnego
  układu konkretnego Pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to wyłączne interfejsy API Pluginu pamięci zachowane ze
  względów zgodności ze starszymi wersjami.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnego odwołania
  `provider/model`, takiego jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego
  łańcucha rezerwowego.
- `registerMemoryEmbeddingProvider` jest przestarzałe. Nowi dostawcy osadzania
  powinni używać `api.registerEmbeddingProvider(...)` i
  `contracts.embeddingProviders`.
- Istniejący dostawcy specyficzni dla pamięci nadal działają w okresie migracji,
  ale inspekcja Pluginu zgłasza to jako dług zgodności w przypadku Pluginów,
  które nie są dołączone.

### Zdarzenia i cykl życia

| Metoda                                       | Działanie                          |
| -------------------------------------------- | ---------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia           |
| `api.onConversationBindingResolved(handler)` | Wywołanie zwrotne powiązania rozmowy |

Przykłady, typowe nazwy hooków i semantykę zabezpieczeń opisano w sekcji
[Hooki Pluginu](/pl/plugins/hooks).

### Semantyka decyzji hooków

`before_install` jest hookiem cyklu życia środowiska wykonawczego Pluginu, a nie
powierzchnią zasad instalacji operatora. Użyj `security.installPolicy`, gdy
decyzja o zezwoleniu lub zablokowaniu musi obejmować ścieżki instalacji lub
aktualizacji obsługiwane przez CLI i Gateway.

- `before_tool_call`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny moduł obsługi ustawi tę wartość, moduły obsługi o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny moduł obsługi ustawi tę wartość, moduły obsługi o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest rozstrzygające. Gdy dowolny moduł obsługi przejmie wysyłanie, moduły obsługi o niższym priorytecie oraz domyślna ścieżka wysyłania modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest rozstrzygające. Gdy dowolny moduł obsługi ustawi tę wartość, moduły obsługi o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: gdy potrzebujesz kierowania przychodzących wiadomości według wątku lub tematu, użyj typowanego pola `threadId`. Pole `metadata` zachowaj na dodatkowe dane specyficzne dla kanału.
- `message_sending`: najpierw używaj typowanych pól kierowania `replyToId` / `threadId`, a dopiero potem korzystaj z pola `metadata` specyficznego dla kanału.
- `gateway_start`: do stanu uruchamiania będącego własnością Gateway używaj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` zamiast polegać na wewnętrznych punktach zaczepienia `gateway:startup`. Cron może być w tym momencie nadal ładowany.
- `cron_reconciled`: po uruchomieniu lub ponownym załadowaniu harmonogramu odbuduj pełną zewnętrzną projekcję Cron. Obejmuje ona `reason` oraz efektywny stan `enabled`, w tym `enabled: false`, natomiast `ctx.getCron?.()` zwraca dokładnie uzgodniony harmonogram. Przekaż `ctx.abortSignal` do trwałych operacji projekcji; zostaną one przerwane, gdy ta migawka harmonogramu zostanie zastąpiona lub Gateway zostanie zamknięty.
- `cron_changed`: obserwuj zmiany cyklu życia Cron będącego własnością Gateway. Zdarzenia `scheduled` i `removed` są wskazówkami uzgadniania po zatwierdzeniu, a nie uporządkowanym dziennikiem zmian. W zdarzeniu zaplanowania pole `event.nextRunAtMs` nie występuje, gdy zadanie nie ma następnego wybudzenia; zdarzenie usunięcia nadal zawiera migawkę usuniętego zadania.

Zewnętrzne harmonogramy wybudzania powinny stosować opóźnianie lub scalanie zdarzeń `cron_changed`,
a następnie ponownie odczytywać pełny trwały widok z harmonogramu ostatnio przechwyconego przez
`cron_reconciled`. Nie przejmuj harmonogramu z kontekstu `cron_changed`: odłączona
wskazówka ze starszego harmonogramu może nałożyć się na późniejsze ponowne załadowanie.

Używaj `cron_reconciled` jako wyzwalacza pełnej migawki trwałego stanu ładowanego podczas
uruchamiania Gateway lub zastępowania harmonogramu. Nie jest on odtwarzany przy przeładowaniu
na gorąco dotyczącym wyłącznie pluginu. Moduły obsługi obserwacji działają równolegle, a wywołania
typu „uruchom i nie czekaj” mogą się nakładać, dlatego odbiorcy nie mogą polegać na kolejności zakończenia zdarzeń.
Zachowaj OpenClaw jako źródło prawdy dla sprawdzania terminów i wykonywania.

Adapter z pojedynczym wykonywaniem, trwałym zastępowaniem, ponawianiem z opóźnieniem i czystym
zamykaniem opisano w sekcji [Bezpieczna zewnętrzna projekcja Cron](/pl/plugins/hooks#safe-external-cron-projection).

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                 |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                   |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                         |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka środowiska wykonawczego w pamięci, jeśli jest dostępna) |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Funkcje pomocnicze środowiska wykonawczego](/pl/plugins/sdk-runtime)                           |
| `api.logger`             | `PluginLogger`            | Rejestrator o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki etap uruchamiania/konfiguracji przed załadowaniem pełnego punktu wejścia |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                       |

## Konwencja modułów wewnętrznych

W obrębie pluginu używaj lokalnych plików zbiorczych do importów wewnętrznych:

```text
my-plugin/
  api.ts            # Eksporty publiczne dla zewnętrznych odbiorców
  runtime-api.ts    # Eksporty środowiska wykonawczego wyłącznie do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia wyłącznie do konfiguracji (opcjonalny)
```

<Warning>
  Nigdy nie importuj własnego pluginu w kodzie produkcyjnym przez
  `openclaw/plugin-sdk/<your-plugin>`. Importy wewnętrzne prowadź przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK stanowi wyłącznie kontrakt zewnętrzny.
</Warning>

Publiczne powierzchnie wbudowanego pluginu ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywną migawkę konfiguracji środowiska wykonawczego, gdy OpenClaw już działa. Jeśli migawka
środowiska wykonawczego jeszcze nie istnieje, używają zastępczo rozpoznanego pliku konfiguracyjnego na dysku.
Spakowane fasady wbudowanych pluginów należy ładować przez programy ładujące fasady pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają kontrole manifestu
i plików pomocniczych środowiska wykonawczego, których spakowane instalacje używają dla kodu należącego do pluginu.

Pluginy dostawców mogą udostępniać wąski, lokalny dla pluginu plik zbiorczy kontraktu, gdy
funkcja pomocnicza jest celowo specyficzna dla dostawcy i nie należy jeszcze do ogólnej
podścieżki SDK. Przykłady wbudowane:

- **Anthropic**: publiczny punkt styku `api.ts` / `contract-api.ts` dla funkcji pomocniczych
  nagłówków wersji beta Claude i strumieni `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawcy,
  funkcje pomocnicze modelu domyślnego oraz konstruktory dostawcy czasu rzeczywistego.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz funkcje pomocnicze wdrażania i konfiguracji.

<Warning>
  Kod produkcyjny rozszerzenia powinien również unikać importów
  `openclaw/plugin-sdk/<other-plugin>`. Jeśli funkcja pomocnicza jest rzeczywiście współdzielona, przenieś ją do neutralnej
  podścieżki SDK, takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni ukierunkowanej na możliwości, zamiast łączyć ze sobą dwa pluginy.
</Warning>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Funkcje pomocnicze środowiska wykonawczego" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna dokumentacja przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja początkowa i ustawienia" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lintowania.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Elementy wewnętrzne pluginu" icon="diagram-project" href="/pl/plugins/architecture">
    Szczegółowa architektura i model możliwości.
  </Card>
</CardGroup>
