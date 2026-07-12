---
read_when:
    - Exécution des tests en local ou dans la CI
    - Ajout de tests de régression pour les bogues de modèles/fournisseurs
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/en conditions réelles, exécuteurs Docker et couverture de chaque test'
title: Tests
x-i18n:
    generated_at: "2026-07-12T02:55:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unitaire/intégration, e2e, live), ainsi que d’exécuteurs Docker. Cette page explique la couverture de chaque suite, la commande à exécuter selon le flux de travail, la manière dont les tests live détectent les identifiants et la façon d’ajouter des tests de régression pour les bogues réels liés aux fournisseurs et aux modèles.

<Note>
**La pile d’assurance qualité (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble de l’assurance qualité](/fr/concepts/qa-e2e-automation) - architecture, interface de commandes et création de scénarios.
- [Matrice d’assurance qualité](/fr/concepts/qa-matrix) - référence pour `pnpm openclaw qa matrix`.
- [Tableau de maturité](/fr/maturity/scorecard) - manière dont les preuves d’assurance qualité des versions étayent les décisions relatives à la stabilité et au LTS.
- [Canal d’assurance qualité](/fr/channels/qa-channel) - Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre les suites de tests ordinaires ainsi que les exécuteurs Docker/Parallels. La section [Exécuteurs propres à l’assurance qualité](#qa-specific-runners) ci-dessous répertorie les commandes `qa` concrètes et renvoie aux références précédentes.
</Note>

## Démarrage rapide

La plupart du temps :

- Validation complète (attendue avant un envoi) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine disposant de suffisamment de ressources : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct d’un fichier prend également en charge les chemins des Plugins et des canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Lors de l’itération sur un échec unique, privilégiez d’abord les exécutions ciblées.
- Site d’assurance qualité adossé à Docker : `pnpm qa:lab:up`
- Voie d’assurance qualité adossée à une machine virtuelle Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous modifiez des tests ou souhaitez renforcer le niveau de confiance :

- Rapport informatif de couverture V8 : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

## Répertoires temporaires des tests

Utilisez les utilitaires partagés de `test/helpers/temp-dir.ts` pour les répertoires temporaires appartenant aux tests, afin que leur propriété soit explicite et que leur nettoyage reste intégré au cycle de vie des tests :

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` n’expose intentionnellement aucune méthode de nettoyage manuel : Vitest prend en charge le nettoyage après chaque test. Les anciens utilitaires de plus bas niveau (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) existent toujours pour les tests qui n’ont pas encore été migrés ; évitez de les utiliser dans du nouveau code ainsi que d’ajouter de nouveaux appels directs à `fs.mkdtemp*`, sauf si un test vérifie explicitement le comportement brut des répertoires temporaires. Lorsqu’un répertoire temporaire brut est réellement nécessaire, ajoutez un commentaire d’autorisation vérifiable avec une justification :

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` signale les nouvelles créations directes de répertoires temporaires et les nouvelles utilisations manuelles de l’utilitaire partagé dans les lignes ajoutées au diff, sans bloquer les styles de nettoyage existants. Il utilise la même classification des chemins de tests que `scripts/changed-lanes.mjs` et ignore l’implémentation de l’utilitaire partagé elle-même. `check:changed` exécute ce rapport pour les chemins de tests modifiés sous la forme d’un signal CI limité à un avertissement (annotations d’avertissement GitHub, sans échec).

## Flux de travail live et Docker/Parallels

Lors du débogage de fournisseurs ou de modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles et sondes d’outils/d’images du Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performances d’exécution : lancez `OpenClaw Performance` avec
  `live_openai_candidate=true` pour un tour d’agent réel avec `openai/gpt-5.6-luna` ou
  `deep_profile=true` pour les artefacts de processeur, de tas et de trace de Kova. Les exécutions quotidiennes planifiées
  publient les rapports des voies du fournisseur simulé, du profilage approfondi et de GPT-5.6 Luna dans
  `openclaw/clawgrit-reports` depuis une tâche de publication distincte qui consomme les artefacts ;
  une authentification de publication manquante ou non valide fait échouer les exécutions planifiées et celles avec
  `profile=release`. Les lancements manuels hors version conservent les artefacts GitHub
  et considèrent la publication des rapports comme facultative. Le rapport du fournisseur simulé
  inclut également les mesures du démarrage du Gateway au niveau du code source, de la mémoire, de la charge des Plugins, de la
  boucle répétée de salutations du faux modèle et du démarrage de la CLI.
- Balayage des modèles live dans Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute un tour textuel ainsi qu’une petite sonde comparable à une lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent également un petit tour avec image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lors de l’isolation des échecs de fournisseurs.
  - Couverture CI : les tâches quotidiennes `OpenClaw Scheduled Live And E2E Checks` et les tâches manuelles
    `OpenClaw Release Checks` appellent toutes deux le flux de travail live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut les tâches de matrice de modèles live Docker
    réparties par fournisseur.
  - Pour les réexécutions CI ciblées, lancez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets de fournisseur à forte valeur de signal dans `scripts/ci-hydrate-live-auth.sh`,
    ainsi que dans `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/de version.
- Test de bon fonctionnement natif de la conversation liée à Codex : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker via le chemin du serveur d’application Codex, lie un
    message privé Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison native du Plugin plutôt que par ACP.
- Test de bon fonctionnement du banc d’essai du serveur d’application Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent du Gateway au moyen du banc d’essai du serveur d’application Codex
    appartenant au Plugin, vérifie `/codex status` et `/codex models` et, par défaut,
    exerce les sondes d’image, de MCP Cron, de sous-agent et de Guardian. Désactivez la
    sonde de sous-agent avec `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lors de
    l’isolation d’autres échecs. Pour une vérification ciblée du sous-agent, désactivez les
    autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cette commande se termine après la sonde de sous-agent, sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Test de bon fonctionnement de l’installation à la demande de Codex : `pnpm test:docker:codex-on-demand`
  - Installe l’archive tar empaquetée d’OpenClaw dans Docker, exécute la configuration initiale avec une clé d’API OpenAI
    et vérifie que le Plugin Codex ainsi que la dépendance `@openai/codex`
    ont été téléchargés à la demande dans la racine du projet npm géré.
- Test de bon fonctionnement live de la dépendance d’un outil de Plugin : `pnpm test:docker:live-plugin-tool`
  - Empaquette un Plugin de test avec une véritable dépendance `slugify`, l’installe
    au moyen de `npm-pack:`, vérifie la dépendance sous la racine du projet npm
    géré, puis demande à un modèle OpenAI live d’appeler l’outil du Plugin et
    de renvoyer le slug masqué.
- Test de bon fonctionnement de la commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification facultative redondante de l’interface de commande de secours du canal de messages.
    Exerce `/crestodian status`, met en file d’attente un changement persistant de
    modèle, répond `/crestodian yes` et vérifie le chemin d’écriture de
    l’audit et de la configuration.
- Test de bon fonctionnement Docker de la première exécution de Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre avec un répertoire d’état OpenClaw vide et démontre d’abord que la CLI
    `openclaw crestodian` empaquetée échoue de manière sûre sans inférence. Il teste
    et active ensuite un faux Claude au moyen du module d’activation empaqueté.
    Ce n’est qu’après cela qu’une requête approximative adressée à la CLI empaquetée atteint le planificateur et
    aboutit à une configuration typée, suivie d’opérations ponctuelles sur le modèle, l’agent, le Plugin Discord
    et SecretRef. Le test valide les entrées de configuration et d’audit. Il s’agit
    d’éléments de preuve complémentaires pour la validation et les opérations, et non d’une preuve de configuration initiale interactive ni
    d’une preuve d’agent, d’outil ou d’approbation Crestodian. La même voie est disponible dans le laboratoire d’assurance qualité avec
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test de bon fonctionnement des coûts Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis lancez une commande isolée
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  avec `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke une valeur `usage.cost` normalisée.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live au moyen des variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à l’assurance qualité

Ces commandes complètent les suites de tests principales lorsque vous avez besoin du réalisme du laboratoire d’assurance qualité.

La CI exécute le laboratoire d’assurance qualité dans des flux de travail dédiés. La parité agentique est intégrée à
`QA-Lab - All Lanes` et à la validation de version, et non à un flux de travail de PR autonome.
Pour une validation étendue, utilisez `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe d’assurance qualité des vérifications de version. Les vérifications de version
stables/par défaut conservent les tests prolongés exhaustifs live/Docker derrière `run_release_soak=true` ; le
profil `full` les active obligatoirement. `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et
lors d’un lancement manuel, avec la voie de parité simulée, la voie Matrix live,
la voie Telegram live gérée par Convex et la voie Discord live gérée par Convex comme
tâches parallèles. Les tâches d’assurance qualité planifiées et les vérifications de version transmettent explicitement
`--profile fast` à Matrix, tandis que la CLI Matrix et l’entrée du flux de travail manuel conservent
`all` comme valeur par défaut ; un lancement manuel peut répartir `all` en tâches `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release Checks` exécute
la parité ainsi que les voies rapides Matrix et Telegram avant l’approbation de la version, en utilisant
`mock-openai/gpt-5.6-luna` pour les vérifications de transport de la version afin qu’elles restent déterministes
et évitent le démarrage normal du Plugin du fournisseur. Ces Gateways de transport live
désactivent la recherche en mémoire ; le comportement de la mémoire reste couvert par les suites de parité d’assurance qualité.

Les segments de médias live de la validation complète de version utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui inclut déjà
`ffmpeg` et `ffprobe`. Les segments de modèles et d’infrastructures live Docker utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>`, construite une seule fois par commit
sélectionné, puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de la reconstruire
dans chaque segment.

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte les scénarios d’assurance qualité fournis par le dépôt.
  - Écrit les artefacts de premier niveau `qa-evidence.json`, `qa-suite-summary.json` et
    `qa-suite-report.md` pour l’ensemble de scénarios sélectionné, y compris
    les sélections de scénarios de flux mixtes, Vitest et Playwright.
  - Lorsqu’elle est lancée par `pnpm openclaw qa run --qa-profile <profile>`, intègre
    la fiche d’évaluation du profil taxonomique sélectionné dans le même fichier `qa-evidence.json`.
    `smoke-ci` écrit des preuves allégées (`evidenceMode: "slim"`, sans
    `execution` par entrée). `release` couvre la sélection organisée pour la préparation à la publication ; `all`
    sélectionne chaque catégorie de maturité active et cible les déclenchements explicites du workflow QA Profile
    Evidence lorsqu’un artefact de fiche d’évaluation complète est nécessaire.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (limitée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie séquentielle.
  - Se termine avec un code différent de zéro si un scénario échoue. Utilisez `--allow-failures` pour
    produire les artefacts sans code de sortie d’échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local reposant sur AIMock pour une couverture expérimentale
    des fixtures et des simulations de protocole, sans remplacer la voie
    `mock-openai` tenant compte des scénarios.
- `pnpm openclaw qa coverage --match <query>`
  - Recherche dans les identifiants et titres des scénarios, les surfaces, les identifiants de couverture, les références de documentation, les références de
    code, les plugins et les exigences relatives aux fournisseurs, puis affiche les cibles de suite
    correspondantes.
  - Utilisez cette commande avant une exécution de QA Lab lorsque vous connaissez le comportement ou le chemin de fichier
    modifié, mais pas le scénario minimal. Elle est uniquement indicative : choisissez tout de même les preuves simulées,
    en direct, Multipass, Matrix ou de transport en fonction du comportement
    modifié.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute la batterie de tests en direct du plugin OpenAI Kitchen Sink via QA Lab.
    Installe le paquet externe Kitchen Sink, vérifie l’inventaire des surfaces du SDK du plugin,
    sonde `/healthz` et `/readyz`, enregistre les preuves d’utilisation
    CPU/RSS du Gateway, exécute une interaction OpenAI en direct et vérifie les diagnostics
    contradictoires. Nécessite une authentification OpenAI en direct telle que `OPENAI_API_KEY`. Dans
    les sessions Testbox hydratées, elle charge automatiquement le profil d’authentification en direct de Testbox
    lorsque l’utilitaire `openclaw-testbox-env` est présent.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway ainsi qu’un petit ensemble de scénarios QA Lab simulés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un récapitulatif combiné des observations du processeur
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Ne signale par défaut que les observations prolongées de forte utilisation du processeur (`--cpu-core-warn`,
    valeur par défaut `0.9` ; `--hot-wall-warn-ms`, valeur par défaut `30000`), afin que les brèves pointes au démarrage
    soient enregistrées comme métriques sans ressembler à la régression de saturation du Gateway
    qui dure plusieurs minutes.
  - S’exécute avec les artefacts `dist` compilés ; lancez d’abord une compilation lorsque l’arborescence de travail
    ne contient pas déjà de sortie d’exécution récente.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite d’assurance qualité dans une machine virtuelle Linux Multipass jetable, en conservant
    les mêmes indicateurs de sélection de scénarios, de fournisseur et de modèle que `qa suite`.
  - Les exécutions en direct transmettent les données d’authentification QA utilisables par le système invité :
    les clés de fournisseur définies par des variables d’environnement, le chemin de configuration du fournisseur QA en direct et
    `CODEX_HOME` lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que le système invité puisse y écrire
    par l’intermédiaire de l’espace de travail monté.
  - Écrit le rapport et le récapitulatif QA habituels, ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA reposant sur Docker pour les tâches d’assurance qualité de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crée une archive npm à partir de l’arborescence de travail actuelle, l’installe globalement dans
    Docker, exécute l’intégration non interactive avec une clé d’API OpenAI, configure
    Telegram par défaut, vérifie que l’environnement d’exécution du plugin empaqueté se charge sans
    réparation des dépendances au démarrage, exécute le diagnostic, puis une interaction locale de l’agent
    avec un point de terminaison OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation du paquet
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un test de fumée Docker déterministe de l’application compilée pour les transcriptions du contexte d’exécution
    intégré. Vérifie que le contexte d’exécution OpenClaw masqué persiste sous forme de
    message personnalisé non affiché au lieu de se retrouver dans l’interaction utilisateur visible,
    puis initialise un fichier JSONL de session défectueux concerné et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un paquet OpenClaw candidat dans Docker, exécute l’intégration du paquet
    installé, configure Telegram par l’intermédiaire de la CLI installée, puis réutilise
    la voie QA Telegram en direct avec ce paquet installé comme Gateway du système testé.
  - Le wrapper ne monte depuis l’arborescence de travail que la source du banc de test `qa-lab` ;
    le paquet installé possède `dist`, `openclaw/plugin-sdk` et l’environnement d’exécution
    du plugin intégré, de sorte que la voie ne mélange pas les plugins de l’arborescence de travail actuelle
    avec le paquet testé.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive locale résolue au lieu
    d’effectuer l’installation depuis le registre.
  - Émet par défaut des mesures répétées du temps aller-retour dans `qa-evidence.json` avec
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Remplacez
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster l’exécution.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepte une liste d’identifiants de contrôles QA
    Telegram séparés par des virgules à échantillonner ; lorsqu’elle n’est pas définie, le contrôle par défaut
    compatible avec le temps aller-retour est `telegram-mentioned-message-reply`.
  - Utilise les mêmes identifiants Telegram définis dans l’environnement ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation de l’intégration continue ou de la publication, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ainsi que
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans
    l’intégration continue, le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide les variables d’environnement des identifiants Telegram ou Convex sur l’hôte
    avant les opérations de compilation et d’installation Docker. Définissez
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` uniquement lors du
    débogage délibéré de la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace
    la valeur partagée `OPENCLAW_QA_CREDENTIAL_ROLE` pour cette voie uniquement. Lorsque les identifiants
    Convex sont sélectionnés et qu’aucun rôle n’est défini, le wrapper utilise `ci` dans l’intégration continue
    et `maintainer` hors de celle-ci.
  - GitHub Actions expose cette voie sous la forme du workflow manuel de maintenance
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors d’une fusion. Le workflow utilise
    l’environnement `qa-live-shared` et les baux d’identifiants Convex de l’intégration continue.
- GitHub Actions expose également `Package Acceptance` pour fournir une preuve produit exécutée séparément
  sur un paquet candidat. Il accepte une référence Git, une spécification npm publiée,
  une URL HTTPS d’archive avec son SHA-256, une politique d’URL de confiance ou un artefact d’archive
  provenant d’une autre exécution (`source=ref|npm|url|trusted-url|artifact`), téléverse
  le fichier normalisé `openclaw-current.tgz` sous le nom `package-under-test`, puis exécute
  l’ordonnanceur E2E Docker existant avec les profils de voie `smoke`, `package`, `product`, `full`
  ou `custom`. Définissez `telegram_mode=mock-openai` ou
  `live-frontier` pour exécuter le workflow QA Telegram avec le même artefact
  `package-under-test`.
  - Dernière preuve produit de la version bêta :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La preuve par URL exacte d’archive nécessite une empreinte et utilise la politique de sécurité des URL publiques :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Les miroirs d’archives d’entreprise ou privés utilisent une politique explicite de source de confiance :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lit `.github/package-trusted-sources.json` depuis la référence de workflow de confiance et n’accepte ni identifiants dans l’URL ni contournement du réseau privé fourni par une entrée du workflow. Si la politique nommée déclare une authentification par jeton porteur, configurez le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La preuve par artefact télécharge un artefact d’archive depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaquette et installe la compilation OpenClaw actuelle dans Docker, démarre le
    Gateway avec OpenAI configuré, puis active les canaux et plugins intégrés au moyen de
    modifications de configuration.
  - Vérifie que la découverte de configuration laisse absents les plugins téléchargeables
    non configurés, que la première réparation configurée par le diagnostic installe explicitement chaque
    plugin téléchargeable manquant et qu’un second redémarrage n’exécute aucune
    réparation masquée des dépendances.
  - Installe également une ancienne version de référence npm connue, active Telegram avant
    d’exécuter `openclaw update --tag <candidate>`, puis vérifie que le
    diagnostic post-mise à jour du candidat nettoie les résidus de dépendances héritées des plugins
    sans réparation post-installation effectuée par le banc de test.
- `pnpm test:parallels:npm-update`
  - Exécute le test de fumée natif de mise à jour d’une installation empaquetée sur les systèmes invités Parallels.
    Chaque plateforme sélectionnée installe d’abord le paquet de référence demandé,
    puis exécute la commande `openclaw update` installée dans le même système invité et
    vérifie la version installée, l’état de la mise à jour, la disponibilité du Gateway et
    une interaction locale de l’agent.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux`
    lors des itérations sur un seul système invité. Utilisez `--json` pour obtenir le chemin de l’artefact
    récapitulatif et l’état de chaque voie.
  - La voie OpenAI utilise par défaut `openai/gpt-5.6-luna` pour la preuve d’interaction en direct de l’agent.
    Transmettez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` pour valider un autre modèle OpenAI.
  - Encadrez les longues exécutions locales par un délai d’expiration sur l’hôte afin que les blocages du transport Parallels
    ne puissent pas consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux imbriqués des voies sous
    `/tmp/openclaw-parallels-npm-update.*`. Inspectez `windows-update.log`,
    `macos-update.log` ou `linux-update.log` avant de conclure que le
    wrapper externe est bloqué.
  - Sous Windows, la mise à jour peut prendre entre 10 et 15 minutes pour le diagnostic post-mise à jour et
    les opérations de mise à jour du paquet sur un système invité froid ; le fonctionnement reste normal tant que le
    journal de débogage npm imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies individuelles de test de fumée Parallels
    pour macOS, Windows ou Linux. Elles partagent l’état des machines virtuelles et peuvent
    entrer en conflit lors de la restauration d’instantanés, de la mise à disposition des paquets ou au niveau de l’état du Gateway du système invité.
  - La preuve post-mise à jour exécute la surface normale des plugins intégrés, car
    les façades de capacités telles que la synthèse vocale, la génération d’images et la compréhension
    des médias sont chargées au moyen des API d’exécution intégrées, même lorsque l’interaction de l’agent
    ne vérifie elle-même qu’une simple réponse textuelle.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur local du fournisseur AIMock pour des tests
    de fumée directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute le parcours d’assurance qualité en conditions réelles de Matrix
    sur un serveur domestique Tuwunel temporaire reposant sur Docker.
    Disponible uniquement depuis les sources : les installations empaquetées
    n’incluent pas `qa-lab`.
  - CLI complète, catalogue des profils/scénarios, variables d’environnement
    et organisation des artefacts :
    [Assurance qualité Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute le parcours d’assurance qualité en conditions réelles de Telegram
    dans un véritable groupe privé à l’aide des jetons du bot pilote et du bot
    du système testé fournis par l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être
    l’identifiant numérique de la discussion Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants
    partagés regroupés. Utilisez le mode environnement par défaut, ou
    définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour utiliser les baux
    du pool.
  - Les valeurs par défaut couvrent la version canari, le filtrage des
    mentions, l’adressage des commandes, `/status`, les réponses mentionnées
    de bot à bot et les réponses aux commandes natives du cœur.
    Les valeurs par défaut de `mock-openai` couvrent également les régressions
    déterministes liées aux chaînes de réponses et à la diffusion du message
    final de Telegram. Utilisez `--list-scenarios` pour les sondes facultatives
    telles que `session_status`.
  - Se termine avec un code différent de zéro si un scénario échoue.
    Utilisez `--allow-failures` pour produire les artefacts sans code de sortie
    d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot du système
    testé devant disposer d’un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez le mode de communication
    entre bots dans `@BotFather` pour les deux bots et assurez-vous que le bot
    pilote peut observer le trafic des bots dans le groupe.
  - Écrit un rapport d’assurance qualité Telegram, un résumé et
    `qa-evidence.json` sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse
    incluent le temps aller-retour entre la requête d’envoi du pilote et la
    réponse observée du système testé.

`Mantis Telegram Live` est l’enveloppe de collecte de preuves pour les PR
autour de ce parcours. Elle exécute la référence candidate avec des
identifiants Telegram loués via Convex, affiche le paquet expurgé de rapport
et de preuves d’assurance qualité dans un navigateur de bureau Crabbox,
enregistre une preuve MP4, génère un GIF dont les périodes sans mouvement
sont supprimées, téléverse le paquet d’artefacts et publie des preuves
intégrées dans la PR via l’application GitHub Mantis lorsque `pr_number` est
défini. Les mainteneurs peuvent la lancer depuis l’interface Actions via
`Mantis Scenario` (`scenario_id: telegram-live`) ou directement depuis un
commentaire de pull request :

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` est l’enveloppe agentique native Telegram
Desktop avant/après destinée aux preuves visuelles des PR. Lancez-la depuis
l’interface Actions avec des `instructions` libres, via `Mantis Scenario`
(`scenario_id: telegram-desktop-proof`) ou depuis un commentaire de PR :

```text
@openclaw-mantis telegram desktop proof
```

L’agent Mantis lit la PR, détermine quel comportement visible dans Telegram
prouve la modification, exécute le parcours de preuve Telegram Desktop avec
un véritable utilisateur dans Crabbox sur les références de base et
candidate, itère jusqu’à obtenir des GIF natifs exploitables, écrit un
manifeste `motionPreview` apparié et publie le même tableau de GIF à deux
colonnes via l’application GitHub Mantis lorsque `pr_number` est défini.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Loue ou réutilise un bureau Linux Crabbox, installe l’application native
    Telegram Desktop, configure OpenClaw avec un jeton loué pour le bot
    Telegram du système testé, démarre le Gateway et enregistre des preuves
    sous forme de captures d’écran et de fichiers MP4 depuis le bureau VNC
    visible.
  - Utilise par défaut `--credential-source convex` afin que les workflows
    n’aient besoin que du secret du courtier Convex. Utilisez
    `--credential-source env` avec les mêmes variables
    `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop nécessite toujours la connexion et le profil d’un
    utilisateur. Le jeton du bot configure uniquement OpenClaw. Utilisez
    `--telegram-profile-archive-env <name>` pour une archive de profil `.tgz`
    en base64, ou utilisez `--keep-lease` et connectez-vous manuellement une
    fois via VNC.
  - Écrit `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` et `telegram-desktop-builder.mp4` dans le
    répertoire de sortie.

Les parcours de transport en conditions réelles partagent un contrat
standard unique afin d’éviter toute divergence des nouveaux transports ; la
matrice de couverture propre à chaque parcours se trouve dans
[Vue d’ensemble de l’assurance qualité — couverture des transports en conditions réelles](/fr/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` est la vaste suite synthétique et ne fait pas partie de cette
matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour l’assurance qualité
des transports en conditions réelles, le laboratoire d’assurance qualité
obtient un bail exclusif auprès d’un pool reposant sur Convex, envoie des
Heartbeat pour ce bail pendant l’exécution du parcours et libère le bail à
l’arrêt. Le nom de cette section est antérieur à la prise en charge de
Discord, Slack et WhatsApp ; le contrat de location est commun à tous les
types.

Structure de référence du projet Convex :
`qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identification :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement :
    `OPENCLAW_QA_CREDENTIAL_ROLE` (`ci` par défaut dans la CI, `maintainer`
    sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valeur par défaut : `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valeur par défaut : `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valeur par défaut : `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valeur par défaut : `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valeur par défaut :
  `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de traçage facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en
  local loopback pour le développement exclusivement local.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement
normal.

Les commandes d’administration des mainteneurs (ajout, suppression et liste
du pool) nécessitent spécifiquement
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions en conditions réelles afin de vérifier
l’URL du site Convex, les secrets du courtier, le préfixe des points de
terminaison, le délai d’expiration HTTP et l’accessibilité des fonctions
d’administration et de liste, sans afficher les valeurs secrètes. Utilisez
`--json` pour obtenir une sortie lisible par machine dans les scripts et les
utilitaires de CI.

Contrat de point de terminaison par défaut
(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Les requêtes s’authentifient avec un en-tête
`Authorization: Bearer <role secret>` ; les corps ci-dessous omettent cet
en-tête :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Réussite : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Pool épuisé/erreur réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Réussite : `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Réussite : `{ status: "ok" }` (ou réponse `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Réussite : `{ status: "ok" }` (ou réponse `2xx` vide)
- `POST /admin/add` (secret de mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Réussite : `{ status: "ok", credential }`
- `POST /admin/remove` (secret de mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Réussite : `{ status: "ok", changed, credential }`
  - Protection contre un bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret de mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Réussite : `{ status: "ok", credentials, count }`

Structure de la charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne représentant un identifiant numérique de
  discussion Telegram.
- `admin/add` valide cette structure pour `kind: "telegram"` et rejette les
  charges utiles mal formées.

Structure de la charge utile pour le type Telegram avec utilisateur réel :

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` et `telegramApiId` doivent être des chaînes
  numériques.
- `tdlibArchiveSha256` et `desktopTdataArchiveSha256` doivent être des chaînes
  hexadécimales SHA-256.
- `kind: "telegram-user"` est réservé au workflow de preuve Mantis Telegram
  Desktop. Les parcours génériques du laboratoire d’assurance qualité ne
  doivent pas l’acquérir.

Charges utiles multicanales validées par le courtier :

- Discord : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Les parcours Slack peuvent également louer des identifiants dans le pool,
mais la validation des charges utiles Slack réside actuellement dans
l’exécuteur d’assurance qualité Slack plutôt que dans le courtier. Utilisez
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
pour les entrées Slack.

### Ajout d’un canal à l’assurance qualité

L’architecture et les noms des assistants de scénario pour les nouveaux
adaptateurs de canal se trouvent dans
[Vue d’ensemble de l’assurance qualité — ajout d’un canal](/fr/concepts/qa-e2e-automation#adding-a-channel).
Exigences minimales : implémenter l’exécuteur de transport sur l’interface
hôte partagée `qa-lab`, ajouter une `adapterFactory` pour les scénarios
partagés, déclarer `qaRunners` dans le manifeste du Plugin, monter l’exécuteur
sous la forme `openclaw qa <runner>` et créer les scénarios sous
`qa/scenarios/`.

## Suites de tests (où elles s’exécutent)

Considérez les suites comme offrant un « réalisme croissant » avec, en
contrepartie, une instabilité et un coût croissants.

### Tests unitaires et d’intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de
  partitions `vitest.full-*.config.ts` et peuvent développer les partitions
  multiprojets en configurations propres à chaque projet pour permettre une
  planification parallèle
- Fichiers : inventaires des tests du cœur et des tests unitaires sous
  `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les
  tests unitaires de l’interface utilisateur s’exécutent dans la partition
  dédiée `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration dans le processus (authentification du Gateway,
    routage, outillage, analyse syntaxique, configuration)
  - Tests de régression déterministes pour les bogues connus
- Attentes :
  - S’exécutent dans la CI
  - Ne nécessitent aucune véritable clé
  - Doivent être rapides et stables
  - Les tests du résolveur et du chargeur de surface publique doivent prouver
    le comportement général de repli de `api.js` et `runtime-api.js` avec de
    minuscules Plugin générés servant de fixtures, et non avec les API du code
    source de véritables Plugin intégrés. Les chargements d’API de véritables
    Plugin doivent résider dans les suites de contrat et d’intégration
    appartenant aux Plugin concernés.

Politique relative aux dépendances natives :

- Les installations de test par défaut ignorent les compilations natives
  facultatives d’Opus pour Discord. La voix Discord utilise le composant
  intégré `libopus-wasm`, et `@discordjs/opus` reste désactivé dans
  `allowBuilds` afin que les tests locaux et les parcours Testbox ne compilent
  pas le module complémentaire natif.
- Comparez les performances natives d’Opus dans le dépôt de référence de
  `libopus-wasm`, et non dans les boucles d’installation et de test par
  défaut d’OpenClaw. Ne définissez pas `@discordjs/opus` sur `true` dans la
  configuration `allowBuilds` par défaut ; cela ferait compiler du code natif
  aux boucles d’installation et de test sans rapport.

<AccordionGroup>
  <Accordion title="Projets, partitions et parcours ciblés">

    - Les exécutions non ciblées de `pnpm test` lancent treize configurations de partitions plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique processus natif gigantesque pour le projet racine. Cela réduit le pic de RSS sur les machines chargées et évite que les tâches d’auto-réponse ou de Plugin ne privent de ressources les suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projets natif de `vitest.config.ts` à la racine, car une boucle de surveillance à plusieurs partitions n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` font d’abord passer les cibles explicites de fichiers ou de répertoires par des voies ciblées, afin que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite le coût de démarrage de l’ensemble du projet racine.
    - Par défaut, `pnpm test:changed` développe les chemins Git modifiés en voies ciblées peu coûteuses : modifications directes de tests, fichiers `*.test.ts` voisins, correspondances explicites de sources et dépendants locaux du graphe d’importation. Les modifications de configuration, d’initialisation ou de paquet ne déclenchent pas une exécution étendue des tests, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est le point de contrôle local intelligent habituel pour les modifications limitées. Il classe le diff entre le cœur, les tests du cœur, les extensions, les tests d’extensions, les applications, la documentation, les métadonnées de version, l’outillage Docker en direct et l’outillage, puis exécute les commandes correspondantes de vérification des types, de lint et de garde-fou. Il n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou explicitement `pnpm test <target>` pour fournir une preuve par les tests. Les changements de version limités aux métadonnées de publication exécutent des vérifications ciblées de version, de configuration et de dépendances racines, avec un garde-fou qui rejette les modifications de paquet en dehors du champ de version de premier niveau.
    - Les modifications du banc d’essai ACP Docker en direct exécutent des vérifications ciblées : syntaxe shell des scripts d’authentification Docker en direct et simulation du planificateur Docker en direct. Les modifications de `package.json` ne sont incluses que lorsque le diff se limite à `scripts["test:docker:live-*"]` ; les modifications des dépendances, des exportations, de la version et des autres surfaces du paquet utilisent toujours les garde-fous plus larges.
    - Les tests unitaires légers en importations des agents, commandes, plugins, assistants d’auto-réponse, de `plugin-sdk` et de zones similaires d’utilitaires purs passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou fortement dépendants de l’exécution restent sur les voies existantes.
    - Certains fichiers sources d’assistants de `plugin-sdk` et de `commands` associent également les exécutions en mode modifié à des tests voisins explicites dans ces voies légères, afin que les modifications d’assistants évitent de réexécuter toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de groupes dédiés pour les assistants principaux de haut niveau, les tests d’intégration `reply.*` de haut niveau et la sous-arborescence `src/auto-reply/reply/**`. La CI divise en outre la sous-arborescence de réponse en partitions consacrées à l’exécuteur d’agent, à la répartition et au routage des commandes et de l’état, afin qu’un groupe riche en importations ne monopolise pas toute la fin d’exécution de Node.
    - La CI normale des PR et de la branche principale ignore volontairement le balayage par lots des plugins intégrés et la partition `agentic-plugins`, réservée aux publications. La validation complète de publication déclenche le workflow enfant distinct `Plugin Prerelease` pour ces suites fortement axées sur les plugins sur les versions candidates.

  </Accordion>

  <Accordion title="Couverture de l’exécuteur intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de messagerie ou le contexte d’exécution de la Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des tests de régression ciblés pour les limites de routage et de normalisation pures.
    - Maintenez en bon état les suites d’intégration de l’exécuteur intégré :
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` et
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants délimités et le comportement de la Compaction continuent de passer par les véritables chemins `run.ts` / `compact.ts` ; les tests limités aux assistants ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool et de l’isolation Vitest">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise l’exécuteur non isolé dans les projets racines ainsi que dans les configurations E2E et en direct.
    - La voie de l’interface utilisateur racine conserve son initialisation `jsdom` et son optimiseur, mais s’exécute également sur l’exécuteur partagé non isolé.
    - Chaque partition de `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute par défaut `--no-maglev` aux processus Node enfants de Vitest afin de réduire les recompilations de V8 pendant les grandes exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement standard de V8.
    - `scripts/run-vitest.mjs` met fin aux exécutions Vitest explicites hors surveillance après 5 minutes sans sortie standard ni sortie d’erreur. Définissez `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` pour désactiver le mécanisme de surveillance lors d’une investigation volontairement silencieuse.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` indique les voies architecturales déclenchées par un diff.
    - Le hook de pré-commit effectue uniquement le formatage. Il réindexe les fichiers formatés et n’exécute ni lint, ni vérification des types, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant le transfert ou le push lorsque vous avez besoin du point de contrôle local intelligent.
    - Par défaut, `pnpm test:changed` passe par des voies ciblées peu coûteuses. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent estime qu’une modification du banc d’essai, de la configuration, d’un paquet ou d’un contrat exige réellement une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, mais avec une limite de workers plus élevée.
    - La mise à l’échelle automatique des workers locaux est volontairement prudente et réduit leur nombre lorsque la charge moyenne de l’hôte est déjà élevée, afin que plusieurs exécutions Vitest simultanées aient par défaut un impact moindre.
    - La configuration Vitest de base marque les projets et fichiers de configuration comme `forceRerunTriggers`, afin que les réexécutions en mode modifié restent correctes lorsque le câblage des tests change.
    - La configuration maintient `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` pour utiliser un emplacement de cache explicite lors d’un profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport Vitest sur la durée des importations ainsi que le détail des importations.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
    - Les données de durée des partitions sont écrites dans `.artifacts/vitest-shard-timings.json`. Les exécutions de configuration complète utilisent le chemin de configuration comme clé ; les partitions de CI basées sur un motif d’inclusion ajoutent le nom de la partition afin de pouvoir suivre séparément les partitions filtrées.
    - Lorsqu’un test particulièrement coûteux consacre encore l’essentiel de son temps aux importations de démarrage, placez les dépendances lourdes derrière une interface locale étroite `*.runtime.ts` et simulez directement cette interface, au lieu d’importer en profondeur des assistants d’exécution uniquement pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le chemin routé de `test:changed` au chemin natif du projet racine pour ce diff validé, puis affiche le temps écoulé ainsi que le RSS maximal sous macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure les performances de l’arborescence de travail actuellement modifiée en faisant passer la liste des fichiers modifiés par `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour les surcoûts de démarrage et de transformation de Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU et de tas de l’exécuteur pour la suite unitaire, avec le parallélisme des fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` et `test/vitest/vitest.infra.config.ts`, chacune limitée à un worker
- Portée :
  - Démarre un véritable Gateway en local loopback avec les diagnostics activés par défaut
  - Génère une activité synthétique de messages du Gateway, de mémoire et de charges utiles volumineuses par le chemin des événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance de l’ensemble de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible avec la CI et sans clé
  - Voie ciblée pour le suivi des régressions de stabilité, et non substitut à la suite Gateway complète

### E2E (agrégat du dépôt)

- Commande : `pnpm test:e2e`
- Portée :
  - Exécute la voie E2E de test rapide du Gateway
  - Exécute la voie E2E du navigateur simulé de la Control UI
- Attentes :
  - Compatible avec la CI et sans clé
  - Nécessite l’installation de Playwright Chromium

### E2E (test rapide du Gateway)

- Commande : `pnpm test:e2e:gateway`
- Configuration : `test/vitest/vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et les tests E2E des plugins intégrés sous `extensions/`
- Valeurs d’exécution par défaut :
  - Utilise `threads` de Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise un nombre adaptatif de workers (CI : jusqu’à 2 ; local : 1 par défaut).
  - S’exécute par défaut en mode silencieux afin de réduire le surcoût des E/S de la console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour imposer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie détaillée de la console.
- Portée :
  - Comportement de bout en bout du Gateway avec plusieurs instances
  - Surfaces WebSocket/HTTP, association de Node et réseau plus lourd
- Attentes :
  - S’exécute dans la CI lorsqu’il est activé dans le pipeline
  - Aucune clé réelle requise
  - Davantage d’éléments interdépendants que dans les tests unitaires, donc potentiellement plus lent

### E2E (navigateur simulé de la Control UI)

- Commande : `pnpm test:ui:e2e`
- Configuration : `test/vitest/vitest.ui-e2e.config.ts`
- Fichiers : `ui/src/**/*.e2e.test.ts`
- Portée :
  - Démarre la Control UI Vite
  - Pilote une véritable page Chromium avec Playwright
  - Remplace le WebSocket du Gateway par des simulations déterministes dans le navigateur
- Attentes :
  - S’exécute dans la CI dans le cadre de `pnpm test:e2e`
  - Aucun Gateway, agent ni clé de fournisseur réel requis
  - La dépendance du navigateur doit être présente (`pnpm --dir ui exec playwright install chromium`)

### E2E : test rapide du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Réutilise un Gateway OpenShell local actif
  - Crée un bac à sable à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw au moyen de véritables `sandbox ssh-config` et exécutions SSH
  - Vérifie le comportement canonique distant du système de fichiers au moyen de la passerelle du système de fichiers du bac à sable
- Attentes :
  - Sur activation uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Nécessite un Gateway OpenShell local actif et sa source de configuration
  - Utilise des valeurs isolées pour `HOME` / `XDG_CONFIG_HOME`, puis détruit le bac à sable de test
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite E2E plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour désigner un binaire CLI non standard ou un script enveloppe
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` pour exposer la configuration enregistrée du Gateway au test isolé
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` pour remplacer l’adresse IP du Gateway Docker utilisée par le dispositif de politique de l’hôte

### En direct (fournisseurs réels + modèles réels)

- Commande : `pnpm test:live`
- Configuration : `test/vitest/vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts` et tests en conditions réelles des plugins intégrés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités des appels d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, interruptions de service)
  - Entraîne des coûts/utilise les limites de débit
  - Préférer l’exécution de sous-ensembles ciblés plutôt que de « tout » exécuter
- Les exécutions en conditions réelles utilisent les clés d’API déjà exportées et les profils d’authentification préparés.
- Par défaut, les exécutions en conditions réelles isolent toujours `HOME` et copient les éléments de configuration et d’authentification dans un répertoire personnel de test temporaire afin que les fixtures des tests unitaires ne puissent pas modifier votre véritable `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous souhaitez intentionnellement que les tests en conditions réelles utilisent votre véritable répertoire personnel.
- `pnpm test:live` utilise par défaut un mode plus silencieux : il conserve les messages de progression `[live] ...` et masque les journaux d’amorçage du Gateway ainsi que les messages Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` pour rétablir l’intégralité des journaux de démarrage.
- Rotation des clés d’API (propre au fournisseur) : définissez `*_API_KEYS` au format séparé par des virgules/points-virgules ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), ou utilisez une substitution propre aux tests en conditions réelles via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponse indiquant une limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites en conditions réelles émettent des lignes de progression sur stderr afin que les longs appels aux fournisseurs restent visiblement actifs, même lorsque la capture de la console par Vitest est silencieuse.
  - `test/vitest/vitest.live.config.ts` désactive l’interception de la console par Vitest afin que les lignes de progression des fournisseurs/du Gateway soient diffusées immédiatement pendant les exécutions en conditions réelles.
  - Réglez les Heartbeats des modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Réglez les Heartbeats du Gateway/des sondes avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de la logique/des tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez effectué de nombreuses modifications)
- Modification du réseau du Gateway/du protocole WS/de l’association : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est indisponible »/des défaillances propres à un fournisseur/des appels d’outils : exécutez un `pnpm test:live` ciblé

## Tests en conditions réelles (avec accès au réseau)

Pour la matrice de modèles en conditions réelles, les tests de fumée des moteurs CLI, les tests de fumée ACP, le banc d’essai du serveur d’application Codex et tous les tests en conditions réelles des fournisseurs multimédias (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, banc d’essai multimédia), ainsi que la gestion des identifiants pour les exécutions en conditions réelles :

- consultez [Tester les suites en conditions réelles](/fr/help/testing-live). Pour la liste de contrôle dédiée à la validation des mises à jour et des plugins, consultez
  [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Exécuteurs Docker (vérifications facultatives du « fonctionnement sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles en conditions réelles : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement le fichier de test en conditions réelles correspondant aux clés de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local, votre espace de travail et le fichier facultatif des variables d’environnement du profil. Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker en conditions réelles conservent leurs propres limites pratiques lorsque nécessaire :
  `test:docker:live-models` utilise par défaut l’ensemble soigneusement sélectionné des modèles pris en charge les plus significatifs, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Définissez `OPENCLAW_LIVE_MAX_MODELS`
  ou les variables d’environnement du Gateway lorsque vous souhaitez explicitement une limite inférieure ou une analyse plus étendue.
- `test:docker:all` construit une seule fois l’image Docker destinée aux tests en conditions réelles via `test:docker:live-build`, empaquette une seule fois OpenClaw sous forme d’archive npm avec `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image minimale sert uniquement d’exécuteur Node/Git pour les parcours d’installation, de mise à jour et de dépendances de plugins ; ces parcours montent l’archive préconstruite. L’image fonctionnelle installe la même archive dans `/app` pour les parcours fonctionnels de l’application construite. Les définitions des parcours Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les limites de ressources empêchent les parcours lourds en conditions réelles, d’installation npm et multiservices de démarrer tous simultanément. Si un parcours unique dépasse les limites actives, l’ordonnanceur peut tout de même le démarrer lorsque le pool est vide, puis le laisse s’exécuter seul jusqu’à ce que de la capacité soit de nouveau disponible. Les valeurs par défaut sont de 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; réglez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (ainsi que les autres substitutions `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) uniquement lorsque l’hôte Docker dispose de davantage de marge. L’exécuteur effectue par défaut une vérification préalable de Docker, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, enregistre la durée des parcours réussis dans `.artifacts/docker-tests/lane-timings.json` et utilise ces durées pour démarrer d’abord les parcours les plus longs lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des parcours sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des parcours sélectionnés, les besoins en paquets/images et les identifiants.
- `Package Acceptance` est la barrière de validation native de GitHub pour vérifier « si cette archive installable fonctionne comme un produit ». Elle résout un seul paquet candidat depuis `source=npm`, `source=ref`, `source=url`, `source=trusted-url` ou `source=artifact`, le téléverse sous le nom `package-under-test`, puis exécute les parcours Docker E2E réutilisables sur cette archive exacte au lieu de réempaqueter la référence sélectionnée. Les profils sont classés par étendue : `smoke`, `package`, `product` et `full` (ainsi que `custom` pour une liste explicite de parcours). Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat des paquets/mises à jour/plugins, la matrice de survie aux mises à niveau publiées, les valeurs par défaut des versions et le triage des défaillances.
- Les vérifications de construction et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. La protection parcourt le graphe statique construit depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si ce graphe d’amorçage antérieur à la répartition importe statiquement un paquet externe (Commander, interface utilisateur d’invite, undici, journalisation et autres dépendances lourdes au démarrage sont toutes prises en compte) avant la répartition des commandes ; elle limite également le fragment d’exécution groupé du Gateway à 70 Ko et rejette les importations statiques de chemins du Gateway connus comme rarement utilisés (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) depuis ce fragment. `scripts/release-check.ts` soumet séparément la CLI empaquetée à des tests de fumée avec `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` et `models list --provider openai`.
- La compatibilité historique de Package Acceptance est limitée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le banc d’essai tolère uniquement les lacunes de métadonnées des paquets publiés : entrées omises de l’inventaire d’assurance qualité privé, absence de `gateway install --wrapper`, fichiers de correctifs absents de la fixture Git dérivée de l’archive, absence de `update.channel` persistant, emplacements historiques des enregistrements d’installation des plugins, absence de persistance des enregistrements d’installation de la place de marché et migration des métadonnées de configuration pendant `plugins update`. Pour les paquets postérieurs à `2026.4.25`, ces chemins produisent des échecs stricts.
- Exécuteurs de tests de fumée en conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des parcours d’intégration de haut niveau.
- Les parcours E2E Docker/Bash qui installent l’archive OpenClaw empaquetée avec `scripts/lib/openclaw-e2e-instance.sh` limitent la durée de `npm install` à `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (`600s` par défaut ; définissez `0` pour désactiver l’enveloppe à des fins de débogage).

Les exécuteurs Docker de modèles en conditions réelles montent également uniquement les répertoires personnels d’authentification CLI nécessaires
(ou tous ceux pris en charge lorsque l’exécution n’est pas ciblée), puis les copient dans le
répertoire personnel du conteneur avant l’exécution afin que l’OAuth des CLI externes puisse actualiser les jetons
sans modifier le stockage d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test de fumée de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Test de fumée du moteur CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test de fumée du banc d’essai du serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Tests de fumée d’observabilité : `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` et `pnpm qa:observability:smoke` sont des parcours privés d’assurance qualité exécutés depuis le code source. Ils ne font intentionnellement pas partie des parcours Docker de publication des paquets, car l’archive npm omet QA Lab.
- Test de fumée Open WebUI en conditions réelles : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, structure complète) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test de fumée de l’intégration/du canal/de l’agent avec l’archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement l’archive OpenClaw empaquetée dans Docker, configure OpenAI via une intégration utilisant une référence de variable d’environnement ainsi que Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction sur l’hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Test rapide du parcours utilisateur de version : `pnpm test:docker:release-user-journey` installe globalement l’archive tar d’OpenClaw empaquetée dans un répertoire personnel Docker vierge, exécute l’intégration initiale, configure un fournisseur OpenAI simulé, exécute un tour d’agent, installe et désinstalle des plugins externes, configure ClickClack avec une fixture locale, vérifie les messages sortants et entrants, redémarre le Gateway et exécute le diagnostic.
- Test rapide de l’intégration initiale typée de version : `pnpm test:docker:release-typed-onboarding` installe l’archive tar empaquetée, pilote `openclaw onboard` via un véritable TTY, configure OpenAI comme fournisseur référencé par variable d’environnement, vérifie qu’aucune clé brute n’est conservée et exécute un tour d’agent simulé.
- Test rapide des médias et de la mémoire de version : `pnpm test:docker:release-media-memory` installe l’archive tar empaquetée, vérifie la compréhension d’image à partir d’une pièce jointe PNG, la sortie de génération d’images compatible avec OpenAI, le rappel par recherche en mémoire et la persistance du rappel après le redémarrage du Gateway.
- Test rapide du parcours utilisateur de mise à niveau de version : `pnpm test:docker:release-upgrade-user-journey` installe par défaut la version de référence publiée la plus récente antérieure à l’archive tar candidate, configure l’état du fournisseur, du plugin et de ClickClack sur le paquet publié, effectue la mise à niveau vers l’archive tar candidate, puis réexécute le parcours principal de l’agent, du plugin et du canal. S’il n’existe aucune version de référence publiée antérieure, il réutilise la version candidate. Remplacez la référence avec `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Test rapide de la place de marché des plugins de version : `pnpm test:docker:release-plugin-marketplace` effectue une installation depuis une place de marché fixture locale, met à jour le plugin installé, le désinstalle et vérifie que la CLI du plugin disparaît et que les métadonnées d’installation sont élaguées.
- Test rapide d’installation d’une Skill : `pnpm test:docker:skill-install` installe globalement l’archive tar d’OpenClaw empaquetée dans Docker, désactive dans la configuration l’installation d’archives téléversées, résout par recherche le slug actuel d’une Skill ClawHub active, l’installe avec `openclaw skills install` et vérifie la Skill installée ainsi que les métadonnées d’origine et de verrouillage `.clawhub`.
- Test rapide de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement l’archive tar d’OpenClaw empaquetée dans Docker, passe du paquet `stable` à la version git `dev`, vérifie le canal conservé et le fonctionnement du plugin après la mise à jour, puis revient au paquet `stable` et vérifie l’état de la mise à jour.
- Test rapide de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive tar d’OpenClaw empaquetée sur une fixture sale d’un ancien utilisateur comportant des agents, une configuration de canal, des listes d’autorisation de plugins, un état obsolète des dépendances de plugins et des fichiers existants d’espace de travail et de session. Il exécute la mise à jour du paquet ainsi que le diagnostic non interactif sans fournisseur actif ni clés de canal, puis démarre un Gateway en local loopback et vérifie la conservation de la configuration et de l’état ainsi que les budgets de démarrage et d’état.
- Test rapide publié de survie à la mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, configure cette version de référence avec une recette de commandes intégrée, valide la configuration obtenue, met à jour cette installation publiée vers l’archive tar candidate, exécute le diagnostic non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en local loopback et vérifie les intentions configurées, la conservation de l’état, le démarrage, `/healthz`, `/readyz` et les budgets d’état RPC. Remplacez une référence avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé de développer les références locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, par exemple `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et développez les fixtures correspondant à des problèmes avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, par exemple `reported-issues` ; l’ensemble des problèmes signalés inclut `configured-plugin-installs` pour la réparation automatique de l’installation des plugins OpenClaw externes. L’acceptation du paquet expose ces valeurs sous les noms `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, résout les jetons de méta-référence tels que `last-stable-4` ou `all-since-2026.4.23`, et la validation complète de version développe le contrôle du paquet d’endurance de version en `last-stable-4 2026.4.23 2026.5.2 2026.4.15`, ainsi que `reported-issues`.
- Test rapide du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la conservation dans la transcription du contexte d’exécution masqué ainsi que la réparation par le diagnostic des branches dupliquées concernées de réécriture de l’invite.
- Test rapide d’installation globale avec Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arborescence actuelle, l’installe avec `bun install -g` dans un répertoire personnel isolé et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de rester bloqué. Réutilisez une archive tar précompilée avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la compilation sur l’hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker compilée avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test rapide Docker du programme d’installation : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs racine, de mise à jour et npm direct. Le test rapide de mise à jour utilise par défaut la version npm `latest` comme référence stable avant la mise à niveau vers l’archive tar candidate. Remplacez-la localement avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, ou sur GitHub avec l’entrée `update_baseline_version` du workflow de test rapide d’installation. Les vérifications du programme d’installation sans privilèges racine conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement de l’installation locale de l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache racine, de mise à jour et npm direct lors des réexécutions locales.
- L’intégration continue du test rapide d’installation ignore la mise à jour globale npm directe redondante avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe de `npm install -g` est nécessaire.
- Test rapide de la CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compile par défaut l’image issue du Dockerfile racine, initialise deux agents partageant un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json` et vérifie la validité du JSON ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image du test rapide d’installation avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau du Gateway et cycle de vie de l’hôte : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`) conserve le test rapide d’authentification et d’intégrité WebSocket sur un réseau local à deux conteneurs, puis utilise l’interface HTTP d’administration en local loopback pour démontrer le verrouillage de préparation, l’accès de contrôle conservé, la récupération à la reprise et un arrêt-démarrage préparé dans le même conteneur. La vérification du redémarrage doit se terminer avant l’expiration du bail initial ; elle vérifie que l’état de suspension est local au processus tandis que la configuration persistante du Gateway et l’identité du conteneur sont conservées, et produit un fichier JSON exploitable par machine contenant les durées des phases.
- Test rapide d’instantané CDP du navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) compile l’image E2E source ainsi qu’une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep` et vérifie que les instantanés de rôles CDP couvrent les URL des liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Régression du raisonnement minimal de `web_search` avec OpenAI Responses : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via le Gateway, vérifie que `web_search` fait passer `reasoning.effort` de `minimal` à `low`, puis force le rejet par le schéma du fournisseur et vérifie que le détail brut apparaît dans les journaux du Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test rapide de trame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP de l’ensemble OpenClaw (véritable serveur MCP stdio + test rapide d’autorisation et de refus du profil OpenClaw intégré) : `pnpm test:docker:agent-bundle-mcp-tools` (script : `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (véritable Gateway + arrêt du processus enfant MCP stdio après des exécutions Cron isolées et ponctuelles de sous-agent) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test rapide d’installation et de mise à jour pour un chemin local, `file:`, un registre npm avec dépendances remontées, des métadonnées de paquet npm mal formées, des références git mobiles, une fixture exhaustive ClawHub, des mises à jour depuis la place de marché et l’activation/l’inspection de l’ensemble Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/environnement d’exécution exhaustive par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur local hermétique de fixture ClawHub.
- Test rapide de mise à jour sans modification d’un plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test rapide de la matrice du cycle de vie des plugins : `pnpm test:docker:plugin-lifecycle-matrix` installe l’archive tar d’OpenClaw empaquetée dans un conteneur minimal, installe un plugin npm, active et désactive celui-ci, le met à niveau puis le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en consignant les métriques RSS/CPU de chaque phase du cycle de vie.
- Test rapide des métadonnées de rechargement de la configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre les tests rapides d’installation et de mise à jour pour un chemin local, `file:`, un registre npm avec dépendances remontées, des références git mobiles, des fixtures ClawHub, des mises à jour depuis la place de marché et l’activation/l’inspection de l’ensemble Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour sans modification des plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation en cas de code manquant d’un plugin npm, avec suivi des ressources.

Pour précompiler et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` désigne une image distante partagée, les scripts la téléchargent si elle n’est pas déjà disponible localement. Les tests Docker du code QR et du programme d’installation conservent leurs propres Dockerfiles, car ils valident le comportement du paquet et de l’installation plutôt que l’environnement d’exécution partagé de l’application compilée.

Les exécuteurs Docker avec modèle actif montent également le dépôt de travail actuel en lecture seule
et le copient dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela permet de conserver
une image d’exécution légère tout en exécutant Vitest sur votre source et votre configuration locales
exactes. L’étape de copie ignore les caches volumineux propres à la machine et les résultats de compilation
des applications, tels que `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires
locaux `.build` ou de sortie Gradle, afin que les exécutions Docker actives ne passent pas
plusieurs minutes à copier des artefacts propres à la machine. Elles définissent également
`OPENCLAW_SKIP_CHANNELS=1` afin que les sondes actives du Gateway ne démarrent pas de véritables
processus de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live` ; transmettez donc également
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture active du Gateway
de cette voie Docker.

`test:docker:openwebui` est un test de compatibilité de haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles avec OpenAI activés,
démarre un conteneur Open WebUI épinglé configuré pour utiliser ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
véritable requête de chat via le proxy `/api/chat/completions` d’Open WebUI. Définissez
`OPENWEBUI_SMOKE_MODE=models` pour les vérifications CI du chemin de publication qui doivent s’arrêter
après la connexion à Open WebUI et la découverte des modèles, sans attendre la réponse
d’un modèle actif. La première exécution peut être sensiblement plus lente, car Docker peut devoir
récupérer l’image Open WebUI et Open WebUI peut devoir terminer sa propre
configuration de démarrage à froid. Ce parcours nécessite une clé de modèle actif utilisable, fournie par
l’environnement du processus, des profils d’authentification préparés ou un fichier
`OPENCLAW_PROFILE_FILE` explicite. Les exécutions réussies affichent une petite charge utile JSON telle que
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` est volontairement déterministe et ne nécessite pas de
véritable compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
préconfiguré, puis un second conteneur qui lance `openclaw mcp serve`, et
vérifie ensuite la découverte des conversations routées, la lecture des transcriptions, les
métadonnées des pièces jointes, le comportement de la file d’événements en direct, le routage des envois
sortants ainsi que les notifications de canal et d’autorisation de style Claude via le véritable
pont MCP stdio. La vérification des notifications inspecte directement les trames MCP stdio brutes
afin que le test valide ce que le pont émet réellement, et non uniquement ce qu’un SDK client
particulier expose par hasard.

`test:docker:agent-bundle-mcp-tools` est déterministe et ne nécessite pas de
clé de modèle actif. Il construit l’image Docker du dépôt, démarre un véritable serveur de
sonde MCP stdio dans le conteneur, matérialise ce serveur via l’environnement d’exécution MCP
du bundle OpenClaw intégré, exécute l’outil, puis vérifie que
`coding` et `messaging` conservent les outils `bundle-mcp`, tandis que `minimal` et
`tools.deny: ["bundle-mcp"]` les filtrent.

`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de
modèle actif. Il démarre un Gateway préconfiguré avec un véritable serveur de sonde MCP stdio,
exécute un tour Cron isolé et un tour enfant ponctuel `sessions_spawn`, puis
vérifie que le processus enfant MCP se termine après chaque exécution.

Test manuel en langage naturel des fils ACP (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression et de débogage. Il pourra être de nouveau nécessaire pour valider le routage des fils ACP ; ne le supprimez donc pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (valeur par défaut : `~/.openclaw`) monté dans `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (valeur par défaut : `~/.openclaw/workspace`) monté dans `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` monté et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires temporaires de configuration et d’espace de travail, sans montage externe d’authentification CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (valeur par défaut : `~/.cache/openclaw/docker-cli-tools`, sauf si l’exécution utilise déjà un répertoire monté géré ou de CI) monté dans `/home/node/.npm-global` pour mettre en cache les installations CLI dans Docker
- Les répertoires et fichiers externes d’authentification CLI sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut (utilisés lorsque l’exécution n’est pas limitée à des fournisseurs précis) : `.factory`, `.gemini`, `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à certains fournisseurs ne montent que les répertoires et fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement ce comportement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou une liste séparée par des virgules telle que `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour limiter l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors des réexécutions ne nécessitant pas de nouvelle construction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils, et non de l’environnement
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway lors du test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer l’invite de vérification du nonce utilisée par le test Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer l’étiquette épinglée de l’image Open WebUI

## Vérification de cohérence de la documentation

Exécutez les vérifications de la documentation après toute modification : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez également vérifier les titres dans les pages : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible avec la CI)

Il s’agit de régressions du « pipeline réel » sans véritables fournisseurs :

- Appel d’outils par le Gateway (OpenAI simulé, véritable Gateway et boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de configuration du Gateway (WS `wizard.start`/`wizard.next`, écrit la configuration et impose l’authentification) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous disposons déjà de quelques tests compatibles avec la CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le véritable Gateway et la boucle d’agent (`src/gateway/gateway.test.ts`).
- Parcours complets de l’assistant qui valident le câblage des sessions et les effets de la configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills figurent dans l’invite, l’agent choisit-il le bon Skill ou évite-t-il ceux qui ne sont pas pertinents ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et respecte-t-il les étapes et arguments requis ?
- **Contrats de workflow :** scénarios en plusieurs tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils et leur ordre, la lecture des fichiers de Skills et le câblage des sessions.
- Une petite suite de scénarios axés sur les Skills (utilisation ou évitement, restrictions, injection d’invite).
- Des évaluations actives facultatives (sur demande, contrôlées par des variables d’environnement), uniquement une fois la suite compatible avec la CI en place.

## Tests de contrat (structure des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte
son contrat d’interface. Ils parcourent tous les Plugins découverts et exécutent une
suite d’assertions sur la structure et le comportement. Le parcours de tests unitaires par défaut `pnpm test`
ignore volontairement ces fichiers partagés d’interface et de test ; exécutez explicitement les
commandes de contrat lorsque vous modifiez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canal uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseur uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts`. Catégories
principales actuelles :

- **channel-catalog** - métadonnées des entrées du catalogue des canaux intégrés/du registre
- **plugin** (adossé au registre, partitionné) - structure de base de l’enregistrement des Plugins
- **surfaces-only** (adossé au registre, partitionné) - vérifications de structure par surface pour `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` et `gateway`
- **session-binding** (adossé au registre) - comportement de liaison des sessions
- **outbound-payload** - structure et normalisation de la charge utile des messages
- **group-policy** (solution de repli) - application de la stratégie de groupe par défaut pour chaque canal
- **threading** (adossé au registre, partitionné) - gestion des identifiants de fil
- **directory** (adossé au registre, partitionné) - API d’annuaire/de liste des membres
- **registry** et **plugins-core.\*** - registre des Plugins de canal, chargeur et mécanismes internes d’autorisation d’écriture de la configuration

Les assistants de banc de test de capture de l’acheminement entrant et de charge utile sortante utilisés par ces
suites sont exposés en interne via `src/plugin-sdk/channel-contract-testing.ts`
(exclu de npm, il ne s’agit pas d’un sous-chemin public du SDK) ; il n’existe aucun fichier autonome
`inbound.contract.test.ts` dans ce répertoire.

### Contrats de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts`. Les catégories actuelles
comprennent :

- **shape** - structure du manifeste, de l’API et des exportations d’exécution du Plugin
- **plugin-registration** (+ parallèle) - cas d’enregistrement des manifestes
- **package-manifest** - exigences relatives au manifeste du paquet
- **loader** - comportement d’initialisation et de nettoyage du chargeur de Plugins
- **registry** - contenu et recherche dans le registre des contrats de Plugins
- **providers** - comportement partagé des fournisseurs intégrés, ainsi que des fournisseurs de recherche Web
- **auth-choice** - métadonnées des choix d’authentification et comportement de configuration
- **provider-catalog-deprecation** - métadonnées obsolètes du catalogue des fournisseurs
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - contrats de l’assistant de configuration des fournisseurs
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - contrats de fournisseur propres à chaque capacité
- **session-actions**, **session-attachments**, **session-entry-projection** - contrats d’état de session appartenant aux Plugins
- **scheduled-turns** - métadonnées des tours planifiés des Plugins et limites des horodatages
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - contrats relatifs au cycle de vie de l’hôte et de l’environnement d’exécution des Plugins, ainsi qu’aux limites d’importation
- **extension-runtime-dependencies** - emplacement des dépendances d’exécution des extensions

### Quand les exécuter

- Après avoir modifié les exportations ou sous-chemins de `plugin-sdk`
- Après avoir ajouté ou modifié un Plugin de canal ou de fournisseur
- Après avoir remanié l’enregistrement ou la découverte des Plugins

Les tests de contrat s’exécutent dans la CI et ne nécessitent pas de véritables clés d’API.

## Ajout de régressions (recommandations)

Lorsque vous corrigez un problème de fournisseur ou de modèle découvert en conditions réelles :

- Ajoutez si possible une régression compatible avec la CI (fournisseur simulé ou substitut, ou capture de la transformation exacte de la structure de la requête)
- Si le problème nécessite intrinsèquement des conditions réelles (limites de débit, stratégies d’authentification), maintenez le test réel ciblé et facultatif via des variables d’environnement
- Ciblez de préférence la couche la plus petite permettant de détecter le bogue :
  - bogue de conversion ou de réexécution d’une requête du fournisseur -> test direct des modèles
  - bogue dans le pipeline de session, d’historique ou d’outils du Gateway -> test actif du Gateway ou test simulé du Gateway compatible avec la CI
- Garde-fou pour le parcours des SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` déduit une cible échantillonnée par classe de SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants d’exécution contenant des segments de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille cible SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement pour les identifiants de cible non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Liens connexes

- [Tests en conditions réelles](/fr/help/testing-live)
- [Tests des mises à jour et des Plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
