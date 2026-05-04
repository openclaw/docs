---
read_when:
    - Exécution des tests en local ou en CI
    - Ajout de tests de régression pour les bugs de modèle/fournisseur
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-05-04T07:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unitaires/intégration, e2e, live) et d’un petit ensemble
de runners Docker. Ce document est un guide « comment nous testons » :

- Ce que chaque suite couvre (et ce qu’elle ne couvre délibérément _pas_).
- Les commandes à exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour les problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA matricielle](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des runners Docker/Parallels. La section des runners propres à la QA ci-dessous ([Runners propres à la QA](#qa-specific-runners)) répertorie les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Porte complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de toute la suite sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers route désormais aussi les chemins d’extensions/canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez plus de confiance :

- Porte de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performance d’exécution : déclencher `OpenClaw Performance` avec
  `live_gpt54=true` pour un vrai tour d’agent `openai/gpt-5.4` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace Kova. Les exécutions quotidiennes planifiées
  publient les artefacts des voies fournisseur simulé, profil approfondi et GPT 5.4 vers
  `openclaw/clawgrit-reports` lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport de fournisseur simulé inclut aussi les mesures au niveau source du démarrage du Gateway, de la mémoire,
  de la pression des plugins, de la boucle hello répétée avec faux modèle et du démarrage CLI.
- Balayage de modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lors de l’isolation des échecs fournisseur.
  - Couverture CI : les contrôles quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des tâches matricielles Docker live model
    distinctes, fragmentées par fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal dans `scripts/ci-hydrate-live-auth.sh`
    ainsi que `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/release.
- Smoke de conversation liée Codex native : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin app-server Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison Plugin native au lieu d’ACP.
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex possédé par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    Cron MCP, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lors de l’isolation d’autres échecs
    app-server Codex. Pour un contrôle sous-agent ciblé, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Contrôle opt-in de sûreté renforcée pour la surface de commande de secours du canal de messages.
    Il exerce `/crestodian status`, met en file un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture d’audit/configuration.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec une fausse CLI Claude sur `PATH`
    et vérifie que le repli du planificateur flou se traduit par une écriture de configuration typée auditée.
- Smoke Docker de première exécution Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement d’autorisation décrites ci-dessous.
</Tip>

## Runners propres à la QA

Ces commandes complètent les suites de tests principales lorsque vous avez besoin du réalisme de QA-lab :

La CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de release, et non dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des contrôles de release. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis un déclenchement manuel avec la voie de parité simulée, la voie
Matrix live, la voie Telegram live gérée par Convex et la voie Discord
live gérée par Convex en tâches parallèles. La QA planifiée et les contrôles de release passent explicitement
`--profile fast` à Matrix, tandis que la valeur par défaut de la CLI Matrix et de l’entrée de workflow manuel
reste `all` ; le déclenchement manuel peut fragmenter `all` en tâches `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité plus les voies Matrix rapide et Telegram avant l’approbation
de release, en utilisant `mock-openai/gpt-5.5` pour les contrôles de transport de release afin qu’ils restent
déterministes et évitent le démarrage normal des Plugins fournisseurs. Ces Gateways de transport live
désactivent la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les fragments média live de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui contient déjà
`ffmpeg` et `ffprobe`. Les fragments Docker live de modèles/backends utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit sélectionné,
puis l’extraient avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque fragment.

- `pnpm openclaw qa suite`
  - Exécute des scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (limitée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local adossé à AIMock pour la couverture expérimentale
    des fixtures et des mocks de protocole, sans remplacer la voie `mock-openai`
    tenant compte des scénarios.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway ainsi qu’un petit lot de scénarios QA Lab mockés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale par défaut uniquement les observations de CPU chaud soutenues (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), de sorte que les courtes pointes au démarrage sont enregistrées comme métriques
    sans ressembler à la régression de Gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts construits de `dist` ; lancez d’abord une construction lorsque l’extraction ne dispose pas
    déjà d’une sortie d’exécution fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection des scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection de fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    les clés de fournisseur basées sur l’environnement, le chemin de configuration du fournisseur QA live et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé, ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour un travail QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive tar npm depuis l’extraction courante, l’installe globalement dans
    Docker, exécute l’onboarding non interactif avec clé d’API OpenAI, configure Telegram
    par défaut, vérifie que le runtime du plugin empaqueté se charge sans réparation de dépendances
    au démarrage, exécute doctor, puis exécute un tour d’agent local contre un
    endpoint OpenAI mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application construite pour les transcriptions de contexte runtime intégré.
    Il vérifie que le contexte runtime OpenClaw masqué est persisté comme message personnalisé
    non affiché au lieu de fuir dans le tour utilisateur visible,
    puis amorce un JSONL de session cassée affectée et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un package candidat OpenClaw dans Docker, exécute l’onboarding du package installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram
    live avec ce package installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive tar locale résolue au lieu de
    l’installer depuis le registre.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide l’environnement des identifiants Telegram ou Convex sur l’hôte avant
    le travail de build/install Docker. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lorsque vous déboguez volontairement la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors des merges. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants Convex CI.
- GitHub Actions expose aussi `Package Acceptance` pour une preuve produit en exécution latérale
  contre un package candidat. Il accepte une ref approuvée, une spécification npm publiée,
  une URL d’archive tar HTTPS plus SHA-256, ou un artefact d’archive tar provenant d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec des profils de voies smoke, package, product, full ou personnalisés.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le
  workflow QA Telegram contre le même artefact `package-under-test`.
  - Dernière preuve produit beta :

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
  - Emballe et installe la construction OpenClaw courante dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les channels/plugins groupés via des modifications
    de configuration.
  - Vérifie que la découverte de configuration laisse absents les plugins téléchargeables non configurés,
    que la première réparation doctor configurée installe explicitement chaque plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendances
    masquée.
  - Installe aussi une ancienne référence npm connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, puis vérifie que le doctor post-mise à jour
    du candidat nettoie les débris de dépendances de plugin hérités sans réparation postinstall
    côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation empaquetée sur les invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package de référence demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du Gateway et un tour d’agent
    local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un seul invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par voie.
  - La voie OpenAI utilise `openai/gpt-5.5` par défaut pour la preuve live du tour d’agent.
    Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez volontairement un autre
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
  - La mise à jour Windows peut passer 10 à 15 minutes dans doctor post-mise à jour et le travail de mise à jour de package
    sur un invité froid ; c’est toujours sain lorsque le journal debug npm imbriqué
    progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies smoke individuelles Parallels
    macOS, Windows ou Linux. Elles partagent l’état des VM et peuvent entrer en collision lors de
    la restauration de snapshots, du service de packages ou de l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés, car
    les façades de capacité telles que la parole, la génération d’images et la compréhension
    multimédia sont chargées via les API runtime groupées même lorsque le tour d’agent
    lui-même ne vérifie qu’une simple réponse textuelle.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur de fournisseur AIMock local pour des tests smoke directs
    du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker. Extraction source uniquement — les installations empaquetées ne livrent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé en utilisant les jetons du pilote et du bot SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id de chat Telegram numérique.
  - Prend en charge `--credential-source convex` pour les identifiants groupés partagés. Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les baux groupés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez le mode de communication bot à bot dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT depuis la requête d’envoi du pilote jusqu’à la réponse SUT observée.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [Vue d’ensemble QA → Couverture des transports live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la suite synthétique large et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie des heartbeats
pour ce bail pendant l’exécution de la voie, puis libère le bail à l’arrêt.

Échafaudage de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle des identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en local loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Aides CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions en direct pour vérifier l’URL du site Convex, les secrets du broker,
le préfixe d’endpoint, le délai d’expiration HTTP et l’accessibilité admin/list sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie exploitable par machine dans les scripts et les
utilitaires de CI.

Contrat d’endpoint par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Réussite : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Épuisé/réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Réussite : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Réussite : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret de mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Réussite : `{ status: "ok", credential }`
- `POST /admin/remove` (secret de mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Réussite : `{ status: "ok", changed, credential }`
  - Protection de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret de mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Réussite : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajout d’un canal à QA

L’architecture et les noms des assistants de scénario pour les nouveaux adaptateurs de canal se trouvent dans [Vue d’ensemble QA → Ajout d’un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le seuil minimal : implémenter le runner de transport sur le seam d’hôte `qa-lab` partagé, déclarer `qaRunners` dans le manifeste du Plugin, le monter comme `openclaw qa <runner>` et écrire les scénarios sous `qa/scenarios/`.

## Suites de tests (où elles s’exécutent)

Considérez les suites comme un « réalisme croissant » (avec une instabilité et un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent étendre les shards multi-projets en configurations par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification Gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bugs connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de fallback large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de Plugin générées, et non
    les API sources de vrais Plugins groupés. Les chargements réels d’API de Plugin relèvent des
    suites de contrat/intégration détenues par les Plugins.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` non ciblé exécute douze configurations de shards plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul énorme processus natif de projet racine. Cela réduit le pic RSS sur les machines chargées et évite que le travail auto-reply/extensions affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-shards n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers/répertoires par des lanes à portée limitée, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` étend par défaut les chemins git modifiés en lanes à portée limitée peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, correspondances sources explicites et dépendants locaux du graphe d’import. Les modifications de configuration/setup/package ne déclenchent pas de tests larges sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de vérification locale intelligente normale pour les travaux étroits. Il classe le diff en core, tests core, extensions, tests d’extensions, apps, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Il n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour la preuve de test. Les incréments de version portant uniquement sur les métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendance racine, avec une garde qui rejette les changements de package hors du champ de version de premier niveau.
    - Les modifications du harnais Docker ACP live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker live et dry-run du planificateur Docker live. Les changements de `package.json` ne sont inclus que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendance, d’export, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en imports provenant des agents, commandes, Plugins, assistants auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la lane `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers stateful/lourds en runtime restent sur les lanes existantes.
    - Certains fichiers sources d’assistants `plugin-sdk` et `commands` sélectionnés mappent également les exécutions en mode modifié vers des tests frères explicites dans ces lanes légères, afin que les modifications d’assistants évitent de relancer toute la suite lourde pour ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les assistants core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en outre le sous-arbre reply en shards agent-runner, dispatch et commands/state-routing afin qu’un compartiment lourd en imports ne possède pas toute la traîne Node.
    - La CI PR/main normale ignore intentionnellement le balayage par lots des extensions et le shard de release uniquement `agentic-plugins`. La Validation complète de release déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en Plugins/extensions sur les candidats de release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte runtime de Compaction,
      conservez les deux niveaux de couverture.
    - Ajoutez des régressions ciblées d’assistants pour les limites pures de routage et de normalisation.
    - Gardez en bon état les suites d’intégration du runner embarqué :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants à portée limitée et le comportement de Compaction circulent toujours
      via les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux assistants ne sont
      pas un substitut suffisant à ces chemins d’intégration.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le
      runner non isolé dans les projets racine, e2e et configurations live.
    - La lane UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute aussi sur le
      runner partagé non isolé.
    - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut aux processus Node enfants de Vitest
      afin de réduire le churn de compilation V8 pendant les grandes exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8 standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` affiche les lanes architecturales déclenchées par un diff.
    - Le hook de pré-commit ne fait que du formatage. Il réindexe les fichiers formatés et
      n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant la remise ou le push lorsque vous
      avez besoin de la porte de vérification locale intelligente.
    - `pnpm test:changed` passe par des lanes à portée limitée peu coûteuses par défaut. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, de configuration, de package ou de contrat nécessite vraiment une couverture
      Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec un plafond de workers plus élevé.
    - L’auto-dimensionnement local des workers est volontairement conservateur et se réduit
      lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions
      Vitest concurrentes font moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme
      `forceRerunTriggers` afin que les réexécutions en mode modifié restent correctes lorsque le câblage
      des tests change.
    - La configuration maintient `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ;
      définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` active les rapports de durée d’import Vitest ainsi que
      la sortie de ventilation des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de durée des shards sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de configuration complète utilisent le chemin de configuration comme clé ; les shards CI
      à motif d’inclusion ajoutent le nom du shard afin que les shards filtrés puissent être suivis
      séparément.
    - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière un seam local étroit `*.runtime.ts` et
      moquez directement ce seam au lieu d’importer en profondeur des assistants runtime juste
      pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif du projet racine pour ce diff validé
      et affiche le temps réel ainsi que le RSS maximal macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre de travail
      modifié actuel en acheminant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      la surcharge de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la
      suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un vrai Gateway en local loopback avec les diagnostics activés par défaut
  - Injecte un brassage synthétique de messages Gateway, de mémoire et de grandes charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance du bundle de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clé
  - Lane étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E des Plugins groupés sous `extensions/`
- Valeurs par défaut à l’exécution :
  - Utilise les `threads` de Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire la surcharge d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement de Gateway multi-instance de bout en bout
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (quand activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus d’éléments mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke test du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée un bac à sable depuis un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Uniquement sur opt-in ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Utilise `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et le bac à sable
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper

### Tests en direct (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests en direct des Plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (vrais réseaux, vraies politiques de fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions en direct sourcent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions en direct isolent toujours `HOME` et copient le matériel de configuration/authentification dans un répertoire personnel de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests en direct utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et met en sourdine les journaux de bootstrap du Gateway/les messages Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les journaux complets de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge par test en direct via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limite de débit.
- Sortie progression/Heartbeat :
  - Les suites en direct émettent désormais des lignes de progression sur stderr afin que les longs appels aux fournisseurs soient visiblement actifs même lorsque la capture console de Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions en direct.
  - Ajustez les Heartbeats de modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeats Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Modification du réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors ligne » / échecs spécifiques à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests en direct (touchant le réseau)

Pour la matrice de modèles en direct, les smoke tests de backend CLI, les smoke tests ACP, le harnais de serveur d’application Codex et tous les tests en direct de fournisseurs de médias (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média) — ainsi que la gestion des identifiants pour les exécutions en direct — consultez
[Tests des suites en direct](/fr/help/testing-live). Pour la checklist dédiée de mise à jour et de validation des Plugins, consultez
[Tests des mises à jour et des Plugins](/fr/help/testing-updates-plugins).

## Runners Docker (vérifications facultatives « fonctionne sous Linux »)

Ces runners Docker se divisent en deux catégories :

- Runners de modèles en direct : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier en direct de clés de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker en direct utilisent par défaut un plafond de smoke test plus petit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Surchargez ces variables d’environnement lorsque vous
  voulez explicitement l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker en direct une fois via `test:docker:live-build`, empaquette OpenClaw une fois sous forme de tarball npm via `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue n’est que le runner Node/Git pour les lanes d’installation/mise à jour/dépendance de Plugin ; ces lanes montent le tarball préconstruit. L’image fonctionnelle installe le même tarball dans `/app` pour les lanes de fonctionnalité d’application construite. Les définitions de lanes Docker vivent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur vit dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les lanes lourdes en direct, npm-install et multi-services de toutes démarrer en même temps. Si une seule lane est plus lourde que les plafonds actifs, le planificateur peut tout de même la démarrer lorsque le pool est vide, puis la laisse tourner seule jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. Le runner effectue un prévol Docker par défaut, supprime les anciens conteneurs E2E OpenClaw, imprime l’état toutes les 30 secondes, stocke les durées de lanes réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces durées pour démarrer les lanes plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste pondéré des lanes sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour imprimer le plan CI des lanes sélectionnées, des besoins package/image et des identifiants.
- `Package Acceptance` est la gate package native GitHub pour « ce tarball installable fonctionne-t-il comme produit ? ». Elle résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse sous le nom `package-under-test`, puis exécute les lanes Docker E2E réutilisables contre ce tarball exact au lieu de rempaqueter la ref sélectionnée. Les profils sont ordonnés par largeur : `smoke`, `package`, `product` et `full`. Consultez [Tests des mises à jour et des Plugins](/fr/help/testing-updates-plugins) pour le contrat package/mise à jour/Plugin, la matrice de survivant des mises à niveau publiées, les valeurs par défaut de release et le triage des échecs.
- Les vérifications de build et de release exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. La garde parcourt le graphe construit statique depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si les imports de démarrage avant dispatch importent des dépendances de package telles que Commander, l’interface de prompt, undici ou la journalisation avant le dispatch de commande ; elle maintient également le fragment d’exécution du Gateway groupé sous budget et rejette les imports statiques de chemins Gateway froids connus. Le smoke test de CLI packagée couvre aussi l’aide racine, l’aide d’onboarding, l’aide doctor, status, le schéma de config et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette date limite, le harnais tolère uniquement les écarts de métadonnées de packages livrés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de patch manquants dans la fixture git dérivée du tarball, `update.channel` persistant manquant, emplacements hérités des enregistrements d’installation de Plugin, persistance manquante des enregistrements d’installation de marketplace et migration des métadonnées de configuration pendant `plugins update`. Pour les packages après `2026.4.25`, ces chemins sont des échecs stricts.
- Runners de smoke tests de conteneurs : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les runners Docker de modèles en direct bind-mount également uniquement les répertoires personnels d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse rafraîchir les jetons sans modifier le stockage d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test smoke du harnais de serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Test smoke d’observabilité : `pnpm qa:otel:smoke` est une voie QA privée sur extraction des sources. Elle ne fait intentionnellement pas partie des voies de publication Docker de paquet, car l’archive npm omet QA Lab.
- Test smoke en direct Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test smoke d’intégration/canal/agent avec archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe l’archive OpenClaw empaquetée globalement dans Docker, configure OpenAI via une intégration avec référence d’environnement ainsi que Telegram par défaut, exécute doctor et exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Test smoke de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe l’archive OpenClaw empaquetée globalement dans Docker, passe du paquet `stable` au git `dev`, vérifie le canal persistant et le fonctionnement du Plugin après mise à jour, puis revient au paquet `stable` et vérifie l’état de mise à jour.
- Test smoke de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive OpenClaw empaquetée sur une fixture d’ancien utilisateur sale avec agents, configuration de canal, listes d’autorisation de plugins, état obsolète des dépendances de plugins et fichiers d’espace de travail/session existants. Il exécute la mise à jour du paquet ainsi que doctor non interactif sans clés de fournisseur ou de canal en direct, puis démarre un Gateway en loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/état.
- Test smoke de survie à la mise à niveau publiée : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, amorce des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commande intégrée, valide la configuration obtenue, met à jour cette installation publiée vers l’archive candidate, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz` et les budgets d’état RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre des bases exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` telles que `all-since-2026.4.23`, et étendez les fixtures en forme d’issues avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` telles que `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique d’installation de Plugin OpenClaw externe. Package Acceptance expose ces éléments sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`.
- Test smoke du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance masquée de la transcription du contexte d’exécution ainsi que la réparation par doctor des branches de réécriture d’invite dupliquées affectées.
- Test smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un répertoire personnel isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images groupés au lieu de se bloquer. Réutilisez une archive préconstruite avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test smoke Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, mise à jour et direct-npm. Le test smoke de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers l’archive candidate. Remplacez avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installateur non root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Test smoke CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit l’image Dockerfile racine par défaut, amorce deux agents avec un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json`, et vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test smoke d’instantané Browser CDP : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP couvrent les URL de liens, les éléments cliquables promus par curseur, les références iframe et les métadonnées de frame.
- Régression OpenAI Responses web_search avec raisonnement minimal : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma du fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway amorcé + pont stdio + test smoke de frame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP de bundle Pi (serveur MCP stdio réel + test smoke d’autorisation/refus du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (Gateway réel + démontage d’enfant MCP stdio après exécutions cron isolées et sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mobiles, ClawHub fourre-tout, mises à jour de marketplace et activation/inspection de bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/exécution fourre-tout par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Test smoke de mise à jour Plugin inchangée : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test smoke de matrice de cycle de vie Plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe l’archive OpenClaw empaquetée dans un conteneur nu, installe un Plugin npm, bascule activation/désactivation, le met à niveau et le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Test smoke des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre le test smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mobiles, fixtures ClawHub, mises à jour de marketplace et activation/inspection de bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation avec code manquant d’un Plugin npm avec suivi des ressources.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles parce qu’ils valident le comportement de paquet/d’installation plutôt que l’exécution d’application construite partagée.

Les runners Docker de modèles live montent aussi en bind-mount le checkout actuel en lecture seule et
le placent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
runtime légère tout en exécutant Vitest sur votre source/config locale exacte.
L’étape de staging ignore les gros caches locaux uniquement et les sorties de build d’app comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie `.build` locaux à l’app ou
Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier des artefacts
propres à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live du Gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez réduire ou exclure la couverture live du Gateway
de cette lane Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette lane attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway préalimenté,
démarre un second conteneur qui lance `openclaw mcp serve`, puis vérifie
la découverte des conversations routées, la lecture des transcriptions, les métadonnées des pièces jointes,
le comportement de la file d’événements live, le routage des envois sortants, ainsi que les notifications de canal +
permission de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les frames MCP stdio brutes, afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client spécifique expose par hasard.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle live.
Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent
les outils `bundle-mcp`, tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway préalimenté avec un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant one-shot `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel ACP de thread en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourra être nécessaire à nouveau pour la validation du routage des threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires de config/workspace temporaires et aucun montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à un provider ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour réduire l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les providers dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de réexécutions qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants viennent du magasin de profils (pas de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification par nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Sanity docs

Exécutez les vérifications docs après les modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Il s’agit de régressions de « vrai pipeline » sans vrais providers :

- Appel d’outils Gateway (OpenAI mocké, vrai Gateway + boucle agent) : `src/gateway/gateway.test.ts` (cas : « exécute un appel d’outil OpenAI mocké de bout en bout via la boucle agent du Gateway »)
- Assistant de configuration Gateway (WS `wizard.start`/`wizard.next`, écrit la config + auth appliquée) : `src/gateway/gateway.test.ts` (cas : « exécute l’assistant via ws et écrit la config de jeton d’authentification »)

## Évaluations de fiabilité des agents (skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils mocké via le vrai Gateway + la boucle agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de configuration de bout en bout qui valident le câblage de session et les effets de config (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Décision :** lorsque des skills sont listés dans le prompt, l’agent choisit-il le bon skill (ou évite-t-il ceux qui ne sont pas pertinents) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites de sandbox.

Les futures évaluations doivent rester déterministes en priorité :

- Un runner de scénarios utilisant des providers mockés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de skill et le câblage de session.
- Une petite suite de scénarios centrés sur les skills (utiliser vs éviter, gating, injection de prompt).
- Évaluations live optionnelles (opt-in, protégées par variables d’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et chaque canal enregistré respecte son
contrat d’interface. Ils itèrent sur tous les Plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La lane unitaire `pnpm test` par défaut
ignore volontairement ces fichiers partagés de smoke et de jointure ; exécutez explicitement
les commandes de contrat lorsque vous touchez aux surfaces partagées de canal ou de provider.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de providers uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile de message
- **inbound** - Traitement des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de thread
- **directory** - API d’annuaire/roster
- **group-policy** - Application de la politique de groupe

### Contrats de statut des providers

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre des Plugins

### Contrats de providers

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat de flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte de Plugins
- **loader** - Chargement de Plugins
- **runtime** - Runtime de provider
- **shape** - Forme/interface de Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un Plugin de canal ou de provider
- Après refactorisation de l’enregistrement ou de la découverte de Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de provider/modèle découvert en live :

- Ajoutez si possible une régression compatible CI (provider mocké/stubé, ou capture de la transformation exacte de la forme de requête)
- Si c’est intrinsèquement live-only (limites de débit, politiques d’authentification), gardez le test live étroit et opt-in via variables d’environnement
- Préférez cibler la plus petite couche qui attrape le bug :
  - bug de conversion/relecture de requête provider → test direct de modèles
  - bug de pipeline session/historique/outils du Gateway → smoke live du Gateway ou test mock Gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les exec ids avec segments de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les ids de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Associé

- [Tester en live](/fr/help/testing-live)
- [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
