---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent des plugins Codex natifs
    - Vous migrez des plugins Codex sélectionnés par OpenAI et installés depuis les sources
    - Vous dépannez codexPlugins, l’inventaire des applications, les actions destructrices ou les diagnostics d’applications Plugin
summary: Configurer les plugins Codex natifs migrés pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-05-12T00:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Prise en charge native des plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser les capacités d’app et de plugin propres au Codex app-server dans le même thread Codex qui gère le tour OpenClaw.

OpenClaw ne traduit pas les plugins Codex en outils dynamiques OpenClaw synthétiques `codex_plugin_*`. Les appels de plugin restent dans la transcription Codex native, et Codex app-server possède l’exécution MCP adossée aux apps.

Utilisez cette page après que le [harnais Codex](/fr/plugins/codex-harness) de base fonctionne.

## Exigences

- Le runtime de l’agent OpenClaw sélectionné doit être le harnais Codex natif.
- `plugins.entries.codex.enabled` doit être true.
- `plugins.entries.codex.config.codexPlugins.enabled` doit être true.
- V1 prend uniquement en charge les plugins `openai-curated` que la migration a observés comme installés depuis la source dans le répertoire personnel Codex source.
- Le Codex app-server cible doit pouvoir voir le marketplace, le plugin et l’inventaire des apps attendus.

`codexPlugins` n’a aucun effet sur les exécutions PI, les exécutions normales du fournisseur OpenAI, les liaisons de conversation ACP ni les autres harnais, car ces chemins ne créent pas de threads Codex app-server avec une configuration `apps` native.

## Démarrage rapide

Prévisualisez la migration depuis le répertoire personnel Codex source :

```bash
openclaw migrate codex --dry-run
```

Appliquez la migration lorsque le plan paraît correct :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les plugins éligibles et appelle `plugin/install` de Codex app-server pour les plugins sélectionnés. Une configuration migrée typique ressemble à ceci :

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

Après avoir modifié `codexPlugins`, utilisez `/new`, `/reset` ou redémarrez le Gateway afin que les futures sessions du harnais Codex démarrent avec l’ensemble d’apps mis à jour.

## Fonctionnement de la configuration native des plugins

L’intégration comporte trois états distincts :

- Installé : Codex dispose du bundle de plugin local dans le runtime app-server cible.
- Activé : la configuration OpenClaw accepte de rendre le plugin disponible pour les tours du harnais Codex.
- Accessible : Codex app-server confirme que les entrées d’app du plugin sont disponibles pour le compte actif et peuvent être mappées à l’identité de plugin migrée.

La migration est l’étape durable d’installation et d’éligibilité. L’inventaire d’apps au runtime est la vérification d’accessibilité. La configuration de session du harnais Codex calcule ensuite une configuration d’app de thread restrictive pour les apps de plugin activées et accessibles.

La configuration d’app de thread est calculée lorsqu’OpenClaw établit une session de harnais Codex ou remplace une liaison de thread Codex obsolète. Elle n’est pas recalculée à chaque tour.

## Périmètre de prise en charge de la V1

La V1 est volontairement limitée :

- Seuls les plugins `openai-curated` qui étaient déjà installés dans l’inventaire Codex app-server source sont éligibles à la migration.
- La migration écrit des identités de plugin explicites avec `marketplaceName` et `pluginName` ; elle n’écrit pas de chemins de cache `marketplacePath` locaux.
- `codexPlugins.enabled` est l’interrupteur d’activation global.
- Il n’existe pas de caractère générique `plugins["*"]` ni de clé de configuration accordant une autorité d’installation arbitraire.
- Les marketplaces non pris en charge, les bundles de plugin mis en cache, les hooks et les fichiers de configuration Codex sont conservés dans le rapport de migration pour examen manuel.

## Inventaire des apps et propriété

OpenClaw lit l’inventaire d’apps Codex via `app/list` d’app-server, le met en cache pendant une heure et actualise les entrées obsolètes ou manquantes de manière asynchrone.

Une app de plugin est exposée uniquement lorsqu’OpenClaw peut la remapper au plugin migré via une propriété stable :

- id d’app exact depuis le détail du plugin
- nom de serveur MCP connu
- métadonnées stables uniques

Une propriété fondée uniquement sur le nom d’affichage ou ambiguë est exclue jusqu’à ce que la prochaine actualisation de l’inventaire prouve la propriété.

## Configuration d’app de thread

OpenClaw injecte un correctif `config.apps` restrictif pour le thread Codex : `_default` est désactivé et seules les apps détenues par des plugins migrés activés sont activées.

OpenClaw définit `destructive_enabled` au niveau de l’app à partir de la politique effective globale ou par plugin `allow_destructive_actions` et laisse Codex appliquer les métadonnées d’outils destructifs à partir de ses annotations d’outils d’app natives. La configuration de l’app `_default` est désactivée avec `open_world_enabled: false`. Les apps de plugin activées sont émises avec `open_world_enabled: true` ; OpenClaw n’expose pas de bouton de politique open-world distinct pour les plugins et ne maintient pas de listes de refus de noms d’outils destructifs par plugin.

Le mode d’approbation des outils est automatique par défaut pour les apps de plugin, afin que les outils de lecture non destructifs puissent s’exécuter sans UI d’approbation dans le même thread. Les outils destructifs restent contrôlés par la politique `destructive_enabled` de chaque app.

## Politique d’action destructive

Les sollicitations destructives de plugins sont autorisées par défaut pour les plugins Codex migrés, tandis que les schémas non sûrs et les propriétés ambiguës échouent toujours fermées :

- `allow_destructive_actions` global vaut `true` par défaut.
- `allow_destructive_actions` par plugin remplace la politique globale pour ce plugin.
- Lorsque la politique vaut `false`, OpenClaw renvoie un refus déterministe.
- Lorsque la politique vaut `true`, OpenClaw n’accepte automatiquement que les schémas sûrs qu’il peut mapper à une réponse d’approbation, comme un champ booléen d’approbation.
- Une identité de plugin manquante, une propriété ambiguë, un id de tour manquant, un id de tour incorrect ou un schéma de sollicitation non sûr déclenche un refus au lieu d’une demande.

## Dépannage

**`auth_required` :** la migration a installé le plugin, mais l’une de ses apps nécessite encore une authentification. L’entrée de plugin explicite est écrite désactivée jusqu’à ce que vous réautorisiez et l’activiez.

**`marketplace_missing` ou `plugin_missing` :** le Codex app-server cible ne peut pas voir le marketplace ou le plugin `openai-curated` attendu. Relancez la migration contre le runtime cible ou inspectez l’état du plugin Codex app-server.

**`app_inventory_missing` ou `app_inventory_stale` :** la disponibilité de l’app provenait d’un cache vide ou obsolète. OpenClaw planifie une actualisation asynchrone et exclut les apps de plugin jusqu’à ce que la propriété et la disponibilité soient connues.

**`app_ownership_ambiguous` :** l’inventaire d’apps ne correspondait que par nom d’affichage, donc l’app n’est pas exposée au thread Codex.

**La configuration a changé, mais l’agent ne voit pas le plugin :** utilisez `/new`, `/reset` ou redémarrez le Gateway. Les liaisons de thread Codex existantes conservent la configuration d’app avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw établisse une nouvelle session de harnais ou remplace une liaison obsolète.

**L’action destructive est refusée :** vérifiez les valeurs `allow_destructive_actions` globale et par plugin. Même lorsque la politique vaut true, les schémas de sollicitation non sûrs et l’identité de plugin ambiguë échouent toujours fermés.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migration](/fr/cli/migrate)
