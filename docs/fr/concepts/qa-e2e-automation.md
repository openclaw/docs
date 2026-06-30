---
read_when:
    - Comprendre comment la pile QA s’articule
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajouter des scénarios QA adossés au dépôt
    - Créer une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Vue d’ensemble QA
x-i18n:
    generated_at: "2026-06-30T13:58:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée est destinée à exercer OpenClaw d’une manière plus réaliste,
structurée comme un canal, que ne peut le faire un simple test unitaire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, de canal, de fil,
  de réaction, de modification et de suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transports live qui
  pilotent un canal réel dans un gateway QA enfant.
- `qa/` : ressources d’amorçage sauvegardées dans le dépôt pour la tâche de démarrage et les
  scénarios QA de référence.
- [Mantis](/fr/concepts/mantis) : vérification live avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état de VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup disposent d’alias de scripts `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée sans `--qa-profile` ; exécuteur de profil de maturité adossé à la taxonomie avec `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                  |
| `qa suite`                                          | Exécuter les scénarios sauvegardés dans le dépôt contre la voie du gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                                                                                           |
| `qa coverage`                                       | Afficher l’inventaire de couverture des scénarios YAML (`--json` pour une sortie machine).                                                                                                                                                                              |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique, ou utiliser `--runtime-axis --token-efficiency` pour écrire des rapports de parité d’exécution Codex-vs-OpenClaw et d’efficacité des tokens à partir d’un résumé de paire d’exécutions. |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles live avec un rapport évalué. Voir [Rapports](#reporting).                                                                                                                                                   |
| `qa manual`                                         | Exécuter une invite ponctuelle contre la voie fournisseur/modèle sélectionnée.                                                                                                                                                                                           |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Construire l’image Docker QA prépréparée.                                                                                                                                                                                                                                |
| `qa docker-scaffold`                                | Écrire un squelette docker-compose pour le tableau de bord QA + la voie gateway.                                                                                                                                                                                         |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                |
| `qa aimock`                                         | Démarrer uniquement le serveur fournisseur AIMock.                                                                                                                                                                                                                       |
| `qa mock-openai`                                    | Démarrer uniquement le serveur fournisseur `mock-openai` conscient des scénarios.                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                                                                                                                             |
| `qa matrix`                                         | Voie de transport live contre un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                                                                                                                     |
| `qa telegram`                                       | Voie de transport live contre un vrai groupe privé Telegram.                                                                                                                                                                                                             |
| `qa discord`                                        | Voie de transport live contre un vrai canal de guilde Discord privé.                                                                                                                                                                                                     |
| `qa slack`                                          | Voie de transport live contre un vrai canal Slack privé.                                                                                                                                                                                                                 |
| `qa whatsapp`                                       | Voie de transport live contre de vrais comptes WhatsApp Web.                                                                                                                                                                                                             |
| `qa mantis`                                         | Exécuteur de vérification avant et après pour les bugs de transport live, avec preuves par réactions de statut Discord, smoke desktop/navigateur Crabbox et smoke Slack-dans-VNC. Voir [Mantis](/fr/concepts/mantis) et [Runbook desktop Slack Mantis](/fr/concepts/mantis-slack-desktop-runbook). |

`qa run` adossé à un profil lit l’appartenance depuis `taxonomy.yaml`, puis répartit
les scénarios résolus via `qa suite`. `--surface` et
`--category` filtrent le profil sélectionné au lieu de définir des voies séparées.
Le fichier `qa-evidence.json` résultant inclut un résumé de scorecard de profil avec
les décomptes des catégories sélectionnées et les ID de couverture manquants ; les entrées
de preuve individuelles restent la source de vérité pour les tests, les rôles de couverture
et les résultats. Les ID de couverture des fonctionnalités de taxonomie sont des cibles de preuve exactes,
pas des alias. La couverture principale des scénarios satisfait les ID correspondants ; la couverture secondaire reste indicative.
Les ID de couverture utilisent la forme pointée `namespace.behavior` avec des segments
alphanumériques/tirets en minuscules ; les ID de profil, de surface et de catégorie peuvent toujours utiliser
les ID de taxonomie existants avec tirets ou points.
Les preuves allégées omettent `execution` par entrée et définissent `evidenceMode: "slim"` ;
`smoke-ci` utilise l’allégé par défaut, et `--evidence-mode full` restaure les entrées complètes :

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Utilisez `smoke-ci` pour une preuve de profil déterministe avec des fournisseurs de modèles mock et
des serveurs fournisseurs locaux Crabline. Utilisez `release` pour la preuve Stable/LTS contre des canaux
live. Utilisez `all` uniquement pour des exécutions explicites de preuves sur toute la taxonomie ; il sélectionne
chaque catégorie de maturité active et peut être réparti via le workflow `QA Profile
Evidence` avec `qa_profile=all`. Lorsqu’une commande nécessite aussi un profil racine OpenClaw,
placez le profil racine avant la commande QA :

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription inspirée de Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission
QA, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus vite sur l’interface QA Lab locale sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté en bind :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte en bind
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le
hachage des ressources QA Lab change.

Pour un smoke local du signal OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur OTLP/HTTP local, exécute le scénario QA `otel-trace-smoke`
avec le plugin `diagnostics-otel` activé, puis vérifie que les traces,
métriques et journaux sont exportés. Il décode les spans de trace protobuf exportées
et vérifie la forme critique pour la version :
`openclaw.run`, `openclaw.harness.run`, une span d’appel de modèle suivant la dernière convention sémantique GenAI,
`openclaw.context.assembled` et `openclaw.message.delivery`
doivent être présents. Le smoke force
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, donc la span d’appel de modèle
doit utiliser le nom `{gen_ai.operation.name} {gen_ai.request.model}` ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors de tours réussis ; les ID de diagnostic bruts et les
attributs `openclaw.content.*` doivent rester hors de la trace. Les charges utiles OTLP brutes
ne doivent pas contenir la sentinelle d’invite, la sentinelle de réponse ni la clé de session QA.
Il écrit `otel-smoke-summary.json` à côté des artefacts de la suite QA.

Pour un smoke OpenTelemetry adossé à un collecteur, exécutez :

```bash
pnpm qa:otel:collector-smoke
```

Cette voie place un vrai conteneur Docker OpenTelemetry Collector devant le
même récepteur local. Utilisez-la lorsque vous modifiez le câblage des endpoints, la compatibilité
du collecteur ou un comportement d’export OTLP que le récepteur en processus pourrait masquer.

Pour le smoke protégé de scrape Prometheus, exécutez :

```bash
pnpm qa:prometheus:smoke
```

Cet alias exécute le scénario QA `docker-prometheus-smoke` avec
`diagnostics-prometheus` activé, vérifie que les scrapes non authentifiés sont rejetés,
puis vérifie que le scrape authentifié inclut les familles de métriques critiques pour la version
sans contenu de prompt, contenu de réponse, identifiants de diagnostic bruts, jetons
d’authentification ni chemins locaux.

Pour exécuter les deux smokes d’observabilité à la suite, utilisez :

```bash
pnpm qa:observability:smoke
```

Pour la voie OpenTelemetry adossée au collecteur plus le smoke de scrape Prometheus protégé,
utilisez :

```bash
pnpm qa:observability:collector-smoke
```

La QA d’observabilité reste réservée aux checkouts source. Le tarball npm omet
intentionnellement QA Lab, donc les voies de publication Docker de paquet n’exécutent pas les commandes `qa`.
Utilisez `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` ou
`pnpm qa:observability:smoke` depuis un checkout source construit lorsque vous modifiez
l’instrumentation de diagnostic.

Pour une voie smoke Matrix avec transport réel qui ne nécessite pas
d’identifiants de fournisseur de modèle, exécutez le profil rapide avec le fournisseur OpenAI fictif déterministe :

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Pour la voie avec fournisseur live-frontier, fournissez explicitement des identifiants
compatibles OpenAI :

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et l’organisation des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En résumé : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le Plugin Matrix réel dans un Gateway QA enfant limité à ce transport (pas de `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Les scénarios couvrent des comportements de transport que les tests unitaires ne peuvent pas prouver de bout en bout : filtrage par mention, politiques allow-bot, listes d’autorisation, réponses de premier niveau et en fil, routage des DM, gestion des réactions, suppression des modifications entrantes, déduplication de relecture après redémarrage, récupération après interruption du homeserver, livraison des métadonnées d’approbation, gestion des médias et flux de démarrage/récupération/vérification E2EE Matrix. Le profil CLI E2EE pilote aussi `openclaw matrix encryption setup` et les commandes de vérification via le même homeserver jetable avant de vérifier les réponses du Gateway.

Discord dispose aussi de scénarios opt-in réservés à Mantis pour la reproduction de bugs. Utilisez
`--scenario discord-status-reactions-tool-only` pour la chronologie explicite des réactions de statut,
ou `--scenario discord-thread-reply-filepath-attachment` pour créer un
vrai fil Discord et vérifier que `message.thread-reply` préserve une pièce jointe
`filePath`. Ces scénarios restent hors de la voie Discord live par défaut,
car ce sont des sondes de reproduction avant/après plutôt qu’une large couverture smoke.
Le workflow Mantis des pièces jointes de fil peut aussi ajouter une vidéo témoin Discord Web
avec session connectée lorsque `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est configuré dans l’environnement QA.
Ce profil de visualisation sert uniquement à la capture visuelle ; la décision réussite/échec
vient toujours de l’oracle REST Discord.

La CI utilise la même surface de commande dans `.github/workflows/qa-live-transports-convex.yml`.
Les exécutions planifiées et manuelles par défaut exécutent le profil Matrix rapide avec
les identifiants live-frontier fournis par la QA, `--fast` et
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Le mode manuel `matrix_profile=all` se
déploie dans les cinq shards de profil.

Pour les voies smoke Telegram, Discord, Slack et WhatsApp à transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Elles ciblent un vrai canal préexistant avec deux bots ou comptes (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord, Slack et WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) ci-dessous.

Pour une exécution complète sur VM de bureau Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine Crabbox desktop/browser, exécute la voie live Slack
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4`
lorsque la capture vidéo est disponible vers le répertoire d’artefacts Mantis. Les locations
Crabbox desktop/browser fournissent d’emblée les outils de capture et les paquets d’aide
navigateur/build natif, donc le scénario ne devrait installer des solutions de repli que sur les anciennes
locations. Mantis signale les durées totales et par phase dans
`mantis-slack-desktop-smoke-report.md`, afin que les exécutions lentes indiquent si le temps est allé dans
le préchauffage de la location, l’acquisition d’identifiants, la configuration distante ou la copie d’artefacts. Réutilisez
`--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web via VNC ;
les locations réutilisées gardent aussi chaud le cache du store pnpm de Crabbox. Le mode par défaut
`--hydrate-mode source` vérifie depuis un checkout source et exécute install/build
dans la VM. Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
dispose déjà de `node_modules` et d’un `dist/` construit ; ce mode ignore l’étape
coûteuse install/build et échoue fermé lorsque l’espace de travail n’est pas prêt.
Avec `--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant
en cours d’exécution dans la VM sur le port `38973` ; sans cette option, la commande exécute la voie QA Slack
bot-à-bot normale et quitte après la capture des artefacts.

Pour prouver l’interface d’approbation Slack native avec preuve desktop, exécutez le mode point de contrôle
d’approbation Mantis :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ce mode est mutuellement exclusif avec `--gateway-setup`. Il exécute les scénarios
d’approbation Slack, rejette les ids de scénarios non liés aux approbations, attend à chaque état d’approbation
en attente et résolu, rend le message API Slack observé dans
`approval-checkpoints/<scenario>-pending.png` et
`approval-checkpoints/<scenario>-resolved.png`, puis échoue si un point de contrôle,
une preuve de message, un accusé de réception ou une capture d’écran rendue manque ou est vide.
Les locations CI froides peuvent encore afficher la connexion Slack dans `slack-desktop-smoke.png` ;
les images de point de contrôle d’approbation sont la preuve visuelle pour cette voie.

La checklist opérateur, la commande de dispatch du workflow GitHub, le contrat de commentaire
de preuve, la table de décision hydrate-mode, l’interprétation des durées et les étapes de
gestion des échecs se trouvent dans le [runbook Mantis Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche desktop de style agent/CV, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` loue ou réutilise une machine Crabbox desktop/browser, démarre
`crabbox record --while`, pilote le navigateur visible via un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image describe`
sur la capture d’écran lorsque `--vision-mode image-describe` est sélectionné, et
écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et `mantis-visual-task-report.md`.
Lorsque `--expect-text` est défini, le prompt de vision demande un verdict JSON structuré
et ne réussit que lorsque le modèle signale une preuve visible positive ; une
réponse négative qui ne fait que citer le texte cible échoue à l’assertion.
Utilisez `--vision-mode metadata` pour un smoke sans modèle qui prouve le câblage du bureau,
du navigateur, de la capture d’écran et de la vidéo sans appeler de fournisseur
de compréhension d’image. L’enregistrement est un artefact obligatoire pour `visual-task` ; si Crabbox n’enregistre
aucun `visual-task.mp4` non vide, la tâche échoue même lorsque le driver visuel
a réussi. En cas d’échec, Mantis conserve la location pour VNC, sauf si la tâche avait déjà
réussi et que `--keep-lease` n’était pas défini.

Avant d’utiliser des identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du courtier Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/list lorsque le secret maintainer est présent. Il signale uniquement l’état défini/manquant des secrets.

## Couverture des transports live

Les voies de transport live partagent un seul contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la suite synthétique large de comportement produit et ne fait pas partie de la matrice de couverture des transports live.

Les runners de transport live doivent importer les ids de scénarios partagés, les helpers de
couverture de référence et le helper de sélection de scénarios depuis
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Voie     | Canary | Filtrage par mention | Bot-à-bot | Blocage par liste d’autorisation | Réponse de premier niveau | Réponse avec citation | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------------- | --------- | -------------------------------- | ------------------------- | --------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- | --------------------------------- |
| Matrix   | x      | x                    | x         | x                                | x                         |                       | x                         | x            | x                | x                         |                 |                                   |
| Telegram | x      | x                    | x         |                                  |                           |                       |                           |              |                  |                           | x               |                                   |
| Discord  | x      | x                    | x         |                                  |                           |                       |                           |              |                  |                           |                 | x                                 |
| Slack    | x      | x                    | x         | x                                | x                         |                       | x                         | x            | x                |                           |                 |                                   |
| WhatsApp | x      | x                    |           | x                                | x                         | x                     | x                         |              |                  | x                         | x               |                                   |

Cela garde `qa-channel` comme suite large de comportement produit tandis que Matrix,
Telegram et les autres transports live partagent une checklist explicite de contrat de transport.

Pour une voie sur VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence
de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution en série.
Utilisez `--pack personal-agent` pour exécuter le pack de benchmark d’assistant personnel. Le
sélecteur de pack est additif avec les flags `--scenario` répétés : les scénarios explicites
s’exécutent d’abord, puis les scénarios du pack s’exécutent dans l’ordre du pack avec les doublons supprimés.
Utilisez `--pack observability` lorsqu’un runner QA personnalisé fournit déjà la configuration
du collecteur OpenTelemetry et veut sélectionner ensemble les scénarios smoke de diagnostics
OpenTelemetry et Prometheus.
La commande quitte avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur QA live et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA pour Telegram, Discord, Slack et WhatsApp

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de serveur domestique adossé à Docker. Telegram, Discord, Slack et WhatsApp s’exécutent sur des transports réels préexistants ; leur référence se trouve donc ici.

### Indicateurs CLI partagés

Ces voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes indicateurs :

| Indicateur                           | Valeur par défaut                                  | Description                                                                                                                                                               |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | -                                                  | Exécute uniquement ce scénario. Répétable.                                                                                                                                |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Emplacement où les rapports, résumés, preuves, artefacts propres au transport et le journal de sortie sont écrits. Les chemins relatifs sont résolus depuis `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                    | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                                                                     |
| `--sut-account <id>`                 | `sut`                                              | ID de compte temporaire dans la configuration du Gateway QA.                                                                                                              |
| `--provider-mode <mode>`             | `live-frontier`                                    | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne toujours).                                                                                              |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                  | Références de modèle principale/alternative.                                                                                                                             |
| `--fast`                             | désactivé                                          | Mode rapide du fournisseur lorsqu’il est pris en charge.                                                                                                                  |
| `--credential-source <env\|convex>`  | `env`                                              | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                                                               |
| `--credential-role <maintainer\|ci>` | `ci` en CI, sinon `maintainer`                     | Rôle utilisé lorsque `--credential-source convex`.                                                                                                                        |

Chaque voie se termine avec un code non nul si un scénario échoue. `--allow-failures` écrit les artefacts sans définir un code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe privé Telegram réel avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont le **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérique de chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Scénarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`) :

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
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

L’ensemble implicite par défaut couvre toujours le canari, le filtrage des mentions, les réponses aux commandes natives, l’adressage des commandes et les réponses de groupe bot-à-bot. Les valeurs par défaut de `mock-openai` incluent aussi des vérifications déterministes de chaîne de réponse et de streaming du message final. `telegram-current-session-status-tool` reste optionnel, car il n’est stable que lorsqu’il est enchaîné directement après le canari, pas après des réponses arbitraires à des commandes natives. Utilisez `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` pour afficher la séparation actuelle entre défaut/optionnel avec les références de régression.

Artefacts de sortie :

- `telegram-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport live, incluant les champs profile, coverage, provider, channel, artifacts, result et RTT.

Les exécutions Telegram du paquet utilisent le même contrat d’identifiants Telegram. La mesure RTT répétée fait partie de la voie live Telegram normale du paquet ; la distribution RTT est intégrée dans `qa-evidence.json` sous `result.timing` pour la vérification RTT sélectionnée.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Lorsque `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` est défini, le wrapper live du paquet réserve un identifiant `kind: "telegram"`, exporte l’environnement du groupe/pilote/bot SUT réservé dans l’exécution du paquet installé, envoie des Heartbeat pour le bail et le libère à l’arrêt. Le wrapper du paquet utilise par défaut 20 vérifications RTT de `telegram-mentioned-message-reply`, un délai d’expiration RTT de 30 s et le rôle Convex `maintainer` hors CI lorsque Convex est sélectionné. Remplacez `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster la mesure RTT sans créer de commande RTT séparée ni de format de résumé propre à Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un canal de guilde Discord privé réel avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord intégré. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios de preuve Mantis optionnels.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’ID utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Optionnel :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` sélectionne le canal vocal/scène pour `discord-voice-autojoin` ; sans lui, le scénario choisit le premier canal vocal/scène visible par le bot SUT.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scénario vocal optionnel. S’exécute seul, active `channels.discord.voice.autoJoin` et vérifie que l’état vocal Discord actuel du bot SUT est le canal vocal/scène cible. Les identifiants Discord Convex peuvent inclure un `voiceChannelId` optionnel ; sinon, l’exécuteur découvre le premier canal vocal/scène visible dans la guilde.
- `discord-status-reactions-tool-only` - scénario Mantis optionnel. S’exécute seul, car il bascule le SUT sur des réponses de guilde toujours actives et uniquement par outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie des réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports avant/après de Mantis conservent aussi les artefacts MP4 fournis par le scénario sous `baseline.mp4` et `candidate.mp4`.

Exécuter explicitement le scénario de connexion automatique au vocal Discord :

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Exécuter explicitement le scénario de réaction de statut Mantis :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artefacts de sortie :

- `discord-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport live.
- `discord-qa-observed-messages.json` - corps expurgés sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réaction de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un canal Slack privé réel avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack intégré.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optionnel :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` active les points de contrôle d’approbation visuelle pour Mantis. L’exécuteur écrit `<scenario>.pending.json` et `<scenario>.resolved.json`, puis attend les fichiers `.ack.json` correspondants.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` remplace le délai d’accusé de réception du point de contrôle. La valeur par défaut est `120000`.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`) :

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - scénario optionnel d’approbation exec native Slack. Demande une approbation exec via le Gateway, vérifie que le message Slack comporte des boutons d’approbation natifs, la résout et vérifie la mise à jour Slack résolue.
- `slack-approval-plugin-native` - scénario optionnel d’approbation Plugin native Slack. Active ensemble le transfert des approbations exec et Plugin afin que les événements de Plugin ne soient pas supprimés par le routage des approbations exec, puis vérifie le même chemin d’interface Slack native en attente/résolue.

Artefacts de sortie :

- `slack-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications du transport live.
- `slack-qa-observed-messages.json` - corps expurgés sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - uniquement lorsque Mantis définit `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ; contient le JSON de point de contrôle, le JSON d’accusé de réception et les captures d’écran en attente/résolues.

#### Configuration de l’espace de travail Slack

La voie nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un canal dont les deux bots sont membres :

- `channelId` - l’ID `Cxxxxxxxxxx` d’un canal auquel les deux bots ont été invités. Utilisez un canal dédié ; la voie publie à chaque exécution.
- `driverBotToken` - jeton de bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` - jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une application Slack séparée de celle du pilote afin que son ID utilisateur de bot soit distinct.
- `sutAppToken` - jeton de niveau application (`xapp-...`) de l’application SUT avec `connections:write`, utilisé par Socket Mode pour que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que la réutilisation d’un espace de travail de production.

Le manifeste SUT ci-dessous restreint volontairement l’installation de production du Plugin Slack intégré (`extensions/slack/src/setup-shared.ts:10`) aux autorisations et événements couverts par la suite QA Slack live. Pour la configuration du canal de production telle que les utilisateurs la voient, consultez [configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire QA Driver/SUT est volontairement séparée, car la voie nécessite deux ID utilisateur de bot distincts dans un même espace de travail.

**1. Créer l’application Driver**

Accédez à [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → sélectionnez l’espace de travail QA, collez le manifeste suivant, puis _Install to Workspace_ :

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
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

Copiez le _Bot User OAuth Token_ (`xoxb-...`) ; il devient `driverBotToken`. Le pilote doit seulement publier des messages et s’identifier ; aucun événement, aucun Socket Mode.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. Cette application QA utilise intentionnellement une version plus restreinte du manifeste de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`) : les portées et événements de réaction sont omis, car la suite QA Slack live ne couvre pas encore la gestion des réactions.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
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

Après que Slack a créé l’application, effectuez deux actions sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle devient `sutAppToken`.

Vérifiez que les deux bots ont des identifiants utilisateur distincts en appelant `auth.test` sur chaque jeton. Le runtime distingue le pilote et le SUT par identifiant utilisateur ; réutiliser une seule application pour les deux fera échouer immédiatement le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux bots depuis le canal :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ ; il devient `channelId`. Un canal public fonctionne ; si vous utilisez un canal privé, les deux applications disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront quand même.

**4. Enregistrer les identifiants**

Deux options. Utilisez les variables d’environnement pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou alimentez le pool Convex partagé afin que la CI et les autres mainteneurs puissent les louer.

Pour le pool Convex, écrivez les quatre champs dans un fichier JSON :

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Avec `OPENCLAW_QA_CONVEX_SITE_URL` et `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportés dans votre shell, enregistrez et vérifiez :

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Attendez-vous à `count: 1`, `status: "active"`, sans champ `lease`.

**5. Vérifier de bout en bout**

Exécutez la ligne localement pour confirmer que les deux bots peuvent communiquer entre eux via le courtier :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution réussie se termine en moins de 30 secondes et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si la ligne se bloque pendant environ 90 secondes et se termine avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit chaque ligne est louée ; `qa credentials list --kind slack --status all --json` vous dira lequel.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Cible deux comptes WhatsApp Web dédiés : un compte pilote contrôlé par
le harnais et un compte SUT démarré par le Gateway OpenClaw enfant via le
Plugin WhatsApp groupé.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Facultatif :

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` active les scénarios de groupe tels que
  `whatsapp-mention-gating` et `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserve les corps des messages dans
  les artefacts de messages observés.

Catalogue des scénarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`) :

- Référence et filtrage de groupe : `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Commandes natives : `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportement de réponse et de sortie finale : `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Médias entrants et messages structurés : `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Ceux-ci envoient de vrais événements WhatsApp
  d’image, d’audio, de document, de localisation, de contact et d’autocollant
  via le pilote.
- Couverture du Gateway sortant et des actions de message :
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Couverture du contrôle d’accès : `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approbations natives : `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Réactions de statut : `whatsapp-status-reactions`.

Le catalogue contient actuellement 36 scénarios. La ligne par défaut `live-frontier`
reste réduite à 10 scénarios pour une couverture smoke rapide. La ligne par
défaut `mock-openai` exécute 31 scénarios déterministes via le vrai transport
WhatsApp, tout en simulant uniquement la sortie du modèle. Les scénarios
d’approbation et quelques vérifications plus lourdes ou bloquantes restent
explicites par identifiant de scénario.

Le pilote QA WhatsApp observe des événements live structurés (`text`, `media`,
`location`, `reaction` et `poll`) et peut envoyer activement des médias, sondages,
contacts, localisations et autocollants. QA Lab importe ce pilote via la surface
de package `@openclaw/whatsapp/api.js` au lieu d’accéder aux fichiers privés du
runtime WhatsApp. Le contenu des messages est masqué par défaut. La couverture
des sondages sortants et des fichiers téléversés passe par des appels Gateway
déterministes `poll` et `message.action` plutôt que par une invocation d’outil
reposant uniquement sur une invite de modèle.

Artefacts de sortie :

- `whatsapp-qa-report.md`
- `qa-evidence.json` ; entrées de preuve pour les vérifications du transport live.
- `whatsapp-qa-observed-messages.json` ; corps masqués sauf si `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool d’identifiants Convex

Les lignes Telegram, Discord, Slack et WhatsApp peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie des Heartbeats pendant toute la durée de l’exécution et le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"`, `"slack"` et `"whatsapp"`.

Formes de payload validées par le courtier sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` ; `groupId` doit être une chaîne d’identifiant de chat numérique.
- Utilisateur réel Telegram (`kind: "telegram-user"`) : `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` ; preuve Mantis Telegram Desktop uniquement. Les lignes QA Lab génériques ne doivent pas acquérir ce type.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`) : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` ; les numéros de téléphone doivent être des chaînes E.164 distinctes.

Le workflow de preuve Mantis Telegram Desktop détient un bail Convex exclusif
`telegram-user` pour le pilote CLI TDLib et le témoin Telegram Desktop, puis le
libère après publication de la preuve.

Lorsqu’une PR a besoin d’un diff visuel déterministe, Mantis peut utiliser la
même réponse de modèle simulée sur `main` et sur la tête de la PR pendant que le
formateur Telegram ou la couche de livraison change. Les valeurs par défaut de
capture sont réglées pour les commentaires de PR : classe Crabbox standard,
enregistrement desktop à 24 fps, GIF de mouvement à 24 fps et largeur d’aperçu
de 1920 px. Les commentaires avant/après doivent publier un lot propre contenant
uniquement les GIFs prévus.

Les lignes Slack peuvent aussi utiliser le pool. Les vérifications de forme du payload Slack vivent actuellement dans l’exécuteur QA Slack plutôt que dans le courtier ; utilisez `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, avec un identifiant de canal Slack comme `Cxxxxxxxxxx`. Consultez [Configurer l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement des applications et des portées.

Les variables d’environnement opérationnelles et le contrat d’endpoint du courtier Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur au pool multicanal ; les sémantiques de bail sont partagées entre les types).

## Seeds appuyés par le dépôt

Les ressources seed vivent dans `qa/` :

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois
par les humains et par l’agent.

`qa-lab` doit rester un exécuteur générique de scénarios YAML. Chaque fichier YAML
de scénario est la source de vérité pour une exécution de test et doit définir :

- `title` au niveau supérieur
- les métadonnées `scenario`
- les métadonnées facultatives de catégorie, capacité, ligne et risque dans `scenario`
- les références de documentation et de code dans `scenario`
- les exigences facultatives de Plugin dans `scenario`
- le patch facultatif de configuration Gateway dans `scenario`
- le `flow` exécutable au niveau supérieur pour les scénarios de flux, ou `scenario.execution.kind` /
  `scenario.execution.path` pour les scénarios Vitest et Playwright

La surface d’exécution réutilisable qui sous-tend `flow` est autorisée à rester générique
et transversale. Par exemple, les scénarios YAML peuvent combiner des assistants côté transport
avec des assistants côté navigateur qui pilotent l’interface utilisateur Control UI intégrée via la
couture Gateway `browser.request`, sans ajouter de lanceur spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Gardez les ID de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité de l’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- les conversations en message privé et dans les canaux
- le comportement des fils
- le cycle de vie des actions de message
- les rappels cron
- le rappel mémoire
- le changement de modèle
- le transfert vers un sous-agent
- la lecture de dépôts et de docs
- une petite tâche de build comme Lobster Invaders

## Voies de simulation de fournisseur

`qa suite` dispose de deux voies locales de simulation de fournisseur :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste la voie de simulation
  déterministe par défaut pour la QA adossée au dépôt et les portes de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour la couverture expérimentale de protocoles,
  de fixtures, d’enregistrement/relecture et de chaos. Il est additif et ne remplace pas
  le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage du serveur local, la configuration de modèle du gateway,
les besoins de préparation des profils d’authentification et les indicateurs de capacités live/mock. Le code partagé de suite et de
gateway doit passer par le registre des fournisseurs au lieu de brancher sur
les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une couture de transport générique pour les scénarios QA YAML. `qa-channel` est
le synthétique par défaut. `crabline` démarre des serveurs locaux à forme de fournisseur et exécute
les plugins de canal normaux d’OpenClaw contre eux. `live` est réservé aux vrais
identifiants de fournisseur et aux canaux externes.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- L’adaptateur de transport possède la configuration du gateway, l’état de préparation, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario YAML sous `qa/scenarios/` définissent l’exécution du test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA YAML nécessite l’implémentation du canal plus
un pack de scénarios qui exerce le contrat du canal. Pour une couverture CI de smoke, ajoutez
le serveur fournisseur local Crabline correspondant et exposez-le via le pilote `crabline`.

N’ajoutez pas de nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécaniques d’hôte partagées :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins de runner possèdent le contrat de transport :

- la façon dont `openclaw qa <runner>` est monté sous la racine `qa` partagée
- la façon dont le gateway est configuré pour ce transport
- la façon dont l’état de préparation est vérifié
- la façon dont les événements entrants sont injectés
- la façon dont les messages sortants sont observés
- la façon dont les transcriptions et l’état de transport normalisé sont exposés
- la façon dont les actions adossées au transport sont exécutées
- la façon dont la réinitialisation ou le nettoyage propres au transport sont gérés

Le seuil minimal d’adoption pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine `qa` partagée.
2. Implémenter le runner de transport sur la couture d’hôte `qa-lab` partagée.
3. Garder les mécaniques propres au transport dans le Plugin de runner ou le harnais de canal.
4. Monter le runner comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les plugins de runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter les scénarios YAML sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si un comportement dépend d’un seul transport de canal, gardez-le dans ce Plugin de runner ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez un assistant générique au lieu d’une branche propre à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique au transport et rendez cela explicite dans le contrat du scénario.

### Noms des assistants de scénario

Assistants génériques préférés pour les nouveaux scénarios :

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

Les alias de compatibilité restent disponibles pour les scénarios existants - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration le même jour pour tous, pas comme modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie de bus observée.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qui valent la peine d’être ajoutés

Pour l’inventaire des scénarios disponibles - utile pour dimensionner le travail de suivi ou câbler un nouveau transport - exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).
Lorsque vous choisissez une preuve ciblée pour un comportement ou un chemin de fichier touché, exécutez `pnpm openclaw qa coverage --match <query>`.
Le rapport de correspondance recherche les métadonnées de scénario, les références de docs, les références de code, les ID de couverture, les plugins et les exigences de fournisseur, puis imprime les cibles `qa suite --scenario ...` correspondantes.
Chaque exécution de `qa suite` écrit les artefacts de premier niveau `qa-evidence.json`,
`qa-suite-summary.json` et `qa-suite-report.md` pour l’ensemble de scénarios sélectionné. Les scénarios qui déclarent `execution.kind: vitest` ou
`execution.kind: playwright` exécutent le chemin de test correspondant et écrivent aussi
des journaux par scénario. Les scénarios qui déclarent `execution.kind: script` exécutent le
producteur de preuves à `execution.path` via `node --import tsx` (avec
`${outputDir}` et `${scenarioId}` développés dans `execution.args`) ; le producteur
écrit son propre `qa-evidence.json`, dont les entrées sont importées dans la sortie de la suite
et dont les chemins d’artefacts sont résolus relativement à ce
`qa-evidence.json` producteur. Lorsque `qa suite` est atteint via
`qa run --qa-profile`, le même `qa-evidence.json` inclut aussi le résumé de la fiche d’évaluation du profil pour les catégories de taxonomie sélectionnées.
Traitez-le comme une aide à la découverte, pas comme un remplacement de porte ; le scénario sélectionné a toujours besoin du bon mode fournisseur, du transport live, de Multipass, Testbox ou de la voie de release pour le comportement testé.
Pour le contexte de la fiche d’évaluation, consultez [Fiche d’évaluation de maturité](/fr/maturity/scorecard).

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs refs de modèles live
et écrivez un rapport Markdown jugé :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande lance des processus enfants locaux de gateway QA, pas Docker. Les scénarios d’évaluation de caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme le chat, l’aide sur l’espace de travail et de petites tâches sur les fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande conserve chaque transcription complète,
enregistre les statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` lorsque c’est pris en charge de classer les exécutions selon le naturel, le ressenti et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours
chaque transcription et état d’exécution, mais les refs candidates sont remplacées par des
étiquettes neutres comme `candidate-01` ; le rapport remappe les classements vers les vraies refs après
l’analyse.
Les exécutions candidates utilisent par défaut le niveau de réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes refs d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un
repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les refs candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
seul candidat ou juge a besoin d’une surcharge. Passez `--fast` uniquement lorsque vous voulez
forcer le mode rapide pour tous les modèles candidats. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse de benchmark, mais les prompts des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions de modèles candidats et juges utilisent toutes deux la concurrence 16 par défaut. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites de fournisseur ou la pression du gateway local
rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-8,thinking=high`.

## Docs liées

- [QA matricielle](/fr/concepts/qa-matrix)
- [Fiche d’évaluation de maturité](/fr/maturity/scorecard)
- [Pack de benchmark d’agent personnel](/fr/concepts/personal-agent-benchmark-pack)
- [QA Channel](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)
