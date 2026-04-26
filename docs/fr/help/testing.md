---
read_when:
    - Exécution des tests en local ou en CI
    - Ajout de régressions pour les bugs de modèle/fournisseur
    - Débogage du comportement de la Gateway + de l’agent
summary: 'Kit de test : suites unit/e2e/live, runners Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-26T11:31:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw dispose de trois suites Vitest (unit/integration, e2e, live) et d’un petit ensemble
de runners Docker. Cette documentation est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

## Démarrage rapide

La plupart du temps :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution complète plus rapide en local sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Lane QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez plus de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes Gateway outil/image) : `pnpm test:live`
- Cibler un seul fichier live silencieusement : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage live des modèles dans Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un petit tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lors de l’isolation d’échecs fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow réutilisable live/E2E avec
    `include_live_suites: true`, ce qui inclut des jobs matriciels Docker live séparés
    fragmentés par fournisseur.
  - Pour des relances CI ciblées, lancez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de release.
- Smoke de chat lié Codex natif : `pnpm test:docker:live-codex-bind`
  - Exécute une lane live Docker contre le chemin serveur d’application Codex, lie un message privé Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison native du Plugin au lieu d’ACP.
- Smoke du harnais serveur d’application Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway à travers le harnais serveur d’application Codex géré par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    Cron MCP, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lors de l’isolation d’autres échecs
    du serveur d’application Codex. Pour une vérification ciblée du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela se termine après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in avec ceinture et bretelles de la
    surface de commande de secours du canal de messages. Elle exerce `/crestodian status`, met en file une modification persistante de modèle,
    répond `/crestodian yes`, et vérifie le chemin d’audit/écriture de configuration.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec un faux Claude CLI sur `PATH`
    et vérifie que le repli du planificateur flou se traduit par une écriture de configuration typée auditée.
- Smoke Docker du premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration et vérifie les entrées d’audit. Le même chemin de configuration Ring 0
    est aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription assistant stocke `usage.cost` normalisé.

Conseil : lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisations décrites ci-dessous.

## Runners spécifiques QA

Ces commandes côtoient les suites de test principales lorsque vous avez besoin du réalisme de qa-lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs simulés. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec la parity gate simulée, la lane Matrix live, et la lane Telegram live gérée par Convex comme jobs parallèles. `OpenClaw Release Checks`
exécute les mêmes lanes avant l’approbation de release.

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte des scénarios QA adossés au dépôt.
  - Exécute plusieurs scénarios sélectionnés en parallèle par défaut avec des
    workers Gateway isolés. `qa-channel` a par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre
    de workers, ou `--concurrency 1` pour l’ancienne lane sérielle.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale des
    fixtures et du protocole simulé sans remplacer la lane `mock-openai` sensible aux scénarios.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés fournisseur basées sur env, chemin de configuration du fournisseur live QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour un travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm depuis l’extraction courante, l’installe globalement dans
    Docker, exécute une intégration non interactive par clé API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances runtime à la demande,
    exécute doctor, et exécute un tour d’agent local contre un endpoint OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même
    lane d’installation empaquetée avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application buildée pour les transcriptions
    de contexte runtime embarqué. Il vérifie que le contexte runtime OpenClaw caché est persisté comme
    message personnalisé non affiché au lieu de fuiter dans le tour utilisateur visible,
    puis initialise un JSONL de session cassée concerné et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un paquet OpenClaw publié dans Docker, exécute l’intégration du paquet installé,
    configure Telegram via la CLI installée, puis réutilise la lane Telegram QA live avec ce paquet installé comme Gateway SUT.
  - Prend par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/release, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans la CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette lane uniquement.
  - GitHub Actions expose cette lane comme workflow manuel mainteneur
    `NPM Telegram Beta E2E`. Elle ne s’exécute pas lors d’une fusion. Le workflow utilise l’environnement
    `qa-live-shared` et des baux d’identifiants CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empaquette et installe la build OpenClaw courante dans Docker, démarre la Gateway
    avec OpenAI configuré, puis active les canaux/Plugin intégrés via des
    modifications de configuration.
  - Vérifie que la découverte de configuration laisse absentes les dépendances runtime du Plugin non configuré, que la première exécution configurée de Gateway ou doctor installe à la demande les dépendances runtime de chaque Plugin intégré, et qu’un deuxième redémarrage ne réinstalle pas les dépendances déjà activées.
  - Installe aussi une version npm de base plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise-à-jour du candidat répare les dépendances runtime des canaux intégrés sans réparation postinstall côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation empaquetée à travers les invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le paquet de base demandé, puis exécute la commande
    `openclaw update` installée dans le même invité et vérifie la version installée,
    l’état de mise à jour, l’état prêt de la Gateway, et un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un seul invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par lane.
  - La lane OpenAI utilise `openai/gpt-5.5` pour la preuve live du tour d’agent par défaut. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Encadrez les longues exécutions locales avec un délai maximal côté hôte afin que les blocages de transport Parallels ne consomment pas le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux de lane imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes en doctor post-mise-à-jour/réparation des dépendances runtime sur un invité froid ; cela reste sain lorsque le journal npm de débogage imbriqué continue d’avancer.
  - N’exécutez pas ce wrapper agrégé en parallèle avec des lanes smoke Parallels individuelles
    macOS, Windows ou Linux. Elles partagent l’état de la VM et peuvent entrer en collision sur la
    restauration d’instantané, la distribution de paquets ou l’état Gateway de l’invité.
  - La preuve post-mise-à-jour exécute la surface normale du Plugin intégré parce que
    les façades de capacités telles que la parole, la génération d’image et la
    compréhension média sont chargées via les API runtime intégrées même lorsque le tour d’agent lui-même ne vérifie qu’une simple réponse texte.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour des tests smoke directs
    du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la lane QA Matrix live contre un homeserver Tuwunel jetable adossé à Docker.
  - Cet hôte QA est aujourd’hui réservé au dépôt/dev. Les installations OpenClaw empaquetées ne livrent pas
    `qa-lab`, elles n’exposent donc pas `openclaw qa`.
  - Les extractions du dépôt chargent directement le runner intégré ; aucune étape
    séparée d’installation de Plugin n’est nécessaire.
  - Provisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) plus une salle privée, puis démarre un processus enfant de Gateway QA avec le vrai Plugin Matrix comme transport SUT.
  - Utilise par défaut l’image Tuwunel stable épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez-la avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` lorsque vous devez tester une autre image.
  - Matrix n’expose pas de flags partagés de source d’identifiants car la lane provisionne localement des utilisateurs jetables.
  - Écrit un rapport QA Matrix, un résumé, un artefact observed-events, et un journal de sortie stdout/stderr combiné sous `.artifacts/qa-e2e/...`.
  - Émet la progression par défaut et impose un délai maximal strict avec `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (30 minutes par défaut). Le nettoyage est borné par `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` et les échecs incluent la commande de récupération `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Exécute la lane QA Telegram live contre un vrai groupe privé en utilisant les jetons de bot driver et SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant de groupe doit être l’identifiant numérique de chat Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour activer les baux mutualisés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    souhaitez obtenir les artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable bot-à-bot, activez le mode Bot-to-Bot Communication dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact observed-messages sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT entre la requête d’envoi du driver et la réponse observée du SUT.

Les lanes de transport live partagent un contrat standard afin que les nouveaux transports ne dérivent pas :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture de transport live.

| Lane     | Canary | Barrière par mention | Blocage par allowlist | Réponse de niveau supérieur | Reprise après redémarrage | Suivi dans le fil | Isolation du fil | Observation des réactions | Commande d’aide |
| -------- | ------ | -------------------- | --------------------- | --------------------------- | ------------------------- | ----------------- | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                    | x                     | x                           | x                         | x                 | x                | x                         |                 |
| Telegram | x      |                      |                       |                             |                           |                   |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, qa-lab acquiert un bail exclusif depuis un pool adossé à Convex, maintient
un Heartbeat sur ce bail pendant l’exécution de la lane, puis libère le bail à l’arrêt.

Structure de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut env : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de traçage facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex loopback en `http://` pour du développement strictement local.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du broker,
le préfixe d’endpoint, le délai HTTP et l’accessibilité admin/list sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et utilitaires CI.

Contrat d’endpoint par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Épuisé/rejouable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à QA

Ajouter un canal au système QA markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de niveau supérieur lorsque l’hôte partagé `qa-lab` peut
prendre en charge le flux.

`qa-lab` gère les mécanismes partagés de l’hôte :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugin runner gèrent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment la Gateway est configurée pour ce transport
- comment la disponibilité est vérifiée
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal est :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter le runner de transport sur l’interface hôte partagée `qa-lab`.
3. Conserver les mécanismes spécifiques au transport dans le Plugin runner ou le harnais de canal.
4. Monter le runner comme `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente.
   Les Plugin runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Conserver les alias de compatibilité existants sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si le comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si le comportement dépend d’un seul transport de canal, gardez-le dans ce Plugin runner ou ce harnais de Plugin.
- Si un scénario nécessite une nouvelle capacité que plus d’un canal peut utiliser, ajoutez un helper générique plutôt qu’une branche spécifique au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique au transport et rendez cela explicite dans le contrat du scénario.

Les noms de helper génériques privilégiés pour les nouveaux scénarios sont :

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

Les alias de compatibilité restent disponibles pour les scénarios existants, notamment :

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Le nouveau travail sur les canaux doit utiliser les noms de helper génériques.
Les alias de compatibilité existent pour éviter une migration de type flag day, pas comme modèle pour
la rédaction de nouveaux scénarios.

## Suites de test (ce qui s’exécute où)

Pensez aux suites comme à un « réalisme croissant » (et une instabilité/coût croissants) :

### Unit / integration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer les shards multi-projets en configurations par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` et les tests `ui` node autorisés couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en mémoire (auth Gateway, routage, outillage, parsing, configuration)
  - Régressions déterministes pour des bugs connus
- Attentes :
  - S’exécute en CI
  - Aucune clé réelle requise
  - Doit être rapide et stable

<AccordionGroup>
  <Accordion title="Projets, shards et lanes ciblées">

    - `pnpm test` non ciblé exécute douze petites configurations shardées (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul énorme processus root-project natif. Cela réduit le RSS de pointe sur les machines chargées et évite que le travail auto-reply/extension n’affame les suites non liées.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-shard n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` routent d’abord les cibles explicites fichier/répertoire via les lanes ciblées, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût complet de démarrage du projet racine.
    - `pnpm test:changed` développe les chemins git modifiés vers les mêmes lanes ciblées lorsque le diff ne touche que des fichiers source/test routables ; les modifications de configuration/setup replient toujours sur une relance large du projet racine.
    - `pnpm check:changed` est la barrière locale intelligente normale pour le travail étroit. Il classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les lanes de typecheck/lint/test correspondantes. Les changements publics du SDK Plugin et du contrat de Plugin incluent un passage de validation d’extension car les extensions dépendent de ces contrats core. Les augmentations de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine au lieu de la suite complète, avec une garde qui rejette les modifications de paquet en dehors du champ de version de niveau supérieur.
    - Les modifications du harnais ACP Docker live exécutent une barrière locale ciblée : syntaxe shell pour les scripts d’authentification Docker live, dry-run du scheduler Docker live, tests unitaires ACP bind, et tests de l’extension ACPX. Les changements `package.json` ne sont inclus que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendances, exports, versions et autres surfaces de paquet utilisent toujours les gardes plus larges.
    - Les tests unitaires légers à l’import depuis agents, commandes, Plugin, helpers auto-reply, `plugin-sdk` et autres zones utilitaires pures sont routés via la lane `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers lourds/stateful/runtime restent sur les lanes existantes.
    - Certains fichiers source helper sélectionnés de `plugin-sdk` et `commands` mappent aussi les exécutions en mode changed vers des tests frères explicites dans ces lanes légères, afin que les modifications de helper évitent de relancer toute la suite lourde du répertoire.
    - `auto-reply` a des groupes dédiés pour les helpers core de niveau supérieur, les tests d’intégration `reply.*` de niveau supérieur, et le sous-arbre `src/auto-reply/reply/**`. La CI fragmente en plus le sous-arbre reply en shards agent-runner, dispatch, et commands/state-routing afin qu’un seul groupe lourd à l’import ne possède pas toute la fin de queue Node.

  </Accordion>

  <Accordion title="Couverture du runner embarqué">

    - Lorsque vous modifiez les entrées de découverte de l’outil de message ou le contexte runtime de Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions ciblées de helper pour les frontières pures de routage et de normalisation.
    - Gardez saines les suites d’intégration du runner embarqué :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants ciblés et le comportement de Compaction continuent de passer
      par les vrais chemins `run.ts` / `compact.ts` ; des tests helper uniquement
      ne suffisent pas pour remplacer ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool et de l’isolation Vitest">

    - La configuration Vitest de base utilise par défaut `threads`.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le
      runner non isolé sur les projets racine, e2e et live.
    - La lane UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute
      elle aussi sur le runner partagé non isolé.
    - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` pour les processus Node enfants Vitest
      par défaut afin de réduire l’agitation de compilation V8 lors des grosses exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer au
      comportement V8 standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` affiche quelles lanes architecturales sont déclenchées par un diff.
    - Le hook pre-commit est limité au formatage. Il remet en scène les fichiers formatés et
      n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant handoff ou push lorsque vous
      avez besoin de la barrière locale intelligente. Les changements publics du SDK Plugin et du contrat de Plugin
      incluent un passage de validation d’extension.
    - `pnpm test:changed` route via les lanes ciblées lorsque les chemins modifiés
      correspondent proprement à une suite plus petite.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec une limite de workers plus élevée.
    - L’auto-scaling des workers locaux est volontairement conservateur et recule
      lorsque la charge moyenne de l’hôte est déjà élevée, afin que plusieurs exécutions
      Vitest concurrentes fassent moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme
      `forceRerunTriggers` afin que les relances en mode changed restent correctes lorsque le câblage des tests change.
    - La configuration conserve `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes
      pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profiling direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le reporting de durée d’import Vitest ainsi que
      une sortie de détail d’import.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de timing des shards sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de configuration complète utilisent le chemin de configuration comme clé ; les shards CI avec include-pattern ajoutent le nom du shard afin que les shards filtrés puissent être suivis séparément.
    - Lorsqu’un test chaud passe encore l’essentiel de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière une interface locale étroite `*.runtime.ts` et
      mockez directement cette interface au lieu d’importer profondément des helpers runtime
      juste pour les faire passer via `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif root-project pour ce diff validé et affiche
      le temps mural ainsi que le RSS max macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre sale courant
      en routant la liste de fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      la surcharge de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la
      suite unit avec parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre une vraie Gateway loopback avec diagnostics activés par défaut
  - Injecte un churn synthétique de messages Gateway, mémoire et grosses charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via la RPC WS Gateway
  - Couvre les helpers de persistance du bundle de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression, et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clés
  - Lane étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E de Plugin intégrés sous `extensions/`
- Valeurs par défaut runtime :
  - Utilise Vitest `threads` avec `isolate: false`, en cohérence avec le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire la surcharge d’E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (limité à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console verbeuse.
- Portée :
  - Comportement end-to-end multi-instance de Gateway
  - Surfaces WebSocket/HTTP, appairage de nœud et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune clé réelle requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre une Gateway OpenShell isolée sur l’hôte via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du sandbox
- Attentes :
  - Strictement opt-in ; ne fait pas partie de l’exécution par défaut `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Utilise un `HOME` / `XDG_CONFIG_HOME` isolé, puis détruit la Gateway et le sandbox de test
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou script wrapper non par défaut

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests live de Plugin intégrés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il vraiment _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format fournisseur, les particularités d’appel d’outil, les problèmes d’authentification et le comportement de limitation de débit
- Attentes :
  - Pas stable en CI par conception (vrais réseaux, vraies politiques fournisseur, quotas, pannes)
  - Coûte de l’argent / consomme des limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent quand même `HOME` et copient le matériel de configuration/authentification dans un home de test temporaire afin que les fixtures unit ne puissent pas muter votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous voulez intentionnellement que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire sur `~/.profile` et coupe les journaux de bootstrap Gateway / le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous souhaitez retrouver les journaux de démarrage complets.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par-live via `OPENCLAW_LIVE_*_KEY` ; les tests retentent en cas de réponses de limitation de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent désormais des lignes de progression vers stderr afin que les longs appels fournisseur restent visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient immédiatement diffusées pendant les exécutions live.
  - Ajustez les Heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeats Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez cette table de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage « mon bot est en panne » / échecs spécifiques fournisseur / appel d’outil : exécutez un `pnpm test:live` restreint

## Tests live (touchant le réseau)

Pour la matrice live de modèles, les smokes de backend CLI, les smokes ACP, le harnais
du serveur d’application Codex, et tous les tests live de fournisseurs média (Deepgram, BytePlus, ComfyUI, image,
music, vidéo, harnais média) — ainsi que la gestion des identifiants pour les exécutions live — voir
[Tests — suites live](/fr/help/testing-live).

## Runners Docker (vérifications optionnelles « fonctionne sous Linux »)

Ces runners Docker se divisent en deux catégories :

- Runners live-model : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live à clé de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker live utilisent par défaut une limite smoke plus petite afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  souhaitez explicitement le balayage exhaustif plus large.
- `test:docker:all` construit une fois l’image Docker live via `test:docker:live-build`, puis la réutilise pour les lanes Docker live. Il construit aussi une image partagée `scripts/e2e/Dockerfile` via `test:docker:e2e-build` et la réutilise pour les runners smoke E2E en conteneur qui exercent l’application buildée. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les slots de processus, tandis que les plafonds de ressources empêchent le démarrage simultané de toutes les lanes lourdes live, npm-install et multi-service. Les valeurs par défaut sont 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker a plus de marge. Le runner effectue une prévalidation Docker par défaut, supprime les conteneurs E2E OpenClaw obsolètes, affiche un statut toutes les 30 secondes, stocke les timings des lanes réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces timings pour démarrer d’abord les lanes les plus longues lors des exécutions suivantes. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des lanes sans construire ni exécuter Docker.
- Runners smoke en conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les runners Docker live-model montent aussi uniquement les homes d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth CLI externe puisse rafraîchir les jetons sans muter le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke ACP bind : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex, et Gemini par défaut, avec couverture stricte Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke d’intégration/canal/agent avec archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker l’archive OpenClaw empaquetée, configure OpenAI via une intégration par référence env plus Telegram par défaut, vérifie que doctor répare les dépendances runtime du Plugin activé, et exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement dans Docker l’archive OpenClaw empaquetée, passe du paquet `stable` au git `dev`, vérifie que le canal et le Plugin persistés après mise à jour fonctionnent, puis revient au paquet `stable` et vérifie l’état de mise à jour.
- Smoke de contexte runtime de session : `pnpm test:docker:session-runtime-context` vérifie la persistance cachée des transcriptions de contexte runtime ainsi que la réparation doctor des branches dupliquées de réécriture de prompt concernées.
- Smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre courant, l’installe avec `bun install -g` dans un home isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’image intégrés au lieu de se bloquer. Réutilisez une archive préconstruite avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un seul cache npm entre ses conteneurs root, update et direct-npm. Le smoke de mise à jour utilise par défaut npm `latest` comme base stable avant de passer à l’archive candidate. Les vérifications d’installateur non root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation locale utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm entre les relances locales.
- Install Smoke CI ignore la mise à jour globale directe npm en double avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Smoke CLI de suppression d’espace de travail partagé d’agents : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, initialise deux agents avec un seul espace de travail dans un home de conteneur isolé, exécute `agents delete --json`, puis vérifie la validité du JSON ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Smoke d’instantané navigateur CDP : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP couvrent les URL de lien, les éléments cliquables promus par le curseur, les références d’iframe, et les métadonnées de frame.
- Régression minimale de raisonnement OpenAI Responses `web_search` : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force un rejet de schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisée + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (vrai serveur MCP stdio + smoke allow/deny du profil Pi embarqué) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (vraie Gateway + arrêt du processus enfant MCP stdio après Cron isolé et exécutions one-shot de sous-agent) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke d’installation, installation/désinstallation ClawHub, mises à jour marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub live, ou remplacez le paquet par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke inchangé de mise à jour de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances runtime de Plugin intégrés : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image runner Docker, construit et empaquette OpenClaw une fois sur l’hôte, puis monte cette archive dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après une construction locale fraîche avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers une archive existante avec `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L’agrégat Docker complet pré-empaquette cette archive une fois, puis fragmente les vérifications de canaux intégrés en lanes indépendantes, y compris des lanes de mise à jour séparées pour Telegram, Discord, Slack, Feishu, memory-lancedb, et ACPX. Utilisez `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` pour restreindre la matrice de canaux lorsque vous exécutez directement la lane intégrée, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` pour restreindre le scénario de mise à jour. La lane vérifie aussi que `channels.<id>.enabled=false` et `plugins.entries.<id>.enabled=false` suppriment la réparation doctor/dépendances runtime.
- Restreignez les dépendances runtime des Plugin intégrés pendant l’itération en désactivant les scénarios non liés, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image partagée de l’application buildée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image spécifiques à une suite, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles car ils valident le comportement de paquet/installation plutôt que le runtime partagé de l’application buildée.

Les runners Docker live-model montent également l’extraction courante en lecture seule et
la préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela maintient l’image runtime
légère tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les gros caches locaux et sorties de build applicatives comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, et les répertoires `.build` locaux d’application ou
les sorties Gradle, afin que les exécutions Docker live ne passent pas des minutes à copier des
artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live Gateway ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture
live Gateway de cette lane Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette lane attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le moyen principal de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway initialisé,
démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture des transcriptions, les métadonnées
de pièces jointes, le comportement live de la file d’événements, le routage des envois sortants, et les notifications de canal + autorisation de style Claude sur le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client donné expose éventuellement.
`test:docker:pi-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de
modèle live. Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi embarqué,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent
les outils `bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live. Il démarre une Gateway initialisée avec un vrai serveur de sonde MCP stdio, exécute un tour Cron isolé et un tour enfant one-shot `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel ACP en langage naturel sur fil (pas en CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être à nouveau nécessaire pour la validation du routage ACP sur fil, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et sans montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes par fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de relances qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour s’assurer que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par la Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de la documentation

Exécutez les vérifications de documentation après des modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (sûre pour la CI)

Ce sont de « vraies régressions de pipeline » sans vrais fournisseurs :

- Appel d’outil Gateway (OpenAI simulé, vraie Gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écrit config + auth imposées) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests sûrs pour la CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outil simulé à travers la vraie Gateway + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant end-to-end qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque les Skills sont listées dans le prompt, l’agent choisit-il la bonne Skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, le report de l’historique de session et les frontières de sandbox.

Les évaluations futures devraient d’abord rester déterministes :

- Un runner de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de Skill et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, barrières, injection de prompt).
- Des évaluations live facultatives (opt-in, contrôlées par env) uniquement une fois la suite sûre pour la CI en place.

## Tests de contrat (forme des Plugin et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils parcourent tous les Plugin découverts et exécutent une suite
d’assertions sur la forme et le comportement. La lane unit par défaut `pnpm test`
ignore volontairement ces fichiers de couture et de smoke partagés ; exécutez les commandes de contrat explicitement
lorsque vous touchez aux surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de la charge utile des messages
- **inbound** - Gestion des messages entrants
- **actions** - Handlers d’action de canal
- **threading** - Gestion des identifiants de fil
- **directory** - API de répertoire/roster
- **group-policy** - Application de la politique de groupe

### Contrats de statut des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre de Plugin

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d’authentification
- **auth-choice** - Choix/sélection de l’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte de Plugin
- **loader** - Chargement de Plugin
- **runtime** - Runtime fournisseur
- **shape** - Forme/interface de Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après une modification des exports ou sous-chemins de plugin-sdk
- Après l’ajout ou la modification d’un Plugin de canal ou de fournisseur
- Après une refactorisation de l’enregistrement ou de la découverte de Plugin

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (recommandations)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression sûre pour la CI (fournisseur simulé/stub, ou capture exacte de la transformation de forme de requête)
- Si le problème est intrinsèquement live-only (limitations de débit, politiques d’authentification), gardez le test live étroit et opt-in via variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/rejeu de requête fournisseur → test direct des modèles
  - bug de pipeline Gateway session/historique/outil → smoke live Gateway ou test mock Gateway sûr pour la CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillon par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec de segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les identifiants de cible non classifiés afin que de nouvelles classes ne puissent pas être ignorées silencieusement.

## Liens connexes

- [Tests live](/fr/help/testing-live)
- [CI](/fr/ci)
