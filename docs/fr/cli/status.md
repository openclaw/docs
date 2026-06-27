---
read_when:
    - Vous voulez un diagnostic rapide de l’état du canal + des destinataires de session récents
    - Vous voulez un statut « all » copiable pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:21:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

Diagnostics pour les canaux et les sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notes :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Un simple `openclaw status` reste sur le chemin rapide en lecture seule et marque la mémoire comme `not checked` plutôt qu’indisponible lorsqu’il ignore l’inspection de la mémoire. L’audit de sécurité approfondi, la compatibilité des plugins et les sondes de vecteurs mémoire sont laissés à `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` et `openclaw memory status --deep`.
- `status --json --all` signale les détails de mémoire depuis le runtime du plugin de mémoire active sélectionné par `plugins.slots.memory`. Les plugins de mémoire personnalisés peuvent laisser le réglage intégré `agents.defaults.memorySearch.enabled` désactivé et tout de même signaler leurs propres fichiers, fragments, vecteurs et état FTS.
- `--usage` affiche les fenêtres d’utilisation normalisées du fournisseur sous la forme `X% left`.
- La sortie d’état de session sépare `Execution:` de `Runtime:`. `Execution` est le chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique si la session utilise `OpenClaw Default`, `OpenAI Codex`, un backend CLI ou un backend ACP tel que `codex (acp/acpx)`. Consultez [Runtimes d’agent](/fr/concepts/agent-runtimes) pour la distinction entre fournisseur, modèle et runtime.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant l’affichage. Les champs fondés sur le décompte prévalent lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, déduisent le libellé de fenêtre à partir des horodatages si nécessaire, et incluent le nom du modèle dans le libellé du forfait.
- Lorsque l’instantané de la session actuelle est clairsemé, `/status` peut compléter les compteurs de tokens et de cache à partir du journal d’utilisation de transcript le plus récent. Les valeurs en direct non nulles existantes prévalent toujours sur les valeurs de repli du transcript.
- `/status` inclut la durée de fonctionnement compacte du processus Gateway et la durée de fonctionnement du système hôte.
- Le repli sur le transcript peut également récupérer le libellé du modèle de runtime actif lorsque l’entrée de session en direct ne l’indique pas. Si ce modèle de transcript diffère du modèle sélectionné, l’état résout la fenêtre de contexte par rapport au modèle de runtime récupéré plutôt qu’au modèle sélectionné.
- Lorsqu’une session est épinglée sur un modèle différent du modèle principal configuré, l’état affiche les deux valeurs, la raison (`session override`) et l’indication claire (`/model default`). Le modèle principal configuré s’applique aux sessions nouvelles ou non épinglées ; les sessions épinglées existantes conservent leur sélection de session jusqu’à ce qu’elle soit effacée.
- Pour la comptabilisation de la taille du prompt, le repli sur le transcript privilégie le total orienté prompt le plus élevé lorsque les métadonnées de session sont manquantes ou inférieures, afin que les sessions de fournisseurs personnalisés ne se réduisent pas à des affichages de `0` token.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut l’état d’installation et de runtime du service hôte Gateway + node lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les checkouts source).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, l’état affiche une indication pour exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les échecs d’actualisation des tarifs des modèles sont affichés comme des avertissements de tarification facultatifs. Ils ne signifient pas que le Gateway ou les canaux sont défaillants.
- Les surfaces d’état en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRefs pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, l’état reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie lisible par l’humain affiche des avertissements tels que « token configuré indisponible dans ce chemin de commande », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution du SecretRef locale à la commande réussit, l’état privilégie l’instantané résolu et supprime les marqueurs transitoires de « secret indisponible » du canal dans la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.

## Connexe

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
