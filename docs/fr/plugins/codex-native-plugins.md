---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent des plugins Codex natifs
    - Vous migrez des plugins Codex sélectionnés par OpenAI et installés à partir des sources
    - Vous dépannez codexPlugins, l’inventaire des applications, les actions destructrices ou les diagnostics des applications de Plugin
summary: Configurer les Plugins Codex natifs migrés pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-05-13T02:53:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La prise en charge native des plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser les capacités d’application et de plugin propres à l’app-server Codex dans le même thread Codex que celui qui gère le tour OpenClaw.

OpenClaw ne traduit pas les plugins Codex en outils dynamiques OpenClaw `codex_plugin_*` synthétiques. Les appels de Plugin restent dans la transcription Codex native, et l’app-server Codex possède l’exécution MCP adossée aux applications.

Utilisez cette page une fois que le [harness Codex](/fr/plugins/codex-harness) de base fonctionne.

## Exigences

- Le runtime de l’agent OpenClaw sélectionné doit être le harness Codex natif.
- `plugins.entries.codex.enabled` doit être true.
- `plugins.entries.codex.config.codexPlugins.enabled` doit être true.
- La V1 prend uniquement en charge les plugins `openai-curated` que la migration a observés comme installés depuis la source dans le répertoire personnel Codex source.
- L’app-server Codex cible doit pouvoir voir le marketplace, le plugin et l’inventaire des applications attendus.

`codexPlugins` n’a aucun effet sur les exécutions PI, les exécutions normales du fournisseur OpenAI, les liaisons de conversation ACP ni les autres harnesses, car ces chemins ne créent pas de threads app-server Codex avec une config `apps` native.

## Démarrage rapide

Prévisualisez la migration depuis le répertoire personnel Codex source :

```bash
openclaw migrate codex --dry-run
```

Utilisez la vérification stricte des applications source lorsque vous voulez que la migration vérifie l’accessibilité des applications source avant de planifier l’activation native des plugins :

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Appliquez la migration lorsque le plan semble correct :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les plugins admissibles et appelle `plugin/install` de l’app-server Codex pour les plugins sélectionnés. Une config migrée typique ressemble à ceci :

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

Après avoir modifié `codexPlugins`, utilisez `/new`, `/reset` ou redémarrez le gateway afin que les futures sessions du harness Codex démarrent avec le nouvel ensemble d’applications.

## Fonctionnement de la configuration native des plugins

L’intégration comporte trois états distincts :

- Installé : Codex dispose du bundle de plugin local dans le runtime app-server cible.
- Activé : la config OpenClaw accepte de rendre le plugin disponible aux tours du harness Codex.
- Accessible : l’app-server Codex confirme que les entrées d’application du plugin sont disponibles pour le compte actif et peuvent être mappées à l’identité du plugin migré.

La migration est l’étape durable d’installation et d’admissibilité. Pendant la planification, OpenClaw lit les détails `plugin/read` de Codex source et vérifie que la réponse du compte app-server Codex source est un compte avec abonnement ChatGPT. Les réponses de compte non ChatGPT ou manquantes ignorent les plugins adossés aux applications avec `codex_subscription_required`. Par défaut, la migration n’appelle pas `app/list` sur la source ; les plugins source adossés aux applications qui passent la barrière du compte sont planifiés sans vérification de l’accessibilité des applications source, et les échecs de transport lors de la recherche du compte sont ignorés avec `codex_account_unavailable`. Avec `--verify-plugin-apps`, la migration prend un nouvel instantané `app/list` source et exige que chaque application possédée soit présente, activée et accessible avant de planifier l’activation native. Dans ce mode, les échecs de transport lors de la recherche du compte passent à la barrière d’inventaire des applications source. L’inventaire des applications au runtime est la vérification d’accessibilité de la session cible après migration. La configuration de session du harness Codex calcule ensuite une config restrictive d’applications de thread pour les applications de plugin activées et accessibles.

La config d’applications de thread est calculée quand OpenClaw établit une session du harness Codex ou remplace une liaison de thread Codex obsolète. Elle n’est pas recalculée à chaque tour.

## Limite de prise en charge de la V1

La V1 est volontairement restreinte :

- Seuls les plugins `openai-curated` déjà installés dans l’inventaire app-server Codex source sont admissibles à la migration.
- Les plugins source adossés aux applications doivent passer la barrière d’abonnement au moment de la migration. `--verify-plugin-apps` ajoute la barrière d’inventaire des applications source. Les comptes soumis à abonnement ainsi que, en mode vérification, les applications source inaccessibles, désactivées ou manquantes, ou les échecs d’actualisation de l’inventaire des applications source, sont signalés comme éléments manuels ignorés plutôt que comme entrées de config activées. Les détails de plugin illisibles sont ignorés avant la barrière d’inventaire des applications source.
- La migration écrit des identités de plugin explicites avec `marketplaceName` et `pluginName` ; elle n’écrit pas de chemins de cache `marketplacePath` locaux.
- `codexPlugins.enabled` est l’interrupteur d’activation global.
- Il n’existe pas de joker `plugins["*"]` ni de clé de config accordant une autorité d’installation arbitraire.
- Les marketplaces non pris en charge, les bundles de plugin mis en cache, les hooks et les fichiers de config Codex sont conservés dans le rapport de migration pour examen manuel.

## Inventaire des applications et propriété

OpenClaw lit l’inventaire des applications Codex via `app/list` de l’app-server, le met en cache pendant une heure et actualise de manière asynchrone les entrées obsolètes ou manquantes. Le cache est uniquement en mémoire ; redémarrer la CLI ou le gateway le supprime, et OpenClaw le reconstruit à partir de la prochaine lecture `app/list`.

La migration et le runtime utilisent des clés de cache séparées :

- La vérification de migration source utilise le répertoire personnel Codex source et les options de démarrage de l’app-server source. Cela s’exécute uniquement lorsque `--verify-plugin-apps` est défini, et force un parcours `app/list` source frais pour cette exécution de planification.
- La configuration du runtime cible utilise l’identité app-server Codex de l’agent cible lorsqu’elle construit la config d’applications de thread Codex. L’activation d’un plugin invalide cette clé de cache cible, puis force son actualisation après `plugin/install`.

Une application de plugin n’est exposée que lorsqu’OpenClaw peut la remapper au plugin migré par une propriété stable :

- id exact de l’application depuis le détail du plugin
- nom de serveur MCP connu
- métadonnées stables uniques

La propriété ambiguë ou uniquement basée sur le nom d’affichage est exclue jusqu’à ce que la prochaine actualisation d’inventaire prouve la propriété.

## Config d’applications de thread

OpenClaw injecte un correctif `config.apps` restrictif pour le thread Codex : `_default` est désactivé et seules les applications possédées par des plugins migrés activés sont activées.

OpenClaw définit `destructive_enabled` au niveau de l’application à partir de la stratégie `allow_destructive_actions` globale ou par plugin effective et laisse Codex appliquer les métadonnées d’outils destructifs depuis ses annotations d’outils d’application natives. La config de l’application `_default` est désactivée avec `open_world_enabled: false`. Les applications de plugin activées sont émises avec `open_world_enabled: true` ; OpenClaw n’expose pas de réglage de stratégie open-world séparé pour les plugins et ne maintient pas de listes de refus de noms d’outils destructifs par plugin.

Le mode d’approbation des outils est automatique par défaut pour les applications de plugin afin que les outils de lecture non destructifs puissent s’exécuter sans interface d’approbation dans le même thread. Les outils destructifs restent contrôlés par la stratégie `destructive_enabled` de chaque application.

## Stratégie d’action destructive

Les élicitations de plugins destructives sont autorisées par défaut pour les plugins Codex migrés, tandis que les schémas dangereux et la propriété ambiguë échouent toujours en mode fermé :

- `allow_destructive_actions` global vaut `true` par défaut.
- `allow_destructive_actions` par plugin remplace la stratégie globale pour ce plugin.
- Lorsque la stratégie est `false`, OpenClaw renvoie un refus déterministe.
- Lorsque la stratégie est `true`, OpenClaw accepte automatiquement uniquement les schémas sûrs qu’il peut mapper à une réponse d’approbation, comme un champ booléen d’approbation.
- Une identité de plugin manquante, une propriété ambiguë, un id de tour manquant, un id de tour incorrect ou un schéma d’élicitation dangereux entraînent un refus au lieu d’une demande de confirmation.

## Dépannage

**`auth_required` :** la migration a installé le plugin, mais l’une de ses applications nécessite encore une authentification. L’entrée de plugin explicite est écrite désactivée jusqu’à ce que vous réautorisiez et activiez le plugin.

**`app_inaccessible`, `app_disabled` ou `app_missing` :**
la migration n’a pas installé le plugin parce que l’inventaire des applications Codex source n’a pas indiqué toutes les applications possédées comme présentes, activées et accessibles lorsque `--verify-plugin-apps` était défini. Réautorisez ou activez l’application dans Codex, puis relancez la migration avec `--verify-plugin-apps`.

**`app_inventory_unavailable` :** la migration n’a pas installé le plugin parce que la vérification stricte des applications source a été demandée et que l’actualisation de l’inventaire des applications Codex source a échoué. Corrigez l’accès à l’app-server Codex source ou réessayez sans `--verify-plugin-apps` si vous acceptez le plan plus rapide soumis à la barrière du compte.

**`codex_subscription_required` :** la migration n’a pas installé le plugin adossé à l’application parce que le compte app-server Codex source n’était pas connecté avec un compte d’abonnement ChatGPT. Connectez-vous à l’application Codex avec l’authentification par abonnement, puis relancez la migration.

**`codex_account_unavailable` :** la migration n’a pas installé le plugin adossé à l’application parce que le compte app-server Codex source n’a pas pu être lu. Corrigez l’authentification de l’app-server Codex source ou relancez avec `--verify-plugin-apps` si vous voulez que l’inventaire des applications source décide de l’admissibilité lorsque la recherche du compte échoue.

**`marketplace_missing` ou `plugin_missing` :** l’app-server Codex cible ne peut pas voir le marketplace ou le plugin `openai-curated` attendu. Relancez la migration contre le runtime cible ou inspectez l’état des plugins de l’app-server Codex.

**`app_inventory_missing` ou `app_inventory_stale` :** l’état de préparation des applications provenait d’un cache vide ou obsolète. OpenClaw planifie une actualisation asynchrone et exclut les applications de plugin jusqu’à ce que la propriété et l’état de préparation soient connus.

**`app_ownership_ambiguous` :** l’inventaire des applications ne correspondait que par nom d’affichage, l’application n’est donc pas exposée au thread Codex.

**Config modifiée mais l’agent ne voit pas le plugin :** utilisez `/new`, `/reset` ou redémarrez le gateway. Les liaisons de thread Codex existantes conservent la config d’applications avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw établisse une nouvelle session de harness ou remplace une liaison obsolète.

**L’action destructive est refusée :** vérifiez les valeurs globales et par plugin de `allow_destructive_actions`. Même lorsque la stratégie vaut true, les schémas d’élicitation dangereux et l’identité de plugin ambiguë échouent toujours en mode fermé.

## Connexe

- [Harness Codex](/fr/plugins/codex-harness)
- [Référence du harness Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harness Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migration](/fr/cli/migrate)
