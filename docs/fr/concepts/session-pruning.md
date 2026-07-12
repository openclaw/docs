---
read_when:
    - Vous souhaitez réduire l’augmentation du contexte due aux sorties des outils
    - Vous souhaitez comprendre l’optimisation du cache de prompts d’Anthropic
summary: Élagage des anciens résultats d’outils pour alléger le contexte et optimiser la mise en cache
title: Élagage des sessions
x-i18n:
    generated_at: "2026-07-12T02:48:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

L’élagage de session retire les **anciens résultats d’outils** du contexte avant chaque appel au LLM. Il réduit l’encombrement du contexte dû à l’accumulation des sorties d’outils (résultats d’exécution, lectures de fichiers, résultats de recherche) sans réécrire le texte normal de la conversation.

<Info>
L’élagage s’effectue uniquement en mémoire : il ne modifie pas la transcription de session stockée sur disque. Votre historique complet est toujours conservé.
</Info>

## Pourquoi est-ce important ?

Les sessions longues accumulent des sorties d’outils qui gonflent la fenêtre de contexte. Cela augmente le coût et peut imposer une [Compaction](/fr/concepts/compaction) plus tôt que nécessaire.

L’élagage est particulièrement utile pour la **mise en cache des prompts d’Anthropic**. Après l’expiration de la durée de vie du cache, la requête suivante remet en cache l’intégralité du prompt. L’élagage réduit la taille des écritures dans le cache, ce qui diminue directement le coût.

## Fonctionnement

L’élagage s’exécute en mode `cache-ttl` et dépend à la fois d’une vérification temporelle et d’une vérification de la taille du contexte :

1. Attendre l’expiration de la durée de vie du cache (5 minutes par défaut lorsqu’elle est définie manuellement ; consultez [Valeurs par défaut intelligentes](#smart-defaults) pour la valeur automatique par défaut d’Anthropic). Avant cette expiration, l’élagage est entièrement ignoré afin de préserver la réutilisation du cache de prompts pour les tours rapprochés.
2. Une fois la durée de vie expirée, estimer la taille totale du contexte par rapport à la fenêtre de contexte du modèle. Si le rapport est inférieur à `softTrimRatio` (0,3 par défaut), ignorer l’élagage et laisser le compteur de durée de vie continuer à s’écouler.
3. **Raccourcir progressivement** les résultats d’outils surdimensionnés au-delà du rapport : conserver le début et la fin (1 500 caractères chacun par défaut, avec une limite totale de 4 000 caractères) et insérer `...` entre les deux.
4. Si le rapport reste supérieur ou égal à `hardClearRatio` (0,5 par défaut) et qu’il reste au moins `minPrunableToolChars` (50 000 par défaut) de contenu d’outils pouvant être élagué, **effacer intégralement** ces résultats : remplacer leur contenu par un texte de substitution (par défaut `[Ancien contenu du résultat d’outil effacé]`).
5. Réinitialiser le compteur de durée de vie uniquement lorsque l’élagage a réellement modifié le contexte, afin que les requêtes suivantes réutilisent le nouveau cache.

Deux règles de sécurité s’appliquent quels que soient les seuils : les `keepLastAssistants` tours d’assistant les plus récents (3 par défaut) ne sont jamais élagués, et rien de ce qui précède le premier message utilisateur de la session n’est jamais élagué (ce qui protège les lectures d’initialisation telles que `SOUL.md`/`USER.md`).

Seuls les messages `toolResult` sont concernés ; le texte normal de la conversation reste intact. Utilisez `agents.defaults.contextPruning.tools.{allow,deny}` pour définir les noms d’outils pouvant être élagués.

## Nettoyage des anciennes images

OpenClaw construit également une vue de relecture idempotente distincte pour les sessions dont l’historique conserve des blocs d’images bruts ou des marqueurs de médias d’hydratation des prompts.

- Elle conserve les **3 derniers tours terminés** à l’identique, octet par octet, afin que les préfixes du cache de prompts restent stables pour les échanges de suivi récents. Ce nombre inclut tous les tours terminés, et pas seulement ceux contenant des images ; les tours composés uniquement de texte sont donc également comptabilisés dans cette fenêtre.
- Dans la vue de relecture, les anciens blocs d’images déjà traités issus de l’historique `user` ou `toolResult` sont remplacés par `[données d’image supprimées - déjà traitées par le modèle]`.
- Les anciennes références textuelles à des médias, telles que `[média joint : ...]`, `[Image : source : ...]` et `media://inbound/...`, sont remplacées par `[référence au média supprimée - déjà traitée par le modèle]`. Les marqueurs de pièces jointes du tour en cours restent intacts afin que les modèles de vision puissent toujours hydrater les nouvelles images.
- La transcription brute de la session n’est pas réécrite ; les visionneuses d’historique peuvent donc toujours afficher les entrées de messages d’origine et leurs images.
- Ce mécanisme est distinct de l’élagage normal selon la durée de vie du cache décrit ci-dessus. Il empêche les charges utiles d’images répétées ou les références obsolètes à des médias d’invalider les caches de prompts lors des tours ultérieurs.

## Valeurs par défaut intelligentes

Le Plugin Anthropic intégré configure automatiquement l’élagage et la cadence du Heartbeat la première fois qu’il résout un profil d’authentification Anthropic (ou Claude CLI), mais uniquement pour les champs que vous n’avez pas déjà définis explicitement :

| Mode d’authentification                         | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ----------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/jeton (y compris la réutilisation de Claude CLI) | `cache-ttl`           | `1h`                 | `1h`              |
| Clé d’API                                       | `cache-ttl`           | `1h`                 | `30m`             |

Si vous définissez vous-même `agents.defaults.contextPruning.mode` ou `agents.defaults.heartbeat.every`, OpenClaw ne les remplace pas. Cette valeur automatique par défaut s’applique uniquement à l’authentification de la famille Anthropic ; pour les autres fournisseurs, l’élagage est défini sur `off`, sauf si vous le configurez.

## Activation ou désactivation

L’élagage est désactivé par défaut pour les fournisseurs autres qu’Anthropic. Pour l’activer :

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Pour le désactiver : définissez `mode: "off"`.

## Élagage et Compaction

|                 | Élagage                              | Compaction                |
| --------------- | ------------------------------------ | ------------------------- |
| **Action**      | Raccourcit les résultats d’outils    | Résume la conversation    |
| **Enregistré ?** | Non (pour chaque requête)             | Oui (dans la transcription) |
| **Portée**      | Résultats d’outils uniquement         | Conversation entière      |

Ces mécanismes sont complémentaires : l’élagage limite le volume des sorties d’outils entre les cycles de Compaction.

## Pour aller plus loin

- [Compaction](/fr/concepts/compaction) : réduction du contexte fondée sur la synthèse
- [Configuration du Gateway](/fr/gateway/configuration) : tous les paramètres de configuration de l’élagage (`contextPruning.*`)

## Pages connexes

- [Gestion des sessions](/fr/concepts/session)
- [Outils de session](/fr/concepts/session-tool)
- [Moteur de contexte](/fr/concepts/context-engine)
