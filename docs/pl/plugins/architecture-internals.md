---
read_when:
    - Implementowanie haków środowiska wykonawczego dostawcy, cyklu życia kanału lub zestawów pakietów
    - Debugowanie kolejności ładowania Pluginów lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne aspekty architektury Plugin: potok ładowania, rejestr, hooki runtime, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Model publicznych możliwości, kształty Plugin oraz kontrakty własności/wykonania opisuje [Architektura Plugin](/pl/plugins/architecture). Ta strona jest odniesieniem dla mechaniki wewnętrznej: potoku ładowania, rejestru, hooków środowiska uruchomieniowego, tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu następujące kroki:

1. wykrywa katalogi główne kandydatów na Plugin
2. odczytuje natywne lub zgodne manifesty pakietów oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły pakietowe używają natywnego loadera;
   lokalny kod źródłowy TypeScript firm trzecich używa awaryjnego mechanizmu zapasowego Jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje w rejestrze Plugin
8. udostępnia rejestr poleceniom i powierzchniom środowiska uruchomieniowego

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje dowolny obecny wariant (`def.register ?? def.activate`) i wywołuje go w tym samym punkcie. Wszystkie pakietowe Plugin używają `register`; w nowych Plugin preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem w środowisku uruchomieniowym. Kandydaci są blokowani, gdy punkt wejścia wychodzi poza katalog główny Plugin, ścieżka jest zapisywalna dla wszystkich albo własność ścieżki wygląda podejrzanie w przypadku Plugin spoza pakietu.

Zablokowani kandydaci pozostają powiązani ze swoim identyfikatorem Plugin na potrzeby diagnostyki. Jeśli konfiguracja nadal odwołuje się do tego identyfikatora, walidacja zgłasza Plugin jako obecny, ale zablokowany, i odsyła do ostrzeżenia o bezpieczeństwie ścieżki zamiast traktować wpis konfiguracji jako nieaktualny.

### Zachowanie oparte najpierw na manifeście

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go, aby:

- identyfikować Plugin
- wykrywać zadeklarowane kanały/skills/schemat konfiguracji lub możliwości pakietu
- walidować `plugins.entries.<id>.config`
- uzupełniać etykiety i placeholdery Control UI
- pokazywać metadane instalacji/katalogu
- zachować tanie deskryptory aktywacji i konfiguracji bez ładowania środowiska uruchomieniowego Plugin

W przypadku natywnych Plugin moduł środowiska uruchomieniowego jest częścią płaszczyzny danych. Rejestruje rzeczywiste zachowania, takie jak hooki, narzędzia, polecenia lub przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania. Są wyłącznie metadanymi opisującymi planowanie aktywacji i wykrywanie konfiguracji; nie zastępują rejestracji środowiska uruchomieniowego, `register(...)` ani `setupEntry`. Pierwsi aktywni konsumenci aktywacji używają teraz podpowiedzi manifestu dotyczących poleceń, kanałów i dostawców, aby zawęzić ładowanie Plugin przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do Plugin, które są właścicielami żądanego polecenia głównego
- rozwiązywanie konfiguracji kanału/Plugin zawęża się do Plugin, które są właścicielami żądanego identyfikatora kanału
- jawne rozwiązywanie konfiguracji/środowiska uruchomieniowego dostawcy zawęża się do Plugin, które są właścicielami żądanego identyfikatora dostawcy
- planowanie startu Gateway używa `activation.onStartup` dla jawnych importów startowych i rezygnacji ze startu; Plugin bez metadanych startowych ładują się tylko przez węższe wyzwalacze aktywacji

Wstępne ładowanie środowiska uruchomieniowego w czasie żądania, które prosi o szeroki zakres `all`, nadal wyprowadza jawny efektywny zestaw identyfikatorów Plugin z konfiguracji, planowania startu, skonfigurowanych kanałów, slotów i reguł automatycznego włączania. Jeśli wyprowadzony zestaw jest pusty, OpenClaw ładuje pusty rejestr środowiska uruchomieniowego zamiast rozszerzać zakres na każdy wykrywalny Plugin.

Planer aktywacji udostępnia zarówno API tylko z identyfikatorami dla istniejących wywołujących, jak i API planu dla nowej diagnostyki. Wpisy planu raportują, dlaczego Plugin został wybrany, rozdzielając jawne podpowiedzi planera `activation.*` od zapasowego ustalania własności z manifestu, takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki. Ten podział powodów jest granicą zgodności: istniejące metadane Plugin nadal działają, a nowy kod może wykrywać szerokie podpowiedzi lub zachowanie zapasowe bez zmiany semantyki ładowania środowiska uruchomieniowego.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak `setup.providers` i `setup.cliBackends`, aby zawęzić kandydatów Plugin, zanim cofnie się do `setup-api` dla Plugin, które nadal wymagają hooków środowiska uruchomieniowego w czasie konfiguracji. Listy konfiguracji dostawców używają manifestu `providerAuthChoices`, wyborów konfiguracji wyprowadzonych z deskryptora oraz metadanych katalogu instalacji bez ładowania środowiska uruchomieniowego dostawcy. Jawne `setup.requiresRuntime: false` jest wyłącznie odcięciem deskryptorowym; pominięte `requiresRuntime` zachowuje starszy mechanizm zapasowy setup-api dla zgodności. Jeśli więcej niż jeden wykryty Plugin zgłasza ten sam znormalizowany identyfikator dostawcy konfiguracji lub backendu CLI, wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na kolejności wykrywania. Gdy środowisko uruchomieniowe konfiguracji rzeczywiście się wykonuje, diagnostyka rejestru raportuje rozbieżności między `setup.providers` / `setup.cliBackends` a dostawcami lub backendami CLI zarejestrowanymi przez setup-api, bez blokowania starszych Plugin.

### Granica pamięci podręcznej Plugin

OpenClaw nie buforuje wyników wykrywania Plugin ani bezpośrednich danych rejestru manifestów za oknami czasu zegarowego. Instalacje, edycje manifestu i zmiany ścieżek ładowania muszą być widoczne przy następnym jawnym odczycie metadanych lub przebudowie migawki. Parser pliku manifestu może utrzymywać ograniczoną pamięć podręczną sygnatur plików, kluczowaną otwartą ścieżką manifestu, i-węzłem, rozmiarem i znacznikami czasu; ta pamięć podręczna tylko unika ponownego parsowania niezmienionych bajtów i nie może buforować odpowiedzi dotyczących wykrywania, rejestru, właściciela ani polityki.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektu, a nie ukryta pamięć podręczna. Gorące ścieżki startowe Gateway powinny przekazywać bieżący `PluginMetadataSnapshot`, wyprowadzony `PluginLookUpTable` albo jawny rejestr manifestu przez łańcuch wywołań. Walidacja konfiguracji, automatyczne włączanie przy starcie, bootstrap Plugin i wybór dostawcy mogą ponownie używać tych obiektów, dopóki reprezentują bieżącą konfigurację i inwentarz Plugin. Wyszukiwanie konfiguracji nadal rekonstruuje metadane manifestu na żądanie, chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestu; zachowaj to jako zapasową ścieżkę zimną zamiast dodawać ukryte pamięci podręczne wyszukiwania. Gdy dane wejściowe się zmienią, przebuduj i zastąp migawkę zamiast ją mutować lub przechowywać historyczne kopie.
Widoki aktywnego rejestru Plugin i pomocnicze funkcje bootstrapu pakietowych kanałów powinny być ponownie obliczane z bieżącego rejestru/katalogu głównego. Krótkotrwałe mapy są w porządku w ramach jednego wywołania, aby deduplikować pracę lub chronić ponowne wejście; nie mogą stać się procesowymi pamięciami podręcznymi metadanych.

Dla ładowania Plugin trwałą warstwą pamięci podręcznej jest ładowanie środowiska uruchomieniowego. Może ponownie używać stanu loadera, gdy kod lub zainstalowane artefakty są rzeczywiście ładowane, na przykład:

- `PluginLoaderCacheState` i zgodnych aktywnych rejestrów środowiska uruchomieniowego
- pamięci podręcznych jiti/modułów oraz pamięci podręcznych loadera powierzchni publicznej używanych, aby unikać wielokrotnego importowania tej samej powierzchni środowiska uruchomieniowego
- pamięci podręcznych systemu plików dla zainstalowanych artefaktów Plugin
- krótkotrwałych map na wywołanie do normalizacji ścieżek lub rozwiązywania duplikatów

Te pamięci podręczne są szczegółami implementacji płaszczyzny danych. Nie mogą odpowiadać na pytania płaszczyzny sterowania, takie jak „który Plugin jest właścicielem tego dostawcy?”, chyba że wywołujący celowo poprosił o ładowanie środowiska uruchomieniowego.

Nie dodawaj trwałych ani zegarowych pamięci podręcznych dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestów
- rejestrów manifestów rekonstruowanych z indeksu zainstalowanych Plugin
- wyszukiwania właściciela dostawcy, wyciszania modeli, polityki dostawcy ani metadanych artefaktów publicznych
- żadnej innej odpowiedzi wyprowadzonej z manifestu, w której zmieniony manifest, zainstalowany indeks lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy przebudowują metadane manifestu z utrwalonego indeksu zainstalowanych Plugin, rekonstruują ten rejestr na żądanie. Zainstalowany indeks jest trwałym stanem płaszczyzny źródła; nie jest ukrytą wewnątrzprocesową pamięcią podręczną metadanych.

## Model rejestru

Załadowane Plugin nie mutują bezpośrednio losowych globali rdzenia. Rejestrują się w centralnym rejestrze Plugin.

Rejestr śledzi:

- rekordy Plugin (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i typowane hooki
- kanały
- dostawców
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do Plugin

Funkcje rdzenia czytają następnie z tego rejestru zamiast komunikować się bezpośrednio z modułami Plugin. Utrzymuje to ładowanie jednokierunkowe:

- moduł Plugin -> rejestracja w rejestrze
- środowisko uruchomieniowe rdzenia -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia potrzebuje tylko jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł Plugin”.

## Callbacki wiązania konwersacji

Plugin, które wiążą konwersację, mogą zareagować po rozstrzygnięciu zatwierdzenia.

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

- `status`: `"approved"` albo `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` albo `"deny"`
- `binding`: rozwiązane wiązanie dla zatwierdzonych żądań
- `request`: oryginalne podsumowanie żądania, wskazówka odłączenia, identyfikator nadawcy i metadane konwersacji

Ten callback służy wyłącznie do powiadamiania. Nie zmienia tego, kto może wiązać konwersację, i uruchamia się po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki środowiska uruchomieniowego dostawcy

Plugin dostawców mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed środowiskiem uruchomieniowym:
  `setup.providers[].envVars`, przestarzałą zgodnościową opcję `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` oraz `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Hooki środowiska uruchomieniowego**: ponad 40 opcjonalnych hooków obejmujących uwierzytelnianie, rozwiązywanie modeli,
  opakowywanie strumieni, poziomy myślenia, politykę odtwarzania i endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność hooków i użycie](#hook-order-and-usage).

OpenClaw nadal jest właścicielem ogólnej pętli agenta, przełączania awaryjnego, obsługi transkryptu i polityki narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla dostawcy, bez potrzeby tworzenia całego niestandardowego transportu inferencji.

Używaj manifestu `setup.providers[].envVars`, gdy dostawca ma poświadczenia oparte na zmiennych środowiskowych, które ogólne ścieżki uwierzytelniania/statusu/wyboru modelu powinny widzieć bez ładowania środowiska uruchomieniowego Plugin. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez adapter zgodności w okresie wycofywania, a Plugin spoza pakietu, które go używają, otrzymują diagnostykę manifestu. Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator dostawcy powinien ponownie używać zmiennych środowiskowych, profili uwierzytelniania, uwierzytelniania opartego na konfiguracji i wyboru onboardingu klucza API innego identyfikatora dostawcy. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru uwierzytelniania powinny znać identyfikator wyboru dostawcy, etykiety grup i proste okablowanie uwierzytelniania jedną flagą bez ładowania środowiska uruchomieniowego dostawcy. Zachowaj `envVars` środowiska uruchomieniowego dostawcy dla wskazówek dla operatora, takich jak etykiety onboardingu albo zmienne konfiguracji client-id/client-secret OAuth.

Używaj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowaną zmiennymi środowiskowymi, które ogólny fallback środowiska powłoki, sprawdzenia konfiguracji/statusu lub prompty konfiguracji powinny widzieć bez ładowania środowiska uruchomieniowego kanału.

### Kolejność hooków i użycie

Dla Plugin modeli/dostawców OpenClaw wywołuje hooki w przybliżeniu w tej kolejności.
Kolumna „Kiedy używać” jest krótkim przewodnikiem decyzyjnym.
Pola dostawcy tylko dla zgodności, których OpenClaw już nie wywołuje, takie jak
`ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie są tutaj wymienione.

| #   | Punkt zaczepienia                 | Co robi                                                                                                        | Kiedy używać                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca ma własny katalog lub domyślne wartości bazowego adresu URL                                                                          |
| 2   | `applyConfigDefaults`             | Stosuje należące do dostawcy globalne wartości domyślne konfiguracji podczas materializacji konfiguracji       | Wartości domyślne zależą od trybu uwierzytelniania, środowiska lub semantyki rodziny modeli dostawcy                                          |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(nie jest to punkt zaczepienia Plugin)_                                                                                                      |
| 3   | `normalizeModelId`                | Normalizuje starsze aliasy lub aliasy identyfikatorów modeli w wersji zapoznawczej przed wyszukiwaniem        | Dostawca odpowiada za porządkowanie aliasów przed kanonicznym rozwiązywaniem modelu                                                           |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                                | Dostawca odpowiada za porządkowanie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                 |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem środowiska uruchomieniowego/dostawcy                 | Dostawca potrzebuje porządkowania konfiguracji, które powinno należeć do Plugin; dołączone pomocniki rodziny Google także zabezpieczają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywania zgodności natywnego użycia streamingu do dostawców konfiguracji                          | Dostawca potrzebuje poprawek metadanych natywnego użycia streamingu zależnych od punktu końcowego                                             |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie znacznikami środowiskowymi dla dostawców konfiguracji przed ładowaniem uwierzytelniania środowiska uruchomieniowego | Dostawca ma własne rozwiązywanie klucza API przez znaczniki środowiskowe; `amazon-bedrock` ma tu także wbudowany resolver znaczników środowiskowych AWS |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samodzielnie hostowane lub oparte na konfiguracji uwierzytelnianie bez utrwalania tekstu jawnego | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania należące do dostawcy; domyślna wartość `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych symboli zastępczych profilu względem uwierzytelniania opartego na środowisku/konfiguracji | Dostawca przechowuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                      |
| 11  | `resolveDynamicModel`             | Synchroniczna ścieżka awaryjna dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli z upstreamu                                                                                  |
| 12  | `prepareDynamicModel`             | Asynchroniczna rozgrzewka, po której `resolveDynamicModel` uruchamia się ponownie                              | Dostawca potrzebuje metadanych sieciowych przed rozwiązywaniem nieznanych identyfikatorów                                                     |
| 13  | `normalizeResolvedModel`          | Końcowe przepisywanie, zanim osadzony runner użyje rozwiązanego modelu                                         | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu rdzenia                                                                  |
| 14  | `contributeResolvedModelCompat`   | Dostarcza flagi zgodności dla modeli dostawcy za innym zgodnym transportem                                     | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                             |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                                | Dostawca potrzebuje porządkowania schematów rodziny transportu                                                                                |
| 16  | `inspectToolSchemas`              | Udostępnia należącą do dostawcy diagnostykę schematów po normalizacji                                          | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                            |
| 17  | `resolveReasoningOutputMode`      | Wybiera kontrakt wyjścia rozumowania: natywny albo tagowany                                                    | Dostawca potrzebuje tagowanego rozumowania/końcowego wyjścia zamiast natywnych pól                                                            |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji streamingu                                     | Dostawca potrzebuje domyślnych parametrów żądania lub porządkowania parametrów dla danego dostawcy                                            |
| 19  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę streamingu transportem niestandardowym                                     | Dostawca potrzebuje niestandardowego protokołu przewodowego, a nie tylko wrappera                                                             |
| 20  | `wrapStreamFn`                    | Wrapper streamingu po zastosowaniu ogólnych wrapperów                                                          | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modelu żądania bez niestandardowego transportu                                       |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu lub metadane dla tury                                                      | Dostawca chce, aby ogólne transporty wysyłały natywną dla dostawcy tożsamość tury                                                             |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę schładzania sesji                                              | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę awaryjną                                                       |
| 23  | `formatApiKey`                    | Formater profilu uwierzytelniania: zapisany profil staje się runtime’owym ciągiem `apiKey`                    | Dostawca przechowuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokena środowiska uruchomieniowego            |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych punktów końcowych odświeżania lub polityki błędów odświeżania | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                    |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana po niepowodzeniu odświeżania OAuth                                               | Dostawca potrzebuje należących do dostawcy wskazówek naprawy uwierzytelniania po niepowodzeniu odświeżania                                   |
| 26  | `matchesContextOverflowError`     | Należący do dostawcy matcher przepełnienia okna kontekstu                                                      | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wychwyciły                                                           |
| 27  | `classifyFailoverReason`          | Należąca do dostawcy klasyfikacja przyczyny przełączenia awaryjnego                                            | Dostawca może mapować surowe błędy API/transportu na limit szybkości/przeciążenie/itd.                                                        |
| 28  | `isCacheTtlEligible`              | Polityka pamięci podręcznej promptów dla dostawców proxy/backhaul                                              | Dostawca potrzebuje bramkowania TTL pamięci podręcznej specyficznego dla proxy                                                                |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po braku uwierzytelniania                                           | Dostawca potrzebuje wskazówki odzyskiwania po braku uwierzytelniania specyficznej dla dostawcy                                               |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykrywaniu                                                   | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                     |
| 31  | `resolveThinkingProfile`          | Specyficzny dla modelu zestaw poziomów `/think`, etykiety wyświetlania i wartość domyślna                      | Dostawca udostępnia niestandardową drabinę myślenia lub etykietę binarną dla wybranych modeli                                                 |
| 32  | `isBinaryThinking`                | Punkt zaczepienia zgodności przełącznika rozumowania wł./wył.                                                  | Dostawca udostępnia tylko binarne myślenie wł./wył.                                                                                           |
| 33  | `supportsXHighThinking`           | Punkt zaczepienia zgodności obsługi rozumowania `xhigh`                                                        | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                              |
| 34  | `resolveDefaultThinkingLevel`     | Punkt zaczepienia zgodności domyślnego poziomu `/think`                                                        | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                           |
| 35  | `isModernModelRef`                | Matcher nowoczesnego modelu dla filtrów profilu live i wyboru smoke                                            | Dostawca odpowiada za dopasowywanie preferowanego modelu live/smoke                                                                           |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz środowiska uruchomieniowego tuż przed inferencją | Dostawca potrzebuje wymiany tokena lub krótkotrwałego poświadczenia żądania                                                                   |
| 37  | `resolveUsageAuth`                | Rozwiąż dane uwierzytelniające użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                                     | Dostawca potrzebuje niestandardowego parsowania tokenów użycia/limitu albo innych danych uwierzytelniających użycie                                                               |
| 38  | `fetchUsageSnapshot`              | Pobierz i znormalizuj specyficzne dla dostawcy migawki użycia/limitu po rozwiązaniu uwierzytelnienia                             | Dostawca potrzebuje specyficznego dla dostawcy endpointu użycia albo parsera payloadu                                                                           |
| 39  | `createEmbeddingProvider`         | Zbuduj należący do dostawcy adapter osadzania dla pamięci/wyszukiwania                                                     | Zachowanie osadzania pamięci należy do pluginu dostawcy                                                                                    |
| 40  | `buildReplayPolicy`               | Zwróć politykę odtwarzania kontrolującą obsługę transkryptu dla dostawcy                                        | Dostawca potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków rozumowania)                                                               |
| 41  | `sanitizeReplayHistory`           | Przepisz historię odtwarzania po ogólnym czyszczeniu transkryptu                                                        | Dostawca potrzebuje specyficznych dla dostawcy przekształceń odtwarzania wykraczających poza współdzielone helpery Compaction                                                             |
| 42  | `validateReplayTurns`             | Końcowa walidacja lub przekształcenie tur odtwarzania przed osadzonym uruchamiaczem                                           | Transport dostawcy potrzebuje ściślejszej walidacji tur po ogólnym oczyszczaniu                                                                    |
| 43  | `onModelSelected`                 | Uruchom należące do dostawcy efekty uboczne po wyborze                                                                 | Dostawca potrzebuje telemetrii albo należącego do dostawcy stanu, gdy model staje się aktywny                                                                  |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą przez inne pluginy dostawców
obsługujące hooki, aż któryś faktycznie zmieni identyfikator modelu lub
transport/konfigurację. Dzięki temu aliasy i zgodnościowe nakładki dostawców
działają bez wymagania, aby wywołujący wiedział, który dołączony plugin jest
właścicielem przepisania. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, dołączony normalizator konfiguracji Google
nadal zastosuje to zgodnościowe czyszczenie.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu przewodowego lub
niestandardowego wykonawcy żądań, jest to inna klasa rozszerzenia. Te hooki są
przeznaczone dla zachowania dostawcy, które nadal działa w normalnej pętli
inferencji OpenClaw.

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

Dołączone pluginy dostawców łączą powyższe hooki, aby dopasować się do potrzeb
każdego dostawcy dotyczących katalogu, uwierzytelniania, myślenia, odtwarzania i
użycia. Autorytatywny zestaw hooków znajduje się przy każdym pluginie w
`extensions/`; ta strona ilustruje kształty zamiast odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogu przekazującego">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogli udostępniać
    identyfikatory modeli upstream przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy OAuth i endpointów użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` lub `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby zarządzać wymianą tokenów i integracją `/usage`.
  </Accordion>
  <Accordion title="Rodziny odtwarzania i czyszczenia transkrypcji">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączyć
    się do polityki transkrypcji przez `buildReplayPolicy`, zamiast aby każdy
    plugin ponownie implementował czyszczenie.
  </Accordion>
  <Accordion title="Dostawcy tylko katalogu">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli inferencji.
  </Accordion>
  <Accordion title="Pomocnicy strumieni specyficzni dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` i `context1m` znajdują się w publicznym
    przejściu `api.ts` / `contract-api.ts` pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    generycznym SDK.
  </Accordion>
</AccordionGroup>

## Pomocnicy runtime

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
- Listy głosów mogą zawierać bogatsze metadane, takie jak język, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą także rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może posiadać dostawców tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw dodaje te kontrakty możliwości.

Dla rozumienia obrazów/audio/wideo pluginy rejestrują jednego typowanego
dostawcę rozumienia mediów zamiast generycznego worka klucz/wartość:

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
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już stosuje ten sam wzorzec:
  - rdzeń posiada kontrakt możliwości i pomocnik runtime
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

Dla pomocników runtime rozumienia mediów pluginy mogą wywoływać:

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

Dla transkrypcji audio pluginy mogą używać runtime rozumienia mediów albo
starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` jest preferowaną współdzieloną powierzchnią dla rozumienia obrazów/audio/wideo.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) i kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie wyjście transkrypcji (na przykład pominięte/nieobsługiwane wejście).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodnościowym.

Pluginy mogą także uruchamiać przebiegi subagentów w tle przez `api.runtime.subagent`:

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
- Dla przebiegów fallback należących do pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Przebiegi subagentów niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho wracać do ustawień domyślnych.
- Sesje subagentów utworzone przez plugin są oznaczane identyfikatorem tworzącego pluginu. Fallback `api.runtime.subagent.deleteSession(...)` może usuwać tylko te posiadane sesje; arbitralne usuwanie sesji nadal wymaga żądania Gateway o zakresie administratora.

Dla wyszukiwania w sieci pluginy mogą używać współdzielonego pomocnika runtime zamiast
sięgać do okablowania narzędzia agenta:

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

Pluginy mogą także rejestrować dostawców wyszukiwania w sieci przez
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

- `generate(...)`: wygeneruj obraz z użyciem skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: wypisz dostępnych dostawców generowania obrazów i ich możliwości.

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

- `path`: ścieżka trasy pod serwerem HTTP gateway.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania gateway, albo `"plugin"` dla uwierzytelniania/weryfikacji webhooka zarządzanych przez plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` usunięto i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przechodzenia `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Służą do zarządzanych przez plugin webhooków/weryfikacji podpisów, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają w zakresie runtime żądania Gateway, ale ten zakres jest celowo konserwatywny:
  - uwierzytelnianie bearer współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wyśle `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym wejściu) respektują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach tras pluginów przenoszących tożsamość, zakres runtime wraca do `operator.write`
- Zasada praktyczna: nie zakładaj, że trasa pluginu z gateway-auth jest niejawną powierzchnią administracyjną. Jeśli trasa wymaga zachowania wyłącznie dla administratora, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK pluginów

Podczas tworzenia nowych pluginów używaj wąskich podścieżek SDK zamiast monolitycznego głównego
barrela `openclaw/plugin-sdk`. Główne podścieżki:

| Podścieżka                         | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji pluginu                     |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich styków — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno konsolidować się
na jednym kontrakcie `approvalCapability`, zamiast mieszać je między niepowiązanymi
polami pluginów. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki runtime i konfiguracji znajdują się w dopasowanych, wyspecjalizowanych podścieżkach `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiego barrela zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` są przestarzałymi shimami zgodności dla
starszych pluginów. Nowy kod powinien importować węższe prymitywy ogólne.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla głównego katalogu każdego dołączonego pakietu pluginu):

- `index.js` — wejście dołączonego pluginu
- `api.js` — barrel pomocników/typów
- `runtime-api.js` — barrel wyłącznie runtime
- `setup-entry.js` — wejście pluginu konfiguracji

Zewnętrzne pluginy powinny importować tylko podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu pluginu z core ani z innego pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime, gdy taki
istnieje, a następnie wracają do rozwiązania pliku konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone pluginy używają ich obecnie. Nie są one
automatycznie długoterminowo zamrożonymi kontraktami zewnętrznymi — sprawdź odpowiednią stronę
referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzi wiadomości

Pluginy powinny posiadać specyficzne dla kanału wkłady schematu `describeMessageTool(...)`
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Wspólna prezentacja wysyłania powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły fallbacku, mapowanie dostawców i listę kontrolną autora pluginu.

Pluginy zdolne do wysyłania deklarują, co potrafią renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczania

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy obejść UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
zewnętrznych pluginów, ale nowe pluginy nie powinny ich używać.

## Rozwiązywanie celu kanału

Pluginy kanałów powinny posiadać specyficzną dla kanału semantykę celów. Wspólnego
hosta wychodzącego utrzymuj jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy
  wejście powinno od razu przejść do rozwiązywania podobnego do identyfikatora zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest fallbackiem pluginu, gdy
  core potrzebuje ostatecznego rozwiązywania należącego do dostawcy po normalizacji lub po
  nietrafieniu w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za specyficzne dla dostawcy
  budowanie trasy sesji po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorii, które powinny nastąpić przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do specyficznego dla dostawcy fallbacku normalizacji, a nie do
  szerokiego wyszukiwania w katalogu.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatów, identyfikatory wątków, JID, uchwyty i identyfikatory pokoi
  trzymaj w wartościach `target` lub parametrach specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane allowlistą
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu w zakresie konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Specyficzna dla kanału inspekcja konta i normalizacja identyfikatorów powinny pozostać w
implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje w
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin posiada specyficzne dla dostawcy identyfikatory modeli, domyślne
adresy URL bazowe lub metadane modeli bramkowane auth.

`catalog.order` kontroluje, kiedy katalog pluginu scala się względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API lub env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawcy
- `late`: ostatni przebieg, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo zastąpić
wbudowany wpis dostawcy tym samym identyfikatorem dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowane są jednocześnie `catalog` i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko zakończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy naprawy doctor/config
  nie powinny musieć materializować poświadczeń runtime tylko po to, aby
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowaj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby raportować dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i odpowiadającego pola źródła)
  wystarcza dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce
polecenia” zamiast zawieszać się lub błędnie zgłaszać konto jako nieskonfigurowane.

## Pakiety pluginów

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

Każdy wpis staje się pluginem. Jeśli pakiet wymienia wiele rozszerzeń, identyfikator pluginu
staje się `name/<fileBase>`.

Jeśli twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginu za pomocą
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów lifecycle,
bez zależności dev w runtime), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności pluginów jako „czysty JS/TS” i unikaj pakietów, które wymagają
buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główne wejście pluginu podłącza także narzędzia, hooki lub inny kod wyłącznie runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do tej samej ścieżki `setupEntry` podczas fazy uruchamiania gatewaya
przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni obejmuje powierzchnię uruchomieniową, która musi istnieć,
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis konfiguracji
musi zarejestrować każdą należącą do kanału możliwość, od której zależy uruchomienie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- wszelkie metody, narzędzia lub usługi gatewaya, które muszą istnieć w tym samym oknie

Jeśli pełne wejście nadal posiada jakąkolwiek wymaganą możliwość uruchomieniową, nie włączaj
tej flagi. Pozostaw plugin przy zachowaniu domyślnym i pozwól OpenClaw załadować
pełne wejście podczas uruchamiania.

Dołączone kanały mogą również publikować pomocniki powierzchni kontraktu tylko do konfiguracji, z których core
może korzystać, zanim pełny runtime kanału zostanie załadowany. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń używa tej powierzchni, gdy musi promować starszą konfigurację kanału z jednym kontem do `channels.<id>.accounts.*` bez ładowania pełnego wpisu Plugin. Matrix jest obecnym dołączonym przykładem: przenosi tylko klucze uwierzytelniania/rozruchu do nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć `accounts.default`.

Te adaptery poprawek konfiguracji utrzymują leniwe wykrywanie dołączonej powierzchni kontraktu. Czas importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast ponownie wchodzić w uruchamianie dołączonego kanału podczas importu modułu.

Gdy te powierzchnie startowe obejmują metody RPC Gateway, zachowaj je pod prefiksem specyficznym dla Plugin. Przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze są rozwiązywane do `operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

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

Plugin kanałów mogą ogłaszać metadane konfiguracji/wykrywania przez `openclaw.channel` oraz wskazówki instalacji przez `openclaw.install`. Dzięki temu główny katalog pozostaje wolny od danych.

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

- `detailLabel`: etykieta pomocnicza dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: zastępuje tekst linku do dokumentacji
- `preferOver`: identyfikatory Plugin/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki treści powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wiadomości wychodzących
- `exposure.configured`: ukrywa kanał z powierzchni list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych list wyboru konfiguracji/konfigurowania, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń

OpenClaw może też scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na jeden lub więcej plików JSON (rozdzielonych przecinkiem/średnikiem/`PATH`). Każdy plik powinien zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje też `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów oraz wpisy katalogu instalacji dostawców udostępniają znormalizowane fakty o źródle instalacji obok surowego bloku `openclaw.install`. Znormalizowane fakty określają, czy specyfikacja npm jest dokładną wersją czy pływającym selektorem, czy obecne są oczekiwane metadane integralności oraz czy dostępna jest też lokalna ścieżka źródłowa. Gdy znana jest tożsamość katalogu/pakietu, znormalizowane fakty ostrzegają, jeśli przeanalizowana nazwa pakietu npm odbiega od tej tożsamości. Ostrzegają też, gdy `defaultChoice` jest nieprawidłowe lub wskazuje na niedostępne źródło, oraz gdy metadane integralności npm są obecne bez prawidłowego źródła npm. Konsumenci powinni traktować `installSource` jako dodatkowe pole opcjonalne, aby ręcznie tworzone wpisy i adaptery katalogów nie musiały go syntetyzować. Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródeł bez importowania środowiska wykonawczego Plugin.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` wraz z `expectedIntegrity`. Same nazwy pakietów i tagi dystrybucyjne nadal działają dla zgodności, ale pokazują ostrzeżenia płaszczyzny źródeł, aby katalog mógł przejść w kierunku przypiętych instalacji ze sprawdzaną integralnością bez psucia istniejących Plugin. Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje zarządzany wpis indeksu Plugin z `source: "path"` oraz względnym wobec obszaru roboczego `sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w `plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej w długotrwałej konfiguracji. Dzięki temu lokalne instalacje deweloperskie są widoczne dla diagnostyki płaszczyzny źródeł bez dodawania drugiej surowej powierzchni ujawniania ścieżek systemu plików. Utrwalony indeks Plugin `plugins/installs.json` jest źródłem prawdy instalacji i może być odświeżany bez ładowania modułów środowiska wykonawczego Plugin. Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest Plugin jest brakujący lub nieprawidłowy; jego tablica `plugins` jest odtwarzalnym widokiem manifestów.

## Plugin silnika kontekstu

Plugin silnika kontekstu są właścicielami orkiestracji kontekstu sesji dla pozyskiwania, składania i Compaction. Zarejestruj je z Plugin za pomocą `api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez `plugins.slots.contextEngine`.

Użyj tego, gdy Plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu, a nie tylko dodać wyszukiwanie pamięci lub hooki.

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

## Dodawanie nowej możliwości

Gdy Plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie obchodź systemu Plugin prywatnym sięgnięciem do wnętrza. Dodaj brakującą możliwość.

Zalecana kolejność:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, jakie współdzielone zachowanie powinien posiadać rdzeń: politykę, fallback, scalanie konfiguracji, cykl życia, semantykę widoczną dla kanału i kształt pomocnika środowiska wykonawczego.
2. dodaj typowane powierzchnie rejestracji/środowiska wykonawczego Plugin
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną typowaną powierzchnię możliwości.
3. połącz rdzeń i konsumentów kanału/funkcji
   Kanały i Plugin funkcji powinny korzystać z nowej możliwości przez rdzeń, a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Plugin dostawców rejestrują następnie swoje backendy względem możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostawały jawne z czasem.

W ten sposób OpenClaw pozostaje opiniotwórczy, nie stając się zakodowanym na stałe pod światopogląd jednego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture), aby uzyskać konkretną listę kontrolną plików i opracowany przykład.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna dotykać tych powierzchni razem:

- typy kontraktu rdzenia w `src/<capability>/types.ts`
- pomocnik uruchamiający/środowiska wykonawczego rdzenia w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API Plugin w `src/plugins/types.ts`
- okablowanie rejestru Plugin w `src/plugins/registry.ts`
- ekspozycja środowiska wykonawczego Plugin w `src/plugins/runtime/*`, gdy Plugin funkcji/kanałów muszą z niej korzystać
- pomocniki przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Plugin w `docs/`

Jeśli brakuje jednej z tych powierzchni, zwykle jest to znak, że możliwość nie jest jeszcze w pełni zintegrowana.

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

- rdzeń posiada kontrakt możliwości i orkiestrację
- Plugin dostawców posiadają implementacje dostawców
- Plugin funkcji/kanałów korzystają z pomocników środowiska wykonawczego
- testy kontraktu utrzymują jawną własność

## Powiązane

- [Architektura Plugin](/pl/plugins/architecture) — publiczny model i kształty możliwości
- [Podścieżki Plugin SDK](/pl/plugins/sdk-subpaths)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie Plugin](/pl/plugins/building-plugins)
