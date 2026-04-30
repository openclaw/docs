---
read_when:
    - Vous souhaitez un diagnostic rapide de l’état des canaux + des destinataires des sessions récentes
    - Vous souhaitez un état « all » prêt à coller pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: Statut
x-i18n:
    generated_at: "2026-04-30T07:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnostics pour les canaux + les sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notes :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simple reste sur le chemin rapide en lecture seule et marque la mémoire comme `not checked` au lieu de non disponible lorsqu’il ignore l’inspection de la mémoire. L’audit de sécurité lourd, la compatibilité des plugins et les sondes de vecteurs mémoire sont laissés à `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` et `openclaw memory status --deep`.
- `status --json --all` signale les détails de mémoire depuis le runtime du plugin de mémoire active sélectionné par `plugins.slots.memory`. Les plugins de mémoire personnalisés peuvent laisser `agents.defaults.memorySearch.enabled` intégré désactivé tout en signalant leurs propres fichiers, segments, vecteurs et état FTS.
- `--usage` affiche les fenêtres d’utilisation normalisées des fournisseurs sous la forme `X% left`.
- La sortie de statut de session sépare `Execution:` de `Runtime:`. `Execution` correspond au chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique si la session utilise `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP tel que `codex (acp/acpx)`. Consultez [Runtimes d’agent](/fr/concepts/agent-runtimes) pour la distinction entre fournisseur, modèle et runtime.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant l’affichage. Les champs basés sur le comptage l’emportent lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, dérivent l’étiquette de fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans l’étiquette du plan.
- Lorsque l’instantané de session actuel est fragmentaire, `/status` peut compléter les compteurs de tokens et de cache à partir du journal d’utilisation de transcript le plus récent. Les valeurs en direct non nulles existantes l’emportent toujours sur les valeurs de repli du transcript.
- Le repli sur transcript peut aussi récupérer l’étiquette du modèle de runtime actif lorsqu’elle manque dans l’entrée de session en direct. Si ce modèle de transcript diffère du modèle sélectionné, le statut résout la fenêtre de contexte d’après le modèle de runtime récupéré au lieu du modèle sélectionné.
- Pour la comptabilisation de la taille d’invite, le repli sur transcript privilégie le total orienté invite le plus élevé lorsque les métadonnées de session sont absentes ou inférieures, afin que les sessions de fournisseurs personnalisés ne retombent pas sur des affichages à `0` token.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut le statut d’installation et de runtime du Gateway + service hôte Node lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les checkouts source).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, le statut affiche une indication invitant à exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les surfaces de statut en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRefs pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, le statut reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie humaine affiche des avertissements tels que « jeton configuré indisponible dans ce chemin de commande », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution de SecretRef locale à la commande réussit, le statut privilégie l’instantané résolu et efface les marqueurs transitoires « secret unavailable » des canaux dans la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.

## Associé

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
