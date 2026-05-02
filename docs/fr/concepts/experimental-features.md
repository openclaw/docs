---
read_when:
    - Vous voyez une clé de configuration `.experimental` et voulez savoir si elle est stable
    - Vous voulez essayer les fonctionnalités d’exécution en préversion sans les confondre avec les valeurs par défaut normales
    - Vous voulez un seul endroit où trouver les options expérimentales actuellement documentées
summary: Ce que signifient les options expérimentales dans OpenClaw et lesquelles sont actuellement documentées
title: Fonctionnalités expérimentales
x-i18n:
    generated_at: "2026-05-02T22:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Les fonctionnalités expérimentales d’OpenClaw sont des **surfaces d’aperçu activables explicitement**. Elles sont
placées derrière des indicateurs explicites, car elles ont encore besoin d’être éprouvées en conditions réelles avant de
mériter une valeur par défaut stable ou un contrat public durable.

Traitez-les différemment de la configuration normale :

- Gardez-les **désactivées par défaut**, sauf si la documentation associée vous invite à en essayer une.
- Attendez-vous à ce que leur **forme et leur comportement changent** plus vite que ceux de la configuration stable.
- Préférez d’abord le chemin stable lorsqu’il en existe déjà un.
- Si vous déployez OpenClaw largement, testez les indicateurs expérimentaux dans un environnement plus petit
  avant de les intégrer à une base de référence partagée.

## Indicateurs actuellement documentés

| Surface                  | Clé                                                       | Utilisez-le quand                                                                                                    | Plus                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Environnement d’exécution de modèle local      | `agents.defaults.experimental.localModelLean`             | Un backend local plus petit ou plus strict ne parvient pas à gérer toute la surface d’outils par défaut d’OpenClaw                             | [Modèles locaux](/fr/gateway/local-models)                                                         |
| Recherche en mémoire            | `agents.defaults.memorySearch.experimental.sessionMemory` | Vous voulez que `memory_search` indexe les transcriptions des sessions précédentes et acceptez le coût supplémentaire de stockage et d’indexation         | [Référence de configuration de la mémoire](/fr/reference/memory-config#session-memory-search-experimental) |
| Outil de planification structurée | `tools.experimental.planTool`                             | Vous voulez exposer l’outil structuré `update_plan` pour le suivi du travail en plusieurs étapes dans les environnements d’exécution et interfaces utilisateur compatibles | [Référence de configuration du Gateway](/fr/gateway/config-tools#toolsexperimental)                    |

## Mode allégé pour modèle local

`agents.defaults.experimental.localModelLean: true` est une soupape de décharge pour les configurations de modèles locaux moins puissantes. Lorsqu’il est activé, OpenClaw retire trois outils par défaut — `browser`, `cron` et `message` — de la surface d’outils de l’agent à chaque tour. Rien d’autre ne change.

### Pourquoi ces trois outils

Ces trois outils ont les descriptions les plus longues et le plus grand nombre de formes de paramètres dans l’environnement d’exécution OpenClaw par défaut. Sur un backend compatible avec OpenAI à petit contexte ou plus strict, cela fait la différence entre :

- Des schémas d’outils qui tiennent proprement dans le prompt plutôt que de repousser l’historique de conversation.
- Le modèle qui choisit le bon outil plutôt que d’émettre des appels d’outil mal formés parce qu’il y a trop de schémas d’apparence similaire.
- L’adaptateur Chat Completions qui reste dans les limites de sortie structurée du serveur plutôt que de déclencher une erreur 400 sur la taille de la charge utile des appels d’outil.

Les retirer ne recâble pas OpenClaw silencieusement — cela raccourcit simplement la liste des outils. Le modèle dispose toujours de `read`, `write`, `edit`, `exec`, `apply_patch`, de la recherche/récupération web (lorsqu’elle est configurée), de la mémoire et des outils de session/agent.

### Quand l’activer

Activez le mode allégé lorsque vous avez déjà prouvé que le modèle peut communiquer avec le Gateway, mais que les tours complets de l’agent se comportent mal. La chaîne de signaux typique est :

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` réussit.
2. Un tour d’agent normal échoue avec des appels d’outil mal formés, des prompts trop volumineux ou un modèle qui ignore ses outils.
3. L’activation de `localModelLean: true` corrige l’échec.

### Quand le laisser désactivé

Si votre backend gère proprement l’environnement d’exécution par défaut complet, laissez cette option désactivée. Le mode allégé est une solution de contournement, pas une valeur par défaut. Il existe parce que certaines piles locales ont besoin d’une surface d’outils plus petite pour se comporter correctement ; les modèles hébergés et les configurations locales bien dotées n’en ont pas besoin.

Le mode allégé ne remplace pas non plus `tools.profile`, `tools.allow`/`tools.deny`, ni l’issue de secours `compat.supportsTools: false` du modèle. Si vous avez besoin d’une surface d’outils plus étroite et permanente pour un agent spécifique, préférez ces réglages stables à l’indicateur expérimental.

### Activer

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

Redémarrez le Gateway après avoir modifié l’indicateur, puis confirmez la liste d’outils réduite avec :

```bash
openclaw status --deep
```

La sortie d’état approfondi liste les outils d’agent actifs ; `browser`, `cron` et `message` doivent être absents lorsque le mode allégé est activé.

## Expérimental ne signifie pas caché

Si une fonctionnalité est expérimentale, OpenClaw doit l’indiquer clairement dans la documentation et dans le
chemin de configuration lui-même. Ce qu’il ne doit **pas** faire, c’est introduire discrètement un comportement d’aperçu dans un
réglage qui semble stable et faire comme si c’était normal. C’est ainsi que les surfaces de configuration
deviennent désordonnées.

## Associé

- [Fonctionnalités](/fr/concepts/features)
- [Canaux de publication](/fr/install/development-channels)
