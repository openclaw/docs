---
read_when:
    - Exécuter les tests localement ou en intégration continue
    - Ajout de tests de régression pour les bogues de modèle/fournisseur
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécutants Docker et couverture de chaque test'
title: Tests
x-i18n:
    generated_at: "2026-05-05T06:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw comporte trois suites Vitest (unitaire/intégration, e2e, live) et un petit ensemble
d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des exécuteurs Docker/Parallels. La section sur les exécuteurs spécifiques à la QA ci-dessous ([Exécuteurs spécifiques à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Gate complet (attendu avant un push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution complète plus rapide en local sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers achemine aussi désormais les chemins d’extensions/canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Privilégiez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quand vous touchez aux tests ou voulez plus de confiance :

- Gate de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles + sondes Gateway outil/image) : `pnpm test:live`
- Cibler un fichier live en mode silencieux : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performances d’exécution : déclenchez `OpenClaw Performance` avec
  `live_gpt54=true` pour un tour d’agent réel `openai/gpt-5.4` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace Kova. Les exécutions quotidiennes planifiées
  publient les artefacts des voies fournisseur simulé, profil profond et GPT 5.4 vers
  `openclaw/clawgrit-reports` lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport fournisseur simulé inclut aussi les chiffres de démarrage Gateway au niveau source, de mémoire,
  de pression Plugin, de boucle hello fake-model répétée et de démarrage CLI.
- Balayage Docker des modèles live : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des jobs de matrice Docker de modèles live séparés,
    partitionnés par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/release.
- Smoke de discussion liée Codex native : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin app-server Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison Plugin native au lieu d’ACP.
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute les tours d’agent Gateway via le harnais app-server Codex appartenant au Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    MCP Cron, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs
    app-server Codex. Pour une vérification sous-agent ciblée, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in de précaution de la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file d’attente un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec une fausse CLI Claude dans `PATH`
    et vérifie que le repli du planificateur approximatif se traduit par une écriture de configuration typée
    auditée.
- Smoke Docker du premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, achemine `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un cas en échec, privilégiez le rétrécissement des tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs spécifiques à la QA

Ces commandes complètent les suites de tests principales lorsque vous avez besoin du réalisme QA Lab :

CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de release, et non dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des release-checks. Les vérifications de release stables/par défaut
gardent le trempage live/Docker exhaustif derrière `run_release_soak=true` ; le
profil `full` force l’activation du trempage. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis un déclenchement manuel avec la voie de parité simulée, la voie
Matrix live, la voie Telegram live gérée par Convex et la voie Discord
live gérée par Convex sous forme de jobs parallèles. Les vérifications QA planifiées et de release passent explicitement
Matrix `--profile fast`, tandis que la CLI Matrix et l’entrée du workflow manuel
restent par défaut sur `all` ; le déclenchement manuel peut partitionner `all` en jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité plus les voies Matrix rapide et Telegram avant l’approbation de release,
en utilisant `mock-openai/gpt-5.5` pour les vérifications de transport de release afin qu’elles restent
déterministes et évitent le démarrage normal du Plugin fournisseur. Ces Gateway de transport live
désactivent la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les partitions live media de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui dispose déjà de
`ffmpeg` et `ffprobe`. Les partitions Docker de modèles/backends live utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une seule fois par commit sélectionné,
puis la téléchargent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque partition.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (limitée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie sérielle.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez obtenir les artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` lance un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    des fixtures et des mocks de protocole sans remplacer la voie `mock-openai`
    sensible aux scénarios.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute le parcours complet live du Plugin OpenAI Kitchen Sink via QA Lab. Il
    installe le package Kitchen Sink externe, vérifie l’inventaire de la surface du SDK Plugin,
    sonde `/healthz` et `/readyz`, enregistre des preuves CPU/RSS du Gateway,
    exécute un tour OpenAI live et vérifie les diagnostics adversariaux.
    Nécessite une authentification OpenAI live comme `OPENAI_API_KEY`. Dans les sessions Testbox
    hydratées, il source automatiquement le profil d’authentification live Testbox lorsque l’assistant
    `openclaw-testbox-env` est présent.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway plus un petit pack de scénarios mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale par défaut uniquement les observations de CPU chaud soutenues (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les brefs pics de démarrage soient enregistrés comme métriques
    sans ressembler à la régression de Gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts `dist` générés ; lancez d’abord un build lorsque le checkout ne dispose pas
    déjà d’une sortie d’exécution fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes flags de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge et pratiques pour l’invité :
    clés fournisseur basées sur l’env, chemin de configuration du fournisseur QA live, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal, le résumé et les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive tar npm depuis le checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif avec clé API OpenAI, configure Telegram
    par défaut, vérifie que le runtime Plugin packagé se charge sans réparation de dépendances
    au démarrage, exécute doctor, puis exécute un tour d’agent local contre un
    endpoint OpenAI mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation packagée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application construite pour les transcripts de contexte runtime
    intégré. Il vérifie que le contexte runtime OpenClaw masqué est persisté comme
    message personnalisé non affiché au lieu de fuiter dans le tour utilisateur visible,
    puis amorce un JSONL de session cassé affecté et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un package candidat OpenClaw dans Docker, exécute l’onboarding du package installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram live
    avec ce package installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive tar locale résolue au lieu d’une
    installation depuis le registre.
  - Utilise les mêmes identifiants env Telegram ou source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne Convex automatiquement.
  - Le wrapper valide l’env d’identifiants Telegram ou Convex sur l’hôte avant le
    travail de build/installation Docker. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lors du débogage volontaire de la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Il ne s’exécute pas à la fusion. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose aussi `Package Acceptance` pour une preuve produit en exécution latérale
  contre un package candidat. Il accepte une ref de confiance, une spécification npm publiée,
  une URL d’archive tar HTTPS avec SHA-256, ou un artefact d’archive tar depuis une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec les profils de voie smoke, package, produit, complet ou personnalisé.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le workflow QA
  Telegram contre le même artefact `package-under-test`.
  - Preuve produit de la dernière bêta :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La preuve par URL exacte d’archive tar nécessite un condensat :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La preuve par artefact télécharge un artefact d’archive tar depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Package et installe la build OpenClaw courante dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les channels/Plugins groupés via des modifications
    de config.
  - Vérifie que la découverte de configuration laisse absents les Plugins téléchargeables non configurés,
    que la première réparation doctor configurée installe explicitement chaque Plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendances
    masquée.
  - Installe aussi une ancienne baseline npm connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour
    du candidat nettoie les débris de dépendances Plugin héritées sans
    réparation postinstall côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke de mise à jour d’installation packagée native sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package baseline demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du Gateway et un tour d’agent
    local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un seul invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par voie.
  - La voie OpenAI utilise `openai/gpt-5.5` pour la preuve de tour d’agent live par
    défaut. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez volontairement un autre
    modèle OpenAI.
  - Encadrez les longues exécutions locales avec un timeout hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux de voie imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans le doctor post-mise à jour et le travail de
    mise à jour du package sur un invité froid ; cela reste sain lorsque le journal de débogage npm
    imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision lors de
    la restauration de snapshot, du service de package ou de l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des Plugins groupés, car
    les façades de capacité telles que la parole, la génération d’images et la compréhension
    média sont chargées via les API runtime groupées même lorsque le tour d’agent
    lui-même ne vérifie qu’une simple réponse textuelle.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour des tests smoke directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker. Checkout source uniquement — les installations packagées n’expédient pas `qa-lab`.
  - CLI complète, catalogue profil/scénario, variables d’env et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé à l’aide des tokens des bots driver et SUT provenant de l’env.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id de chat numérique Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les baux mutualisés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez obtenir les artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez le mode de communication bot à bot dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT depuis la requête d’envoi du driver jusqu’à la réponse SUT observée.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [vue d’ensemble QA → couverture de transport live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la suite synthétique large et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie des Heartbeat
pour ce bail pendant l’exécution de la voie, puis libère le bail à l’arrêt.

Scaffold de référence du projet Convex :

- `qa/convex-credential-broker/`

Variables d’env requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur env par défaut : `OPENCLAW_QA_CREDENTIAL_ROLE` (valeur par défaut `ci` en CI, `maintainer` sinon)

Variables d’env facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valeur par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valeur par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valeur par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valeur par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valeur par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en local loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration des mainteneurs (pool add/remove/list) nécessitent spécifiquement
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du broker,
le préfixe d’endpoint, le délai d’expiration HTTP et l’accessibilité admin/list sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les
utilitaires CI.

Contrat d’endpoint par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Épuisé/réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Protection de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme du payload pour le kind Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un canal à QA

L’architecture et les noms d’assistants de scénario pour les nouveaux adaptateurs de canal se trouvent dans [Vue d’ensemble QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le minimum requis : implémenter le runner de transport sur la seam d’hôte `qa-lab` partagée, déclarer `qaRunners` dans le manifeste du plugin, monter en tant que `openclaw qa <runner>` et rédiger les scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (avec une instabilité et un coût croissants) :

### Unitaires / intégration (par défaut)

- Commande : `pnpm test`
- Config : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer les shards multiprojets en configs par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration in-process (authentification Gateway, routage, outils, analyse, config)
  - Régressions déterministes pour des bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests de résolveur et de chargeur de surface publique doivent prouver le comportement de repli large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugin générées, pas avec
    de vraies API source de plugin intégré. Les chargements réels d’API de plugin appartiennent aux
    suites de contrat/intégration possédées par le plugin.

<AccordionGroup>
  <Accordion title="Projets, shards et lanes limitées">

    - `pnpm test` non ciblé exécute douze configs de shard plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique énorme processus natif de projet racine. Cela réduit le RSS de pointe sur les machines chargées et évite que les travaux auto-reply/extension affament des suites non liées.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multishard n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichier/répertoire par des lanes limitées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` développe par défaut les chemins git modifiés en lanes limitées peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, mappings source explicites et dépendants du graphe d’import local. Les modifications de config/setup/package ne lancent pas de tests larges, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de vérification locale intelligente normale pour le travail étroit. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour la preuve de test. Les montées de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine, avec une garde qui rejette les changements de package en dehors du champ de version de premier niveau.
    - Les modifications du harnais ACP Docker live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’auth Docker live et dry-run du planificateur Docker live. Les changements de `package.json` ne sont inclus que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendance, d’export, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en imports provenant des agents, commandes, plugins, assistants auto-reply, `plugin-sdk` et zones similaires d’utilitaires purs passent par la lane `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en runtime restent sur les lanes existantes.
    - Certains fichiers source d’assistants `plugin-sdk` et `commands` mappent aussi les exécutions en mode changed vers des tests frères explicites dans ces lanes légères, afin que les modifications d’assistants évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les assistants core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en plus le sous-arbre reply en shards agent-runner, dispatch et commands/state-routing afin qu’un compartiment lourd en imports ne possède pas toute la traîne Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lots des extensions et le shard `agentic-plugins` réservé aux releases. Full Release Validation déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de release.

  </Accordion>

  <Accordion title="Couverture du runner intégré">

    - Lorsque vous modifiez les entrées de découverte de message-tool ou le contexte runtime de compaction,
      conservez les deux niveaux de couverture.
    - Ajoutez des régressions d’assistants ciblées pour les limites pures de routage et de normalisation.
    - Maintenez les suites d’intégration du runner intégré en bon état :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants limités et le comportement de Compaction passent toujours
      par les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux assistants ne sont
      pas un substitut suffisant à ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool Vitest et de l’isolation">

    - La config Vitest de base utilise `threads` par défaut.
    - La config Vitest partagée fixe `isolate: false` et utilise le runner
      non isolé dans les projets racine, e2e et configs live.
    - La lane UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute aussi sur le
      runner non isolé partagé.
    - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la config Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut aux processus Node enfants de Vitest
      afin de réduire le churn de compilation V8 pendant les grosses exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer au comportement V8 standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` montre quelles lanes architecturales un diff déclenche.
    - Le hook pre-commit ne fait que le formatage. Il remet en stage les fichiers formatés et
      n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant la remise ou le push lorsque vous
      avez besoin de la porte de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des lanes limitées peu coûteuses. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, config, package ou contrat nécessite vraiment une couverture
      Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec un plafond de workers plus élevé.
    - L’auto-scaling local des workers est volontairement conservateur et recule
      lorsque la moyenne de charge de l’hôte est déjà élevée, afin que plusieurs exécutions Vitest
      concurrentes fassent moins de dégâts par défaut.
    - La config Vitest de base marque les projets/fichiers de config comme
      `forceRerunTriggers` afin que les relances en mode changed restent correctes lorsque le câblage
      de test change.
    - La config garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes
      pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite unique pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage perf">

    - `pnpm test:perf:imports` active le rapport de durée d’import Vitest ainsi que
      la sortie de ventilation des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de timing des shards sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de config complète utilisent le chemin de config comme clé ; les shards CI
      à motif d’inclusion ajoutent le nom du shard afin que les shards filtrés puissent être suivis
      séparément.
    - Lorsqu’un test chaud passe encore la plupart de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière une seam locale étroite `*.runtime.ts` et
      mockez cette seam directement au lieu de deep-importer des assistants runtime uniquement
      pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif de projet racine pour ce diff commité
      et affiche le temps réel ainsi que le RSS max macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre courant
      sale en routant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la config Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      le démarrage Vitest/Vite et le surcoût de transformation.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la
      suite unitaire avec le parallélisme par fichier désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Config : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un vrai Gateway loopback avec les diagnostics activés par défaut
  - Fait passer un churn synthétique de messages Gateway, mémoire et payloads volumineux par le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance du bundle de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clé
  - Lane étroite pour le suivi de régression de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E de Plugins groupés sous `extensions/`
- Valeurs par défaut d’exécution :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire la surcharge d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement de bout en bout du Gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et mise en réseau plus lourde
- Attentes :
  - S’exécute dans la CI (lorsqu’activé dans le pipeline)
  - Aucune clé réelle requise
  - Plus d’éléments mobiles que les tests unitaires (peut être plus lent)

### E2E : test de fumée du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée une sandbox depuis un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via une vraie configuration `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs de la sandbox
- Attentes :
  - Activation explicite uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Utilise `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et la sandbox
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper

### Tests en conditions réelles (fournisseurs réels + modèles réels)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests en conditions réelles de Plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vraies informations d’identification ? »
  - Détecter les changements de format fournisseur, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions en conditions réelles sourcent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions en conditions réelles isolent toujours `HOME` et copient les éléments de configuration/authentification dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez volontairement besoin que les tests en conditions réelles utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et met en sourdine les journaux d’amorçage du Gateway/le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer l’intégralité des journaux de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge par exécution en conditions réelles via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie progression/Heartbeat :
  - Les suites en conditions réelles émettent désormais des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions en conditions réelles.
  - Ajustez les Heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeats Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification de la mise en réseau du Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est indisponible » / échecs propres à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests en conditions réelles (touchant le réseau)

Pour la matrice de modèles en conditions réelles, les tests de fumée du backend CLI, les tests de fumée ACP, le harnais de serveur d’application Codex et tous les tests en conditions réelles de fournisseurs média (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média), ainsi que la gestion des informations d’identification pour les exécutions en conditions réelles, consultez
[Tester les suites en conditions réelles](/fr/help/testing-live). Pour la checklist dédiée de mise à jour et de validation de Plugin, consultez
[Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

## Runners Docker (vérifications facultatives « fonctionne sous Linux »)

Ces runners Docker se répartissent en deux catégories :

- Runners de modèles en conditions réelles : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier en conditions réelles correspondant à la clé de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker en conditions réelles utilisent par défaut un plafond de test de fumée plus petit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker en conditions réelles une fois via `test:docker:live-build`, empaquette OpenClaw une fois comme archive npm via `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue est seulement le runner Node/Git pour les voies installation/mise à jour/dépendance de Plugin ; ces voies montent l’archive préconstruite. L’image fonctionnelle installe la même archive dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les voies lourdes en conditions réelles, d’installation npm et multiservice de démarrer toutes en même temps. Si une seule voie est plus lourde que les plafonds actifs, le planificateur peut tout de même la démarrer lorsque le pool est vide, puis la maintenir seule en cours d’exécution jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. Le runner effectue une pré-vérification Docker par défaut, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les temps des voies réussies dans `.artifacts/docker-tests/lane-timings.json` et utilise ces durées pour démarrer d’abord les voies plus longues lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des voies sélectionnées, des besoins en package/image et des informations d’identification.
- `Package Acceptance` est le gate de package natif GitHub pour « cette archive installable fonctionne-t-elle comme un produit ? ». Il résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse comme `package-under-test`, puis exécute les voies Docker E2E réutilisables contre cette archive exacte au lieu de réempaqueter la référence sélectionnée. Les profils sont ordonnés par étendue : `smoke`, `package`, `product` et `full`. Consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins) pour le contrat package/mise à jour/Plugin, la matrice de survie des mises à niveau publiées, les valeurs par défaut de publication et le triage des échecs.
- Les vérifications de build et de release exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe construit statique depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant dispatch importe des dépendances de package telles que Commander, l’UI de prompt, undici ou la journalisation avant le dispatch de commande ; il maintient également le chunk d’exécution du Gateway groupé sous budget et rejette les imports statiques de chemins Gateway froids connus. Le test de fumée de la CLI empaquetée couvre également l’aide racine, l’aide d’onboarding, l’aide de doctor, l’état, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette date limite, le harnais tolère uniquement les lacunes de métadonnées de packages expédiés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de correctif manquants dans la fixture git dérivée de l’archive, `update.channel` persisté manquant, emplacements hérités des enregistrements d’installation de Plugin, persistance manquante des enregistrements d’installation de marketplace et migration des métadonnées de configuration pendant `plugins update`. Pour les packages après `2026.4.25`, ces chemins sont des échecs stricts.
- Runners de tests de fumée de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de plus haut niveau.

Les runners Docker de modèles en conditions réelles montent également en bind uniquement les répertoires home d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Test smoke d’observabilité : `pnpm qa:otel:smoke` est une voie de vérification privée QA depuis une extraction source. Elle ne fait volontairement pas partie des voies de publication Docker de package, car l’archive tarball npm omet QA Lab.
- Test smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test smoke d’onboarding/canal/agent de l’archive tarball npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker l’archive tarball OpenClaw packagée, configure OpenAI via un onboarding par référence d’environnement ainsi que Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez une archive tarball préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Test smoke de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement dans Docker l’archive tarball OpenClaw packagée, bascule du package `stable` vers git `dev`, vérifie le canal persistant et le fonctionnement du Plugin après mise à jour, puis rebascule vers le package `stable` et vérifie l’état de mise à jour.
- Test smoke de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive tarball OpenClaw packagée par-dessus un ancien jeu de données utilisateur modifié avec des agents, une configuration de canal, des listes d’autorisation de Plugin, un état obsolète de dépendances de Plugin et des fichiers d’espace de travail/session existants. Il exécute la mise à jour du package ainsi que doctor en mode non interactif sans clés de fournisseur live ni de canal, puis démarre un Gateway local loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/d’état.
- Test smoke publié de survie à la mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, initialise des fichiers utilisateur existants réalistes, configure cette base avec une recette de commande intégrée, valide la configuration obtenue, met à jour cette installation publiée vers l’archive tarball candidate, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway local loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz` et les budgets d’état RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre les bases locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et étendez les jeux de données de type issue avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` comme `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique des installations de Plugins OpenClaw externes. Package Acceptance expose ces éléments sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, résout les jetons de base méta comme `last-stable-4` ou `all-since-2026.4.23`, et Full Release Validation étend la porte package release-soak à `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Test smoke du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance de la transcription du contexte d’exécution masqué ainsi que la réparation par doctor des branches dupliquées de réécriture de prompt concernées.
- Test smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre actuel, l’installe avec `bun install -g` dans un répertoire personnel isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de rester bloqué. Réutilisez une archive tarball préconstruite avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test smoke Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, update et direct-npm. Le test smoke de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers l’archive tarball candidate. Remplacez avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installateur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local à l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe de `npm install -g` est nécessaire.
- Test smoke CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit l’image Dockerfile racine par défaut, initialise deux agents avec un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json`, puis vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test smoke d’instantané CDP du navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP couvrent les URL de liens, les éléments cliquables promus par curseur, les références d’iframe et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + test smoke allow/deny du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (Gateway réel + démontage de processus enfant MCP stdio après des exécutions cron isolées et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances remontées, références git mobiles, ClawHub kitchen-sink, mises à jour de marketplace et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire package/runtime kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de jeu de données ClawHub local hermétique.
- Test smoke de mise à jour inchangée de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test smoke de matrice de cycle de vie de Plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe l’archive tarball OpenClaw packagée dans un conteneur nu, installe un Plugin npm, bascule activation/désactivation, le met à niveau puis le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Test smoke des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre les tests smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances remontées, références git mobiles, jeux de données ClawHub, mises à jour de marketplace et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les Plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation en cas de code manquant d’un Plugin npm avec suivi des ressources.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles, car ils valident le comportement de package/d’installation plutôt que l’exécution d’application construite partagée.

Les exécuteurs Docker pour modèles live montent aussi le checkout courant en lecture seule et
le préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest sur votre source/config locale exacte.
L’étape de préparation ignore les grands caches locaux uniquement et les sorties de build d’app,
comme `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie
`.build` propres aux apps ou Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier
des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live du gateway ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live du gateway
de cette voie Docker.
`test:docker:openwebui` est un smoke test de compatibilité de plus haut niveau : il démarre un
conteneur de gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway avec données initiales,
démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte des conversations routées, la lecture des transcriptions, les métadonnées des pièces jointes,
le comportement de la file d’événements live, le routage des envois sortants, ainsi que les notifications de canal +
permission façon Claude via le vrai bridge MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes, afin que le smoke valide ce que le
bridge émet réellement, et pas seulement ce qu’un SDK client précis expose par hasard.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle live.
Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp`, tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway avec données initiales et un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel ACP de thread en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être à nouveau nécessaire pour la validation du routage de thread ACP ; ne le supprimez donc pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires de configuration/espace de travail temporaires et aucun montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à un fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de réexécutions qui ne nécessitent pas de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profil (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification par nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence des docs

Exécutez les vérifications de docs après les modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez aussi vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outil Gateway (OpenAI simulé, vrai gateway + boucle agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écrit la config + auth appliquée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Appel d’outil simulé via le vrai gateway + boucle agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour Skills (voir [Skills](/fr/tools/skills)) :

- **Décision :** lorsque des Skills sont listées dans le prompt, l’agent choisit-il la bonne Skills (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la continuité de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent rester déterministes d’abord :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + l’ordre, les lectures de fichiers de Skills et le câblage de session.
- Une petite suite de scénarios centrés sur Skills (utiliser vs éviter, garde-fous, injection de prompt).
- Des évaluations live optionnelles (opt-in, contrôlées par l’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme Plugin et canal)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils parcourent tous les Plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire `pnpm test` par défaut
ignore intentionnellement ces fichiers partagés de smoke et de jonction ; exécutez explicitement
les commandes de contrat lorsque vous touchez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canal uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseur uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de Plugin de base (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile de message
- **inbound** - Traitement des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de thread
- **directory** - API d’annuaire/liste des participants
- **group-policy** - Application de la politique de groupe

### Contrats de statut des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre de Plugins

### Contrats de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat de flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte de Plugin
- **loader** - Chargement de Plugin
- **runtime** - Runtime fournisseur
- **shape** - Forme/interface de Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après avoir modifié les exports ou sous-chemins de plugin-sdk
- Après avoir ajouté ou modifié un Plugin de canal ou de fournisseur
- Après avoir refactorisé l’enregistrement ou la découverte de Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (fournisseur mock/stub, ou capture de la transformation exacte de forme de requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live ciblé et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui attrape le bug :
  - bug de conversion/relecture de requête fournisseur → test direct de modèles
  - bug de pipeline session/historique/outil du gateway → smoke live gateway ou test mock gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées de registre (`listSecretTargetRegistryEntries()`), puis vérifie que les ids exec avec segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les ids de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tester en live](/fr/help/testing-live)
- [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
