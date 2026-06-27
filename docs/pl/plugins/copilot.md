---
read_when:
    - Chcesz użyć harnessu GitHub Copilot SDK dla agenta
    - Potrzebujesz przykładów konfiguracji dla środowiska uruchomieniowego `copilot`
    - Podłączasz agenta do subskrypcji Copilot (github / openclaw / copilot) i chcesz, aby uruchamiał się przez Copilot CLI
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pomocą zewnętrznego środowiska testowego GitHub Copilot SDK
title: Środowisko testowe Copilot SDK
x-i18n:
    generated_at: "2026-06-27T17:52:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Zewnętrzny Plugin `@openclaw/copilot` pozwala OpenClaw uruchamiać osadzone tury agenta subskrypcyjnego
Copilot przez GitHub Copilot CLI (`@github/copilot-sdk`)
zamiast wbudowanego harnessa PI.

Użyj harnessa Copilot SDK, gdy chcesz, aby sesja Copilot CLI była właścicielem
niskopoziomowej pętli agenta: natywnego wykonywania narzędzi, natywnej Compaction
(`infiniteSessions`) oraz stanu wątku zarządzanego przez CLI w `copilotHome`.
OpenClaw nadal jest właścicielem kanałów czatu, plików sesji, wyboru modelu, dynamicznych
narzędzi OpenClaw (mostkowanych), zatwierdzeń, dostarczania multimediów, widocznej kopii
transkrypcji, pytań pobocznych `/btw` (obsługiwanych przez znajdujący się w drzewie fallback PI — zobacz
[Pytania poboczne (`/btw`)](#side-questions-btw)) oraz `openclaw doctor`.

Szerszy podział model/dostawca/runtime zacznij od
[Runtime’y agentów](/pl/concepts/agent-runtimes).

## Wymagania

- OpenClaw z zainstalowanym pluginem `@openclaw/copilot`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `copilot` (identyfikator manifestu
  zadeklarowany przez plugin). Restrykcyjna
  lista dozwolonych, która używa nazwy pakietu w stylu npm `@openclaw/copilot`,
  pozostawi plugin zablokowany, a runtime nie zostanie załadowany
  nawet przy `agentRuntime.id: "copilot"`.
- Subskrypcja GitHub Copilot, która może sterować Copilot CLI (albo wpis
  env / profilu uwierzytelniania `gitHubToken` dla uruchomień bezinterfejsowych / cron).
- Zapisywalny katalog `copilotHome`. Harness domyślnie używa
  `<agentDir>/copilot`, gdy OpenClaw podaje katalog agenta, w przeciwnym razie
  `~/.openclaw/agents/<agentId>/copilot` dla pełnej izolacji per agent.

`openclaw doctor` uruchamia
[kontrakt doctor](#doctor) pluginu dla deklaratywnej własności stanu sesji i przyszłych
migracji zgodności. Nie uruchamia sond środowiska Copilot CLI.

## Instalacja pluginu

Runtime Copilot jest zewnętrznym pluginem, więc główny pakiet `openclaw` nie
zawiera zależności `@github/copilot-sdk` ani jej specyficznego dla platformy
binarnego CLI `@github/copilot-<platform>-<arch>`. Razem dodają około
260 MB, więc instaluj je tylko dla agentów, które wybierają ten runtime:

```bash
openclaw plugins install @openclaw/copilot
```

Kreator instaluje plugin przy pierwszym wyborze modelu
`github-copilot/*` **oraz** gdy Twoja konfiguracja kieruje model (albo jego
dostawcę) do runtime agenta Copilot przez
`agentRuntime: { id: "copilot" }` (zobacz [Szybki start](#quickstart) poniżej).
Bez tej zgody openclaw używa wbudowanego dostawcy GitHub Copilot
i nigdy nie instaluje pluginu runtime.

Runtime rozwiązuje SDK w tej kolejności:

1. `import("@github/copilot-sdk")` z zainstalowanego pakietu `@openclaw/copilot`.
2. Dobrze znany katalog fallbacku `~/.openclaw/npm-runtime/copilot/` (starszy
   cel instalacji na żądanie).

Brakujące SDK ujawnia pojedynczy błąd z kodem `COPILOT_SDK_MISSING`
oraz powyższe polecenie ponownej instalacji pluginu.

## Szybki start

Przypnij jeden model (albo jednego dostawcę) do harnessa:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Obie ścieżki są równoważne. Użyj `agentRuntime.id` w pojedynczym wpisie modelu,
gdy tylko ten model powinien być kierowany przez harness; ustaw
`agentRuntime.id` na dostawcy, gdy każdy model pod tym dostawcą powinien
go używać.

`github-copilot/auto` to przenośny punkt startowy. Nazwane modele Copilot zależą
od zasad konta i organizacji, więc przypinaj je dopiero po potwierdzeniu,
że uwierzytelnione Copilot CLI je udostępnia.

## Obsługiwani dostawcy

Harness deklaruje obsługę kanonicznego dostawcy `github-copilot`
(tego samego identyfikatora, którego właścicielem jest `extensions/github-copilot`):

- `github-copilot`

Obsługuje też niestandardowe wpisy `models.providers`, gdy wybrany model ma
niepusty `baseUrl` i jeden z tych kształtów API:

- `openai-responses`
- `openai-completions`
- `ollama` (uzupełnienia zgodne z OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Natywne identyfikatory dostawców, takie jak `openai`, `anthropic`, `google` i `ollama`, pozostają
własnością swoich natywnych runtime’ów. Użyj odrębnego niestandardowego identyfikatora dostawcy, gdy kierujesz
endpoint przez Copilot BYOK.

Endpointy Copilot BYOK muszą być publicznymi adresami HTTPS. Harness daje
Copilot SDK adres URL proxy local loopback na próbę, a następnie przekazuje ruch dostawcy
przez chronioną ścieżkę fetch OpenClaw, dzięki czemu przypinanie DNS i polityka SSRF pozostają
własnością OpenClaw. Użyj natywnego runtime OpenClaw dla lokalnego Ollama, LM Studio
lub serwerów modeli w LAN.

## BYOK

Copilot BYOK używa kontraktu niestandardowego dostawcy na poziomie sesji w SDK. OpenClaw
przekazuje rozwiązany endpoint modelu, klucz API, tryb tokena bearer, nagłówki, identyfikator modelu
oraz limity kontekstu/wyjścia bez przenoszenia logiki transportu dostawcy do
core.

Na przykład:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Sesje BYOK są kluczowane oddzielnie od sesji subskrypcyjnych oraz od innych
endpointów lub odcisków poświadczeń. Rotacja klucza, nagłówków, modelu albo
endpointu tworzy świeżą sesję Copilot SDK zamiast wznawiać niezgodny
stan.

## Uwierzytelnianie

Pierwszeństwo per agent, stosowane podczas `runCopilotAttempt`:

1. **Jawne `useLoggedInUser: true`** w danych wejściowych próby. Używa zalogowanego użytkownika Copilot
   CLI rozwiązanego w `copilotHome` agenta.
2. **Jawne `gitHubToken`** w danych wejściowych próby (z `profileId` +
   `profileVersion`). Przydatne dla bezpośrednich wywołań CLI i testów, w których
   wywołujący chce pominąć rozwiązywanie profilu uwierzytelniania.
3. **Rozwiązane przez kontrakt `resolvedApiKey` + `authProfileId`** z kształtu
   `EmbeddedRunAttemptParams`. To jest **główna ścieżka produkcyjna**:
   core rozwiązuje skonfigurowany profil uwierzytelniania `github-copilot` agenta
   (przez `src/infra/provider-usage.auth.ts:resolveProviderAuths`) przed
   wywołaniem harnessa, a harness bezpośrednio zużywa oba pola.
   Dzięki temu profil uwierzytelniania `github-copilot:<profile>` działa od początku do końca
   dla konfiguracji bezinterfejsowych / cron / wieloprofilowych bez zmiennych env.
4. **Fallback zmiennej env** dla bezpośrednich uruchomień CLI / dogfood, gdzie nie skonfigurowano
   profilu uwierzytelniania. Runtime sprawdza następujące zmienne w
   kolejności pierwszeństwa, odzwierciedlając dostarczanego dostawcę `github-copilot`
   (`extensions/github-copilot/auth.ts`) oraz udokumentowaną konfigurację Copilot SDK:
   1. `OPENCLAW_GITHUB_TOKEN` -- override specyficzny dla harnessa; ustaw to,
      aby przypiąć token dla harnessa OpenClaw bez naruszania
      systemowej konfiguracji `gh` / Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` -- standardowa zmienna env Copilot SDK / CLI.
   3. `GH_TOKEN` -- standardowa zmienna env CLI `gh` (zgodna z istniejącym
      pierwszeństwem dostawcy `github-copilot`).
   4. `GITHUB_TOKEN` -- ogólny fallback tokena GitHub.

   Wygrywa pierwsza niepusta wartość; puste ciągi są traktowane jako
   nieobecne. Syntetyzowany identyfikator profilu puli to `env:<NAME>`, a
   profileVersion jest nieodwracalnym odciskiem sha256
   tokena, więc rotacja wartości env czysto unieważnia pulę klientów.

5. **Domyślne `useLoggedInUser`**, gdy nie jest dostępny żaden sygnał tokena.

Każdy agent otrzymuje dedykowany `copilotHome`, aby tokeny, sesje i
konfiguracja Copilot CLI nie przeciekały między agentami na tej samej maszynie. Domyślnie jest to
`<agentDir>/copilot`, gdy host przekazuje harnessowi katalog agenta
(izolując stan SDK od `models.json` / `auth-profiles.json` OpenClaw w
tym samym katalogu), albo `~/.openclaw/agents/<agentId>/copilot` w przeciwnym razie.
Nadpisz przez `copilotHome: <path>` w danych wejściowych próby, gdy potrzebujesz
niestandardowej lokalizacji (na przykład współdzielonego montowania do migracji).

Testy live harnessa używają `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`, gdy potrzebny
jest bezpośredni token. Wspólna konfiguracja testów live celowo czyści
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` i `GITHUB_TOKEN` po przygotowaniu prawdziwych profili uwierzytelniania
w izolowanym katalogu testowym, więc przekazanie wartości `gh auth token`
przez dedykowaną zmienną testów live pozwala uniknąć fałszywych pominięć bez ujawniania
tokenu niepowiązanym zestawom testów.

## Powierzchnia konfiguracji

Harness odczytuje konfigurację z danych wejściowych per próba
(`runCopilotAttempt({...})`) oraz z małego zestawu domyślnych zmiennych env w
`extensions/copilot/src/`:

- `copilotHome` — katalog stanu CLI per agent (domyślne wartości udokumentowane powyżej).
- `model` — ciąg albo `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Gdy pominięte, OpenClaw używa normalnego wyboru modelu agenta, a
  harness weryfikuje, że rozwiązany dostawca jest obsługiwany.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Mapuje z
  rozwiązania `ThinkLevel` / `ReasoningLevel` OpenClaw w
  `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — opcjonalne nadpisanie bloku SDK
  `infiniteSessions` sterowanego przez `harness.compact`. Wartości domyślne można bezpiecznie
  zostawić bez zmian.
- `hooksConfig` — opcjonalna konfiguracja zgodności natywnego Copilot SDK `SessionHooks`
  dla wywołań zwrotnych narzędzi/MCP, promptu użytkownika, sesji i błędów.
  Jest oddzielna od przenośnych hooków cyklu życia OpenClaw.
- `permissionPolicy` — opcjonalne nadpisanie handlera SDK
  `onPermissionRequest` używanego dla wbudowanych rodzajów narzędzi SDK
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Domyślnie
  używa `rejectAllPolicy` jako siatki bezpieczeństwa; w praktyce SDK nigdy
  nie wywołuje żadnego z tych rodzajów, ponieważ każde mostkowane narzędzie OpenClaw jest
  rejestrowane z `overridesBuiltInTool: true` i
  `skipPermission: true`, więc 100% wywołań narzędzi przepływa przez opakowane
  `execute()` OpenClaw. Zobacz [Uprawnienia i ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — opcjonalna flaga telemetrii sesji SDK.

Hooki pluginu OpenClaw nie potrzebują konfiguracji próby specyficznej dla Copilot. 
Harness uruchamia `before_prompt_build` (oraz starszy hook zgodności `before_agent_start`),
`llm_input`, `llm_output` i `agent_end` przez standardowe helpery harnessa. Udane Compaction SDK uruchamiają też
`before_compaction` i `after_compaction`. Mostkowane narzędzia OpenClaw nadal
uruchamiają `before_tool_call` i raportują `after_tool_call`; `hooksConfig` pozostaje dla
natywnych wywołań zwrotnych wyłącznie SDK, które nie mają przenośnego odpowiednika.

Nic w pozostałej części OpenClaw nie musi wiedzieć o tych polach. Inne
pluginy, kanały i kod core widzą tylko standardowy kształt
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Gdy uruchamia się `harness.compact`, harness Copilot SDK:

1. Wznawia śledzoną sesję SDK bez kontynuowania oczekującej pracy.
2. Wywołuje RPC Compaction historii o zakresie sesji SDK.
3. Zwraca wynik Compaction SDK bez zapisywania plików znaczników zgodności
   pod workspace.

Lustrzana transkrypcja po stronie OpenClaw (zobacz niżej) nadal otrzymuje
wiadomości po Compaction, więc historia czatu widoczna dla użytkownika pozostaje spójna.

## Lustrzane odbicie transkrypcji

`runCopilotAttempt` podwójnie zapisuje możliwe do odzwierciedlenia wiadomości każdej tury do
transkrypcji audytowej OpenClaw przez
`extensions/copilot/src/dual-write-transcripts.ts`. Lustro ma zakres
per sesja (`copilot:${sessionId}`) i używa tożsamości per wiadomość
(`${role}:${sha256_16(role,content)}`), więc ponowne emisje wpisów z poprzednich tur
kolidują z istniejącymi kluczami na dysku i się nie duplikują.

Lustro jest opakowane dwiema warstwami powstrzymywania awarii, więc awaria
zapisu transkrypcji nie może spowodować niepowodzenia próby: wewnętrznym wrapperem best-effort oraz
defense-in-depth `.catch(...)` na poziomie próby. Awarie są logowane, ale
nie są ujawniane.

## Pytania poboczne (`/btw`)

`/btw` **nie jest** natywne w tym harnessie. `createCopilotAgentHarness()`
celowo pozostawia `harness.runSideQuestion` jako niezdefiniowane, więc dispatcher `/btw`
OpenClaw (`src/agents/btw.ts`) przechodzi do tej samej wbudowanej ścieżki awaryjnej PI,
której używa dla każdego runtime innego niż Codex: skonfigurowany dostawca modelu jest
wywoływany bezpośrednio z krótkim promptem pytania pobocznego, a odpowiedź jest
streamowana przez `streamSimple` (bez sesji CLI i bez dodatkowego miejsca w puli).

Dzięki temu sesje Copilot CLI pozostają zarezerwowane dla głównej pętli tury agenta,
a zachowanie `/btw` jest identyczne jak w innych runtime'ach opartych na PI. Kontrakt jest
potwierdzony w
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
w sekcji `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` jest automatycznie ładowany przez
`src/plugins/doctor-contract-registry.ts`. Wnosi:

- Puste `legacyConfigRules` (brak wycofanych pól na etapie MVP).
- Puste w działaniu `normalizeCompatibilityConfig` (zachowane, aby przyszłe wycofania pól
  miały stabilne miejsce w drzewie repozytorium).
- Jeden wpis `sessionRouteStateOwners`, który obejmuje dostawcę `github-copilot`;
  runtime `copilot`; klucz sesji CLI `copilot`; prefiks profilu uwierzytelniania
  `github-copilot:`.

## Ograniczenia

- Harness zgłasza `github-copilot` oraz nieposiadane niestandardowe identyfikatory dostawców BYOK.
  Identyfikatory natywnych dostawców posiadane przez manifest pozostają przy swoim runtime
  właścicielskim, nawet gdy `agentRuntime.id` jest wymuszone na `copilot`.
- Harness nie dostarcza TUI; TUI PI pozostaje nienaruszone i nadal jest
  ścieżką awaryjną dla runtime'ów, które nie mają równorzędnej powierzchni.
- Stan sesji PI nie jest migrowany, gdy agent przełącza się na `copilot`.
  Wybór odbywa się dla każdej próby; istniejące sesje PI pozostają ważne.
- `ask_user` używa tej samej ścieżki promptu i odpowiedzi OpenClaw co harness Codex.
  Gdy Copilot SDK prosi o dane wejściowe użytkownika, OpenClaw publikuje
  blokujący prompt w aktywnym kanale/TUI, a następna zakolejkowana wiadomość użytkownika
  rozwiązuje żądanie SDK.

## Uprawnienia i ask_user

Egzekwowanie uprawnień dla mostkowanych narzędzi OpenClaw odbywa się **wewnątrz
wrappera narzędzia**, a nie przez callback SDK `onPermissionRequest`. Ten sam
`wrapToolWithBeforeToolCallHook`, którego używa PI
(`src/agents/pi-tools.before-tool-call.ts`), jest stosowany przez
`createOpenClawCodingTools` do każdego narzędzia programistycznego: wykrywanie pętli,
zasady zaufanych pluginów, hooki przed wywołaniem narzędzia oraz dwufazowe zatwierdzenia
pluginów przez Gateway (`plugin.approval.request`) działają dokładnie tą samą ścieżką kodu
co natywne próby PI.

Aby ten wrapper był właścicielem decyzji, SDK Tool zwracany przez
`convertOpenClawToolToSdkTool` jest oznaczony jako:

- `overridesBuiltInTool: true` — zastępuje wbudowane narzędzie Copilot CLI
  o tej samej nazwie (edit, read, write, bash, …), aby każde wywołanie narzędzia
  wracało do OpenClaw.
- `skipPermission: true` — informuje SDK, aby nie wywoływało
  `onPermissionRequest({kind: "custom-tool"})` przed uruchomieniem narzędzia.
  Opakowane `execute()` wykonuje bogatszą kontrolę zasad OpenClaw
  wewnętrznie; prompt na poziomie SDK albo obszedłby egzekwowanie OpenClaw
  (jeśli pozwolimy na wszystko), albo blokowałby każde wywołanie narzędzia
  (jeśli odrzucimy wszystko) — żadne z tych zachowań nie odpowiada parytetowi PI.

Wbudowany harness codex używa tego samego podziału: mostkowane narzędzia OpenClaw
są opakowywane (`extensions/codex/src/app-server/dynamic-tools.ts`), a własne
natywne rodzaje zatwierdzeń codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) są kierowane przez
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Odpowiednik w Copilot SDK
— domyślnie zamknięte `rejectAllPolicy` dla każdego rodzaju innego niż `custom-tool`,
który kiedykolwiek dotrze do `onPermissionRequest` — jest tą samą siatką bezpieczeństwa
i w praktyce się nie uruchamia, ponieważ `overridesBuiltInTool: true`
wypiera każde narzędzie wbudowane.

Aby warstwa opakowanych narzędzi mogła podejmować decyzje zasad równoważne z PI,
harness przekazuje pełny kontekst narzędzia próby PI do
`createOpenClawCodingTools` — tożsamość (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), kanał/routing
(`groupId`, `currentChannelId`, `replyToMode`, przełączniki narzędzi wiadomości),
uwierzytelnianie (`authProfileStore`), tożsamość uruchomienia
(`sessionKey`/`runSessionKey` wyprowadzone z `sandboxSessionKey`,
`runId`), kontekst modelu (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) oraz hooki uruchomienia (`onToolOutcome`,
`onYield`). Bez tych pól allowlisty tylko dla właściciela po cichu
zachowują się jak deny-by-default, zasady zaufania pluginów nie mogą rozwiązać się do
właściwego zakresu, a `session_status: "current"` rozwiązuje się do nieaktualnego
klucza sandboxa. Konstruktor mostu znajduje się w
`extensions/copilot/src/tool-bridge.ts` i odzwierciedla autorytatywne wywołanie PI w
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt`
już rozwiązuje kontekst sandboxa przez współdzielony seam
`resolveSandboxContext`, przekazuje SDK efektywny katalog roboczy
oraz przekazuje `sandbox` wraz z obszarem roboczym spawnowanego subagenta do
mostu narzędzi. Most przekazuje też ograniczone kontrolki konstrukcji narzędzi,
które może egzekwować na granicy SDK: `includeCoreTools`, allowlistę narzędzi
runtime oraz `toolConstructionPlan`.

Most używa też współdzielonego helpera powierzchni narzędzi harnessa z
`openclaw/plugin-sdk/agent-harness-tool-runtime` dla parytetu PI. Gdy
wyszukiwanie narzędzi jest włączone, SDK widzi kompaktowe narzędzia sterujące oraz ukryty
executor katalogu zamiast każdego schematu narzędzia OpenClaw. Gdy tryb kodu jest
włączony, helper buduje tę samą powierzchnię sterującą trybu kodu oraz cykl życia katalogu,
których używają inne harnessy agentów. Odchudzone domyślne ustawienia modeli lokalnych,
filtrowanie schematów zgodne z runtime, hydratacja katalogów oraz czyszczenie katalogu
pozostają we współdzielonym helperze, aby harnessy Copilot i sąsiadujące z Codex
nie rozjeżdżały się.

### Token GitHub na poziomie sesji

Kontrakt Copilot SDK odróżnia token GitHub na **poziomie klienta**
(`CopilotClientOptions.gitHubToken`, używany do uwierzytelnienia samego procesu CLI)
od tokena na **poziomie sesji** (`SessionConfig.gitHubToken`, który określa wykluczenia
treści, routing modelu i limit dla tej sesji oraz jest respektowany zarówno przy
`createSession`, jak i `resumeSession`). Harness rozwiązuje uwierzytelnianie raz
przez `resolveCopilotAuth` i ustawia oba pola, gdy trybem uwierzytelniania jest
`gitHubToken` (jawne `auth.gitHubToken` albo rozwiązany kontraktem
`resolvedApiKey` ze skonfigurowanego profilu uwierzytelniania `github-copilot`).
Gdy rozwiązanym trybem jest `useLoggedInUser`, pole na poziomie sesji
jest pomijane, aby SDK nadal wyprowadzało tożsamość z zalogowanej
tożsamości.

`ask_user` używa `SessionConfig.onUserInputRequest`. Most akceptuje
indeksy lub etykiety wyboru dla żądań o stałym wyborze, akceptuje odpowiedzi
swobodne, gdy żądanie SDK na nie pozwala, oraz anuluje oczekujące żądanie,
gdy próba OpenClaw zostanie przerwana.

## Powiązane

- [Runtime'y agentów](/pl/concepts/agent-runtimes)
- [Harness Codex](/pl/plugins/codex-harness)
- [Pluginy harnessów agentów (referencja SDK)](/pl/plugins/sdk-agent-harness)
