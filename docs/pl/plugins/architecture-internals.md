---
read_when:
    - Implementowanie haków runtime dostawcy, cyklu życia kanału lub pakietów paczek
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej funkcji Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne aspekty architektury Plugin: potok ładowania, rejestr, haki środowiska uruchomieniowego, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Publiczny model możliwości, kształty Plugin oraz kontrakty własności/wykonania
opisuje [Architektura Plugin](/pl/plugins/architecture). Ta strona jest
odniesieniem dla mechaniki wewnętrznej: potoku ładowania, rejestru, hooków
runtime, tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu to:

1. wykrywa katalogi główne kandydatów Plugin
2. odczytuje natywne lub zgodne manifesty pakietów oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły pakietowane używają natywnego loadera;
   lokalne źródła TypeScript firm trzecich używają awaryjnego fallbacku Jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje w rejestrze Plugin
8. udostępnia rejestr poleceniom i powierzchniom runtime

<Note>
`activate` jest starszym aliasem `register` — loader rozwiązuje dostępny wariant (`def.register ?? def.activate`) i wywołuje go w tym samym miejscu. Wszystkie pakietowane Plugin używają `register`; dla nowych Plugin preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny Plugin, ścieżka jest zapisywalna dla wszystkich
albo własność ścieżki wygląda podejrzanie w przypadku niepakietowanych Plugin.

Zablokowani kandydaci pozostają powiązani ze swoim identyfikatorem Plugin na potrzeby diagnostyki. Jeśli konfiguracja
nadal odwołuje się do tego identyfikatora, walidacja zgłasza Plugin jako obecny, ale zablokowany,
i wskazuje ostrzeżenie o bezpieczeństwie ścieżki zamiast traktować wpis konfiguracji
jako nieaktualny.

### Zachowanie oparte najpierw na manifeście

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikowania Plugin
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości pakietu
- walidowania `plugins.entries.<id>.config`
- uzupełniania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime Plugin

W przypadku natywnych Plugin moduł runtime jest częścią płaszczyzny danych. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy providerów.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania.
Są wyłącznie metadanymi opisującymi planowanie aktywacji i wykrywanie konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz podpowiedzi manifestu dotyczących poleceń, kanałów i providerów,
aby zawęzić ładowanie Plugin przed szerszą materializacją rejestru:

- ładowanie CLI zawęża zakres do Plugin, które są właścicielami żądanego polecenia głównego
- konfiguracja kanału/rozwiązywanie Plugin zawęża zakres do Plugin, które są właścicielami żądanego
  identyfikatora kanału
- jawna konfiguracja providera/rozwiązywanie runtime zawęża zakres do Plugin, które są właścicielami
  żądanego identyfikatora providera
- planowanie uruchamiania Gateway używa `activation.onStartup` dla jawnych importów
  startowych i rezygnacji ze startu; Plugin bez metadanych startowych ładują się tylko
  przez węższe wyzwalacze aktywacji

Preloady runtime w czasie żądania, które proszą o szeroki zakres `all`, nadal wyprowadzają
jawny efektywny zestaw identyfikatorów Plugin z konfiguracji, planowania startu, skonfigurowanych
kanałów, slotów i reguł automatycznego włączania. Jeśli wyprowadzony zestaw jest pusty, OpenClaw
ładuje pusty rejestr runtime zamiast rozszerzać zakres na każdy wykrywalny
Plugin.

Planer aktywacji udostępnia zarówno API zawierające tylko identyfikatory dla istniejących wywołań, jak i
API planu dla nowej diagnostyki. Wpisy planu raportują, dlaczego Plugin został wybrany,
oddzielając jawne podpowiedzi planera `activation.*` od fallbacku własności manifestu,
takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki. Ten podział przyczyn jest granicą zgodności:
istniejące metadane Plugin nadal działają, a nowy kod może wykrywać szerokie podpowiedzi
lub zachowanie fallbacku bez zmiany semantyki ładowania runtime.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydatów Plugin, zanim wróci do
`setup-api` dla Plugin, które nadal potrzebują hooków runtime w czasie konfiguracji. Listy konfiguracji
providerów używają manifestu `providerAuthChoices`, wyborów konfiguracji wyprowadzonych z deskryptorów
oraz metadanych katalogu instalacji bez ładowania runtime providera. Jawne
`setup.requiresRuntime: false` jest odcięciem wyłącznie deskryptorowym; pominięte
`requiresRuntime` zachowuje starszy fallback setup-api dla zgodności. Jeśli więcej
niż jeden wykryty Plugin deklaruje ten sam znormalizowany identyfikator providera konfiguracji lub backendu
CLI, wyszukiwanie konfiguracji odmawia niejednoznacznego właściciela zamiast polegać na
kolejności wykrywania. Gdy runtime konfiguracji faktycznie się wykonuje, diagnostyka rejestru raportuje
rozbieżność między `setup.providers` / `setup.cliBackends` a providerami lub backendami CLI
zarejestrowanymi przez setup-api, bez blokowania starszych Plugin.

### Granica cache Plugin

OpenClaw nie cache'uje wyników wykrywania Plugin ani bezpośrednich danych rejestru manifestów
za oknami czasu zegarowego. Instalacje, edycje manifestów i zmiany ścieżek ładowania
muszą być widoczne przy następnym jawnym odczycie metadanych lub odbudowie snapshotu.
Parser pliku manifestu może utrzymywać ograniczony cache sygnatur plików oparty na
otwartej ścieżce manifestu, inode, rozmiarze i znacznikach czasu; ten cache tylko unika
ponownego parsowania niezmienionych bajtów i nie może cache'ować odpowiedzi dotyczących wykrywania,
rejestru, właściciela ani polityki.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektu, a nie ukryty cache.
Gorące ścieżki uruchamiania Gateway powinny przekazywać aktualny `PluginMetadataSnapshot`,
wyprowadzoną `PluginLookUpTable` albo jawny rejestr manifestów przez łańcuch wywołań.
Walidacja konfiguracji, automatyczne włączanie przy starcie, bootstrap Plugin i wybór providera
mogą ponownie używać tych obiektów, dopóki reprezentują aktualną konfigurację i
inwentarz Plugin. Wyszukiwanie konfiguracji nadal rekonstruuje metadane manifestu na żądanie,
chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestów; traktuj to
jako fallback zimnej ścieżki zamiast dodawać ukryte cache wyszukiwania. Gdy dane wejściowe
się zmienią, odbuduj i zastąp snapshot zamiast mutować go lub trzymać
kopie historyczne.
Widoki aktywnego rejestru Plugin i helpery bootstrapu pakietowanych kanałów
powinny być ponownie obliczane z aktualnego rejestru/katalogu głównego. Krótkotrwałe mapy są w porządku
w ramach jednego wywołania, aby deduplikować pracę lub chronić ponowne wejście; nie mogą stać się
cache'ami metadanych procesu.

W przypadku ładowania Plugin trwałą warstwą cache jest ładowanie runtime. Może ponownie używać
stanu loadera, gdy kod lub zainstalowane artefakty są faktycznie ładowane, na przykład:

- `PluginLoaderCacheState` i zgodne aktywne rejestry runtime
- cache jiti/modułów oraz cache loadera powierzchni publicznych używane, aby unikać
  wielokrotnego importowania tej samej powierzchni runtime
- cache systemu plików dla zainstalowanych artefaktów Plugin
- krótkotrwałe mapy per wywołanie do normalizacji ścieżek lub rozwiązywania duplikatów

Te cache są szczegółami implementacyjnymi płaszczyzny danych. Nie mogą odpowiadać na
pytania płaszczyzny sterowania, takie jak „który Plugin jest właścicielem tego providera?”, chyba że
wywołujący celowo poprosił o ładowanie runtime.

Nie dodawaj trwałych ani zegarowych cache dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestów
- rejestrów manifestów rekonstruowanych z indeksu zainstalowanych Plugin
- wyszukiwania właściciela providera, tłumienia modeli, polityki providera lub metadanych publicznych artefaktów
- jakiejkolwiek innej odpowiedzi wyprowadzonej z manifestu, gdzie zmieniony manifest, zainstalowany indeks
  lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy odbudowują metadane manifestu z utrwalonego indeksu zainstalowanych Plugin,
rekonstruują ten rejestr na żądanie. Zainstalowany indeks jest trwałym
stanem płaszczyzny źródłowej; nie jest ukrytym cache metadanych w procesie.

## Model rejestru

Załadowane Plugin nie mutują bezpośrednio losowych globali rdzenia. Rejestrują się w
centralnym rejestrze Plugin.

Rejestr śledzi:

- rekordy Plugin (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i typowane hooki
- kanały
- providerów
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do Plugin

Funkcje rdzenia odczytują potem z tego rejestru zamiast komunikować się bezpośrednio
z modułami Plugin. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł Plugin -> rejestracja w rejestrze
- runtime rdzenia -> użycie rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia
potrzebuje tylko jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy
moduł Plugin”.

## Callbacki powiązania rozmowy

Plugin, które wiążą rozmowę, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu
żądania powiązania:

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
- `binding`: rozwiązane powiązanie dla zatwierdzonych żądań
- `request`: oryginalne podsumowanie żądania, podpowiedź odłączenia, identyfikator nadawcy i
  metadane rozmowy

Ten callback służy wyłącznie do powiadamiania. Nie zmienia tego, komu wolno powiązać
rozmowę, i uruchamia się po zakończeniu obsługi zatwierdzania przez rdzeń.

## Hooki runtime providera

Plugin providerów mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed runtime:
  `setup.providers[].envVars`, przestarzała zgodność `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Hooki runtime**: ponad 40 opcjonalnych hooków obejmujących auth, rozwiązywanie modeli,
  opakowywanie strumieni, poziomy myślenia, politykę replay oraz endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność i użycie hooków](#hook-order-and-usage).

OpenClaw nadal jest właścicielem ogólnej pętli agenta, failoveru, obsługi transkrypcji i
polityki narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla providera
bez potrzeby tworzenia całego niestandardowego transportu inferencji.

Użyj manifestu `setup.providers[].envVars`, gdy provider ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/wyboru modelu powinny widzieć bez
ładowania runtime Plugin. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez
adapter zgodności w okresie deprecjacji, a niepakietowane Plugin
używające go otrzymują diagnostykę manifestu. Użyj manifestu `providerAuthAliases`,
gdy jeden identyfikator providera powinien ponownie używać zmiennych env, profili auth,
auth opartego na konfiguracji i wyboru onboardingu klucza API innego identyfikatora providera. Użyj manifestu
`providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru auth powinny znać
identyfikator wyboru providera, etykiety grup i proste jednoflagowe okablowanie auth bez
ładowania runtime providera. Zachowaj runtime providera
`envVars` dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne konfiguracji
client-id/client-secret OAuth.

Użyj manifestu `channelEnvVars`, gdy kanał ma auth lub konfigurację sterowaną env, które
ogólny fallback shell-env, kontrole konfiguracji/statusu lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność i użycie hooków

Dla Plugin modeli/providerów OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” jest szybkim przewodnikiem decyzyjnym.
Pola providerów wyłącznie zgodnościowe, których OpenClaw już nie wywołuje, takie jak
`ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie są
tu wymienione.

| #   | Hook                              | Co robi                                                                                                            | Kiedy używać                                                                                                                                                 |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                            | Dostawca jest właścicielem katalogu lub domyślnych wartości bazowego adresu URL                                                                               |
| 2   | `applyConfigDefaults`             | Stosuje globalne wartości domyślne konfiguracji należące do dostawcy podczas materializacji konfiguracji           | Wartości domyślne zależą od trybu uwierzytelniania, środowiska lub semantyki rodziny modeli dostawcy                                                         |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje użyć normalnej ścieżki rejestru/katalogu                                                 | _(nie jest to hook Plugin)_                                                                                                                                  |
| 3   | `normalizeModelId`                | Normalizuje starsze aliasy lub aliasy podglądowych identyfikatorów modeli przed wyszukiwaniem                      | Dostawca odpowiada za oczyszczanie aliasów przed kanonicznym rozwiązywaniem modelu                                                                           |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                                     | Dostawca odpowiada za oczyszczanie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                                 |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem środowiska uruchomieniowego/dostawcy                      | Dostawca potrzebuje oczyszczania konfiguracji, które powinno należeć do pluginu; dołączone pomocniki rodziny Google zabezpieczają też obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje poprawki zgodności natywnego użycia strumieniowania do dostawców konfiguracji                              | Dostawca potrzebuje poprawek metadanych natywnego użycia strumieniowania sterowanych punktem końcowym                                                        |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie znacznikiem środowiskowym dla dostawców konfiguracji przed ładowaniem uwierzytelniania środowiska uruchomieniowego | Dostawcy udostępniają własne hooki rozwiązywania klucza API ze znacznika środowiskowego                                                                      |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samodzielnie hostowane lub oparte na konfiguracji uwierzytelnianie bez utrwalania tekstu jawnego | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania należące do dostawcy; domyślna wartość `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych symboli zastępczych profilu za uwierzytelnianiem opartym na środowisku/konfiguracji | Dostawca przechowuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                                     |
| 11  | `resolveDynamicModel`             | Synchroniczny mechanizm awaryjny dla identyfikatorów modeli należących do dostawcy, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli z usługi źródłowej                                                                                          |
| 12  | `prepareDynamicModel`             | Asynchroniczne przygotowanie, po którym `resolveDynamicModel` uruchamia się ponownie                              | Dostawca potrzebuje metadanych z sieci przed rozwiązywaniem nieznanych identyfikatorów                                                                       |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie, zanim osadzony mechanizm uruchamiania użyje rozwiązanego modelu                              | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu z rdzenia                                                                               |
| 14  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony mechanizm uruchamiania                                   | Dostawca potrzebuje oczyszczania schematów rodziny transportu                                                                                                |
| 15  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                             | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                                            |
| 16  | `resolveReasoningOutputMode`      | Wybiera natywny lub tagowany kontrakt wyjścia rozumowania                                                        | Dostawca potrzebuje tagowanego rozumowania/końcowego wyjścia zamiast pól natywnych                                                                           |
| 17  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi opakowaniami opcji strumienia                                     | Dostawca potrzebuje domyślnych parametrów żądania lub oczyszczania parametrów dla konkretnego dostawcy                                                       |
| 18  | `createStreamFn`                  | W pełni zastępuje normalną ścieżkę strumienia niestandardowym transportem                                        | Dostawca potrzebuje niestandardowego protokołu przewodowego, nie tylko opakowania                                                                            |
| 20  | `wrapStreamFn`                    | Opakowanie strumienia po zastosowaniu ogólnych opakowań                                                          | Dostawca potrzebuje opakowań zgodności nagłówków/treści/modelu żądania bez niestandardowego transportu                                                       |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu lub metadane dla pojedynczej tury                                            | Dostawca chce, aby ogólne transporty wysyłały natywną dla dostawcy tożsamość tury                                                                            |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub zasady wyciszenia sesji                                                   | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub zasady awaryjne                                                                        |
| 23  | `formatApiKey`                    | Formater profilu uwierzytelniania: zapisany profil staje się ciągiem `apiKey` środowiska uruchomieniowego       | Dostawca przechowuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokenu środowiska uruchomieniowego                           |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych punktów końcowych odświeżania lub zasad błędu odświeżania     | Dostawca nie pasuje do współdzielonych mechanizmów odświeżania OpenClaw                                                                                      |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawy dodawana, gdy odświeżanie OAuth się nie powiedzie                                              | Dostawca potrzebuje własnych wskazówek naprawy uwierzytelniania po błędzie odświeżania                                                                       |
| 26  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                       | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wykryły                                                                             |
| 27  | `classifyFailoverReason`          | Klasyfikacja przyczyny przełączenia awaryjnego należąca do dostawcy                                              | Dostawca może mapować surowe błędy API/transportu na limit szybkości/przeciążenie itd.                                                                       |
| 28  | `isCacheTtlEligible`              | Zasady pamięci podręcznej promptów dla dostawców proxy/backhaul                                                 | Dostawca potrzebuje bramkowania TTL pamięci podręcznej specyficznego dla proxy                                                                               |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania brakującego uwierzytelniania                                         | Dostawca potrzebuje wskazówki odzyskiwania brakującego uwierzytelniania specyficznej dla dostawcy                                                           |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dodawane po wykrywaniu                                                     | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                                    |
| 31  | `resolveThinkingProfile`          | Zestaw poziomów `/think` specyficzny dla modelu, etykiety wyświetlania i wartość domyślna                       | Dostawca udostępnia niestandardową drabinę myślenia lub etykietę binarną dla wybranych modeli                                                               |
| 32  | `isBinaryThinking`                | Hook zgodności przełącznika rozumowania włącz/wyłącz                                                            | Dostawca udostępnia tylko binarne włączanie/wyłączanie myślenia                                                                                              |
| 33  | `supportsXHighThinking`           | Hook zgodności obsługi rozumowania `xhigh`                                                                      | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                      | Dostawca jest właścicielem domyślnych zasad `/think` dla rodziny modeli                                                                                      |
| 35  | `isModernModelRef`                | Matcher nowoczesnego modelu dla filtrów profilu live i wyboru testu smoke                                       | Dostawca jest właścicielem dopasowania preferowanego modelu live/smoke                                                                                       |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz środowiska uruchomieniowego tuż przed inferencją | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                                  |
| 37  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                        | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/limitu lub innego poświadczenia użycia                                                         |
| 38  | `fetchUsageSnapshot`              | Pobierz i znormalizuj migawki użycia/limitu specyficzne dla dostawcy po rozstrzygnięciu uwierzytelniania       | Dostawca potrzebuje specyficznego dla dostawcy punktu końcowego użycia lub parsera ładunku                                                   |
| 39  | `createEmbeddingProvider`         | Zbuduj należący do dostawcy adapter osadzania dla pamięci/wyszukiwania                                         | Zachowanie osadzania pamięci należy do Plugin dostawcy                                                                                        |
| 40  | `buildReplayPolicy`               | Zwróć politykę replay kontrolującą obsługę transkryptu dla dostawcy                                            | Dostawca potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków myślenia)                                              |
| 41  | `sanitizeReplayHistory`           | Przepisz historię replay po ogólnym czyszczeniu transkryptu                                                    | Dostawca potrzebuje specyficznych dla dostawcy przekształceń replay wykraczających poza współdzielone pomocniki kompaktowania                |
| 42  | `validateReplayTurns`             | Końcowa walidacja lub przekształcenie tur replay przed osadzonym runnerem                                      | Transport dostawcy wymaga ściślejszej walidacji tur po ogólnym czyszczeniu                                                                   |
| 43  | `onModelSelected`                 | Uruchom należące do dostawcy efekty uboczne po wyborze                                                        | Dostawca potrzebuje telemetrii lub należącego do dostawcy stanu, gdy model staje się aktywny                                                 |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców
obsługujące hooki, aż któryś faktycznie zmieni identyfikator modelu albo transport/config. Dzięki temu
warstwy aliasów/zgodności dostawców nadal działają bez wymagania, aby wywołujący wiedział, który
wbudowany Plugin jest właścicielem przepisywania. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, wbudowany normalizator konfiguracji Google nadal zastosuje
to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu przewodowego albo niestandardowego wykonawcy żądań,
jest to inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowania dostawcy,
które nadal działa w normalnej pętli inferencji OpenClaw.

`resolveUsageAuth` decyduje, czy OpenClaw powinien wywołać `fetchUsageSnapshot`, czy
wrócić do ogólnego rozwiązywania poświadczeń dla powierzchni użycia/statusu. Zwróć
`{ token, accountId? }`, gdy dostawca ma poświadczenie użycia, zwróć
`{ handled: true }`, gdy obsługa uwierzytelniania użycia należąca do dostawcy obsłużyła żądanie i
musi wyłączyć ogólny fallback klucza API/OAuth, oraz zwróć `null` albo `undefined`,
gdy dostawca nie obsłużył uwierzytelniania użycia.

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
uwierzytelniania, rozumowania, odtwarzania i potrzeb użycia poszczególnych vendorów. Autorytatywny zestaw hooków znajduje się przy
każdym Pluginie w `extensions/`; ta strona ilustruje kształty zamiast
odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogły pokazywać nadrzędne
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` albo `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby posiadać wymianę tokenów i integrację `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączać
    politykę transkryptu przez `buildReplayPolicy`, zamiast aby każdy Plugin
    ponownie implementował czyszczenie.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli inferencji.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Nagłówki beta, `/fast` / `serviceTier` oraz `context1m` znajdują się w publicznym
    punkcie styku `api.ts` / `contract-api.ts` Pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Pomocniki runtime

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
- Używa konfiguracji `messages.tts` rdzenia i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą ponownie próbkować/kodować dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla należących do vendora selektorów głosów albo przepływów konfiguracji.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla selektorów świadomych dostawcy.
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
- Używaj dostawców mowy dla zachowania syntezy należącego do vendora.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin vendora może posiadać
  dostawców tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw doda te
  kontrakty funkcjonalności.

Dla rozumienia obrazów/audio/wideo Pluginy rejestrują jednego typowanego
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
- Zachowaj zachowanie vendora w Pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne funkcjonalności.
- Generowanie wideo już stosuje ten sam wzorzec:
  - rdzeń posiada kontrakt funkcjonalności i pomocnik runtime
  - Pluginy vendorów rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów korzystają z `api.runtime.videoGeneration.*`

Dla pomocników runtime rozumienia mediów Pluginy mogą wywoływać:

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

Dla transkrypcji audio Pluginy mogą użyć runtime rozumienia mediów
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
- `extractStructuredWithModel(...)` jest punktem styku dla Pluginów do ograniczonej
  ekstrakcji należącej do dostawcy i zaczynającej od obrazu. Dołącz co najmniej jedno wejście obrazu;
  wejścia tekstowe są kontekstem uzupełniającym.
  Pluginy produktowe posiadają swoje trasy i schematy, podczas gdy OpenClaw posiada
  granicę dostawcy/runtime.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) i kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie żadne wyjście transkrypcji (na przykład pominięte/nieobsługiwane wejście).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą także uruchamiać działające w tle przebiegi podagentów przez `api.runtime.subagent`:

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
- Dla należących do Pluginu przebiegów fallbacku operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Niezaufane przebiegi podagentów Pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho wracać do fallbacku.
- Sesje podagentów utworzone przez Plugin są tagowane identyfikatorem tworzącego Pluginu. Fallback `api.runtime.subagent.deleteSession(...)` może usuwać tylko te posiadane sesje; dowolne usuwanie sesji nadal wymaga żądania Gateway o zakresie administracyjnym.

Dla wyszukiwania w sieci Pluginy mogą używać współdzielonego pomocnika runtime zamiast
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
- Używaj dostawców wyszukiwania w sieci dla specyficznych dla vendora transportów wyszukiwania.
- `api.runtime.webSearch.*` jest preferowaną współdzieloną powierzchnią dla Pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzi agenta.

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

- `generate(...)`: wygeneruj obraz za pomocą skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: wyświetl dostępnych dostawców generowania obrazów i ich funkcjonalności.

## Trasy HTTP Gateway

Pluginy mogą udostępniać punkty końcowe HTTP za pomocą `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego uwierzytelniania gateway, albo `"plugin"` dla uwierzytelniania/weryfikacji Webhook zarządzanych przez plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przekazywania `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie uwierzytelniania.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Służą do Webhooków/weryfikacji podpisów zarządzanych przez plugin, a nie do uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - uwierzytelnianie bearer ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP niosące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym wejściu) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` nie ma w tych żądaniach tras pluginów niosących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu uwierzytelniana przez gateway jest niejawną powierzchnią administracyjną. Jeśli trasa wymaga zachowania dostępnego tylko dla administratora, wymagaj trybu uwierzytelniania niosącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia nowych pluginów używaj wąskich podścieżek SDK zamiast monolitycznej głównej beczki `openclaw/plugin-sdk`.
Podstawowe podścieżki:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji pluginu                      |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                 |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt parasolowy |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich połączeń — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno konsolidować się
na jednym kontrakcie `approvalCapability`, zamiast mieszać niepowiązane
pola pluginu. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki runtime i konfiguracji znajdują się pod odpowiadającymi im, wyspecjalizowanymi podścieżkami `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiej beczki zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
małe fasady pomocników kanału, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` to przestarzałe warstwy zgodności dla
starszych pluginów. Nowy kod powinien zamiast tego importować węższe, ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla katalogu głównego każdego pakietu pluginu wbudowanego):

- `index.js` — wejście pluginu wbudowanego
- `api.js` — beczka pomocników/typów
- `runtime-api.js` — beczka tylko dla runtime
- `setup-entry.js` — wejście pluginu konfiguracji

Pluginy zewnętrzne powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` pakietu innego pluginu z core ani z innego pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime, gdy taki
istnieje, a następnie wracają do rozwiązanego pliku konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ wbudowane pluginy używają ich obecnie. Nie są one
automatycznie długoterminowo zamrożonymi kontraktami zewnętrznymi — sprawdź odpowiednią stronę
referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzi wiadomości

Pluginy powinny być właścicielami specyficznych dla kanału wkładów schematu `describeMessageTool(...)`
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłania powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły fallbacku, mapowanie dostawców i listę kontrolną autora pluginu.

Pluginy zdolne do wysyłania deklarują, co potrafią renderować przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczenia

Core decyduje, czy renderować prezentację natywnie, czy degradować ją do tekstu.
Nie ujawniaj natywnych dla dostawcy awaryjnych wyjść UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
pluginów firm trzecich, ale nowe pluginy nie powinny ich używać.

## Rozwiązywanie celów kanału

Pluginy kanałów powinny być właścicielami semantyki celów specyficznej dla kanału. Utrzymuj współdzielony
host wychodzący jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` albo `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy
  wejście powinno od razu przejść do rozwiązywania podobnego do identyfikatora zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.reservedLiterals` wymienia gołe słowa, które są
  referencjami kanału/sesji dla tego dostawcy. Rozwiązywanie zachowuje skonfigurowane
  wpisy katalogu przed odrzuceniem zarezerwowanych literałów, a następnie zamyka się błędem przy
  braku trafienia w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest fallbackiem pluginu, gdy
  core potrzebuje końcowego, należącego do dostawcy rozstrzygnięcia po normalizacji albo po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za budowę trasy sesji
  specyficznej dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorii, które powinny nastąpić przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` jako fallbacku normalizacji specyficznej dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatów, identyfikatory wątków, JID, handle i identyfikatory pokojów,
  trzymaj wewnątrz wartości `target` albo parametrów specyficznych dla dostawcy, a nie w ogólnych
  polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Użyj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu ograniczone do konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja konta i normalizacja identyfikatorów specyficzna dla kanału powinny pozostać w
implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje w
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin jest właścicielem specyficznych dla dostawcy identyfikatorów modeli, domyślnych
wartości bazowego URL albo metadanych modeli chronionych uwierzytelnianiem.

`catalog.order` kontroluje, kiedy katalog pluginu scala się względem
wbudowanych, niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API lub env
- `profile`: dostawcy pojawiający się, gdy istnieją profile uwierzytelniania
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawców
- `late`: ostatni przebieg, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo zastąpić
wbudowany wpis dostawcy tym samym identyfikatorem dostawcy.

Pluginy mogą też publikować wiersze modeli tylko do odczytu przez
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. To przyszła ścieżka dla powierzchni list/pomocy/wybieraka i obsługuje
wiersze `text`, `image_generation`, `video_generation` oraz `music_generation`.
Pluginy dostawców nadal są właścicielami wywołań endpointów na żywo, wymiany tokenów i mapowania
odpowiedzi dostawcy; core jest właścicielem wspólnego kształtu wiersza, etykiet źródeł i formatowania
pomocy narzędzi medialnych. Rejestracje dostawców generowania mediów syntetyzują statyczne
wiersze katalogu automatycznie z `defaultModel`, `models` i `capabilities`.

Zgodność:

- `discovery` nadal działa jako starszy alias, ale emituje ostrzeżenie o wycofaniu
- jeśli zarejestrowane są zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`
- `augmentModelCatalog` jest przestarzałe; wbudowani dostawcy powinni publikować
  wiersze uzupełniające przez `registerModelCatalogProvider`

## Inspekcja kanału tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy naprawy doctor/config
  nie powinny musieć materializować poświadczeń runtime tylko po to, by
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
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i odpowiadającego pola źródła)
  wystarczy dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą zgłaszać „skonfigurowane, ale niedostępne w tej ścieżce
polecenia” zamiast ulegać awarii albo błędnie raportować konto jako nieskonfigurowane.

## Pakiety pakietów

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

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu dowiązań symbolicznych. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności Plugin za pomocą
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia,
bez zależności deweloperskich w czasie działania), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności Plugin jako „pure JS/TS” i unikaj pakietów wymagających
kompilacji `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł przeznaczony tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracyjnych dla wyłączonego kanałowego pluginu albo
gdy kanałowy plugin jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główny punkt wejścia pluginu podłącza także narzędzia, hooki lub inny kod
używany tylko w czasie działania.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć dla kanałowego pluginu tę samą ścieżkę `setupEntry` podczas fazy uruchamiania Gateway
przed rozpoczęciem nasłuchiwania, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startową, która musi istnieć
zanim Gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis konfiguracji
musi rejestrować każdą funkcjonalność należącą do kanału, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszystkie trasy HTTP, które muszą być dostępne, zanim Gateway zacznie nasłuchiwać
- wszystkie metody, narzędzia lub usługi Gateway, które muszą istnieć w tym samym oknie czasowym

Jeśli pełny punkt wejścia nadal posiada jakąkolwiek wymaganą funkcjonalność startową, nie włączaj
tej flagi. Pozostaw Plugin przy domyślnym zachowaniu i pozwól OpenClaw załadować
pełny punkt wejścia podczas uruchamiania.

Kanały dołączone do pakietu mogą także publikować pomocniki powierzchni kontraktu przeznaczone tylko do konfiguracji, które core
może sprawdzić przed załadowaniem pełnego środowiska uruchomieniowego kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi promować starszą konfigurację kanału z jednym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu.
Matrix jest obecnym przykładem dołączonym do pakietu: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery poprawek konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktu dołączonej do pakietu. Czas
importu pozostaje krótki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast
ponownie wchodzić w start kanału dołączonego do pakietu podczas importu modułu.

Gdy te powierzchnie startowe obejmują metody RPC Gateway, utrzymuj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się
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
wskazówki instalacji przez `openclaw.install`. Dzięki temu dane katalogu nie trafiają do core.

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
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący markdown dla decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał z powierzchni list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych selektorów konfiguracji, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta, nawet gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów ogłoszeń

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
selektorem, czy oczekiwane metadane integralności są obecne oraz czy dostępna jest także lokalna
ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana,
znormalizowane fakty ostrzegają, jeśli sparsowana nazwa pakietu npm odbiega od tej tożsamości.
Ostrzegają także, gdy `defaultChoice` jest nieprawidłowy lub wskazuje źródło, które
nie jest dostępne, oraz gdy metadane integralności npm są obecne bez prawidłowego
źródła npm. Konsumenci powinni traktować `installSource` jako addytywne pole opcjonalne, aby
ręcznie budowane wpisy i shim katalogu nie musiały go syntetyzować.
Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródłowej bez
importowania środowiska uruchomieniowego pluginu.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` plus
`expectedIntegrity`. Same nazwy pakietów i dist-tagi nadal działają dla
zgodności, ale ujawniają ostrzeżenia płaszczyzny źródłowej, aby katalog mógł przechodzić
w stronę przypiętych instalacji ze sprawdzoną integralnością bez psucia istniejących pluginów.
Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje zarządzany wpis indeksu
Plugin z `source: "path"` oraz względnym wobec workspace
`sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w
`plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej
do długotrwałej konfiguracji. Dzięki temu lokalne instalacje deweloperskie są widoczne dla
diagnostyki płaszczyzny źródłowej bez dodawania drugiej surowej powierzchni ujawniania ścieżek
systemu plików. Utrwalony wiersz SQLite `installed_plugin_index` jest źródłem prawdy
dla instalacji i można go odświeżyć bez ładowania modułów środowiska uruchomieniowego pluginu.
Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest pluginu jest brakujący lub
nieprawidłowy; jego ładunek `plugins` jest odtwarzalnym widokiem manifestu.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu odpowiadają za orkiestrację kontekstu sesji dla ingestii, składania
i Compaction. Zarejestruj je ze swojego pluginu za pomocą
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Użyj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu,
a nie tylko dodać wyszukiwanie pamięci lub hooki.

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
do inicjalizacji w czasie konstrukcji.

`assemble()` może zwrócić `contextProjection`, gdy aktywny harness ma
trwały wątek backendu. Pomiń go dla starszej projekcji per tura. Zwróć
`{ mode: "thread_bootstrap", epoch }`, gdy złożony kontekst powinien zostać
wstrzyknięty raz do wątku backendu i używany ponownie do czasu zmiany epoki. Zmień
epokę po zmianie semantycznego kontekstu silnika, na przykład po przebiegu
Compaction należącym do silnika. Hosty mogą zachować metadane wywołań narzędzi, kształt
wejścia oraz zredagowane wyniki narzędzi w projekcji thread-bootstrap, aby świeże
wątki backendu zachowały ciągłość narzędzi bez kopiowania surowych ładunków
zawierających sekrety.

Jeśli Twój silnik **nie** posiada algorytmu Compaction, pozostaw `compact()`
zaimplementowane i deleguj go jawnie:

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

Gdy Plugin potrzebuje zachowania, które nie mieści się w obecnym API, nie obchodź
systemu pluginów prywatnym sięganiem do środka. Dodaj brakującą funkcjonalność.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie współdzielone zachowanie powinien posiadać core: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę skierowaną do kanałów i kształt pomocników środowiska uruchomieniowego.
2. dodaj typowane powierzchnie rejestracji/środowiska uruchomieniowego pluginu
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię funkcjonalności.
3. podłącz core oraz konsumentów kanału/funkcji
   Kanały i pluginy funkcji powinny konsumować nową funkcjonalność przez core,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują następnie swoje backendy względem funkcjonalności.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

W ten sposób OpenClaw pozostaje opiniotwórczy, nie stając się na stałe powiązany ze światopoglądem jednego
dostawcy. Zobacz [Capability Cookbook](/pl/plugins/adding-capabilities), aby znaleźć konkretną listę kontrolną plików i opracowany przykład.

### Lista kontrolna funkcjonalności

Gdy dodajesz nową funkcjonalność, implementacja zwykle powinna obejmować razem te
powierzchnie:

- typy kontraktu core w `src/<capability>/types.ts`
- pomocnik runnera/środowiska uruchomieniowego core w `src/<capability>/runtime.ts`
- powierzchnię rejestracji API pluginu w `src/plugins/types.ts`
- podłączenie rejestru pluginów w `src/plugins/registry.ts`
- ekspozycję środowiska uruchomieniowego pluginu w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą ją konsumować
- pomocniki przechwytywania/testowe w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentację operatora/pluginu w `docs/`

Jeśli brakuje jednej z tych powierzchni, zwykle oznacza to, że funkcjonalność
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

- core jest właścicielem kontraktu capability i orkiestracji
- pluginy dostawców są właścicielami implementacji dostawców
- pluginy funkcji/kanałów używają helperów runtime
- testy kontraktu utrzymują jawne ownership

## Powiązane

- [Architektura Plugin](/pl/plugins/architecture) — publiczny model capability i kształty
- [Podścieżki Plugin SDK](/pl/plugins/sdk-subpaths)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
