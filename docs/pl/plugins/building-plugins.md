---
doc-schema-version: 1
read_when:
    - Chcesz utworzyć nowy plugin OpenClaw
    - Potrzebujesz przewodnika szybkiego startu do tworzenia pluginów
    - Wybierasz między dokumentacją kanału, dostawcy, zaplecza CLI, narzędzia lub haka
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-07-16T18:48:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw bez zmieniania rdzenia. Plugin może dodać kanał
komunikacyjny, dostawcę modelu, lokalny backend CLI, narzędzie agenta, hook, dostawcę multimediów
lub inną funkcję należącą do pluginu.

Nie trzeba dodawać zewnętrznego pluginu do repozytorium OpenClaw. Należy opublikować
pakiet w [ClawHub](/clawhub), a użytkownicy zainstalują go za pomocą:

```bash
openclaw plugins install clawhub:<package-name>
```

Podczas przejścia związanego z uruchomieniem specyfikacje pakietów bez prefiksu nadal są instalowane z npm. Należy użyć
prefiksu `clawhub:`, aby skorzystać z rozwiązywania przez ClawHub.

## Wymagania

- Node 22.22.3+, Node 24.15+ lub Node 25.9+ oraz `npm` albo `pnpm`.
- Moduły TypeScript ESM.
- W przypadku pracy nad dołączonym do repozytorium pluginem należy sklonować repozytorium i uruchomić `pnpm install`.
  Rozwój pluginów w kopii kodu źródłowego wymaga wyłącznie pnpm, ponieważ OpenClaw wykrywa
  dołączone pluginy w pakietach przestrzeni roboczej `extensions/*`.

## Wybór postaci pluginu

<CardGroup cols={2}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Łączy OpenClaw z platformą komunikacyjną.
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaje dostawcę modelu, multimediów, wyszukiwania, pobierania, mowy lub komunikacji w czasie rzeczywistym.
  </Card>
  <Card title="Plugin backendu CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Uruchamia lokalne CLI AI za pośrednictwem mechanizmu modelu zapasowego OpenClaw.
  </Card>
  <Card title="Plugin narzędzi" icon="wrench" href="/pl/plugins/tool-plugins">
    Rejestruje narzędzia agenta.
  </Card>
</CardGroup>

## Szybki start

Minimalny plugin narzędzi można utworzyć, rejestrując jedno wymagane narzędzie agenta. Jest to
najkrótsza użyteczna postać pluginu, obejmująca pakiet, manifest, punkt wejścia i
lokalną weryfikację.

<Steps>
  <Step title="Utworzenie metadanych pakietu">
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

    Opublikowane zewnętrzne pluginy powinny wskazywać jako wpisy środowiska uruchomieniowego skompilowane pliki
    JavaScript. Pełny kontrakt punktu wejścia opisano w sekcji [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints).

    Każdy plugin wymaga manifestu, nawet jeśli nie ma konfiguracji. Narzędzia środowiska uruchomieniowego muszą
    znajdować się w `contracts.tools`, aby OpenClaw mógł wykryć ich właściciela bez
    zachłannego ładowania środowiska uruchomieniowego każdego pluginu. Wartość `activation.onStartup` należy ustawić
    świadomie; ten przykład ładuje się podczas uruchamiania Gateway.

    Powierzchnie pluginów zaufane przez hosta również podlegają kontroli manifestu i wymagają jawnej
    deklaracji w przypadku zainstalowanych pluginów: `api.registerAgentToolResultMiddleware(...)`
    wymaga umieszczenia każdego docelowego środowiska uruchomieniowego w `contracts.agentToolResultMiddleware`,
    a `api.registerTrustedToolPolicy(...)` wymaga każdego identyfikatora zasad w
    `contracts.trustedToolPolicies`. Deklaracje te zapewniają zgodność między kontrolą
    podczas instalacji a rejestracją w środowisku uruchomieniowym.

    Wszystkie pola manifestu opisano w sekcji [Manifest pluginu](/pl/plugins/manifest).

  </Step>

  <Step title="Rejestracja narzędzia">
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

    W przypadku pluginów innych niż kanałowe należy użyć `definePluginEntry`. Pluginy kanałowe używają
    zamiast tego `defineChannelPluginEntry` z `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Testowanie środowiska uruchomieniowego">
    W przypadku zainstalowanego lub zewnętrznego pluginu należy sprawdzić załadowane środowisko uruchomieniowe:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jeśli plugin rejestruje polecenie CLI, należy również je uruchomić i potwierdzić
    wynik, na przykład `openclaw demo-plugin ping`.

    W przypadku pluginu dołączonego do tego repozytorium OpenClaw wykrywa pakiety pluginów
    w kopii kodu źródłowego w przestrzeni roboczej `extensions/*`. Należy uruchomić najbliższy test ukierunkowany:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Testowanie instalacji pakietu">
    Przed opublikowaniem pluginu gotowego do spakowania należy przetestować tę samą postać instalacji, którą otrzymają
    użytkownicy. Najpierw należy dodać etap kompilacji, skierować wpisy środowiska uruchomieniowego, takie jak
    `openclaw.extensions`, na skompilowany JavaScript, na przykład `./dist/index.js`, i upewnić się,
    że `npm pack` zawiera wynik `dist/`. Wpisy źródłowe TypeScript są
    przeznaczone wyłącznie dla kopii kodu źródłowego i lokalnych ścieżek programistycznych.

    Następnie należy spakować plugin i zainstalować archiwum tar za pomocą `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` używa zarządzanego przez OpenClaw projektu npm dla każdego pluginu, dzięki czemu wykrywa
    błędy zależności środowiska uruchomieniowego, które testowanie kopii kodu źródłowego może ukryć. Potwierdza
    postać pakietu i zależności, a nie oficjalny status zaufania powiązany z katalogiem.
    Importy środowiska uruchomieniowego muszą znajdować się w `dependencies` lub `optionalDependencies`;
    zależności pozostawione wyłącznie w `devDependencies` nie zostaną zainstalowane w
    zarządzanym projekcie środowiska uruchomieniowego.

    Nie należy używać instalacji z surowego archiwum ani ścieżki jako ostatecznego potwierdzenia oficjalnego lub
    uprzywilejowanego działania pluginu. Surowe źródła są przydatne podczas lokalnego debugowania, ale
    nie potwierdzają tej samej ścieżki zależności co instalacje z npm lub ClawHub. Jeśli
    plugin korzysta z zaufanego statusu oficjalnego pluginu, należy dodać drugą weryfikację
    za pomocą oficjalnej instalacji wspieranej przez katalog lub ścieżki opublikowanego pakietu, która
    rejestruje oficjalny status zaufania. Szczegóły dotyczące katalogu głównego instalacji i własności zależności
    opisano w sekcji [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution).

  </Step>

  <Step title="Publikowanie">
    Przed publikacją należy zweryfikować pakiet:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanoniczne fragmenty pakietów ClawHub znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalacja">
    Opublikowany pakiet należy zainstalować za pośrednictwem ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Rejestrowanie narzędzi

Narzędzia mogą być wymagane lub opcjonalne. Wymagane narzędzia są zawsze dostępne, gdy
plugin jest włączony. Opcjonalne narzędzia wymagają jawnej zgody użytkownika, zanim OpenClaw
załaduje środowisko uruchomieniowe pluginu będącego ich właścicielem.

Fabryki narzędzi otrzymują zaufany kontekst środowiska uruchomieniowego, w tym `deliveryContext`,
`nativeChannelId` dla aktywnej konwersacji na platformie, jeśli jest dostępna, oraz
`requesterSenderId`.

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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Narzędzia opcjonalne określają, czy narzędzie jest udostępniane modelowi. Należy użyć
[żądań uprawnień pluginu](/pl/plugins/plugin-permission-requests), gdy narzędzie
lub hook powinien poprosić o zatwierdzenie po wybraniu go przez model, ale przed
wykonaniem działania.

Narzędzi opcjonalnych należy używać w przypadku skutków ubocznych, nietypowych plików binarnych lub funkcji, które
nie powinny być domyślnie udostępniane. Nazwy narzędzi nie mogą kolidować z nazwami narzędzi
rdzenia; konflikty są pomijane i zgłaszane w diagnostyce pluginów. Nieprawidłowe
rejestracje są pomijane i zgłaszane w ten sam sposób: brak niepustej wartości
`name`, wartość `execute`, która nie jest funkcją, lub deskryptor narzędzia bez obiektu `parameters`.

Fabryki narzędzi otrzymują obiekt kontekstu dostarczany przez środowisko uruchomieniowe. Należy użyć `ctx.activeModel`,
gdy narzędzie musi rejestrować, wyświetlać lub dostosowywać się do aktywnego modelu dla bieżącej
tury; może on zawierać `provider`, `modelId` i `modelRef`. Należy traktować go jako
informacyjne metadane środowiska uruchomieniowego, a nie granicę bezpieczeństwa chroniącą przed lokalnym
operatorem, kodem zainstalowanego pluginu lub zmodyfikowanym środowiskiem uruchomieniowym OpenClaw. Wrażliwe
narzędzia lokalne powinny nadal wymagać jawnego włączenia przez plugin lub operatora i
odmawiać działania, gdy metadane aktywnego modelu są niedostępne lub nieodpowiednie.

Manifest deklaruje własność i wykrywanie; wykonanie nadal wywołuje aktywną
zarejestrowaną implementację narzędzia. Należy zachować zgodność `toolMetadata.<tool>.optional: true`
z `api.registerTool(..., { optional: true })`, aby OpenClaw mógł uniknąć
ładowania środowiska uruchomieniowego tego pluginu, dopóki narzędzie nie zostanie jawnie dodane do listy dozwolonych.

## Konwencje importowania

Należy importować z wyspecjalizowanych podścieżek SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Nie należy importować z przestarzałego głównego pliku zbiorczego:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

W pakiecie pluginu należy używać lokalnych plików zbiorczych, takich jak `api.ts` i
`runtime-api.ts`, do importów wewnętrznych. Nie należy importować własnego pluginu za pośrednictwem
ścieżki SDK. Pomocnicze funkcje specyficzne dla dostawcy powinny pozostać w jego pakiecie, chyba że
punkt integracji jest rzeczywiście ogólny.

Niestandardowe metody RPC Gateway są zaawansowanym punktem wejścia. Należy umieścić je pod
prefiksem właściwym dla pluginu; administracyjne przestrzenie nazw rdzenia, takie jak `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` i `update.*`, pozostają zastrzeżone
i są rozwiązywane do `operator.admin`. Most
`openclaw/plugin-sdk/gateway-method-runtime` jest zastrzeżony dla tras HTTP pluginu,
które deklarują `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pełną mapę importów zawiera [Omówienie SDK pluginów](/pl/plugins/sdk-overview).

## Lista kontrolna przed przesłaniem

<Check>Plik **package.json** zawiera prawidłowe metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają wyspecjalizowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie importów własnych przez SDK</Check>
<Check>Testy przechodzą pomyślnie (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi pomyślnie (pluginy w repozytorium)</Check>

## Testowanie z wersjami beta

1. Obserwuj wydania [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Tagi beta wyglądają tak: `v2026.3.N-beta.1`. Można też obserwować [@openclaw](https://x.com/openclaw) na platformie X, aby otrzymywać informacje o wydaniach.
2. Przetestuj swój plugin z tagiem beta, gdy tylko się pojawi. Okres przed wydaniem stabilnym trwa zazwyczaj tylko kilka godzin.
3. Po przetestowaniu opublikuj wpis w wątku swojego pluginu na kanale Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), podając `all good` lub opisując, co przestało działać. Jeśli wątek jeszcze nie istnieje, utwórz go.
4. Jeśli coś przestanie działać, utwórz lub zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Dodaj link do zgłoszenia w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i dodaj link do zgłoszenia zarówno w PR, jak i w swoim wątku na Discordzie. Współtwórcy nie mogą dodawać etykiet do PR-ów, dlatego tytuł jest sygnałem po stronie PR dla opiekunów i automatyzacji. Blokery z PR-em zostaną scalone; blokery bez niego mogą mimo to trafić do wydania.
6. Brak wiadomości oznacza, że wszystko działa. Przeoczenie tego okresu zwykle oznacza, że poprawka trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Utwórz plugin kanału wiadomości
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Utwórz plugin dostawcy modelu
  </Card>
  <Card title="Pluginy zaplecza CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Zarejestruj lokalne zaplecze CLI AI
  </Card>
  <Card title="Omówienie SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Dokumentacja mapy importów i interfejsu API rejestracji
  </Card>
  <Card title="Pomocnicze funkcje środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie i podagent za pośrednictwem api.runtime
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
