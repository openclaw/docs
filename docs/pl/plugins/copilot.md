---
read_when:
    - Chcesz użyć środowiska GitHub Copilot SDK dla agenta
    - Potrzebujesz przykładów konfiguracji środowiska uruchomieniowego `copilot`
    - Łączysz agenta z usługą Copilot w ramach subskrypcji (github / openclaw / copilot) i chcesz, aby działał za pośrednictwem Copilot CLI
summary: Uruchamiaj przebiegi osadzonego agenta OpenClaw za pośrednictwem zewnętrznego środowiska GitHub Copilot SDK
title: Środowisko testowe zestawu SDK Copilot
x-i18n:
    generated_at: "2026-07-12T15:21:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Zewnętrzny plugin `@openclaw/copilot` uruchamia osadzone tury agenta Copilot w ramach subskrypcji za pośrednictwem GitHub Copilot CLI (`@github/copilot-sdk`) zamiast wbudowanej infrastruktury OpenClaw. Sesja Copilot CLI zarządza niskopoziomową pętlą agenta: natywnym wykonywaniem narzędzi, natywną Compaction (`infiniteSessions`) oraz stanem wątku zarządzanym przez CLI w katalogu `copilotHome`. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu, narzędziami dynamicznymi (połączonymi przez most), zatwierdzeniami, dostarczaniem multimediów, widoczną kopią transkrypcji, pytaniami pobocznymi `/btw` (zobacz [Pytania poboczne (`/btw`)](#side-questions-btw)) oraz `openclaw doctor`.

Szerszy opis podziału na model, dostawcę i środowisko uruchomieniowe znajdziesz w sekcji [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Wymagania

- OpenClaw z zainstalowanym pluginem `@openclaw/copilot`.
- Jeśli konfiguracja używa `plugins.allow`, uwzględnij `copilot` (identyfikator zadeklarowany w manifeście przez plugin). Wpis na liście dozwolonych zawierający nazwę pakietu npm `@openclaw/copilot` nie zostanie dopasowany i plugin pozostanie zablokowany, nawet jeśli ustawiono `agentRuntime.id: "copilot"`.
- Subskrypcja GitHub Copilot umożliwiająca korzystanie z Copilot CLI albo zmienna środowiskowa `gitHubToken` / wpis profilu uwierzytelniania do uruchomień bezobsługowych lub przez Cron.
- Katalog `copilotHome` z prawem zapisu. Domyślnie jest to `<agentDir>/copilot`, gdy OpenClaw udostępnia katalog agenta, a w przeciwnym razie `~/.openclaw/agents/<agentId>/copilot`.

Polecenie `openclaw doctor` uruchamia [kontrakt diagnostyczny](#doctor) pluginu dotyczący własności stanu sesji i przyszłych migracji konfiguracji. Nie sprawdza środowiska Copilot CLI.

## Instalacja

Środowisko uruchomieniowe Copilot jest dostarczane jako zewnętrzny plugin, dzięki czemu podstawowy pakiet `openclaw` nie zawiera `@github/copilot-sdk` ani właściwego dla platformy pliku binarnego CLI `@github/copilot-<platform>-<arch>` (łącznie około 260 MB). Instaluj je wyłącznie dla agentów, które korzystają z tego środowiska uruchomieniowego:

```bash
openclaw plugins install @openclaw/copilot
```

Kreator konfiguracji automatycznie instaluje plugin przy pierwszym wyborze modelu `github-copilot/*`, **jeśli** konfiguracja kieruje ten model (lub jego dostawcę) do środowiska uruchomieniowego Copilot przez `agentRuntime: { id: "copilot" }`; zobacz [Szybki start](#quickstart). Bez tego jawnego wyboru OpenClaw używa wbudowanego dostawcy GitHub Copilot i nigdy nie instaluje tego pluginu.

Środowisko uruchomieniowe wyszukuje SDK w następującej kolejności:

1. `import("@github/copilot-sdk")` z zainstalowanego pakietu `@openclaw/copilot`.
2. Katalog zapasowy `~/.openclaw/npm-runtime/copilot/` (starsze miejsce docelowe instalacji na żądanie).

Brak SDK powoduje pojedynczy błąd o kodzie `COPILOT_SDK_MISSING` wraz z podanym wyżej poleceniem ponownej instalacji.

## Szybki start

Przypisz jeden model (lub jednego dostawcę) do infrastruktury:

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

Ustaw `agentRuntime.id` we wpisie pojedynczego modelu, aby kierować przez infrastrukturę tylko ten model, albo u dostawcy, aby kierować przez nią wszystkie modele tego dostawcy.

`github-copilot/auto` jest przenośnym punktem wyjścia. Dostępność nazwanych modeli Copilot zależy od konta i zasad organizacji; przed przypisaniem modelu upewnij się, że uwierzytelnione Copilot CLI rzeczywiście go udostępnia.

## Obsługiwani dostawcy

Infrastruktura obsługuje kanonicznego dostawcę `github-copilot` (należącego do `extensions/github-copilot`) oraz niestandardowe wpisy `models.providers`, jeśli model ma niepusty `baseUrl` i jeden z następujących wariantów `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (uzupełnianie zgodne z OpenAI)
- `openai-completions`
- `openai-responses`

Natywne identyfikatory dostawców (`openai`, `anthropic`, `google`, `ollama`) pozostają obsługiwane przez ich natywne środowiska uruchomieniowe. Aby kierować punkt końcowy przez Copilot BYOK, użyj zamiast tego odrębnego identyfikatora niestandardowego dostawcy.

Punkty końcowe Copilot BYOK muszą być publicznymi adresami URL HTTPS. Infrastruktura udostępnia Copilot SDK serwer proxy local loopback dla każdej próby, a następnie przekazuje ruch dostawcy przez chronioną ścieżkę pobierania OpenClaw, dzięki czemu przypinanie DNS i zasady SSRF pozostają pod kontrolą OpenClaw. W przypadku lokalnych serwerów modeli Ollama, LM Studio lub serwerów w sieci LAN użyj natywnego środowiska uruchomieniowego OpenClaw.

## BYOK

Copilot BYOK używa kontraktu niestandardowego dostawcy na poziomie sesji, udostępnianego przez SDK. OpenClaw przekazuje rozpoznany punkt końcowy modelu, klucz API, tryb tokenu okaziciela, nagłówki, identyfikator modelu oraz limity kontekstu i danych wyjściowych; logika transportu dostawcy pozostaje w SDK, a nie w rdzeniu.

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

Sesje BYOK mają klucze odrębne od sesji subskrypcyjnych oraz od innych punktów końcowych lub danych uwierzytelniających BYOK. Zmiana klucza, nagłówków, modelu lub punktu końcowego rozpoczyna nową sesję Copilot SDK zamiast wznawiać niezgodny stan.

## Uwierzytelnianie

Kolejność pierwszeństwa stosowana dla każdego agenta podczas `runCopilotAttempt`:

1. **Jawne `useLoggedInUser: true`** w danych wejściowych próby — używa użytkownika zalogowanego w Copilot CLI w katalogu `copilotHome` agenta.
2. **Jawne `gitHubToken`** w danych wejściowych próby (wymaga `profileId` i `profileVersion`). Do bezpośrednich wywołań CLI i testów, które muszą pominąć rozpoznawanie profilu uwierzytelniania.
3. **Rozpoznane przez kontrakt `resolvedApiKey` i `authProfileId`** — główna ścieżka produkcyjna. Przed wywołaniem infrastruktury rdzeń rozpoznaje skonfigurowany profil uwierzytelniania `github-copilot` agenta (`src/infra/provider-usage.auth.ts:resolveProviderAuths`), dzięki czemu profil uwierzytelniania `github-copilot:<profile>` działa kompleksowo w konfiguracjach bezobsługowych, uruchamianych przez Cron lub korzystających z wielu profili, bez zmiennych środowiskowych.
4. **Awaryjne użycie zmiennej środowiskowej**, sprawdzanej w następującej kolejności (wygrywa pierwsza niepusta wartość; puste ciągi są traktowane jako brak wartości; odpowiada to kolejności pierwszeństwa dostawcy `github-copilot` w wydanej wersji, określonej w `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — nadpisanie właściwe dla infrastruktury; umożliwia przypisanie tokenu do infrastruktury OpenClaw bez zmieniania ogólnosystemowej konfiguracji `gh` / Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` — standardowa zmienna środowiskowa Copilot SDK / CLI.
   3. `GH_TOKEN` — standardowa zmienna środowiskowa CLI `gh`.
   4. `GITHUB_TOKEN` — ogólny token zastępczy GitHub.

   Syntetyzowany identyfikator profilu puli ma postać `env:<NAME>`; wersja profilu jest nieodwracalnym odciskiem sha256 tokenu, więc zmiana wartości zmiennej środowiskowej prawidłowo unieważnia pulę klientów.

5. **Domyślne `useLoggedInUser`**, gdy nie jest dostępny żaden sygnał tokenu.

Każdy agent otrzymuje własny katalog `copilotHome`, dzięki czemu tokeny, sesje i konfiguracja Copilot CLI nigdy nie przenikają między agentami na tym samym komputerze. Wartość domyślna to `<agentDir>/copilot` (co utrzymuje stan SDK poza katalogiem zawierającym pliki `models.json` / `auth-profiles.json` OpenClaw) albo `~/.openclaw/agents/<agentId>/copilot`, gdy nie podano katalogu agenta. Aby użyć niestandardowej lokalizacji (na przykład współdzielonego punktu montowania na potrzeby migracji), ustaw `copilotHome: <path>` w danych wejściowych próby.

Testy infrastruktury na żywo używają `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` jako bezpośredniego tokenu. Wspólna konfiguracja testów na żywo usuwa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` i `GITHUB_TOKEN` po przygotowaniu rzeczywistych profili uwierzytelniania w odizolowanym katalogu domowym testu, dzięki czemu wartość `gh auth token` przekazana przez dedykowaną zmienną zapobiega fałszywemu pomijaniu testów bez przenikania do niepowiązanych zestawów testów.

## Powierzchnia konfiguracji

Infrastruktura odczytuje konfigurację z danych wejściowych poszczególnych prób (`runCopilotAttempt({...})`) oraz niewielkiego zestawu domyślnych zmiennych środowiskowych w `extensions/copilot/src/`:

| Pole                     | Przeznaczenie                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Katalog stanu CLI osobny dla każdego agenta (wartości domyślne podano wyżej).                                                                                                                                                                                                                                                                                     |
| `model`                  | Ciąg znaków lub `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Pomiń, aby użyć standardowego wyboru modelu agenta; infrastruktura sprawdza, czy rozpoznany dostawca jest obsługiwany.                                                                                                                                                                    |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Mapowane na podstawie rozpoznania `ThinkLevel` / `ReasoningLevel` OpenClaw w `auto-reply/thinking.ts`.                                                                                                                                                                                                                   |
| `infiniteSessionConfig`  | Opcjonalne nadpisanie bloku `infiniteSessions` SDK sterowanego przez `harness.compact`. Można bezpiecznie pozostawić bez zmian.                                                                                                                                                                                                                                    |
| `hooksConfig`            | Opcjonalna natywna konfiguracja `SessionHooks` Copilot SDK dla wywołań zwrotnych narzędzi/MCP, komunikatów użytkownika, sesji i błędów. Jest oddzielna od przenośnych haków cyklu życia OpenClaw.                                                                                                                                                                    |
| `permissionPolicy`       | Opcjonalne nadpisanie procedury obsługi `onPermissionRequest` SDK dla wbudowanych rodzajów narzędzi SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Domyślnie używa `rejectAllPolicy` jako zabezpieczenia; wyjaśnienie, dlaczego w praktyce nigdy nie jest wywoływane, znajdziesz w sekcji [Uprawnienia i ask_user](#permissions-and-ask_user). |
| `enableSessionTelemetry` | Opcjonalna flaga telemetrii sesji SDK.                                                                                                                                                                                                                                                                                                                            |

Haki pluginów OpenClaw nie wymagają konfiguracji próby właściwej dla Copilot. Infrastruktura uruchamia `before_prompt_build` (oraz starszy hak zgodności `before_agent_start`), `llm_input`, `llm_output` i `agent_end` za pośrednictwem standardowych pomocników infrastruktury. Pomyślne operacje Compaction SDK uruchamiają także `before_compaction` i `after_compaction`. Połączone przez most narzędzia OpenClaw uruchamiają `before_tool_call` i zgłaszają `after_tool_call`; `hooksConfig` pozostaje przeznaczone dla natywnych wywołań zwrotnych wyłącznie w SDK, które nie mają przenośnego odpowiednika.

Żaden inny element OpenClaw nie musi znać tych pól. Pozostałe pluginy, kanały i kod rdzenia widzą wyłącznie standardową strukturę `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Po uruchomieniu `harness.compact` infrastruktura Copilot SDK:

1. Wznawia śledzoną sesję SDK bez kontynuowania oczekujących zadań.
2. Wywołuje procedurę RPC Compaction historii o zakresie sesji w SDK.
3. Zwraca wynik Compaction SDK bez zapisywania plików znaczników zgodności w obszarze roboczym.

Kopia transkrypcji po stronie OpenClaw (opisana niżej) nadal otrzymuje wiadomości po Compaction, dzięki czemu historia czatu widoczna dla użytkownika pozostaje spójna.

## Kopiowanie transkrypcji

Funkcja `runCopilotAttempt` zapisuje równolegle możliwe do skopiowania wiadomości z każdej tury do transkrypcji audytowej OpenClaw za pośrednictwem `extensions/copilot/src/dual-write-transcripts.ts`. Kopia ma zakres pojedynczej sesji (`copilot:${sessionId}`), a klucze są tworzone osobno dla każdej wiadomości (`${role}:${sha256_16(role,content)}`), dzięki czemu ponownie wyemitowane wpisy z wcześniejszych tur kolidują z istniejącymi kluczami na dysku zamiast tworzyć duplikaty.

Dwie warstwy izolowania błędów otaczają mechanizm lustrzany, dzięki czemu
błąd zapisu transkrypcji nigdy nie powoduje niepowodzenia próby: wewnętrzna
otoczka działająca na zasadzie best-effort oraz dodatkowe zabezpieczenie
`.catch(...)` na poziomie próby. Błędy są rejestrowane, a nie propagowane.

## Pytania poboczne (`/btw`)

`/btw` **nie** jest natywnie obsługiwane przez ten harness.
`createCopilotAgentHarness()` celowo pozostawia
`harness.runSideQuestion` jako niezdefiniowane
(co jest sprawdzane w `extensions/copilot/harness.test.ts`,
`describe("runSideQuestion")`), dlatego dyspozytor `/btw` OpenClaw
(`src/agents/btw.ts`) przechodzi do tej samej ścieżki, której używa dla
każdego środowiska uruchomieniowego innego niż Codex: skonfigurowany dostawca
modelu jest wywoływany bezpośrednio z krótkim promptem pytania pobocznego, a
odpowiedź jest strumieniowana przez `streamSimple` (bez sesji CLI i bez
dodatkowego miejsca w puli).

Dzięki temu sesje Copilot CLI pozostają zarezerwowane dla głównej pętli tur
agenta, a działanie `/btw` jest identyczne jak w innych środowiskach
uruchomieniowych innych niż Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` jest automatycznie ładowany przez
`src/plugins/doctor-contract-registry.ts`. Udostępnia:

- Puste `legacyConfigRules` (nie ma jeszcze wycofanych pól).
- `normalizeCompatibilityConfig`, które nie wykonuje żadnych operacji
  (zachowane, aby przyszłe wycofania pól miały stabilne miejsce w repozytorium).
- Jeden wpis `sessionRouteStateOwners`: dostawca `github-copilot`, środowisko
  uruchomieniowe `copilot`, klucz sesji CLI `copilot`, prefiks profilu
  uwierzytelniania `github-copilot:`.

## Ograniczenia

- Harness przejmuje `github-copilot` oraz niestanowiące własności manifestu
  niestandardowe identyfikatory dostawców BYOK. Natywne identyfikatory
  dostawców należące do manifestu pozostają w swoich środowiskach
  uruchomieniowych, nawet gdy `agentRuntime.id` zostanie wymuszone na
  `copilot`.
- Brak interfejsu TUI; TUI środowiska PI pozostaje rozwiązaniem zapasowym dla
  środowisk uruchomieniowych bez równorzędnego interfejsu.
- Stan sesji PI nie jest migrowany, gdy agent przełącza się na `copilot`.
  Wybór odbywa się dla każdej próby; istniejące sesje PI pozostają ważne.
- `ask_user` korzysta z tej samej ścieżki promptu i odpowiedzi OpenClaw co
  harness Codex: gdy Copilot SDK prosi o dane wejściowe użytkownika, OpenClaw
  publikuje blokujący prompt w aktywnym kanale lub TUI, a następna
  umieszczona w kolejce wiadomość użytkownika rozstrzyga żądanie SDK.

## Uprawnienia i ask_user

Egzekwowanie uprawnień dla mostkowanych narzędzi OpenClaw odbywa się
**wewnątrz otoczki narzędzia**, a nie za pośrednictwem wywołania zwrotnego
`onPermissionRequest` zestawu SDK. Ta sama funkcja
`wrapToolWithBeforeToolCallHook`, której używa PI
(`src/agents/agent-tools.before-tool-call.ts`), jest stosowana przez
`createOpenClawCodingTools` do każdego narzędzia programistycznego:
wykrywanie pętli, zasady zaufanych pluginów, hooki wykonywane przed
wywołaniem narzędzia oraz dwuetapowe zatwierdzanie pluginów za pośrednictwem
Gateway (`plugin.approval.request`) korzystają z dokładnie tej samej ścieżki
kodu co natywne próby PI.

Narzędzie SDK zwracane przez `convertOpenClawToolToSdkTool` jest oznaczone
następująco:

- `overridesBuiltInTool: true` — zastępuje wbudowane narzędzie Copilot CLI o
  tej samej nazwie (edit, read, write, bash, ...), dzięki czemu każde
  wywołanie narzędzia jest kierowane z powrotem do OpenClaw.
- `skipPermission: true` — nakazuje SDK nie wywoływać
  `onPermissionRequest({kind: "custom-tool"})` przed uruchomieniem narzędzia.
  Opakowana funkcja `execute()` wykonuje już bogatszą kontrolę zasad
  OpenClaw; prompt na poziomie SDK albo omijałby egzekwowanie zasad OpenClaw
  (zezwalając na wszystko), albo blokowałby każde wywołanie narzędzia
  (odrzucając wszystko) — żadna z tych opcji nie zapewnia zgodności z PI.

Znajdujący się w repozytorium harness Codex stosuje ten sam podział:
mostkowane narzędzia OpenClaw są opakowywane
(`extensions/codex/src/app-server/dynamic-tools.ts`), a własne natywne
rodzaje zatwierdzeń serwera codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) są kierowane przez
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Odpowiednik w
Copilot SDK — domyślnie odrzucająca `rejectAllPolicy` dla każdego rodzaju
innego niż `custom-tool`, który kiedykolwiek trafi do
`onPermissionRequest` — stanowi tę samą siatkę bezpieczeństwa i w praktyce
nigdy nie jest uruchamiany, ponieważ `overridesBuiltInTool: true` zastępuje
każde wbudowane narzędzie.

Aby warstwa opakowanych narzędzi mogła podejmować decyzje dotyczące zasad
równoważne z PI, harness przekazuje pełny kontekst narzędzi próby PI do
`createOpenClawCodingTools`: tożsamość (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kanał i trasowanie (`groupId`,
`currentChannelId`, `replyToMode`, przełączniki narzędzi wiadomości),
uwierzytelnianie (`authProfileStore`), tożsamość uruchomienia (`sessionKey` /
`runSessionKey` wyprowadzone z `sandboxSessionKey`, `runId`), kontekst modelu
(`modelApi`, `modelContextWindowTokens`, `modelCompat`, `modelHasVision`) oraz
hooki uruchomienia (`onToolOutcome`, `onYield`). Bez tych pól listy dozwolonych
narzędzi przeznaczone wyłącznie dla właściciela domyślnie po cichu odmawiają
dostępu, zasady zaufania pluginów nie mogą zostać rozstrzygnięte we właściwym
zakresie, a `session_status: "current"` wskazuje nieaktualny klucz sandboxa.
Konstruktor mostu znajduje się w `extensions/copilot/src/tool-bridge.ts` i
odzwierciedla autorytatywne wywołanie PI w
`src/agents/embedded-agent-runner/run/attempt.ts:1262`. `runAttempt`
rozstrzyga kontekst sandboxa przez współdzielony punkt integracji
`resolveSandboxContext`, przekazuje SDK efektywny katalog roboczy oraz
przekazuje `sandbox` wraz z przestrzenią roboczą uruchamiania podagentów do
mostu narzędzi. Most przekazuje również ograniczone mechanizmy sterowania
tworzeniem narzędzi, które może egzekwować na granicy SDK:
`includeCoreTools`, listę dozwolonych narzędzi środowiska uruchomieniowego
oraz `toolConstructionPlan`.

Most korzysta również ze współdzielonego helpera powierzchni narzędzi
harnessu z `openclaw/plugin-sdk/agent-harness-tool-runtime`, aby zachować
zgodność z PI. Gdy wyszukiwanie narzędzi jest włączone, SDK widzi kompaktowe
narzędzia sterujące oraz ukryty moduł wykonawczy katalogu zamiast wszystkich
schematów narzędzi OpenClaw. Gdy tryb kodu jest włączony, helper tworzy tę
samą powierzchnię sterującą trybu kodu i ten sam cykl życia katalogu, których
używają inne harnessy agentów. Odchudzone ustawienia domyślne modeli lokalnych,
filtrowanie schematów zgodne ze środowiskiem uruchomieniowym, hydratacja
katalogów i czyszczenie katalogu pozostają we współdzielonym helperze, dzięki
czemu harnessy Copilot i środowiska zbliżone do Codex nie rozchodzą się
funkcjonalnie.

### Token GitHub na poziomie sesji

Kontrakt Copilot SDK rozróżnia token GitHub **na poziomie klienta**
(`CopilotClientOptions.gitHubToken`, uwierzytelniający sam proces CLI) od
tokenu **na poziomie sesji** (`SessionConfig.gitHubToken`, który określa
wykluczanie treści, trasowanie modeli i limit dla tej sesji oraz jest
uwzględniany zarówno przez `createSession`, jak i `resumeSession`). Harness
jednorazowo rozstrzyga uwierzytelnianie za pomocą `resolveCopilotAuth` i
ustawia oba pola, gdy trybem uwierzytelniania jest `gitHubToken` (jawne
`auth.gitHubToken` lub rozstrzygnięty przez kontrakt `resolvedApiKey` ze
skonfigurowanego profilu uwierzytelniania `github-copilot`). Gdy
rozstrzygniętym trybem jest `useLoggedInUser`, pole na poziomie sesji jest
pomijane, aby SDK nadal wyprowadzał tożsamość z tożsamości zalogowanego
użytkownika.

`ask_user` korzysta z `SessionConfig.onUserInputRequest`. Most akceptuje
indeksy lub etykiety opcji dla żądań ze stałym wyborem, akceptuje odpowiedzi
w dowolnej formie, gdy żądanie SDK na to pozwala, oraz anuluje oczekujące
żądanie, gdy próba OpenClaw zostanie przerwana.

## Powiązane materiały

- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Harness Codex](/pl/plugins/codex-harness)
- [Pluginy harnessu agentów (dokumentacja SDK)](/pl/plugins/sdk-agent-harness)
