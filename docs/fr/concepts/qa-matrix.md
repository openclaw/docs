---
read_when:
    - Exécuter pnpm openclaw qa matrix localement
    - Ajout ou sélection de scénarios d’assurance qualité Matrix
    - Triage des échecs de Matrix QA, des délais d’expiration ou du nettoyage bloqué
summary: 'Référence pour les mainteneurs de la voie QA en direct Matrix adossée à Docker : CLI, profils, variables d’environnement, scénarios et artefacts de sortie.'
title: QA de Matrix
x-i18n:
    generated_at: "2026-05-06T07:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

La voie de QA Matrix exécute le Plugin `@openclaw/matrix` fourni avec OpenClaw contre un homeserver Tuwunel jetable dans Docker, avec des comptes temporaires pour le pilote, le SUT et l’observateur, ainsi que des salons préremplis. Elle fournit la couverture réelle, avec transport réel, pour Matrix.

Cet outillage est réservé aux mainteneurs. Les versions packagées d’OpenClaw omettent intentionnellement `qa-lab`, donc `openclaw qa` n’est disponible que depuis un checkout source. Les checkouts source chargent directement le runner fourni - aucune étape d’installation de Plugin n’est nécessaire.

Pour le contexte plus large du framework de QA, consultez la [vue d’ensemble de la QA](/fr/concepts/qa-e2e-automation).

## Démarrage rapide

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La commande simple `pnpm openclaw qa matrix` exécute `--profile all` et ne s’arrête pas au premier échec. Utilisez `--profile fast --fail-fast` pour une barrière de validation de release ; fragmentez le catalogue avec `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` lors de l’exécution de l’inventaire complet en parallèle.

## Ce que fait la voie

1. Provisionne un homeserver Tuwunel jetable dans Docker (image par défaut `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nom de serveur `matrix-qa.test`, port `28008`).
2. Enregistre trois utilisateurs temporaires - `driver` (envoie le trafic entrant), `sut` (le compte OpenClaw Matrix testé), `observer` (capture du trafic tiers).
3. Préremplit les salons requis par les scénarios sélectionnés (principal, fils de discussion, média, redémarrage, secondaire, allowlist, E2EE, DM de vérification, etc.).
4. Démarre un Gateway enfant OpenClaw avec le vrai Plugin Matrix limité au compte SUT ; `qa-channel` n’est pas chargé dans l’enfant.
5. Exécute les scénarios en séquence, en observant les événements via les clients Matrix du pilote/de l’observateur.
6. Arrête le homeserver, écrit les artefacts de rapport et de résumé, puis quitte.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Options courantes

| Option                | Valeur par défaut                           | Description                                                                                                                     |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                       | Profil de scénario. Consultez [Profils](#profiles).                                                                             |
| `--fail-fast`         | désactivé                                   | S’arrêter après le premier contrôle ou scénario en échec.                                                                       |
| `--scenario <id>`     | -                                           | Exécuter uniquement ce scénario. Répétable. Consultez [Scénarios](#scenarios).                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Emplacement où les rapports, le résumé, les événements observés et le journal de sortie sont écrits. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                             | Racine du dépôt lors d’un appel depuis un répertoire de travail neutre.                                                         |
| `--sut-account <id>`  | `sut`                                       | Identifiant du compte Matrix dans la configuration du Gateway de QA.                                                            |

### Options du fournisseur

La voie utilise un vrai transport Matrix, mais le fournisseur de modèle est configurable :

| Option                   | Valeur par défaut   | Description                                                                                                                                    |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`     | `mock-openai` pour un dispatch mock déterministe ou `live-frontier` pour des fournisseurs frontier en direct. L’ancien alias `live-openai` fonctionne encore. |
| `--model <ref>`          | défaut du fournisseur | Référence `provider/model` principale.                                                                                                         |
| `--alt-model <ref>`      | défaut du fournisseur | Référence `provider/model` alternative lorsque les scénarios changent en cours d’exécution.                                                    |
| `--fast`                 | désactivé           | Activer le mode rapide du fournisseur lorsque c’est pris en charge.                                                                            |

La QA Matrix n’accepte pas `--credential-source` ni `--credential-role`. La voie provisionne localement des utilisateurs jetables ; il n’existe aucun pool d’identifiants partagé auprès duquel réserver.

## Profils

Le profil sélectionné décide quels scénarios s’exécutent.

| Profil          | Utilisation                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (par défaut) | Catalogue complet. Lent, mais exhaustif.                                                                                                                                                                                             |
| `fast`          | Sous-ensemble de barrière de release qui exerce le contrat de transport réel : canari, filtrage des mentions, blocage par allowlist, forme des réponses, reprise après redémarrage, suivi de fil, isolation des fils, observation des réactions et livraison des métadonnées d’approbation exec. |
| `transport`     | Scénarios de niveau transport pour fils de discussion, DM, salon, autojoin, mention/allowlist, approbation et réactions.                                                                                                             |
| `media`         | Couverture des pièces jointes image, audio, vidéo, PDF et EPUB.                                                                                                                                                                       |
| `e2ee-smoke`    | Couverture E2EE minimale - réponse chiffrée de base, suivi de fil, réussite du bootstrap.                                                                                                                                            |
| `e2ee-deep`     | Scénarios E2EE exhaustifs de perte d’état, sauvegarde, clé et récupération.                                                                                                                                                          |
| `e2ee-cli`      | Scénarios CLI `openclaw matrix encryption setup` et `verify *` pilotés via le harnais de QA.                                                                                                                                          |

La correspondance exacte se trouve dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scénarios

La liste complète des identifiants de scénario est l’union `MatrixQaScenarioId` dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Les catégories incluent :

- fils de discussion - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- niveau supérieur / DM / salon - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming et progression des outils - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- médias - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routage - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- réactions - `matrix-reaction-*`
- approbations - `matrix-approval-*` (métadonnées exec/Plugin, fallback fragmenté, réactions de refus, fils de discussion et routage `target: "both"`)
- redémarrage et rejeu - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- filtrage des mentions, bot à bot et allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (réponse de base, suivi de fil, bootstrap, cycle de vie de la clé de récupération, variantes de perte d’état, comportement de sauvegarde serveur, hygiène des appareils, vérification SAS / QR / DM, redémarrage, masquage des artefacts)
- CLI E2EE - `matrix-e2ee-cli-*` (configuration du chiffrement, configuration idempotente, échec du bootstrap, cycle de vie de la clé de récupération, multi-compte, aller-retour de réponse Gateway, auto-vérification)

Passez `--scenario <id>` (répétable) pour exécuter un ensemble choisi manuellement ; combinez avec `--profile all` pour ignorer le filtrage par profil.

## Variables d’environnement

| Variable                                | Valeur par défaut                         | Effet                                                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite supérieure stricte pour l’ensemble de l’exécution.                                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite pour la réponse canari initiale. La CI de release augmente cette valeur sur les exécuteurs partagés afin qu’un premier tour Gateway lent n’échoue pas avant le début de la couverture du scénario. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Fenêtre silencieuse pour les assertions négatives d’absence de réponse. Limitée à `≤` le délai d’expiration de l’exécution.                                                                               |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite pour le nettoyage Docker. Les surfaces d’échec incluent la commande de récupération `docker compose ... down --remove-orphans`.                                                                    |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Remplace l’image du homeserver lors de la validation avec une autre version de Tuwunel.                                                                                                                    |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activé                                    | `0` masque les lignes de progression `[matrix-qa] ...` sur stderr. `1` les force à s’afficher.                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | expurgé                                   | `1` conserve le corps du message et `formatted_body` dans `matrix-qa-observed-events.json`. Par défaut, ils sont expurgés pour préserver la sécurité des artefacts de CI.                                |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | désactivé                                 | `1` ignore le `process.exit` déterministe après l’écriture de l’artefact. Par défaut, la sortie est forcée, car les handles de chiffrement natifs de matrix-js-sdk peuvent garder la boucle d’événements active après la fin de l’artefact. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non défini                                | Lorsqu’il est défini par un lanceur externe (par exemple `scripts/run-node.mjs`), Matrix QA réutilise ce chemin de journal au lieu de démarrer son propre tee.                                           |

## Artefacts de sortie

Écrits dans `--output-dir` :

- `matrix-qa-report.md` - Rapport de protocole Markdown (ce qui a réussi, échoué, été ignoré, et pourquoi).
- `matrix-qa-summary.json` - Résumé structuré adapté à l’analyse par la CI et aux tableaux de bord.
- `matrix-qa-observed-events.json` - Événements Matrix observés depuis les clients pilote et observateur. Les corps sont expurgés sauf si `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ; les métadonnées d’approbation sont résumées avec des champs sûrs sélectionnés et un aperçu de commande tronqué.
- `matrix-qa-output.log` - stdout/stderr combinés de l’exécution. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` est défini, le journal du lanceur externe est réutilisé à la place.

Le répertoire de sortie par défaut est `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` afin que les exécutions successives ne s’écrasent pas mutuellement.

## Conseils de triage

- **L’exécution se bloque vers la fin :** les handles de chiffrement natifs de `matrix-js-sdk` peuvent survivre au harnais. Par défaut, un `process.exit` propre est forcé après l’écriture de l’artefact ; si vous avez désactivé `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, attendez-vous à ce que le processus persiste.
- **Erreur de nettoyage :** recherchez la commande de récupération imprimée (un appel `docker compose ... down --remove-orphans`) et exécutez-la manuellement pour libérer le port du homeserver.
- **Fenêtres d’assertion négative instables en CI :** abaissez `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (8 s par défaut) quand la CI est rapide ; augmentez-le sur les exécuteurs partagés lents.
- **Besoin de corps expurgés pour un rapport de bug :** relancez avec `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` et joignez `matrix-qa-observed-events.json`. Traitez l’artefact résultant comme sensible.
- **Autre version de Tuwunel :** faites pointer `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` vers la version testée. La voie ne vérifie que l’image par défaut épinglée.

## Contrat de transport en direct

Matrix est l’une des trois voies de transport en direct (Matrix, Telegram, Discord) qui partagent une liste de contrôle de contrat unique définie dans [vue d’ensemble QA → Couverture du transport en direct](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` reste la vaste suite synthétique et ne fait intentionnellement pas partie de cette matrice.

## Connexe

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) - pile QA globale et contrat de transport en direct
- [QA Channel](/fr/channels/qa-channel) - adaptateur de canal synthétique pour les scénarios basés sur le dépôt
- [Tests](/fr/help/testing) - exécuter les tests et ajouter une couverture QA
- [Matrix](/fr/channels/matrix) - le Plugin de canal testé
