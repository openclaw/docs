---
doc-schema-version: 1
read_when:
    - Chcesz utworzyć nowy plugin OpenClaw
    - Potrzebujesz przewodnika szybkiego startu do tworzenia pluginów
    - Wybierasz między dokumentacją kanału, dostawcy, backendu CLI, narzędzia lub haka
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-07-12T15:18:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw bez zmieniania rdzenia. Plugin może dodać kanał
komunikacyjny, dostawcę modeli, lokalny backend CLI, narzędzie agenta, hook,
dostawcę multimediów lub inną funkcję należącą do pluginu.

Nie trzeba dodawać zewnętrznego pluginu do repozytorium OpenClaw. Opublikuj
pakiet w [ClawHub](/clawhub), a użytkownicy zainstalują go za pomocą:

```bash
openclaw plugins install clawhub:<package-name>
```

Podczas przejścia na nowy sposób uruchamiania specyfikacje pakietów bez prefiksu
są nadal instalowane z npm. Użyj prefiksu `clawhub:`, jeśli chcesz korzystać
z mechanizmu rozpoznawania ClawHub.

## Wymagania

- Node 22.19+, Node 23.11+ lub Node 24+ oraz `npm` lub `pnpm`.
- Moduły ESM w TypeScript.
- W przypadku pracy nad pluginem dołączonym do repozytorium sklonuj je i uruchom
  `pnpm install`. Tworzenie pluginów z kopii kodu źródłowego wymaga pnpm,
  ponieważ OpenClaw wykrywa dołączone pluginy w pakietach przestrzeni roboczej
  `extensions/*`.

## Wybierz typ pluginu

<CardGroup cols={2}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną.
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modeli, multimediów, wyszukiwania, pobierania, mowy lub komunikacji w czasie rzeczywistym.
  </Card>
  <Card title="Plugin backendu CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Uruchamiaj lokalne CLI AI za pośrednictwem mechanizmu rezerwowego modeli OpenClaw.
  </Card>
  <Card title="Plugin narzędziowy" icon="wrench" href="/pl/plugins/tool-plugins">
    Rejestruj narzędzia agenta.
  </Card>
</CardGroup>

## Szybki start

Utwórz minimalny plugin narzędziowy, rejestrując jedno wymagane narzędzie agenta.
Jest to najprostsza użyteczna postać pluginu, obejmująca pakiet, manifest, punkt
wejścia i lokalną weryfikację.

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

    Opublikowane pluginy zewnętrzne powinny kierować wpisy środowiska
    uruchomieniowego do skompilowanych plików JavaScript. Pełny kontrakt punktu
    wejścia opisano w sekcji [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints).

    Każdy plugin wymaga manifestu, nawet jeśli nie ma konfiguracji. Narzędzia
    środowiska uruchomieniowego muszą występować w `contracts.tools`, aby
    OpenClaw mógł wykrywać ich właściciela bez natychmiastowego ładowania
    środowiska uruchomieniowego każdego pluginu. Ustaw
    `activation.onStartup` świadomie; w tym przykładzie plugin jest ładowany
    podczas uruchamiania Gateway.

    Powierzchnie pluginów zaufane przez hosta również podlegają ograniczeniom
    manifestu i wymagają jawnych deklaracji w przypadku zainstalowanych
    pluginów: `api.registerAgentToolResultMiddleware(...)` wymaga umieszczenia
    każdego docelowego środowiska uruchomieniowego w
    `contracts.agentToolResultMiddleware`, a
    `api.registerTrustedToolPolicy(...)` wymaga umieszczenia każdego
    identyfikatora zasad w `contracts.trustedToolPolicies`. Deklaracje te
    zapewniają zgodność między inspekcją podczas instalacji a rejestracją
    w środowisku uruchomieniowym.

    Opis wszystkich pól manifestu znajduje się w sekcji
    [Manifest pluginu](/pl/plugins/manifest).

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

    W przypadku pluginów innych niż kanałowe używaj `definePluginEntry`.
    Pluginy kanałowe używają zamiast tego `defineChannelPluginEntry` z
    `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Przetestuj środowisko uruchomieniowe">
    W przypadku zainstalowanego lub zewnętrznego pluginu sprawdź załadowane
    środowisko uruchomieniowe:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jeśli plugin rejestruje polecenie CLI, uruchom je również i sprawdź dane
    wyjściowe, na przykład `openclaw demo-plugin ping`.

    W przypadku pluginu dołączonego do tego repozytorium OpenClaw wykrywa
    pakiety pluginów z kopii kodu źródłowego w przestrzeni roboczej
    `extensions/*`. Uruchom najlepiej dopasowany test:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Przetestuj instalację pakietu">
    Przed opublikowaniem pluginu gotowego do dystrybucji przetestuj dokładnie
    taki sposób instalacji, jaki otrzymają użytkownicy. Najpierw dodaj etap
    kompilacji, skieruj wpisy środowiska uruchomieniowego, takie jak
    `openclaw.extensions`, do skompilowanego kodu JavaScript, na przykład
    `./dist/index.js`, i upewnij się, że `npm pack` uwzględnia wynikowy katalog
    `dist/`. Punkty wejścia w kodzie źródłowym TypeScript służą wyłącznie do
    pracy z kopią kodu źródłowego i lokalnych ścieżek programistycznych.

    Następnie spakuj plugin i zainstaluj archiwum tar za pomocą `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` używa zarządzanego przez OpenClaw projektu npm osobnego dla
    każdego pluginu, dzięki czemu wykrywa błędy zależności środowiska
    uruchomieniowego, które mogą pozostać niewidoczne podczas testowania kopii
    kodu źródłowego. Potwierdza poprawność struktury pakietu i zależności, lecz
    nie oficjalny poziom zaufania wynikający z katalogu. Importy środowiska
    uruchomieniowego muszą znajdować się w `dependencies` lub
    `optionalDependencies`; zależności pozostawione wyłącznie w
    `devDependencies` nie zostaną zainstalowane w zarządzanym projekcie
    środowiska uruchomieniowego.

    Nie używaj instalacji bezpośrednio z archiwum lub ścieżki jako ostatecznego
    potwierdzenia działania oficjalnego albo uprzywilejowanego pluginu. Surowe
    źródła są przydatne do lokalnego debugowania, ale nie potwierdzają tej samej
    ścieżki zależności co instalacje z npm lub ClawHub. Jeśli plugin korzysta
    z zaufanego statusu oficjalnego pluginu, dodaj drugą weryfikację za pomocą
    oficjalnej instalacji opartej na katalogu lub ścieżki opublikowanego
    pakietu, która rejestruje oficjalny poziom zaufania. Szczegóły katalogu
    głównego instalacji i własności zależności opisano w sekcji
    [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution).

  </Step>

  <Step title="Opublikuj">
    Zweryfikuj pakiet przed opublikowaniem:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Kanoniczne fragmenty dotyczące pakietów ClawHub znajdują się w
    `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Zainstaluj">
    Zainstaluj opublikowany pakiet za pośrednictwem ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Rejestrowanie narzędzi

Narzędzia mogą być wymagane lub opcjonalne. Wymagane narzędzia są zawsze
dostępne, gdy plugin jest włączony. Opcjonalne narzędzia wymagają jawnej zgody
użytkownika, zanim OpenClaw załaduje środowisko uruchomieniowe pluginu będącego
ich właścicielem.

Fabryki narzędzi otrzymują zaufany kontekst środowiska uruchomieniowego,
obejmujący `deliveryContext`, `nativeChannelId` aktywnej rozmowy na platformie,
jeśli jest dostępny, oraz `requesterSenderId`.

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

Każde narzędzie zarejestrowane za pomocą `api.registerTool(...)` musi być
również zadeklarowane w manifeście pluginu:

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

Użytkownicy wyrażają zgodę za pomocą `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Narzędzia opcjonalne określają, czy narzędzie jest udostępniane modelowi. Użyj
[żądań uprawnień pluginu](/pl/plugins/plugin-permission-requests), gdy narzędzie lub
hook powinny poprosić o zatwierdzenie po wybraniu ich przez model, lecz przed
wykonaniem działania.

Używaj narzędzi opcjonalnych w przypadku efektów ubocznych, nietypowych plików
wykonywalnych lub funkcji, które nie powinny być domyślnie udostępniane. Nazwy
narzędzi nie mogą kolidować z nazwami narzędzi rdzenia; konflikty są pomijane
i zgłaszane w diagnostyce pluginu. Nieprawidłowe rejestracje są pomijane
i zgłaszane w ten sam sposób: brak niepustej wartości `name`, wartość `execute`
niebędąca funkcją lub deskryptor narzędzia bez obiektu `parameters`.

Fabryki narzędzi otrzymują obiekt kontekstu dostarczany przez środowisko
uruchomieniowe. Używaj `ctx.activeModel`, gdy narzędzie musi rejestrować,
wyświetlać lub dostosowywać się do aktywnego modelu w bieżącej turze; może on
zawierać `provider`, `modelId` i `modelRef`. Traktuj go jako informacyjne
metadane środowiska uruchomieniowego, a nie jako granicę bezpieczeństwa wobec
lokalnego operatora, kodu zainstalowanych pluginów lub zmodyfikowanego
środowiska uruchomieniowego OpenClaw. Wrażliwe narzędzia lokalne powinny nadal
wymagać jawnego włączenia przez plugin lub operatora i odmawiać działania, gdy
brakuje metadanych aktywnego modelu albo są one nieodpowiednie.

Manifest deklaruje własność i sposób wykrywania; wykonanie nadal wywołuje
aktywną, zarejestrowaną implementację narzędzia. Utrzymuj zgodność
`toolMetadata.<tool>.optional: true` z
`api.registerTool(..., { optional: true })`, aby OpenClaw nie musiał ładować
środowiska uruchomieniowego tego pluginu, dopóki narzędzie nie zostanie jawnie
dodane do listy dozwolonych.

## Konwencje importowania

Importuj z precyzyjnych podścieżek SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Nie importuj z przestarzałego głównego modułu zbiorczego:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

W pakiecie pluginu używaj lokalnych plików zbiorczych, takich jak `api.ts`
i `runtime-api.ts`, do importów wewnętrznych. Nie importuj własnego pluginu
przez ścieżkę SDK. Pomocnicze elementy właściwe dla dostawcy powinny pozostać
w pakiecie dostawcy, chyba że punkt integracji jest rzeczywiście ogólny.

Niestandardowe metody RPC Gateway są zaawansowanym punktem wejścia. Zachowaj
dla nich prefiks właściwy dla pluginu; przestrzenie nazw administracyjnych
rdzenia, takie jak `config.*`, `exec.approvals.*`, `operator.admin.*`,
`wizard.*` i `update.*`, pozostają zarezerwowane i są rozpoznawane jako
`operator.admin`. Most
`openclaw/plugin-sdk/gateway-method-runtime` jest zarezerwowany dla tras HTTP
pluginów, które deklarują
`contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Pełną mapę importów zawiera
[Omówienie SDK pluginów](/pl/plugins/sdk-overview).

## Lista kontrolna przed przesłaniem

<Check>Plik **package.json** zawiera poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają precyzyjnych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoodwołań przez SDK</Check>
<Check>Testy przechodzą (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie z wydaniami beta

1. Obserwuj wydania [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Tagi wersji beta mają postać `v2026.3.N-beta.1`. Możesz również obserwować konto [@openclaw](https://x.com/openclaw) w serwisie X, aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin z tagiem wersji beta, gdy tylko się pojawi. Okno czasowe przed wydaniem stabilnym trwa zwykle tylko kilka godzin.
3. Po przetestowaniu opublikuj w wątku swojego pluginu na kanale Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) wiadomość `all good` albo opis tego, co przestało działać. Utwórz wątek, jeśli jeszcze go nie masz.
4. Jeśli coś przestanie działać, otwórz lub zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i dodaj etykietę `beta-blocker`. Zamieść odnośnik do zgłoszenia w swoim wątku.
5. Otwórz PR do gałęzi `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i zamieść odnośnik do zgłoszenia zarówno w PR, jak i w swoim wątku na Discordzie. Współtwórcy nie mogą dodawać etykiet do PR-ów, dlatego tytuł stanowi sygnał dla opiekunów i automatyzacji. Blokery z PR-em zostaną scalone; te bez PR-u mogą mimo wszystko trafić do wydania.
6. Brak wiadomości oznacza brak problemów. Niewykorzystanie tego okna zwykle oznacza, że poprawka trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Utwórz plugin kanału komunikacyjnego
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Utwórz plugin dostawcy modelu
  </Card>
  <Card title="Pluginy zaplecza CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Zarejestruj lokalne zaplecze CLI AI
  </Card>
  <Card title="Przegląd SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Dokumentacja mapy importów i interfejsu API rejestracji
  </Card>
  <Card title="Narzędzia pomocnicze środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie i podagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane materiały

- [Hooki pluginów](/pl/plugins/hooks)
- [Architektura pluginów](/pl/plugins/architecture)
