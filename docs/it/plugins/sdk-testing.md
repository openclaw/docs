---
read_when:
    - Stai scrivendo test per un plugin
    - Hai bisogno delle utilità di test dell'SDK del Plugin
    - Vuoi comprendere i test di contratto per i plugin inclusi nel pacchetto
sidebarTitle: Testing
summary: Utilità e modelli di test per i plugin OpenClaw
title: Test dei Plugin
x-i18n:
    generated_at: "2026-07-12T07:22:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Riferimento per utilità, modelli e applicazione delle regole di lint per i Plugin di
OpenClaw.

<Tip>
  **Cerchi esempi di test?** Le guide pratiche includono esempi di test completi:
  [Test dei Plugin di canale](/it/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei Plugin provider](/it/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilità di test

Questi sottopercorsi sono punti di ingresso al codice sorgente locale del repository per i test
dei Plugin inclusi in OpenClaw. Non sono esportazioni `package.json` pubblicate per Plugin
di terze parti e possono importare Vitest o altre dipendenze di test riservate al repository.

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

Per i nuovi test dei Plugin inclusi, preferisci questi sottopercorsi specifici. Il barrel generico
`openclaw/plugin-sdk/testing` e l'alias `openclaw/plugin-sdk/test-utils`
servono solo per la compatibilità con il codice legacy: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rifiuta le nuove importazioni
di entrambi dai file di test delle estensioni, ed entrambi restano esclusivamente per
i test che documentano la compatibilità.

### Esportazioni disponibili

| Esportazione                                         | Scopo                                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crea un mock minimo dell'API del Plugin per gli unit test di registrazione diretta. Importare da `plugin-sdk/plugin-test-api`                               |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture condivisa del contratto del profilo di autenticazione per gli adattatori del runtime dell'agente nativo. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture condivisa del contratto di soppressione della consegna per gli adattatori del runtime dell'agente nativo. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture condivisa del contratto di classificazione del fallback per gli adattatori del runtime dell'agente nativo. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crea fixture dello schema degli strumenti dinamici per i test del contratto del runtime nativo. Importare da `plugin-sdk/agent-runtime-test-contracts`     |
| `expectChannelInboundContextContract`                | Verifica la struttura del contesto in ingresso del canale. Importare da `plugin-sdk/channel-contract-testing`                                              |
| `installChannelOutboundPayloadContractSuite`         | Installa i casi del contratto del payload in uscita del canale. Importare da `plugin-sdk/channel-contract-testing`                                         |
| `createStartAccountContext`                          | Crea contesti del ciclo di vita dell'account del canale. Importare da `plugin-sdk/channel-test-helpers`                                                    |
| `installChannelActionsContractSuite`                 | Installa i casi generici del contratto delle azioni sui messaggi del canale. Importare da `plugin-sdk/channel-test-helpers`                                |
| `installChannelSetupContractSuite`                   | Installa i casi generici del contratto di configurazione del canale. Importare da `plugin-sdk/channel-test-helpers`                                        |
| `installChannelStatusContractSuite`                  | Installa i casi generici del contratto di stato del canale. Importare da `plugin-sdk/channel-test-helpers`                                                 |
| `expectDirectoryIds`                                 | Verifica gli ID della directory del canale restituiti da una funzione di elenco della directory. Importare da `plugin-sdk/channel-test-helpers`            |
| `assertBundledChannelEntries`                        | Verifica che i punti di ingresso dei canali inclusi espongano il contratto pubblico previsto. Importare da `plugin-sdk/channel-test-helpers`               |
| `formatEnvelopeTimestamp`                            | Formatta timestamp deterministici per le buste. Importare da `plugin-sdk/channel-test-helpers`                                                             |
| `expectPairingReplyText`                             | Verifica il testo della risposta di associazione del canale e ne estrae il codice. Importare da `plugin-sdk/channel-test-helpers`                          |
| `describePluginRegistrationContract`                 | Installa i controlli del contratto di registrazione del Plugin. Importare da `plugin-sdk/plugin-test-contracts`                                            |
| `registerSingleProviderPlugin`                       | Registra un Plugin di provider nei test smoke del caricatore. Importare da `plugin-sdk/plugin-test-runtime`                                                |
| `registerProviderPlugin`                             | Acquisisce tutti i tipi di provider da un singolo Plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                    |
| `registerProviderPlugins`                            | Acquisisce le registrazioni dei provider tra più Plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                     |
| `requireRegisteredProvider`                          | Verifica che una raccolta di provider contenga un ID. Importare da `plugin-sdk/plugin-test-runtime`                                                        |
| `createRuntimeEnv`                                   | Crea un ambiente di runtime simulato per CLI/Plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                         |
| `createPluginRuntimeMock`                            | Crea una superficie simulata del runtime del Plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                         |
| `createPluginSetupWizardStatus`                      | Crea helper per lo stato della procedura guidata di configurazione dei Plugin di canale. Importare da `plugin-sdk/plugin-test-runtime`                     |
| `createTestWizardPrompter`                           | Crea un gestore di prompt simulato per la procedura guidata di configurazione. Importare da `plugin-sdk/plugin-test-runtime`                               |
| `createRuntimeTaskFlow`                              | Crea uno stato isolato del flusso di attività del runtime. Importare da `plugin-sdk/plugin-test-runtime`                                                   |
| `runProviderCatalog`                                 | Esegue un hook del catalogo dei provider con dipendenze di test. Importare da `plugin-sdk/plugin-test-runtime`                                             |
| `resolveProviderWizardOptions`                       | Risolve le scelte della procedura guidata di configurazione del provider nei test del contratto. Importare da `plugin-sdk/plugin-test-runtime`             |
| `resolveProviderModelPickerEntries`                  | Risolve le voci del selettore di modelli del provider nei test del contratto. Importare da `plugin-sdk/plugin-test-runtime`                                |
| `buildProviderPluginMethodChoice`                    | Crea gli ID delle scelte della procedura guidata del provider per le verifiche. Importare da `plugin-sdk/plugin-test-runtime`                              |
| `setProviderWizardProvidersResolverForTest`          | Inserisce i provider della procedura guidata del provider per test isolati. Importare da `plugin-sdk/plugin-test-runtime`                                  |
| `describeOpenAIProviderRuntimeContract`              | Installa i controlli del contratto del runtime della famiglia di provider. Importare da `plugin-sdk/provider-test-contracts`                               |
| `expectPassthroughReplayPolicy`                      | Verifica che i criteri di riproduzione del provider trasmettano senza modifiche strumenti e metadati di proprietà del provider. Importare da `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Esegue un test live del provider STT in tempo reale con fixture audio condivise. Importare da `plugin-sdk/provider-test-contracts`                         |
| `normalizeTranscriptForMatch`                        | Normalizza l'output della trascrizione live prima delle verifiche approssimative. Importare da `plugin-sdk/provider-test-contracts`                        |
| `expectExplicitVideoGenerationCapabilities`          | Verifica che i provider video dichiarino esplicitamente le funzionalità relative alla modalità di generazione. Importare da `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Verifica che i provider musicali dichiarino esplicitamente le funzionalità di generazione/modifica. Importare da `plugin-sdk/provider-test-contracts`     |
| `mockSuccessfulDashscopeVideoTask`                   | Installa una risposta riuscita per un'attività video compatibile con DashScope. Importare da `plugin-sdk/provider-test-contracts`                         |
| `getProviderHttpMocks`                               | Accede ai mock Vitest HTTP/di autenticazione del provider attivabili esplicitamente. Importare da `plugin-sdk/provider-http-test-mocks`                    |
| `installProviderHttpMockCleanup`                     | Reimposta i mock HTTP/di autenticazione del provider dopo ogni test. Importare da `plugin-sdk/provider-http-test-mocks`                                    |
| `installCommonResolveTargetErrorCases`               | Casi di test condivisi per la gestione degli errori di risoluzione della destinazione. Importare da `plugin-sdk/channel-target-testing`                    |
| `shouldAckReaction`                                  | Controlla se un canale deve aggiungere una reazione di conferma. Importare da `plugin-sdk/channel-feedback`                                                |
| `removeAckReactionAfterReply`                        | Rimuove la reazione di conferma dopo la consegna della risposta. Importare da `plugin-sdk/channel-feedback`                                                |
| `createTestRegistry`                                 | Crea una fixture del registro dei Plugin di canale. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                      |
| `createEmptyPluginRegistry`                          | Crea una fixture vuota del registro dei Plugin. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                          |
| `setActivePluginRegistry`                            | Installa una fixture del registro per i test del runtime del Plugin. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`     |
| `createRequestCaptureJsonFetch`                      | Acquisisce le richieste fetch JSON nei test degli helper multimediali. Importare da `plugin-sdk/test-env`                                                  |
| `withServer`                                         | Esegue i test su un server HTTP locale temporaneo. Importare da `plugin-sdk/test-env`                                                                      |
| `createMockIncomingRequest`                          | Crea un oggetto minimo per una richiesta HTTP in ingresso. Importare da `plugin-sdk/test-env`                                                              |
| `withFetchPreconnect`                                | Esegue i test fetch con gli hook di preconnessione installati. Importare da `plugin-sdk/test-env`                                                          |
| `withEnv` / `withEnvAsync`                           | Modifica temporaneamente le variabili di ambiente. Importare da `plugin-sdk/test-env`                                                                      |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixture isolate del file system per i test. Importare da `plugin-sdk/test-env`                                                                        |
| `createMockServerResponse`                           | Crea un mock minimo della risposta del server HTTP. Importare da `plugin-sdk/test-env`                                                                     |
| `createProviderUsageFetch`                           | Crea fixture fetch per l'utilizzo del provider. Importare da `plugin-sdk/test-env`                                                                         |
| `useFrozenTime` / `useRealTime`                      | Blocca e ripristina i timer per i test sensibili al tempo. Importare da `plugin-sdk/test-env`                                                              |
| `createCliRuntimeCapture`                            | Acquisisce l'output del runtime della CLI nei test. Importare da `plugin-sdk/test-fixtures`                                                                |
| `importFreshModule`                                  | Importa un modulo ESM con un nuovo token di query per ignorare la cache dei moduli. Importare da `plugin-sdk/test-fixtures`                                |
| `bundledPluginRoot` / `bundledPluginFile`            | Risolve i percorsi delle fixture del codice sorgente o della distribuzione dei Plugin inclusi. Importare da `plugin-sdk/test-fixtures`                     |
| `mockNodeBuiltinModule`                              | Installa mock Vitest mirati per i moduli integrati di Node. Importare da `plugin-sdk/test-node-mocks`                                                      |
| `createSandboxTestContext`                           | Crea contesti di test per la sandbox. Importare da `plugin-sdk/test-fixtures`                                                                              |
| `writeSkill`                                         | Scrive fixture per le Skills. Importare da `plugin-sdk/test-fixtures`                                                                    |
| `makeAgentAssistantMessage`                          | Crea fixture dei messaggi della trascrizione dell'agente. Importare da `plugin-sdk/test-fixtures`                                        |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Ispeziona e reimposta le fixture degli eventi di sistema. Importare da `plugin-sdk/test-fixtures`                                        |
| `sanitizeTerminalText`                               | Sanifica l'output del terminale per le asserzioni. Importare da `plugin-sdk/test-fixtures`                                                |
| `countLines` / `hasBalancedFences`                   | Verifica la struttura dell'output suddiviso in blocchi. Importare da `plugin-sdk/test-fixtures`                                          |
| `typedCases`                                         | Mantiene i tipi letterali per i test basati su tabelle. Importare da `plugin-sdk/test-fixtures`                                          |

Anche le suite di contratti dei Plugin inclusi usano questi sottopercorsi di test dell'SDK per
gli helper di fixture, destinati esclusivamente ai test, relativi a registro, manifest, artefatti pubblici e runtime.
Le suite riservate al core che dipendono dall'inventario OpenClaw incluso rimangono invece in
`src/plugins/contracts`.

### Tipi

I sottopercorsi dedicati ai test riesportano anche tipi utili nei file di test:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Test della risoluzione della destinazione

Usa `installCommonResolveTargetErrorCases` per aggiungere i casi di errore standard per
la risoluzione della destinazione del canale:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logica di risoluzione della destinazione del tuo canale
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Aggiungi casi di test specifici del canale
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Modelli di test

### Test dei contratti di registrazione

I test unitari che passano a `register(api)` un mock `api` scritto manualmente non
esercitano i controlli di accettazione del loader di OpenClaw. Aggiungi almeno uno
smoke test basato sul loader per ogni superficie di registrazione da cui dipende il Plugin,
in particolare per gli hook e le funzionalità esclusive come la memoria.

Il loader reale non riesce a registrare il Plugin quando mancano i metadati obbligatori o
quando un Plugin chiama un'API di una funzionalità che non gli appartiene. Ad esempio,
`api.registerHook(...)` richiede il nome di un hook e
`api.registerMemoryCapability(...)` richiede che il manifest del Plugin o la voce esportata
dichiari `kind: "memory"`.

### Test dell'accesso alla configurazione del runtime

Preferisci il mock condiviso del runtime del Plugin da `openclaw/plugin-sdk/plugin-test-runtime`.
I mock `runtime.config.loadConfig()` e `runtime.config.writeConfigFile(...)`
generano un'eccezione per impostazione predefinita, in modo che i test rilevino i nuovi utilizzi delle API
di compatibilità deprecate. Sovrascrivi questi mock solo quando il test verifica esplicitamente
il comportamento di compatibilità legacy.

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
    // Nessun valore del token esposto
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
      // ... contesto
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contesto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simulazione del runtime del Plugin

Per il codice che usa `createPluginRuntimeStore`, simula il runtime nei test:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Nella configurazione del test
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... altri mock
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... altri spazi dei nomi
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Dopo i test
store.clearRuntime();
```

### Test con stub per istanza

Preferisci gli stub per istanza alla modifica del prototipo:

```typescript
// Preferito: stub per istanza
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Da evitare: modifica del prototipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test dei contratti (Plugin nel repository)

I Plugin inclusi dispongono di test dei contratti che verificano la proprietà della registrazione:

```bash
pnpm test src/plugins/contracts/
```

Questi test verificano:

- Quali Plugin registrano quali provider
- Quali Plugin registrano quali provider vocali
- La correttezza della struttura di registrazione
- La conformità al contratto del runtime

### Esecuzione di test circoscritti

Per un Plugin specifico:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Solo per i test dei contratti:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Applicazione delle regole di lint (Plugin nel repository)

`scripts/run-additional-boundary-checks.mjs` esegue in CI una serie di controlli
`lint:plugins:*` sui confini delle importazioni; ciascuno può anche essere eseguito autonomamente in locale:

| Comando                                                        | Regola applicata                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | I Plugin inclusi non possono importare il barrel radice monolitico `openclaw/plugin-sdk`.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | I file di produzione delle estensioni non possono importare direttamente l'albero `src/**` del repository (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | I file di test delle estensioni non possono importare `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` o altri helper di test riservati al core. |

I Plugin esterni non sono soggetti a queste regole di lint, ma si consiglia di seguire
gli stessi modelli.

## Configurazione dei test

OpenClaw usa Vitest 4 con report informativi sulla copertura V8. Per i test dei Plugin:

```bash
# Esegui tutti i test
pnpm test

# Esegui i test di un Plugin specifico
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Esegui con un filtro specifico per il nome del test
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Esegui con la copertura
pnpm test:coverage
```

Se le esecuzioni locali causano problemi di memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Argomenti correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview) -- convenzioni di importazione
- [Plugin di canale dell'SDK](/it/plugins/sdk-channel-plugins) -- interfaccia dei Plugin di canale
- [Plugin provider dell'SDK](/it/plugins/sdk-provider-plugins) -- hook dei Plugin provider
- [Creazione di Plugin](/it/plugins/building-plugins) -- guida introduttiva
