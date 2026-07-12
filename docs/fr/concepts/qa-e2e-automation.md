---
read_when:
    - Comprendre comment les composants de la pile d’assurance qualité s’articulent entre eux
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios d’assurance qualité basés sur le dépôt
    - Création d’une automatisation QA plus réaliste autour du tableau de bord du Gateway
summary: 'Présentation de la pile d’assurance qualité : qa-lab, qa-channel, scénarios adossés au dépôt, parcours de transport en conditions réelles, adaptateurs de transport et rapports.'
title: Vue d’ensemble de l’assurance qualité
x-i18n:
    generated_at: "2026-07-12T21:38:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f82422737f5151bb971e93f830e3e7139c6f60887a33206d5d44259e4f5e51e7
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile d’assurance qualité privée teste OpenClaw de manière réaliste, selon une structure proche de celle des canaux, ce qu’un test unitaire ne peut pas faire.

Éléments :

- `extensions/qa-channel` : canal de messages synthétique avec des surfaces de messages privés, de canaux, de fils de discussion, de réactions, de modification et de suppression.
- `extensions/qa-lab` : interface utilisateur de débogage et bus d’assurance qualité permettant d’observer la transcription, d’injecter des messages entrants et d’exporter un rapport Markdown.
- `extensions/qa-matrix` : adaptateur de transport en conditions réelles qui pilote le Plugin Matrix réel dans un Gateway d’assurance qualité enfant.
- `qa/` : ressources initiales adossées au dépôt pour la tâche de lancement et les scénarios d’assurance qualité de référence.
- [Mantis](/fr/concepts/mantis) : vérification en conditions réelles avant/après pour les bogues qui nécessitent de vrais transports, des captures d’écran du navigateur, l’état de la machine virtuelle et des preuves pour la PR.

## Surface de commandes

Chaque flux d’assurance qualité s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup disposent d’alias de scripts `pnpm qa:*` ; les deux formes fonctionnent.

| Commande                                            | Objectif                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification d’assurance qualité intégrée sans `--qa-profile` ; exécuteur de profils de maturité fondés sur la taxonomie avec `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                                                       |
| `qa suite`                                          | Exécute les scénarios adossés au dépôt sur la voie du Gateway d’assurance qualité. `--runner multipass` utilise une machine virtuelle Linux jetable au lieu de l’hôte.                                                                                                                                                         |
| `qa coverage`                                       | Affiche l’inventaire YAML de couverture des scénarios (`--json` pour une sortie exploitable par une machine ; `--match <query>` pour trouver les scénarios correspondant à un comportement modifié ; `--tools` pour la couverture des fixtures d’outils d’exécution).                                                            |
| `qa parity-report`                                  | Compare deux fichiers `qa-suite-summary.json` pour établir une barrière de parité sur l’axe des modèles, ou utilise `--runtime-axis --token-efficiency` pour générer des rapports de parité d’exécution et d’efficacité des jetons entre Codex et OpenClaw.                                                                       |
| `qa confidence-report`                              | Classe les artefacts de preuve d’assurance qualité par rapport à un manifeste afin de produire un rapport de confiance ne comportant aucune inconnue.                                                                                                                                                                         |
| `qa confidence-self-test`                           | Génère des sentinelles de contrôle négatif prédéfinies qui démontrent que la barrière de confiance détecte les dérives.                                                                                                                                                                                                       |
| `qa jsonl-replay`                                   | Rejoue des transcriptions JSONL sélectionnées au moyen du banc de rejeu de parité d’exécution.                                                                                                                                                                                                                                |
| `qa character-eval`                                 | Exécute le scénario d’assurance qualité du personnage sur plusieurs modèles en conditions réelles avec un rapport évalué. Voir [Rapports](#reporting).                                                                                                                                                                        |
| `qa manual`                                         | Exécute une invite ponctuelle sur la voie du fournisseur/modèle sélectionné.                                                                                                                                                                                                                                                  |
| `qa ui`                                             | Démarre l’interface utilisateur de débogage d’assurance qualité et le bus d’assurance qualité local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                               |
| `qa docker-build-image`                             | Construit l’image Docker d’assurance qualité préconstruite.                                                                                                                                                                                                                                                                   |
| `qa docker-scaffold`                                | Génère une structure docker-compose pour le tableau de bord d’assurance qualité et la voie du Gateway.                                                                                                                                                                                                                        |
| `qa up`                                             | Construit le site d’assurance qualité, démarre la pile adossée à Docker et affiche l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                                          |
| `qa aimock`                                         | Démarre uniquement le serveur du fournisseur AIMock.                                                                                                                                                                                                                                                                          |
| `qa mock-openai`                                    | Démarre uniquement le serveur du fournisseur `mock-openai`, qui tient compte des scénarios.                                                                                                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | Gère le pool partagé d’identifiants Convex.                                                                                                                                                                                                                                                                                    |
| `qa discord`                                        | Voie de transport en conditions réelles sur un canal de serveur Discord privé réel.                                                                                                                                                                                                                                           |
| `qa matrix`                                         | Voie de transport en conditions réelles sur un serveur d’origine Tuwunel jetable. Voir [Assurance qualité Matrix](/fr/concepts/qa-matrix).                                                                                                                                                                                        |
| `qa slack`                                          | Voie de transport en conditions réelles sur un canal Slack privé réel.                                                                                                                                                                                                                                                        |
| `qa telegram`                                       | Voie de transport en conditions réelles sur un groupe Telegram privé réel.                                                                                                                                                                                                                                                    |
| `qa whatsapp`                                       | Voie de transport en conditions réelles sur de vrais comptes WhatsApp Web.                                                                                                                                                                                                                                                    |
| `qa mantis`                                         | Exécuteur de vérification avant/après pour les bogues de transport en conditions réelles, avec des preuves de réactions d’état Discord, des tests de fumée du bureau/navigateur Crabbox et des tests de fumée Slack dans VNC. Voir [Mantis](/fr/concepts/mantis) et [Guide d’exploitation de Mantis pour Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook). |

`qa matrix` est enregistré en tant que Plugin d’exécution (`extensions/qa-matrix`) ; chaque
autre voie ci-dessus est directement intégrée à `qa-lab`.

### `qa run` basé sur un profil

`qa run` basé sur un profil lit l’appartenance dans `taxonomy.yaml`, puis distribue
les scénarios résolus via `qa suite`. `--surface` et `--category` filtrent
le profil sélectionné au lieu de définir des voies distinctes. Le fichier
`qa-evidence.json` obtenu comprend un résumé de la fiche d’évaluation du profil avec le nombre
de catégories sélectionnées et les ID de couverture manquants ; les entrées de preuve individuelles restent la
source de vérité pour les tests, les rôles de couverture et les résultats. Les ID de
couverture des fonctionnalités de la taxonomie sont des cibles de preuve exactes, et non des alias : la couverture du scénario principal
satisfait les ID correspondants, tandis que la couverture secondaire reste indicative. Les ID de couverture utilisent
la forme pointée `namespace.behavior` avec des segments alphanumériques en minuscules pouvant contenir des tirets ;
les ID de profil, de surface et de catégorie peuvent toujours utiliser les ID de taxonomie
existants avec tirets ou points.

Les preuves allégées omettent le champ `execution` de chaque entrée et définissent `evidenceMode: "slim"` ;
`smoke-ci` utilise le mode allégé par défaut, et `--evidence-mode full` rétablit les entrées complètes :

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Utilisez `smoke-ci` pour obtenir une preuve de profil déterministe avec des fournisseurs de modèles simulés et
des serveurs de fournisseurs locaux Crabline. Utilisez `release` pour la preuve Stable/LTS avec des
canaux en production. Utilisez `all` uniquement pour les exécutions explicites de preuve couvrant toute la taxonomie ; il
sélectionne chaque catégorie de maturité active et peut être distribué via le workflow GitHub Actions `QA
Profile Evidence` avec `qa_profile=all`. Lorsqu’une
commande nécessite également un profil racine OpenClaw, placez le profil racine avant la
commande QA :

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flux opérateur

Le flux opérateur actuel de QA est un site QA à deux volets :

- À gauche : tableau de bord du Gateway (interface de contrôle) avec l’agent.
- À droite : QA Lab, affichant la transcription de type Slack et le plan du scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cette commande construit le site QA, démarre le flux Gateway reposant sur Docker et expose
la page QA Lab, où un opérateur ou une boucle d’automatisation peut confier à l’agent une
mission de QA, observer le comportement réel du canal et consigner ce qui a fonctionné,
échoué ou est resté bloqué.

Pour itérer plus rapidement sur l’interface de QA Lab sans reconstruire l’image Docker à
chaque fois, démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` maintient les services Docker sur une image préconstruite et
monte par liaison `extensions/qa-lab/web/dist` dans le conteneur `qa-lab`.
`qa:lab:watch` reconstruit ce bundle lors des modifications, et le navigateur se recharge
automatiquement lorsque le hachage des ressources de QA Lab change.

### Tests rapides d’observabilité

<Note>
La QA d’observabilité reste réservée à une copie de travail du code source. L’archive npm
omet intentionnellement QA Lab (ainsi que `qa-channel`/`qa-matrix`) ; les flux de publication
Docker des paquets n’exécutent donc pas les commandes `qa`. Exécutez-les depuis une copie
de travail du code source compilée lorsque vous modifiez l’instrumentation des diagnostics.
</Note>

| Alias                                   | Ce qu’il exécute                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Récepteur OpenTelemetry local avec le scénario `otel-trace-smoke` et `diagnostics-otel` activé.                                                     |
| `pnpm qa:otel:collector-smoke`          | Même voie derrière un véritable conteneur Docker OpenTelemetry Collector. Utilisez-la lorsque vous modifiez le câblage des points de terminaison ou la compatibilité avec le collecteur/OTLP. |
| `pnpm qa:prometheus:smoke`              | Le scénario `docker-prometheus-smoke` avec `diagnostics-prometheus` activé.                                                                         |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` suivi de `qa:prometheus:smoke`.                                                                                                     |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` suivi de `qa:prometheus:smoke`.                                                                                           |

`qa:otel:smoke` démarre un récepteur OTLP/HTTP local, exécute un tour d’agent
minimal sur le canal d’assurance qualité, puis vérifie que les traces, métriques et journaux sont exportés. Il décode
les segments de trace protobuf exportés et vérifie leur structure critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, un segment d’appel de modèle conforme à la dernière convention sémantique GenAI,
`openclaw.context.assembled` et `openclaw.message.delivery`
doivent tous être présents. Le test rapide impose
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` ; le segment d’appel
de modèle doit donc utiliser le nom `{gen_ai.operation.name} {gen_ai.request.model}` ; les appels de
modèle ne doivent pas exporter `StreamAbandoned` lors des tours réussis ; les identifiants de diagnostic
bruts et les attributs `openclaw.content.*` doivent rester hors de la trace. L’invite du scénario
demande au modèle de répondre avec un marqueur fixe et de ne pas divulguer une chaîne
secrète fixe ; les charges utiles OTLP brutes ne doivent contenir ni l’un ni l’autre, ni la clé de
session d’assurance qualité dérivée de l’identifiant du scénario. Il écrit `otel-smoke-summary.json`
à côté des artefacts de la suite d’assurance qualité.

`qa:prometheus:smoke` vérifie que les extractions non authentifiées sont rejetées, puis
vérifie que l’extraction authentifiée inclut les familles de métriques critiques pour la publication,
sans contenu d’invite, contenu de réponse, identifiants de diagnostic bruts, jetons
d’authentification ni chemins locaux.

### Voies de test rapide Matrix

Pour une voie de test rapide Matrix utilisant un transport réel et ne nécessitant pas d’identifiants
de fournisseur de modèles, exécutez le profil rapide avec le faux fournisseur OpenAI déterministe :

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Pour la voie du fournisseur de pointe en direct, fournissez explicitement des identifiants
compatibles avec OpenAI :

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La référence complète de la CLI, le catalogue des profils/scénarios, les variables d’environnement et la disposition
des artefacts pour cette voie se trouvent dans [Assurance qualité Matrix](/fr/concepts/qa-matrix). En bref, elle
provisionne un serveur domestique Tuwunel jetable dans Docker, inscrit des utilisateurs temporaires
de pilote/SUT/observateur, exécute le véritable Plugin Matrix dans un Gateway
d’assurance qualité enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown,
un résumé JSON, un artefact des événements observés et un journal de sortie combiné sous
`.artifacts/qa-e2e/matrix-<timestamp>/`.

Les scénarios couvrent des comportements de transport que les tests unitaires ne peuvent pas prouver de bout en
bout : filtrage des mentions, politiques d’autorisation des robots, listes d’autorisation, réponses de premier niveau et dans les fils
de discussion, routage des messages privés, gestion des réactions, suppression des modifications entrantes, déduplication
des répétitions après redémarrage, récupération après interruption du serveur domestique, livraison des métadonnées d’approbation,
gestion des médias et flux d’amorçage, de récupération et de vérification du chiffrement de bout en bout Matrix. Le
profil CLI de chiffrement de bout en bout exécute également `openclaw matrix encryption setup` et les
commandes de vérification via le même serveur domestique jetable avant de vérifier
les réponses du Gateway.

L’intégration continue utilise la même interface de commande dans
`.github/workflows/qa-live-transports-convex.yml`. Les exécutions planifiées et manuelles
par défaut exécutent le profil Matrix rapide avec les identifiants de fournisseur de pointe en direct
fournis par l’assurance qualité, `--fast` et `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`.
L’option manuelle `matrix_profile=all` se répartit en cinq fragments de profil : `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

### Scénarios Discord Mantis

Discord dispose également de scénarios Mantis facultatifs réservés à la reproduction de bogues. Utilisez
`--scenario discord-status-reactions-tool-only` pour la chronologie explicite des réactions
d’état, ou `--scenario discord-thread-reply-filepath-attachment`
pour créer un véritable fil de discussion Discord et vérifier que `message.thread-reply`
préserve une pièce jointe `filePath`. Ces scénarios restent en dehors de la voie Discord
en direct par défaut, car ce sont des sondes de reproduction avant/après plutôt qu’une
couverture étendue de test rapide. Le flux de travail Mantis des pièces jointes aux fils de discussion peut également ajouter une
vidéo témoin de Discord Web avec une session ouverte lorsque
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est configuré dans l’environnement
d’assurance qualité. Ce profil de visualisation sert uniquement à la capture visuelle ; la décision de
réussite ou d’échec provient toujours de l’oracle REST de Discord.

Pour les voies de test rapide utilisant les transports réels Discord, Slack, Telegram et WhatsApp :

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Elles ciblent un canal réel préexistant avec deux robots ou comptes (pilote +
SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool
d’identifiants Convex sont documentés dans la
[référence d’assurance qualité pour Discord, Slack, Telegram et WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
ci-dessous.

### Exécuteurs de bureau Slack et de tâches visuelles Mantis

Pour une exécution complète de Slack sur une VM de bureau avec récupération par VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande réserve une machine Crabbox avec environnement de bureau et navigateur, exécute le scénario Slack en conditions réelles dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et copie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4` (lorsque la capture vidéo est disponible) dans le répertoire d’artefacts Mantis. Les réservations Crabbox avec environnement de bureau et navigateur fournissent d’emblée les outils de capture ainsi que les paquets auxiliaires pour le navigateur et la compilation native ; le scénario ne devrait donc installer des solutions de repli que sur les réservations plus anciennes. Mantis consigne les durées totales et par phase dans `mantis-slack-desktop-smoke-report.md`, afin que les exécutions lentes indiquent si le temps a été consacré au préchauffage de la réservation, à l’acquisition des identifiants, à la configuration distante ou à la copie des artefacts. Réutilisez `--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web via VNC ; les réservations réutilisées conservent également le cache du magasin pnpm de Crabbox préchauffé. Le mode par défaut `--hydrate-mode source` effectue la vérification depuis un checkout des sources et exécute l’installation et la compilation dans la VM. Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé contient déjà `node_modules` et un répertoire `dist/` compilé ; ce mode ignore l’étape coûteuse d’installation et de compilation et échoue de manière sécurisée lorsque l’espace de travail n’est pas prêt. Avec `--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant s’exécuter dans la VM sur le port `38973` ; sans cette option, la commande exécute le scénario QA Slack standard de bot à bot et se termine après la capture des artefacts.

Pour démontrer l’interface d’approbation Slack native avec des preuves issues du bureau, exécutez le mode de points de contrôle d’approbation de Mantis :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ce mode est mutuellement exclusif avec `--gateway-setup`. Il exécute les scénarios d’approbation Slack, rejette les identifiants de scénarios qui ne concernent pas l’approbation, attend chaque état d’approbation en attente et résolu, restitue le message observé de l’API Slack dans `approval-checkpoints/<scenario>-pending.png` et `approval-checkpoints/<scenario>-resolved.png`, puis échoue si un point de contrôle, une preuve de message, un accusé de réception ou une capture d’écran restituée est manquant ou vide. Les réservations CI à froid peuvent encore afficher la connexion à Slack dans `slack-desktop-smoke.png` ; les images des points de contrôle d’approbation constituent la preuve visuelle pour ce scénario.

L’exécution par défaut des points de contrôle conserve les deux scénarios d’approbation Slack standard. Pour capturer l’une des routes d’approbation Codex optionnelles, sélectionnez-la explicitement avec `--scenario slack-codex-approval-exec-native` ou `--scenario slack-codex-approval-plugin-native` ; Mantis accepte les deux et génère la même paire de captures d’écran des états en attente et résolu. Le programme d’exécution augmente les délais de ses points de contrôle et de ses commandes distantes pour chaque route Codex sélectionnée, afin que la séquence complète d’approbation, d’achèvement de l’agent et de mise à jour de l’état résolu puisse se terminer.

La liste de contrôle de l’opérateur, la commande de déclenchement du workflow GitHub, le contrat relatif aux commentaires de preuve, le tableau de décision du mode d’hydratation, l’interprétation des durées et les étapes de gestion des échecs sont disponibles dans le [guide d’exploitation du bureau Slack avec Mantis](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche de bureau de type agent/vision par ordinateur, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` loue ou réutilise une machine de bureau avec navigateur Crabbox, lance
`crabbox record --while`, pilote le navigateur visible au moyen d’un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image
describe` sur la capture d’écran lorsque `--vision-mode image-describe` est
sélectionné, et écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et
`mantis-visual-task-report.md`. Lorsque `--expect-text` est défini, le prompt
de vision demande un verdict JSON structuré (`visible`, `evidence`, `reason`)
et ne réussit que si le modèle indique `visible: true` avec des preuves qui
citent le texte attendu ; une réponse `visible: false` qui se contente de citer le
texte cible échoue tout de même à l’assertion. Utilisez `--vision-mode metadata` pour un
test de bon fonctionnement sans modèle qui valide le bureau, le navigateur, la capture d’écran et
la chaîne de traitement vidéo sans appeler de fournisseur de compréhension d’images. L’enregistrement est un
artefact obligatoire pour `visual-task` ; si Crabbox n’enregistre aucun fichier
`visual-task.mp4` non vide, la tâche échoue même si le pilote visuel a réussi. En cas
d’échec, Mantis conserve la location pour VNC, sauf si la tâche avait déjà réussi
et que `--keep-lease` n’était pas défini.

### Vérification de l’état du pool d’identifiants

Avant d’utiliser les identifiants actifs mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le diagnostic vérifie les variables d’environnement du courtier Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valide les paramètres des points de terminaison, indique
uniquement l’état défini/manquant de `OPENCLAW_QA_CONVEX_SECRET_CI` et
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, et vérifie l’accessibilité de l’administration et de la liste
lorsque le secret de maintenance est présent.

## Couverture des transports en conditions réelles

Les parcours de transport en conditions réelles partagent un contrat unique au lieu que chacun invente sa propre
structure de liste de scénarios. `qa-channel` est la suite synthétique étendue couvrant le comportement
du produit et ne fait pas partie de la matrice de couverture des transports en conditions réelles.

Les exécuteurs de transport en conditions réelles importent les identifiants de scénarios partagés, les assistants
de couverture de référence et l’assistant de sélection de scénarios depuis
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Voie     | Canary | Filtrage des mentions | Bot à bot | Blocage par liste d’autorisation | Réponse de premier niveau | Réponse avec citation | Reprise après redémarrage | Suivi du fil | Isolation du fil | Observation des réactions | Commande d’aide | Enregistrement des commandes natives |
| -------- | ------ | ---------------------- | --------- | -------------------------------- | ------------------------- | ---------------------- | ------------------------- | ------------ | ---------------- | -------------------------- | ---------------- | ------------------------------------- |
| Discord  | x      | x                      | x         |                                  |                           |                        |                           |              |                  |                            |                  | x                                     |
| Matrix   | x      | x                      | x         | x                                | x                         |                        | x                         | x            | x                | x                          |                  |                                       |
| Slack    | x      | x                      | x         | x                                | x                         |                        | x                         | x            | x                |                            |                  |                                       |
| Telegram | x      | x                      | x         |                                  |                           |                        |                           |              |                  |                            | x                |                                       |
| WhatsApp | x      | x                      |           | x                                | x                         | x                      | x                         |              |                  | x                          | x                |                                       |

Cela conserve `qa-channel` comme suite générale couvrant le comportement du produit, tandis que Matrix,
Telegram et les autres transports en direct partagent une liste de contrôle explicite unique
du contrat de transport.

Pour utiliser une voie de VM Linux jetable sans introduire Docker dans le parcours d’assurance qualité, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cette commande démarre un nouvel invité Multipass, installe les dépendances, compile OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport et le
résumé d’assurance qualité habituels dans `.artifacts/qa-e2e/...` sur l’hôte. Elle réutilise le même
comportement de sélection des scénarios que `qa suite` sur l’hôte.

Les exécutions des suites sur l’hôte et dans Multipass exécutent par défaut plusieurs scénarios sélectionnés
en parallèle avec des workers Gateway isolés. `qa-channel` utilise par défaut
une concurrence de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency
<count>` pour ajuster le nombre de workers, ou `--concurrency 1` pour une exécution séquentielle.
Utilisez `--pack personal-agent` pour exécuter le pack de benchmarks de l’assistant personnel (10
scénarios). Le sélecteur de pack s’ajoute aux indicateurs `--scenario` répétés :
les scénarios explicites sont exécutés en premier, puis ceux du pack dans leur ordre
avec suppression des doublons. Utilisez `--pack observability` pour sélectionner ensemble les scénarios
`otel-trace-smoke` et `docker-prometheus-smoke` lorsqu’un
exécuteur d’assurance qualité personnalisé fournit déjà la configuration du collecteur OpenTelemetry.

La commande se termine avec un code différent de zéro lorsqu’un scénario échoue. Utilisez `--allow-failures`
si vous souhaitez obtenir les artefacts sans code de sortie d’échec.

Les exécutions en direct transmettent les entrées d’authentification d’assurance qualité prises en charge qui sont utilisables dans
l’invité : les clés de fournisseur définies par des variables d’environnement, le chemin de configuration du fournisseur en direct d’assurance qualité et
`CODEX_HOME` lorsqu’il est présent. Conservez `--output-dir` sous la racine du dépôt afin que
l’invité puisse réécrire les résultats via l’espace de travail monté.

## Référence d’assurance qualité pour Discord, Slack, Telegram et WhatsApp

Matrix possède une [page dédiée](/fr/concepts/qa-matrix) en raison du nombre de ses scénarios
et du provisionnement de son serveur domestique reposant sur Docker. Discord, Slack, Telegram
et WhatsApp s’exécutent sur des transports réels préexistants ; leur documentation de référence
se trouve donc ici.

### Indicateurs CLI communs

Ces voies sont enregistrées au moyen de
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et
acceptent les mêmes indicateurs :

| Indicateur                            | Valeur par défaut                                  | Description                                                                                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Exécute uniquement ce scénario. Peut être répété.                                                                                                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Emplacement où sont écrits les rapports, résumés, preuves, artefacts propres au transport et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`.                            |
| `--repo-root <path>`                  | `process.cwd()`                                    | Racine du dépôt lors de l’appel depuis un répertoire de travail neutre.                                                                                                                                      |
| `--sut-account <id>`                  | `sut`                                              | Identifiant de compte temporaire dans la configuration du Gateway d’assurance qualité.                                                                                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` ou `live-frontier` (l’ancien `live-openai` fonctionne toujours).                                                                                                                               |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                   | Références du modèle principal et du modèle secondaire.                                                                                                                                                      |
| `--fast`                              | désactivé                                          | Mode rapide du fournisseur lorsqu’il est pris en charge.                                                                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | Consultez le [pool d’identifiants Convex](#convex-credential-pool).                                                                                                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` dans la CI, `maintainer` sinon                | Rôle utilisé lorsque `--credential-source convex`.                                                                                                                                                           |

Chaque voie se termine avec un code différent de zéro si un scénario échoue. `--allow-failures` écrit
les artefacts sans définir de code de sortie d’échec. Telegram accepte également
`--list-scenarios` pour afficher les identifiants des scénarios disponibles et quitter ; les autres voies
n’exposent pas cet indicateur.

### Assurance qualité de Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe Telegram privé réel avec deux bots distincts (pilote +
SUT). Le bot SUT doit disposer d’un nom d’utilisateur Telegram ; l’observation bot à bot fonctionne
mieux lorsque le mode **Bot-to-Bot Communication Mode** est activé pour les deux bots dans
`@BotFather`.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - identifiant numérique de la discussion (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Scénarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`) :

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
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

L’ensemble implicite par défaut couvre toujours Canary, le filtrage des mentions, les réponses aux commandes
natives, l’adressage des commandes et les réponses de groupe bot à bot. Les valeurs par défaut de `mock-openai`
incluent également des vérifications déterministes des chaînes de réponses et de la diffusion en continu du message final.
`telegram-current-session-status-tool` et
`telegram-tool-only-usage-footer` restent facultatifs : le premier n’est stable
que lorsqu’il est enchaîné directement après Canary, tandis que le second constitue une preuve sur Telegram réel
du pied de page `/usage` dans les réponses constituées uniquement d’appels d’outils. Utilisez `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` pour afficher la répartition actuelle
entre scénarios par défaut et facultatifs avec les références de régression.

Artefacts de sortie :

- `telegram-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct,
  notamment les champs de profil, de couverture, de fournisseur, de canal, d’artefacts, de résultat et de RTT.

Les exécutions Telegram du paquet utilisent le même contrat d’identifiants Telegram. La mesure répétée du RTT
fait partie de la voie Telegram en direct normale du paquet ; la distribution du RTT
est intégrée à `qa-evidence.json` sous `result.timing` pour la
vérification RTT sélectionnée.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Lorsque `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` est défini, le wrapper d’exécution en direct du paquet
loue un identifiant `kind: "telegram"`, exporte les variables d’environnement du groupe, du pilote et du bot SUT
loués dans l’exécution du paquet installé, envoie le Heartbeat du bail et le libère
à l’arrêt. Le wrapper du paquet utilise par défaut 20 vérifications RTT de
`telegram-mentioned-message-reply`, un délai d’expiration RTT de 30s et le rôle Convex
`maintainer` hors CI lorsque Convex est sélectionné. Remplacez les valeurs de
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster la mesure du RTT sans
créer de commande RTT distincte ni de format de résumé propre à Telegram.

### Assurance qualité de Discord

```bash
pnpm openclaw qa discord
```

Cible un canal de serveur Discord privé réel avec deux bots : un bot pilote
contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant
au moyen du Plugin Discord intégré. Vérifie la gestion des mentions dans le canal, que
le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que
les scénarios de preuve Mantis facultatifs.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’identifiant utilisateur du bot SUT
  renvoyé par Discord (sinon, la voie échoue immédiatement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve le corps des messages dans
  les artefacts des messages observés.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` sélectionne le canal vocal/de scène pour
  `discord-voice-autojoin` ; sans cette variable, le scénario sélectionne le premier canal
  vocal/de scène visible par le bot SUT.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scénario vocal facultatif. S’exécute seul, active
  `channels.discord.voice.autoJoin` et vérifie que l’état vocal Discord actuel du bot SUT
  correspond au canal vocal/de scène cible. Les identifiants Discord Convex
  peuvent inclure un `voiceChannelId` facultatif ; sinon, l’exécuteur
  découvre le premier canal vocal/de scène visible dans le serveur.
- `discord-status-reactions-tool-only` - scénario Mantis facultatif. S’exécute
  seul, car il configure le SUT pour répondre en permanence dans le serveur uniquement par des appels d’outils,
  avec `messages.statusReactions.enabled=true`, puis capture une chronologie des
  réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après
  conservent également les artefacts MP4 fournis par le scénario sous les noms `baseline.mp4`
  et `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - scénario Mantis facultatif ; consultez
  [Scénarios Mantis de Discord](#discord-mantis-scenarios).

Exécutez explicitement le scénario de connexion automatique à un canal vocal Discord :

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Exécutez explicitement le scénario Mantis des réactions de statut :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefacts de sortie :

- `discord-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct.
- `discord-qa-observed-messages.json` - corps expurgés sauf si
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et
  `discord-status-reactions-tool-only-timeline.png` lors de l’exécution du
  scénario de réactions d’état.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un véritable canal Slack privé avec deux bots distincts : un bot pilote
contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant
via le plugin Slack intégré.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve le corps des messages dans
  les artefacts de messages observés.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` active les points de contrôle
  visuels d’approbation pour Mantis. L’exécuteur écrit `<scenario>.pending.json` et
  `<scenario>.resolved.json`, puis attend les fichiers `.ack.json` correspondants.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` remplace le délai
  d’expiration de l’accusé de réception du point de contrôle. La valeur par défaut est `120000`.

Scénarios YAML canoniques exposés par l’adaptateur Slack en direct :

- `thread-follow-up`
- `thread-isolation`

Scénarios Slack impératifs (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`) :

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` et
  `slack-progress-commentary-verbose-dedupe` - sondes Slack réelles facultatives pour
  les contrôles indépendants des commentaires et de la progression des outils, la valeur
  par défaut héritée lorsque la clé est omise, et le comportement de livraison unique lorsque
  la progression détaillée persistante est activée.
- `slack-reaction-glyph-native` - scénario facultatif de réaction en direct de l’outil de messagerie.
  Demande à l’agent de transmettre le glyphe exact `✅` et confirme que Slack a stocké
  `white_check_mark` pour le bot SUT sur le message cible.
- `slack-chart-presentation-native` - scénario facultatif de graphique portable qui
  vérifie le bloc natif `data_visualization` et le texte accessible exact.
- `slack-table-presentation-native` - scénario facultatif de tableau portable qui
  vérifie le bloc natif `data_table`, les lignes exactes et le texte accessible.
- `slack-table-invalid-blocks-fallback` - scénario facultatif de transport direct
  qui envoie un tableau brut structurellement lisible dépassant la limite, avec 101 lignes de données
  plus son en-tête, via le
  chemin d’envoi Slack de production, prouve que Slack lui-même renvoie `invalid_blocks`
  et vérifie que la solution de repli stockée sans mise en forme est complète et ne contient
  aucun bloc de données natif. Le rapport ne conserve que des preuves sûres sous forme de
  code d’erreur, de nombre et de valeur booléenne ; le texte brut du tableau synthétique suit
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`.
- `slack-approval-exec-native` - scénario facultatif d’approbation d’exécution native Slack.
  Demande une approbation d’exécution via le Gateway, vérifie que le message Slack
  comporte des boutons d’approbation natifs, la résout et vérifie la mise à jour Slack
  une fois résolue.
- `slack-approval-plugin-native` - scénario facultatif d’approbation native de plugin Slack.
  Active conjointement le transfert des approbations d’exécution et de plugin afin que les événements
  de plugin ne soient pas supprimés par le routage des approbations d’exécution, puis vérifie le même
  parcours d’interface utilisateur Slack native en attente/résolu.
- `slack-codex-approval-exec-native` - scénario facultatif d’approbation de commande Codex Guardian.
  Active le plugin Codex en mode Guardian, achemine un tour d’agent Gateway
  provenant de Slack via le harnais du serveur d’application Codex,
  attend l’invite d’approbation native du plugin Slack pour
  `openclaw-codex-app-server`, la résout et vérifie que le tour Codex
  se termine avec les marqueurs attendus de sortie de commande et d’assistant.
- `slack-codex-approval-plugin-native` - scénario facultatif d’approbation de fichier Codex Guardian.
  Utilise une instruction `apply_patch` hors de l’espace de travail afin que Codex émette
  le parcours d’approbation de modification de fichier du serveur d’application, puis vérifie le même
  parcours d’approbation Slack natif en attente/résolu, le marqueur final de l’assistant et le contenu
  exact du fichier avant le nettoyage.

Les scénarios d’approbation Codex nécessitent un `--model` `openai/*` ou `codex/*`, les
identifiants habituels du modèle en direct, ainsi qu’une authentification Codex ou une authentification par clé API acceptée par le plugin Codex.
Le rapport Slack inclut la méthode du serveur d’application Codex, la clé du modèle Codex sélectionné,
l’état final du tour Codex et la vérification du marqueur d’opération, ainsi que les
métadonnées d’approbation Slack expurgées.

Artefacts de sortie :

- `slack-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct.
- `slack-qa-observed-messages.json` - corps expurgés sauf si
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - uniquement lorsque Mantis définit
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ; contient les fichiers JSON des points de contrôle,
  les fichiers JSON d’accusé de réception et les captures d’écran en attente/résolues.

#### Configuration de l’espace de travail Slack

Ce circuit nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un canal dont les deux
bots sont membres :

- `channelId` - l’identifiant `Cxxxxxxxxxx` d’un canal auquel les deux bots ont été
  invités. Utilisez un canal dédié ; le circuit publie à chaque exécution.
- `driverBotToken` - jeton du bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` - jeton du bot (`xoxb-...`) de l’application **SUT**, qui doit être une
  application Slack distincte de l’application pilote afin que son identifiant d’utilisateur de bot soit différent.
- `sutAppToken` - jeton de niveau application (`xapp-...`) de l’application SUT avec
  `connections:write`, utilisé par Socket Mode afin que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack consacré à la QA plutôt que de réutiliser un espace de travail de
production.

Le manifeste SUT ci-dessous restreint intentionnellement l’installation de production du plugin
Slack intégré (`extensions/slack/src/setup-shared.ts:12`) aux
autorisations et événements couverts par la suite de QA Slack en direct. Pour la
configuration du canal de production telle que les utilisateurs la voient, consultez
[Configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire QA Driver/SUT
est volontairement distincte, car le circuit nécessite deux identifiants d’utilisateur de bot
différents dans un même espace de travail.

**1. Créer l’application Driver**

Accédez à [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → choisissez l’espace de travail de QA, collez le manifeste suivant,
puis _Install to Workspace_ :

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot pilote de test pour le circuit Slack en direct de la QA OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
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
`driverBotToken`. Le pilote doit seulement publier des messages et s’identifier ;
aucun événement ni Socket Mode n’est nécessaire.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. Cette application de QA
utilise intentionnellement une version plus restrictive du manifeste de production du plugin
Slack intégré (`extensions/slack/src/setup-shared.ts:12`) : les portées et les événements
de réaction sont omis, car la suite de QA Slack en direct ne couvre pas encore
la gestion des réactions.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Connecteur SUT de QA OpenClaw pour OpenClaw"
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

Après que Slack a créé l’application, effectuez deux opérations sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez
  la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle
  devient `sutAppToken`.

Vérifiez que les deux bots possèdent des identifiants d’utilisateur distincts en appelant `auth.test` pour chaque
jeton. L’environnement d’exécution distingue le pilote et le SUT par leur identifiant d’utilisateur ; réutiliser une même application
pour les deux fera immédiatement échouer le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail de QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux
bots depuis le canal :

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ : il
devient `channelId`. Un canal public convient ; si vous utilisez un canal privé,
les deux applications disposent déjà de `groups:history`, de sorte que les lectures de l’historique par le harnais
réussiront également.

**4. Enregistrer les identifiants**

Deux options sont disponibles. Utilisez des variables d’environnement pour le débogage sur une seule machine (définissez les quatre
variables `OPENCLAW_QA_SLACK_*` et transmettez `--credential-source env`), ou alimentez
le pool Convex partagé afin que la CI et les autres responsables puissent les louer.

Pour le pool Convex, écrivez les quatre champs dans un fichier JSON :

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Avec `OPENCLAW_QA_CONVEX_SITE_URL` et `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
exportés dans votre shell, enregistrez et vérifiez :

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Amorçage du pool Slack de QA"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Attendez-vous à `count: 1`, `status: "active"` et à l’absence de champ `lease`.

**5. Vérifier de bout en bout**

Exécutez le circuit localement pour confirmer que les deux bots peuvent communiquer entre eux via le
courtier :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution réussie se termine en nettement moins de 30 secondes et `slack-qa-report.md`
indique l’état `pass` pour `slack-canary` et `slack-mention-gating`. Si le
circuit reste bloqué pendant environ 90 secondes et se termine avec `Convex credential pool exhausted
for kind "slack"`, soit le pool est vide, soit toutes les lignes sont louées : `qa
credentials list --kind slack --status all --json` vous indiquera lequel de ces cas s’applique.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Cible deux comptes WhatsApp Web dédiés : un compte pilote contrôlé par
le harnais et un compte SUT démarré par le Gateway OpenClaw enfant via
le plugin WhatsApp intégré.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Facultatif :

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` active les scénarios de groupe tels que
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, les scénarios d’action, de média
  et de sondage de groupe, ainsi que `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserve le corps des messages dans
  les artefacts de messages observés.

Catalogue des scénarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`) :

- Contrôles de référence et de groupe : `whatsapp-canary`, `whatsapp-pairing-block`,
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
- Actions sur les messages dans le parcours utilisateur : `whatsapp-agent-message-action-react`
  part d’un véritable message privé du pilote, permet au modèle d’appeler
  l’outil `message` et observe la réaction WhatsApp native.
  `whatsapp-agent-message-action-upload-file` adopte la même approche pour
  `message(action=upload-file)` et observe le média WhatsApp natif.
  `whatsapp-group-agent-message-action-react` et
  `whatsapp-group-agent-message-action-upload-file` démontrent les mêmes
  actions visibles par l’utilisateur dans un véritable groupe WhatsApp.
- Diffusion aux groupes : `whatsapp-broadcast-group-fanout` part d’un message
  de groupe WhatsApp comportant une mention et vérifie des réponses visibles
  distinctes de `main` et `qa-second`.
- Activation de groupe : `whatsapp-group-activation-always` fait passer une
  véritable session de groupe à `/activation always`, démontre qu’un message
  de groupe sans mention réveille l’agent, puis rétablit `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` initialise une réponse du bot, lui
  envoie une réponse native avec citation sans mention explicite et vérifie
  que l’agent se réveille à partir de ce contexte de réponse.
- Médias entrants et messages structurés : `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Ces scénarios envoient par l’intermédiaire du pilote de véritables événements
  WhatsApp d’image, d’audio, de document, de localisation, de contact,
  d’autocollant et de réaction.
- Sondes directes du contrat du Gateway : `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Ces scénarios contournent volontairement
  l’invite du modèle et démontrent les contrats déterministes `send`, `poll`
  et `message.action` du Gateway et du canal.
- Couverture du contrôle d’accès : `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approbations natives : `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Réactions de statut : `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Le catalogue contient actuellement 52 scénarios. Le parcours `live-frontier`
par défaut reste limité à 10 scénarios pour fournir rapidement une couverture
de vérification élémentaire. Le parcours `mock-openai` par défaut exécute
45 scénarios de manière déterministe via le véritable transport WhatsApp,
tout en simulant uniquement la sortie du modèle ; les scénarios d’approbation
et quelques vérifications plus lourdes ou bloquantes restent explicitement
sélectionnables par identifiant de scénario.

Le pilote QA WhatsApp observe des événements en direct structurés (`text`, `media`,
`location`, `reaction` et `poll`) et peut envoyer activement des médias, des sondages,
des contacts, des emplacements et des autocollants. QA Lab importe ce pilote via la
surface du package `@openclaw/whatsapp/api.js` au lieu d’accéder aux fichiers privés
du runtime WhatsApp. Pour les observations de groupe, `fromJid` est le JID du groupe,
tandis que `participantJid` et `fromPhoneE164` identifient le participant expéditeur.
Le contenu des messages est masqué par défaut. Les sondes directes du Gateway portant
sur les sondages, l’envoi de fichiers, les médias, les sondages de groupe, les médias
de groupe et la forme des réponses sont des vérifications du contrat de transport/API ;
elles ne sont pas considérées comme la preuve qu’une invite utilisateur a conduit
l’agent à choisir la même action. La preuve des actions effectuées via le parcours
utilisateur provient de scénarios tels que `whatsapp-agent-message-action-react` et
`whatsapp-group-agent-message-action-react`, dans lesquels le pilote envoie un message
WhatsApp normal et QA Lab observe l’artefact WhatsApp natif qui en résulte.
Les rapports WhatsApp incluent la posture de chaque scénario (`user-path`,
`direct-gateway` ou `native-approval`) afin que les éléments de preuve ne puissent pas
être interprétés à tort comme démontrant un contrat plus fort qu’ils ne le font réellement.

Artefacts de sortie :

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport en direct.
- `whatsapp-qa-observed-messages.json` - corps masqués sauf si
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool d’identifiants Convex

Les voies Discord, Slack, Telegram et WhatsApp peuvent louer des identifiants depuis
un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez
`--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ;
QA Lab acquiert un bail exclusif, envoie des heartbeats pendant toute la durée de
l’exécution et le libère à l’arrêt. Les types du pool sont `"discord"`, `"slack"`,
`"telegram"` et `"whatsapp"`.

Formes de payload que le broker valide sur `admin/add` :

- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` doit être une chaîne d’identifiant numérique de discussion.
- Utilisateur Telegram réel (`kind: "telegram-user"`) : `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  réservé aux preuves Mantis avec Telegram Desktop. Les parcours génériques du QA Lab ne doivent pas acquérir
  ce type.
- WhatsApp (`kind: "whatsapp"`) : `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — les numéros de téléphone doivent être des chaînes E.164 distinctes.

Le workflow de preuve Mantis avec Telegram Desktop conserve un bail Convex
`telegram-user` exclusif à la fois pour le pilote CLI TDLib et le témoin Telegram Desktop,
puis le libère après la publication de la preuve.

Lorsqu’une PR nécessite une comparaison visuelle déterministe, Mantis peut utiliser la même réponse
du modèle simulé sur `main` et sur la tête de la PR pendant que le formateur Telegram ou
la couche de livraison change. Les valeurs par défaut de capture sont optimisées pour les commentaires de PR : classe
Crabbox standard, enregistrement du bureau à 24fps, GIF animé à 24fps et largeur d’aperçu de
1920px. Les commentaires avant/après doivent publier un ensemble propre contenant
uniquement les GIF prévus.

Les parcours Slack peuvent également utiliser le pool. Les vérifications de forme du payload Slack se trouvent actuellement
dans l’exécuteur QA Slack plutôt que dans le broker ; utilisez `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, avec un
identifiant de canal Slack tel que `Cxxxxxxxxxx`. Consultez
[Configuration de l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’application
et des portées.

Les variables d’environnement opérationnelles et le contrat du point de terminaison du broker Convex se trouvent dans
[Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1)
(le nom de la section est antérieur au pool multicanal ; la sémantique des baux est
commune à tous les types).

## Données d’amorçage intégrées au dépôt

Les ressources d’amorçage se trouvent dans `qa/` :

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Elles sont intentionnellement conservées dans git afin que le plan QA soit visible à la fois par les humains et
par l’agent.

`qa-lab` reste un exécuteur générique de scénarios YAML. Chaque fichier YAML de scénario est la
source de vérité pour une exécution de test et doit définir :

- un `title` de premier niveau
- les métadonnées `scenario`
- des métadonnées facultatives de catégorie, de capacité, de lane et de risque dans `scenario`
- les références à la documentation et au code dans `scenario`
- les exigences facultatives relatives aux plugins dans `scenario`
- un correctif facultatif de configuration du Gateway dans `scenario`
- un `flow` exécutable de premier niveau pour les scénarios de flux, ou
  `scenario.execution.kind` / `scenario.execution.path` pour les scénarios Vitest et
  Playwright

La surface d’exécution réutilisable sur laquelle repose `flow` reste générique et
transversale. Par exemple, les scénarios YAML peuvent combiner des
assistants côté transport avec des assistants côté navigateur qui pilotent l’interface Control UI intégrée via
le point d’intégration `browser.request` du Gateway sans ajouter d’exécuteur spécifique.

Les fichiers de scénario doivent être regroupés par capacité du produit plutôt que par dossier de
l’arborescence source. Conservez des identifiants de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et
`codeRefs` pour assurer la traçabilité de l’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- les discussions par message privé et dans les canaux
- le comportement des fils de discussion
- le cycle de vie des actions sur les messages
- les rappels cron
- le rappel depuis la mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build telle que Lobster Invaders

## Lanes de simulation des fournisseurs

`qa suite` comporte deux lanes locales de simulation des fournisseurs :

- `mock-openai` est la simulation OpenClaw tenant compte des scénarios. Elle reste la lane
  de simulation déterministe par défaut pour l’assurance qualité adossée au dépôt et les contrôles de parité.
- `aimock` démarre un serveur fournisseur reposant sur AIMock pour une couverture expérimentale
  des protocoles, des fixtures, de l’enregistrement/relecture et des perturbations. Cette lane est complémentaire et
  ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des lanes de fournisseurs se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur gère ses valeurs par défaut, le démarrage de son serveur local, la configuration du modèle du Gateway,
les besoins de préparation des profils d’authentification et les indicateurs de capacités réelles/simulées. Le code partagé de la suite et
du Gateway passe par le registre des fournisseurs au lieu d’effectuer des branchements sur
leurs noms.

## Adaptateurs de transport

`qa-lab` fournit un point d’intégration de transport générique pour les scénarios d’assurance qualité YAML. `qa-channel` est
le transport synthétique par défaut. `crabline` démarre des serveurs locaux qui reproduisent la forme des fournisseurs et
exécute les plugins de canaux normaux d’OpenClaw avec ceux-ci. `live` est réservé aux
identifiants réels des fournisseurs et aux canaux externes.

Au niveau de l’architecture, la répartition est la suivante :

- `qa-lab` gère l’exécution générique des scénarios, la concurrence des workers, l’écriture
  des artefacts et la génération de rapports.
- L’adaptateur de transport gère la configuration du Gateway, l’état de préparation, l’observation des flux entrants et sortants,
  les actions de transport et l’état normalisé du transport.
- Les fichiers YAML de scénario sous `qa/scenarios/` définissent l’exécution du test ; `qa-lab`
  fournit la surface d’exécution réutilisable qui les exécute.

### Ajout d’un canal

L’ajout d’un canal au système d’assurance qualité YAML nécessite l’implémentation du canal
ainsi qu’un ensemble de scénarios qui exerce le contrat du canal. Pour une couverture des tests de fumée en CI,
ajoutez le serveur fournisseur local Crabline correspondant et exposez-le
via le pilote `crabline`.

N’ajoutez pas de nouvelle racine de commande d’assurance qualité de premier niveau lorsque l’hôte partagé `qa-lab` peut
prendre en charge le flux.

`qa-lab` gère les mécanismes partagés de l’hôte :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins d’exécution gèrent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment le Gateway est configuré pour ce transport
- comment la disponibilité est vérifiée
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l'état normalisé du transport sont exposés
- comment les actions reposant sur le transport sont exécutées
- comment la réinitialisation ou le nettoyage propre au transport est géré

Le seuil minimal d'adoption pour un nouveau canal est le suivant :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l'exécuteur de transport sur l'interface hôte partagée de `qa-lab`.
3. Conserver les mécanismes propres au transport dans le Plugin d'exécution ou le
   harnais du canal.
4. Monter l'exécuteur sous la forme `openclaw qa <runner>` au lieu d'enregistrer
   une commande racine concurrente. Les Plugins d'exécution doivent déclarer
   `qaRunners` dans `openclaw.plugin.json` et exporter un tableau
   `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez
   `runtime-api.ts` léger ; la CLI chargée à la demande et l'exécution de
   l'exécuteur doivent rester derrière des points d'entrée distincts. Un
   `adapterFactory` facultatif expose le transport aux scénarios partagés sans
   modifier le catalogue de scénarios existant de la commande.
5. Créer ou adapter des scénarios YAML dans les répertoires thématiques
   `qa/scenarios/`.
6. Utiliser les fonctions auxiliaires génériques de scénario pour les nouveaux scénarios.
7. Maintenir le fonctionnement des alias de compatibilité existants, sauf si le dépôt
   effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend du transport d'un seul canal, conservez-le dans ce Plugin
  d'exécution ou dans le harnais du Plugin.
- Si un scénario nécessite une nouvelle capacité utilisable par plusieurs canaux,
  ajoutez une fonction auxiliaire générique plutôt qu'une branche propre à un canal dans `suite.ts`.
- Si un comportement n'a de sens que pour un seul transport, conservez le scénario
  propre à ce transport et rendez-le explicite dans le contrat du scénario.

### Noms des fonctions auxiliaires de scénario

Fonctions auxiliaires génériques privilégiées pour les nouveaux scénarios :

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

Les alias de compatibilité restent disponibles pour les scénarios existants :
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` ; toutefois, les nouveaux scénarios
doivent utiliser les noms génériques. Les alias servent à éviter une
migration simultanée, et ne constituent pas le modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre aux questions suivantes :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il serait utile d’ajouter

Pour obtenir l’inventaire des scénarios disponibles — utile pour dimensionner les travaux de suivi
ou intégrer un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json`
pour obtenir une sortie lisible par une machine). Pour choisir une preuve ciblée concernant un
comportement ou un chemin de fichier modifié, exécutez `pnpm openclaw qa coverage --match <query>`. Le
rapport de correspondance recherche dans les métadonnées des scénarios, les références de documentation, les références de code, les identifiants de couverture,
les plugins et les exigences relatives aux fournisseurs, puis affiche les cibles `qa suite
--scenario ...` correspondantes.

Chaque exécution de `qa suite` écrit les artefacts de premier niveau `qa-evidence.json`,
`qa-suite-summary.json` et `qa-suite-report.md` pour l’ensemble de
scénarios sélectionné. Les scénarios qui déclarent `execution.kind: vitest` ou
`execution.kind: playwright` exécutent le chemin de test correspondant et écrivent également
des journaux propres à chaque scénario. Les scénarios qui déclarent `execution.kind: script` exécutent le
producteur de preuves situé à `execution.path` via `node --import tsx` (avec
`${outputDir}` et `${scenarioId}` développés dans `execution.args`) ; le
producteur écrit son propre fichier `qa-evidence.json`, dont les entrées sont importées dans
la sortie de la suite et dont les chemins d’artefacts sont résolus par rapport à ce
fichier `qa-evidence.json` du producteur. Lorsque `qa suite` est lancé via `qa run
--qa-profile`, le même fichier `qa-evidence.json` inclut également le résumé du
tableau de bord du profil pour les catégories taxonomiques sélectionnées.

Considérez la sortie de couverture comme une aide à la découverte, et non comme un remplacement des contrôles ; le
scénario sélectionné nécessite toujours le mode fournisseur, le transport en direct,
Multipass, Testbox ou le circuit de publication approprié au comportement testé. Pour
le contexte du tableau de bord, consultez [Tableau de bord de maturité](/fr/maturity/scorecard).

Pour les vérifications de personnalité et de style, exécutez le même scénario avec plusieurs
références de modèles en direct et rédigez un rapport Markdown évalué :

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
d’évaluation du caractère doivent définir le persona via `SOUL.md`, puis exécuter des
tours utilisateur ordinaires, tels qu’une conversation, une aide sur l’espace de travail et de petites tâches
sur des fichiers. Le modèle candidat ne doit pas être informé qu’il est en cours d’évaluation. La commande conserve
chaque transcription complète, enregistre les statistiques d’exécution de base, puis demande aux modèles juges, en
mode rapide avec un raisonnement `xhigh` lorsque celui-ci est pris en charge, de classer les exécutions selon
leur naturel, leur ambiance et leur humour. Utilisez `--blind-judge-models` lorsque vous comparez
des fournisseurs : l’invite du juge reçoit toujours chaque transcription et chaque statut d’exécution, mais
les références des candidats sont remplacées par des libellés neutres tels que `candidate-01` ; le
rapport réassocie les classements aux références réelles après l’analyse.

Les exécutions des candidats utilisent par défaut un niveau de raisonnement `high`, avec `medium` pour GPT-5.6 Luna et
`xhigh` pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez le réglage d’un
candidat particulier directement avec `--model provider/model,thinking=<level>` ; les options
directes prennent également en charge `fast`, `no-fast` et `fast=<bool>`. `--thinking
<level>` définit toujours une valeur de repli globale, et l’ancienne forme `--model-thinking
<provider/model=level>` est conservée à des fins de compatibilité. Les références de candidats OpenAI
utilisent par défaut le mode rapide afin que le traitement prioritaire soit employé lorsque le fournisseur
le prend en charge. Transmettez `--fast` uniquement lorsque vous souhaitez imposer le mode rapide à
tous les modèles candidats. Les durées des candidats et des juges sont enregistrées dans le
rapport pour l’analyse comparative, mais les invites des juges indiquent explicitement de ne pas effectuer le classement
selon la vitesse. Les exécutions des modèles candidats et juges utilisent toutes deux une concurrence de 16 par défaut.
Réduisez `--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la charge
du Gateway local rendent une exécution trop bruitée.

Lorsqu’aucun candidat `--model` n’est fourni, l’évaluation du caractère utilise par défaut
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et `google/gemini-3.1-pro-preview`. Lorsqu’aucun
`--judge-model` n’est fourni, les modèles juges utilisent par défaut
`openai/gpt-5.6-sol,thinking=xhigh,fast` et
`anthropic/claude-opus-4-8,thinking=high`.

## Documentation associée

- [AQ Matrix](/fr/concepts/qa-matrix)
- [Tableau de maturité](/fr/maturity/scorecard)
- [Pack de benchmarks pour agent personnel](/fr/concepts/personal-agent-benchmark-pack)
- [Canal AQ](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)
