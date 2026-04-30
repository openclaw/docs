---
read_when:
    - Exécuter pnpm openclaw qa matrix en local
    - Ajout ou sélection de scénarios d'assurance qualité Matrix
    - Triage des échecs de Matrix QA, des délais d’expiration ou des nettoyages bloqués
summary: 'Référence pour les mainteneurs de la voie de QA en direct Matrix adossée à Docker : CLI, profils, variables d’environnement, scénarios et artefacts de sortie.'
title: Matrice QA
x-i18n:
    generated_at: "2026-04-30T07:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

La voie QA Matrix exécute le plugin `@openclaw/matrix` intégré contre un homeserver Tuwunel jetable dans Docker, avec des comptes temporaires driver, SUT et observer, ainsi que des rooms préremplies. C’est la couverture réelle du transport en direct pour Matrix.

Cet outillage est réservé aux mainteneurs. Les versions empaquetées d’OpenClaw omettent volontairement `qa-lab`, donc `openclaw qa` est disponible uniquement depuis un clone source. Les clones source chargent directement le runner intégré — aucune étape d’installation de plugin n’est nécessaire.

Pour le contexte plus large du framework QA, consultez [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation).

## Démarrage rapide

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Un simple `pnpm openclaw qa matrix` exécute `--profile all` et ne s’arrête pas au premier échec. Utilisez `--profile fast --fail-fast` comme gate de release ; répartissez le catalogue avec `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` lorsque vous exécutez l’inventaire complet en parallèle.

## Ce que fait la voie

1. Provisionne un homeserver Tuwunel jetable dans Docker (image par défaut `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nom de serveur `matrix-qa.test`, port `28008`).
2. Enregistre trois utilisateurs temporaires — `driver` (envoie le trafic entrant), `sut` (le compte Matrix OpenClaw testé), `observer` (capture du trafic tiers).
3. Préremplit les rooms requises par les scénarios sélectionnés (principal, threading, media, restart, secondaire, allowlist, E2EE, DM de vérification, etc.).
4. Démarre un Gateway OpenClaw enfant avec le vrai plugin Matrix limité au compte SUT ; `qa-channel` n’est pas chargé dans l’enfant.
5. Exécute les scénarios dans l’ordre, en observant les événements via les clients Matrix driver/observer.
6. Arrête le homeserver, écrit les artefacts de rapport et de résumé, puis quitte.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Indicateurs courants

| Indicateur            | Par défaut                                   | Description                                                                                                                          |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                        | Profil de scénario. Voir [Profils](#profiles).                                                                                       |
| `--fail-fast`         | désactivé                                    | S’arrêter après le premier contrôle ou scénario échoué.                                                                               |
| `--scenario <id>`     | —                                            | Exécuter uniquement ce scénario. Répétable. Voir [Scénarios](#scenarios).                                                            |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Emplacement où les rapports, le résumé, les événements observés et le journal de sortie sont écrits. Les chemins relatifs se résolvent par rapport à `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                              | Racine du dépôt lors de l’appel depuis un répertoire de travail neutre.                                                               |
| `--sut-account <id>`  | `sut`                                        | Identifiant du compte Matrix dans la configuration du Gateway QA.                                                                     |

### Indicateurs de fournisseur

La voie utilise un vrai transport Matrix, mais le fournisseur de modèle est configurable :

| Indicateur              | Par défaut          | Description                                                                                                                                         |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` pour une distribution mock déterministe ou `live-frontier` pour les fournisseurs frontier en direct. L’ancien alias `live-openai` fonctionne toujours. |
| `--model <ref>`         | par défaut du fournisseur | Référence principale `provider/model`.                                                                                                              |
| `--alt-model <ref>`     | par défaut du fournisseur | Référence alternative `provider/model` lorsque les scénarios changent en cours d’exécution.                                                         |
| `--fast`                | désactivé           | Activer le mode rapide du fournisseur lorsqu’il est pris en charge.                                                                                 |

Matrix QA n’accepte pas `--credential-source` ni `--credential-role`. La voie provisionne localement des utilisateurs jetables ; il n’existe aucun pool d’identifiants partagé sur lequel effectuer une location.

## Profils

Le profil sélectionné décide quels scénarios s’exécutent.

| Profil          | À utiliser pour                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (par défaut) | Catalogue complet. Lent mais exhaustif.                                                                                                                                                                      |
| `fast`          | Sous-ensemble de gate de release qui exerce le contrat de transport en direct : canary, filtrage des mentions, blocage allowlist, forme de réponse, reprise après redémarrage, suivi de thread, isolation de thread, observation des réactions et livraison des métadonnées d’approbation exec. |
| `transport`     | Scénarios de threading, DM, room, autojoin, mention/allowlist, approbation et réaction au niveau transport.                                                                                                      |
| `media`         | Couverture des pièces jointes image, audio, vidéo, PDF et EPUB.                                                                                                                                                  |
| `e2ee-smoke`    | Couverture E2EE minimale — réponse chiffrée de base, suivi de thread, succès du bootstrap.                                                                                                                       |
| `e2ee-deep`     | Scénarios E2EE exhaustifs de perte d’état, sauvegarde, clé et récupération.                                                                                                                                      |
| `e2ee-cli`      | Scénarios CLI `openclaw matrix encryption setup` et `verify *` pilotés via le harness QA.                                                                                                                        |

Le mapping exact se trouve dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scénarios

La liste complète des identifiants de scénario est l’union `MatrixQaScenarioId` dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Les catégories incluent :

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- niveau supérieur / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming et progression des outils — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routage — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- réactions — `matrix-reaction-*`
- approbations — `matrix-approval-*` (métadonnées exec/plugin, fallback découpé, réactions de refus, threads et routage `target: "both"`)
- redémarrage et relecture — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- filtrage des mentions, bot-à-bot et allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (réponse de base, suivi de thread, bootstrap, cycle de vie de clé de récupération, variantes de perte d’état, comportement de sauvegarde serveur, hygiène des appareils, vérification SAS / QR / DM, redémarrage, masquage des artefacts)
- CLI E2EE — `matrix-e2ee-cli-*` (configuration du chiffrement, configuration idempotente, échec du bootstrap, cycle de vie de la clé de récupération, multi-compte, aller-retour de réponse Gateway, auto-vérification)

Passez `--scenario <id>` (répétable) pour exécuter un ensemble choisi manuellement ; combinez avec `--profile all` pour ignorer le filtrage par profil.

## Variables d’environnement

| Variable                                | Valeur par défaut                         | Effet                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite supérieure stricte pour l’ensemble de l’exécution.                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite pour la réponse canari initiale. La CI de publication l’augmente sur les exécuteurs partagés afin qu’un premier tour de Gateway lent n’échoue pas avant le début de la couverture du scénario. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Fenêtre silencieuse pour les assertions négatives d’absence de réponse. Plafonnée à `≤` le délai d’expiration de l’exécution.                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite pour le démontage Docker. Les surfaces d’échec incluent la commande de récupération `docker compose ... down --remove-orphans`.                                                                |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Remplace l’image du homeserver lors de la validation avec une autre version de Tuwunel.                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activé                                    | `0` masque les lignes de progression `[matrix-qa] ...` sur stderr. `1` les force à s’afficher.                                                                                                        |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | expurgé                                   | `1` conserve le corps du message et `formatted_body` dans `matrix-qa-observed-events.json`. Par défaut, les contenus sont expurgés pour préserver la sûreté des artefacts de CI.                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | désactivé                                 | `1` ignore le `process.exit` déterministe après l’écriture de l’artefact. Par défaut, la sortie est forcée, car les gestionnaires crypto natifs de matrix-js-sdk peuvent maintenir la boucle d’événements active après la fin des artefacts. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non défini                                | Lorsqu’il est défini par un lanceur externe (par exemple `scripts/run-node.mjs`), la QA Matrix réutilise ce chemin de journal au lieu de démarrer son propre tee.                                     |

## Artefacts de sortie

Écrits dans `--output-dir` :

- `matrix-qa-report.md` — Rapport de protocole Markdown (ce qui a réussi, échoué, été ignoré, et pourquoi).
- `matrix-qa-summary.json` — Résumé structuré adapté à l’analyse par la CI et aux tableaux de bord.
- `matrix-qa-observed-events.json` — Événements Matrix observés depuis les clients pilote et observateur. Les corps sont expurgés sauf si `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ; les métadonnées d’approbation sont résumées avec certains champs sûrs et un aperçu tronqué de la commande.
- `matrix-qa-output.log` — stdout/stderr combinés de l’exécution. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` est défini, le journal du lanceur externe est réutilisé à la place.

Le répertoire de sortie par défaut est `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` afin que les exécutions successives ne s’écrasent pas mutuellement.

## Conseils de triage

- **L’exécution se bloque vers la fin :** les gestionnaires crypto natifs de `matrix-js-sdk` peuvent survivre au harnais. Par défaut, un `process.exit` propre est forcé après l’écriture de l’artefact ; si vous avez désactivé `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, attendez-vous à ce que le processus reste actif.
- **Erreur de nettoyage :** cherchez la commande de récupération affichée (un appel `docker compose ... down --remove-orphans`) et exécutez-la manuellement pour libérer le port du homeserver.
- **Fenêtres d’assertion négative instables en CI :** réduisez `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (8 s par défaut) lorsque la CI est rapide ; augmentez-le sur les exécuteurs partagés lents.
- **Besoin de corps expurgés pour un rapport de bug :** relancez avec `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` et joignez `matrix-qa-observed-events.json`. Traitez l’artefact résultant comme sensible.
- **Version différente de Tuwunel :** pointez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` vers la version testée. La voie ne vérifie que l’image par défaut épinglée.

## Contrat de transport en direct

Matrix est l’une des trois voies de transport en direct (Matrix, Telegram, Discord) qui partagent une liste de contrôle contractuelle unique définie dans [Vue d’ensemble de la QA → Couverture du transport en direct](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` reste la suite synthétique large et ne fait intentionnellement pas partie de cette matrice.

## Associés

- [Vue d’ensemble de la QA](/fr/concepts/qa-e2e-automation) — pile QA globale et contrat de transport en direct
- [Canal QA](/fr/channels/qa-channel) — adaptateur de canal synthétique pour les scénarios adossés au dépôt
- [Tests](/fr/help/testing) — exécuter des tests et ajouter une couverture QA
- [Matrix](/fr/channels/matrix) — le Plugin de canal testé
