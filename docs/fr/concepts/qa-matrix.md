---
read_when:
    - Exécuter pnpm openclaw qa matrix localement
    - Ajout ou sélection de scénarios d’assurance qualité Matrix
    - Triage des échecs d’assurance qualité, des expirations de délai ou des nettoyages bloqués dans Matrix
summary: 'Référence pour les mainteneurs concernant le parcours d’assurance qualité en conditions réelles de Matrix reposant sur Docker : CLI, profils, variables d’environnement, scénarios et artefacts de sortie.'
title: QA de Matrix
x-i18n:
    generated_at: "2026-07-12T02:36:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

La piste d’assurance qualité Matrix exécute le plugin `@openclaw/matrix` fourni avec OpenClaw sur un serveur domestique Tuwunel jetable dans Docker, avec des comptes temporaires de pilote, de système testé et d’observateur, ainsi que des salons préremplis. Elle fournit la couverture réelle du transport pour Matrix.

Outils réservés aux mainteneurs. Les versions empaquetées d’OpenClaw omettent `qa-lab` ; `openclaw qa` ne s’exécute donc que depuis une copie de travail des sources, qui charge directement l’exécuteur fourni sans étape d’installation du plugin.

Pour une présentation plus générale du framework d’assurance qualité, consultez la [présentation de l’assurance qualité](/fr/concepts/qa-e2e-automation).

## Démarrage rapide

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La commande simple `pnpm openclaw qa matrix` utilise `--profile all` et ne s’arrête pas au premier échec. Répartissez l’inventaire complet entre des tâches parallèles avec `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Fonctionnement de la piste

1. Provisionne un serveur domestique Tuwunel jetable dans Docker (image par défaut `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nom du serveur `matrix-qa.test`, port `28008`) derrière un enregistreur borné de requêtes et réponses qui masque les données sensibles.
2. Inscrit trois utilisateurs temporaires : `driver` (envoie le trafic entrant), `sut` (le compte Matrix d’OpenClaw testé), `observer` (capture le trafic tiers).
3. Préremplit les salons requis par les scénarios sélectionnés (principal, fils de discussion, médias, redémarrage, secondaire, liste d’autorisation, E2EE, message privé de vérification, etc.).
4. Exécute la sonde de protocole `matrix-qa-v1`, indépendante du substrat, sur la frontière Tuwunel enregistrée. Les tests unitaires valident le contrat de la sonde avec la fixture du protocole Matrix ; l’hôte canonique de l’adaptateur de transport d’assurance qualité dans la [#99707](https://github.com/openclaw/openclaw/pull/99707) gère le câblage des cibles Crabline réelles.
5. Démarre un Gateway OpenClaw enfant avec le véritable plugin Matrix limité au compte du système testé.
6. Exécute les scénarios dans l’ordre, observe les événements au moyen des clients Matrix du pilote et de l’observateur, puis déduit les attentes relatives aux routes et à l’état à partir du trafic enregistré.
7. Arrête le serveur domestique, écrit les artefacts de rapport et de preuve, puis se termine.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Options courantes

| Option                | Valeur par défaut                            | Description                                                                                                                                                                                   |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil de scénarios. Consultez [Profils](#profiles).                                                                                                                                          |
| `--fail-fast`         | désactivé                                     | S’arrête après le premier contrôle ou scénario en échec.                                                                                                                                      |
| `--scenario <id>`     | -                                             | Exécute uniquement ce scénario. Répétable. Consultez [Scénarios](#scenarios).                                                                                                                 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Emplacement où sont écrits les rapports, le résumé, l’inventaire des routes et des états, les événements observés et le journal de sortie. Les chemins relatifs sont résolus depuis `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Racine du dépôt lors de l’appel depuis un répertoire de travail neutre.                                                                                                                       |
| `--sut-account <id>`  | `sut`                                         | Identifiant du compte Matrix dans la configuration du Gateway d’assurance qualité.                                                                                                           |

### Options du fournisseur

La piste utilise un véritable transport Matrix, mais le fournisseur du modèle est configurable :

| Option                   | Valeur par défaut      | Description                                                                                                                                                                                                        |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`        | `mock-openai` pour une distribution simulée déterministe ou `live-frontier` pour des fournisseurs de pointe réels. L’ancien alias `live-openai` fonctionne toujours.                                                |
| `--model <ref>`          | défaut du fournisseur  | Référence principale `provider/model`.                                                                                                                                                                             |
| `--alt-model <ref>`      | défaut du fournisseur  | Autre référence `provider/model` lorsque les scénarios changent de modèle en cours d’exécution.                                                                                                                     |
| `--fast`                 | désactivé              | Active le mode rapide du fournisseur lorsqu’il est pris en charge.                                                                                                                                                 |

L’assurance qualité Matrix n’accepte ni `--credential-source` ni `--credential-role`. La piste provisionne localement des utilisateurs jetables ; il n’existe aucun pool partagé d’identifiants auprès duquel effectuer une location.

## Profils

| Profil          | Utilisation                                                                                                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (défaut)  | Catalogue complet. Lent, mais exhaustif.                                                                                                                                                                                                                                           |
| `fast`          | Sous-ensemble de validation de version qui exerce le contrat impératif du transport réel : filtrage des mentions, blocage par liste d’autorisation, forme des réponses, reprise après redémarrage, observation des réactions, remise des métadonnées d’approbation d’exécution et réponse E2EE de base. |
| `transport`     | Scénarios de fils de discussion, de messages privés, de salons, de connexion automatique, de mentions et listes d’autorisation, d’approbations et de réactions au niveau du transport.                                                                                              |
| `media`         | Couverture des pièces jointes image, audio, vidéo, PDF et EPUB.                                                                                                                                                                                                                    |
| `e2ee-smoke`    | Couverture E2EE minimale : réponse chiffrée de base, suivi dans un fil de discussion et réussite de l’amorçage.                                                                                                                                                                     |
| `e2ee-deep`     | Scénarios E2EE exhaustifs de perte d’état, de sauvegarde, de clés et de récupération.                                                                                                                                                                                              |
| `e2ee-cli`      | Scénarios CLI `openclaw matrix encryption setup` et `verify *` pilotés par le harnais d’assurance qualité.                                                                                                                                                                         |

La correspondance exacte se trouve dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scénarios

L’adaptateur Matrix partagé expose ces scénarios YAML canoniques au moyen de `openclaw qa suite --channel-driver live --channel matrix` :

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` reste disponible au moyen d’une sélection explicite avec `--scenario subagent-thread-spawn`,
mais ne fait pas partie de l’ensemble Matrix partagé par défaut tant que la preuve réelle d’achèvement des enfants n’est pas stable.

La liste restante des identifiants de scénarios impératifs correspond à l’union `MatrixQaScenarioId` dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Catégories :

- fils de discussion : `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- niveau supérieur / message privé / salon : `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- diffusion en continu et progression des outils : `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- médias : `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routage : `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- réactions : `matrix-reaction-*`
- approbations : `matrix-approval-*` (métadonnées d’exécution/plugin, solution de repli fragmentée, réactions de refus, fils de discussion et routage `target: "both"`)
- redémarrage et relecture : `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- filtrage des mentions, communication de bot à bot et listes d’autorisation : `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE : `matrix-e2ee-*` (réponse de base, suivi dans un fil de discussion, amorçage, cycle de vie de la clé de récupération, variantes de perte d’état, comportement de la sauvegarde serveur, hygiène des appareils, vérification SAS / QR / par message privé, redémarrage, masquage des artefacts)
- CLI E2EE : `matrix-e2ee-cli-*` (configuration du chiffrement, configuration idempotente, échec de l’amorçage, cycle de vie de la clé de récupération, comptes multiples, aller-retour des réponses du Gateway, auto-vérification)

Transmettez `--scenario <id>` (répétable) pour exécuter un ensemble sélectionné manuellement ; combinez cette option avec `--profile all` pour ignorer le filtrage par profil.

## Variables d’environnement

| Variable                                | Valeur par défaut                         | Effet                                                                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite supérieure stricte pour l’ensemble de l’exécution.                                                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite pour la réponse canari initiale. La CI de publication l’augmente sur les exécuteurs partagés afin qu’un premier tour lent du Gateway n’échoue pas avant le début de la couverture des scénarios.                     |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Fenêtre de silence pour les assertions négatives d’absence de réponse. Plafonnée à `<=` la durée limite de l’exécution.                                                                                                    |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite pour l’arrêt de Docker. Les informations affichées en cas d’échec incluent la commande de récupération `docker compose ... down --remove-orphans`.                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Remplace l’image du serveur domestique lors de la validation avec une autre version de Tuwunel.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activé                                    | `0` masque les lignes de progression `[matrix-qa] ...` sur stderr. `1` force leur affichage.                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | expurgé                                   | `1` conserve le corps du message et `formatted_body` dans `matrix-qa-observed-events.json`. Par défaut, ils sont expurgés afin de préserver la sécurité des artefacts de CI.                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | désactivé                                 | `1` ignore l’appel déterministe à `process.exit` après l’écriture des artefacts. Par défaut, la sortie est forcée, car les gestionnaires cryptographiques natifs de matrix-js-sdk peuvent maintenir la boucle d’événements active après la fin de la création des artefacts. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non défini                                | Lorsqu’il est défini par un lanceur externe (par exemple `scripts/run-node.mjs`), l’assurance qualité de Matrix réutilise ce chemin de journal au lieu de démarrer sa propre duplication de sortie.                          |

## Artefacts de sortie

Écrits dans `--output-dir` (par défaut `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, afin que les exécutions successives ne s’écrasent pas mutuellement) :

- `matrix-qa-report.md` : rapport de protocole Markdown (éléments réussis, en échec ou ignorés, et raisons correspondantes).
- `matrix-qa-summary.json` : résumé structuré adapté à l’analyse par la CI et aux tableaux de bord.
- `matrix-qa-route-state-manifest.json` : inventaire dynamique `matrix-qa-v1` indexé par identifiant de scénario. Il consigne les structures expurgées des routes et des corps, l’ordre des requêtes, les nouvelles tentatives observées, les erreurs, la continuité des jetons de synchronisation ainsi que les familles d’états des appareils, clés, médias et sauvegardes observées pendant cette exécution. Il s’agit d’une preuve exécutable, et non d’une référence enregistrée dans le dépôt.
- `matrix-qa-observed-events.json` : événements Matrix observés depuis les clients pilote et observateur. Les corps sont expurgés sauf si `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ; les métadonnées d’approbation sont résumées avec certains champs sûrs et un aperçu tronqué de la commande.
- `matrix-qa-output.log` : sortie stdout/stderr combinée de l’exécution. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` est défini, le journal du lanceur externe est réutilisé à la place.

## Conseils de diagnostic

- **L’exécution se bloque vers la fin :** les gestionnaires cryptographiques natifs de `matrix-js-sdk` peuvent survivre au banc d’essai. Par défaut, un appel propre à `process.exit` est forcé après l’écriture des artefacts ; si vous définissez `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, attendez-vous à ce que le processus reste actif.
- **Erreur de nettoyage :** recherchez la commande de récupération affichée (une invocation de `docker compose ... down --remove-orphans`) et exécutez-la manuellement pour libérer le port du serveur domestique.
- **Fenêtres d’assertion négative instables dans la CI :** réduisez `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (8 s par défaut) lorsque la CI est rapide ; augmentez-la sur les exécuteurs partagés lents.
- **Besoin de corps expurgés pour un rapport de bogue :** relancez avec `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` et joignez `matrix-qa-observed-events.json`. Considérez l’artefact obtenu comme sensible.
- **Version différente de Tuwunel :** faites pointer `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` vers la version testée. Seule l’image par défaut épinglée est enregistrée pour ce parcours.

## Contrat de transport en conditions réelles

Matrix est l’un des trois parcours de transport en conditions réelles (Matrix, Telegram et Discord) qui partagent une liste de contrôle contractuelle unique définie dans [Présentation de l’assurance qualité : couverture des transports en conditions réelles](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` reste la suite synthétique étendue et ne fait délibérément pas partie de cette matrice.

## Pages associées

- [Présentation de l’assurance qualité](/fr/concepts/qa-e2e-automation) : pile globale d’assurance qualité et contrat de transport en conditions réelles
- [Canal d’assurance qualité](/fr/channels/qa-channel) : adaptateur de canal synthétique pour les scénarios adossés au dépôt
- [Tests](/fr/help/testing) : exécution des tests et ajout d’une couverture d’assurance qualité
- [Matrix](/fr/channels/matrix) : le Plugin de canal testé
