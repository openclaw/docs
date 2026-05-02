---
read_when:
    - Vous écrivez des tests pour un Plugin
    - Vous avez besoin des utilitaires de test du SDK de Plugin
    - Vous souhaitez comprendre les tests de contrat pour les plugins intégrés
sidebarTitle: Testing
summary: Utilitaires et modèles de test pour les plugins OpenClaw
title: Tests de Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Référence pour les utilitaires de test, les modèles et l’application des règles de lint pour les plugins OpenClaw.

<Tip>
  **Vous cherchez des exemples de tests ?** Les guides pratiques incluent des exemples de tests détaillés :
  [Tests de plugin de canal](/fr/plugins/sdk-channel-plugins#step-6-test) et
  [Tests de plugin de fournisseur](/fr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitaires de test

**Import du mock d’API Plugin :** `openclaw/plugin-sdk/plugin-test-api`

**Import du contrat d’exécution agent :** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import du contrat de canal :** `openclaw/plugin-sdk/channel-contract-testing`

**Import de l’assistant de test de canal :** `openclaw/plugin-sdk/channel-test-helpers`

**Import du test de cible de canal :** `openclaw/plugin-sdk/channel-target-testing`

**Import du contrat Plugin :** `openclaw/plugin-sdk/plugin-test-contracts`

**Import du test d’exécution Plugin :** `openclaw/plugin-sdk/plugin-test-runtime`

**Import du contrat fournisseur :** `openclaw/plugin-sdk/provider-test-contracts`

**Import du mock HTTP fournisseur :** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import de test d’environnement/réseau :** `openclaw/plugin-sdk/test-env`

**Import de fixture générique :** `openclaw/plugin-sdk/test-fixtures`

**Import du mock intégré Node :** `openclaw/plugin-sdk/test-node-mocks`

Préférez les sous-chemins ciblés ci-dessous pour les nouveaux tests de plugins. Le barrel large
`openclaw/plugin-sdk/testing` est réservé à la compatibilité héritée.
Les garde-fous du dépôt rejettent les nouveaux imports réels depuis `plugin-sdk/testing` et
`plugin-sdk/test-utils` ; ces noms ne restent que comme surfaces de compatibilité obsolètes
pour les plugins externes et les tests d’enregistrement de compatibilité.

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

### Exports disponibles

| Exportation                                          | Objectif                                                                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Construire un mock minimal d’API de plugin pour les tests unitaires d’enregistrement direct. Importer depuis `plugin-sdk/plugin-test-api`                |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture partagée de contrat de profil d’authentification pour les adaptateurs d’exécution d’agent natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture partagée de contrat de suppression de livraison pour les adaptateurs d’exécution d’agent natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture partagée de contrat de classification de repli pour les adaptateurs d’exécution d’agent natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Construire des fixtures de schéma d’outil dynamique pour les tests de contrat d’exécution native. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Vérifier la forme du contexte entrant du canal. Importer depuis `plugin-sdk/channel-contract-testing`                                                     |
| `installChannelOutboundPayloadContractSuite`         | Installer les cas de contrat de charge utile sortante du canal. Importer depuis `plugin-sdk/channel-contract-testing`                                     |
| `createStartAccountContext`                          | Construire des contextes de cycle de vie de compte de canal. Importer depuis `plugin-sdk/channel-test-helpers`                                            |
| `installChannelActionsContractSuite`                 | Installer les cas génériques de contrat d’action de message de canal. Importer depuis `plugin-sdk/channel-test-helpers`                                   |
| `installChannelSetupContractSuite`                   | Installer les cas génériques de contrat de configuration de canal. Importer depuis `plugin-sdk/channel-test-helpers`                                      |
| `installChannelStatusContractSuite`                  | Installer les cas génériques de contrat d’état de canal. Importer depuis `plugin-sdk/channel-test-helpers`                                                |
| `expectDirectoryIds`                                 | Vérifier les identifiants de répertoire de canal à partir d’une fonction de liste de répertoires. Importer depuis `plugin-sdk/channel-test-helpers`       |
| `assertBundledChannelEntries`                        | Vérifier que les points d’entrée de canal groupés exposent le contrat public attendu. Importer depuis `plugin-sdk/channel-test-helpers`                   |
| `formatEnvelopeTimestamp`                            | Formater des horodatages d’enveloppe déterministes. Importer depuis `plugin-sdk/channel-test-helpers`                                                     |
| `expectPairingReplyText`                             | Vérifier le texte de réponse d’appairage du canal et en extraire le code. Importer depuis `plugin-sdk/channel-test-helpers`                              |
| `describePluginRegistrationContract`                 | Installer les vérifications du contrat d’enregistrement de plugin. Importer depuis `plugin-sdk/plugin-test-contracts`                                     |
| `registerSingleProviderPlugin`                       | Enregistrer un plugin de fournisseur dans les tests smoke du chargeur. Importer depuis `plugin-sdk/plugin-test-runtime`                                   |
| `registerProviderPlugin`                             | Capturer tous les types de fournisseurs depuis un plugin. Importer depuis `plugin-sdk/plugin-test-runtime`                                                |
| `registerProviderPlugins`                            | Capturer les enregistrements de fournisseurs sur plusieurs plugins. Importer depuis `plugin-sdk/plugin-test-runtime`                                      |
| `requireRegisteredProvider`                          | Vérifier qu’une collection de fournisseurs contient un identifiant. Importer depuis `plugin-sdk/plugin-test-runtime`                                      |
| `createRuntimeEnv`                                   | Construire un environnement d’exécution CLI/plugin simulé. Importer depuis `plugin-sdk/plugin-test-runtime`                                               |
| `createPluginSetupWizardStatus`                      | Construire des helpers d’état de configuration pour les plugins de canal. Importer depuis `plugin-sdk/plugin-test-runtime`                                |
| `describeOpenAIProviderRuntimeContract`              | Installer les vérifications du contrat d’exécution de famille de fournisseurs. Importer depuis `plugin-sdk/provider-test-contracts`                       |
| `expectPassthroughReplayPolicy`                      | Vérifier que les politiques de relecture de fournisseur transmettent les outils et métadonnées appartenant au fournisseur. Importer depuis `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Exécuter un test fournisseur STT temps réel en direct avec des fixtures audio partagées. Importer depuis `plugin-sdk/provider-test-contracts`             |
| `normalizeTranscriptForMatch`                        | Normaliser la sortie de transcription en direct avant les assertions approximatives. Importer depuis `plugin-sdk/provider-test-contracts`                  |
| `expectExplicitVideoGenerationCapabilities`          | Vérifier que les fournisseurs vidéo déclarent des capacités explicites de mode de génération. Importer depuis `plugin-sdk/provider-test-contracts`         |
| `expectExplicitMusicGenerationCapabilities`          | Vérifier que les fournisseurs de musique déclarent des capacités explicites de génération/modification. Importer depuis `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installer une réponse de tâche vidéo réussie compatible avec DashScope. Importer depuis `plugin-sdk/provider-test-contracts`                              |
| `getProviderHttpMocks`                               | Accéder aux mocks Vitest HTTP/authentification de fournisseur à activation explicite. Importer depuis `plugin-sdk/provider-http-test-mocks`               |
| `installProviderHttpMockCleanup`                     | Réinitialiser les mocks HTTP/authentification de fournisseur après chaque test. Importer depuis `plugin-sdk/provider-http-test-mocks`                     |
| `installCommonResolveTargetErrorCases`               | Cas de test partagés pour la gestion des erreurs de résolution de cible. Importer depuis `plugin-sdk/channel-target-testing`                              |
| `shouldAckReaction`                                  | Vérifier si un canal doit ajouter une réaction d’accusé de réception. Importer depuis `plugin-sdk/channel-feedback`                                       |
| `removeAckReactionAfterReply`                        | Supprimer la réaction d’accusé de réception après la livraison de la réponse. Importer depuis `plugin-sdk/channel-feedback`                               |
| `createTestRegistry`                                 | Construire une fixture de registre de plugins de canal. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`             |
| `createEmptyPluginRegistry`                          | Construire une fixture de registre de plugins vide. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`                 |
| `setActivePluginRegistry`                            | Installer une fixture de registre pour les tests d’exécution de plugin. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Capturer les requêtes fetch JSON dans les tests de helper média. Importer depuis `plugin-sdk/test-env`                                                    |
| `withServer`                                         | Exécuter des tests contre un serveur HTTP local jetable. Importer depuis `plugin-sdk/test-env`                                                            |
| `createMockIncomingRequest`                          | Construire un objet minimal de requête HTTP entrante. Importer depuis `plugin-sdk/test-env`                                                               |
| `withFetchPreconnect`                                | Exécuter des tests fetch avec les hooks de préconnexion installés. Importer depuis `plugin-sdk/test-env`                                                  |
| `withEnv` / `withEnvAsync`                           | Modifier temporairement les variables d’environnement. Importer depuis `plugin-sdk/test-env`                                                              |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Créer des fixtures de test de système de fichiers isolées. Importer depuis `plugin-sdk/test-env`                                                          |
| `createMockServerResponse`                           | Créer un mock minimal de réponse de serveur HTTP. Importer depuis `plugin-sdk/test-env`                                                                   |
| `createCliRuntimeCapture`                            | Capturer la sortie d’exécution CLI dans les tests. Importer depuis `plugin-sdk/test-fixtures`                                                             |
| `importFreshModule`                                  | Importer un module ESM avec un jeton de requête frais pour contourner le cache de modules. Importer depuis `plugin-sdk/test-fixtures`                     |
| `bundledPluginRoot` / `bundledPluginFile`            | Résoudre les chemins de fixtures de source ou de dist de plugin groupé. Importer depuis `plugin-sdk/test-fixtures`                                       |
| `mockNodeBuiltinModule`                              | Installer des mocks Vitest ciblés pour les modules intégrés Node. Importer depuis `plugin-sdk/test-node-mocks`                                            |
| `createSandboxTestContext`                           | Construire des contextes de test sandbox. Importer depuis `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Écrire des fixtures de Skills. Importer depuis `plugin-sdk/test-fixtures`                                                                                 |
| `makeAgentAssistantMessage`                          | Construire des fixtures de messages de transcription d’agent. Importer depuis `plugin-sdk/test-fixtures`                                                  |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecter et réinitialiser les fixtures d’événements système. Importer depuis `plugin-sdk/test-fixtures`                                                  |
| `sanitizeTerminalText`                               | Nettoyer la sortie du terminal pour les assertions. Importer depuis `plugin-sdk/test-fixtures`                                                            |
| `countLines` / `hasBalancedFences`                   | Vérifier la forme de la sortie de découpage en blocs. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `runProviderCatalog`                                 | Exécuter un hook de catalogue de fournisseurs avec des dépendances de test                                                                                 |
| `resolveProviderWizardOptions`                       | Résoudre les choix de l’assistant de configuration du fournisseur dans les tests de contrat                                                               |
| `resolveProviderModelPickerEntries`                  | Résoudre les entrées du sélecteur de modèle de fournisseur dans les tests de contrat                                                                      |
| `buildProviderPluginMethodChoice`                    | Construire des identifiants de choix de l’assistant fournisseur pour les assertions                                                                       |
| `setProviderWizardProvidersResolverForTest`          | Injecter des fournisseurs de l’assistant fournisseur pour des tests isolés                                                                                |
| `createProviderUsageFetch`                           | Construire des fixtures de récupération de l’utilisation des fournisseurs                                                               |
| `useFrozenTime` / `useRealTime`                      | Figer et restaurer les minuteurs pour les tests sensibles au temps. Importer depuis `plugin-sdk/test-env`                                |
| `createTestWizardPrompter`                           | Construire un prompteur d’assistant de configuration simulé                                                                              |
| `createRuntimeTaskFlow`                              | Créer un état de flux de tâches d’exécution isolé                                                                                        |
| `typedCases`                                         | Préserver les types littéraux pour les tests pilotés par table. Importer depuis `plugin-sdk/test-fixtures`                               |

Les suites de contrats des plugins intégrés utilisent aussi des sous-chemins de test du SDK pour les assistants de registre, de manifeste, d’artefact public et de fixtures d’environnement d’exécution réservés aux tests. Les suites propres au cœur qui dépendent de l’inventaire OpenClaw intégré restent sous `src/plugins/contracts`.
Gardez les nouveaux tests d’extension sur un sous-chemin SDK ciblé documenté comme
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` ou `plugin-sdk/test-fixtures`, plutôt que d’importer directement le vaste barrel de compatibilité `plugin-sdk/testing`, les fichiers `src/**` du dépôt ou les passerelles `test/helpers/*` du dépôt.

### Types

Les sous-chemins de test ciblés réexportent aussi des types utiles dans les fichiers de test :

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Résolution des cibles de test

Utilisez `installCommonResolveTargetErrorCases` pour ajouter les cas d’erreur standard de résolution des cibles de canal :

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

## Schémas de test

### Tester les contrats d’enregistrement

Les tests unitaires qui transmettent un mock `api` écrit à la main à `register(api)` n’exercent pas les portes d’acceptation du chargeur d’OpenClaw. Ajoutez au moins un test smoke adossé au chargeur pour chaque surface d’enregistrement dont votre plugin dépend, en particulier les hooks et les capacités exclusives comme la mémoire.

Le vrai chargeur fait échouer l’enregistrement du plugin lorsque des métadonnées requises sont manquantes ou qu’un plugin appelle une API de capacité qu’il ne possède pas. Par exemple, `api.registerHook(...)` exige un nom de hook, et `api.registerMemoryCapability(...)` exige que le manifeste du plugin ou l’entrée exportée déclare `kind: "memory"`.

### Tester l’accès à la configuration d’exécution

Préférez le mock partagé d’environnement d’exécution de plugin depuis `openclaw/plugin-sdk/channel-test-helpers` lorsque vous testez des plugins de canal intégrés. Ses mocks obsolètes `runtime.config.loadConfig()` et `runtime.config.writeConfigFile(...)` lèvent une exception par défaut afin que les tests détectent les nouvelles utilisations des API de compatibilité. Remplacez ces mocks uniquement lorsque le test couvre explicitement un comportement de compatibilité hérité.

### Tester unitairement un plugin de canal

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

### Tester unitairement un plugin de fournisseur

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

### Mocker l’environnement d’exécution du plugin

Pour le code qui utilise `createPluginRuntimeStore`, mockez l’environnement d’exécution dans les tests :

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

### Tester avec des stubs par instance

Préférez les stubs par instance à la mutation de prototype :

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Tests de contrat (plugins du dépôt)

Les plugins intégrés disposent de tests de contrat qui vérifient la propriété de l’enregistrement :

```bash
pnpm test -- src/plugins/contracts/
```

Ces tests vérifient :

- Quels plugins enregistrent quels fournisseurs
- Quels plugins enregistrent quels fournisseurs vocaux
- L’exactitude de la forme d’enregistrement
- La conformité au contrat d’environnement d’exécution

### Exécuter des tests limités à un périmètre

Pour un plugin spécifique :

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Pour les tests de contrat uniquement :

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Application du lint (plugins du dépôt)

Trois règles sont appliquées par `pnpm check` pour les plugins du dépôt :

1. **Aucun import monolithique racine** -- le barrel racine `openclaw/plugin-sdk` est rejeté
2. **Aucun import direct de `src/`** -- les plugins ne peuvent pas importer directement `../../src/`
3. **Aucun auto-import** -- les plugins ne peuvent pas importer leur propre sous-chemin `plugin-sdk/<name>`

Les plugins externes ne sont pas soumis à ces règles de lint, mais il est recommandé de suivre les mêmes schémas.

## Configuration des tests

OpenClaw utilise Vitest avec des seuils de couverture V8. Pour les tests de plugins :

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

Si les exécutions locales causent une pression mémoire :

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Connexe

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) -- conventions d’import
- [Plugins de canal du SDK](/fr/plugins/sdk-channel-plugins) -- interface des plugins de canal
- [Plugins de fournisseur du SDK](/fr/plugins/sdk-provider-plugins) -- hooks des plugins de fournisseur
- [Créer des plugins](/fr/plugins/building-plugins) -- guide de démarrage
