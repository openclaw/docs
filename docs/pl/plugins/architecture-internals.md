---
read_when:
    - Implementacja haków runtime dostawców, cyklu życia kanałów lub paczek pakietów
    - Debugowanie kolejności ładowania Pluginów lub stanu rejestru
    - Dodawanie nowej możliwości Pluginu lub Pluginu silnika kontekstu
summary: 'Wewnętrzne mechanizmy architektury Pluginów: potok ładowania, rejestr, haki runtime, trasy HTTP i tabele referencyjne'
title: Wewnętrzne mechanizmy architektury Pluginów
x-i18n:
    generated_at: "2026-04-24T09:22:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Aby zapoznać się z publicznym modelem możliwości, kształtami Pluginów oraz kontraktami
własności/wykonania, zobacz [Plugin architecture](/pl/plugins/architecture). Ta strona jest
dokumentacją referencyjną wewnętrznych mechanizmów: potoku ładowania, rejestru, haków runtime,
tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Przy uruchomieniu OpenClaw wykonuje w przybliżeniu następujące kroki:

1. wykrywa kandydackie katalogi główne Pluginów
2. odczytuje natywne lub zgodne manifesty paczek i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację Pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone moduły natywne: zbudowane dołączone moduły używają natywnego loadera;
   niezbudowane natywne Pluginy używają jiti
7. wywołuje natywne haki `register(api)` i zbiera rejestracje do rejestru Pluginów
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` to starszy alias `register` — loader rozwiązuje to, co jest obecne (`def.register ?? def.activate`) i wywołuje to w tym samym punkcie. Wszystkie dołączone Pluginy używają `register`; dla nowych Pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa są stosowane **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny Pluginu, ścieżka ma uprawnienia world-writable lub
własność ścieżki wygląda podejrzanie dla niedołączonych Pluginów.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikacji Pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości paczki
- walidacji `plugins.entries.<id>.config`
- wzbogacania etykiet/placeholderów w Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime Pluginu

W przypadku natywnych Pluginów moduł runtime jest częścią płaszczyzny danych. Rejestruje
rzeczywiste zachowanie, takie jak haki, narzędzia, polecenia lub przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania.
Są to deskryptory tylko metadanych do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz wskazówek manifestu dotyczących poleceń, kanałów i dostawców,
aby zawęzić ładowanie Pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do Pluginów będących właścicielami żądanego polecenia głównego
- konfiguracja kanału/rozwiązywanie Pluginu zawęża się do Pluginów będących właścicielami żądanego
  identyfikatora kanału
- jawne rozwiązywanie konfiguracji/runtime dostawcy zawęża się do Pluginów będących właścicielami
  żądanego identyfikatora dostawcy

Planista aktywacji udostępnia zarówno API zwracające tylko identyfikatory dla istniejących wywołujących, jak i
API planu dla nowej diagnostyki. Wpisy planu raportują, dlaczego Plugin został wybrany,
oddzielając jawne wskazówki planisty `activation.*` od fallbacku własności manifestu,
takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i haki. Ten podział powodów stanowi granicę zgodności:
istniejące metadane Pluginów nadal działają, a nowy kod może wykrywać szerokie wskazówki
lub zachowanie fallback bez zmiany semantyki ładowania runtime.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptorów, takie jak `setup.providers` i
`setup.cliBackends`, aby zawężać kandydackie Pluginy przed przejściem awaryjnym do
`setup-api` dla Pluginów, które nadal potrzebują haków runtime w czasie konfiguracji. Jeśli więcej niż
jeden wykryty Plugin zgłasza ten sam znormalizowany identyfikator dostawcy konfiguracji lub backendu CLI,
wyszukiwanie konfiguracji odmawia wyboru niejednoznacznego właściciela zamiast polegać na kolejności wykrywania.

### Co loader buforuje

OpenClaw utrzymuje krótkotrwałe bufory in-process dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów Pluginów

Bufory te ograniczają skokowe obciążenie przy uruchamianiu i koszt powtarzanych poleceń. Można o nich
bezpiecznie myśleć jako o krótkotrwałych buforach wydajnościowych, a nie mechanizmie utrwalania.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` lub
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te bufory.
- Dostrajaj okna buforowania przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane Pluginy nie mutują bezpośrednio losowych globali core. Rejestrują się do
centralnego rejestru Pluginów.

Rejestr śledzi:

- rekordy Pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze haki i haki typowane
- kanały
- dostawców
- handlery Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do Pluginów

Funkcje core odczytują następnie z tego rejestru zamiast komunikować się z modułami Pluginów
bezpośrednio. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł Pluginu -> rejestracja w rejestrze
- runtime core -> konsumpcja rejestru

Ta separacja ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje
tylko jednego punktu integracji: „odczytaj rejestr”, a nie „twórz specjalne przypadki dla każdego modułu Pluginu”.

## Callbacki powiązań konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

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

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: oryginalne podsumowanie żądania, wskazówka odłączenia, identyfikator nadawcy oraz
  metadane konwersacji

Ten callback ma charakter tylko powiadomienia. Nie zmienia tego, kto może wiązać
konwersację, i działa po zakończeniu obsługi zatwierdzeń przez core.

## Haki runtime dostawców

Pluginy dostawców mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` oraz `channelEnvVars`.
- **Haki czasu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Haki runtime**: ponad 40 opcjonalnych haków obejmujących auth, rozwiązywanie modeli,
  opakowywanie strumieni, poziomy thinking, politykę replay i endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność haków i użycie](#hook-order-and-usage).

OpenClaw nadal zarządza ogólną pętlą agenta, failover, obsługą transkryptu i
polityką narzędzi. Te haki są powierzchnią rozszerzeń dla zachowania specyficznego dla dostawcy
bez potrzeby tworzenia całego niestandardowego transportu inferencji.

Używaj manifestu `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/selektora modeli powinny widzieć bez ładowania runtime Pluginu.
Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator dostawcy ma ponownie używać
zmiennych env, profili uwierzytelniania, auth opartego na konfiguracji i wyboru onboardingu klucza API
innego identyfikatora dostawcy. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru auth
powinny znać identyfikator wyboru dostawcy, etykiety grup i proste okablowanie auth jedną flagą
bez ładowania runtime dostawcy. Zachowaj `envVars` runtime dostawcy dla wskazówek
operatora, takich jak etykiety onboardingu lub zmienne konfiguracji OAuth
client-id/client-secret.

Używaj manifestu `channelEnvVars`, gdy kanał ma auth lub konfigurację sterowaną przez env, którą
ogólny fallback env powłoki, kontrole config/status lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność haków i użycie

Dla Pluginów modeli/dostawców OpenClaw wywołuje haki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hak                               | Co robi                                                                                                        | Kiedy używać                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca zarządza katalogiem lub domyślnymi wartościami base URL                                                                              |
| 2   | `applyConfigDefaults`             | Stosuje należące do dostawcy globalne wartości domyślne konfiguracji podczas materializacji konfiguracji      | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli dostawcy                                                             |
| --  | _(built-in model lookup)_         | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                   | _(to nie jest hak Pluginu)_                                                                                                                    |
| 3   | `normalizeModelId`                | Normalizuje starsze aliasy identyfikatorów modeli lub aliasy preview przed lookup                             | Dostawca zarządza czyszczeniem aliasów przed rozwiązaniem kanonicznego modelu                                                                 |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu                                | Dostawca zarządza czyszczeniem transportu dla niestandardowych identyfikatorów dostawcy w tej samej rodzinie transportu                      |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązaniem runtime/dostawcy                                       | Dostawca potrzebuje czyszczenia konfiguracji, które powinno znajdować się przy Pluginie; dołączone pomocniki rodziny Google dodatkowo zabezpieczają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywania zgodności natywnego użycia strumieniowania do dostawców konfiguracji                    | Dostawca potrzebuje poprawek metadanych natywnego użycia strumieniowania zależnych od endpointu                                               |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth env-marker dla dostawców konfiguracji przed załadowaniem auth runtime                         | Dostawca ma własne rozwiązywanie klucza API env-marker; `amazon-bedrock` ma też tutaj wbudowany resolver env-marker AWS                      |
| 8   | `resolveSyntheticAuth`            | Ujawnia lokalne/samodzielnie hostowane lub oparte na konfiguracji auth bez utrwalania jawnego tekstu         | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Nakłada należące do dostawcy zewnętrzne profile auth; domyślna `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych tokenów odświeżania; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych placeholderów syntetycznych profili względem auth opartego na env/konfiguracji   | Dostawca przechowuje syntetyczne placeholdery profili, które nie powinny wygrywać priorytetu                                                  |
| 11  | `resolveDynamicModel`             | Fallback synchronizacji dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Asynchroniczna rozgrzewka, po której `resolveDynamicModel` uruchamia się ponownie                             | Dostawca potrzebuje metadanych sieciowych przed rozwiązaniem nieznanych identyfikatorów                                                       |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez embedded runner                                   | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu core                                                                      |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem                          | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                              |
| 15  | `capabilities`                    | Należące do dostawcy metadane transkryptu/narzędzi używane przez współdzieloną logikę core                   | Dostawca potrzebuje niuansów transkryptu/rodziny dostawców                                                                                     |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je embedded runner                                               | Dostawca potrzebuje czyszczenia schematów dla rodziny transportu                                                                               |
| 17  | `inspectToolSchemas`              | Ujawnia należącą do dostawcy diagnostykę schematów po normalizacji                                            | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia core reguł specyficznych dla dostawcy                                                |
| 18  | `resolveReasoningOutputMode`      | Wybiera natywny lub tagowany kontrakt danych wyjściowych reasoning                                            | Dostawca potrzebuje tagowanego reasoning/końcowych danych wyjściowych zamiast pól natywnych                                                   |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji strumienia                                    | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów specyficznych dla dostawcy                                       |
| 20  | `createStreamFn`                  | W pełni zastępuje zwykłą ścieżkę strumienia niestandardowym transportem                                       | Dostawca potrzebuje niestandardowego protokołu wire, a nie tylko wrappera                                                                      |
| 21  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu ogólnych wrapperów                                                         | Dostawca potrzebuje wrapperów zgodności nagłówków/body/modelu żądania bez niestandardowego transportu                                         |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu per tura                                                     | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                                 |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cooldown sesji                                                | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę fallbacku                                                      |
| 24  | `formatApiKey`                    | Formater auth-profile: zapisany profil staje się runtime `apiKey` typu string                                 | Dostawca przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokenu runtime                                            |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki błędów odświeżania     | Dostawca nie pasuje do współdzielonych odświeżaczy `pi-ai`                                                                                     |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana, gdy odświeżanie OAuth się nie powiedzie                                        | Dostawca potrzebuje własnych wskazówek naprawy auth po błędzie odświeżania                                                                     |
| 27  | `matchesContextOverflowError`     | Należący do dostawcy matcher przepełnienia okna kontekstu                                                     | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki by nie wykryły                                                              |
| 28  | `classifyFailoverReason`          | Należąca do dostawcy klasyfikacja powodu failover                                                             | Dostawca potrafi mapować surowe błędy API/transportu do rate-limit/przeciążenia itd.                                                          |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                            | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                              |
| 30  | `buildMissingAuthMessage`         | Zamiennik dla ogólnego komunikatu odzyskiwania po brakującym auth                                             | Dostawca potrzebuje własnej wskazówki odzyskiwania po brakującym auth                                                                          |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnego modelu upstream z opcjonalną wskazówką błędu dla użytkownika                         | Dostawca musi ukrywać nieaktualne wiersze upstream lub zastępować je wskazówką producenta                                                      |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                    | Dostawca potrzebuje syntetycznych wierszy forward-compat w `models list` i selektorach                                                        |
| 33  | `resolveThinkingProfile`          | Specyficzny dla modelu zestaw poziomów `/think`, etykiety wyświetlane i wartość domyślna                     | Dostawca udostępnia niestandardową drabinę thinking lub etykietę binarną dla wybranych modeli                                                 |
| 34  | `isBinaryThinking`                | Hak zgodności przełącznika reasoning w trybie włącz/wyłącz                                                    | Dostawca udostępnia tylko binarne thinking włącz/wyłącz                                                                                        |
| 35  | `supportsXHighThinking`           | Hak zgodności wsparcia reasoning `xhigh`                                                                      | Dostawca chce `xhigh` tylko dla części modeli                                                                                                  |
| 36  | `resolveDefaultThinkingLevel`     | Hak zgodności domyślnego poziomu `/think`                                                                     | Dostawca zarządza domyślną polityką `/think` dla rodziny modeli                                                                                |
| 37  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów aktywnych profili i wyboru smoke                                       | Dostawca zarządza dopasowaniem preferowanych modeli live/smoke                                                                                |
| 38  | `prepareRuntimeAuth`              | Zamienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed inferencją                 | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                   |
| 39  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/limitu lub innych poświadczeń użycia                                           |
| 40  | `fetchUsageSnapshot`              | Pobiera i normalizuje migawki użycia/limitu specyficzne dla dostawcy po rozwiązaniu auth                      | Dostawca potrzebuje endpointu użycia specyficznego dla dostawcy lub parsera payloadu                                                         |
| 41  | `createEmbeddingProvider`         | Buduje należący do dostawcy adapter embeddingów dla pamięci/wyszukiwania                                       | Zachowanie embeddingów pamięci powinno należeć do Pluginu dostawcy                                                                            |
| 42  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla dostawcy                                           | Dostawca potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków thinking)                                              |
| 43  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym oczyszczeniu transkryptu                                                 | Dostawca potrzebuje przepisań replay specyficznych dla dostawcy wykraczających poza współdzielone pomocniki Compaction                      |
| 44  | `validateReplayTurns`             | Końcowa walidacja lub przekształcenie tur replay przed embedded runnerem                                       | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po ogólnym oczyszczeniu                                                  |
| 45  | `onModelSelected`                 | Uruchamia należące do dostawcy efekty uboczne po wyborze                                                       | Dostawca potrzebuje telemetrii lub stanu należącego do dostawcy, gdy model staje się aktywny                                                 |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców obsługujące haki,
dopóki któryś rzeczywiście nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shimy aliasów/zgodności dostawców działają bez wymagania od wywołującego wiedzy, który
dołączony Plugin jest właścicielem przepisań. Jeśli żaden hak dostawcy nie przepisze obsługiwanego
wpisu konfiguracji rodziny Google, dołączony normalizator konfiguracji Google nadal stosuje to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu wire albo niestandardowego wykonawcy żądań,
to jest inna klasa rozszerzenia. Te haki służą do zachowania dostawcy, które
nadal działa w zwykłej pętli inferencji OpenClaw.

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

Dołączone Pluginy dostawców łączą powyższe haki tak, aby dopasować się do katalogu,
uwierzytelniania, thinking, replay i potrzeb użycia każdego dostawcy. Autorytatywny zestaw haków znajduje się w
każdym Pluginie pod `extensions/`; ta strona ilustruje kształty zamiast
powielać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogu pass-through">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogły ujawniać upstream
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy OAuth i endpointów użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` lub `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby zarządzać wymianą tokenów i integracją `/usage`.
  </Accordion>
  <Accordion title="Rodziny replay i czyszczenia transkryptów">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom włączać
    politykę transkryptu przez `buildReplayPolicy` zamiast ponownej implementacji
    czyszczenia przez każdy Plugin.
  </Accordion>
  <Accordion title="Dostawcy tylko katalogu">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` oraz
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli inferencji.
  </Accordion>
  <Accordion title="Pomocniki strumienia specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` oraz `context1m` znajdują się we
    publicznym połączeniu `api.ts` / `contract-api.ts` Pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Pomocniki runtime

Pluginy mogą uzyskać dostęp do wybranych pomocników core przez `api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca zwykły payload wyjściowy core TTS dla powierzchni plików/notatek głosowych.
- Używa konfiguracji core `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą przeprowadzić resampling/kodowanie dla dostawców.
- `listVoices` jest opcjonalne per dostawca. Używaj go do selektorów głosów lub przepływów konfiguracji należących do dostawcy.
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

- Politykę TTS, fallback i dostarczanie odpowiedzi utrzymuj w core.
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest ukierunkowany na firmę: jeden Plugin dostawcy może zarządzać
  tekstem, mową, obrazem i przyszłymi dostawcami mediów, gdy OpenClaw doda te
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

- Orkiestrację, fallback, konfigurację i okablowanie kanałów utrzymuj w core.
- Zachowanie dostawcy utrzymuj w Pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo podąża już za tym samym wzorcem:
  - core zarządza kontraktem możliwości i pomocnikiem runtime
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
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
```

Dla transkrypcji audio Pluginy mogą używać runtime rozumienia mediów
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

- `api.runtime.mediaUnderstanding.*` to preferowana współdzielona powierzchnia dla
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rozumienia mediów core (`tools.media.audio`) i kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstaje wyjście transkrypcji (na przykład przy pominiętym/nieobsługiwanym wejściu).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą również uruchamiać podagentów w tle przez `api.runtime.subagent`:

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

- `provider` i `model` są opcjonalnymi nadpisaniami per uruchomienie, a nie trwałymi zmianami sesji.
- OpenClaw respektuje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla uruchomień fallback należących do Pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Uruchomienia podagentów niezaufanych Pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić do fallbacku.

Dla wyszukiwania w sieci Pluginy mogą korzystać ze współdzielonego pomocnika runtime zamiast
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

Pluginy mogą również rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań utrzymuj w core.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla producenta.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla Pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

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

Pluginy mogą udostępniać endpointy HTTP przez `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego uwierzytelniania gateway, albo `"plugin"` dla auth zarządzanego przez Plugin/weryfikacji Webhook.
- `match`: opcjonalne. `"exact"` (domyślnie) lub `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania Pluginu. Używaj zamiast tego `api.registerHttpRoute(...)`.
- Trasy Pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnego `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, i jeden Plugin nie może zastąpić trasy innego Pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Utrzymuj łańcuchy przejścia `exact`/`prefix` tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Są przeznaczone do Webhooków zarządzanych przez Plugin/weryfikacji podpisów, a nie uprzywilejowanych wywołań pomocniczych Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - auth bearer wspólnego sekretu (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras Pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - tryby HTTP oparte na zaufanej tożsamości (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym ingressie) respektują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach trasy Pluginu opartych na tożsamości, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa Pluginu z auth gateway jest niejawną powierzchnią administracyjną. Jeśli Twoja trasa potrzebuje zachowania tylko-admin, wymagaj trybu auth opartego na tożsamości i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Przy tworzeniu nowych Pluginów używaj wąskich podścieżek SDK zamiast monolitycznego głównego
bara `openclaw/plugin-sdk`. Główne podścieżki:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji Pluginów                     |
| `openclaw/plugin-sdk/channel-core`  | Pomocniki wejścia/budowania kanałów                |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone pomocniki i zbiorczy kontrakt |
| `openclaw/plugin-sdk/config-schema` | Główny schemat Zod `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich połączeń — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzeń powinno konsolidować się
na jednym kontrakcie `approvalCapability` zamiast mieszać się między niepowiązanymi
polami Pluginu. Zobacz [Channel plugins](/pl/plugins/sdk-channel-plugins).

Pomocniki runtime i konfiguracji znajdują się pod odpowiadającymi im podścieżkami `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` itd.).

<Info>
`openclaw/plugin-sdk/channel-runtime` jest przestarzałe — to shim zgodności dla
starszych Pluginów. Nowy kod powinien importować węższe ogólne prymitywy.
</Info>

Wewnętrzne punkty wejścia repozytorium (na katalog główny każdego pakietu dołączonego Pluginu):

- `index.js` — punkt wejścia dołączonego Pluginu
- `api.js` — barrel pomocników/typów
- `runtime-api.js` — barrel tylko runtime
- `setup-entry.js` — punkt wejścia Pluginu konfiguracji

Zewnętrzne Pluginy powinny importować tylko podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu Pluginu z core ani z innego Pluginu.
Punkty wejścia ładowane przez facade preferują aktywną migawkę konfiguracji runtime, jeśli istnieje, a
następnie wracają do rozwiązanego pliku konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone Pluginy używają ich już dzisiaj. Nie są one
automatycznie długoterminowo zamrożonymi zewnętrznymi kontraktami — sprawdź odpowiednią stronę dokumentacji referencyjnej SDK,
gdy na nich polegasz.

## Schematy narzędzi wiadomości

Pluginy powinny zarządzać wkładami specyficznymi dla kanału do schematu `describeMessageTool(...)`
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłki powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Zobacz [Message Presentation](/pl/plugins/message-presentation), aby poznać kontrakt,
zasady fallbacku, mapowanie dostawców i listę kontrolną autora Pluginu.

Pluginy zdolne do wysyłania deklarują to, co potrafią renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań dostarczania przypiętego

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy awaryjnych obejść UI z ogólnego narzędzia wiadomości.
Przestarzałe pomocniki SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
Pluginów firm trzecich, ale nowe Pluginy nie powinny z nich korzystać.

## Rozwiązywanie celów kanałów

Pluginy kanałów powinny zarządzać semantyką celów specyficzną dla kanału. Zachowaj współdzielonego
hosta wychodzącego jako ogólnego i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` lub `channel` przed wyszukaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy
  wejście powinno pominąć wyszukiwanie w katalogu i przejść bezpośrednio do rozwiązywania podobnego do identyfikatora.
- `messaging.targetResolver.resolveTarget(...)` to fallback Pluginu, gdy
  core potrzebuje końcowego rozwiązywania należącego do dostawcy po normalizacji lub po nieudanym wyszukaniu w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` zarządza konstrukcją trasy sesji specyficznej dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorii, które powinny zapaść przed
  przeszukiwaniem peers/groups.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do fallbacku normalizacji specyficznej dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Trzymaj natywne dla dostawcy identyfikatory, takie jak chat ids, thread ids, JIDs, handle i room
  ids, wewnątrz wartości `target` lub parametrów specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
Pluginie i ponownie używać współdzielonych pomocników z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peers/groups opartych na konfiguracji, takich jak:

- peers wiadomości prywatnych oparte na liście dozwolonych
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu ograniczone do konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitów
- deduplikację/pomocniki normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji Pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli dla inferencji przez
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy Plugin zarządza identyfikatorami modeli specyficznymi dla dostawcy, domyślnymi
wartościami base URL lub metadanymi modeli zależnymi od auth.

`catalog.order` kontroluje, kiedy katalog Pluginu scala się względem wbudowanych
niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy sterowani kluczem API lub env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc Pluginy mogą celowo nadpisywać
wbudowany wpis dostawcy z tym samym identyfikatorem dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Tylko do odczytu: inspekcja kanałów

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane i może szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy napraw doctor/config
  nie powinny wymagać materializacji poświadczeń runtime tylko po to, aby opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy to istotne, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu. Wystarczy zwrócić `tokenStatus: "available"` (oraz pasujące pole źródła).
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „configured but unavailable in this command
path” zamiast kończyć się błędem lub błędnie zgłaszać konto jako nieskonfigurowane.

## Paczki pakietów

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

Każdy wpis staje się Pluginem. Jeśli paczka wymienia wiele rozszerzeń, identyfikator Pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać w katalogu Pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności Pluginów przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności dev w runtime). Utrzymuj drzewa zależności Pluginów jako „czyste JS/TS” i unikaj pakietów wymagających kompilacji `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Pluginu kanału albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia Pluginu. Dzięki temu uruchamianie i konfiguracja pozostają lżejsze,
gdy główny punkt wejścia Pluginu podłącza również narzędzia, haki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć Plugin kanału do używania tej samej ścieżki `setupEntry` podczas
fazy uruchamiania gateway przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis konfiguracji
musi rejestrować każdą możliwość należącą do kanału, od której zależy uruchamianie, taką jak:

- samą rejestrację kanału
- wszelkie trasy HTTP, które muszą być dostępne przed rozpoczęciem nasłuchiwania przez gateway
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twój pełny wpis nadal zarządza jakąkolwiek wymaganą możliwością uruchamiania, nie włączaj
tej flagi. Pozostaw Plugin przy zachowaniu domyślnym i pozwól OpenClaw załadować
pełny wpis podczas uruchamiania.

Dołączone kanały mogą również publikować pomocniki powierzchni kontraktów tylko do konfiguracji, z którymi core
może konsultować się przed załadowaniem pełnego runtime kanału. Obecna powierzchnia promowania konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy potrzebuje promować starszą konfigurację kanału z pojedynczym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego wpisu Pluginu.
Bieżącym dołączonym przykładem jest Matrix: przenosi do promowanego nazwanego konta tylko klucze auth/bootstrap,
gdy istnieją już nazwane konta, i może zachować skonfigurowany niekanoniczny klucz default-account zamiast zawsze tworzyć
`accounts.default`.

Te adaptery łatek konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktów dołączonych kanałów.
Czas importu pozostaje lekki; powierzchnia promowania jest ładowana tylko przy pierwszym użyciu zamiast
ponownie wchodzić do uruchamiania dołączonego kanału przy imporcie modułu.

Gdy te powierzchnie uruchamiania obejmują metody Gateway RPC, utrzymuj je na
prefiksie specyficznym dla Pluginu. Przestrzenie nazw administracyjnych core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do `operator.admin`,
nawet jeśli Plugin żąda węższego zakresu.

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

Pluginy kanałów mogą reklamować metadane konfiguracji/wykrywania przez `openclaw.channel` i
wskazówki instalacji przez `openclaw.install`. Dzięki temu dane katalogu core pozostają wolne od danych.

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
- `docsLabel`: nadpisanie tekstu linku do dokumentacji
- `preferOver`: identyfikatory Pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako zdolny do obsługi Markdown dla decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał na powierzchniach list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał w interaktywnych selektorach setup/configure, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu quickstart `allowFrom`
- `forceAccountBinding`: wymusza jawne powiązanie konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów announce

OpenClaw może również scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkami/średnikami/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji dostawców ujawniają
znormalizowane fakty źródła instalacji obok surowego bloku `openclaw.install`. Te
znormalizowane fakty określają, czy specyfikacja npm jest dokładną wersją, czy pływającym selektorem,
czy obecne są oczekiwane metadane integralności oraz czy dostępna jest również lokalna ścieżka źródłowa.
Konsumenci powinni traktować `installSource` jako addytywne pole opcjonalne, aby starsze ręcznie budowane wpisy i shimy zgodności nie musiały go syntetyzować. Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródła bez importowania runtime Pluginu.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` plus
`expectedIntegrity`. Surowe nazwy pakietów i dist-tags nadal działają dla zgodności,
ale ujawniają ostrzeżenia płaszczyzny źródła, aby katalog mógł zmierzać w kierunku instalacji przypiętych i sprawdzanych pod kątem integralności bez psucia istniejących Pluginów.
Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje wpis
`plugins.installs` z `source: "path"` i względnym wobec obszaru roboczego
`sourcePath`, gdy to możliwe. Absolutna operacyjna ścieżka ładowania pozostaje w
`plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczych
w długotrwałej konfiguracji. Dzięki temu lokalne instalacje deweloperskie pozostają widoczne dla
diagnostyki płaszczyzny źródła bez dodawania drugiej surowej powierzchni ujawniania ścieżek systemu plików.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu zarządzają orkiestracją kontekstu sesji dla ingest, assembly
i Compaction. Rejestruj je ze swojego Pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu,
a nie tylko dodać wyszukiwanie pamięci lub haki.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
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

Jeśli Twój silnik **nie** zarządza algorytmem Compaction, pozostaw `compact()`
zaimplementowane i jawnie deleguj je:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
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

Gdy Plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu Pluginów przez prywatne sięganie do wnętrza. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakim współdzielonym zachowaniem powinien zarządzać core: polityka, fallback, scalenie konfiguracji,
   cykl życia, semantyka skierowana do kanału i kształt pomocnika runtime.
2. dodaj typowane powierzchnie rejestracji/runtime Pluginu
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów core + kanał/funkcja
   Kanały i Pluginy funkcji powinny korzystać z nowej możliwości przez core,
   a nie przez bezpośredni import implementacji producenta.
4. zarejestruj implementacje producentów
   Pluginy producentów rejestrują następnie swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

W ten sposób OpenClaw pozostaje opiniotwórczy bez zakodowania na stałe
światopoglądu jednego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby poznać konkretną listę plików i przykład krok po kroku.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna dotknąć razem tych
powierzchni:

- typy kontraktu core w `src/<capability>/types.ts`
- runner/pomocnik runtime core w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API Pluginu w `src/plugins/types.ts`
- okablowanie rejestru Pluginów w `src/plugins/registry.ts`
- ekspozycja runtime Pluginu w `src/plugins/runtime/*`, gdy Pluginy funkcji/kanałów
  muszą ją konsumować
- helpery capture/test w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Pluginów w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle jest to znak, że możliwość
nie jest jeszcze w pełni zintegrowana.

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

Dzięki temu zasada pozostaje prosta:

- core zarządza kontraktem możliwości + orkiestracją
- Pluginy producentów zarządzają implementacjami producenta
- Pluginy funkcji/kanałów konsumują pomocniki runtime
- testy kontraktowe utrzymują własność jako jawną

## Powiązane

- [Plugin architecture](/pl/plugins/architecture) — publiczny model możliwości i kształty
- [Plugin SDK subpaths](/pl/plugins/sdk-subpaths)
- [Plugin SDK setup](/pl/plugins/sdk-setup)
- [Building plugins](/pl/plugins/building-plugins)
