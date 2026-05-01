---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajouter des tests de régression pour les bogues de modèles/fournisseurs
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/en direct, exécuteurs Docker et ce que chaque test couvre'
title: Tests
x-i18n:
    generated_at: "2026-05-01T07:15:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw possède trois suites Vitest (unitaires/intégration, e2e, live) et un petit ensemble
de lanceurs Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle choisit délibérément de _ne pas_ couvrir).
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour les problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des lanceurs Docker/Parallels. La section ci-dessous consacrée aux lanceurs QA ([lanceurs spécifiques QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Gate complet (attendu avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution plus rapide de toute la suite en local sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées quand vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quand vous touchez aux tests ou voulez davantage de confiance :

- Gate de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes Gateway outil/image) : `pnpm test:live`
- Cibler discrètement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage de modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de style lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow réutilisable live/E2E avec
    `include_live_suites: true`, ce qui inclut des jobs de matrice live Docker distincts
    fragmentés par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal dans `scripts/ci-hydrate-live-auth.sh`
    ainsi que `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/de release.
- Smoke de chat lié Codex natif : `pnpm test:docker:live-codex-bind`
  - Exécute une voie Docker live contre le chemin app-server Codex, lie un DM
    Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison Plugin native plutôt que par ACP.
- Smoke de harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute les tours d’agent Gateway via le harnais app-server Codex détenu par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    cron MCP, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs
    app-server Codex. Pour une vérification sous-agent ciblée, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cette commande se termine après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in redondante de la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file une modification persistante du modèle,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans config avec une fausse CLI Claude dans `PATH`
    et vérifie que le repli du planificateur flou se traduit par une écriture de config typée
    auditée.
- Smoke Docker de premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Part d’un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique la configuration initiale/modèle/agent/Plugin Discord + écritures SecretRef,
    valide la config et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    également couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Lanceurs spécifiques QA

Ces commandes complètent les suites de tests principales lorsque vous avez besoin du réalisme QA-lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
par déclenchement manuel avec des fournisseurs mock. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et par déclenchement manuel avec le gate de parité mock, la voie Matrix live,
la voie Telegram live gérée par Convex et la voie Discord live gérée par Convex en
jobs parallèles. Les vérifications QA planifiées et de release passent explicitement Matrix `--profile fast`,
tandis que la CLI Matrix et l’entrée de workflow manuel restent par défaut sur
`all` ; le déclenchement manuel peut fragmenter `all` en jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` et `e2ee-cli`. `OpenClaw Release Checks` exécute la parité plus
les voies Matrix rapide et Telegram avant l’approbation de release, en utilisant
`mock-openai/gpt-5.5` pour les vérifications de transport de release afin qu’elles restent déterministes
et évitent le démarrage normal des Plugins fournisseur. Ces Gateway de transport live désactivent
la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les fragments de média live de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui possède déjà
`ffmpeg` et `ffprobe`. Les fragments Docker de modèles/backends live utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit sélectionné,
puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque fragment.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des workers
    Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de workers,
    ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    de fixtures et de mocks de protocole sans remplacer la voie `mock-openai` sensible aux scénarios.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le bench de démarrage Gateway plus un petit paquet de scénarios QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale par défaut uniquement les observations CPU chaudes soutenues (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), de sorte que les courts pics de démarrage sont enregistrés comme métriques
    sans ressembler à la régression d’accrochage Gateway durant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; exécutez d’abord un build lorsque le checkout ne possède pas
    déjà une sortie d’exécution fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés fournisseur fondées sur l’environnement, chemin de config fournisseur live QA et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport + résumé QA normaux ainsi que les logs Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit un tarball npm depuis le checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif de clé API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances d’exécution à la demande,
    exécute doctor, puis exécute un tour d’agent local contre un endpoint OpenAI mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application construite pour les transcriptions de contexte d’exécution embarqué.
    Il vérifie que le contexte d’exécution OpenClaw masqué est persisté comme message personnalisé
    non affiché au lieu de fuiter dans le tour utilisateur visible,
    puis sème une session JSONL cassée affectée et vérifie que
    `openclaw doctor --fix` la réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un candidat de package OpenClaw dans Docker, exécute l’onboarding de package installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram
    live avec ce package installé comme Gateway SUT.
  - Par défaut, `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester un tarball local résolu au lieu de
    l’installer depuis le registre.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans CI,
    le wrapper Docker sélectionne Convex automatiquement.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Elle ne s’exécute pas à la fusion. Le workflow utilise l’environnement
    `qa-live-shared` et des baux d’identifiants Convex CI.
- GitHub Actions expose aussi `Package Acceptance` pour une preuve produit en exécution latérale
  contre un package candidat. Il accepte une ref approuvée, une spec npm publiée,
  une URL HTTPS de tarball plus SHA-256, ou un artefact tarball d’une autre exécution, téléverse
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

- La preuve par URL exacte de tarball nécessite un condensat :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La preuve d’artifact télécharge un artifact tarball depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empaquète et installe la build OpenClaw actuelle dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les channels/plugins groupés via des
    modifications de configuration.
  - Vérifie que la découverte de configuration laisse absentes les dépendances
    d’exécution de plugin non configurées, que la première exécution configurée du Gateway
    ou de doctor installe à la demande les dépendances d’exécution de chaque
    plugin groupé, et qu’un second redémarrage ne réinstalle pas les dépendances
    déjà activées.
  - Installe aussi une référence npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour
    du candidat répare les dépendances d’exécution des channels groupés sans
    réparation postinstall côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke de mise à jour de l’installation empaquetée native sur les invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package de référence demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du gateway et un tour
    d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artifact de synthèse et
    l’état par lane.
  - La lane OpenAI utilise `openai/gpt-5.5` pour la preuve live du tour d’agent par
    défaut. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Encadrez les longues exécutions locales avec un timeout hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux de lanes imbriquées sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que l’enveloppe externe est bloquée.
  - La mise à jour Windows peut passer 10 à 15 minutes dans la réparation doctor/runtime
    des dépendances après mise à jour sur un invité froid ; cela reste sain lorsque le journal de débogage
    npm imbriqué progresse.
  - N’exécutez pas cette enveloppe agrégée en parallèle avec les lanes smoke
    macOS, Windows ou Linux individuelles de Parallels. Elles partagent l’état de VM et peuvent entrer en collision lors de
    la restauration de snapshot, du service de packages ou de l’état du gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés parce que
    les façades de capacité telles que la parole, la génération d’images et la
    compréhension des médias sont chargées via les API d’exécution groupées, même lorsque le tour
    d’agent lui-même ne vérifie qu’une simple réponse textuelle.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur local du fournisseur AIMock pour les tests smoke
    directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la lane QA live Matrix contre un homeserver Tuwunel jetable appuyé par Docker. Checkout source uniquement — les installations empaquetées n’incluent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artifacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la lane QA live Telegram contre un vrai groupe privé avec les tokens du bot pilote et du bot SUT provenant de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les baux mutualisés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artifacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez le mode Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, une synthèse et un artifact observed-messages sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT depuis la demande d’envoi du pilote jusqu’à la réponse SUT observée.

Les lanes de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par lane se trouve dans [Aperçu QA → Couverture du transport live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la large suite synthétique et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, le laboratoire QA acquiert un bail exclusif depuis un pool appuyé par Convex, envoie des heartbeats
pour ce bail pendant l’exécution de la lane, puis libère le bail à l’arrêt.

Échafaudage du projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle des identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` dans CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe de point de terminaison, le timeout HTTP et l’accessibilité admin/liste sans imprimer
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les
utilitaires CI.

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

Forme du payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’id numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un channel à QA

L’architecture et les noms d’assistants de scénarios pour les nouveaux adaptateurs de channel se trouvent dans [Aperçu QA → Ajouter un channel](/fr/concepts/qa-e2e-automation#adding-a-channel). Le seuil minimal : implémenter le runner de transport sur la seam hôte partagée `qa-lab`, déclarer `qaRunners` dans le manifeste du plugin, monter comme `openclaw qa <runner>` et rédiger des scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Pensez aux suites comme à un « réalisme croissant » (et une instabilité/coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer les shards multi-projets en configurations par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration in-process (auth du gateway, routage, tooling, analyse, configuration)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute dans CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de fallback large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugin générées, et non
    de vraies API sources de plugins groupés. Les chargements d’API de vrais plugins appartiennent aux
    suites de contrat/intégration possédées par les plugins.

<AccordionGroup>
  <Accordion title="Projets, shards et lanes cadrées">

    - Les exécutions non ciblées de `pnpm test` lancent douze configurations de fragments plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique énorme processus natif de projet racine. Cela réduit le pic RSS sur les machines chargées et évite que le travail auto-reply/extension prive les suites sans rapport de ressources.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-fragments n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichier/répertoire via des voies limitées, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût complet de démarrage du projet racine.
    - `pnpm test:changed` étend par défaut les chemins Git modifiés en voies limitées peu coûteuses : modifications directes de tests, fichiers `*.test.ts` voisins, mappages de source explicites et dépendants du graphe d’import local. Les modifications de configuration, de mise en place ou de package ne lancent pas largement les tests, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de vérification locale intelligente normale pour le travail ciblé. Elle classe le diff en noyau, tests du noyau, extensions, tests d’extensions, applications, documentation, métadonnées de publication, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour obtenir une preuve par les tests. Les incréments de version limités aux métadonnées de publication exécutent des vérifications ciblées de version/configuration/dépendances racine, avec une garde qui rejette les modifications de package hors du champ de version de premier niveau.
    - Les modifications du harnais Docker live ACP exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker live et simulation du planificateur Docker live. Les modifications de `package.json` ne sont incluses que lorsque le diff se limite à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exportations, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en imports issus des agents, commandes, plugins, helpers auto-reply, de `plugin-sdk` et de zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers à état ou lourds côté runtime restent sur les voies existantes.
    - Certains fichiers source de helpers `plugin-sdk` et `commands` mappent aussi les exécutions en mode modifié vers des tests voisins explicites dans ces voies légères, afin que les modifications de helpers évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les helpers du noyau de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI découpe en plus le sous-arbre de réponse en fragments agent-runner, dispatch et commands/state-routing afin qu’un compartiment lourd en imports ne porte pas toute la queue Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lot des extensions et le fragment de publication seule `agentic-plugins`. Full Release Validation déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de publication.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quand vous modifiez les entrées de découverte des outils de message ou le contexte runtime de Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions de helpers ciblées pour les frontières de routage pur et de normalisation.
    - Gardez les suites d’intégration de l’exécuteur intégré en bon état :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants limités et le comportement de Compaction passent toujours par les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux helpers ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise l’exécuteur non isolé dans les projets racine, e2e et configurations live.
    - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute elle aussi sur l’exécuteur partagé non isolé.
    - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute par défaut `--no-maglev` pour les processus Node enfants de Vitest afin de réduire le churn de compilation V8 pendant les grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8 standard.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` affiche les voies architecturales déclenchées par un diff.
    - Le hook de pré-commit ne fait que du formatage. Il restage les fichiers formatés et n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant transfert ou push lorsque vous avez besoin de la porte de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies limitées peu coûteuses. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent décide qu’une modification de harnais, de configuration, de package ou de contrat nécessite réellement une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec un plafond de workers plus élevé.
    - L’auto-dimensionnement local des workers est volontairement conservateur et réduit la charge lorsque la moyenne de charge de l’hôte est déjà élevée, afin que plusieurs exécutions Vitest concurrentes causent moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme `forceRerunTriggers` afin que les réexécutions en mode modifié restent correctes lorsque le câblage des tests change.
    - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` active le rapport de durée des imports Vitest ainsi que la sortie de ventilation des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
    - Les données de temps des fragments sont écrites dans `.artifacts/vitest-shard-timings.json`. Les exécutions de configuration complète utilisent le chemin de configuration comme clé ; les fragments CI à motif d’inclusion ajoutent le nom du fragment afin que les fragments filtrés puissent être suivis séparément.
    - Quand un test chaud passe encore la majeure partie de son temps dans les imports de démarrage, gardez les dépendances lourdes derrière une frontière locale étroite `*.runtime.ts` et mockez directement cette frontière au lieu d’importer en profondeur des helpers runtime uniquement pour les faire passer par `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le `test:changed` routé au chemin natif de projet racine pour ce diff commité et affiche le temps écoulé ainsi que le RSS maximal macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre de travail actuel avec modifications en routant la liste des fichiers modifiés via `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour le surcoût de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap de l’exécuteur pour la suite unitaire avec le parallélisme par fichier désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un worker
- Portée :
  - Démarre un vrai Gateway local loopback avec les diagnostics activés par défaut
  - Injecte du churn synthétique de messages Gateway, de mémoire et de grosses charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les helpers de persistance du paquet de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins groupés sous `extensions/`
- Valeurs runtime par défaut :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute par défaut en mode silencieux pour réduire le surcoût des E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console verbeuse.
- Portée :
  - Comportement bout en bout du Gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage Node et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune clé réelle requise
  - Plus d’éléments mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée un bac à sable à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exec SSH
  - Vérifie le comportement de système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI locale `openshell` ainsi qu’un démon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et le bac à sable
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou script wrapper non standard

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts` et tests live de plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format fournisseur, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (vrais réseaux, vraies politiques fournisseur, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions live sourcent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient la configuration/le matériel d’authentification dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise maintenant par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et rend muets les logs de bootstrap du Gateway/le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les logs de démarrage complets.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une surcharge par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessayent sur les réponses de limite de débit.
- Sortie progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Réglez les Heartbeat de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Réglez les Heartbeat Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de la logique/des tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau du Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de “mon bot est hors service” / échecs propres à un fournisseur / appels d’outils : exécutez un `pnpm test:live` restreint

## Tests live (qui touchent au réseau)

Pour la matrice de modèles live, les smokes de backend CLI, les smokes ACP, le
harnais de serveur d’application Codex et tous les tests live de fournisseurs
médias (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média), ainsi
que la gestion des identifiants pour les exécutions live, consultez
[Tests — suites live](/fr/help/testing-live).

## Exécuteurs Docker (vérifications optionnelles “fonctionne sous Linux”)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles live : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live de clé de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker live utilisent par défaut une limite de smoke plus petite afin qu’un balayage Docker complet reste praticable :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker live une fois via `test:docker:live-build`, empaquette OpenClaw une fois sous forme de tarball npm avec `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue est seulement l’exécuteur Node/Git pour les voies d’installation, de mise à jour et de dépendances de Plugin ; ces voies montent le tarball préconstruit. L’image fonctionnelle installe le même tarball dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les voies live lourdes, npm-install et multi-services de démarrer toutes en même temps. Si une seule voie est plus lourde que les plafonds actifs, l’ordonnanceur peut tout de même la démarrer lorsque le pool est vide, puis la maintenir seule en cours d’exécution jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. L’exécuteur effectue par défaut un précontrôle Docker, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les timings des voies réussies dans `.artifacts/docker-tests/lane-timings.json` et utilise ces timings pour démarrer les voies les plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des voies sélectionnées, des besoins en package/image et des identifiants.
- `Package Acceptance` est le gate GitHub natif de package pour “ce tarball installable fonctionne-t-il comme produit ?”. Il résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse sous le nom `package-under-test`, puis exécute les voies Docker E2E réutilisables contre ce tarball exact au lieu de réempaqueter la ref sélectionnée. `workflow_ref` sélectionne les scripts de workflow/harnais de confiance, tandis que `package_ref` sélectionne le commit, la branche ou le tag source à empaqueter lorsque `source=ref` ; cela permet à la logique d’acceptation actuelle de valider d’anciens commits de confiance. Les profils sont ordonnés par étendue : `smoke` est une vérification rapide installation/canal/agent plus Gateway/config, `package` couvre le contrat package/mise à jour/Plugin plus la fixture keyless upgrade-survivor, la voie de survivant de mise à niveau avec référence publiée et le remplacement natif par défaut pour la plupart de la couverture de package/mise à jour Parallels, `product` ajoute les canaux MCP, le nettoyage cron/sous-agent, la recherche web OpenAI et OpenWebUI, et `full` exécute les blocs Docker du chemin de release avec OpenWebUI. Pour `published-upgrade-survivor`, Package Acceptance utilise toujours `package-under-test` comme candidat et `published_upgrade_survivor_baseline` comme référence publiée, avec `openclaw@latest` par défaut ; fragmentez la couverture plus large en déclenchant plusieurs exécutions avec des valeurs de référence exactes. La voie publiée configure sa référence avec une recette de commande `openclaw config set` intégrée, puis enregistre les étapes de la recette dans le résumé de la voie. La validation de release exécute un delta de package personnalisé (`bundled-channel-deps-compat plugins-offline`) plus la QA de package Telegram, car les blocs Docker du chemin de release couvrent déjà les voies package/mise à jour/Plugin qui se chevauchent. Les commandes de réexécution Docker GitHub ciblées générées à partir des artefacts incluent l’artefact de package précédent, les entrées d’images préparées et la référence published upgrade-survivor lorsqu’elle est disponible, afin que les voies échouées puissent éviter de reconstruire le package et les images.
- Les vérifications de build et de release exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe statique construit depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant dispatch importe des dépendances de package comme Commander, l’interface de prompt, undici ou la journalisation avant le dispatch de commande ; il maintient aussi le bloc d’exécution du Gateway groupé sous le budget et rejette les imports statiques de chemins Gateway froids connus. Le smoke CLI empaqueté couvre aussi l’aide racine, l’aide onboard, l’aide doctor, le statut, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harnais ne tolère que les lacunes de métadonnées des packages livrés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de correctif manquants dans la fixture git dérivée du tarball, `update.channel` persisté manquant, emplacements hérités des enregistrements d’installation de Plugin, persistance manquante des enregistrements d’installation marketplace et migration des métadonnées de configuration pendant `plugins update`. Pour les packages postérieurs au `2026.4.25`, ces chemins sont des échecs stricts.
- Exécuteurs de smoke de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de plus haut niveau.

Les exécuteurs Docker de modèles live montent aussi uniquement les répertoires personnels d’auth CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externes puisse actualiser les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test de fumée ACP bind : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test de fumée du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test de fumée du harnais du serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Test de fumée d’observabilité : `pnpm qa:otel:smoke` est une voie QA privée depuis un checkout des sources. Elle ne fait intentionnellement pas partie des voies Docker de publication de package, car le tarball npm omet QA Lab.
- Test de fumée en direct Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test de fumée d’onboarding/canal/agent du tarball npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement le tarball OpenClaw empaqueté dans Docker, configure OpenAI via l’onboarding avec référence d’environnement ainsi que Telegram par défaut, vérifie que doctor répare les dépendances d’exécution du Plugin activées, puis exécute un tour d’agent OpenAI simulé. Réutilisez un tarball préconstruit avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Test de fumée du changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement le tarball OpenClaw empaqueté dans Docker, passe du package `stable` au git `dev`, vérifie le canal persistant et le fonctionnement post-mise à jour du Plugin, puis revient au package `stable` et vérifie l’état de mise à jour.
- Test de fumée de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe le tarball OpenClaw empaqueté par-dessus une fixture sale d’ancien utilisateur avec des agents, une configuration de canal, des listes d’autorisation de Plugins, un état obsolète de dépendances d’exécution de Plugins et des fichiers d’espace de travail/session existants. Il exécute la mise à jour du package ainsi que doctor en mode non interactif sans fournisseur en direct ni clés de canal, puis démarre un Gateway loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/d’état.
- Test de fumée publié de survie à la mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, amorce des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commande intégrée, valide la configuration résultante, met à jour cette installation publiée vers le tarball candidat, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage et les budgets d’état. Remplacez la base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ; Package Acceptance expose la même valeur sous le nom `published_upgrade_survivor_baseline`.
- Test de fumée du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance cachée de la transcription du contexte d’exécution ainsi que la réparation par doctor des branches dupliquées concernées de réécriture de prompt.
- Test de fumée d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un home isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images groupés au lieu de rester bloqué. Réutilisez un tarball préconstruit avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test de fumée Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un cache npm unique entre ses conteneurs root, update et direct-npm. Le test de fumée de mise à jour utilise par défaut le `latest` npm comme base stable avant la mise à niveau vers le tarball candidat. Remplacez-le avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installateur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local à l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale directe npm en double avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Test de fumée CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit l’image Dockerfile racine par défaut, amorce deux agents avec un espace de travail dans un home de conteneur isolé, exécute `agents delete --json`, et vérifie la validité du JSON ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test de fumée d’instantané CDP du navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source avec une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP couvrent les URL de liens, les éléments cliquables promus par curseur, les références d’iframe et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway amorcé + pont stdio + test de fumée brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + test de fumée d’autorisation/refus du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (Gateway réel + démontage de l’enfant MCP stdio après des exécutions isolées de Cron et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test de fumée d’installation, installation/désinstallation ClawHub kitchen-sink, mises à jour de marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire package/exécution kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Test de fumée de mise à jour de Plugin inchangée : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test de fumée des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances d’exécution des Plugins groupés : `pnpm test:docker:bundled-channel-deps` construit une petite image Docker d’exécution par défaut, construit et empaquette OpenClaw une fois sur l’hôte, puis monte ce tarball dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après une construction locale fraîche avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers un tarball existant avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L’agrégat Docker complet et les morceaux bundled-channel du chemin de publication pré-empaquettent ce tarball une fois, puis fragmentent les vérifications de canaux groupés en voies indépendantes, y compris des voies de mise à jour séparées pour Telegram, Discord, Slack, Feishu, memory-lancedb et ACPX. Les morceaux de publication séparent les tests de fumée de canaux, les cibles de mise à jour et les contrats setup/exécution en `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` et `bundled-channels-contracts` ; le morceau agrégé `bundled-channels` reste disponible pour les réexécutions manuelles. Le workflow de publication sépare aussi les morceaux d’installation des fournisseurs et les morceaux d’installation/désinstallation des Plugins groupés ; les anciens morceaux `package-update`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés pour les réexécutions manuelles. Utilisez `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` pour restreindre la matrice de canaux lors de l’exécution directe de la voie groupée, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` pour restreindre le scénario de mise à jour. Les exécutions Docker par scénario utilisent par défaut `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` ; le scénario de mise à jour multi-cibles utilise par défaut `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La voie vérifie aussi que `channels.<id>.enabled=false` et `plugins.entries.<id>.enabled=false` empêchent la réparation des dépendances d’exécution par doctor/runtime-dependency.
- Restreignez les dépendances d’exécution des Plugins groupés pendant l’itération en désactivant les scénarios sans rapport, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et de l’installateur conservent leurs propres Dockerfiles, car ils valident le comportement de package/d’installation plutôt que l’exécution de l’application construite partagée.

Les exécuteurs Docker de modèles live montent aussi le checkout actuel en lecture seule et
le préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les grands caches locaux uniquement et les sorties de build d’apps comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie `.build` locaux à l’app ou
Gradle, afin que les exécutions Docker live ne passent pas des minutes à copier des artefacts
propres à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live du Gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live du Gateway
de cette lane Docker.
`test:docker:openwebui` est une smoke de compatibilité de plus haut niveau : il démarre un
conteneur de Gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir extraire l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette lane attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
ensemencé, démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture des transcriptions, les métadonnées de pièces jointes,
le comportement de la file d’événements live, le routage d’envoi sortant, ainsi que les notifications de canal +
permission de style Claude via le vrai pont MCP stdio. Le contrôle des notifications
inspecte directement les trames MCP stdio brutes afin que la smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier expose.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle live.
Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via l’exécution MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp`, tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway ensemencé avec un vrai serveur de sonde MCP stdio, exécute un
tour Cron isolé et un tour enfant one-shot `/subagents spawn`, puis vérifie que
le processus enfant MCP se termine après chaque exécution.

Smoke manuelle ACP de thread en langage naturel (pas CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il peut être de nouveau nécessaire pour la validation du routage des threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires de configuration/espace de travail temporaires et sans montages d’authentification CLI externes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes par fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante pour les réexécutions qui ne nécessitent pas de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour la smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par la smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence de la documentation

Exécutez les contrôles de documentation après les modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de contrôles des titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outils du Gateway (OpenAI simulé, vrai Gateway + boucle agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de configuration du Gateway (WS `wizard.start`/`wizard.next`, écrit la config + auth imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le vrai Gateway + boucle agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des skills sont listés dans le prompt, l’agent choisit-il le bon skill (ou évite-t-il ceux qui ne sont pas pertinents) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent rester déterministes en priorité :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + l’ordre, les lectures de fichiers de skills et le câblage de session.
- Une petite suite de scénarios centrés sur les skills (utiliser ou éviter, garde-fous, injection de prompt).
- Des évaluations live optionnelles (opt-in, activées par variables d’environnement) seulement une fois la suite compatible CI en place.

## Tests de contrat (forme des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils parcourent tous les Plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La lane unitaire par défaut de `pnpm test` ignore intentionnellement
ces fichiers de seams partagés et de smoke ; exécutez explicitement
les commandes de contrat lorsque vous touchez aux surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de Plugin de base (id, nom, capacités)
- **setup** - Contrat d’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile de message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de thread
- **directory** - API d’annuaire/roster
- **group-policy** - Application de la politique de groupe

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
- **runtime** - Exécution du fournisseur
- **shape** - Forme/interface de Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après avoir modifié les exports ou sous-chemins de plugin-sdk
- Après avoir ajouté ou modifié un canal ou un Plugin de fournisseur
- Après avoir refactorisé l’enregistrement ou la découverte de Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés d’API.

## Ajout de régressions (guide)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (fournisseur simulé/stub, ou capture de la transformation exacte de la forme de requête)
- S’il est intrinsèquement live-only (limites de débit, politiques d’authentification), gardez le test live restreint et opt-in via variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/relecture de requête fournisseur → test direct des modèles
  - bug de pipeline session/historique/outils du Gateway → smoke live du Gateway ou test mock du Gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées de registre (`listSecretTargetRegistryEntries()`), puis affirme que les ids d’exécution à segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les ids de cible non classifiés afin que de nouvelles classes ne puissent pas être ignorées silencieusement.

## Associé

- [Tests live](/fr/help/testing-live)
- [CI](/fr/ci)
