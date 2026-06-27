---
read_when:
    - Vous voyez une clé de configuration `.experimental` et vous voulez savoir si elle est stable
    - Vous voulez essayer les fonctionnalités d’exécution en préversion sans les confondre avec les valeurs par défaut normales
    - Vous voulez disposer d’un seul endroit pour trouver les options expérimentales actuellement documentées
summary: Ce que signifient les indicateurs expérimentaux dans OpenClaw et ceux qui sont actuellement documentés
title: Fonctionnalités expérimentales
x-i18n:
    generated_at: "2026-06-27T17:23:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Les fonctionnalités expérimentales d’OpenClaw sont des **surfaces d’aperçu optionnelles**. Elles sont
placées derrière des indicateurs explicites parce qu’elles ont encore besoin d’un retour d’usage réel avant de
mériter une valeur par défaut stable ou un contrat public durable.

Traitez-les différemment de la configuration normale :

- Gardez-les **désactivées par défaut**, sauf si la documentation associée vous invite à en essayer une.
- Attendez-vous à ce que **la forme et le comportement changent** plus vite que la configuration stable.
- Préférez d’abord le chemin stable lorsqu’il en existe déjà un.
- Si vous déployez OpenClaw largement, testez les indicateurs expérimentaux dans un environnement
  plus restreint avant de les intégrer à une base partagée.

## Indicateurs actuellement documentés

| Surface                  | Clé                                                                                        | Utilisez-la lorsque                                                                                                               | En savoir plus                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modèle local  | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend local plus petit ou plus strict bloque sur la surface complète d’outils par défaut d’OpenClaw                          | [Modèles locaux](/fr/gateway/local-models)                                                        |
| Recherche en mémoire     | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Vous voulez que `memory_search` indexe les transcriptions de sessions précédentes et acceptez le coût supplémentaire de stockage/indexation | [Référence de configuration de la mémoire](/fr/reference/memory-config#session-memory-search-experimental) |
| Harnais Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Vous voulez que le serveur d’application Codex natif 0.132.0 ou plus récent cible un serveur d’exécution adossé au sandbox OpenClaw au lieu de désactiver Code Mode | [Référence du harnais Codex](/fr/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Outil de planification structurée | `tools.experimental.planTool`                                                              | Vous voulez que l’outil structuré `update_plan` soit exposé pour le suivi du travail en plusieurs étapes dans les runtimes et interfaces utilisateur compatibles | [Référence de configuration du Gateway](/fr/gateway/config-tools#toolsexperimental)                    |

## Mode allégé de modèle local

`agents.defaults.experimental.localModelLean: true` est une soupape de décharge pour les configurations de modèles locaux plus faibles. Lorsqu’il est activé, OpenClaw retire trois outils par défaut — `browser`, `cron` et `message` — de la surface d’outils de l’agent à chaque tour. Il fait aussi utiliser par défaut à cette exécution les contrôles structurés de Tool Search lorsque `tools.toolSearch` n’est pas explicitement configuré, afin que les catalogues d’outils Plugin, MCP ou client plus volumineux restent derrière `tool_search`, `tool_describe` et `tool_call` au lieu d’être déversés dans le prompt. Les exécutions qui exigent une livraison directe par `message` gardent cet outil en direct au lieu d’activer la valeur par défaut Tool Search du mode allégé. Utilisez `agents.list[].experimental.localModelLean` pour activer ou désactiver le même comportement pour un agent configuré.

### Pourquoi ces trois outils

Ces trois outils ont les descriptions les plus longues et le plus grand nombre de formes de paramètres dans le runtime OpenClaw par défaut. Sur un backend à petit contexte ou compatible OpenAI plus strict, c’est la différence entre :

- Des schémas d’outils qui tiennent proprement dans le prompt plutôt que d’évincer l’historique de conversation.
- Le modèle qui choisit le bon outil plutôt que d’émettre des appels d’outils mal formés parce qu’il y a trop de schémas d’apparence similaire.
- L’adaptateur Chat Completions qui reste dans les limites de sortie structurée du serveur plutôt que de déclencher une erreur 400 sur la taille de charge utile des appels d’outils.

Les retirer ne recâble pas silencieusement OpenClaw : cela raccourcit simplement la liste des outils directs. Le modèle dispose toujours de `read`, `write`, `edit`, `exec`, `apply_patch`, de la recherche/récupération web (lorsqu’elles sont configurées), de la mémoire et des outils de session/agent. Les catalogues supplémentaires restent appelables via Tool Search, sauf si vous définissez explicitement `tools.toolSearch: false`.

### Quand l’activer

Activez le mode allégé lorsque vous avez déjà prouvé que le modèle peut communiquer avec le Gateway, mais que les tours d’agent complets se comportent mal. La chaîne de signaux typique est la suivante :

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` réussit.
2. Un tour d’agent normal échoue avec des appels d’outils mal formés, des prompts trop volumineux ou un modèle qui ignore ses outils.
3. Basculer `localModelLean: true` élimine l’échec.

### Quand le laisser désactivé

Si votre backend gère proprement le runtime complet par défaut, laissez ce réglage désactivé. Le mode allégé est un contournement, pas une valeur par défaut. Il existe parce que certaines piles locales ont besoin d’une surface d’outils plus petite pour fonctionner correctement ; les modèles hébergés et les plateformes locales bien dotées n’en ont pas besoin.

Le mode allégé ne remplace pas non plus `tools.profile`, `tools.allow`/`tools.deny` ni l’échappatoire `compat.supportsTools: false` du modèle. Si vous avez besoin d’une surface d’outils plus étroite de façon permanente pour un agent spécifique, préférez ces réglages stables à l’indicateur expérimental.

Si vous ajustez déjà Tool Search globalement, OpenClaw laisse cette configuration opérateur intacte. Définissez `tools.toolSearch: false` pour désactiver la valeur par défaut Tool Search du mode allégé.

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

Redémarrez le Gateway après avoir modifié l’indicateur, puis confirmez la liste d’outils réduite avec :

```bash
openclaw status --deep
```

La sortie d’état approfondi liste les outils d’agent actifs ; `browser`, `cron` et `message` doivent être absents lorsque le mode allégé est activé, sauf si le mode de livraison actuel impose des réponses directes par `message`.

## Expérimental ne signifie pas caché

Si une fonctionnalité est expérimentale, OpenClaw doit l’indiquer clairement dans la documentation et dans le
chemin de configuration lui-même. Ce qu’il ne doit **pas** faire, c’est introduire en douce un comportement d’aperçu dans un
réglage par défaut qui semble stable et prétendre que c’est normal. C’est ainsi que les
surfaces de configuration deviennent désordonnées.

## Associés

- [Fonctionnalités](/fr/concepts/features)
- [Canaux de publication](/fr/install/development-channels)
