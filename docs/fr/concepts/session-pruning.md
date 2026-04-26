---
read_when:
    - Vous souhaitez réduire l’augmentation du contexte due aux sorties d’outils
    - Vous souhaitez comprendre l’optimisation du cache de prompt Anthropic
summary: Suppression des anciens résultats d’outils pour garder un contexte léger et une mise en cache efficace
title: Élagage de session
x-i18n:
    generated_at: "2026-04-26T11:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
---

L’élagage de session supprime les **anciens résultats d’outils** du contexte avant chaque
appel LLM. Il réduit le gonflement du contexte dû à l’accumulation de sorties d’outils (résultats d’exécution, lectures de fichiers, résultats de recherche) sans réécrire le texte normal de la conversation.

<Info>
L’élagage se fait uniquement en mémoire -- il ne modifie pas la transcription de session sur disque.
L’historique complet est toujours conservé.
</Info>

## Pourquoi c’est important

Les longues sessions accumulent des sorties d’outils qui gonflent la fenêtre de contexte. Cela
augmente le coût et peut forcer la [Compaction](/fr/concepts/compaction) plus tôt que
nécessaire.

L’élagage est particulièrement utile pour le **cache de prompt Anthropic**. Après expiration de la
durée de vie du cache, la requête suivante remet en cache l’intégralité du prompt. L’élagage réduit la
taille d’écriture du cache, ce qui diminue directement le coût.

## Fonctionnement

1. Attendre l’expiration de la durée de vie du cache (5 minutes par défaut).
2. Rechercher les anciens résultats d’outils pour l’élagage normal (le texte de la conversation reste intact).
3. **Soft-trim** des résultats surdimensionnés -- conserver le début et la fin, insérer `...`.
4. **Hard-clear** du reste -- remplacer par un espace réservé.
5. Réinitialiser la durée de vie afin que les requêtes suivantes réutilisent le cache actualisé.

## Nettoyage des anciennes images

OpenClaw construit également une vue de relecture idempotente distincte pour les sessions qui
conservent des blocs d’image bruts ou des marqueurs média d’hydratation de prompt dans l’historique.

- Elle préserve les **3 tours terminés les plus récents** octet pour octet afin que les préfixes de cache de prompt pour les suivis récents restent stables.
- Dans la vue de relecture, les anciens blocs d’image déjà traités provenant de l’historique `user` ou
  `toolResult` peuvent être remplacés par
  `[image data removed - already processed by model]`.
- Les anciennes références média textuelles telles que `[media attached: ...]`,
  `[Image: source: ...]` et `media://inbound/...` peuvent être remplacées par
  `[media reference removed - already processed by model]`. Les marqueurs de pièce jointe du tour en cours restent intacts afin que les modèles de vision puissent toujours hydrater les nouvelles
  images.
- La transcription brute de la session n’est pas réécrite ; les visionneuses d’historique peuvent donc toujours
  afficher les entrées de message d’origine et leurs images.
- Ceci est distinct de l’élagage normal fondé sur la durée de vie du cache. Cela existe pour empêcher que des
  charges utiles d’image répétées ou des références média obsolètes ne fassent échouer les caches de prompt lors des tours suivants.

## Valeurs par défaut intelligentes

OpenClaw active automatiquement l’élagage pour les profils Anthropic :

| Type de profil                                          | Élagage activé | Heartbeat |
| ------------------------------------------------------- | -------------- | --------- |
| Authentification OAuth/token Anthropic (y compris la réutilisation de Claude CLI) | Oui            | 1 heure   |
| Clé API                                                 | Oui            | 30 min    |

Si vous définissez des valeurs explicites, OpenClaw ne les remplace pas.

## Activer ou désactiver

L’élagage est désactivé par défaut pour les fournisseurs non Anthropic. Pour l’activer :

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

## Élagage vs Compaction

|            | Élagage                    | Compaction                 |
| ---------- | -------------------------- | -------------------------- |
| **Quoi**   | Supprime les résultats d’outils | Résume la conversation |
| **Enregistré ?** | Non (par requête)    | Oui (dans la transcription) |
| **Portée** | Résultats d’outils uniquement | Conversation entière    |

Ils se complètent -- l’élagage garde des sorties d’outils légères entre les cycles de
Compaction.

## Pour aller plus loin

- [Compaction](/fr/concepts/compaction) -- réduction du contexte fondée sur la synthèse
- [Configuration de la Gateway](/fr/gateway/configuration) -- tous les réglages de configuration de l’élagage
  (`contextPruning.*`)

## Liens connexes

- [Gestion de session](/fr/concepts/session)
- [Outils de session](/fr/concepts/session-tool)
- [Moteur de contexte](/fr/concepts/context-engine)
