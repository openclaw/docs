---
read_when:
    - Exécution des tests localement ou en CI
    - Ajout de tests de régression pour les bogues de modèle/fournisseur
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/en direct, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-05-05T01:48:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unitaire/intégration, e2e, live) et d’un petit ensemble d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des exécuteurs Docker/Parallels. La section des exécuteurs propres à la QA ci-dessous ([Exécuteurs propres à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Garde complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de toute la suite sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers achemine maintenant aussi les chemins d’extensions/canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Privilégiez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou souhaitez davantage de confiance :

- Garde de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performance d’exécution : déclencher `OpenClaw Performance` avec
  `live_gpt54=true` pour un tour d’agent réel `openai/gpt-5.4` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace Kova. Les exécutions planifiées quotidiennes
  publient les artefacts des voies fournisseur simulé, profil profond et GPT 5.4 vers
  `openclaw/clawgrit-reports` lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport fournisseur simulé inclut aussi des mesures au niveau source sur le démarrage Gateway, la mémoire,
  la pression des plugins, la boucle répétée hello-loop de faux modèle et le démarrage CLI.
- Balayage de modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute maintenant un tour de texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour d’image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs de fournisseur.
  - Couverture CI : les vérifications quotidiennes `OpenClaw Scheduled Live And E2E Checks` et manuelles
    `OpenClaw Release Checks` appellent toutes deux le workflow réutilisable live/E2E avec
    `include_live_suites: true`, ce qui inclut des jobs de matrice de modèles live Docker distincts
    découpés par fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de publication.
- Smoke de conversation liée Codex natif : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin serveur d’application Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et qu’une pièce jointe image
    transitent par la liaison Plugin native au lieu d’ACP.
- Smoke du harnais serveur d’application Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais serveur d’application Codex détenu par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    Cron MCP, sous-agent et Guardian. Désactivez la sonde de sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs du
    serveur d’application Codex. Pour une vérification ciblée du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela se termine après la sonde de sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in redondante pour la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file d’attente un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec une fausse CLI Claude dans le `PATH`
    et vérifie que le repli du planificateur approximatif se traduit par une écriture de configuration typée auditée.
- Smoke Docker de première exécution Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, achemine `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que le
  transcript de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un cas en échec, privilégiez le ciblage des tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à la QA

Ces commandes accompagnent les suites de tests principales lorsque vous avez besoin du réalisme de QA-lab :

La CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de publication, pas dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des vérifications de publication. Les vérifications de publication stables/par défaut
gardent le soak live/Docker exhaustif derrière `run_release_soak=true` ; le
profil `full` force l’activation du soak. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis un déclenchement manuel avec la voie de parité simulée, la voie Matrix live, la voie Telegram live gérée par Convex et la voie Discord live gérée par Convex comme jobs parallèles. La QA planifiée et les vérifications de publication passent Matrix
`--profile fast` explicitement, tandis que la CLI Matrix et l’entrée de workflow manuelle
restent par défaut sur `all` ; un déclenchement manuel peut découper `all` en jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité plus les voies Matrix rapide et Telegram avant l’approbation de publication,
en utilisant `mock-openai/gpt-5.5` pour les vérifications de transport de publication afin qu’elles restent
déterministes et évitent le démarrage normal du Plugin fournisseur. Ces passerelles de transport live
désactivent la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les shards de médias live de publication complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui contient déjà
`ffmpeg` et `ffprobe`. Les shards de modèles/backends live Docker utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit sélectionné,
puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque shard.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des workers
    Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (limitée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le
    nombre de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local adossé à AIMock pour une couverture expérimentale
    des fixtures et des mocks de protocole sans remplacer la voie `mock-openai` sensible aux scénarios.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute le parcours d’épreuves live du Plugin OpenAI Kitchen Sink via QA Lab. Il
    installe le paquet Kitchen Sink externe, vérifie l’inventaire de la surface du SDK de plugin,
    sonde `/healthz` et `/readyz`, enregistre les preuves CPU/RSS du Gateway,
    exécute un tour OpenAI live et vérifie les diagnostics adversariaux.
    Nécessite une authentification OpenAI live comme `OPENAI_API_KEY`. Dans les sessions Testbox
    hydratées, il source automatiquement le profil d’authentification live Testbox lorsque l’assistant
    `openclaw-testbox-env` est présent.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway plus un petit ensemble de scénarios QA Lab simulés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale par défaut uniquement les observations de CPU chaud soutenu (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les courts pics de démarrage soient enregistrés comme métriques
    sans ressembler à la régression de Gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; exécutez d’abord une construction lorsque le checkout ne
    dispose pas déjà d’une sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection de fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge et pratiques pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur QA live, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit un tarball npm à partir du checkout actuel, l’installe globalement dans
    Docker, exécute l’onboarding non interactif par clé d’API OpenAI, configure Telegram
    par défaut, vérifie que le runtime de plugin empaqueté se charge sans réparation de dépendances
    au démarrage, exécute doctor, puis exécute un tour d’agent local contre un
    endpoint OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application construite pour les transcriptions de contexte runtime
    embarqué. Il vérifie que le contexte runtime OpenClaw masqué est persisté comme un
    message personnalisé non affiché au lieu de fuir dans le tour utilisateur visible,
    puis initialise une session JSONL cassée affectée et vérifie que
    `openclaw doctor --fix` la réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un paquet candidat OpenClaw dans Docker, exécute l’onboarding du paquet installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram live
    avec ce paquet installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester un tarball local résolu au lieu
    d’installer depuis le registre.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide l’environnement des identifiants Telegram ou Convex sur l’hôte avant
    le travail de construction/installation Docker. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lors du débogage volontaire de la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow manuel mainteneur
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors d’un merge. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose également `Package Acceptance` pour une preuve produit exécutée en parallèle
  contre un paquet candidat. Il accepte une ref de confiance, une spécification npm publiée,
  une URL de tarball HTTPS plus SHA-256, ou un artefact tarball d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec des profils de voie smoke, package, product, full ou custom.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le
  workflow QA Telegram contre le même artefact `package-under-test`.
  - Preuve produit de la dernière bêta :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La preuve par URL exacte de tarball nécessite un condensat :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La preuve par artefact télécharge un artefact tarball depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Emballe et installe la construction OpenClaw actuelle dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les canaux/plugins groupés via des modifications
    de configuration.
  - Vérifie que la découverte de configuration laisse absents les plugins téléchargeables non configurés,
    que la première réparation doctor configurée installe explicitement chaque plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendances masquée.
  - Installe également une ancienne baseline npm connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour du candidat
    nettoie les débris de dépendances de plugin hérités sans réparation postinstall côté
    harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation empaquetée sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le paquet baseline demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, le statut de mise à jour, la disponibilité du Gateway et un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    le statut par voie.
  - La voie OpenAI utilise par défaut `openai/gpt-5.5` pour la preuve de tour d’agent live.
    Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez volontairement un autre
    modèle OpenAI.
  - Encapsulez les longues exécutions locales dans un timeout hôte afin que les blocages de transport
    Parallels ne consomment pas le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de voie imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans doctor post-mise à jour et le travail de
    mise à jour de paquet sur un invité froid ; cela reste sain lorsque le journal de débogage npm
    imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision sur
    la restauration d’instantané, la diffusion de paquet ou l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés, car
    les façades de capacité comme la parole, la génération d’images et la compréhension
    multimédia sont chargées via les API runtime groupées même lorsque le tour
    d’agent lui-même ne vérifie qu’une simple réponse texte.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur de fournisseur AIMock local pour les tests smoke directs
    du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un serveur domestique Tuwunel jetable adossé à Docker. Checkout source uniquement — les installations empaquetées ne livrent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé avec les jetons du bot pilote et du bot SUT provenant de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants groupés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour des baux groupés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT entre la requête d’envoi du pilote et la réponse SUT observée.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [vue d’ensemble QA → Couverture du transport live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la suite synthétique large et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie des heartbeats
pour ce bail pendant l’exécution de la voie, et libère le bail à l’arrêt.

Échafaudage du projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut env : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, sinon `maintainer`)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en local loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration pour les mainteneurs (pool add/remove/list) exigent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions en conditions réelles pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe d’endpoint, le délai d’expiration HTTP et l’accessibilité admin/list sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les utilitaires
de CI.

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
  - Protection contre un bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme du payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant de discussion Telegram numérique.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un canal à la QA

L’architecture et les noms d’assistants de scénarios pour les nouveaux adaptateurs de canal se trouvent dans [Vue d’ensemble QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le minimum requis : implémenter le lanceur de transport sur la couture d’hôte partagée `qa-lab`, déclarer `qaRunners` dans le manifeste du plugin, monter sous `openclaw qa <runner>` et écrire les scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaires / intégration (par défaut)

- Commande : `pnpm test`
- Config : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer des shards multiprojets en configs par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration in-process (authentification du Gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de repli large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugin générées, et non
    les vraies API sources de plugins intégrés. Les chargements de vraies API de plugins appartiennent aux
    suites de contrat/intégration possédées par les plugins.

<AccordionGroup>
  <Accordion title="Projets, shards et voies à portée limitée">

    - `pnpm test` non ciblé exécute douze configs de shards plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un énorme processus natif de projet racine. Cela réduit le pic RSS sur les machines chargées et évite que le travail auto-reply/extension affame les suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle de surveillance multi-shard n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers/répertoires par des voies à portée limitée, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` développe par défaut les chemins git modifiés en voies à portée limitée peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, mappages source explicites et dépendants locaux du graphe d’importation. Les modifications de config/setup/package ne lancent pas de tests larges, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la barrière normale de vérification locale intelligente pour les travaux étroits. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker réel et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou `pnpm test <target>` explicite pour une preuve de test. Les augmentations de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine, avec une garde qui rejette les changements de package en dehors du champ de version de premier niveau.
    - Les modifications du harnais Docker ACP réel exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker réels et dry-run du planificateur Docker réel. Les changements de `package.json` ne sont inclus que lorsque le diff se limite à `scripts["test:docker:live-*"]` ; les modifications de dépendances, exports, version et autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en imports depuis les agents, commandes, plugins, assistants auto-reply, `plugin-sdk` et zones d’utilitaires purs similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en runtime restent sur les voies existantes.
    - Certains fichiers sources d’assistants `plugin-sdk` et `commands` sélectionnés mappent également les exécutions en mode changed vers des tests frères explicites dans ces voies légères, de sorte que les modifications d’assistants évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de buckets dédiés pour les assistants core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en plus le sous-arbre reply en shards agent-runner, dispatch et commands/state-routing afin qu’un bucket lourd en imports ne possède pas toute la queue Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lots des extensions et le shard `agentic-plugins` réservé aux releases. La Full Release Validation déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de release.

  </Accordion>

  <Accordion title="Couverture du lanceur intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte runtime de Compaction,
      conservez les deux niveaux de couverture.
    - Ajoutez des régressions d’assistants ciblées pour les frontières pures de routage et de normalisation.
    - Gardez les suites d’intégration du lanceur intégré en bon état :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants à portée limitée et le comportement de Compaction passent toujours
      par les vrais chemins `run.ts` / `compact.ts` ; les tests uniquement sur assistants ne sont
      pas un substitut suffisant à ces chemins d’intégration.

  </Accordion>

  <Accordion title="Pool Vitest et valeurs par défaut d’isolation">

    - La config Vitest de base utilise `threads` par défaut.
    - La config Vitest partagée fixe `isolate: false` et utilise le
      lanceur non isolé dans les projets racine, les configs e2e et les configs réelles.
    - La voie UI racine conserve son setup `jsdom` et son optimiseur, mais s’exécute elle aussi sur le
      lanceur partagé non isolé.
    - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la config Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut aux processus Node
      enfants de Vitest afin de réduire le renouvellement de compilation V8 pendant les grandes exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8
      standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` montre quelles voies architecturales un diff déclenche.
    - Le hook pre-commit ne fait que le formatage. Il remet en staging les fichiers formatés et
      n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant la remise ou le push lorsque vous
      avez besoin de la barrière de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies à portée limitée peu coûteuses. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, config, package ou contrat a vraiment besoin d’une couverture
      Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec une limite de workers plus élevée.
    - L’auto-ajustement local des workers est intentionnellement conservateur et réduit la voilure
      lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions
      Vitest concurrentes causent moins de dommages par défaut.
    - La config Vitest de base marque les projets/fichiers de config comme
      `forceRerunTriggers` afin que les réexécutions en mode changed restent correctes lorsque le câblage
      des tests change.
    - La config garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ;
      définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport de durée des imports Vitest ainsi que
      la sortie de détail des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de temps des shards sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de config entière utilisent le chemin de config comme clé ; les shards CI à motif
      d’inclusion ajoutent le nom du shard afin que les shards filtrés puissent être suivis
      séparément.
    - Lorsqu’un test chaud passe encore la majorité de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière une couture locale étroite `*.runtime.ts` et
      moquez directement cette couture au lieu d’importer en profondeur des assistants runtime juste
      pour les passer à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé avec le chemin natif de projet racine pour ce diff commité
      et affiche le temps mural ainsi que le RSS max macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre de travail
      sale actuel en routant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la config Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      le démarrage de Vitest/Vite et le surcoût de transformation.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du lanceur pour la
      suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Config : `vitest.gateway.config.ts`, forcée à un worker
- Portée :
  - Démarre un vrai Gateway en local loopback avec les diagnostics activés par défaut
  - Fait passer le churn synthétique de messages Gateway, de mémoire et de gros payloads par le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Config : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E de plugins groupés sous `extensions/`
- Valeurs par défaut d’exécution :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire la surcharge d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement de bout en bout du Gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus d’éléments mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du sandbox
- Attentes :
  - Activation explicite uniquement ; ne fait pas partie de l’exécution par défaut de `pnpm test:e2e`
  - Nécessite une CLI locale `openshell` ainsi qu’un démon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et le sandbox
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou un script wrapper non par défaut

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests live de plugins groupés sous `extensions/`
- Valeur par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format de fournisseur, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (vrais réseaux, vraies politiques de fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions live sourcent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de config/auth dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et rend muets les journaux d’amorçage du Gateway/le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les journaux de démarrage complets.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent désormais des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeat de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeat de Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Modification du réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs propres à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests live (touchant au réseau)

Pour la matrice de modèles live, les smokes de backend CLI, les smokes ACP, le harnais de serveur d’application Codex et tous les tests live de fournisseurs média (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média) — ainsi que la gestion des identifiants pour les exécutions live — consultez [Tester les suites live](/fr/help/testing-live). Pour la checklist dédiée de validation des mises à jour et des plugins, consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles live : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier live de clé de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de config local et votre espace de travail (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker live utilisent par défaut un plafond de smoke plus réduit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Surchargez ces variables d’environnement lorsque vous
  voulez explicitement l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker live une seule fois via `test:docker:live-build`, empaquette OpenClaw une seule fois comme archive tar npm via `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue est uniquement l’exécuteur Node/Git pour les lanes d’installation/mise à jour/dépendances de plugins ; ces lanes montent l’archive tar préconstruite. L’image fonctionnelle installe la même archive tar dans `/app` pour les lanes de fonctionnalité de l’application construite. Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les lanes live lourdes, npm-install et multi-services de toutes démarrer en même temps. Si une seule lane est plus lourde que les plafonds actifs, le planificateur peut quand même la démarrer lorsque le pool est vide, puis la laisse s’exécuter seule jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. L’exécuteur effectue un prévol Docker par défaut, supprime les conteneurs E2E OpenClaw obsolètes, imprime l’état toutes les 30 secondes, stocke les durées des lanes réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces durées pour démarrer les lanes plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste de lanes pondéré sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour imprimer le plan CI pour les lanes sélectionnées, les besoins en package/image et les identifiants.
- `Package Acceptance` est la porte de package native GitHub pour « cette archive tar installable fonctionne-t-elle comme un produit ? » Elle résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse comme `package-under-test`, puis exécute les lanes Docker E2E réutilisables contre cette archive tar exacte au lieu de réempaqueter la référence sélectionnée. Les profils sont ordonnés par ampleur : `smoke`, `package`, `product` et `full`. Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat package/mise à jour/plugin, la matrice de survivants de mise à niveau publiée, les valeurs par défaut de publication et le triage des échecs.
- Les vérifications de build et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe construit statique depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant dispatch importe des dépendances de package telles que Commander, l’UI de prompt, undici ou la journalisation avant le dispatch de commande ; il maintient aussi le segment d’exécution Gateway groupé sous le budget et rejette les imports statiques de chemins Gateway froids connus. Le smoke CLI empaqueté couvre aussi l’aide racine, l’aide onboard, l’aide doctor, status, le schéma de config et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harnais tolère uniquement les écarts de métadonnées de packages publiés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de correctif manquants dans la fixture git dérivée de l’archive tar, `update.channel` persisté manquant, emplacements hérités d’enregistrements d’installation de plugins, persistance manquante des enregistrements d’installation de marketplace, et migration des métadonnées de config pendant `plugins update`. Pour les packages postérieurs au `2026.4.25`, ces chemins sont des échecs stricts.
- Exécuteurs de smoke conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les exécuteurs Docker de modèles live montent également en bind uniquement les répertoires home d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke test de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke test du harnais serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke test d’observabilité : `pnpm qa:otel:smoke` est une voie privée de vérification depuis une copie de travail QA. Elle ne fait volontairement pas partie des voies de publication Docker des packages, car le tarball npm omet QA Lab.
- Smoke test live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke test d’intégration/canal/agent du tarball npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement le tarball OpenClaw empaqueté dans Docker, configure OpenAI via une intégration par référence d’environnement ainsi que Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez un tarball préconstruit avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement le tarball OpenClaw empaqueté dans Docker, passe du package `stable` à git `dev`, vérifie le canal persisté et le fonctionnement des Plugins après mise à jour, puis revient au package `stable` et vérifie l’état de mise à jour.
- Smoke test de survivance de mise à niveau : `pnpm test:docker:upgrade-survivor` installe le tarball OpenClaw empaqueté par-dessus une fixture sale d’ancien utilisateur avec agents, configuration de canal, listes d’autorisation de Plugins, état obsolète des dépendances de Plugins, et fichiers d’espace de travail/session existants. Il exécute la mise à jour du package puis doctor non interactif sans fournisseur live ni clés de canal, démarre ensuite un Gateway local loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/d’état.
- Smoke test de survivance de mise à niveau publiée : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, alimente des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commande intégrée, valide la configuration obtenue, met à jour cette installation publiée vers le tarball candidat, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway local loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz` et les budgets d’état RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre des bases exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` telles que `all-since-2026.4.23`, et étendez les fixtures en forme de problèmes avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` telles que `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique d’installation de Plugins OpenClaw externes. Package Acceptance les expose sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios` ; Full Release Validation utilise la base latest par défaut dans le chemin bloquant et s’étend à all-since/reported-issues uniquement pour `run_release_soak=true` ou `release_profile=full`.
- Smoke test du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance du transcript du contexte d’exécution masqué ainsi que la réparation par doctor des branches dupliquées affectées de réécriture de prompt.
- Smoke test d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un répertoire personnel isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de rester bloqué. Réutilisez un tarball préconstruit avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un seul cache npm entre ses conteneurs root, update et direct-npm. Le smoke test de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers le tarball candidat. Remplacez-la par `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installateur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation locale utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Smoke test CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, alimente deux agents avec un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json`, et vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Smoke test d’instantané CDP navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôles CDP couvrent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` fait passer `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway alimenté + pont stdio + smoke test de trame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + smoke test d’autorisation/refus du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage Cron/sous-agent MCP (Gateway réel + arrêt du processus enfant MCP stdio après des exécutions cron isolées et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke test d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mobiles, ClawHub kitchen-sink, mises à jour marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire package/runtime kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Smoke test de mise à jour inchangée de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test de matrice de cycle de vie Plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe le tarball OpenClaw empaqueté dans un conteneur nu, installe un Plugin npm, active/désactive, le met à niveau et le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Smoke test des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre le smoke test d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mobiles, fixtures ClawHub, mises à jour marketplace, et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les Plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation avec code manquant d’un Plugin npm avec suivi des ressources.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, prévalent toujours lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles, car ils valident le comportement package/installation plutôt que l’exécution de l’application construite partagée.

Les exécuteurs Docker de modèles en direct montent aussi la copie de travail actuelle en lecture seule et
la préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest sur votre source/config locale exacte.
L’étape de préparation ignore les grands caches uniquement locaux et les sorties de compilation
d’applications comme `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires
`.build` locaux aux applications ou les répertoires de sortie Gradle, afin que les exécutions Docker
en direct ne passent pas plusieurs minutes à copier des artefacts propres à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes en direct du Gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture
en direct du Gateway dans cette voie Docker.
`test:docker:openwebui` est un test de fumée de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles avec OpenAI activés,
démarre un conteneur Open WebUI épinglé configuré pour ce Gateway, s’authentifie via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être nettement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre initialisation à froid.
Cette voie attend une clé de modèle en direct utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway initialisé,
démarre un second conteneur qui lance `openclaw mcp serve`, puis vérifie la découverte
des conversations routées, les lectures de transcriptions, les métadonnées des pièces jointes,
le comportement de la file d’événements en direct, le routage des envois sortants, ainsi que les notifications de canal +
permission de style Claude sur le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le test de fumée valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier se trouve à exposer.
`test:docker:pi-bundle-mcp-tools` est déterministe et n’a pas besoin d’une clé de modèle
en direct. Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via l’exécution MCP du bundle Pi embarqué,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et n’a pas besoin d’une clé de modèle
en direct. Il démarre un Gateway initialisé avec un vrai serveur de sonde MCP stdio, exécute
un tour Cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Test de fumée manuel ACP de fil en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il peut être nécessaire à nouveau pour la validation du routage des fils ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires temporaires de config/espace de travail et sans montages d’authentification CLI externes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le début des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes par fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante pour les réexécutions qui n’ont pas besoin d’une reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour s’assurer que les identifiants viennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le test de fumée Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer l’invite de vérification du nonce utilisée par le test de fumée Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer l’étiquette d’image Open WebUI épinglée

## Contrôle d’intégrité de la documentation

Exécutez les vérifications de documentation après les modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez aussi vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régressions hors ligne (compatibles avec CI)

Ce sont des régressions de « chaîne réelle » sans vrais fournisseurs :

- Appel d’outils du Gateway (OpenAI simulé, vrai Gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant du Gateway (WS `wizard.start`/`wizard.next`, écrit la config + authentification appliquée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests compatibles avec CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le vrai Gateway + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Décision :** lorsque des Skills sont listées dans l’invite, l’agent choisit-il la bonne Skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios à plusieurs tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de Skills et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser ou éviter, contrôles de déclenchement, injection d’invite).
- Évaluations en direct facultatives (activation explicite, contrôlées par variables d’environnement) uniquement une fois la suite compatible avec CI en place.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque plugin et chaque canal enregistré respecte son
contrat d’interface. Ils itèrent sur tous les plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire `pnpm test` par défaut ignore intentionnellement
ces fichiers partagés de points d’intégration et de tests de fumée ; exécutez explicitement les commandes de contrat
lorsque vous touchez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats des canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du plugin (id, nom, capacités)
- **configuration** - Contrat de l’assistant de configuration
- **liaison de session** - Comportement de liaison de session
- **charge utile sortante** - Structure de charge utile des messages
- **entrant** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **fils** - Gestion des identifiants de fil
- **annuaire** - API d’annuaire/liste
- **politique de groupe** - Application de la politique de groupe

### Contrats d’état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **état** - Sondes d’état des canaux
- **registre** - Forme du registre des plugins

### Contrats des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **authentification** - Contrat de flux d’authentification
- **choix d’authentification** - Choix/sélection d’authentification
- **catalogue** - API de catalogue des modèles
- **découverte** - Découverte des plugins
- **chargeur** - Chargement des plugins
- **exécution** - Exécution du fournisseur
- **forme** - Forme/interface du plugin
- **assistant** - Assistant de configuration

### Quand exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte des plugins

Les tests de contrat s’exécutent dans CI et ne nécessitent pas de vraies clés API.

## Ajout de régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en direct :

- Ajoutez si possible une régression compatible avec CI (fournisseur simulé/stub, ou capture de la transformation exacte de forme de requête)
- Si c’est intrinsèquement uniquement en direct (limites de débit, politiques d’authentification), gardez le test en direct restreint et à activation explicite via variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/relecture de requête fournisseur → test direct des modèles
  - bug de session/historique/pipeline d’outils du Gateway → test de fumée en direct du Gateway ou test simulé du Gateway compatible avec CI
- Garde-fou de parcours SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec avec segments de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les identifiants de cibles non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tests en direct](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
