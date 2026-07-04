---
doc-schema-version: 1
read_when:
    - Chcesz utworzyć nową wtyczkę OpenClaw
    - Potrzebujesz krótkiego przewodnika wprowadzającego do tworzenia Pluginów
    - Wybierasz między dokumentacją kanału, dostawcy, backendu CLI, narzędzia lub hooka
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-07-04T15:38:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw bez zmieniania rdzenia. Plugin może dodać kanał
wiadomości, dostawcę modelu, lokalny backend CLI, narzędzie agenta, hook,
dostawcę mediów albo inną funkcję należącą do pluginu.

Nie musisz dodawać zewnętrznego pluginu do repozytorium OpenClaw. Opublikuj
pakiet w [ClawHub](/pl/clawhub), a użytkownicy zainstalują go za pomocą:

```bash
openclaw plugins install clawhub:<package-name>
```

Gołe specyfikacje pakietów nadal instalują z npm podczas przełączenia
uruchomieniowego. Użyj prefiksu `clawhub:`, gdy chcesz rozwiązywania przez
ClawHub.

## Wymagania

- Użyj Node 22.19+, Node 23.11+ albo Node 24+ oraz menedżera pakietów, takiego jak `npm` lub `pnpm`.
- Znajomość modułów TypeScript ESM.
- Przy pracy nad wbudowanym pluginem w repozytorium sklonuj repozytorium i uruchom `pnpm install`.
  Tworzenie pluginów w checkoutcie źródłowym obsługuje wyłącznie pnpm, ponieważ OpenClaw ładuje wbudowane
  pluginy z pakietów workspace `extensions/*`.

## Wybierz kształt pluginu

<CardGroup cols={2}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą wiadomości.
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modelu, mediów, wyszukiwania, pobierania, mowy albo czasu rzeczywistego.
  </Card>
  <Card title="Plugin backendu CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Uruchamiaj lokalne AI CLI przez fallback modelu OpenClaw.
  </Card>
  <Card title="Plugin narzędziowy" icon="wrench" href="/pl/plugins/tool-plugins">
    Zarejestruj narzędzia agenta.
  </Card>
</CardGroup>

## Szybki start

Zbuduj minimalny plugin narzędziowy, rejestrując jedno wymagane narzędzie agenta. To
najkrótszy użyteczny kształt pluginu i pokazuje pakiet, manifest, punkt wejścia oraz
lokalny dowód.

<Steps>
  <Step title="Utwórz metadane pakietu">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Opublikowane zewnętrzne pluginy powinny wskazywać wpisy runtime na zbudowane pliki
    JavaScript. Zobacz [punkty wejścia SDK](/pl/plugins/sdk-entrypoints), aby poznać pełny kontrakt
    punktu wejścia.

    Każdy plugin potrzebuje manifestu, nawet gdy nie ma konfiguracji. Narzędzia runtime
    muszą znajdować się w `contracts.tools`, aby OpenClaw mógł wykryć własność bez
    zachłannego ładowania każdego runtime pluginu. Ustaw `activation.onStartup`
    celowo. Ten przykład uruchamia się przy starcie Gateway.

    Powierzchnie pluginów zaufane przez hosta są także bramkowane manifestem i wymagają jawnego
    włączenia dla zainstalowanych pluginów. Jeśli zainstalowany plugin rejestruje
    `api.registerAgentToolResultMiddleware(...)`, zadeklaruj każdy docelowy runtime w
    `contracts.agentToolResultMiddleware`. Jeśli rejestruje
    `api.registerTrustedToolPolicy(...)`, zadeklaruj każdy identyfikator polityki w
    `contracts.trustedToolPolicies`. Te deklaracje utrzymują zgodność kontroli podczas instalacji
    z rejestracją runtime.

    Każde pole manifestu opisuje [manifest Pluginu](/pl/plugins/manifest).

  </Step>

  <Step title="Zarejestruj narzędzie">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Użyj `definePluginEntry` dla pluginów niebędących kanałami. Pluginy kanałów używają
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Przetestuj runtime">
    Dla zainstalowanego lub zewnętrznego pluginu sprawdź załadowany runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jeśli plugin rejestruje polecenie CLI, uruchom również to polecenie. Na przykład
    polecenie demonstracyjne powinno mieć dowód wykonania, taki jak
    `openclaw demo-plugin ping`.

    Dla wbudowanego pluginu w tym repozytorium OpenClaw wykrywa pakiety pluginów
    w checkoutcie źródłowym z workspace `extensions/*`. Uruchom najbliższy test docelowy:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Przetestuj instalację pakietu">
    Przed opublikowaniem pluginu gotowego jako pakiet przetestuj ten sam kształt instalacji, który
    otrzymają użytkownicy. Najpierw dodaj krok budowania, wskaż wpisy runtime, takie jak
    `openclaw.extensions`, na zbudowany JavaScript, np. `./dist/index.js`, i upewnij się,
    że `npm pack` obejmuje wynik `dist/`. Wpisy źródłowe TypeScript są
    tylko dla checkoutów źródłowych i lokalnych ścieżek programistycznych.

    Następnie spakuj plugin i zainstaluj tarball za pomocą `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` używa zarządzanego przez OpenClaw projektu npm przypisanego do pluginu, więc wychwytuje
    błędy zależności runtime, które testowanie checkoutu źródłowego może ukryć. Dowodzi
    kształtu pakietu i zależności, a nie oficjalnego zaufania powiązanego z katalogiem.
    Importy runtime muszą znajdować się w `dependencies` albo `optionalDependencies`;
    zależności pozostawione tylko w `devDependencies` nie zostaną zainstalowane dla
    zarządzanego projektu runtime.

    Nie używaj surowej instalacji archiwum/ścieżki jako końcowego dowodu dla oficjalnego lub
    uprzywilejowanego zachowania pluginu. Surowe źródła są przydatne do lokalnego debugowania, ale
    nie dowodzą tej samej ścieżki zależności co instalacje npm albo ClawHub. Jeśli
    Twój plugin polega na statusie zaufanego oficjalnego pluginu, dodaj drugi dowód
    przez oficjalną instalację opartą na katalogu albo opublikowaną ścieżkę pakietu, która
    zapisuje oficjalne zaufanie. Zobacz
    [rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution), aby poznać
    szczegóły katalogu głównego instalacji i własności zależności.

  </Step>

  <Step title="Opublikuj">
    Zweryfikuj pakiet przed opublikowaniem:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanoniczne fragmenty ClawHub znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Zainstaluj">
    Zainstaluj opublikowany pakiet przez ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Rejestrowanie narzędzi

Narzędzia mogą być wymagane albo opcjonalne. Wymagane narzędzia są zawsze dostępne, gdy
plugin jest włączony. Opcjonalne narzędzia wymagają zgody użytkownika.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Każde narzędzie zarejestrowane za pomocą `api.registerTool(...)` musi być również zadeklarowane w
manifeście pluginu:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Użytkownicy włączają je za pomocą `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Opcjonalne narzędzia kontrolują, czy narzędzie jest udostępniane modelowi. Użyj
[żądań uprawnień pluginu](/pl/plugins/plugin-permission-requests), gdy narzędzie
lub hook powinny poprosić o zatwierdzenie po tym, jak model je wybierze, a przed
uruchomieniem akcji.

Używaj narzędzi opcjonalnych do skutków ubocznych, nietypowych binariów albo funkcji, które
nie powinny być domyślnie udostępniane. Nazwy narzędzi nie mogą kolidować z narzędziami rdzenia;
konflikty są pomijane i zgłaszane w diagnostyce pluginów. Nieprawidłowo sformułowane
rejestracje, w tym deskryptory narzędzi bez `parameters`, są pomijane i
zgłaszane w ten sam sposób. Zarejestrowane narzędzia to typowane funkcje, które model może wywołać
po przejściu kontroli polityki i allowlisty.

Fabryki narzędzi otrzymują obiekt kontekstu dostarczony przez runtime. Użyj `ctx.activeModel`,
gdy narzędzie musi logować, wyświetlać albo dostosowywać się do aktywnego modelu dla bieżącej
tury. Obiekt może zawierać `provider`, `modelId` i `modelRef`. Traktuj go jako
informacyjne metadane runtime, a nie jako granicę bezpieczeństwa wobec lokalnego
operatora, kodu zainstalowanego pluginu albo zmodyfikowanego runtime OpenClaw. Wrażliwe narzędzia lokalne
nadal powinny wymagać jawnej zgody pluginu albo operatora i domyślnie odmawiać działania,
gdy metadane aktywnego modelu są brakujące albo nieodpowiednie.

Manifest deklaruje własność i wykrywanie; wykonanie nadal wywołuje działającą
zarejestrowaną implementację narzędzia. Utrzymuj `toolMetadata.<tool>.optional: true`
w zgodzie z `api.registerTool(..., { optional: true })`, aby OpenClaw mógł uniknąć
ładowania runtime tego pluginu, dopóki narzędzie nie zostanie jawnie dodane do allowlisty.

## Konwencje importu

Importuj z ukierunkowanych podścieżek SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Nie importuj z przestarzałego głównego barrela:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

W pakiecie pluginu używaj lokalnych plików barrel, takich jak `api.ts` i
`runtime-api.ts`, do importów wewnętrznych. Nie importuj własnego pluginu przez
ścieżkę SDK. Helpery specyficzne dla dostawcy powinny pozostać w pakiecie dostawcy, chyba że
granica jest naprawdę generyczna.

Niestandardowe metody RPC Gateway to zaawansowany punkt wejścia. Utrzymuj je pod
prefiksem specyficznym dla pluginu; przestrzenie nazw administracji rdzenia, takie jak `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` i `update.*`, pozostają zarezerwowane
i rozwiązują się do `operator.admin`. Most
`openclaw/plugin-sdk/gateway-method-runtime` jest zarezerwowany dla tras HTTP pluginu,
które deklarują `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pełną mapę importów znajdziesz w [omówieniu SDK pluginów](/pl/plugins/sdk-overview).

## Lista kontrolna przed przesłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i poprawny</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają ukierunkowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie względem wydań beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj je przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin względem taga beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego pluginu na kanale Discord `plugin-forum`: `all good` albo opisz, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do zgłoszenia w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj zgłoszenie zarówno w PR, jak i w swoim wątku na Discord. Współautorzy nie mogą nadawać PR etykiet, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są scalane; blokery bez PR mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału wiadomości
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modeli
  </Card>
  <Card title="Pluginy backendu CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Zarejestruj lokalny backend CLI AI
  </Card>
  <Card title="Omówienie SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Pomocniki środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Hooki pluginów](/pl/plugins/hooks)
- [Architektura pluginów](/pl/plugins/architecture)
