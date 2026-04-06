---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK effectuer l’import
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez un export spécifique du SDK
sidebarTitle: SDK Overview
summary: Carte des imports, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK de plugin
x-i18n:
    generated_at: "2026-04-06T06:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: acd2887ef52c66b2f234858d812bb04197ecd0bfb3e4f7bf3622f8fdc765acad
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d’ensemble du SDK de plugin

Le SDK de plugin est le contrat typé entre les plugins et le cœur. Cette page
est la référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Getting Started](/fr/plugins/building-plugins)
  - Plugin de canal ? Voir [Channel Plugins](/fr/plugins/sdk-channel-plugins)
  - Plugin de fournisseur ? Voir [Provider Plugins](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela permet de garder un
démarrage rapide et d’éviter les problèmes de dépendances circulaires. Pour les
assistants d’entrée/de build spécifiques aux canaux, privilégiez
`openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour la
surface parapluie plus large et les assistants partagés comme
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de points d’entrée de commodité nommés d’après
des fournisseurs tels que `openclaw/plugin-sdk/slack`,
`openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`,
`openclaw/plugin-sdk/whatsapp`, ni de points d’entrée d’assistance associés à
une marque de canal. Les plugins intégrés doivent composer des sous-chemins
génériques du SDK dans leurs propres barrels `api.ts` ou `runtime-api.ts`, et
le cœur doit soit utiliser ces barrels locaux au plugin, soit ajouter un
contrat SDK générique étroit lorsque le besoin est réellement inter-canaux.

La carte des exports générée contient encore un petit ensemble de points
d’entrée d’assistance pour plugins intégrés comme `plugin-sdk/feishu`,
`plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et
`plugin-sdk/matrix*`. Ces sous-chemins existent uniquement pour la maintenance
et la compatibilité des plugins intégrés ; ils sont volontairement omis du
tableau commun ci-dessous et ne constituent pas le chemin d’import recommandé
pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par objectif. La liste
complète générée de plus de 200 sous-chemins se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins d’assistance réservés aux plugins intégrés apparaissent
toujours dans cette liste générée. Traitez-les comme des surfaces de détail
d’implémentation/de compatibilité, sauf si une page de documentation les
présente explicitement comme publiques.

### Entrée de plugin

| Sous-chemin                | Exports clés                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Sous-chemins des canaux">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration/multi-compte/passerelle d’actions, assistants de repli de compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Recherche de compte + assistants de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés pour liste de comptes/actions sur les comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec repli sur contrat intégré |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante + constructeur d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés d’enregistrement et de distribution entrante |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-runtime` | Assistants de délégation d’identité/d’envoi sortants |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur pour liaisons de fils |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile de média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de liaison conversation/fil, appairage et liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de stratégie de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de préambule partagés pour plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de lecture/édition de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès aux groupes |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/protection pour DM directs |
    | `plugin-sdk/interactive-runtime` | Assistants de normalisation/réduction de charges utiles de réponse interactive |
    | `plugin-sdk/channel-inbound` | Anti-rebond, correspondance de mentions, assistants d’enveloppe |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types du contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
  </Accordion>

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Assistants de configuration sélectionnés pour fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseur autohébergé compatible OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Assistants de résolution de clé API à l’exécution pour plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration/écriture de profil de clé API |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants partagés de connexion interactive pour plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de stratégie de rejeu, assistants de point de terminaison fournisseur et assistants de normalisation d’identifiants de modèles comme `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacités HTTP/points de terminaison pour fournisseurs |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/cache de fournisseur de récupération web |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/cache/configuration de fournisseur de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, et assistants partagés d’enveloppes Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Assistants de correction de configuration pour l’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton/mappe/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes, assistants d’autorisation d’expéditeur |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et assistants d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs de livraison/capacité d’approbation native |
    | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation native + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charge utile de réponse d’approbation d’exécution/plugin |
    | `plugin-sdk/command-auth-native` | Authentification de commande native + assistants de cible de session native |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commande |
    | `plugin-sdk/command-surface` | Assistants de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, filtrage des DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de liste d’autorisation d’hôtes et de stratégie SSRF pour réseau privé |
    | `plugin-sdk/ssrf-runtime` | Assistants de répartiteur épinglé, fetch protégé contre SSRF et stratégie SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse des entrées secrètes |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible de webhook |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille maximale de corps/délai d’expiration de requête |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants larges d’exécution/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Assistants ciblés pour environnement d’exécution, logger, délai d’expiration, nouvelle tentative et backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés de commande/hook/http/interaction pour plugins |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants de liaison/import paresseux à l’exécution tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants de formatage CLI, attente et version |
    | `plugin-sdk/gateway-runtime` | Assistants de client Gateway et de correction d’état de canal |
    | `plugin-sdk/config-runtime` | Assistants de chargement/écriture de configuration |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications des doublons/conflits, même quand la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation d’exécution/plugin, constructeurs de capacité d’approbation, assistants d’authentification/profil, assistants de routage/exécution natifs |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution entrante/de réponse, fragmentation, distribution, heartbeat, planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de distribution/finalisation des réponses |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique de réponses sur courte fenêtre comme `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de fragmentation de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin de magasin de sessions + `updated-at` |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoires state/OAuth |
    | `plugin-sdk/routing` | Assistants de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats normalisés stdout/stderr |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-send` | Extraire les champs de cible d’envoi canoniques depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Logger de sous-système et assistants de masquage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode tableau Markdown |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication persistant sur disque |
    | `plugin-sdk/acp-runtime` | Assistants ACP d’exécution/session et de distribution de réponses |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées pour canal passif et assistants d’état |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de commande `/models`/fournisseur |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listing de commandes Skills |
    | `plugin-sdk/native-command-registry` | Assistants de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection de point de terminaison Z.AI |
    | `plugin-sdk/infra-runtime` | Assistants d’événements système/heartbeat |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeau et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Assistants de fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration et d’exécution des nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoires pilotées par la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias ainsi que constructeurs de charges utiles média |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de bascule en cas d’échec pour la génération de médias, sélection de candidats et messages d’absence de modèle |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension multimédia ainsi qu’exports d’assistants image/audio destinés aux fournisseurs |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte/Markdown/journalisation tels que suppression de texte visible par l’assistant, rendu/fragmentation/tableau Markdown, assistants de masquage, assistants de balises de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de fragmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs speech ainsi qu’assistants de directive, registre et validation destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs speech, registre, directive et assistants de normalisation |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel et assistants de registre |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, assistants de bascule en cas d’échec, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, assistants de bascule en cas d’échec, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de bascule en cas d’échec, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles webhook et assistants d’installation de routes |
    | `plugin-sdk/webhook-path` | Assistants de normalisation de chemin webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexport de `zod` pour les consommateurs du SDK de plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistance intégrée memory-core pour assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exports du moteur d’embeddings de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants CLI d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants principaux d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichiers/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les assistants principaux d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les assistants fichiers/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de Markdown géré pour les plugins proches de la mémoire |
    | `plugin-sdk/memory-host-search` | Façade active d’exécution mémoire pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface d’assistance intégrée memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins d’assistance intégrée réservés">
    | Famille | Sous-chemins actuels | Utilisation prévue |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Assistants de prise en charge du plugin Browser intégré (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface d’assistance/d’exécution Matrix intégrée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface d’assistance/d’exécution LINE intégrée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface d’assistance IRC intégrée |
    | Assistants spécifiques à un canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Points d’entrée de compatibilité/d’assistance pour canaux intégrés |
    | Assistants spécifiques à l’authentification/au plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Points d’entrée d’assistance pour fonctionnalités/plugins intégrés ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre            |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)         |
| `api.registerChannel(...)`                       | Canal de messagerie              |
| `api.registerSpeechProvider(...)`                | Synthèse texte-vers-parole / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en flux |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’image/audio/vidéo      |
| `api.registerImageGenerationProvider(...)`       | Génération d’images              |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale              |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                 |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                    |

### Outils et commandes

| Méthode                          | Ce qu’elle enregistre                          |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)      |

### Infrastructure

| Méthode                                         | Ce qu’elle enregistre                  |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                       |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP Gateway      |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway                    |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                      |
| `api.registerService(service)`                 | Service d’arrière-plan                 |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                |
| `api.registerMemoryPromptSupplement(builder)`  | Section additive de prompt liée à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire |

Les espaces de noms d’administration du cœur réservés (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent toujours `operator.admin`,
même si un plugin essaie d’assigner une portée de méthode Gateway plus étroite.
Privilégiez des préfixes spécifiques au plugin pour les méthodes détenues par
le plugin.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de niveau
supérieur :

- `commands` : racines de commandes explicites détenues par le registrar
- `descriptors` : descripteurs de commandes au moment de l’analyse pour l’aide
  CLI racine, le routage et l’enregistrement paresseux de la CLI du plugin

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le
chemin CLI racine normal, fournissez des `descriptors` couvrant chaque racine
de commande de premier niveau exposée par ce registrar.

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

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un
enregistrement CLI racine paresseux. Ce chemin de compatibilité eager reste
pris en charge, mais il n’installe pas d’espaces réservés fondés sur des
descripteurs pour le chargement paresseux au moment de l’analyse.

### Emplacements exclusifs

| Méthode                                     | Ce qu’elle enregistre                  |
| ------------------------------------------ | -------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois) |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt mémoire |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage mémoire    |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d’exécution mémoire         |

### Adaptateurs d’embeddings mémoire

| Méthode                                         | Ce qu’elle enregistre                           |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding mémoire pour le plugin actif |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont exclusifs aux plugins mémoire.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif
  d’enregistrer un ou plusieurs identifiants d’adaptateur d’embedding (par
  exemple `openai`, `gemini` ou un identifiant personnalisé défini par le
  plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider`
  et `agents.defaults.memorySearch.fallback` est résolue par rapport à ces
  identifiants d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                       | Ce qu’elle fait              |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé    |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), pas comme une substitution.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), pas comme une substitution.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire prend en charge la distribution, les gestionnaires de priorité inférieure et le chemin par défaut de distribution du modèle sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme aucune décision (identique à l’omission de `cancel`), pas comme une substitution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultative)                                                             |
| `api.description`        | `string?`                 | Description du plugin (facultative)                                                         |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané actuel de la configuration (instantané actif en mémoire à l’exécution quand disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au plugin depuis `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Assistants d’exécution](/fr/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | Logger à portée limitée (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                            |

## Convention des modules internes

Dans votre plugin, utilisez des fichiers barrel locaux pour les imports
internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports internes uniquement à l’exécution
  index.ts          # Point d’entrée du plugin
  setup-entry.ts    # Entrée légère réservée à la configuration (facultative)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis du code de production. Faites passer les imports internes par
  `./api.ts` ou `./runtime-api.ts`. Le chemin SDK est uniquement le contrat
  externe.
</Warning>

Les surfaces publiques de plugins intégrés chargées par façade (`api.ts`,
`runtime-api.ts`, `index.ts`, `setup-entry.ts` et fichiers d’entrée publics
similaires) privilégient désormais l’instantané actif de configuration
d’exécution quand OpenClaw est déjà en cours d’exécution. Si aucun instantané
d’exécution n’existe encore, elles se rabattent sur le fichier de configuration
résolu sur disque.

Les plugins de fournisseur peuvent aussi exposer un barrel de contrat local au
plugin et ciblé lorsqu’un assistant est intentionnellement spécifique à ce
fournisseur et n’a pas encore sa place dans un sous-chemin générique du SDK.
Exemple intégré actuel : le fournisseur Anthropic conserve ses assistants de
flux Claude dans son propre point d’entrée public `api.ts` / `contract-api.ts`
au lieu de promouvoir la logique d’en-tête bêta Anthropic et `service_tier`
dans un contrat générique `plugin-sdk/*`.

Autres exemples intégrés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de
  fournisseurs, des assistants de modèles par défaut et des constructeurs de
  fournisseurs temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur du
  fournisseur ainsi que des assistants d’intégration/configuration

<Warning>
  Le code de production d’extension doit également éviter les imports
  `openclaw/plugin-sdk/<other-plugin>`. Si un assistant est réellement partagé,
  faites-le évoluer vers un sous-chemin SDK neutre tel que
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité, au lieu de coupler deux plugins entre eux.
</Warning>

## Lié

- [Entry Points](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry` et `defineChannelPluginEntry`
- [Runtime Helpers](/fr/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Setup and Config](/fr/plugins/sdk-setup) — empaquetage, manifestes, schémas de configuration
- [Testing](/fr/plugins/sdk-testing) — utilitaires de test et règles de lint
- [SDK Migration](/fr/plugins/sdk-migration) — migration depuis les surfaces obsolètes
- [Plugin Internals](/fr/plugins/architecture) — architecture approfondie et modèle de capacités
