---
doc-schema-version: 1
read_when:
    - Comprendre comment les composants de la pile d’assurance qualité s’articulent entre eux
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios d’assurance qualité adossés au dépôt
    - Création d’une automatisation de l’assurance qualité plus réaliste autour du tableau de bord du Gateway
summary: 'Vue d’ensemble de la pile d’assurance qualité : qa-lab, qa-channel, scénarios adossés au dépôt, canaux de transport en conditions réelles, adaptateurs de transport et rapports.'
title: Vue d’ensemble de l’assurance qualité
x-i18n:
    generated_at: "2026-07-16T13:14:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée teste OpenClaw de manière réaliste, selon une structure proche de celle des canaux, ce
qu’un test unitaire ne peut pas faire.

Composants :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de message privé, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface utilisateur de débogage, bus QA, profils de scénarios et adaptateurs de
  transport en direct pour observer la transcription, injecter des messages entrants
  et exporter un rapport Markdown.
- `qa/` : ressources d’amorçage adossées au dépôt pour la tâche de lancement et les scénarios QA
  de référence.
- [Mantis](/fr/concepts/mantis) : vérification en direct avant/après pour les bogues qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état d’une VM et des preuves de PR.

## Surface de commandes

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup disposent d’alias de script
`pnpm qa:*` ; les deux formes fonctionnent.

| Commande                                            | Objectif                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autovérification QA intégrée sans `--qa-profile` ; exécuteur de profils de maturité adossé à la taxonomie avec `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Exécuter des scénarios adossés au dépôt sur la voie Gateway QA. `--runner multipass` utilise une VM Linux jetable au lieu de l’hôte.                                                                                                                                         |
| `qa coverage`                                       | Afficher l’inventaire YAML de couverture des scénarios (`--json` pour une sortie destinée aux machines ; `--match <query>` pour trouver les scénarios correspondant à un comportement modifié ; `--tools` pour la couverture des fixtures d’outils d’exécution).                                                                                  |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` pour une porte de parité sur l’axe des modèles, ou utiliser `--runtime-axis --token-efficiency` pour écrire des rapports de parité d’exécution entre Codex et OpenClaw et d’efficacité des tokens.                                                                          |
| `qa confidence-report`                              | Classer les artefacts de preuve QA selon un manifeste dans un rapport de confiance sans aucun élément inconnu.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Écrire des canaris de contrôle négatif amorcés prouvant que la porte de confiance détecte les dérives.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Rejouer des transcriptions JSONL sélectionnées dans le banc de rejeu de parité d’exécution.                                                                                                                                                                                         |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles en direct avec un rapport évalué. Voir [Rapports](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Exécuter une invite ponctuelle sur la voie de fournisseur/modèle sélectionnée.                                                                                                                                                                                                      |
| `qa ui`                                             | Démarrer l’interface utilisateur du débogueur QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Construire l’image Docker QA précuite.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Écrire une structure docker-compose pour le tableau de bord QA et la voie Gateway.                                                                                                                                                                                                |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker et afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Démarrer uniquement le serveur du fournisseur AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Démarrer uniquement le serveur du fournisseur `mock-openai` sensible aux scénarios.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                                                                                                                           |
| `qa discord`                                        | Voie de transport en direct sur un véritable canal de guilde Discord privé.                                                                                                                                                                                                   |
| `qa matrix`                                         | Profils Matrix de QA Lab sur un serveur domestique Tuwunel jetable. Voir [Voies de test rapide Matrix](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Voie de transport en direct sur un véritable canal Slack privé.                                                                                                                                                                                                           |
| `qa telegram`                                       | Voie de transport en direct sur un véritable groupe Telegram privé.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Voie de transport en direct sur de véritables comptes WhatsApp Web.                                                                                                                                                                                                             |
| `qa mantis`                                         | Exécuteur de vérification avant/après pour les bogues de transport en direct, avec preuves de réactions d’état Discord, test rapide du bureau/navigateur Crabbox et test rapide de Slack dans VNC. Voir [Mantis](/fr/concepts/mantis) et [Guide opérationnel de Mantis pour Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook). |

### `qa run` adossé aux profils

Le `qa run` adossé aux profils lit l’appartenance depuis `taxonomy.yaml`, puis distribue
les scénarios résolus via `qa suite`. `--surface` et `--category` filtrent
le profil sélectionné au lieu de définir des voies distinctes. Le
`qa-evidence.json` obtenu comprend un résumé de tableau de bord du profil avec les nombres
de catégories sélectionnées et les identifiants de couverture manquants ; les entrées de preuve individuelles restent la
source de vérité pour les tests, les rôles de couverture et les résultats. Les identifiants de
couverture des fonctionnalités de la taxonomie sont des cibles de preuve exactes, et non des alias : la couverture par un scénario principal
satisfait les identifiants correspondants, tandis que la couverture secondaire reste indicative. Les identifiants de couverture utilisent
la forme pointée `namespace.behavior` avec des segments alphanumériques en minuscules ou comportant des tirets ;
les identifiants de profil, de surface et de catégorie peuvent toujours utiliser les identifiants de taxonomie
existants, avec tirets ou points.

Les preuves allégées omettent le `execution` par entrée et définissent `evidenceMode: "slim"` ;
`smoke-ci` utilise le mode allégé par défaut, et `--evidence-mode full` restaure les entrées complètes :

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Utilisez `smoke-ci` pour une preuve de profil déterministe avec des fournisseurs de modèles simulés et
les serveurs de fournisseur local Crabline. Utilisez `release` pour une preuve Stable/LTS sur
des canaux en direct. Utilisez `all` uniquement pour des exécutions explicites de preuves couvrant toute la taxonomie ; il
sélectionne chaque catégorie de maturité active et peut être distribué via le workflow GitHub Actions `QA
Profile Evidence` avec `qa_profile=all`. Lorsqu’une
commande nécessite également un profil racine OpenClaw, placez le profil racine avant la
commande QA :

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- À gauche : tableau de bord Gateway (interface utilisateur de contrôle) avec l’agent.
- À droite : QA Lab, affichant la transcription de style Slack et le plan du scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose
la page QA Lab, où un opérateur ou une boucle d’automatisation peut confier une mission QA
à l’agent, observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus rapidement sur l’interface utilisateur de QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un lot QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et
monte par liaison `extensions/qa-lab/web/dist` dans le conteneur `qa-lab`.
`qa:lab:watch` reconstruit ce lot lors des modifications, et le navigateur se recharge automatiquement
lorsque le hachage des ressources de QA Lab change.

### Tests rapides d’observabilité

<Note>
La QA d’observabilité reste limitée à l’extraction des sources. L’archive npm omet intentionnellement
QA Lab (et `qa-channel`), de sorte que les voies de publication Docker du paquet
n’exécutent pas les commandes `qa`. Exécutez-les depuis une extraction des sources construite lors
de la modification de l’instrumentation de diagnostic.
</Note>

| Alias                                   | Ce qu’il exécute                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Récepteur OpenTelemetry local, plus le scénario `otel-trace-smoke` avec `diagnostics-otel` activé.                                      |
| `pnpm qa:otel:collector-smoke`          | Même voie derrière un véritable conteneur Docker OpenTelemetry Collector. Utilisez-la lors de modifications du raccordement des points de terminaison ou de la compatibilité avec le collecteur/OTLP. |
| `pnpm qa:prometheus:smoke`              | Le scénario `docker-prometheus-smoke` avec `diagnostics-prometheus` activé.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` suivi de `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` suivi de `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` démarre un récepteur OTLP/HTTP local, exécute un tour
d’agent minimal sur un canal d’assurance qualité, puis vérifie que les traces,
les métriques et les journaux sont exportés. Il décode les segments de trace
protobuf exportés et vérifie la structure critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, un segment d’appel de modèle conforme
à la dernière convention sémantique GenAI, `openclaw.context.assembled` et
`openclaw.message.delivery` doivent tous être présents. Le test de fumée force
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ; le segment d’appel de modèle doit donc utiliser le nom
`{gen_ai.operation.name} {gen_ai.request.model}` ; les appels de modèle ne doivent pas exporter
`StreamAbandoned` lors des tours réussis ; les identifiants de diagnostic
bruts et les attributs `openclaw.content.*` doivent rester hors de la trace. Le
prompt du scénario demande au modèle de répondre avec un marqueur fixe et de
ne pas divulguer une chaîne secrète fixe ; les charges utiles OTLP brutes ne
doivent contenir ni l’un ni l’autre, ni la clé de session d’assurance qualité
dérivée de l’identifiant du scénario. Il écrit `otel-smoke-summary.json` à côté des
artefacts de la suite d’assurance qualité.

`qa:prometheus:smoke` vérifie que les collectes non authentifiées sont rejetées,
puis que la collecte authentifiée inclut les familles de métriques critiques
pour la publication sans contenu de prompt, contenu de réponse, identifiants
de diagnostic bruts, jetons d’authentification ni chemins locaux.

### Voies de test de fumée Matrix

Pour une voie de test de fumée Matrix utilisant un transport réel et ne
nécessitant pas d’identifiants de fournisseur de modèle, exécutez le profil de
publication avec le faux fournisseur OpenAI déterministe :

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Pour la voie du fournisseur de pointe en conditions réelles, fournissez
explicitement des identifiants compatibles avec OpenAI :

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

La commande `pnpm openclaw qa matrix` simple exécute le profil `all`
complet et continue après les échecs de scénario. Utilisez
`--fail-fast` pour une boucle de retour plus courte ou répétez
`--scenario <id>` pour sélectionner des scénarios individuels ; les
identifiants de scénario explicites ont priorité sur `--profile`.

| Profil       | Scénarios | Objectif                                                                                                                                 |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Catalogue complet (par défaut).                                                                                                          |
| `release`    | 2         | Référence de base du canal critique pour la publication et rechargement en direct de la liste d’autorisation.                             |
| `fast`       | 12        | Couverture ciblée des fils de discussion, réactions, approbations, règles, filtrage des bots et réponses chiffrées.                       |
| `transport`  | 50        | Fils de discussion, routage des messages privés/salons, adhésion automatique, approbations, réactions, redémarrages, règles de mention/liste d’autorisation, modifications et ordre entre plusieurs acteurs. |
| `media`      | 7         | Couverture des images, images générées, messages vocaux, pièces jointes, médias non pris en charge et médias chiffrés.                    |
| `e2ee-smoke` | 8         | Couverture minimale des réponses chiffrées, fils de discussion, amorçage, récupération, redémarrage, caviardage et échecs.                |
| `e2ee-deep`  | 18        | Perte d’état, sauvegarde, récupération de clé, hygiène des appareils et vérification SAS/QR/message privé.                                |
| `e2ee-cli`   | 9         | Commandes `openclaw matrix encryption setup`, de clé de récupération, de comptes multiples, d’aller-retour via le Gateway et d’auto-vérification au moyen du banc d’essai. |

L’appartenance aux profils et les exigences du canal sont définies avec les
scénarios Matrix déclaratifs sous `qa/scenarios/channels/`. L’exécution choisit le
pilote de canal. Leurs implémentations réelles se trouvent sous
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

L’adaptateur provisionne un serveur domestique Tuwunel jetable dans Docker
(image par défaut `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nom de serveur `matrix-qa.test`,
port `28008`), inscrit des utilisateurs temporaires pour le pilote,
le système testé et l’observateur, initialise les salons requis et enregistre
la frontière requête/réponse caviardée. Il exécute ensuite le véritable Plugin
Matrix dans un Gateway d’assurance qualité enfant limité à ce transport
(sans `qa-channel`), puis détruit l’environnement.

Options courantes :

| Option                   | Valeur par défaut | Objectif                                                                             |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Sélectionner l’un des profils ci-dessus.                                             |
| `--scenario <id>`        | -                 | Sélectionner un scénario ; peut être répété.                                         |
| `--fail-fast`            | désactivé         | S’arrêter après le premier contrôle ou scénario ayant échoué.                        |
| `--allow-failures`       | désactivé         | Écrire les artefacts sans renvoyer de code de sortie d’échec pour les échecs de scénario. |
| `--provider-mode <mode>` | `live-frontier`   | Utiliser `mock-openai` pour une distribution déterministe ou `live-frontier` pour un fournisseur réel. |
| `--model <ref>`          | valeur par défaut du fournisseur | Définir la référence `provider/model` principale.                                  |
| `--alt-model <ref>`      | valeur par défaut du fournisseur | Définir l’autre modèle utilisé par les scénarios qui changent de modèle.             |
| `--fast`                 | désactivé         | Activer le mode rapide du fournisseur lorsqu’il est pris en charge.                  |
| `--output-dir <path>`    | généré            | Choisir le répertoire des rapports ; les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`     | répertoire courant | Exécuter depuis un répertoire de travail neutre.                                     |
| `--sut-account <id>`     | `sut`             | Sélectionner l’identifiant du compte Matrix dans la configuration du Gateway enfant. |

L’assurance qualité Matrix ne loue pas d’identifiants Matrix partagés :
l’adaptateur crée localement des utilisateurs jetables, il n’accepte donc ni
`--credential-source` ni `--credential-role`. Remplacez l’image du serveur
domestique avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ; ajustez les vérifications négatives
d’absence de réponse avec `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (valeur par défaut
`8000`, limitée au délai d’expiration du scénario actif). La
commande à exécution unique force normalement une sortie propre après
l’écriture des artefacts, car les handles natifs de chiffrement Matrix peuvent
survivre au nettoyage ; définissez `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` uniquement pour un banc
d’essai direct qui exige que la commande rende la main.

Chaque exécution écrit les artefacts habituels de QA Lab dans le répertoire de
sortie sélectionné : `qa-suite-report.md`, `qa-suite-summary.json`,
`qa-evidence.json` et un manifeste `matrix-harness-*/matrix-qa-harness.json` caviardé. Si le
nettoyage échoue, exécutez la commande de récupération
`docker compose ... down --remove-orphans` affichée. Sur les exécuteurs lents, augmentez la fenêtre
d’absence de réponse ; dans une CI rapide, une fenêtre plus courte peut
accélérer les vérifications négatives.

Les scénarios couvrent des comportements de transport que les tests unitaires
ne peuvent pas prouver de bout en bout : filtrage des mentions, règles
d’autorisation des bots, listes d’autorisation, réponses de premier niveau et
dans des fils, routage des messages privés, traitement des réactions,
suppression des modifications entrantes, déduplication de la relecture après
redémarrage, récupération après interruption du serveur domestique,
transmission des métadonnées d’approbation, traitement des médias et flux
d’amorçage, de récupération et de vérification du chiffrement de bout en bout
Matrix. Le profil CLI de chiffrement de bout en bout exécute également
`openclaw matrix encryption setup` et les commandes de vérification via le même serveur
domestique jetable avant de contrôler les réponses du Gateway.

`matrix-room-block-streaming` et `subagent-thread-spawn` restent disponibles par sélection
explicite de `--scenario`, mais demeurent hors du profil
`all` par défaut.

La CI utilise la même interface de commande dans
`.github/workflows/qa-live-transports-convex.yml`. Les exécutions planifiées et de publication exécutent les
scénarios de publication. Les déclenchements manuels `matrix_profile=all`
répartissent les profils `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` et `e2ee-cli` ; les
déclenchements ciblés sélectionnent `fast`,
`release` ou `transport` dans une seule tâche.

### Scénarios Discord Mantis

Discord propose également des scénarios facultatifs réservés à Mantis pour la
reproduction de bogues. Utilisez `--scenario discord-status-reactions-tool-only` pour la chronologie
explicite des réactions d’état, ou `--scenario discord-thread-reply-filepath-attachment` pour créer un véritable
fil Discord et vérifier que `message.thread-reply` conserve une pièce jointe
`filePath`. Ces scénarios restent hors de la voie Discord réelle par
défaut, car il s’agit de sondes de reproduction avant/après plutôt que d’une
large couverture de test de fumée. Le flux de travail Mantis des pièces jointes
dans les fils peut également ajouter une vidéo témoin de Discord Web avec une
session ouverte lorsque `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est
configuré dans l’environnement d’assurance qualité. Ce profil de consultation
sert uniquement à la capture visuelle ; la décision de réussite ou d’échec
provient toujours de l’oracle REST de Discord.

Pour les autres voies de test de fumée utilisant un transport réel :

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Elles ciblent un canal réel préexistant avec deux bots ou comptes (pilote +
système testé). Les variables d’environnement requises, les listes de
scénarios, les artefacts de sortie et le pool d’identifiants Convex pour ces
quatre transports sont documentés dans la
[référence d’assurance qualité pour Discord, Slack, Telegram et WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
ci-dessous.

### Exécuteurs Mantis pour le bureau Slack et les tâches visuelles

Pour une exécution complète sur une machine virtuelle de bureau Slack avec
secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine Crabbox avec environnement de bureau/navigateur, exécute le
parcours Slack en direct dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau,
puis copie `slack-qa/`, `slack-desktop-smoke.png` et
`slack-desktop-smoke.mp4` (lorsque la capture vidéo est disponible) dans le
répertoire d’artefacts Mantis. Les locations Crabbox avec environnement de bureau/navigateur fournissent dès le départ les
outils de capture et les paquets auxiliaires pour le navigateur et les builds natifs ; le scénario
ne doit donc installer des solutions de repli que sur les anciennes locations. Mantis indique les durées totales et
par phase dans `mantis-slack-desktop-smoke-report.md`, afin que les exécutions lentes montrent
si le temps a été consacré au préchauffage de la location, à l’acquisition des identifiants, à la configuration distante ou à
la copie des artefacts. Réutilisez `--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web
via VNC ; les locations réutilisées maintiennent également chaud le cache du magasin pnpm de Crabbox.
La valeur par défaut `--hydrate-mode source` effectue la vérification depuis un checkout des sources et
exécute l’installation/le build dans la VM. Utilisez `--hydrate-mode prehydrated` uniquement lorsque
l’espace de travail distant réutilisé contient déjà `node_modules` et un `dist/` compilé ;
ce mode ignore l’étape coûteuse d’installation/build et échoue de manière fermée lorsque
l’espace de travail n’est pas prêt. Avec `--gateway-setup`, Mantis laisse un
Gateway Slack OpenClaw persistant s’exécuter dans la VM sur le port `38973` ; sans cette option, la
commande exécute le parcours QA Slack bot à bot normal et se termine après la
capture des artefacts.

Pour prouver l’interface native d’approbation Slack avec des éléments de preuve issus du bureau, exécutez le mode
de points de contrôle d’approbation Mantis :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ce mode est mutuellement exclusif avec `--gateway-setup`. Il exécute les scénarios
d’approbation Slack, rejette les identifiants de scénarios sans approbation, attend à chaque état
d’approbation en attente et résolu, restitue le message observé de l’API Slack dans
`approval-checkpoints/<scenario>-pending.png` et
`approval-checkpoints/<scenario>-resolved.png`, puis échoue si un point de contrôle,
un élément de preuve du message, un accusé de réception ou une capture d’écran restituée est manquant ou
vide. Les locations CI froides peuvent encore afficher la connexion à Slack dans
`slack-desktop-smoke.png` ; les images des points de contrôle d’approbation constituent la preuve visuelle
de ce parcours.

L’exécution par défaut des points de contrôle conserve les deux scénarios d’approbation Slack standard.
Pour capturer l’une ou l’autre des routes d’approbation Codex facultatives, sélectionnez-la explicitement avec
`--scenario slack-codex-approval-exec-native` ou
`--scenario slack-codex-approval-plugin-native` ; Mantis accepte les deux et génère
la même paire de captures d’écran en attente/résolue. L’exécuteur étend ses délais pour les points de contrôle
et les commandes distantes pour chaque route Codex sélectionnée, afin que la séquence complète
d’approbation, d’achèvement de l’agent et de mise à jour de l’état résolu puisse se terminer.

La liste de contrôle de l’opérateur, la commande de déclenchement du workflow GitHub, le contrat relatif aux commentaires
de preuve, le tableau de décision du mode d’hydratation, l’interprétation des durées et les étapes
de gestion des échecs se trouvent dans le
[guide opérationnel du bureau Slack Mantis](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche de bureau de type agent/vision par ordinateur, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` loue ou réutilise une machine Crabbox avec environnement de bureau/navigateur, démarre
`crabbox record --while`, pilote le navigateur visible au moyen d’un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image
describe` sur la capture d’écran lorsque `--vision-mode image-describe` est
sélectionné, puis écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et
`mantis-visual-task-report.md`. Lorsque `--expect-text` est défini, l’invite de vision
demande un verdict JSON structuré (`visible`, `evidence`, `reason`)
et ne réussit que lorsque le modèle renvoie `visible: true` avec des éléments de preuve
citant le texte attendu ; une réponse `visible: false` qui se contente de citer le
texte cible échoue tout de même à l’assertion. Utilisez `--vision-mode metadata` pour un
test de fumée sans modèle qui valide le fonctionnement du bureau, du navigateur, des captures d’écran et de la vidéo
sans appeler de fournisseur de compréhension d’images. L’enregistrement est un
artefact obligatoire pour `visual-task` ; si Crabbox n’enregistre aucun
`visual-task.mp4` non vide, la tâche échoue même si le pilote visuel a réussi. En cas
d’échec, Mantis conserve la location pour VNC, sauf si la tâche avait déjà réussi
et que `--keep-lease` n’était pas défini.

### Contrôle de l’état du pool d’identifiants

Avant d’utiliser les identifiants partagés en direct, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le diagnostic vérifie les variables d’environnement du courtier Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valide les paramètres du point de terminaison, indique
uniquement l’état défini/manquant de `OPENCLAW_QA_CONVEX_SECRET_CI` et
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, puis vérifie l’accessibilité de l’administration/la liste
lorsque le secret du mainteneur est présent.

## Couverture canonique des scénarios

Le fichier racine `taxonomy.yaml` définit les identifiants de couverture sémantique. Les fichiers YAML de scénarios
sous `qa/scenarios/` associent chaque scénario à ces identifiants et possèdent les métadonnées
d’exécution : `channel` est la seule exigence relative au canal, et `profiles` déclare
l’appartenance aux exécutions nommées. Le pilote du canal est un choix interchangeable
d’implémentation au niveau de l’exécution. Les exécuteurs TypeScript
interrogent ce catalogue ; ils ne maintiennent pas d’inventaires parallèles des scénarios ou de la couverture.

La sortie statique de `qa coverage` présente l’association entre la taxonomie et les scénarios. La preuve
réelle provient de `qa-evidence.json`, qui enregistre le scénario exécuté,
les identifiants de couverture, le canal, le pilote réellement utilisé et le résultat. Le canal et le pilote sont
des dimensions de rapport, et non des vocabulaires supplémentaires d’identifiants de couverture ni des axes
d’éligibilité des scénarios.

Pour un parcours sur une VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cette commande démarre un nouvel invité Multipass, installe les dépendances, compile OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et
le résumé dans `.artifacts/qa-e2e/...` sur l’hôte. Elle réutilise le même
comportement de sélection des scénarios que `qa suite` sur l’hôte.

Les exécutions de la suite sur l’hôte et dans Multipass exécutent plusieurs scénarios sélectionnés en
parallèle, avec des processus Gateway isolés par défaut. `qa-channel` utilise par défaut
une concurrence de 4, plafonnée au nombre de scénarios sélectionnés. Utilisez `--concurrency
<count>` pour ajuster le nombre de processus, ou `--concurrency 1` pour une exécution en série.
Utilisez `--pack personal-agent` pour exécuter le pack de benchmarks de l’assistant personnel (10
scénarios). Le sélecteur de pack s’ajoute aux options `--scenario` répétées :
les scénarios explicites s’exécutent d’abord, puis les scénarios du pack s’exécutent dans l’ordre du pack,
sans doublons. Utilisez `--pack observability` pour sélectionner ensemble les scénarios
`otel-trace-smoke` et `docker-prometheus-smoke` lorsqu’un
exécuteur QA personnalisé fournit déjà la configuration du collecteur OpenTelemetry.

La commande se termine avec un code différent de zéro lorsqu’un scénario échoue. Utilisez `--allow-failures`
pour obtenir les artefacts sans code de sortie d’échec.

Les exécutions en direct transmettent les entrées d’authentification QA prises en charge et utilisables
dans l’invité : les clés de fournisseur provenant de l’environnement, le chemin de configuration du fournisseur QA en direct et
`CODEX_HOME` lorsqu’il est présent. Conservez `--output-dir` sous la racine du dépôt afin que
l’invité puisse y réécrire via l’espace de travail monté.

## Référence QA pour Discord, Slack, Telegram et WhatsApp

L’adaptateur Matrix utilise le parcours jetable basé sur Docker décrit précédemment.
Discord, Slack, Telegram et WhatsApp s’exécutent sur des
transports réels préexistants ; leur référence se trouve donc ici.

### Options CLI partagées

Ces parcours s’enregistrent au moyen de
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et
acceptent les mêmes options :

| Option                                  | Valeur par défaut                                            | Description                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Exécuter uniquement ce scénario. Répétable.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Emplacement où sont écrits les rapports, résumés, preuves, artefacts propres au transport et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Racine du dépôt lors de l’appel depuis un répertoire de travail neutre.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | Identifiant de compte temporaire dans la configuration du Gateway QA.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` ou `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                                   | Références des modèles principal/secondaire.                                                                                                                   |
| `--fast`                              | désactivé                                                | Mode rapide du fournisseur lorsqu’il est pris en charge.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Voir [Pool d’identifiants Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` dans la CI, `maintainer` sinon                 | Rôle utilisé lorsque `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | désactivé                                                | Écrire les artefacts sans renvoyer de code de sortie d’échec lorsque des scénarios échouent.                                                                      |

Chaque parcours se termine avec un code différent de zéro dès qu’un scénario échoue. `--allow-failures` écrit
les artefacts sans définir de code de sortie d’échec. Telegram accepte également
`--list-scenarios` pour afficher les identifiants de scénarios disponibles et quitter ; les autres parcours
n’exposent pas cette option.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe Telegram privé réel avec deux bots distincts (pilote +
SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot à bot fonctionne
mieux lorsque le **Bot-to-Bot Communication Mode** est activé pour les deux bots dans
`@BotFather`.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - identifiant numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Le profil `release` sélectionne les scénarios YAML Telegram maintenus ; `all`
ajoute des contrôles facultatifs de session, d’utilisation, de chaîne de réponses et de résistance du streaming. Les valeurs
explicites de `--scenario` remplacent le profil.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Le profil `release` couvre toujours le canari, le filtrage des mentions, les réponses aux commandes natives, l’adressage des commandes et les réponses de bot à bot dans les groupes. `mock-openai`
inclut également la vérification déterministe de l’aperçu final long.
`telegram-current-session-status-tool` et
`telegram-tool-only-usage-footer` restent facultatifs : le premier n’est stable
que lorsqu’il est enchaîné directement après le canari, tandis que le second constitue une preuve sur Telegram réel
du pied de page `/usage` dans les réponses contenant uniquement des outils. Utilisez `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` pour afficher la répartition actuelle
entre éléments par défaut et facultatifs, avec les références de régression. Utilisez `--profile all` pour chaque
scénario de l’adaptateur Telegram en direct.

Artefacts de sortie :

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct,
  comprenant les champs de profil, de couverture, de fournisseur, de canal, d’artefacts, de résultat et de RTT.

Les exécutions Telegram du paquet utilisent le même contrat d’identifiants Telegram. La mesure répétée du RTT
fait partie du parcours Telegram en direct normal du paquet ; la distribution du RTT
est intégrée à `qa-evidence.json` sous `result.timing` pour la
vérification RTT sélectionnée.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Lorsque `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` est défini, l’enveloppe d’exécution en direct du paquet
loue un identifiant `kind: "telegram"`, exporte les variables d’environnement du groupe, du pilote et du bot SUT
loués dans l’exécution du paquet installé, maintient la location active par Heartbeat et la libère
à l’arrêt. Par défaut, l’enveloppe du paquet effectue 20 vérifications RTT de
`channel-canary`, avec un délai d’expiration RTT de 30s et le rôle Convex
`maintainer` hors CI lorsque Convex est sélectionné. Remplacez
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster la mesure du RTT sans
créer de commande RTT distincte ni de format de résumé propre à Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un canal réel d’une guilde Discord privée avec deux bots : un bot pilote
contrôlé par le banc de test et un bot SUT démarré par le Gateway OpenClaw enfant
via le plugin Discord intégré. Vérifie la gestion des mentions dans le canal, que
le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que
les scénarios de preuve Mantis facultatifs.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’identifiant utilisateur du bot SUT
  renvoyé par Discord (sinon, le parcours échoue immédiatement).

Facultatif :

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` sélectionne le canal vocal/de scène pour
  `discord-voice-autojoin` ; sans cette valeur, le scénario choisit le premier
  canal vocal/de scène visible par le bot SUT.

Scénarios de module YAML Discord (`qa/scenarios/channels/discord-*.yaml`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scénario vocal facultatif. S’exécute seul, active
  `channels.discord.voice.autoJoin` et vérifie que l’état vocal Discord actuel du bot SUT
  correspond au canal vocal/de scène cible. Les
  identifiants Discord de Convex peuvent inclure la valeur facultative `voiceChannelId` ; sinon, l’adaptateur
  d’exécution découvre le premier canal vocal/de scène visible dans la guilde.
- `discord-status-reactions-tool-only` - scénario Mantis facultatif. S’exécute
  seul, car il configure le SUT pour produire en permanence des réponses de guilde contenant uniquement des outils
  avec `messages.statusReactions.enabled=true`, puis capture une chronologie
  des réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après
  conservent également les artefacts MP4 fournis par le scénario sous les noms `baseline.mp4`
  et `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - scénario Mantis facultatif ; voir
  [Scénarios Mantis Discord](#discord-mantis-scenarios).

Exécutez explicitement le scénario de connexion automatique au canal vocal Discord :

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Exécutez explicitement le scénario Mantis de réactions d’état :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefacts de sortie :

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct.
- `discord-qa-reaction-timelines.json` et
  `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réactions
  d’état s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un canal Slack privé réel avec deux bots distincts : un bot pilote
contrôlé par le banc de test et un bot SUT démarré par le Gateway OpenClaw enfant
via le plugin Slack intégré.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` active les points de contrôle d’approbation visuelle
  pour Mantis. L’adaptateur écrit `<scenario>.pending.json` et
  `<scenario>.resolved.json`, puis attend les fichiers `.ack.json` correspondants.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` remplace le délai d’expiration
  de l’accusé de réception du point de contrôle. La valeur par défaut est `120000`.

Scénarios YAML canoniques exposés par l’adaptateur Slack en direct :

- `thread-follow-up`
- `thread-isolation`

Scénarios de module YAML Slack (`qa/scenarios/channels/slack-*.yaml`) :

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - sonde facultative sur Slack réel qui confirme qu’un
  canal configuré comme désactivé émet un avertissement structuré sans répondre.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` et
  `slack-progress-commentary-verbose-dedupe` - sondes facultatives sur Slack réel pour
  les contrôles indépendants des commentaires et de la progression des outils, la valeur
  par défaut héritée lorsque la clé est omise et le comportement d’envoi unique lorsque la progression détaillée persistante est activée.
- `slack-reaction-glyph-native` - scénario facultatif de réaction via l’outil de messagerie en direct.
  Demande à l’agent de transmettre exactement le glyphe `✅` et confirme que Slack a stocké
  `white_check_mark` pour le bot SUT sur le message cible.
- `slack-chart-presentation-native` - scénario facultatif de graphique portable qui
  vérifie le bloc natif `data_visualization` et le texte accessible exact.
- `slack-table-presentation-native` - scénario facultatif de tableau portable qui
  vérifie le bloc natif `data_table`, les lignes exactes et le texte accessible.
- `slack-table-invalid-blocks-fallback` - scénario facultatif de transport direct
  qui envoie, via le chemin d’envoi Slack de production, un tableau brut dépassant la limite mais structurellement lisible, avec 101 lignes de données
  plus son en-tête, démontre que Slack lui-même renvoie `invalid_blocks`
  et vérifie que le repli stocké avec mise en forme désactivée est complet et ne contient aucun
  bloc de données natif. Les détails du scénario ne conservent que des preuves sûres
  sous forme de code d’erreur, de nombre et de valeurs booléennes.
- `slack-approval-exec-native` - scénario facultatif d’approbation d’exécution native Slack.
  Demande une approbation d’exécution via le Gateway, vérifie que le message Slack
  comporte des boutons d’approbation natifs, la résout, puis vérifie la mise à jour Slack
  après résolution.
- `slack-approval-plugin-native` - scénario facultatif d’approbation native d’un plugin Slack.
  Active simultanément le transfert des approbations d’exécution et de plugin afin que les événements de plugin
  ne soient pas supprimés par le routage des approbations d’exécution, puis vérifie le même
  parcours d’interface Slack native en attente/résolue.
- `slack-codex-approval-exec-native` - scénario facultatif d’approbation de commande Codex Guardian.
  Active le plugin Codex en mode Guardian, achemine un tour d’agent Gateway
  provenant de Slack via le banc de test du serveur d’application Codex,
  attend l’invite d’approbation native du plugin Slack pour
  `openclaw-codex-app-server`, la résout et vérifie que le tour Codex
  se termine avec les marqueurs attendus de sortie de commande et d’assistant.
- `slack-codex-approval-plugin-native` - scénario facultatif d’approbation de fichier Codex Guardian.
  Utilise une instruction `apply_patch` située hors de l’espace de travail afin que Codex émette
  le parcours d’approbation des modifications de fichiers du serveur d’application, puis vérifie le même
  parcours d’approbation Slack natif en attente/résolu, le marqueur final de l’assistant et le contenu exact du fichier
  avant le nettoyage.

Les scénarios d’approbation Codex nécessitent un `openai/*` ou un `codex/*` `--model`, les
identifiants habituels du modèle en direct, ainsi qu’une authentification Codex ou par clé API acceptée par le plugin Codex.
Les détails du scénario incluent la méthode du serveur d’application Codex, la clé du modèle Codex
sélectionné, l’état final du tour Codex et la vérification du marqueur d’opération, ainsi que les
métadonnées d’approbation Slack expurgées.

Artefacts de sortie :

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct.
- `approval-checkpoints/` - uniquement lorsque Mantis définit
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ; contient les données JSON du point de contrôle,
  les données JSON d’accusé de réception et les captures d’écran des états en attente/résolu.

#### Configuration de l’espace de travail Slack

Le parcours nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un canal dont les deux
bots sont membres :

- `channelId` - l’identifiant `Cxxxxxxxxxx` d’un canal auquel les deux bots ont été
  invités. Utilisez un canal dédié ; le parcours y publie à chaque exécution.
- `driverBotToken` - jeton de bot (`xoxb-...`) de l’application **pilote**.
- `sutBotToken` - jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une
  application Slack distincte de l’application pilote afin que son identifiant utilisateur de bot soit différent.
- `sutAppToken` - jeton au niveau de l’application (`xapp-...`) de l’application SUT avec
  `connections:write`, utilisé par Socket Mode afin que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que de réutiliser un espace de travail
de production.

Le manifeste SUT ci-dessous limite volontairement l’installation de production du plugin Slack
intégré (`extensions/slack/src/setup-shared.ts:12`) aux
autorisations et événements couverts par la suite de QA Slack en direct. Pour la
configuration du canal de production telle que les utilisateurs la voient, consultez
[Configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire QA pilote/SUT
est volontairement distincte, car le parcours nécessite deux identifiants utilisateur de bot distincts
dans un même espace de travail.

**1. Créer l’application pilote**

Accédez à [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → choisissez l’espace de travail de QA, collez le manifeste suivant,
puis sélectionnez _Install to Workspace_ :

```json
{
  "display_information": {
    "name": "Pilote QA OpenClaw",
    "description": "Bot pilote de test pour le parcours Slack en direct de la QA OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "Pilote QA OpenClaw",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copiez le _Bot User OAuth Token_ (`xoxb-...`) : il devient
`driverBotToken`. Le pilote doit uniquement publier des messages et s’identifier ;
aucun événement ni Socket Mode n’est nécessaire.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. Cette application de QA
utilise volontairement une version plus restreinte du manifeste de production du plugin Slack
intégré (`extensions/slack/src/setup-shared.ts:12`) : les portées
et les événements de réaction sont omis, car la suite de QA Slack en direct ne couvre pas
encore la gestion des réactions.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Connecteur OpenClaw QA SUT pour OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Une fois que Slack a créé l’application, effectuez deux opérations sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez
  la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle
  devient `sutAppToken`.

Vérifiez que les deux bots ont des identifiants utilisateur distincts en appelant `auth.test` avec chaque
jeton. Le runtime distingue le pilote du SUT par l’identifiant utilisateur ; réutiliser une même application
pour les deux fera immédiatement échouer le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez-y les deux
bots depuis le canal :

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ : il
devient `channelId`. Un canal public convient ; si vous utilisez un canal privé,
les deux applications disposent déjà de `groups:history`, de sorte que les lectures d’historique du harnais
réussiront quand même.

**4. Enregistrer les identifiants**

Deux options sont possibles. Utilisez des variables d’environnement pour le débogage sur une seule machine (définissez les quatre
variables `OPENCLAW_QA_SLACK_*` et transmettez `--credential-source env`), ou initialisez
le pool Convex partagé afin que la CI et les autres mainteneurs puissent les louer.

Pour le pool Convex, écrivez les quatre champs dans un fichier JSON :

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Une fois `OPENCLAW_QA_CONVEX_SITE_URL` et `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
exportés dans votre shell, enregistrez et vérifiez :

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Initialisation du pool QA Slack"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Attendez-vous à `count: 1`, `status: "active"`, sans champ `lease`.

**5. Vérifier de bout en bout**

Exécutez la voie localement pour confirmer que les deux bots peuvent communiquer entre eux par l’intermédiaire du
courtier :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution réussie se termine largement en moins de 30 secondes et `qa-suite-report.md`
affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si la
voie reste bloquée pendant environ 90 secondes et se termine avec `Convex credential pool exhausted
for kind "slack"`, soit le pool est vide, soit toutes les lignes sont louées ; `qa
credentials list --kind slack --status all --json` indiquera lequel de ces cas s’applique.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Cible deux comptes WhatsApp Web dédiés : un compte pilote contrôlé par
le harnais et un compte SUT démarré par le Gateway OpenClaw enfant via
le plugin WhatsApp intégré.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Facultatif :

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` active les scénarios de groupe tels que
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, les scénarios d’action, de média et de sondage de groupe,
  ainsi que `whatsapp-group-allowlist-block`.

Scénarios YAML WhatsApp (`qa/scenarios/channels/whatsapp-*.yaml`) :

- Référence et filtrage des groupes : `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Commandes natives : `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportement des réponses et de la sortie finale : `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Actions sur les messages du parcours utilisateur : `whatsapp-agent-message-action-react` démarre
  depuis un véritable message privé du pilote, permet au modèle d’appeler l’outil `message`, puis
  observe la réaction WhatsApp native. `whatsapp-agent-message-action-upload-file`
  adopte la même approche pour `message(action=upload-file)` et observe
  un média WhatsApp natif. `whatsapp-group-agent-message-action-react` et
  `whatsapp-group-agent-message-action-upload-file` prouvent les mêmes
  actions visibles par l’utilisateur dans un véritable groupe WhatsApp.
- Diffusion de groupe : `whatsapp-broadcast-group-fanout` démarre à partir d’un message de groupe
  WhatsApp contenant une mention et vérifie les réponses visibles distinctes de `main`
  et `qa-second`.
- Activation de groupe : `whatsapp-group-activation-always` fait passer une véritable session de groupe
  à `/activation always`, prouve qu’un message de groupe sans mention réveille
  l’agent, puis rétablit `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` initialise une réponse de bot, lui envoie une réponse
  native avec citation sans mention explicite et vérifie que l’agent
  se réveille grâce au contexte de cette réponse.
- Médias entrants et messages structurés : `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Ceux-ci envoient par l’intermédiaire du pilote de véritables événements WhatsApp d’image, d’audio, de document, de localisation, de contact,
  d’autocollant et de réaction.
- Sondes directes du contrat du Gateway : `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Elles contournent volontairement les invites du modèle
  et prouvent les contrats déterministes `send`, `poll` et
  `message.action` du Gateway et du canal.
- Couverture du contrôle d’accès : `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approbations natives : `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Réactions d’état : `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Le catalogue contient actuellement 52 scénarios. La voie par défaut `live-frontier`
reste limitée à 8 scénarios afin d’assurer une couverture de vérification rapide. La voie par défaut `mock-openai`
exécute 39 scénarios de manière déterministe via le véritable transport WhatsApp
en simulant uniquement la sortie du modèle ; les scénarios d’approbation et quelques
vérifications plus lourdes ou bloquantes restent explicitement sélectionnables par identifiant de scénario.

Le pilote QA WhatsApp observe des événements structurés en direct (`text`, `media`,
`location`, `reaction` et `poll`) et peut envoyer activement des médias, des sondages,
des contacts, des localisations et des autocollants. QA Lab importe ce pilote via la surface du
paquet `@openclaw/whatsapp/api.js` au lieu d’accéder aux fichiers privés
du runtime WhatsApp. Pour les observations de groupe, `fromJid` est le JID du groupe,
tandis que `participantJid` et `fromPhoneE164` identifient le participant expéditeur.
Le contenu des messages est masqué par défaut. Les sondes directes du Gateway portant sur les sondages, l’envoi de fichiers,
les médias, les sondages de groupe, les médias de groupe et la forme des réponses sont des vérifications de contrat
de transport ou d’API ; elles ne sont pas considérées comme la preuve qu’une invite utilisateur a amené
l’agent à choisir la même action. La preuve d’action du parcours utilisateur provient de scénarios
tels que `whatsapp-agent-message-action-react` et
`whatsapp-group-agent-message-action-react`, dans lesquels le pilote envoie un message
WhatsApp normal et QA Lab observe l’artefact WhatsApp natif obtenu.
Les détails des scénarios WhatsApp incluent la posture de chaque scénario (`user-path`,
`direct-gateway` ou `native-approval`) afin que les preuves ne puissent pas être confondues avec un
contrat plus fort que celui qu’elles établissent réellement.

Artefacts de sortie :

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` — entrées de preuve pour les vérifications du transport en direct.

### Pool d’identifiants Convex

Les voies Discord, Slack, Telegram et WhatsApp peuvent louer des identifiants depuis un
pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Transmettez
`--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ;
QA Lab acquiert un bail exclusif, lui envoie des Heartbeat pendant toute la durée de
l’exécution et le libère à l’arrêt. Les types du pool sont `"discord"`, `"slack"`,
`"telegram"` et `"whatsapp"`.

Formes de charge utile validées par le courtier lors de `admin/add` :

- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` doit être une chaîne d’identifiant de discussion numérique.
- Utilisateur réel Telegram (`kind: "telegram-user"`) : `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  uniquement pour la preuve Mantis avec Telegram Desktop. Les voies génériques de QA Lab ne doivent pas acquérir
  ce type.
- WhatsApp (`kind: "whatsapp"`) : `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — les numéros de téléphone doivent être des chaînes E.164 distinctes.

Le workflow de preuve Mantis avec Telegram Desktop conserve un bail Convex exclusif
`telegram-user` à la fois pour le pilote CLI TDLib et le témoin Telegram Desktop,
puis le libère après la publication de la preuve.

Lorsqu’une PR nécessite une comparaison visuelle déterministe, Mantis peut utiliser la même réponse
du modèle simulé sur `main` et sur la tête de la PR pendant que le formateur Telegram ou
la couche de livraison change. Les valeurs par défaut de capture sont ajustées pour les commentaires de PR : classe
Crabbox standard, enregistrement du bureau à 24 i/s, GIF animé à 24 i/s et largeur d’aperçu
de 1920 px. Les commentaires avant/après doivent publier un paquet propre qui contient
uniquement les GIF prévus.

Les voies Slack peuvent également utiliser le pool. Les vérifications de forme de la charge utile Slack se trouvent actuellement
dans l’exécuteur QA Slack plutôt que dans le courtier ; utilisez `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, avec un
identifiant de canal Slack tel que `Cxxxxxxxxxx`. Consultez
[Configurer l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement des applications
et des portées.

Les variables d’environnement opérationnelles et le contrat du point de terminaison du courtier Convex se trouvent dans
[Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1)
(le nom de la section est antérieur au pool multicanal ; la sémantique des baux est
commune à tous les types).

## Données d’initialisation stockées dans le dépôt

Les ressources d’initialisation se trouvent dans `qa/` :

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Elles sont volontairement conservées dans git afin que le plan QA soit visible à la fois par les humains et
par l’agent.

`qa-lab` reste un exécuteur générique de scénarios YAML. Chaque fichier YAML de scénario constitue la
source de vérité d’une exécution de test et doit définir :

- `title` au niveau supérieur
- métadonnées `scenario`
- métadonnées facultatives de catégorie, de capacité, de voie et de risque dans `scenario`
- références à la documentation et au code dans `scenario`
- exigences facultatives relatives aux plugins dans `scenario`
- correctif facultatif de configuration du Gateway dans `scenario`
- `flow` exécutable au niveau supérieur pour les scénarios de flux, ou
  `scenario.execution.kind` / `scenario.execution.path` pour les scénarios Vitest et
  Playwright

La surface d’exécution réutilisable sur laquelle repose `flow` reste générique et
transversale. Par exemple, les scénarios YAML peuvent combiner des assistants côté transport
avec des assistants côté navigateur qui pilotent l’interface de contrôle intégrée via
la jonction `browser.request` du Gateway, sans ajouter d’exécuteur spécifique.

Les fichiers de scénario doivent être regroupés par capacité du produit plutôt que par dossier
de l’arborescence source. Conservez des identifiants de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et
`codeRefs` pour la traçabilité de l’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- les messages privés et les discussions de canal
- le comportement des fils de discussion
- le cycle de vie des actions sur les messages
- les rappels Cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de compilation telle que Lobster Invaders

## Voies de simulation des fournisseurs

`qa suite` comporte deux voies locales de simulation des fournisseurs :

- `mock-openai` est la simulation OpenClaw sensible aux scénarios. Elle reste la voie
  de simulation déterministe par défaut pour l’assurance qualité fondée sur le dépôt et les contrôles de parité.
- `aimock` démarre un serveur de fournisseur fondé sur AIMock pour une couverture expérimentale
  des protocoles, des jeux de données, de l’enregistrement/relecture et du chaos. Cette voie est complémentaire et
  ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration du modèle du Gateway,
ses besoins de préparation des profils d’authentification et ses indicateurs de capacités réelles/simulées. Le code partagé de la suite et
du Gateway passe par le registre des fournisseurs au lieu d’effectuer des branchements sur
leurs noms.

## Adaptateurs de transport

`qa-lab` fournit une jonction de transport générique pour les scénarios d’assurance qualité YAML. `qa-channel` est
la valeur synthétique par défaut. `crabline` démarre des serveurs locaux reproduisant la forme des fournisseurs et
exécute les plugins de canal normaux d’OpenClaw sur ceux-ci. `live` est réservé aux
identifiants réels des fournisseurs et aux canaux externes.

Au niveau de l’architecture, la répartition est la suivante :

- `qa-lab` gère l’exécution générique des scénarios, la concurrence des workers, l’écriture
  des artefacts et la production des rapports.
- L’adaptateur de transport gère la configuration du Gateway, l’état de préparation, l’observation
  des entrées et des sorties, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario YAML sous `qa/scenarios/` définissent l’exécution du test ; `qa-lab`
  fournit la surface d’exécution réutilisable qui les exécute.

### Ajout d’un canal

L’ajout d’un canal au système d’assurance qualité YAML nécessite l’implémentation du canal,
ainsi qu’un ensemble de scénarios qui exerce son contrat. Pour une couverture CI
de test rapide, ajoutez le serveur de fournisseur local Crabline correspondant et exposez-le
par l’intermédiaire du pilote `crabline`.

N’ajoutez pas de nouvelle racine de commande d’assurance qualité de premier niveau lorsque l’hôte partagé `qa-lab` peut
prendre en charge le flux.

`qa-lab` gère les mécanismes de l’hôte partagé :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération des rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins d’exécution gèrent le contrat de transport :

- la manière dont `openclaw qa <runner>` est monté sous la racine partagée `qa`
- la manière dont le Gateway est configuré pour ce transport
- la manière dont l’état de préparation est vérifié
- la manière dont les événements entrants sont injectés
- la manière dont les messages sortants sont observés
- la manière dont les transcriptions et l’état de transport normalisé sont exposés
- la manière dont les actions adossées au transport sont exécutées
- la manière dont la réinitialisation ou le nettoyage propre au transport est effectué

Les exigences minimales pour l’adoption d’un nouveau canal sont les suivantes :

1. Conservez `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémentez l’exécuteur de transport sur la jonction d’hôte partagée `qa-lab`.
3. Conservez les mécanismes propres au transport dans le plugin d’exécution ou le
   harnais du canal.
4. Montez l’exécuteur en tant que `openclaw qa <runner>` au lieu d’enregistrer une
   commande racine concurrente. Les plugins d’exécution doivent déclarer `qaRunners` dans
   `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations`
   correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI différée et
   l’exécution de l’exécuteur doivent rester derrière des points d’entrée distincts. Un
   `adapterFactory` facultatif expose le transport aux scénarios partagés sans modifier
   le catalogue de scénarios existant de la commande.
5. Créez ou adaptez les scénarios YAML dans les répertoires thématiques `qa/scenarios/`.
6. Utilisez les assistants de scénario génériques pour les nouveaux scénarios.
7. Maintenez le fonctionnement des alias de compatibilité existants, sauf si le dépôt effectue une
   migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend du transport d’un seul canal, conservez-le dans ce plugin
  d’exécution ou ce harnais de plugin.
- Si un scénario nécessite une nouvelle capacité utilisable par plusieurs canaux,
  ajoutez un assistant générique au lieu d’une branche propre à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, conservez le scénario
  propre à ce transport et rendez-le explicite dans le contrat du scénario.

### Noms des assistants de scénario

Assistants génériques privilégiés pour les nouveaux scénarios :

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Les alias de compatibilité restent disponibles pour les scénarios existants —
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` — mais la création de nouveaux scénarios
doit utiliser les noms génériques. Les alias existent pour éviter une
migration simultanée, et non comme modèle à suivre à l’avenir.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre aux questions suivantes :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il serait utile d’ajouter

Pour obtenir l’inventaire des scénarios disponibles — utile pour évaluer l’ampleur du travail de suivi
ou connecter un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json`
pour une sortie lisible par machine). Pour choisir une preuve ciblée pour un
comportement ou un chemin de fichier modifié, exécutez `pnpm openclaw qa coverage --match <query>`. Le
rapport de correspondance recherche dans les métadonnées des scénarios, les références de documentation, les références de code, les identifiants de couverture,
les plugins et les exigences des fournisseurs, puis affiche les cibles `qa suite
--scenario ...` correspondantes.

Chaque exécution de `qa suite` écrit les artefacts de premier niveau `qa-evidence.json`,
`qa-suite-summary.json` et `qa-suite-report.md` pour l’ensemble de
scénarios sélectionné. Les scénarios qui déclarent `execution.kind: vitest` ou
`execution.kind: playwright` exécutent le chemin de test correspondant et écrivent également
des journaux propres à chaque scénario. Les scénarios qui déclarent `execution.kind: script` exécutent le
producteur de preuves situé à `execution.path` via `node --import tsx` (avec
`${outputDir}` et `${scenarioId}` développés dans `execution.args`) ; le
producteur écrit son propre `qa-evidence.json`, dont les entrées sont importées dans
la sortie de la suite et dont les chemins d’artefacts sont résolus relativement au
`qa-evidence.json` de ce producteur. Lorsque `qa suite` est atteint via `qa run
--qa-profile`, le même `qa-evidence.json` inclut également le résumé de la
fiche d’évaluation du profil pour les catégories de taxonomie sélectionnées.

Considérez la sortie de couverture comme une aide à la découverte, et non comme un substitut aux contrôles ; le
scénario sélectionné nécessite toujours le mode de fournisseur, le transport réel,
Multipass, Testbox ou la voie de publication appropriés au comportement testé. Pour
le contexte de la fiche d’évaluation, consultez [Fiche d’évaluation de maturité](/fr/maturity/scorecard).

Pour les vérifications de personnalité et de style, exécutez le même scénario avec plusieurs références de
modèles réels et rédigez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants locaux du Gateway d’assurance qualité, et non Docker. Les scénarios
d’évaluation de personnalité doivent définir le persona au moyen de `SOUL.md`, puis exécuter des interactions
utilisateur ordinaires telles qu’une discussion, une aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle
candidat ne doit pas être informé qu’il est évalué. La commande conserve
chaque transcription complète, enregistre les statistiques d’exécution de base, puis demande aux modèles juges, en
mode rapide et avec un raisonnement `xhigh` lorsque cela est pris en charge, de classer les exécutions selon
leur naturel, leur ton et leur humour. Utilisez `--blind-judge-models` lors de la comparaison
de fournisseurs : l’invite du juge reçoit toujours toutes les transcriptions et tous les états d’exécution, mais
les références candidates sont remplacées par des libellés neutres tels que `candidate-01` ; le
rapport réassocie les classements aux références réelles après l’analyse.

Les exécutions candidates utilisent par défaut un niveau de réflexion `high`, avec `medium` pour GPT-5.6 Luna et
`xhigh` pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez cette valeur pour un
candidat précis directement avec `--model provider/model,thinking=<level>` ; les options
en ligne prennent également en charge `fast`, `no-fast` et `fast=<bool>`. `--thinking
<level>` définit toujours une valeur de repli globale, et l’ancienne forme `--model-thinking
<provider/model=level>` est conservée pour des raisons de compatibilité. Les références candidates OpenAI
utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque le fournisseur
le prend en charge. Ne transmettez `--fast` que lorsque vous souhaitez imposer le mode rapide à
tous les modèles candidats. Les durées des candidats et des juges sont consignées dans le
rapport pour l’analyse comparative, mais les invites des juges indiquent explicitement de ne pas classer
selon la vitesse. Les exécutions des modèles candidats et juges utilisent toutes deux une concurrence de 16 par défaut.
Réduisez `--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la charge
du Gateway local rendent une exécution trop bruitée.

Lorsqu’aucun `--model` candidat n’est transmis, l’évaluation de personnalité utilise par défaut
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et `google/gemini-3.1-pro-preview`. Lorsqu’aucun
`--judge-model` n’est transmis, les juges par défaut sont
`openai/gpt-5.6-sol,thinking=xhigh,fast` et
`anthropic/claude-opus-4-8,thinking=high`.

## Documentation associée

- [Fiche d’évaluation de maturité](/fr/maturity/scorecard)
- [Ensemble de benchmarks pour agent personnel](/fr/concepts/personal-agent-benchmark-pack)
- [Canal d’assurance qualité](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)
