---
read_when:
    - Vous souhaitez un diagnostic rapide de la santé des canaux et des destinataires de session récents
    - Vous souhaitez un statut « all » copiable pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: Statut
x-i18n:
    generated_at: "2026-04-25T13:44:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostics pour les canaux et les sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Remarques :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` affiche des fenêtres d’utilisation normalisées sous la forme `X% left`.
- La sortie de statut de session sépare `Execution:` de `Runtime:`. `Execution` est le chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique si la session utilise `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP tel que `codex (acp/acpx)`. Voir [Runtimes d’agent](/fr/concepts/agent-runtimes) pour la distinction fournisseur/modèle/runtime.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant affichage ; les champs basés sur le comptage sont prioritaires lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, dérivent le libellé de fenêtre à partir des horodatages lorsque nécessaire et incluent le nom du modèle dans le libellé du plan.
- Lorsque l’instantané de la session en cours est partiel, `/status` peut reconstituer les compteurs de jetons et de cache à partir du journal d’utilisation de transcript le plus récent. Les valeurs en direct existantes non nulles restent prioritaires sur les valeurs de repli issues du transcript.
- Le repli via transcript peut également récupérer le libellé du modèle runtime actif lorsque l’entrée de session en direct n’en dispose pas. Si ce modèle de transcript diffère du modèle sélectionné, status résout la fenêtre de contexte à partir du modèle runtime récupéré plutôt qu’à partir du modèle sélectionné.
- Pour le calcul de la taille du prompt, le repli via transcript privilégie le total orienté prompt le plus élevé lorsque les métadonnées de session sont absentes ou plus faibles, afin que les sessions de fournisseur personnalisé ne retombent pas à un affichage de `0` jeton.
- La sortie inclut les stockages de sessions par agent lorsque plusieurs agents sont configurés.
- L’aperçu inclut l’état d’installation/d’exécution du service hôte Gateway + nœud lorsque disponible.
- L’aperçu inclut le canal de mise à jour + le SHA git (pour les checkouts de source).
- Les informations de mise à jour apparaissent dans l’aperçu ; si une mise à jour est disponible, status affiche une indication pour exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les surfaces de statut en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRef pris en charge pour leurs chemins de configuration ciblés lorsque possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, status reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie lisible affiche des avertissements comme « configured token unavailable in this command path », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution locale de SecretRef de la commande réussit, status privilégie l’instantané résolu et efface les marqueurs transitoires de canal « secret unavailable » de la sortie finale.
- `status --all` inclut une ligne d’aperçu Secrets et une section de diagnostic qui résume les diagnostics des secrets (tronqués pour la lisibilité) sans interrompre la génération du rapport.

## Liens associés

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
