---
read_when:
    - Implementowanie haków środowiska uruchomieniowego dostawcy, cyklu życia kanału lub zestawów pakietów
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne mechanizmy architektury Plugin: potok ładowania, rejestr, hooki środowiska uruchomieniowego, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Dla publicznego modelu możliwości, kształtów pluginów oraz kontraktów własności/wykonywania zobacz [Architektura Pluginów](/pl/plugins/architecture). Ta strona jest
odniesieniem dla mechaniki wewnętrznej: potoku ładowania, rejestru, hooków runtime,
tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu to:

1. wykrywa kandydujące katalogi główne pluginów
2. odczytuje natywne lub zgodne manifesty pakietów i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły bundled używają natywnego loadera;
   lokalny źródłowy TypeScript firm trzecich używa awaryjnego fallbacku Jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje w rejestrze pluginów
8. udostępnia rejestr poleceniom/powierzchniom runtime

<Note>
`activate` to starszy alias `register` — loader rozwiązuje ten, który jest obecny (`def.register ?? def.activate`) i wywołuje go w tym samym punkcie. Wszystkie bundled pluginy używają `register`; w nowych pluginach preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny pluginu, ścieżka jest zapisywalna przez wszystkich albo własność
ścieżki wygląda podejrzanie dla pluginów nie-bundled.

Zablokowani kandydaci pozostają powiązani ze swoim identyfikatorem pluginu na potrzeby diagnostyki. Jeśli konfiguracja
nadal odwołuje się do tego identyfikatora, walidacja raportuje plugin jako obecny, ale zablokowany,
i wskazuje z powrotem ostrzeżenie o bezpieczeństwie ścieżki zamiast traktować wpis konfiguracji
jako nieaktualny.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikowania pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości pakietu
- walidacji `plugins.entries.<id>.config`
- uzupełniania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime pluginu

Dla natywnych pluginów moduł runtime jest częścią płaszczyzny danych. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy providerów.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania.
Są wyłącznie metadanymi opisującymi planowanie aktywacji i wykrywanie konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi konsumenci aktywacji live używają teraz wskazówek manifestu dotyczących poleceń, kanałów i providerów,
aby zawęzić ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów, które są właścicielami żądanego polecenia głównego
- konfiguracja kanału/rozwiązywanie pluginu zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora kanału
- jawna konfiguracja/rozwiązywanie runtime providera zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora providera
- planowanie uruchamiania Gateway używa `activation.onStartup` do jawnych importów startowych
  i rezygnacji ze startu; pluginy bez metadanych startowych ładują się tylko
  przez węższe wyzwalacze aktywacji

Preloady runtime w czasie żądania, które proszą o szeroki zakres `all`, nadal wyprowadzają
jawny efektywny zestaw identyfikatorów pluginów z konfiguracji, planowania startu, skonfigurowanych
kanałów, slotów i reguł automatycznego włączania. Jeśli wyprowadzony zestaw jest pusty, OpenClaw
ładuje pusty rejestr runtime zamiast rozszerzać zakres na każdy wykrywalny
plugin.

Planner aktywacji udostępnia zarówno API tylko z identyfikatorami dla istniejących wywołujących, jak i
API planu dla nowych diagnostyk. Wpisy planu raportują, dlaczego plugin został wybrany,
oddzielając jawne wskazówki plannera `activation.*` od fallbacku własności z manifestu,
takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki. Ten podział powodów jest granicą zgodności:
istniejące metadane pluginów nadal działają, a nowy kod może wykrywać szerokie wskazówki
lub zachowanie fallbacku bez zmiany semantyki ładowania runtime.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydujące pluginy, zanim wróci do
`setup-api` dla pluginów, które nadal potrzebują hooków runtime czasu konfiguracji. Listy konfiguracji
providerów używają manifestu `providerAuthChoices`, wyborów konfiguracji wyprowadzonych z deskryptorów
i metadanych katalogu instalacji bez ładowania runtime providera. Jawne
`setup.requiresRuntime: false` jest odcięciem tylko dla deskryptorów; pominięte
`requiresRuntime` zachowuje starszy fallback setup-api dla zgodności. Jeśli więcej
niż jeden wykryty plugin deklaruje ten sam znormalizowany identyfikator providera konfiguracji lub backendu CLI,
wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na
kolejności wykrywania. Gdy runtime konfiguracji jest wykonywany, diagnostyka rejestru raportuje
rozbieżność między `setup.providers` / `setup.cliBackends` a providerami lub backendami CLI
zarejestrowanymi przez setup-api bez blokowania starszych pluginów.

### Granica cache pluginów

OpenClaw nie cache'uje wyników wykrywania pluginów ani bezpośrednich danych rejestru manifestu
za oknami czasu zegarowego. Instalacje, edycje manifestu i zmiany ścieżek ładowania
muszą stać się widoczne przy następnym jawnym odczycie metadanych lub odbudowie snapshotu.
Parser pliku manifestu może utrzymywać ograniczony cache sygnatur plików oparty na
otwartej ścieżce manifestu, inode, rozmiarze i znacznikach czasu; ten cache tylko unika
ponownego parsowania niezmienionych bajtów i nie może cache'ować odpowiedzi dotyczących wykrywania, rejestru, właściciela ani
polityki.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektów, a nie ukryty cache.
Gorące ścieżki startu Gateway powinny przekazywać bieżący `PluginMetadataSnapshot`,
wyprowadzony `PluginLookUpTable` lub jawny rejestr manifestu przez łańcuch wywołań.
Walidacja konfiguracji, automatyczne włączanie przy starcie, bootstrap pluginów i wybór providera
mogą ponownie używać tych obiektów, dopóki reprezentują bieżącą konfigurację i
inwentarz pluginów. Wyszukiwanie konfiguracji nadal rekonstruuje metadane manifestu na żądanie,
chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestu; zachowaj to
jako fallback zimnej ścieżki zamiast dodawać ukryte cache wyszukiwania. Gdy wejście
się zmienia, odbuduj i zastąp snapshot zamiast mutować go lub zachowywać
kopie historyczne.
Widoki aktywnego rejestru pluginów i pomocniki bootstrapu bundled kanałów
powinny być przeliczane z bieżącego rejestru/root. Krótkotrwałe mapy są w porządku
w ramach jednego wywołania, aby deduplikować pracę lub chronić przed ponownym wejściem; nie mogą stać się procesowymi
cache'ami metadanych.

Dla ładowania pluginów trwałą warstwą cache jest ładowanie runtime. Może ponownie używać
stanu loadera, gdy kod lub zainstalowane artefakty są faktycznie ładowane, na przykład:

- `PluginLoaderCacheState` i zgodne aktywne rejestry runtime
- cache Jiti/modułów i cache loaderów publicznych powierzchni używane do unikania wielokrotnego importowania
  tej samej powierzchni runtime
- cache systemu plików dla zainstalowanych artefaktów pluginów
- krótkotrwałe mapy na wywołanie do normalizacji ścieżek lub rozwiązywania duplikatów

Te cache są szczegółami implementacji płaszczyzny danych. Nie mogą odpowiadać na
pytania płaszczyzny sterowania, takie jak „który plugin jest właścicielem tego providera?”, chyba że
wywołujący celowo poprosił o ładowanie runtime.

Nie dodawaj trwałych ani zegarowych cache dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestu
- rejestrów manifestu rekonstruowanych z indeksu zainstalowanych pluginów
- wyszukiwania właściciela providera, wyciszania modeli, polityki providera lub metadanych
  publicznych artefaktów
- żadnej innej odpowiedzi wyprowadzonej z manifestu, w której zmieniony manifest, zainstalowany indeks
  lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy odbudowują metadane manifestu z utrwalonego indeksu zainstalowanych pluginów,
rekonstruują ten rejestr na żądanie. Zainstalowany indeks jest trwałym
stanem płaszczyzny źródłowej; nie jest ukrytym wewnątrzprocesowym cache metadanych.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali core. Rejestrują się w
centralnym rejestrze pluginów.

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

Funkcje core następnie czytają z tego rejestru zamiast rozmawiać z modułami pluginów
bezpośrednio. Utrzymuje to ładowanie jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime core -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje tylko
jednego punktu integracji: „czytaj rejestr”, a nie „obsługuj specjalnie każdy
moduł pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy approval zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu
lub odrzuceniu żądania wiązania:

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
- `binding`: rozwiązane wiązanie dla zatwierdzonych żądań
- `request`: podsumowanie pierwotnego żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane konwersacji

Ten callback służy tylko do powiadamiania. Nie zmienia tego, komu wolno wiązać
konwersację, i uruchamia się po zakończeniu obsługi approval w core.

## Hooki runtime providerów

Pluginy providerów mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed runtime:
  `setup.providers[].envVars`, przestarzałe zgodnościowe `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) plus
  `applyConfigDefaults`.
- **Hooki runtime**: ponad 40 opcjonalnych hooków obejmujących auth, rozwiązywanie modeli,
  owijanie strumienia, poziomy thinking, politykę replay i endpointy usage. Zobacz
  pełną listę w [Kolejność i użycie hooków](#hook-order-and-usage).

OpenClaw nadal jest właścicielem ogólnej pętli agenta, failoveru, obsługi transkryptów i
polityki narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla providera
bez potrzeby posiadania całego niestandardowego transportu inferencji.

Użyj manifestu `setup.providers[].envVars`, gdy provider ma poświadczenia oparte na env,
które ogólne ścieżki auth/statusu/wyboru modelu powinny widzieć bez
ładowania runtime pluginu. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez
adapter zgodności w oknie deprecjacji, a pluginy nie-bundled,
które go używają, otrzymują diagnostykę manifestu. Użyj manifestu `providerAuthAliases`,
gdy jeden identyfikator providera powinien ponownie używać zmiennych env, profili auth,
auth opartego na konfiguracji i wyboru onboarding API-key innego identyfikatora providera. Użyj manifestu
`providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru auth powinny znać
identyfikator wyboru providera, etykiety grup i proste połączenie auth jedną flagą bez
ładowania runtime providera. Zachowaj runtime providera
`envVars` dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne konfiguracji
client-id/client-secret OAuth.

Użyj manifestu `channelEnvVars`, gdy kanał ma auth lub konfigurację sterowaną przez env, które
ogólny fallback shell-env, sprawdzenia konfiguracji/statusu lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność i użycie hooków

Dla pluginów modeli/providerów OpenClaw wywołuje hooki w przybliżeniu w tej kolejności.
Kolumna „Kiedy używać” jest szybkim przewodnikiem decyzyjnym.
Pola providerów tylko dla zgodności, których OpenClaw już nie wywołuje, takie jak
`ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie są
tu wymienione.

| #   | Hook                              | Co robi                                                                                                       | Kiedy używać                                                                                                                                      |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy w `models.providers` podczas generowania `models.json`                        | Dostawca jest właścicielem katalogu albo domyślnych wartości bazowego URL                                                                         |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne wartości konfiguracji należące do dostawcy podczas materializacji konfiguracji      | Domyślne wartości zależą od trybu uwierzytelniania, środowiska albo semantyki rodziny modeli dostawcy                                             |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje normalnej ścieżki rejestru/katalogu                                                 | _(nie jest to hook Plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normalizuje starsze lub podglądowe aliasy identyfikatorów modeli przed wyszukiwaniem                          | Dostawca jest właścicielem czyszczenia aliasów przed kanonicznym rozwiązywaniem modelu                                                           |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                                | Dostawca jest właścicielem czyszczenia transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                 |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/dostawcy                                     | Dostawca potrzebuje czyszczenia konfiguracji, które powinno należeć do Plugin; dołączone pomocniki rodziny Google stanowią też zabezpieczenie dla obsługiwanych wpisów konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisy kompatybilności natywnego użycia strumieniowego do dostawców konfiguracji                    | Dostawca potrzebuje poprawek metadanych natywnego użycia strumieniowego zależnych od endpointu                                                   |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie znacznikami env dla dostawców konfiguracji przed ładowaniem uwierzytelniania runtime | Dostawca ma należące do dostawcy rozwiązywanie klucza API ze znaczników env; `amazon-bedrock` ma tu także wbudowany resolver znaczników env AWS |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samodzielnie hostowane albo oparte na konfiguracji uwierzytelnianie bez utrwalania tekstu jawnego | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                             |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych placeholderów profili względem uwierzytelniania opartego na env/konfiguracji | Dostawca przechowuje syntetyczne profile placeholderów, które nie powinny mieć pierwszeństwa                                                     |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne upstreamowe identyfikatory modeli                                                                                     |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzewanie, po którym `resolveDynamicModel` uruchamia się ponownie                           | Dostawca potrzebuje metadanych z sieci przed rozwiązywaniem nieznanych identyfikatorów                                                           |
| 13  | `normalizeResolvedModel`          | Ostateczne przepisanie przed użyciem rozwiązanego modelu przez osadzony runner                                | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu rdzenia                                                                     |
| 14  | `contributeResolvedModelCompat`   | Wnosi flagi kompatybilności dla modeli vendora za innym zgodnym transportem                                   | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                                |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                               | Dostawca potrzebuje czyszczenia schematów rodziny transportu                                                                                    |
| 16  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                         | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                                |
| 17  | `resolveReasoningOutputMode`      | Wybiera natywny albo tagowany kontrakt wyjścia rozumowania                                                    | Dostawca potrzebuje tagowanego wyjścia rozumowania/finalnego zamiast natywnych pól                                                              |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji strumienia                                   | Dostawca potrzebuje domyślnych parametrów żądania albo czyszczenia parametrów per dostawca                                                       |
| 19  | `createStreamFn`                  | W pełni zastępuje normalną ścieżkę strumienia niestandardowym transportem                                    | Dostawca potrzebuje niestandardowego protokołu przewodowego, nie tylko wrappera                                                                 |
| 20  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu ogólnych wrapperów                                                        | Dostawca potrzebuje wrapperów kompatybilności nagłówków/treści/modelu żądania bez niestandardowego transportu                                   |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu lub metadane dla danej tury                                              | Dostawca chce, aby ogólne transporty wysyłały natywną dla dostawcy tożsamość tury                                                               |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket albo politykę wyciszenia sesji                                            | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji albo politykę fallbacku                                                       |
| 23  | `formatApiKey`                    | Formatter profilu uwierzytelniania: zapisany profil staje się runtime’owym ciągiem `apiKey`                  | Dostawca przechowuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokena runtime                                  |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania albo polityki błędów odświeżania    | Dostawca nie pasuje do współdzielonych refresherów `pi-ai`                                                                                     |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawy dołączana, gdy odświeżanie OAuth się nie powiedzie                                         | Dostawca potrzebuje należących do dostawcy wskazówek naprawy uwierzytelniania po błędzie odświeżania                                            |
| 26  | `matchesContextOverflowError`     | Należący do dostawcy matcher przepełnienia okna kontekstu                                                    | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wykryły                                                                |
| 27  | `classifyFailoverReason`          | Należąca do dostawcy klasyfikacja przyczyny przełączenia awaryjnego                                          | Dostawca może mapować surowe błędy API/transportu na limity szybkości/przeciążenie/itp.                                                        |
| 28  | `isCacheTtlEligible`              | Polityka cache promptów dla dostawców proxy/backhaul                                                         | Dostawca potrzebuje specyficznego dla proxy ograniczania TTL cache                                                                              |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po brakującym uwierzytelnianiu                                    | Dostawca potrzebuje specyficznej dla dostawcy wskazówki odzyskiwania po brakującym uwierzytelnianiu                                             |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                   | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                       |
| 31  | `resolveThinkingProfile`          | Zestaw poziomów `/think` specyficzny dla modelu, etykiety wyświetlania i wartość domyślna                    | Dostawca udostępnia niestandardową drabinę myślenia albo binarną etykietę dla wybranych modeli                                                  |
| 32  | `isBinaryThinking`                | Hook kompatybilności przełącznika rozumowania włącz/wyłącz                                                   | Dostawca udostępnia tylko binarne myślenie włącz/wyłącz                                                                                        |
| 33  | `supportsXHighThinking`           | Hook kompatybilności obsługi rozumowania `xhigh`                                                             | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                                |
| 34  | `resolveDefaultThinkingLevel`     | Hook kompatybilności domyślnego poziomu `/think`                                                             | Dostawca jest właścicielem domyślnej polityki `/think` dla rodziny modeli                                                                       |
| 35  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów profili live i wyboru smoke                                          | Dostawca jest właścicielem dopasowywania preferowanych modeli live/smoke                                                                        |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed wnioskowaniem             | Dostawca potrzebuje wymiany tokena albo krótkotrwałego poświadczenia żądania                                                                    |
| 37  | `resolveUsageAuth`                | Ustal dane uwierzytelniające użycia/rozliczeń dla `/usage` i powiązanych powierzchni stanu                                     | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/limitu lub innych danych uwierzytelniających użycie                                                               |
| 38  | `fetchUsageSnapshot`              | Pobierz i znormalizuj migawki użycia/limitu specyficzne dla dostawcy po rozstrzygnięciu uwierzytelniania                             | Dostawca potrzebuje specyficznego dla dostawcy punktu końcowego użycia lub parsera ładunku                                                                           |
| 39  | `createEmbeddingProvider`         | Zbuduj należący do dostawcy adapter osadzania dla pamięci/wyszukiwania                                                     | Zachowanie osadzania pamięci należy do Plugin dostawcy                                                                                    |
| 40  | `buildReplayPolicy`               | Zwróć zasadę odtwarzania kontrolującą obsługę transkrypcji dla dostawcy                                        | Dostawca potrzebuje niestandardowej zasady transkrypcji (na przykład usuwania bloków myślenia)                                                               |
| 41  | `sanitizeReplayHistory`           | Przepisz historię odtwarzania po ogólnym czyszczeniu transkrypcji                                                        | Dostawca potrzebuje specyficznych dla dostawcy przekształceń odtwarzania wykraczających poza współdzielone helpery Compaction                                                             |
| 42  | `validateReplayTurns`             | Przeprowadź końcową walidację tur odtwarzania lub zmianę ich kształtu przed osadzonym runnerem                                           | Transport dostawcy potrzebuje ściślejszej walidacji tur po ogólnym oczyszczeniu                                                                    |
| 43  | `onModelSelected`                 | Uruchom należące do dostawcy efekty uboczne po wyborze                                                                 | Dostawca potrzebuje telemetrii lub należącego do dostawcy stanu, gdy model staje się aktywny                                                                  |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców
obsługujące hooki, aż jeden faktycznie zmieni identyfikator modelu albo
transport/konfigurację. Dzięki temu aliasy i shimy zgodności dostawców działają
bez wymagania od wywołującego wiedzy, który wbudowany Plugin odpowiada za
przepisanie. Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu
konfiguracji z rodziny Google, wbudowany normalizator konfiguracji Google nadal
zastosuje to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu przewodowego albo
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

Wbudowane Pluginy dostawców łączą powyższe hooki, aby dopasować się do katalogu,
uwierzytelniania, myślenia, odtwarzania i potrzeb użycia każdego dostawcy.
Autorytatywny zestaw hooków znajduje się przy każdym Pluginie w `extensions/`;
ta strona ilustruje kształty zamiast odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogu przekazującego">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogli prezentować
    identyfikatory modeli z góry strumienia przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy punktów końcowych OAuth i użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` albo `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby przejąć wymianę tokenów i integrację `/usage`.
  </Accordion>
  <Accordion title="Rodziny odtwarzania i czyszczenia transkryptów">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom
    włączać politykę transkryptu przez `buildReplayPolicy`, zamiast ponownie
    implementować czyszczenie w każdym Pluginie.
  </Accordion>
  <Accordion title="Dostawcy tylko katalogu">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej
    pętli inferencji.
  </Accordion>
  <Accordion title="Pomocniki strumienia specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` i `context1m` znajdują się w publicznym
    połączeniu `api.ts` / `contract-api.ts` Pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Pomocniki środowiska uruchomieniowego

Pluginy mogą uzyskiwać dostęp do wybranych pomocników rdzenia przez
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

- `textToSpeech` zwraca normalny ładunek wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji rdzenia `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą resamplować/kodować dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla należących do dostawcy selektorów głosów lub przepływów konfiguracji.
- Listy głosów mogą zawierać bogatsze metadane, takie jak lokalizacja, płeć i tagi osobowości dla selektorów świadomych dostawcy.
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
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może posiadać
  dostawców tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw dodaje te
  kontrakty możliwości.

Dla rozumienia obrazu/audio/wideo Pluginy rejestrują jednego typowanego
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
- Generowanie wideo już stosuje ten sam wzorzec:
  - rdzeń posiada kontrakt możliwości i pomocnik środowiska uruchomieniowego
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

Dla pomocników środowiska uruchomieniowego rozumienia mediów Pluginy mogą wywoływać:

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
  model: "gpt-5.5",
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

Dla transkrypcji audio Pluginy mogą używać środowiska uruchomieniowego rozumienia mediów
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
  rozumienia obrazu/audio/wideo.
- `extractStructuredWithModel(...)` jest połączeniem dla Pluginów do ograniczonej
  ekstrakcji należącej do dostawcy, najpierw z obrazu. Dołącz co najmniej jedno wejście obrazu;
  wejścia tekstowe są uzupełniającym kontekstem.
  Pluginy produktowe posiadają swoje trasy i schematy, podczas gdy OpenClaw posiada
  granicę dostawcy/środowiska uruchomieniowego.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) i kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie zostanie utworzony wynik transkrypcji (na przykład pominięte/nieobsługiwane wejście).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą także uruchamiać działające w tle przebiegi subagentów przez `api.runtime.subagent`:

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

- `provider` i `model` są opcjonalnymi nadpisaniami na przebieg, a nie trwałymi zmianami sesji.
- OpenClaw honoruje te pola nadpisań tylko dla zaufanych wywołujących.
- Dla przebiegów fallback należących do Pluginu operatorzy muszą włączyć zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Niezaufane przebiegi subagentów Pluginów nadal działają, ale żądania nadpisań są odrzucane zamiast cicho wracać do wartości fallback.
- Sesje subagentów tworzone przez Plugin są tagowane identyfikatorem Pluginu tworzącego. Fallback `api.runtime.subagent.deleteSession(...)` może usuwać tylko te posiadane sesje; dowolne usuwanie sesji nadal wymaga żądania Gateway z zakresem administratora.

Dla wyszukiwania w sieci Pluginy mogą używać współdzielonego pomocnika środowiska uruchomieniowego zamiast
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

Pluginy mogą także rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` jest preferowaną współdzieloną powierzchnią dla Pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od opakowania narzędzia agenta.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania Gateway, albo `"plugin"` dla uwierzytelniania/weryfikacji Webhook zarządzanej przez Plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` usunięto i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia awaryjnego `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie uwierzytelniania.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów środowiska uruchomieniowego operatora. Służą do zarządzanych przez pluginy webhooków/weryfikacji podpisu, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu środowiska uruchomieniowego żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - uwierzytelnianie bearer współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy środowiska uruchomieniowego tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym wejściu) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` nie ma w tych żądaniach tras pluginów przenoszących tożsamość, zakres środowiska uruchomieniowego wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu uwierzytelniana przez gateway jest niejawną powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania dostępnego tylko dla administratora, wymagaj trybu uwierzytelniania przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia nowych pluginów używaj wąskich podścieżek SDK zamiast monolitycznego głównego barrelu `openclaw/plugin-sdk`. Podścieżki rdzenia:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji pluginu                      |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                 |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Główny schemat Zod `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich miejsc integracji — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno konsolidować się
na jednym kontrakcie `approvalCapability`, zamiast mieszać pola z niepowiązanych
pluginów. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki środowiska uruchomieniowego i konfiguracji znajdują się pod odpowiadającymi im, wyspecjalizowanymi podścieżkami `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiego barrelu zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` to przestarzałe shimy zgodności dla
starszych pluginów. Nowy kod powinien zamiast tego importować węższe, ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla katalogu głównego każdego dołączonego pakietu pluginu):

- `index.js` — wejście dołączonego pluginu
- `api.js` — barrel pomocników/typów
- `runtime-api.js` — barrel tylko dla środowiska uruchomieniowego
- `setup-entry.js` — wejście pluginu konfiguracji

Zewnętrzne pluginy powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu pluginu z rdzenia ani z innego pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji środowiska uruchomieniowego, gdy
istnieje, a następnie wracają do rozwiązanego pliku konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone pluginy używają ich obecnie. Nie są one
automatycznie długoterminowo zamrożonymi kontraktami zewnętrznymi — sprawdź odpowiednią stronę
referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzia wiadomości

Pluginy powinny posiadać własne, specyficzne dla kanału wkłady schematu `describeMessageTool(...)`
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Wspólna prezentacja wysyłania powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły przejścia awaryjnego, mapowanie dostawców i checklistę autora pluginu.

Pluginy zdolne do wysyłania deklarują, co potrafią renderować przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczenia

Rdzeń decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy wyjść awaryjnych UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych schematów natywnych pozostają eksportowane dla istniejących
pluginów zewnętrznych, ale nowe pluginy nie powinny ich używać.

## Rozwiązywanie celów kanału

Pluginy kanałów powinny posiadać własną semantykę celów specyficzną dla kanału. Wspólny
host wychodzący utrzymuj jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` lub `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informuje rdzeń, czy
  dane wejściowe powinny przejść bezpośrednio do rozwiązywania podobnego do identyfikatora zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest przejściem awaryjnym pluginu, gdy
  rdzeń potrzebuje końcowego, należącego do dostawcy rozwiązania po normalizacji lub po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za konstrukcję trasy sesji specyficznej dla dostawcy,
  gdy cel zostanie rozwiązany.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji o kategorii, które powinny nastąpić przed
  wyszukiwaniem peers/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do specyficznego dla dostawcy awaryjnego normalizowania, a nie do
  szerokiego wyszukiwania w katalogu.
- Utrzymuj natywne dla dostawcy identyfikatory, takie jak identyfikatory czatów, identyfikatory wątków, JID, uchwyty i identyfikatory pokojów,
  wewnątrz wartości `target` lub parametrów specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Użyj tego, gdy kanał potrzebuje opartych na konfiguracji peers/grup, takich jak:

- peers DM sterowani listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne awaryjne katalogi ograniczone do konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Specyficzna dla kanału inspekcja konta i normalizacja identyfikatorów powinny pozostać w
implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli dla inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin posiada specyficzne dla dostawcy identyfikatory modeli, domyślne
bazowe adresy URL lub metadane modeli ograniczone uwierzytelnianiem.

`catalog.order` kontroluje, kiedy katalog pluginu scala się względem wbudowanych
niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API lub env
- `profile`: dostawcy, którzy pojawiają się, gdy istnieją profile uwierzytelniania
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisać
wbudowany wpis dostawcy o tym samym identyfikatorze dostawcy.

Pluginy mogą także publikować tylko do odczytu wiersze modeli przez
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. To docelowa ścieżka dla powierzchni list/pomocy/selektora i obsługuje
wiersze `text`, `image_generation`, `video_generation` i `music_generation`.
Pluginy dostawców nadal odpowiadają za wywołania punktów końcowych live, wymianę tokenów i mapowanie
odpowiedzi dostawcy; rdzeń odpowiada za wspólny kształt wiersza, etykiety źródła i formatowanie
pomocy narzędzi mediów. Rejestracje dostawców generowania mediów automatycznie syntetyzują statyczne
wiersze katalogu z `defaultModel`, `models` i `capabilities`.

Zgodność:

- `discovery` nadal działa jako starszy alias, ale emituje ostrzeżenie o wycofaniu
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`
- `augmentModelCatalog` jest przestarzałe; dołączeni dostawcy powinni publikować
  dodatkowe wiersze przez `registerModelCatalogProvider`

## Inspekcja kanału tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką środowiska uruchomieniowego. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko zgłaszać błąd, gdy wymagane sekrety są niedostępne.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/naprawy konfiguracji
  nie powinny wymagać materializowania poświadczeń środowiska uruchomieniowego tylko po to, aby
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj wyłącznie opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy są istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby zgłosić dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i odpowiadającego mu pola
  źródła) wystarcza dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą zgłaszać „skonfigurowane, ale niedostępne w tej ścieżce
polecenia” zamiast ulegać awarii lub błędnie zgłaszać konto jako nieskonfigurowane.

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

Każdy wpis staje się pluginem. Jeśli pakiet wymienia wiele extensions, identyfikator pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginu za pomocą
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia,
bez zależności dev w środowisku uruchomieniowym), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów wymagających
buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł wyłącznie do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główne wejście pluginu podłącza także narzędzia, hooki lub inny kod tylko środowiska uruchomieniowego.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może przełączyć plugin kanału na tę samą ścieżkę `setupEntry` podczas fazy startu gateway
przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Użyj tego tylko wtedy, gdy `setupEntry` w pełni obejmuje powierzchnię uruchamiania, która musi istnieć,
zanim Gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis konfiguracji
musi zarejestrować każdą funkcjonalność należącą do kanału, od której zależy uruchomienie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim Gateway zacznie nasłuchiwać
- wszelkie metody, narzędzia lub usługi Gateway, które muszą istnieć w tym samym oknie czasowym

Jeśli Twój pełny wpis nadal jest właścicielem jakiejkolwiek wymaganej funkcjonalności uruchamiania, nie włączaj
tej flagi. Pozostaw Plugin przy domyślnym zachowaniu i pozwól OpenClaw załadować
pełny wpis podczas uruchamiania.

Dołączone kanały mogą także publikować pomocnicze powierzchnie kontraktu tylko do konfiguracji, z których core
może skorzystać przed załadowaniem pełnego środowiska wykonawczego kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi wypromować starszą konfigurację kanału z jednym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego wpisu Plugin.
Matrix jest obecnym dołączonym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego wypromowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery łatek konfiguracji utrzymują leniwe wykrywanie dołączonej powierzchni kontraktu. Czas
importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast
ponownie uruchamiać start dołączonego kanału podczas importu modułu.

Gdy te powierzchnie uruchamiania obejmują metody RPC Gateway, trzymaj je pod
prefiksem specyficznym dla Plugin. Przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze są rozwiązywane
do `operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

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

Pluginy kanałów mogą ogłaszać metadane konfiguracji/wykrywania przez `openclaw.channel` oraz
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

Przydatne pola `openclaw.channel` poza minimalnym przykładem:

- `detailLabel`: etykieta dodatkowa dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: zastępuje tekst linku do dokumentacji
- `preferOver`: identyfikatory Plugin/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący markdown dla decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach list skonfigurowanych kanałów, gdy ustawiono na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych selektorach konfiguracji/ustawiania, gdy ustawiono na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane ze względu na zgodność; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta, nawet gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM).
Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielonych przecinkami/średnikami/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji dostawców udostępniają
znormalizowane fakty o źródle instalacji obok surowego bloku `openclaw.install`. Te
znormalizowane fakty określają, czy specyfikacja npm jest dokładną wersją, czy zmiennym
selektorem, czy obecne są oczekiwane metadane integralności oraz czy dostępna jest również
lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana,
znormalizowane fakty ostrzegają, jeśli sparsowana nazwa pakietu npm odbiega od tej tożsamości.
Ostrzegają także, gdy `defaultChoice` jest nieprawidłowe lub wskazuje na źródło, które
nie jest dostępne, oraz gdy metadane integralności npm są obecne bez prawidłowego
źródła npm. Konsumenci powinni traktować `installSource` jako dodatkowe opcjonalne pole, aby
ręcznie zbudowane wpisy i nakładki katalogu nie musiały go syntetyzować.
Pozwala to procesom wdrażania i diagnostyce wyjaśniać stan płaszczyzny źródeł bez
importowania środowiska wykonawczego Plugin.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` plus
`expectedIntegrity`. Same nazwy pakietów i dist-tags nadal działają ze względu na
zgodność, ale pokazują ostrzeżenia płaszczyzny źródeł, aby katalog mógł przejść
w stronę przypiętych instalacji ze sprawdzoną integralnością bez psucia istniejących Pluginów.
Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje wpis indeksu zarządzanego Plugin
z `source: "path"` i względną wobec workspace
`sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w
`plugins.load.paths`; rekord instalacji unika powielania lokalnych ścieżek stacji roboczej
w długotrwałej konfiguracji. Dzięki temu lokalne instalacje deweloperskie są widoczne dla
diagnostyki płaszczyzny źródeł bez dodawania drugiej powierzchni ujawniania surowych ścieżek systemu plików.
Utrwalony indeks Plugin `plugins/installs.json` jest źródłem prawdy instalacji
i może być odświeżany bez ładowania modułów środowiska wykonawczego Plugin.
Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest Plugin jest brakujący lub
nieprawidłowy; jego tablica `plugins` jest odbudowywalnym widokiem manifestu.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu są właścicielami orkiestracji kontekstu sesji dla pobierania, składania
i Compaction. Zarejestruj je ze swojego Plugin za pomocą
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Użyj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu,
a nie tylko dodać wyszukiwanie pamięci lub haki.

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

Fabryka `ctx` udostępnia opcjonalne wartości `config`, `agentDir` i `workspaceDir`
do inicjalizacji w czasie konstruowania.

Jeśli Twój silnik **nie** jest właścicielem algorytmu Compaction, zachowaj zaimplementowane
`compact()` i deleguj je jawnie:

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

## Dodawanie nowej funkcjonalności

Gdy Plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu Plugin przez prywatne sięganie do środka. Dodaj brakującą funkcjonalność.

Zalecana kolejność:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie wspólne zachowanie powinien posiadać core: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę widoczną dla kanałów oraz kształt pomocnika środowiska wykonawczego.
2. dodaj typowane powierzchnie rejestracji/środowiska wykonawczego Plugin
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię funkcjonalności.
3. połącz core + konsumentów kanałów/funkcji
   Kanały i Pluginy funkcji powinny używać nowej funkcjonalności przez core,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców następnie rejestrują swoje backendy względem funkcjonalności.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostawały jawne z czasem.

Tak OpenClaw pozostaje opiniotwórczy bez zakodowania na stałe światopoglądu jednego
dostawcy. Zobacz [Capability Cookbook](/pl/plugins/adding-capabilities),
aby uzyskać konkretną listę kontrolną plików i przepracowany przykład.

### Lista kontrolna funkcjonalności

Gdy dodajesz nową funkcjonalność, implementacja zwykle powinna razem dotykać tych
powierzchni:

- typy kontraktu core w `src/<capability>/types.ts`
- runner/pomocnik środowiska wykonawczego core w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API Plugin w `src/plugins/types.ts`
- okablowanie rejestru Plugin w `src/plugins/registry.ts`
- ekspozycja środowiska wykonawczego Plugin w `src/plugins/runtime/*`, gdy Pluginy funkcji/kanałów
  muszą ją konsumować
- pomocniki przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Plugin w `docs/`

Jeśli brakuje jednej z tych powierzchni, zwykle jest to znak, że funkcjonalność
nie jest jeszcze w pełni zintegrowana.

### Szablon funkcjonalności

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

- core posiada kontrakt funkcjonalności + orkiestrację
- Pluginy dostawców posiadają implementacje dostawców
- Pluginy funkcji/kanałów konsumują pomocniki środowiska wykonawczego
- testy kontraktu utrzymują własność jako jawną

## Powiązane

- [Architektura Plugin](/pl/plugins/architecture) — publiczny model i kształty funkcjonalności
- [Podścieżki Plugin SDK](/pl/plugins/sdk-subpaths)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
