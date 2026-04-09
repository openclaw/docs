---
read_when:
    - Vous avez besoin de savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d'enregistrement sur OpenClawPluginApi
    - Vous recherchez un export spécifique du SDK
sidebarTitle: SDK Overview
summary: Map des imports, référence de l'API d'enregistrement et architecture du SDK
title: Vue d'ensemble du SDK de plugin
x-i18n:
    generated_at: "2026-04-09T01:31:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf205af060971931df97dca4af5110ce173d2b7c12f56ad7c62d664a402f2381
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d'ensemble du SDK de plugin

Le SDK de plugin est le contrat typé entre les plugins et le core. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Prise en main](/fr/plugins/building-plugins)
  - Plugin de canal ? Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  - Plugin fournisseur ? Voir [Plugins fournisseurs](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d'import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela permet un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les aides d'entrée/de build spécifiques aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface parapluie plus large et les aides partagées telles que
`buildChannelConfigSchema`.

N'ajoutez pas et ne dépendez pas de points d'accès de commodité nommés d'après des fournisseurs tels que
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ou
d'aides de marque de canal. Les plugins groupés doivent composer des
sous-chemins génériques du SDK dans leurs propres barrels `api.ts` ou `runtime-api.ts`, et le core
doit soit utiliser ces barrels locaux au plugin, soit ajouter un contrat SDK générique et étroit
lorsque le besoin est réellement transversal aux canaux.

La map d'exports générée contient encore un petit ensemble de
points d'accès d'aide pour plugins groupés tels que `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ces
sous-chemins existent uniquement pour la maintenance et la compatibilité des plugins groupés ; ils sont
volontairement omis du tableau commun ci-dessous et ne constituent pas le chemin
d'import recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par usage. La liste complète générée de
plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins réservés d'aide aux plugins groupés apparaissent toujours dans cette liste générée.
Considérez-les comme des surfaces de détail d'implémentation/de compatibilité, sauf si une page de documentation
en promeut explicitement une comme publique.

### Entrée de plugin

| Subpath                     | Key exports                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Aides partagées pour l'assistant de configuration, invites d'allowlist, constructeurs d'état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Aides multi-comptes pour la configuration/les barrières d'action, aides de repli sur le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, aides de normalisation d'ID de compte |
    | `plugin-sdk/account-resolution` | Recherche de compte + aides de repli par défaut |
    | `plugin-sdk/account-helpers` | Aides étroites pour la liste d'actions/listes de comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Aides de normalisation/validation des commandes personnalisées Telegram avec repli sur le contrat groupé |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Aides partagées de routage entrant + de construction d'enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Aides partagées d'enregistrement et d'envoi de réponse en entrée |
    | `plugin-sdk/messaging-targets` | Aides d'analyse/de correspondance des cibles |
    | `plugin-sdk/outbound-media` | Aides partagées de chargement de médias sortants |
    | `plugin-sdk/outbound-runtime` | Aides de délégation d'identité/d'envoi sortant |
    | `plugin-sdk/thread-bindings-runtime` | Cycle de vie des liaisons de threads et aides d'adaptateur |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de payload média d'agent |
    | `plugin-sdk/conversation-runtime` | Aides de liaison conversation/thread, appairage et liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Aide d'instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Aides de résolution de stratégie de groupe runtime |
    | `plugin-sdk/channel-status` | Aides partagées d'instantané/résumé d'état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives étroites de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Aides d'autorisation d'écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Aides de lecture/modification de configuration d'allowlist |
    | `plugin-sdk/group-access` | Aides partagées de décision d'accès de groupe |
    | `plugin-sdk/direct-dm` | Aides partagées d'authentification/protection pour les messages directs |
    | `plugin-sdk/interactive-runtime` | Aides de normalisation/réduction des payloads de réponse interactive |
    | `plugin-sdk/channel-inbound` | Aides de debounce entrant, correspondance de mention, stratégie de mention et enveloppes |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Aides d'analyse/de correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Aides étroites du contrat de secrets telles que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, et types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins fournisseur">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Aides organisées de configuration de fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Aides ciblées de configuration de fournisseurs autohébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut de backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Aides runtime de résolution de clé API pour les plugins fournisseurs |
    | `plugin-sdk/provider-auth-api-key` | Aides d'onboarding/d'écriture de profil de clé API telles que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d'authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Aides interactives partagées de connexion pour les plugins fournisseurs |
    | `plugin-sdk/provider-env-vars` | Aides de recherche des variables d'environnement d'authentification fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de stratégie de relecture, aides de point de terminaison fournisseur et aides de normalisation d'ID de modèle telles que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Aides génériques HTTP/capacités de point de terminaison fournisseur |
    | `plugin-sdk/provider-web-fetch-contract` | Aides étroites de contrat pour la configuration/la sélection de récupération web telles que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Aides d'enregistrement/cache pour fournisseurs de récupération web |
    | `plugin-sdk/provider-web-search-config-contract` | Aides étroites de configuration/d'identifiants de recherche web pour les fournisseurs qui n'ont pas besoin du câblage d'activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Aides étroites de contrat pour la configuration/les identifiants de recherche web telles que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et des accesseurs/setters d'identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Aides runtime d'enregistrement/cache pour fournisseurs de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage du schéma Gemini + diagnostics, et aides de compatibilité xAI telles que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, et aides partagées de wrappers Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Aides de patch de configuration d'onboarding |
    | `plugin-sdk/global-singleton` | Aides de singleton/map/cache local au processus |
  </Accordion>

  <Accordion title="Sous-chemins d'authentification et de sécurité">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, aides de registre de commandes, aides d'autorisation d'expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d'aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Aides de résolution d'approbateur et d'authentification d'action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Aides natives de profil/filtre d'approbation exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d'approbation |
    | `plugin-sdk/approval-gateway-runtime` | Aide partagée de résolution d'approbation dans la gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Aides légères de chargement d'adaptateur natif d'approbation pour les points d'entrée de canaux critiques |
    | `plugin-sdk/approval-handler-runtime` | Aides runtime plus larges pour le gestionnaire d'approbation ; préférez les points d'accès plus étroits adapter/gateway lorsqu'ils suffisent |
    | `plugin-sdk/approval-native-runtime` | Aides natives de cible d'approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Aides de payload de réponse pour approbation exec/plugin |
    | `plugin-sdk/command-auth-native` | Aides natives d'authentification de commande + aides natives de cible de session |
    | `plugin-sdk/command-detection` | Aides partagées de détection de commande |
    | `plugin-sdk/command-surface` | Aides de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Aides étroites de collecte du contrat de secrets pour les surfaces de secret de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Aides étroites `coerceSecretRef` et dactylographie SecretRef pour l'analyse de contrat/configuration de secret |
    | `plugin-sdk/security-runtime` | Aides partagées de confiance, contrôle des DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Aides de liste d'autorisation d'hôtes et de stratégie SSRF pour réseau privé |
    | `plugin-sdk/ssrf-runtime` | Aides de dispatcher épinglé, fetch protégé contre SSRF et stratégie SSRF |
    | `plugin-sdk/secret-input` | Aides d'analyse des entrées secrètes |
    | `plugin-sdk/webhook-ingress` | Aides de requête/cible webhook |
    | `plugin-sdk/webhook-request-guards` | Aides de taille de corps de requête/délai d'expiration |
  </Accordion>

  <Accordion title="Sous-chemins runtime et stockage">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Aides larges de runtime/journalisation/sauvegarde/installation de plugins |
    | `plugin-sdk/runtime-env` | Aides étroites d'environnement runtime, logger, délai, nouvelle tentative et backoff |
    | `plugin-sdk/channel-runtime-context` | Aides génériques d'enregistrement et de recherche du contexte runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Aides partagées de commandes/hooks/http/interaction pour plugins |
    | `plugin-sdk/hook-runtime` | Aides partagées du pipeline de hooks internes/webhook |
    | `plugin-sdk/lazy-runtime` | Aides d'import/binding lazy runtime telles que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Aides d'exécution de processus |
    | `plugin-sdk/cli-runtime` | Aides CLI de mise en forme, d'attente et de version |
    | `plugin-sdk/gateway-runtime` | Aides client Gateway et patch d'état de canal |
    | `plugin-sdk/config-runtime` | Aides de chargement/écriture de configuration |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications des doublons/conflits, même lorsque la surface de contrat Telegram groupée n'est pas disponible |
    | `plugin-sdk/approval-runtime` | Aides d'approbation exec/plugin, constructeurs de capacité d'approbation, aides auth/profil, aides natives de routage/runtime |
    | `plugin-sdk/reply-runtime` | Aides runtime partagées d'entrée/réponse, fragmentation, envoi, heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Aides étroites d'envoi/finalisation de réponse |
    | `plugin-sdk/reply-history` | Aides partagées d'historique de réponse sur courte fenêtre telles que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Aides étroites de fragmentation texte/markdown |
    | `plugin-sdk/session-store-runtime` | Aides de chemin de magasin de session + date de mise à jour |
    | `plugin-sdk/state-paths` | Aides de chemins de répertoires state/OAuth |
    | `plugin-sdk/routing` | Aides de routage/clé de session/liaison de compte telles que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Aides partagées de résumé d'état de canal/compte, valeurs par défaut d'état runtime et aides de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Aides partagées de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Aides de normalisation slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats normalisés stdout/stderr |
    | `plugin-sdk/param-readers` | Lecteurs de paramètres courants d'outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des payloads normalisés depuis des objets de résultat d'outil |
    | `plugin-sdk/tool-send` | Extraire des champs de cible d'envoi canoniques depuis des arguments d'outil |
    | `plugin-sdk/temp-path` | Aides partagées de chemins de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Logger de sous-système et aides de masquage |
    | `plugin-sdk/markdown-table-runtime` | Aides de mode de tableau Markdown |
    | `plugin-sdk/json-store` | Petites aides de lecture/écriture d'état JSON |
    | `plugin-sdk/file-lock` | Aides de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Aides de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Aides runtime/session ACP et envoi de réponse |
    | `plugin-sdk/agent-config-primitives` | Primitives étroites de schéma de configuration runtime d'agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Aides de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Aides de bootstrap d'appareil et de jeton d'appairage |
    | `plugin-sdk/extension-shared` | Primitives d'aide partagées pour canal passif, état et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Aides de réponse de fournisseur/commande `/models` |
    | `plugin-sdk/skill-commands-runtime` | Aides de liste de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Aides natives de registre/build/sérialisation de commandes |
    | `plugin-sdk/provider-zai-endpoint` | Aides de détection de point de terminaison Z.A.I |
    | `plugin-sdk/infra-runtime` | Aides d'événements système/heartbeat |
    | `plugin-sdk/collection-runtime` | Petites aides de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Aides de drapeau et d'événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d'erreurs, mise en forme, aides partagées de classification d'erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Aides fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/host-runtime` | Aides de normalisation de nom d'hôte et d'hôte SCP |
    | `plugin-sdk/retry-runtime` | Aides de configuration et d'exécution de nouvelle tentative |
    | `plugin-sdk/agent-runtime` | Aides de répertoire/identité/espace de travail d'agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire pilotée par la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Aides partagées de récupération/transformation/stockage de médias ainsi que constructeurs de payload média |
    | `plugin-sdk/media-generation-runtime` | Aides partagées de basculement pour génération média, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension média ainsi qu'exports d'aides image/audio orientés fournisseur |
    | `plugin-sdk/text-runtime` | Aides partagées de texte/markdown/journalisation telles que suppression de texte visible par l'assistant, rendu/fragmentation/tableaux Markdown, aides de masquage, aides de balises de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Aide de fragmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de parole ainsi qu'aides orientées fournisseur pour directives, registre et validation |
    | `plugin-sdk/speech-core` | Types partagés de fournisseur de parole, registre, directive et aides de normalisation |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription temps réel et aides de registre |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix temps réel et aides de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d'images |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d'images, aides de basculement, d'authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/de requête/de résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, aides de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/de requête/de résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, aides de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles webhook et aides d'installation de route |
    | `plugin-sdk/webhook-path` | Aides de normalisation de chemin webhook |
    | `plugin-sdk/web-media` | Aides partagées de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK de plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d'aide groupée memory-core pour les aides manager/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d'indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exports du moteur d'embeddings de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Aides multimodales de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Aides de requête de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Aides de secret de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Aides de journal d'événements de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Aides d'état de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Aides runtime CLI de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Aides runtime core de l'hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Aides de fichier/runtime de l'hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les aides runtime core de l'hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les aides de journal d'événements de l'hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les aides de fichier/runtime de l'hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Aides partagées de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime mémoire active pour l'accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les aides d'état de l'hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface d'aide groupée memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins réservés d'aide groupée">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Aides de support du plugin browser groupé (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface d'aide/runtime Matrix groupée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface d'aide/runtime LINE groupée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface d'aide IRC groupée |
    | Aides spécifiques à un canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Points d'accès de compatibilité/d'aide pour canaux groupés |
    | Aides spécifiques à l'authentification/au plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Points d'accès d'aide pour fonctionnalités/plugins groupés ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d'enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement de capacités

| Method                                           | What it registers                |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)         |
| `api.registerCliBackend(...)`                    | Backend CLI local d'inférence    |
| `api.registerChannel(...)`                       | Canal de messagerie              |
| `api.registerSpeechProvider(...)`                | Synthèse vocale / TTS-STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales duplex en temps réel |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d'image/audio/vidéo      |
| `api.registerImageGenerationProvider(...)`       | Génération d'images              |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale              |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                 |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                    |

### Outils et commandes

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d'agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)     |

### Infrastructure

| Method                                         | What it registers                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d'événement                        |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP Gateway       |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway                     |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                       |
| `api.registerService(service)`                 | Service en arrière-plan                 |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                 |
| `api.registerMemoryPromptSupplement(builder)`  | Section additive de prompt adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire |

Les espaces de noms d'administration core réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin essaie d'assigner une
portée plus étroite à une méthode Gateway. Préférez des préfixes spécifiques au plugin pour
les méthodes détenues par le plugin.

### Métadonnées d'enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de niveau supérieur :

- `commands` : racines de commande explicites détenues par l'enregistreur
- `descriptors` : descripteurs de commande au moment de l'analyse utilisés pour l'aide CLI racine,
  le routage et l'enregistrement lazy de CLI de plugin

Si vous voulez qu'une commande de plugin reste chargée en lazy dans le chemin CLI racine normal,
fournissez des `descriptors` couvrant chaque racine de commande de niveau supérieur exposée par cet
enregistreur.

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
        description: "Gérer les comptes Matrix, la vérification, les appareils et l'état du profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n'avez pas besoin d'un enregistrement lazy dans la CLI racine.
Ce chemin de compatibilité eager reste pris en charge, mais il n'installe pas
de placeholders appuyés sur des descripteurs pour le chargement lazy au moment de l'analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d'un
backend CLI IA local tel que `codex-cli`.

- L'`id` du backend devient le préfixe fournisseur dans des références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur garde la priorité. OpenClaw fusionne `agents.defaults.cliBackends.<id>` sur la
  valeur par défaut du plugin avant d'exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu'un backend a besoin de réécritures de compatibilité après la fusion
  (par exemple pour normaliser d'anciennes formes de flags).

### Slots exclusifs

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité mémoire unifiée                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt mémoire                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage mémoire                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime mémoire                                                                                                                                |

### Adaptateurs d'embeddings mémoire

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d'embeddings mémoire pour le plugin actif |

- `registerMemoryCapability` est l'API préférée pour les plugins mémoire exclusifs.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que des plugins compagnons puissent consommer des artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d'atteindre la disposition privée d'un
  plugin mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API héritées compatibles pour plugins mémoire exclusifs.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif d'enregistrer un
  ou plusieurs IDs d'adaptateur d'embeddings (par exemple `openai`, `gemini`, ou un ID personnalisé
  défini par le plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` est résolue par rapport à ces IDs d'adaptateur enregistrés.

### Événements et cycle de vie

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé     |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu'un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme l'absence de décision (comme si `block` était omis), pas comme une surcharge.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu'un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme l'absence de décision (comme si `block` était omis), pas comme une surcharge.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu'un gestionnaire prend en charge l'envoi, les gestionnaires de priorité inférieure et le chemin d'envoi du modèle par défaut sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu'un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme l'absence de décision (comme si `cancel` était omis), pas comme une surcharge.

### Champs de l'objet API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du plugin                                                                                |
| `api.name`               | `string`                  | Nom d'affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultative)                                                             |
| `api.description`        | `string?`                 | Description du plugin (facultative)                                                         |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané runtime en mémoire actif lorsqu'il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au plugin issue de `plugins.entries.<id>.config`                   |
| `api.runtime`            | `PluginRuntime`           | [Aides runtime](/fr/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Logger à portée limitée (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l'entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                            |

## Convention de module interne

À l'intérieur de votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports runtime internes uniquement
  index.ts          # Point d'entrée du plugin
  setup-entry.ts    # Entrée légère réservée à la configuration (facultatif)
```

<Warning>
  N'importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins groupés chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d'entrée publics similaires) préfèrent désormais l'instantané
de configuration runtime actif lorsqu'OpenClaw est déjà en cours d'exécution. Si aucun instantané runtime
n'existe encore, elles se replient sur le fichier de configuration résolu sur le disque.

Les plugins fournisseurs peuvent aussi exposer un barrel de contrat local au plugin et étroit lorsqu'une
aide est intentionnellement spécifique au fournisseur et n'a pas encore sa place dans un sous-chemin SDK générique.
Exemple groupé actuel : le fournisseur Anthropic conserve ses aides de flux Claude dans son propre point d'accès public `api.ts` / `contract-api.ts` au lieu
de promouvoir la logique Anthropic d'en-tête bêta et `service_tier` vers un contrat générique
`plugin-sdk/*`.

Autres exemples groupés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
  des aides de modèles par défaut et des constructeurs de fournisseur temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de fournisseur ainsi que
  des aides d'onboarding/configuration

<Warning>
  Le code de production des extensions doit aussi éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si une aide est réellement partagée, faites-la remonter vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacités au lieu de coupler deux plugins entre eux.
</Warning>

## Liens associés

- [Points d'entrée](/fr/plugins/sdk-entrypoints) — options `definePluginEntry` et `defineChannelPluginEntry`
- [Aides runtime](/fr/plugins/sdk-runtime) — référence complète de l'espace de noms `api.runtime`
- [Configuration et config](/fr/plugins/sdk-setup) — packaging, manifestes, schémas de configuration
- [Tests](/fr/plugins/sdk-testing) — utilitaires de test et règles de lint
- [Migration du SDK](/fr/plugins/sdk-migration) — migration depuis les surfaces dépréciées
- [Internes des plugins](/fr/plugins/architecture) — architecture détaillée et modèle de capacités
