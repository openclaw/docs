---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajout de tests de régression pour les bogues de modèles/fournisseurs
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/en conditions réelles, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-05-06T07:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw comporte trois suites Vitest (unitaire/intégration, e2e, live) et un petit ensemble
d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que chaque suite couvre (et ce qu’elle ne couvre délibérément _pas_).
- Les commandes à exécuter pour les workflows courants (local, avant poussée, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour les problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) - architecture, surface de commande, création de scénarios.
- [QA matricielle](/fr/concepts/qa-matrix) - référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) - le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des exécuteurs Docker/Parallels. La section des exécuteurs propres à la QA ci-dessous ([Exécuteurs propres à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Barrière complète (attendue avant poussée) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution complète plus rapide de la suite locale sur une machine généreuse : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier achemine désormais aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez plus de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outil/image Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performance d’exécution : déclenchez `OpenClaw Performance` avec
  `live_gpt54=true` pour un vrai tour d’agent `openai/gpt-5.4` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace Kova. Les exécutions planifiées quotidiennes
  publient les artefacts de voies fournisseur simulé, profil approfondi et GPT 5.4 vers
  `openclaw/clawgrit-reports` lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport de fournisseur simulé inclut aussi les mesures au niveau source de démarrage Gateway, de mémoire,
  de pression des Plugins, de boucle hello répétée de faux modèle et de démarrage CLI.
- Balayage de modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lors de l’isolation d’échecs fournisseur.
  - Couverture CI : les vérifications quotidiennes `OpenClaw Scheduled Live And E2E Checks` et manuelles
    `OpenClaw Release Checks` appellent toutes deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, qui inclut des tâches distinctes de matrice de modèles live Docker
    segmentées par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de publication.
- Test rapide de chat lié Codex natif : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin app-server Codex, lie un DM
    Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison Plugin native au lieu d’ACP.
- Test rapide du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex détenu par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    MCP Cron, sous-agent et Guardian. Désactivez la sonde de sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lors de l’isolation d’autres échecs
    app-server Codex. Pour une vérification ciblée du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde de sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Test rapide de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in de redondance pour la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file d’attente un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture d’audit/configuration.
- Test rapide Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec une fausse CLI Claude dans `PATH`
    et vérifie que le repli du planificateur flou se traduit par une écriture de configuration typée auditée.
- Test rapide Docker de première exécution Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, achemine `openclaw` nu vers
    Crestodian, applique les écritures configuration/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration, et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    également couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test rapide de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un cas en échec, préférez restreindre les tests live avec les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à la QA

Ces commandes se placent à côté des suites de tests principales lorsque vous avez besoin du réalisme QA-lab :

CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de publication, pas dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des vérifications de publication. Les vérifications de publication stables/par défaut
gardent le trempage live/Docker exhaustif derrière `run_release_soak=true` ; le
profil `full` force l’activation du trempage. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis le déclenchement manuel avec la voie de parité simulée, la voie
Matrix live, la voie Telegram live gérée par Convex et la voie Discord
live gérée par Convex en tâches parallèles. Les vérifications QA planifiées et de publication passent explicitement
`--profile fast` à Matrix, tandis que l’entrée par défaut de la CLI Matrix et du workflow manuel
reste `all` ; le déclenchement manuel peut segmenter `all` en tâches `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité ainsi que les voies rapides Matrix et Telegram avant l’approbation de publication,
en utilisant `mock-openai/gpt-5.5` pour les vérifications de transport de publication afin qu’elles restent
déterministes et évitent le démarrage normal du Plugin fournisseur. Ces Gateways de transport live
désactivent la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les fragments média live de publication complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui dispose déjà de
`ffmpeg` et `ffprobe`. Les fragments de modèles/backends live Docker utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit sélectionné,
puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque fragment.

- `pnpm openclaw qa suite`
  - Exécute les scénarios de QA appuyés par le dépôt directement sur l’hôte.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local appuyé par AIMock pour une couverture expérimentale
    des fixtures et des mocks de protocole sans remplacer la voie `mock-openai`
    consciente des scénarios.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute le parcours live du Plugin OpenAI Kitchen Sink via QA Lab. Il
    installe le paquet externe Kitchen Sink, vérifie l’inventaire de surface du SDK de Plugin,
    sonde `/healthz` et `/readyz`, enregistre les preuves CPU/RSS du Gateway,
    exécute un tour OpenAI live et vérifie les diagnostics adversariaux.
    Nécessite une authentification OpenAI live telle que `OPENAI_API_KEY`. Dans les sessions Testbox
    hydratées, il source automatiquement le profil d’authentification live Testbox lorsque l’assistant
    `openclaw-testbox-env` est présent.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway plus un petit paquet de scénarios QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale uniquement les observations de CPU chaud soutenu par défaut (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les courtes pointes de démarrage soient enregistrées comme métriques
    sans ressembler à la régression de Gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; lancez d’abord un build lorsque le checkout ne dispose pas
    déjà d’une sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection de fournisseur/modèle que `qa suite`.
  - Les exécutions live transfèrent les entrées d’authentification QA prises en charge et pratiques pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur QA live, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA appuyé par Docker pour le travail de QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive tar npm depuis le checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif par clé d’API OpenAI, configure Telegram
    par défaut, vérifie que le runtime du Plugin empaqueté se charge sans réparation de dépendances
    au démarrage, exécute doctor, puis exécute un tour d’agent local contre un
    endpoint OpenAI mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe d’application construite pour les transcriptions de contexte runtime
    embarqué. Il vérifie que le contexte runtime OpenClaw masqué est persisté comme
    message personnalisé non affiché au lieu de fuir dans le tour utilisateur visible,
    puis ensemence une session JSONL cassée affectée et vérifie que
    `openclaw doctor --fix` la réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un candidat de paquet OpenClaw dans Docker, exécute l’onboarding du paquet installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram
    live avec ce paquet installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive tar locale résolue au lieu
    d’installer depuis le registre.
  - Utilise les mêmes identifiants env Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide l’environnement des identifiants Telegram ou Convex sur l’hôte avant
    le travail de build/installation Docker. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lors du débogage volontaire de la configuration avant identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le rôle partagé
    `OPENCLAW_QA_CREDENTIAL_ROLE` pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors d’une fusion. Le workflow utilise l’environnement
    `qa-live-shared` et les leases d’identifiants CI Convex.
- GitHub Actions expose également `Package Acceptance` pour une preuve produit exécutée à côté
  contre un paquet candidat. Il accepte une ref approuvée, une spécification npm publiée,
  une URL HTTPS d’archive tar plus SHA-256, ou un artefact d’archive tar depuis une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec des profils de voie smoke, package, product, full ou custom.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le workflow QA
  Telegram contre le même artefact `package-under-test`.
  - Dernière preuve produit bêta :

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
  - Empaquette et installe le build OpenClaw courant dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les canaux/Plugins groupés via des modifications
    de configuration.
  - Vérifie que la découverte de configuration laisse absents les Plugins téléchargeables non configurés,
    que la première réparation doctor configurée installe explicitement chaque Plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation masquée de dépendances.
  - Installe aussi une ancienne baseline npm connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour
    du candidat nettoie les débris de dépendances de Plugin héritées sans réparation
    postinstall côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke de mise à jour d’installation empaquetée native sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le paquet baseline demandé, puis exécute la
    commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du Gateway et un tour d’agent
    local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin d’artefact de résumé et
    l’état par voie.
  - La voie OpenAI utilise `openai/gpt-5.5` pour la preuve de tour d’agent live par
    défaut. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lors de la validation volontaire d’un autre
    modèle OpenAI.
  - Enveloppez les longues exécutions locales dans un timeout hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de voies imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans doctor post-mise à jour et le travail de
    mise à jour de paquets sur un invité froid ; c’est encore sain lorsque le journal de débogage npm
    imbriqué avance.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision lors de la
    restauration de snapshot, du service de paquets ou de l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des Plugins groupés, car
    les façades de capacité telles que parole, génération d’image et compréhension des médias
    sont chargées via les API runtime groupées même lorsque le tour d’agent
    lui-même ne vérifie qu’une réponse texte simple.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur de fournisseur AIMock local pour les tests smoke directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA Matrix live contre un serveur domestique Tuwunel jetable appuyé par Docker. Checkout source uniquement - les installations empaquetées n’expédient pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA Telegram live contre un vrai groupe privé avec les tokens des bots driver et SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les leases mutualisés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez le mode Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios de réponse incluent le RTT depuis la requête d’envoi du driver jusqu’à la réponse SUT observée.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [vue d’ensemble QA → Couverture des transports live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la grande suite synthétique et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un lease exclusif depuis un pool appuyé par Convex, envoie des Heartbeats
pour ce lease pendant l’exécution de la voie, puis libère le lease à l’arrêt.

Scaffold de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut env : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` dans CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` local loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration des responsables de maintenance (pool add/remove/list) nécessitent spécifiquement
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Aides CLI pour les responsables de maintenance :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions en direct pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe d’endpoint, le délai d’expiration HTTP et l’accessibilité admin/liste sans afficher les valeurs
secrètes. Utilisez `--json` pour obtenir une sortie lisible par machine dans les scripts et les utilitaires CI.

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
- `POST /admin/add` (secret responsable de maintenance uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret responsable de maintenance uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Protection de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret responsable de maintenance uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme du payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de discussion Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un canal à QA

L’architecture et les noms des aides de scénario pour les nouveaux adaptateurs de canal se trouvent dans [Vue d’ensemble QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le minimum requis : implémenter le runner de transport sur la couture hôte `qa-lab` partagée, déclarer `qaRunners` dans le manifeste du plugin, monter sous `openclaw qa <runner>` et créer les scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (avec une instabilité et un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent étendre les shards multiprojets en configurations par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires d’interface utilisateur s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests purement unitaires
  - Tests d’intégration dans le processus (authentification Gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bugs connus
- Attentes :
  - S’exécute dans CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de repli large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugin générées, et non avec
    de véritables API de source de plugin groupé. Les vrais chargements d’API de plugin appartiennent aux
    suites de contrat/intégration appartenant au plugin.

<AccordionGroup>
  <Accordion title="Projets, shards et voies bornées">

    - `pnpm test` non ciblé exécute douze petites configurations de shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique processus natif géant de projet racine. Cela réduit le RSS maximal sur les machines chargées et évite que le travail auto-reply/extension affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multishard n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` routent d’abord les cibles explicites de fichier/répertoire via des voies bornées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` étend par défaut les chemins git modifiés en voies bornées peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, correspondances de source explicites et dépendants locaux du graphe d’import. Les modifications de configuration/setup/package ne lancent pas de tests larges sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la barrière locale intelligente normale pour le travail étroit. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker en direct et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour la preuve de test. Les changements de version limités aux métadonnées de release exécutent des vérifications ciblées version/config/dépendance racine, avec une garde qui rejette les modifications de package hors du champ de version de premier niveau.
    - Les modifications du harnais ACP Docker en direct exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker en direct et essai à blanc du planificateur Docker en direct. Les changements de `package.json` sont inclus uniquement lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exports, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires à import léger issus des agents, commandes, plugins, aides auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en runtime restent sur les voies existantes.
    - Certains fichiers source d’aides `plugin-sdk` et `commands` sélectionnés associent aussi les exécutions en mode changé à des tests frères explicites dans ces voies légères, afin que les modifications d’aides évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de groupes dédiés pour les aides core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. CI divise en outre le sous-arbre reply en shards agent-runner, dispatch et commands/state-routing afin qu’un groupe lourd en imports ne possède pas toute la fin Node.
    - La CI normale de PR/main ignore intentionnellement le balayage par lots des extensions et le shard réservé aux releases `agentic-plugins`. La Validation complète de release déclenche le workflow enfant distinct `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de release.

  </Accordion>

  <Accordion title="Couverture du runner intégré">

    - Lorsque vous modifiez les entrées de découverte de l’outil de message ou le contexte runtime de Compaction,
      conservez les deux niveaux de couverture.
    - Ajoutez des régressions ciblées d’aides pour les frontières pures de routage et de normalisation.
    - Maintenez en bon état les suites d’intégration du runner intégré :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants bornés et le comportement de Compaction passent toujours
      par les vrais chemins `run.ts` / `compact.ts` ; les tests uniquement sur les aides ne sont
      pas un substitut suffisant à ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut de pool et d’isolation Vitest">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le
      runner non isolé pour les projets racine, e2e et configurations en direct.
    - La voie d’interface utilisateur racine conserve son setup `jsdom` et son optimiseur, mais s’exécute elle aussi sur le
      runner non isolé partagé.
    - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      de la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut pour les processus Node enfants de Vitest
      afin de réduire le churn de compilation V8 pendant les grandes exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8 standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` affiche les voies architecturales déclenchées par un diff.
    - Le hook pre-commit ne fait que le formatage. Il restage les fichiers formatés et
      n’exécute pas lint, typecheck ni tests.
    - Exécutez explicitement `pnpm check:changed` avant le transfert ou le push lorsque vous
      avez besoin de la barrière locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies bornées peu coûteuses. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, configuration, package ou contrat nécessite vraiment une couverture
      Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec une limite de workers plus élevée.
    - L’ajustement automatique des workers locaux est intentionnellement conservateur et réduit la charge
      lorsque la charge moyenne de l’hôte est déjà élevée, afin que plusieurs exécutions Vitest
      concurrentes causent moins de dommages par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme
      `forceRerunTriggers` afin que les réexécutions en mode changé restent correctes lorsque le câblage
      des tests change.
    - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ;
      définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport des durées d’import Vitest ainsi que
      la sortie de décomposition des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de timing des shards sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de configuration complète utilisent le chemin de configuration comme clé ; les shards CI
      à motif d’inclusion ajoutent le nom du shard afin que les shards filtrés puissent être suivis
      séparément.
    - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière une couture locale étroite `*.runtime.ts` et
      moquez directement cette couture au lieu d’importer profondément des aides runtime simplement
      pour les faire passer par `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif de projet racine pour ce diff validé
      et affiche le temps réel ainsi que le RSS maximal macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre sale actuel
      en routant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      le démarrage Vitest/Vite et le surcoût de transformation.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la
      suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un vrai Gateway en local loopback avec les diagnostics activés par défaut
  - Génère un churn synthétique de messages Gateway, de mémoire et de gros payloads via le chemin d’événement de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les aides de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Config : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E des plugins groupés sous `extensions/`
- Paramètres d’exécution par défaut :
  - Utilise les `threads` de Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire la surcharge d’E/S de console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement de bout en bout de gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune clé réelle requise
  - Plus de composants mobiles que les tests unitaires (peut être plus lent)

### E2E : test de fumée du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre un gateway OpenShell isolé sur l’hôte via Docker
  - Crée un bac à sable depuis un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Sur inscription uniquement ; ne fait pas partie de l’exécution par défaut de `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale ainsi qu’un daemon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le gateway de test et le bac à sable
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests live des plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format de fournisseurs, les particularités d’appel d’outils, les problèmes d’authentification et le comportement de limites de débit
- Attentes :
  - Non stable en CI par conception (réseaux réels, politiques de fournisseurs réelles, quotas, pannes)
  - Coûte de l’argent / consomme des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions live sourcent `~/.profile` pour récupérer les clés d’API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de config/auth dans un répertoire personnel de test temporaire afin que les fixtures unitaires ne puissent pas muter votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise désormais par défaut un mode plus discret : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et réduit au silence les logs d’amorçage du gateway / le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les logs de démarrage complets.
- Rotation des clés d’API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limite de débit.
- Sortie progression/Heartbeat :
  - Les suites live émettent désormais des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console de Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/gateway soient diffusées immédiatement pendant les exécutions live.
  - Réglez les Heartbeats de modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Réglez les Heartbeats de gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau du gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs propres à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests live (touchant le réseau)

Pour la matrice de modèles live, les tests de fumée de backend CLI, les tests de fumée ACP, le harnais de serveur d’application Codex et tous les tests live de fournisseurs média (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média) - ainsi que la gestion des identifiants pour les exécutions live - consultez
[Tester les suites live](/fr/help/testing-live). Pour la checklist dédiée de mise à jour et de validation de Plugin, consultez
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Runners Docker (vérifications optionnelles « fonctionne sous Linux »)

Ces runners Docker se divisent en deux catégories :

- Runners de modèles live : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier live à clé de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de config local et votre espace de travail (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners live Docker utilisent par défaut un plafond de test de fumée plus petit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Surchargez ces variables d’environnement lorsque vous
  voulez explicitement le balayage exhaustif plus large.
- `test:docker:all` construit l’image Docker live une fois via `test:docker:live-build`, empaquette OpenClaw une fois comme tarball npm via `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue est uniquement le runner Node/Git pour les voies d’installation/mise à jour/dépendances de plugins ; ces voies montent le tarball préconstruit. L’image fonctionnelle installe le même tarball dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que des plafonds de ressources empêchent les voies live lourdes, npm-install et multi-service de démarrer toutes en même temps. Si une seule voie est plus lourde que les plafonds actifs, le planificateur peut tout de même la démarrer lorsque le pool est vide, puis la laisser s’exécuter seule jusqu’à ce que de la capacité soit à nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; réglez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. Le runner effectue un prévol Docker par défaut, supprime les conteneurs E2E OpenClaw obsolètes, imprime l’état toutes les 30 secondes, stocke les timings des voies réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces timings pour démarrer les voies les plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste de voies pondéré sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour imprimer le plan CI des voies sélectionnées, des besoins en paquets/images et des identifiants.
- `Package Acceptance` est la gate de paquets native GitHub pour « ce tarball installable fonctionne-t-il comme un produit ? ». Elle résout un paquet candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse comme `package-under-test`, puis exécute les voies E2E Docker réutilisables contre ce tarball exact au lieu de réempaqueter la ref sélectionnée. Les profils sont classés par étendue : `smoke`, `package`, `product` et `full`. Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat paquet/mise à jour/Plugin, la matrice de survivants de mise à niveau publiée, les valeurs par défaut de release et le triage des échecs.
- Les vérifications de construction et de release exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe construit statique depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant dispatch importe des dépendances de paquets telles que Commander, l’IU d’invite, undici ou la journalisation avant le dispatch de commande ; il maintient aussi le chunk d’exécution du gateway groupé sous budget et rejette les imports statiques de chemins gateway froids connus. Le test de fumée de CLI empaquetée couvre aussi l’aide racine, l’aide d’onboarding, l’aide doctor, le statut, le schéma de config et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette date limite, le harnais tolère uniquement les lacunes de métadonnées de paquets déjà livrés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de correctif manquants dans la fixture git dérivée du tarball, `update.channel` persistant manquant, emplacements hérités des enregistrements d’installation de plugins, persistance manquante des enregistrements d’installation de marketplace, et migration des métadonnées de config pendant `plugins update`. Pour les paquets postérieurs au `2026.4.25`, ces chemins sont des échecs stricts.
- Runners de fumée de conteneurs : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les runners Docker de modèles live montent également en bind mount uniquement les répertoires personnels d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans muter le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test de fumée de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test de fumée du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test de fumée du harnais app-server Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Test de fumée d’observabilité : `pnpm qa:otel:smoke` est une voie QA privée de vérification sur checkout source. Elle ne fait volontairement pas partie des voies de publication Docker de package, car le tarball npm omet QA Lab.
- Test de fumée live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test de fumée d’onboarding/canal/agent avec tarball npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement le tarball OpenClaw empaqueté dans Docker, configure OpenAI via un onboarding par référence d’environnement plus Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez un tarball précompilé avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la recompilation hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Test de fumée de bascule du canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement le tarball OpenClaw empaqueté dans Docker, bascule du package `stable` vers le git `dev`, vérifie le canal persistant et le fonctionnement post-mise à jour des plugins, puis rebascule vers le package `stable` et vérifie l’état de mise à jour.
- Test de fumée de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe le tarball OpenClaw empaqueté par-dessus une fixture d’ancien utilisateur modifiée avec agents, configuration de canal, listes d’autorisation de plugins, état obsolète des dépendances de plugins et fichiers d’espace de travail/session existants. Il exécute la mise à jour du package ainsi que doctor non interactif sans fournisseur live ni clés de canal, puis démarre un Gateway loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/statut.
- Test de fumée publié de survie à la mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commandes intégrée, valide la configuration résultante, met à jour cette installation publiée vers le tarball candidat, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway loopback et vérifie les intents configurés, la préservation de l’état, le démarrage, `/healthz`, `/readyz` et les budgets de statut RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre des bases locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et étendez des fixtures en forme de problème avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` comme `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique de l’installation de plugins OpenClaw externes. Package Acceptance expose ces valeurs sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, résout des jetons de base méta comme `last-stable-4` ou `all-since-2026.4.23`, et Full Release Validation étend la porte package release-soak à `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Test de fumée du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance masquée du transcript de contexte d’exécution ainsi que la réparation par doctor des branches dupliquées affectées de réécriture de prompt.
- Test de fumée d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un home isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de se bloquer. Réutilisez un tarball précompilé avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la compilation hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test de fumée Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, update et direct-npm. Le test de fumée de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers le tarball candidat. Remplacez avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installateur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm en doublon avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Test de fumée CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit l’image Dockerfile racine par défaut, initialise deux agents avec un espace de travail dans un home de conteneur isolé, exécute `agents delete --json`, puis vérifie le JSON valide et le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test de fumée d’instantané CDP de navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, puis vérifie que les instantanés de rôles CDP couvrent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Régression OpenAI Responses web_search avec raisonnement minimal : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test de fumée de trame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + test de fumée allow/deny du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (Gateway réel + démantèlement d’enfant MCP stdio après des exécutions cron isolées et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test de fumée d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mouvantes, ClawHub kitchen-sink, mises à jour de marketplace et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire package/runtime kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Test de fumée de mise à jour de Plugin sans changement : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test de fumée de matrice de cycle de vie Plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe le tarball OpenClaw empaqueté dans un conteneur nu, installe un plugin npm, bascule l’activation/désactivation, le met à niveau et le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Test de fumée des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre le test de fumée d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mouvantes, fixtures ClawHub, mises à jour de marketplace et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour sans changement pour les plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation avec code manquant d’un plugin npm avec suivi des ressources.

Pour précompiler et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles, car ils valident le comportement de package/d’installation plutôt que l’exécution de l’application construite partagée.

Les exécuteurs Docker de modèles live montent également la copie de travail actuelle en lecture seule et
la préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest sur votre source/config locale exacte.
L’étape de préparation ignore les grands caches uniquement locaux et les sorties de build d’app comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie `.build` locaux à l’app ou
Gradle afin que les exécutions live Docker ne passent pas plusieurs minutes à copier des artefacts
propres à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live du Gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live du Gateway
de cette voie Docker.
`test:docker:openwebui` est un smoke test de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre initialisation à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le moyen principal de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
prérempli, démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture des transcriptions, les métadonnées de pièces jointes,
le comportement de la file d’événements live, le routage d’envoi sortant et les notifications de canal +
permissions de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le smoke test valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client précis expose par hasard.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de
modèle live. Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway prérempli avec un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie que
le processus enfant MCP se termine après chaque exécution.

Smoke test manuel ACP de thread en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être de nouveau nécessaire pour valider le routage des threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires de config/espace de travail temporaires et sans montages d’authentification CLI externes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes à un fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de réexécutions qui ne nécessitent pas de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour s’assurer que les identifiants proviennent du magasin de profil (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification par nonce utilisé par le smoke test Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de bon fonctionnement des docs

Exécutez les vérifications des docs après les modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez aussi vérifier les titres dans les pages : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outil du Gateway (OpenAI simulé, vrai gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de configuration du Gateway (WS `wizard.start`/`wizard.next`, écrit la config + authentification appliquée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outil simulé via le vrai gateway + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de configuration de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills sont listées dans le prompt, l’agent choisit-il la bonne skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent rester d’abord déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de skill et le câblage de session.
- Une petite suite de scénarios centrés sur les skills (utiliser ou éviter, garde-fous, injection de prompt).
- Évaluations live facultatives (sur inscription, contrôlées par env) seulement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré se conforme à son
contrat d’interface. Ils parcourent tous les plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire `pnpm test` par défaut
ignore intentionnellement ces fichiers de smoke test et de point de jonction partagé ; exécutez explicitement
les commandes de contrat lorsque vous touchez des surfaces de canal ou de fournisseur partagées.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux seulement : `pnpm test:contracts:channels`
- Contrats de fournisseurs seulement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de plugin de base (id, nom, capacités)
- **setup** - Contrat d’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile des messages
- **inbound** - Traitement des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de thread
- **directory** - API d’annuaire/liste de membres
- **group-policy** - Application de la stratégie de groupe

### Contrats de statut des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre de Plugins

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat de flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte de Plugins
- **loader** - Chargement de Plugins
- **runtime** - Runtime de fournisseur
- **shape** - Forme/interface de Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après avoir modifié les exports ou sous-chemins de plugin-sdk
- Après avoir ajouté ou modifié un canal ou Plugin fournisseur
- Après avoir refactorisé l’enregistrement ou la découverte de Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés d’API.

## Ajout de régressions (recommandations)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (fournisseur simulé/stub, ou capture de la transformation exacte de forme de requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live restreint et facultatif via variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bogue :
  - bogue de conversion/relecture de requête fournisseur → test direct des modèles
  - bogue de pipeline session/historique/outils du gateway → smoke test live gateway ou test gateway simulé compatible CI
- Garde-fou de parcours SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les ids exec avec segment de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les ids de cible non classifiés afin que de nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
