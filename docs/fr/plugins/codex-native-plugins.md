---
read_when:
    - Vous souhaitez que les agents OpenClaw en mode Codex utilisent les plugins Codex natifs
    - Vous migrez des plugins Codex sélectionnés par OpenAI et installés depuis les sources
    - Vous configurez un Plugin Codex existant dans un répertoire d’espace de travail
    - Vous dépannez codexPlugins, l’inventaire des applications, les actions destructrices ou les diagnostics des applications de Plugin
summary: Configurer les plugins Codex natifs pour les agents OpenClaw en mode Codex
title: Plugins Codex natifs
x-i18n:
    generated_at: "2026-07-12T02:51:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

La prise en charge native des Plugins Codex permet à un agent OpenClaw en mode Codex d’utiliser les capacités d’applications et de Plugins propres à Codex app-server dans le même fil Codex que celui qui traite le tour OpenClaw. Les appels de Plugins restent dans la transcription native de Codex ; Codex app-server prend en charge l’exécution MCP adossée aux applications. OpenClaw ne convertit pas les Plugins Codex en outils dynamiques OpenClaw `codex_plugin_*` synthétiques.

Utilisez cette page une fois que le [harnais Codex](/fr/plugins/codex-harness) de base fonctionne.

## Prérequis

- L’environnement d’exécution de l’agent doit être le harnais Codex natif.
- `plugins.entries.codex.enabled` doit être défini sur `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` doit être défini sur `true`.
- Le Codex app-server cible doit pouvoir accéder à l’inventaire attendu de places de marché, de Plugins et d’applications.
- La migration prend uniquement en charge les Plugins `openai-curated` qu’elle a détectés comme installés depuis leur source dans le répertoire d’accueil Codex source.
- Les Plugins `workspace-directory` configurés manuellement nécessitent un Codex app-server dont `plugin/list` accepte `marketplaceKinds` et dont les résumés d’espaces de travail sans chemin incluent `remotePluginId`. Le Plugin doit déjà être installé et activé, et les applications qu’il possède doivent être accessibles dans `app/list`.

`codexPlugins` n’a aucun effet sur les exécutions du fournisseur OpenClaw, les liaisons de conversations ACP ni les autres harnais, car ces chemins ne créent jamais de fils Codex app-server avec une configuration `apps` native.

Le compte Codex côté OpenAI, la disponibilité des applications et les contrôles des applications et Plugins de l’espace de travail proviennent du compte Codex connecté. Consultez [Utiliser Codex avec votre offre ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) pour en savoir plus sur le modèle de compte et d’administration OpenAI.

## Démarrage rapide

Prévisualisez la migration depuis le répertoire d’accueil Codex source :

```bash
openclaw migrate codex --dry-run
```

Ajoutez `--verify-plugin-apps` pour que la migration appelle `app/list` sur la source et exige que chaque application possédée soit présente, activée et accessible avant de planifier l’activation native :

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Appliquez la migration lorsque le plan vous convient :

```bash
openclaw migrate apply codex --yes
```

La migration écrit des entrées `codexPlugins` explicites pour les Plugins admissibles et appelle `plugin/install` sur Codex app-server pour les Plugins sélectionnés. Une configuration migrée ressemble à ceci :

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

La migration reste limitée à `openai-curated`. Pour utiliser un Plugin `workspace-directory` existant, ajoutez-le manuellement avec le `summary.id` exact, qualifié par la place de marché, renvoyé par `plugin/list`. Par exemple, si Codex renvoie `example-plugin@workspace-directory`, configurez cette valeur complète plutôt que son nom d’affichage :

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

OpenClaw n’appelle pas `plugin/install` et ne lance pas l’authentification pour un Plugin `workspace-directory`. Installez-le, activez-le et authentifiez-le dans Codex avant d’ajouter ou d’activer la politique OpenClaw. OpenClaw maintient les applications masquées lorsque la réponse omet la place de marché exacte, l’identifiant du Plugin, l’identifiant détaillé ou les éléments attestant que l’application est prête. Si Codex rejette la requête `plugin/list` explicite pour l’espace de travail, OpenClaw signale `marketplace_missing` pour chaque Plugin d’espace de travail activé et conserve la disponibilité de tous les Plugins sélectionnés indépendamment.

Après une modification de `codexPlugins`, les nouvelles conversations Codex utilisent automatiquement l’ensemble d’applications mis à jour. Exécutez `/new` ou `/reset` pour actualiser la conversation en cours. Il n’est pas nécessaire de redémarrer le Gateway après l’activation ou la désactivation d’un Plugin.

## Gérer les Plugins depuis la discussion

`/codex plugins` inspecte ou modifie les Plugins Codex natifs configurés depuis la même discussion que celle où vous utilisez le harnais Codex :

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` est un alias de `/codex plugins list`. La liste affiche, pour chaque Plugin configuré, sa clé, son état actif ou inactif, son nom de Plugin Codex et sa place de marché, à partir de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` écrivent uniquement dans `~/.openclaw/openclaw.json` ; ces commandes ne modifient jamais `~/.codex/config.toml` et n’installent pas de nouveaux Plugins Codex. Seul le propriétaire ou un client du Gateway disposant de la portée `operator.admin` peut les exécuter.

L’activation d’un Plugin configuré active également le commutateur global `codexPlugins.enabled`. Si un Plugin sélectionné a été écrit comme désactivé parce que la migration a renvoyé `auth_required`, autorisez de nouveau l’application dans Codex avant de l’activer dans OpenClaw. Pour une entrée `workspace-directory`, son activation ici modifie uniquement la politique OpenClaw ; le Plugin et l’application doivent déjà être actifs dans Codex.

## Fonctionnement de la configuration native des Plugins

L’intégration suit trois états :

| État       | Signification                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installé   | Codex dispose du paquet du Plugin dans l’environnement d’exécution app-server cible.                                                                                  |
| Activé     | Codex indique que le Plugin est activé et la configuration OpenClaw l’autorise pour les tours utilisant le harnais Codex.                                            |
| Accessible | Codex app-server confirme que les entrées d’application du Plugin sont disponibles pour le compte actif et correspondent à l’identité du Plugin configurée.          |

Pour les Plugins `openai-curated`, la migration constitue l’étape durable d’installation et de vérification de l’admissibilité :

- Pendant la planification, OpenClaw lit les détails `plugin/read` du Codex source et vérifie que le compte Codex app-server source est un compte disposant d’un abonnement ChatGPT. Une réponse indiquant un compte non-ChatGPT ou l’absence de compte entraîne l’exclusion des Plugins adossés à des applications avec `codex_subscription_required`.
- Par défaut, la migration ignore l’appel source à `app/list` : les Plugins sources adossés à des applications qui passent le contrôle du compte sont planifiés sans vérification de l’accessibilité des applications sources, et les échecs de transport lors de la recherche du compte entraînent leur exclusion avec `codex_account_unavailable`.
- Avec `--verify-plugin-apps`, la migration prend un instantané récent de `app/list` sur la source et exige que chaque application possédée soit présente, activée et accessible avant de planifier l’activation native. Les échecs de transport lors de la recherche du compte passent alors au contrôle de l’inventaire des applications sources au lieu d’entraîner immédiatement l’exclusion.

Pour les Plugins `workspace-directory`, la configuration s’effectue en dehors d’OpenClaw. OpenClaw interroge cette place de marché uniquement lorsqu’au moins une entrée d’espace de travail activée est configurée, résout chaque Plugin à partir de son `summary.id` exact et réutilise les contrôles existants de propriété par `plugin/read` et de disponibilité par `app/list`. Un Plugin non installé, désactivé, inaccessible ou non authentifié n’expose aucune application ; OpenClaw ne tente ni de l’installer ni de l’authentifier.

L’inventaire des applications à l’exécution constitue le contrôle d’accessibilité de la session cible pour les Plugins sélectionnés migrés comme pour les Plugins d’espace de travail configurés manuellement. La configuration de session du harnais Codex calcule une configuration restrictive des applications du fil à partir des applications de Plugins activées et accessibles ; elle n’est pas recalculée à chaque tour. Par conséquent, `/codex plugins enable`/`disable` ne concernent que les nouvelles conversations Codex. Utilisez `/new` ou `/reset` pour appliquer la modification à la conversation en cours.

## Limites de la prise en charge V1

- Seuls les Plugins `openai-curated` déjà installés dans l’inventaire du Codex app-server source sont admissibles à la migration.
- À l’exécution, les entrées `workspace-directory` explicites sont également prises en charge sur les versions d’app-server dont `plugin/list` implémente `marketplaceKinds` et renvoie `remotePluginId` pour les résumés d’espaces de travail sans chemin. Ces entrées doivent utiliser leur `summary.id` exact, qualifié par la place de marché, et doivent déjà être installées, activées et accessibles aux applications. Une requête de liste d’espace de travail rejetée produit le diagnostic `marketplace_missing` existant pour chaque Plugin ; l’absence d’éléments attestant la place de marché, le Plugin, ses détails ou l’application n’expose aucune application d’espace de travail. L’inventaire sélectionné issu de la requête de liste par défaut reste utilisable.
- Les Plugins sources adossés à des applications doivent passer le contrôle de l’abonnement effectué lors de la migration. `--verify-plugin-apps` ajoute le contrôle de l’inventaire des applications sources. Les comptes bloqués par le contrôle d’abonnement et, en mode vérification, les applications sources inaccessibles, désactivées ou absentes ainsi que les échecs d’actualisation de l’inventaire des applications sont signalés comme des éléments manuels ignorés plutôt que comme des entrées de configuration activées. Les détails de Plugin illisibles sont ignorés avant le contrôle de l’inventaire des applications.
- La migration écrit des identités de Plugin explicites (`marketplaceName` et `pluginName`) ; elle n’écrit pas les chemins de cache locaux `marketplacePath`.
- `codexPlugins.enabled` est le seul commutateur d’activation global ; il n’existe aucun caractère générique `plugins["*"]` ni aucune clé de configuration accordant une autorisation d’installation arbitraire.
- Les places de marché non sélectionnées, les paquets de Plugins mis en cache, les hooks et les fichiers de configuration Codex sont conservés dans le rapport de migration pour examen manuel, et non activés automatiquement. À l’exécution, les entrées `workspace-directory` configurées manuellement sont acceptées ; les autres places de marché restent non prises en charge.

## Inventaire et propriété des applications

OpenClaw lit l’inventaire des applications Codex au moyen de `app/list` sur app-server, le conserve en mémoire cache pendant une heure et actualise de manière asynchrone les entrées obsolètes ou absentes. Le cache est propre au processus ; le redémarrage de la CLI ou du Gateway le supprime, et OpenClaw le reconstruit lors de la prochaine lecture de `app/list`.

La migration et l’exécution utilisent des clés de cache distinctes :

- La vérification de la migration source utilise le répertoire d’accueil Codex source et les options de démarrage. Elle s’exécute uniquement avec `--verify-plugin-apps` et impose un nouveau parcours de `app/list` sur la source pour cette planification.
- La configuration de l’environnement d’exécution cible utilise l’identité Codex app-server de l’agent cible lors de la création de la configuration des applications du fil. L’activation d’un Plugin sélectionné invalide cette clé de cache cible, puis force son actualisation après `plugin/install`. La configuration de `workspace-directory` n’emprunte jamais ce chemin d’activation.

Une application de Plugin n’est exposée que lorsqu’OpenClaw peut la rattacher au Plugin configuré au moyen d’une propriété stable : un identifiant d’application exact provenant des détails du Plugin, un nom de serveur MCP connu ou des métadonnées stables uniques. Une propriété reposant uniquement sur le nom d’affichage ou qui demeure ambiguë est exclue jusqu’à ce que l’actualisation suivante de l’inventaire établisse la propriété.

## Applications de comptes connectés

Les agents exploités par leur propriétaire peuvent choisir d’utiliser toutes les applications déjà connectées à leur compte Codex sans exiger de paquet de Plugin correspondant :

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

`allow_all_plugins: true` prend un instantané complet de `app/list` lorsqu’un nouveau fil Codex natif est créé et n’autorise que les applications marquées comme accessibles pour ce compte. Cette option n’installe, n’authentifie et n’active aucune application globalement. Les fils existants conservent leur ensemble d’applications persistant ; utilisez `/new`, `/reset` ou redémarrez le Gateway pour prendre en compte les applications nouvellement connectées ou révoquées.

Les applications du compte héritent de la valeur globale `codexPlugins.allow_destructive_actions`, qui accepte `true`, `false`, `"auto"` ou `"ask"`. Une politique explicite propre à un Plugin remplace la politique globale pour les identifiants d’application communs. En cas d’échec de l’inventaire, le système refuse l’accès par défaut au lieu de revenir à une valeur par défaut non restrictive.

## Configuration des applications du fil

OpenClaw injecte un correctif `config.apps` restrictif pour le fil Codex :
`_default` est désactivé, et seules les applications détenues par des plugins configurés et activés, ou les applications de compte accessibles autorisées par `allow_all_plugins`, sont activées.

La valeur `destructive_enabled` de chaque application provient de la politique effective globale ou propre au plugin `allow_destructive_actions` ; `true`, `"auto"` et `"ask"` définissent tous `destructive_enabled: true`, tandis que `false` le définit sur `false`. Codex continue d’appliquer les métadonnées des outils destructifs provenant des annotations d’outils d’application natives.
`_default` est désactivé avec `open_world_enabled: false` ; les applications de plugins activées reçoivent `open_world_enabled: true`. OpenClaw n’expose pas de paramètre distinct de politique de monde ouvert au niveau du plugin et ne maintient pas de listes de refus de noms d’outils destructifs propres à chaque plugin.

Le mode d’approbation des outils est automatique par défaut pour les applications autorisées ; les outils de lecture non destructifs s’exécutent donc sans demande d’approbation dans le même fil. Les outils destructifs restent contrôlés par la politique `destructive_enabled` de chaque application.

## Politique relative aux actions destructives

Les sollicitations destructives des plugins sont autorisées par défaut pour les plugins Codex configurés, tandis que les schémas non sûrs et les appartenances ambiguës sont refusés par sécurité :

- La valeur globale `allow_destructive_actions` est définie sur `true` par défaut.
- La valeur `allow_destructive_actions` propre à un plugin remplace la politique globale pour ce plugin.
- `false` : OpenClaw renvoie un refus déterministe.
- `true` : OpenClaw n’accepte automatiquement que les schémas sûrs qu’il peut convertir en réponse d’approbation, comme un champ booléen d’approbation.
- `"auto"` : OpenClaw expose à Codex les actions destructives des plugins, puis convertit les sollicitations d’approbation MCP dont l’appartenance est établie en approbations de plugins OpenClaw avant de renvoyer la réponse d’approbation Codex.
- `"ask"` : OpenClaw utilise le même contrôle Codex des écritures et actions destructives qu’avec `"auto"`, efface les dérogations durables d’approbation Codex propres à chaque outil de l’application avant le démarrage du fil, et ne propose qu’une approbation ou un refus ponctuel afin que les approbations durables ne puissent pas supprimer les demandes ultérieures relatives aux actions d’écriture. Pour chaque application autorisée utilisant `"ask"`, OpenClaw sélectionne l’examinateur d’approbations humaines de Codex pour cette application afin que Codex envoie ses sollicitations d’approbation à OpenClaw ; les autres applications et les approbations du fil ne concernant pas une application conservent leur examinateur et leur politique configurés.
- L’absence d’identité du plugin, une appartenance ambiguë, un identifiant de tour absent ou non concordant, ou un schéma de sollicitation non sûr entraîne un refus plutôt qu’une demande d’approbation.

## Résolution des problèmes

| Code                                              | Signification                                                                                                                                            | Correction                                                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migration a installé le plugin, mais l’une de ses applications nécessite encore une authentification. L’entrée est écrite comme désactivée jusqu’à sa réautorisation. | Réautorisez l’application dans Codex, puis activez le plugin dans OpenClaw.                                                       |
| `app_inaccessible`, `app_disabled`, `app_missing` | Avec `--verify-plugin-apps`, l’inventaire source des applications Codex n’a pas indiqué que toutes les applications détenues étaient présentes, activées et accessibles. | Réautorisez ou activez l’application dans Codex, puis relancez la migration avec `--verify-plugin-apps`.                          |
| `app_inventory_unavailable`                       | Une vérification stricte des applications sources a été demandée, mais l’actualisation de l’inventaire source des applications Codex a échoué.           | Corrigez l’accès au serveur d’applications Codex source, ou réessayez sans `--verify-plugin-apps` pour accepter le plan plus rapide contrôlé par le compte. |
| `codex_subscription_required`                     | Le compte du serveur d’applications Codex source n’était pas un compte disposant d’un abonnement ChatGPT.                                                | Connectez-vous à l’application Codex avec l’authentification par abonnement, puis relancez la migration.                          |
| `codex_account_unavailable`                       | Le compte du serveur d’applications Codex source n’a pas pu être lu.                                                                                     | Corrigez l’authentification du serveur d’applications Codex source, ou relancez avec `--verify-plugin-apps` pour laisser l’inventaire des applications sources déterminer l’admissibilité. |
| `marketplace_missing`, `plugin_missing`           | La place de marché ou le plugin exact est indisponible ; la requête explicite du catalogue d’espace de travail peut avoir été rejetée ; les applications d’espace de travail sont refusées par sécurité. | Vérifiez le contrat compatible du serveur d’applications et l’identifiant exact décrits ci-dessous.                              |
| `plugin_detail_unavailable`                       | OpenClaw n’a pas pu lire les détails d’appartenance du plugin.                                                                                           | Examinez les réponses `plugin/list` et `plugin/read` du serveur d’applications cible.                                             |
| `plugin_disabled`                                 | Codex indique que le plugin est installé, mais désactivé.                                                                                                | L’activation organisée peut le réparer ; activez un plugin d’espace de travail dans Codex avant de réessayer.                     |
| `plugin_activation_failed`                        | L’activation du plugin ne s’est pas terminée.                                                                                                            | Utilisez le diagnostic joint pour distinguer les échecs liés à la place de marché, à l’authentification, à l’actualisation ou à la préparation de l’espace de travail. |
| `app_inventory_missing`, `app_inventory_stale`    | L’état de préparation des applications provenait d’un cache vide ou obsolète.                                                                            | OpenClaw planifie automatiquement une actualisation asynchrone ; les applications de plugins restent exclues jusqu’à ce que leur appartenance et leur état de préparation soient connus. |
| `app_ownership_ambiguous`                         | L’inventaire des applications n’a trouvé de correspondance que par nom d’affichage.                                                                      | L’application reste masquée dans le fil Codex jusqu’à ce qu’une actualisation ultérieure établisse son appartenance.              |

**Le plugin d’espace de travail est installé, mais n’est pas visible :** vérifiez que le résultat `plugin/list` de l’espace de travail indique l’identifiant configuré exact comme installé et activé, puis vérifiez que `app/list` indique que chaque application détenue est accessible pour le même compte Codex. OpenClaw peut activer une application accessible pour le fil même lorsque l’inventaire du compte indique actuellement que cette application est désactivée. Si vous avez modifié cet état après la mise en cache de l’inventaire des applications par le Gateway, attendez l’actualisation horaire du cache ou redémarrez le Gateway, puis utilisez `/new` ou `/reset`. OpenClaw ne répare ni n’authentifie les plugins d’espace de travail.
Si la requête explicite de liste d’espace de travail est rejetée, chaque entrée d’espace de travail activée signale `marketplace_missing` ; les entrées organisées sans rapport continuent d’être traitées à partir de la réponse de liste par défaut.

Pour `plugin_detail_unavailable`, un résumé d’espace de travail sans chemin doit inclure `remotePluginId` ; OpenClaw garde les applications détenues masquées lorsque ce sélecteur ou le résultat `plugin/read` ultérieur est indisponible. Pour `plugin_activation_failed`, les plugins organisés peuvent signaler un échec lié à la place de marché, à l’authentification ou à l’actualisation après installation. Un plugin d’espace de travail signale ce code lorsqu’il n’est pas déjà actif ; installez-le, activez-le et authentifiez-le en dehors d’OpenClaw.

**La configuration a changé, mais l’agent ne voit pas le plugin :** exécutez `/codex plugins
list` pour confirmer l’état configuré, puis `/new` ou `/reset`. Les liaisons existantes des fils Codex conservent la configuration d’application avec laquelle elles ont démarré jusqu’à ce qu’OpenClaw établisse une nouvelle session de harnais ou remplace une liaison obsolète.

**L’action destructive est refusée :** vérifiez les valeurs globales et propres au plugin de `allow_destructive_actions`. Même avec `true`, `"auto"` ou `"ask"`, les schémas de sollicitation non sûrs et les identités de plugin ambiguës sont toujours refusés par sécurité.

## Pages associées

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Référence de configuration](/fr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migration](/fr/cli/migrate)
