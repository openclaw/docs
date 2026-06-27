---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent les plugins Codex natifs
    - Vous migrez des plugins Codex sélectionnés par OpenAI et installés depuis les sources
    - Vous dépannez codexPlugins, l’inventaire des applications, les actions destructrices ou les diagnostics des applications Plugin
summary: Configurer les Plugins Codex natifs migrés pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-06-27T17:47:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La prise en charge native des plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser
les capacités d’application et de plugin propres à l’app-server Codex dans le même fil Codex qui
gère le tour OpenClaw.

OpenClaw ne traduit pas les plugins Codex en outils dynamiques OpenClaw
`codex_plugin_*` synthétiques. Les appels de plugins restent dans la transcription Codex native, et
l’app-server Codex possède l’exécution MCP adossée aux applications.

Utilisez cette page après le fonctionnement du [harness Codex](/fr/plugins/codex-harness) de base.

## Exigences

- Le runtime d’agent OpenClaw sélectionné doit être le harness Codex natif.
- `plugins.entries.codex.enabled` doit valoir true.
- `plugins.entries.codex.config.codexPlugins.enabled` doit valoir true.
- La V1 ne prend en charge que les plugins `openai-curated` que la migration a observés comme
  installés depuis la source dans le répertoire personnel Codex source.
- L’app-server Codex cible doit pouvoir voir le marketplace, le plugin et l’inventaire des applications attendus.

`codexPlugins` n’a aucun effet sur les exécutions OpenClaw, les exécutions normales du fournisseur OpenAI, les liaisons de conversation ACP
ou les autres harnesses, car ces chemins ne créent pas de fils app-server Codex avec une configuration `apps` native.

L’accès Codex côté OpenAI, la disponibilité des applications et les contrôles d’applications/plugins de l’espace de travail
proviennent du compte Codex connecté. Pour le compte OpenAI et le modèle d’administration,
consultez [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Démarrage rapide

Prévisualisez la migration depuis le répertoire personnel Codex source :

```bash
openclaw migrate codex --dry-run
```

Utilisez la vérification stricte des applications source lorsque vous voulez que la migration vérifie l’accessibilité des applications source
avant de planifier l’activation native des plugins :

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Appliquez la migration lorsque le plan semble correct :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les plugins éligibles et appelle
`plugin/install` de l’app-server Codex pour les plugins sélectionnés. Une configuration migrée typique
ressemble à ceci :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Après une modification de `codexPlugins`, les nouvelles conversations Codex récupèrent automatiquement
l’ensemble d’applications mis à jour. Utilisez `/new` ou `/reset` pour actualiser la conversation actuelle.
Un redémarrage du Gateway n’est pas nécessaire pour les changements d’activation ou de désactivation de plugins.

## Gérer les plugins depuis le chat

Utilisez `/codex plugins` lorsque vous voulez inspecter ou modifier les plugins Codex natifs configurés
depuis le même chat où vous utilisez le harness Codex :

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` est un alias de `/codex plugins list`. La sortie de liste affiche
les clés de plugins configurées, l’état activé/désactivé, le nom du plugin Codex et le marketplace
depuis `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` et `disable` écrivent uniquement dans la configuration OpenClaw à
`~/.openclaw/openclaw.json` ; ils ne modifient pas `~/.codex/config.toml` et n’installent pas
de nouveaux plugins Codex. Seul le propriétaire ou un client Gateway avec le périmètre
`operator.admin` peut modifier l’état des plugins.

L’activation d’un plugin configuré active également l’interrupteur global
`codexPlugins.enabled`. Si le plugin a été écrit désactivé parce que la migration a renvoyé `auth_required`,
réautorisez l’application dans Codex avant de l’activer dans OpenClaw.

## Fonctionnement de la configuration native des plugins

L’intégration comporte trois états distincts :

- Installé : Codex possède le bundle de plugin local dans le runtime app-server cible.
- Activé : la configuration OpenClaw accepte de rendre le plugin disponible aux tours du harness Codex.
- Accessible : l’app-server Codex confirme que les entrées d’application du plugin sont disponibles
  pour le compte actif et peuvent être mappées à l’identité du plugin migré.

La migration est l’étape durable d’installation et d’éligibilité. Pendant la planification, OpenClaw
lit les détails `plugin/read` de Codex source et vérifie que la réponse du compte app-server Codex source
est un compte d’abonnement ChatGPT. Les réponses de compte non ChatGPT ou manquantes ignorent les plugins adossés à des applications avec
`codex_subscription_required`. Par défaut, la migration n’appelle pas `app/list` source ;
les plugins source adossés à des applications qui passent la barrière du compte sont planifiés
sans vérification d’accessibilité des applications source, et les échecs de transport de la recherche de compte
sont ignorés avec `codex_account_unavailable`. Avec `--verify-plugin-apps`,
la migration prend un instantané `app/list` source frais et exige que chaque application possédée
soit présente, activée et accessible avant de planifier l’activation native. Dans
ce mode, les échecs de transport de la recherche de compte passent à la barrière
d’inventaire des applications source. L’inventaire d’applications au runtime est la vérification d’accessibilité
de la session cible après la migration. La configuration de session du harness Codex calcule ensuite une
configuration restrictive des applications du fil pour les applications de plugin activées et accessibles.

La configuration des applications du fil est calculée quand OpenClaw établit une session de harness Codex
ou remplace une liaison de fil Codex obsolète. Elle n’est pas recalculée à chaque tour, donc
`/codex plugins enable` et `/codex plugins disable` affectent les nouvelles conversations Codex.
Utilisez `/new` ou `/reset` lorsque la conversation actuelle doit récupérer
l’ensemble d’applications mis à jour.

## Limite de prise en charge V1

La V1 est volontairement étroite :

- Seuls les plugins `openai-curated` déjà installés dans l’inventaire app-server Codex source
  sont éligibles à la migration.
- Les plugins source adossés à des applications doivent passer la barrière d’abonnement au moment de la migration.
  `--verify-plugin-apps` ajoute la barrière d’inventaire des applications source. Les comptes bloqués par l’abonnement
  ainsi que, en mode vérification, les applications source inaccessibles, désactivées ou manquantes
  ou les échecs d’actualisation de l’inventaire des applications source sont signalés comme éléments manuels ignorés
  au lieu d’entrées de configuration activées. Les détails de plugin illisibles sont ignorés
  avant la barrière d’inventaire des applications source.
- La migration écrit des identités de plugin explicites avec `marketplaceName` et
  `pluginName` ; elle n’écrit pas de chemins de cache `marketplacePath` locaux.
- `codexPlugins.enabled` est l’interrupteur d’activation global.
- Il n’existe aucun joker `plugins["*"]` ni aucune clé de configuration accordant une autorité d’installation arbitraire.
- Les marketplaces non pris en charge, les bundles de plugins mis en cache, les hooks et les fichiers de configuration Codex
  sont conservés dans le rapport de migration pour examen manuel.

## Inventaire des applications et propriété

OpenClaw lit l’inventaire des applications Codex via `app/list` de l’app-server, le met en cache pendant
une heure et actualise les entrées obsolètes ou manquantes de manière asynchrone. Le cache est
uniquement en mémoire ; le redémarrage de la CLI ou du Gateway le supprime, et OpenClaw le reconstruit
à partir de la lecture `app/list` suivante.

La migration et le runtime utilisent des clés de cache distinctes :

- La vérification de migration source utilise le répertoire personnel Codex source et les options de démarrage de l’app-server source.
  Elle ne s’exécute que lorsque `--verify-plugin-apps` est défini, et elle
  force un parcours `app/list` source frais pour cette exécution de planification.
- La configuration du runtime cible utilise l’identité app-server Codex de l’agent cible lorsqu’elle
  construit la configuration des applications du fil Codex. L’activation d’un plugin invalide cette clé de cache cible
  puis force son actualisation après `plugin/install`.

Une application de plugin n’est exposée que lorsqu’OpenClaw peut la remapper au plugin migré
via une propriété stable :

- identifiant exact d’application depuis les détails du plugin
- nom de serveur MCP connu
- métadonnées stables uniques

La propriété basée uniquement sur le nom d’affichage ou ambiguë est exclue jusqu’à ce que la prochaine actualisation d’inventaire
prouve la propriété.

## Configuration des applications du fil

OpenClaw injecte un correctif restrictif `config.apps` pour le fil Codex :
`_default` est désactivé et seules les applications possédées par des plugins migrés activés sont
activées.

OpenClaw définit `destructive_enabled` au niveau de l’application à partir de la politique effective globale ou
par plugin `allow_destructive_actions` et laisse Codex appliquer
les métadonnées d’outils destructifs depuis ses annotations d’outils d’application natives. `true`,
`"auto"` et `"always"` définissent `destructive_enabled: true` ; `false` le définit sur
false. La configuration d’application `_default` est désactivée avec `open_world_enabled: false`.
Les applications de plugin activées sont émises avec `open_world_enabled: true` ; OpenClaw n’expose
pas de bouton de politique open-world séparé pour les plugins et ne maintient pas
de listes de refus de noms d’outils destructifs par plugin.

Le mode d’approbation des outils est automatique par défaut pour les applications de plugin afin que les outils de lecture
non destructifs puissent s’exécuter sans interface d’approbation dans le même fil. Les outils destructifs restent
contrôlés par la politique `destructive_enabled` de chaque application.

## Politique d’actions destructives

Les sollicitations destructives de plugins sont autorisées par défaut pour les plugins Codex migrés,
tandis que les schémas dangereux et la propriété ambiguë échouent toujours fermés :

- `allow_destructive_actions` global vaut `true` par défaut.
- `allow_destructive_actions` par plugin remplace la politique globale pour ce
  plugin.
- Lorsque la politique vaut `false`, OpenClaw renvoie un refus déterministe.
- Lorsque la politique vaut `true`, OpenClaw accepte automatiquement uniquement les schémas sûrs qu’il peut mapper à
  une réponse d’approbation, comme un champ booléen d’approbation.
- Lorsque la politique vaut `"auto"`, OpenClaw expose les actions de plugin destructives à
  Codex mais transforme les sollicitations d’approbation MCP à propriété prouvée en approbations de plugin OpenClaw
  avant de renvoyer la réponse d’approbation Codex.
- Lorsque la politique vaut `"always"`, OpenClaw utilise le même contrôle d’écriture/destruction Codex
  que `"auto"`, efface les remplacements durables d’approbation Codex par outil pour
  l’application avant le démarrage du fil, et ne propose qu’une approbation ou un refus à usage unique afin que
  les approbations durables ne puissent pas supprimer les invites ultérieures d’actions d’écriture.
- Une identité de plugin manquante, une propriété ambiguë, un identifiant de tour manquant, un mauvais identifiant de tour
  ou un schéma de sollicitation dangereux déclenche un refus au lieu d’une invite.

## Dépannage

**`auth_required` :** la migration a installé le plugin, mais l’une de ses applications a toujours
besoin d’une authentification. L’entrée de plugin explicite est écrite désactivée jusqu’à ce que vous
réautorisiez et l’activiez.

**`app_inaccessible`, `app_disabled` ou `app_missing` :**
la migration n’a pas installé le plugin, car l’inventaire des applications Codex source n’a
pas montré toutes les applications possédées comme présentes, activées et accessibles pendant que
`--verify-plugin-apps` était défini. Réautorisez ou activez l’application dans Codex, puis
réexécutez la migration avec `--verify-plugin-apps`.

**`app_inventory_unavailable` :** la migration n’a pas installé le plugin, car
la vérification stricte des applications source a été demandée et l’actualisation de l’inventaire des applications Codex source
a échoué. Corrigez l’accès à l’app-server Codex source ou réessayez sans
`--verify-plugin-apps` si vous acceptez le plan plus rapide bloqué par le compte.

**`codex_subscription_required` :** la migration n’a pas installé le plugin adossé à une application
car le compte app-server Codex source n’était pas connecté avec un compte d’abonnement
ChatGPT. Connectez-vous à l’application Codex avec une authentification d’abonnement,
puis réexécutez la migration.

**`codex_account_unavailable` :** la migration n’a pas installé le plugin adossé à une application
car le compte app-server Codex source n’a pas pu être lu. Corrigez l’authentification de l’app-server Codex source
ou réexécutez avec `--verify-plugin-apps` si vous voulez que l’inventaire des applications source
décide de l’éligibilité lorsque la recherche de compte échoue.

**`marketplace_missing` ou `plugin_missing` :** l’app-server Codex cible
ne peut pas voir le marketplace ou le plugin `openai-curated` attendu. Réexécutez la migration
contre le runtime cible ou inspectez l’état des plugins de l’app-server Codex.

**`app_inventory_missing` ou `app_inventory_stale` :** la disponibilité de l’application provient d’un
cache vide ou obsolète. OpenClaw planifie une actualisation asynchrone et exclut les applications de plugin
jusqu’à ce que la propriété et la disponibilité soient connues.

**`app_ownership_ambiguous` :** l’inventaire des applications ne correspondait que par nom d’affichage, donc
l’application n’est pas exposée au fil Codex.

**Configuration modifiée mais l’agent ne voit pas le plugin :** utilisez `/codex plugins
list` pour confirmer l’état configuré, puis utilisez `/new` ou `/reset`. Les liaisons
de fil Codex existantes conservent la configuration d’applications avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw
établisse une nouvelle session de harness ou remplace une liaison obsolète.

**Action destructrice refusée :** vérifiez les valeurs `allow_destructive_actions` globales et par Plugin. Même lorsque la politique vaut true, `"auto"` ou `"always"`, les schémas d’élicitation non sûrs et l’identité ambiguë du Plugin échouent toujours en mode fermé.

## Associés

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrer la CLI](/fr/cli/migrate)
