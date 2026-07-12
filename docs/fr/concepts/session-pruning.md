---
read_when:
    - Vous souhaitez réduire l’augmentation du contexte due aux sorties des outils
    - Vous souhaitez comprendre l’optimisation du cache de prompts d’Anthropic
summary: Suppression des anciens résultats d’outils pour alléger le contexte et optimiser la mise en cache
title: Élagage des sessions
x-i18n:
    generated_at: "2026-07-12T15:22:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

L’élagage des sessions supprime les **anciens résultats d’outils** du contexte avant chaque appel au LLM. Il réduit l’encombrement du contexte dû à l’accumulation des sorties d’outils (résultats d’exécution, lectures de fichiers, résultats de recherche) sans réécrire le texte normal de la conversation.

<Info>
L’élagage s’effectue uniquement en mémoire — il ne modifie pas la transcription de session stockée sur le disque. Votre historique complet est toujours préservé.
</Info>

## Pourquoi est-ce important ?

Les longues sessions accumulent des sorties d’outils qui gonflent la fenêtre de contexte. Cela augmente les coûts et peut imposer une [Compaction](/fr/concepts/compaction) plus tôt que nécessaire.

L’élagage est particulièrement utile pour la **mise en cache des prompts d’Anthropic**. Après l’expiration de la durée de vie (TTL) du cache, la requête suivante remet en cache l’intégralité du prompt. L’élagage réduit la taille des données écrites dans le cache, ce qui diminue directement les coûts.

## Fonctionnement

L’élagage s’exécute en mode `cache-ttl`, sous réserve de satisfaire à la fois une vérification temporelle et une vérification de la taille du contexte :

1. Attendez l’expiration du TTL du cache (5 minutes par défaut lorsqu’il est défini manuellement ; consultez [Valeurs par défaut intelligentes](#smart-defaults) pour la valeur automatique par défaut d’Anthropic). Avant l’expiration du TTL, l’élagage est entièrement ignoré afin de préserver la réutilisation du cache des invites pour les tours rapprochés.
2. Une fois le TTL expiré, estimez la taille totale du contexte par rapport à la fenêtre contextuelle du modèle. Si le rapport est inférieur à `softTrimRatio` (0,3 par défaut), ignorez l’élagage et laissez le compteur du TTL continuer à s’écouler.
3. **Tronquez modérément** les résultats d’outils surdimensionnés dépassant ce rapport : conservez le début et la fin (1 500 caractères chacun par défaut, dans la limite de 4 000 caractères au total) et insérez `...` entre les deux.
4. Si le rapport reste supérieur ou égal à `hardClearRatio` (0,5 par défaut) et qu’il reste au moins `minPrunableToolChars` (50 000 par défaut) de contenu d’outil pouvant être élagué, **effacez complètement** ces résultats : remplacez leur contenu par un texte substitutif (`[Old tool result content cleared]` par défaut).
5. Réinitialisez le compteur du TTL uniquement lorsque l’élagage a effectivement modifié le contexte, afin que les requêtes suivantes réutilisent le cache actualisé.

Deux règles de sécurité s'appliquent quels que soient les seuils : les tours d'assistant `keepLastAssistants` les plus récents (3 par défaut) ne sont jamais élagués, et rien de ce qui précède le premier message utilisateur de la session n'est jamais élagué (ce qui protège les lectures d'initialisation telles que `SOUL.md`/`USER.md`).

Seuls les messages `toolResult` sont éligibles ; le texte de conversation normal reste intact. Utilisez `agents.defaults.contextPruning.tools.{allow,deny}` pour définir quels noms d'outils peuvent être élagués.

## Nettoyage des images héritées

OpenClaw construit également une vue de relecture idempotente distincte pour les sessions qui conservent dans l’historique des blocs d’images bruts ou des marqueurs de médias d’hydratation des prompts.

- Elle conserve les **3 tours terminés les plus récents** à l’identique, octet par octet, afin que les préfixes du cache de prompts restent stables pour les suivis récents. Ce nombre comprend tous les tours terminés, pas uniquement ceux contenant des images ; les tours uniquement textuels occupent donc eux aussi la fenêtre.
- Dans la vue de relecture, les anciens blocs d’images déjà traités provenant de l’historique `user` ou `toolResult` sont remplacés par `[image data removed - already processed by model]`.
- Les anciennes références textuelles aux médias, telles que `[media attached: ...]`, `[Image: source: ...]` et `media://inbound/...`, sont remplacées par `[media reference removed - already processed by model]`. Les marqueurs de pièces jointes du tour actuel restent intacts afin que les modèles de vision puissent toujours hydrater les nouvelles images.
- La transcription brute de la session n’est pas réécrite ; les outils de consultation de l’historique peuvent donc toujours afficher les entrées de message d’origine et leurs images.
- Ce mécanisme est distinct de l’élagage normal selon le TTL du cache décrit ci-dessus. Il vise à empêcher les charges utiles d’images répétées ou les références obsolètes aux médias d’invalider les caches de prompts lors des tours ultérieurs.

## Valeurs par défaut intelligentes

Le plugin Anthropic fourni configure automatiquement l’élagage et la cadence du Heartbeat la première fois qu’il résout un profil d’authentification Anthropic (ou Claude CLI), mais uniquement pour les champs que vous n’avez pas déjà définis explicitement :

| Mode d’authentification                         | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ----------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/jeton (y compris la réutilisation de Claude CLI) | `cache-ttl`           | `1h`                 | `1h`              |
| Clé API                                         | `cache-ttl`           | `1h`                 | `30m`             |

Si vous définissez vous-même `agents.defaults.contextPruning.mode` ou `agents.defaults.heartbeat.every`, OpenClaw ne les remplace pas. Cette valeur par défaut automatique ne s’applique qu’à l’authentification de la famille Anthropic ; pour les autres fournisseurs, l’élagage est défini sur `off`, sauf si vous le configurez.

## Activer ou désactiver

L’élagage est désactivé par défaut pour les fournisseurs autres qu’Anthropic. Pour l’activer :

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Pour le désactiver : définissez `mode: "off"`.

## Élagage et Compaction

|                | Élagage                              | Compaction                         |
| -------------- | ------------------------------------ | ---------------------------------- |
| **Fonction**   | Réduit les résultats des outils      | Résume la conversation             |
| **Enregistré ?** | Non (pour chaque requête)           | Oui (dans la transcription)        |
| **Portée**     | Résultats des outils uniquement      | Conversation entière               |

Ils se complètent : l’élagage réduit les sorties des outils entre les cycles de Compaction.

## Pour aller plus loin

- [Compaction](/fr/concepts/compaction) : réduction du contexte fondée sur la synthèse
- [Configuration du Gateway](/fr/gateway/configuration) : tous les paramètres de configuration de l’élagage (`contextPruning.*`)

## Pages connexes

- [Gestion des sessions](/fr/concepts/session)
- [Outils de session](/fr/concepts/session-tool)
- [Moteur de contexte](/fr/concepts/context-engine)
