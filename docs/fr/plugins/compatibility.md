---
read_when:
    - Vous maintenez un Plugin OpenClaw
    - Vous voyez un avertissement de compatibilité de Plugin
    - Vous planifiez une migration du SDK de Plugin ou du manifeste
summary: Contrats de compatibilité des Plugin, métadonnées de dépréciation et attentes de migration
title: Compatibilité des Plugins
x-i18n:
    generated_at: "2026-06-27T17:47:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw conserve les anciens contrats de Plugins branchés via des adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les Plugins groupés et externes existants pendant que les contrats du SDK, du manifeste, de la configuration, de la config et du runtime d’agent évoluent.

## Registre de compatibilité

Les contrats de compatibilité des Plugins sont suivis dans le registre central à
`src/plugins/compat/registry.ts`.

Chaque enregistrement comporte :

- un code de compatibilité stable
- un statut : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : SDK, config, configuration, canal, fournisseur, exécution de Plugin, runtime d’agent,
  ou core
- les dates d’introduction et de dépréciation, le cas échéant
- des consignes de remplacement
- la documentation, les diagnostics et les tests qui couvrent l’ancien et le nouveau comportement

Le registre est la source pour la planification des mainteneurs et les futurs contrôles de l’inspecteur de Plugins. Si un comportement exposé aux Plugins change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans le même changement qui ajoute l’adaptateur.

La compatibilité des réparations et migrations de Doctor est suivie séparément dans
`src/commands/doctor/shared/deprecation-compat.ts`. Ces enregistrements couvrent les anciennes formes de config, les dispositions de journal d’installation et les shims de réparation qui peuvent devoir rester disponibles après la suppression du chemin de compatibilité du runtime.

Les balayages de release doivent vérifier les deux registres. Ne supprimez pas une migration Doctor simplement parce que l’enregistrement de compatibilité runtime ou config correspondant a expiré ; vérifiez d’abord qu’aucun chemin de mise à niveau pris en charge n’a encore besoin de cette réparation. Revalidez aussi chaque annotation de remplacement pendant la planification de release, car la propriété des Plugins et l’empreinte de config peuvent changer à mesure que les fournisseurs et les canaux sortent du core.

## Package d’inspecteur de Plugins

L’inspecteur de Plugins doit vivre en dehors du repo core OpenClaw, sous forme de package/référentiel séparé adossé aux contrats de compatibilité et de manifeste versionnés.

La CLI du premier jour doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit émettre :

- la validation du manifeste/schéma
- la version de compatibilité de contrat vérifiée
- les contrôles des métadonnées d’installation/source
- les contrôles d’import sur chemin froid
- les avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations CI. Le core OpenClaw doit exposer les contrats et fixtures que l’inspecteur peut consommer, mais ne doit pas publier le binaire de l’inspecteur depuis le package principal `openclaw`.

### Voie d’acceptation des mainteneurs

Utilisez Blacksmith Testbox adossé à Crabbox pour la voie d’acceptation des packages installables lors de la validation de l’inspecteur externe contre des packages de Plugins OpenClaw. Exécutez-la depuis un checkout OpenClaw propre après la construction du package :

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Gardez cette voie opt-in pour les mainteneurs, car elle installe un package npm externe et peut inspecter des packages de Plugins clonés hors du repo. Les garde-fous du repo local couvrent l’export map du SDK, les métadonnées du registre de compatibilité, la réduction des imports SDK dépréciés et les limites d’import des extensions groupées ; la preuve de l’inspecteur Testbox couvre le package tel que les auteurs de Plugins externes le consomment.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même release qui introduit son remplacement.

La séquence de migration est :

1. Ajouter le nouveau contrat.
2. Garder l’ancien comportement branché via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou avertissements lorsque les auteurs de Plugins peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester les anciens et nouveaux chemins.
6. Attendre pendant la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de release avec changements cassants.

Les enregistrements dépréciés doivent inclure une date de début d’avertissement, un remplacement, un lien de documentation et une date de suppression finale au plus tard trois mois après le début de l’avertissement. N’ajoutez pas de chemin de compatibilité déprécié avec une fenêtre de suppression ouverte, sauf si les mainteneurs décident explicitement qu’il s’agit d’une compatibilité permanente et le marquent plutôt `active`.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- les anciens imports SDK larges comme `openclaw/plugin-sdk/compat`
- les anciennes formes de Plugins à hooks uniquement et `before_agent_start`
- les anciens noms de hook de nettoyage `api.on("deactivate", ...)` pendant que les Plugins migrent vers
  `gateway_stop`
- les anciens points d’entrée de Plugin `activate(api)` pendant que les Plugins migrent vers
  `register(api)`
- les anciens alias SDK comme `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, les constructeurs de statut `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (remplacé par des sous-chemins de test ciblés
  `openclaw/plugin-sdk/*`) et les alias de type `ClawdbotConfig` /
  `OpenClawSchemaType`
- le comportement de liste d’autorisation et d’activation des Plugins groupés
- les anciennes métadonnées de manifeste de variables d’environnement fournisseur/canal
- les anciens hooks de Plugins fournisseurs et alias de type pendant que les fournisseurs migrent vers
  les hooks explicites de catalogue, auth, thinking, replay et transport
- les anciens alias runtime comme `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` et les méthodes dépréciées
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- les champs plats de callback WhatsApp `WebInboundMessage` comme `body`, `chatId`,
  `reply(...)` et `mediaPath` pendant que les consommateurs de callbacks migrent vers les contextes imbriqués
  `event`, `payload`, `quote`, `group` et `platform` de
  `WebInboundCallbackMessage`
- les champs d’admission de premier niveau WhatsApp `WebInboundMessage` comme `from`,
  `conversationId`, `accountId`, `accessControlPassed` et `chatType` pendant que
  les consommateurs de callbacks migrent vers l’enveloppe `admission`
- l’ancienne inscription scindée des Plugins de mémoire pendant que les Plugins de mémoire migrent vers
  `registerMemoryCapability`
- l’ancienne inscription de fournisseurs d’embeddings spécifique à la mémoire pendant que les fournisseurs d’embeddings
  migrent vers `api.registerEmbeddingProvider(...)` et
  `contracts.embeddingProviders`
- les anciens helpers SDK de canal pour les schémas de messages natifs, le filtrage des mentions,
  la mise en forme d’enveloppes entrantes et l’imbrication des capacités d’approbation
- l’ancienne clé de route de canal et les alias de helpers de cible comparable pendant que les Plugins
  migrent vers `openclaw/plugin-sdk/channel-route`
- les indices d’activation qui sont remplacés par la propriété des contributions de manifeste
- le fallback runtime `setup-api` pendant que les descripteurs de configuration migrent vers les métadonnées froides
  `setup.requiresRuntime: false`
- les hooks `discovery` de fournisseur pendant que les hooks de catalogue fournisseur migrent vers
  `catalog.run(...)`
- les métadonnées de canal `showConfigured` / `showInSetup` pendant que les packages de canal migrent
  vers `openclaw.channel.exposure`
- les anciennes clés de config de politique runtime pendant que Doctor migre les opérateurs vers
  `agentRuntime`
- le fallback des métadonnées générées de config de canal groupé pendant que les métadonnées
  `channelConfigs` registry-first arrivent
- les flags env de désactivation du registre de Plugins persistant et de migration d’installation pendant que
  les flux de réparation migrent les opérateurs vers `openclaw plugins registry --refresh` et
  `openclaw doctor --fix`
- les anciens chemins de config de recherche Web, récupération Web et x_search détenus par des Plugins pendant que
  Doctor les migre vers `plugins.entries.<plugin>.config`
- l’ancienne config rédigée `plugins.installs` et les alias de chemin de chargement de Plugins groupés
  pendant que les métadonnées d’installation migrent dans le registre de Plugins géré par l’état

Le nouveau code de Plugin doit préférer le remplacement indiqué dans le registre et dans le guide de migration spécifique. Les Plugins existants peuvent continuer à utiliser un chemin de compatibilité jusqu’à ce que la documentation, les diagnostics et les notes de release annoncent une fenêtre de suppression.

### Alias plats de callbacks entrants WhatsApp

Les callbacks runtime WhatsApp livrent `WebInboundMessage` : les contextes imbriqués canoniques
`event`, `payload`, `quote`, `group` et `platform`, plus des alias plats dépréciés pour les champs de callback livrés. Le nouveau code de callback doit lire les contextes imbriqués. Le code qui construit des messages de callback imbriqués propres peut utiliser
`WebInboundCallbackMessage` ; les écouteurs de compatibilité qui injectent encore d’anciens messages de test ou de Plugin plats doivent utiliser `LegacyFlatWebInboundMessage` ou
`WebInboundMessageInput`.

Les alias plats restent disponibles jusqu’au **2026-08-30**. Cette fenêtre de suppression s’applique uniquement à l’accès aux alias plats ; la forme imbriquée de callback est le contrat runtime canonique. Les annotations TypeScript `@deprecated` sur chaque alias plat nomment son remplacement imbriqué exact. Exemples courants :

- `id`, `timestamp` et `isBatched` passent sous `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` et
  `untrustedStructuredContext` passent sous `payload`.
- `to`, `chatId`, les champs expéditeur/soi-même, `sendComposing`, `reply(...)` et
  `sendMedia(...)` passent sous `platform`.
- Les champs `replyTo*` passent sous `quote`, et les champs de sujet/participant/mention de groupe
  passent sous `group`.

`payload.untrustedStructuredContext` est extrait des payloads fournisseurs entrants.
Les Plugins doivent inspecter `label`, `source` et `type` avant de traiter son
`payload` comme faisant autorité.

### Champs d’admission entrants WhatsApp

Les messages de callback WhatsApp acceptés portent désormais `admission`, une enveloppe sûre pour le public pour la décision de contrôle d’accès qui a admis le message. Le nouveau code de callback doit lire les faits d’admission depuis `msg.admission` plutôt que depuis les anciens champs d’admission de premier niveau.

Les champs de premier niveau restent disponibles jusqu’au **2026-08-30**. Les annotations TypeScript
`@deprecated` nomment chaque remplacement :

- `from` et `conversationId` passent à `admission.conversation.id`.
- `accountId` passe à `admission.accountId`.
- `accessControlPassed` est une vue de compatibilité dérivée de
  `admission.ingress.decision === "allow"` ; sur les messages qui portent déjà
  `admission`, écrire le booléen legacy ne réécrit pas le graphe d’ingress.
- `chatType` passe à `admission.conversation.kind`.

## Notes de release

Les notes de release doivent inclure les dépréciations de Plugins à venir avec les dates cibles et les liens vers les documents de migration. Cet avertissement doit avoir lieu avant qu’un chemin de compatibilité passe à `removal-pending` ou `removed`.
