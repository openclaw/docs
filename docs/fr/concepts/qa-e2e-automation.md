---
read_when:
    - Comprendre comment la pile QA s’articule
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios QA adossés au dépôt
    - Création d’une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Présentation de l’AQ
x-i18n:
    generated_at: "2026-07-01T05:40:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée vise à exercer OpenClaw d’une manière plus réaliste et
adaptée aux canaux qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transports réels qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources de départ adossées au dépôt pour la tâche de lancement et les scénarios
  QA de référence.
- [Mantis](/fr/concepts/mantis) : vérification en conditions réelles avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état d’une VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup disposent d’alias de script `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée sans `--qa-profile` ; exécuteur de profil de maturité adossé à la taxonomie avec `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                  |
| `qa suite`                                          | Exécuter les scénarios adossés au dépôt contre la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                                                                                                    |
| `qa coverage`                                       | Afficher l’inventaire YAML de couverture des scénarios (`--json` pour une sortie machine).                                                                                                                                                                              |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique, ou utiliser `--runtime-axis --token-efficiency` pour écrire les rapports de parité d’exécution Codex-vs-OpenClaw et d’efficacité des tokens à partir d’un résumé de paire d’exécutions. |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles réels avec un rapport jugé. Voir [Rapports](#reporting).                                                                                                                                                    |
| `qa manual`                                         | Exécuter une invite ponctuelle contre la voie fournisseur/modèle sélectionnée.                                                                                                                                                                                           |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Construire l’image Docker QA prépréparée.                                                                                                                                                                                                                                |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                                                                                                       |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                  |
| `qa aimock`                                         | Démarrer uniquement le serveur fournisseur AIMock.                                                                                                                                                                                                                       |
| `qa mock-openai`                                    | Démarrer uniquement le serveur fournisseur `mock-openai` conscient des scénarios.                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                                                                                                                             |
| `qa matrix`                                         | Voie de transport réel contre un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                                                                                                                     |
| `qa telegram`                                       | Voie de transport réel contre un vrai groupe Telegram privé.                                                                                                                                                                                                             |
| `qa discord`                                        | Voie de transport réel contre un vrai canal de guilde Discord privé.                                                                                                                                                                                                     |
| `qa slack`                                          | Voie de transport réel contre un vrai canal Slack privé.                                                                                                                                                                                                                 |
| `qa whatsapp`                                       | Voie de transport réel contre de vrais comptes WhatsApp Web.                                                                                                                                                                                                             |
| `qa mantis`                                         | Exécuteur de vérification avant et après pour les bugs de transport réel, avec preuves par réactions de statut Discord, smoke Crabbox desktop/navigateur et smoke Slack-dans-VNC. Voir [Mantis](/fr/concepts/mantis) et [Runbook Mantis Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook). |

`qa run` adossé à un profil lit l’appartenance depuis `taxonomy.yaml`, puis envoie
les scénarios résolus via `qa suite`. `--surface` et
`--category` filtrent le profil sélectionné au lieu de définir des voies séparées.
Le fichier `qa-evidence.json` résultant inclut un résumé de scorecard de profil avec
le nombre de catégories sélectionnées et les ID de couverture manquants ; les entrées
de preuve individuelles restent la source de vérité pour les tests, les rôles de couverture et les résultats.
Les ID de couverture des fonctionnalités de taxonomie sont des cibles de preuve exactes, pas des alias. La couverture
de scénario principale satisfait les ID correspondants ; la couverture secondaire reste consultative.
Les ID de couverture utilisent la forme pointée `namespace.behavior` avec des segments
alphanumériques/tirets en minuscules ; les ID de profil, surface et catégorie peuvent encore utiliser
les ID de taxonomie existants avec tirets ou points.
Les preuves allégées omettent `execution` par entrée et définissent `evidenceMode: "slim"` ;
`smoke-ci` utilise le mode allégé par défaut, et `--evidence-mode full` restaure les entrées complètes :

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Utilisez `smoke-ci` pour une preuve de profil déterministe avec des fournisseurs de modèles simulés et
des serveurs fournisseurs locaux Crabline. Utilisez `release` pour une preuve Stable/LTS contre des canaux réels.
Utilisez `all` uniquement pour les exécutions explicites de preuve sur toute la taxonomie ; il sélectionne
chaque catégorie de maturité active et peut être envoyé via le workflow `QA Profile
Evidence` avec `qa_profile=all`. Lorsqu’une commande a aussi besoin d’un profil racine OpenClaw,
placez le profil racine avant la commande QA :

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (UI de contrôle) avec l’agent.
- Droite : QA Lab, affichant la transcription à la Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner une mission QA
à l’agent, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour des itérations plus rapides sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab
change.

Pour un smoke local de signal OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur OTLP/HTTP local, exécute le scénario QA `otel-trace-smoke`
avec le plugin `diagnostics-otel` activé, puis vérifie que les traces,
métriques et journaux sont exportés. Il décode les spans de trace protobuf exportés
et vérifie la forme critique pour la release :
`openclaw.run`, `openclaw.harness.run`, un span d’appel de modèle selon la dernière convention sémantique GenAI,
`openclaw.context.assembled` et `openclaw.message.delivery`
doivent être présents. Le smoke force
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, donc le span d’appel de modèle
doit utiliser le nom `{gen_ai.operation.name} {gen_ai.request.model}` ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors des tours réussis ; les ID de diagnostic bruts et
les attributs `openclaw.content.*` doivent rester hors de la trace. Les charges utiles OTLP brutes
ne doivent pas contenir la sentinelle d’invite, la sentinelle de réponse ni la clé de session QA.
Il écrit `otel-smoke-summary.json` à côté des artefacts de la suite QA.

Pour un smoke OpenTelemetry adossé à un collecteur, exécutez :

```bash
pnpm qa:otel:collector-smoke
```

Cette voie place un vrai conteneur Docker OpenTelemetry Collector devant le
même récepteur local. Utilisez-la lorsque vous modifiez le câblage des endpoints, la
compatibilité du collecteur ou le comportement d’export OTLP que le récepteur intégré au processus pourrait masquer.

Pour le smoke protégé de récupération Prometheus, exécutez :

```bash
pnpm qa:prometheus:smoke
```

Cet alias exécute le scénario QA `docker-prometheus-smoke` avec
`diagnostics-prometheus` activé, vérifie que les scrapes non authentifiés sont rejetés,
puis contrôle que le scrape authentifié inclut les familles de métriques critiques
pour la publication sans contenu de prompt, contenu de réponse, identifiants de
diagnostic bruts, jetons d’authentification ni chemins locaux.

Pour exécuter les deux tests smoke d’observabilité l’un après l’autre, utilisez :

```bash
pnpm qa:observability:smoke
```

Pour la voie OpenTelemetry adossée au collecteur plus le test smoke de scrape
Prometheus protégé, utilisez :

```bash
pnpm qa:observability:collector-smoke
```

La QA d’observabilité reste réservée au checkout source. Le tarball npm omet
intentionnellement QA Lab, donc les voies de publication Docker du package
n’exécutent pas de commandes `qa`. Utilisez
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` ou
`pnpm qa:observability:smoke` depuis un checkout source construit lorsque vous
modifiez l’instrumentation de diagnostic.

Pour une voie smoke Matrix avec transport réel qui ne nécessite pas d’identifiants
de fournisseur de modèle, exécutez le profil rapide avec le fournisseur OpenAI
mock déterministe :

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Pour la voie de fournisseur live-frontier, fournissez explicitement des
identifiants compatibles OpenAI :

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et l’organisation des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai Plugin Matrix dans un Gateway QA enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Les scénarios couvrent des comportements de transport que les tests unitaires ne peuvent pas prouver de bout en bout : filtrage des mentions, politiques allow-bot, allowlists, réponses de premier niveau et en fil, routage des DM, gestion des réactions, suppression des modifications entrantes, déduplication de relecture au redémarrage, récupération après interruption du homeserver, livraison des métadonnées d’approbation, gestion des médias, et flux d’amorçage/récupération/vérification E2EE Matrix. Le profil CLI E2EE pilote aussi `openclaw matrix encryption setup` et les commandes de vérification via le même homeserver jetable avant de contrôler les réponses du Gateway.

Discord possède aussi des scénarios optionnels Mantis uniquement pour la reproduction
de bugs. Utilisez `--scenario discord-status-reactions-tool-only` pour la chronologie
explicite des réactions de statut, ou `--scenario discord-thread-reply-filepath-attachment`
pour créer un vrai fil Discord et vérifier que `message.thread-reply` préserve une
pièce jointe `filePath`. Ces scénarios restent hors de la voie Discord live par
défaut, car ce sont des sondes de reproduction avant/après plutôt qu’une couverture
smoke large. Le workflow Mantis de pièce jointe dans un fil peut aussi ajouter une
vidéo témoin Discord Web connecté lorsque `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`
ou `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est configuré dans l’environnement
QA. Ce profil de visualisation sert uniquement à la capture visuelle ; la décision
succès/échec vient toujours de l’oracle REST Discord.

La CI utilise la même surface de commande dans `.github/workflows/qa-live-transports-convex.yml`.
Les exécutions planifiées et manuelles par défaut exécutent le profil Matrix rapide
avec les identifiants live-frontier fournis par la QA, `--fast`, et
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Le mode manuel `matrix_profile=all`
se répartit sur les cinq shards de profil.

Pour les voies smoke avec transport réel Telegram, Discord, Slack et WhatsApp :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Elles ciblent un canal réel préexistant avec deux bots ou comptes (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord, Slack et WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) ci-dessous.

Pour une exécution complète de VM de bureau Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine Crabbox de bureau/navigateur, exécute la voie Slack
live dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau, puis
recopie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4`
lorsque la capture vidéo est disponible vers le répertoire d’artefacts Mantis.
Les locations Crabbox de bureau/navigateur fournissent d’emblée les outils de
capture et les packages d’aide au navigateur/build natif, donc le scénario ne
devrait installer des solutions de repli que sur les locations plus anciennes.
Mantis rapporte les durées totales et par phase dans
`mantis-slack-desktop-smoke-report.md`, afin que les exécutions lentes indiquent
si le temps a été consacré au préchauffage de la location, à l’acquisition des
identifiants, à la configuration distante ou à la copie des artefacts. Réutilisez
`--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web via VNC ;
les locations réutilisées gardent aussi le cache du store pnpm de Crabbox au chaud.
Le `--hydrate-mode source` par défaut vérifie depuis un checkout source et exécute
l’installation/la construction dans la VM. Utilisez `--hydrate-mode prehydrated`
uniquement lorsque l’espace de travail distant réutilisé possède déjà `node_modules`
et un `dist/` construit ; ce mode ignore l’étape coûteuse d’installation/build et
échoue de manière fermée lorsque l’espace de travail n’est pas prêt. Avec
`--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant en cours
d’exécution dans la VM sur le port `38973` ; sans cette option, la commande exécute
la voie QA Slack normale de bot à bot et se termine après la capture des artefacts.

Pour prouver l’interface d’approbation Slack native avec preuve de bureau, exécutez
le mode checkpoint d’approbation Mantis :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Ce mode est mutuellement exclusif avec `--gateway-setup`. Il exécute les scénarios
d’approbation Slack, rejette les identifiants de scénario hors approbation, attend
à chaque état d’approbation en attente et résolu, restitue le message d’API Slack
observé dans `approval-checkpoints/<scenario>-pending.png` et
`approval-checkpoints/<scenario>-resolved.png`, puis échoue si un checkpoint, une
preuve de message, un accusé de réception ou une capture d’écran rendue est manquant
ou vide. Les locations CI à froid peuvent encore afficher la connexion Slack dans
`slack-desktop-smoke.png` ; les images de checkpoint d’approbation sont la preuve
visuelle pour cette voie.

La checklist opérateur, la commande de dispatch du workflow GitHub, le contrat de
commentaire de preuve, le tableau de décision du mode d’hydratation, l’interprétation
des durées et les étapes de gestion des échecs se trouvent dans le [runbook Mantis Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche de bureau de style agent/CV, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` loue ou réutilise une machine Crabbox de bureau/navigateur, démarre
`crabbox record --while`, pilote le navigateur visible via un `visual-driver`
imbriqué, capture `visual-task.png`, exécute `openclaw infer image describe`
sur la capture d’écran lorsque `--vision-mode image-describe` est sélectionné, puis
écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et `mantis-visual-task-report.md`.
Lorsque `--expect-text` est défini, le prompt de vision demande un verdict JSON
structuré et ne réussit que lorsque le modèle signale une preuve visible positive ;
une réponse négative qui se contente de citer le texte cible échoue à l’assertion.
Utilisez `--vision-mode metadata` pour un smoke sans modèle qui prouve la plomberie
du bureau, du navigateur, de la capture d’écran et de la vidéo sans appeler de
fournisseur de compréhension d’image. L’enregistrement est un artefact requis pour
`visual-task` ; si Crabbox n’enregistre aucun `visual-task.mp4` non vide, la tâche
échoue même lorsque le pilote visuel a réussi. En cas d’échec, Mantis conserve la
location pour VNC, sauf si la tâche avait déjà réussi et que `--keep-lease` n’était
pas défini.

Avant d’utiliser des identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du courtier Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/list lorsque le secret maintainer est présent. Il ne rapporte que l’état défini/manquant des secrets.

## Couverture des transports live

Les voies de transport live partagent un seul contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la suite synthétique large de comportement produit et ne fait pas partie de la matrice de couverture des transports live.

Les runners de transport live doivent importer les identifiants de scénario partagés,
les helpers de couverture de référence et le helper de sélection de scénario depuis
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Voie     | Canari | Filtrage des mentions | Bot à bot | Blocage allowlist | Réponse de premier niveau | Réponse citée | Reprise au redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Cela conserve `qa-channel` comme suite large de comportement produit, tandis que Matrix,
Telegram et les autres transports live partagent une checklist explicite unique de
contrat de transport.

Pour une voie de VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et le résumé
dans `.artifacts/qa-e2e/...` sur l’hôte.
Cette commande réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et Multipass exécutent par défaut plusieurs
scénarios sélectionnés en parallèle avec des workers Gateway isolés. `qa-channel`
utilise par défaut une concurrence de 4, plafonnée par le nombre de scénarios sélectionnés.
Utilisez `--concurrency <count>` pour ajuster le nombre de workers, ou
`--concurrency 1` pour une exécution sérielle.
Utilisez `--pack personal-agent` pour exécuter le pack de benchmark d’assistant personnel. Le
sélecteur de pack est additif avec les flags `--scenario` répétés : les scénarios
explicites s’exécutent d’abord, puis les scénarios du pack s’exécutent dans l’ordre
du pack, doublons supprimés.
Utilisez `--pack observability` lorsqu’un runner QA personnalisé fournit déjà la
configuration du collecteur OpenTelemetry et souhaite sélectionner ensemble les
scénarios smoke de diagnostic OpenTelemetry et Prometheus.
La commande se termine avec un code non nul si un scénario échoue. Utilisez
`--allow-failures` lorsque vous voulez les artefacts sans code de sortie en échec.
Les exécutions live transfèrent les entrées d’authentification QA prises en charge
et pratiques pour l’invité : clés de fournisseur basées sur l’environnement, chemin
de configuration du fournisseur live QA, et `CODEX_HOME` lorsqu’il est présent.
Gardez `--output-dir` sous la racine du dépôt afin que l’invité puisse réécrire
via l’espace de travail monté.

## Référence QA pour Telegram, Discord, Slack et WhatsApp

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram, Discord, Slack et WhatsApp s’exécutent sur des transports réels préexistants, leur référence se trouve donc ici.

### Flags CLI partagés

Ces lanes s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes flags :

| Flag                                  | Valeur par défaut                                  | Description                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Exécute uniquement ce scénario. Répétable.                                                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Emplacement où sont écrits les rapports, résumés, preuves, artefacts propres au transport et le journal de sortie. Les chemins relatifs sont résolus depuis `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                                                                     |
| `--sut-account <id>`                  | `sut`                                              | ID de compte temporaire dans la configuration du Gateway QA.                                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne encore).                                                                                                |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du provider                      | Références de modèle principale/alternative.                                                                                                                             |
| `--fast`                              | désactivé                                          | Mode rapide du provider lorsqu’il est pris en charge.                                                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                              | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                     | Rôle utilisé lorsque `--credential-source convex`.                                                                                                                       |

Chaque lane se termine avec un code non nul si un scénario échoue. `--allow-failures` écrit les artefacts sans définir de code de sortie en échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe privé Telegram réel avec deux bots distincts (driver + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont le **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérique du chat (chaîne).
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

L’ensemble implicite par défaut couvre toujours le canary, le filtrage par mention, les réponses aux commandes natives, l’adressage de commandes et les réponses de groupe bot-à-bot. Les valeurs par défaut de `mock-openai` incluent aussi les vérifications déterministes de chaîne de réponses et de streaming du message final. `telegram-current-session-status-tool` reste opt-in, car il n’est stable que lorsqu’il est enchaîné directement après canary, et non après des réponses arbitraires à des commandes natives. Utilisez `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` pour afficher la répartition actuelle par défaut/optionnelle avec les références de régression.

Artefacts de sortie :

- `telegram-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications de transport live, incluant les champs de profil, couverture, provider, channel, artefacts, résultat et RTT.

Les exécutions Telegram de package utilisent le même contrat d’identifiants Telegram. La mesure RTT répétée fait partie de la lane live Telegram de package normale ; la distribution RTT est intégrée dans `qa-evidence.json` sous `result.timing` pour la vérification RTT sélectionnée.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Lorsque `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` est défini, le wrapper live de package loue un identifiant `kind: "telegram"`, exporte les env du groupe/driver/bot SUT loués dans l’exécution du package installé, envoie le Heartbeat du bail et le libère à l’arrêt. Le wrapper de package utilise par défaut 20 vérifications RTT de `telegram-mentioned-message-reply`, un délai d’expiration RTT de 30 s et le rôle Convex `maintainer` hors CI lorsque Convex est sélectionné. Remplacez `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster la mesure RTT sans créer de commande RTT séparée ni de format de résumé propre à Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un channel de guilde Discord privé réel avec deux bots : un bot driver contrôlé par le harness et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord groupé. Vérifie la gestion des mentions de channel, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios de preuve Mantis opt-in.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’ID d’utilisateur du bot SUT renvoyé par Discord (sinon la lane échoue rapidement).

Optionnel :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps de message dans les artefacts de messages observés.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` sélectionne le channel vocal/stage pour `discord-voice-autojoin` ; sans lui, le scénario choisit le premier channel vocal/stage visible pour le bot SUT.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scénario vocal opt-in. S’exécute seul, active `channels.discord.voice.autoJoin` et vérifie que l’état vocal Discord actuel du bot SUT est le channel vocal/stage cible. Les identifiants Discord Convex peuvent inclure un `voiceChannelId` optionnel ; sinon, le runner découvre le premier channel vocal/stage visible dans la guilde.
- `discord-status-reactions-tool-only` - scénario Mantis opt-in. S’exécute seul, car il bascule le SUT vers des réponses de guilde toujours actives et exclusivement via outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après conservent aussi les artefacts MP4 fournis par le scénario sous `baseline.mp4` et `candidate.mp4`.

Exécuter explicitement le scénario d’auto-join vocal Discord :

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Exécuter explicitement le scénario de réactions de statut Mantis :

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
- `qa-evidence.json` - entrées de preuve pour les vérifications de transport live.
- `discord-qa-observed-messages.json` - corps expurgés sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réactions de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un channel Slack privé réel avec deux bots distincts : un bot driver contrôlé par le harness et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack groupé.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optionnel :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve les corps de message dans les artefacts de messages observés.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` active les points de contrôle d’approbation visuelle pour Mantis. Le runner écrit `<scenario>.pending.json` et `<scenario>.resolved.json`, puis attend les fichiers `.ack.json` correspondants.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` remplace le délai d’expiration d’accusé de réception du point de contrôle. La valeur par défaut est `120000`.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`) :

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - scénario d’approbation exec native Slack opt-in. Demande une approbation exec via le Gateway, vérifie que le message Slack possède des boutons d’approbation natifs, la résout, puis vérifie la mise à jour Slack résolue.
- `slack-approval-plugin-native` - scénario d’approbation Plugin native Slack opt-in. Active ensemble le transfert d’approbations exec et Plugin afin que les événements Plugin ne soient pas supprimés par le routage d’approbation exec, puis vérifie le même parcours UI Slack natif en attente/résolu.

Artefacts de sortie :

- `slack-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications de transport live.
- `slack-qa-observed-messages.json` - corps expurgés sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - uniquement lorsque Mantis définit `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ; contient le JSON des points de contrôle, le JSON d’accusé de réception et les captures d’écran en attente/résolues.

#### Configurer l’espace de travail Slack

La lane nécessite deux apps Slack distinctes dans un même espace de travail, ainsi qu’un channel dont les deux bots sont membres :

- `channelId` - l’ID `Cxxxxxxxxxx` d’un channel auquel les deux bots ont été invités. Utilisez un channel dédié ; la lane publie à chaque exécution.
- `driverBotToken` - token de bot (`xoxb-...`) de l’app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de l’app **SUT**, qui doit être une app Slack distincte du driver afin que son ID d’utilisateur bot soit distinct.
- `sutAppToken` - token de niveau app (`xapp-...`) de l’app SUT avec `connections:write`, utilisé par Socket Mode afin que l’app SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que de réutiliser un espace de travail de production.

Le manifeste SUT ci-dessous restreint intentionnellement l’installation de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`) aux autorisations et événements couverts par la suite QA Slack live. Pour la configuration du channel de production telle que les utilisateurs la voient, consultez [configuration rapide du channel Slack](/fr/channels/slack#quick-setup) ; la paire Driver/SUT de QA est intentionnellement séparée, car la lane nécessite deux ID d’utilisateur bot distincts dans un même espace de travail.

**1. Créer l’app Driver**

Go to [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → choisissez l’espace de travail QA, collez le manifeste suivant, puis _Install to Workspace_:

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

Copiez le _Bot User OAuth Token_ (`xoxb-...`) - il devient `driverBotToken`. Le pilote doit seulement publier des messages et s’identifier ; aucun événement, pas de Socket Mode.

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

Vérifiez que les deux bots ont des identifiants utilisateur distincts en appelant `auth.test` sur chaque jeton. Le runtime distingue le pilote et le SUT par identifiant utilisateur ; réutiliser une seule application pour les deux fera immédiatement échouer le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux bots depuis le canal :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ - il devient `channelId`. Un canal public fonctionne ; si vous utilisez un canal privé, les deux applications disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront quand même.

**4. Enregistrer les identifiants**

Deux options. Utilisez des variables d’environnement pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou alimentez le pool Convex partagé afin que la CI et les autres mainteneurs puissent les louer.

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

Exécutez la voie localement pour confirmer que les deux bots peuvent communiquer entre eux via le broker :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution verte se termine en bien moins de 30 secondes et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si la voie reste bloquée pendant environ 90 secondes puis quitte avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit chaque ligne est louée - `qa credentials list --kind slack --status all --json` vous indiquera lequel des deux cas s’applique.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Cible deux comptes WhatsApp Web dédiés : un compte pilote contrôlé par
le harnais et un compte SUT démarré par le Gateway OpenClaw enfant via le
Plugin WhatsApp groupé.

Env requis avec `--credential-source env` :

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Facultatif :

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` active les scénarios de groupe tels que
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, les scénarios d’action/média/sondage de groupe, et
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserve les corps des messages dans
  les artefacts de messages observés.

Catalogue de scénarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`) :

- Référence et filtrage de groupe : `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Commandes natives : `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportement de réponse et de sortie finale : `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Actions de message du parcours utilisateur : `whatsapp-agent-message-action-react` démarre depuis
  un vrai DM pilote, laisse le modèle appeler l’outil `message`, et observe la
  réaction native WhatsApp. `whatsapp-agent-message-action-upload-file` utilise
  la même posture pour `message(action=upload-file)` et observe un média natif
  WhatsApp. `whatsapp-group-agent-message-action-react` et
  `whatsapp-group-agent-message-action-upload-file` prouvent les mêmes actions visibles par l’utilisateur
  dans un vrai groupe WhatsApp.
- Diffusion de groupe : `whatsapp-broadcast-group-fanout` démarre depuis un message
  de groupe WhatsApp avec mention et vérifie des réponses visibles distinctes de `main` et
  `qa-second`.
- Activation de groupe : `whatsapp-group-activation-always` change une vraie
  session de groupe en `/activation always`, prouve qu’un message de groupe sans mention réveille
  l’agent, puis restaure `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  injecte une réponse de bot, envoie une réponse native citée vers celle-ci sans
  mention explicite, et vérifie que l’agent se réveille depuis ce contexte de réponse.
- Médias entrants et messages structurés : `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Ces scénarios envoient de vrais événements WhatsApp d’image, audio, document, emplacement, contact, sticker,
  et réaction via le pilote.
- Sondes directes du contrat Gateway :
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Elles contournent volontairement le prompt du modèle et
  prouvent des contrats déterministes Gateway/canal `send`, `poll`, et `message.action`.
- Couverture du contrôle d’accès : `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approbations natives : `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Réactions de statut : `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Le catalogue contient actuellement 50 scénarios. La voie par défaut `live-frontier` est
maintenue petite, avec 10 scénarios, pour une couverture smoke rapide. La voie par défaut `mock-openai`
exécute 44 scénarios déterministes via le vrai transport WhatsApp tout en
simulant uniquement la sortie du modèle. Les scénarios d’approbation et quelques vérifications plus lourdes/bloquantes
restent explicites par identifiant de scénario.

Le pilote QA WhatsApp observe des événements live structurés (`text`, `media`,
`location`, `reaction`, et `poll`) et peut envoyer activement des médias, sondages,
contacts, emplacements et stickers. QA Lab importe ce pilote via la surface de package
`@openclaw/whatsapp/api.js` au lieu d’accéder aux fichiers privés du runtime
WhatsApp. Pour les observations de groupe, `fromJid` est le JID du groupe tandis que
`participantJid` et `fromPhoneE164` identifient l’expéditeur participant. Le contenu
des messages est masqué par défaut. Les sondes directes Gateway
poll, upload-file, média, sondage de groupe, média de groupe et forme de réponse sont des vérifications de contrat transport/API ;
elles ne sont pas traitées comme une preuve qu’un prompt utilisateur a amené l’agent à choisir
la même action. La preuve d’action du parcours utilisateur provient de scénarios tels que
`whatsapp-agent-message-action-react` et
`whatsapp-group-agent-message-action-react`, où le pilote envoie un message WhatsApp
normal et QA Lab observe l’artefact WhatsApp natif résultant.
Les rapports WhatsApp incluent la posture de chaque scénario (`user-path`, `direct-gateway`,
ou `native-approval`) afin que les preuves ne puissent pas être prises pour un contrat plus fort
que ce qu’elles prouvent réellement.

Artefacts de sortie :

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entrées de preuve pour les vérifications de transport live.
- `whatsapp-qa-observed-messages.json` - corps masqués sauf si `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool d’identifiants Convex

Les voies Telegram, Discord, Slack et WhatsApp peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, lui envoie des Heartbeat pendant toute la durée de l’exécution, et le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"`, `"slack"` et `"whatsapp"`.

Formes de charge utile que le broker valide sur `admin/add` :

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` doit être une chaîne d’identifiant de chat numérique.
- Utilisateur réel Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - preuve Mantis Telegram Desktop uniquement. Les voies génériques QA Lab ne doivent pas acquérir ce type.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - les numéros de téléphone doivent être des chaînes E.164 distinctes.

Le workflow de preuve Mantis Telegram Desktop détient un bail Convex
`telegram-user` exclusif pour le pilote CLI TDLib et le témoin Telegram Desktop,
puis le libère après la publication de la preuve.

Lorsqu’une PR nécessite un diff visuel déterministe, Mantis peut utiliser la même
réponse de modèle simulée sur `main` et sur la tête de PR pendant que le
formateur Telegram ou la couche de livraison change. Les valeurs de capture par
défaut sont réglées pour les commentaires de PR : classe Crabbox standard,
enregistrement de bureau à 24 ips, GIF de mouvement à 24 ips et largeur
d’aperçu de 1920 px. Les commentaires avant/après doivent publier un bundle
propre qui ne contient que les GIF prévus.

Les voies Slack peuvent également utiliser le pool. Les contrôles de forme des charges utiles Slack vivent actuellement dans le runner QA Slack plutôt que dans le broker ; utilisez `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, avec un identifiant de canal Slack comme `Cxxxxxxxxxx`. Consultez [Configurer l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’application et des scopes.

Les variables d’environnement opérationnelles et le contrat de point de terminaison du broker Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de section est antérieur au pool multicanal ; la sémantique des baux est partagée entre les types).

## Seeds adossés au dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la
fois par les humains et par l’agent.

`qa-lab` doit rester un runner générique de scénarios YAML. Chaque fichier YAML
de scénario est la source de vérité pour une exécution de test et doit définir :

- `title` au niveau supérieur
- des métadonnées `scenario`
- des métadonnées optionnelles de catégorie, capacité, voie et risque dans `scenario`
- des références de documentation et de code dans `scenario`
- des exigences optionnelles de Plugin dans `scenario`
- un patch optionnel de configuration Gateway dans `scenario`
- un `flow` exécutable au niveau supérieur pour les scénarios de flux, ou
  `scenario.execution.kind` / `scenario.execution.path` pour les scénarios Vitest et Playwright

La surface d’exécution réutilisable qui prend en charge `flow` peut rester
générique et transversale. Par exemple, les scénarios YAML peuvent combiner des
helpers côté transport avec des helpers côté navigateur qui pilotent l’interface
Control UI intégrée via la jonction Gateway `browser.request` sans ajouter de
runner spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que
par dossier de l’arborescence source. Gardez les ID de scénario stables lorsque
les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la
traçabilité de l’implémentation.

La liste de base doit rester assez large pour couvrir :

- le chat en DM et en canal
- le comportement des fils
- le cycle de vie des actions de message
- les rappels cron
- le rappel mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture de dépôt et la lecture de documentation
- une petite tâche de build comme Lobster Invaders

## Voies de mock de fournisseur

`qa suite` dispose de deux voies locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la voie de
  mock déterministe par défaut pour la QA adossée au dépôt et les gates de parité.
- `aimock` démarre un serveur de fournisseur adossé à AIMock pour la couverture
  expérimentale de protocole, fixture, enregistrement/relecture et chaos. Il est
  additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local,
la configuration de modèle Gateway, les besoins de staging de profil
d’authentification et les indicateurs de capacité live/mock. Le code partagé de
suite et de Gateway doit passer par le registre des fournisseurs au lieu de
brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jonction de transport générique pour les scénarios QA YAML.
`qa-channel` est la valeur synthétique par défaut. `crabline` démarre des
serveurs locaux à forme de fournisseur et exécute les Plugins de canal OpenClaw
normaux contre eux. `live` est réservé aux identifiants de fournisseurs réels et
aux canaux externes.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration Gateway, la readiness, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario YAML sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA YAML nécessite l’implémentation du canal ainsi
qu’un pack de scénarios qui exerce le contrat du canal. Pour la couverture smoke
CI, ajoutez le serveur fournisseur local Crabline correspondant et exposez-le
via le pilote `crabline`.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins runner possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment le Gateway est configuré pour ce transport
- comment la readiness est vérifiée
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage propre au transport est géré

Le seuil d’adoption minimal pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine `qa` partagée.
2. Implémenter le runner de transport sur la jonction d’hôte partagée `qa-lab`.
3. Garder les mécanismes propres au transport dans le Plugin runner ou le harness de canal.
4. Monter le runner comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les Plugins runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios YAML dans les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, gardez-le dans ce Plugin runner ou harness de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez un helper générique au lieu d’une branche propre au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un transport, gardez le scénario propre au transport et rendez-le explicite dans le contrat du scénario.

### Noms des helpers de scénario

Helpers génériques recommandés pour les nouveaux scénarios :

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

Les alias de compatibilité restent disponibles pour les scénarios existants -
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` - mais la rédaction de nouveaux
scénarios doit utiliser les noms génériques. Les alias existent pour éviter une
migration en une seule bascule, pas comme modèle à suivre.

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie de bus observée.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi méritent d’être ajoutés

Pour l’inventaire des scénarios disponibles - utile pour dimensionner le travail de suivi ou câbler un nouveau transport - exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).
Lorsque vous choisissez une preuve ciblée pour un comportement ou un chemin de fichier touché, exécutez `pnpm openclaw qa coverage --match <query>`.
Le rapport de correspondance recherche dans les métadonnées de scénario, les références de documentation, les références de code, les ID de couverture, les Plugins et les exigences de fournisseur, puis imprime les cibles `qa suite --scenario ...` correspondantes.
Chaque exécution de `qa suite` écrit les artefacts de premier niveau
`qa-evidence.json`, `qa-suite-summary.json` et `qa-suite-report.md` pour
l’ensemble de scénarios sélectionné. Les scénarios qui déclarent
`execution.kind: vitest` ou `execution.kind: playwright` exécutent le chemin de
test correspondant et écrivent également des journaux par scénario. Les
scénarios qui déclarent `execution.kind: script` exécutent le producteur de
preuve à `execution.path` via `node --import tsx` (avec `${outputDir}` et
`${scenarioId}` développés dans `execution.args`) ; le producteur écrit son
propre `qa-evidence.json`, dont les entrées sont importées dans la sortie de
suite et dont les chemins d’artefact sont résolus relativement au
`qa-evidence.json` de ce producteur. Lorsque `qa suite` est atteint via
`qa run --qa-profile`, le même `qa-evidence.json` inclut également le résumé de
scorecard de profil pour les catégories de taxonomie sélectionnées.
Traitez-le comme une aide à la découverte, pas comme un remplacement de gate ; le scénario sélectionné nécessite toujours le bon mode fournisseur, le transport live, Multipass, Testbox ou la voie de release pour le comportement testé.
Pour le contexte de scorecard, consultez [Scorecard de maturité](/fr/maturity/scorecard).

Pour les contrôles de caractère et de style, exécutez le même scénario sur
plusieurs références de modèles live et écrivez un rapport Markdown jugé :

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

La commande exécute des processus enfants locaux du gateway QA, pas Docker. Les scénarios
d’évaluation de personnage doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme la conversation, l’aide sur l’espace de travail et de petites tâches sur les fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande conserve chaque transcription complète,
enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec un raisonnement
`xhigh` lorsque pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours
chaque transcription et chaque état d’exécution, mais les références candidates sont remplacées par des libellés neutres
comme `candidate-01` ; le rapport associe les classements aux vraies références après
l’analyse.
Les exécutions candidates utilisent par défaut une réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat précis en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un
repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge précis nécessite un remplacement. Passez `--fast` uniquement lorsque vous voulez
forcer le mode rapide pour tous les modèles candidats. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux une concurrence de 16 par défaut. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la
pression du gateway local rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de personnage utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-8,thinking=high`.

## Docs connexes

- [QA matricielle](/fr/concepts/qa-matrix)
- [Grille de maturité](/fr/maturity/scorecard)
- [Pack de benchmark d’agent personnel](/fr/concepts/personal-agent-benchmark-pack)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)
