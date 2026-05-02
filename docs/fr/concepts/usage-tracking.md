---
read_when:
    - Vous raccordez les surfaces d’utilisation/de quotas du fournisseur
    - Vous devez expliquer le comportement du suivi de l’utilisation ou les exigences d’authentification
summary: Surfaces de suivi de l’utilisation et exigences relatives aux identifiants
title: Suivi de l’utilisation
x-i18n:
    generated_at: "2026-05-02T07:05:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Ce que c’est

- Récupère l’utilisation/le quota des fournisseurs directement depuis leurs points de terminaison d’utilisation.
- Aucun coût estimé ; seulement les fenêtres déclarées par le fournisseur.
- La sortie d’état lisible par l’humain est normalisée en `X% left`, même lorsqu’une
  API en amont signale le quota consommé, le quota restant ou seulement des nombres bruts.
- `/status` et `session_status` au niveau de la session peuvent se rabattre sur la dernière
  entrée d’utilisation de la transcription lorsque l’instantané de session en direct est peu détaillé. Ce
  repli complète les compteurs de jetons/cache manquants, peut récupérer le libellé du modèle
  d’exécution actif et privilégie le total orienté invite le plus élevé lorsque les métadonnées
  de session sont absentes ou plus petites. Les valeurs en direct non nulles existantes restent prioritaires.

## Où cela apparaît

- `/status` dans les discussions : carte d’état riche en emoji avec jetons de session + coût estimé (clé API uniquement). L’utilisation du fournisseur s’affiche pour le **fournisseur du modèle actuel** lorsqu’elle est disponible sous forme de fenêtre `X% left` normalisée.
- `/usage off|tokens|full` dans les discussions : pied de page d’utilisation par réponse (OAuth affiche uniquement les jetons).
- `/usage cost` dans les discussions : résumé local des coûts agrégé à partir des journaux de session OpenClaw.
- CLI : `openclaw status --usage` affiche une ventilation complète par fournisseur.
- CLI : `openclaw channels list` affiche le même instantané d’utilisation avec la configuration du fournisseur (utilisez `--no-usage` pour l’ignorer).
- Barre de menus macOS : section « Utilisation » sous Contexte (uniquement si disponible).

## Fournisseurs + identifiants

- **Anthropic (Claude)** : jetons OAuth dans les profils d’authentification.
- **GitHub Copilot** : jetons OAuth dans les profils d’authentification.
- **Gemini CLI** : jetons OAuth dans les profils d’authentification.
  - L’utilisation JSON se rabat sur `stats` ; `stats.cached` est normalisé en
    `cacheRead`.
- **OpenAI Codex** : jetons OAuth dans les profils d’authentification (accountId utilisé lorsqu’il est présent).
- **MiniMax** : clé API ou profil d’authentification OAuth MiniMax. OpenClaw traite
  `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota MiniMax,
  privilégie l’OAuth MiniMax stocké lorsqu’il est présent, puis se rabat sinon
  sur `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  L’interrogation de l’utilisation déduit l’hôte Coding Plan à partir de `models.providers.minimax-portal.baseUrl`
  ou de `models.providers.minimax.baseUrl` lorsqu’il est configuré, et utilise sinon
  l’hôte MiniMax CN.
  Les champs bruts `usage_percent` / `usagePercent` de MiniMax correspondent au quota **restant**,
  OpenClaw les inverse donc avant l’affichage ; les champs basés sur des compteurs sont prioritaires lorsqu’ils sont
  présents.
  - Les libellés de fenêtre du plan de codage proviennent des champs heures/minutes du fournisseur lorsqu’ils sont
    présents, puis se rabattent sur l’intervalle `start_time` / `end_time`.
  - Si le point de terminaison du plan de codage renvoie `model_remains`, OpenClaw privilégie l’entrée
    du modèle de discussion, déduit le libellé de fenêtre à partir des horodatages lorsque les champs explicites
    `window_hours` / `window_minutes` sont absents, et inclut le nom du modèle
    dans le libellé du plan.
- **Xiaomi MiMo** : clé API via l’environnement/la configuration/le magasin d’authentification (`XIAOMI_API_KEY`).
- **z.ai** : clé API via l’environnement/la configuration/le magasin d’authentification.

L’utilisation est masquée lorsqu’aucune authentification d’utilisation de fournisseur exploitable ne peut être résolue. Les fournisseurs
peuvent fournir une logique d’authentification d’utilisation propre aux plugins ; sinon OpenClaw se rabat sur
les identifiants OAuth/clé API correspondants provenant des profils d’authentification, des variables d’environnement
ou de la configuration.

## Connexe

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache des invites](/fr/reference/prompt-caching)
