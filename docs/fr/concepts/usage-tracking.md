---
read_when:
    - Vous raccordez les surfaces d’utilisation et de quotas des fournisseurs
    - Vous devez expliquer le comportement du suivi de l’utilisation ou les exigences d’authentification
summary: Surfaces de suivi de l’utilisation et exigences relatives aux informations d’identification
title: Suivi de l’utilisation
x-i18n:
    generated_at: "2026-05-06T07:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Ce que c’est

- Récupère l’utilisation/le quota des fournisseurs directement depuis leurs endpoints d’utilisation.
- Aucun coût estimé ; uniquement les fenêtres rapportées par le fournisseur.
- La sortie d’état lisible par un humain est normalisée en `X% left`, même lorsqu’une
  API amont rapporte le quota consommé, le quota restant ou uniquement des comptages bruts.
- `/status` au niveau de la session et `session_status` peuvent se rabattre sur la dernière
  entrée d’utilisation de la transcription lorsque l’instantané de session en direct est incomplet. Ce
  repli renseigne les compteurs de tokens/cache manquants, peut récupérer le libellé du modèle
  d’exécution actif, et préfère le total orienté prompt le plus élevé lorsque les métadonnées de
  session sont absentes ou plus faibles. Les valeurs non nulles en direct existantes restent prioritaires.

## Où cela apparaît

- `/status` dans les discussions : carte d’état enrichie d’emojis avec tokens de session + coût estimé (clé API uniquement). L’utilisation du fournisseur s’affiche pour le **fournisseur du modèle actuel** lorsqu’elle est disponible sous forme de fenêtre normalisée `X% left`.
- `/usage off|tokens|full` dans les discussions : pied de page d’utilisation par réponse (OAuth affiche uniquement les tokens).
- `/usage cost` dans les discussions : résumé local des coûts agrégé depuis les journaux de session OpenClaw.
- CLI : `openclaw status --usage` affiche une ventilation complète par fournisseur.
- CLI : `openclaw channels list` affiche le même instantané d’utilisation avec la configuration du fournisseur (utilisez `--no-usage` pour l’ignorer).
- Barre de menus macOS : section « Usage » sous Contexte (uniquement si disponible).

## Fournisseurs + identifiants

- **Anthropic (Claude)** : tokens OAuth dans les profils d’authentification.
- **GitHub Copilot** : tokens OAuth dans les profils d’authentification.
- **Gemini CLI** : tokens OAuth dans les profils d’authentification.
  - L’utilisation JSON se rabat sur `stats` ; `stats.cached` est normalisé en
    `cacheRead`.
- **OpenAI Codex** : tokens OAuth dans les profils d’authentification (`accountId` utilisé lorsqu’il est présent).
- **MiniMax** : clé API ou profil d’authentification OAuth MiniMax. OpenClaw traite
  `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota
  MiniMax, privilégie l’OAuth MiniMax stocké lorsqu’il est présent, puis se rabat sinon
  sur `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  L’interrogation de l’utilisation déduit l’hôte du Coding Plan depuis `models.providers.minimax-portal.baseUrl`
  ou `models.providers.minimax.baseUrl` lorsqu’il est configuré, et utilise sinon l’hôte
  MiniMax CN.
  Les champs bruts `usage_percent` / `usagePercent` de MiniMax indiquent le quota
  **restant**, donc OpenClaw les inverse avant l’affichage ; les champs basés sur des
  comptages sont prioritaires lorsqu’ils sont présents.
  - Les libellés de fenêtre du Coding Plan proviennent des champs heures/minutes du fournisseur lorsqu’ils
    sont présents, puis se rabattent sur l’intervalle `start_time` / `end_time`.
  - Si l’endpoint du Coding Plan renvoie `model_remains`, OpenClaw privilégie l’entrée
    du modèle de discussion, déduit le libellé de fenêtre depuis les horodatages lorsque les champs explicites
    `window_hours` / `window_minutes` sont absents, et inclut le nom du modèle
    dans le libellé du forfait.
- **Xiaomi MiMo** : clé API via l’environnement/la configuration/le magasin d’authentification (`XIAOMI_API_KEY`).
- **z.ai** : clé API via l’environnement/la configuration/le magasin d’authentification.

L’utilisation est masquée lorsqu’aucune authentification d’utilisation fournisseur exploitable ne peut être résolue. Les fournisseurs
peuvent fournir une logique d’authentification d’utilisation propre au Plugin ; sinon, OpenClaw se rabat sur
les identifiants OAuth/clé API correspondants depuis les profils d’authentification, les variables d’environnement
ou la configuration.

## Connexe

- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
