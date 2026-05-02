---
read_when:
    - Implementowanie hooków środowiska wykonawczego dostawcy, cyklu życia kanału lub zestawów pakietów
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzne mechanizmy architektury Plugin: potok ładowania, rejestr, hooki czasu wykonywania, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Plugin
x-i18n:
    generated_at: "2026-05-02T09:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Dla publicznego modelu możliwości, kształtów pluginów oraz kontraktów własności/wykonywania zobacz [Architektura Pluginów](/pl/plugins/architecture). Ta strona jest dokumentacją referencyjną mechanizmów wewnętrznych: potoku ładowania, rejestru, hooków środowiska uruchomieniowego, tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw robi mniej więcej to:

1. wykrywa katalogi główne kandydatów na pluginy
2. odczytuje natywne lub kompatybilne manifesty pakietów oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły dołączone używają natywnego loadera;
   lokalne źródła TypeScript firm trzecich używają awaryjnego fallbacku Jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje w rejestrze pluginów
8. udostępnia rejestr poleceniom i powierzchniom środowiska uruchomieniowego

<Note>
`activate` to starszy alias `register` — loader rozwiązuje ten, który jest obecny (`def.register ?? def.activate`) i wywołuje go w tym samym momencie. Wszystkie dołączone pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem środowiska uruchomieniowego. Kandydaci są blokowani, gdy punkt wejścia wychodzi poza katalog główny pluginu, ścieżka jest zapisywalna dla wszystkich lub własność ścieżki wygląda podejrzanie w przypadku pluginów niedołączonych.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go, aby:

- identyfikować plugin
- wykrywać zadeklarowane kanały/skills/schemat konfiguracji lub możliwości pakietu
- walidować `plugins.entries.<id>.config`
- rozszerzać etykiety/placeholdery Control UI
- pokazywać metadane instalacji/katalogu
- zachowywać tanie deskryptory aktywacji i konfiguracji bez ładowania środowiska uruchomieniowego pluginu

W przypadku pluginów natywnych moduł środowiska uruchomieniowego jest częścią płaszczyzny danych. Rejestruje rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy providera.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania. Są wyłącznie metadanymi opisującymi planowanie aktywacji i wykrywanie konfiguracji; nie zastępują rejestracji środowiska uruchomieniowego, `register(...)` ani `setupEntry`.
Pierwsi konsumenci aktywacji live używają teraz wskazówek manifestu dotyczących poleceń, kanałów i providerów, aby zawęzić ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów, które są właścicielami żądanego polecenia głównego
- konfiguracja/rozwiązywanie pluginu kanału zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora kanału
- jawna konfiguracja/rozwiązywanie środowiska uruchomieniowego providera zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora providera
- planowanie uruchamiania Gateway używa `activation.onStartup` dla jawnych importów startowych
  i rezygnacji ze startu; pluginy bez metadanych startowych ładują się tylko
  przez węższe wyzwalacze aktywacji

Planer aktywacji udostępnia zarówno API zawierające tylko identyfikatory dla istniejących wywołujących, jak i API planu dla nowych diagnostyk. Wpisy planu raportują, dlaczego plugin został wybrany, oddzielając jawne wskazówki planera `activation.*` od fallbacku własności manifestu, takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` i hooki. Ten podział przyczyn jest granicą kompatybilności: istniejące metadane pluginów nadal działają, a nowy kod może wykrywać szerokie wskazówki lub zachowanie fallbacku bez zmieniania semantyki ładowania środowiska uruchomieniowego.

Wykrywanie konfiguracji preferuje teraz identyfikatory posiadane przez deskryptory, takie jak `setup.providers` i `setup.cliBackends`, aby zawęzić pluginy kandydujące, zanim przejdzie do fallbacku `setup-api` dla pluginów, które nadal potrzebują hooków środowiska uruchomieniowego w czasie konfiguracji. Listy konfiguracji providerów używają manifestu `providerAuthChoices`, wyborów konfiguracji pochodzących z deskryptorów oraz metadanych katalogu instalacji bez ładowania środowiska uruchomieniowego providera. Jawne `setup.requiresRuntime: false` jest odcięciem tylko deskryptorowym; pominięte `requiresRuntime` zachowuje starszy fallback setup-api dla kompatybilności. Jeśli więcej niż jeden wykryty plugin deklaruje ten sam znormalizowany identyfikator providera konfiguracji lub backendu CLI, wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na kolejności wykrywania. Gdy środowisko uruchomieniowe konfiguracji jednak się wykonuje, diagnostyka rejestru raportuje rozbieżności między `setup.providers` / `setup.cliBackends` a providerami lub backendami CLI zarejestrowanymi przez setup-api, bez blokowania starszych pluginów.

### Granica pamięci podręcznej pluginów

OpenClaw nie buforuje wyników wykrywania pluginów ani bezpośrednich danych rejestru manifestów za oknami zegara ściennego. Instalacje, edycje manifestów i zmiany ścieżek ładowania muszą być widoczne przy następnym jawnym odczycie metadanych lub przebudowie migawki.
Parser pliku manifestu może utrzymywać ograniczoną pamięć podręczną sygnatur plików, kluczowaną otwartą ścieżką manifestu, inode, rozmiarem i znacznikami czasu; ta pamięć podręczna tylko unika ponownego parsowania niezmienionych bajtów i nie może buforować odpowiedzi dotyczących wykrywania, rejestru, właściciela ani polityki.

Bezpieczna szybka ścieżka metadanych to jawna własność obiektu, a nie ukryta pamięć podręczna.
Gorące ścieżki uruchamiania Gateway powinny przekazywać bieżący `PluginMetadataSnapshot`, pochodny `PluginLookUpTable` albo jawny rejestr manifestów przez łańcuch wywołań. Walidacja konfiguracji, automatyczne włączanie przy starcie, bootstrap pluginu i wybór providera mogą ponownie używać tych obiektów, dopóki reprezentują bieżącą konfigurację i inwentarz pluginów. Wyszukiwanie konfiguracji nadal rekonstruuje metadane manifestu na żądanie, chyba że konkretna ścieżka konfiguracji otrzyma jawny rejestr manifestów; zachowaj to jako fallback zimnej ścieżki zamiast dodawać ukryte pamięci podręczne wyszukiwania. Gdy wejście się zmienia, przebuduj i zastąp migawkę, zamiast ją mutować lub przechowywać historyczne kopie.
Widoki nad aktywnym rejestrem pluginów oraz pomocniki bootstrapu dołączonych kanałów powinny być przeliczane z bieżącego rejestru/katalogu głównego. Krótkotrwałe mapy są w porządku w obrębie jednego wywołania do deduplikacji pracy lub ochrony przed ponownym wejściem; nie mogą stać się procesowymi pamięciami podręcznymi metadanych.

Dla ładowania pluginów trwałą warstwą pamięci podręcznej jest ładowanie środowiska uruchomieniowego. Może ona ponownie używać stanu loadera, gdy kod lub zainstalowane artefakty są rzeczywiście ładowane, na przykład:

- `PluginLoaderCacheState` i kompatybilne aktywne rejestry środowiska uruchomieniowego
- pamięci podręczne jiti/modułów oraz pamięci podręczne loadera powierzchni publicznej używane do unikania wielokrotnego importowania
  tej samej powierzchni środowiska uruchomieniowego
- pamięci podręczne systemu plików dla zainstalowanych artefaktów pluginów
- krótkotrwałe mapy na wywołanie do normalizacji ścieżek lub rozwiązywania duplikatów

Te pamięci podręczne są szczegółami implementacji płaszczyzny danych. Nie mogą odpowiadać na pytania płaszczyzny sterowania, takie jak „który plugin jest właścicielem tego providera?”, chyba że wywołujący celowo poprosił o ładowanie środowiska uruchomieniowego.

Nie dodawaj trwałych ani opartych na zegarze ściennym pamięci podręcznych dla:

- wyników wykrywania
- bezpośrednich rejestrów manifestów
- rejestrów manifestów rekonstruowanych z indeksu zainstalowanych pluginów
- wyszukiwania właściciela providera, tłumienia modeli, polityki providera lub metadanych artefaktów publicznych
- żadnej innej odpowiedzi pochodzącej z manifestu, w której zmieniony manifest, zainstalowany indeks
  lub ścieżka ładowania powinny być widoczne przy następnym odczycie metadanych

Wywołujący, którzy przebudowują metadane manifestu z utrwalonego indeksu zainstalowanych pluginów, rekonstruują ten rejestr na żądanie. Zainstalowany indeks jest trwałym stanem płaszczyzny źródłowej; nie jest ukrytą wewnątrzprocesową pamięcią podręczną metadanych.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali rdzenia. Rejestrują się w centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i typowane hooki
- kanały
- providerów
- obsługujące Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do pluginów

Funkcje rdzenia następnie czytają z tego rejestru zamiast rozmawiać bezpośrednio z modułami pluginów. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- środowisko uruchomieniowe rdzenia -> użycie rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia potrzebuje tylko jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu żądania wiązania:

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
- `request`: podsumowanie pierwotnego żądania, wskazówka odłączenia, identyfikator nadawcy oraz
  metadane konwersacji

Ten callback służy wyłącznie do powiadamiania. Nie zmienia tego, kto może wiązać konwersację, i uruchamia się po zakończeniu obsługi zatwierdzania przez rdzeń.

## Hooki środowiska uruchomieniowego providera

Pluginy providerów mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed środowiskiem uruchomieniowym:
  `setup.providers[].envVars`, przestarzała kompatybilność `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) plus
  `applyConfigDefaults`.
- **Hooki środowiska uruchomieniowego**: ponad 40 opcjonalnych hooków obejmujących uwierzytelnianie, rozwiązywanie modeli,
  opakowywanie strumienia, poziomy myślenia, politykę replay i endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność hooków i użycie](#hook-order-and-usage).

OpenClaw nadal posiada ogólną pętlę agenta, failover, obsługę transkryptu i politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla providera, bez potrzeby tworzenia całego niestandardowego transportu inferencji.

Używaj manifestu `setup.providers[].envVars`, gdy provider ma poświadczenia oparte na zmiennych środowiskowych, które ogólne ścieżki uwierzytelniania/statusu/wyboru modelu powinny widzieć bez ładowania środowiska uruchomieniowego pluginu. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez adapter kompatybilności w oknie deprecjacji, a niedołączone pluginy, które go używają, otrzymują diagnostykę manifestu. Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator providera powinien ponownie używać zmiennych środowiskowych, profili uwierzytelniania, uwierzytelniania opartego na konfiguracji oraz wyboru onboardingowego klucza API innego identyfikatora providera. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru uwierzytelniania powinny znać identyfikator wyboru providera, etykiety grup i proste okablowanie uwierzytelniania jedną flagą bez ładowania środowiska uruchomieniowego providera. Zachowaj `envVars` środowiska uruchomieniowego providera dla wskazówek widocznych dla operatora, takich jak etykiety onboardingu lub zmienne konfiguracji OAuth client-id/client-secret.

Używaj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowane zmiennymi środowiskowymi, które ogólny fallback shell-env, kontrole konfiguracji/statusu albo prompty konfiguracji powinny widzieć bez ładowania środowiska uruchomieniowego kanału.

### Kolejność hooków i użycie

Dla pluginów modelu/providera OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” jest szybkim przewodnikiem decyzyjnym.
Pola providerów tylko dla kompatybilności, których OpenClaw już nie wywołuje, takie jak `ProviderPlugin.capabilities` i `suppressBuiltInModel`, celowo nie są tutaj wymienione.

| #   | Hak                               | Co robi                                                                                                        | Kiedy używać                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                        | Dostawca ma własny katalog lub domyślne wartości bazowego URL                                                                                 |
| 2   | `applyConfigDefaults`             | Stosuje należące do dostawcy globalne wartości domyślne konfiguracji podczas materializacji konfiguracji       | Wartości domyślne zależą od trybu uwierzytelniania, środowiska lub semantyki rodziny modeli dostawcy                                          |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(nie jest to hak pluginu)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normalizuje starsze lub podglądowe aliasy identyfikatorów modeli przed wyszukiwaniem                           | Dostawca odpowiada za czyszczenie aliasów przed kanonicznym rozpoznaniem modelu                                                               |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                                 | Dostawca odpowiada za czyszczenie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                   |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozpoznaniem środowiska uruchomieniowego/dostawcy                    | Dostawca potrzebuje czyszczenia konfiguracji, które powinno znajdować się w pluginie; dołączone pomocniki rodziny Google także zabezpieczają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje natywne poprawki zgodności użycia strumieniowego do dostawców konfiguracji                             | Dostawca potrzebuje poprawek metadanych natywnego użycia strumieniowego zależnych od punktu końcowego                                         |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie znacznikiem środowiskowym dla dostawców konfiguracji przed ładowaniem uwierzytelniania środowiska uruchomieniowego | Dostawca ma własne rozwiązywanie klucza API ze znacznika środowiskowego; `amazon-bedrock` ma tu także wbudowany resolver znacznika środowiskowego AWS |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/samodzielnie hostowane lub oparte na konfiguracji uwierzytelnianie bez utrwalania tekstu jawnego | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Nakłada należące do dostawcy zewnętrzne profile uwierzytelniania; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych symboli zastępczych profilu względem uwierzytelniania opartego na środowisku/konfiguracji | Dostawca przechowuje syntetyczne profile zastępcze, które nie powinny mieć pierwszeństwa                                                      |
| 11  | `resolveDynamicModel`             | Synchroniczna rezerwa dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                     |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po którym `resolveDynamicModel` uruchamia się ponownie                              | Dostawca potrzebuje metadanych sieciowych przed rozpoznaniem nieznanych identyfikatorów                                                       |
| 13  | `normalizeResolvedModel`          | Ostateczne przepisanie, zanim osadzony runner użyje rozpoznanego modelu                                        | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu rdzenia                                                                  |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi zgodności dla modeli dostawców za innym zgodnym transportem                                       | Dostawca rozpoznaje własne modele w transportach proxy bez przejmowania dostawcy                                                              |
| 15  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                                | Dostawca potrzebuje czyszczenia schematów rodziny transportu                                                                                  |
| 16  | `inspectToolSchemas`              | Udostępnia należącą do dostawcy diagnostykę schematów po normalizacji                                          | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                             |
| 17  | `resolveReasoningOutputMode`      | Wybiera kontrakt wyjścia rozumowania: natywny albo tagowany                                                    | Dostawca potrzebuje tagowanego rozumowania/wyjścia końcowego zamiast pól natywnych                                                            |
| 18  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji strumienia                                     | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów dla konkretnego dostawcy                                         |
| 19  | `createStreamFn`                  | W pełni zastępuje zwykłą ścieżkę strumienia niestandardowym transportem                                        | Dostawca potrzebuje niestandardowego protokołu przewodowego, a nie tylko wrappera                                                             |
| 20  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu ogólnych wrapperów                                                          | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modelu żądania bez niestandardowego transportu                                       |
| 21  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu dla każdej tury                                               | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                                 |
| 22  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę schładzania sesji                                              | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę rezerwową                                                      |
| 23  | `formatApiKey`                    | Formatter profilu uwierzytelniania: zapisany profil staje się łańcuchem `apiKey` środowiska uruchomieniowego  | Dostawca przechowuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokenu środowiska uruchomieniowego            |
| 24  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych punktów końcowych odświeżania lub polityki niepowodzeń odświeżania | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                    |
| 25  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana, gdy odświeżanie OAuth się nie powiedzie                                         | Dostawca potrzebuje własnych wskazówek naprawy uwierzytelniania po niepowodzeniu odświeżania                                                  |
| 26  | `matchesContextOverflowError`     | Należący do dostawcy mechanizm dopasowania przepełnienia okna kontekstu                                        | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wykryły                                                              |
| 27  | `classifyFailoverReason`          | Należąca do dostawcy klasyfikacja przyczyny przełączenia awaryjnego                                            | Dostawca może mapować surowe błędy API/transportu na limit szybkości/przeciążenie/itp.                                                        |
| 28  | `isCacheTtlEligible`              | Polityka pamięci podręcznej promptów dla dostawców proxy/backhaul                                              | Dostawca potrzebuje bramkowania TTL pamięci podręcznej specyficznego dla proxy                                                                |
| 29  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania brakującego uwierzytelniania                                        | Dostawca potrzebuje specyficznej dla dostawcy wskazówki odzyskiwania brakującego uwierzytelniania                                             |
| 30  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykrywaniu                                                   | Dostawca potrzebuje syntetycznych wierszy zgodności w przód w `models list` i selektorach                                                     |
| 31  | `resolveThinkingProfile`          | Specyficzny dla modelu zestaw poziomów `/think`, etykiety wyświetlania i wartość domyślna                      | Dostawca udostępnia niestandardową drabinę myślenia lub etykietę binarną dla wybranych modeli                                                 |
| 32  | `isBinaryThinking`                | Hak zgodności przełącznika rozumowania włącz/wyłącz                                                            | Dostawca udostępnia tylko binarne myślenie włącz/wyłącz                                                                                       |
| 33  | `supportsXHighThinking`           | Hak zgodności obsługi rozumowania `xhigh`                                                                      | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                              |
| 34  | `resolveDefaultThinkingLevel`     | Hak zgodności domyślnego poziomu `/think`                                                                      | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                           |
| 35  | `isModernModelRef`                | Mechanizm dopasowania nowoczesnych modeli dla filtrów profili live i wyboru smoke                              | Dostawca odpowiada za dopasowanie preferowanego modelu live/smoke                                                                             |
| 36  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz środowiska uruchomieniowego tuż przed inferencją | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                   |
| 37  | `resolveUsageAuth`                | Rozwiąż dane uwierzytelniające użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                                     | Dostawca wymaga niestandardowego parsowania tokena użycia/limitu albo innych danych uwierzytelniających użycia                                                               |
| 38  | `fetchUsageSnapshot`              | Pobierz i znormalizuj specyficzne dla dostawcy migawki użycia/limitu po rozwiązaniu uwierzytelniania                             | Dostawca wymaga specyficznego dla dostawcy punktu końcowego użycia albo parsera payloadu                                                                           |
| 39  | `createEmbeddingProvider`         | Zbuduj należący do dostawcy adapter osadzania dla pamięci/wyszukiwania                                                     | Zachowanie osadzania pamięci należy do Plugin dostawcy                                                                                    |
| 40  | `buildReplayPolicy`               | Zwróć politykę powtórki kontrolującą obsługę transkryptu dla dostawcy                                        | Dostawca wymaga niestandardowej polityki transkryptu (na przykład usuwania bloków myślenia)                                                               |
| 41  | `sanitizeReplayHistory`           | Przepisz historię powtórki po ogólnym czyszczeniu transkryptu                                                        | Dostawca wymaga specyficznych dla dostawcy przepisów powtórki wykraczających poza współdzielone pomocniki Compaction                                                             |
| 42  | `validateReplayTurns`             | Wykonaj końcową walidację tur powtórki albo zmianę ich kształtu przed osadzonym modułem uruchamiającym                                           | Transport dostawcy wymaga bardziej rygorystycznej walidacji tur po ogólnym oczyszczeniu                                                                    |
| 43  | `onModelSelected`                 | Uruchom należące do dostawcy efekty uboczne po wyborze                                                                 | Dostawca wymaga telemetrii albo należącego do dostawcy stanu, gdy model staje się aktywny                                                                  |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców
obsługujące hooki, aż któryś faktycznie zmieni identyfikator modelu albo transport/konfigurację. Dzięki temu
shimy aliasów/zgodności dostawców działają bez wymagania od wywołującego wiedzy, który
wbudowany Plugin jest właścicielem przepisania. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, wbudowany normalizator konfiguracji Google nadal zastosuje
to czyszczenie zgodności.

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

### Przykłady wbudowane

Dołączone Pluginy dostawców łączą powyższe hooki, aby dopasować się do katalogu,
uwierzytelniania, myślenia, odtwarzania i potrzeb użycia każdego dostawcy. Autorytatywny zestaw hooków znajduje się przy
każdym Pluginie w `extensions/`; ta strona ilustruje kształty, zamiast
odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogu przekazującego">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogli udostępniać źródłowe
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy OAuth i endpointów użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` albo `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby odpowiadać za wymianę tokenów i integrację `/usage`.
  </Accordion>
  <Accordion title="Rodziny odtwarzania i czyszczenia transkrypcji">
    Wspólne nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączyć
    politykę transkrypcji przez `buildReplayPolicy`, zamiast aby każdy Plugin
    ponownie implementował czyszczenie.
  </Accordion>
  <Accordion title="Dostawcy wyłącznie katalogowi">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` i
    `volcengine` rejestrują tylko `catalog` i korzystają ze wspólnej pętli inferencji.
  </Accordion>
  <Accordion title="Pomocniki strumienia specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` oraz `context1m` znajdują się w
    publicznym styku `api.ts` / `contract-api.ts` Pluginu Anthropic
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

- `textToSpeech` zwraca standardowy ładunek wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji rdzenia `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą zmieniać częstotliwość próbkowania/kodować dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Użyj go do selektorów głosów lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak ustawienia regionalne, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obecnie obsługują telefonię. Microsoft nie.

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

- Zostaw politykę TTS, mechanizm awaryjny i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może posiadać
  dostawców tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw doda te
  kontrakty możliwości.

Do rozumienia obrazu/audio/wideo Pluginy rejestrują jednego typowanego
dostawcę rozumienia mediów zamiast ogólnego zbioru klucz/wartość:

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

- Zostaw orkiestrację, mechanizm awaryjny, konfigurację i okablowanie kanałów w rdzeniu.
- Zostaw zachowanie dostawcy w Pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyniku, nowe opcjonalne możliwości.
- Generowanie wideo już stosuje ten sam wzorzec:
  - rdzeń posiada kontrakt możliwości i pomocnik środowiska uruchomieniowego
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów używają `api.runtime.videoGeneration.*`

W przypadku pomocników środowiska uruchomieniowego do rozumienia mediów Pluginy mogą wywołać:

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

Do transkrypcji audio Pluginy mogą używać albo środowiska uruchomieniowego
rozumienia mediów, albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` jest preferowaną współdzieloną powierzchnią do
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rdzenia do rozumienia mediów (`tools.media.audio`) oraz kolejności przełączania awaryjnego dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstaje wynik transkrypcji (na przykład pominięte/nieobsługiwane wejście).
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

- `provider` i `model` to opcjonalne nadpisania dla pojedynczego przebiegu, a nie trwałe zmiany sesji.
- OpenClaw respektuje te pola nadpisań tylko dla zaufanych wywołujących.
- W przypadku przebiegów awaryjnych należących do Pluginu operatorzy muszą wyrazić zgodę za pomocą `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie dopuścić dowolny cel.
- Przebiegi podagentów z niezaufanych Pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przełączać się na wartość awaryjną.
- Sesje podagentów utworzone przez Plugin są oznaczane identyfikatorem tworzącego Pluginu. Zapasowe `api.runtime.subagent.deleteSession(...)` może usuwać tylko te posiadane sesje; usuwanie dowolnej sesji nadal wymaga żądania Gateway o zakresie administratora.

W przypadku wyszukiwania w sieci Pluginy mogą używać współdzielonego pomocnika środowiska uruchomieniowego zamiast
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

- Zostaw wybór dostawcy, rozwiązywanie poświadczeń i wspólną semantykę żądań w rdzeniu.
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

- `generate(...)`: generuje obraz przy użyciu skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: zwraca listę dostępnych dostawców generowania obrazów i ich możliwości.

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

- `path`: ścieżka trasy pod serwerem HTTP Gateway.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania Gateway, albo `"plugin"` dla uwierzytelniania/weryfikacji Webhook zarządzanych przez Plugin.
- `match`: opcjonalne. `"exact"` (domyślne) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania Plugin. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy Plugin muszą jawnie deklarować `auth`.
- Dokładne konflikty `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden Plugin nie może zastąpić trasy innego Plugin.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj wyłącznie na tym samym poziomie uwierzytelniania.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów środowiska uruchomieniowego operatora. Są przeznaczone do zarządzanych przez Plugin webhooków/weryfikacji podpisów, a nie do uprzywilejowanych pomocniczych wywołań Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu środowiska uruchomieniowego żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - uwierzytelnianie bearer współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy środowiska uruchomieniowego tras Plugin przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP z tożsamością (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym wejściu) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w tych żądaniach tras Plugin z tożsamością, zakres środowiska uruchomieniowego wraca do `operator.write`
- Reguła praktyczna: nie zakładaj, że trasa Plugin uwierzytelniana przez Gateway jest niejawną powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania wyłącznie dla administratora, wymagaj trybu uwierzytelniania z tożsamością i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK Plugin

Podczas tworzenia nowych Plugin używaj wąskich podścieżek SDK zamiast monolitycznego głównego barrela `openclaw/plugin-sdk`. Podścieżki core:

| Podścieżka                         | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanału                 |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Główny schemat Zod `openclaw.json` (`OpenClawSchema`) |

Plugin kanałów wybierają z rodziny wąskich punktów styku — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno konsolidować się
wokół jednego kontraktu `approvalCapability`, zamiast mieszać je między niepowiązanymi
polami Plugin. Zobacz [Plugin kanałów](/pl/plugins/sdk-channel-plugins).

Pomocniki środowiska uruchomieniowego i konfiguracji znajdują się pod odpowiadającymi im ukierunkowanymi podścieżkami `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` itd.). Preferuj `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation`
zamiast szerokiego barrela zgodności `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
i `openclaw/plugin-sdk/infra-runtime` są przestarzałymi shimami zgodności dla
starszych Plugin. Nowy kod powinien importować zamiast tego węższe ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (dla katalogu głównego każdego pakietu dołączonego Plugin):

- `index.js` — wejście dołączonego Plugin
- `api.js` — barrel pomocników/typów
- `runtime-api.js` — barrel wyłącznie środowiska uruchomieniowego
- `setup-entry.js` — wejście konfiguracyjne Plugin

Zewnętrzne Plugin powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu Plugin z core ani z innego Plugin.
Punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji środowiska uruchomieniowego, gdy taka
istnieje, a następnie wracają do rozwiązanego pliku konfiguracji na dysku.

Podścieżki właściwe dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone Plugin używają ich obecnie. Nie są one
automatycznie długoterminowo zamrożonymi kontraktami zewnętrznymi — sprawdź odpowiednią stronę
referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzi wiadomości

Plugin powinny posiadać wkłady schematu `describeMessageTool(...)` właściwe dla kanału
dla prymitywów niebędących wiadomościami, takich jak reakcje, odczyty i ankiety.
Wspólna prezentacja wysyłania powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły awaryjne, mapowanie dostawców i listę kontrolną autora Plugin.

Plugin zdolne do wysyłania deklarują, co mogą renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego doręczenia

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy luk ucieczki UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
zewnętrznych Plugin, ale nowe Plugin nie powinny ich używać.

## Rozwiązywanie celów kanału

Plugin kanałów powinny posiadać semantykę celów właściwą dla kanału. Wspólny
host wychodzący utrzymuj jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy
  dane wejściowe powinny przejść prosto do rozwiązywania podobnego do identyfikatora zamiast do wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` jest awaryjną ścieżką Plugin, gdy
  core potrzebuje końcowego rozwiązywania należącego do dostawcy po normalizacji albo po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` posiada konstrukcję trasy sesji
  właściwą dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorii, które powinny nastąpić przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` jako awaryjnej normalizacji właściwej dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatów, identyfikatory wątków, JID-y, uchwyty i identyfikatory pokoi,
  przechowuj w wartościach `target` lub parametrach właściwych dla dostawcy, a nie w ogólnych
  polach SDK.

## Katalogi oparte na konfiguracji

Plugin, które wyprowadzają wpisy katalogu z konfiguracji, powinny trzymać tę logikę w
Plugin i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane listą dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne awaryjne wpisy katalogu ograniczone do konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- stosowanie limitu
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja konta i normalizacja identyfikatorów właściwe dla kanału powinny pozostać w
implementacji Plugin.

## Katalogi dostawców

Plugin dostawców mogą definiować katalogi modeli do inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca taki sam kształt, jaki OpenClaw zapisuje w
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy Plugin posiada właściwe dla dostawcy identyfikatory modeli, domyślne
bazowe adresy URL albo metadane modeli chronione uwierzytelnianiem.

`catalog.order` kontroluje, kiedy katalog Plugin scala się względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API albo zmienną środowiskową
- `profile`: dostawcy pojawiający się, gdy istnieją profile uwierzytelniania
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji klucza, więc Plugin mogą celowo nadpisać
wbudowany wpis dostawcy z tym samym identyfikatorem dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` jest ścieżką środowiska uruchomieniowego. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
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
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby raportować dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i odpowiadającego mu pola źródła)
  wystarcza dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce
polecenia”, zamiast ulegać awarii albo błędnie raportować konto jako nieskonfigurowane.

## Pakiety pakietów

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

Każdy wpis staje się Plugin. Jeśli pakiet wymienia wiele rozszerzeń, identyfikator Plugin
staje się `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Ograniczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu Plugin
po rozwiązaniu dowiązań symbolicznych. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności Plugin przy użyciu
lokalnego dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia,
bez zależności deweloperskich w czasie wykonywania), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności Plugin jako „czyste JS/TS” i unikaj pakietów wymagających
budowania przez `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać na lekki moduł wyłącznie konfiguracyjny.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Plugin kanału albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia Plugin. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główne wejście Plugin podłącza także narzędzia, hooki lub inny kod wyłącznie środowiska uruchomieniowego.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć Plugin kanału do tej samej ścieżki `setupEntry` podczas fazy startowej
gateway przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni obejmuje powierzchnię startową, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że wejście konfiguracyjne
musi zarejestrować każdą należącą do kanału możliwość, od której zależy start, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twoje pełne wejście nadal posiada jakąkolwiek wymaganą możliwość startową, nie włączaj
tej flagi. Pozostaw Plugin przy domyślnym zachowaniu i pozwól OpenClaw załadować
pełne wejście podczas startu.

Dołączone kanały mogą także publikować pomocniki powierzchni kontraktu wyłącznie konfiguracji, z których core
może skorzystać przed załadowaniem pełnego środowiska uruchomieniowego kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi wypromować starszą konfigurację kanału z pojedynczym kontem do `channels.<id>.accounts.*` bez ładowania pełnego wpisu Plugin. Matrix jest bieżącym dołączonym przykładem: przenosi tylko klucze uwierzytelniania/bootstrapa do nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć `accounts.default`.

Te adaptery poprawek konfiguracji utrzymują leniwe wykrywanie dołączonej powierzchni kontraktu. Czas importu pozostaje krótki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast ponownie wchodzić w uruchamianie dołączonego kanału podczas importu modułu.

Gdy te powierzchnie startowe obejmują metody RPC Gateway, trzymaj je w prefiksie właściwym dla Plugin. Przestrzenie nazw administracji Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązywane są do `operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

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

Pluginy kanałów mogą ogłaszać metadane konfiguracji/wykrywania przez `openclaw.channel` oraz wskazówki instalacyjne przez `openclaw.install`. Dzięki temu katalog Core pozostaje wolny od danych.

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
- `preferOver`: identyfikatory plugin/kanału o niższym priorytecie, nad którymi ten wpis katalogu powinien mieć pierwszeństwo
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach listy skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych selektorach konfiguracji, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji podczas rozwiązywania celów ogłoszeń

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo skieruj `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na jeden lub więcej plików JSON (rozdzielonych przecinkiem/średnikiem/`PATH`). Każdy plik powinien zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji dostawców ujawniają znormalizowane fakty źródła instalacji obok surowego bloku `openclaw.install`. Znormalizowane fakty identyfikują, czy specyfikacja npm jest dokładną wersją czy płynnym selektorem, czy oczekiwane metadane integralności są obecne oraz czy dostępna jest także lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana, znormalizowane fakty ostrzegają, jeśli przeanalizowana nazwa pakietu npm odbiega od tej tożsamości. Ostrzegają także, gdy `defaultChoice` jest nieprawidłowe lub wskazuje na źródło, które nie jest dostępne, oraz gdy metadane integralności npm są obecne bez prawidłowego źródła npm. Konsumenci powinni traktować `installSource` jako addytywne opcjonalne pole, aby ręcznie budowane wpisy i adaptery katalogu nie musiały go syntetyzować. Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródła bez importowania środowiska wykonawczego Plugin.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` oraz `expectedIntegrity`. Gołe nazwy pakietów i dist-tagi nadal działają dla zgodności, ale pokazują ostrzeżenia płaszczyzny źródła, aby katalog mógł przechodzić w stronę przypiętych instalacji z kontrolą integralności bez łamania istniejących pluginów. Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje zarządzany wpis indeksu Plugin z `source: "path"` oraz względną wobec workspace ścieżką `sourcePath`, gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w `plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej w długowiecznej konfiguracji. Dzięki temu lokalne instalacje deweloperskie pozostają widoczne dla diagnostyki płaszczyzny źródła bez dodawania drugiej surowej powierzchni ujawniania ścieżek systemu plików. Utrwalony indeks Plugin `plugins/installs.json` jest źródłem prawdy dla źródła instalacji i można go odświeżać bez ładowania modułów środowiska wykonawczego Plugin. Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest Plugin jest brakujący lub nieprawidłowy; jego tablica `plugins` jest odbudowywalnym widokiem manifestu.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu odpowiadają za orkiestrację kontekstu sesji na potrzeby pobierania, składania i Compaction. Zarejestruj je ze swojego Plugin przez `api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik za pomocą `plugins.slots.contextEngine`.

Użyj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny pipeline kontekstu, a nie tylko dodać wyszukiwanie pamięci lub hooki.

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

Fabryka `ctx` udostępnia opcjonalne wartości `config`, `agentDir` i `workspaceDir` do inicjalizacji podczas konstrukcji.

Jeśli Twój silnik **nie** posiada algorytmu Compaction, zachowaj implementację `compact()` i deleguj ją jawnie:

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

Gdy Plugin potrzebuje zachowania, które nie pasuje do bieżącego API, nie obchodź systemu Plugin przez prywatne sięgnięcie do środka. Dodaj brakującą możliwość.

Zalecana kolejność:

1. zdefiniuj kontrakt Core
   Zdecyduj, jakie wspólne zachowanie powinien posiadać Core: politykę, fallback, scalanie konfiguracji, cykl życia, semantykę wobec kanałów i kształt helpera środowiska wykonawczego.
2. dodaj typowane powierzchnie rejestracji/środowiska wykonawczego Plugin
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną typowaną powierzchnię możliwości.
3. połącz Core i konsumentów kanału/funkcji
   Kanały i Pluginy funkcji powinny korzystać z nowej możliwości przez Core, a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawcy
   Następnie Pluginy dostawców rejestrują swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

W ten sposób OpenClaw pozostaje opiniotwórczy, nie stając się na sztywno zakodowany do światopoglądu jednego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture), aby uzyskać konkretną listę kontrolną plików i opracowany przykład.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna dotykać tych powierzchni razem:

- typy kontraktu Core w `src/<capability>/types.ts`
- helper uruchamiania/środowiska wykonawczego Core w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API Plugin w `src/plugins/types.ts`
- okablowanie rejestru Plugin w `src/plugins/registry.ts`
- ekspozycja środowiska wykonawczego Plugin w `src/plugins/runtime/*`, gdy Pluginy funkcji/kanałów muszą z niej korzystać
- helpery przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Plugin w `docs/`

Jeśli brakuje jednej z tych powierzchni, zwykle oznacza to, że możliwość nie jest jeszcze w pełni zintegrowana.

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

To utrzymuje prostą regułę:

- Core posiada kontrakt możliwości i orkiestrację
- Pluginy dostawców posiadają implementacje dostawców
- Pluginy funkcji/kanałów korzystają z helperów środowiska wykonawczego
- testy kontraktu utrzymują własność jako jawną

## Powiązane

- [Architektura Plugin](/pl/plugins/architecture) — publiczny model i kształty możliwości
- [Ścieżki podrzędne SDK Plugin](/pl/plugins/sdk-subpaths)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
