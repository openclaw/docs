---
read_when:
    - Vous voulez un diagnostic rapide de l’état du canal + des destinataires de session récents
    - Vous souhaitez un statut « all » prêt à coller pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T07:17:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Diagnostics pour les canaux + sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notes :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simple reste sur le chemin rapide en lecture seule et marque la mémoire comme `not checked` au lieu d’indisponible lorsqu’il ignore l’inspection de la mémoire. L’audit de sécurité lourd, la compatibilité des plugins et les sondes de vecteurs mémoire sont laissés à `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` et `openclaw memory status --deep`.
- `status --json --all` signale les détails de mémoire provenant du runtime de plugin de mémoire active sélectionné par `plugins.slots.memory`. Les plugins de mémoire personnalisés peuvent laisser `agents.defaults.memorySearch.enabled` intégré désactivé tout en signalant leurs propres fichiers, fragments, vecteurs et état FTS.
- `--usage` affiche les fenêtres d’utilisation normalisées des fournisseurs sous la forme `X% left`.
- La sortie d’état de session sépare `Execution:` de `Runtime:`. `Execution` est le chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique si la session utilise `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP tel que `codex (acp/acpx)`. Consultez [Runtimes d’agent](/fr/concepts/agent-runtimes) pour la distinction entre fournisseur, modèle et runtime.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant l’affichage. Les champs basés sur le comptage prévalent lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, dérivent le libellé de fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans le libellé de l’offre.
- Lorsque l’instantané de la session actuelle est clairsemé, `/status` peut compléter les compteurs de jetons et de cache à partir du journal d’utilisation de transcript le plus récent. Les valeurs en direct non nulles existantes prévalent toujours sur les valeurs de repli du transcript.
- `/status` inclut la durée de fonctionnement compacte du processus Gateway et la durée de fonctionnement du système hôte.
- Le repli sur transcript peut aussi récupérer le libellé du modèle runtime actif lorsque l’entrée de session en direct ne l’indique pas. Si ce modèle de transcript diffère du modèle sélectionné, l’état résout la fenêtre de contexte par rapport au modèle runtime récupéré plutôt qu’au modèle sélectionné.
- Pour la comptabilisation de la taille des prompts, le repli sur transcript privilégie le total orienté prompt le plus élevé lorsque les métadonnées de session sont absentes ou inférieures, afin que les sessions de fournisseurs personnalisés ne se réduisent pas à des affichages de `0` jeton.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut l’état d’installation/runtime du service hôte Gateway + node lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les extractions depuis les sources).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, l’état affiche une indication pour exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les surfaces d’état en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRefs pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si une SecretRef de canal prise en charge est configurée mais indisponible dans le chemin de commande actuel, l’état reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie humaine affiche des avertissements tels que « jeton configuré indisponible dans ce chemin de commande », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution de SecretRef locale à la commande réussit, l’état privilégie l’instantané résolu et efface les marqueurs transitoires de canal « secret indisponible » de la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.

## Connexe

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
