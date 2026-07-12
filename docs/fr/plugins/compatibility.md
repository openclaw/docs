---
read_when:
    - Vous gérez un plugin OpenClaw
    - Vous voyez un avertissement de compatibilité de Plugin
    - Vous planifiez une migration du SDK de Plugin ou du manifeste
summary: Contrats de compatibilité des Plugins, métadonnées d’obsolescence et exigences de migration
title: Compatibilité des Plugins
x-i18n:
    generated_at: "2026-07-12T02:52:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw maintient les anciens contrats de Plugin via des adaptateurs de
compatibilité nommés avant de les supprimer. Cela protège les plugins
intégrés et externes existants pendant que les contrats du SDK, du manifeste,
de la configuration initiale, de la configuration et de l’environnement
d’exécution des agents évoluent.

## Registre de compatibilité

Les contrats de compatibilité des plugins sont suivis dans le registre du
cœur à l’emplacement `src/plugins/compat/registry.ts`. Chaque entrée comporte :

- un code de compatibilité stable
- un état : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : `sdk`, `config`, `setup`, `channel`, `provider`,
  `plugin-execution`, `agent-runtime` ou `core`
- les dates d’introduction et d’obsolescence, le cas échéant
- des recommandations de remplacement
- la documentation, les diagnostics et les tests couvrant l’ancien et le
  nouveau comportement

Le registre constitue la source de référence pour la planification des
responsables de maintenance et les futures vérifications de l’inspecteur de
plugins. Si un comportement exposé aux plugins change, ajoutez ou mettez à
jour l’entrée de compatibilité dans la même modification que celle qui ajoute
l’adaptateur.

La compatibilité des réparations et migrations de Doctor est suivie
séparément dans `src/commands/doctor/shared/deprecation-compat.ts`. Ces entrées
couvrent les anciennes structures de configuration, les structures du registre
d’installation et les couches d’adaptation de réparation susceptibles de
devoir rester disponibles après la suppression du chemin de compatibilité de
l’environnement d’exécution.

Les vérifications de publication doivent contrôler les deux registres. Ne
supprimez pas une migration de Doctor simplement parce que l’entrée de
compatibilité correspondante de l’environnement d’exécution ou de la
configuration a expiré ; vérifiez d’abord qu’aucun chemin de mise à niveau pris
en charge n’a encore besoin de cette réparation. Revalidez également chaque
annotation de remplacement lors de la planification des publications, car la
responsabilité des plugins et l’empreinte de configuration peuvent évoluer à
mesure que les fournisseurs et les canaux quittent le cœur.

## Politique d’obsolescence

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même
version que celle qui introduit son remplacement. Séquence de migration :

1. Ajoutez le nouveau contrat.
2. Maintenez l’ancien comportement via un adaptateur de compatibilité nommé.
3. Émettez des diagnostics ou des avertissements lorsque les auteurs de
   plugins peuvent intervenir.
4. Documentez le remplacement et le calendrier.
5. Testez les anciens et les nouveaux chemins.
6. Attendez la fin de la période de migration annoncée.
7. Ne procédez à la suppression qu’avec une approbation explicite pour une
   version comportant des changements incompatibles.

Les entrées obsolètes doivent inclure une date de début des avertissements, un
remplacement, un lien vers la documentation et une date de suppression
définitive au plus tard trois mois après le début des avertissements. N’ajoutez
pas de chemin de compatibilité obsolète avec une période de suppression sans
échéance, sauf si les responsables de maintenance décident explicitement qu’il
s’agit d’une compatibilité permanente et le marquent plutôt comme `active`.

## Zones de compatibilité actuelles

Le registre suit actuellement environ 70 codes de compatibilité dans les
zones suivantes. Le nouveau code de Plugin doit utiliser le remplacement
indiqué dans chaque zone et dans le guide de migration correspondant ; les
plugins existants peuvent continuer à utiliser un chemin de compatibilité
jusqu’à ce que la documentation, les diagnostics et les notes de publication
annoncent une période de suppression.

- les anciens imports généraux du SDK, tels que `openclaw/plugin-sdk/compat`
- les anciennes structures de plugins composées uniquement de hooks et
  `before_agent_start`
- les anciens noms de hooks de nettoyage `api.on("deactivate", ...)` pendant
  la migration des plugins vers `gateway_stop`
- les anciens points d’entrée de Plugin `activate(api)` pendant la migration
  des plugins vers `register(api)`
- les anciens alias du SDK tels que `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, les générateurs d’état de
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils`
  (remplacé par des sous-chemins de test ciblés
  `openclaw/plugin-sdk/*`), ainsi que les alias de types `ClawdbotConfig` /
  `OpenClawSchemaType`
- le comportement de liste d’autorisation et d’activation des plugins intégrés
- les anciennes métadonnées de manifeste pour les variables d’environnement
  des fournisseurs et des canaux
- les anciens hooks et alias de types des plugins de fournisseur pendant la
  migration des fournisseurs vers des hooks explicites de catalogue,
  d’authentification, de raisonnement, de relecture et de transport
- les anciens alias d’environnement d’exécution tels que
  `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt`
  et les méthodes obsolètes `api.runtime.config.loadConfig()` /
  `api.runtime.config.writeConfigFile(...)`
- les champs plats de rappel `WebInboundMessage` de WhatsApp (voir ci-dessous)
- les champs d’admission de premier niveau de `WebInboundMessage` de WhatsApp
  (voir ci-dessous)
- l’ancien enregistrement fractionné des plugins de mémoire pendant leur
  migration vers `registerMemoryCapability`
- l’ancien enregistrement de fournisseurs d’incorporation propre à la mémoire
  pendant leur migration vers `api.registerEmbeddingProvider(...)` et
  `contracts.embeddingProviders`
- les anciens assistants du SDK de canal pour les schémas de messages natifs,
  le filtrage des mentions, la mise en forme des enveloppes entrantes et
  l’imbrication des capacités d’approbation
- les anciens alias de clé de route de canal et d’assistants de comparaison de
  cibles pendant la migration des plugins vers
  `openclaw/plugin-sdk/channel-route`
- les indications d’activation remplacées par la responsabilité des
  contributions du manifeste
- le repli vers l’environnement d’exécution de `setup-api` pendant la migration
  des descripteurs de configuration initiale vers les métadonnées à froid
  `setup.requiresRuntime: false`
- les hooks `discovery` des fournisseurs pendant la migration des hooks de
  catalogue de fournisseurs vers `catalog.run(...)`
- les métadonnées de canal `showConfigured` / `showInSetup` pendant la
  migration des paquets de canaux vers `openclaw.channel.exposure`
- les anciennes clés de configuration de politique d’environnement d’exécution
  pendant que Doctor migre les opérateurs vers `agentRuntime`
- le repli vers les métadonnées de configuration générées des canaux intégrés
  pendant le déploiement des métadonnées `channelConfigs` donnant la priorité
  au registre
- les indicateurs d’environnement persistants de désactivation du registre de
  plugins et de migration d’installation pendant que les flux de réparation
  migrent les opérateurs vers `openclaw plugins registry --refresh` et
  `openclaw doctor --fix`
- les anciens chemins de configuration de recherche Web, de récupération Web
  et de x_search appartenant aux plugins pendant que Doctor les migre vers
  `plugins.entries.<plugin>.config`
- l’ancienne configuration rédigée `plugins.installs` et les alias de chemins
  de chargement des plugins intégrés pendant la migration des métadonnées
  d’installation vers le registre de plugins géré par l’état

### Alias plats des rappels entrants de WhatsApp

Les rappels de l’environnement d’exécution de WhatsApp transmettent
`WebInboundMessage` : les contextes imbriqués canoniques `event`, `payload`,
`quote`, `group` et `platform`, ainsi que les alias plats obsolètes des champs
de rappel publiés. Le nouveau code de rappel doit lire les contextes imbriqués.
Le code qui construit des messages de rappel imbriqués propres peut utiliser
`WebInboundCallbackMessage` ; les écouteurs de compatibilité qui injectent
encore d’anciens messages plats de test ou de Plugin doivent utiliser
`LegacyFlatWebInboundMessage` ou `WebInboundMessageInput`.

Les alias plats restent disponibles jusqu’au **2026-08-30** ; cette période
s’applique uniquement à l’accès aux alias plats, et non à la structure
imbriquée, qui constitue le contrat canonique de l’environnement d’exécution.
L’annotation TypeScript `@deprecated` de chaque alias plat indique son
remplacement imbriqué exact. Exemples courants :

- `id`, `timestamp` et `isBatched` sont déplacés sous `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` et
  `untrustedStructuredContext` sont déplacés sous `payload`.
- `to`, `chatId`, les champs d’expéditeur et d’identité propre,
  `sendComposing`, `reply(...)` et `sendMedia(...)` sont déplacés sous
  `platform`.
- Les champs `replyTo*` sont déplacés sous `quote` ; les champs d’objet, de
  participants et de mentions de groupe sont déplacés sous `group`.

`payload.untrustedStructuredContext` est extrait des charges utiles entrantes
des fournisseurs. Les plugins doivent examiner `label`, `source` et `type`
avant de considérer son `payload` comme faisant autorité.

### Champs d’admission entrants de WhatsApp

Les messages de rappel WhatsApp acceptés comportent `admission`, une enveloppe
pouvant être exposée publiquement pour la décision de contrôle d’accès ayant
autorisé le message. Le nouveau code de rappel doit lire les informations
d’admission depuis `msg.admission` plutôt que depuis les anciens champs
d’admission de premier niveau.

Les champs de premier niveau restent disponibles jusqu’au **2026-08-30**.
L’annotation TypeScript `@deprecated` de chaque champ indique son
remplacement :

- `from` et `conversationId` sont déplacés vers `admission.conversation.id`.
- `accountId` est déplacé vers `admission.accountId`.
- `accessControlPassed` est une vue de compatibilité dérivée de
  `admission.ingress.decision === "allow"` ; sur les messages qui comportent
  déjà `admission`, l’écriture de l’ancien booléen ne réécrit pas le graphe
  d’entrée.
- `chatType` est déplacé vers `admission.conversation.kind`.

## Paquet de l’inspecteur de plugins

L’inspecteur de plugins doit résider hors du dépôt principal d’OpenClaw sous la
forme d’un paquet ou dépôt distinct fondé sur les contrats versionnés de
compatibilité et de manifeste. La CLI initiale doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit produire la validation du manifeste et du schéma, la version de
compatibilité du contrat vérifiée, les contrôles des métadonnées
d’installation et de source, les contrôles d’importation des chemins à froid,
ainsi que les avertissements d’obsolescence et de compatibilité. Utilisez
`--json` pour obtenir une sortie stable et lisible par machine dans les
annotations de CI. Le cœur d’OpenClaw doit exposer les contrats et les données
de test que l’inspecteur peut consommer, mais ne doit pas publier le binaire de
l’inspecteur depuis le paquet principal `openclaw`.

### Voie d’acceptation des responsables de maintenance

Utilisez Blacksmith Testbox adossé à Crabbox pour la voie d’acceptation des
paquets installables lors de la validation de l’inspecteur externe par rapport
aux paquets de Plugin OpenClaw. Exécutez-la depuis une copie de travail OpenClaw
propre une fois le paquet compilé :

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Gardez cette voie facultative pour les responsables de maintenance, car elle
installe un paquet npm externe et peut inspecter des paquets de plugins clonés
hors du dépôt. Les garde-fous du dépôt local couvrent la table d’exportation du
SDK, les métadonnées du registre de compatibilité, la réduction progressive
des imports obsolètes du SDK et les limites d’importation des extensions
intégrées ; la preuve de l’inspecteur dans Testbox couvre le paquet tel que les
auteurs de plugins externes l’utilisent.

## Notes de publication

Les notes de publication doivent inclure les prochaines obsolescences de
plugins avec leurs dates cibles et des liens vers la documentation de
migration, avant qu’un chemin de compatibilité ne passe à `removal-pending` ou
`removed`.
