---
read_when:
    - Implementowanie haków środowiska wykonawczego dostawcy, cyklu życia kanału lub pakietów paczek
    - Debugowanie kolejności ładowania pluginów lub stanu rejestru
    - Dodawanie nowej funkcji pluginu lub pluginu silnika kontekstu
summary: 'Wewnętrzna architektura Pluginów: proces ładowania, rejestr, punkty zaczepienia środowiska wykonawczego, trasy HTTP i tabele referencyjne'
title: Wewnętrzna architektura Pluginów
x-i18n:
    generated_at: "2026-07-12T15:18:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Dla publicznego modelu możliwości, struktur pluginów oraz kontraktów własności i wykonywania
zobacz [Architektura pluginów](/pl/plugins/architecture). Ta strona opisuje
mechanizmy wewnętrzne: potok ładowania, rejestr, hooki środowiska wykonawczego, trasy HTTP Gateway,
ścieżki importu i tabele schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu następujące czynności:

1. wykrywa potencjalne katalogi główne pluginów
2. odczytuje natywne lub zgodne manifesty pakietów i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. określa, czy każdy kandydat ma być włączony
6. ładuje włączone moduły natywne: skompilowane moduły dołączone korzystają z natywnego modułu ładującego;
   lokalny kod źródłowy TypeScript pluginów zewnętrznych korzysta z awaryjnego mechanizmu Jiti
7. wywołuje natywne hooki `register(api)` i gromadzi rejestracje w rejestrze pluginów
8. udostępnia rejestr poleceniom i powierzchniom środowiska wykonawczego

<Note>
`activate` jest starszym aliasem `register` — moduł ładujący wybiera dostępną funkcję (`def.register ?? def.activate`) i wywołuje ją w tym samym miejscu. Wszystkie dołączone pluginy używają `register`; w nowych pluginach preferuj `register`.
</Note>

Kontrole bezpieczeństwa są wykonywane **przed** uruchomieniem kodu. Mechanizm wykrywania blokuje kandydata,
gdy:

- jego rozwiązany punkt wejścia znajduje się poza katalogiem głównym pluginu
- jego ścieżka (lub katalog główny) jest zapisywalna przez wszystkich
- w przypadku pluginów niedołączonych właściciel ścieżki nie odpowiada bieżącemu identyfikatorowi uid (ani użytkownikowi root)

W przypadku zapisywalnych przez wszystkich katalogów dołączonych pluginów najpierw podejmowana jest próba
naprawy uprawnień w miejscu za pomocą `chmod` (instalacje npm/globalne mogą dostarczać katalogi pakietów z uprawnieniami `0777`),
a następnie kontrola jest wykonywana ponownie; kontrole własności są całkowicie pomijane dla pochodzenia dołączonego.

Zablokowani kandydaci nadal zawierają identyfikator pluginu w emitowanej diagnostyce, jeśli
jest on znany (w tym identyfikatory odczytane z manifestu znajdującego się w
odrzuconym z innych powodów katalogu), dzięki czemu konfiguracja odwołująca się do tego identyfikatora wskazuje zablokowany
plugin powiązany z ostrzeżeniem dotyczącym bezpieczeństwa ścieżki, zamiast niezwiązanego błędu „nieznany plugin”.

### Zachowanie oparte przede wszystkim na manifeście

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikowania pluginu
- wykrywania zadeklarowanych kanałów, Skills, schematu konfiguracji lub możliwości pakietu
- walidowania `plugins.entries.<id>.config`
- uzupełniania etykiet i tekstów zastępczych interfejsu Control UI
- wyświetlania metadanych instalacji i katalogu
- zachowywania lekkich deskryptorów aktywacji i konfiguracji bez ładowania środowiska wykonawczego pluginu

W przypadku pluginów natywnych moduł środowiska wykonawczego stanowi część płaszczyzny danych. Rejestruje
rzeczywiste zachowania, takie jak hooki, narzędzia, polecenia lub przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania.
Są deskryptorami zawierającymi wyłącznie metadane do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji w środowisku wykonawczym, `register(...)` ani `setupEntry`.
Aktywne mechanizmy korzystające z aktywacji używają wskazówek manifestu dotyczących poleceń, kanałów i dostawców, aby
zawęzić ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie przez CLI zawęża wybór do pluginów będących właścicielami żądanego polecenia głównego
- konfiguracja kanału i rozpoznawanie pluginu zawężają wybór do pluginów będących właścicielami żądanego
  identyfikatora kanału
- jawna konfiguracja dostawcy i rozpoznawanie środowiska wykonawczego zawężają wybór do pluginów będących właścicielami żądanego
  identyfikatora dostawcy
- planowanie uruchamiania Gateway używa `activation.onStartup` do jawnych importów
  startowych; pluginy bez metadanych uruchomieniowych są ładowane wyłącznie przez bardziej
  szczegółowe wyzwalacze aktywacji

Planista aktywacji udostępnia zarówno interfejs API zwracający tylko identyfikatory dla istniejących wywołujących, jak i
interfejs API planu do diagnostyki. Wpisy planu informują, dlaczego plugin został wybrany,
odróżniając jawne wskazówki `activation.*` od mechanizmu zastępczego opartego na własności manifestu:

| Powód (ze wskazówek `activation.*`)   | Powód (z własności manifestu)                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`       | —                                                                                            |
| `activation-capability-hint`          | —                                                                                            |
| `activation-channel-hint`             | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`             | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`            | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`               | —                                                                                            |
| — (wyzwalacz hooka nie ma wariantu wskazówki) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Ten podział powodów stanowi granicę zgodności: istniejące metadane pluginów
nadal działają, a nowy kod może wykrywać ogólne wskazówki lub zachowanie zastępcze
bez zmiany semantyki ładowania środowiska wykonawczego.

Wstępne ładowanie środowiska wykonawczego podczas obsługi żądania, które wymaga szerokiego zakresu `all`, nadal wyprowadza
jawny efektywny zbiór identyfikatorów pluginów na podstawie konfiguracji, planowania uruchamiania, skonfigurowanych
kanałów, slotów i reguł automatycznego włączania
(`resolveEffectivePluginIds` w `src/plugins/effective-plugin-ids.ts`). Jeśli ten
wyprowadzony zbiór jest pusty, OpenClaw pozostawia pusty zakres zamiast rozszerzać go na
każdy możliwy do wykrycia plugin.

Wykrywanie konfiguracji preferuje identyfikatory należące do deskryptorów, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydatów na pluginy przed użyciem mechanizmu zastępczego
`setup-api` w przypadku pluginów, które nadal wymagają hooków środowiska wykonawczego na etapie konfiguracji. Listy konfiguracji
dostawców używają manifestu `providerAuthChoices`, opcji konfiguracji wyprowadzonych z deskryptorów
oraz metadanych katalogu instalacji bez ładowania środowiska wykonawczego dostawcy. Jawne
`setup.requiresRuntime: false` wyłącza ładowanie na podstawie samego deskryptora; pominięcie
`requiresRuntime` zachowuje starszy mechanizm zastępczy setup-api w celu zapewnienia zgodności. Jeśli
więcej niż jeden wykryty plugin deklaruje ten sam znormalizowany identyfikator dostawcy konfiguracji lub
zaplecza CLI, wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na
kolejności wykrywania. Gdy środowisko wykonawcze konfiguracji zostaje uruchomione, diagnostyka rejestru zgłasza
rozbieżności między `setup.providers` / `setup.cliBackends` a dostawcami lub zapleczami CLI
faktycznie zarejestrowanymi przez setup-api, bez blokowania starszych pluginów.

### Granica pamięci podręcznej pluginów

OpenClaw nie buforuje wyników wykrywania pluginów ani bezpośrednich danych rejestru manifestów
w przedziałach czasu zegarowego. Instalacje, zmiany manifestów i zmiany ścieżek ładowania
muszą być widoczne przy następnym jawnym odczycie metadanych lub przebudowie migawki.
Parser pliku manifestu utrzymuje ograniczoną pamięć podręczną sygnatur plików, indeksowaną według
otwartej ścieżki manifestu oraz urządzenia/i-węzła, rozmiaru i mtime/ctime; ta pamięć podręczna jedynie
zapobiega ponownemu analizowaniu niezmienionych bajtów i nie może buforować odpowiedzi dotyczących wykrywania, rejestru,
właściciela ani zasad.

Bezpieczna szybka ścieżka metadanych opiera się na jawnej własności obiektów, a nie ukrytej pamięci podręcznej.
Gorące ścieżki uruchamiania Gateway powinny przekazywać bieżący `PluginMetadataSnapshot`,
wyprowadzoną `PluginLookUpTable` lub jawny rejestr manifestów przez cały łańcuch
wywołań. Walidacja konfiguracji, automatyczne włączanie podczas uruchamiania, inicjalizacja pluginów i wybór
dostawcy mogą ponownie używać tych obiektów, dopóki reprezentują bieżącą konfigurację i
zbiór pluginów. Wyszukiwanie konfiguracji nadal odtwarza metadane manifestów na żądanie,
chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestów; należy zachować
to jako mechanizm zastępczy zimnej ścieżki zamiast dodawać ukryte pamięci podręczne wyszukiwania. Gdy
dane wejściowe się zmienią, należy przebudować i zastąpić migawkę zamiast ją modyfikować lub
przechowywać kopie historyczne. Widoki aktywnego rejestru pluginów i dołączone
funkcje pomocnicze inicjalizacji kanałów należy ponownie wyliczać na podstawie bieżącego
rejestru/katalogu głównego. Krótkotrwałe mapy są dopuszczalne w obrębie jednego wywołania do deduplikacji pracy lub
ochrony przed ponownym wejściem; nie mogą stać się pamięciami podręcznymi metadanych procesu.

W przypadku ładowania pluginów trwałą warstwą pamięci podręcznej jest ładowanie środowiska wykonawczego. Może ona ponownie wykorzystywać
stan modułu ładującego, gdy kod lub zainstalowane artefakty są rzeczywiście ładowane, na przykład:

- `PluginLoaderCacheState` i zgodne aktywne rejestry środowiska wykonawczego
- pamięci podręczne jiti/modułów i pamięci podręczne modułów ładujących powierzchni publicznych, używane w celu uniknięcia wielokrotnego importowania
  tej samej powierzchni środowiska wykonawczego
- pamięci podręczne systemu plików dla artefaktów zainstalowanych pluginów
- krótkotrwałe mapy dla pojedynczego wywołania, służące do normalizacji ścieżek lub rozstrzygania duplikatów

Te pamięci podręczne są szczegółami implementacyjnymi płaszczyzny danych. Nie mogą odpowiadać na
pytania płaszczyzny sterowania, takie jak „który plugin jest właścicielem tego dostawcy?”, chyba że
wywołujący celowo zażądał ładowania środowiska wykonawczego.

Nie dodawaj trwałych ani czasowych pamięci podręcznych dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestów
- rejestrów manifestów odtwarzanych z indeksu zainstalowanych pluginów
- wyszukiwania właściciela dostawcy, wykluczania modeli, zasad dostawcy lub metadanych
  artefaktów publicznych
- żadnych innych odpowiedzi wyprowadzonych z manifestu, w przypadku których zmieniony manifest, indeks instalacji
  lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy przebudowują metadane manifestów na podstawie utrwalonego indeksu zainstalowanych pluginów,
odtwarzają ten rejestr na żądanie. Zainstalowany indeks jest trwałym
stanem płaszczyzny źródłowej; nie jest ukrytą pamięcią podręczną metadanych w procesie.

## Model rejestru

Załadowane pluginy nie modyfikują bezpośrednio przypadkowych globalnych elementów rdzenia. Rejestrują się w
centralnym rejestrze pluginów (`PluginRegistry` w `src/plugins/registry-types.ts`),
który śledzi rekordy pluginów (tożsamość, źródło, pochodzenie, stan, diagnostyka)
oraz tablice dla każdej możliwości: narzędzi, starszych i typowanych hooków,
kanałów, dostawców, procedur obsługi RPC Gateway, tras HTTP, rejestratorów CLI,
usług działających w tle, poleceń należących do pluginów oraz dziesiątek innych typowanych rodzin
dostawców (mowy, osadzeń, generowania obrazów/wideo/muzyki, pobierania
i wyszukiwania w sieci, środowisk agentów, akcji sesji i innych).

Funkcje rdzenia odczytują następnie dane z tego rejestru zamiast komunikować się bezpośrednio z modułami
pluginów. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- środowisko wykonawcze rdzenia -> korzystanie z rejestru

To rozdzielenie ma znaczenie dla łatwości utrzymania. Oznacza, że większość powierzchni rdzenia potrzebuje tylko
jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy
moduł pluginu”.

## Wywołania zwrotne powiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować po rozstrzygnięciu zatwierdzenia.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać wywołanie zwrotne po zatwierdzeniu
lub odrzuceniu żądania powiązania:

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

Pola danych wywołania zwrotnego:

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozwiązane powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie pierwotnego żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane konwersacji

To wywołanie zwrotne służy wyłącznie do powiadamiania. Nie zmienia uprawnień do wiązania
konwersacji i jest uruchamiane po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki środowiska wykonawczego dostawcy

Pluginy dostawców mają trzy warstwy:

- **Metadane manifestu** do szybkiego wyszukiwania przed uruchomieniem środowiska wykonawczego:
  `setup.providers[].envVars`, przestarzałe pole zgodności `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki etapu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Hooki środowiska wykonawczego**: ponad 40 opcjonalnych hooków obejmujących uwierzytelnianie, rozpoznawanie modeli,
  opakowywanie strumieni, poziomy rozumowania, zasady ponownego odtwarzania i punkty końcowe użycia. Zobacz
  [Kolejność i użycie hooków](#hook-order-and-usage).

OpenClaw nadal odpowiada za ogólną pętlę agenta, przełączanie awaryjne, obsługę transkrypcji i
zasady narzędzi. Te hooki stanowią powierzchnię rozszerzeń dla zachowań specyficznych dla dostawców,
bez konieczności implementowania całego niestandardowego transportu wnioskowania.

Użyj pola manifestu `setup.providers[].envVars`, gdy dostawca ma poświadczenia oparte na zmiennych środowiskowych, które powinny być widoczne dla ogólnych ścieżek uwierzytelniania, stanu i wyboru modelu bez ładowania środowiska uruchomieniowego pluginu. Przestarzałe pole `providerAuthEnvVars` jest nadal odczytywane przez adapter zgodności w okresie wycofywania, a niewbudowane pluginy, które go używają, otrzymują diagnostykę manifestu. Użyj pola manifestu `providerAuthAliases`, gdy jeden identyfikator dostawcy powinien ponownie wykorzystywać zmienne środowiskowe, profile uwierzytelniania, uwierzytelnianie oparte na konfiguracji oraz opcję wdrażania z kluczem API innego identyfikatora dostawcy. Użyj pola manifestu `providerAuthChoices`, gdy interfejsy CLI wdrażania i wyboru uwierzytelniania powinny znać identyfikator opcji dostawcy, etykiety grup oraz proste podłączenie uwierzytelniania za pomocą jednej flagi bez ładowania środowiska uruchomieniowego dostawcy. Zachowaj pole `envVars` środowiska uruchomieniowego dostawcy dla wskazówek przeznaczonych dla operatora, takich jak etykiety wdrażania lub zmienne konfiguracyjne identyfikatora klienta i sekretu klienta OAuth.

Użyj pola manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowane zmiennymi środowiskowymi, które powinny być widoczne dla ogólnego mechanizmu rezerwowego zmiennych środowiskowych powłoki, kontroli konfiguracji i stanu lub monitów konfiguracji bez ładowania środowiska uruchomieniowego kanału.

### Kolejność i użycie hooków

W przypadku pluginów modeli i dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” stanowi skrócony przewodnik ułatwiający podjęcie decyzji.
Pola dostawcy służące wyłącznie do zapewniania zgodności, których OpenClaw już nie wywołuje, takie jak `ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie zostały tutaj wymienione.

| Hook                              | Co robi                                                                                                                        | Kiedy używać                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `catalog`                         | Publikuje konfigurację dostawcy w `models.providers` podczas generowania `models.json`                                         | Dostawca ma własny katalog lub domyślne bazowe adresy URL                                                                                                                       |
| `applyConfigDefaults`             | Stosuje globalne wartości domyślne konfiguracji należące do dostawcy podczas materializacji konfiguracji                       | Wartości domyślne zależą od trybu uwierzytelniania, środowiska lub semantyki rodziny modeli dostawcy                                                                            |
| _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje standardowej ścieżki rejestru/katalogu                                                               | _(nie jest hookiem Pluginu)_                                                                                                                                                    |
| `normalizeModelId`                | Normalizuje starsze lub testowe aliasy identyfikatorów modeli przed wyszukiwaniem                                               | Dostawca odpowiada za porządkowanie aliasów przed kanonicznym rozpoznaniem modelu                                                                                               |
| `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym złożeniem modelu                                                   | Dostawca odpowiada za porządkowanie transportu niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                                                       |
| `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozpoznaniem środowiska uruchomieniowego/dostawcy                                     | Dostawca wymaga uporządkowania konfiguracji, które powinno należeć do pluginu; dołączone helpery rodziny Google zabezpieczają również obsługiwane wpisy konfiguracji Google       |
| `applyNativeStreamingUsageCompat` | Stosuje natywne przekształcenia zgodności użycia strumieniowego do dostawców w konfiguracji                                    | Dostawca wymaga poprawek metadanych natywnego użycia strumieniowego zależnych od punktu końcowego                                                                               |
| `resolveConfigApiKey`             | Rozpoznaje uwierzytelnianie znacznikiem środowiskowym dla dostawców w konfiguracji przed wczytaniem uwierzytelniania środowiska | Dostawcy udostępniają własne hooki rozpoznawania kluczy API na podstawie znaczników środowiskowych                                                                               |
| `resolveSyntheticAuth`            | Udostępnia uwierzytelnianie lokalne/samodzielnie hostowane lub oparte na konfiguracji bez utrwalania tekstu jawnego             | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                                                           |
| `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie wykorzystuje zewnętrzne poświadczenia uwierzytelniające bez utrwalania skopiowanych tokenów odświeżania; należy zadeklarować `contracts.externalAuthProviders` w manifeście |
| `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych symboli zastępczych profilu względem uwierzytelniania opartego na środowisku/konfiguracji | Dostawca przechowuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                                                         |
| `resolveDynamicModel`             | Synchroniczny mechanizm rezerwowy dla identyfikatorów modeli dostawcy, których nie ma jeszcze w lokalnym rejestrze              | Dostawca akceptuje dowolne nadrzędne identyfikatory modeli                                                                                                                      |
| `prepareDynamicModel`             | Asynchroniczne przygotowanie, po którym `resolveDynamicModel` jest uruchamiane ponownie                                        | Dostawca potrzebuje metadanych sieciowych przed rozpoznaniem nieznanych identyfikatorów                                                                                         |
| `normalizeResolvedModel`          | Końcowe przekształcenie przed użyciem rozpoznanego modelu przez osadzony moduł wykonawczy                                       | Dostawca wymaga przekształceń transportu, ale nadal używa transportu rdzenia                                                                                                    |
| `normalizeToolSchemas`            | Normalizuje schematy narzędzi przed przekazaniem ich osadzonemu modułowi wykonawczemu                                           | Dostawca wymaga uporządkowania schematów rodziny transportu                                                                                                                     |
| `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                                          | Dostawca chce ostrzeżeń o słowach kluczowych bez dodawania do rdzenia reguł właściwych dla dostawcy                                                                             |
| `resolveReasoningOutputMode`      | Wybiera natywny lub znacznikowy kontrakt danych wyjściowych rozumowania                                                        | Dostawca wymaga znacznikowych danych wyjściowych rozumowania/odpowiedzi końcowej zamiast pól natywnych                                                                          |
| `prepareExtraParams`              | Normalizuje parametry żądania przed ogólnymi wrapperami opcji strumienia                                                       | Dostawca wymaga domyślnych parametrów żądania lub uporządkowania parametrów właściwego dla dostawcy                                                                             |
| `createStreamFn`                  | Całkowicie zastępuje standardową ścieżkę strumienia niestandardowym transportem                                                | Dostawca wymaga niestandardowego protokołu komunikacyjnego, a nie tylko wrappera                                                                                               |
| `wrapStreamFn`                    | Wrapper strumienia stosowany po wrapperach ogólnych                                                                            | Dostawca wymaga wrapperów nagłówków/treści/modelu zapewniających zgodność bez niestandardowego transportu                                                                       |
| `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu dla poszczególnych tur                                                       | Dostawca chce, aby ogólne transporty wysyłały natywną dla dostawcy tożsamość tury                                                                                               |
| `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub zasady okresu oczekiwania sesji                                                        | Dostawca chce dostosować nagłówki sesji lub zasady mechanizmu rezerwowego ogólnych transportów WS                                                                               |
| `formatApiKey`                    | Formater profilu uwierzytelniania: zapisany profil staje się ciągiem `apiKey` środowiska uruchomieniowego                      | Dostawca przechowuje dodatkowe metadane uwierzytelniania i wymaga niestandardowej postaci tokenu środowiska uruchomieniowego                                                    |
| `refreshOAuth`                    | Nadpisuje odświeżanie OAuth dla niestandardowych punktów końcowych odświeżania lub zasad obsługi jego niepowodzenia             | Dostawca nie pasuje do współdzielonych mechanizmów odświeżania OpenClaw                                                                                                        |
| `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana po niepowodzeniu odświeżania OAuth                                                              | Dostawca wymaga własnych wskazówek naprawy uwierzytelniania po niepowodzeniu odświeżania                                                                                        |
| `matchesContextOverflowError`     | Należący do dostawcy mechanizm rozpoznawania przepełnienia okna kontekstu                                                      | Dostawca zwraca nieprzetworzone błędy przepełnienia, których ogólne heurystyki mogłyby nie wykryć                                                                               |
| `classifyFailoverReason`          | Należąca do dostawcy klasyfikacja przyczyn przełączenia awaryjnego                                                             | Dostawca może mapować nieprzetworzone błędy API/transportu na ograniczenie liczby żądań, przeciążenie itp.                                                                      |
| `isCacheTtlEligible`              | Zasady pamięci podręcznej promptów dla dostawców proxy/łącza dosyłowego                                                        | Dostawca wymaga zależnego od proxy określania kwalifikacji do TTL pamięci podręcznej                                                                                            |
| `buildMissingAuthMessage`         | Zastępuje ogólny komunikat odzyskiwania po braku uwierzytelniania                                                              | Dostawca wymaga właściwej dla niego wskazówki odzyskiwania po braku uwierzytelniania                                                                                            |
| `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykrywaniu (przestarzałe, patrz niżej)                                       | Dostawca wymaga syntetycznych wierszy zgodności z przyszłymi wersjami w `models list` i selektorach                                                                             |
| `resolveThinkingProfile`          | Zależny od modelu zestaw poziomów `/think`, etykiety wyświetlania i wartość domyślna                                           | Dostawca udostępnia niestandardową skalę myślenia lub etykietę binarną dla wybranych modeli                                                                                     |
| `isBinaryThinking`                | Hook zgodności przełącznika włączania/wyłączania rozumowania                                                                  | Dostawca udostępnia tylko binarne włączanie/wyłączanie myślenia                                                                                                                |
| `supportsXHighThinking`           | Hook zgodności obsługi rozumowania `xhigh`                                                                                     | Dostawca chce obsługiwać `xhigh` tylko w podzbiorze modeli                                                                                                                      |
| `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                                     | Dostawca odpowiada za domyślne zasady `/think` dla rodziny modeli                                                                                                               |
| `isModernModelRef`                | Mechanizm dopasowywania nowoczesnych modeli na potrzeby filtrów aktywnych profili i wyboru do testów dymnych                   | Dostawca odpowiada za dopasowywanie preferowanych modeli do testów aktywnych/dymnych                                                                                            |
| `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz środowiska uruchomieniowego tuż przed inferencją               | Dostawca wymaga wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                                                         |
| `resolveUsageAuth`                | Rozpoznaje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych widoków stanu                                             | Dostawca wymaga niestandardowego parsowania tokenu użycia/limitu lub innych poświadczeń użycia                                                                                  |
| `fetchUsageSnapshot`              | Pobiera i normalizuje właściwe dla dostawcy migawki użycia/limitu po rozpoznaniu uwierzytelniania                              | Dostawca wymaga właściwego dla niego punktu końcowego użycia lub parsera ładunku                                                                                                |
| `createEmbeddingProvider`         | Utwórz należący do dostawcy adapter osadzania dla pamięci/wyszukiwania                                          | Obsługa osadzania pamięci należy do Pluginu dostawcy                                                                                           |
| `buildReplayPolicy`               | Zwróć zasady odtwarzania sterujące obsługą transkrypcji dla dostawcy                                            | Dostawca wymaga niestandardowych zasad transkrypcji (na przykład usuwania bloków rozumowania)                                                  |
| `sanitizeReplayHistory`           | Przepisz historię odtwarzania po ogólnym oczyszczeniu transkrypcji                                              | Dostawca wymaga specyficznych dla niego przekształceń odtwarzania wykraczających poza współdzielone mechanizmy pomocnicze Compaction            |
| `validateReplayTurns`             | Przeprowadź końcową walidację lub zmianę struktury tur odtwarzania przed osadzonym modułem wykonawczym          | Warstwa transportowa dostawcy wymaga ściślejszej walidacji tur po ogólnym oczyszczeniu                                                        |
| `onModelSelected`                 | Wykonaj należące do dostawcy efekty uboczne po wyborze                                                         | Dostawca wymaga telemetrii lub należącego do niego stanu, gdy model staje się aktywny                                                          |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą do innych pluginów dostawców
obsługujących hooki, dopóki jeden z nich rzeczywiście nie zmieni identyfikatora
modelu albo transportu/konfiguracji. Dzięki temu adaptery aliasów/zgodności
dostawców działają bez konieczności ustalania przez wywołującego, który
wbudowany plugin odpowiada za przekształcenie. Jeśli żaden hook dostawcy nie
przekształci obsługiwanego wpisu konfiguracji z rodziny Google, wbudowany
normalizator konfiguracji Google nadal stosuje odpowiednie porządkowanie
zgodności.

Jeśli dostawca wymaga całkowicie niestandardowego protokołu komunikacji lub
niestandardowego mechanizmu wykonywania żądań, jest to inna klasa rozszerzenia.
Te hooki służą do zachowań dostawcy, które nadal działają w standardowej pętli
inferencji OpenClaw.

`resolveUsageAuth` określa, czy OpenClaw powinien wywołać `fetchUsageSnapshot`,
czy użyć ogólnego mechanizmu rozpoznawania poświadczeń dla powierzchni użycia i
stanu. Zwróć `{ token, accountId?, subscriptionType?, rateLimitTier? }`, gdy
dostawca ma poświadczenie do sprawdzania użycia (opcjonalne metadane planu są
przekazywane do `fetchUsageSnapshot`), zwróć `{ handled: true }`, gdy należące
do dostawcy uwierzytelnianie użycia obsłużyło żądanie i musi wyłączyć ogólny
mechanizm rezerwowy klucza API/OAuth, a gdy dostawca nie obsłużył
uwierzytelniania użycia, zwróć `null` lub `undefined`.

Zadeklaruj poświadczenia organizacyjne lub rozliczeniowe w
`providerUsageAuthEnvVars` manifestu. Dzięki temu ogólne mechanizmy wykrywania i
usuwania sekretów mogą je rozpoznawać bez traktowania ich jako kandydatów na
poświadczenia inferencji.

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

Wbudowane pluginy dostawców łączą powyższe hooki, aby dostosować je do katalogu,
uwierzytelniania, rozumowania, odtwarzania i obsługi użycia każdego dostawcy.
Miarodajny zestaw hooków znajduje się przy każdym pluginie w `extensions/`;
niniejsza strona przedstawia ich strukturę, zamiast powielać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogów przekazujących żądania">
    OpenRouter, Kilocode, Z.AI i xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, dzięki czemu mogą udostępniać
    identyfikatory modeli dostawcy nadrzędnego przed statycznym katalogiem
    OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy punktów końcowych OAuth i użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi i z.ai łączą
    `prepareRuntimeAuth` lub `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby odpowiadać za wymianę tokenów i integrację
    `/usage`.
  </Accordion>
  <Accordion title="Rodziny porządkowania odtwarzania i transkrypcji">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączać
    zasady transkrypcji za pomocą `buildReplayPolicy`, zamiast ponownie
    implementować porządkowanie w każdym pluginie.
  </Accordion>
  <Accordion title="Dostawcy udostępniający tylko katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli
    inferencji.
  </Accordion>
  <Accordion title="Helpery strumieni specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` i `context1m` znajdują się w
    publicznej warstwie `api.ts` / `contract-api.ts` pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w ogólnym
    SDK.
  </Accordion>
</AccordionGroup>

## Helpery środowiska wykonawczego

Pluginy mogą uzyskiwać dostęp do wybranych helperów rdzenia za pośrednictwem
`api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca standardowy wynik TTS rdzenia dla powierzchni plików i wiadomości głosowych.
- Używa konfiguracji `messages.tts` rdzenia i wyboru dostawcy.
- Zwraca bufor dźwięku PCM i częstotliwość próbkowania. Pluginy muszą ponownie próbkować i kodować dane dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go w selektorach głosu lub procesach konfiguracji należących do dostawcy.
- Rdzeń przekazuje rozpoznany termin żądania do hooków `listVoices` dostawcy; ustawienia limitu czasu specyficzne dla dostawcy mogą go zastąpić.
- Listy głosów mogą zawierać bogatsze metadane, takie jak ustawienia regionalne, płeć i znaczniki osobowości, przeznaczone dla selektorów uwzględniających dostawcę.
- OpenAI i ElevenLabs obsługują obecnie telefonię. Microsoft jej nie obsługuje.

Pluginy mogą również rejestrować dostawców syntezy mowy za pomocą
`api.registerSpeechProvider(...)`.

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

- Zasady TTS, mechanizmy rezerwowe i dostarczanie odpowiedzi pozostaw w rdzeniu.
- Używaj dostawców syntezy mowy do zachowań syntezy należących do dostawcy.
- Starsza wartość wejściowa Microsoft `edge` jest normalizowana do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może odpowiadać za dostawców tekstu, mowy, obrazów i przyszłych multimediów, gdy OpenClaw doda odpowiednie kontrakty możliwości.

W przypadku rozpoznawania obrazów, dźwięku i filmów pluginy rejestrują jednego
typowanego dostawcę rozpoznawania multimediów zamiast ogólnego zbioru
kluczy i wartości:

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

- Orkiestrację, mechanizmy rezerwowe, konfigurację i połączenia z kanałami pozostaw w rdzeniu.
- Zachowania dostawcy pozostaw w pluginie dostawcy.
- Rozszerzenia addytywne powinny pozostać typowane: nowe opcjonalne metody, nowe opcjonalne pola wyników i nowe opcjonalne możliwości.
- Generowanie filmów już korzysta z tego samego wzorca:
  - rdzeń odpowiada za kontrakt możliwości i helper środowiska wykonawczego
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów korzystają z `api.runtime.videoGeneration.*`

W przypadku helperów środowiska wykonawczego do rozpoznawania multimediów
pluginy mogą wywoływać:

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Do transkrypcji dźwięku pluginy mogą używać środowiska wykonawczego
rozpoznawania multimediów albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` jest preferowaną współdzieloną powierzchnią do rozpoznawania obrazów, dźwięku i filmów.
- `extractStructuredWithModel(...)` jest warstwą przeznaczoną dla pluginów do ograniczonej ekstrakcji należącej do dostawcy, w której obraz jest głównym źródłem. Uwzględnij co najmniej jeden obraz wejściowy; wejścia tekstowe stanowią kontekst uzupełniający. Pluginy produktu odpowiadają za własne trasy i schematy, natomiast OpenClaw odpowiada za granicę między dostawcą a środowiskiem wykonawczym.
- Używa konfiguracji dźwięku mechanizmu rozpoznawania multimediów rdzenia (`tools.media.audio`) i kolejności dostawców rezerwowych.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład w przypadku pominiętego lub nieobsługiwanego wejścia).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą również uruchamiać działania subagentów w tle za pośrednictwem
`api.runtime.subagent`:

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

- `provider` i `model` są opcjonalnymi nadpisaniami dla pojedynczego działania, a nie trwałymi zmianami sesji.
- OpenClaw respektuje te pola nadpisania tylko w przypadku zaufanych wywołujących.
- W przypadku należących do pluginu działań rezerwowych operatorzy muszą wyrazić zgodę za pomocą `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Działania subagentów niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast niejawnie korzystać z wartości rezerwowych.
- Sesje subagentów utworzone przez plugin są oznaczane identyfikatorem tworzącego je pluginu. Rezerwowe wywołanie `api.runtime.subagent.deleteSession(...)` może usuwać tylko te sesje, których właścicielem jest plugin; usuwanie dowolnych sesji nadal wymaga żądania Gateway z zakresem administratora.

Do wyszukiwania w sieci pluginy mogą używać współdzielonego helpera środowiska
wykonawczego zamiast odwoływać się do połączeń narzędzi agenta:

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

Pluginy mogą również rejestrować dostawców wyszukiwania w sieci za pomocą
`api.registerWebSearchProvider(...)`.

Uwagi:

- Wybór dostawcy, rozpoznawanie poświadczeń i współdzieloną semantykę żądań pozostaw w rdzeniu.
- Używaj dostawców wyszukiwania w sieci do transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` jest preferowaną współdzieloną powierzchnią dla pluginów funkcji/kanałów, które wymagają wyszukiwania bez zależności od otoki narzędzia agenta.

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

Pluginy mogą udostępniać punkty końcowe HTTP za pomocą
`api.registerHttpRoute(...)`.

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

- `path`: ścieżka trasy na serwerze HTTP Gateway.
- `auth`: wymagane, `"gateway"` lub `"plugin"`. Użyj `"gateway"`, aby wymagać standardowego uwierzytelniania Gateway, albo `"plugin"` do uwierzytelniania zarządzanego przez plugin lub weryfikacji Webhooka.
- `match`: opcjonalne. `"exact"` (domyślnie) lub `"prefix"`.
- `handleUpgrade`: opcjonalna procedura obsługi żądań przełączenia na WebSocket w tej samej trasie.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` usunięto i jego użycie spowoduje błąd ładowania pluginu. Zamiast niego użyj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty identycznych wartości `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przechodzenia awaryjnego `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie uwierzytelniania.
- Trasy z `auth: "plugin"` **nie** otrzymują automatycznie zakresów środowiska uruchomieniowego operatora. Służą do Webhooków zarządzanych przez plugin i weryfikacji podpisów, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy z `auth: "gateway"` działają w zakresie środowiska uruchomieniowego żądania Gateway. Domyślny zakres (`gatewayRuntimeScopeSurface: "write-default"`) jest celowo zachowawczy:
  - uwierzytelnianie tokenem okaziciela ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) oraz każda metoda uwierzytelniania inna niż `trusted-proxy` otrzymują pojedynczy zakres `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - wywołujący przez `trusted-proxy` bez jawnego nagłówka `x-openclaw-scopes` również zachowują starszy zakres ograniczony do `operator.write`
  - wywołujący przez `trusted-proxy`, którzy wysyłają `x-openclaw-scopes`, otrzymują zamiast tego zadeklarowane zakresy
  - trasa może wybrać `gatewayRuntimeScopeSurface: "trusted-operator"`, aby zawsze respektować `x-openclaw-scopes` w trybach uwierzytelniania przenoszących tożsamość (a przy braku nagłówka używać pełnego domyślnego zestawu zakresów CLI)
- Praktyczna zasada: nie zakładaj, że trasa pluginu uwierzytelniana przez Gateway jest niejawnie powierzchnią administracyjną. Jeśli trasa wymaga zachowania dostępnego wyłącznie administratorowi, wybierz powierzchnię zakresów `trusted-operator`, wymagaj trybu uwierzytelniania przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.
- Po dopasowaniu trasy i uwierzytelnieniu zwykłe procedury obsługi podlegają kontroli przyjmowania pracy głównej przez Gateway. Gateway będący w stanie przygotowania lub ponownego uruchamiania zwraca `503` przed wywołaniem procedury obsługi. Wąskim wyjątkiem jest trasa z `auth: "gateway"`, do której manifest nadaje uprawnienie i która wybiera również właściwą dla trasy powierzchnię `trusted-operator`; pozostaje ona osiągalna, aby wysyłanie poleceń sterujących zawieszeniem nie zostało zablokowane, podczas gdy zwykłe trasy równorzędne tego samego pluginu pozostają za granicą kontroli przyjmowania. Własność `handleUpgrade` dla WebSocketu korzysta z tej samej atomowej granicy kontroli przyjmowania; gdy procedura obsługi zaakceptuje gniazdo, jego dalszy cykl życia należy do pluginu i nie jest śledzony przez tę granicę.

## Ścieżki importu SDK pluginów

Podczas tworzenia nowych pluginów używaj wąskich podścieżek SDK zamiast monolitycznego głównego modułu zbiorczego `openclaw/plugin-sdk`. Podstawowe podścieżki:

| Podścieżka                          | Przeznaczenie                                      |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji pluginu                      |
| `openclaw/plugin-sdk/channel-core`  | Funkcje pomocnicze wejścia i budowania kanału      |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone funkcje pomocnicze i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Główny schemat Zod pliku `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają spośród rodziny wąskich punktów integracji — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno zostać
skonsolidowane w jednym kontrakcie `approvalCapability`, zamiast być rozproszone
między niepowiązanymi polami pluginu. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Funkcje pomocnicze środowiska uruchomieniowego i konfiguracji znajdują się w
odpowiadających im wyspecjalizowanych podścieżkach `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiego modułu zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
małe fasady funkcji pomocniczych kanałów, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` są przestarzałymi warstwami zgodności dla
starszych pluginów. Nowy kod powinien zamiast nich importować węższe, ogólne
prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (względem katalogu głównego pakietu każdego wbudowanego pluginu):

- `index.js` — punkt wejścia wbudowanego pluginu
- `api.js` — moduł zbiorczy funkcji pomocniczych i typów
- `runtime-api.js` — moduł zbiorczy przeznaczony wyłącznie dla środowiska uruchomieniowego
- `setup-entry.js` — punkt wejścia pluginu konfiguracji

Zewnętrzne pluginy powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`.
Nigdy nie importuj `src/*` pakietu innego pluginu z rdzenia ani z innego pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji
środowiska uruchomieniowego, jeśli istnieje, a następnie korzystają awaryjnie
z rozpoznanego pliku konfiguracji na dysku.

Podścieżki właściwe dla funkcjonalności, takie jak `image-generation`,
`media-understanding` i `speech`, istnieją, ponieważ obecnie korzystają z nich
wbudowane pluginy. Nie są one automatycznie długoterminowo zamrożonymi
kontraktami zewnętrznymi — gdy na nich polegasz, sprawdź odpowiednią stronę
dokumentacji SDK.

## Schematy narzędzia wiadomości

Pluginy powinny być właścicielami właściwych dla kanału rozszerzeń schematu
`describeMessageTool(...)` dla prymitywów innych niż wiadomości, takich jak
reakcje, odczyty i ankiety. Współdzielona prezentacja wysyłania powinna używać
ogólnego kontraktu `MessagePresentation` zamiast pól przycisków, komponentów,
bloków lub kart właściwych dla dostawcy.
Kontrakt, reguły działania awaryjnego, mapowanie dostawców i listę kontrolną
autora pluginu opisuje strona [Prezentacja wiadomości](/pl/plugins/message-presentation).

Pluginy obsługujące wysyłanie deklarują za pomocą funkcjonalności wiadomości,
co potrafią renderować:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczania

Rdzeń decyduje, czy wyrenderować prezentację natywnie, czy zdegradować ją do
tekstu. Nie udostępniaj w ogólnym narzędziu wiadomości obejść interfejsu
użytkownika właściwych dla dostawcy. Przestarzałe funkcje pomocnicze SDK dla
starszych schematów natywnych pozostają eksportowane na potrzeby istniejących
pluginów zewnętrznych, ale nowe pluginy nie powinny ich używać.

## Rozpoznawanie celów kanałów

Pluginy kanałów powinny być właścicielami semantyki celów właściwej dla kanału.
Współdzielony host wychodzący powinien pozostać ogólny, a reguły dostawcy należy
realizować przez powierzchnię adaptera wiadomości:

- `messaging.inferTargetChatType({ to })` przed przeszukaniem katalogu określa,
  czy znormalizowany cel powinien być traktowany jako `direct`, `group` czy
  `channel`.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informuje rdzeń, czy
  dane wejściowe powinny od razu przejść do rozpoznawania podobnego do
  identyfikatora, zamiast przeszukiwać katalog.
- `messaging.targetResolver.reservedLiterals` zawiera niekwalifikowane słowa,
  które są odwołaniami do kanałów lub sesji danego dostawcy. Rozpoznawanie
  zachowuje skonfigurowane wpisy katalogu przed odrzuceniem zastrzeżonych
  literałów, a następnie bezpiecznie kończy się niepowodzeniem, gdy nie ma
  dopasowania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest mechanizmem awaryjnym
  pluginu, gdy rdzeń potrzebuje ostatecznego rozpoznania należącego do dostawcy
  po normalizacji lub braku dopasowania w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za budowanie trasy
  sesji właściwej dla dostawcy po rozpoznaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji o kategorii, które powinny nastąpić
  przed wyszukiwaniem kontaktów lub grup.
- Używaj `looksLikeId` do sprawdzania, czy wartość należy „traktować jako jawny
  lub natywny identyfikator celu”.
- Używaj `resolveTarget` jako właściwego dla dostawcy mechanizmu awaryjnego
  normalizacji, a nie do szerokiego przeszukiwania katalogu.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatów, wątków,
  JID-y, uchwyty i identyfikatory pokojów, przechowuj w wartościach `target`
  lub parametrach właściwych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy tworzące wpisy katalogu na podstawie konfiguracji powinny przechowywać
tę logikę w pluginie i ponownie wykorzystywać współdzielone funkcje pomocnicze
z `openclaw/plugin-sdk/directory-runtime`.

Używaj tego rozwiązania, gdy kanał potrzebuje kontaktów lub grup opartych na
konfiguracji, takich jak:

- kontakty w wiadomościach prywatnych określone przez listę dozwolonych
- skonfigurowane mapowania kanałów lub grup
- statyczne mechanizmy awaryjne katalogu ograniczone do konta

Współdzielone funkcje pomocnicze w `directory-runtime` obsługują wyłącznie
operacje ogólne:

- filtrowanie zapytań
- stosowanie limitów
- funkcje pomocnicze deduplikacji i normalizacji
- budowanie `ChannelDirectoryEntry[]`

Właściwe dla kanału sprawdzanie kont i normalizacja identyfikatorów powinny
pozostać w implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do wnioskowania za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje w
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin jest właścicielem właściwych dla dostawcy
identyfikatorów modeli, domyślnych bazowych adresów URL lub metadanych modeli
dostępnych po uwierzytelnieniu.

`catalog.order` określa, kiedy katalog pluginu jest scalany względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy używający klucza API lub zmiennych środowiskowych
- `profile`: dostawcy pojawiający się, gdy istnieją profile uwierzytelniania
- `paired`: dostawcy tworzący wiele powiązanych wpisów dostawców
- `late`: ostatni przebieg, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają w przypadku kolizji kluczy, dzięki czemu pluginy
mogą celowo zastępować wpis wbudowanego dostawcy o tym samym identyfikatorze
dostawcy.

Pluginy mogą również publikować wiersze modeli tylko do odczytu za pomocą
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Jest to docelowa ścieżka dla powierzchni list, pomocy i selektorów,
obsługująca wiersze `text`, `voice`, `image_generation`, `video_generation`
i `music_generation`. Pluginy dostawców nadal odpowiadają za wywołania
aktywnych punktów końcowych, wymianę tokenów i mapowanie odpowiedzi dostawców;
rdzeń odpowiada za wspólny kształt wiersza, etykiety źródeł i formatowanie
pomocy narzędzi multimedialnych. Rejestracje dostawców generowania multimediów
automatycznie tworzą statyczne wiersze katalogu z `defaultModel`, `models`
i `capabilities`.

Zgodność:

- `discovery` nadal działa jako starszy alias, ale emituje ostrzeżenie o wycofaniu
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa
  `catalog` i emituje ostrzeżenie
- `augmentModelCatalog` jest przestarzałe; wbudowani dostawcy powinni publikować
  dodatkowe wiersze przez `registerModelCatalogProvider`

## Inspekcja kanału tylko do odczytu

Jeśli plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką środowiska uruchomieniowego. Może zakładać,
  że poświadczenia są w pełni zmaterializowane, i natychmiast zgłaszać błąd,
  gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`,
  `openclaw status --all`, `openclaw channels status`,
  `openclaw channels resolve`, a także przepływy naprawy przez doctor lub
  konfigurację, nie powinny wymagać materializowania poświadczeń środowiska
  uruchomieniowego wyłącznie w celu opisania konfiguracji.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj wyłącznie opisowy stan konta.
- Zachowaj `enabled` i `configured`.
- W stosownych przypadkach uwzględniaj pola źródła/stanu danych uwierzytelniających, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać nieprzetworzonych wartości tokenów wyłącznie po to, aby zgłosić dostępność w trybie tylko do odczytu. Zwrócenie `tokenStatus: "available"` (oraz odpowiadającego mu pola źródła) wystarcza w poleceniach wyświetlających stan.
- Użyj `configured_unavailable`, gdy dane uwierzytelniające są skonfigurowane za pośrednictwem SecretRef, ale niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą zgłaszać „skonfigurowano, ale dane są niedostępne w tej ścieżce polecenia”, zamiast ulegać awarii lub błędnie informować, że konto nie jest skonfigurowane.

## Pakiety rozszerzeń

Katalog pluginu może zawierać plik `package.json` z polem `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się pluginem. Jeśli pakiet zawiera wiele rozszerzeń, identyfikator pluginu przyjmuje postać `<manifestOrPackageName>/<fileBase>` (identyfikator manifestu ma pierwszeństwo, jeśli istnieje; w przeciwnym razie używana jest nazwa bez zakresu z pliku `package.json`).

Jeśli plugin importuje zależności npm, zainstaluj je w tym katalogu, aby katalog `node_modules` był dostępny (`npm install` / `pnpm install`).

Zabezpieczenie: po rozwiązaniu dowiązań symbolicznych każdy wpis `openclaw.extensions` musi pozostawać w katalogu pluginu. Wpisy wychodzące poza katalog pakietu są odrzucane.

Uwaga dotycząca bezpieczeństwa: polecenie `openclaw plugins install` instaluje zależności pluginu za pomocą lokalnego dla projektu polecenia `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia i bez zależności programistycznych w środowisku uruchomieniowym), ignorując odziedziczone globalne ustawienia instalacji npm. Utrzymuj drzewa zależności pluginu jako „czysty JS/TS” i unikaj pakietów wymagających kompilacji przez `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł używany wyłącznie podczas konfiguracji. Gdy OpenClaw potrzebuje powierzchni konfiguracyjnych wyłączonego pluginu kanału albo gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry` zamiast pełnego punktu wejścia pluginu. Zmniejsza to obciążenie podczas uruchamiania i konfiguracji, gdy główny punkt wejścia pluginu rejestruje również narzędzia, punkty zaczepienia lub inny kod używany wyłącznie w środowisku uruchomieniowym.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` pozwala pluginowi kanału korzystać z tej samej ścieżki `setupEntry` podczas fazy uruchamiania Gateway przed rozpoczęciem nasłuchiwania, nawet jeśli kanał jest już skonfigurowany.

Używaj tej opcji tylko wtedy, gdy `setupEntry` w pełni obsługuje powierzchnię uruchamiania, która musi istnieć przed rozpoczęciem nasłuchiwania przez Gateway. W praktyce oznacza to, że konfiguracyjny punkt wejścia musi rejestrować każdą funkcję należącą do kanału, od której zależy uruchamianie, na przykład:

- samą rejestrację kanału
- wszystkie trasy HTTP, które muszą być dostępne przed rozpoczęciem nasłuchiwania przez Gateway
- wszystkie metody Gateway, narzędzia lub usługi, które muszą istnieć w tym samym przedziale czasu

Jeśli pełny punkt wejścia nadal odpowiada za jakąkolwiek wymaganą funkcję uruchamiania, nie włączaj tej flagi. Pozostaw domyślne zachowanie pluginu i pozwól OpenClaw załadować pełny punkt wejścia podczas uruchamiania.

Wbudowane kanały mogą również udostępniać pomocnicze elementy powierzchni kontraktu używane wyłącznie podczas konfiguracji, z których rdzeń może korzystać przed załadowaniem pełnego środowiska uruchomieniowego kanału. Bieżąca powierzchnia promowania konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń korzysta z tej powierzchni, gdy musi przekształcić starszą, jednokontową konfigurację kanału do postaci `channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu. Obecnie wbudowanym przykładem jest Matrix: gdy istnieją już nazwane konta, przenosi on do nazwanego, utworzonego w wyniku przekształcenia konta wyłącznie klucze uwierzytelniania i inicjalizacji, a ponadto może zachować skonfigurowany, niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć `accounts.default`.

Te adaptery poprawek konfiguracji utrzymują leniwe wykrywanie wbudowanej powierzchni kontraktu. Czas importowania pozostaje krótki; powierzchnia promowania jest ładowana dopiero przy pierwszym użyciu, zamiast ponownie uruchamiać procedurę startową wbudowanego kanału podczas importowania modułu.

Gdy te powierzchnie uruchamiania obejmują metody RPC Gateway, umieszczaj je pod prefiksem właściwym dla pluginu. Przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze są rozwiązywane do `operator.admin`, nawet jeśli plugin żąda węższego zakresu.

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

Pluginy kanałów mogą ogłaszać metadane konfiguracji/wykrywania za pośrednictwem `openclaw.channel`, a wskazówki instalacyjne za pośrednictwem `openclaw.install`. Dzięki temu rdzeń nie musi zawierać danych katalogowych.

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

Przydatne pola `openclaw.channel` wykraczające poza minimalny przykład:

- `detailLabel`: etykieta dodatkowa dla bardziej rozbudowanych powierzchni katalogu/stanu
- `docsLabel`: zastępuje tekst odnośnika do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, nad którymi ten wpis katalogu powinien mieć pierwszeństwo
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: elementy sterujące treścią powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown na potrzeby decyzji dotyczących formatowania wiadomości wychodzących
- `exposure.configured`: po ustawieniu na `false` ukrywa kanał na powierzchniach list skonfigurowanych kanałów
- `exposure.setup`: po ustawieniu na `false` ukrywa kanał w interaktywnych selektorach konfiguracji
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny na potrzeby powierzchni nawigacyjnych dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane w celu zachowania zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta, nawet jeśli istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń

OpenClaw może również scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM). Umieść plik JSON w jednej z następujących lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Możesz również ustawić `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na jeden lub więcej plików JSON (rozdzielonych przecinkiem, średnikiem lub separatorem `PATH`). Każdy plik powinien zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje również `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacyjnego dostawców udostępniają znormalizowane informacje o źródle instalacji obok nieprzetworzonego bloku `openclaw.install`. Znormalizowane informacje wskazują, czy specyfikacja npm jest dokładną wersją, czy zmiennym selektorem, czy obecne są oczekiwane metadane integralności oraz czy dostępna jest również lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana, znormalizowane informacje ostrzegają, jeśli przeanalizowana nazwa pakietu npm różni się od tej tożsamości. Ostrzegają również, gdy `defaultChoice` jest nieprawidłowe albo wskazuje niedostępne źródło oraz gdy metadane integralności npm występują bez prawidłowego źródła npm. Konsumenci powinni traktować `installSource` jako dodatkowe, opcjonalne pole, aby ręcznie tworzone wpisy i warstwy zgodności katalogu nie musiały go syntetyzować.
Dzięki temu proces wdrażania i diagnostyka mogą objaśniać stan warstwy źródeł bez importowania środowiska uruchomieniowego pluginu.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładną wartość `npmSpec` wraz z `expectedIntegrity`. Same nazwy pakietów i znaczniki dystrybucji nadal działają w celu zachowania zgodności, ale powodują wyświetlanie ostrzeżeń warstwy źródeł, dzięki czemu katalog może przechodzić na przypięte instalacje ze sprawdzaniem integralności bez naruszania działania istniejących pluginów. Gdy proces wdrażania instaluje z lokalnej ścieżki katalogu, zapisuje zarządzany wpis indeksu pluginów z `source: "path"` oraz, jeśli to możliwe, ścieżką `sourcePath` względną wobec obszaru roboczego. Bezwzględna operacyjna ścieżka ładowania pozostaje w `plugins.load.paths`; rekord instalacji nie powiela ścieżek lokalnej stacji roboczej w długotrwałej konfiguracji. Dzięki temu lokalne instalacje programistyczne pozostają widoczne dla diagnostyki warstwy źródeł bez dodawania drugiej powierzchni ujawniania nieprzetworzonych ścieżek systemu plików. Utrwalona tabela SQLite `installed_plugin_index` jest źródłem prawdy o źródle instalacji i może być odświeżana bez ładowania modułów środowiska uruchomieniowego pluginów. Jej mapa `installRecords` jest trwała nawet wtedy, gdy manifest pluginu jest nieobecny lub nieprawidłowy; jej ładunek `plugins` jest możliwym do odtworzenia widokiem manifestów.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu odpowiadają za koordynację kontekstu sesji podczas pobierania, składania i Compaction. Zarejestruj je z poziomu pluginu za pomocą `api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik za pomocą `plugins.slots.contextEngine`.

Użyj tego mechanizmu, gdy plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu, a nie jedynie dodać przeszukiwanie pamięci lub punkty zaczepienia.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Fabryka udostępnia za pośrednictwem `ctx` opcjonalne wartości `config`, `agentDir` i `workspaceDir` do inicjalizacji podczas tworzenia.

Metoda `assemble()` może zwrócić `contextProjection`, gdy aktywna infrastruktura wykonawcza korzysta z trwałego wątku zaplecza. Pomiń to pole w przypadku starszej projekcji wykonywanej dla każdej tury. Zwróć `{ mode: "thread_bootstrap", epoch }`, gdy złożony kontekst powinien zostać jednorazowo wstrzyknięty do wątku zaplecza i używany ponownie do czasu zmiany epoki. Zmień epokę po zmianie semantycznego kontekstu silnika, na przykład po przebiegu Compaction zarządzanym przez silnik. Hosty mogą zachowywać metadane wywołań narzędzi, kształt danych wejściowych i zredagowane wyniki narzędzi w projekcji inicjalizacji wątku, aby nowe wątki zaplecza zachowywały ciągłość użycia narzędzi bez kopiowania nieprzetworzonych ładunków zawierających dane poufne.

Jeśli silnik **nie** odpowiada za algorytm Compaction, zachowaj implementację `compact()` i jawnie ją deleguj:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Dodawanie nowej funkcji

Gdy Plugin wymaga zachowania, którego nie obsługuje obecne API, nie omijaj
systemu Pluginów przez prywatny dostęp do jego wnętrza. Dodaj brakującą funkcję.

Zalecana kolejność:

1. **Zdefiniuj kontrakt rdzenia.** Określ, za jakie współdzielone zachowanie powinien odpowiadać rdzeń:
   zasady, mechanizm rezerwowy, scalanie konfiguracji, cykl życia, semantykę udostępnianą kanałom oraz
   strukturę pomocniczych funkcji środowiska wykonawczego.
2. **Dodaj typowane powierzchnie rejestracji Pluginów i środowiska wykonawczego.** Rozszerz
   `OpenClawPluginApi` lub `api.runtime` o najmniejszą użyteczną, typowaną
   powierzchnię funkcji.
3. **Połącz rdzeń z odbiorcami kanałów i funkcji.** Kanały i Pluginy funkcji
   powinny korzystać z nowej funkcji za pośrednictwem rdzenia, zamiast bezpośrednio
   importować implementację dostawcy.
4. **Zarejestruj implementacje dostawców.** Następnie Pluginy dostawców rejestrują
   swoje backendy dla tej funkcji.
5. **Dodaj testy kontraktu.** Dodaj testy, aby odpowiedzialność i sposób rejestracji
   pozostawały z czasem jawne.

W ten sposób OpenClaw zachowuje własne założenia projektowe bez sztywnego
uzależniania się od sposobu postrzegania świata przez jednego dostawcę. Konkretną listę kontrolną plików
i kompletny przykład znajdziesz w [Przewodniku po funkcjach](/pl/plugins/adding-capabilities).

### Lista kontrolna funkcji

Po dodaniu nowej funkcji implementacja powinna zwykle obejmować łącznie następujące
powierzchnie:

- typy kontraktu rdzenia w `src/<capability>/types.ts`
- moduł uruchamiający lub funkcję pomocniczą środowiska wykonawczego rdzenia w `src/<capability>/runtime.ts`
- powierzchnię rejestracji API Pluginów w `src/plugins/types.ts`
- połączenia rejestru Pluginów w `src/plugins/registry.ts`
- udostępnienie środowiska wykonawczego Pluginów w `src/plugins/runtime/*`, gdy Pluginy funkcji lub kanałów
  muszą z niego korzystać
- funkcje pomocnicze do przechwytywania i testowania w `src/test-utils/plugin-registration.ts`
- asercje odpowiedzialności i kontraktu w `src/plugins/contracts/registry.ts`
- dokumentację dla operatorów i Pluginów w `docs/`

Brak jednej z tych powierzchni zwykle oznacza, że funkcja nie została jeszcze
w pełni zintegrowana.

### Szablon funkcji

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

Wzorzec testu kontraktu (`src/plugins/contracts/registry.ts` udostępnia wyszukiwanie
odpowiedzialności, takie jak `providerContractPluginIds`; testy sprawdzają, czy lista
`contracts.videoGenerationProviders` danego Pluginu odpowiada temu, co faktycznie rejestruje):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Dzięki temu reguła pozostaje prosta:

- rdzeń odpowiada za kontrakt funkcji i koordynację
- Pluginy dostawców odpowiadają za implementacje dostawców
- Pluginy funkcji i kanałów korzystają z funkcji pomocniczych środowiska wykonawczego
- testy kontraktu zachowują jawność odpowiedzialności

## Powiązane materiały

- [Architektura Pluginów](/pl/plugins/architecture) — publiczny model funkcji i ich struktury
- [Ścieżki podrzędne zestawu SDK Pluginów](/pl/plugins/sdk-subpaths)
- [Konfiguracja zestawu SDK Pluginów](/pl/plugins/sdk-setup)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
