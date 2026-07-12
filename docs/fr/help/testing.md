---
read_when:
    - Exécution des tests en local ou dans la CI
    - Ajout de tests de non-régression pour les bogues de modèles/fournisseurs
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et couverture de chaque test'
title: Tests
x-i18n:
    generated_at: "2026-07-12T15:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw comporte trois suites Vitest (unitaire/intégration, e2e, live), ainsi que des
exécuteurs Docker. Cette page décrit la couverture de chaque suite, la commande à exécuter pour un
workflow donné, la manière dont les tests live détectent les identifiants, et comment ajouter des
tests de non-régression pour des bogues réels de fournisseurs/modèles.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble de la QA](/fr/concepts/qa-e2e-automation) - architecture, interface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) - référence pour `pnpm openclaw qa matrix`.
- [Tableau de maturité](/fr/maturity/scorecard) - manière dont les preuves de QA des versions étayent les décisions de stabilité et de LTS.
- [Canal QA](/fr/channels/qa-channel) - le plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre les suites de tests ordinaires et les exécuteurs Docker/Parallels. La section [Exécuteurs propres à la QA](#qa-specific-runners) ci-dessous répertorie les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Validation complète (attendue avant un push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine disposant de ressources suffisantes : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers achemine également les chemins des plugins/canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Lors de l’itération sur un échec unique, privilégiez d’abord les exécutions ciblées.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous modifiez des tests ou souhaitez davantage de confiance :

- Rapport informatif de couverture V8 : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

## Répertoires temporaires des tests

Utilisez les utilitaires partagés de `test/helpers/temp-dir.ts` pour les répertoires
temporaires appartenant aux tests, afin que leur propriété soit explicite et que le nettoyage reste
dans le cycle de vie du test :

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("utilise un espace de travail temporaire", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // utiliser l’espace de travail
});
```

`useAutoCleanupTempDirTracker(afterEach)` n’expose intentionnellement aucune méthode de
nettoyage manuel : Vitest prend en charge le nettoyage après chaque test. Les anciens
utilitaires de plus bas niveau (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) existent toujours
pour les tests qui n’ont pas encore été migrés ; évitez de les utiliser dans du nouveau code, ainsi que d’ajouter des appels directs à
`fs.mkdtemp*`, sauf si un test vérifie explicitement le comportement brut des répertoires
temporaires. Lorsqu’un répertoire temporaire direct est réellement nécessaire, ajoutez un commentaire
d’autorisation vérifiable indiquant la raison :

```ts
// openclaw-temp-dir: allow vérifie le comportement brut de nettoyage de fs
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` signale les nouvelles créations directes de répertoires
temporaires et les nouveaux usages manuels des utilitaires partagés dans les lignes ajoutées du diff, sans
bloquer les styles de nettoyage existants. Il suit la même classification des chemins de test
que `scripts/changed-lanes.mjs` et ignore l’implémentation de l’utilitaire partagé
elle-même. `check:changed` exécute ce rapport pour les chemins de test modifiés sous forme de
signal CI d’avertissement uniquement (annotations d’avertissement GitHub, et non des échecs).

## Workflows live et Docker/Parallels

Lors du débogage de fournisseurs/modèles réels (nécessite de véritables identifiants) :

- Suite live (modèles + sondes d’outils/images du Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performances d’exécution : déclenchez `OpenClaw Performance` avec
  `live_openai_candidate=true` pour un tour d’agent réel `openai/gpt-5.6-luna` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace Kova. Les exécutions quotidiennes planifiées
  publient les rapports des voies fournisseur simulé, profilage approfondi et GPT-5.6 Luna dans
  `openclaw/clawgrit-reports` depuis une tâche de publication distincte consommant les artefacts ;
  une authentification de publication absente ou invalide fait échouer les exécutions planifiées et
  celles avec `profile=release`. Les déclenchements manuels hors version conservent les artefacts GitHub
  et considèrent la publication des rapports comme indicative. Le rapport du fournisseur simulé
  inclut également des mesures au niveau du code source pour le démarrage du Gateway, la mémoire, la pression
  exercée par les plugins, la boucle répétée de salutations du faux modèle et le démarrage de la CLI.
- Balayage live des modèles dans Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute un tour textuel ainsi qu’une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent également un petit tour avec image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs de fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, qui inclut des tâches matricielles de modèles live Docker
    partitionnées par fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets de fournisseur à fort signal dans `scripts/ci-hydrate-live-auth.sh`,
    ainsi que dans `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/de version.
- Test rapide natif de discussion liée à Codex : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker sur le chemin du serveur d’application Codex, lie un
    message privé Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe d’image
    passent par la liaison native du plugin plutôt que par ACP.
- Test rapide du banc d’essai du serveur d’application Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent du Gateway au moyen du banc d’essai du serveur d’application Codex
    appartenant au plugin, vérifie `/codex status` et `/codex models`, et exerce par défaut
    des sondes d’image, MCP cron, sous-agent et Guardian. Désactivez la sonde de
    sous-agent avec `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous
    isolez d’autres échecs. Pour une vérification ciblée du sous-agent, désactivez les
    autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cette commande se termine après la sonde de sous-agent, sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Test rapide de l’installation à la demande de Codex : `pnpm test:docker:codex-on-demand`
  - Installe l’archive tar empaquetée d’OpenClaw dans Docker, exécute la configuration initiale
    avec une clé d’API OpenAI, et vérifie que le plugin Codex et la dépendance `@openai/codex`
    ont été téléchargés à la demande dans la racine du projet npm géré.
- Test rapide live des dépendances d’outil de plugin : `pnpm test:docker:live-plugin-tool`
  - Empaquette un plugin de test avec une véritable dépendance `slugify`, l’installe
    via `npm-pack:`, vérifie la dépendance sous la racine du projet npm
    géré, puis demande à un modèle OpenAI live d’appeler l’outil du plugin et
    de renvoyer le slug masqué.
- Test rapide de la commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification facultative à double sécurité de l’interface de commande de secours du canal de
    messages. Exerce `/crestodian status`, met en file d’attente un changement persistant de
    modèle, répond `/crestodian yes`, puis vérifie le chemin d’écriture d’audit/configuration.
- Test rapide Docker de la première exécution de Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide et démontre d’abord que la CLI empaquetée
    `openclaw crestodian` échoue de manière fermée sans inférence. Il
    teste et active ensuite un faux Claude au moyen du module d’activation empaqueté.
    Ce n’est qu’après cela qu’une requête approximative adressée à la CLI empaquetée atteint le planificateur et
    se résout en une configuration typée, suivie d’opérations ponctuelles sur le modèle, l’agent, le plugin Discord
    et SecretRef. Il valide les entrées de configuration et d’audit. Il s’agit
    de preuves complémentaires de validation/d’opération, et non d’une preuve de configuration initiale interactive ni
    d’agent/outil/approbation Crestodian. La même voie est exposée dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test rapide des coûts Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé avec `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke une valeur `usage.cost` normalisée.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, privilégiez la restriction des tests live à l’aide des variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à la QA

Ces commandes complètent les principales suites de tests lorsque vous avez besoin du réalisme de QA Lab.

La CI exécute QA Lab dans des workflows dédiés. La parité agentique est intégrée à
`QA-Lab - All Lanes` et à la validation des versions, et non à un workflow de PR autonome.
La validation étendue doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des vérifications de version. Les vérifications de version
stable/par défaut conservent les tests d’endurance live/Docker exhaustifs derrière `run_release_soak=true` ; le
profil `full` force leur activation. `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et
depuis un déclenchement manuel, avec la voie de parité simulée, la voie Matrix live,
la voie Telegram live gérée par Convex et la voie Discord live gérée par Convex en tant que
tâches parallèles. La QA planifiée et les vérifications de version transmettent explicitement
`--profile fast` à Matrix, tandis que la valeur par défaut de la CLI Matrix et de l’entrée du workflow manuel reste
`all` ; un déclenchement manuel peut partitionner `all` en tâches `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release Checks` exécute
la parité ainsi que les voies rapides Matrix et Telegram avant l’approbation de la version, en utilisant
`mock-openai/gpt-5.6-luna` pour les vérifications de transport de version afin qu’elles restent déterministes
et évitent le démarrage normal du plugin de fournisseur. Ces Gateway de transport live
désactivent la recherche en mémoire ; le comportement de la mémoire reste couvert par les suites de parité QA.

Les partitions de médias live de la validation complète de version utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui contient déjà
`ffmpeg` et `ffprobe`. Les partitions Docker de modèles/backends live utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>`, construite une seule fois par commit
sélectionné, puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de la reconstruire
dans chaque partition.

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte les scénarios d’assurance qualité issus du dépôt.
  - Écrit les artefacts de premier niveau `qa-evidence.json`, `qa-suite-summary.json` et
    `qa-suite-report.md` pour l’ensemble de scénarios sélectionné, y compris
    les sélections de scénarios de flux mixtes, Vitest et Playwright.
  - Lorsqu’elle est lancée par `pnpm openclaw qa run --qa-profile <profile>`, intègre
    le tableau de bord du profil taxonomique sélectionné dans le même fichier `qa-evidence.json`.
    `smoke-ci` écrit des preuves allégées (`evidenceMode: "slim"`, sans
    `execution` par entrée). `release` couvre la sélection organisée pour la préparation
    à la publication ; `all` sélectionne chaque catégorie de maturité active et cible
    les lancements explicites du workflow QA Profile Evidence lorsqu’un artefact de tableau
    de bord complet est nécessaire.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (limitée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre
    de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code différent de zéro si un scénario échoue. Utilisez `--allow-failures` pour
    produire les artefacts sans code de sortie d’échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local basé sur AIMock pour une couverture
    expérimentale des fixtures et des simulations de protocole, sans remplacer la voie
    `mock-openai` tenant compte des scénarios.
- `pnpm openclaw qa coverage --match <query>`
  - Recherche dans les identifiants et titres de scénarios, les surfaces, les identifiants de couverture, les références
    de documentation et de code, les plugins et les exigences des fournisseurs, puis affiche les cibles
    de suite correspondantes.
  - Utilisez cette commande avant une exécution QA Lab lorsque vous connaissez le comportement ou le chemin de fichier
    concerné, mais pas le scénario minimal. À titre indicatif uniquement — choisissez tout de même la preuve
    simulée, en direct, Multipass, Matrix ou de transport en fonction du comportement
    modifié.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute la batterie de tests en direct du plugin OpenAI Kitchen Sink via QA Lab.
    Installe le package Kitchen Sink externe, vérifie l’inventaire des surfaces
    du SDK de plugin, sonde `/healthz` et `/readyz`, enregistre les preuves CPU/RSS
    du Gateway, exécute un tour OpenAI en direct et vérifie les diagnostics
    contradictoires. Nécessite une authentification OpenAI en direct telle que `OPENAI_API_KEY`. Dans
    les sessions Testbox hydratées, la commande charge automatiquement le profil
    d’authentification en direct Testbox lorsque l’utilitaire `openclaw-testbox-env` est présent.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc d’essai de démarrage du Gateway ainsi qu’un petit ensemble de scénarios QA Lab simulés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations
    CPU sous `.artifacts/gateway-cpu-scenarios/`.
  - Ne signale par défaut que les observations soutenues de CPU élevé (`--cpu-core-warn`,
    valeur par défaut `0.9` ; `--hot-wall-warn-ms`, valeur par défaut `30000`), afin que les brèves pointes
    au démarrage soient enregistrées comme métriques sans ressembler à la régression
    d’utilisation maximale du Gateway durant plusieurs minutes.
  - S’exécute sur les artefacts `dist` compilés ; effectuez d’abord une compilation si la copie de travail
    ne contient pas déjà une sortie d’exécution à jour.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite d’assurance qualité dans une machine virtuelle Linux Multipass jetable, en conservant
    les mêmes indicateurs de sélection de scénarios, de fournisseur et de modèle que `qa suite`.
  - Les exécutions en direct transmettent les données d’authentification QA utilisables par l’invité :
    les clés de fournisseur basées sur l’environnement, le chemin de configuration du fournisseur QA en direct et
    `CODEX_HOME` lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire
    via l’espace de travail monté.
  - Écrit le rapport et le résumé QA habituels, ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA basé sur Docker pour les tâches d’assurance qualité de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crée une archive npm à partir de la copie de travail actuelle, l’installe globalement dans
    Docker, exécute une intégration non interactive avec une clé d’API OpenAI, configure
    Telegram par défaut, vérifie que l’environnement d’exécution du plugin empaqueté se charge sans
    réparation des dépendances au démarrage, exécute doctor, puis exécute un tour d’agent local
    sur un point de terminaison OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation
    empaquetée avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un test rapide Docker déterministe de l’application compilée pour les transcriptions du contexte
    d’exécution intégré. Vérifie que le contexte d’exécution OpenClaw masqué persiste sous forme de
    message personnalisé non affiché au lieu d’apparaître dans le tour utilisateur
    visible, puis initialise un fichier JSONL de session défectueux concerné et vérifie que
    `openclaw doctor --fix` le réécrit sur la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un package OpenClaw candidat dans Docker, exécute l’intégration
    du package installé, configure Telegram via la CLI installée, puis réutilise
    la voie QA Telegram en direct avec ce package installé comme Gateway
    du système testé.
  - Le wrapper ne monte que la source du banc d’essai `qa-lab` depuis la copie de travail ;
    le package installé possède `dist`, `openclaw/plugin-sdk` et l’environnement d’exécution
    du plugin fourni, afin que la voie ne mélange pas les plugins de la copie de travail actuelle
    au package testé.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester à la place une archive locale résolue
    sans l’installer depuis le registre.
  - Émet par défaut des mesures répétées du temps aller-retour dans `qa-evidence.json` avec
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Redéfinissez
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster l’exécution.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepte une liste d’identifiants de vérifications
    QA Telegram séparés par des virgules à échantillonner ; lorsque cette variable n’est pas définie, la vérification
    compatible avec le temps aller-retour par défaut est `telegram-mentioned-message-reply`.
  - Utilise les mêmes identifiants Telegram provenant de l’environnement ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation de CI/publication, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans
    la CI, le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide sur l’hôte les variables d’environnement des identifiants Telegram ou Convex
    avant les opérations de compilation/installation Docker. Définissez
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` uniquement lors du
    débogage délibéré de la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace
    la valeur partagée `OPENCLAW_QA_CREDENTIAL_ROLE` uniquement pour cette voie. Lorsque les identifiants
    Convex sont sélectionnés et qu’aucun rôle n’est défini, le wrapper utilise `ci` dans la CI
    et `maintainer` hors de la CI.
  - GitHub Actions expose cette voie sous forme de workflow manuel pour les responsables de maintenance
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors d’une fusion. Le workflow utilise
    l’environnement `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose également `Package Acceptance` pour une preuve produit exécutée séparément
  sur un package candidat. Il accepte une référence Git, une spécification npm publiée,
  une URL HTTPS d’archive accompagnée d’un SHA-256, une politique d’URL approuvée ou un artefact
  d’archive provenant d’une autre exécution (`source=ref|npm|url|trusted-url|artifact`), téléverse
  le fichier normalisé `openclaw-current.tgz` sous le nom `package-under-test`, puis exécute le
  planificateur E2E Docker existant avec les profils de voies `smoke`, `package`, `product`, `full`
  ou `custom`. Définissez `telegram_mode=mock-openai` ou
  `live-frontier` pour exécuter le workflow QA Telegram sur le même
  artefact `package-under-test`.
  - Dernière preuve produit bêta :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La preuve par URL d’archive exacte nécessite une empreinte et utilise la politique de sécurité des URL publiques :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Les miroirs d’archives d’entreprise/privés utilisent une politique explicite de source approuvée :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lit `.github/package-trusted-sources.json` depuis la référence de workflow approuvée et n’accepte ni identifiants dans l’URL ni contournement du réseau privé fourni en entrée du workflow. Si la politique nommée déclare une authentification par jeton Bearer, configurez le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La preuve par artefact télécharge un artefact d’archive depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaquette et installe la version actuelle d’OpenClaw dans Docker, démarre le
    Gateway avec OpenAI configuré, puis active les canaux/plugins fournis via
    des modifications de configuration.
  - Vérifie que la découverte lors de la configuration laisse les plugins téléchargeables non configurés
    absents, que la première réparation configurée par doctor installe explicitement chaque
    plugin téléchargeable manquant et qu’un second redémarrage n’exécute pas
    de réparation masquée des dépendances.
  - Installe également une version de référence npm antérieure connue, active Telegram avant
    d’exécuter `openclaw update --tag <candidate>`, puis vérifie que
    le doctor post-mise à jour du candidat nettoie les résidus de dépendances héritées des plugins
    sans réparation post-installation effectuée par le banc d’essai.
- `pnpm test:parallels:npm-update`
  - Exécute le test rapide natif de mise à jour d’une installation empaquetée sur les invités Parallels.
    Chaque plateforme sélectionnée installe d’abord le package de référence demandé,
    puis exécute la commande `openclaw update` installée dans le même invité et
    vérifie la version installée, l’état de la mise à jour, la disponibilité du Gateway et
    un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux`
    lorsque vous travaillez sur un seul invité. Utilisez `--json` pour obtenir le chemin de l’artefact
    de résumé et l’état de chaque voie.
  - La voie OpenAI utilise par défaut `openai/gpt-5.6-luna` pour la preuve du tour
    d’agent en direct. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` pour valider un autre modèle OpenAI.
  - Encapsulez les longues exécutions locales dans un délai d’expiration de l’hôte afin que les blocages
    du transport Parallels ne consomment pas le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux imbriqués des voies sous
    `/tmp/openclaw-parallels-npm-update.*`. Examinez `windows-update.log`,
    `macos-update.log` ou `linux-update.log` avant de supposer que le
    wrapper externe est bloqué.
  - La mise à jour Windows peut consacrer 10 à 15 minutes aux opérations de doctor après mise à jour et
    de mise à jour du package sur un invité froid ; cela reste normal tant que le
    journal de débogage npm imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies de test rapide Parallels
    individuelles pour macOS, Windows ou Linux. Elles partagent l’état de la machine virtuelle et peuvent
    entrer en conflit lors de la restauration d’un instantané, de la distribution d’un package ou sur l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins fournis, car
    les façades de fonctionnalités telles que la synthèse vocale, la génération d’images et la
    compréhension des médias sont chargées via les API d’exécution fournies, même lorsque le tour
    d’agent lui-même ne vérifie qu’une simple réponse textuelle.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur local du fournisseur AIMock pour des tests
    de fumée directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute le parcours d’assurance qualité en conditions réelles de Matrix sur un serveur
    domestique Tuwunel temporaire reposant sur Docker. Réservé aux extractions du code source :
    les installations empaquetées n’incluent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et organisation des artefacts :
    [Assurance qualité de Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute le parcours d’assurance qualité en conditions réelles de Telegram sur un véritable groupe privé à l’aide des
    jetons du bot pilote et du bot du système testé provenant de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être l’identifiant
    numérique de la discussion Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants d’authentification mutualisés et partagés.
    Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    pour utiliser les locations mutualisées.
  - Les valeurs par défaut couvrent la version canari, le filtrage par mention, l’adressage des commandes, `/status`,
    les réponses mentionnées de bot à bot et les réponses aux commandes natives principales.
    Les valeurs par défaut de `mock-openai` couvrent également les régressions déterministes des chaînes de réponses et
    de la diffusion en continu du message final de Telegram. Utilisez `--list-scenarios`
    pour les sondes facultatives telles que `session_status`.
  - Se termine avec un code différent de zéro en cas d’échec d’un scénario. Utilisez `--allow-failures` pour
    générer les artefacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot du système testé
    devant disposer d’un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez Bot-to-Bot Communication Mode
    dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer
    le trafic des bots dans le groupe.
  - Écrit un rapport d’assurance qualité Telegram, un résumé et `qa-evidence.json` sous
    `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le temps aller-retour entre la demande d’envoi
    du pilote et la réponse observée du système testé.

`Mantis Telegram Live` est l’enveloppe de collecte de preuves de PR autour de ce parcours. Elle exécute
la référence candidate avec des identifiants d’authentification Telegram loués par Convex, affiche le
lot expurgé de rapports et de preuves d’assurance qualité dans un navigateur de bureau Crabbox, enregistre des preuves
au format MP4, génère un GIF élagué selon les mouvements, téléverse le lot d’artefacts et
publie des preuves intégrées dans la PR via l’application GitHub Mantis lorsque `pr_number` est
défini. Les mainteneurs peuvent la démarrer depuis l’interface Actions via `Mantis Scenario`
(`scenario_id: telegram-live`) ou directement depuis un commentaire de demande d’extraction :

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` est l’enveloppe agentique native de Telegram Desktop
pour les preuves visuelles avant/après des PR. Lancez-la depuis l’interface Actions avec
des `instructions` libres, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), ou depuis un commentaire de PR :

```text
@openclaw-mantis preuve Telegram Desktop
```

L’agent Mantis lit la PR, détermine quel comportement visible dans Telegram prouve
la modification, exécute le parcours de preuve Crabbox avec un utilisateur réel dans Telegram Desktop sur
les références de base et candidate, itère jusqu’à ce que les GIF natifs soient utiles,
écrit un manifeste `motionPreview` apparié et publie le même tableau de GIF à 2 colonnes
via l’application GitHub Mantis lorsque `pr_number` est défini.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Loue ou réutilise un poste de travail Linux Crabbox, installe l’application native Telegram
    Desktop, configure OpenClaw avec un jeton de bot SUT Telegram loué,
    démarre le Gateway et enregistre des preuves sous forme de captures d’écran/MP4 depuis le
    bureau VNC visible.
  - Utilise par défaut `--credential-source convex` afin que les workflows n’aient besoin que du
    secret du courtier Convex. Utilisez `--credential-source env` avec les mêmes
    variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop nécessite toujours une connexion/un profil utilisateur. Le jeton de bot
    configure uniquement OpenClaw. Utilisez `--telegram-profile-archive-env <name>`
    pour une archive de profil `.tgz` encodée en base64, ou utilisez `--keep-lease` et connectez-vous
    manuellement une fois via VNC.
  - Écrit `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` et `telegram-desktop-builder.mp4`
    dans le répertoire de sortie.

Les parcours de transport en direct partagent un contrat standard unique afin que les nouveaux transports ne
divergent pas ; la matrice de couverture de chaque parcours se trouve dans
[Présentation de la QA — Couverture des transports en direct](/fr/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` est la suite synthétique générale et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
est activé pour l’assurance qualité des transports en conditions réelles, le laboratoire d’assurance qualité acquiert un bail exclusif auprès d’un
pool reposant sur Convex, envoie des Heartbeat pour ce bail pendant l’exécution de la voie et
libère le bail à l’arrêt. Le nom de la section est antérieur à la prise en charge de Discord, Slack et
WhatsApp ; le contrat de bail est commun à tous les types.

Structure de projet Convex de référence : `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` dans la CI, sinon `maintainer`)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valeur par défaut : `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valeur par défaut : `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valeur par défaut : `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valeur par défaut : `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valeur par défaut : `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex de bouclage en `http://` uniquement pour le développement local.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration pour les mainteneurs (ajout, suppression et liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Utilitaires CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions réelles pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe du point de terminaison, le délai d’expiration HTTP et l’accessibilité des fonctions d’administration/de liste sans afficher
les valeurs secrètes. Utilisez `--json` pour obtenir une sortie lisible par machine dans les scripts et les utilitaires
de CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Les requêtes s’authentifient avec un en-tête `Authorization: Bearer <role secret>` ;
les corps ci-dessous omettent cet en-tête :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Réussite : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Pool épuisé/nouvelle tentative possible : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Réussite : `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Réussite : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Réussite : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret de responsable de maintenance uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Réussite : `{ status: "ok", credential }`
- `POST /admin/remove` (secret de responsable de maintenance uniquement)
  - Requête : `{ credentialId, actorId }`
  - Réussite : `{ status: "ok", changed, credential }`
  - Protection contre un bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret de responsable de maintenance uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Réussite : `{ status: "ok", credentials, count }`

Structure de la charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne représentant un identifiant numérique de discussion Telegram.
- `admin/add` valide cette structure pour `kind: "telegram"` et rejette les charges utiles mal formées.

Structure de la charge utile pour le type utilisateur réel Telegram :

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` et `telegramApiId` doivent être des chaînes numériques.
- `tdlibArchiveSha256` et `desktopTdataArchiveSha256` doivent être des chaînes hexadécimales SHA-256.
- `kind: "telegram-user"` est réservé au flux de preuve Mantis Telegram Desktop. Les voies génériques de QA Lab ne doivent pas l’acquérir.

Charges utiles multicanales validées par le courtier :

- Discord : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Les voies Slack peuvent également louer des identifiants depuis le pool, mais la validation des charges utiles Slack
se trouve actuellement dans l’exécuteur QA Slack plutôt que dans le courtier. Utilisez
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
pour les lignes Slack.

### Ajout d’un canal à la QA

L’architecture et les noms des assistants de scénario pour les nouveaux adaptateurs de canal se trouvent dans
[Vue d’ensemble de la QA – Ajout d’un canal](/fr/concepts/qa-e2e-automation#adding-a-channel).
Exigences minimales : implémenter l’exécuteur de transport sur l’interface partagée de l’hôte `qa-lab`,
ajouter une `adapterFactory` pour les scénarios partagés, déclarer `qaRunners` dans le
manifeste du Plugin, le monter sous la forme `openclaw qa <runner>` et créer les scénarios dans
`qa/scenarios/`.

## Suites de tests (où chacune s’exécute)

Considérez les suites comme présentant un « réalisme croissant » (ainsi qu’une instabilité et un coût croissants).

### Tests unitaires / d’intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de fragments `vitest.full-*.config.ts` et peuvent
  développer les fragments multiprojets en configurations par projet pour une planification
  parallèle
- Fichiers : inventaires des tests principaux/unitaires sous `src/**/*.test.ts`,
  `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires de l’interface utilisateur s’exécutent dans le
  fragment dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration au sein du processus (authentification du Gateway, routage, outils, analyse syntaxique, configuration)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute dans la CI
  - Aucune clé réelle requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent démontrer le comportement général de repli de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de Plugin générées,
    et non avec les API sources de véritables Plugins intégrés. Les chargements réels d’API de Plugin doivent figurer dans
    les suites de contrat/d’intégration appartenant au Plugin.

Politique relative aux dépendances natives :

- Les installations de test par défaut ignorent les compilations natives facultatives d’opus pour Discord. La voix Discord
  utilise `libopus-wasm` intégré, et `@discordjs/opus` reste désactivé dans
  `allowBuilds` afin que les tests locaux et les voies Testbox ne compilent pas le
  module complémentaire natif.
- Comparez les performances d’opus natif dans le dépôt de benchmarks `libopus-wasm`, et non
  dans les boucles d’installation/de test par défaut d’OpenClaw. Ne définissez pas `@discordjs/opus` sur
  `true` dans la configuration `allowBuilds` par défaut ; cela ferait compiler du code natif par des boucles
  d’installation/de test sans rapport.

<AccordionGroup>
  <Accordion title="Projets, fragments et voies ciblées">

    - Les exécutions non ciblées de `pnpm test` lancent treize configurations de fragments plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique processus natif gigantesque pour le projet racine. Cela réduit le pic de RSS sur les machines chargées et évite que les tâches d’auto-réponse ou des plugins ne privent de ressources les suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projets racine natif de `vitest.config.ts`, car une boucle de surveillance multifragment n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers ou de répertoires vers des voies ciblées, afin que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite le coût de démarrage de l’ensemble du projet racine.
    - Par défaut, `pnpm test:changed` développe les chemins Git modifiés en voies ciblées peu coûteuses : modifications directes de tests, fichiers `*.test.ts` frères, correspondances explicites de sources et dépendants locaux dans le graphe d’importation. Les modifications de configuration, d’initialisation ou de paquet ne déclenchent pas une exécution étendue des tests, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de contrôle locale intelligente habituelle pour les modifications restreintes. Elle classe les différences entre le cœur, les tests du cœur, les extensions, les tests d’extensions, les applications, la documentation, les métadonnées de publication, l’outillage Docker actif et l’outillage général, puis exécute les commandes correspondantes de vérification des types, de lint et de garde. Elle n’exécute pas les tests Vitest ; utilisez `pnpm test:changed` ou une commande explicite `pnpm test <target>` pour fournir une preuve par les tests. Les changements de version limités aux métadonnées de publication exécutent des vérifications ciblées de version, de configuration et de dépendances racine, avec une garde qui rejette les modifications de paquet hors du champ de version de niveau supérieur.
    - Les modifications du banc d’essai ACP Docker actif exécutent des vérifications ciblées : syntaxe shell des scripts d’authentification Docker actifs et simulation du planificateur Docker actif. Les modifications de `package.json` ne sont incluses que lorsque la différence se limite à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exports, de versions et d’autres surfaces du paquet utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en importations provenant des agents, commandes, plugins, utilitaires d’auto-réponse, de `plugin-sdk` et de zones similaires d’utilitaires purs sont acheminés vers la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou fortement dépendants de l’environnement d’exécution restent sur les voies existantes.
    - Certains fichiers sources utilitaires de `plugin-sdk` et `commands` associent également les exécutions en mode modifications à des tests frères explicites dans ces voies légères, afin que les modifications d’utilitaires évitent de réexécuter toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de groupes dédiés pour les utilitaires principaux de niveau supérieur, les tests d’intégration `reply.*` de niveau supérieur et la sous-arborescence `src/auto-reply/reply/**`. La CI divise en outre la sous-arborescence de réponse en fragments pour l’exécuteur d’agents, la répartition et le routage des commandes et de l’état, afin qu’un seul groupe chargé en importations ne monopolise pas toute la fin d’exécution de Node.
    - La CI normale des PR et de la branche principale ignore volontairement le balayage par lots des plugins intégrés et le fragment `agentic-plugins` réservé aux publications. La validation complète de publication déclenche le workflow enfant distinct `Plugin Prerelease` pour ces suites fortement axées sur les plugins sur les versions candidates.

  </Accordion>

  <Accordion title="Couverture de l’exécuteur intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de messagerie ou le contexte d’exécution de la Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des tests de non-régression ciblés pour les frontières de routage et de normalisation pures.
    - Veillez au bon fonctionnement des suites d’intégration de l’exécuteur intégré :
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` et
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants à portée limitée et le comportement de la Compaction continuent de passer par les véritables chemins `run.ts` / `compact.ts` ; les tests limités aux utilitaires ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool et de l’isolation Vitest">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise l’exécuteur non isolé pour les projets racine ainsi que les configurations de bout en bout et actives.
    - La voie d’interface utilisateur racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute également sur l’exécuteur non isolé partagé.
    - Chaque fragment de `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute par défaut `--no-maglev` aux processus Node enfants de Vitest afin de réduire la répétition des compilations V8 lors des grandes exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8 standard.
    - `scripts/run-vitest.mjs` met fin aux exécutions Vitest explicites hors surveillance après 5 minutes sans aucune sortie sur stdout ou stderr. Définissez `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` pour désactiver le mécanisme de surveillance lors d’une investigation volontairement silencieuse.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` indique les voies architecturales déclenchées par une différence.
    - Le hook de pré-commit effectue uniquement le formatage. Il réindexe les fichiers formatés et n’exécute ni lint, ni vérification des types, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant le transfert ou le push lorsque vous avez besoin de la porte de contrôle locale intelligente.
    - Par défaut, `pnpm test:changed` passe par des voies ciblées peu coûteuses. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent estime qu’une modification du banc d’essai, de la configuration, du paquet ou d’un contrat nécessite réellement une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, avec simplement une limite de workers plus élevée.
    - L’ajustement automatique du nombre de workers locaux est volontairement prudent et réduit leur nombre lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest simultanées causent moins de perturbations par défaut.
    - La configuration Vitest de base marque les fichiers de projets et de configuration comme `forceRerunTriggers`, afin que les réexécutions en mode modifications restent correctes lorsque le câblage des tests change.
    - La configuration maintient `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` pour utiliser un emplacement de cache explicite unique lors d’un profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active la création de rapports Vitest sur la durée des imports ainsi que
      la sortie de la ventilation des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de durée des partitions sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions portant sur l’ensemble de la configuration utilisent le chemin de configuration comme clé ; les partitions CI
      basées sur un motif d’inclusion ajoutent le nom de la partition afin que les partitions filtrées puissent être suivies
      séparément.
    - Lorsqu’un test intensif consacre encore l’essentiel de son temps aux imports de démarrage,
      placez les dépendances lourdes derrière une interface locale étroite `*.runtime.ts` et
      simulez directement cette interface au lieu d’importer en profondeur des utilitaires d’exécution
      uniquement pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif du projet racine pour cette
      différence validée et affiche le temps écoulé ainsi que le RSS maximal sous macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure les performances de l’arborescence de travail
      modifiée actuelle en acheminant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      le démarrage de Vitest/Vite et le surcoût de transformation.
    - `pnpm test:perf:profile:runner` écrit des profils CPU et du tas du processus d’exécution pour
      la suite unitaire avec le parallélisme des fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` et `test/vitest/vitest.infra.config.ts`, chacune limitée à un seul processus de travail
- Périmètre :
  - Démarre un véritable Gateway en boucle locale avec les diagnostics activés par défaut
  - Génère une activité synthétique portant sur les messages du Gateway, la mémoire et les charges utiles volumineuses via le chemin des événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WebSocket du Gateway
  - Couvre les utilitaires de persistance du paquet de diagnostics de stabilité
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file d’attente par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clé
  - Voie ciblée pour le suivi des régressions de stabilité, et non substitut à la suite Gateway complète

### E2E (agrégat du dépôt)

- Commande : `pnpm test:e2e`
- Périmètre :
  - Exécute la voie E2E de test rapide du Gateway
  - Exécute la voie E2E du navigateur simulé de l’interface de contrôle
- Attentes :
  - Sûr pour la CI et sans clé
  - Nécessite l’installation de Chromium pour Playwright

### E2E (test rapide du Gateway)

- Commande : `pnpm test:e2e:gateway`
- Configuration : `test/vitest/vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et les tests E2E des plugins intégrés sous `extensions/`
- Valeurs d’exécution par défaut :
  - Utilise les `threads` de Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise un nombre adaptatif de processus de travail (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute par défaut en mode silencieux afin de réduire le surcoût des entrées-sorties de la console.
- Substitutions utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour imposer le nombre de processus de travail (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie détaillée de la console.
- Périmètre :
  - Comportement de bout en bout du Gateway avec plusieurs instances
  - Surfaces WebSocket/HTTP, appairage des Nodes et opérations réseau plus lourdes
- Attentes :
  - S’exécute dans la CI (lorsque cette voie est activée dans le pipeline)
  - Aucune clé réelle requise
  - Davantage de composants en mouvement que les tests unitaires (peut être plus lent)

### E2E (navigateur simulé de l’interface de contrôle)

- Commande : `pnpm test:ui:e2e`
- Configuration : `test/vitest/vitest.ui-e2e.config.ts`
- Fichiers : `ui/src/**/*.e2e.test.ts`
- Périmètre :
  - Démarre l’interface de contrôle Vite
  - Pilote une véritable page Chromium via Playwright
  - Remplace le WebSocket du Gateway par des simulations déterministes dans le navigateur
- Attentes :
  - S’exécute dans la CI dans le cadre de `pnpm test:e2e`
  - Aucun Gateway, agent ni clé de fournisseur réels requis
  - La dépendance du navigateur doit être présente (`pnpm --dir ui exec playwright install chromium`)

### E2E : test rapide du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Périmètre :
  - Réutilise un Gateway OpenShell local actif
  - Crée un bac à sable à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de véritables commandes `sandbox ssh-config` et une exécution SSH
  - Vérifie le comportement canonique distant du système de fichiers via le pont de système de fichiers du bac à sable
- Attentes :
  - Sur activation uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Nécessite un Gateway OpenShell local actif et sa source de configuration
  - Utilise des variables `HOME` / `XDG_CONFIG_HOME` isolées, puis détruit le bac à sable de test
- Substitutions utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite E2E plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour désigner un binaire CLI non standard ou un script d’encapsulation
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` pour exposer la configuration du Gateway enregistré au test isolé
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` pour remplacer l’adresse IP du Gateway Docker utilisée par le dispositif de stratégie de l’hôte

### En direct (fournisseurs réels + modèles réels)

- Commande : `pnpm test:live`
- Configuration : `test/vitest/vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts` et tests en conditions réelles des plugins intégrés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités des appels d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable dans la CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l’argent/utilise les limites de débit
  - Préférer l’exécution de sous-ensembles ciblés à « tout »
- Les exécutions en conditions réelles utilisent les clés d’API déjà exportées et les profils d’authentification préparés.
- Par défaut, les exécutions en conditions réelles isolent toujours `HOME` et copient les éléments de configuration et d’authentification dans un répertoire personnel de test temporaire, afin que les fixtures unitaires ne puissent pas modifier votre véritable `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous souhaitez intentionnellement que les tests en conditions réelles utilisent votre véritable répertoire personnel.
- `pnpm test:live` utilise par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...` et masque les journaux d’amorçage du Gateway ainsi que les messages Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous souhaitez rétablir l’intégralité des journaux de démarrage.
- Rotation des clés d’API (propre au fournisseur) : définissez `*_API_KEYS` au format séparé par des virgules ou des points-virgules, ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), ou utilisez un remplacement par exécution en conditions réelles via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponse indiquant une limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites en conditions réelles émettent des lignes de progression sur stderr afin que les longs appels aux fournisseurs restent visiblement actifs, même lorsque la capture de la console par Vitest est silencieuse.
  - `test/vitest/vitest.live.config.ts` désactive l’interception de la console par Vitest afin que les lignes de progression des fournisseurs/du Gateway soient immédiatement diffusées pendant les exécutions en conditions réelles.
  - Réglez les Heartbeat des modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Réglez les Heartbeat du Gateway/des sondes avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de la logique/des tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez apporté de nombreuses modifications)
- Modification du réseau du Gateway/du protocole WS/de l’appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service »/des échecs propres à un fournisseur/des appels d’outils : exécutez un sous-ensemble ciblé de `pnpm test:live`

## Tests en conditions réelles (avec accès au réseau)

Pour la matrice des modèles en conditions réelles, les tests de vérification des moteurs CLI, les tests de vérification ACP, le banc d’essai du serveur d’application Codex et tous les tests en conditions réelles des fournisseurs de médias (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, banc d’essai multimédia), ainsi que la gestion des identifiants pour les exécutions en conditions réelles :

- consultez [Tester les suites en conditions réelles](/fr/help/testing-live). Pour la liste de contrôle dédiée à la validation des mises à jour et des plugins, consultez
  [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Exécuteurs Docker (vérifications facultatives du « fonctionnement sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles en conditions réelles : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement le fichier en conditions réelles correspondant à leur clé de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local, votre espace de travail et, facultativement, le fichier d’environnement du profil. Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker en conditions réelles conservent leurs propres limites pratiques lorsque nécessaire :
  `test:docker:live-models` utilise par défaut l’ensemble organisé de cas pris en charge et à forte valeur de signal, tandis que
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Définissez `OPENCLAW_LIVE_MAX_MODELS`
  ou les variables d’environnement du Gateway lorsque vous souhaitez explicitement une limite inférieure ou une analyse plus étendue.
- `test:docker:all` construit une seule fois l’image Docker en conditions réelles via `test:docker:live-build`, empaquette une seule fois OpenClaw sous forme d’archive npm au moyen de `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image minimale sert uniquement d’exécuteur Node/Git pour les parcours d’installation, de mise à jour et de dépendances de plugins ; ces parcours montent l’archive préconstruite. L’image fonctionnelle installe la même archive dans `/app` pour les parcours fonctionnels de l’application compilée. Les définitions des parcours Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les limites de ressources empêchent les parcours lourds en conditions réelles, d’installation npm et multiservices de démarrer tous simultanément. Si un parcours unique est plus lourd que les limites actives, l’ordonnanceur peut tout de même le démarrer lorsque le pool est vide, puis le laisse s’exécuter seul jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont de 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (ainsi que les autres remplacements `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) uniquement lorsque l’hôte Docker dispose de davantage de marge. Par défaut, l’exécuteur effectue une vérification préalable de Docker, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les durées des parcours réussis dans `.artifacts/docker-tests/lane-timings.json` et utilise ces durées afin de lancer en premier les parcours les plus longs lors des exécutions suivantes. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des parcours sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan de CI des parcours sélectionnés, les besoins en paquets/images et les identifiants.
- `Package Acceptance` est la barrière GitHub native pour les paquets, répondant à la question « cette archive installable fonctionne-t-elle comme un produit ? ». Elle résout un paquet candidat depuis `source=npm`, `source=ref`, `source=url`, `source=trusted-url` ou `source=artifact`, le téléverse sous le nom `package-under-test`, puis exécute les parcours Docker E2E réutilisables avec cette archive exacte au lieu de réempaqueter la référence sélectionnée. Les profils sont classés par étendue : `smoke`, `package`, `product` et `full` (ainsi que `custom` pour une liste explicite de parcours). Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat des paquets/mises à jour/plugins, la matrice de survie aux mises à niveau publiées, les valeurs par défaut des versions et le triage des échecs.
- Les vérifications de compilation et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. La protection parcourt le graphe compilé statique depuis `dist/entry.js` et `dist/cli/run-main.js`, et échoue si ce graphe d’amorçage précédant la répartition importe statiquement un paquet externe (Commander, interface utilisateur d’invite, undici, journalisation et dépendances similaires alourdissant le démarrage sont tous pris en compte) avant la répartition des commandes ; elle limite également le fragment d’exécution du Gateway intégré à 70 KB et rejette les importations statiques de chemins froids connus du Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) depuis ce fragment. `scripts/release-check.ts` teste séparément l’interface CLI empaquetée avec `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` et `models list --provider openai`.
- La compatibilité héritée de Package Acceptance est limitée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette version limite, le banc d’essai tolère uniquement les lacunes de métadonnées des paquets publiés : entrées d’inventaire QA privées omises, absence de `gateway install --wrapper`, fichiers de correctifs absents de la fixture Git dérivée de l’archive, absence de `update.channel` persistant, emplacements hérités des enregistrements d’installation des plugins, absence de persistance des enregistrements d’installation de la place de marché et migration des métadonnées de configuration pendant `plugins update`. Pour les paquets postérieurs à `2026.4.25`, ces chemins entraînent des échecs stricts.
- Exécuteurs de tests de vérification en conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de plus haut niveau.
- Les parcours E2E Docker/Bash qui installent l’archive OpenClaw empaquetée au moyen de `scripts/lib/openclaw-e2e-instance.sh` limitent `npm install` à `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (valeur par défaut : `600s` ; définissez `0` pour désactiver l’enveloppe à des fins de débogage).

Les exécuteurs Docker de modèles en conditions réelles montent également uniquement les répertoires personnels d’authentification CLI nécessaires
(ou tous ceux pris en charge lorsque l’exécution n’est pas ciblée), puis les copient dans le
répertoire personnel du conteneur avant l’exécution, afin que le protocole OAuth des CLI externes puisse actualiser les jetons
sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test de vérification de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test de vérification du moteur CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test de vérification du banc d’essai du serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Tests de vérification de l’observabilité : `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` et `pnpm qa:observability:smoke` sont des parcours privés de QA sur le code source extrait. Ils ne font intentionnellement pas partie des parcours Docker de publication des paquets, car l’archive npm omet QA Lab.
- Test de vérification en conditions réelles d’Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test de vérification de l’intégration/du canal/de l’agent avec une archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement l’archive OpenClaw empaquetée dans Docker, configure OpenAI par défaut via une intégration fondée sur une référence d’environnement ainsi que Telegram, exécute doctor, puis effectue un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la recompilation sur l’hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Test de fumée du parcours utilisateur de la version : `pnpm test:docker:release-user-journey` installe globalement l’archive tar d’OpenClaw dans un environnement Docker propre, exécute l’intégration initiale, configure un fournisseur OpenAI simulé, exécute un tour d’agent, installe et désinstalle des plugins externes, configure ClickClack avec une fixture locale, vérifie la messagerie sortante et entrante, redémarre le Gateway et exécute doctor.
- Test de fumée de l’intégration initiale typée de la version : `pnpm test:docker:release-typed-onboarding` installe l’archive tar, pilote `openclaw onboard` dans un véritable TTY, configure OpenAI comme fournisseur référencé par variable d’environnement, vérifie qu’aucune clé brute n’est persistée et exécute un tour d’agent simulé.
- Test de fumée des médias et de la mémoire de la version : `pnpm test:docker:release-media-memory` installe l’archive tar, vérifie la compréhension d’image à partir d’une pièce jointe PNG, la sortie de génération d’images compatible avec OpenAI, le rappel par recherche en mémoire et la persistance du rappel après le redémarrage du Gateway.
- Test de fumée du parcours utilisateur de mise à niveau de la version : `pnpm test:docker:release-upgrade-user-journey` installe par défaut la version de référence publiée la plus récente antérieure à l’archive tar candidate, configure l’état du fournisseur, du plugin et de ClickClack dans le paquet publié, effectue la mise à niveau vers l’archive tar candidate, puis réexécute le parcours principal de l’agent, du plugin et du canal. S’il n’existe aucune version de référence publiée antérieure, il réutilise la version candidate. Remplacez la version de référence avec `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Test de fumée de la place de marché de plugins de la version : `pnpm test:docker:release-plugin-marketplace` effectue l’installation depuis une fixture locale de place de marché, met à jour le plugin installé, le désinstalle et vérifie que la CLI du plugin disparaît et que les métadonnées d’installation sont supprimées.
- Test de fumée de l’installation de Skills : `pnpm test:docker:skill-install` installe globalement l’archive tar d’OpenClaw dans Docker, désactive dans la configuration l’installation d’archives téléversées, résout à partir de la recherche le slug actuel d’une skill ClawHub active, l’installe avec `openclaw skills install` et vérifie la skill installée ainsi que les métadonnées d’origine et de verrouillage `.clawhub`.
- Test de fumée du changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement l’archive tar d’OpenClaw dans Docker, passe du paquet `stable` à git `dev`, vérifie le canal persisté et le fonctionnement du plugin après la mise à jour, puis revient au paquet `stable` et contrôle l’état de la mise à jour.
- Test de fumée de la persistance après mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive tar d’OpenClaw sur une fixture sale d’ancien utilisateur comprenant des agents, une configuration de canal, des listes d’autorisation de plugins, un état obsolète des dépendances de plugins ainsi que des fichiers d’espace de travail et de session existants. Il exécute la mise à jour du paquet ainsi que doctor en mode non interactif sans clés actives de fournisseur ni de canal, puis démarre un Gateway en boucle locale et vérifie la préservation de la configuration et de l’état ainsi que les budgets de démarrage et d’état.
- Test de fumée de la persistance après mise à niveau publiée : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, configure cette version de référence à l’aide d’une recette de commandes intégrée, valide la configuration obtenue, met à jour cette installation publiée vers l’archive tar candidate, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en boucle locale et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz` et les budgets d’état RPC. Remplacez une version de référence avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé de développer les versions de référence locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, telles que `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et de développer les fixtures correspondant à des problèmes avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, telles que `reported-issues` ; l’ensemble des problèmes signalés comprend `configured-plugin-installs` pour la réparation automatique de l’installation d’un plugin OpenClaw externe. Package Acceptance les expose sous les noms `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, résout les jetons de métaversion de référence tels que `last-stable-4` ou `all-since-2026.4.23`, et Full Release Validation développe le contrôle de paquet d’observation prolongée de la version en `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Test de fumée du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance dans la transcription du contexte d’exécution masqué ainsi que la réparation par doctor des branches dupliquées concernées de réécriture des invites.
- Test de fumée de l’installation globale avec Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un environnement personnel isolé et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de se bloquer. Réutilisez une archive tar précompilée avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la compilation sur l’hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copiez `dist/` depuis une image Docker compilée avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test de fumée de l’installateur Docker : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs racine, de mise à jour et npm direct. Le test de fumée de mise à jour utilise par défaut npm `latest` comme version de référence stable avant la mise à niveau vers l’archive tar candidate. Remplacez-la localement avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ou, sur GitHub, avec l’entrée `update_baseline_version` du workflow Install Smoke. Les contrôles de l’installateur non racine conservent un cache npm isolé afin que les entrées de cache appartenant à l’utilisateur racine ne masquent pas le comportement d’installation locale de l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache racine, de mise à jour et npm direct lors des réexécutions locales.
- La CI Install Smoke ignore la mise à jour globale npm directe en double avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe de `npm install -g` est nécessaire.
- Test de fumée de la CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compile par défaut l’image du Dockerfile racine, initialise deux agents avec un espace de travail dans un environnement personnel de conteneur isolé, exécute `agents delete --json` et vérifie la validité du JSON ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau du Gateway et cycle de vie de l’hôte : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`) préserve le test de fumée d’authentification et d’intégrité WebSocket sur le réseau local à deux conteneurs, puis utilise l’interface HTTP d’administration en boucle locale pour démontrer le cloisonnement de la préparation, l’accès avec conservation du contrôle, la récupération après reprise et un arrêt/démarrage préparé dans le même conteneur. Le contrôle du redémarrage doit se terminer avant l’expiration du bail d’origine, vérifie que l’état de suspension est local au processus tandis que la configuration persistée du Gateway et l’identité du conteneur sont conservées, et produit un JSON lisible par machine contenant la durée des phases.
- Test de fumée des instantanés CDP du navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) compile l’image E2E source ainsi qu’une couche Chromium, démarre Chromium avec le CDP brut, exécute `browser doctor --deep` et vérifie que les instantanés de rôles CDP couvrent les URL des liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées des cadres.
- Régression du raisonnement minimal de web_search d’OpenAI Responses : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via le Gateway, vérifie que `web_search` fait passer `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma du fournisseur et contrôle que le détail brut apparaît dans les journaux du Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test de fumée de trame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du paquet OpenClaw (véritable serveur MCP stdio + test de fumée d’autorisation/refus du profil OpenClaw intégré) : `pnpm test:docker:agent-bundle-mcp-tools` (script : `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP de Cron/sous-agent (véritable Gateway + arrêt du processus enfant MCP stdio après des exécutions Cron isolées et de sous-agent ponctuelles) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test de fumée d’installation/mise à jour pour un chemin local, `file:`, un registre npm avec dépendances remontées, des métadonnées de paquet npm mal formées, des références git mobiles, un ClawHub exhaustif, des mises à jour de place de marché et l’activation/l’inspection du paquet Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub ou remplacez la paire paquet/environnement d’exécution exhaustive par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Test de fumée de mise à jour inchangée d’un plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test de fumée de la matrice du cycle de vie des plugins : `pnpm test:docker:plugin-lifecycle-matrix` installe l’archive tar empaquetée d’OpenClaw dans un conteneur minimal, installe un plugin npm, active et désactive celui-ci, le met à niveau et le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Test de fumée des métadonnées de rechargement de la configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre les tests de fumée d’installation/mise à jour pour un chemin local, `file:`, un registre npm avec dépendances remontées, des références git mobiles, des fixtures ClawHub, des mises à jour de place de marché et l’activation/l’inspection du paquet Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée des plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation d’un plugin npm avec suivi des ressources, son activation, sa désactivation, sa mise à niveau, sa rétrogradation et sa désinstallation lorsque le code est manquant.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image distante partagée, les scripts la téléchargent si elle n’est pas déjà disponible localement. Les tests Docker du code QR et du programme d’installation conservent leurs propres Dockerfiles, car ils valident le comportement des paquets et de l’installation plutôt que l’environnement d’exécution partagé de l’application compilée.

Les exécuteurs Docker de modèles en direct montent également le dépôt de travail actuel en lecture seule
et le copient dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela permet de conserver une
image d’exécution légère tout en exécutant Vitest sur vos fichiers source et votre configuration
locaux exacts. L’étape de copie ignore les caches volumineux propres à l’environnement local et les
sorties de compilation des applications, telles que `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que
les répertoires de sortie `.build` ou Gradle propres aux applications, afin que les exécutions Docker en direct ne
passent pas plusieurs minutes à copier des artefacts propres à la machine. Elles définissent également
`OPENCLAW_SKIP_CHANNELS=1` afin que les sondes en direct du Gateway ne démarrent pas de véritables
processus de canaux Telegram/Discord/etc. à l’intérieur du conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live` ; transmettez donc également
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture en direct du Gateway
de cette voie Docker.

`test:docker:openwebui` est un test de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles avec OpenAI activés,
démarre un conteneur Open WebUI épinglé configuré pour utiliser ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
véritable requête de chat via le proxy `/api/chat/completions` d’Open WebUI. Définissez
`OPENWEBUI_SMOKE_MODE=models` pour les vérifications CI du chemin de publication qui doivent s’arrêter
après la connexion à Open WebUI et la découverte des modèles, sans attendre la
réponse d’un modèle en direct. La première exécution peut être sensiblement plus lente, car Docker peut devoir
télécharger l’image Open WebUI et Open WebUI peut devoir terminer sa propre
configuration de démarrage à froid. Cette voie nécessite une clé de modèle en direct utilisable, fournie par
l’environnement du processus, des profils d’authentification préparés ou un
`OPENCLAW_PROFILE_FILE` explicite. Les exécutions réussies affichent une petite charge utile JSON telle que
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
véritable compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
préconfiguré, puis un second conteneur qui lance `openclaw mcp serve`, et
vérifie ensuite la découverte des conversations routées, la lecture des transcriptions, les
métadonnées des pièces jointes, le comportement de la file d’événements en direct, le routage des envois sortants
et les notifications de canal et d’autorisation de type Claude via le véritable pont MCP stdio. La
vérification des notifications inspecte directement les trames MCP stdio brutes afin que le test
valide ce que le pont émet réellement, et pas seulement ce qu’un SDK client particulier
expose par hasard.

`test:docker:agent-bundle-mcp-tools` est déterministe et ne nécessite pas de
clé de modèle en direct. Il construit l’image Docker du dépôt, démarre un véritable serveur de
sonde MCP stdio dans le conteneur, matérialise ce serveur via le
runtime MCP du bundle OpenClaw intégré, exécute l’outil, puis vérifie que
`coding` et `messaging` conservent les outils `bundle-mcp`, tandis que `minimal` et
`tools.deny: ["bundle-mcp"]` les filtrent.

`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de
modèle en direct. Il démarre un Gateway préconfiguré avec un véritable serveur de sonde MCP stdio,
exécute un tour Cron isolé et un tour enfant ponctuel `sessions_spawn`, puis
vérifie que le processus enfant MCP se termine après chaque exécution.

Test manuel des fils ACP en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression et de débogage. Il pourra être à nouveau nécessaire pour valider le routage des fils ACP ; ne le supprimez donc pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (valeur par défaut : `~/.openclaw`) monté dans `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (valeur par défaut : `~/.openclaw/workspace`) monté dans `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` monté et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires temporaires de configuration et d’espace de travail, sans montage externe d’authentification CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (valeur par défaut : `~/.cache/openclaw/docker-cli-tools`, sauf si l’exécution utilise déjà un répertoire lié géré ou de CI) monté dans `/home/node/.npm-global` pour mettre en cache les installations CLI dans Docker
- Les répertoires et fichiers d’authentification des CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut (utilisés lorsque l’exécution n’est pas limitée à des fournisseurs spécifiques) : `.factory`, `.gemini`, `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à certains fournisseurs ne montent que les répertoires et fichiers nécessaires, déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement ce comportement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou une liste séparée par des virgules telle que `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour limiter l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors des réexécutions ne nécessitant pas de nouvelle construction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer l’invite de vérification du nonce utilisée par le test Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer l’étiquette épinglée de l’image Open WebUI

## Vérification de cohérence de la documentation

Exécutez les vérifications de la documentation après avoir modifié celle-ci : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez également vérifier les titres dans les pages : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible avec la CI)

Il s’agit de régressions du « pipeline réel » sans véritables fournisseurs :

- Appel d’outils du Gateway (OpenAI simulé, véritable Gateway et boucle d’agent) : `src/gateway/gateway.test.ts` (cas : « exécute de bout en bout un appel d’outil OpenAI simulé via la boucle d’agent du Gateway »)
- Assistant du Gateway (`wizard.start`/`wizard.next` via WS, écrit la configuration et impose l’authentification) : `src/gateway/gateway.test.ts` (cas : « exécute l’assistant via WebSocket et écrit la configuration du jeton d’authentification »)

## Évaluations de fiabilité des agents (Skills)

Nous disposons déjà de quelques tests compatibles avec la CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le véritable Gateway et la boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux de bout en bout de l’assistant qui valident le câblage des sessions et les effets sur la configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills sont répertoriées dans l’invite, l’agent choisit-il la bonne Skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et respecte-t-il les étapes et arguments requis ?
- **Contrats de workflow :** des scénarios en plusieurs tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils et leur ordre, la lecture des fichiers de Skills et le câblage des sessions.
- Une petite suite de scénarios centrés sur les Skills (utiliser ou éviter, contrôle d’accès, injection d’invite).
- Des évaluations en direct facultatives (à activer explicitement et conditionnées par des variables d’environnement), uniquement après la mise en place de la suite compatible avec la CI.

## Tests de contrat (forme des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et chaque canal enregistrés respectent
leur contrat d’interface. Ils parcourent tous les Plugins découverts et exécutent une
suite d’assertions de forme et de comportement. La voie de tests unitaires `pnpm test` par défaut
ignore intentionnellement ces fichiers partagés de jonction et de test ; exécutez explicitement les
commandes de contrat lorsque vous modifiez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts`. Catégories
principales actuelles :

- **channel-catalog** - métadonnées des entrées de catalogue de canaux intégrés ou du registre
- **plugin** (adossé au registre, partitionné) - forme de base de l’enregistrement des Plugins
- **surfaces-only** (adossé au registre, partitionné) - vérifications de forme par surface pour `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` et `gateway`
- **session-binding** (adossé au registre) - comportement de liaison des sessions
- **outbound-payload** - structure et normalisation de la charge utile des messages
- **group-policy** (solution de repli) - application de la politique de groupe par défaut pour chaque canal
- **threading** (adossé au registre, partitionné) - gestion des identifiants de fils
- **directory** (adossé au registre, partitionné) - API d’annuaire et de liste des membres
- **registry** et **plugins-core.\*** - registre des Plugins de canal, chargeur et mécanismes internes d’autorisation d’écriture de la configuration

Les utilitaires du banc de test de capture de la distribution entrante et de charge utile sortante utilisés par ces
suites sont exposés en interne via `src/plugin-sdk/channel-contract-testing.ts`
(exclu de npm, ce n’est pas un sous-chemin public du SDK) ; il n’existe aucun fichier
`inbound.contract.test.ts` autonome dans ce répertoire.

### Contrats des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`. Les catégories actuelles
comprennent :

- **shape** - forme du manifeste, de l’API et des exportations de runtime du Plugin
- **plugin-registration** (+ parallèle) - cas d’enregistrement des manifestes
- **package-manifest** - exigences du manifeste du paquet
- **loader** - comportement d’initialisation et de démantèlement du chargeur de Plugins
- **registry** - contenu et recherche dans le registre des contrats de Plugins
- **providers** - comportement partagé des fournisseurs intégrés, ainsi que des fournisseurs de recherche Web
- **auth-choice** - métadonnées des choix d’authentification et comportement de configuration
- **provider-catalog-deprecation** - métadonnées obsolètes du catalogue des fournisseurs
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contrats de l’assistant de configuration des fournisseurs
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contrats des fournisseurs propres à chaque capacité
- **session-actions**, **session-attachments**, **session-entry-projection** - contrats d’état de session appartenant aux Plugins
- **scheduled-turns** - métadonnées des tours planifiés par les Plugins et limites des horodatages
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - contrats du cycle de vie de l’hôte et du runtime des Plugins, ainsi que des limites d’importation
- **extension-runtime-dependencies** - emplacement des dépendances de runtime des extensions

### Quand les exécuter

- Après avoir modifié les exportations ou sous-chemins du SDK de Plugins
- Après avoir ajouté ou modifié un Plugin de canal ou de fournisseur
- Après avoir refactorisé l’enregistrement ou la découverte des Plugins

Les tests de contrat s’exécutent dans la CI et ne nécessitent aucune véritable clé d’API.

## Ajout de régressions (recommandations)

Lorsque vous corrigez un problème de fournisseur ou de modèle découvert en direct :

- Ajoutez si possible une régression compatible avec la CI (fournisseur simulé ou substitué, ou capture de la transformation exacte de la forme de la requête)
- S’il s’agit intrinsèquement d’un cas nécessitant une exécution en direct (limites de débit, politiques d’authentification), conservez un test en direct ciblé et facultatif via des variables d’environnement
- Préférez cibler la plus petite couche permettant de détecter le bogue :
  - bogue de conversion ou de relecture des requêtes du fournisseur -> test direct des modèles
  - bogue dans le pipeline de session, d’historique ou d’outils du Gateway -> test en direct du Gateway ou test simulé du Gateway compatible avec la CI
- Garde-fou de parcours SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` déduit une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants d’exécution contenant des segments de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement pour les identifiants de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Pages connexes

- [Tests en direct](/fr/help/testing-live)
- [Test des mises à jour et des Plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
