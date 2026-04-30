---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajout de tests de régression pour les bogues de modèle/fournisseur
    - Débogage du comportement du Gateway + de l’agent
summary: 'Kit de test : suites unitaires, e2e et live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-30T18:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw comporte trois suites Vitest (unitaires/intégration, e2e, live) et un petit ensemble
d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, pré-push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des exécuteurs Docker/Parallels. La section des exécuteurs propres à la QA ci-dessous ([exécuteurs propres à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Gate complet (attendu avant un push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de toute la suite sur une machine spacieuse : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route maintenant aussi les chemins d’extensions/canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez davantage de confiance :

- Gate de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage de modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un petit tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs de fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des jobs distincts de matrice de modèles live Docker
    répartis par fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal dans `scripts/ci-hydrate-live-auth.sh`
    ainsi que `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses appelants
    planifiés/de release.
- Smoke de discussion liée native Codex : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker sur le chemin app-server Codex, lie un DM synthétique
    Slack avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison native du Plugin au lieu d’ACP.
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex possédé par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    cron MCP, sous-agent et Guardian. Désactivez la sonde de sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs
    app-server Codex. Pour une vérification ciblée du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde de sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in redondante de la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file d’attente un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans config avec une fausse CLI Claude dans `PATH`
    et vérifie que le fallback de planificateur approximatif se traduit par une écriture de
    config typée auditée.
- Smoke Docker de premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique des écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la config et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    également couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à la QA

Ces commandes complètent les suites de tests principales lorsque vous avez besoin du réalisme QA-lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs simulés. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec le gate de parité simulé, la voie Matrix live,
la voie Telegram live gérée par Convex et la voie Discord live gérée par Convex comme
jobs parallèles. Les vérifications QA planifiées et de release passent explicitement Matrix `--profile fast`,
tandis que l’entrée par défaut de la CLI Matrix et du workflow manuel reste
`all` ; le déclenchement manuel peut répartir `all` en jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` et `e2ee-cli`. `OpenClaw Release Checks` exécute la parité ainsi que
les voies Matrix rapide et Telegram avant l’approbation de release, en utilisant
`mock-openai/gpt-5.5` pour les vérifications de transport de release afin qu’elles restent déterministes
et évitent le démarrage normal du Plugin fournisseur. Ces Gateway de transport live désactivent
la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les shards média live de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui possède déjà
`ffmpeg` et `ffprobe`. Les shards live Docker de modèles/backends utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une seule fois par commit sélectionné,
puis la tirent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque shard.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute plusieurs scénarios sélectionnés en parallèle par défaut avec des workers
    Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le
    nombre de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Quitte avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    de fixtures et de simulations de protocole sans remplacer la voie `mock-openai`
    consciente des scénarios.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le bench de démarrage Gateway plus un petit pack de scénarios QA Lab simulés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné d’observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale uniquement les observations de CPU chaud soutenues par défaut (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les courts pics de démarrage soient enregistrés comme métriques
    sans ressembler à la régression de Gateway bloquée pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; lancez d’abord un build lorsque le checkout ne possède pas
    déjà de sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’auth QA prises en charge et pratiques pour l’invité :
    clés fournisseur basées sur l’environnement, chemin de config fournisseur live QA et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport + résumé QA normaux ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive tar npm depuis le checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif par clé API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances runtime à la demande,
    exécute doctor et lance un tour d’agent local contre un endpoint OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application construite pour les transcriptions de contexte runtime embarqué.
    Il vérifie que le contexte runtime OpenClaw caché est persisté comme message personnalisé non affiché
    au lieu de fuir dans le tour utilisateur visible, puis amorce un JSONL de session cassée affectée et vérifie
    que `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un candidat de package OpenClaw dans Docker, exécute l’onboarding du package installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram live avec ce package
    installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive tar locale résolue au lieu de
    l’installer depuis le registre.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne Convex automatiquement.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Elle ne s’exécute pas à la fusion. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose également `Package Acceptance` pour une preuve produit exécutée à côté
  contre un package candidat. Il accepte une ref approuvée, une spécification npm publiée,
  une URL d’archive tar HTTPS plus SHA-256, ou un artefact d’archive tar d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec les profils de voie smoke, package, product, full ou custom.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le workflow QA Telegram
  contre le même artefact `package-under-test`.
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

- La preuve par artefact télécharge un artefact tarball depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empaquette et installe la version actuelle d’OpenClaw dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les canaux/plugins groupés via des
    modifications de configuration.
  - Vérifie que la découverte de configuration laisse absentes les dépendances
    d’exécution des plugins non configurés, que la première exécution configurée
    du Gateway ou de doctor installe à la demande les dépendances d’exécution de
    chaque plugin groupé, et qu’un second redémarrage ne réinstalle pas les
    dépendances déjà activées.
  - Installe aussi une base npm plus ancienne connue, active Telegram avant
    d’exécuter `openclaw update --tag <candidate>`, et vérifie que le doctor
    post-mise à jour du candidat répare les dépendances d’exécution des canaux
    groupés sans réparation post-installation côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke test natif de mise à jour d’installation empaquetée sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le paquet de base demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du Gateway, et un
    tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par voie.
  - La voie OpenAI utilise `openai/gpt-5.5` par défaut pour la preuve live du tour
    d’agent. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Encapsulez les longues exécutions locales dans un délai d’expiration hôte afin que les
    blocages de transport Parallels ne puissent pas consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de voies imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que l’enveloppe extérieure est bloquée.
  - La mise à jour Windows peut passer 10 à 15 minutes dans la réparation
    post-mise à jour des dépendances doctor/runtime sur un invité froid ; cela reste
    sain lorsque le journal de débogage npm imbriqué progresse.
  - N’exécutez pas cette enveloppe agrégée en parallèle avec des voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision lors de
    la restauration d’instantané, du service de paquets ou de l’état du gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés, car
    les façades de capacités telles que la parole, la génération d’images et la
    compréhension des médias sont chargées via les API d’exécution groupées même lorsque le tour
    d’agent lui-même vérifie seulement une réponse textuelle simple.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour des smoke tests directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker. Checkout source uniquement — les installations empaquetées n’expédient pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé avec les jetons des bots pilote et SUT provenant de l’environnement.
  - Requiert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être l’identifiant numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants mutualisés partagés. Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour des baux mutualisés.
  - Termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Requiert deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez le mode de communication bot-à-bot dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios de réponse incluent le RTT entre la requête d’envoi du pilote et la réponse SUT observée.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [Aperçu QA → Couverture des transports live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la vaste suite synthétique et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, le laboratoire QA acquiert un bail exclusif depuis un pool adossé à Convex, envoie des heartbeats
pour ce bail pendant l’exécution de la voie, et libère le bail à l’arrêt.

Échafaudage de référence du projet Convex :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, sinon `maintainer`)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en local loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` devrait utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) requièrent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe de point de terminaison, le délai d’expiration HTTP, et l’accessibilité admin/liste sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et
les utilitaires CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

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
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à la QA

L’architecture et les noms des assistants de scénarios pour les nouveaux adaptateurs de canal se trouvent dans [Aperçu QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le minimum requis : implémenter le runner de transport sur la couture hôte partagée `qa-lab`, déclarer `qaRunners` dans le manifeste du plugin, monter comme `openclaw qa <runner>`, et écrire des scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent étendre les shards multi-projets en configurations par projet pour la planification parallèle
- Fichiers : inventaires cœur/unitaires sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification du gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Devrait être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de repli large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugins générées, et non avec
    les API sources réelles des plugins groupés. Les chargements réels d’API de plugin relèvent des
    suites de contrat/intégration détenues par les plugins.

<AccordionGroup>
  <Accordion title="Projets, shards et voies limitées">

    - Les exécutions non ciblées de `pnpm test` utilisent douze configurations d’éclats plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique énorme processus natif de projet racine. Cela réduit le RSS maximal sur les machines chargées et évite que le travail d’auto-réponse/extension n’affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle de surveillance multi-éclats n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers/répertoires vers des voies ciblées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` étend par défaut les chemins git modifiés en voies ciblées peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, correspondances explicites de sources et dépendants locaux du graphe d’importation. Les modifications de configuration, d’initialisation ou de package ne lancent pas largement les tests, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la barrière normale de vérification locale intelligente pour les travaux étroits. Elle classe le diff en noyau, tests du noyau, extensions, tests d’extension, applications, docs, métadonnées de publication, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour une preuve par les tests. Les montées de version limitées aux métadonnées de publication exécutent des vérifications ciblées de version/configuration/dépendances racine, avec une garde qui rejette les changements de package hors du champ de version de premier niveau.
    - Les modifications du harnais ACP Docker live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker live et essai à blanc du planificateur Docker live. Les changements de `package.json` ne sont inclus que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exportations, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers à l’importation provenant des agents, commandes, plugins, assistants d’auto-réponse, de `plugin-sdk` et de zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en exécution restent sur les voies existantes.
    - Certains fichiers source d’assistance `plugin-sdk` et `commands` sélectionnés mappent aussi les exécutions en mode modifié vers des tests frères explicites dans ces voies légères, afin que les modifications d’assistants évitent de relancer toute la suite lourde pour ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les assistants du noyau de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en outre le sous-arbre reply en éclats agent-runner, dispatch et commands/state-routing afin qu’un compartiment lourd en importations ne possède pas toute la queue Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lot des extensions et l’éclat `agentic-plugins` réservé aux publications. La validation complète de publication déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de publication.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Lorsque vous modifiez les entrées de découverte d’outils de message ou le contexte
      d’exécution de Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions ciblées d’assistants pour les frontières pures de routage
      et de normalisation.
    - Gardez les suites d’intégration du runner intégré en bon état :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les ids ciblés et le comportement de Compaction continuent de circuler
      par les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux assistants ne sont
      pas un substitut suffisant à ces chemins d’intégration.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le
      runner non isolé dans les projets racine, e2e et configurations live.
    - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute aussi sur le
      runner non isolé partagé.
    - Chaque éclat `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut pour les processus Node
      enfants de Vitest afin de réduire le va-et-vient de compilation V8 pendant les grosses exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer au comportement V8
      standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` montre quelles voies architecturales un diff déclenche.
    - Le hook pre-commit ne fait que du formatage. Il remet en scène les fichiers formatés et
      n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant le transfert ou le push lorsque vous
      avez besoin de la barrière de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies ciblées peu coûteuses. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, configuration, package ou contrat nécessite vraiment une couverture
      Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec une limite de workers plus élevée.
    - La mise à l’échelle automatique locale des workers est volontairement conservatrice et recule
      lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest
      concurrentes font moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme
      `forceRerunTriggers` afin que les réexécutions en mode modifié restent correctes lorsque le câblage
      des tests change.
    - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes
      pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` active le rapport de durée d’importation Vitest ainsi que
      la sortie de ventilation des importations.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de chronométrage des éclats sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de configuration entière utilisent le chemin de configuration comme clé ; les éclats CI
      par motif d’inclusion ajoutent le nom de l’éclat afin que les éclats filtrés puissent être suivis
      séparément.
    - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les importations de démarrage,
      gardez les dépendances lourdes derrière une frontière locale étroite `*.runtime.ts` et
      moquez directement cette frontière au lieu d’importer en profondeur des assistants d’exécution uniquement
      pour les faire passer par `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif du projet racine pour ce diff
      commité et affiche le temps réel ainsi que le RSS maximal macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre sale courant
      en acheminant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      la surcharge de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+tas du runner pour la
      suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un vrai Gateway local loopback avec les diagnostics activés par défaut
  - Fait passer du churn synthétique de messages Gateway, de mémoire et de grandes charges utiles par le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clé
  - Voie étroite pour le suivi de régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins groupés sous `extensions/`
- Valeurs par défaut d’exécution :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut afin de réduire la surcharge d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement Gateway de bout en bout multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exécutions SSH
  - Vérifie le comportement de système de fichiers distant canonique via le pont fs du sandbox
- Attentes :
  - Sur adhésion uniquement ; ne fait pas partie de l’exécution par défaut de `pnpm test:e2e`
  - Nécessite une CLI locale `openshell` ainsi qu’un démon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et le sandbox
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts` et tests live de plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format de fournisseur, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (vrais réseaux, vraies politiques de fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer l’exécution de sous-ensembles resserrés plutôt que « tout »
- Les exécutions live sourcent `~/.profile` pour récupérer les clés d’API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de configuration/authentification dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez volontairement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et coupe les journaux de bootstrap du Gateway/le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer tous les journaux de démarrage.
- Rotation des clés d’API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent désormais des lignes de progression vers stderr afin que les appels longs aux fournisseurs soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeats Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Logique/tests modifiés : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Réseau du gateway / protocole WS / appairage touchés : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs propres à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests en direct (qui touchent au réseau)

Pour la matrice de modèles en direct, les validations rapides du backend CLI, les validations rapides ACP, le
harnais du serveur d’application Codex et tous les tests en direct des fournisseurs multimédias (Deepgram, BytePlus, ComfyUI, image,
musique, vidéo, harnais multimédia), ainsi que la gestion des identifiants pour les exécutions en direct, consultez
[Tests — suites en direct](/fr/help/testing-live).

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles en direct : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier en direct correspondant à la clé de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker en direct utilisent par défaut un plafond de validation rapide plus réduit afin qu’un balayage Docker complet reste praticable :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  souhaitez explicitement lancer l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker en direct une fois via `test:docker:live-build`, empaquette OpenClaw une fois sous forme d’archive npm avec `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image minimale est uniquement l’exécuteur Node/Git pour les voies d’installation, de mise à jour et de dépendances de plugins ; ces voies montent l’archive préconstruite. L’image fonctionnelle installe la même archive dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que des plafonds de ressources empêchent les voies lourdes en direct, d’installation npm et multiservice de toutes démarrer en même temps. Si une seule voie est plus lourde que les plafonds actifs, l’ordonnanceur peut quand même la démarrer lorsque le pool est vide, puis la laisse s’exécuter seule jusqu’à ce que de la capacité soit à nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. L’exécuteur effectue par défaut une vérification préalable Docker, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les durées des voies réussies dans `.artifacts/docker-tests/lane-timings.json` et utilise ces durées pour démarrer les voies les plus longues en premier lors des exécutions suivantes. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des voies sélectionnées, des besoins en paquets/images et des identifiants.
- `Package Acceptance` est la barrière de paquet native GitHub pour « cette archive installable fonctionne-t-elle comme un produit ? ». Elle résout un paquet candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse sous le nom `package-under-test`, puis exécute les voies Docker E2E réutilisables contre cette archive exacte au lieu de réempaqueter la référence sélectionnée. `workflow_ref` sélectionne les scripts de workflow/harnais approuvés, tandis que `package_ref` sélectionne le commit/la branche/l’étiquette source à empaqueter quand `source=ref` ; cela permet à la logique d’acceptation actuelle de valider d’anciens commits approuvés. Les profils sont ordonnés par étendue : `smoke` couvre rapidement installation/canal/agent ainsi que Gateway/configuration, `package` couvre le contrat de paquet/mise à jour/plugin ainsi que le dispositif de survivance à la mise à niveau sans clé et le remplacement natif par défaut pour la plupart de la couverture paquet/mise à jour Parallels, `product` ajoute les canaux MCP, le nettoyage cron/sous-agent, la recherche web OpenAI et OpenWebUI, et `full` exécute les blocs Docker du chemin de publication avec OpenWebUI. La validation de publication exécute un delta de paquet personnalisé (`bundled-channel-deps-compat plugins-offline`) ainsi que l’assurance qualité du paquet Telegram, car les blocs Docker du chemin de publication couvrent déjà les voies de paquet/mise à jour/plugin qui se chevauchent. Les commandes de relance Docker GitHub ciblées générées à partir des artefacts incluent l’artefact de paquet précédent et les entrées d’images préparées lorsqu’ils sont disponibles, afin que les voies échouées puissent éviter de reconstruire le paquet et les images.
- Les vérifications de construction et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. La garde parcourt le graphe statique construit à partir de `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant répartition importe des dépendances de paquet telles que Commander, l’interface d’invite, undici ou la journalisation avant la répartition de la commande ; elle maintient aussi le bloc groupé d’exécution du Gateway sous le budget et rejette les importations statiques de chemins Gateway froids connus. La validation rapide de la CLI empaquetée couvre aussi l’aide racine, l’aide d’intégration, l’aide doctor, l’état, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harnais ne tolère que les lacunes de métadonnées de paquets publiés : entrées d’inventaire QA privé omises, absence de `gateway install --wrapper`, fichiers de correctif manquants dans le dispositif Git dérivé de l’archive, absence de `update.channel` persistant, emplacements hérités des enregistrements d’installation de plugins, absence de persistance des enregistrements d’installation de la place de marché et migration des métadonnées de configuration pendant `plugins update`. Pour les paquets postérieurs à `2026.4.25`, ces chemins sont des échecs stricts.
- Exécuteurs de validation rapide de conteneurs : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les exécuteurs Docker de modèles en direct montent aussi en lecture-écriture uniquement les répertoires d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution, afin que l’OAuth des CLI externes puisse actualiser les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke test de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke test du harnais du serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke test d’observabilité : `pnpm qa:otel:smoke` est une voie privée de QA sur une extraction des sources. Elle ne fait volontairement pas partie des voies de publication Docker du paquet, car l’archive npm omet QA Lab.
- Smoke test live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke test de l’onboarding/canal/agent de l’archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker l’archive OpenClaw empaquetée, configure OpenAI via l’onboarding par référence d’environnement ainsi que Telegram par défaut, vérifie que doctor a réparé les dépendances d’exécution du Plugin activé, puis exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction côté hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement dans Docker l’archive OpenClaw empaquetée, passe du paquet `stable` à git `dev`, vérifie le canal persistant et le fonctionnement post-mise à jour du Plugin, puis revient au paquet `stable` et contrôle l’état de mise à jour.
- Smoke test de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive OpenClaw empaquetée par-dessus une fixture d’ancien utilisateur en état sale avec des agents, une configuration de canal, des listes d’autorisation de Plugins, un état obsolète de dépendances d’exécution de Plugins, et des fichiers d’espace de travail/session existants. Il exécute la mise à jour du paquet ainsi que doctor non interactif sans fournisseur live ni clés de canal, puis démarre un Gateway local loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/statut.
- Smoke test du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance cachée de la transcription du contexte d’exécution ainsi que la réparation par doctor des branches dupliquées de réécriture de prompt affectées.
- Smoke test d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un répertoire personnel isolé, et vérifie que `openclaw infer image providers --json` retourne les fournisseurs d’images inclus au lieu de bloquer. Réutilisez une archive préconstruite avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction côté hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un cache npm unique entre ses conteneurs root, update et direct-npm. Le smoke test de mise à jour utilise par défaut npm `latest` comme base stable avant de passer à l’archive candidate. Remplacez-la avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications d’installateur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des relances locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cet env quand la couverture directe `npm install -g` est nécessaire.
- Smoke test CLI de suppression par des agents d’un espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, amorce deux agents avec un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json`, et vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Smoke test d’instantané CDP navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôles CDP couvrent les URL de liens, les éléments cliquables promus par curseur, les références d’iframe et les métadonnées de frames.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` augmente `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway amorcé + pont stdio + smoke test de trame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + smoke test allow/deny du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage Cron/sous-agent MCP (Gateway réel + arrêt du processus enfant MCP stdio après des exécutions cron isolées et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke test d’installation, installation/désinstallation ClawHub kitchen-sink, mises à jour de marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/exécution kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur fixture ClawHub local hermétique.
- Smoke test de mise à jour de Plugin inchangée : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances d’exécution des Plugins inclus : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image Docker d’exécution, construit et empaquette OpenClaw une fois sur l’hôte, puis monte cette archive dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction côté hôte après une construction locale fraîche avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers une archive existante avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L’agrégat Docker complet et les morceaux bundled-channel du chemin de publication pré-empaquettent cette archive une seule fois, puis partitionnent les vérifications des canaux inclus en voies indépendantes, y compris des voies de mise à jour séparées pour Telegram, Discord, Slack, Feishu, memory-lancedb et ACPX. Les morceaux de publication séparent les smoke tests de canal, les cibles de mise à jour et les contrats setup/runtime en `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` et `bundled-channels-contracts` ; le morceau agrégé `bundled-channels` reste disponible pour les relances manuelles. Le workflow de publication sépare aussi les morceaux d’installation des fournisseurs et les morceaux d’installation/désinstallation des Plugins inclus ; les anciens morceaux `package-update`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés pour les relances manuelles. Utilisez `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` pour restreindre la matrice des canaux lors de l’exécution directe de la voie incluse, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` pour restreindre le scénario de mise à jour. Les exécutions Docker par scénario utilisent par défaut `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` ; le scénario de mise à jour multi-cibles utilise par défaut `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La voie vérifie aussi que `channels.<id>.enabled=false` et `plugins.entries.<id>.enabled=false` suppriment la réparation des dépendances d’exécution par doctor.
- Restreignez les dépendances d’exécution des Plugins inclus pendant l’itération en désactivant les scénarios sans rapport, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et d’installateur conservent leurs propres Dockerfiles, car ils valident le comportement de paquet/d’installation plutôt que l’exécution de l’application construite partagée.

Les runners Docker de modèles en direct montent également le checkout actuel en lecture seule et
le placent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les gros caches locaux uniquement et les sorties de compilation d’app
comme `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires `.build` locaux aux apps ou les répertoires de sortie Gradle, afin que les exécutions Docker en direct ne passent pas des minutes à copier des artefacts propres à la machine.
Elles définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes en direct du gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture en direct du gateway
de cette lane Docker.
`test:docker:openwebui` est un smoke test de compatibilité de plus haut niveau : il démarre un
conteneur gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette lane attend une clé de modèle en direct utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway prérempli,
démarre un second conteneur qui lance `openclaw mcp serve`, puis vérifie la
découverte de conversations routées, les lectures de transcriptions, les métadonnées de pièces jointes,
le comportement de la file d’événements en direct, le routage des envois sortants, ainsi que les notifications de canal +
permission de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes, afin que le smoke test valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client spécifique expose par hasard.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle en direct. Il compile l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle en direct. Il démarre un Gateway prérempli avec un vrai serveur de sonde MCP stdio, exécute un tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke test manuel de thread ACP en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être à nouveau nécessaire pour valider le routage des threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires de configuration/espace de travail temporaires et sans montages d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externe sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes à un fournisseur ne montent que les répertoires/fichiers nécessaires inférés depuis `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors des réexécutions qui ne nécessitent pas de recompilation
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants viennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le gateway pour le smoke test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification par nonce utilisé par le smoke test Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification documentaire

Exécutez les contrôles de documentation après les modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez aussi vérifier les titres dans les pages : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Voici des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outil Gateway (OpenAI simulé, vrai gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de configuration Gateway (WS `wizard.start`/`wizard.next`, écrit la configuration + auth appliquée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outil simulé via le vrai gateway + la boucle d’agent (`src/gateway/gateway.test.ts`).
- Flows d’assistant de configuration de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Décision :** lorsque des skills sont listées dans le prompt, l’agent choisit-il la bonne skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la reprise de l’historique de session et les limites du sandbox.

Les futures évaluations doivent rester déterministes en priorité :

- Un runner de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de skill et le câblage de session.
- Une petite suite de scénarios centrés sur les skills (utiliser vs éviter, gates, injection de prompt).
- Des évaluations en direct optionnelles (opt-in, protégées par variables d’environnement) seulement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et canaux)

Les tests de contrat vérifient que chaque plugin et chaque canal enregistré respecte son
contrat d’interface. Ils itèrent sur tous les plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La lane unitaire `pnpm test` par défaut
ignore intentionnellement ces fichiers de smoke test et de seam partagés ; exécutez explicitement
les commandes de contrat lorsque vous touchez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de la charge utile des messages
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des identifiants de thread
- **directory** - API d’annuaire/liste
- **group-policy** - Application de la politique de groupe

### Contrats de statut des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre de plugins

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flow d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte des plugins
- **loader** - Chargement des plugins
- **runtime** - Runtime du fournisseur
- **shape** - Forme/interface du plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après avoir modifié les exports ou sous-chemins de plugin-sdk
- Après avoir ajouté ou modifié un canal ou un plugin fournisseur
- Après avoir refactorisé l’enregistrement ou la découverte des plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés d’API.

## Ajout de régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en direct :

- Ajoutez une régression compatible CI si possible (fournisseur simulé/stub, ou capture de la transformation exacte de la forme de requête)
- Si c’est intrinsèquement en direct uniquement (limites de débit, politiques d’authentification), gardez le test en direct restreint et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/rejeu de requête fournisseur → test direct des modèles
  - bug de pipeline de session/historique/outils gateway → smoke test gateway en direct ou test gateway simulé compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les ids exec à segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les ids de cible non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Liens associés

- [Tests en direct](/fr/help/testing-live)
- [CI](/fr/ci)
