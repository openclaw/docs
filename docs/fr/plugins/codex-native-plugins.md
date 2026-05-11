---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent des Plugins Codex natifs
    - Vous migrez des plugins Codex sélectionnés par OpenAI et installés depuis les sources
    - Vous dépannez codexPlugins, l’inventaire des applications, les actions destructrices ou les diagnostics des applications de Plugin
summary: Configurer les plugins Codex natifs migrés pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-05-11T20:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La prise en charge native des plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser les capacités d’applications et de plugins propres à Codex app-server dans le même fil Codex que celui qui traite le tour OpenClaw.

OpenClaw ne traduit pas les plugins Codex en outils dynamiques OpenClaw synthétiques `codex_plugin_*`. Les appels de plugins restent dans la transcription Codex native, et Codex app-server possède l’exécution MCP adossée aux applications.

Utilisez cette page une fois que le [harness Codex](/fr/plugins/codex-harness) de base fonctionne.

## Prérequis

- Le runtime de l’agent OpenClaw sélectionné doit être le harness Codex natif.
- `plugins.entries.codex.enabled` doit être true.
- `plugins.entries.codex.config.codexPlugins.enabled` doit être true.
- V1 ne prend en charge que les plugins `openai-curated` que la migration a observés comme installés depuis la source dans le répertoire d’accueil Codex source.
- Le Codex app-server cible doit pouvoir voir l’inventaire de marketplace, de plugins et d’applications attendu.

`codexPlugins` n’a aucun effet sur les exécutions PI, les exécutions normales du fournisseur OpenAI, les liaisons de conversation ACP ni les autres harnesses, car ces chemins ne créent pas de fils Codex app-server avec une configuration `apps` native.

## Démarrage rapide

Prévisualisez la migration depuis le répertoire d’accueil Codex source :

```bash
openclaw migrate codex --dry-run
```

Appliquez la migration lorsque le plan semble correct :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les plugins éligibles et appelle Codex app-server `plugin/install` pour les plugins sélectionnés. Une configuration migrée typique ressemble à ceci :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

Après avoir modifié `codexPlugins`, utilisez `/new`, `/reset` ou redémarrez le Gateway afin que les futures sessions du harness Codex démarrent avec l’ensemble d’applications mis à jour.

## Fonctionnement de la configuration native des plugins

L’intégration comporte trois états distincts :

- Installé : Codex dispose du bundle de plugin local dans le runtime app-server cible.
- Activé : la configuration OpenClaw accepte de rendre le plugin disponible pour les tours du harness Codex.
- Accessible : Codex app-server confirme que les entrées d’application du plugin sont disponibles pour le compte actif et peuvent être associées à l’identité du plugin migré.

La migration est l’étape durable d’installation et d’éligibilité. L’inventaire des applications au runtime est la vérification d’accessibilité. La configuration de session du harness Codex calcule ensuite une configuration restrictive des applications du fil pour les applications de plugins activées et accessibles.

La configuration des applications du fil est calculée lorsque OpenClaw établit une session de harness Codex ou remplace une liaison de fil Codex obsolète. Elle n’est pas recalculée à chaque tour.

## Périmètre de prise en charge de V1

V1 est volontairement étroite :

- Seuls les plugins `openai-curated` qui étaient déjà installés dans l’inventaire Codex app-server source sont éligibles à la migration.
- La migration écrit des identités de plugins explicites avec `marketplaceName` et `pluginName` ; elle n’écrit pas de chemins de cache locaux `marketplacePath`.
- `codexPlugins.enabled` est l’interrupteur d’activation global.
- Il n’existe aucun caractère générique `plugins["*"]` et aucune clé de configuration accordant une autorité d’installation arbitraire.
- Les marketplaces non prises en charge, les bundles de plugins mis en cache, les hooks et les fichiers de configuration Codex sont conservés dans le rapport de migration pour examen manuel.

## Inventaire des applications et propriété

OpenClaw lit l’inventaire des applications Codex via app-server `app/list`, le met en cache pendant une heure et actualise les entrées obsolètes ou manquantes de manière asynchrone.

Une application de plugin n’est exposée que lorsque OpenClaw peut la relier au plugin migré via une propriété stable :

- identifiant exact de l’application depuis le détail du plugin
- nom de serveur MCP connu
- métadonnées stables uniques

La propriété fondée uniquement sur le nom d’affichage ou ambiguë est exclue jusqu’à ce que l’actualisation suivante de l’inventaire prouve la propriété.

## Configuration des applications du fil

OpenClaw injecte un correctif restrictif `config.apps` pour le fil Codex : `_default` est désactivé et seules les applications détenues par des plugins migrés activés sont activées.

OpenClaw définit `destructive_enabled` au niveau de l’application à partir de la politique effective globale ou par plugin `allow_destructive_actions` et laisse Codex appliquer les métadonnées d’outils destructifs à partir de ses annotations natives d’outils d’application. La configuration d’application `_default` est désactivée avec `open_world_enabled: false`. Les applications de plugins activées sont émises avec `open_world_enabled: true` ; OpenClaw n’expose pas de bouton de politique open-world distinct pour les plugins et ne maintient pas de listes de refus de noms d’outils destructifs par plugin.

Le mode d’approbation des outils est automatique par défaut pour les applications de plugins, afin que les outils de lecture non destructifs puissent s’exécuter sans interface d’approbation dans le même fil. Les outils destructifs restent contrôlés par la politique `destructive_enabled` de chaque application.

## Politique d’action destructive

Les sollicitations destructives des plugins échouent fermées par défaut :

- La valeur par défaut globale de `allow_destructive_actions` est `false`.
- `allow_destructive_actions` par plugin remplace la politique globale pour ce plugin.
- Lorsque la politique est `false`, OpenClaw renvoie un refus déterministe.
- Lorsque la politique est `true`, OpenClaw accepte automatiquement uniquement les schémas sûrs qu’il peut mapper vers une réponse d’approbation, comme un champ booléen d’approbation.
- L’absence d’identité de plugin, une propriété ambiguë, un identifiant de tour manquant, un identifiant de tour incorrect ou un schéma de sollicitation non sûr entraîne un refus au lieu d’une demande.

## Dépannage

**`auth_required` :** la migration a installé le plugin, mais l’une de ses applications nécessite encore une authentification. L’entrée de plugin explicite est écrite comme désactivée jusqu’à ce que vous réautorisiez et l’activiez.

**`marketplace_missing` ou `plugin_missing` :** le Codex app-server cible ne peut pas voir la marketplace ou le plugin `openai-curated` attendu. Relancez la migration contre le runtime cible ou inspectez l’état des plugins Codex app-server.

**`app_inventory_missing` ou `app_inventory_stale` :** la disponibilité des applications provenait d’un cache vide ou obsolète. OpenClaw planifie une actualisation asynchrone et exclut les applications de plugins jusqu’à ce que la propriété et la disponibilité soient connues.

**`app_ownership_ambiguous` :** l’inventaire des applications ne correspondait que par nom d’affichage, l’application n’est donc pas exposée au fil Codex.

**La configuration a changé mais l’agent ne voit pas le plugin :** utilisez `/new`, `/reset` ou redémarrez le Gateway. Les liaisons de fils Codex existantes conservent la configuration d’applications avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw établisse une nouvelle session de harness ou remplace une liaison obsolète.

**L’action destructive est refusée :** vérifiez les valeurs globales et par plugin de `allow_destructive_actions`. Même lorsque la politique est true, les schémas de sollicitation non sûrs et les identités de plugins ambiguës échouent toujours fermés.

## Connexe

- [Harness Codex](/fr/plugins/codex-harness)
- [Référence du harness Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harness Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migration](/fr/cli/migrate)
