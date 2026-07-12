---
read_when:
    - Vous gérez un plugin OpenClaw
    - Vous voyez un avertissement de compatibilité du plugin
    - Vous planifiez une migration du SDK de Plugin ou du manifeste
summary: Contrats de compatibilité des Plugins, métadonnées d’obsolescence et exigences de migration
title: Compatibilité des Plugins
x-i18n:
    generated_at: "2026-07-12T15:33:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw maintient les anciens contrats de Plugin connectés au moyen d’adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les plugins intégrés et externes existants pendant que les contrats du SDK, du manifeste, de la configuration initiale, de la configuration et de l’environnement d’exécution des agents évoluent.

## Registre de compatibilité

Les contrats de compatibilité des plugins sont suivis dans le registre principal à l’emplacement `src/plugins/compat/registry.ts`. Chaque entrée comporte :

- un code de compatibilité stable
- un état : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`, `agent-runtime` ou `core`
- les dates d’introduction et d’obsolescence, le cas échéant
- des recommandations de remplacement
- la documentation, les diagnostics et les tests couvrant l’ancien et le nouveau comportement

Le registre constitue la source utilisée pour la planification par les responsables de maintenance et les futures vérifications de l’inspecteur de plugins. Si un comportement exposé aux plugins change, ajoutez ou mettez à jour l’entrée de compatibilité dans la même modification que celle qui ajoute l’adaptateur.

La compatibilité des réparations et migrations de Doctor est suivie séparément dans `src/commands/doctor/shared/deprecation-compat.ts`. Ces entrées couvrent les anciennes structures de configuration, les dispositions du registre d’installation et les adaptateurs de réparation qui peuvent devoir rester disponibles après la suppression du chemin de compatibilité de l’environnement d’exécution.

Les vérifications de version doivent examiner les deux registres. Ne supprimez pas une migration de Doctor simplement parce que l’entrée de compatibilité correspondante de l’environnement d’exécution ou de la configuration a expiré ; vérifiez d’abord qu’aucun chemin de mise à niveau pris en charge n’a encore besoin de cette réparation. Revalidez également chaque annotation de remplacement pendant la planification des versions, car la propriété des plugins et l’empreinte de configuration peuvent changer à mesure que les fournisseurs et les canaux quittent le cœur.

## Politique d’obsolescence

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même version que celle qui introduit son remplacement. Séquence de migration :

1. Ajoutez le nouveau contrat.
2. Maintenez l’ancien comportement connecté au moyen d’un adaptateur de compatibilité nommé.
3. Émettez des diagnostics ou des avertissements lorsque les auteurs de plugins peuvent intervenir.
4. Documentez le remplacement et le calendrier.
5. Testez l’ancien et le nouveau chemin.
6. Attendez pendant la fenêtre de migration annoncée.
7. Procédez à la suppression uniquement avec une approbation explicite pour une version comportant des ruptures de compatibilité.

Les entrées obsolètes doivent inclure une date de début d’avertissement, un remplacement, un lien vers la documentation et une date de suppression définitive ne dépassant pas trois mois après le début de l’avertissement. N’ajoutez pas un chemin de compatibilité obsolète avec une fenêtre de suppression sans échéance, sauf si les responsables de maintenance décident explicitement qu’il s’agit d’une compatibilité permanente et le marquent plutôt comme `active`.

## Domaines de compatibilité actuels

Le registre suit actuellement environ 70 codes de compatibilité dans les domaines suivants. Le nouveau code de Plugin doit utiliser le remplacement indiqué pour chaque domaine et dans le guide de migration correspondant ; les plugins existants peuvent continuer à utiliser un chemin de compatibilité jusqu’à ce que la documentation, les diagnostics et les notes de version annoncent une fenêtre de suppression.

- les anciens imports généraux du SDK tels que `openclaw/plugin-sdk/compat`
- les anciennes structures de plugins limitées aux hooks et `before_agent_start`
- les anciens noms de hooks de nettoyage `api.on("deactivate", ...)` pendant la migration des plugins vers `gateway_stop`
- les anciens points d’entrée de Plugin `activate(api)` pendant la migration des plugins vers `register(api)`
- les anciens alias du SDK tels que `openclaw/extension-api`, les générateurs d’état `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (remplacé par des sous-chemins de test ciblés `openclaw/plugin-sdk/*`), ainsi que les alias de types `ClawdbotConfig` / `OpenClawSchemaType`
- la liste d’autorisation et le comportement d’activation des plugins intégrés
- les anciennes métadonnées de manifeste de variables d’environnement des fournisseurs et canaux
- les anciens hooks et alias de types des plugins de fournisseur pendant que les fournisseurs migrent vers des hooks explicites de catalogue, d’authentification, de raisonnement, de relecture et de transport
- les anciens alias d’environnement d’exécution tels que `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt`, ainsi que les méthodes obsolètes `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- les champs plats de rappel WhatsApp `WebInboundMessage` (voir ci-dessous)
- les champs d’admission de premier niveau de `WebInboundMessage` pour WhatsApp (voir ci-dessous)
- l’ancien enregistrement fractionné des plugins de mémoire pendant leur migration vers `registerMemoryCapability`
- l’ancien enregistrement propre à la mémoire des fournisseurs d’intégration vectorielle pendant leur migration vers `api.registerEmbeddingProvider(...)` et `contracts.embeddingProviders`
- les anciens utilitaires du SDK de canal pour les schémas de messages natifs, le filtrage des mentions, le formatage des enveloppes entrantes et l’imbrication des capacités d’approbation
- les anciens alias de clé de routage de canal et d’utilitaires de cibles comparables pendant la migration des plugins vers `openclaw/plugin-sdk/channel-route`
- les indications d’activation remplacées par la propriété des contributions du manifeste
- le mécanisme de repli de l’environnement d’exécution `setup-api` pendant la migration des descripteurs de configuration initiale vers les métadonnées à froid `setup.requiresRuntime: false`
- les hooks `discovery` des fournisseurs pendant la migration des hooks de catalogue des fournisseurs vers `catalog.run(...)`
- les métadonnées de canal `showConfigured` / `showInSetup` pendant la migration des paquets de canal vers `openclaw.channel.exposure`
- les anciennes clés de configuration de politique d’environnement d’exécution pendant que Doctor fait migrer les opérateurs vers `agentRuntime`
- le mécanisme de repli des métadonnées générées de configuration des canaux intégrés pendant l’arrivée des métadonnées `channelConfigs` privilégiant le registre
- les indicateurs d’environnement persistants de désactivation du registre de plugins et de migration des installations pendant que les flux de réparation font migrer les opérateurs vers `openclaw plugins registry --refresh` et `openclaw doctor --fix`
- les anciens chemins de configuration appartenant aux plugins pour la recherche sur le Web, la récupération de contenu Web et x_search pendant que Doctor les fait migrer vers `plugins.entries.<plugin>.config`
- l’ancienne configuration `plugins.installs` créée manuellement et les alias de chemin de chargement des plugins intégrés pendant la migration des métadonnées d’installation vers le registre de plugins géré dans l’état

### Alias plats des rappels entrants WhatsApp

Les rappels de l’environnement d’exécution WhatsApp fournissent `WebInboundMessage` : les contextes imbriqués canoniques `event`, `payload`, `quote`, `group` et `platform`, ainsi que des alias plats obsolètes pour les champs de rappel livrés. Le nouveau code de rappel doit lire les contextes imbriqués. Le code qui construit des messages de rappel imbriqués propres peut utiliser `WebInboundCallbackMessage` ; les écouteurs de compatibilité qui injectent encore d’anciens messages plats de test ou de Plugin doivent utiliser `LegacyFlatWebInboundMessage` ou `WebInboundMessageInput`.

Les alias plats restent disponibles jusqu’au **2026-08-30** ; cette fenêtre s’applique uniquement à l’accès aux alias plats, et non à la structure imbriquée, qui constitue le contrat canonique de l’environnement d’exécution. L’annotation TypeScript `@deprecated` de chaque alias plat indique son remplacement imbriqué exact. Exemples courants :

- `id`, `timestamp` et `isBatched` sont déplacés sous `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` et `untrustedStructuredContext` sont déplacés sous `payload`.
- `to`, `chatId`, les champs de l’expéditeur et de l’utilisateur courant, `sendComposing`, `reply(...)` et `sendMedia(...)` sont déplacés sous `platform`.
- Les champs `replyTo*` sont déplacés sous `quote` ; les champs d’objet, de participant et de mention de groupe sont déplacés sous `group`.

`payload.untrustedStructuredContext` est extrait des charges utiles entrantes des fournisseurs. Les plugins doivent examiner `label`, `source` et `type` avant de considérer son `payload` comme faisant autorité.

### Champs d’admission entrants WhatsApp

Les messages de rappel WhatsApp acceptés contiennent `admission`, une enveloppe publiquement sûre décrivant la décision de contrôle d’accès ayant autorisé le message. Le nouveau code de rappel doit lire les informations d’admission dans `msg.admission` plutôt que dans les anciens champs d’admission de premier niveau.

Les champs de premier niveau restent disponibles jusqu’au **2026-08-30**. L’annotation TypeScript `@deprecated` de chaque champ indique son remplacement :

- `from` et `conversationId` sont déplacés vers `admission.conversation.id`.
- `accountId` est déplacé vers `admission.accountId`.
- `accessControlPassed` est une vue de compatibilité dérivée de `admission.ingress.decision === "allow"` ; pour les messages contenant déjà `admission`, l’écriture de l’ancien booléen ne réécrit pas le graphe d’entrée.
- `chatType` est déplacé vers `admission.conversation.kind`.

## Paquet de l’inspecteur de plugins

L’inspecteur de plugins doit résider hors du dépôt principal d’OpenClaw, sous la forme d’un paquet ou dépôt distinct reposant sur les contrats versionnés de compatibilité et de manifeste. La CLI initiale doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit produire la validation du manifeste et du schéma, la version de compatibilité du contrat vérifiée, les contrôles des métadonnées d’installation et de source, les contrôles d’importation des chemins à froid, ainsi que les avertissements d’obsolescence et de compatibilité. Utilisez `--json` pour obtenir une sortie stable lisible par une machine dans les annotations de CI. Le cœur d’OpenClaw doit exposer les contrats et les données de test que l’inspecteur peut utiliser, mais ne doit pas publier le binaire de l’inspecteur depuis le paquet principal `openclaw`.

### Parcours d’acceptation des responsables de maintenance

Utilisez Blacksmith Testbox reposant sur Crabbox pour le parcours d’acceptation du paquet installable lors de la validation de l’inspecteur externe avec des paquets de plugins OpenClaw. Exécutez-le depuis une copie de travail OpenClaw propre après la construction du paquet :

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Gardez ce parcours facultatif pour les responsables de maintenance, car il installe un paquet npm externe et peut inspecter des paquets de plugins clonés hors du dépôt. Les contrôles locaux du dépôt couvrent la table d’exportation du SDK, les métadonnées du registre de compatibilité, la réduction progressive des imports obsolètes du SDK et les limites d’importation des extensions intégrées ; la validation de l’inspecteur dans Testbox couvre le paquet tel que les auteurs de plugins externes l’utilisent.

## Notes de version

Les notes de version doivent inclure les prochaines obsolescences de plugins avec leurs dates cibles et des liens vers la documentation de migration, avant qu’un chemin de compatibilité passe à `removal-pending` ou `removed`.
