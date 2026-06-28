---
read_when:
    - Stai scrivendo test per un Plugin
    - Ti servono le utilità di test dal Plugin SDK
    - Vuoi comprendere i test di contratto per i Plugin inclusi
sidebarTitle: Testing
summary: Utilità e pattern di test per i Plugin OpenClaw
title: Test dei Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Riferimento per utilità di test, pattern e applicazione del lint per i Plugin
OpenClaw.

<Tip>
  **Cerchi esempi di test?** Le guide pratiche includono esempi di test svolti:
  [Test dei Plugin di canale](/it/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei Plugin provider](/it/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilità di test

Questi sottopercorsi di helper di test sono entrypoint sorgente locali del repo per i test dei Plugin
inclusi di OpenClaw. Non sono esportazioni del pacchetto per Plugin di terze parti e
possono importare Vitest o altre dipendenze di test solo del repo.

**Import mock dell'API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import del contratto del runtime agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import del contratto di canale:** `openclaw/plugin-sdk/channel-contract-testing`

**Import dell'helper di test di canale:** `openclaw/plugin-sdk/channel-test-helpers`

**Import del test target di canale:** `openclaw/plugin-sdk/channel-target-testing`

**Import del contratto Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import del test runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import del contratto provider:** `openclaw/plugin-sdk/provider-test-contracts`

**Import del mock HTTP provider:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import del test ambiente/rete:** `openclaw/plugin-sdk/test-env`

**Import della fixture generica:** `openclaw/plugin-sdk/test-fixtures`

**Import del mock builtin Node:** `openclaw/plugin-sdk/test-node-mocks`

All'interno del repo OpenClaw, per i nuovi test dei Plugin inclusi preferisci i sottopercorsi mirati
qui sotto. Il barrel ampio
`openclaw/plugin-sdk/testing` è solo per compatibilità legacy.
Le protezioni del repo rifiutano nuovi import reali da `plugin-sdk/testing` e
`plugin-sdk/test-utils`; quei nomi rimangono solo come superfici di compatibilità deprecate
per i test dei record di compatibilità.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### Esportazioni disponibili

| Esportazione                                        | Scopo                                                                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crea un mock minimo dell'API Plugin per i test unitari di registrazione diretta. Importa da `plugin-sdk/plugin-test-api`                           |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture condivisa del contratto del profilo di autenticazione per gli adattatori runtime degli agenti nativi. Importa da `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture condivisa del contratto di soppressione della consegna per gli adattatori runtime degli agenti nativi. Importa da `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture condivisa del contratto di classificazione fallback per gli adattatori runtime degli agenti nativi. Importa da `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crea fixture di schema per strumenti dinamici per i test del contratto del runtime nativo. Importa da `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Verifica la forma del contesto in ingresso del canale. Importa da `plugin-sdk/channel-contract-testing`                                            |
| `installChannelOutboundPayloadContractSuite`         | Installa i casi di contratto del payload in uscita del canale. Importa da `plugin-sdk/channel-contract-testing`                                    |
| `createStartAccountContext`                          | Crea contesti del ciclo di vita dell'account del canale. Importa da `plugin-sdk/channel-test-helpers`                                              |
| `installChannelActionsContractSuite`                 | Installa i casi generici di contratto delle azioni dei messaggi del canale. Importa da `plugin-sdk/channel-test-helpers`                           |
| `installChannelSetupContractSuite`                   | Installa i casi generici di contratto della configurazione del canale. Importa da `plugin-sdk/channel-test-helpers`                                |
| `installChannelStatusContractSuite`                  | Installa i casi generici di contratto dello stato del canale. Importa da `plugin-sdk/channel-test-helpers`                                         |
| `expectDirectoryIds`                                 | Verifica gli ID di directory del canale da una funzione di elenco directory. Importa da `plugin-sdk/channel-test-helpers`                           |
| `assertBundledChannelEntries`                        | Verifica che gli entrypoint dei canali inclusi espongano il contratto pubblico previsto. Importa da `plugin-sdk/channel-test-helpers`              |
| `formatEnvelopeTimestamp`                            | Formatta timestamp deterministici dell'envelope. Importa da `plugin-sdk/channel-test-helpers`                                                      |
| `expectPairingReplyText`                             | Verifica il testo della risposta di abbinamento del canale ed estrae il relativo codice. Importa da `plugin-sdk/channel-test-helpers`              |
| `describePluginRegistrationContract`                 | Installa i controlli del contratto di registrazione del Plugin. Importa da `plugin-sdk/plugin-test-contracts`                                      |
| `registerSingleProviderPlugin`                       | Registra un Plugin provider nei test smoke del loader. Importa da `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugin`                             | Acquisisce tutti i tipi di provider da un Plugin. Importa da `plugin-sdk/plugin-test-runtime`                                                      |
| `registerProviderPlugins`                            | Acquisisce le registrazioni dei provider tra più Plugin. Importa da `plugin-sdk/plugin-test-runtime`                                               |
| `requireRegisteredProvider`                          | Verifica che una raccolta di provider contenga un ID. Importa da `plugin-sdk/plugin-test-runtime`                                                  |
| `createRuntimeEnv`                                   | Crea un ambiente runtime CLI/Plugin simulato. Importa da `plugin-sdk/plugin-test-runtime`                                                          |
| `createPluginRuntimeMock`                            | Crea una superficie runtime Plugin simulata. Importa da `plugin-sdk/plugin-test-runtime`                                                           |
| `createPluginSetupWizardStatus`                      | Crea helper di stato della configurazione per i Plugin di canale. Importa da `plugin-sdk/plugin-test-runtime`                                      |
| `describeOpenAIProviderRuntimeContract`              | Installa i controlli del contratto runtime della famiglia di provider. Importa da `plugin-sdk/provider-test-contracts`                             |
| `expectPassthroughReplayPolicy`                      | Verifica che le policy di replay del provider lascino passare strumenti e metadati di proprietà del provider. Importa da `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Esegue un test live del provider STT in tempo reale con fixture audio condivise. Importa da `plugin-sdk/provider-test-contracts`                   |
| `normalizeTranscriptForMatch`                        | Normalizza l'output della trascrizione live prima delle asserzioni fuzzy. Importa da `plugin-sdk/provider-test-contracts`                          |
| `expectExplicitVideoGenerationCapabilities`          | Verifica che i provider video dichiarino capacità esplicite della modalità di generazione. Importa da `plugin-sdk/provider-test-contracts`         |
| `expectExplicitMusicGenerationCapabilities`          | Verifica che i provider musicali dichiarino capacità esplicite di generazione/modifica. Importa da `plugin-sdk/provider-test-contracts`            |
| `mockSuccessfulDashscopeVideoTask`                   | Installa una risposta riuscita di task video compatibile con DashScope. Importa da `plugin-sdk/provider-test-contracts`                            |
| `getProviderHttpMocks`                               | Accedi ai mock Vitest HTTP/auth opt-in dei provider. Importa da `plugin-sdk/provider-http-test-mocks`                                              |
| `installProviderHttpMockCleanup`                     | Reimposta i mock HTTP/auth dei provider dopo ogni test. Importa da `plugin-sdk/provider-http-test-mocks`                                           |
| `installCommonResolveTargetErrorCases`               | Casi di test condivisi per la gestione degli errori di risoluzione del target. Importa da `plugin-sdk/channel-target-testing`                      |
| `shouldAckReaction`                                  | Controlla se un canale deve aggiungere una reazione di conferma. Importa da `plugin-sdk/channel-feedback`                                         |
| `removeAckReactionAfterReply`                        | Rimuove la reazione di conferma dopo la consegna della risposta. Importa da `plugin-sdk/channel-feedback`                                         |
| `createTestRegistry`                                 | Crea una fixture del registro dei Plugin di canale. Importa da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                |
| `createEmptyPluginRegistry`                          | Crea una fixture vuota del registro dei Plugin. Importa da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                    |
| `setActivePluginRegistry`                            | Installa una fixture del registro per i test del runtime Plugin. Importa da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Acquisisce richieste fetch JSON nei test degli helper multimediali. Importa da `plugin-sdk/test-env`                                              |
| `withServer`                                         | Esegue test contro un server HTTP locale usa e getta. Importa da `plugin-sdk/test-env`                                                             |
| `createMockIncomingRequest`                          | Crea un oggetto minimo di richiesta HTTP in ingresso. Importa da `plugin-sdk/test-env`                                                             |
| `withFetchPreconnect`                                | Esegue test fetch con hook di preconnessione installati. Importa da `plugin-sdk/test-env`                                                          |
| `withEnv` / `withEnvAsync`                           | Modifica temporaneamente le variabili d'ambiente. Importa da `plugin-sdk/test-env`                                                                 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixture di test del filesystem isolate. Importa da `plugin-sdk/test-env`                                                                      |
| `createMockServerResponse`                           | Crea un mock minimo di risposta del server HTTP. Importa da `plugin-sdk/test-env`                                                                  |
| `createCliRuntimeCapture`                            | Acquisisce l'output del runtime CLI nei test. Importa da `plugin-sdk/test-fixtures`                                                                |
| `importFreshModule`                                  | Importa un modulo ESM con un nuovo token di query per aggirare la cache dei moduli. Importa da `plugin-sdk/test-fixtures`                          |
| `bundledPluginRoot` / `bundledPluginFile`            | Risolve i percorsi delle fixture sorgente o dist dei Plugin inclusi. Importa da `plugin-sdk/test-fixtures`                                        |
| `mockNodeBuiltinModule`                              | Installa mock Vitest ristretti dei moduli integrati di Node. Importa da `plugin-sdk/test-node-mocks`                                              |
| `createSandboxTestContext`                           | Crea contesti di test sandbox. Importa da `plugin-sdk/test-fixtures`                                                                               |
| `writeSkill`                                         | Scrive fixture di skill. Importa da `plugin-sdk/test-fixtures`                                                                                    |
| `makeAgentAssistantMessage`                          | Crea fixture di messaggi della trascrizione agente. Importa da `plugin-sdk/test-fixtures`                                                         |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Ispeziona e reimposta le fixture degli eventi di sistema. Importa da `plugin-sdk/test-fixtures`                                                   |
| `sanitizeTerminalText`                               | Sanitizza l'output del terminale per le asserzioni. Importa da `plugin-sdk/test-fixtures`                                                         |
| `countLines` / `hasBalancedFences`                   | Verifica la forma dell'output di suddivisione in blocchi. Importa da `plugin-sdk/test-fixtures`                                                   |
| `runProviderCatalog`                                 | Esegue un hook del catalogo provider con dipendenze di test                                                                                         |
| `resolveProviderWizardOptions`                       | Risolve le scelte della procedura guidata di configurazione del provider nei test di contratto                                                     |
| `resolveProviderModelPickerEntries`                  | Risolve le voci del selettore di modelli del provider nei test di contratto                                                                        |
| `buildProviderPluginMethodChoice`                    | Crea gli ID delle scelte della procedura guidata del provider per le asserzioni                                                                    |
| `setProviderWizardProvidersResolverForTest`          | Inietta i provider wizard per test isolati                                                                                      |
| `createProviderUsageFetch`                           | Crea fixture di recupero dell'utilizzo dei provider                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Blocca e ripristina i timer per test sensibili al tempo. Importa da `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Crea un prompter del wizard di configurazione simulato                                                                                                     |
| `createRuntimeTaskFlow`                              | Crea lo stato task-flow runtime isolato                                                                                                  |
| `typedCases`                                         | Preserva i tipi letterali per test table-driven. Importa da `plugin-sdk/test-fixtures`                                                    |

Le suite di contratto dei Plugin integrati usano anche sottopercorsi di test dell'SDK per helper di fixture solo per test per registro, manifesto, artefatti pubblici e runtime. Le suite solo core che dipendono dall'inventario OpenClaw integrato restano sotto `src/plugins/contracts`.
Mantieni i nuovi test delle estensioni su un sottopercorso SDK focalizzato e documentato, come
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` o `plugin-sdk/test-fixtures`, invece di importare direttamente il
barrel di compatibilità ampio `plugin-sdk/testing`, i file `src/**` del repository o i bridge
`test/helpers/*` del repository.

### Tipi

I sottopercorsi di test focalizzati riesportano anche tipi utili nei file di test:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Test della risoluzione dei target

Usa `installCommonResolveTargetErrorCases` per aggiungere casi di errore standard per
la risoluzione dei target di canale:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Pattern di test

### Test dei contratti di registrazione

I test unitari che passano un mock `api` scritto a mano a `register(api)` non esercitano
i gate di accettazione del loader di OpenClaw. Aggiungi almeno uno smoke test basato sul loader
per ogni superficie di registrazione da cui dipende il tuo Plugin, soprattutto hook e
capacità esclusive come la memoria.

Il loader reale fa fallire la registrazione del Plugin quando mancano metadati obbligatori o un
Plugin chiama un'API di capacità che non possiede. Per esempio,
`api.registerHook(...)` richiede un nome di hook e
`api.registerMemoryCapability(...)` richiede che il manifesto del Plugin o l'entry esportata
dichiari `kind: "memory"`.

### Test dell'accesso alla configurazione di runtime

Preferisci il mock condiviso del runtime del Plugin da `openclaw/plugin-sdk/plugin-test-runtime`.
I suoi mock deprecati `runtime.config.loadConfig()` e `runtime.config.writeConfigFile(...)`
generano un errore per impostazione predefinita, così i test intercettano nuovi usi delle API di compatibilità. Sovrascrivi
quei mock solo quando il test copre esplicitamente il comportamento di compatibilità legacy.

### Test unitario di un Plugin di canale

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Test unitario di un Plugin provider

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mock del runtime del Plugin

Per il codice che usa `createPluginRuntimeStore`, crea un mock del runtime nei test:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Test con stub per istanza

Preferisci stub per istanza invece della mutazione del prototipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test di contratto (Plugin nel repository)

I Plugin integrati hanno test di contratto che verificano la proprietà della registrazione:

```bash
pnpm test -- src/plugins/contracts/
```

Questi test verificano:

- Quali Plugin registrano quali provider
- Quali Plugin registrano quali provider vocali
- La correttezza della forma della registrazione
- La conformità al contratto di runtime

### Esecuzione di test con ambito limitato

Per un Plugin specifico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo per i test di contratto:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Applicazione del lint (Plugin nel repository)

Tre regole sono applicate da `pnpm check` per i Plugin nel repository:

1. **Nessun import monolitico dalla radice** -- il barrel radice `openclaw/plugin-sdk` viene rifiutato
2. **Nessun import diretto da `src/`** -- i Plugin non possono importare direttamente `../../src/`
3. **Nessun auto-import** -- i Plugin non possono importare il proprio sottopercorso `plugin-sdk/<name>`

I Plugin esterni non sono soggetti a queste regole di lint, ma si consiglia di seguire gli stessi
pattern.

## Configurazione dei test

OpenClaw usa Vitest con soglie di copertura V8. Per i test dei Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Se le esecuzioni locali causano pressione sulla memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview) -- convenzioni di importazione
- [Plugin di canale SDK](/it/plugins/sdk-channel-plugins) -- interfaccia dei Plugin di canale
- [Plugin provider SDK](/it/plugins/sdk-provider-plugins) -- hook dei Plugin provider
- [Creazione di Plugin](/it/plugins/building-plugins) -- guida introduttiva
