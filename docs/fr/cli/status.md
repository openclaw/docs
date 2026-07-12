---
read_when:
    - Vous souhaitez un diagnostic rapide de l’état des canaux et des destinataires des sessions récentes
    - Vous souhaitez un état « all » prêt à être collé pour le débogage
summary: Référence de la CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T02:44:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnostics des canaux et des sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Option                  | Description                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--all`                 | Diagnostic complet (lecture seule, pouvant être copié-collé). Inclut l’audit de sécurité, la compatibilité des plugins et les sondes de mémoire vectorielle. |
| `--deep`                | Exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal). Active également l’audit de sécurité.              |
| `--usage`               | Affiche les fenêtres d’utilisation normalisées des fournisseurs sous la forme `X% left`.                                              |
| `--json`                | Sortie lisible par une machine.                                                                                                      |
| `--verbose` / `--debug` | Affiche également la résolution brute de la cible du Gateway avant le rapport.                                                        |

La commande simple `openclaw status` conserve le chemin rapide en lecture seule et indique la mémoire comme
`not checked` plutôt qu’indisponible lorsqu’elle ignore l’inspection de la mémoire. Les sondes approfondies
d’audit de sécurité, de compatibilité des plugins et de mémoire vectorielle sont réservées à
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
et `openclaw memory status --deep`.

## Résolution de la session et du modèle

- La sortie d’état de la session sépare `Execution:` de `Runtime:`. `Execution`
  correspond au chemin du bac à sable (`direct`, `docker/*`), tandis que `Runtime` indique
  si la session utilise `OpenClaw Default`, `OpenAI Codex`, un moteur
  CLI ou un moteur ACP tel que `codex (acp/acpx)`. Consultez
  [Environnements d’exécution des agents](/fr/concepts/agent-runtimes) pour comprendre la distinction
  entre fournisseur, modèle et environnement d’exécution.
- Lorsque l’instantané de la session actuelle est incomplet, `/status` peut compléter les compteurs
  de jetons et de cache à partir du journal d’utilisation de la transcription la plus récente. Les valeurs
  dynamiques non nulles existantes restent prioritaires sur les valeurs de repli de la transcription.
- Le repli sur la transcription peut également récupérer le libellé du modèle d’exécution actif lorsque
  celui-ci est absent de l’entrée de session dynamique. Si ce modèle de transcription diffère
  du modèle sélectionné, l’état résout la fenêtre de contexte par rapport au
  modèle d’exécution récupéré plutôt qu’au modèle sélectionné.
- Pour la comptabilisation de la taille de l’invite, le repli sur la transcription privilégie le total
  orienté invite le plus élevé lorsque les métadonnées de session sont absentes ou inférieures, afin que
  les sessions de fournisseurs personnalisés ne se réduisent pas à un affichage de `0` jeton.
- Lorsqu’une session est épinglée à un modèle différent du modèle principal configuré,
  l’état affiche les deux valeurs, la raison (`session override`) et
  l’indication `/model default`. Le modèle principal configuré s’applique aux sessions nouvelles ou
  non épinglées ; les sessions épinglées existantes conservent leur sélection de session
  jusqu’à ce qu’elle soit effacée.
- La sortie inclut les magasins de sessions propres à chaque agent lorsque plusieurs agents sont
  configurés.

## Utilisation et quota

- `--usage` affiche les fenêtres d’utilisation normalisées des fournisseurs sous la forme `X% left`.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ;
  OpenClaw les inverse donc avant l’affichage. Les champs basés sur un décompte sont prioritaires lorsqu’ils
  sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de conversation, déduisent le
  libellé de la fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans
  le libellé du forfait.
- Les échecs d’actualisation des tarifs des modèles sont affichés comme des avertissements facultatifs sur les tarifs.
  Ils ne signifient pas que le Gateway ou les canaux sont défaillants.

## Vue d’ensemble et état des mises à jour

- La vue d’ensemble inclut l’état d’installation et d’exécution du service hôte du Gateway et du Node lorsqu’il
  est disponible, ainsi qu’une durée de fonctionnement compacte du processus du Gateway et du système hôte.
- La vue d’ensemble inclut le canal de mise à jour et le SHA Git (pour les extractions du code source).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, l’état
  affiche une indication invitant à exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).

## Secrets

- Les surfaces d’état en lecture seule (`status`, `status --json`, `status --all`)
  résolvent, lorsque cela est possible, les SecretRefs pris en charge pour les chemins de configuration ciblés.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le
  chemin de commande actuel, l’état reste en lecture seule et signale une sortie
  dégradée au lieu de planter. La sortie destinée aux utilisateurs affiche des avertissements tels que « jeton configuré
  indisponible dans ce chemin de commande », et la sortie JSON inclut
  `secretDiagnostics`.
- Lorsque la résolution locale à la commande d’un SecretRef réussit, l’état privilégie
  l’instantané résolu et supprime de la sortie finale les marqueurs transitoires de canal
  indiquant que le secret est indisponible.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic
  qui résume les diagnostics des secrets (tronqués pour une meilleure lisibilité) sans
  interrompre la génération du rapport.

## Mémoire

`status --json --all` fournit les détails de la mémoire issus de l’environnement d’exécution du plugin
de mémoire active sélectionné par `plugins.slots.memory`. Les plugins de mémoire personnalisés peuvent laisser
le paramètre intégré `agents.defaults.memorySearch.enabled` désactivé tout en signalant
leurs propres fichiers, fragments, vecteurs et état FTS.

## Contenu associé

- [Référence de la CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
