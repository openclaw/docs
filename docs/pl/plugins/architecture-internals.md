---
read_when:
    - Implementowanie hooków środowiska wykonawczego dostawcy, cyklu życia kanału lub paczek pakietów
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne mechanizmy architektury Plugin: potok ładowania, rejestr, haki środowiska uruchomieniowego, trasy HTTP i tabele referencyjne'
title: Wewnętrzne aspekty architektury Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Informacje o publicznym modelu możliwości, kształtach pluginów oraz kontraktach własności/wykonania znajdziesz w [Architekturze Plugin](/pl/plugins/architecture). Ta strona jest punktem odniesienia dla mechaniki wewnętrznej: potoku ładowania, rejestru, haków środowiska uruchomieniowego, tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje mniej więcej następujące kroki:

1. wykrywa katalogi główne kandydatów na pluginy
2. odczytuje natywne lub zgodne manifesty pakietów oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły w pakiecie używają natywnego loadera;
   lokalne źródła TypeScript od firm trzecich używają awaryjnego mechanizmu Jiti
7. wywołuje natywne haki `register(api)` i zbiera rejestracje w rejestrze pluginów
8. udostępnia rejestr poleceniom i powierzchniom środowiska uruchomieniowego

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje tę wartość, która jest obecna (`def.register ?? def.activate`), i wywołuje ją w tym samym miejscu. Wszystkie pluginy w pakiecie używają `register`; w nowych pluginach preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem w środowisku uruchomieniowym. Kandydaci są blokowani, gdy punkt wejścia wychodzi poza katalog główny pluginu, ścieżka jest zapisywalna globalnie albo własność ścieżki wygląda podejrzanie w przypadku pluginów spoza pakietu.

### Zachowanie oparte najpierw na manifeście

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikowania pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości pakietu
- walidowania `plugins.entries.<id>.config`
- uzupełniania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania środowiska uruchomieniowego pluginu

W przypadku pluginów natywnych moduł środowiska uruchomieniowego jest częścią płaszczyzny danych. Rejestruje faktyczne zachowania, takie jak haki, narzędzia, polecenia lub przepływy dostawcy.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania.
Są to wyłącznie deskryptory metadanych do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji w środowisku uruchomieniowym, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz podpowiedzi manifestu dotyczących poleceń, kanałów i dostawców,
aby zawęzić ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów, które są właścicielami żądanego polecenia głównego
- rozwiązywanie konfiguracji kanału/pluginu zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora kanału
- jawne rozwiązywanie konfiguracji/środowiska uruchomieniowego dostawcy zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora dostawcy
- planowanie startu Gateway używa `activation.onStartup` do jawnych importów startowych
  i rezygnacji ze startu; pluginy bez metadanych startowych ładują się tylko
  przez węższe wyzwalacze aktywacji

Wstępne ładowania środowiska uruchomieniowego w czasie żądania, które proszą o szeroki zakres `all`, nadal wyprowadzają
jawny efektywny zestaw identyfikatorów pluginów z konfiguracji, planowania startu, skonfigurowanych
kanałów, slotów i reguł automatycznego włączania. Jeśli wyprowadzony zestaw jest pusty, OpenClaw
ładuje pusty rejestr środowiska uruchomieniowego zamiast rozszerzać zakres na każdy wykrywalny
plugin.

Planer aktywacji udostępnia zarówno API tylko z identyfikatorami dla istniejących wywołujących, jak i
API planu dla nowych diagnostyk. Wpisy planu raportują, dlaczego plugin został wybrany,
oddzielając jawne podpowiedzi planera `activation.*` od awaryjnej własności z manifestu,
takiej jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i haki. Ten podział powodów jest granicą zgodności:
istniejące metadane pluginów nadal działają, a nowy kod może wykrywać szerokie podpowiedzi
lub zachowanie awaryjne bez zmieniania semantyki ładowania środowiska uruchomieniowego.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydatów na pluginy, zanim wróci do
`setup-api` dla pluginów, które nadal potrzebują haków środowiska uruchomieniowego w czasie konfiguracji. Listy
konfiguracji dostawców używają manifestu `providerAuthChoices`, wyborów konfiguracji
wyprowadzonych z deskryptora oraz metadanych katalogu instalacji bez ładowania środowiska uruchomieniowego dostawcy. Jawne
`setup.requiresRuntime: false` jest odcięciem tylko deskryptorowym; pominięte
`requiresRuntime` zachowuje starszą ścieżkę awaryjną setup-api dla zgodności. Jeśli więcej
niż jeden wykryty plugin zgłasza ten sam znormalizowany identyfikator dostawcy konfiguracji lub backendu CLI,
wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na
kolejności wykrywania. Gdy środowisko uruchomieniowe konfiguracji się wykona, diagnostyka rejestru raportuje
rozbieżności między `setup.providers` / `setup.cliBackends` a dostawcami lub backendami CLI
zarejestrowanymi przez setup-api bez blokowania starszych pluginów.

### Granica pamięci podręcznej pluginów

OpenClaw nie buforuje wyników wykrywania pluginów ani bezpośrednich danych rejestru manifestu
za oknami zegara ściennego. Instalacje, edycje manifestu i zmiany ścieżek ładowania
muszą stać się widoczne przy następnym jawnym odczycie metadanych lub przebudowie snapshotu.
Parser pliku manifestu może utrzymywać ograniczoną pamięć podręczną sygnatur plików, kluczowaną przez
otwartą ścieżkę manifestu, inode, rozmiar i znaczniki czasu; ta pamięć podręczna tylko unika
ponownego parsowania niezmienionych bajtów i nie może buforować odpowiedzi dotyczących wykrywania,
rejestru, właściciela ani zasad.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektu, a nie ukryta pamięć podręczna.
Gorące ścieżki startu Gateway powinny przekazywać bieżący `PluginMetadataSnapshot`,
wyprowadzony `PluginLookUpTable` albo jawny rejestr manifestu przez łańcuch wywołań.
Walidacja konfiguracji, automatyczne włączanie przy starcie, bootstrap pluginów i wybór dostawcy
mogą ponownie używać tych obiektów, gdy reprezentują bieżącą konfigurację i inwentarz pluginów.
Wyszukiwanie konfiguracji nadal rekonstruuje metadane manifestu na żądanie,
chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestu; zachowaj to
jako awaryjną ścieżkę zimną zamiast dodawać ukryte pamięci podręczne wyszukiwania. Gdy dane wejściowe
się zmienią, przebuduj i zastąp snapshot zamiast go mutować lub zachowywać
historyczne kopie.
Widoki aktywnego rejestru pluginów i pomocniki bootstrapu kanałów w pakiecie
powinny być przeliczane z bieżącego rejestru/katalogu głównego. Krótkotrwałe mapy są w porządku
wewnątrz jednego wywołania do deduplikacji pracy lub ochrony przed ponownym wejściem; nie mogą stać się procesowymi
pamięciami podręcznymi metadanych.

W przypadku ładowania pluginów trwałą warstwą pamięci podręcznej jest ładowanie środowiska uruchomieniowego. Może ona ponownie używać
stanu loadera, gdy kod lub zainstalowane artefakty są faktycznie ładowane, takie jak:

- `PluginLoaderCacheState` i zgodne aktywne rejestry środowiska uruchomieniowego
- pamięci podręczne jiti/modułów oraz pamięci podręczne loadera powierzchni publicznej używane do unikania
  wielokrotnego importowania tej samej powierzchni środowiska uruchomieniowego
- pamięci podręczne systemu plików dla zainstalowanych artefaktów pluginów
- krótkotrwałe mapy na wywołanie do normalizacji ścieżek lub rozwiązywania duplikatów

Te pamięci podręczne są szczegółami implementacji płaszczyzny danych. Nie mogą odpowiadać na
pytania płaszczyzny sterowania, takie jak „który plugin jest właścicielem tego dostawcy?”, chyba że
wywołujący celowo poprosił o ładowanie środowiska uruchomieniowego.

Nie dodawaj trwałych ani opartych na zegarze ściennym pamięci podręcznych dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestu
- rejestrów manifestu rekonstruowanych z indeksu zainstalowanych pluginów
- wyszukiwania właściciela dostawcy, tłumienia modelu, zasad dostawcy lub metadanych artefaktów publicznych
- jakiejkolwiek innej odpowiedzi wyprowadzonej z manifestu, w której zmieniony manifest, zainstalowany indeks
  lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy przebudowują metadane manifestu z utrwalonego indeksu zainstalowanych pluginów,
rekonstruują ten rejestr na żądanie. Zainstalowany indeks jest trwałym
stanem płaszczyzny źródłowej; nie jest ukrytą wewnątrzprocesową pamięcią podręczną metadanych.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali core. Rejestrują się w
centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze haki i haki typowane
- kanały
- dostawców
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do pluginów

Funkcje core odczytują potem z tego rejestru zamiast rozmawiać bezpośrednio z modułami pluginów.
Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- środowisko uruchomieniowe core -> użycie rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje tylko
jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy
moduł pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy zgoda zostanie rozstrzygnięta.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu
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

Pola payloadu callbacku:

- `status`: `"approved"` albo `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` albo `"deny"`
- `binding`: rozwiązane powiązanie dla zatwierdzonych żądań
- `request`: pierwotne podsumowanie żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane konwersacji

Ten callback służy tylko do powiadamiania. Nie zmienia tego, kto może wiązać
konwersację, i uruchamia się po zakończeniu obsługi zatwierdzenia przez core.

## Haki środowiska uruchomieniowego dostawcy

Pluginy dostawców mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed środowiskiem uruchomieniowym:
  `setup.providers[].envVars`, przestarzała zgodność `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Haki czasu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Haki środowiska uruchomieniowego**: ponad 40 opcjonalnych haków obejmujących uwierzytelnianie, rozwiązywanie modeli,
  opakowywanie strumieni, poziomy myślenia, zasady odtwarzania i endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność haków i użycie](#hook-order-and-usage).

OpenClaw nadal jest właścicielem ogólnej pętli agenta, failoveru, obsługi transkryptu i
zasad narzędzi. Te haki są powierzchnią rozszerzeń dla zachowań specyficznych dla dostawcy
bez potrzeby tworzenia całego niestandardowego transportu inferencji.

Użyj manifestu `setup.providers[].envVars`, gdy dostawca ma poświadczenia oparte na env,
które ogólne ścieżki uwierzytelniania/statusu/wyboru modelu powinny widzieć bez
ładowania środowiska uruchomieniowego pluginu. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez
adapter zgodności w okresie wycofywania, a pluginy spoza pakietu,
które go używają, otrzymują diagnostykę manifestu. Użyj manifestu `providerAuthAliases`,
gdy jeden identyfikator dostawcy powinien ponownie używać zmiennych env, profili uwierzytelniania,
uwierzytelniania opartego na konfiguracji i wyboru onboardingu klucza API innego identyfikatora dostawcy. Użyj manifestu
`providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru uwierzytelniania powinny znać
identyfikator wyboru dostawcy, etykiety grup i proste okablowanie uwierzytelniania jedną flagą bez
ładowania środowiska uruchomieniowego dostawcy. Zachowaj `envVars` środowiska uruchomieniowego dostawcy
dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne konfiguracji
client-id/client-secret OAuth.

Użyj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowane przez env, które
ogólna awaryjna ścieżka shell-env, kontrole konfiguracji/statusu lub prompty konfiguracji powinny widzieć
bez ładowania środowiska uruchomieniowego kanału.

### Kolejność haków i użycie

W przypadku pluginów modeli/dostawców OpenClaw wywołuje haki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” jest krótkim przewodnikiem decyzyjnym.
Pola dostawcy służące wyłącznie zgodności, których OpenClaw już nie wywołuje, takie jak
`ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie są
tutaj wymienione.

| #   | Hook                              | Co robi                                                                                                       | Kiedy używać                                                                                                                                  |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca posiada katalog lub domyślne wartości bazowego URL                                                                                   |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne wartości konfiguracji należące do dostawcy podczas materializacji konfiguracji      | Domyślne wartości zależą od trybu uwierzytelniania, env lub semantyki rodziny modeli dostawcy                                                 |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje standardowej ścieżki rejestru/katalogu                                             | _(nie hook Plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                | Normalizuje starsze lub podglądowe aliasy identyfikatorów modeli przed wyszukiwaniem                         | Dostawca odpowiada za czyszczenie aliasów przed kanonicznym rozwiązywaniem modelu                                                             |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                               | Dostawca odpowiada za czyszczenie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                  |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/dostawcy                                    | Dostawca potrzebuje czyszczenia konfiguracji, które powinno znajdować się w Plugin; dołączone pomocniki rodziny Google także zabezpieczają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywania zgodności natywnego użycia strumieniowania do dostawców konfiguracji                   | Dostawca potrzebuje poprawek metadanych natywnego użycia strumieniowania zależnych od endpointu                                               |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie przez marker env dla dostawców konfiguracji przed ładowaniem uwierzytelniania runtime | Dostawca ma własne rozwiązywanie klucza API przez marker env; `amazon-bedrock` ma tu także wbudowany resolver markerów env AWS                |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samohostowane lub oparte na konfiguracji uwierzytelnianie bez utrwalania tekstu jawnego    | Dostawca może działać z syntetycznym/lokalnym markerem poświadczeń                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych symboli zastępczych profili względem uwierzytelniania opartego na env/konfiguracji | Dostawca zapisuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                        |
| 11  | `resolveDynamicModel`             | Synchroniczna ścieżka awaryjna dla identyfikatorów modeli należących do dostawcy, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                     |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzewanie, po którym `resolveDynamicModel` uruchamia się ponownie                           | Dostawca potrzebuje metadanych sieciowych przed rozwiązywaniem nieznanych identyfikatorów                                                     |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez osadzony runner                                  | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu core                                                                     |
| 14  | `contributeResolvedModelCompat`   | Wnosi flagi zgodności dla modeli dostawcy za innym zgodnym transportem                                       | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                             |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                               | Dostawca potrzebuje czyszczenia schematów rodziny transportu                                                                                  |
| 16  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                        | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia core reguł specyficznych dla dostawcy                                               |
| 17  | `resolveReasoningOutputMode`      | Wybiera natywny lub tagowany kontrakt wyjścia rozumowania                                                     | Dostawca potrzebuje tagowanego rozumowania/końcowego wyjścia zamiast pól natywnych                                                            |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji strumienia                                    | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów dla danego dostawcy                                              |
| 19  | `createStreamFn`                  | W pełni zastępuje normalną ścieżkę strumienia niestandardowym transportem                                    | Dostawca potrzebuje niestandardowego protokołu przewodowego, a nie tylko wrappera                                                             |
| 20  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu ogólnych wrapperów                                                         | Dostawca potrzebuje wrapperów zgodności nagłówków/ciała/modelu żądania bez niestandardowego transportu                                       |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu dla każdej tury                                              | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub zasady schładzania sesji                                               | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub zasady awaryjne                                                         |
| 23  | `formatApiKey`                    | Formatter profilu uwierzytelniania: zapisany profil staje się runtime ciągiem `apiKey`                       | Dostawca zapisuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokena runtime                                   |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub zasad niepowodzeń odświeżania   | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                    |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawy dołączana, gdy odświeżanie OAuth się nie powiedzie                                          | Dostawca potrzebuje własnych wskazówek naprawy uwierzytelniania po niepowodzeniu odświeżania                                                 |
| 26  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                    | Dostawca ma surowe błędy przepełnienia, które ogólne heurystyki by pominęły                                                                   |
| 27  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                                         | Dostawca może mapować surowe błędy API/transportu na limit szybkości/przeciążenie/itp.                                                        |
| 28  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                            | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                             |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po brakującym uwierzytelnianiu                                    | Dostawca potrzebuje wskazówki odzyskiwania brakującego uwierzytelniania specyficznej dla dostawcy                                            |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po odkryciu                                                    | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                     |
| 31  | `resolveThinkingProfile`          | Zestaw poziomów `/think` specyficzny dla modelu, etykiety wyświetlania i wartość domyślna                     | Dostawca udostępnia niestandardową drabinę myślenia lub etykietę binarną dla wybranych modeli                                                 |
| 32  | `isBinaryThinking`                | Hook zgodności przełącznika rozumowania wł./wył.                                                              | Dostawca udostępnia tylko binarne myślenie wł./wył.                                                                                           |
| 33  | `supportsXHighThinking`           | Hook zgodności obsługi rozumowania `xhigh`                                                                    | Dostawca chce `xhigh` tylko w podzbiorze modeli                                                                                               |
| 34  | `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                    | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                           |
| 35  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów profilu live i wyboru smoke                                           | Dostawca odpowiada za dopasowywanie preferowanych modeli live/smoke                                                                           |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed inferencją                 | Dostawca potrzebuje wymiany tokena lub krótkotrwałego poświadczenia żądania                                                                   |
| 37  | `resolveUsageAuth`                | Rozstrzyga dane uwierzytelniające użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                                     | Dostawca potrzebuje niestandardowego parsowania tokenów użycia/limitów albo innego poświadczenia użycia                                                               |
| 38  | `fetchUsageSnapshot`              | Pobiera i normalizuje specyficzne dla dostawcy migawki użycia/limitów po rozstrzygnięciu uwierzytelnienia                             | Dostawca potrzebuje specyficznego dla dostawcy punktu końcowego użycia albo parsera ładunku                                                                           |
| 39  | `createEmbeddingProvider`         | Buduje należący do dostawcy adapter embeddingów dla pamięci/wyszukiwania                                                     | Zachowanie embeddingów pamięci należy do Plugin dostawcy                                                                                    |
| 40  | `buildReplayPolicy`               | Zwraca politykę odtwarzania kontrolującą obsługę transkrypcji dla dostawcy                                        | Dostawca potrzebuje niestandardowej polityki transkrypcji (na przykład usuwania bloków myślenia)                                                               |
| 41  | `sanitizeReplayHistory`           | Przepisuje historię odtwarzania po ogólnym czyszczeniu transkrypcji                                                        | Dostawca potrzebuje specyficznych dla dostawcy przekształceń odtwarzania wykraczających poza współdzielone pomocniki Compaction                                                             |
| 42  | `validateReplayTurns`             | Przeprowadza końcową walidację lub zmianę kształtu tur odtwarzania przed osadzonym runnerem                                           | Transport dostawcy wymaga bardziej rygorystycznej walidacji tur po ogólnym oczyszczeniu                                                                    |
| 43  | `onModelSelected`                 | Uruchamia należące do dostawcy efekty uboczne po wyborze                                                                 | Dostawca potrzebuje telemetrii albo stanu należącego do dostawcy, gdy model staje się aktywny                                                                  |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców
obsługujące hooki, aż któryś faktycznie zmieni identyfikator modelu albo transport/konfigurację. Dzięki temu
aliasy/kompatybilne shimy dostawców działają bez wymogu, aby wywołujący wiedział, który
dołączony Plugin odpowiada za przepisanie. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, nadal zostanie zastosowany dołączony normalizator konfiguracji Google
wykonujący to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu przesyłania lub niestandardowego wykonawcy żądań,
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

Dołączone Pluginy dostawców łączą powyższe hooki, aby dopasować się do potrzeb katalogu,
uwierzytelniania, rozumowania, odtwarzania i użycia każdego dostawcy. Autorytatywny zestaw hooków znajduje się przy
każdym Pluginie w `extensions/`; ta strona ilustruje kształty zamiast
odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogów przekazujących">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogli udostępniać nadrzędne
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy punktów końcowych OAuth i użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` lub `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby odpowiadać za wymianę tokenów i integrację `/usage`.
  </Accordion>
  <Accordion title="Rodziny czyszczenia odtwarzania i transkryptów">
    Wspólne nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączać
    politykę transkryptu przez `buildReplayPolicy`, zamiast aby każdy Plugin
    ponownie implementował czyszczenie.
  </Accordion>
  <Accordion title="Dostawcy tylko katalogu">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` oraz
    `volcengine` rejestrują tylko `catalog` i korzystają ze wspólnej pętli inferencji.
  </Accordion>
  <Accordion title="Pomocniki strumienia specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` oraz `context1m` znajdują się w publicznej granicy
    `api.ts` / `contract-api.ts` Pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Pomocniki środowiska wykonawczego

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
- Używa konfiguracji `messages.tts` rdzenia oraz wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą ponownie próbkować/kodować dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla selektorów głosu lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak ustawienia regionalne, płeć i tagi osobowości dla selektorów świadomych dostawcy.
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

- Zachowaj politykę TTS, mechanizm awaryjny i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może odpowiadać za
  dostawców tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw doda te
  kontrakty możliwości.

Do rozumienia obrazu/audio/wideo Pluginy rejestrują jednego typowanego
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

- Zachowaj orkiestrację, mechanizm awaryjny, konfigurację i okablowanie kanałów w rdzeniu.
- Zachowaj zachowanie dostawcy w Pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już działa według tego samego wzorca:
  - rdzeń odpowiada za kontrakt możliwości i pomocnik środowiska wykonawczego
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

Dla pomocników środowiska wykonawczego rozumienia mediów Pluginy mogą wywoływać:

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

Do transkrypcji audio Pluginy mogą używać albo środowiska wykonawczego rozumienia mediów,
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

- `api.runtime.mediaUnderstanding.*` jest preferowaną wspólną powierzchnią do
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) i kolejności mechanizmów awaryjnych dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie żadne wyjście transkrypcji (na przykład pominięte/nieobsługiwane wejście).
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
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla przebiegów awaryjnych należących do Pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Przebiegi subagentów niezaufanych Pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho wracać do wartości domyślnej.
- Sesje subagentów utworzone przez Plugin są oznaczane identyfikatorem tworzącego Pluginu. Awaryjne `api.runtime.subagent.deleteSession(...)` może usuwać tylko te posiadane sesje; dowolne usuwanie sesji nadal wymaga żądania Gateway z zakresem administratora.

Dla wyszukiwania w sieci Pluginy mogą używać wspólnego pomocnika środowiska wykonawczego zamiast
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

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i wspólną semantykę żądań w rdzeniu.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` jest preferowaną wspólną powierzchnią dla Pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzi agenta.

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
- `listProviders(...)`: wyświetl listę dostępnych dostawców generowania obrazów oraz ich możliwości.

## Trasy HTTP Gateway

Pluginy mogą udostępniać punkty końcowe HTTP przez `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania Gateway, albo `"plugin"` dla uwierzytelniania/weryfikacji Webhook zarządzanych przez Plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy pluginu muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Zachowuj łańcuchy przejść `exact`/`prefix` wyłącznie na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów środowiska uruchomieniowego operatora. Służą do zarządzanych przez plugin webhooków/weryfikacji podpisów, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu środowiska uruchomieniowego żądania Gateway, ale ten zakres jest celowo konserwatywny:
  - uwierzytelnianie bearer za pomocą współdzielonego sekretu (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy środowiska uruchomieniowego tras pluginu przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym wejściu) respektują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` nie ma w tych żądaniach tras pluginu przenoszących tożsamość, zakres środowiska uruchomieniowego wraca do `operator.write`
- Reguła praktyczna: nie zakładaj, że trasa pluginu z uwierzytelnianiem gateway jest niejawną powierzchnią administratora. Jeśli Twoja trasa wymaga zachowania dostępnego tylko dla administratora, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia nowych pluginów używaj wąskich podścieżek SDK zamiast monolitycznego
głównego barrela `openclaw/plugin-sdk`. Podścieżki podstawowe:

| Podścieżka                          | Przeznaczenie                                      |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji pluginu                      |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                 |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich powierzchni — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno konsolidować się
na jednym kontrakcie `approvalCapability`, zamiast mieszać niepowiązane
pola pluginu. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki środowiska uruchomieniowego i konfiguracji znajdują się pod dopasowanymi, skupionymi podścieżkami
`*-runtime` (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiego barrela zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` są przestarzałymi shimami zgodności dla
starszych pluginów. Nowy kod powinien zamiast tego importować węższe ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla katalogu głównego każdego dołączonego pakietu pluginu):

- `index.js` — wejście dołączonego pluginu
- `api.js` — barrel pomocników/typów
- `runtime-api.js` — barrel tylko dla środowiska uruchomieniowego
- `setup-entry.js` — wejście pluginu konfiguracji

Pluginy zewnętrzne powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu pluginu z core ani z innego pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji środowiska uruchomieniowego, gdy taka
istnieje, a następnie wracają do rozwiązanego pliku konfiguracji na dysku.

Podścieżki właściwe dla funkcji, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone pluginy używają ich obecnie. Nie są one
automatycznie długoterminowo zamrożonymi kontraktami zewnętrznymi — sprawdź odpowiednią stronę
referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzi wiadomości

Pluginy powinny posiadać właściwe dla kanału wkłady schematu `describeMessageTool(...)`
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłki powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły awaryjne, mapowanie dostawców i listę kontrolną autora pluginu.

Pluginy zdolne do wysyłania deklarują, co mogą renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczania

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy awaryjnych wyjść UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
pluginów firm trzecich, ale nowe pluginy nie powinny ich używać.

## Rozwiązywanie celów kanału

Pluginy kanałów powinny posiadać właściwą dla kanału semantykę celów. Utrzymuj współdzielony
host wychodzący jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` albo `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informuje core, czy
  wejście powinno od razu przejść do rozwiązywania podobnego do id zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest awaryjną ścieżką pluginu, gdy
  core potrzebuje końcowego rozwiązywania należącego do dostawcy po normalizacji albo po
  chybieniu katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za właściwą dla dostawcy konstrukcję
  trasy sesji po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorii, które powinny nastąpić przed
  wyszukiwaniem peers/grup.
- Używaj `looksLikeId` do sprawdzeń „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do awaryjnej normalizacji właściwej dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Zachowuj natywne dla dostawcy identyfikatory, takie jak identyfikatory czatów, identyfikatory wątków, JID, handles i identyfikatory pokojów,
  wewnątrz wartości `target` albo parametrów właściwych dla dostawcy, nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Użyj tego, gdy kanał potrzebuje peers/grup opartych na konfiguracji, takich jak:

- peers DM sterowane listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne awaryjne wpisy katalogu ograniczone do konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Właściwa dla kanału inspekcja konta i normalizacja id powinny pozostać w
implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do wnioskowania za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawcy

Używaj `catalog`, gdy plugin posiada właściwe dla dostawcy id modeli, domyślne
adresy bazowe URL albo metadane modeli chronione uwierzytelnianiem.

`catalog.order` kontroluje, kiedy katalog pluginu scala się względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API albo env
- `profile`: dostawcy, którzy pojawiają się, gdy istnieją profile auth
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo zastąpić
wbudowany wpis dostawcy o tym samym id dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką środowiska uruchomieniowego. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i szybko kończyć błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy naprawy doctor/config
  nie powinny potrzebować materializować poświadczeń środowiska uruchomieniowego tylko po to, aby
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby zgłosić dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (oraz odpowiadającego pola
  source) wystarcza dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Pozwala to poleceniom tylko do odczytu zgłaszać „skonfigurowane, ale niedostępne w tej ścieżce
polecenia” zamiast ulegać awarii albo błędnie raportować konto jako nieskonfigurowane.

## Pakiety zbiorcze

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

Każdy wpis staje się pluginem. Jeśli pakiet zbiorczy zawiera wiele extensions, id pluginu
staje się `name/<fileBase>`.

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginu za pomocą
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia,
bez zależności deweloperskich w środowisku uruchomieniowym), ignorując dziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów, które wymagają
buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać na lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główne wejście pluginu podpina także narzędzia, hooki albo inny kod wyłącznie
dla środowiska uruchomieniowego.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć dla pluginu kanału tę samą ścieżkę `setupEntry` podczas fazy uruchamiania gatewaya
przed rozpoczęciem nasłuchiwania, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
przed rozpoczęciem nasłuchiwania przez gateway. W praktyce oznacza to, że wejście konfiguracji
musi zarejestrować każdą należącą do kanału możliwość, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszystkie trasy HTTP, które muszą być dostępne przed rozpoczęciem nasłuchiwania przez gateway
- wszystkie metody, narzędzia lub usługi gateway, które muszą istnieć w tym samym oknie czasowym

Jeśli pełne wejście nadal posiada jakąkolwiek wymaganą możliwość uruchamiania, nie włączaj
tej flagi. Zachowaj domyślne zachowanie pluginu i pozwól OpenClaw załadować
pełne wejście podczas uruchamiania.

Dołączone kanały mogą również publikować pomocniki powierzchni kontraktu tylko do konfiguracji, z których core
może skorzystać przed załadowaniem pełnego środowiska uruchomieniowego kanału. Obecna powierzchnia
promowania konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tego interfejsu, gdy musi wypromować starszą konfigurację kanału z jednym kontem do `channels.<id>.accounts.*` bez ładowania pełnego wpisu Plugin. Matrix jest bieżącym przykładem dołączonym do pakietu: przenosi tylko klucze uwierzytelniania/bootstrappingu do nazwanego, wypromowanego konta, gdy nazwane konta już istnieją, i może zachować skonfigurowany, niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć `accounts.default`.

Te adaptery łatek konfiguracji utrzymują leniwe wykrywanie dołączonego interfejsu kontraktu. Czas importu pozostaje krótki; interfejs promocji jest ładowany dopiero przy pierwszym użyciu, zamiast ponownie wchodzić w uruchamianie dołączonego kanału podczas importu modułu.

Gdy te interfejsy startowe obejmują metody RPC Gateway, trzymaj je pod prefiksem specyficznym dla Plugin. Przestrzenie nazw administracyjnych core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do `operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

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

Pluginy kanałów mogą ogłaszać metadane konfiguracji/wykrywania przez `openclaw.channel` oraz wskazówki instalacyjne przez `openclaw.install`. Dzięki temu katalog core pozostaje wolny od danych.

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

- `detailLabel`: etykieta dodatkowa dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: zastępuje tekst linku do dokumentacji
- `preferOver`: identyfikatory Plugin/kanału o niższym priorytecie, nad którymi ten wpis katalogu powinien mieć pierwszeństwo
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał z powierzchni list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych selektorów konfiguracji, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów ogłoszeń

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo skieruj `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na jeden lub więcej plików JSON (rozdzielonych przecinkiem/średnikiem/`PATH`). Każdy plik powinien zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje również `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji dostawców udostępniają znormalizowane fakty o źródle instalacji obok surowego bloku `openclaw.install`. Znormalizowane fakty określają, czy specyfikacja npm jest dokładną wersją czy selektorem pływającym, czy oczekiwane metadane integralności są obecne oraz czy dostępna jest także lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana, znormalizowane fakty ostrzegają, jeśli przeanalizowana nazwa pakietu npm odbiega od tej tożsamości. Ostrzegają także, gdy `defaultChoice` jest nieprawidłowe lub wskazuje źródło, które nie jest dostępne, oraz gdy metadane integralności npm są obecne bez prawidłowego źródła npm. Konsumenci powinni traktować `installSource` jako addytywne pole opcjonalne, aby ręcznie tworzone wpisy i warstwy zgodności katalogu nie musiały go syntetyzować. Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródeł bez importowania środowiska uruchomieniowego Plugin.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` oraz `expectedIntegrity`. Same nazwy pakietów i tagi dystrybucji nadal działają dla zgodności, ale pokazują ostrzeżenia płaszczyzny źródeł, aby katalog mógł zmierzać w stronę przypiętych instalacji ze sprawdzoną integralnością bez psucia istniejących pluginów. Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje zarządzany wpis indeksu pluginów z `source: "path"` i względnym względem workspace `sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w `plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej w długowiecznej konfiguracji. Dzięki temu instalacje deweloperskie lokalne pozostają widoczne dla diagnostyki płaszczyzny źródeł bez dodawania drugiej powierzchni ujawniania surowych ścieżek systemu plików. Utrwalony indeks pluginów `plugins/installs.json` jest źródłem prawdy o źródłach instalacji i można go odświeżać bez ładowania modułów środowiska uruchomieniowego Plugin. Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest Plugin jest brakujący lub nieprawidłowy; jego tablica `plugins` jest odtwarzalnym widokiem manifestów.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu są właścicielami orkiestracji kontekstu sesji dla ingestii, składania i Compaction. Zarejestruj je ze swojego Plugin przez `api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik za pomocą `plugins.slots.contextEngine`.

Użyj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu, zamiast tylko dodawać wyszukiwanie pamięci albo hooki.

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

Fabryka `ctx` udostępnia opcjonalne wartości `config`, `agentDir` i `workspaceDir` do inicjalizacji w czasie konstrukcji.

Jeśli Twój silnik **nie** jest właścicielem algorytmu Compaction, pozostaw `compact()` zaimplementowane i deleguj je jawnie:

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

Gdy Plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie obchodź systemu pluginów prywatnym sięganiem do środka. Dodaj brakującą capability.

Zalecana kolejność:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie współdzielone zachowanie powinno należeć do core: polityka, fallback, scalanie konfiguracji, cykl życia, semantyka widoczna dla kanałów i kształt pomocnika środowiska uruchomieniowego.
2. dodaj typowane interfejsy rejestracji/środowiska uruchomieniowego Plugin
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszy użyteczny typowany interfejs capability.
3. podłącz core oraz konsumentów kanału/funkcji
   Kanały i pluginy funkcji powinny konsumować nową capability przez core, a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują następnie swoje backendy względem capability.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

Tak OpenClaw pozostaje opiniotwórczy, ale nie zostaje sztywno zakodowany pod światopogląd jednego dostawcy. Zobacz [Książkę kucharską capability](/pl/plugins/architecture), aby uzyskać konkretną listę kontrolną plików i przepracowany przykład.

### Lista kontrolna capability

Gdy dodajesz nową capability, implementacja zwykle powinna jednocześnie dotykać tych powierzchni:

- typy kontraktu core w `src/<capability>/types.ts`
- pomocnik runnera/środowiska uruchomieniowego core w `src/<capability>/runtime.ts`
- interfejs rejestracji API Plugin w `src/plugins/types.ts`
- okablowanie rejestru Plugin w `src/plugins/registry.ts`
- ekspozycja środowiska uruchomieniowego Plugin w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów muszą ją konsumować
- pomocniki przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Plugin w `docs/`

Jeśli jednej z tych powierzchni brakuje, zwykle oznacza to, że capability nie jest jeszcze w pełni zintegrowana.

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

Dzięki temu reguła pozostaje prosta:

- core jest właścicielem kontraktu capability i orkiestracji
- pluginy dostawców są właścicielami implementacji dostawców
- pluginy funkcji/kanałów konsumują pomocniki środowiska uruchomieniowego
- testy kontraktu utrzymują jawną własność

## Powiązane

- [Architektura Plugin](/pl/plugins/architecture) — publiczny model capability i kształty
- [Podścieżki Plugin SDK](/pl/plugins/sdk-subpaths)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
