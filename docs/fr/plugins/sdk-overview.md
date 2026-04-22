---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement de `OpenClawPluginApi`
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: SDK Overview
summary: Carte des imports, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK Plugin
x-i18n:
    generated_at: "2026-04-22T04:25:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d’ensemble du SDK Plugin

Le SDK Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Bien démarrer](/fr/plugins/building-plugins)
  - Plugin de canal ? Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  - Plugin de fournisseur ? Consultez [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de build
spécifiques aux canaux, préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface parapluie plus large et les helpers partagés tels que
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de coutures pratiques nommées par fournisseur telles que
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ou
des coutures de helpers marquées au nom d’un canal. Les plugins intégrés doivent composer des sous-chemins
génériques du SDK dans leurs propres barrels `api.ts` ou `runtime-api.ts`, et le cœur
doit soit utiliser ces barrels locaux au plugin soit ajouter un contrat SDK générique étroit
lorsque le besoin est réellement inter-canaux.

La carte d’export générée contient toujours un petit ensemble de coutures helper pour plugins intégrés
telles que `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Ces
sous-chemins existent uniquement pour la maintenance et la compatibilité des plugins intégrés ; ils sont
volontairement omis du tableau commun ci-dessous et ne constituent pas le chemin
d’import recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par objectif. La liste complète générée des
200+ sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins helper réservés aux plugins intégrés apparaissent encore dans cette liste générée.
Traitez-les comme des surfaces de détail d’implémentation/compatibilité à moins qu’une page de documentation
n’en promeuve explicitement une comme publique.

### Entrée de plugin

| Sous-chemin                 | Exports clés                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                      |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                         |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                        |

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers partagés pour l’assistant de configuration initiale, invites de liste d’autorisation, constructeurs d’état de configuration initiale |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers multi-compte de configuration/contrôle d’action, helpers de repli de compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Recherche de compte + helpers de repli par défaut |
    | `plugin-sdk/account-helpers` | Helpers étroits de liste d’actions/de comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec repli de contrat intégré |
    | `plugin-sdk/command-gating` | Helpers étroits de contrôle d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de cycle de vie/finalisation de flux brouillon |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de route entrante + construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement-et-répartition entrants |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/correspondance des cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement des médias sortants |
    | `plugin-sdk/outbound-runtime` | Helpers d’identité sortante, de délégation d’envoi et de planification de charge utile |
    | `plugin-sdk/poll-runtime` | Helpers étroits de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur des liaisons de fil |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de liaison conversation/fil, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de politique de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives étroites de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de prélude de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lecture/modification de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/protection des messages privés directs |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et helpers hérités de réponse interactive. Consultez [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour les helpers d’anti-rebond entrant, de correspondance de mention, de politique de mention et d’enveloppe |
    | `plugin-sdk/channel-mention-gating` | Helpers étroits de politique de mention sans la surface d’exécution entrante plus large |
    | `plugin-sdk/channel-location` | Helpers de contexte et de formatage d’emplacement de canal |
    | `plugin-sdk/channel-logging` | Helpers de journalisation de canal pour les abandons entrants et les échecs de typing/accusé |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Helpers d’action de message de canal, plus helpers de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-targets` | Helpers d’analyse/correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage de retour/réaction |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de contrat de secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, et types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration initiale de fournisseur local/auto-hébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration initiale de fournisseur auto-hébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers d’exécution de résolution de clé API pour les plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’onboarding/écriture de profil de clé API tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers interactifs partagés de connexion pour les plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche des variables d’environnement d’authentification fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de replay, helpers de point de terminaison fournisseur, et helpers de normalisation d’identifiant de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacité HTTP/point de terminaison fournisseur |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers étroits de contrat config/sélection web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits de configuration/d’identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers étroits de contrat de configuration/d’identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et accesseurs/setters d’identifiants limités à une portée |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/cache/exécution de fournisseur web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage du schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et helpers partagés d’enveloppe Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif fournisseur tels que fetch protégé, transformations de messages de transport, et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et helpers d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers natifs de profil/filtre d’approbation exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution du gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur natif d’approbation pour les points d’entrée de canal à chaud |
    | `plugin-sdk/approval-handler-runtime` | Helpers plus larges d’exécution du gestionnaire d’approbation ; préférez les coutures plus étroites d’adaptateur/gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charge utile de réponse d’approbation exec/plugin |
    | `plugin-sdk/command-auth-native` | Helpers natifs d’authentification de commande + de cible de session native |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commande |
    | `plugin-sdk/command-surface` | Helpers de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrat de secret pour les surfaces de secret de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l’analyse de contrat de secret/configuration |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, de contrôle des messages privés, de contenu externe et de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF pour liste d’autorisation d’hôtes et réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de dispatcher épinglé sans la surface d’exécution infra large |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher épinglé, fetch protégé contre SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille/timeout du corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers larges d’exécution/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Helpers étroits d’environnement d’exécution, journaliseur, timeout, retry, et backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche du contexte d’exécution de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de plugin pour commandes/hooks/HTTP/interactif |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Helpers d’import/liaison d’exécution paresseuse tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod`, et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers CLI de formatage, attente et version |
    | `plugin-sdk/gateway-runtime` | Helpers de client Gateway et de patch d’état de canal |
    | `plugin-sdk/config-runtime` | Helpers de chargement/écriture de configuration |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commande Telegram et vérifications de doublon/conflit, même lorsque la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autoliens de référence de fichier sans le barrel large `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation exec/plugin, constructeurs de capacité d’approbation, helpers d’authentification/profil, helpers natifs de routage/exécution |
    | `plugin-sdk/reply-runtime` | Helpers partagés d’exécution entrante/réponse, découpage, répartition, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de répartition/finalisation des réponses |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponse sur fenêtre courte tels que `buildHistoryContext`, `recordPendingHistoryEntry`, et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers étroits de découpage texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin du magasin de session + `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de chemin d’état/répertoire OAuth |
    | `plugin-sdk/routing` | Helpers de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey`, et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé d’état canal/compte, valeurs par défaut d’état d’exécution, et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats `stdout`/`stderr` normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis les objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Helpers de journaliseur de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode de tableau Markdown |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication sur disque |
    | `plugin-sdk/acp-runtime` | Helpers ACP d’exécution/session et de répartition de réponse |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution ACP de liaison en lecture seule sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives étroites de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de nom dangereuse |
    | `plugin-sdk/device-bootstrap` | Helpers d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives helper partagées de canal passif, d’état et de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de commande `/models` / fournisseur |
    | `plugin-sdk/skill-commands-runtime` | Helpers de liste des commandes Skills |
    | `plugin-sdk/native-command-registry` | Helpers natifs de registre/construction/sérialisation de commande |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour les harnais d’agent bas niveau : types de harnais, helpers de pilotage/abandon d’exécution active, helpers de bridge d’outil OpenClaw, et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers d’indicateur et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Helpers de graphe d’erreur, formatage, classification partagée des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulé, proxy, et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution conscient du dispatcher sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné du corps de réponse sans la surface large d’exécution média |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de conversation sans routage de liaison configurée ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Helpers de lecture du magasin de session sans imports larges d’écritures/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage de contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers étroits de coercition et normalisation de chaîne/enregistrement primitif sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration et d’exécuteur retry |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication d’annuaire fondée sur la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de média ainsi que constructeurs de charge utile média |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de bascule pour génération média, sélection de candidat, et messagerie de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension média ainsi qu’exports helper d’image/audio côté fournisseur |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/Markdown/journalisation tels que suppression de texte visible par l’assistant, helpers de rendu/découpage/tableau Markdown, helpers de masquage, helpers de balise de directive, et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur speech ainsi que helpers côté fournisseur pour directive, registre, et validation |
    | `plugin-sdk/speech-core` | Types partagés de fournisseur speech, helpers de registre, directive, et normalisation |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription temps réel et helpers de registre |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’image |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’image, helpers de bascule, d’authentification, et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de bascule, recherche de fournisseur, et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de bascule, recherche de fournisseur, et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de route |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de média distant/local |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins Memory">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper intégrée memory-core pour les helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’index/recherche Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte Memory, accès au registre, fournisseur local, et helpers génériques par lot/distants |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte Memory |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte Memory |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secret de l’hôte Memory |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte Memory |
    | `plugin-sdk/memory-core-host-status` | Helpers d’état de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers d’exécution CLI de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers d’exécution core de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/exécution de l’hôte Memory |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les helpers d’exécution core de l’hôte Memory |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements de l’hôte Memory |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/exécution de l’hôte Memory |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de Markdown géré pour les plugins adjacents à Memory |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les helpers d’état de l’hôte Memory |
    | `plugin-sdk/memory-lancedb` | Surface helper intégrée memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins helper intégrés réservés">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de prise en charge du plugin Browser intégré (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/exécution Matrix intégrée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/exécution LINE intégrée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC intégrée |
    | Helpers spécifiques aux canaux | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Coutures de compatibilité/helper de canaux intégrés |
    | Helpers spécifiques à l’authentification/au plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Coutures helper de fonctionnalité/plugin intégrées ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                    |
| ------------------------------------------------ | ---------------------------------------- |
| `api.registerProvider(...)`                      | Inférence textuelle (LLM)                |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend local d’inférence CLI            |
| `api.registerChannel(...)`                       | Canal de messagerie                      |
| `api.registerSpeechProvider(...)`                | Synthèse texte-vers-voix / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’image/audio/vidéo              |
| `api.registerImageGenerationProvider(...)`       | Génération d’image                       |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale                      |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                         |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping Web |
| `api.registerWebSearchProvider(...)`             | Recherche Web                            |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                          |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)      |

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                     |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP Gateway    |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway                  |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                    |
| `api.registerService(service)`                 | Service en arrière-plan              |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif              |
| `api.registerMemoryPromptSupplement(builder)`  | Section additive de prompt adjacente à Memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture Memory |

Les espaces de noms d’administration centraux réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin essaie d’assigner une
portée plus étroite à une méthode Gateway. Préférez des préfixes propres au plugin pour
les méthodes appartenant au plugin.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de premier niveau :

- `commands` : racines de commandes explicites appartenant à l’enregistreur
- `descriptors` : descripteurs de commandes au moment de l’analyse, utilisés pour l’aide CLI racine,
  le routage et l’enregistrement CLI paresseux du plugin

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par cet
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement CLI racine paresseux.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
de placeholders fondés sur des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un backend CLI local
d’IA tel que `codex-cli`.

- L’`id` du backend devient le préfixe de fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple pour normaliser d’anciennes formes de drapeaux).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité Memory unifiée                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt Memory                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage Memory                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d’exécution Memory                                                                                                                             |

### Adaptateurs d’embeddings Memory

| Méthode                                        | Ce qu’elle enregistre                            |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embeddings Memory pour le plugin actif |

- `registerMemoryCapability` est l’API de plugin Memory exclusive préférée.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que des plugins compagnons puissent consommer des artefacts Memory exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’atteindre la disposition privée d’un
  plugin Memory spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, et
  `registerMemoryRuntime` sont des API exclusives compatibles avec l’ancien système pour les plugins Memory.
- `registerMemoryEmbeddingProvider` permet au plugin Memory actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embeddings (par exemple `openai`, `gemini`, ou un identifiant personnalisé défini par un plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces identifiants
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait              |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé    |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), et non comme un remplacement.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), et non comme un remplacement.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique la répartition, les gestionnaires de priorité inférieure et le chemin de répartition par défaut du modèle sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme aucune décision (identique à l’omission de `cancel`), et non comme un remplacement.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                              |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                          |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané actuel de configuration (instantané d’exécution actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au plugin depuis `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Helpers d’exécution](/fr/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Journaliseur limité à la portée (`debug`, `info`, `warn`, `error`)                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration initiale avant le point d’entrée complet |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin par rapport à la racine du plugin                                        |

## Convention des modules internes

À l’intérieur de votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports d’exécution internes uniquement
  index.ts          # Point d’entrée du plugin
  setup-entry.ts    # Point d’entrée léger de configuration initiale uniquement (facultatif)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par
  `./api.ts` ou `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins intégrés chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, et fichiers d’entrée publics similaires) préfèrent désormais l’
instantané de configuration d’exécution actif lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun instantané d’exécution
n’existe encore, elles reviennent à la configuration résolue sur disque.

Les plugins de fournisseur peuvent aussi exposer un barrel de contrat local au plugin lorsqu’un
helper est intentionnellement spécifique à un fournisseur et n’a pas encore sa place dans un sous-chemin
générique du SDK. Exemple intégré actuel : le fournisseur Anthropic conserve ses helpers de flux Claude
dans sa propre couture publique `api.ts` / `contract-api.ts` au lieu de promouvoir la logique
d’en-tête bêta Anthropic et `service_tier` dans un contrat générique
`plugin-sdk/*`.

Autres exemples intégrés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
  des helpers de modèle par défaut, et des constructeurs de fournisseur temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de fournisseur ainsi que
  des helpers d’onboarding/configuration

<Warning>
  Le code de production d’extension doit également éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper est réellement partagé, promouvez-le vers un sous-chemin neutre du SDK
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux plugins ensemble.
</Warning>

## Liens associés

- [Points d’entrée](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry` et `defineChannelPluginEntry`
- [Helpers d’exécution](/fr/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Configuration initiale et configuration](/fr/plugins/sdk-setup) — packaging, manifestes, schémas de configuration
- [Testing](/fr/plugins/sdk-testing) — utilitaires de test et règles de lint
- [Migration du SDK](/fr/plugins/sdk-migration) — migration depuis des surfaces obsolètes
- [Internes des plugins](/fr/plugins/architecture) — architecture détaillée et modèle de capacité
