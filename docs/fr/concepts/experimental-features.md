---
read_when:
    - Vous voyez une clé de configuration `.experimental` et souhaitez savoir si elle est stable
    - Vous souhaitez essayer les fonctionnalités expérimentales de l’environnement d’exécution sans les confondre avec les valeurs par défaut habituelles.
    - Vous souhaitez disposer d’un emplacement unique pour trouver les indicateurs expérimentaux actuellement documentés
summary: Signification des indicateurs expérimentaux dans OpenClaw et liste de ceux qui sont actuellement documentés
title: Fonctionnalités expérimentales
x-i18n:
    generated_at: "2026-07-12T02:46:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Les fonctionnalités expérimentales sont des surfaces d’aperçu facultatives, accessibles au moyen d’indicateurs explicites. Elles doivent être davantage éprouvées en conditions réelles avant de bénéficier d’une valeur par défaut stable ou d’un contrat durable.

- Désactivées par défaut, sauf si une documentation vous indique d’en activer une.
- Leur forme et leur comportement peuvent évoluer plus rapidement que ceux de la configuration stable.
- Préférez une voie stable lorsqu’il en existe déjà une.
- Ne les déployez à grande échelle qu’après les avoir d’abord testées dans un environnement plus restreint.

## Indicateurs actuellement documentés

| Surface                            | Clé                                                                                        | Utilisez-la lorsque                                                                                                                            | En savoir plus                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Environnement d’exécution du modèle local | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local plus petit ou plus strict ne parvient pas à gérer l’ensemble complet d’outils par défaut d’OpenClaw                          | [Modèles locaux](/fr/gateway/local-models)                                                             |
| Recherche en mémoire               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Vous souhaitez que `memory_search` indexe les transcriptions des sessions précédentes et acceptez le coût supplémentaire de stockage et d’indexation | [Référence de configuration de la mémoire](/fr/reference/memory-config#session-memory-search-experimental) |
| Harnais Codex                      | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Vous souhaitez que l’app-server Codex natif 0.132.0 ou ultérieur cible un serveur d’exécution d’OpenClaw adossé à une sandbox au lieu de désactiver le mode Code | [Référence du harnais Codex](/fr/plugins/codex-harness-reference#sandboxed-native-execution)            |
| Outil de planification structurée  | `tools.experimental.planTool`                                                              | Vous souhaitez exposer l’outil structuré `update_plan` afin de suivre les travaux en plusieurs étapes dans les environnements d’exécution et interfaces utilisateur compatibles | [Référence de configuration du Gateway](/fr/gateway/config-tools#toolsexperimental)                    |

## Mode allégé pour modèle local

`agents.defaults.experimental.localModelLean: true` retire à chaque tour les outils facultatifs lourds de la surface directement accessible à l’agent : `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` et `pdf`. Les outils explicitement autorisés ou nécessaires à la livraison restent disponibles, même si Tool Search peut les répertorier au lieu de les exposer directement. Le mode allégé configure également par défaut les catalogues de plugins/MCP/clients pour utiliser Tool Search structuré (`tool_search`, `tool_describe`, `tool_call`) lorsque `tools.toolSearch` n’est pas déjà défini. Utilisez `agents.list[].experimental.localModelLean` pour limiter ce réglage à un seul agent.

Si vous ajustez déjà Tool Search globalement, OpenClaw ne modifie pas cette configuration. Définissez `tools.toolSearch: false` pour désactiver la valeur par défaut de Tool Search du mode allégé.

En mode `tools` structuré, les exécutions allégées conservent `exec` directement visible à côté des contrôles de Tool Search, afin que les modèles locaux optimisés pour le codage puissent toujours choisir leur accès familier à l’interpréteur de commandes. Seule la visibilité du schéma change : la politique normale des outils, la mise en sandbox et les approbations d’exécution continuent de s’appliquer. Les modes explicites `code` et `directory` conservent leur comportement normal de Compaction.

### Pourquoi ces outils

Ces outils ont les descriptions les plus longues, les structures de paramètres les plus étendues ou le plus grand risque de détourner un petit modèle du parcours normal de codage et de conversation. Sur un backend à faible capacité contextuelle ou compatible avec OpenAI mais plus strict, cela fait la différence entre :

- Des schémas d’outils qui tiennent dans le prompt et des schémas qui évincent l’historique de conversation.
- Un modèle qui choisit le bon outil et un modèle qui émet des appels d’outils mal formés en raison d’un trop grand nombre de schémas similaires.
- Un adaptateur Chat Completions qui respecte les limites de sortie structurée et une erreur 400 due à la taille de la charge utile des appels d’outils.

Leur suppression raccourcit uniquement la liste des outils directement accessibles. Le modèle conserve `read`, `write`, `edit`, `exec`, `apply_patch`, la compréhension d’images, la recherche et la récupération de contenu sur le Web lorsqu’elles sont configurées, la mémoire ainsi que les outils de session et d’agent. Les catalogues supplémentaires restent accessibles par l’intermédiaire de Tool Search, sauf si vous définissez `tools.toolSearch: false` ; des autorisations explicites d’outils peuvent réintégrer un agent allégé dans un flux de travail restreint.

### Quand l’activer

Activez le mode allégé après avoir vérifié que le modèle peut communiquer avec le Gateway, mais que les tours complets de l’agent se comportent mal :

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` réussit.
2. Un tour normal de l’agent échoue en raison d’appels d’outils mal formés, de prompts trop volumineux ou du fait que le modèle ignore ses outils.
3. L’activation de `localModelLean: true` élimine l’échec.

### Quand le laisser désactivé

Si votre backend gère correctement l’environnement d’exécution complet par défaut, laissez cette option désactivée. Il s’agit d’une solution de contournement destinée aux piles locales qui nécessitent une surface d’outils réduite, et non d’une valeur par défaut pour les modèles hébergés ou les installations locales disposant de ressources suffisantes.

Le mode allégé ne remplace pas `tools.profile`, `tools.allow`/`tools.deny`, ni la solution de repli `compat.supportsTools: false` du modèle. Pour réduire durablement la surface d’outils d’un agent précis, privilégiez ces réglages stables.

### Activation

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Pour un seul agent :

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Redémarrez le Gateway après avoir modifié l’indicateur. Le filtrage du mode allégé retire `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` et `pdf`, sauf si vous les conservez explicitement avec `tools.allow` ou `tools.alsoAllow` ; Tool Search peut néanmoins répertorier les outils conservés au lieu de les exposer directement.

## Expérimental ne signifie pas caché

Une fonctionnalité expérimentale doit être clairement désignée comme telle dans la documentation et dans le chemin de configuration lui-même, plutôt que d’être dissimulée derrière un réglage par défaut d’apparence stable.

## Pages connexes

- [Fonctionnalités](/fr/concepts/features)
- [Canaux de publication](/fr/install/development-channels)
