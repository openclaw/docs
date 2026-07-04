---
read_when:
    - Exécution de pnpm openclaw qa matrix en local
    - Ajouter ou sélectionner des scénarios d’AQ Matrix
    - Triage des échecs, délais d’expiration ou nettoyages bloqués de Matrix QA
summary: 'Référence mainteneur pour la voie de QA en direct Matrix adossée à Docker : CLI, profils, variables d’environnement, scénarios et artefacts de sortie.'
title: Assurance qualité matricielle
x-i18n:
    generated_at: "2026-07-04T20:30:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

La voie QA Matrix exécute le plugin `@openclaw/matrix` groupé avec un homeserver Tuwunel jetable dans Docker, avec des comptes temporaires de pilote, de SUT et d’observateur, ainsi que des salons préremplis. C’est la couverture en direct avec transport réel pour Matrix.

Cet outillage est réservé aux mainteneurs. Les versions empaquetées d’OpenClaw omettent intentionnellement `qa-lab`, donc `openclaw qa` n’est disponible qu’à partir d’un checkout source. Les checkouts source chargent directement le runner groupé - aucune étape d’installation de plugin n’est nécessaire.

Pour un contexte plus large sur le framework QA, consultez la [vue d’ensemble QA](/fr/concepts/qa-e2e-automation).

## Démarrage rapide

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Un simple `pnpm openclaw qa matrix` exécute `--profile all` et ne s’arrête pas au premier échec. Utilisez `--profile fast --fail-fast` pour une porte de validation de release ; partitionnez le catalogue avec `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` lors de l’exécution de l’inventaire complet en parallèle.

## Ce que fait la voie

1. Provisionne un homeserver Tuwunel jetable dans Docker (image par défaut `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nom de serveur `matrix-qa.test`, port `28008`) derrière un enregistreur borné et expurgateur des requêtes/réponses.
2. Enregistre trois utilisateurs temporaires - `driver` (envoie le trafic entrant), `sut` (le compte Matrix OpenClaw testé), `observer` (capture de trafic tiers).
3. Préremplit les salons requis par les scénarios sélectionnés (principal, fils de discussion, médias, redémarrage, secondaire, liste d’autorisation, E2EE, DM de vérification, etc.).
4. Exécute la sonde de protocole `matrix-qa-v1`, neutre vis-à-vis du substrat, contre la frontière Tuwunel enregistrée. Les tests unitaires prouvent le contrat de la sonde avec le fixture du protocole Matrix ; l’hôte canonique de l’adaptateur de transport QA réel dans [#99707](https://github.com/openclaw/openclaw/pull/99707) possède le câblage réel de la cible Crabline.
5. Démarre un Gateway OpenClaw enfant avec le vrai plugin Matrix limité au compte SUT ; `qa-channel` n’est pas chargé dans l’enfant.
6. Exécute les scénarios en séquence, observe les événements via les clients Matrix driver/observer et déduit les attentes de routage/état à partir du trafic enregistré.
7. Arrête le homeserver, écrit le rapport et les artefacts de preuve, puis quitte.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Indicateurs courants

| Indicateur            | Valeur par défaut                            | Description                                                                                                                                                         |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Profil de scénario. Voir [Profils](#profiles).                                                                                                                      |
| `--fail-fast`         | désactivé                                    | S’arrêter après le premier contrôle ou scénario en échec.                                                                                                           |
| `--scenario <id>`     | -                                            | Exécuter uniquement ce scénario. Répétable. Voir [Scénarios](#scenarios).                                                                                           |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Emplacement où sont écrits les rapports, le résumé, l’inventaire de routage/état, les événements observés et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                              | Racine du dépôt lors de l’appel depuis un répertoire de travail neutre.                                                                                             |
| `--sut-account <id>`  | `sut`                                        | Identifiant du compte Matrix dans la configuration du Gateway QA.                                                                                                   |

### Indicateurs de fournisseur

La voie utilise un vrai transport Matrix, mais le fournisseur de modèle est configurable :

| Indicateur              | Valeur par défaut     | Description                                                                                                                                             |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`      | `mock-openai` pour un routage mock déterministe ou `live-frontier` pour les fournisseurs frontier en direct. L’ancien alias `live-openai` fonctionne encore. |
| `--model <ref>`         | valeur par défaut du fournisseur | Référence principale `provider/model`.                                                                                                                   |
| `--alt-model <ref>`     | valeur par défaut du fournisseur | Référence alternative `provider/model` lorsque les scénarios changent de modèle en cours d’exécution.                                                     |
| `--fast`                | désactivé             | Activer le mode rapide du fournisseur lorsque pris en charge.                                                                                            |

Matrix QA n’accepte pas `--credential-source` ni `--credential-role`. La voie provisionne localement des utilisateurs jetables ; il n’existe pas de pool d’identifiants partagé à louer.

## Profils

Le profil sélectionné décide quels scénarios s’exécutent.

| Profil          | À utiliser pour                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (par défaut) | Catalogue complet. Lent mais exhaustif.                                                                                                                                                                                                                   |
| `fast`          | Sous-ensemble de porte de validation de release qui exerce le contrat de transport en direct : canary, filtrage des mentions, blocage par liste d’autorisation, forme de réponse, reprise après redémarrage, suivi de fil, isolation de fil, observation des réactions et livraison des métadonnées d’approbation exec. |
| `transport`     | Scénarios de niveau transport pour les fils de discussion, DM, salons, autojoin, mentions/listes d’autorisation, approbations et réactions.                                                                                                                |
| `media`         | Couverture des pièces jointes image, audio, vidéo, PDF et EPUB.                                                                                                                                                                                             |
| `e2ee-smoke`    | Couverture E2EE minimale - réponse chiffrée de base, suivi de fil, réussite du bootstrap.                                                                                                                                                                  |
| `e2ee-deep`     | Scénarios exhaustifs E2EE de perte d’état, sauvegarde, clés et récupération.                                                                                                                                                                                |
| `e2ee-cli`      | Scénarios CLI `openclaw matrix encryption setup` et `verify *` pilotés via le harnais QA.                                                                                                                                                                  |

La correspondance exacte se trouve dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scénarios

La liste complète des identifiants de scénario est l’union `MatrixQaScenarioId` dans `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Les catégories incluent :

- fils de discussion - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- niveau supérieur / DM / salon - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming et progression des outils - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- médias - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routage - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- réactions - `matrix-reaction-*`
- approbations - `matrix-approval-*` (métadonnées exec/plugin, fallback fragmenté, réactions de refus, fils et routage `target: "both"`)
- redémarrage et rejeu - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- filtrage des mentions, bot-à-bot et listes d’autorisation - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (réponse de base, suivi de fil, bootstrap, cycle de vie de clé de récupération, variantes de perte d’état, comportement de sauvegarde serveur, hygiène des appareils, vérification SAS / QR / DM, redémarrage, expurgation des artefacts)
- CLI E2EE - `matrix-e2ee-cli-*` (configuration du chiffrement, configuration idempotente, échec du bootstrap, cycle de vie de clé de récupération, multi-compte, aller-retour de réponse Gateway, auto-vérification)

Passez `--scenario <id>` (répétable) pour exécuter un ensemble choisi manuellement ; combinez avec `--profile all` pour ignorer le filtrage par profil.

## Variables d’environnement

| Variable                                | Par défaut                                | Effet                                                                                                                                                                                                        |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite supérieure stricte pour toute l’exécution.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite pour la réponse canary initiale. La CI de publication l’augmente sur les runners partagés afin qu’un premier tour Gateway lent n’échoue pas avant le début de la couverture des scénarios.            |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Fenêtre silencieuse pour les assertions négatives d’absence de réponse. Plafonnée à `≤` le délai d’expiration de l’exécution.                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite pour le démontage Docker. Les surfaces d’échec incluent la commande de récupération `docker compose ... down --remove-orphans`.                                                                       |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Remplace l’image du serveur d’accueil lors de la validation avec une autre version de Tuwunel.                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activé                                    | `0` masque les lignes de progression `[matrix-qa] ...` sur stderr. `1` les force.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | expurgé                                   | `1` conserve le corps du message et `formatted_body` dans `matrix-qa-observed-events.json`. Par défaut, ils sont expurgés pour garder les artefacts de CI sûrs.                                              |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | désactivé                                 | `1` ignore le `process.exit` déterministe après l’écriture des artefacts. Par défaut, la sortie est forcée, car les handles crypto natifs de matrix-js-sdk peuvent garder la boucle d’événements active après la fin des artefacts. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non défini                                | Lorsqu’il est défini par un lanceur externe (par exemple `scripts/run-node.mjs`), la QA Matrix réutilise ce chemin de journal au lieu de démarrer son propre tee.                                            |

## Artefacts de sortie

Écrits dans `--output-dir` :

- `matrix-qa-report.md` - rapport de protocole Markdown (ce qui a réussi, échoué, été ignoré, et pourquoi).
- `matrix-qa-summary.json` - résumé structuré adapté à l’analyse par la CI et aux tableaux de bord.
- `matrix-qa-route-state-manifest.json` - inventaire dynamique `matrix-qa-v1` indexé par identifiant de scénario. Il enregistre les formes de route/corps expurgées, l’ordre des requêtes, les nouvelles tentatives observées, les erreurs, la continuité des sync-token, ainsi que les familles d’état d’appareil/clé/média/sauvegarde observées pendant cette exécution. C’est une preuve exécutable, pas une référence enregistrée dans le dépôt.
- `matrix-qa-observed-events.json` - événements Matrix observés depuis les clients pilote et observateur. Les corps sont expurgés sauf si `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ; les métadonnées d’approbation sont résumées avec certains champs sûrs et un aperçu tronqué de la commande.
- `matrix-qa-output.log` - stdout/stderr combinés de l’exécution. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` est défini, le journal du lanceur externe est réutilisé à la place.

Le répertoire de sortie par défaut est `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` afin que les exécutions successives ne s’écrasent pas mutuellement.

## Conseils de triage

- **L’exécution se bloque près de la fin :** les handles crypto natifs de `matrix-js-sdk` peuvent survivre au harness. Par défaut, un `process.exit` propre est forcé après l’écriture des artefacts ; si vous avez désactivé `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, attendez-vous à ce que le processus reste actif.
- **Erreur de nettoyage :** cherchez la commande de récupération affichée (une invocation `docker compose ... down --remove-orphans`) et exécutez-la manuellement pour libérer le port du serveur d’accueil.
- **Fenêtres d’assertion négative instables en CI :** réduisez `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (8 s par défaut) lorsque la CI est rapide ; augmentez-le sur les runners partagés lents.
- **Besoin de corps expurgés pour un rapport de bug :** relancez avec `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` et joignez `matrix-qa-observed-events.json`. Traitez l’artefact obtenu comme sensible.
- **Version différente de Tuwunel :** faites pointer `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` vers la version testée. La lane vérifie uniquement l’image par défaut épinglée.

## Contrat de transport en direct

Matrix est l’une des trois lanes de transport en direct (Matrix, Telegram, Discord) qui partagent une checklist de contrat unique définie dans [Vue d’ensemble QA → Couverture du transport en direct](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` reste la suite synthétique large et ne fait volontairement pas partie de cette matrice.

## Liens connexes

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) - pile QA globale et contrat de transport en direct
- [Canal QA](/fr/channels/qa-channel) - adaptateur de canal synthétique pour les scénarios adossés au dépôt
- [Tests](/fr/help/testing) - exécuter les tests et ajouter une couverture QA
- [Matrix](/fr/channels/matrix) - le Plugin de canal testé
