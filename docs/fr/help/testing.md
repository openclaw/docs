---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajout de tests de régression pour les bogues de modèle/fournisseur
    - Débogage du comportement du Gateway + de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-30T07:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw comporte trois suites Vitest (unitaire/intégration, e2e, en direct) et un petit ensemble
d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre _délibérément_ pas).
- Quelles commandes exécuter pour les workflows courants (local, pré-push, débogage).
- Comment les tests en direct découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport en direct)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) — architecture, surface de commande, création de scénarios.
- [QA matricielle](/fr/concepts/qa-matrix) — référence pour `pnpm openclaw qa matrix`.
- [Canal QA](/fr/channels/qa-channel) — le plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des exécuteurs Docker/Parallels. La section des exécuteurs spécifiques à QA ci-dessous ([exécuteurs spécifiques à QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Gate complet (attendu avant un push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine spacieuse : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers achemine désormais aussi les chemins d’extensions/de canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Privilégiez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez davantage de confiance :

- Gate de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles + sondes Gateway outil/image) : `pnpm test:live`
- Cibler discrètement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage des modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute maintenant un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lors de l’isolation des échecs de fournisseur.
  - Couverture CI : les contrôles quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des tâches de matrice distinctes de modèles live Docker
    partitionnées par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets de fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de release.
- Smoke test de discussion liée native Codex : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker sur le chemin du serveur d’app Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison native du Plugin au lieu d’ACP.
- Smoke test du harnais de serveur d’app Codex : `pnpm test:docker:live-codex-harness`
  - Exécute les tours d’agent Gateway via le harnais de serveur d’app Codex possédé par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    MCP Cron, sous-agent et Guardian. Désactivez la sonde de sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lors de l’isolation d’autres échecs du
    serveur d’app Codex. Pour un contrôle ciblé du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde de sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke test de la commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Contrôle optionnel avec double sécurité pour la surface de commande de secours du canal de messages.
    Il exerce `/crestodian status`, met en file d’attente un changement persistant de modèle,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke test Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec une fausse CLI Claude sur `PATH`
    et vérifie que le repli du planificateur approximatif se traduit par une écriture de
    configuration typée auditée.
- Smoke test Docker de première exécution Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration, et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke test de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé avec `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke le `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à QA

Ces commandes accompagnent les suites de test principales lorsque vous avez besoin du réalisme de QA Lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs simulés. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec la porte de parité simulée, la voie Matrix live,
la voie Telegram live gérée par Convex, et la voie Discord live gérée par Convex comme
tâches parallèles. Les contrôles QA planifiés et de release passent explicitement Matrix `--profile fast`,
tandis que la CLI Matrix et l’entrée de workflow manuelle restent par défaut à
`all` ; un déclenchement manuel peut partitionner `all` en tâches `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` et `e2ee-cli`. `OpenClaw Release Checks` exécute la parité ainsi que
les voies rapides Matrix et Telegram avant l’approbation de release, en utilisant
`mock-openai/gpt-5.5` pour les contrôles de transport de release afin qu’ils restent déterministes
et évitent le démarrage normal des Plugins de fournisseur. Ces Gateways de transport live désactivent
la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les partitions de médias live de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui contient déjà
`ffmpeg` et `ffprobe`. Les partitions Docker de modèles/backends live utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une seule fois par commit sélectionné,
puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque partition.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des workers
    Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre
    de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Quitte avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local adossé à AIMock pour une couverture
    expérimentale des fixtures et des simulations de protocole sans remplacer la voie
    `mock-openai` consciente des scénarios.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage Gateway plus un petit paquet de scénarios QA Lab simulés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Ne signale par défaut que les observations de CPU chaud soutenu (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), de sorte que les courtes rafales de démarrage sont enregistrées comme métriques
    sans ressembler à la régression de Gateway saturée pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; exécutez d’abord un build lorsque le checkout ne
    dispose pas déjà d’une sortie d’exécution fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection des scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport et le résumé QA normaux plus les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm tarball à partir du checkout actuel, l’installe globalement dans
    Docker, exécute l’onboarding non interactif de clé d’API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances d’exécution à la
    demande, exécute doctor, et exécute un tour d’agent local contre un endpoint OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation packagée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke test Docker déterministe de l’app construite pour les transcriptions de contexte d’exécution
    embarqué. Il vérifie que le contexte d’exécution OpenClaw masqué est conservé comme
    message personnalisé non affiché au lieu de fuir dans le tour utilisateur visible,
    puis ensemence une session JSONL cassée affectée et vérifie que
    `openclaw doctor --fix` la réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un package candidat OpenClaw dans Docker, exécute l’onboarding du package installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram live
    avec ce package installé comme Gateway SUT.
  - La valeur par défaut est `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive tarball locale résolue au lieu de
    l’installation depuis le registre.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé uniquement pour cette voie.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Elle ne s’exécute pas lors d’un merge. Le workflow utilise l’environnement
    `qa-live-shared` et des baux d’identifiants CI Convex.
- GitHub Actions expose aussi `Package Acceptance` pour une preuve produit exécutée en parallèle
  contre un package candidat. Il accepte une ref de confiance, une spécification npm publiée,
  une URL d’archive tarball HTTPS plus SHA-256, ou un artefact tarball d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec des profils de voie smoke, package, product, full ou custom.
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

- La preuve par URL exacte d’archive tarball nécessite un condensat :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- La preuve d’artefact télécharge une archive tarball depuis une autre exécution d’Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empaquète et installe la build OpenClaw actuelle dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les canaux/plugins groupés via des
    modifications de configuration.
  - Vérifie que la découverte de configuration laisse absentes les dépendances
    d’exécution des plugins non configurées, que le premier Gateway configuré
    ou la première exécution de doctor installe à la demande les dépendances
    d’exécution de chaque plugin groupé, et qu’un second redémarrage ne
    réinstalle pas les dépendances déjà activées.
  - Installe aussi une base de référence npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor
    post-mise à jour du candidat répare les dépendances d’exécution des canaux groupés sans
    réparation postinstall côté harness.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke de mise à jour d’installation empaquetée native sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package de référence demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du gateway et un tour d’agent
    local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par lane.
  - La lane OpenAI utilise `openai/gpt-5.5` par défaut pour la preuve live de tour d’agent.
    Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Encadrez les longues exécutions locales avec un timeout hôte afin que les blocages du transport Parallels ne
    consomment pas le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de lanes imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans la réparation doctor/dépendances
    d’exécution post-mise à jour sur un invité froid ; cela reste sain quand le journal
    de débogage npm imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les lanes smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision lors de
    la restauration de snapshot, du service de package ou de l’état du gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés, car
    les façades de capacités comme la parole, la génération d’images et la compréhension
    des médias sont chargées via les API d’exécution groupées même lorsque le tour
    d’agent lui-même vérifie seulement une réponse textuelle simple.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour les tests smoke
    directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la lane QA live Matrix contre un homeserver Tuwunel jetable basé sur Docker. Checkout source uniquement — les installations empaquetées ne livrent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la lane QA live Telegram contre un vrai groupe privé avec les jetons de bot driver et SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id de groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les leases mutualisés.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez le mode Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT entre la demande d’envoi du driver et la réponse SUT observée.

Les lanes de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas ; la matrice de couverture par lane se trouve dans [Vue d’ensemble QA → Couverture du transport live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la suite synthétique large et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, le lab QA acquiert un lease exclusif depuis un pool basé sur Convex, envoie des heartbeats
pour ce lease pendant l’exécution de la lane, et libère le lease à l’arrêt.

Scaffold de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut env : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, sinon `maintainer`)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration maintainer (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers CLI pour les maintainers :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe d’endpoint, le timeout HTTP et l’accessibilité admin/liste sans imprimer
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les utilitaires
CI.

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
- `POST /admin/add` (secret maintainer uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret maintainer uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Garde de lease actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret maintainer uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme du payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’id de chat Telegram numérique.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un canal à QA

L’architecture et les noms des helpers de scénario pour les nouveaux adaptateurs de canal se trouvent dans [Vue d’ensemble QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le minimum requis : implémenter le runner de transport sur le seam hôte `qa-lab` partagé, déclarer `qaRunners` dans le manifeste du plugin, monter sous `openclaw qa <runner>`, et écrire les scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Config : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent étendre les shards multi-projets en configs par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires d’UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration in-process (authentification gateway, routage, outillage, parsing, config)
  - Régressions déterministes pour les bugs connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de fallback large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de plugin générées, pas avec
    les API source de vrais plugins groupés. Les chargements de vraies API de plugin appartiennent aux
    suites de contrat/intégration possédées par les plugins.

<AccordionGroup>
  <Accordion title="Projets, shards et lanes scopées">

    - Les exécutions non ciblées de `pnpm test` lancent douze configurations de fragments plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique énorme processus natif de projet racine. Cela réduit le pic de RSS sur les machines chargées et évite que le travail auto-reply/extensions affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-fragments n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers/répertoires via des voies limitées au périmètre concerné, afin que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût complet de démarrage du projet racine.
    - `pnpm test:changed` développe par défaut les chemins git modifiés en voies limitées peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, correspondances source explicites et dépendants du graphe d’import local. Les modifications de config/setup/package ne lancent pas largement les tests, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la barrière normale de vérification locale intelligente pour les travaux étroits. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour fournir une preuve par test. Les montées de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendance racine, avec une garde qui rejette les modifications de package hors du champ de version de premier niveau.
    - Les modifications du harnais ACP Docker live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’auth Docker live et essai à blanc du planificateur Docker live. Les modifications de `package.json` ne sont incluses que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exports, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en import issus des agents, commandes, plugins, helpers auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers à état ou fortement liés au runtime restent sur les voies existantes.
    - Certains fichiers source helpers de `plugin-sdk` et `commands` associent aussi les exécutions en mode modifié à des tests frères explicites dans ces voies légères, afin que les modifications de helpers évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les helpers core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en plus le sous-arbre reply en fragments agent-runner, dispatch et commands/state-routing, afin qu’un compartiment lourd en imports ne possède pas toute la queue Node.
    - La CI normale PR/main ignore volontairement le balayage groupé des extensions et le fragment réservé aux releases `agentic-plugins`. Full Release Validation déclenche le workflow enfant distinct `Plugin Prerelease` pour ces suites fortement axées plugins/extensions sur les release candidates.

  </Accordion>

  <Accordion title="Couverture du runner intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte runtime de Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions helpers ciblées pour les limites de routage pur et de normalisation.
    - Maintenez en bon état les suites d’intégration du runner intégré :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les ids limités au périmètre concerné et le comportement de Compaction circulent toujours par les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux helpers ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool Vitest et de l’isolation">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le runner non isolé dans les projets racine, les configs e2e et les configs live.
    - La voie UI racine conserve son setup `jsdom` et son optimiseur, mais elle s’exécute aussi sur le runner partagé non isolé.
    - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute par défaut `--no-maglev` aux processus Node enfants de Vitest pour réduire le churn de compilation V8 pendant les grandes exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer au comportement V8 standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` indique quelles voies architecturales sont déclenchées par un diff.
    - Le hook de pré-commit ne fait que du formatage. Il restage les fichiers formatés et n’exécute pas lint, typecheck ni tests.
    - Exécutez explicitement `pnpm check:changed` avant une remise ou un push lorsque vous avez besoin de la barrière de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies limitées peu coûteuses. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent décide qu’une modification de harnais, de config, de package ou de contrat exige réellement une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec un plafond de workers plus élevé.
    - La mise à l’échelle automatique des workers locaux est volontairement prudente et recule lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest concurrentes causent moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de config comme `forceRerunTriggers` afin que les réexécutions en mode modifié restent correctes lorsque le câblage des tests change.
    - La config maintient `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active les rapports de durée d’import Vitest ainsi que la sortie de détail des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
    - Les données de temps des fragments sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de configuration entière utilisent le chemin de config comme clé ; les fragments CI avec motif d’inclusion ajoutent le nom du fragment afin que les fragments filtrés puissent être suivis séparément.
    - Lorsqu’un test chaud passe encore l’essentiel de son temps dans les imports de démarrage, gardez les dépendances lourdes derrière une liaison locale étroite `*.runtime.ts` et moquez directement cette liaison au lieu d’importer en profondeur des helpers runtime seulement pour les passer dans `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le `test:changed` routé au chemin natif du projet racine pour ce diff commité et affiche le temps réel écoulé ainsi que le RSS max macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail sale actuel en acheminant la liste de fichiers modifiés via `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour le démarrage Vitest/Vite et la surcharge de transformation.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Config : `vitest.gateway.config.ts`, forcée à un worker
- Périmètre :
  - Démarre un vrai Gateway loopback avec les diagnostics activés par défaut
  - Pilote un churn synthétique de messages Gateway, de mémoire et de grandes charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les helpers de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session redescendent à zéro
- Attentes :
  - Compatible CI et sans clés
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à toute la suite Gateway

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Config : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins groupés sous `extensions/`
- Valeurs runtime par défaut :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute par défaut en mode silencieux pour réduire la surcharge d’E/S console.
- Overrides utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Périmètre :
  - Comportement Gateway end-to-end multi-instance
  - Surfaces WebSocket/HTTP, appairage de nodes et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsque c’est activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Périmètre :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée un bac à sable depuis un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + SSH exec
  - Vérifie le comportement de système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Uniquement sur opt-in ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI `openshell` locale ainsi qu’un daemon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway et le bac à sable de test
- Overrides utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou script wrapper non par défaut

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts` et tests live de plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Périmètre :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format fournisseur, les particularités d’appels d’outils, les problèmes d’auth et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (réseaux réels, politiques fournisseur réelles, quotas, pannes)
  - Coûte de l’argent / utilise des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions live sourcent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de config/auth dans un home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez volontairement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire `~/.profile` et met en sourdine les logs de bootstrap Gateway/le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez retrouver tous les logs de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un override live par `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limite de débit.
- Sortie progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeat des modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeat Gateway/probe avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Logique/tests de modification : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Modification de la mise en réseau du Gateway / du protocole WS / de l’appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs propres au fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests live (touchant le réseau)

Pour la matrice de modèles live, les smokes de backend CLI, les smokes ACP, le
harness de serveur d’application Codex, et tous les tests live de fournisseurs de médias
(Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harness média), ainsi que la
gestion des identifiants pour les exécutions live, consultez
[Tests — suites live](/fr/help/testing-live).

## Runners Docker (vérifications facultatives « fonctionne sous Linux »)

Ces runners Docker se répartissent en deux catégories :

- Runners de modèles live : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier live à clé de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre workspace (et en sourçant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker live utilisent par défaut un plafond de smoke plus réduit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement l’analyse exhaustive plus large.
- `test:docker:all` construit l’image Docker live une fois via `test:docker:live-build`, empaquette OpenClaw une fois comme tarball npm avec `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue est uniquement le runner Node/Git pour les lanes d’installation/mise à jour/dépendances de plugins ; ces lanes montent le tarball préconstruit. L’image fonctionnelle installe le même tarball dans `/app` pour les lanes de fonctionnalité de l’application construite. Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les lanes lourdes live, d’installation npm et multiservices de toutes démarrer en même temps. Si une seule lane est plus lourde que les plafonds actifs, l’ordonnanceur peut tout de même la démarrer lorsque le pool est vide, puis la laisser s’exécuter seule jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. Le runner effectue un précontrôle Docker par défaut, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les timings des lanes réussies dans `.artifacts/docker-tests/lane-timings.json` et utilise ces timings pour démarrer les lanes plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des lanes sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des lanes sélectionnées, des besoins de package/image et des identifiants.
- `Package Acceptance` est la gate de package native GitHub pour « ce tarball installable fonctionne-t-il comme produit ? ». Elle résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, l’envoie comme `package-under-test`, puis exécute les lanes Docker E2E réutilisables sur ce tarball exact au lieu de réempaqueter la ref sélectionnée. `workflow_ref` sélectionne les scripts de workflow/harness approuvés, tandis que `package_ref` sélectionne le commit/la branche/le tag source à empaqueter lorsque `source=ref` ; cela permet à la logique d’acceptation actuelle de valider d’anciens commits approuvés. Les profils sont classés par étendue : `smoke` est une vérification rapide installation/canal/agent plus Gateway/config, `package` est le contrat package/mise à jour/Plugin et le remplacement natif par défaut de la plupart de la couverture package/mise à jour Parallels, `product` ajoute les canaux MCP, le nettoyage cron/sous-agent, la recherche web OpenAI et OpenWebUI, et `full` exécute les fragments Docker du chemin de release avec OpenWebUI. La validation de release exécute un delta de package personnalisé (`bundled-channel-deps-compat plugins-offline`) plus la QA de package Telegram, car les fragments Docker du chemin de release couvrent déjà les lanes package/mise à jour/Plugin qui se chevauchent. Les commandes de relance Docker GitHub ciblées générées à partir des artefacts incluent l’artefact de package précédent et les entrées d’images préparées lorsqu’elles sont disponibles, afin que les lanes en échec puissent éviter de reconstruire le package et les images.
- Les vérifications de build et de release exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. La garde parcourt le graphe construit statique depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant dispatch importe des dépendances de package telles que Commander, l’UI de prompt, undici ou la journalisation avant le dispatch de commande ; elle maintient aussi le fragment d’exécution du Gateway groupé sous le budget et rejette les imports statiques de chemins Gateway froids connus. Le smoke de CLI packagée couvre aussi l’aide racine, l’aide d’onboarding, l’aide doctor, l’état, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harness tolère uniquement les lacunes de métadonnées de packages livrés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de patch manquants dans le fixture git dérivé du tarball, `update.channel` persistant manquant, anciens emplacements d’enregistrement d’installation de Plugin, persistance manquante d’enregistrement d’installation de marketplace, et migration des métadonnées de configuration pendant `plugins update`. Pour les packages après `2026.4.25`, ces chemins sont des échecs stricts.
- Runners de smoke de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de niveau supérieur.

Les runners Docker de modèles live montent aussi uniquement les répertoires d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans muter le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test de fumée de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test de fumée du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test de fumée du harnais app-server Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Test de fumée d’observabilité : `pnpm qa:otel:smoke` est une voie QA privée d’extraction du code source. Elle ne fait intentionnellement pas partie des voies de publication Docker de paquet, car l’archive npm omet QA Lab.
- Test de fumée Open WebUI en direct : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test de fumée d’intégration/canal/agent de l’archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement l’archive OpenClaw empaquetée dans Docker, configure OpenAI via l’intégration par référence d’environnement ainsi que Telegram par défaut, vérifie que doctor répare les dépendances d’exécution des Plugin activés, et exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Test de fumée de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement l’archive OpenClaw empaquetée dans Docker, passe du paquet `stable` à git `dev`, vérifie le canal persistant et le fonctionnement post-mise à jour du Plugin, puis revient au paquet `stable` et vérifie l’état de mise à jour.
- Test de fumée du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance cachée de la transcription du contexte d’exécution ainsi que la réparation par doctor des branches dupliquées affectées de réécriture de prompt.
- Test de fumée de l’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un home isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de se bloquer. Réutilisez une archive préconstruite avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test de fumée Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, update et direct-npm. Le test de fumée de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers l’archive candidate. Remplacez-la avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications d’installateur non-root conservent un cache npm isolé afin que les entrées de cache possédées par root ne masquent pas le comportement d’installation locale utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm entre les réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Test de fumée CLI de suppression d’un espace de travail partagé par les agents : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit l’image Dockerfile racine par défaut, initialise deux agents avec un espace de travail dans un home de conteneur isolé, exécute `agents delete --json`, et vérifie du JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test de fumée d’instantané CDP navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source avec une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP couvrent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` augmente `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test de fumée de frame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (serveur MCP stdio réel + test de fumée allow/deny du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage Cron/sous-agent MCP (Gateway réel + arrêt de l’enfant MCP stdio après des exécutions cron isolées et sous-agent ponctuelles) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test de fumée d’installation, installation/désinstallation fourre-tout ClawHub, mises à jour de marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/exécution fourre-tout par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Test de fumée de mise à jour Plugin inchangée : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test de fumée des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances d’exécution des Plugin intégrés : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image d’exécuteur Docker, construit et empaquette OpenClaw une fois sur l’hôte, puis monte cette archive dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après une construction locale fraîche avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers une archive existante avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L’agrégat Docker complet et les fragments bundled-channel du chemin de publication pré-empaquettent cette archive une fois, puis segmentent les vérifications de canaux intégrés en voies indépendantes, y compris des voies de mise à jour séparées pour Telegram, Discord, Slack, Feishu, memory-lancedb et ACPX. Les fragments de publication séparent les tests de fumée de canaux, les cibles de mise à jour et les contrats de configuration/exécution en `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` et `bundled-channels-contracts` ; le fragment agrégé `bundled-channels` reste disponible pour les réexécutions manuelles. Le workflow de publication sépare aussi les fragments d’installateur de fournisseurs et les fragments d’installation/désinstallation de Plugin intégrés ; les anciens fragments `package-update`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés pour les réexécutions manuelles. Utilisez `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` pour restreindre la matrice de canaux lors de l’exécution directe de la voie intégrée, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` pour restreindre le scénario de mise à jour. Les exécutions Docker par scénario utilisent par défaut `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` ; le scénario de mise à jour multi-cible utilise par défaut `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. La voie vérifie également que `channels.<id>.enabled=false` et `plugins.entries.<id>.enabled=false` suppriment la réparation par doctor des dépendances d’exécution.
- Restreignez les dépendances d’exécution des Plugin intégrés pendant l’itération en désactivant les scénarios sans rapport, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres aux suites, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image distante partagée, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles, car ils valident le comportement de paquet/installation plutôt que l’exécution partagée de l’application construite.

Les exécuteurs Docker live-model montent également l’extraction actuelle en lecture seule et
la préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest contre votre source/configuration locale exacte.
L’étape de préparation ignore les grands caches purement locaux et les sorties de construction d’applications tels que
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires `.build` locaux à l’application ou
de sortie Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier des artefacts
propres à la machine.
Ils définissent également `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes Gateway en direct ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture
Gateway en direct de cette voie Docker.
`test:docker:openwebui` est un test de fumée de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente, car Docker peut devoir télécharger l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette voie attend une clé de modèle en direct utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le moyen principal de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway initialisé,
démarre un second conteneur qui lance `openclaw mcp serve`, puis vérifie la découverte
des conversations routées, les lectures de transcriptions, les métadonnées de pièces jointes,
le comportement de la file d’événements en direct, le routage d’envoi sortant, ainsi que les notifications
de canal + permission de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les frames MCP stdio brutes afin que le test de fumée valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client donné expose par hasard.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle en direct.
Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via l’exécution MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle en direct.
Il démarre une Gateway initialisée avec un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Test de fumée manuel de fil ACP en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être à nouveau nécessaire pour la validation du routage des fils ACP, ne le supprimez donc pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires de configuration/espace de travail temporaires et aucun montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à un fournisseur montent uniquement les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour limiter l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante pour les réexécutions qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification du nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence de la documentation

Exécutez les vérifications de documentation après les modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin des vérifications des titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans fournisseurs réels :

- Appel d’outil Gateway (OpenAI simulé, Gateway réel + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : « exécute de bout en bout un appel d’outil OpenAI simulé via la boucle d’agent Gateway »)
- Assistant Gateway (`wizard.start`/`wizard.next` WS, écrit la configuration + authentification appliquée) : `src/gateway/gateway.test.ts` (cas : « exécute l’assistant via ws et écrit la configuration du jeton d’authentification »)

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outil simulé via le Gateway réel + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills sont listés dans le prompt, l’agent choisit-il la bonne Skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + l’ordre, les lectures de fichiers de Skill et le câblage de session.
- Une petite suite de scénarios centrés sur Skills (utiliser ou éviter, garde-fous, injection de prompt).
- Évaluations live facultatives (sur activation, contrôlées par variables d’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et chaque canal enregistré est conforme à son
contrat d’interface. Ils parcourent tous les plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire `pnpm test` par défaut ignore intentionnellement
ces fichiers de smoke et de seams partagés ; exécutez explicitement les commandes de contrat
lorsque vous touchez aux surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de payload des messages
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de fil
- **directory** - API d’annuaire/liste
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
- **runtime** - Runtime du fournisseur
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand exécuter

- Après avoir modifié les exports ou sous-chemins de plugin-sdk
- Après avoir ajouté ou modifié un canal ou un Plugin fournisseur
- Après avoir refactorisé l’enregistrement ou la découverte de Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés d’API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (fournisseur mock/stub, ou capture de la transformation exacte de la forme de la requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live limité et activable via variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bogue :
  - bogue de conversion/rejeu de requête fournisseur → test direct des modèles
  - bogue de pipeline session/historique/outil Gateway → smoke Gateway live ou test mock Gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants d’exécution avec segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les identifiants de cible non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tests live](/fr/help/testing-live)
- [CI](/fr/ci)
