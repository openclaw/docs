---
read_when:
    - Si stanno scrivendo test per un plugin
    - Sono necessarie le utilità di test dell'SDK del plugin
    - Si desidera comprendere i test di contratto per i plugin inclusi nel pacchetto
sidebarTitle: Testing
summary: Utilità e modelli di test per i plugin di OpenClaw
title: Test dei Plugin
x-i18n:
    generated_at: "2026-07-16T14:47:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Riferimento per utility, pattern e applicazione del lint per i Plugin di
OpenClaw.

<Tip>
  **Si cercano esempi di test?** Le guide pratiche includono esempi di test completi:
  [Test dei Plugin per canali](/it/plugins/sdk-channel-plugins#step-6-test) e
  [Test dei Plugin per provider](/it/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utility di test

Questi sottopercorsi sono punti di ingresso del codice sorgente locali al repository per i test
dei Plugin inclusi in OpenClaw. Non sono esportazioni `package.json` pubblicate per Plugin
di terze parti e possono importare Vitest o altre dipendenze di test disponibili solo nel repository.

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

Usare questi sottopercorsi specifici per i test dei Plugin inclusi. Il precedente
barrel `openclaw/plugin-sdk/testing` era locale al repository, escluso dai
pacchetti distribuiti ed è stato rimosso. L'alias legacy `openclaw/plugin-sdk/test-utils`
rimane locale al repository; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rifiuta le nuove importazioni di tale alias
nei test delle estensioni.

### Esportazioni disponibili

| Esportazione                                        | Scopo                                                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Crea un mock minimale dell'API del plugin per gli unit test di registrazione diretta. Importare da `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture condivisa del contratto dei profili di autenticazione per gli adattatori del runtime nativo degli agenti. Importare da `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture condivisa del contratto di soppressione della consegna per gli adattatori del runtime nativo degli agenti. Importare da `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture condivisa del contratto di classificazione del fallback per gli adattatori del runtime nativo degli agenti. Importare da `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Crea fixture dello schema degli strumenti dinamici per i test del contratto del runtime nativo. Importare da `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Verifica la struttura del contesto in entrata del canale. Importare da `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installa i casi del contratto del payload in uscita del canale. Importare da `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Crea i contesti del ciclo di vita degli account del canale. Importare da `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Installa i casi generici del contratto delle azioni sui messaggi del canale. Importare da `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Installa i casi generici del contratto di configurazione del canale. Importare da `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Installa i casi generici del contratto sullo stato del canale. Importare da `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Verifica gli ID della directory del canale restituiti da una funzione di elenco delle directory. Importare da `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Verifica che gli entry point dei canali inclusi espongano il contratto pubblico previsto. Importare da `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formatta timestamp deterministici per le buste. Importare da `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Verifica il testo della risposta di associazione del canale e ne estrae il codice. Importare da `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Installa i controlli del contratto di registrazione dei plugin. Importare da `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registra un plugin del provider nei test rapidi del caricatore. Importare da `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Acquisisce tutti i tipi di provider da un plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Acquisisce le registrazioni dei provider da più plugin. Importare da `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Verifica che una raccolta di provider contenga un ID. Importare da `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Crea un ambiente simulato per il runtime della CLI e dei plugin. Importare da `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Crea una superficie simulata del runtime dei plugin. Importare da `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Crea helper per lo stato di configurazione dei plugin dei canali. Importare da `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Crea un gestore simulato dei prompt della procedura guidata di configurazione. Importare da `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Crea uno stato isolato del TaskFlow del runtime. Importare da `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Esegue un hook del catalogo dei provider con dipendenze di test. Importare da `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Risolve le scelte della procedura guidata di configurazione del provider nei test del contratto. Importare da `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Risolve le voci del selettore dei modelli del provider nei test del contratto. Importare da `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Crea gli ID delle scelte della procedura guidata del provider per le verifiche. Importare da `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Inserisce i provider della procedura guidata del provider per i test isolati. Importare da `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Installa i controlli del contratto del runtime per le famiglie di provider. Importare da `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Verifica che le politiche di riproduzione del provider vengano trasmesse agli strumenti e ai metadati di proprietà del provider. Importare da `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Esegue un test live di un provider STT in tempo reale con fixture audio condivise. Importare da `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalizza l'output della trascrizione live prima delle verifiche fuzzy. Importare da `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Verifica che i provider video dichiarino esplicitamente le funzionalità della modalità di generazione. Importare da `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Verifica che i provider musicali dichiarino esplicitamente le funzionalità di generazione/modifica. Importare da `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Installa una risposta riuscita per un'attività video compatibile con DashScope. Importare da `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Accede ai mock Vitest HTTP/autenticazione dei provider che richiedono l'abilitazione esplicita. Importare da `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Reimposta i mock HTTP/autenticazione dei provider dopo ogni test. Importare da `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Casi di test condivisi per la gestione degli errori di risoluzione della destinazione. Importare da `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Controlla se un canale deve aggiungere una reazione di conferma. Importare da `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Rimuove la reazione di conferma dopo la consegna della risposta. Importare da `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Crea una fixture del registro dei plugin dei canali. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Crea una fixture vuota del registro dei plugin. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installa una fixture del registro per i test del runtime dei plugin. Importare da `plugin-sdk/plugin-test-runtime` o `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Acquisisce le richieste fetch JSON nei test degli helper multimediali. Importare da `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Esegue i test su un server HTTP locale temporaneo. Importare da `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Crea un oggetto minimale per una richiesta HTTP in entrata. Importare da `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Esegue i test fetch con gli hook di preconnessione installati. Importare da `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Modifica temporaneamente le variabili di ambiente. Importare da `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Crea fixture isolate del file system per i test. Importare da `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Crea un mock minimale della risposta del server HTTP. Importare da `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Crea fixture fetch per l'utilizzo dei provider. Importare da `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Blocca e ripristina i timer per i test sensibili al tempo. Importare da `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Acquisisce l'output del runtime della CLI nei test. Importare da `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importa un modulo ESM con un nuovo token di query per ignorare la cache dei moduli. Importare da `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Risolve i percorsi delle fixture di origine o di distribuzione dei plugin inclusi. Importare da `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Installa mock Vitest circoscritti per i moduli integrati di Node. Importare da `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Crea i contesti di test della sandbox. Importare da `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Scrive fixture per le Skills. Importare da `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Crea fixture dei messaggi delle trascrizioni degli agenti. Importare da `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Esamina e reimposta le fixture degli eventi di sistema. Importare da `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanitizza l'output del terminale per le verifiche. Importare da `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Verifica la struttura dell'output suddiviso in blocchi. Importare da `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Mantiene i tipi letterali per i test basati su tabelle. Importare da `plugin-sdk/test-fixtures`                                                    |

Le suite di contratti dei plugin inclusi utilizzano inoltre questi sottopercorsi di test dell'SDK per
gli helper di fixture di registro, manifest, artefatti pubblici e runtime riservati ai test.
Le suite riservate al core che dipendono dall'inventario OpenClaw incluso rimangono invece in
`src/plugins/contracts`.

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

## Test della risoluzione della destinazione

Usare `installCommonResolveTargetErrorCases` per aggiungere i casi di errore standard per la
risoluzione della destinazione del canale:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("risoluzione della destinazione di my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logica di risoluzione della destinazione del canale
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Aggiungere casi di test specifici del canale
  it("dovrebbe risolvere le destinazioni @username", () => {
    // ...
  });
});
```

## Modelli di test

### Test dei contratti di registrazione

Gli unit test che passano un mock `api` scritto manualmente a `register(api)` non
esercitano i controlli di accettazione del loader di OpenClaw. Aggiungere almeno uno
smoke test basato sul loader per ogni superficie di registrazione da cui dipende il Plugin,
in particolare gli hook e le funzionalità esclusive come la memoria.

Il loader reale non riesce a registrare il Plugin quando mancano i metadati obbligatori o
un Plugin chiama un'API di una funzionalità che non gli appartiene. Ad esempio,
`api.registerHook(...)` richiede un nome di hook e
`api.registerMemoryCapability(...)` richiede che il manifesto del Plugin o la voce
esportata dichiari `kind: "memory"`.

### Test dell'accesso alla configurazione in fase di esecuzione

Preferire il mock condiviso del runtime del Plugin fornito da `openclaw/plugin-sdk/plugin-test-runtime`.
I relativi mock `runtime.config.loadConfig()` e `runtime.config.writeConfigFile(...)`
generano un errore per impostazione predefinita, affinché i test rilevino nuovi utilizzi delle API
di compatibilità deprecate. Sovrascrivere questi mock solo quando il test verifica esplicitamente
il comportamento di compatibilità legacy.

### Unit test di un Plugin di canale

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("dovrebbe risolvere l'account dalla configurazione", () => {
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

  it("dovrebbe esaminare l'account senza materializzare i segreti", () => {
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

### Unit test di un Plugin provider

```typescript
import { describe, it, expect } from "vitest";

describe("Plugin my-provider", () => {
  it("dovrebbe risolvere i modelli dinamici", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contesto
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("dovrebbe restituire il catalogo quando è disponibile una chiave API", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contesto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simulazione del runtime del Plugin

Per il codice che usa `createPluginRuntimeStore`, simulare il runtime nei test:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "runtime di test non impostato",
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
  // ... altri namespace
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Dopo i test
store.clearRuntime();
```

### Test con stub per istanza

Preferire gli stub per istanza alla modifica del prototipo:

```typescript
// Preferito: stub per istanza
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Da evitare: modifica del prototipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Test dei contratti (Plugin nel repository)

I Plugin inclusi dispongono di test dei contratti che verificano la titolarità della registrazione:

```bash
pnpm test src/plugins/contracts/
```

Questi test verificano:

- Quali Plugin registrano quali provider
- Quali Plugin registrano quali provider vocali
- Correttezza della struttura di registrazione
- Conformità al contratto del runtime

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

`scripts/run-additional-boundary-checks.mjs` esegue in CI una serie di controlli `lint:plugins:*`
sui confini delle importazioni; ciascuno può essere eseguito anche autonomamente in locale:

| Comando                                                        | Vincolo applicato                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | I Plugin inclusi non possono importare il barrel radice monolitico `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | I file di produzione delle estensioni non possono importare direttamente l'albero `src/**` del repository (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | I file di test delle estensioni non possono importare `plugin-sdk/test-utils` o altri helper di test riservati al core. |

I Plugin esterni non sono soggetti a queste regole di lint, ma è consigliabile seguire gli stessi
modelli.

## Configurazione dei test

OpenClaw usa Vitest 4 con report informativi sulla copertura V8. Per i test dei Plugin:

```bash
# Eseguire tutti i test
pnpm test

# Eseguire i test di un Plugin specifico
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Eseguire con un filtro specifico sul nome del test
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Eseguire con la copertura
pnpm test:coverage
```

Se le esecuzioni locali causano un'elevata pressione sulla memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Risorse correlate

- [Panoramica dell'SDK](/it/plugins/sdk-overview) -- convenzioni di importazione
- [Plugin di canale dell'SDK](/it/plugins/sdk-channel-plugins) -- interfaccia dei Plugin di canale
- [Plugin provider dell'SDK](/it/plugins/sdk-provider-plugins) -- hook dei Plugin provider
- [Creazione di Plugin](/it/plugins/building-plugins) -- guida introduttiva
