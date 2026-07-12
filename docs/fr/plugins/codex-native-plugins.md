---
read_when:
    - Vous souhaitez que les agents OpenClaw en mode Codex utilisent des plugins Codex natifs
    - Vous migrez des plugins Codex sélectionnés par OpenAI et installés depuis les sources
    - Vous configurez un Plugin Codex existant dans un répertoire d’espace de travail
    - Vous diagnostiquez des problèmes liés à codexPlugins, à l’inventaire des applications, aux actions destructrices ou aux diagnostics des applications de Plugin
summary: Configurez les plugins Codex natifs pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-07-12T15:32:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La prise en charge native des plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser les fonctionnalités d’applications et de plugins propres au serveur d’applications Codex dans le même fil Codex que celui qui traite le tour OpenClaw. Les appels de plugins restent dans la transcription Codex native ; le serveur d’applications Codex prend en charge l’exécution MCP adossée aux applications. OpenClaw ne convertit pas les plugins Codex en outils dynamiques OpenClaw `codex_plugin_*` synthétiques.

Utilisez cette page une fois que le [harness Codex](/fr/plugins/codex-harness) de base fonctionne.

## Prérequis

- L’environnement d’exécution de l’agent doit être le harness Codex natif.
- `plugins.entries.codex.enabled` doit être défini sur `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` doit être défini sur `true`.
- Le serveur d’applications Codex cible doit pouvoir accéder à l’inventaire attendu de marketplaces, de plugins et d’applications.
- La migration prend uniquement en charge les plugins `openai-curated` qu’elle a détectés comme installés depuis leur source dans le répertoire personnel Codex source.
- Les plugins `workspace-directory` configurés manuellement nécessitent un serveur d’applications Codex dont `plugin/list` accepte `marketplaceKinds` et dont les résumés d’espaces de travail sans chemin incluent `remotePluginId`. Le plugin doit déjà être installé et activé, et les applications dont il est propriétaire doivent être accessibles dans `app/list`.

`codexPlugins` n’a aucun effet sur les exécutions du fournisseur OpenClaw, les associations de conversations ACP ou les autres harnesses, car ces chemins ne créent jamais de fils de serveur d’applications Codex avec une configuration `apps` native.

Le compte Codex côté OpenAI, la disponibilité des applications et les contrôles des applications/plugins de l’espace de travail proviennent du compte Codex connecté. Consultez [Utiliser Codex avec votre forfait ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) pour en savoir plus sur le modèle de compte et d’administration OpenAI.

## Démarrage rapide

Prévisualisez la migration depuis le répertoire personnel Codex source :

```bash
openclaw migrate codex --dry-run
```

Ajoutez `--verify-plugin-apps` pour que la migration appelle `app/list` sur la source et exige que chaque application détenue soit présente, activée et accessible avant de planifier l’activation native :

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Appliquez la migration lorsque le plan vous convient :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les plugins admissibles et appelle `plugin/install` du serveur d’applications Codex pour les plugins sélectionnés. Une configuration migrée ressemble à ceci :

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

La migration reste limitée à `openai-curated`. Pour utiliser un plugin `workspace-directory` existant, ajoutez-le manuellement avec le `summary.id` exact, qualifié par la marketplace, renvoyé par `plugin/list`. Par exemple, si Codex renvoie `example-plugin@workspace-directory`, configurez cette valeur complète plutôt que son nom d’affichage :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw n’appelle pas `plugin/install` et ne démarre pas l’authentification pour un plugin `workspace-directory`. Installez-le, activez-le et authentifiez-le dans Codex avant d’ajouter ou d’activer la politique OpenClaw. OpenClaw maintient les applications masquées lorsque la réponse omet la marketplace exacte, l’identifiant du plugin, l’identifiant des détails ou les éléments attestant que l’application est prête. Si Codex rejette la requête `plugin/list` explicite de l’espace de travail, OpenClaw signale `marketplace_missing` pour chaque plugin d’espace de travail activé et conserve la disponibilité de tous les plugins organisés découverts indépendamment.

Après une modification de `codexPlugins`, les nouvelles conversations Codex récupèrent automatiquement l’ensemble d’applications mis à jour. Exécutez `/new` ou `/reset` pour actualiser la conversation actuelle. Il n’est pas nécessaire de redémarrer le Gateway pour modifier l’état d’activation des plugins.

## Gérer les plugins depuis le chat

`/codex plugins` inspecte ou modifie les plugins Codex natifs configurés depuis le même chat que celui où vous utilisez le harness Codex :

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` est un alias de `/codex plugins list`. La liste affiche la clé de chaque plugin configuré, son état activé/désactivé, le nom du plugin Codex et la marketplace issus de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` écrivent uniquement dans `~/.openclaw/openclaw.json` ; ces commandes ne modifient jamais `~/.codex/config.toml` et n’installent pas de nouveaux plugins Codex. Seul le propriétaire ou un client du Gateway disposant de la portée `operator.admin` peut les exécuter.

L’activation d’un plugin configuré active également le commutateur global `codexPlugins.enabled`. Si un plugin organisé a été écrit comme désactivé parce que la migration a renvoyé `auth_required`, autorisez de nouveau l’application dans Codex avant de l’activer dans OpenClaw. Pour une entrée `workspace-directory`, son activation ici modifie uniquement la politique OpenClaw ; le plugin et l’application doivent déjà être actifs dans Codex.

## Fonctionnement de la configuration native des plugins

L’intégration suit trois états :

| État       | Signification                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Installé   | Codex dispose du paquet du plugin dans l’environnement d’exécution du serveur d’applications cible.                                        |
| Activé     | Codex indique que le plugin est activé et la configuration OpenClaw l’autorise pour les tours du harness Codex.                            |
| Accessible | Le serveur d’applications Codex confirme que les entrées d’application du plugin sont disponibles pour le compte actif et correspondent à l’identité de plugin configurée. |

Pour les plugins `openai-curated`, la migration constitue l’étape durable d’installation et de vérification de l’admissibilité :

- Pendant la planification, OpenClaw lit les détails `plugin/read` du Codex source et vérifie que le compte du serveur d’applications Codex source est un compte avec abonnement ChatGPT. Une réponse indiquant un compte non-ChatGPT ou l’absence de compte entraîne l’exclusion des plugins adossés à une application avec `codex_subscription_required`.
- Par défaut, la migration ignore l’appel `app/list` source : les plugins source adossés à une application qui passent le contrôle du compte sont planifiés sans vérification de l’accessibilité de l’application source, et les échecs de transport lors de la recherche du compte entraînent leur exclusion avec `codex_account_unavailable`.
- Avec `--verify-plugin-apps`, la migration prend un nouvel instantané `app/list` source et exige que chaque application détenue soit présente, activée et accessible avant de planifier l’activation native. Les échecs de transport lors de la recherche du compte passent alors au contrôle de l’inventaire des applications source au lieu d’entraîner immédiatement l’exclusion.

Pour les plugins `workspace-directory`, la configuration s’effectue en dehors d’OpenClaw. OpenClaw interroge cette marketplace uniquement lorsqu’au moins une entrée d’espace de travail activée est configurée, résout chaque plugin à partir de son `summary.id` exact et réutilise les vérifications existantes de propriété par `plugin/read` et d’état de préparation par `app/list`. Un plugin non installé, désactivé, inaccessible ou non authentifié n’expose aucune application ; OpenClaw ne tente ni installation ni authentification.

L’inventaire des applications à l’exécution constitue le contrôle d’accessibilité de la session cible, tant pour les plugins organisés migrés que pour les plugins d’espace de travail configurés manuellement. La configuration de session du harness Codex calcule une configuration restrictive des applications du fil à partir des applications de plugins activées et accessibles ; elle n’est pas recalculée à chaque tour. Par conséquent, `/codex plugins enable`/`disable` n’affecte que les nouvelles conversations Codex. Utilisez `/new` ou `/reset` pour appliquer la modification à la conversation actuelle.

## Limites de la prise en charge V1

- Seuls les plugins `openai-curated` déjà installés dans l’inventaire du serveur d’applications Codex source sont admissibles à la migration.
- L’exécution prend également en charge les entrées `workspace-directory` explicites sur les versions du serveur d’applications dont `plugin/list` implémente `marketplaceKinds` et renvoie `remotePluginId` pour les résumés d’espaces de travail sans chemin. Ces entrées doivent utiliser leur `summary.id` exact, qualifié par la marketplace, et doivent déjà être installées, activées et accessibles aux applications. Une requête de liste d’espace de travail rejetée produit le diagnostic `marketplace_missing` existant pour chaque plugin ; l’absence d’éléments attestant la marketplace, le plugin, les détails ou l’application n’expose aucune application d’espace de travail. L’inventaire organisé issu de la requête de liste par défaut reste utilisable.
- Les plugins source adossés à une application doivent passer le contrôle d’abonnement lors de la migration. `--verify-plugin-apps` ajoute le contrôle de l’inventaire des applications source. Les comptes bloqués par le contrôle d’abonnement ainsi que, en mode de vérification, les applications source inaccessibles, désactivées ou absentes et les échecs d’actualisation de l’inventaire des applications sont signalés comme des éléments manuels ignorés plutôt que comme des entrées de configuration activées. Les détails de plugin illisibles sont ignorés avant le contrôle de l’inventaire des applications.
- La migration écrit des identités de plugin explicites (`marketplaceName` et `pluginName`) ; elle n’écrit pas les chemins de cache locaux `marketplacePath`.
- `codexPlugins.enabled` est le seul commutateur global d’activation ; il n’existe aucun caractère générique `plugins["*"]` ni aucune clé de configuration accordant une autorisation d’installation arbitraire.
- Les marketplaces non organisées, les paquets de plugins mis en cache, les hooks et les fichiers de configuration Codex sont conservés dans le rapport de migration pour examen manuel, et non activés automatiquement. L’exécution accepte les entrées `workspace-directory` configurées manuellement ; les autres marketplaces ne sont toujours pas prises en charge.

## Inventaire des applications et propriété

OpenClaw lit l’inventaire des applications Codex au moyen de `app/list` du serveur d’applications, le met en cache en mémoire pendant une heure et actualise les entrées obsolètes ou manquantes de manière asynchrone. Le cache est local au processus ; le redémarrage de la CLI ou du Gateway le supprime, et OpenClaw le reconstruit lors de la lecture `app/list` suivante.

La migration et l’exécution utilisent des clés de cache distinctes :

- La vérification de la migration source utilise le répertoire personnel Codex source et les options de démarrage. Elle s’exécute uniquement avec `--verify-plugin-apps` et impose un nouveau parcours `app/list` source pour cette planification.
- La configuration de l’exécution cible utilise l’identité du serveur d’applications Codex de l’agent cible lors de la construction de la configuration des applications du fil. L’activation d’un plugin organisé invalide cette clé de cache cible, puis force son actualisation après `plugin/install`. La configuration de `workspace-directory` n’emprunte jamais ce chemin d’activation.

Une application de plugin n’est exposée que lorsqu’OpenClaw peut la rattacher au plugin configuré grâce à une propriété stable : un identifiant d’application exact issu des détails du plugin, un nom de serveur MCP connu ou des métadonnées stables et uniques. Une propriété fondée uniquement sur le nom d’affichage ou ambiguë est exclue jusqu’à ce que l’actualisation suivante de l’inventaire confirme la propriété.

## Applications du compte connecté

Les agents exploités par leur propriétaire peuvent choisir d’inclure toutes les applications déjà connectées à leur compte Codex sans exiger de paquet de plugin correspondant :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` prend un instantané complet de `app/list` lorsqu’un nouveau fil Codex natif est établi et n’admet que les applications marquées comme accessibles pour ce compte. Cette option n’installe pas, n’authentifie pas et n’active pas les applications globalement. Les fils existants conservent leur ensemble d’applications persistant ; utilisez `/new`, `/reset` ou redémarrez le Gateway pour prendre en compte les applications nouvellement connectées ou révoquées.

Les applications du compte héritent de la valeur globale `codexPlugins.allow_destructive_actions`, qui accepte `true`, `false`, `"auto"` ou `"ask"`. Une politique explicite par plugin remplace la politique globale pour les identifiants d’application qui se chevauchent. Les échecs d’inventaire entraînent un refus par défaut au lieu d’un repli vers une valeur par défaut non restrictive.

## Configuration des applications du fil

OpenClaw injecte un correctif restrictif `config.apps` pour le fil Codex :
`_default` est désactivé, et seules sont activées les applications appartenant aux plugins configurés et activés ou les applications de compte accessibles admises par `allow_all_plugins`.

La valeur `destructive_enabled` de chaque application provient de la politique effective globale ou propre au plugin `allow_destructive_actions` ; `true`, `"auto"` et `"ask"` définissent tous `destructive_enabled: true`, tandis que `false` le définit sur `false`. Codex continue d’appliquer les métadonnées des outils destructifs provenant des annotations d’outils d’application natives.
`_default` est désactivé avec `open_world_enabled: false` ; les applications de plugins activés reçoivent `open_world_enabled: true`. OpenClaw n’expose pas de paramètre de politique distinct au niveau du plugin pour l’accès au monde ouvert et ne gère pas de listes de refus de noms d’outils destructifs propres à chaque plugin.

Le mode d’approbation des outils est automatique par défaut pour les applications admises, de sorte que les outils de lecture non destructifs s’exécutent sans demande d’approbation dans le même fil. Les outils destructifs restent contrôlés par la politique `destructive_enabled` de chaque application.

## Politique relative aux actions destructives

Les sollicitations destructives des plugins sont autorisées par défaut pour les plugins Codex configurés, tandis que les schémas non sûrs et les propriétés ambiguës échouent en mode fermé :

- La valeur globale de `allow_destructive_actions` est `true` par défaut.
- La valeur de `allow_destructive_actions` propre à un plugin remplace la politique globale pour ce plugin.
- `false` : OpenClaw renvoie un refus déterministe.
- `true` : OpenClaw accepte automatiquement uniquement les schémas sûrs qu’il peut associer à une réponse d’approbation, comme un champ booléen d’approbation.
- `"auto"` : OpenClaw expose les actions destructives des plugins à Codex, puis transforme les sollicitations d’approbation MCP dont la propriété est établie en approbations de plugins OpenClaw avant de renvoyer la réponse d’approbation Codex.
- `"ask"` : OpenClaw utilise le même contrôle Codex des écritures et actions destructives que pour `"auto"`, efface les dérogations durables d’approbation Codex propres à chaque outil de l’application avant le démarrage du fil et ne propose qu’une approbation ou un refus ponctuel afin que les approbations durables ne puissent pas supprimer les demandes ultérieures d’actions d’écriture. Pour chaque application admise utilisant `"ask"`, OpenClaw sélectionne l’examinateur d’approbations humaines de Codex pour cette application afin que Codex envoie ses sollicitations d’approbation à OpenClaw ; les autres applications et les approbations de fil ne concernant pas une application conservent leur examinateur et leur politique configurés.
- Une identité de plugin manquante, une propriété ambiguë, un identifiant de tour manquant ou non concordant, ou un schéma de sollicitation non sûr entraîne un refus plutôt qu’une demande.

## Dépannage

| Code                                              | Signification                                                                                                                              | Correction                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migration a installé le plugin, mais l’une de ses applications nécessite encore une authentification. L’entrée est écrite comme désactivée jusqu’à ce que vous l’autorisiez de nouveau. | Autorisez de nouveau l’application dans Codex, puis activez le plugin dans OpenClaw.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | Avec `--verify-plugin-apps`, l’inventaire des applications Codex source n’indiquait pas que toutes les applications détenues étaient présentes, activées et accessibles.         | Autorisez de nouveau ou activez l’application dans Codex, puis relancez la migration avec `--verify-plugin-apps`.                              |
| `app_inventory_unavailable`                       | Une vérification stricte des applications sources a été demandée, mais l’actualisation de l’inventaire des applications Codex source a échoué.                                      | Corrigez l’accès au serveur d’applications Codex source ou réessayez sans `--verify-plugin-apps` pour accepter le plan plus rapide limité par le compte.   |
| `codex_subscription_required`                     | Le compte du serveur d’applications Codex source n’était pas un compte avec abonnement ChatGPT.                                                          | Connectez-vous à l’application Codex avec l’authentification par abonnement, puis relancez la migration.                                                  |
| `codex_account_unavailable`                       | Le compte du serveur d’applications Codex source n’a pas pu être lu.                                                                               | Corrigez l’authentification du serveur d’applications Codex source ou relancez avec `--verify-plugin-apps` afin que l’inventaire des applications sources détermine l’éligibilité. |
| `marketplace_missing`, `plugin_missing`           | La place de marché ou le plugin exact est indisponible ; la demande explicite de catalogue de l’espace de travail a peut-être été rejetée ; les applications de l’espace de travail échouent en mode fermé.  | Vérifiez le contrat de serveur d’applications compatible et l’identifiant exact décrits ci-dessous.                                                |
| `plugin_detail_unavailable`                       | OpenClaw n’a pas pu lire les détails de propriété du plugin.                                                                                    | Examinez les réponses `plugin/list` et `plugin/read` du serveur d’applications cible.                                             |
| `plugin_disabled`                                 | Codex indique que le plugin est installé, mais désactivé.                                                                                     | L’activation organisée peut le corriger ; activez un plugin d’espace de travail dans Codex avant de réessayer.                                  |
| `plugin_activation_failed`                        | L’activation du plugin ne s’est pas terminée.                                                                                                  | Utilisez le diagnostic joint pour distinguer les échecs liés à la place de marché, à l’authentification, à l’actualisation ou à la préparation de l’espace de travail.                |
| `app_inventory_missing`, `app_inventory_stale`    | L’état de préparation de l’application provenait d’un cache vide ou obsolète.                                                                                     | OpenClaw planifie automatiquement une actualisation asynchrone ; les applications du plugin restent exclues jusqu’à ce que leur propriété et leur état de préparation soient connus.  |
| `app_ownership_ambiguous`                         | L’inventaire des applications ne correspondait que par le nom d’affichage.                                                                                          | L’application reste masquée dans le fil Codex jusqu’à ce qu’une actualisation ultérieure établisse sa propriété.                                     |

**Le plugin d’espace de travail est installé, mais n’est pas visible :** vérifiez que le résultat `plugin/list` de l’espace de travail indique que l’identifiant exact configuré est installé et activé, puis vérifiez que `app/list` indique que chaque application détenue est accessible pour le même compte Codex. OpenClaw peut activer une application accessible pour le fil même lorsque l’inventaire du compte indique actuellement que cette application est désactivée. Si vous avez modifié cet état après la mise en cache de l’inventaire des applications par le Gateway, attendez l’actualisation du cache après une heure ou redémarrez le Gateway, puis utilisez `/new` ou `/reset`. OpenClaw ne répare ni n’authentifie les plugins d’espace de travail.
Si la demande explicite de liste d’espace de travail est rejetée, chaque entrée d’espace de travail activée signale `marketplace_missing` ; les entrées organisées sans rapport continuent d’être traitées à partir de la réponse de liste par défaut.

Pour `plugin_detail_unavailable`, un résumé d’espace de travail sans chemin doit inclure `remotePluginId` ; OpenClaw garde les applications détenues masquées lorsque ce sélecteur ou le résultat `plugin/read` qui suit est indisponible. Pour `plugin_activation_failed`, les plugins organisés peuvent signaler un échec lié à la place de marché, à l’authentification ou à l’actualisation après installation. Un plugin d’espace de travail signale ce code lorsqu’il n’est pas déjà actif ; installez-le, activez-le et authentifiez-le en dehors d’OpenClaw.

**La configuration a changé, mais l’agent ne voit pas le plugin :** exécutez `/codex plugins
list` pour confirmer l’état configuré, puis `/new` ou `/reset`. Les liaisons de fil Codex existantes conservent la configuration d’applications avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw établisse une nouvelle session du banc d’exécution ou remplace une liaison obsolète.

**L’action destructive est refusée :** vérifiez les valeurs globale et propre au plugin de `allow_destructive_actions`. Même avec `true`, `"auto"` ou `"ask"`, les schémas de sollicitation non sûrs et les identités de plugins ambiguës échouent toujours en mode fermé.

## Pages connexes

- [Banc d’exécution Codex](/fr/plugins/codex-harness)
- [Référence du banc d’exécution Codex](/fr/plugins/codex-harness-reference)
- [Environnement d’exécution du banc Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migration](/fr/cli/migrate)
