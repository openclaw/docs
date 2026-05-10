---
read_when:
    - Stai scrivendo test per un Plugin
    - Sono necessarie le utilità di test dell'SDK del Plugin
    - Vuoi comprendere i test di contratto per i Plugin inclusi
sidebarTitle: Testing
summary: Utilità e pattern di test per i Plugin OpenClaw
title: Test dei Plugin
x-i18n:
    generated_at: "2026-05-10T19:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Riferimento per utility di test, pattern e applicazione del lint per i plugin di OpenClaw.

<Tip>
  **Cerchi esempi di test?** Le guide pratiche includono esempi di test svolti:
  [Test dei plugin di canale](/it/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei plugin provider](/it/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utility di test

Questi sottopercorsi degli helper di test sono entrypoint sorgente locali al repository per i test dei plugin
inclusi in OpenClaw. Non sono export del pacchetto per plugin di terze parti.

**Import del mock dell'API del Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import del contratto del runtime dell'agente:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import del contratto del canale:** `openclaw/plugin-sdk/channel-contract-testing`

**Import dell'helper di test del canale:** `openclaw/plugin-sdk/channel-test-helpers`

**Import del test del target del canale:** `openclaw/plugin-sdk/channel-target-testing`

**Import del contratto del Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import del test del runtime del Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import del contratto del provider:** `openclaw/plugin-sdk/provider-test-contracts`

**Import del mock HTTP del provider:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import dei test di ambiente/rete:** `openclaw/plugin-sdk/test-env`

**Import della fixture generica:** `openclaw/plugin-sdk/test-fixtures`

**Import del mock integrato di Node:** `openclaw/plugin-sdk/test-node-mocks`

Preferisci i sottopercorsi mirati di seguito per i nuovi test dei plugin. Il barrel ampio
`openclaw/plugin-sdk/testing` è solo compatibilità legacy.
Le protezioni del repository rifiutano nuovi import reali da `plugin-sdk/testing` e
`plugin-sdk/test-utils`; quei nomi restano solo come superfici di compatibilità deprecate
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

### Export disponibili

| Esportazione                                         | Scopo                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crea un mock minimale dell'API Plugin per test unitari di registrazione diretta. Importare da `plugin-sdk/plugin-test-api`                                    |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture condivisa del contratto del profilo di autenticazione per adattatori del runtime nativo degli agenti. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture condivisa del contratto di soppressione della consegna per adattatori del runtime nativo degli agenti. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture condivisa del contratto di classificazione fallback per adattatori del runtime nativo degli agenti. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crea fixture di schema per strumenti dinamici per test dei contratti del runtime nativo. Importare da `plugin-sdk/agent-runtime-test-contracts`                |
| `expectChannelInboundContextContract`                | Verifica la forma del contesto inbound del canale. Importare da `plugin-sdk/channel-contract-testing`                                                         |
| `installChannelOutboundPayloadContractSuite`         | Installa casi di contratto per i payload outbound del canale. Importare da `plugin-sdk/channel-contract-testing`                                             |
| `createStartAccountContext`                          | Crea contesti del ciclo di vita dell'account del canale. Importare da `plugin-sdk/channel-test-helpers`                                                       |
| `installChannelActionsContractSuite`                 | Installa casi generici di contratto per le azioni sui messaggi del canale. Importare da `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Installa casi generici di contratto per la configurazione del canale. Importare da `plugin-sdk/channel-test-helpers`                                          |
| `installChannelStatusContractSuite`                  | Installa casi generici di contratto per lo stato del canale. Importare da `plugin-sdk/channel-test-helpers`                                                   |
| `expectDirectoryIds`                                 | Verifica gli id della directory del canale da una funzione di elenco directory. Importare da `plugin-sdk/channel-test-helpers`                                |
| `assertBundledChannelEntries`                        | Verifica che gli entrypoint dei canali inclusi espongano il contratto pubblico previsto. Importare da `plugin-sdk/channel-test-helpers`                       |
| `formatEnvelopeTimestamp`                            | Formatta timestamp di envelope deterministici. Importare da `plugin-sdk/channel-test-helpers`                                                                 |
| `expectPairingReplyText`                             | Verifica il testo di risposta dell'abbinamento del canale ed estrae il relativo codice. Importare da `plugin-sdk/channel-test-helpers`                        |
| `describePluginRegistrationContract`                 | Installa controlli del contratto di registrazione Plugin. Importare da `plugin-sdk/plugin-test-contracts`                                                     |
| `registerSingleProviderPlugin`                       | Registra un singolo Plugin provider nei test smoke del loader. Importare da `plugin-sdk/plugin-test-runtime`                                                  |
| `registerProviderPlugin`                             | Acquisisce tutti i tipi di provider da un Plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                               |
| `registerProviderPlugins`                            | Acquisisce le registrazioni dei provider su più Plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                         |
| `requireRegisteredProvider`                          | Verifica che una raccolta di provider contenga un id. Importare da `plugin-sdk/plugin-test-runtime`                                                           |
| `createRuntimeEnv`                                   | Crea un ambiente runtime CLI/Plugin mockato. Importare da `plugin-sdk/plugin-test-runtime`                                                                    |
| `createPluginSetupWizardStatus`                      | Crea helper di stato della configurazione per Plugin di canale. Importare da `plugin-sdk/plugin-test-runtime`                                                 |
| `describeOpenAIProviderRuntimeContract`              | Installa controlli del contratto runtime della famiglia di provider. Importare da `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Verifica che le policy di replay del provider passino senza modifiche strumenti e metadati di proprietà del provider. Importare da `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Esegue un test live del provider STT realtime con fixture audio condivise. Importare da `plugin-sdk/provider-test-contracts`                                  |
| `normalizeTranscriptForMatch`                        | Normalizza l'output della trascrizione live prima delle asserzioni fuzzy. Importare da `plugin-sdk/provider-test-contracts`                                   |
| `expectExplicitVideoGenerationCapabilities`          | Verifica che i provider video dichiarino capacità esplicite per la modalità di generazione. Importare da `plugin-sdk/provider-test-contracts`                  |
| `expectExplicitMusicGenerationCapabilities`          | Verifica che i provider musicali dichiarino capacità esplicite di generazione/modifica. Importare da `plugin-sdk/provider-test-contracts`                     |
| `mockSuccessfulDashscopeVideoTask`                   | Installa una risposta di attività video riuscita compatibile con DashScope. Importare da `plugin-sdk/provider-test-contracts`                                 |
| `getProviderHttpMocks`                               | Accede ai mock Vitest HTTP/autenticazione del provider attivabili esplicitamente. Importare da `plugin-sdk/provider-http-test-mocks`                          |
| `installProviderHttpMockCleanup`                     | Reimposta i mock HTTP/autenticazione del provider dopo ogni test. Importare da `plugin-sdk/provider-http-test-mocks`                                         |
| `installCommonResolveTargetErrorCases`               | Casi di test condivisi per la gestione degli errori di risoluzione del target. Importare da `plugin-sdk/channel-target-testing`                              |
| `shouldAckReaction`                                  | Controlla se un canale deve aggiungere una reazione di conferma. Importare da `plugin-sdk/channel-feedback`                                                  |
| `removeAckReactionAfterReply`                        | Rimuove la reazione di conferma dopo la consegna della risposta. Importare da `plugin-sdk/channel-feedback`                                                   |
| `createTestRegistry`                                 | Crea una fixture del registro dei Plugin di canale. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                        |
| `createEmptyPluginRegistry`                          | Crea una fixture di registro Plugin vuota. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                                 |
| `setActivePluginRegistry`                            | Installa una fixture di registro per i test del runtime Plugin. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`             |
| `createRequestCaptureJsonFetch`                      | Acquisisce richieste fetch JSON nei test degli helper multimediali. Importare da `plugin-sdk/test-env`                                                        |
| `withServer`                                         | Esegue test su un server HTTP locale usa e getta. Importare da `plugin-sdk/test-env`                                                                          |
| `createMockIncomingRequest`                          | Crea un oggetto minimale di richiesta HTTP in ingresso. Importare da `plugin-sdk/test-env`                                                                    |
| `withFetchPreconnect`                                | Esegue test fetch con hook di preconnessione installati. Importare da `plugin-sdk/test-env`                                                                   |
| `withEnv` / `withEnvAsync`                           | Applica temporaneamente patch alle variabili d'ambiente. Importare da `plugin-sdk/test-env`                                                                  |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixture di test del filesystem isolate. Importare da `plugin-sdk/test-env`                                                                               |
| `createMockServerResponse`                           | Crea un mock minimale di risposta del server HTTP. Importare da `plugin-sdk/test-env`                                                                         |
| `createCliRuntimeCapture`                            | Acquisisce l'output del runtime CLI nei test. Importare da `plugin-sdk/test-fixtures`                                                                         |
| `importFreshModule`                                  | Importa un modulo ESM con un token di query nuovo per bypassare la cache dei moduli. Importare da `plugin-sdk/test-fixtures`                                  |
| `bundledPluginRoot` / `bundledPluginFile`            | Risolve percorsi di fixture sorgente o dist dei Plugin inclusi. Importare da `plugin-sdk/test-fixtures`                                                       |
| `mockNodeBuiltinModule`                              | Installa mock Vitest mirati per moduli incorporati Node. Importare da `plugin-sdk/test-node-mocks`                                                           |
| `createSandboxTestContext`                           | Crea contesti di test sandbox. Importare da `plugin-sdk/test-fixtures`                                                                                        |
| `writeSkill`                                         | Scrive fixture di skill. Importare da `plugin-sdk/test-fixtures`                                                                                              |
| `makeAgentAssistantMessage`                          | Crea fixture di messaggi della trascrizione degli agenti. Importare da `plugin-sdk/test-fixtures`                                                             |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Ispeziona e reimposta fixture degli eventi di sistema. Importare da `plugin-sdk/test-fixtures`                                                               |
| `sanitizeTerminalText`                               | Sanifica l'output del terminale per le asserzioni. Importare da `plugin-sdk/test-fixtures`                                                                    |
| `countLines` / `hasBalancedFences`                   | Verifica la forma dell'output di suddivisione in chunk. Importare da `plugin-sdk/test-fixtures`                                                              |
| `runProviderCatalog`                                 | Esegue un hook del catalogo provider con dipendenze di test                                                                                                   |
| `resolveProviderWizardOptions`                       | Risolve le scelte della procedura guidata di configurazione del provider nei test di contratto                                                               |
| `resolveProviderModelPickerEntries`                  | Risolve le voci del selettore di modelli del provider nei test di contratto                                                                                  |
| `buildProviderPluginMethodChoice`                    | Crea id di scelta della procedura guidata del provider per le asserzioni                                                                                      |
| `setProviderWizardProvidersResolverForTest`          | Inietta provider della procedura guidata del provider per test isolati                                                                                       |
| `createProviderUsageFetch`                           | Crea fixture per il recupero dell'utilizzo del provider                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Blocca e ripristina i timer per i test sensibili al tempo. Importa da `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Crea un prompter fittizio per la procedura guidata di configurazione                                                                                                     |
| `createRuntimeTaskFlow`                              | Crea uno stato runtime isolato del flusso di attività                                                                                                  |
| `typedCases`                                         | Preserva i tipi letterali per i test basati su tabelle. Importa da `plugin-sdk/test-fixtures`                                                    |

Le suite di contratto dei plugin in bundle usano anche i sottopercorsi di test dell’SDK per helper solo per test relativi a registry, manifest, artefatti pubblici e fixture di runtime. Le suite solo core che dipendono dall’inventario OpenClaw in bundle restano in `src/plugins/contracts`.
Mantieni i nuovi test delle estensioni su un sottopercorso SDK mirato e documentato, come
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` o `plugin-sdk/test-fixtures`, invece di importare direttamente il barrel di compatibilità ampio `plugin-sdk/testing`, i file `src/**` del repo o i bridge `test/helpers/*` del repo.

### Tipi

I sottopercorsi di test mirati riesportano anche tipi utili nei file di test:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Risoluzione dei target di test

Usa `installCommonResolveTargetErrorCases` per aggiungere casi di errore standard per la risoluzione dei target del canale:

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

I test unitari che passano a `register(api)` un mock `api` scritto a mano non esercitano i gate di accettazione del loader di OpenClaw. Aggiungi almeno uno smoke test basato sul loader per ogni superficie di registrazione da cui dipende il tuo plugin, in particolare hook e capability esclusive come la memoria.

Il loader reale fa fallire la registrazione del plugin quando mancano metadati obbligatori o quando un plugin chiama un’API di capability che non possiede. Per esempio, `api.registerHook(...)` richiede un nome di hook, e `api.registerMemoryCapability(...)` richiede che il manifest del plugin o l’entry esportata dichiari `kind: "memory"`.

### Test dell’accesso alla configurazione di runtime

Preferisci il mock condiviso del runtime del plugin da `openclaw/plugin-sdk/channel-test-helpers` quando testi i plugin di canale in bundle. I suoi mock deprecati `runtime.config.loadConfig()` e `runtime.config.writeConfigFile(...)` generano un errore per impostazione predefinita, così i test intercettano nuovi usi delle API di compatibilità. Sovrascrivi questi mock solo quando il test copre esplicitamente il comportamento di compatibilità legacy.

### Test unitario di un plugin di canale

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

### Test unitario di un plugin provider

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

### Mock del runtime del plugin

Per il codice che usa `createPluginRuntimeStore`, esegui il mock del runtime nei test:

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

Preferisci gli stub per istanza alla mutazione del prototipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test di contratto (plugin nel repo)

I plugin in bundle hanno test di contratto che verificano la proprietà della registrazione:

```bash
pnpm test -- src/plugins/contracts/
```

Questi test verificano:

- Quali plugin registrano quali provider
- Quali plugin registrano quali provider vocali
- Correttezza della forma della registrazione
- Conformità al contratto di runtime

### Esecuzione di test con ambito limitato

Per un plugin specifico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo per i test di contratto:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Applicazione del lint (plugin nel repo)

Tre regole sono applicate da `pnpm check` per i plugin nel repo:

1. **Nessun import monolitico dalla root** -- il barrel root `openclaw/plugin-sdk` viene rifiutato
2. **Nessun import diretto da `src/`** -- i plugin non possono importare direttamente `../../src/`
3. **Nessun self-import** -- i plugin non possono importare il proprio sottopercorso `plugin-sdk/<name>`

I plugin esterni non sono soggetti a queste regole di lint, ma è consigliato seguire gli stessi pattern.

## Configurazione dei test

OpenClaw usa Vitest con soglie di copertura V8. Per i test dei plugin:

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

- [Panoramica dell’SDK](/it/plugins/sdk-overview) -- convenzioni di import
- [Plugin di canale SDK](/it/plugins/sdk-channel-plugins) -- interfaccia dei plugin di canale
- [Plugin provider SDK](/it/plugins/sdk-provider-plugins) -- hook dei plugin provider
- [Creazione di plugin](/it/plugins/building-plugins) -- guida introduttiva
