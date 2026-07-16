---
read_when:
    - Chcesz użyć środowiska GitHub Copilot SDK dla agenta
    - Potrzebne są przykłady konfiguracji środowiska uruchomieniowego `copilot`
    - Konfigurujesz agenta do korzystania z subskrypcji Copilot (github / openclaw / copilot) i chcesz, aby działał za pośrednictwem Copilot CLI
summary: Uruchamiaj tury wbudowanego agenta OpenClaw za pośrednictwem zewnętrznego środowiska GitHub Copilot SDK
title: Środowisko testowe zestawu SDK Copilot
x-i18n:
    generated_at: "2026-07-16T18:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

Zewnętrzny plugin `@openclaw/copilot` uruchamia osadzone tury agenta Copilot
w ramach subskrypcji za pośrednictwem GitHub Copilot CLI (`@github/copilot-sdk`) zamiast
wbudowanego mechanizmu OpenClaw. Sesja Copilot CLI zarządza niskopoziomową
pętlą agenta: natywnym wykonywaniem narzędzi, natywną kompakcją (`infiniteSessions`) oraz
stanem wątku zarządzanym przez CLI w katalogu `copilotHome`. OpenClaw nadal zarządza kanałami
czatu, plikami sesji, wyborem modelu, narzędziami dynamicznymi (mostkowanymi), zatwierdzeniami,
dostarczaniem multimediów, widoczną kopią transkrypcji, pytaniami pobocznymi `/btw` (zobacz
[Pytania poboczne (`/btw`)](#side-questions-btw)) oraz `openclaw doctor`.

Szerszy opis podziału na model, dostawcę i środowisko uruchomieniowe znajduje się w sekcji
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Wymagania

- OpenClaw z zainstalowanym pluginem `@openclaw/copilot`.
- Jeśli konfiguracja używa `plugins.allow`, należy uwzględnić `copilot` (identyfikator manifestu
  deklarowany przez plugin). Wpis na liście dozwolonych zawierający nazwę pakietu npm
  `@openclaw/copilot` nie zostanie dopasowany i plugin pozostanie zablokowany, nawet jeśli
  ustawiono `agentRuntime.id: "copilot"`.
- Subskrypcja GitHub Copilot umożliwiająca sterowanie Copilot CLI albo
  zmienna środowiskowa `gitHubToken` / wpis profilu uwierzytelniania na potrzeby uruchomień bez interfejsu lub przez Cron.
- Zapisywalny katalog `copilotHome`. Domyślnie jest to `<agentDir>/copilot`, gdy
  OpenClaw udostępnia katalog agenta, a w przeciwnym razie
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` uruchamia [kontrakt diagnostyczny](#doctor) pluginu dotyczący
własności stanu sesji i przyszłych migracji konfiguracji. Nie sprawdza
środowiska Copilot CLI.

## Instalacja

Środowisko uruchomieniowe Copilot jest dostarczane jako zewnętrzny plugin, dzięki czemu podstawowy pakiet `openclaw`
nie zawiera `@github/copilot-sdk` ani jego zależnego od platformy
pliku binarnego CLI `@github/copilot-<platform>-<arch>` (łącznie około 260 MB).
Należy go instalować tylko dla agentów korzystających z tego środowiska uruchomieniowego:

```bash
openclaw plugins install @openclaw/copilot
```

Kreator konfiguracji instaluje plugin automatycznie przy pierwszym wybraniu
modelu `github-copilot/*` **i** skierowaniu tego modelu (lub jego
dostawcy) w konfiguracji do środowiska uruchomieniowego Copilot za pomocą `agentRuntime: { id: "copilot" }`; zobacz
[Przewodnik szybkiego startu](#quickstart). Bez tej zgody OpenClaw korzysta z wbudowanego
dostawcy GitHub Copilot i nigdy nie instaluje tego pluginu.

Środowisko uruchomieniowe rozwiązuje SDK w następującej kolejności:

1. `import("@github/copilot-sdk")` z zainstalowanego pakietu `@openclaw/copilot`.
2. Katalog zapasowy `~/.openclaw/npm-runtime/copilot/` (starsze docelowe miejsce
   instalacji na żądanie).

Brak SDK powoduje jeden błąd o kodzie `COPILOT_SDK_MISSING` z podanym
powyżej poleceniem ponownej instalacji.

## Przewodnik szybkiego startu

Przypisz jeden model (lub jednego dostawcę) do mechanizmu:

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

Ustaw `agentRuntime.id` w pojedynczym wpisie modelu, aby kierować przez
mechanizm tylko ten model, albo u dostawcy, aby kierować w ten sposób wszystkie jego modele.

`github-copilot/auto` jest przenośnym punktem wyjścia. Nazwane modele Copilot zależą
od zasad konta i organizacji; przed ich przypisaniem należy potwierdzić, że uwierzytelniony
Copilot CLI rzeczywiście udostępnia dany model.

## Obsługiwani dostawcy

Mechanizm obsługuje kanonicznego dostawcę `github-copilot` (należącego do
`extensions/github-copilot`), a także niestandardowe wpisy `models.providers`, gdy
model ma niepustą wartość `baseUrl` i jeden z następujących kształtów `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (uzupełnianie zgodne z OpenAI)
- `openai-completions`
- `openai-responses`

Natywne identyfikatory dostawców (`openai`, `anthropic`, `google`, `ollama`) pozostają własnością
ich natywnych środowisk uruchomieniowych. Aby skierować punkt końcowy
przez Copilot BYOK, należy użyć odrębnego identyfikatora niestandardowego dostawcy.

Punkty końcowe Copilot BYOK muszą być publicznymi adresami URL HTTPS. Mechanizm udostępnia
SDK Copilot serwer proxy pętli zwrotnej dla każdej próby, a następnie przekazuje ruch dostawcy
przez chronioną ścieżkę pobierania OpenClaw, dzięki czemu przypinaniem DNS i zasadami SSRF nadal
zarządza OpenClaw. W przypadku lokalnych serwerów modeli Ollama, LM
Studio lub serwerów w sieci LAN należy używać natywnego środowiska uruchomieniowego OpenClaw.

## BYOK

Copilot BYOK korzysta z kontraktu niestandardowego dostawcy SDK na poziomie sesji. OpenClaw
przekazuje rozwiązany punkt końcowy modelu, klucz API, tryb tokenu okaziciela, nagłówki, identyfikator
modelu oraz limity kontekstu i danych wyjściowych; logika transportowa dostawcy pozostaje w SDK, a nie
w rdzeniu.

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

Sesje BYOK mają klucze oddzielne od sesji subskrypcyjnych oraz od innych
punktów końcowych lub poświadczeń BYOK. Rotacja klucza, nagłówków, modelu lub punktu końcowego
rozpoczyna nową sesję SDK Copilot zamiast wznawiać niezgodny stan.

## Uwierzytelnianie

Kolejność pierwszeństwa stosowana dla każdego agenta podczas `runCopilotAttempt`:

1. **Jawne `useLoggedInUser: true`** w danych wejściowych próby — korzysta z
   użytkownika zalogowanego w Copilot CLI w katalogu `copilotHome` agenta.
2. **Jawne `gitHubToken`** w danych wejściowych próby (wymaga `profileId` +
   `profileVersion`). Przeznaczone do bezpośrednich wywołań CLI i testów, które muszą
   pominąć rozwiązywanie profilu uwierzytelniania.
3. **Rozwiązane przez kontrakt `resolvedApiKey` + `authProfileId`** — główna ścieżka
   produkcyjna. Przed wywołaniem mechanizmu rdzeń rozwiązuje skonfigurowany dla agenta profil
   uwierzytelniania `github-copilot` (`src/infra/provider-usage.auth.ts:resolveProviderAuths`), dzięki czemu profil uwierzytelniania
   `github-copilot:<profile>` działa kompleksowo w konfiguracjach bez interfejsu,
   z Cron lub z wieloma profilami bez zmiennych środowiskowych.
4. **Mechanizm zapasowy oparty na zmiennych środowiskowych**, sprawdzany w następującej kolejności (wygrywa pierwsza niepusta wartość,
   puste ciągi są traktowane jako brak wartości; odzwierciedla kolejność pierwszeństwa dostarczanego
   dostawcy `github-copilot` w `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — nadpisanie specyficzne dla mechanizmu; umożliwia przypisanie
      tokenu do mechanizmu OpenClaw bez zakłócania ogólnosystemowej konfiguracji `gh` /
      Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` — standardowa zmienna środowiskowa SDK / CLI Copilot.
   3. `GH_TOKEN` — standardowa zmienna środowiskowa CLI `gh`.
   4. `GITHUB_TOKEN` — ogólny zapasowy token GitHub.

   Identyfikator syntetyzowanego profilu puli to `env:<NAME>`; wersja profilu jest
   nieodwracalnym odciskiem sha256 tokenu, dzięki czemu rotacja wartości środowiskowej
   prawidłowo unieważnia pulę klientów.

5. **Domyślne `useLoggedInUser`**, gdy nie jest dostępny żaden sygnał tokenu.

Każdy agent otrzymuje własny katalog `copilotHome`, dzięki czemu tokeny, sesje i
konfiguracja Copilot CLI nigdy nie przenikają między agentami na tym samym komputerze. Domyślnie:
`<agentDir>/copilot` (utrzymuje stan SDK poza katalogiem zawierającym
`models.json` / `auth-profiles.json` OpenClaw) albo
`~/.openclaw/agents/<agentId>/copilot`, gdy nie podano katalogu agenta.
Aby użyć niestandardowej lokalizacji (na przykład współdzielonego punktu montowania na potrzeby migracji),
należy ustawić `copilotHome: <path>` w danych wejściowych próby.

Testy mechanizmu na żywo używają `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` do bezpośredniego
przekazania tokenu. Wspólna konfiguracja testów na żywo usuwa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
i `GITHUB_TOKEN` po umieszczeniu rzeczywistych profili uwierzytelniania w izolowanym katalogu domowym
testu, dlatego wartość `gh auth token` przekazana przez dedykowaną zmienną zapobiega
fałszywemu pomijaniu testów bez wycieku do niepowiązanych zestawów.

## Powierzchnia konfiguracji

Mechanizm odczytuje konfigurację z danych wejściowych poszczególnych prób (`runCopilotAttempt({...})`)
oraz niewielkiego zestawu domyślnych zmiennych środowiskowych w `extensions/copilot/src/`:

| Pole                     | Przeznaczenie                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Katalog stanu CLI dla agenta (wartości domyślne podano powyżej).                                                                                                                                                                                                                                |
| `model`                  | Ciąg znaków lub `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Należy pominąć, aby użyć zwykłego wyboru modelu agenta; mechanizm sprawdza, czy rozwiązany dostawca jest obsługiwany.                                                                                                            |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Odwzorowuje wynik rozwiązywania `ThinkLevel` / `ReasoningLevel` OpenClaw w `auto-reply/thinking.ts`.                                                                                                                                                    |
| `infiniteSessionConfig`  | Opcjonalne nadpisanie bloku SDK `infiniteSessions` sterowanego przez `harness.compact`. Można bezpiecznie pozostawić bez zmian.                                                                                                                                                                  |
| `hooksConfig`            | Opcjonalna natywna konfiguracja `SessionHooks` SDK Copilot dla wywołań zwrotnych narzędzi/MCP, monitów użytkownika, sesji i błędów. Oddzielna od przenośnych haków cyklu życia OpenClaw.                                                                                                         |
| `permissionPolicy`       | Opcjonalne nadpisanie procedury obsługi `onPermissionRequest` SDK dla wbudowanych rodzajów narzędzi SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Domyślnie `rejectAllPolicy` jako zabezpieczenie; wyjaśnienie, dlaczego nigdy nie jest faktycznie uruchamiana, znajduje się w sekcji [Uprawnienia i ask_user](#permissions-and-ask_user). |
| `enableSessionTelemetry` | Opcjonalna flaga telemetrii sesji SDK.                                                                                                                                                                                                                                                           |

Haki pluginów OpenClaw nie wymagają konfiguracji próby specyficznej dla Copilot. Mechanizm
uruchamia `before_prompt_build` (oraz starszy hak zgodności `before_agent_start`),
`llm_input`, `llm_output` i `agent_end` za pośrednictwem
standardowych funkcji pomocniczych mechanizmu. Udane kompakcje SDK uruchamiają również
`before_compaction` i `after_compaction`. Mostkowane narzędzia OpenClaw uruchamiają
`before_tool_call` i zgłaszają `after_tool_call`; `hooksConfig` pozostaje przeznaczone dla
natywnych wywołań zwrotnych dostępnych wyłącznie w SDK, które nie mają przenośnego odpowiednika.

Żadna inna część OpenClaw nie musi znać tych pól. Inne pluginy,
kanały i kod rdzenia widzą tylko standardowy kształt `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Gdy uruchamiane jest `harness.compact`, mechanizm SDK Copilot:

1. Wznawia śledzoną sesję SDK bez kontynuowania oczekującej pracy.
2. Wywołuje RPC kompakcji historii SDK o zakresie sesji.
3. Zwraca wynik kompakcji SDK bez zapisywania plików znaczników
   zgodności w obszarze roboczym.

Kopia transkrypcji po stronie OpenClaw (poniżej) nadal otrzymuje komunikaty
po kompakcji, dzięki czemu historia czatu widoczna dla użytkownika pozostaje spójna.

## Kopia transkrypcji

`runCopilotAttempt` zapisuje podwójnie w każdej turze wiadomości, które można odzwierciedlić, w
transkrypcie audytowym OpenClaw za pośrednictwem
`extensions/copilot/src/dual-write-transcripts.ts`. Odbicie jest ograniczone do poszczególnych
sesji (`copilot:${sessionId}`) i ma klucz przypisany do każdej wiadomości
(`${role}:${sha256_16(role,content)}`), dlatego ponownie wyemitowane wpisy z poprzednich tur
kolidują z istniejącymi kluczami na dysku, zamiast tworzyć duplikaty.

Odbicie jest otoczone dwiema warstwami ograniczania skutków awarii, dzięki czemu błąd zapisu
transkryptu nigdy nie powoduje niepowodzenia próby: wewnętrzną otoczką działającą na zasadzie najlepszych starań oraz
mechanizmem ochrony warstwowej `.catch(...)` na poziomie próby. Błędy są rejestrowane, a nie
ujawniane.

## Pytania poboczne (`/btw`)

`/btw` **nie** jest natywne dla tego mechanizmu wykonawczego. `createCopilotAgentHarness()`
celowo pozostawia `harness.runSideQuestion` niezdefiniowane
(co potwierdzają `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
dlatego dyspozytor `/btw` OpenClaw (`src/agents/btw.ts`) przechodzi do
tej samej ścieżki, której używa dla każdego środowiska uruchomieniowego innego niż Codex: skonfigurowany dostawca modelu
jest wywoływany bezpośrednio z krótkim promptem pytania pobocznego, a odpowiedź jest przesyłana strumieniowo przez
`streamSimple` (bez sesji CLI i bez dodatkowego miejsca w puli).

Dzięki temu sesje Copilot CLI pozostają zarezerwowane dla głównej pętli tur agenta,
a zachowanie `/btw` jest identyczne jak w innych środowiskach uruchomieniowych innych niż Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` jest automatycznie wczytywany przez
`src/plugins/doctor-contract-registry.ts`. Udostępnia:

- Pusty `legacyConfigRules` (nie ma jeszcze wycofanych pól).
- Niewykonujący żadnych operacji `normalizeCompatibilityConfig` (zachowany, aby przyszłe wycofania pól
  miały stabilne miejsce w drzewie źródeł).
- Jeden wpis `sessionRouteStateOwners`: dostawca `github-copilot`, środowisko uruchomieniowe
  `copilot`, klucz sesji CLI `copilot`, prefiks profilu uwierzytelniania `github-copilot:`.

## Ograniczenia

- Mechanizm wykonawczy przejmuje `github-copilot` oraz nienależące do właściciela niestandardowe identyfikatory dostawców BYOK.
  Natywne identyfikatory dostawców należące do manifestu pozostają w środowisku uruchomieniowym ich właściciela, nawet gdy
  `agentRuntime.id` ma wymuszoną wartość `copilot`.
- Brak interfejsu TUI; TUI środowiska PI pozostaje rozwiązaniem rezerwowym dla środowisk uruchomieniowych bez równorzędnego
  interfejsu.
- Stan sesji PI nie jest migrowany, gdy agent przełącza się na `copilot`.
  Wybór odbywa się dla każdej próby osobno; istniejące sesje PI pozostają prawidłowe.
- `ask_user` korzysta z tej samej ścieżki promptu i odpowiedzi OpenClaw co mechanizm wykonawczy Codex:
  gdy Copilot SDK prosi o dane wejściowe użytkownika, OpenClaw publikuje
  blokujący prompt w aktywnym kanale lub TUI, a następna oczekująca w kolejce wiadomość
  użytkownika rozwiązuje żądanie SDK.

## Uprawnienia i ask_user

Egzekwowanie uprawnień dla mostkowanych narzędzi OpenClaw odbywa się **wewnątrz otoczki narzędzia**,
a nie za pomocą wywołania zwrotnego `onPermissionRequest` SDK. Ten sam
`wrapToolWithBeforeToolCallHook`, którego używa PI
(`src/agents/agent-tools.before-tool-call.ts`), jest stosowany przez
`createOpenClawCodingTools` do każdego narzędzia programistycznego: wykrywanie pętli, zasady zaufanych
pluginów, haki wywoływane przed narzędziem oraz dwuetapowe zatwierdzanie pluginów przez
Gateway (`plugin.approval.request`) korzystają dokładnie z tej samej ścieżki kodu
co natywne próby PI.

Każde narzędzie SDK zwracane przez mostek narzędzi Copilot jest oznaczone:

- `overridesBuiltInTool: true` — zastępuje wbudowane narzędzie Copilot CLI o
  tej samej nazwie (edit, read, write, bash, ...), dzięki czemu każde wywołanie narzędzia jest kierowane z powrotem
  do OpenClaw.
- `skipPermission: true` — nakazuje SDK nie wywoływać
  `onPermissionRequest({kind: "custom-tool"})` przed uruchomieniem narzędzia.
  Opakowany `execute()` wykonuje już bogatszą kontrolę zasad OpenClaw; prompt
  na poziomie SDK albo omijałby egzekwowanie zasad OpenClaw
  (zezwalając na wszystko), albo blokowałby każde wywołanie narzędzia (odrzucając wszystko) — żadne z tych zachowań nie zapewnia zgodności
  z PI.

Mechanizm wykonawczy Codex w drzewie źródeł używa tego samego podziału: mostkowane narzędzia OpenClaw są
opakowywane (`extensions/codex/src/app-server/dynamic-tools.ts`), a własne natywne rodzaje zatwierdzeń
serwera codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) są kierowane przez `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Odpowiednik w Copilot SDK
— odrzucający domyślnie `rejectAllPolicy` dla każdego rodzaju innego niż `custom-tool`,
który kiedykolwiek dotrze do `onPermissionRequest` — stanowi ten sam mechanizm zabezpieczający i
w praktyce nigdy nie jest uruchamiany, ponieważ `overridesBuiltInTool: true` zastępuje każde
narzędzie wbudowane.

Aby warstwa opakowanych narzędzi mogła podejmować decyzje dotyczące zasad równoważne z PI,
mechanizm wykonawczy przekazuje pełny kontekst narzędzi próby PI do
`createOpenClawCodingTools`: tożsamość (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kanał i trasowanie (`groupId`,
`currentChannelId`, `replyToMode`, przełączniki narzędzi wiadomości), uwierzytelnianie
(`authProfileStore`), tożsamość uruchomienia (`sessionKey` / `runSessionKey` wyprowadzone
z `sandboxSessionKey`, `runId`), kontekst modelu (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) oraz haki uruchomienia
(`onToolOutcome`, `onYield`). Bez tych pól listy dozwolonych elementów ograniczone do właściciela
domyślnie po cichu odmawiają dostępu, zasady zaufania pluginów nie mogą zostać dopasowane do właściwego
zakresu, a `session_status: "current"` wskazuje nieaktualny klucz piaskownicy. Konstruktorem
mostka jest `extensions/copilot/src/tool-bridge.ts`, odzwierciedlający autorytatywne
wywołanie PI w `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` rozwiązuje kontekst piaskownicy przez współdzielony
punkt integracji `resolveSandboxContext`, przekazuje SDK efektywny katalog roboczy
oraz przekazuje `sandbox` i przestrzeń roboczą tworzenia podagentów do mostka
narzędzi. Mostek przekazuje także ograniczone mechanizmy sterujące konstrukcją narzędzi, które
może egzekwować na granicy SDK: `includeCoreTools`, listę dozwolonych narzędzi
środowiska uruchomieniowego oraz `toolConstructionPlan`.

Mostek korzysta również ze współdzielonej funkcji pomocniczej interfejsu narzędzi mechanizmu wykonawczego z
`openclaw/plugin-sdk/agent-harness-tool-runtime`, aby zachować zgodność z PI. Gdy
wyszukiwanie narzędzi jest włączone, SDK widzi kompaktowe narzędzia sterujące oraz ukryty
moduł wykonujący katalog zamiast wszystkich schematów narzędzi OpenClaw. Gdy włączony jest tryb kodu,
funkcja pomocnicza tworzy ten sam interfejs sterowania trybem kodu i cykl życia katalogu,
których używają inne mechanizmy wykonawcze agentów. Odchudzone ustawienia domyślne modeli lokalnych,
filtrowanie schematów zgodne ze środowiskiem uruchomieniowym, uzupełnianie katalogów oraz czyszczenie
katalogu pozostają we współdzielonej funkcji pomocniczej, aby mechanizmy wykonawcze Copilot i powiązane
z Codex nie rozchodziły się funkcjonalnie.

### Token GitHub na poziomie sesji

Kontrakt Copilot SDK rozróżnia token GitHub **na poziomie klienta**
(`CopilotClientOptions.gitHubToken`, uwierzytelniający sam proces CLI)
od tokenu **na poziomie sesji** (`SessionConfig.gitHubToken`, określającego
wykluczanie zawartości, trasowanie modelu oraz limit dla tej sesji; uwzględnianego zarówno w
`createSession`, jak i `resumeSession`). Mechanizm wykonawczy rozwiązuje uwierzytelnianie raz przez
`resolveCopilotAuth` i ustawia oba pola, gdy trybem uwierzytelniania jest `gitHubToken`
(jawny `auth.gitHubToken` lub rozwiązany zgodnie z kontraktem `resolvedApiKey` ze
skonfigurowanego profilu uwierzytelniania `github-copilot`). Gdy rozwiązanym trybem jest
`useLoggedInUser`, pole na poziomie sesji jest pomijane, aby SDK nadal
wyprowadzało tożsamość z zalogowanej tożsamości.

`ask_user` korzysta z `SessionConfig.onUserInputRequest`. Mostek akceptuje indeksy
lub etykiety opcji dla żądań ze stałym wyborem, przyjmuje odpowiedzi w dowolnej formie, gdy
żądanie SDK na nie zezwala, oraz anuluje oczekujące żądanie, gdy próba OpenClaw
zostanie przerwana.

## Powiązane

- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Mechanizm wykonawczy Codex](/pl/plugins/codex-harness)
- [Pluginy mechanizmu wykonawczego agentów (dokumentacja SDK)](/pl/plugins/sdk-agent-harness)
