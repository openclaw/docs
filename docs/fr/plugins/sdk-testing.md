---
read_when:
    - Vous écrivez des tests pour un plugin
    - Vous avez besoin des utilitaires de test du SDK de Plugin
    - Vous souhaitez comprendre les tests de contrat pour les plugins intégrés
sidebarTitle: Testing
summary: Utilitaires et modèles de test pour les plugins OpenClaw
title: Tests des Plugins
x-i18n:
    generated_at: "2026-07-16T13:41:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
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

Ces sous-chemins sont des points d’entrée de code source locaux au dépôt pour les tests des
plugins intégrés d’OpenClaw. Ce ne sont pas des exports `package.json` publiés pour les
plugins tiers, et ils peuvent importer Vitest ou d’autres dépendances de test propres au dépôt.

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

Utilisez ces sous-chemins ciblés pour les tests des plugins intégrés. L’ancien
baril `openclaw/plugin-sdk/testing`, local au dépôt, était exclu des
paquets distribués et a été supprimé. L’alias historique `openclaw/plugin-sdk/test-utils`
reste local au dépôt ; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) rejette les nouveaux imports de cet alias
dans les tests d’extensions.

### Exports disponibles

| Exportation                                               | Objectif                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Créer une simulation minimale de l’API de Plugin pour les tests unitaires d’enregistrement direct. Importer depuis `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture partagée du contrat de profil d’authentification pour les adaptateurs d’exécution natifs des agents. Importer depuis `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture partagée du contrat de suppression de livraison pour les adaptateurs d’exécution natifs des agents. Importer depuis `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture partagée du contrat de classification des solutions de repli pour les adaptateurs d’exécution natifs des agents. Importer depuis `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Créer des fixtures de schéma d’outils dynamiques pour les tests de contrat des environnements d’exécution natifs. Importer depuis `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Vérifier la structure du contexte entrant du canal. Importer depuis `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installer les cas du contrat de charge utile sortante du canal. Importer depuis `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Créer les contextes de cycle de vie des comptes de canal. Importer depuis `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Installer les cas génériques du contrat d’actions sur les messages du canal. Importer depuis `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Installer les cas génériques du contrat de configuration du canal. Importer depuis `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Installer les cas génériques du contrat d’état du canal. Importer depuis `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Vérifier les identifiants de l’annuaire du canal à partir d’une fonction de listage d’annuaire. Importer depuis `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Vérifier que les points d’entrée des canaux intégrés exposent le contrat public attendu. Importer depuis `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formater des horodatages d’enveloppe déterministes. Importer depuis `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Vérifier le texte de réponse d’appairage du canal et en extraire le code. Importer depuis `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Installer les vérifications du contrat d’enregistrement des plugins. Importer depuis `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Enregistrer un plugin de fournisseur dans les tests de bon fonctionnement du chargeur. Importer depuis `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Capturer tous les types de fournisseurs d’un même plugin. Importer depuis `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Capturer les enregistrements de fournisseurs sur plusieurs plugins. Importer depuis `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Vérifier qu’une collection de fournisseurs contient un identifiant. Importer depuis `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Créer un environnement d’exécution CLI/plugin simulé. Importer depuis `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Créer une surface d’exécution de plugin simulée. Importer depuis `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Créer des utilitaires d’état de configuration pour les plugins de canal. Importer depuis `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Créer une simulation de l’interface d’invite de l’assistant de configuration. Importer depuis `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Créer un état TaskFlow isolé de l’environnement d’exécution. Importer depuis `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Exécuter un hook de catalogue de fournisseur avec des dépendances de test. Importer depuis `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Résoudre les choix de l’assistant de configuration du fournisseur dans les tests de contrat. Importer depuis `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Résoudre les entrées du sélecteur de modèle du fournisseur dans les tests de contrat. Importer depuis `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Créer les identifiants de choix de l’assistant du fournisseur pour les assertions. Importer depuis `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Injecter les fournisseurs de l’assistant du fournisseur pour les tests isolés. Importer depuis `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Installer les vérifications du contrat d’exécution de la famille de fournisseurs. Importer depuis `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Vérifier que les politiques de relecture du fournisseur transmettent les outils et métadonnées détenus par le fournisseur. Importer depuis `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Exécuter un test en direct d’un fournisseur STT en temps réel avec des fixtures audio partagées. Importer depuis `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normaliser la sortie de transcription en direct avant les assertions approximatives. Importer depuis `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Vérifier que les fournisseurs vidéo déclarent des capacités explicites de mode de génération. Importer depuis `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Vérifier que les fournisseurs de musique déclarent des capacités explicites de génération et de modification. Importer depuis `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Installer une réponse réussie de tâche vidéo compatible avec DashScope. Importer depuis `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Accéder aux simulations Vitest HTTP/d’authentification facultatives du fournisseur. Importer depuis `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Réinitialiser les simulations HTTP/d’authentification du fournisseur après chaque test. Importer depuis `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Cas de test partagés pour la gestion des erreurs de résolution de cible. Importer depuis `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Vérifier si un canal doit ajouter une réaction d’accusé de réception. Importer depuis `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Supprimer la réaction d’accusé de réception après la livraison de la réponse. Importer depuis `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Créer une fixture de registre de plugins de canal. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Créer une fixture de registre de plugins vide. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installer une fixture de registre pour les tests d’exécution de plugins. Importer depuis `plugin-sdk/plugin-test-runtime` ou `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Capturer les requêtes de récupération JSON dans les tests des utilitaires multimédias. Importer depuis `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Exécuter les tests sur un serveur HTTP local jetable. Importer depuis `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Créer un objet minimal de requête HTTP entrante. Importer depuis `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Exécuter les tests de récupération avec les hooks de préconnexion installés. Importer depuis `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Modifier temporairement les variables d’environnement. Importer depuis `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Créer des fixtures de test isolées du système de fichiers. Importer depuis `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Créer une simulation minimale de réponse de serveur HTTP. Importer depuis `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Créer des fixtures de récupération de l’utilisation du fournisseur. Importer depuis `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Figer et restaurer les minuteries pour les tests sensibles au temps. Importer depuis `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Capturer la sortie de l’environnement d’exécution CLI dans les tests. Importer depuis `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importer un module ESM avec un nouveau jeton de requête pour contourner le cache des modules. Importer depuis `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Résoudre les chemins des fixtures de source ou de distribution des plugins intégrés. Importer depuis `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Installer des simulations Vitest ciblées des modules intégrés de Node. Importer depuis `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Créer des contextes de test de bac à sable. Importer depuis `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Écrire des fixtures de Skills. Importer depuis `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Créer des fixtures de messages de transcription d’agent. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecter et réinitialiser les fixtures d’événements système. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Nettoyer la sortie du terminal pour les assertions. Importer depuis `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Vérifier la structure de la sortie de découpage. Importer depuis `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Préserver les types littéraux pour les tests pilotés par des tableaux. Importer depuis `plugin-sdk/test-fixtures`                                                    |

Les suites de contrats des plugins intégrés utilisent également ces sous-chemins de test du SDK pour
les utilitaires de fixtures de registre, de manifeste, d’artefacts publics et d’environnement d’exécution réservés aux tests.
Les suites propres au cœur qui dépendent de l’inventaire OpenClaw intégré restent sous
`src/plugins/contracts` à la place.

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

## Test de la résolution des cibles

Utilisez `installCommonResolveTargetErrorCases` pour ajouter les cas d’erreur standard de
résolution des cibles de canal :

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("résolution des cibles de my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logique de résolution des cibles de votre canal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Ajouter des cas de test propres au canal
  it("doit résoudre les cibles @username", () => {
    // ...
  });
});
```

## Modèles de test

### Test des contrats d’enregistrement

Les tests unitaires qui transmettent une simulation `api` écrite manuellement à `register(api)` ne
font pas intervenir les contrôles d’acceptation du chargeur d’OpenClaw. Ajoutez au moins un test de bon fonctionnement
adossé au chargeur pour chaque surface d’enregistrement dont dépend votre plugin, en particulier
les hooks et les capacités exclusives telles que la mémoire.

Le véritable chargeur fait échouer l’enregistrement du plugin lorsque des métadonnées requises sont absentes ou
qu’un plugin appelle une API de capacité dont il n’est pas propriétaire. Par exemple,
`api.registerHook(...)` exige un nom de hook, et
`api.registerMemoryCapability(...)` exige que le manifeste du plugin ou l’entrée
exportée déclare `kind: "memory"`.

### Test de l’accès à la configuration d’exécution

Privilégiez la simulation partagée de l’environnement d’exécution du plugin provenant de `openclaw/plugin-sdk/plugin-test-runtime`.
Ses simulations `runtime.config.loadConfig()` et `runtime.config.writeConfigFile(...)`
lèvent une exception par défaut afin que les tests détectent toute nouvelle utilisation des API de compatibilité
obsolètes. Ne remplacez ces simulations que lorsque le test porte explicitement sur un comportement
de compatibilité hérité.

### Test unitaire d’un plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
  it("doit résoudre le compte depuis la configuration", () => {
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

  it("doit inspecter le compte sans matérialiser les secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Aucune valeur de jeton exposée
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Test unitaire d’un plugin de fournisseur

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("doit résoudre les modèles dynamiques", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contexte
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("doit renvoyer le catalogue lorsqu’une clé d’API est disponible", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contexte
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
  errorMessage: "environnement d’exécution de test non défini",
});

// Dans la préparation du test
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... autres simulations
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... autres espaces de noms
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Après les tests
store.clearRuntime();
```

### Tests avec des substituts propres à chaque instance

Privilégiez les substituts propres à chaque instance plutôt que la modification du prototype :

```typescript
// Recommandé : substitut propre à l’instance
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// À éviter : modification du prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Tests de contrat (plugins du dépôt)

Les plugins intégrés disposent de tests de contrat qui vérifient la propriété des enregistrements :

```bash
pnpm test src/plugins/contracts/
```

Ces tests vérifient :

- Quels plugins enregistrent quels fournisseurs
- Quels plugins enregistrent quels fournisseurs de synthèse vocale
- La conformité de la structure d’enregistrement
- Le respect du contrat d’exécution

### Exécution de tests ciblés

Pour un plugin spécifique :

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Pour les tests de contrat uniquement :

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Application des règles de lint (plugins du dépôt)

`scripts/run-additional-boundary-checks.mjs` exécute un ensemble de contrôles `lint:plugins:*`
des frontières d’importation dans l’intégration continue ; chacun peut également être exécuté séparément en local :

| Commande                                                       | Règle appliquée                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Les plugins intégrés ne peuvent pas importer le module d’exportation racine monolithique `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Les fichiers de production des extensions ne peuvent pas importer directement l’arborescence `src/**` du dépôt (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Les fichiers de test des extensions ne peuvent pas importer `plugin-sdk/test-utils` ni d’autres utilitaires de test réservés au cœur. |

Les plugins externes ne sont pas soumis à ces règles de lint, mais il est recommandé de suivre les mêmes
modèles.

## Configuration des tests

OpenClaw utilise Vitest 4 avec des rapports informatifs de couverture V8. Pour les tests de plugins :

```bash
# Exécuter tous les tests
pnpm test

# Exécuter les tests d’un plugin spécifique
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Exécuter avec un filtre sur un nom de test spécifique
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Exécuter avec la couverture
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
- [Création de plugins](/fr/plugins/building-plugins) -- guide de démarrage
