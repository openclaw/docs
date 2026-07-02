---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent des plugins Codex natifs
    - Vous migrez des plugins Codex openai-curated installés depuis les sources
    - Vous dépannez codexPlugins, l’inventaire des applications, les actions destructrices ou les diagnostics des applications Plugin
summary: Configurer les Plugins Codex natifs migrés pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-07-02T00:52:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La prise en charge native des Plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser les propres capacités d’application et de Plugin de l’app-server Codex dans le même fil Codex qui gère le tour OpenClaw.

OpenClaw ne traduit pas les Plugins Codex en outils dynamiques OpenClaw synthétiques `codex_plugin_*`. Les appels de Plugin restent dans la transcription Codex native, et l’app-server Codex possède l’exécution MCP adossée aux applications.

Utilisez cette page après que le [harnais Codex](/fr/plugins/codex-harness) de base fonctionne.

## Exigences

- Le runtime d’agent OpenClaw sélectionné doit être le harnais Codex natif.
- `plugins.entries.codex.enabled` doit être true.
- `plugins.entries.codex.config.codexPlugins.enabled` doit être true.
- La V1 prend uniquement en charge les Plugins `openai-curated` que la migration a observés comme installés depuis la source dans le répertoire personnel Codex source.
- L’app-server Codex cible doit pouvoir voir l’inventaire de marketplace, de Plugin et d’applications attendu.

`codexPlugins` n’a aucun effet sur les exécutions OpenClaw, les exécutions normales du fournisseur OpenAI, les liaisons de conversation ACP ni les autres harnais, car ces chemins ne créent pas de fils d’app-server Codex avec une configuration `apps` native.

L’accès Codex côté OpenAI, la disponibilité des applications et les contrôles d’applications/Plugins d’espace de travail proviennent du compte Codex connecté. Pour le compte OpenAI et le modèle d’administration, consultez [Utiliser Codex avec votre forfait ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Démarrage rapide

Prévisualisez la migration depuis le répertoire personnel Codex source :

```bash
openclaw migrate codex --dry-run
```

Utilisez la vérification stricte des applications sources lorsque vous voulez que la migration vérifie l’accessibilité des applications sources avant de planifier l’activation native des Plugins :

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Appliquez la migration lorsque le plan semble correct :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les Plugins éligibles et appelle `plugin/install` de l’app-server Codex pour les Plugins sélectionnés. Une configuration migrée typique ressemble à ceci :

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

Après modification de `codexPlugins`, les nouvelles conversations Codex récupèrent automatiquement l’ensemble d’applications mis à jour. Utilisez `/new` ou `/reset` pour actualiser la conversation actuelle. Un redémarrage du Gateway n’est pas requis pour les changements d’activation ou de désactivation de Plugin.

## Gérer les Plugins depuis le chat

Utilisez `/codex plugins` lorsque vous voulez inspecter ou modifier les Plugins Codex natifs configurés depuis le même chat où vous exploitez le harnais Codex :

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` est un alias de `/codex plugins list`. La sortie de liste affiche les clés de Plugin configurées, l’état activé/désactivé, le nom du Plugin Codex et le marketplace depuis `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` et `disable` écrivent uniquement dans la configuration OpenClaw à `~/.openclaw/openclaw.json` ; ils ne modifient pas `~/.codex/config.toml` et n’installent pas de nouveaux Plugins Codex. Seul le propriétaire ou un client Gateway avec le périmètre `operator.admin` peut modifier l’état des Plugins.

Activer un Plugin configuré active également le commutateur global `codexPlugins.enabled`. Si le Plugin a été écrit désactivé parce que la migration a renvoyé `auth_required`, réautorisez l’application dans Codex avant de l’activer dans OpenClaw.

## Fonctionnement de la configuration native des Plugins

L’intégration comporte trois états distincts :

- Installé : Codex possède le bundle de Plugin local dans le runtime de l’app-server cible.
- Activé : la configuration OpenClaw accepte de rendre le Plugin disponible pour les tours du harnais Codex.
- Accessible : l’app-server Codex confirme que les entrées d’application du Plugin sont disponibles pour le compte actif et peuvent être associées à l’identité du Plugin migré.

La migration est l’étape durable d’installation et d’éligibilité. Pendant la planification, OpenClaw lit les détails `plugin/read` du Codex source et vérifie que la réponse de compte de l’app-server Codex source est un compte avec abonnement ChatGPT. Les réponses de compte non ChatGPT ou manquantes ignorent les Plugins adossés à des applications avec `codex_subscription_required`. Par défaut, la migration n’appelle pas `app/list` source ; les Plugins sources adossés à des applications qui passent le contrôle de compte sont planifiés sans vérification de l’accessibilité des applications sources, et les échecs de transport de consultation du compte sont ignorés avec `codex_account_unavailable`. Avec `--verify-plugin-apps`, la migration prend un instantané frais de `app/list` source et exige que chaque application possédée soit présente, activée et accessible avant de planifier l’activation native. Dans ce mode, les échecs de transport de consultation du compte basculent vers le contrôle de l’inventaire des applications sources. L’inventaire d’applications au runtime est le contrôle d’accessibilité de la session cible après migration. La configuration de session du harnais Codex calcule ensuite une configuration restrictive des applications de fil pour les applications de Plugin activées et accessibles.

La configuration des applications de fil est calculée lorsqu’OpenClaw établit une session du harnais Codex ou remplace une liaison de fil Codex obsolète. Elle n’est pas recalculée à chaque tour ; ainsi, `/codex plugins enable` et `/codex plugins disable` affectent les nouvelles conversations Codex. Utilisez `/new` ou `/reset` lorsque la conversation actuelle doit récupérer l’ensemble d’applications mis à jour.

## Limite de prise en charge V1

La V1 est volontairement étroite :

- Seuls les Plugins `openai-curated` déjà installés dans l’inventaire de l’app-server Codex source sont éligibles à la migration.
- Les Plugins sources adossés à des applications doivent passer le contrôle d’abonnement au moment de la migration. `--verify-plugin-apps` ajoute le contrôle de l’inventaire des applications sources. Les comptes bloqués par abonnement ainsi que, en mode vérification, les applications sources inaccessibles, désactivées ou manquantes, ou les échecs d’actualisation de l’inventaire des applications sources, sont signalés comme éléments manuels ignorés au lieu d’entrées de configuration activées. Les détails de Plugin illisibles sont ignorés avant le contrôle de l’inventaire des applications sources.
- La migration écrit des identités de Plugin explicites avec `marketplaceName` et `pluginName` ; elle n’écrit pas de chemins de cache `marketplacePath` locaux.
- `codexPlugins.enabled` est le commutateur global d’activation.
- Il n’existe pas de joker `plugins["*"]` ni de clé de configuration qui accorde une autorité d’installation arbitraire.
- Les marketplaces non pris en charge, les bundles de Plugin mis en cache, les hooks et les fichiers de configuration Codex sont conservés dans le rapport de migration pour examen manuel.

## Inventaire d’applications et propriété

OpenClaw lit l’inventaire des applications Codex via `app/list` de l’app-server, le met en cache pendant une heure et actualise les entrées obsolètes ou manquantes de manière asynchrone. Le cache est uniquement en mémoire ; le redémarrage de la CLI ou du Gateway le supprime, et OpenClaw le reconstruit à partir de la lecture `app/list` suivante.

La migration et le runtime utilisent des clés de cache distinctes :

- La vérification de migration source utilise le répertoire personnel Codex source et les options de démarrage de l’app-server source. Cela ne s’exécute que lorsque `--verify-plugin-apps` est défini, et force un parcours `app/list` source frais pour cette exécution de planification.
- La configuration du runtime cible utilise l’identité de l’app-server Codex de l’agent cible lorsqu’elle construit la configuration des applications du fil Codex. L’activation de Plugin invalide cette clé de cache cible, puis force son actualisation après `plugin/install`.

Une application de Plugin n’est exposée que lorsqu’OpenClaw peut la rattacher au Plugin migré via une propriété stable :

- id d’application exact depuis le détail du Plugin
- nom de serveur MCP connu
- métadonnées stables uniques

La propriété basée uniquement sur le nom d’affichage ou ambiguë est exclue jusqu’à ce que l’actualisation suivante de l’inventaire prouve la propriété.

## Configuration des applications de fil

OpenClaw injecte un patch restrictif `config.apps` pour le fil Codex : `_default` est désactivé et seules les applications possédées par des Plugins migrés activés sont activées.

OpenClaw définit `destructive_enabled` au niveau de l’application depuis la politique effective globale ou par Plugin `allow_destructive_actions` et laisse Codex appliquer les métadonnées d’outils destructifs à partir de ses annotations d’outils d’application natives. `true`, `"auto"` et `"ask"` définissent `destructive_enabled: true` ; `false` le définit à false. La configuration de l’application `_default` est désactivée avec `open_world_enabled: false`. Les applications de Plugin activées sont émises avec `open_world_enabled: true` ; OpenClaw n’expose pas de réglage de politique open-world séparé pour les Plugins et ne maintient pas de listes de refus de noms d’outils destructifs par Plugin.

Le mode d’approbation des outils est automatique par défaut pour les applications de Plugin afin que les outils de lecture non destructifs puissent s’exécuter sans interface d’approbation dans le même fil. Les outils destructifs restent contrôlés par la politique `destructive_enabled` de chaque application.

## Politique d’action destructive

Les sollicitations destructives de Plugin sont autorisées par défaut pour les Plugins Codex migrés, tandis que les schémas non sûrs et la propriété ambiguë échouent toujours en mode fermé :

- Le paramètre global `allow_destructive_actions` vaut `true` par défaut.
- Le paramètre par Plugin `allow_destructive_actions` remplace la politique globale pour ce Plugin.
- Lorsque la politique vaut `false`, OpenClaw renvoie un refus déterministe.
- Lorsque la politique vaut `true`, OpenClaw accepte automatiquement uniquement les schémas sûrs qu’il peut mapper à une réponse d’approbation, par exemple un champ booléen d’approbation.
- Lorsque la politique vaut `"auto"`, OpenClaw expose les actions destructives de Plugin à Codex, mais transforme les sollicitations d’approbation MCP dont la propriété est prouvée en approbations de Plugin OpenClaw avant de renvoyer la réponse d’approbation Codex.
- Lorsque la politique vaut `"ask"`, OpenClaw utilise le même contrôle Codex d’écriture/destruction que `"auto"`, efface les remplacements durables d’approbation par outil Codex pour l’application avant le démarrage du fil, et ne propose qu’une approbation ou un refus ponctuel afin que les approbations durables ne puissent pas supprimer les invites ultérieures d’action d’écriture.
- Pour chaque application admise qui utilise `"ask"`, OpenClaw sélectionne le réviseur d’approbations humaines de Codex pour cette application afin que Codex envoie ses sollicitations d’approbation à OpenClaw. Les autres applications et les approbations de fil hors application conservent leur réviseur et leur politique configurés.
- Une identité de Plugin manquante, une propriété ambiguë, un id de tour manquant, un mauvais id de tour ou un schéma de sollicitation non sûr entraîne un refus au lieu d’une invite.

## Dépannage

**`auth_required` :** la migration a installé le Plugin, mais l’une de ses applications nécessite encore une authentification. L’entrée de Plugin explicite est écrite désactivée jusqu’à ce que vous réautorisiez et activiez celui-ci.

**`app_inaccessible`, `app_disabled` ou `app_missing` :**
la migration n’a pas installé le Plugin car l’inventaire des applications Codex source n’indiquait pas toutes les applications possédées comme présentes, activées et accessibles lorsque `--verify-plugin-apps` était défini. Réautorisez ou activez l’application dans Codex, puis relancez la migration avec `--verify-plugin-apps`.

**`app_inventory_unavailable` :** la migration n’a pas installé le Plugin car la vérification stricte des applications sources a été demandée et l’actualisation de l’inventaire des applications Codex source a échoué. Corrigez l’accès à l’app-server Codex source ou réessayez sans `--verify-plugin-apps` si vous acceptez le plan plus rapide contrôlé par le compte.

**`codex_subscription_required` :** la migration n’a pas installé le Plugin adossé à des applications car le compte de l’app-server Codex source n’était pas connecté avec un compte avec abonnement ChatGPT. Connectez-vous à l’application Codex avec une authentification d’abonnement, puis relancez la migration.

**`codex_account_unavailable` :** la migration n’a pas installé le Plugin adossé à des applications car le compte de l’app-server Codex source n’a pas pu être lu. Corrigez l’authentification de l’app-server Codex source ou relancez avec `--verify-plugin-apps` si vous voulez que l’inventaire des applications sources décide de l’éligibilité lorsque la consultation du compte échoue.

**`marketplace_missing` ou `plugin_missing` :** l’app-server Codex cible ne peut pas voir le marketplace ou le Plugin `openai-curated` attendu. Relancez la migration sur le runtime cible ou inspectez l’état des Plugins de l’app-server Codex.

**`app_inventory_missing` ou `app_inventory_stale` :** la disponibilité des applications provient d’un cache vide ou obsolète. OpenClaw planifie une actualisation asynchrone et exclut les applications de Plugin jusqu’à ce que la propriété et la disponibilité soient connues.

**`app_ownership_ambiguous` :** l’inventaire des applications ne correspondait que par nom d’affichage ; l’application n’est donc pas exposée au fil Codex.

**Configuration modifiée, mais l’agent ne voit pas le plugin :** utilisez `/codex plugins
list` pour confirmer l’état configuré, puis utilisez `/new` ou `/reset`. Les liaisons de fil
Codex existantes conservent la configuration de l’application avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw
établisse une nouvelle session de harness ou remplace une liaison obsolète.

**Action destructive refusée :** vérifiez les valeurs globales et propres à chaque plugin de
`allow_destructive_actions`. Même lorsque la stratégie vaut true, `"auto"` ou
`"ask"`, les schémas d’élicitation non sûrs et l’identité ambiguë du plugin échouent toujours
en mode fermé.

## Associé

- [harness Codex](/fr/plugins/codex-harness)
- [Référence du harness Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harness Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrer la CLI](/fr/cli/migrate)
