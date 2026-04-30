---
read_when:
    - Implementowanie hooków środowiska wykonawczego dostawcy, cyklu życia kanału lub zestawów pakietów
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne mechanizmy architektury Plugin: potok ładowania, rejestr, punkty zaczepienia środowiska uruchomieniowego, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Plugin
x-i18n:
    generated_at: "2026-04-30T10:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Informacje o publicznym modelu możliwości, kształtach pluginów oraz kontraktach własności/wykonywania znajdziesz w [architekturze Plugin](/pl/plugins/architecture). Ta strona jest dokumentacją referencyjną mechanizmów wewnętrznych: potoku ładowania, rejestru, hooków środowiska uruchomieniowego, tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje mniej więcej te kroki:

1. wykrywa katalogi główne kandydatów na pluginy
2. odczytuje natywne lub zgodne manifesty pakietów oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. ustala włączenie dla każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły dołączone używają natywnego loadera;
   niezbudowane natywne pluginy używają jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje w rejestrze pluginów
8. udostępnia rejestr poleceniom i powierzchniom środowiska uruchomieniowego

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje tę funkcję, która jest dostępna (`def.register ?? def.activate`), i wywołuje ją w tym samym momencie. Wszystkie dołączone pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem środowiska uruchomieniowego. Kandydaci są blokowani, gdy punkt wejścia wychodzi poza katalog główny pluginu, ścieżka jest zapisywalna dla wszystkich albo własność ścieżki wygląda podejrzanie w przypadku pluginów niedołączonych.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikowania pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości pakietu
- walidowania `plugins.entries.<id>.config`
- uzupełniania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania środowiska uruchomieniowego pluginu

W przypadku pluginów natywnych moduł środowiska uruchomieniowego jest częścią płaszczyzny danych. Rejestruje rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy providerów.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania. Są wyłącznie deskryptorami metadanych do planowania aktywacji i wykrywania konfiguracji; nie zastępują rejestracji środowiska uruchomieniowego, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz wskazówek z manifestu dotyczących poleceń, kanałów i providerów, aby zawęzić ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów będących właścicielami żądanego polecenia głównego
- rozwiązywanie konfiguracji/pluginu kanału zawęża się do pluginów będących właścicielami żądanego
  identyfikatora kanału
- jawne rozwiązywanie konfiguracji/środowiska uruchomieniowego providera zawęża się do pluginów będących właścicielami żądanego
  identyfikatora providera
- planowanie startu Gateway używa `activation.onStartup` dla jawnych importów startowych
  i rezygnacji ze startu; każdy plugin powinien to deklarować, gdy OpenClaw
  odchodzi od niejawnych importów startowych, natomiast pluginy bez statycznych
  metadanych możliwości i bez `activation.onStartup` nadal używają
  przestarzałego awaryjnego niejawnego sidecara startowego dla zgodności

Planer aktywacji udostępnia zarówno API zawierające tylko identyfikatory dla istniejących wywołujących, jak i API planu dla nowych diagnostyk. Wpisy planu raportują, dlaczego plugin został wybrany, oddzielając jawne wskazówki planera `activation.*` od awaryjnego ustalania własności z manifestu, takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki. Ten podział przyczyn jest granicą zgodności: istniejące metadane pluginów nadal działają, a nowy kod może wykrywać szerokie wskazówki lub zachowanie awaryjne bez zmieniania semantyki ładowania środowiska uruchomieniowego.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak `setup.providers` i `setup.cliBackends`, aby zawęzić pluginy kandydujące, zanim wróci do `setup-api` dla pluginów, które nadal potrzebują hooków środowiska uruchomieniowego w czasie konfiguracji. Listy konfiguracji providerów używają manifestu `providerAuthChoices`, wyborów konfiguracji pochodzących z deskryptorów oraz metadanych katalogu instalacji bez ładowania środowiska uruchomieniowego providera. Jawne `setup.requiresRuntime: false` jest punktem odcięcia wyłącznie opartym na deskryptorze; pominięte `requiresRuntime` zachowuje starszy fallback `setup-api` dla zgodności. Jeśli więcej niż jeden wykryty plugin zgłasza ten sam znormalizowany identyfikator providera konfiguracji lub backendu CLI, wyszukiwanie konfiguracji odmawia niejednoznacznego właściciela zamiast polegać na kolejności wykrywania. Gdy środowisko uruchomieniowe konfiguracji faktycznie się wykonuje, diagnostyka rejestru raportuje rozbieżności między `setup.providers` / `setup.cliBackends` a providerami lub backendami CLI zarejestrowanymi przez setup-api, bez blokowania starszych pluginów.

### Granica pamięci podręcznej pluginów

OpenClaw nie buforuje wyników wykrywania pluginów ani bezpośrednich danych rejestru manifestów za oknami zegara ściennego. Instalacje, edycje manifestu i zmiany ścieżek ładowania muszą być widoczne przy następnym jawnym odczycie metadanych lub przebudowie migawki. Parser pliku manifestu może utrzymywać ograniczoną pamięć podręczną sygnatur plików kluczowaną otwartą ścieżką manifestu, inode, rozmiarem i znacznikami czasu; ta pamięć podręczna jedynie unika ponownego parsowania niezmienionych bajtów i nie może buforować odpowiedzi dotyczących wykrywania, rejestru, właściciela ani polityki.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektów, a nie ukryta pamięć podręczna. Gorące ścieżki startu Gateway powinny przekazywać bieżący `PluginMetadataSnapshot`, pochodny `PluginLookUpTable` albo jawny rejestr manifestów przez łańcuch wywołań. Walidacja konfiguracji, automatyczne włączanie przy starcie, bootstrap pluginu i wybór providera mogą ponownie używać tych obiektów, dopóki reprezentują bieżącą konfigurację i inwentarz pluginów. Wyszukiwanie konfiguracji nadal rekonstruuje metadane manifestu na żądanie, chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestów; zachowaj to jako fallback zimnej ścieżki zamiast dodawać ukryte pamięci podręczne wyszukiwania. Gdy dane wejściowe się zmieniają, przebuduj i zastąp migawkę zamiast ją mutować lub przechowywać kopie historyczne.
Widoki aktywnego rejestru pluginów i pomocniki bootstrapu dołączonych kanałów powinny być przeliczane z bieżącego rejestru/katalogu głównego. Krótkotrwałe mapy w obrębie jednego wywołania są w porządku do deduplikowania pracy lub ochrony przed ponownym wejściem; nie mogą stać się procesowymi pamięciami podręcznymi metadanych.

Dla ładowania pluginów trwałą warstwą pamięci podręcznej jest ładowanie środowiska uruchomieniowego. Może ona ponownie używać stanu loadera, gdy kod lub zainstalowane artefakty są faktycznie ładowane, na przykład:

- `PluginLoaderCacheState` i zgodne aktywne rejestry środowiska uruchomieniowego
- pamięci podręczne jiti/modułów oraz pamięci podręczne loaderów powierzchni publicznych używane do unikania wielokrotnego importowania tej samej powierzchni środowiska uruchomieniowego
- lustra zależności środowiska uruchomieniowego i pamięci podręczne systemu plików dla zainstalowanych artefaktów pluginów
- krótkotrwałe mapy na wywołanie do normalizacji ścieżek lub rozwiązywania duplikatów

Te pamięci podręczne są szczegółami implementacyjnymi płaszczyzny danych. Nie mogą odpowiadać na pytania płaszczyzny sterowania, takie jak „który plugin jest właścicielem tego providera?”, chyba że wywołujący celowo poprosił o ładowanie środowiska uruchomieniowego.

Nie dodawaj trwałych ani opartych na zegarze ściennym pamięci podręcznych dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestów
- rejestrów manifestów rekonstruowanych z indeksu zainstalowanych pluginów
- wyszukiwania właściciela providera, tłumienia modelu, polityki providera lub metadanych artefaktu publicznego
- jakiejkolwiek innej odpowiedzi pochodzącej z manifestu, gdzie zmieniony manifest, zainstalowany indeks
  lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy przebudowują metadane manifestu z utrwalonego indeksu zainstalowanych pluginów, rekonstruują ten rejestr na żądanie. Zainstalowany indeks jest trwałym stanem płaszczyzny źródłowej; nie jest ukrytą metadanych pamięcią podręczną w procesie.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali rdzenia. Rejestrują się w centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i typowane hooki
- kanały
- providerów
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do pluginów

Funkcje rdzenia odczytują następnie z tego rejestru zamiast rozmawiać bezpośrednio z modułami pluginów. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- środowisko uruchomieniowe rdzenia -> użycie rejestru

Ten rozdział ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia potrzebuje tylko jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą zareagować, gdy zatwierdzenie zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu żądania powiązania:

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

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie pierwotnego żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane konwersacji

Ten callback służy wyłącznie do powiadomień. Nie zmienia tego, kto może wiązać konwersację, i działa po zakończeniu obsługi zatwierdzeń przez rdzeń.

## Hooki środowiska uruchomieniowego providera

Pluginy providerów mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed środowiskiem uruchomieniowym:
  `setup.providers[].envVars`, przestarzała zgodność `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) plus
  `applyConfigDefaults`.
- **Hooki środowiska uruchomieniowego**: ponad 40 opcjonalnych hooków obejmujących uwierzytelnianie, rozwiązywanie modeli,
  opakowywanie strumieni, poziomy myślenia, politykę odtwarzania i endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność i użycie hooków](#hook-order-and-usage).

OpenClaw nadal posiada ogólną pętlę agenta, failover, obsługę transkrypcji i politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla providera bez potrzeby tworzenia całego niestandardowego transportu inferencji.

Użyj manifestu `setup.providers[].envVars`, gdy provider ma poświadczenia oparte na zmiennych środowiskowych, które ogólne ścieżki uwierzytelniania/statusu/wyboru modelu powinny widzieć bez ładowania środowiska uruchomieniowego pluginu. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez adapter zgodności w okresie deprecjacji, a niedołączone pluginy, które go używają, otrzymują diagnostykę manifestu. Użyj manifestu `providerAuthAliases`, gdy jeden identyfikator providera powinien ponownie używać zmiennych środowiskowych, profili uwierzytelniania, uwierzytelniania opartego na konfiguracji i wyboru onboardingu klucza API innego identyfikatora providera. Użyj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru uwierzytelniania powinny znać identyfikator wyboru providera, etykiety grup i proste okablowanie uwierzytelniania jedną flagą bez ładowania środowiska uruchomieniowego providera. Zachowaj `envVars` środowiska uruchomieniowego providera dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne konfiguracji OAuth client-id/client-secret.

Użyj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowane zmiennymi środowiskowymi, które ogólny fallback shell-env, kontrole konfiguracji/statusu albo prompty konfiguracji powinny widzieć bez ładowania środowiska uruchomieniowego kanału.

### Kolejność i użycie hooków

W przypadku pluginów modelu/providera OpenClaw wywołuje hooki w tej przybliżonej kolejności.
Kolumna „Kiedy używać” jest krótkim przewodnikiem decyzyjnym.
Pola providera tylko dla zgodności, których OpenClaw już nie wywołuje, takie jak
`ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie są tutaj wymienione.

| #   | Hak                               | Co robi                                                                                                      | Kiedy używać                                                                                                                                      |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy w `models.providers` podczas generowania `models.json`                      | Dostawca posiada katalog lub domyślne wartości bazowego adresu URL                                                                                |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne wartości konfiguracji należące do dostawcy podczas materializacji konfiguracji     | Domyślne wartości zależą od trybu uwierzytelniania, środowiska lub semantyki rodziny modeli dostawcy                                             |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                  | _(nie jest hakiem Plugin)_                                                                                                                        |
| 3   | `normalizeModelId`                | Normalizuje starsze lub poglądowe aliasy identyfikatorów modeli przed wyszukiwaniem                          | Dostawca odpowiada za porządkowanie aliasów przed kanonicznym rozwiązaniem modelu                                                                |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                              | Dostawca odpowiada za porządkowanie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                   |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązaniem środowiska wykonawczego/dostawcy                     | Dostawca potrzebuje porządkowania konfiguracji, które powinno należeć do Plugin; dołączone helpery z rodziny Google także zabezpieczają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje natywne przepisywanie zgodności użycia strumieniowego do dostawców konfiguracji                      | Dostawca potrzebuje poprawek metadanych natywnego użycia strumieniowego zależnych od endpointu                                                   |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie znacznikiem środowiskowym dla dostawców konfiguracji przed ładowaniem uwierzytelniania środowiska wykonawczego | Dostawca ma własne rozwiązywanie klucza API znacznikiem środowiskowym; `amazon-bedrock` ma tu także wbudowany resolver znacznika środowiskowego AWS |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samoobsługowe lub oparte na konfiguracji uwierzytelnianie bez utrwalania zwykłego tekstu  | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                             |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych placeholderów profili za uwierzytelnianiem opartym na środowisku/konfiguracji | Dostawca zapisuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                            |
| 11  | `resolveDynamicModel`             | Synchroniczna rezerwa dla identyfikatorów modeli należących do dostawcy, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                        |
| 12  | `prepareDynamicModel`             | Asynchroniczne przygotowanie, po którym `resolveDynamicModel` uruchamia się ponownie                         | Dostawca potrzebuje metadanych z sieci przed rozwiązaniem nieznanych identyfikatorów                                                             |
| 13  | `normalizeResolvedModel`          | Ostateczne przepisywanie przed użyciem rozwiązanego modelu przez osadzony runner                             | Dostawca potrzebuje przepisywania transportu, ale nadal używa transportu rdzenia                                                                 |
| 14  | `contributeResolvedModelCompat`   | Dostarcza flagi zgodności dla modeli dostawcy za innym zgodnym transportem                                   | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                                |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                              | Dostawca potrzebuje porządkowania schematów dla rodziny transportu                                                                               |
| 16  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                        | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                               |
| 17  | `resolveReasoningOutputMode`      | Wybiera natywny albo oznaczony kontrakt wyjścia rozumowania                                                   | Dostawca potrzebuje oznaczonego rozumowania/wyjścia końcowego zamiast natywnych pól                                                             |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji strumienia                                   | Dostawca potrzebuje domyślnych parametrów żądania lub porządkowania parametrów dla konkretnego dostawcy                                         |
| 19  | `createStreamFn`                  | W pełni zastępuje zwykłą ścieżkę strumienia niestandardowym transportem                                      | Dostawca potrzebuje niestandardowego protokołu przewodowego, a nie tylko wrappera                                                               |
| 20  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu ogólnych wrapperów                                                        | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modelu żądania bez niestandardowego transportu                                         |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu dla pojedynczej tury                                        | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                                    |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę schładzania sesji                                            | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę rezerwową                                                        |
| 23  | `formatApiKey`                    | Formater profilu uwierzytelniania: zapisany profil staje się ciągiem `apiKey` środowiska wykonawczego        | Dostawca zapisuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokenu środowiska wykonawczego                    |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki niepowodzeń odświeżania | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                       |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawy dołączana po niepowodzeniu odświeżania OAuth                                               | Dostawca potrzebuje własnych wskazówek naprawy uwierzytelniania po niepowodzeniu odświeżania                                                    |
| 26  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                    | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wykryły                                                                |
| 27  | `classifyFailoverReason`          | Klasyfikacja przyczyny przełączenia awaryjnego należąca do dostawcy                                          | Dostawca może mapować surowe błędy API/transportu na limit szybkości/przeciążenie/itp.                                                         |
| 28  | `isCacheTtlEligible`              | Polityka cache promptów dla dostawców proxy/backhaul                                                         | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                               |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po brakującym uwierzytelnieniu                                    | Dostawca potrzebuje wskazówki odzyskiwania po brakującym uwierzytelnieniu specyficznej dla dostawcy                                            |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                   | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                       |
| 31  | `resolveThinkingProfile`          | Zestaw poziomów `/think` specyficzny dla modelu, etykiety wyświetlania i wartość domyślna                    | Dostawca udostępnia niestandardową drabinę myślenia lub etykietę binarną dla wybranych modeli                                                  |
| 32  | `isBinaryThinking`                | Hak zgodności przełącznika rozumowania włącz/wyłącz                                                          | Dostawca udostępnia tylko binarne myślenie włącz/wyłącz                                                                                         |
| 33  | `supportsXHighThinking`           | Hak zgodności obsługi rozumowania `xhigh`                                                                    | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                                |
| 34  | `resolveDefaultThinkingLevel`     | Hak zgodności domyślnego poziomu `/think`                                                                    | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                             |
| 35  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów profili live i wyboru smoke                                          | Dostawca odpowiada za dopasowywanie preferowanych modeli live/smoke                                                                            |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz środowiska wykonawczego tuż przed inferencją | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                    |
| 37  | `resolveUsageAuth`                | Ustal poświadczenia użycia/rozliczeń dla `/usage` i powiązanych interfejsów statusu                            | Dostawca wymaga niestandardowego parsowania tokena użycia/limitu albo innych poświadczeń użycia                                                |
| 38  | `fetchUsageSnapshot`              | Pobierz i znormalizuj specyficzne dla dostawcy migawki użycia/limitu po ustaleniu uwierzytelnienia              | Dostawca wymaga specyficznego dla dostawcy punktu końcowego użycia albo parsera ładunku                                                        |
| 39  | `createEmbeddingProvider`         | Zbuduj należący do dostawcy adapter osadzania dla pamięci/wyszukiwania                                          | Zachowanie osadzania pamięci należy do Plugin dostawcy                                                                                         |
| 40  | `buildReplayPolicy`               | Zwróć zasadę odtwarzania kontrolującą obsługę transkrypcji dla dostawcy                                         | Dostawca wymaga niestandardowej zasady transkrypcji (na przykład usuwania bloków myślenia)                                                     |
| 41  | `sanitizeReplayHistory`           | Przepisz historię odtwarzania po ogólnym oczyszczeniu transkrypcji                                             | Dostawca wymaga specyficznych dla dostawcy przekształceń odtwarzania wykraczających poza wspólne pomocniki Compaction                          |
| 42  | `validateReplayTurns`             | Wykonaj końcową walidację tur odtwarzania lub zmianę ich kształtu przed osadzonym runnerem                      | Transport dostawcy wymaga bardziej rygorystycznej walidacji tur po ogólnym oczyszczeniu                                                        |
| 43  | `onModelSelected`                 | Uruchom należące do dostawcy efekty uboczne po wyborze                                                         | Dostawca wymaga telemetrii lub należącego do dostawcy stanu, gdy model staje się aktywny                                                       |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców
obsługujące hooki, aż któryś faktycznie zmieni identyfikator modelu albo transport/config. Dzięki temu
aliasy i shimy zgodności dostawców działają bez wymagania od wywołującego wiedzy, który
dołączony Plugin odpowiada za przepisanie. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, dołączony normalizator konfiguracji Google nadal stosuje
to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu przewodowego lub niestandardowego wykonawcy żądań,
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

Dołączone Pluginy dostawców łączą powyższe hooki, aby dopasować się do katalogu,
uwierzytelniania, myślenia, odtwarzania i potrzeb użycia każdego dostawcy. Autorytatywny zestaw hooków znajduje się przy
każdym Pluginie w `extensions/`; ta strona ilustruje ich kształty, zamiast
odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogu przekazującego">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby móc udostępniać upstreamowe
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy endpointów OAuth i użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` albo `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby zarządzać wymianą tokenów i integracją `/usage`.
  </Accordion>
  <Accordion title="Rodziny odtwarzania i czyszczenia transkrypcji">
    Wspólne nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączać się w
    zasady transkrypcji przez `buildReplayPolicy`, zamiast aby każdy Plugin
    ponownie implementował czyszczenie.
  </Accordion>
  <Accordion title="Dostawcy tylko z katalogiem">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze wspólnej pętli inferencji.
  </Accordion>
  <Accordion title="Pomocniki strumienia specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` i `context1m` znajdują się wewnątrz
    publicznego połączenia `api.ts` / `contract-api.ts` Pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Pomocniki środowiska uruchomieniowego

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

- `textToSpeech` zwraca normalny payload wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji rdzenia `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą ponownie próbkować/kodować dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla należących do dostawcy selektorów głosu lub przepływów konfiguracji.
- Listy głosów mogą zawierać bogatsze metadane, takie jak ustawienia regionalne, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą również rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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

- Zachowaj zasady TTS, fallback i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy dla należącego do dostawcy zachowania syntezy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może obejmować
  dostawców tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw doda te
  kontrakty możliwości.

W przypadku rozumienia obrazu/audio/wideo Pluginy rejestrują jednego typowanego
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
- Zachowaj zachowanie dostawcy w Pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już działa według tego samego wzorca:
  - rdzeń posiada kontrakt możliwości i pomocnik środowiska uruchomieniowego
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

Dla pomocników środowiska uruchomieniowego rozumienia mediów Pluginy mogą wywołać:

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

Do transkrypcji audio Pluginy mogą użyć albo środowiska uruchomieniowego rozumienia mediów,
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

- `api.runtime.mediaUnderstanding.*` to preferowana wspólna powierzchnia do
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) i kolejności fallbacków dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie żaden wynik transkrypcji (na przykład pominięte/nieobsługiwane wejście).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą również uruchamiać działające w tle przebiegi podagentów przez `api.runtime.subagent`:

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
- OpenClaw honoruje te pola nadpisań tylko dla zaufanych wywołujących.
- Dla należących do Pluginu przebiegów fallback operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie dopuścić dowolny cel.
- Przebiegi podagentów niezaufanych Pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przechodzić na fallback.
- Sesje podagentów utworzone przez Plugin są oznaczane identyfikatorem tworzącego Pluginu. Fallback `api.runtime.subagent.deleteSession(...)` może usuwać tylko te posiadane sesje; arbitralne usuwanie sesji nadal wymaga żądania Gateway z zakresem administratora.

Dla wyszukiwania w sieci Pluginy mogą używać wspólnego pomocnika środowiska uruchomieniowego zamiast
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

Pluginy mogą również rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i wspólną semantykę żądań w rdzeniu.
- Używaj dostawców wyszukiwania w sieci dla specyficznych dla dostawcy transportów wyszukiwania.
- `api.runtime.webSearch.*` to preferowana wspólna powierzchnia dla Pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzi agenta.

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

## Trasy HTTP Gateway

Pluginy mogą udostępniać endpointy HTTP za pomocą `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania Gateway, albo `"plugin"` dla zarządzanego przez Plugin uwierzytelniania/weryfikacji Webhook.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` usunięto i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy Pluginu muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden Plugin nie może zastąpić trasy innego Pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów środowiska wykonawczego operatora. Służą do zarządzanych przez Plugin Webhooków/weryfikacji podpisu, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają w zakresie środowiska wykonawczego żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - uwierzytelnianie bearer współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy środowiska wykonawczego tras Pluginu przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym wejściu) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach tras Pluginu przenoszących tożsamość, zakres środowiska wykonawczego wraca do `operator.write`
- Zasada praktyczna: nie zakładaj, że trasa Pluginu z uwierzytelnianiem gateway jest niejawną powierzchnią administracyjną. Jeśli trasa wymaga zachowania tylko dla administratora, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK Pluginu

Podczas tworzenia nowych pluginów używaj wąskich podścieżek SDK zamiast monolitycznego głównego barrela `openclaw/plugin-sdk`. Główne podścieżki:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji Pluginu                      |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                 |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich punktów styku — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno być
konsolidowane na jednym kontrakcie `approvalCapability`, zamiast mieszać je
między niepowiązanymi polami Pluginu. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki środowiska wykonawczego i konfiguracji znajdują się pod pasującymi,
wyspecjalizowanymi podścieżkami `*-runtime` (`approval-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`,
`system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime` itd.).
Preferuj `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`
i `config-mutation` zamiast szerokiego barrela zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` są przestarzałymi nakładkami zgodności dla
starszych pluginów. Nowy kod powinien zamiast tego importować węższe ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla głównego katalogu każdego pakietu wbudowanego Pluginu):

- `index.js` — wejście wbudowanego Pluginu
- `api.js` — barrel pomocników/typów
- `runtime-api.js` — barrel tylko dla środowiska wykonawczego
- `setup-entry.js` — wejście konfiguracyjne Pluginu

Zewnętrzne pluginy powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` pakietu innego Pluginu z core ani z innego Pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji
środowiska wykonawczego, jeśli istnieje, a następnie wracają do rozwiązanej
konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`,
`media-understanding` i `speech`, istnieją, ponieważ wbudowane pluginy używają ich
obecnie. Nie są automatycznie długoterminowo zamrożonymi kontraktami zewnętrznymi —
sprawdź odpowiednią stronę referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzi wiadomości

Pluginy powinny posiadać specyficzne dla kanału wkłady schematu
`describeMessageTool(...)` dla prymitywów innych niż wiadomości, takich jak reakcje,
odczyty i ankiety. Wspólna prezentacja wysyłania powinna używać ogólnego kontraktu
`MessagePresentation` zamiast natywnych dla dostawcy pól przycisków, komponentów,
bloków lub kart. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły awaryjne, mapowanie dostawców i listę kontrolną autora Pluginu.

Pluginy obsługujące wysyłanie deklarują, co mogą renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętej dostawy

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy obejść UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane
dla istniejących zewnętrznych pluginów, ale nowe pluginy nie powinny ich używać.

## Rozwiązywanie celu kanału

Pluginy kanałów powinny posiadać specyficzną dla kanału semantykę celu. Utrzymuj
wspólnego hosta wychodzącego jako ogólny i używaj powierzchni adaptera wiadomości
dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy dane
  wejściowe powinny przejść bezpośrednio do rozwiązywania podobnego do id zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest awaryjną ścieżką Pluginu, gdy
  core potrzebuje końcowego, należącego do dostawcy rozstrzygnięcia po normalizacji albo po
  chybieniu katalogu.
- `messaging.resolveOutboundSessionRoute(...)` posiada specyficzne dla dostawcy
  konstruowanie trasy sesji, gdy cel zostanie rozwiązany.

Zalecany podział:

- Użyj `inferTargetChatType` dla decyzji o kategorii, które powinny nastąpić przed
  przeszukiwaniem peerów/grup.
- Użyj `looksLikeId` dla sprawdzeń „traktuj to jako jawny/natywny id celu”.
- Użyj `resolveTarget` dla specyficznej dla dostawcy awaryjnej normalizacji, a nie dla
  szerokiego wyszukiwania w katalogu.
- Natywne dla dostawcy id, takie jak id czatów, id wątków, JID, uchwyty i id pokojów,
  trzymaj wewnątrz wartości `target` albo specyficznych dla dostawcy parametrów, a nie w ogólnych
  polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
Pluginie i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Użyj tego, gdy kanał potrzebuje opartych na konfiguracji peerów/grup, takich jak:

- peery DM sterowane listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne awaryjne wpisy katalogu w zakresie konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Specyficzna dla kanału inspekcja konta i normalizacja id powinny pozostać w
implementacji Pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawcy

Użyj `catalog`, gdy Plugin posiada specyficzne dla dostawcy id modeli, domyślne
bazowe adresy URL lub metadane modeli bramkowane auth.

`catalog.order` kontroluje, kiedy katalog Pluginu scala się względem wbudowanych
niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API lub env
- `profile`: dostawcy, którzy pojawiają się, gdy istnieją profile auth
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji klucza, więc pluginy mogą celowo nadpisać
wbudowany wpis dostawcy o tym samym id dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowane są zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką środowiska wykonawczego. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i szybko zawieść, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy naprawy
  doctor/konfiguracji nie powinny musieć materializować poświadczeń środowiska wykonawczego tylko po to, aby
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj wyłącznie opisowy stan konta.
- Zachowaj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby raportować dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i pasującego pola źródła)
  wystarcza dla poleceń w stylu status.
- Użyj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce
polecenia” zamiast ulegać awarii albo błędnie raportować konto jako nieskonfigurowane.

## Pakiety zbiorcze

Katalog Pluginu może zawierać `package.json` z `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się Pluginem. Jeśli pakiet zbiorczy wymienia wiele rozszerzeń, id Pluginu
staje się `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu Pluginu
po rozwiązaniu dowiązań symbolicznych. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności Pluginu za pomocą
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia,
bez zależności dev w środowisku wykonawczym), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności Pluginu jako „czysty JS/TS” i unikaj pakietów wymagających
kompilacji `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł wyłącznie konfiguracyjny.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Pluginu kanału albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia Pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główne wejście Pluginu podpina też narzędzia, haki lub inny kod wyłącznie
dla środowiska wykonawczego.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć Plugin kanału w tę samą ścieżkę `setupEntry` podczas fazy uruchamiania
Gateway przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
zanim Gateway zacznie nasłuchiwać. W praktyce oznacza to, że wejście konfiguracyjne
musi rejestrować każdą należącą do kanału możliwość, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim Gateway zacznie nasłuchiwać
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli pełne wejście nadal posiada jakąkolwiek wymaganą możliwość uruchamiania, nie włączaj
tej flagi. Pozostaw Plugin przy domyślnym zachowaniu i pozwól OpenClaw załadować
pełne wejście podczas uruchamiania.

Wbudowane kanały mogą również publikować pomocniki powierzchni kontraktu wyłącznie konfiguracyjnego, z których core
może korzystać przed załadowaniem pełnego środowiska wykonawczego kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń używa tej powierzchni, gdy musi wypromować starszą konfigurację kanału z jednym kontem do `channels.<id>.accounts.*` bez ładowania pełnego wpisu pluginu. Matrix jest aktualnym przykładem wbudowanym: przenosi tylko klucze uwierzytelniania/bootstrapu do nazwanego wypromowanego konta, gdy nazwane konta już istnieją, i może zachować skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć `accounts.default`.

Te adaptery łatek konfiguracji utrzymują leniwe wykrywanie wbudowanej powierzchni kontraktu. Czas importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu, zamiast ponownie wchodzić w uruchamianie wbudowanego kanału podczas importu modułu.

Gdy te powierzchnie uruchamiania obejmują metody RPC gateway, trzymaj je pod prefiksem specyficznym dla pluginu. Przestrzenie nazw administratora rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozstrzygają się do `operator.admin`, nawet jeśli plugin żąda węższego zakresu.

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

Pluginy kanałów mogą ogłaszać metadane konfiguracji/wykrywania przez `openclaw.channel` oraz wskazówki instalacyjne przez `openclaw.install`. Dzięki temu katalog rdzenia nie zawiera danych.

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

- `detailLabel`: etykieta pomocnicza dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: zastępuje tekst linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki treści powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych selektorach konfiguracji/konfigurowania, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji podczas rozstrzygania celów ogłoszeń

OpenClaw może również scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż w `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) jeden lub więcej plików JSON (rozdzielonych przecinkami, średnikami albo przez `PATH`). Każdy plik powinien zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje też `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji dostawców udostępniają znormalizowane fakty o źródle instalacji obok surowego bloku `openclaw.install`. Znormalizowane fakty określają, czy specyfikacja npm jest dokładną wersją czy płynnym selektorem, czy obecne są oczekiwane metadane integralności oraz czy dostępna jest również lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana, znormalizowane fakty ostrzegają, jeśli przeanalizowana nazwa pakietu npm odbiega od tej tożsamości. Ostrzegają też, gdy `defaultChoice` jest nieprawidłowe lub wskazuje niedostępne źródło, oraz gdy metadane integralności npm są obecne bez prawidłowego źródła npm. Konsumenci powinni traktować `installSource` jako addytywne pole opcjonalne, aby ręcznie tworzone wpisy i warstwy zgodności katalogu nie musiały go syntetyzować. Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródeł bez importowania runtime pluginu.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` oraz `expectedIntegrity`. Same nazwy pakietów i tagi dystrybucyjne nadal działają dla zgodności, ale pokazują ostrzeżenia płaszczyzny źródeł, aby katalog mógł zmierzać w stronę przypiętych instalacji ze sprawdzaną integralnością bez psucia istniejących pluginów. Gdy onboarding instaluje z lokalnej ścieżki katalogu, rejestruje zarządzany wpis indeksu pluginu z `source: "path"` i względną wobec workspace ścieżką `sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w `plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej w długotrwałej konfiguracji. Dzięki temu lokalne instalacje deweloperskie pozostają widoczne dla diagnostyki płaszczyzny źródeł bez dodawania drugiej surowej powierzchni ujawniania ścieżek systemu plików. Utrwalony indeks pluginów `plugins/installs.json` jest źródłem prawdy o źródłach instalacji i można go odświeżać bez ładowania modułów runtime pluginów. Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest pluginu jest brakujący lub nieprawidłowy; jego tablica `plugins` jest odtwarzalnym widokiem manifestów.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu odpowiadają za orkiestrację kontekstu sesji dla ingestu, składania i Compaction. Zarejestruj je ze swojego pluginu za pomocą `api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez `plugins.slots.contextEngine`.

Użyj tego, gdy Twój plugin musi zastąpić lub rozszerzyć domyślny pipeline kontekstu, a nie tylko dodać wyszukiwanie pamięci lub hooki.

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

Jeśli Twój silnik **nie** jest właścicielem algorytmu Compaction, pozostaw `compact()` zaimplementowane i deleguj go jawnie:

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

## Dodawanie nowej możliwości

Gdy plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj systemu pluginów prywatnym sięganiem do środka. Dodaj brakującą możliwość.

Zalecana kolejność:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, za jakie współdzielone zachowanie powinien odpowiadać rdzeń: politykę, fallback, scalanie konfiguracji, cykl życia, semantykę skierowaną do kanału oraz kształt helperów runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginu
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną typowaną powierzchnię możliwości.
3. podłącz rdzeń oraz konsumentów kanału/funkcji
   Kanały i pluginy funkcji powinny korzystać z nowej możliwości przez rdzeń, a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują następnie swoje backendy dla tej możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostawały jawne w czasie.

W ten sposób OpenClaw pozostaje opiniotwórczy, nie stając się twardo zakodowany pod światopogląd jednego dostawcy. Zobacz [Księgę możliwości](/pl/plugins/architecture), aby uzyskać konkretną checklistę plików i przepracowany przykład.

### Checklista możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna obejmować te powierzchnie razem:

- typy kontraktu rdzenia w `src/<capability>/types.ts`
- runner/helper runtime rdzenia w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API pluginu w `src/plugins/types.ts`
- okablowanie rejestru pluginów w `src/plugins/registry.ts`
- ekspozycja runtime pluginu w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów muszą ją konsumować
- helpery przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/pluginu w `docs/`

Jeśli jednej z tych powierzchni brakuje, zwykle oznacza to, że możliwość nie jest jeszcze w pełni zintegrowana.

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

Wzorzec testu kontraktu:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dzięki temu reguła pozostaje prosta:

- rdzeń odpowiada za kontrakt możliwości i orkiestrację
- pluginy dostawców odpowiadają za implementacje dostawców
- pluginy funkcji/kanałów konsumują helpery runtime
- testy kontraktu utrzymują jawną własność

## Powiązane

- [Architektura pluginów](/pl/plugins/architecture) — publiczny model i kształty możliwości
- [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths)
- [Konfiguracja SDK pluginów](/pl/plugins/sdk-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
