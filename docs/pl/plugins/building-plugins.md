---
doc-schema-version: 1
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz przewodnika szybkiego startu do tworzenia Pluginów
    - Wybierasz między dokumentacją kanału, providera, backendu CLI, narzędzia lub hooka
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-06-27T17:49:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw bez zmieniania rdzenia. Plugin może dodać kanał
wiadomości, dostawcę modelu, lokalny backend CLI, narzędzie agenta, hook, dostawcę
mediów albo inną funkcję należącą do pluginu.

Nie musisz dodawać zewnętrznego pluginu do repozytorium OpenClaw. Opublikuj
pakiet w [ClawHub](/pl/clawhub), a użytkownicy zainstalują go poleceniem:

```bash
openclaw plugins install clawhub:<package-name>
```

Gołe specyfikacje pakietów nadal instalują z npm podczas przejścia startowego. Użyj
prefiksu `clawhub:`, gdy chcesz rozwiązywania przez ClawHub.

## Wymagania

- Użyj Node 22.19 lub nowszego oraz menedżera pakietów takiego jak `npm` albo `pnpm`.
- Znajomość modułów TypeScript ESM.
- Do pracy nad wbudowanym pluginem w repozytorium sklonuj repozytorium i uruchom `pnpm install`.
  Tworzenie pluginów z checkoutu źródłowego działa tylko z pnpm, ponieważ OpenClaw ładuje wbudowane
  pluginy z pakietów obszaru roboczego `extensions/*`.

## Wybierz kształt pluginu

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą wiadomości.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modelu, mediów, wyszukiwania, pobierania, mowy albo czasu rzeczywistego.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Uruchamiaj lokalne AI CLI przez fallback modelu OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/pl/plugins/tool-plugins">
    Zarejestruj narzędzia agenta.
  </Card>
</CardGroup>

## Szybki start

Zbuduj minimalny plugin narzędziowy, rejestrując jedno wymagane narzędzie agenta. To
najkrótszy użyteczny kształt pluginu i pokazuje pakiet, manifest, punkt wejścia oraz
lokalne potwierdzenie działania.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
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

    Opublikowane pluginy zewnętrzne powinny kierować wpisy runtime na zbudowane pliki JavaScript.
    Zobacz [punkty wejścia SDK](/pl/plugins/sdk-entrypoints), aby poznać pełny kontrakt punktu
    wejścia.

    Każdy plugin potrzebuje manifestu, nawet gdy nie ma konfiguracji. Narzędzia runtime
    muszą znajdować się w `contracts.tools`, aby OpenClaw mógł odkrywać własność bez
    zachłannego ładowania każdego runtime pluginu. Ustaw `activation.onStartup`
    świadomie. Ten przykład startuje podczas uruchamiania Gateway.

    Powierzchnie pluginów zaufane przez hosta także są bramkowane manifestem i wymagają jawnego
    włączenia dla zainstalowanych pluginów. Jeśli zainstalowany plugin rejestruje
    `api.registerAgentToolResultMiddleware(...)`, zadeklaruj każdy docelowy runtime w
    `contracts.agentToolResultMiddleware`. Jeśli rejestruje
    `api.registerTrustedToolPolicy(...)`, zadeklaruj każdy identyfikator polityki w
    `contracts.trustedToolPolicies`. Te deklaracje utrzymują inspekcję podczas instalacji
    i rejestrację runtime w zgodności.

    Każde pole manifestu opisuje [manifest Plugin](/pl/plugins/manifest).

  </Step>

  <Step title="Register the tool">
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

    Użyj `definePluginEntry` dla pluginów innych niż kanałowe. Pluginy kanałowe używają
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Dla zainstalowanego albo zewnętrznego pluginu sprawdź załadowany runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jeśli plugin rejestruje polecenie CLI, uruchom także to polecenie. Na przykład
    polecenie demonstracyjne powinno mieć potwierdzenie wykonania takie jak
    `openclaw demo-plugin ping`.

    Dla wbudowanego pluginu w tym repozytorium OpenClaw odkrywa pakiety pluginów z checkoutu
    źródłowego w obszarze roboczym `extensions/*`. Uruchom najbliższy celowany
    test:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Zweryfikuj pakiet przed publikacją:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanoniczne fragmenty ClawHub znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Zainstaluj opublikowany pakiet przez ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Rejestrowanie narzędzi

Narzędzia mogą być wymagane albo opcjonalne. Wymagane narzędzia są zawsze dostępne, gdy
plugin jest włączony. Narzędzia opcjonalne wymagają zgody użytkownika.

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

Każde narzędzie zarejestrowane przez `api.registerTool(...)` musi być także zadeklarowane w
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

Użytkownicy włączają je przez `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Narzędzia opcjonalne kontrolują, czy narzędzie jest udostępniane modelowi. Użyj
[żądań uprawnień pluginu](/pl/plugins/plugin-permission-requests), gdy narzędzie
albo hook ma poprosić o zatwierdzenie po wybraniu go przez model i przed
uruchomieniem akcji.

Używaj narzędzi opcjonalnych dla efektów ubocznych, nietypowych plików binarnych albo funkcji,
które nie powinny być domyślnie udostępniane. Nazwy narzędzi nie mogą kolidować z narzędziami rdzenia;
konflikty są pomijane i raportowane w diagnostyce pluginów. Nieprawidłowe
rejestracje, w tym deskryptory narzędzi bez `parameters`, są pomijane i
raportowane w ten sam sposób. Zarejestrowane narzędzia są typowanymi funkcjami, które model może wywołać
po przejściu kontroli polityk i listy dozwolonych.

Fabryki narzędzi otrzymują obiekt kontekstu dostarczany przez runtime. Użyj `ctx.activeModel`,
gdy narzędzie musi logować, wyświetlać albo dostosowywać się do aktywnego modelu w bieżącej
turze. Obiekt może zawierać `provider`, `modelId` i `modelRef`. Traktuj go jako
informacyjne metadane runtime, a nie jako granicę bezpieczeństwa przed lokalnym
operatorem, zainstalowanym kodem pluginu albo zmodyfikowanym runtime OpenClaw. Wrażliwe lokalne
narzędzia powinny nadal wymagać jawnego włączenia przez plugin albo operatora i zamykać się bezpiecznie,
gdy metadane aktywnego modelu są brakujące albo nieodpowiednie.

Manifest deklaruje własność i odkrywanie; wykonanie nadal wywołuje aktywną
zarejestrowaną implementację narzędzia. Utrzymuj `toolMetadata.<tool>.optional: true`
w zgodzie z `api.registerTool(..., { optional: true })`, aby OpenClaw mógł uniknąć
ładowania runtime tego pluginu, dopóki narzędzie nie zostanie jawnie dodane do listy dozwolonych.

## Konwencje importów

Importuj z wyspecjalizowanych podścieżek SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Nie importuj z przestarzałego głównego barrela:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

W pakiecie pluginu używaj lokalnych plików barrela, takich jak `api.ts` i
`runtime-api.ts`, do importów wewnętrznych. Nie importuj własnego pluginu przez
ścieżkę SDK. Pomocnicy specyficzni dla dostawcy powinni pozostać w pakiecie dostawcy, chyba że
granica jest naprawdę ogólna.

Niestandardowe metody RPC Gateway są zaawansowanym punktem wejścia. Trzymaj je z
prefiksem specyficznym dla pluginu; przestrzenie nazw administracyjnych rdzenia, takie jak `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` i `update.*`, pozostają zarezerwowane
i rozwiązywane do `operator.admin`. Most
`openclaw/plugin-sdk/gateway-method-runtime` jest zarezerwowany dla tras HTTP pluginu,
które deklarują `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pełną mapę importów znajdziesz w [omówieniu Plugin SDK](/pl/plugins/sdk-overview).

## Lista kontrolna przed wysłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** istnieje i jest poprawny</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają wyspecjalizowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie z wydaniami beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj plugin z tagiem beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego pluginu na kanale Discord `plugin-forum`: albo `all good`, albo co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się psuje, otwórz albo zaktualizuj issue zatytułowane `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj issue zarówno w PR, jak i w swoim wątku Discord. Kontrybutorzy nie mogą etykietować PR-ów, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR zostaną scalone; blokery bez PR mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, poprawka prawdopodobnie trafi w następnym cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału wiadomości
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modelu
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Zarejestruj lokalny backend AI CLI
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowania
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Hooki pluginów](/pl/plugins/hooks)
- [Architektura pluginów](/pl/plugins/architecture)
