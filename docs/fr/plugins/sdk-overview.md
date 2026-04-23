---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur `OpenClawPluginApi`
    - Vous recherchez un export précis du SDK
sidebarTitle: SDK Overview
summary: Carte d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK Plugin
x-i18n:
    generated_at: "2026-04-23T07:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d’ensemble du SDK Plugin

Le SDK Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier Plugin ? Commencez par [Getting Started](/fr/plugins/building-plugins)
  - Plugin de canal ? Consultez [Channel Plugins](/fr/plugins/sdk-channel-plugins)
  - Plugin de provider ? Consultez [Provider Plugins](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un module petit et autonome. Cela garde un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les assistants d’entrée/de build spécifiques aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; réservez `openclaw/plugin-sdk/core` à
la surface ombrelle plus large et aux assistants partagés tels que
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de surfaces de commodité nommées d’après des providers comme
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
surfaces d’assistance marquées canal. Les plugins groupés doivent composer les sous-chemins génériques
du SDK dans leurs propres barils `api.ts` ou `runtime-api.ts`, et le cœur
doit soit utiliser ces barils locaux au Plugin, soit ajouter un contrat SDK générique étroit
lorsque le besoin est réellement transversal aux canaux.

La carte d’export générée contient encore un petit ensemble de surfaces d’assistance de plugins groupés
telles que `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ces
sous-chemins existent uniquement pour la maintenance et la compatibilité des plugins groupés ; ils sont
intentionnellement omis du tableau courant ci-dessous et ne constituent pas le chemin
d’import recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par objectif. La liste complète générée de
plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins réservés d’assistance aux plugins groupés apparaissent toujours dans cette liste générée.
Traitez-les comme des surfaces de détail d’implémentation/de compatibilité sauf si une page de documentation
en promeut explicitement une comme publique.

### Entrée de Plugin

| Sous-chemin                | Exports clés                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Sous-chemins des canaux">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés d’assistant de configuration, prompts de liste d’autorisation, builders de statut de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants multi-comptes de configuration/garde d’action, assistants de repli sur compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’ID de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte + repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants étroits de liste d’actions/listes de comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types du schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec repli sur contrat groupé |
    | `plugin-sdk/command-gating` | Assistants étroits de garde d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, assistants de cycle de vie/finalisation de flux de brouillon |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante + builder d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés d’enregistrement et de distribution entrante |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/de correspondance de cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-runtime` | Identité sortante, délégué d’envoi et assistants de planification de payload |
    | `plugin-sdk/poll-runtime` | Assistants étroits de normalisation de poll |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur de liaison de fil |
    | `plugin-sdk/agent-media-payload` | Builder historique de payload média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de liaison conversation/fil, appairage et liaisons configurées |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de politique de groupe runtime |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé de statut de canal |
    | `plugin-sdk/channel-config-primitives` | Primitifs étroits de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés de plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de lecture/édition de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès groupe |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/garde de DM direct |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et assistants historiques de réponse interactive. Consultez [Message Presentation](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Baril de compatibilité pour les assistants de debounce entrant, correspondance de mention, politique de mention et enveloppe |
    | `plugin-sdk/channel-mention-gating` | Assistants étroits de politique de mention sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-location` | Assistants de contexte et de formatage de localisation de canal |
    | `plugin-sdk/channel-logging` | Assistants de journalisation de canal pour les abandons entrants et les échecs de typing/ack |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’actions de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-targets` | Assistants d’analyse/de correspondance de cibles |
    | `plugin-sdk/channel-contract` | Types du contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de contrat secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cible secrète |
  </Accordion>

  <Accordion title="Sous-chemins des providers">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Assistants sélectionnés de configuration de provider local/autohébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de provider autohébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Assistants runtime de résolution de clé API pour les plugins de provider |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’onboarding/écriture de profil de clé API tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants partagés de connexion interactive pour les plugins de provider |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de replay, assistants de point de terminaison provider et assistants de normalisation d’ID de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacité HTTP/point de terminaison provider, y compris assistants de formulaire multipart de transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants étroits de contrat config/sélection de web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/cache de provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants étroits de config/d’identifiants web-search pour les providers qui n’ont pas besoin du câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants étroits de contrat config/d’identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/setters d’identifiants limités |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/cache/runtime de provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage + diagnostics de schéma Gemini, et assistants de compat xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, et assistants partagés de wrappers Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Assistants de transport provider natifs tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de patch de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes, assistants d’autorisation de l’expéditeur |
    | `plugin-sdk/command-status` | Builders de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Assistants de résolution d’approbateur et d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation native exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution du gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
    | `plugin-sdk/approval-handler-runtime` | Assistants plus larges du runtime de gestionnaire d’approbation ; préférez les surfaces d’adaptateur/gateway plus étroites lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de payload de réponse d’approbation exec/plugin |
    | `plugin-sdk/command-auth-native` | Assistants natifs d’authentification de commande + de cible de session native |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-surface` | Assistants de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de collecte de contrat secret pour les surfaces secrètes de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants étroits `coerceSecretRef` et de typage SecretRef pour l’analyse contrat secret/config |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF pour liste d’autorisation d’hôte et réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants étroits de dispatcher épinglé sans la large surface infra runtime |
    | `plugin-sdk/ssrf-runtime` | Assistants de dispatcher épinglé, fetch protégé par SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse d’entrée secrète |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille de corps de requête/délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins runtime et stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants larges de runtime/journalisation/sauvegarde/installation de Plugin |
    | `plugin-sdk/runtime-env` | Assistants étroits d’environnement runtime, logger, délai d’expiration, retry et backoff |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche de contexte runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés de commande/hook/http/interaction de Plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de hook Webhook/interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’import/binding runtime paresseux tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants CLI de formatage, attente et version |
    | `plugin-sdk/gateway-runtime` | Assistants de client Gateway et de patch de statut de canal |
    | `plugin-sdk/config-runtime` | Assistants de chargement/écriture de configuration et assistants de recherche de configuration de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalisation du nom/de la description des commandes Telegram et vérifications de doublon/conflit, même lorsque la surface de contrat Telegram groupée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autolien de référence de fichier sans le large baril text-runtime |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation exec/plugin, builders de capacité d’approbation, assistants auth/profil, assistants natifs de routage/runtime |
    | `plugin-sdk/reply-runtime` | Assistants partagés de runtime entrant/réponse, chunking, dispatch, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits de dispatch/finalisation de réponse |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique de réponse sur courte fenêtre tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants étroits de chunking texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin de magasin de session + mis à jour à |
    | `plugin-sdk/state-paths` | Assistants de chemins d’état/répertoire OAuth |
    | `plugin-sdk/routing` | Assistants de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé de statut de canal/compte, valeurs par défaut d’état runtime et assistants de métadonnées de problèmes |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des payloads normalisés depuis des objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis des arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Assistants de logger de sous-système et d’expurgation |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode tableau Markdown |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants runtime/session ACP et dispatch de réponse |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution ACP en lecture seule sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitifs étroits de schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de nom dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitifs d’assistance partagés pour canal passif, statut et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de commande/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listage de commandes Skills |
    | `plugin-sdk/native-command-registry` | Assistants de registre/build/sérialisation de commande native |
    | `plugin-sdk/agent-harness` | Surface expérimentale de Plugin de confiance pour harnais d’agent bas niveau : types de harnais, assistants de pilotage/abandon d’exécution active, assistants de pont d’outil OpenClaw et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection de point de terminaison Z.A.I |
    | `plugin-sdk/infra-runtime` | Assistants d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeau et d’événement diagnostiques |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Assistants de fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch runtime conscient du dispatcher sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface media runtime |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de conversation sans routage de liaison configurée ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Assistants de lecture de magasin de session sans imports larges d’écriture/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité de contexte et filtrage de contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants étroits de coercition et de normalisation de chaîne/enregistrement primitif sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration et d’exécuteur de retry |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/dédup de répertoire adossé à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de fetch/transformation/stockage de médias plus builders de payload média |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de repli de génération média, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de provider de compréhension des médias plus exports d’assistants image/audio orientés provider |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte/Markdown/journalisation tels que suppression de texte visible par l’assistant, assistants de rendu/chunking/tableau Markdown, assistants d’expurgation, assistants de balises de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de chunking de texte sortant |
    | `plugin-sdk/speech` | Types de provider speech plus assistants orientés provider de directive, registre et validation |
    | `plugin-sdk/speech-core` | Types, registre, directive et assistants de normalisation speech partagés |
    | `plugin-sdk/realtime-transcription` | Types de provider de transcription temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de provider de voix temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de provider de génération d’image |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’image, assistants de repli, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de provider/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, assistants de repli, recherche de provider et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de provider/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de repli, recherche de provider et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et assistants d’installation de route |
    | `plugin-sdk/webhook-path` | Assistants de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins Memory">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistance groupée memory-core pour les assistants manager/config/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’index/recherche Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation hôte Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embedding hôte Memory, accès au registre, provider local et assistants génériques de lot/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD hôte Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage hôte Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux hôte Memory |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête hôte Memory |
    | `plugin-sdk/memory-core-host-secret` | Assistants secrets hôte Memory |
    | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements hôte Memory |
    | `plugin-sdk/memory-core-host-status` | Assistants de statut hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants runtime CLI hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants runtime cœur hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichier/runtime hôte Memory |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les assistants runtime cœur hôte Memory |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les assistants de journal d’événements hôte Memory |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les assistants fichier/runtime hôte Memory |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de Markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les assistants de statut hôte Memory |
    | `plugin-sdk/memory-lancedb` | Surface d’assistance groupée memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins réservés d’assistance groupée">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Assistants de support du Plugin navigateur groupé (`browser-support` reste le baril de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface d’assistance/runtime Matrix groupée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface d’assistance/runtime LINE groupée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface d’assistance IRC groupée |
    | Assistants spécifiques à un canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Surfaces groupées de compatibilité/d’assistance de canal |
    | Assistants spécifiques à l’authentification/au Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Surfaces d’assistance groupées de fonctionnalité/Plugin ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement de capacités

| Méthode                                          | Ce qu’elle enregistre                  |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)               |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend local d’inférence CLI          |
| `api.registerChannel(...)`                       | Canal de messagerie                    |
| `api.registerSpeechProvider(...)`                | Synthèse texte-vers-parole / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming  |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex     |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’image/audio/vidéo            |
| `api.registerImageGenerationProvider(...)`       | Génération d’image                     |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale                    |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                       |
| `api.registerWebFetchProvider(...)`              | Provider de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                          |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                          |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (requis ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)      |

### Infrastructure

| Méthode                                          | Ce qu’elle enregistre                 |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook d’événement                      |
| `api.registerHttpRoute(params)`                 | Point de terminaison HTTP Gateway     |
| `api.registerGatewayMethod(name, handler)`      | Méthode RPC Gateway                   |
| `api.registerCli(registrar, opts?)`             | Sous-commande CLI                     |
| `api.registerService(service)`                  | Service en arrière-plan               |
| `api.registerInteractiveHandler(registration)`  | Gestionnaire interactif               |
| `api.registerEmbeddedExtensionFactory(factory)` | Fabrique d’extension de runner embarqué Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Section additive de prompt adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus additif de recherche/lecture de mémoire |

Les espaces de noms d’administration cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin essaie d’attribuer une
portée plus étroite à une méthode gateway. Préférez des préfixes spécifiques au Plugin pour
les méthodes propres au Plugin.

Utilisez `api.registerEmbeddedExtensionFactory(...)` lorsqu’un plugin a besoin du
timing d’événements natif Pi pendant les exécutions embarquées OpenClaw, par exemple des
réécritures asynchrones de `tool_result` qui doivent intervenir avant l’émission du message final de résultat d’outil.
C’est aujourd’hui une surface réservée aux plugins groupés : seuls les plugins groupés peuvent en enregistrer une, et
ils doivent déclarer `contracts.embeddedExtensionFactories: ["pi"]` dans
`openclaw.plugin.json`. Conservez les hooks de Plugin OpenClaw normaux pour tout ce
qui ne requiert pas cette surface de plus bas niveau.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de niveau supérieur :

- `commands` : racines de commande explicites possédées par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse, utilisés pour l’aide CLI racine,
  le routage et l’enregistrement paresseux de CLI de Plugin

Si vous voulez qu’une commande de Plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` couvrant chaque racine de commande de niveau supérieur exposée par ce
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
        description: "Gérer les comptes Matrix, la vérification, les appareils et l’état de profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement CLI racine paresseux.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
de placeholders adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un backend
CLI d’IA local tel que `codex-cli`.

- Le backend `id` devient le préfixe de provider dans des références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur l’emporte toujours. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après la fusion
  (par exemple pour normaliser d’anciennes formes de drapeaux).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité mémoire unifiée                                                                                                                                      |
| `api.registerMemoryPromptSection(builder)` | Builder de section de prompt mémoire                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de flush mémoire                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime mémoire                                                                                                                                    |

### Adaptateurs d’embedding mémoire

| Méthode                                        | Ce qu’elle enregistre                           |
| --------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding mémoire pour le Plugin actif |

- `registerMemoryCapability` est l’API exclusive privilégiée pour les plugins mémoire.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer des artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’atteindre la disposition privée
  d’un plugin mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin mémoire compatibles avec l’historique.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embedding (par exemple `openai`, `gemini`, ou un identifiant
  personnalisé défini par Plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout à partir de ces identifiants
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait              |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé    |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : retourner `{ block: false }` est traité comme l’absence de décision (identique à l’omission de `block`), et non comme un remplacement.
- `before_install` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : retourner `{ block: false }` est traité comme l’absence de décision (identique à l’omission de `block`), et non comme un remplacement.
- `reply_dispatch` : retourner `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique la distribution, les gestionnaires de priorité inférieure et le chemin par défaut de distribution du modèle sont ignorés.
- `message_sending` : retourner `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : retourner `{ cancel: false }` est traité comme l’absence de décision (identique à l’omission de `cancel`), et non comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage entrant de fil/sujet. Conservez `metadata` pour les extras spécifiques au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de revenir au `metadata` spécifique au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage possédé par le gateway au lieu de vous appuyer sur les hooks internes `gateway:startup`.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID du Plugin                                                                               |
| `api.name`               | `string`                  | Nom d’affichage                                                                            |
| `api.version`            | `string?`                 | Version du Plugin (facultative)                                                            |
| `api.description`        | `string?`                 | Description du Plugin (facultative)                                                        |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                    |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (facultatif)                                                   |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané runtime actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au Plugin issue de `plugins.entries.<id>.config`                  |
| `api.runtime`            | `PluginRuntime`           | [Assistants runtime](/fr/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger limité (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relativement à la racine du Plugin                                      |

## Convention de module interne

À l’intérieur de votre Plugin, utilisez des fichiers barils locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports runtime réservés à l’interne
  index.ts          # Point d’entrée du Plugin
  setup-entry.ts    # Entrée légère réservée à la configuration (facultatif)
```

<Warning>
  N’importez jamais votre propre Plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis du code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est le contrat externe uniquement.
</Warning>

Les surfaces publiques des plugins groupés chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent désormais
l’instantané de configuration runtime actif lorsque OpenClaw est déjà en cours d’exécution. Si aucun instantané runtime n’existe encore, elles se replient sur le fichier de configuration résolu sur disque.

Les plugins de provider peuvent aussi exposer un baril de contrat local au Plugin lorsqu’un
assistant est intentionnellement spécifique au provider et n’a pas encore sa place dans un sous-chemin générique du SDK.
Exemple groupé actuel : le provider Anthropic conserve ses assistants de flux Claude
dans sa propre surface publique `api.ts` / `contract-api.ts` au lieu de promouvoir la logique
de bêta-header Anthropic et `service_tier` dans un contrat générique
`plugin-sdk/*`.

Autres exemples groupés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des builders de provider,
  des assistants de modèle par défaut et des builders de provider temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le builder de provider ainsi que
  des assistants d’onboarding/configuration

<Warning>
  Le code de production d’extension doit aussi éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux plugins entre eux.
</Warning>

## Liens connexes

- [Entry Points](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry` et `defineChannelPluginEntry`
- [Runtime Helpers](/fr/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Setup and Config](/fr/plugins/sdk-setup) — packaging, manifestes, schémas de configuration
- [Testing](/fr/plugins/sdk-testing) — utilitaires de test et règles de lint
- [SDK Migration](/fr/plugins/sdk-migration) — migration depuis des surfaces obsolètes
- [Plugin Internals](/fr/plugins/architecture) — architecture approfondie et modèle de capacité
