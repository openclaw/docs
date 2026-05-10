---
read_when:
    - Implementowanie hooków środowiska uruchomieniowego dostawcy, cyklu życia kanału lub zestawów pakietów
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne mechanizmy architektury Plugin: potok ładowania, rejestr, hooki środowiska uruchomieniowego, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Dla publicznego modelu możliwości, struktur pluginów oraz kontraktów
własności/wykonywania zobacz [Architektura Plugin](/pl/plugins/architecture). Ta
strona jest dokumentacją referencyjną mechanizmów wewnętrznych: potoku
ładowania, rejestru, hooków środowiska wykonawczego, tras HTTP Gateway, ścieżek
importu i tabel schematów.

## Potok ładowania

Przy starcie OpenClaw robi mniej więcej to:

1. odkrywa kandydujące katalogi główne pluginów
2. odczytuje manifesty natywnych lub zgodnych pakietów oraz metadane pakietu
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane, dołączone moduły używają natywnego
   mechanizmu ładowania; lokalny kod źródłowy TypeScript pluginów zewnętrznych
   używa awaryjnego mechanizmu zapasowego Jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr poleceniom i powierzchniom środowiska wykonawczego

<Note>
`activate` jest starszym aliasem dla `register` – mechanizm ładowania rozwiązuje ten, który jest obecny (`def.register ?? def.activate`), i wywołuje go w tym samym punkcie. Wszystkie dołączone pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonywaniem środowiska
wykonawczego. Kandydaci są blokowani, gdy wpis wychodzi poza katalog główny
pluginu, ścieżka jest zapisywalna przez wszystkich albo własność ścieżki
wygląda podejrzanie w przypadku pluginów niedołączonych.

Zablokowani kandydaci pozostają powiązani ze swoim identyfikatorem pluginu na
potrzeby diagnostyki. Jeśli konfiguracja nadal odwołuje się do tego
identyfikatora, walidacja zgłasza plugin jako obecny, ale zablokowany, i
wskazuje ostrzeżenie dotyczące bezpieczeństwa ścieżki zamiast traktować wpis
konfiguracji jako nieaktualny.

### Zachowanie oparte najpierw na manifeście

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikowania pluginu
- odkrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości
  pakietu
- walidowania `plugins.entries.<id>.config`
- uzupełniania etykiet i tekstów zastępczych interfejsu sterowania
- pokazywania metadanych instalacji/katalogu
- zachowywania lekkich deskryptorów aktywacji i konfiguracji wstępnej bez
  ładowania środowiska wykonawczego pluginu

W przypadku pluginów natywnych moduł środowiska wykonawczego jest częścią
płaszczyzny danych. Rejestruje rzeczywiste zachowania, takie jak hooki,
narzędzia, polecenia lub przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie
sterowania. Są deskryptorami wyłącznie metadanych do planowania aktywacji i
odkrywania konfiguracji wstępnej; nie zastępują rejestracji środowiska
wykonawczego, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz podpowiedzi manifestu
dotyczących poleceń, kanałów i dostawców, aby zawęzić ładowanie pluginów przed
szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów, które posiadają żądane polecenie główne
- rozwiązywanie konfiguracji kanału/pluginu zawęża się do pluginów, które
  posiadają żądany identyfikator kanału
- jawne rozwiązywanie konfiguracji/środowiska wykonawczego dostawcy zawęża się
  do pluginów, które posiadają żądany identyfikator dostawcy
- planowanie startu Gateway używa `activation.onStartup` do jawnych importów
  przy starcie i wyłączeń z ładowania przy starcie; pluginy bez metadanych
  startowych ładują się tylko przez węższe wyzwalacze aktywacji

Wstępne ładowania środowiska wykonawczego w czasie obsługi żądania, które proszą
o szeroki zakres `all`, nadal wyprowadzają jawny, efektywny zbiór
identyfikatorów pluginów z konfiguracji, planowania startu, skonfigurowanych
kanałów, slotów i reguł automatycznego włączania. Jeśli ten wyprowadzony zbiór
jest pusty, OpenClaw ładuje pusty rejestr środowiska wykonawczego zamiast
rozszerzać zakres do każdego wykrywalnego pluginu.

Planista aktywacji udostępnia zarówno API tylko z identyfikatorami dla
istniejących wywołujących, jak i API planu dla nowej diagnostyki. Wpisy planu
raportują, dlaczego plugin został wybrany, oddzielając jawne podpowiedzi
planisty `activation.*` od zapasowego ustalania własności z manifestu, takich jak
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki. Ten podział powodów jest granicą kompatybilności:
istniejące metadane pluginów nadal działają, a nowy kod może wykrywać szerokie
podpowiedzi albo zachowanie zapasowe bez zmieniania semantyki ładowania
środowiska wykonawczego.

Odkrywanie konfiguracji wstępnej preferuje teraz identyfikatory posiadane przez
deskryptory, takie jak `setup.providers` i `setup.cliBackends`, aby zawęzić
kandydujące pluginy, zanim wróci do `setup-api` dla pluginów, które nadal
potrzebują hooków środowiska wykonawczego w czasie konfiguracji wstępnej. Listy
konfiguracji dostawcy używają manifestu `providerAuthChoices`, wyborów
konfiguracji wyprowadzonych z deskryptorów oraz metadanych katalogu instalacji
bez ładowania środowiska wykonawczego dostawcy. Jawne
`setup.requiresRuntime: false` stanowi odcięcie wyłącznie na poziomie
deskryptora; pominięte `requiresRuntime` zachowuje starszy mechanizm zapasowy
`setup-api` dla kompatybilności. Jeśli więcej niż jeden odkryty plugin deklaruje
ten sam znormalizowany identyfikator dostawcy konfiguracji wstępnej lub zaplecza
CLI, wyszukiwanie konfiguracji odmawia niejednoznacznego właściciela zamiast
polegać na kolejności odkrywania. Gdy środowisko wykonawcze konfiguracji
wstępnej faktycznie się uruchamia, diagnostyka rejestru raportuje rozjazd między
`setup.providers` / `setup.cliBackends` a dostawcami lub zapleczami CLI
zarejestrowanymi przez setup-api bez blokowania starszych pluginów.

### Granica pamięci podręcznej Plugin

OpenClaw nie buforuje wyników odkrywania pluginów ani bezpośrednich danych
rejestru manifestu za oknami czasu zegarowego. Instalacje, edycje manifestu i
zmiany ścieżek ładowania muszą być widoczne przy następnym jawnym odczycie
metadanych lub przebudowie migawki. Parser pliku manifestu może utrzymywać
ograniczoną pamięć podręczną sygnatur plików kluczowaną ścieżką otwartego
manifestu, inode, rozmiarem i znacznikami czasu; ta pamięć podręczna jedynie
pozwala uniknąć ponownego parsowania niezmienionych bajtów i nie może buforować
odpowiedzi dotyczących odkrywania, rejestru, właściciela ani polityki.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektów, a nie ukryta
pamięć podręczna. Gorące ścieżki startu Gateway powinny przekazywać bieżący
`PluginMetadataSnapshot`, wyprowadzoną `PluginLookUpTable` albo jawny rejestr
manifestów przez łańcuch wywołań. Walidacja konfiguracji, automatyczne włączanie
przy starcie, inicjalizacja pluginów i wybór dostawcy mogą ponownie używać tych
obiektów, dopóki reprezentują bieżącą konfigurację i inwentarz pluginów.
Wyszukiwanie konfiguracji wstępnej nadal rekonstruuje metadane manifestu na
żądanie, chyba że dana ścieżka konfiguracji otrzyma jawny rejestr manifestów;
traktuj to jako zapasową ścieżkę zimną zamiast dodawać ukryte pamięci podręczne
wyszukiwania. Gdy dane wejściowe się zmieniają, przebuduj i zastąp migawkę
zamiast ją mutować albo przechowywać kopie historyczne.
Widoki oparte na aktywnym rejestrze pluginów i pomocnicze funkcje inicjalizacji
dołączonych kanałów powinny być przeliczane z bieżącego rejestru/katalogu
głównego. Krótkotrwałe mapy mogą istnieć w obrębie pojedynczego wywołania, aby
deduplikować pracę lub chronić przed ponownym wejściem; nie mogą stać się
procesowymi pamięciami podręcznymi metadanych.

W przypadku ładowania pluginów warstwą trwałej pamięci podręcznej jest ładowanie
środowiska wykonawczego. Może ono ponownie używać stanu mechanizmu ładowania,
gdy kod lub zainstalowane artefakty są faktycznie ładowane, na przykład:

- `PluginLoaderCacheState` i zgodnych aktywnych rejestrów środowiska
  wykonawczego
- pamięci podręcznych jiti/modułów oraz pamięci podręcznych mechanizmu ładowania
  powierzchni publicznej używanych, aby uniknąć wielokrotnego importowania tej
  samej powierzchni środowiska wykonawczego
- pamięci podręcznych systemu plików dla zainstalowanych artefaktów pluginów
- krótkotrwałych map na wywołanie do normalizacji ścieżek lub rozwiązywania
  duplikatów

Te pamięci podręczne są szczegółami implementacyjnymi płaszczyzny danych. Nie
mogą odpowiadać na pytania płaszczyzny sterowania, takie jak „który plugin jest
właścicielem tego dostawcy?”, chyba że wywołujący celowo poprosił o ładowanie
środowiska wykonawczego.

Nie dodawaj trwałych ani zegarowych pamięci podręcznych dla:

- wyników odkrywania
- bezpośrednich rejestrów manifestów
- rejestrów manifestów zrekonstruowanych z indeksu zainstalowanych pluginów
- wyszukiwania właściciela dostawcy, tłumienia modeli, polityki dostawcy lub
  metadanych publicznych artefaktów
- dowolnej innej odpowiedzi wyprowadzonej z manifestu, w której zmieniony
  manifest, zainstalowany indeks lub ścieżka ładowania powinny być widoczne przy
  następnym odczycie metadanych

Wywołujący, którzy odbudowują metadane manifestu z utrwalonego indeksu
zainstalowanych pluginów, rekonstruują ten rejestr na żądanie. Zainstalowany
indeks jest trwałym stanem płaszczyzny źródłowej; nie jest ukrytą,
wewnątrzprocesową pamięcią podręczną metadanych.

## Model rejestru

Załadowane pluginy nie modyfikują bezpośrednio przypadkowych zmiennych
globalnych rdzenia. Rejestrują się w centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i typowane hooki
- kanały
- dostawców
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- polecenia należące do pluginów

Funkcje rdzenia czytają potem z tego rejestru zamiast komunikować się
bezpośrednio z modułami pluginów. Dzięki temu ładowanie pozostaje
jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- środowisko wykonawcze rdzenia -> użycie rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość
powierzchni rdzenia potrzebuje tylko jednego punktu integracji: „czytaj rejestr”,
a nie „obsługuj specjalnie każdy moduł pluginu”.

## Funkcje zwrotne powiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy zatwierdzenie zostanie
rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać wywołanie funkcji
zwrotnej po zatwierdzeniu lub odrzuceniu żądania powiązania:

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

Pola ładunku funkcji zwrotnej:

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: pierwotne podsumowanie żądania, wskazówka odłączenia, identyfikator
  nadawcy i metadane konwersacji

Ta funkcja zwrotna służy wyłącznie do powiadamiania. Nie zmienia tego, kto może
powiązać konwersację, i uruchamia się po zakończeniu obsługi zatwierdzenia przez
rdzeń.

## Hooki środowiska wykonawczego dostawcy

Pluginy dostawców mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed uruchomieniem środowiska
  wykonawczego:
  `setup.providers[].envVars`, przestarzałe zgodnościowe `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki w czasie konfiguracji**: `catalog` (starsze `discovery`) plus
  `applyConfigDefaults`.
- **Hooki środowiska wykonawczego**: ponad 40 opcjonalnych hooków obejmujących
  uwierzytelnianie, rozwiązywanie modeli, opakowywanie strumienia, poziomy
  myślenia, politykę odtwarzania i punkty końcowe użycia. Pełną listę znajdziesz
  w sekcji [Kolejność i użycie hooków](#hook-order-and-usage).

OpenClaw nadal posiada ogólną pętlę agenta, przełączanie awaryjne, obsługę
transkryptu i politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla
zachowań specyficznych dla dostawcy bez potrzeby tworzenia całego niestandardowego
transportu inferencji.

Używaj manifestu `setup.providers[].envVars`, gdy dostawca ma poświadczenia
oparte na zmiennych środowiskowych, które ogólne ścieżki
uwierzytelniania/statusu/wybieraka modeli powinny widzieć bez ładowania
środowiska wykonawczego pluginu. Przestarzałe `providerAuthEnvVars` jest nadal
odczytywane przez adapter kompatybilności w okresie wycofywania, a niedołączone
pluginy, które go używają, otrzymują diagnostykę manifestu. Używaj manifestu
`providerAuthAliases`, gdy jeden identyfikator dostawcy powinien ponownie używać
zmiennych środowiskowych, profili uwierzytelniania, uwierzytelniania opartego na
konfiguracji oraz wyboru wprowadzenia klucza API innego identyfikatora dostawcy.
Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI wprowadzania/wyboru
uwierzytelniania powinny znać identyfikator wyboru dostawcy, etykiety grup i
proste okablowanie uwierzytelniania jedną flagą bez ładowania środowiska
wykonawczego dostawcy. Zachowaj `envVars` środowiska wykonawczego dostawcy dla
wskazówek widocznych dla operatora, takich jak etykiety wprowadzania albo
zmienne konfiguracji wstępnej OAuth client-id/client-secret.

Używaj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację
wstępną sterowane zmiennymi środowiskowymi, które ogólny mechanizm zapasowy
zmiennych środowiskowych powłoki, kontrole konfiguracji/statusu albo monity
konfiguracji wstępnej powinny widzieć bez ładowania środowiska wykonawczego
kanału.

### Kolejność i użycie hooków

Dla pluginów modeli/dostawców OpenClaw wywołuje hooki w mniej więcej tej
kolejności. Kolumna „Kiedy używać” jest szybkim przewodnikiem decyzyjnym.
Pola dostawcy służące wyłącznie kompatybilności, których OpenClaw już nie
wywołuje, takie jak `ProviderPlugin.capabilities` i `suppressBuiltInModel`, są
celowo pominięte.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                        | Dostawca jest właścicielem katalogu lub domyślnych wartości bazowego URL                                                                      |
| 2   | `applyConfigDefaults`             | Stosuje należące do dostawcy globalne wartości domyślne konfiguracji podczas materializacji konfiguracji       | Wartości domyślne zależą od trybu uwierzytelniania, środowiska lub semantyki rodziny modeli dostawcy                                          |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook Pluginu)_                                                                                                                  |
| 3   | `normalizeModelId`                | Normalizuje starsze aliasy lub aliasy podglądowe identyfikatorów modeli przed wyszukiwaniem                   | Dostawca odpowiada za czyszczenie aliasów przed kanonicznym rozpoznaniem modelu                                                               |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                                 | Dostawca odpowiada za czyszczenie transportu dla niestandardowych identyfikatorów dostawcy w tej samej rodzinie transportu                    |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozpoznaniem runtime/dostawcy                                        | Dostawca potrzebuje czyszczenia konfiguracji, które powinno należeć do Pluginu; dołączone pomocniki rodziny Google także zabezpieczają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywania zgodności natywnego użycia streamingu do dostawców konfiguracji                          | Dostawca potrzebuje poprawek metadanych natywnego użycia streamingu zależnych od endpointu                                                    |
| 7   | `resolveConfigApiKey`             | Rozpoznaje uwierzytelnianie znacznikiem env dla dostawców konfiguracji przed ładowaniem uwierzytelniania runtime | Dostawca ma należące do niego rozpoznawanie klucza API ze znacznika env; `amazon-bedrock` ma tu również wbudowany resolver znacznika env AWS  |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samodzielnie hostowane lub oparte na konfiguracji uwierzytelnianie bez utrwalania tekstu jawnego | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczenia                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Nakłada należące do dostawcy zewnętrzne profile uwierzytelniania; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych symboli zastępczych profili względem uwierzytelniania opartego na env/konfiguracji | Dostawca przechowuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                      |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli z upstreamu                                                                                  |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po którym `resolveDynamicModel` uruchamia się ponownie                              | Dostawca potrzebuje metadanych sieciowych przed rozpoznaniem nieznanych identyfikatorów                                                       |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozpoznanego modelu przez osadzony runner                                    | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu core                                                                     |
| 14  | `contributeResolvedModelCompat`   | Dostarcza flagi zgodności dla modeli vendorów za innym zgodnym transportem                                    | Dostawca rozpoznaje własne modele w transportach proxy bez przejmowania dostawcy                                                              |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                                | Dostawca potrzebuje czyszczenia schematów rodziny transportu                                                                                  |
| 16  | `inspectToolSchemas`              | Udostępnia należące do dostawcy diagnostyki schematów po normalizacji                                          | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia core reguł specyficznych dla dostawcy                                                |
| 17  | `resolveReasoningOutputMode`      | Wybiera natywny lub tagowany kontrakt wyjścia rozumowania                                                      | Dostawca potrzebuje tagowanego rozumowania/końcowego wyjścia zamiast pól natywnych                                                            |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji streamingu                                    | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów dla danego dostawcy                                              |
| 19  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę streamingu niestandardowym transportem                                    | Dostawca potrzebuje niestandardowego protokołu przewodowego, a nie tylko wrappera                                                             |
| 20  | `wrapStreamFn`                    | Wrapper streamingu po zastosowaniu ogólnych wrapperów                                                          | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modelu żądania bez niestandardowego transportu                                       |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu lub metadane dla danej tury                                                | Dostawca chce, aby ogólne transporty wysyłały natywną dla dostawcy tożsamość tury                                                             |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę wygaszania sesji                                               | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę fallbacku                                                      |
| 23  | `formatApiKey`                    | Formater profilu uwierzytelniania: zapisany profil staje się runtime’owym ciągiem `apiKey`                    | Dostawca przechowuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokena runtime                                |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki niepowodzenia odświeżania | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                    |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana, gdy odświeżenie OAuth się nie powiedzie                                        | Dostawca potrzebuje należących do niego wskazówek naprawy uwierzytelniania po niepowodzeniu odświeżania                                      |
| 26  | `matchesContextOverflowError`     | Należący do dostawcy matcher przepełnienia okna kontekstu                                                      | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wykryły                                                              |
| 27  | `classifyFailoverReason`          | Należąca do dostawcy klasyfikacja przyczyny failoveru                                                          | Dostawca może mapować surowe błędy API/transportu na limit szybkości/przeciążenie/itp.                                                        |
| 28  | `isCacheTtlEligible`              | Polityka cache’u promptów dla dostawców proxy/backhaul                                                         | Dostawca potrzebuje bramkowania TTL cache’u specyficznego dla proxy                                                                           |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po braku uwierzytelniania                                          | Dostawca potrzebuje specyficznej dla siebie wskazówki odzyskiwania po braku uwierzytelniania                                                  |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po odkryciu                                                     | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                     |
| 31  | `resolveThinkingProfile`          | Specyficzny dla modelu zestaw poziomów `/think`, etykiety wyświetlania i wartość domyślna                     | Dostawca udostępnia niestandardową drabinę myślenia lub etykietę binarną dla wybranych modeli                                                 |
| 32  | `isBinaryThinking`                | Hook zgodności przełącznika rozumowania włącz/wyłącz                                                           | Dostawca udostępnia tylko binarne włączanie/wyłączanie myślenia                                                                               |
| 33  | `supportsXHighThinking`           | Hook zgodności obsługi rozumowania `xhigh`                                                                     | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                              |
| 34  | `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                     | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                           |
| 35  | `isModernModelRef`                | Matcher nowoczesnego modelu dla filtrów profili live i wyboru smoke                                           | Dostawca odpowiada za dopasowywanie preferowanych modeli live/smoke                                                                           |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed inferencją                  | Dostawca potrzebuje wymiany tokena lub krótkotrwałego poświadczenia żądania                                                                   |
| 37  | `resolveUsageAuth`                | Rozwiąż poświadczenia użycia/rozliczeń dla `/usage` i powiązanych interfejsów statusu                         | Dostawca wymaga niestandardowego parsowania tokenu użycia/limitu albo innych poświadczeń użycia                                               |
| 38  | `fetchUsageSnapshot`              | Pobierz i znormalizuj specyficzne dla dostawcy migawki użycia/limitu po rozwiązaniu uwierzytelniania          | Dostawca wymaga specyficznego dla dostawcy punktu końcowego użycia albo parsera payloadu                                                      |
| 39  | `createEmbeddingProvider`         | Zbuduj należący do dostawcy adapter embeddingów dla pamięci/wyszukiwania                                      | Zachowanie embeddingów pamięci należy do plugina dostawcy                                                                                     |
| 40  | `buildReplayPolicy`               | Zwróć politykę replay kontrolującą obsługę transkrypcji dla dostawcy                                          | Dostawca wymaga niestandardowej polityki transkrypcji (na przykład usuwania bloków myślenia)                                                  |
| 41  | `sanitizeReplayHistory`           | Przepisz historię replay po ogólnym czyszczeniu transkrypcji                                                 | Dostawca wymaga specyficznych dla dostawcy przeróbek replay poza współdzielonymi helperami Compaction                                         |
| 42  | `validateReplayTurns`             | Wykonaj końcową walidację lub zmianę kształtu tur replay przed osadzonym runnerem                             | Transport dostawcy wymaga ściślejszej walidacji tur po ogólnym oczyszczaniu                                                                  |
| 43  | `onModelSelected`                 | Uruchom należące do dostawcy efekty uboczne po wyborze                                                       | Dostawca wymaga telemetrii albo należącego do dostawcy stanu, gdy model staje się aktywny                                                     |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą przez inne pluginy dostawców
obsługujące hooki, aż któryś faktycznie zmieni identyfikator modelu albo transport/konfigurację. Dzięki temu
shimy dostawców dla aliasów/zgodności działają bez wymagania, aby wywołujący wiedział, który
dołączony plugin odpowiada za przepisanie. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, nadal stosowany jest dołączony normalizator konfiguracji Google,
który wykonuje to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu komunikacyjnego lub niestandardowego wykonawcy żądań,
jest to inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowania dostawcy,
które nadal działa w normalnej pętli inferencji OpenClaw.

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

Dołączone pluginy dostawców łączą powyższe hooki, aby dopasować się do katalogu,
uwierzytelniania, myślenia, odtwarzania i potrzeb użycia każdego dostawcy. Autorytatywny zestaw hooków znajduje się przy
każdym pluginie w `extensions/`; ta strona ilustruje kształty, zamiast
odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogu przekazującego">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogli udostępniać nadrzędne
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy OAuth i punktów końcowych użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` lub `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby odpowiadać za wymianę tokenów i integrację `/usage`.
  </Accordion>
  <Accordion title="Rodziny odtwarzania i czyszczenia transkryptu">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączać
    politykę transkryptu przez `buildReplayPolicy`, zamiast aby każdy plugin
    ponownie implementował czyszczenie.
  </Accordion>
  <Accordion title="Dostawcy tylko z katalogiem">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli inferencji.
  </Accordion>
  <Accordion title="Pomocnicy strumienia specyficzni dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` i `context1m` znajdują się w publicznym
    szwie `api.ts` / `contract-api.ts` pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Pomocnicy środowiska uruchomieniowego

Pluginy mogą uzyskiwać dostęp do wybranych pomocników rdzenia przez `api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca normalny ładunek wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji rdzenia `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą ponownie próbkować/kodować dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla selektorów głosu lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

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

- Zachowaj politykę TTS, fallback i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może odpowiadać za
  dostawców tekstu, mowy, obrazów i przyszłych mediów, gdy OpenClaw doda te
  kontrakty możliwości.

Dla rozumienia obrazów/audio/wideo pluginy rejestrują jednego typowanego
dostawcę rozumienia mediów zamiast ogólnego worka klucz/wartość:

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

- Zachowaj orkiestrację, fallback, konfigurację i okablowanie kanałów w rdzeniu.
- Zachowaj zachowanie dostawcy w pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już stosuje ten sam wzorzec:
  - rdzeń odpowiada za kontrakt możliwości i pomocnika środowiska uruchomieniowego
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

Dla pomocników środowiska uruchomieniowego rozumienia mediów pluginy mogą wywoływać:

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

Do transkrypcji audio pluginy mogą używać środowiska uruchomieniowego rozumienia mediów
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

- `api.runtime.mediaUnderstanding.*` jest preferowaną współdzieloną powierzchnią dla
  rozumienia obrazów/audio/wideo.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) i kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie żaden wynik transkrypcji (na przykład pominięte/nieobsługiwane wejście).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą też uruchamiać przebiegi subagentów w tle przez `api.runtime.subagent`:

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

- `provider` i `model` są opcjonalnymi nadpisaniami dla pojedynczego przebiegu, a nie trwałymi zmianami sesji.
- OpenClaw respektuje te pola nadpisań tylko dla zaufanych wywołujących.
- Dla przebiegów fallback należących do pluginu operatorzy muszą włączyć opcję `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie dopuścić dowolny cel.
- Przebiegi subagentów niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przechodzić na fallback.
- Sesje subagentów utworzone przez plugin są oznaczane identyfikatorem tworzącego pluginu. Fallback `api.runtime.subagent.deleteSession(...)` może usuwać tylko te należące do niego sesje; dowolne usuwanie sesji nadal wymaga żądania Gateway w zakresie administratora.

Dla wyszukiwania w sieci pluginy mogą używać współdzielonego pomocnika środowiska uruchomieniowego zamiast
sięgać do okablowania narzędzi agenta:

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

Pluginy mogą też rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` jest preferowaną współdzieloną powierzchnią dla pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

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
- `listProviders(...)`: wyświetla listę dostępnych dostawców generowania obrazów i ich możliwości.

## Trasy HTTP Gateway

Pluginy mogą wystawiać punkty końcowe HTTP za pomocą `api.registerHttpRoute(...)`.

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

- `path`: ścieżka trasy pod serwerem HTTP Gateway.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania Gateway, albo `"plugin"` dla uwierzytelniania/verification Webhook zarządzanych przez plugin.
- `match`: opcjonalne. `"exact"` (domyślne) lub `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` usunięto i spowoduje błąd ładowania Plugin. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy Plugin muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden Plugin nie może zastąpić trasy innego Plugin.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Są przeznaczone do webhooków/weryfikacji podpisu zarządzanych przez Plugin, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - uwierzytelnianie bearer z sekretem współdzielonym (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras Plugin przypięte do `operator.write`, nawet jeśli wywołujący wyśle `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym wejściu) respektują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach trasy Plugin przenoszących tożsamość, zakres runtime wraca do `operator.write`
- Reguła praktyczna: nie zakładaj, że trasa Plugin z uwierzytelnianiem gateway jest niejawną powierzchnią administratora. Jeśli trasa wymaga zachowania dostępnego tylko administratorom, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK Plugin

Podczas tworzenia nowych Plugin używaj wąskich podścieżek SDK zamiast monolitycznej beczki głównej `openclaw/plugin-sdk`. Główne podścieżki:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                 |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Plugin kanałów wybierają z rodziny wąskich punktów styku — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno zostać skonsolidowane
na jednym kontrakcie `approvalCapability`, zamiast mieszać je między niepowiązanymi
polami Plugin. Zobacz [Plugin kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki runtime i konfiguracji znajdują się pod pasującymi, wyspecjalizowanymi podścieżkami `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiej beczki zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` są przestarzałymi shimami zgodności dla
starszych Plugin. Nowy kod powinien zamiast tego importować węższe ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla katalogu głównego każdego dołączonego pakietu Plugin):

- `index.js` — wejście dołączonego Plugin
- `api.js` — beczka pomocników/typów
- `runtime-api.js` — beczka wyłącznie runtime
- `setup-entry.js` — wejście Plugin konfiguracji

Zewnętrzne Plugin powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu Plugin z core ani z innego Plugin.
Punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji runtime, gdy taka
istnieje, a następnie wracają do rozwiązania pliku konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone Plugin używają ich obecnie. Nie są one
automatycznie zamrożonymi długoterminowo kontraktami zewnętrznymi — sprawdź właściwą stronę
referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzi wiadomości

Plugin powinny posiadać specyficzne dla kanału wkłady schematu `describeMessageTool(...)`
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Wspólna prezentacja wysyłania powinna używać ogólnego kontraktu `MessagePresentation`
zamiast pól przycisków, komponentów, bloków lub kart natywnych dla dostawcy.
Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły awaryjne, mapowanie dostawców i listę kontrolną autora Plugin.

Plugin zdolne do wysyłania deklarują, co mogą renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczenia

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie ujawniaj natywnych dla dostawcy furtek UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
zewnętrznych Plugin, ale nowe Plugin nie powinny ich używać.

## Rozwiązywanie celu kanału

Plugin kanałów powinny posiadać semantykę celu specyficzną dla kanału. Utrzymuj wspólnego
hosta wychodzącego jako ogólnego i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy
  wejście powinno od razu przejść do rozwiązywania podobnego do identyfikatora zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest awaryjną ścieżką Plugin, gdy
  core potrzebuje końcowego rozwiązania należącego do dostawcy po normalizacji albo po
  chybieniu katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za konstruowanie trasy sesji
  specyficzne dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategoryzujących, które powinny nastąpić przed
  wyszukiwaniem peers/grup.
- Używaj `looksLikeId` do kontroli „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do awaryjnej normalizacji specyficznej dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatów, identyfikatory wątków, JID-y, uchwyty i identyfikatory pokojów,
  trzymaj w wartościach `target` albo w parametrach specyficznych dla dostawcy, a nie w ogólnych
  polach SDK.

## Katalogi oparte na konfiguracji

Plugin, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
Plugin i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Użyj tego, gdy kanał potrzebuje peers/grup opartych na konfiguracji, takich jak:

- peers DM sterowani listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne awaryjne katalogi w zakresie konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji Plugin.

## Katalogi dostawców

Plugin dostawców mogą definiować katalogi modeli dla wnioskowania za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawcy

Używaj `catalog`, gdy Plugin posiada specyficzne dla dostawcy identyfikatory modeli, domyślne
bazowe adresy URL albo metadane modeli chronione auth.

`catalog.order` kontroluje, kiedy katalog Plugin jest scalany względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API albo env
- `profile`: dostawcy, którzy pojawiają się, gdy istnieją profile auth
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc Plugin mogą celowo nadpisać
wbudowany wpis dostawcy z tym samym identyfikatorem dostawcy.

Plugin mogą też publikować wiersze modeli tylko do odczytu przez
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. To przyszłościowa ścieżka dla powierzchni list/pomocy/wyboru i obsługuje wiersze
`text`, `image_generation`, `video_generation` oraz `music_generation`.
Plugin dostawców nadal posiadają wywołania aktywnych punktów końcowych, wymianę tokenów i mapowanie
odpowiedzi dostawców; core posiada wspólny kształt wiersza, etykiety źródeł i formatowanie pomocy
narzędzi mediów. Rejestracje dostawców generowania mediów automatycznie syntetyzują statyczne
wiersze katalogu z `defaultModel`, `models` i `capabilities`.

Zgodność:

- `discovery` nadal działa jako starszy alias, ale emituje ostrzeżenie o przestarzałości
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`
- `augmentModelCatalog` jest przestarzałe; dołączeni dostawcy powinni publikować
  dodatkowe wiersze przez `registerModelCatalogProvider`

## Inspekcja kanału tylko do odczytu

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy naprawy doctor/config
  nie powinny wymagać materializowania poświadczeń runtime tylko po to, by
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj wyłącznie opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i pasującego pola źródła)
  wystarcza dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce
polecenia” zamiast kończyć się awarią albo błędnie zgłaszać konto jako nieskonfigurowane.

## Pakiety paczek

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

Każdy wpis staje się Plugin. Jeśli paczka wymienia wiele extensions, identyfikator Plugin
staje się `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu Plugin
po rozwiązaniu symlinków. Wpisy, które wychodzą poza katalog pakietu, są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności Plugin za pomocą
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia,
bez zależności dev w runtime), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności Plugin jako „czyste JS/TS” i unikaj pakietów wymagających
kompilacji `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Plugin kanału albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia Plugin. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główne wejście Plugin podłącza także narzędzia, hooks albo inny kod wyłącznie runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć dla Plugin kanału tę samą ścieżkę `setupEntry` podczas fazy uruchamiania
Gateway przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni obejmuje powierzchnię startową, która musi istnieć,
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis setup
musi zarejestrować każdą capability należącą do kanału, od której zależy start, taką jak:

- sama rejestracja kanału
- dowolne trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- dowolne metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twój pełny wpis nadal posiada jakąkolwiek wymaganą capability startową, nie włączaj
tej flagi. Pozostaw plugin przy domyślnym zachowaniu i pozwól OpenClaw załadować
pełny wpis podczas startu.

Kanały pakietowane mogą także publikować pomocniki powierzchni kontraktu tylko dla setup, z których core
może korzystać przed załadowaniem pełnego runtime kanału. Obecna powierzchnia
promocji setup to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi wypromować starszą konfigurację kanału z jednym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego wpisu pluginu.
Matrix jest obecnym pakietowanym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego wypromowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery poprawek setup utrzymują leniwe wykrywanie pakietowanej powierzchni kontraktu. Czas
importu pozostaje lekki; powierzchnia promocji jest ładowana tylko przy pierwszym użyciu zamiast
ponownie wchodzić w start kanału pakietowanego podczas importu modułu.

Gdy te powierzchnie startowe obejmują metody RPC gateway, utrzymuj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze są rozwiązywane
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

Pluginy kanałów mogą ogłaszać metadane setup/discovery przez `openclaw.channel` oraz
wskazówki instalacyjne przez `openclaw.install`. Dzięki temu katalog core pozostaje bez danych.

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

- `detailLabel`: etykieta dodatkowa dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisuje tekst linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący markdown na potrzeby decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych selektorach setup/configure, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo ustaw `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielonych przecinkiem/średnikiem/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów oraz wpisy katalogu instalacji providerów ujawniają
znormalizowane fakty o źródle instalacji obok surowego bloku `openclaw.install`. Te
znormalizowane fakty określają, czy specyfikacja npm jest dokładną wersją, czy pływającym
selektorem, czy oczekiwane metadane integralności są obecne oraz czy dostępna jest także
lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana,
znormalizowane fakty ostrzegają, jeśli sparsowana nazwa pakietu npm odbiega od tej tożsamości.
Ostrzegają także, gdy `defaultChoice` jest nieprawidłowe lub wskazuje źródło, które
nie jest dostępne, oraz gdy metadane integralności npm są obecne bez prawidłowego
źródła npm. Konsumenci powinni traktować `installSource` jako addytywne pole opcjonalne, aby
ręcznie zbudowane wpisy i shim'y katalogu nie musiały go syntetyzować.
Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródeł bez
importowania runtime pluginu.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` oraz
`expectedIntegrity`. Same nazwy pakietów i dist-tagi nadal działają dla
zgodności, ale ujawniają ostrzeżenia płaszczyzny źródeł, aby katalog mógł przejść
w stronę przypiętych, sprawdzanych pod kątem integralności instalacji bez psucia istniejących pluginów.
Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje zarządzany wpis indeksu pluginów
z `source: "path"` oraz względnym względem workspace
`sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w
`plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej
w długotrwałej konfiguracji. Dzięki temu lokalne instalacje deweloperskie są widoczne dla
diagnostyki płaszczyzny źródeł bez dodawania drugiej surowej powierzchni ujawniania ścieżek systemu plików.
Utrwalony indeks pluginów `plugins/installs.json` jest źródłem prawdy dla instalacji
i może być odświeżany bez ładowania modułów runtime pluginów.
Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest pluginu jest brakujący lub
nieprawidłowy; jego tablica `plugins` jest odbudowywalnym widokiem manifestów.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu posiadają orkiestrację kontekstu sesji dla ingest, assembly
i Compaction. Rejestruj je z pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu,
zamiast tylko dodawać wyszukiwanie pamięci lub hooki.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

Fabryka `ctx` ujawnia opcjonalne wartości `config`, `agentDir` i `workspaceDir`
do inicjalizacji w czasie konstrukcji.

Jeśli Twój silnik **nie** posiada algorytmu Compaction, zachowaj zaimplementowane `compact()`
i deleguj je jawnie:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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

## Dodawanie nowej capability

Gdy plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu pluginów prywatnym sięganiem do środka. Dodaj brakującą capability.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie współdzielone zachowanie powinien posiadać core: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę skierowaną do kanałów oraz kształt pomocnika runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginu
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię capability.
3. podłącz core + konsumentów kanału/funkcji
   Kanały i pluginy funkcji powinny konsumować nową capability przez core,
   a nie przez bezpośrednie importowanie implementacji vendora.
4. zarejestruj implementacje vendora
   Pluginy vendora następnie rejestrują swoje backendy względem capability.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

W ten sposób OpenClaw pozostaje opiniowany, nie stając się zakodowany na sztywno pod
światopogląd jednego providera. Zobacz [Capability Cookbook](/pl/plugins/adding-capabilities),
aby uzyskać konkretną listę kontrolną plików i przepracowany przykład.

### Lista kontrolna capability

Gdy dodajesz nową capability, implementacja zwykle powinna objąć te
powierzchnie razem:

- typy kontraktu core w `src/<capability>/types.ts`
- pomocnik runner/runtime core w `src/<capability>/runtime.ts`
- powierzchnię rejestracji API pluginu w `src/plugins/types.ts`
- okablowanie rejestru pluginów w `src/plugins/registry.ts`
- ekspozycję runtime pluginu w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą ją konsumować
- pomocniki capture/test w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentację operatora/pluginu w `docs/`

Jeśli brakuje jednej z tych powierzchni, zwykle jest to znak, że capability nie jest
jeszcze w pełni zintegrowana.

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

Wzorzec testu kontraktu:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

To utrzymuje prostą zasadę:

- core posiada kontrakt capability + orkiestrację
- pluginy vendora posiadają implementacje vendora
- pluginy funkcji/kanałów konsumują pomocniki runtime
- testy kontraktu utrzymują własność jawną

## Powiązane

- [Architektura pluginów](/pl/plugins/architecture) — publiczny model capability i kształty
- [Podścieżki Plugin SDK](/pl/plugins/sdk-subpaths)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
