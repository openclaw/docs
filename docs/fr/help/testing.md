---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajout de tests de régression pour les bogues de modèles/fournisseurs
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/en direct, exécuteurs Docker et ce que chaque test couvre'
title: Tests
x-i18n:
    generated_at: "2026-05-02T07:10:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unitaire/intégration, e2e, live) et d’un petit ensemble
de runners Docker. Ce document est un guide « comment nous testons » :

- Ce que chaque suite couvre (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, pré-push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour les problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des runners Docker/Parallels. La section des runners spécifiques à la QA ci-dessous ([Runners spécifiques à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Gate complet (attendu avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de toute la suite sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers route désormais aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez plus de confiance :

- Gate de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes Gateway d’outils/images) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage live de modèles Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour de texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent l’entrée `image` exécutent aussi un minuscule tour d’image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs de fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow réutilisable live/E2E avec
    `include_live_suites: true`, ce qui inclut des jobs matriciels de modèles live Docker séparés
    par fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets de fournisseur à signal fort à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de release.
- Smoke de chat lié Codex natif : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin app-server Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison Plugin native au lieu d’ACP.
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex détenu par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes d’image,
    cron MCP, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs
    de l’app-server Codex. Pour une vérification sous-agent ciblée, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ceci quitte après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in redondante de la surface de commande de secours du canal de message.
    Elle exerce `/crestodian status`, met en file une modification persistante de modèle,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans config avec une fausse CLI Claude dans `PATH`
    et vérifie que le fallback du planificateur approximatif se traduit par une écriture
    de config typée et auditée.
- Smoke Docker du premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la config et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Runners spécifiques à la QA

Ces commandes accompagnent les suites de tests principales lorsque vous avez besoin du réalisme de QA Lab :

CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs mock. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec le gate de parité mock, la voie Matrix live,
la voie Telegram live gérée par Convex et la voie Discord live gérée par Convex en
jobs parallèles. La QA planifiée et les vérifications de release passent explicitement Matrix `--profile fast`,
tandis que la CLI Matrix et l’entrée de workflow manuelle restent par défaut sur
`all` ; le déclenchement manuel peut partitionner `all` en jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` et `e2ee-cli`. `OpenClaw Release Checks` exécute la parité plus
les voies Matrix rapides et Telegram avant l’approbation de release, en utilisant
`mock-openai/gpt-5.5` pour les vérifications de transport de release afin qu’elles restent déterministes
et évitent le démarrage normal du Plugin fournisseur. Ces Gateway de transport live désactivent
la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les shards live media de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui contient déjà
`ffmpeg` et `ffprobe`. Les shards de modèles/backends live Docker utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une seule fois par commit sélectionné,
puis la tirent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque shard.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute plusieurs scénarios sélectionnés en parallèle par défaut avec des workers
    Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre
    de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Quitte avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    de fixtures et de mocks de protocole sans remplacer la voie `mock-openai` consciente des scénarios.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage Gateway plus un petit pack de scénarios QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné d’observation CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale uniquement les observations CPU chaudes soutenues par défaut (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les brèves poussées de démarrage soient enregistrées comme métriques
    sans ressembler à la régression de Gateway bloquée pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; lancez d’abord un build lorsque le checkout ne dispose pas
    déjà d’une sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’auth QA prises en charge qui sont pratiques pour l’invité :
    clés fournisseur basées sur l’environnement, chemin de config du fournisseur live QA et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm depuis le checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif de clé API OpenAI, configure Telegram
    par défaut, vérifie que le runtime Plugin empaqueté se charge sans réparation
    de dépendances au démarrage, exécute doctor, et exécute un tour d’agent local contre un
    endpoint OpenAI mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe d’application construite pour les transcriptions de contexte runtime
    embarqué. Il vérifie que le contexte runtime OpenClaw masqué est persisté comme un
    message personnalisé non affiché au lieu de fuir dans le tour utilisateur visible,
    puis amorce un JSONL de session cassée affectée et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un candidat de paquet OpenClaw dans Docker, exécute l’onboarding du paquet installé,
    configure Telegram via la CLI installée, puis réutilise la
    voie QA Telegram live avec ce paquet installé comme Gateway SUT.
  - Par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive locale résolue au lieu
    d’installer depuis le registre.
  - Utilise les mêmes identifiants d’environnement Telegram ou la source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne Convex automatiquement.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme le workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Elle ne s’exécute pas au merge. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose aussi `Package Acceptance` pour une preuve produit en exécution parallèle
  contre un paquet candidat. Il accepte une ref de confiance, une spec npm publiée,
  une URL d’archive HTTPS plus SHA-256, ou un artefact d’archive d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec des profils de voies smoke, package, product, full ou personnalisés.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le
  workflow QA Telegram contre le même artefact `package-under-test`.
  - Dernière preuve produit bêta :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La preuve par URL d’archive exacte nécessite un digest :

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
  - Empaquette et installe la version actuelle d’OpenClaw dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les canaux/plugins groupés via des modifications
    de configuration.
  - Vérifie que la découverte de la configuration laisse absents les plugins téléchargeables non configurés,
    que la première réparation `doctor` configurée installe explicitement chaque plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendances
    cachée.
  - Installe aussi une référence npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le `doctor` post-mise à jour
    du candidat nettoie les résidus de dépendances de plugin hérités sans réparation
    `postinstall` côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke de mise à jour d’installation packagée native sur les invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package de référence demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du gateway, et un tour
    d’agent local.
  - Utilisez `--platform macos`, `--platform windows`, ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par voie.
  - La voie OpenAI utilise `openai/gpt-5.5` pour la preuve de tour d’agent en direct par
    défaut. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Enveloppez les longues exécutions locales dans un délai d’expiration hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de voies imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log`, ou `linux-update.log`
    avant de supposer que l’enveloppe externe est bloquée.
  - La mise à jour Windows peut passer 10 à 15 minutes dans le travail post-mise à jour de `doctor` et de mise à jour
    de package sur un invité froid ; cela reste sain tant que le journal de débogage npm
    imbriqué progresse.
  - N’exécutez pas cette enveloppe agrégée en parallèle avec les voies de smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision lors de
    la restauration d’instantané, du service de package, ou de l’état du gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés parce que
    les façades de capacité comme la parole, la génération d’images, et la compréhension
    des médias sont chargées via les API d’exécution groupées même lorsque le tour
    d’agent lui-même ne vérifie qu’une réponse textuelle simple.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour les tests de smoke directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA Matrix en direct contre un homeserver Tuwunel jetable adossé à Docker. Checkout source uniquement — les installations packagées ne livrent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement, et organisation des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA Telegram en direct contre un vrai groupe privé en utilisant les jetons de bot pilote et SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id de groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants mutualisés partagés. Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les baux mutualisés.
  - Quitte avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez le mode Bot-to-Bot Communication dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, un résumé, et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios de réponse incluent le RTT depuis la requête d’envoi du pilote jusqu’à la réponse SUT observée.

Les voies de transport en direct partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [Aperçu QA → Couverture du transport en direct](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la suite synthétique large et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, le labo QA acquiert un bail exclusif depuis un pool adossé à Convex, envoie des Heartbeat
pour ce bail pendant l’exécution de la voie, et libère le bail à l’arrêt.

Échafaudage de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Par défaut via l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (valeur par défaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex loopback `http://` pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration de mainteneur (ajouter/supprimer/lister dans le pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions en direct pour vérifier l’URL du site Convex, les secrets du broker,
le préfixe de point de terminaison, le délai d’expiration HTTP, et l’accessibilité admin/liste sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et utilitaires
CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

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
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Réussite : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Réussite : `{ status: "ok", changed, credential }`
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Réussite : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’id numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à QA

Les noms d’architecture et d’assistants de scénarios pour les nouveaux adaptateurs de canal se trouvent dans [Aperçu QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le minimum requis : implémenter le runner de transport sur le seam hôte `qa-lab` partagé, déclarer `qaRunners` dans le manifeste du plugin, monter en tant que `openclaw qa <runner>`, et rédiger les scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent étendre les shards multiprojets en configurations par projet pour la planification parallèle
- Fichiers : inventaires cœur/unitaires sous `src/**/*.test.ts`, `packages/**/*.test.ts`, et `test/**/*.test.ts` ; les tests unitaires d’interface utilisateur s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration dans le processus (authentification du gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests de résolveur et de chargeur de surface publique doivent prouver le comportement de repli large `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugin générées, pas avec
    les API source des vrais plugins groupés. Les chargements de vraies API de plugin appartiennent aux
    suites de contrat/intégration possédées par les plugins.

<AccordionGroup>
  <Accordion title="Projets, shards et voies délimitées">

    - `pnpm test` non ciblé exécute douze configurations de fragments plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique énorme processus de projet racine natif. Cela réduit le pic de RSS sur les machines chargées et évite que le travail auto-reply/extensions affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle de surveillance multi-fragments n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` font d’abord passer les cibles explicites de fichiers/répertoires par des voies limitées à leur périmètre, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer tout le coût de démarrage du projet racine.
    - `pnpm test:changed` étend par défaut les chemins git modifiés en voies peu coûteuses et limitées à leur périmètre : modifications directes de tests, fichiers frères `*.test.ts`, mappages explicites de sources et dépendants du graphe d’import local. Les modifications de config/setup/package ne lancent pas de tests larges, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de contrôle locale intelligente normale pour les travaux étroits. Elle classe le diff en core, tests core, extensions, tests d’extension, applications, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les commandes de vérification de types, de lint et de garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour obtenir une preuve par test. Les changements de version limités aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine, avec une garde qui rejette les changements de package en dehors du champ de version de premier niveau.
    - Les modifications du harnais ACP Docker live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’auth Docker live et exécution à blanc du planificateur Docker live. Les changements de `package.json` ne sont inclus que lorsque le diff se limite à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exports, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires à imports légers provenant des agents, commandes, plugins, assistants auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en runtime restent sur les voies existantes.
    - Certains fichiers sources d’assistants `plugin-sdk` et `commands` mappent aussi les exécutions en mode changements vers des tests frères explicites dans ces voies légères, de sorte que les modifications d’assistants évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les assistants core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en plus le sous-arbre reply en fragments agent-runner, dispatch et commands/state-routing, afin qu’un compartiment lourd en imports ne possède pas toute la queue Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lots des extensions et le fragment `agentic-plugins` réservé aux releases. Full Release Validation déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de release.

  </Accordion>

  <Accordion title="Couverture du runner intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte runtime de compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions ciblées d’assistants pour les frontières de routage et de normalisation pures.
    - Gardez les suites d’intégration du runner intégré en bon état :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants à périmètre limité et le comportement de compaction passent toujours par les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux assistants ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool et de l’isolation Vitest">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le runner non isolé dans les projets racine, e2e et configurations live.
    - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute aussi sur le runner partagé non isolé.
    - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut pour les processus Node enfants de Vitest afin de réduire le va-et-vient de compilation V8 pendant les grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8 standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` affiche les voies architecturales déclenchées par un diff.
    - Le hook pre-commit ne fait que du formatage. Il remet en stage les fichiers formatés et n’exécute ni lint, ni vérification de types, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant handoff ou push lorsque vous avez besoin de la porte de contrôle locale intelligente.
    - `pnpm test:changed` passe par des voies peu coûteuses et limitées à leur périmètre par défaut. N’utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` que lorsque l’agent décide qu’une modification de harnais, de configuration, de package ou de contrat nécessite réellement une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, mais avec un plafond de workers plus élevé.
    - L’auto-scaling des workers locaux est volontairement conservateur et ralentit lorsque la moyenne de charge de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest concurrentes causent moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme `forceRerunTriggers` afin que les relances en mode changements restent correctes lorsque le câblage des tests change.
    - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport de durée des imports Vitest ainsi que la sortie de décomposition des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
    - Les données de timing des fragments sont écrites dans `.artifacts/vitest-shard-timings.json`. Les exécutions de configuration complète utilisent le chemin de configuration comme clé ; les fragments CI à motif d’inclusion ajoutent le nom du fragment afin que les fragments filtrés puissent être suivis séparément.
    - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les imports de démarrage, gardez les dépendances lourdes derrière une frontière locale étroite `*.runtime.ts` et mockez directement cette frontière au lieu d’importer profondément des assistants runtime seulement pour les faire passer par `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le `test:changed` routé au chemin de projet racine natif pour ce diff committé et affiche le temps d’exécution total ainsi que le RSS max macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail sale actuel en faisant passer la liste des fichiers modifiés par `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour le démarrage Vitest/Vite et le surcoût des transformations.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la suite unitaire avec le parallélisme par fichier désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Config : `vitest.gateway.config.ts`, forcée à un worker
- Périmètre :
  - Démarre un vrai Gateway loopback avec diagnostics activés par défaut
  - Envoie de la variation synthétique de messages gateway, de mémoire et de grosses charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance des bundles de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de files par session redescendent à zéro
- Attentes :
  - Sûr pour la CI et sans clés
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à toute la suite Gateway

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Config : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins intégrés sous `extensions/`
- Valeurs runtime par défaut :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le surcoût d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Périmètre :
  - Comportement gateway de bout en bout multi-instance
  - Surfaces WebSocket/HTTP, appairage de nodes et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus d’éléments mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Périmètre :
  - Démarre une gateway OpenShell isolée sur l’hôte via Docker
  - Crée un bac à sable à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + une exécution SSH
  - Vérifie le comportement de système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Requiert une CLI `openshell` locale ainsi qu’un daemon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit la gateway de test et le bac à sable
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts` et tests live de plugins intégrés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Périmètre :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (vrais réseaux, vraies politiques de fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient les éléments de config/auth dans un home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et met en sourdine les logs de bootstrap gateway/le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer tous les logs de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format séparé par virgules/points-virgules ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge live par `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression sur stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console Vitest afin que les lignes de progression fournisseur/gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les heartbeats gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau du Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « my bot is down » / échecs propres à un fournisseur / appels d’outils : exécutez un `pnpm test:live` restreint

## Tests en direct (qui touchent au réseau)

Pour la matrice de modèles en direct, les tests smoke du backend CLI, les tests smoke ACP, le harnais
de serveur d’application Codex, et tous les tests en direct des fournisseurs de médias (Deepgram, BytePlus, ComfyUI, image,
musique, vidéo, harnais média), ainsi que la gestion des identifiants pour les exécutions en direct, consultez
[Tester les suites en direct](/fr/help/testing-live). Pour la liste de contrôle dédiée aux mises à jour et à la validation des
plugins, consultez
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Runners Docker (vérifications facultatives « fonctionne sous Linux »)

Ces runners Docker se répartissent en deux catégories :

- Runners de modèles en direct : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier en direct correspondant à la clé de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker en direct utilisent par défaut un plafond smoke plus réduit afin qu’un balayage Docker complet reste praticable :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker en direct une fois via `test:docker:live-build`, empaquette OpenClaw une fois en tarball npm avec `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image minimale est seulement le runner Node/Git pour les voies d’installation, de mise à jour et de dépendances de plugins ; ces voies montent la tarball préconstruite. L’image fonctionnelle installe la même tarball dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les voies lourdes en direct, d’installation npm et multiservices de démarrer toutes en même temps. Si une seule voie est plus lourde que les plafonds actifs, l’ordonnanceur peut tout de même la démarrer quand le pool est vide, puis la laisse s’exécuter seule jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. Le runner effectue par défaut une vérification préalable Docker, supprime les conteneurs E2E OpenClaw périmés, affiche l’état toutes les 30 secondes, stocke les timings des voies réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces timings pour lancer d’abord les voies plus longues lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des voies sélectionnées, les besoins de packages/images et les identifiants.
- `Package Acceptance` est la barrière de package native GitHub pour « cette tarball installable fonctionne-t-elle comme un produit ? ». Elle résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, l’importe comme `package-under-test`, puis exécute les voies E2E Docker réutilisables sur cette tarball exacte au lieu de réempaqueter la ref sélectionnée. Les profils sont ordonnés par ampleur : `smoke`, `package`, `product` et `full`. Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat package/mise à jour/Plugin, la matrice de survivance des mises à niveau publiées, les valeurs par défaut de publication et le triage des échecs.
- Les vérifications de build et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe statique construit depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant répartition importe des dépendances de package telles que Commander, l’interface de prompt, undici ou la journalisation avant la répartition de commande ; il maintient aussi le fragment d’exécution du Gateway groupé sous le budget et rejette les imports statiques de chemins Gateway froids connus. Le smoke de CLI empaquetée couvre aussi l’aide racine, l’aide d’onboarding, l’aide doctor, l’état, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harnais ne tolère que les lacunes de métadonnées des packages publiés : entrées omises d’inventaire QA privé, `gateway install --wrapper` manquant, fichiers de correctif manquants dans le fixture git dérivé de la tarball, `update.channel` persisté manquant, emplacements hérités des enregistrements d’installation de plugins, persistance manquante des enregistrements d’installation de marketplace, et migration des métadonnées de configuration pendant `plugins update`. Pour les packages après `2026.4.25`, ces chemins sont des échecs stricts.
- Runners smoke de conteneurs : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de niveau supérieur.

Les runners Docker de modèles en direct montent aussi uniquement les répertoires personnels d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke ACP bind : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais du serveur d’app Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke d’observabilité : `pnpm qa:otel:smoke` est une voie privée de contrôle QA sur un checkout source. Elle ne fait volontairement pas partie des voies de publication Docker de paquet, car l’archive npm omet QA Lab.
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke d’intégration/canal/agent de l’archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker l’archive OpenClaw empaquetée, configure OpenAI via une intégration par référence d’environnement plus Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez une archive précompilée avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la recompilation hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement dans Docker l’archive OpenClaw empaquetée, passe du paquet `stable` à git `dev`, vérifie le canal persistant et le fonctionnement du plugin après mise à jour, puis revient au paquet `stable` et vérifie l’état de mise à jour.
- Smoke de survivance à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive OpenClaw empaquetée par-dessus une fixture d’ancien utilisateur modifiée avec agents, configuration de canal, listes d’autorisation de plugins, état obsolète des dépendances de plugins, et fichiers d’espace de travail/session existants. Il exécute la mise à jour du paquet plus doctor non interactif sans clés de fournisseur ni de canal live, puis démarre un Gateway en loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/d’état.
- Smoke publié de survivance à la mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, ensemence des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commande intégrée, valide la configuration obtenue, met à jour cette installation publiée vers l’archive candidate, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz`, et les budgets d’état RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur d’agrégat d’étendre les bases exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, et étendez les fixtures de forme issue avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` comme `reported-issues` ; Package Acceptance expose ces éléments sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, et `published_upgrade_survivor_scenarios`.
- Smoke de contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance masquée du transcript de contexte d’exécution ainsi que la réparation par doctor des branches dupliquées affectées de réécriture de prompt.
- Smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre courant, l’installe avec `bun install -g` dans un répertoire home isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de rester bloqué. Réutilisez une archive précompilée avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la compilation hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker compilée avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, update et direct-npm. Le smoke de mise à jour utilise par défaut npm `latest` comme base stable avant mise à niveau vers l’archive candidate. Remplacez avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installateur sans root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local à l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des relances locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cet env quand une couverture directe de `npm install -g` est nécessaire.
- Smoke CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit l’image Dockerfile racine par défaut, ensemence deux agents avec un espace de travail dans un répertoire home de conteneur isolé, exécute `agents delete --json`, et vérifie du JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Smoke d’instantané CDP du navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôles CDP couvrent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe, et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` relève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway ensemencé + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + smoke autoriser/refuser du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (Gateway réel + arrêt du processus enfant MCP stdio après des exécutions cron isolée et sous-agent ponctuelle) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mouvantes, ClawHub kitchen-sink, mises à jour de marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/runtime kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur fixture ClawHub local hermétique.
- Smoke de mise à jour de Plugin inchangée : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre le smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mouvantes, fixtures ClawHub, mises à jour de marketplace, et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les plugins installés.

Pour précompiler et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Quand `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles, car ils valident le comportement de paquet/d’installation plutôt que l’exécution partagée de l’app compilée.

Les exécuteurs Docker live-model montent aussi le checkout courant en lecture seule et
le mettent en place dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest contre votre source/config locale exacte.
L’étape de mise en place ignore les grands caches uniquement locaux et les sorties de build d’app, comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, et les répertoires locaux d’app `.build` ou
de sortie Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier
des artefacts propres à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les probes live Gateway ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live
Gateway de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur de gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est la principale manière de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
ensemencé, démarre un deuxième conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture de transcripts, les métadonnées de pièces jointes,
le comportement de file d’événements live, le routage d’envoi sortant, et les notifications de canal +
permission de style Claude sur le vrai pont MCP stdio. La vérification de notification
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier expose.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle live.
Il construit l’image Docker du dépôt, démarre un vrai serveur de probe MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway ensemencé avec un vrai serveur de probe MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel de thread ACP en langage naturel (pas en CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourra être nécessaire de nouveau pour la validation du routage de threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires temporaires de configuration/espace de travail et aucun montage externe d’authentification CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le début des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à un provider ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les providers dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de réexécutions qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour s’assurer que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence de la documentation

Exécutez les vérifications de documentation après les modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifications des titres dans les pages : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions du « vrai pipeline » sans vrais providers :

- Appel d’outils Gateway (OpenAI simulé, Gateway réel + boucle agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écrit la configuration + authentification imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le vrai Gateway + la boucle agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Décision :** lorsque les skills sont listées dans le prompt, l’agent choisit-il la bonne skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la reprise de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des providers simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de skill et le câblage de session.
- Une petite suite de scénarios centrés sur les skills (utiliser ou éviter, garde-fous, injection de prompt).
- Évaluations live facultatives (opt-in, contrôlées par variables d’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque plugin et chaque canal enregistré respecte son
contrat d’interface. Ils parcourent tous les plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire par défaut de `pnpm test`
ignore volontairement ces fichiers de smoke et de points de jonction partagés ; exécutez explicitement
les commandes de contrat lorsque vous touchez aux surfaces partagées de canal ou de provider.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de providers uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de la charge utile des messages
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de fil
- **directory** - API d’annuaire/liste
- **group-policy** - Application de la politique de groupe

### Contrats de statut des providers

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre des plugins

### Contrats de providers

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte des plugins
- **loader** - Chargement des plugins
- **runtime** - Runtime du provider
- **shape** - Forme/interface du plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après une modification des exports ou sous-chemins de plugin-sdk
- Après l’ajout ou la modification d’un canal ou d’un plugin provider
- Après une refactorisation de l’enregistrement ou de la découverte des plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajout de régressions (recommandations)

Lorsque vous corrigez un problème de provider/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (provider simulé/stub, ou capture de la transformation exacte de la forme de requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live restreint et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/rejeu de requête provider → test direct de modèles
  - bug de pipeline Gateway session/historique/outils → smoke live Gateway ou test mock Gateway compatible CI
- Garde-fou de parcours SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` déduit une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les ids exec contenant des segments de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les ids de cible non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Liens connexes

- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
