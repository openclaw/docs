---
read_when:
    - Vous écrivez des tests pour un plugin
    - Vous avez besoin des utilitaires de test du SDK de Plugin
    - Vous souhaitez comprendre les tests de contrat pour les plugins intégrés
sidebarTitle: Testing
summary: Utilitaires et modèles de test pour les plugins OpenClaw
title: Tests des Plugins
x-i18n:
    generated_at: "2026-07-12T02:57:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Référence des utilitaires, modèles et règles de lint pour les tests des
plugins OpenClaw.

<Tip>
  **Vous cherchez des exemples de tests ?** Les guides pratiques comprennent des exemples de tests détaillés :
  [Tests des plugins de canal](/fr/plugins/sdk-channel-plugins#step-6-test) et
  [Tests des plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitaires de test

Ces sous-chemins sont des points d’entrée vers le code source local au dépôt pour les tests des
plugins intégrés d’OpenClaw. Ils ne sont pas publiés en tant qu’exports `package.json` pour les
plugins tiers et peuvent importer Vitest ou d’autres dépendances de test propres au dépôt.

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

Privilégiez ces sous-chemins ciblés pour les nouveaux tests de plugins intégrés. Le point d’entrée
général `openclaw/plugin-sdk/testing` et l’alias `openclaw/plugin-sdk/test-utils`
ne servent qu’à la compatibilité héritée : `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rejette tout nouvel import de
l’un ou l’autre dans les fichiers de test des extensions, et tous deux sont conservés uniquement pour les
tests de vérification de la compatibilité.

### Exports disponibles

| Export                                               | Objectif                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Créer un mock minimal de l’API de Plugin pour les tests unitaires d’enregistrement direct. Importer depuis `plugin-sdk/plugin-test-api` |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture de contrat partagé de profil d’authentification pour les adaptateurs d’exécution d’agent natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture de contrat partagé de suppression de livraison pour les adaptateurs d’exécution d’agent natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture de contrat partagé de classification de repli pour les adaptateurs d’exécution d’agent natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Créer des fixtures de schéma d’outil dynamique pour les tests de contrat d’exécution natif. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Vérifier la structure du contexte entrant du canal. Importer depuis `plugin-sdk/channel-contract-testing` |
| `installChannelOutboundPayloadContractSuite`         | Installer les cas de contrat de charge utile sortante du canal. Importer depuis `plugin-sdk/channel-contract-testing` |
| `createStartAccountContext`                          | Créer des contextes de cycle de vie de compte de canal. Importer depuis `plugin-sdk/channel-test-helpers` |
| `installChannelActionsContractSuite`                 | Installer les cas génériques de contrat d’actions sur les messages du canal. Importer depuis `plugin-sdk/channel-test-helpers` |
| `installChannelSetupContractSuite`                   | Installer les cas génériques de contrat de configuration du canal. Importer depuis `plugin-sdk/channel-test-helpers` |
| `installChannelStatusContractSuite`                  | Installer les cas génériques de contrat d’état du canal. Importer depuis `plugin-sdk/channel-test-helpers` |
| `expectDirectoryIds`                                 | Vérifier les identifiants d’annuaire du canal produits par une fonction de listage d’annuaire. Importer depuis `plugin-sdk/channel-test-helpers` |
| `assertBundledChannelEntries`                        | Vérifier que les points d’entrée des canaux intégrés exposent le contrat public attendu. Importer depuis `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formater des horodatages d’enveloppe déterministes. Importer depuis `plugin-sdk/channel-test-helpers` |
| `expectPairingReplyText`                             | Vérifier le texte de réponse d’association du canal et en extraire le code. Importer depuis `plugin-sdk/channel-test-helpers` |
| `describePluginRegistrationContract`                 | Installer les vérifications du contrat d’enregistrement de Plugin. Importer depuis `plugin-sdk/plugin-test-contracts` |
| `registerSingleProviderPlugin`                       | Enregistrer un Plugin de fournisseur dans les tests de contrôle rapide du chargeur. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugin`                             | Capturer tous les types de fournisseurs d’un Plugin. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `registerProviderPlugins`                            | Capturer les enregistrements de fournisseurs de plusieurs Plugins. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `requireRegisteredProvider`                          | Vérifier qu’une collection de fournisseurs contient un identifiant. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `createRuntimeEnv`                                   | Créer un environnement d’exécution CLI/Plugin simulé. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `createPluginRuntimeMock`                            | Créer une surface d’exécution de Plugin simulée. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `createPluginSetupWizardStatus`                      | Créer des assistants d’état de configuration pour les Plugins de canal. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `createTestWizardPrompter`                           | Créer un gestionnaire d’invites simulé pour l’assistant de configuration. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `createRuntimeTaskFlow`                              | Créer un état isolé de flux de tâches d’exécution. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `runProviderCatalog`                                 | Exécuter un hook de catalogue de fournisseur avec des dépendances de test. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `resolveProviderWizardOptions`                       | Résoudre les choix de l’assistant de configuration du fournisseur dans les tests de contrat. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `resolveProviderModelPickerEntries`                  | Résoudre les entrées du sélecteur de modèles du fournisseur dans les tests de contrat. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `buildProviderPluginMethodChoice`                    | Créer les identifiants de choix de l’assistant du fournisseur pour les assertions. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `setProviderWizardProvidersResolverForTest`          | Injecter les fournisseurs de l’assistant du fournisseur pour les tests isolés. Importer depuis `plugin-sdk/plugin-test-runtime` |
| `describeOpenAIProviderRuntimeContract`              | Installer les vérifications du contrat d’exécution de la famille de fournisseurs. Importer depuis `plugin-sdk/provider-test-contracts` |
| `expectPassthroughReplayPolicy`                      | Vérifier que les politiques de relecture du fournisseur transmettent les outils et métadonnées appartenant au fournisseur. Importer depuis `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Exécuter un test en direct d’un fournisseur STT en temps réel avec des fixtures audio partagées. Importer depuis `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normaliser la sortie de transcription en direct avant les assertions approximatives. Importer depuis `plugin-sdk/provider-test-contracts` |
| `expectExplicitVideoGenerationCapabilities`          | Vérifier que les fournisseurs vidéo déclarent explicitement les capacités de leurs modes de génération. Importer depuis `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Vérifier que les fournisseurs de musique déclarent explicitement leurs capacités de génération et d’édition. Importer depuis `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installer une réponse réussie de tâche vidéo compatible avec DashScope. Importer depuis `plugin-sdk/provider-test-contracts` |
| `getProviderHttpMocks`                               | Accéder aux mocks Vitest HTTP/d’authentification facultatifs du fournisseur. Importer depuis `plugin-sdk/provider-http-test-mocks` |
| `installProviderHttpMockCleanup`                     | Réinitialiser les mocks HTTP/d’authentification du fournisseur après chaque test. Importer depuis `plugin-sdk/provider-http-test-mocks` |
| `installCommonResolveTargetErrorCases`               | Cas de test partagés pour la gestion des erreurs de résolution de cible. Importer depuis `plugin-sdk/channel-target-testing` |
| `shouldAckReaction`                                  | Vérifier si un canal doit ajouter une réaction d’accusé de réception. Importer depuis `plugin-sdk/channel-feedback` |
| `removeAckReactionAfterReply`                        | Supprimer la réaction d’accusé de réception après la livraison de la réponse. Importer depuis `plugin-sdk/channel-feedback` |
| `createTestRegistry`                                 | Créer une fixture de registre de Plugins de canal. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers` |
| `createEmptyPluginRegistry`                          | Créer une fixture de registre de Plugins vide. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers` |
| `setActivePluginRegistry`                            | Installer une fixture de registre pour les tests d’exécution de Plugin. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Capturer les requêtes de récupération JSON dans les tests des assistants multimédias. Importer depuis `plugin-sdk/test-env` |
| `withServer`                                         | Exécuter des tests sur un serveur HTTP local jetable. Importer depuis `plugin-sdk/test-env` |
| `createMockIncomingRequest`                          | Créer un objet minimal de requête HTTP entrante. Importer depuis `plugin-sdk/test-env` |
| `withFetchPreconnect`                                | Exécuter des tests de récupération avec les hooks de préconnexion installés. Importer depuis `plugin-sdk/test-env` |
| `withEnv` / `withEnvAsync`                           | Modifier temporairement les variables d’environnement. Importer depuis `plugin-sdk/test-env` |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Créer des fixtures de test isolées du système de fichiers. Importer depuis `plugin-sdk/test-env` |
| `createMockServerResponse`                           | Créer un mock minimal de réponse de serveur HTTP. Importer depuis `plugin-sdk/test-env` |
| `createProviderUsageFetch`                           | Créer des fixtures de récupération de l’utilisation du fournisseur. Importer depuis `plugin-sdk/test-env` |
| `useFrozenTime` / `useRealTime`                      | Figer et restaurer les minuteurs pour les tests sensibles au temps. Importer depuis `plugin-sdk/test-env` |
| `createCliRuntimeCapture`                            | Capturer la sortie d’exécution de la CLI dans les tests. Importer depuis `plugin-sdk/test-fixtures` |
| `importFreshModule`                                  | Importer un module ESM avec un nouveau jeton de requête pour contourner le cache des modules. Importer depuis `plugin-sdk/test-fixtures` |
| `bundledPluginRoot` / `bundledPluginFile`            | Résoudre les chemins des fixtures de source ou de distribution des Plugins intégrés. Importer depuis `plugin-sdk/test-fixtures` |
| `mockNodeBuiltinModule`                              | Installer des mocks Vitest ciblés pour les modules intégrés de Node. Importer depuis `plugin-sdk/test-node-mocks` |
| `createSandboxTestContext`                           | Créer des contextes de test de bac à sable. Importer depuis `plugin-sdk/test-fixtures` |
| `writeSkill`                                         | Écrire des jeux de données de test pour les Skills. Importer depuis `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Créer des messages de transcription d’agent pour les tests. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecter et réinitialiser les événements système de test. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Nettoyer la sortie du terminal pour les assertions. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Vérifier la structure de la sortie découpée en segments. Importer depuis `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Préserver les types littéraux pour les tests paramétrés par tableau. Importer depuis `plugin-sdk/test-fixtures`                                                    |

Les suites de contrats des plugins intégrés utilisent également ces sous-chemins de test du SDK pour les utilitaires de fixtures réservés aux tests concernant le registre, le manifeste, les artefacts publics et l’environnement d’exécution.
Les suites réservées au cœur qui dépendent de l’inventaire intégré d’OpenClaw restent plutôt sous
`src/plugins/contracts`.

### Types

Les sous-chemins de test ciblés réexportent également des types utiles dans les fichiers de test :

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Résolution des cibles dans les tests

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

## Modèles de test

### Test des contrats d’enregistrement

Les tests unitaires qui transmettent une simulation `api` écrite manuellement à `register(api)` ne
mettent pas en œuvre les contrôles d’acceptation du chargeur d’OpenClaw. Ajoutez au moins un
test de bon fonctionnement reposant sur le chargeur pour chaque surface d’enregistrement dont dépend votre plugin, en particulier
les hooks et les fonctionnalités exclusives telles que la mémoire.

Le véritable chargeur fait échouer l’enregistrement du plugin lorsque des métadonnées requises sont absentes ou
qu’un plugin appelle une API de fonctionnalité dont il n’est pas propriétaire. Par exemple,
`api.registerHook(...)` nécessite un nom de hook, et
`api.registerMemoryCapability(...)` nécessite que le manifeste du plugin ou l’entrée exportée
déclare `kind: "memory"`.

### Test de l’accès à la configuration de l’environnement d’exécution

Préférez la simulation partagée de l’environnement d’exécution du plugin provenant de `openclaw/plugin-sdk/plugin-test-runtime`.
Ses simulations `runtime.config.loadConfig()` et `runtime.config.writeConfigFile(...)`
lèvent une exception par défaut afin que les tests détectent toute nouvelle utilisation d’API de compatibilité
obsolètes. Ne remplacez ces simulations que lorsque le test couvre explicitement
un comportement de compatibilité historique.

### Test unitaire d’un plugin de canal

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

### Test unitaire d’un plugin de fournisseur

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

### Simulation de l’environnement d’exécution du plugin

Pour le code qui utilise `createPluginRuntimeStore`, simulez l’environnement d’exécution dans les tests :

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

### Tests avec des substituts propres à chaque instance

Préférez les substituts propres à chaque instance à la modification du prototype :

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Tests de contrats (plugins du dépôt)

Les plugins intégrés disposent de tests de contrats qui vérifient la propriété des enregistrements :

```bash
pnpm test src/plugins/contracts/
```

Ces tests vérifient :

- Quels plugins enregistrent quels fournisseurs
- Quels plugins enregistrent quels fournisseurs vocaux
- La conformité de la structure d’enregistrement
- La conformité au contrat de l’environnement d’exécution

### Exécution de tests ciblés

Pour un plugin spécifique :

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Pour les tests de contrats uniquement :

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Contrôles du lint (plugins du dépôt)

`scripts/run-additional-boundary-checks.mjs` exécute dans la CI un ensemble de contrôles
`lint:plugins:*` portant sur les limites d’importation ; chacun peut également être exécuté séparément en local :

| Commande                                                       | Règle appliquée                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Les plugins intégrés ne peuvent pas importer le barrel racine monolithique `openclaw/plugin-sdk`.                                     |
| `pnpm run lint:plugins:no-extension-src-imports`               | Les fichiers d’extension de production ne peuvent pas importer directement l’arborescence `src/**` du dépôt (`../../src/...`).        |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Les fichiers de test des extensions ne peuvent pas importer `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` ni d’autres utilitaires de test réservés au cœur. |

Les plugins externes ne sont pas soumis à ces règles de lint, mais il est recommandé de suivre les mêmes
modèles.

## Configuration des tests

OpenClaw utilise Vitest 4 avec des rapports informatifs de couverture V8. Pour les tests des plugins :

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Si les exécutions locales provoquent une pression sur la mémoire :

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Voir aussi

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) -- conventions d’importation
- [Plugins de canal du SDK](/fr/plugins/sdk-channel-plugins) -- interface des plugins de canal
- [Plugins de fournisseur du SDK](/fr/plugins/sdk-provider-plugins) -- hooks des plugins de fournisseur
- [Création de plugins](/fr/plugins/building-plugins) -- guide de prise en main
