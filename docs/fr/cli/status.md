---
read_when:
    - Vous voulez un diagnostic rapide de l’état des canaux + des destinataires récents des sessions
    - Vous voulez un état « tout » prêt à coller pour le débogage
summary: Référence de la CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
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
- Le simple `openclaw status` reste sur le chemin rapide en lecture seule et marque la mémoire comme `not checked` au lieu de non disponible lorsqu’il ignore l’inspection de la mémoire. L’audit de sécurité lourd, la compatibilité des plugins et les sondes de vecteurs mémoire sont laissés à `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` et `openclaw memory status --deep`.
- `status --json --all` signale les détails de mémoire provenant du runtime du Plugin de mémoire actif sélectionné par `plugins.slots.memory`. Les Plugins de mémoire personnalisés peuvent laisser `agents.defaults.memorySearch.enabled` intégré désactivé tout en signalant leurs propres fichiers, fragments, vecteurs et état FTS.
- `--usage` affiche les fenêtres d’utilisation de fournisseur normalisées sous la forme `X% left`.
- La sortie de statut de session sépare `Execution:` de `Runtime:`. `Execution` est le chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique si la session utilise `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP tel que `codex (acp/acpx)`. Consultez [Runtimes d’agent](/fr/concepts/agent-runtimes) pour la distinction entre fournisseur, modèle et runtime.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant affichage. Les champs basés sur un décompte prévalent lorsqu’ils sont présents. Les réponses `model_remains` préfèrent l’entrée de modèle de chat, dérivent l’étiquette de fenêtre à partir des horodatages si nécessaire, et incluent le nom du modèle dans l’étiquette du forfait.
- Lorsque l’instantané de session actuel est clairsemé, `/status` peut compléter les compteurs de tokens et de cache depuis le journal d’utilisation de transcript le plus récent. Les valeurs actives non nulles existantes prévalent toujours sur les valeurs de repli du transcript.
- `/status` inclut la durée de fonctionnement compacte du processus Gateway et la durée de fonctionnement du système hôte.
- Le repli sur transcript peut également récupérer l’étiquette du modèle de runtime actif lorsque l’entrée de session active ne l’a pas. Si ce modèle de transcript diffère du modèle sélectionné, le statut résout la fenêtre de contexte par rapport au modèle de runtime récupéré plutôt qu’au modèle sélectionné.
- Pour la comptabilisation de la taille des prompts, le repli sur transcript préfère le total orienté prompt le plus élevé lorsque les métadonnées de session sont absentes ou plus petites, afin que les sessions de fournisseurs personnalisés ne tombent pas à des affichages de `0` token.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut l’état d’installation et de runtime du service hôte Gateway + nœud lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les extractions sources).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, le statut affiche une indication pour exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les échecs d’actualisation de la tarification des modèles sont affichés comme avertissements de tarification facultatifs. Ils ne signifient pas que le Gateway ou les canaux sont défectueux.
- Les surfaces de statut en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRefs pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, le statut reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie lisible par l’humain affiche des avertissements comme « configured token unavailable in this command path », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution de SecretRef locale à la commande réussit, le statut préfère l’instantané résolu et efface les marqueurs de canal transitoires « secret unavailable » de la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.

## Connexe

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
