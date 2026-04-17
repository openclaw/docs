---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur `OpenClawPluginApi`
    - Vous recherchez une exportation SDK spécifique
sidebarTitle: SDK Overview
summary: Map d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK Plugin
x-i18n:
    generated_at: "2026-04-17T06:57:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d’ensemble du SDK Plugin

Le SDK Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Premiers pas](/fr/plugins/building-plugins)
  - Plugin de canal ? Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  - Plugin de fournisseur ? Voir [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un module petit et autonome. Cela permet de garder un
démarrage rapide et d’éviter les problèmes de dépendances circulaires. Pour les
helpers d’entrée/de build spécifiques aux canaux, préférez
`openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface parapluie plus large et les helpers partagés tels que
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de surfaces de commodité nommées d’après des fournisseurs comme
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
surfaces helper associées à une marque de canal. Les plugins intégrés doivent
composer des sous-chemins SDK génériques dans leurs propres barrels `api.ts` ou `runtime-api.ts`, et le cœur
doit soit utiliser ces barrels locaux au plugin, soit ajouter un contrat SDK
générique étroit lorsque le besoin est réellement transversal aux canaux.

La map d’exportation générée contient encore un petit ensemble de surfaces helper
pour les plugins intégrés, comme `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ces
sous-chemins n’existent que pour la maintenance et la compatibilité des plugins intégrés ;
ils sont volontairement omis du tableau courant ci-dessous et ne constituent pas
le chemin d’importation recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par usage. La liste
complète générée de plus de 200 sous-chemins se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins helper réservés aux plugins intégrés figurent toujours dans cette
liste générée. Traitez-les comme des surfaces de détail d’implémentation/de compatibilité, sauf si une page de documentation
en promeut explicitement une comme publique.

### Entrée de plugin

| Sous-chemin                | Exportations clés                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportation du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration, invites d’allowlist, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de config/mécanisme de contrôle d’action multi-compte, helpers de repli pour compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte + repli par défaut |
    | `plugin-sdk/account-helpers` | Helpers étroits de liste de comptes/action sur compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de config de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation de commandes personnalisées Telegram avec repli sur contrat intégré |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de route entrante + construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement et de répartition entrante |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/de correspondance de cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-runtime` | Helpers de délégation d’envoi/d’identité sortante |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur pour liaisons de fils |
    | `plugin-sdk/agent-media-payload` | Constructeur historique de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de liaison conversation/fil, appairage et liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de config d’exécution |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de politique de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé de statut de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives étroites de schéma de config de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de config de canal |
    | `plugin-sdk/channel-plugin-common` | Exportations de prélude partagées pour plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lecture/modification de config d’allowlist |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/de garde pour messages directs |
    | `plugin-sdk/interactive-runtime` | Helpers de normalisation/réduction de charge utile de réponse interactive |
    | `plugin-sdk/channel-inbound` | Helpers d’anti-rebond entrant, de correspondance de mention, de politique de mention et d’enveloppe |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers d’analyse/de correspondance de cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage de feedback/réaction |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de contrat de secret comme `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ainsi que les types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers de configuration organisés pour fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers d’exécution de résolution de clé API pour plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’intégration/écriture de profil de clé API comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers partagés de connexion interactive pour plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, helpers de point de terminaison de fournisseur, et helpers de normalisation d’identifiant de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacité HTTP/point de terminaison de fournisseur |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers étroits de contrat de config/sélection web-fetch comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits de config/identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation du plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers étroits de contrat de config/identifiants web-search comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et les setters/getters d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Helpers d’exécution/cache/enregistrement de fournisseur web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrapper de flux, et helpers partagés de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de correctif de config d’intégration |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution d’approbateur et d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal critiques |
    | `plugin-sdk/approval-handler-runtime` | Helpers plus larges du runtime de gestionnaire d’approbation ; préférez les surfaces adaptateur/Gateway plus étroites lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charge utile de réponse d’approbation exec/plugin |
    | `plugin-sdk/command-auth-native` | Helpers natifs d’authentification de commande + helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commande |
    | `plugin-sdk/command-surface` | Helpers de normalisation de corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrat de secret pour les surfaces de secret de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l’analyse de contrat de secret/config |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, contrôle DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF d’allowlist d’hôtes et de réseau privé |
    | `plugin-sdk/ssrf-runtime` | Helpers de répartiteur épinglé, fetch protégé par SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille du corps de requête/délai d’attente |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers larges de runtime/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Helpers étroits d’environnement de runtime, logger, délai d’attente, retry et backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche du contexte d’exécution de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de commande/hook/http/interaction de plugin |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Helpers d’importation/de liaison de runtime paresseux tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers de formatage, d’attente et de version pour CLI |
    | `plugin-sdk/gateway-runtime` | Helpers de client Gateway et de correctif de statut de canal |
    | `plugin-sdk/config-runtime` | Helpers de chargement/écriture de config |
    | `plugin-sdk/telegram-command-config` | Normalisation du nom/de la description de commande Telegram et vérifications de doublon/conflit, même lorsque la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation exec/plugin, constructeurs de capacité d’approbation, helpers d’authentification/profil, helpers natifs de routage/runtime |
    | `plugin-sdk/reply-runtime` | Helpers partagés du runtime entrant/de réponse, segmentation, répartition, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de répartition/finalisation de réponse |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponse sur fenêtre courte tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers étroits de segmentation de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin du magasin de session + date de mise à jour |
    | `plugin-sdk/state-paths` | Helpers de chemin de répertoire pour état/OAuth |
    | `plugin-sdk/routing` | Helpers de routage/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé de statut de canal/compte, valeurs par défaut de l’état d’exécution et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL de chaîne à partir d’entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs courants de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées à partir d’objets résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs de cible d’envoi canoniques à partir des arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Helpers de logger de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode de tableau Markdown |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication sauvegardé sur disque |
    | `plugin-sdk/acp-runtime` | Helpers ACP de runtime/session et de répartition de réponse |
    | `plugin-sdk/agent-config-primitives` | Primitives étroites de schéma de config du runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de nom dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers d’initialisation d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives helper partagées pour canal passif, statut et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de fournisseur/commande `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de liste de commandes Skills |
    | `plugin-sdk/native-command-registry` | Helpers natifs de registre/construction/sérialisation de commande |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin approuvé pour des harnais d’agent bas niveau : types de harnais, helpers de pilotage/abandon d’exécution active, helpers de pont d’outil OpenClaw et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers de drapeau et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Helpers de graphe d’erreur, formatage, classification d’erreur partagée, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch enveloppé, proxy et recherche épinglée |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Helpers de config de retry et d’exécuteur de retry |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire basée sur la config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias ainsi que constructeurs de charge utile média |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de basculement en cas d’échec pour la génération de médias, sélection de candidats et messagerie de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension des médias ainsi qu’exportations helper orientées fournisseur pour image/audio |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/Markdown/journalisation tels que suppression du texte visible par l’assistant, helpers de rendu/segmentation/tableau Markdown, helpers de masquage, helpers de balise de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de segmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur Speech ainsi qu’helpers orientés fournisseur pour directives, registre et validation |
    | `plugin-sdk/speech-core` | Helpers partagés de types, registre, directive et normalisation pour fournisseur Speech |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription en temps réel et helpers de registre |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix en temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’image |
    | `plugin-sdk/image-generation-core` | Helpers partagés de types, basculement en cas d’échec, authentification et registre pour la génération d’image |
    | `plugin-sdk/music-generation` | Types de fournisseur/de requête/de résultat pour la génération musicale |
    | `plugin-sdk/music-generation-core` | Helpers partagés de types, basculement en cas d’échec, recherche de fournisseur et analyse de référence de modèle pour la génération musicale |
    | `plugin-sdk/video-generation` | Types de fournisseur/de requête/de résultat pour la génération vidéo |
    | `plugin-sdk/video-generation-core` | Helpers partagés de types, basculement en cas d’échec, recherche de fournisseur et analyse de référence de modèle pour la génération vidéo |
    | `plugin-sdk/webhook-targets` | Helpers de registre de cible Webhook et d’installation de route |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper `memory-core` intégrée pour les helpers de gestionnaire/config/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade de runtime pour l’indexation/la recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur de fondation hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embedding hôte mémoire, accès au registre, fournisseur local et helpers génériques de lot/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Helpers de statut hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/runtime hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les helpers de runtime central hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/runtime hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de Markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade de runtime Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les helpers de statut hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface helper `memory-lancedb` intégrée |
  </Accordion>

  <Accordion title="Sous-chemins helper intégrés réservés">
    | Famille | Sous-chemins actuels | Utilisation prévue |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de support pour le plugin Browser intégré (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix intégrée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE intégrée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC intégrée |
    | Helpers spécifiques à un canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Surfaces de compatibilité/helper de canaux intégrés |
    | Helpers spécifiques à l’authentification/au plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Surfaces helper de fonctionnalités/plugins intégrés ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement de capacités

| Méthode                                         | Ce qu’elle enregistre                  |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerProvider(...)`                     | Inférence de texte (LLM)               |
| `api.registerAgentHarness(...)`                 | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                   | Backend local d’inférence CLI          |
| `api.registerChannel(...)`                      | Canal de messagerie                    |
| `api.registerSpeechProvider(...)`               | Synthèse texte-parole / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription en temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`        | Sessions vocales duplex en temps réel  |
| `api.registerMediaUnderstandingProvider(...)`   | Analyse d’image/audio/vidéo            |
| `api.registerImageGenerationProvider(...)`      | Génération d’image                     |
| `api.registerMusicGenerationProvider(...)`      | Génération musicale                    |
| `api.registerVideoGenerationProvider(...)`      | Génération vidéo                       |
| `api.registerWebFetchProvider(...)`             | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`            | Recherche web                          |

### Outils et commandes

| Méthode                        | Ce qu’elle enregistre                       |
| ----------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`    | Commande personnalisée (contourne le LLM)   |

### Infrastructure

| Méthode                                       | Ce qu’elle enregistre                 |
| --------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`    | Hook d’événement                      |
| `api.registerHttpRoute(params)`               | Point de terminaison HTTP Gateway     |
| `api.registerGatewayMethod(name, handler)`    | Méthode RPC Gateway                   |
| `api.registerCli(registrar, opts?)`           | Sous-commande CLI                     |
| `api.registerService(service)`                | Service en arrière-plan               |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif              |
| `api.registerMemoryPromptSupplement(builder)` | Section additive de prompt adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)` | Corpus additif de recherche/lecture mémoire |

Les espaces de noms d’administration du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin essaie d’assigner une
portée de méthode Gateway plus étroite. Préférez des préfixes spécifiques au plugin pour
les méthodes appartenant au plugin.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de premier niveau :

- `commands` : racines de commande explicites appartenant au registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide de la CLI racine,
  le routage et l’enregistrement paresseux de la CLI du plugin

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gérer les comptes Matrix, la vérification, les appareils et l’état du profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement CLI racine paresseux.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
d’emplacements réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la config par défaut d’un backend CLI
d’IA local tel que `codex-cli`.

- L’`id` du backend devient le préfixe de fournisseur dans des références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La config utilisateur garde la priorité. OpenClaw fusionne `agents.defaults.cliBackends.<id>` sur la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple pour normaliser d’anciennes formes de drapeaux).

### Emplacements exclusifs

| Méthode                                   | Ce qu’elle enregistre                                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`  | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité mémoire unifiée                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt mémoire                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage mémoire                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur de runtime mémoire                                                                                                                           |

### Adaptateurs d’embedding mémoire

| Méthode                                       | Ce qu’elle enregistre                        |
| --------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding mémoire pour le plugin actif |

- `registerMemoryCapability` est l’API de plugin mémoire exclusive préférée.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que des plugins compagnons puissent consommer les artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’atteindre la disposition privée d’un
  plugin mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin mémoire compatibles avec les versions historiques.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embedding (par exemple `openai`, `gemini` ou un identifiant
  personnalisé défini par le plugin).
- La config utilisateur comme `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces identifiants
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                     | Ce qu’elle fait               |
| ------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`          | Hook de cycle de vie typé     |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : retourner `{ block: false }` est traité comme aucune décision (comme si `block` était omis), et non comme une surcharge.
- `before_install` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : retourner `{ block: false }` est traité comme aucune décision (comme si `block` était omis), et non comme une surcharge.
- `reply_dispatch` : retourner `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique la répartition, les gestionnaires de priorité inférieure et le chemin par défaut de répartition du modèle sont ignorés.
- `message_sending` : retourner `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : retourner `{ cancel: false }` est traité comme aucune décision (comme si `cancel` était omis), et non comme une surcharge.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                              |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                          |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de config actuel (instantané actif en mémoire à l’exécution lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Config spécifique au plugin depuis `plugins.entries.<id>.config`                            |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/fr/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger à portée limitée (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant le chargement complet |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                            |

## Convention de module interne

Dans votre plugin, utilisez des fichiers barrel locaux pour les importations internes :

```
my-plugin/
  api.ts            # Exportations publiques pour les consommateurs externes
  runtime-api.ts    # Exportations de runtime réservées à l’interne
  index.ts          # Point d’entrée du plugin
  setup-entry.ts    # Entrée légère réservée à la configuration (facultatif)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les importations internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin du SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins intégrés chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent désormais
l’instantané actif de config d’exécution lorsque OpenClaw est déjà en cours d’exécution. Si aucun instantané
d’exécution n’existe encore, elles reviennent au fichier de config résolu sur le disque.

Les plugins de fournisseur peuvent aussi exposer un barrel de contrat local au plugin et étroit lorsqu’un
helper est intentionnellement spécifique à un fournisseur et n’a pas encore sa place dans un sous-chemin SDK
générique. Exemple intégré actuel : le fournisseur Anthropic conserve ses helpers de flux Claude
dans sa propre surface publique `api.ts` / `contract-api.ts` au lieu de
promouvoir la logique d’en-tête bêta Anthropic et `service_tier` dans un contrat
générique `plugin-sdk/*`.

Autres exemples intégrés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
  des helpers de modèle par défaut et des constructeurs de fournisseur temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de fournisseur ainsi que
  des helpers d’intégration/de config

<Warning>
  Le code de production des extensions doit également éviter les importations `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux plugins entre eux.
</Warning>

## Liens connexes

- [Points d’entrée](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry` et `defineChannelPluginEntry`
- [Helpers de runtime](/fr/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Configuration et config](/fr/plugins/sdk-setup) — empaquetage, manifestes, schémas de config
- [Tests](/fr/plugins/sdk-testing) — utilitaires de test et règles de lint
- [Migration du SDK](/fr/plugins/sdk-migration) — migration depuis des surfaces obsolètes
- [Internes des plugins](/fr/plugins/architecture) — architecture détaillée et modèle de capacités
