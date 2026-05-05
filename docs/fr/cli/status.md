---
read_when:
    - Vous voulez un diagnostic rapide de l’état de santé des canaux + des destinataires des sessions récentes
    - Vous voulez un statut « all » prêt à coller pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: Statut
x-i18n:
    generated_at: "2026-05-05T06:16:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnostics des canaux et des sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Remarques :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simple reste sur le chemin rapide en lecture seule et marque la mémoire comme `not checked` au lieu d’indisponible lorsqu’il ignore l’inspection de la mémoire. L’audit de sécurité lourd, la compatibilité des plugins et les sondes de vecteurs mémoire sont réservés à `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` et `openclaw memory status --deep`.
- `status --json --all` signale les détails de mémoire depuis l’environnement d’exécution du plugin de mémoire actif sélectionné par `plugins.slots.memory`. Les plugins de mémoire personnalisés peuvent laisser le réglage intégré `agents.defaults.memorySearch.enabled` désactivé tout en signalant leurs propres fichiers, fragments, vecteurs et état FTS.
- `--usage` affiche les fenêtres d’utilisation normalisées du fournisseur sous la forme `X% left`.
- La sortie d’état de session sépare `Execution:` de `Runtime:`. `Execution` est le chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique si la session utilise `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP tel que `codex (acp/acpx)`. Consultez [Environnements d’exécution des agents](/fr/concepts/agent-runtimes) pour la distinction entre fournisseur, modèle et environnement d’exécution.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax correspondent au quota restant ; OpenClaw les inverse donc avant l’affichage. Les champs basés sur le nombre l’emportent lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, déduisent l’étiquette de fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans l’étiquette du forfait.
- Lorsque l’instantané de la session actuelle est clairsemé, `/status` peut compléter les compteurs de jetons et de cache depuis le journal d’utilisation de transcript le plus récent. Les valeurs en direct non nulles existantes l’emportent toujours sur les valeurs de repli du transcript.
- `/status` inclut la disponibilité compacte du processus Gateway et la disponibilité du système hôte.
- Le repli sur transcript peut aussi récupérer l’étiquette du modèle d’environnement d’exécution actif lorsque l’entrée de session en direct ne l’inclut pas. Si ce modèle de transcript diffère du modèle sélectionné, l’état résout la fenêtre de contexte par rapport au modèle d’environnement d’exécution récupéré plutôt qu’au modèle sélectionné.
- Pour la comptabilisation de la taille d’invite, le repli sur transcript privilégie le total orienté invite le plus élevé lorsque les métadonnées de session sont absentes ou inférieures, afin que les sessions de fournisseurs personnalisés ne s’effondrent pas vers des affichages à `0` jeton.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut l’état d’installation et d’exécution du service hôte Gateway + node lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les extractions source).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, l’état affiche une indication pour exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les surfaces d’état en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRefs pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, l’état reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie destinée aux humains affiche des avertissements tels que « jeton configuré indisponible dans ce chemin de commande », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution command-local de SecretRef réussit, l’état privilégie l’instantané résolu et efface les marqueurs transitoires « secret indisponible » du canal dans la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
