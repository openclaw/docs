---
read_when:
    - Exécution des tests localement ou dans CI
    - Ajout de régressions pour les bogues de modèles/fournisseurs
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-07-02T08:12:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unitaire/intégration, e2e, live) et d’un petit ensemble
d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que chaque suite couvre (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) - architecture, surface de commandes, rédaction de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) - référence pour `pnpm openclaw qa matrix`.
- [Tableau de maturité](/fr/maturity/scorecard) - comment les preuves QA de release soutiennent les décisions de stabilité et de LTS.
- [Canal QA](/fr/channels/qa-channel) - le Plugin de transport synthétique utilisé par les scénarios appuyés par le dépôt.

Cette page couvre l’exécution des suites de tests régulières et des exécuteurs Docker/Parallels. La section des exécuteurs propres à la QA ci-dessous ([Exécuteurs propres à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Porte complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine spacieuse : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers achemine maintenant aussi les chemins d’extensions/canaux : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un échec unique.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez davantage de confiance :

- Porte de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

## Répertoires temporaires de test

Préférez les assistants partagés dans `test/helpers/temp-dir.ts` pour les répertoires
temporaires appartenant aux tests. Ils rendent la propriété explicite et conservent le nettoyage dans le même
cycle de vie de test :

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` n’expose volontairement aucune méthode de nettoyage manuel ; Vitest
possède le nettoyage après chaque test. Les assistants de plus bas niveau existants restent disponibles pour les tests qui
n’ont pas encore migré, mais les tests nouveaux et migrés doivent utiliser le
tracker à nettoyage automatique. Évitez tout nouvel usage manuel de `makeTempDir`, `cleanupTempDirs` ou
`createTempDirTracker`, ainsi que les nouveaux appels nus à `fs.mkdtemp*` dans les tests,
sauf si un cas vérifie explicitement le comportement brut des répertoires temporaires. Ajoutez un commentaire
d’autorisation auditable avec une raison concrète lorsqu’un test a intentionnellement besoin d’un répertoire temporaire nu :

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Pour la visibilité des migrations, `node scripts/report-test-temp-creations.mjs` signale
les nouvelles créations nues de répertoires temporaires et les nouveaux usages manuels des assistants partagés dans les lignes
ajoutées du diff, sans bloquer les styles de nettoyage existants. Sa portée de fichier suit volontairement
la même classification de chemins de test que `scripts/changed-lanes.mjs`
au lieu de maintenir une heuristique de noms de fichiers d’assistants de test séparée, tout en ignorant
l’implémentation de l’assistant partagé elle-même. `check:changed` exécute ce rapport pour
les chemins de test modifiés comme signal CI en avertissement uniquement ; les constats sont des annotations
d’avertissement GitHub, pas des échecs.

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performance runtime : déclenchez `OpenClaw Performance` avec
  `live_openai_candidate=true` pour un vrai tour d’agent `openai/gpt-5.5` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace Kova. Les exécutions planifiées quotidiennes
  publient les artefacts des voies fournisseur simulé, profil profond et GPT 5.5 vers
  `openclaw/clawgrit-reports` lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport mock-provider inclut aussi les chiffres de démarrage Gateway au niveau source, de mémoire,
  de pression Plugin, de boucle hello répétée avec faux modèle, et de démarrage CLI.
- Balayage de modèles live Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute maintenant un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent l’entrée `image` exécutent aussi un petit tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des jobs distincts de matrice de modèles live Docker
    partitionnés par fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/release.
- Test smoke de conversation liée Codex native : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin app-server Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison native du Plugin au lieu d’ACP.
- Test smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex appartenant au Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    MCP cron, sous-agent et Guardian. Désactivez la sonde de sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs
    app-server Codex. Pour une vérification ciblée du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela se termine après la sonde de sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Test smoke d’installation Codex à la demande : `pnpm test:docker:codex-on-demand`
  - Installe le tarball OpenClaw empaqueté dans Docker, exécute l’onboarding avec clé API OpenAI,
    et vérifie que le Plugin Codex ainsi que la dépendance `@openai/codex`
    ont été téléchargés à la demande dans la racine du projet npm géré.
- Test smoke de dépendance d’outil de Plugin live : `pnpm test:docker:live-plugin-tool`
  - Empaquette un Plugin de fixture avec une vraie dépendance `slugify`, l’installe via
    `npm-pack:`, vérifie la dépendance sous la racine du projet npm géré,
    puis demande à un modèle OpenAI live d’appeler l’outil du Plugin et de renvoyer le slug
    masqué.
- Test smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification facultative de défense en profondeur pour la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file une modification persistante de modèle,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Test smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec une fausse CLI Claude sur `PATH`
    et vérifie que le repli du planificateur flou se traduit par une écriture de configuration typée et auditée.
- Test smoke Docker de première exécution Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre à partir d’un répertoire d’état OpenClaw vide, vérifie le point d’entrée moderne onboard
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la configuration, et vérifie les entrées d’audit. Le même chemin de configuration Ring 0
    est aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à la QA

Ces commandes accompagnent les suites de tests principales lorsque vous avez besoin du réalisme QA-lab :

La CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de release, et non dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des release checks. Les vérifications de release
stable/par défaut gardent l’imprégnation live/Docker exhaustive derrière `run_release_soak=true` ; le
profil `full` force l’imprégnation. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis le déclenchement manuel avec la voie de parité simulée, la voie
Matrix live, la voie Telegram live gérée par Convex, et la voie Discord live gérée par Convex
comme jobs parallèles. La QA planifiée et les release checks passent explicitement
`--profile fast` à Matrix, tandis que la CLI Matrix et l’entrée de workflow manuelle
restent par défaut sur `all` ; le déclenchement manuel peut partitionner `all` en jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité plus les voies rapides Matrix et Telegram avant approbation de la release,
en utilisant `mock-openai/gpt-5.5` pour les vérifications de transport de release afin qu’elles restent
déterministes et évitent le démarrage normal du Plugin fournisseur. Ces Gateways de transport live
désactivent la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les fragments de média live de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui dispose déjà de
`ffmpeg` et `ffprobe`. Les fragments Docker de modèles/backends live utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit sélectionné,
puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque fragment.

- `pnpm openclaw qa suite`
  - Exécute les scénarios de QA adossés au dépôt directement sur l’hôte.
  - Écrit les artefacts de premier niveau `qa-evidence.json`, `qa-suite-summary.json` et
    `qa-suite-report.md` pour l’ensemble de scénarios sélectionné, y compris
    les sélections de scénarios de flux mixtes, Vitest et Playwright.
  - Lorsqu’il est lancé par `pnpm openclaw qa run --qa-profile <profile>`, intègre la
    scorecard du profil de taxonomie sélectionné dans le même `qa-evidence.json`.
    `smoke-ci` écrit des preuves allégées, ce qui définit `evidenceMode: "slim"` et omet
    `execution` par entrée. `release` couvre la tranche organisée de préparation à la publication ;
    `all` sélectionne toutes les catégories de maturité actives et est destiné aux lancements explicites du workflow
    Profile Evidence de QA lorsqu’un artefact de scorecard complet est
    nécessaire.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des workers
    Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (limitée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie sérielle.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Prend en charge les modes de fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur de fournisseur local adossé à AIMock pour une couverture expérimentale
    des fixtures et des protocoles simulés sans remplacer la voie `mock-openai`
    adaptée aux scénarios.
- `pnpm openclaw qa coverage --match <query>`
  - Recherche dans les identifiants de scénarios, titres, surfaces, identifiants de couverture, références de docs, références de code,
    plugins et exigences de fournisseur, puis affiche les cibles de suite correspondantes.
  - Utilisez ceci avant une exécution QA Lab lorsque vous connaissez le comportement ou le chemin de fichier touché
    mais pas le plus petit scénario. C’est uniquement indicatif ; choisissez toujours la preuve mock,
    live, Multipass, Matrix ou de transport à partir du comportement modifié.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute la batterie live du plugin OpenAI Kitchen Sink via QA Lab. Elle
    installe le paquet Kitchen Sink externe, vérifie l’inventaire de surface du SDK de plugin,
    sonde `/healthz` et `/readyz`, enregistre les preuves CPU/RSS du Gateway,
    exécute un tour OpenAI live et vérifie les diagnostics adversariaux.
    Nécessite une authentification OpenAI live telle que `OPENAI_API_KEY`. Dans les sessions Testbox
    hydratées, elle source automatiquement le profil d’authentification live Testbox lorsque l’assistant
    `openclaw-testbox-env` est présent.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway plus un petit pack de scénarios QA Lab simulés
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale par défaut uniquement les observations CPU chaudes soutenues (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), de sorte que les brèves rafales de démarrage sont enregistrées comme métriques
    sans ressembler à la régression du Gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; exécutez d’abord une build lorsque le checkout ne dispose pas
    déjà d’une sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite de QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection de fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    les clés de fournisseur basées sur l’environnement, le chemin de configuration du fournisseur live QA et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport et le résumé QA normaux plus les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail de QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive tar npm à partir du checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif par clé API OpenAI, configure Telegram
    par défaut, vérifie que le runtime de plugin empaqueté se charge sans réparation de dépendances
    au démarrage, exécute doctor et exécute un tour d’agent local contre un endpoint OpenAI
    simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe d’application construite pour les transcriptions de contexte runtime
    intégré. Il vérifie que le contexte runtime masqué d’OpenClaw est persisté comme un
    message personnalisé non affiché au lieu de fuir dans le tour utilisateur visible,
    puis injecte un JSONL de session cassée affectée et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un paquet candidat OpenClaw dans Docker, exécute l’onboarding de paquet installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA live Telegram
    avec ce paquet installé comme Gateway SUT.
  - Le wrapper monte uniquement la source du harnais `qa-lab` depuis le checkout ; le
    paquet installé possède `dist`, `openclaw/plugin-sdk` et le runtime de plugin
    groupé, afin que la voie ne mélange pas les plugins du checkout courant dans le paquet
    testé.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive tar locale résolue au lieu de
    l’installer depuis le registre.
  - Émet par défaut des mesures répétées du temps RTT dans `qa-evidence.json` avec
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Remplacez
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster l’exécution RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepte une liste séparée par des virgules
    d’identifiants de vérifications QA Telegram à échantillonner ; lorsqu’il n’est pas défini, la vérification par défaut compatible RTT
    est `telegram-mentioned-message-reply`.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/publication, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide les variables d’environnement d’identifiants Telegram ou Convex sur l’hôte avant
    le travail de build/installation Docker. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lorsque vous déboguez délibérément la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement. Lorsque les identifiants Convex
    sont sélectionnés et qu’aucun rôle n’est défini, le wrapper utilise `ci` dans CI et
    `maintainer` hors CI.
  - GitHub Actions expose cette voie comme workflow manuel mainteneur
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors des merges. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose également `Package Acceptance` pour une preuve produit en exécution latérale
  contre un paquet candidat. Il accepte une ref de confiance, une spécification npm publiée,
  une URL HTTPS d’archive tar plus SHA-256, ou un artefact d’archive tar provenant d’une autre exécution, téléverse
  l’archive normalisée `openclaw-current.tgz` comme `package-under-test`, puis exécute le
  planificateur Docker E2E existant avec des profils de voie smoke, paquet, produit, complet ou personnalisé.
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

- La preuve par URL exacte d’archive tar nécessite un condensat et utilise la politique de sécurité des URL publiques :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Les miroirs d’archives tar d’entreprise/privés utilisent une politique explicite de source de confiance :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lit `.github/package-trusted-sources.json` depuis la ref de workflow de confiance et n’accepte pas d’identifiants d’URL ni de contournement de réseau privé en entrée de workflow. Si la politique nommée déclare une authentification bearer, configurez le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La preuve par artefact télécharge un artefact d’archive tar depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaquète et installe la build OpenClaw courante dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les channels/plugins groupés via des modifications de configuration.
  - Vérifie que la découverte de configuration laisse absents les plugins téléchargeables non configurés,
    que la première réparation doctor configurée installe explicitement chaque plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendance masquée.
  - Installe également une baseline npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>` et vérifie que le doctor post-mise à jour du candidat
    nettoie les débris de dépendances de plugin hérités sans réparation postinstall côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation empaquetée sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le paquet baseline demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la version
    installée, l’état de mise à jour, la disponibilité du Gateway et un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin d’artefact de résumé et
    l’état par voie.
  - La voie OpenAI utilise `openai/gpt-5.5` pour la preuve de tour d’agent live par
    défaut. Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Encadrez les longues exécutions locales avec un délai d’expiration hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de voies imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans le doctor post-mise à jour et le travail de
    mise à jour de paquet sur un invité froid ; cela reste sain lorsque le journal de débogage npm
    imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision lors de
    la restauration de snapshot, du service de paquet ou de l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés, car
    les façades de capacité telles que la parole, la génération d’images et la compréhension des médias
    sont chargées via les API runtime groupées, même lorsque le tour d’agent
    lui-même ne vérifie qu’une simple réponse textuelle.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour des tests de fumée
    directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un serveur domestique Tuwunel jetable appuyé par Docker. Uniquement pour les extractions source - les installations empaquetées ne livrent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et organisation des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé à l’aide du pilote et des jetons de bot SUT provenant de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour les identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour activer les baux mutualisés.
  - Les valeurs par défaut couvrent le canari, la restriction aux mentions, l’adressage des commandes, `/status`, les réponses bot-à-bot mentionnées et les réponses aux commandes natives du cœur. Les valeurs par défaut `mock-openai` couvrent aussi les régressions déterministes de chaîne de réponses et de streaming du message final Telegram. Utilisez `--list-scenarios` pour les sondes facultatives telles que `session_status`.
  - Quitte avec un code non nul quand un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez le mode de communication bot-à-bot dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et `qa-evidence.json` sous `.artifacts/qa-e2e/...`. Les scénarios de réponse incluent le RTT depuis la requête d’envoi du pilote jusqu’à la réponse SUT observée.

`Mantis Telegram Live` est l’enveloppe de preuves de PR autour de cette voie. Elle exécute la
référence candidate avec des identifiants Telegram loués via Convex, rend le paquet de rapport/preuves QA
caviardé dans un navigateur de bureau Crabbox, enregistre des preuves MP4,
génère un GIF rogné au mouvement, téléverse le paquet d’artefacts et publie des preuves de PR
inline via la Mantis GitHub App lorsque `pr_number` est défini. Les maintainers peuvent
la démarrer depuis l’interface Actions via `Mantis Scenario` (`scenario_id:
telegram-live`) ou directement depuis un commentaire de pull request :

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` est l’enveloppe agentique native Telegram Desktop
avant/après pour les preuves visuelles de PR. Démarrez-la depuis l’interface Actions avec
des `instructions` libres, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) ou depuis un commentaire de PR :

```text
@openclaw-mantis telegram desktop proof
```

L’agent Mantis lit la PR, décide quel comportement visible dans Telegram prouve le
changement, exécute la voie de preuve Crabbox Telegram Desktop d’utilisateur réel sur les références de base et
candidate, itère jusqu’à ce que les GIFs natifs soient utiles, écrit un manifeste
`motionPreview` apparié, et publie le même tableau de GIFs à 2 colonnes via la
Mantis GitHub App lorsque `pr_number` est défini.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Loue ou réutilise un bureau Linux Crabbox, installe Telegram Desktop natif, configure OpenClaw avec un jeton de bot SUT Telegram loué, démarre le Gateway et enregistre des preuves capture d’écran/MP4 depuis le bureau VNC visible.
  - Utilise par défaut `--credential-source convex` afin que les workflows aient seulement besoin du secret du courtier Convex. Utilisez `--credential-source env` avec les mêmes variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop nécessite toujours une connexion/un profil utilisateur. Le jeton de bot configure uniquement OpenClaw. Utilisez `--telegram-profile-archive-env <name>` pour une archive de profil `.tgz` en base64, ou utilisez `--keep-lease` et connectez-vous manuellement via VNC une fois.
  - Écrit `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` et `telegram-desktop-builder.mp4` sous le répertoire de sortie.

Les voies de transport live partagent un contrat standard unique afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [vue d’ensemble QA → couverture des transports live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la grande suite synthétique et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
la QA de transport live, le labo QA acquiert un bail exclusif depuis un pool appuyé par Convex, envoie des heartbeats pour ce
bail pendant l’exécution de la voie, puis libère le bail à l’arrêt. Le nom de la section est antérieur à la prise en charge de
Discord, Slack et WhatsApp ; le contrat de bail est partagé entre les types.

Échafaudage de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle des identifiants :
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

Les commandes d’administration maintainer (ajouter/supprimer/lister dans le pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les maintainers :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe d’endpoint, le délai d’expiration HTTP et l’accessibilité admin/liste sans imprimer
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les utilitaires
CI.

Contrat d’endpoint par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Épuisé/réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Succès : `{ status: "ok", index, data }`
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
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret maintainer uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’id numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

Forme de payload pour le type utilisateur réel Telegram :

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` et `telegramApiId` doivent être des chaînes numériques.
- `tdlibArchiveSha256` et `desktopTdataArchiveSha256` doivent être des chaînes hexadécimales SHA-256.
- `kind: "telegram-user"` est réservé au workflow de preuve Mantis Telegram Desktop. Les voies génériques du QA Lab ne doivent pas l’acquérir.

Payloads multicanaux validés par le courtier :

- Discord : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Les voies Slack peuvent aussi louer depuis le pool, mais la validation du payload Slack
vit actuellement dans l’exécuteur QA Slack plutôt que dans le courtier. Utilisez
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
pour les lignes Slack.

### Ajouter un canal à la QA

Les noms d’architecture et d’assistants de scénario pour les nouveaux adaptateurs de canal se trouvent dans [vue d’ensemble QA → ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le seuil minimal : implémenter l’exécuteur de transport sur le point d’ancrage hôte partagé `qa-lab`, déclarer `qaRunners` dans le manifeste du Plugin, monter comme `openclaw qa <runner>` et écrire les scénarios sous `qa/scenarios/`.

## Suites de tests (où elles s’exécutent)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaires / intégration (par défaut)

- Commande : `pnpm test`
- Config : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer les shards multi-projets en configs par projet pour la planification parallèle
- Fichiers : inventaires cœur/unitaires sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires d’UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests purement unitaires
  - Tests d’intégration in-process (authentification du Gateway, routage, outillage, parsing, config)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests de résolveur et de chargeur de surface publique doivent prouver le comportement de repli large de `api.js` et
    `runtime-api.js` avec de minuscules fixtures de Plugin générées, pas avec
    de vraies API source de Plugins groupés. Les chargements d’API de Plugins réels appartiennent aux
    suites de contrat/intégration possédées par les Plugins.

Politique relative aux dépendances natives :

- Les installations de test par défaut ignorent les builds opus Discord natifs facultatifs. La voix Discord utilise `libopus-wasm` groupé, et `@discordjs/opus` reste désactivé dans `allowBuilds` afin que les tests locaux et les voies Testbox ne compilent pas l’addon natif.
- Comparez les performances de l’opus natif dans le dépôt de benchmark `libopus-wasm`, pas dans les boucles d’installation/test OpenClaw par défaut. Ne définissez pas `@discordjs/opus` sur `true` dans le `allowBuilds` par défaut ; cela force des boucles d’installation/test sans rapport à compiler du code natif.

<AccordionGroup>
  <Accordion title="Projets, shards et voies ciblées">

    - Les exécutions `pnpm test` non ciblées lancent douze configurations de fragments plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un énorme processus natif de projet racine unique. Cela réduit le pic de RSS sur les machines chargées et évite que le travail d’auto-reply/extensions affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-fragments n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers/répertoires via des voies ciblées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` étend par défaut les chemins git modifiés en voies ciblées bon marché : modifications directes de tests, fichiers frères `*.test.ts`, mappages source explicites et dépendants locaux du graphe d’import. Les modifications de configuration/setup/package ne déclenchent pas de tests larges, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la barrière normale de vérification locale intelligente pour les travaux étroits. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de version, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour une preuve de test. Les incréments de version limités aux métadonnées de version exécutent des vérifications ciblées de version/config/dépendances racine, avec une garde qui rejette les modifications de package hors du champ de version de premier niveau.
    - Les modifications du harnais Docker ACP live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker live et simulation du planificateur Docker live. Les modifications de `package.json` ne sont incluses que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendances, exports, versions et autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en import depuis agents, commandes, plugins, helpers auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en runtime restent sur les voies existantes.
    - Certains fichiers source helpers `plugin-sdk` et `commands` mappent aussi les exécutions en mode changed vers des tests frères explicites dans ces voies légères, afin que les modifications de helpers évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les helpers core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en plus le sous-arbre reply en fragments agent-runner, dispatch et commands/state-routing, afin qu’un compartiment lourd en imports ne possède pas toute la queue Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lots des extensions et le fragment réservé aux versions `agentic-plugins`. Full Release Validation déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidats de version.

  </Accordion>

  <Accordion title="Couverture du runner intégré">

    - Lorsque vous modifiez les entrées de découverte message-tool ou le contexte
      runtime de compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions de helpers ciblées pour les frontières de routage
      pur et de normalisation.
    - Gardez les suites d’intégration du runner intégré en bon état :
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, et
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les ids ciblés et le comportement de compaction
      transitent toujours par les vrais chemins `run.ts` / `compact.ts` ; les tests
      limités aux helpers ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Pool Vitest et valeurs par défaut d’isolation">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise le
      runner non isolé dans les projets racine, les configs e2e et les configs live.
    - La voie UI racine conserve son setup `jsdom` et son optimiseur, mais s’exécute
      elle aussi sur le runner partagé non isolé.
    - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut aux processus
      Node enfants Vitest afin de réduire le churn de compilation V8 pendant les
      grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      pour comparer avec le comportement V8 standard.
    - `scripts/run-vitest.mjs` termine les exécutions Vitest explicites hors watch après
      5 minutes sans sortie stdout ni stderr. Définissez
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` pour désactiver le chien de garde lors
      d’une investigation intentionnellement silencieuse.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` affiche les voies architecturales déclenchées par un diff.
    - Le hook pre-commit ne fait que le formatage. Il restage les fichiers formatés et
      n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant un transfert ou un push lorsque vous
      avez besoin de la barrière de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies ciblées bon marché. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, config, package ou contrat nécessite vraiment
      une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec un plafond de workers plus élevé.
    - L’auto-ajustement local des workers est intentionnellement conservateur et se réduit
      lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions
      Vitest concurrentes font moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme
      `forceRerunTriggers` afin que les réexécutions en mode changed restent correctes lorsque
      le câblage des tests change.
    - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris
      en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport de durée des imports Vitest ainsi que
      la sortie de décomposition des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers
      modifiés depuis `origin/main`.
    - Les données de timing des fragments sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions de configuration complète utilisent le chemin de configuration comme clé ;
      les fragments CI à motif d’inclusion ajoutent le nom du fragment afin que les fragments
      filtrés puissent être suivis séparément.
    - Lorsqu’un test chaud passe encore l’essentiel de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière une interface locale étroite `*.runtime.ts` et
      mockez directement cette interface au lieu d’importer profondément des helpers runtime
      seulement pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le `test:changed` routé
      au chemin natif de projet racine pour ce diff commité et affiche le temps réel ainsi que
      le RSS maximal macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail sale actuel
      en routant la liste des fichiers modifiés via `scripts/test-projects.mjs` et la
      configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour les
      surcoûts de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la
      suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un vrai Gateway loopback avec les diagnostics activés par défaut
  - Envoie du churn synthétique de messages gateway, mémoire et grosses charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les helpers de persistance du bundle de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (agrégat du dépôt)

- Commande : `pnpm test:e2e`
- Portée :
  - Exécute la voie E2E de smoke gateway
  - Exécute la voie E2E navigateur mockée Control UI
- Attentes :
  - Sûr pour la CI et sans clé
  - Nécessite l’installation de Playwright Chromium

### E2E (smoke gateway)

- Commande : `pnpm test:e2e:gateway`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins groupés sous `extensions/`
- Valeurs runtime par défaut :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute par défaut en mode silencieux pour réduire le surcoût d’I/O console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement gateway multi-instance de bout en bout
  - Surfaces WebSocket/HTTP, appairage de nodes et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E (navigateur mocké Control UI)

- Commande : `pnpm test:ui:e2e`
- Configuration : `test/vitest/vitest.ui-e2e.config.ts`
- Fichiers : `ui/src/**/*.e2e.test.ts`
- Portée :
  - Démarre la Control UI Vite
  - Pilote une vraie page Chromium via Playwright
  - Remplace le WebSocket Gateway par des mocks déterministes dans le navigateur
- Attentes :
  - S’exécute en CI dans le cadre de `pnpm test:e2e`
  - Aucun vrai Gateway, agent ni clé fournisseur requis
  - La dépendance navigateur doit être présente (`pnpm --dir ui exec playwright install chromium`)

### E2E : smoke backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Réutilise un Gateway OpenShell local actif
  - Crée une sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exec SSH
  - Vérifie le comportement de système de fichiers canonique distant via le pont fs de la sandbox
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI locale `openshell` ainsi qu’un daemon Docker fonctionnel
  - Nécessite un Gateway OpenShell local actif et sa source de configuration
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit la sandbox de test
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou un script wrapper non par défaut
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` pour exposer la configuration du Gateway enregistré au test isolé
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` pour remplacer l’IP de Gateway Docker utilisée par la fixture de politique hôte

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests live des plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités des appels d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Pas stable en CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise les limites de débit
  - Préférer exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions live utilisent les clés API déjà exportées et les profils d’authentification préparés.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de configuration/authentification dans un répertoire personnel de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...` et masque les journaux de démarrage du Gateway/le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer l’ensemble des journaux de démarrage.
- Rotation des clés API (propre au fournisseur) : définissez `*_API_KEYS` au format avec virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une substitution par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console de Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Réglez les Heartbeats des modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Réglez les Heartbeats Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs propres à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests live (qui touchent au réseau)

Pour la matrice des modèles live, les smokes de backend CLI, les smokes ACP, le harnais
de serveur d’application Codex, et tous les tests live des fournisseurs média (Deepgram, BytePlus, ComfyUI, image,
musique, vidéo, harnais média) - ainsi que la gestion des identifiants pour les exécutions live - consultez
[Tester les suites live](/fr/help/testing-live). Pour la liste de vérification dédiée aux mises à jour et à la
validation des plugins, consultez
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles live : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live de clé de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local, l’espace de travail et le fichier d’environnement de profil facultatif. Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs live Docker conservent leurs propres plafonds pratiques lorsque nécessaire :
  `test:docker:live-models` utilise par défaut l’ensemble sélectionné, pris en charge et à fort signal, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Définissez `OPENCLAW_LIVE_MAX_MODELS`
  ou les variables d’environnement du Gateway lorsque vous voulez explicitement un plafond plus petit ou une analyse plus large.
- `test:docker:all` construit l’image Docker live une fois via `test:docker:live-build`, empaquette OpenClaw une fois sous forme d’archive npm via `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image minimale est uniquement l’exécuteur Node/Git pour les voies d’installation/mise à jour/dépendances de plugin ; ces voies montent l’archive préconstruite. L’image fonctionnelle installe la même archive dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les voies live lourdes, d’installation npm et multiservices de démarrer toutes en même temps. Si une seule voie est plus lourde que les plafonds actifs, le planificateur peut quand même la démarrer lorsque le pool est vide, puis la laisse s’exécuter seule jusqu’à ce que de la capacité soit à nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; réglez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. L’exécuteur effectue par défaut un précontrôle Docker, supprime les conteneurs OpenClaw E2E obsolètes, imprime l’état toutes les 30 secondes, stocke les temps des voies réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces temps pour lancer les voies les plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour imprimer le plan CI des voies sélectionnées, les besoins en package/image et les identifiants.
- `Package Acceptance` est le contrôle de package natif GitHub pour « cette archive installable fonctionne-t-elle comme un produit ? ». Il résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, le téléverse sous le nom `package-under-test`, puis exécute les voies Docker E2E réutilisables contre cette archive exacte au lieu de réempaqueter la référence sélectionnée. Les profils sont ordonnés par ampleur : `smoke`, `package`, `product` et `full`. Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat package/mise à jour/plugin, la matrice de survivance des mises à niveau publiées, les valeurs par défaut de release et le triage des échecs.
- Les vérifications de build et de release exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe statique construit depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant dispatch importe des dépendances de package comme Commander, l’interface d’invite, undici ou la journalisation avant le dispatch de commande ; il garde aussi le fragment d’exécution du Gateway groupé sous budget et rejette les imports statiques de chemins Gateway froids connus. Le smoke CLI empaqueté couvre aussi l’aide racine, l’aide d’onboarding, l’aide de doctor, l’état, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette date limite, le harnais ne tolère que les lacunes de métadonnées de packages publiés : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de patch manquants dans la fixture git dérivée de l’archive, `update.channel` persistant manquant, anciens emplacements d’enregistrement d’installation de plugins, persistance manquante des enregistrements d’installation de marketplace et migration des métadonnées de configuration pendant `plugins update`. Pour les packages après `2026.4.25`, ces chemins sont des échecs stricts.
- Exécuteurs de smoke conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.
- Les voies Docker/Bash E2E qui installent l’archive OpenClaw empaquetée via `scripts/lib/openclaw-e2e-instance.sh` plafonnent `npm install` à `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (par défaut `600s` ; définissez `0` pour désactiver le wrapper à des fins de débogage).

Les exécuteurs Docker de modèles live montent aussi uniquement les répertoires personnels d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais de serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smokes d’observabilité : `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` et `pnpm qa:observability:smoke` sont des voies privées QA de checkout source. Elles ne font intentionnellement pas partie des voies de release Docker de package, car l’archive npm omet QA Lab.
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke d’onboarding/canal/agent d’archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe l’archive OpenClaw empaquetée globalement dans Docker, configure OpenAI via un onboarding par référence d’environnement ainsi que Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Test de vérification du parcours utilisateur de publication : `pnpm test:docker:release-user-journey` installe globalement l’archive tar OpenClaw empaquetée dans un répertoire personnel Docker propre, exécute l’onboarding, configure un fournisseur OpenAI simulé, exécute un tour d’agent, installe/désinstalle des plugins externes, configure ClickClack avec un fixture local, vérifie la messagerie sortante/entrante, redémarre Gateway, puis exécute doctor.
- Test de vérification de l’onboarding typé de publication : `pnpm test:docker:release-typed-onboarding` installe l’archive tar empaquetée, pilote `openclaw onboard` dans un vrai TTY, configure OpenAI comme fournisseur référencé par variable d’environnement, vérifie qu’aucune clé brute n’est persistée, puis exécute un tour d’agent simulé.
- Test de vérification média/mémoire de publication : `pnpm test:docker:release-media-memory` installe l’archive tar empaquetée, vérifie la compréhension d’image à partir d’une pièce jointe PNG, la sortie de génération d’image compatible OpenAI, le rappel par recherche en mémoire, ainsi que la survie du rappel après redémarrage de Gateway.
- Test de vérification du parcours utilisateur de mise à niveau de publication : `pnpm test:docker:release-upgrade-user-journey` installe par défaut la référence publiée la plus récente antérieure à l’archive tar candidate, configure l’état fournisseur/plugin/ClickClack sur le paquet publié, met à niveau vers l’archive tar candidate, puis réexécute le parcours principal agent/plugin/canal. S’il n’existe aucune référence publiée plus ancienne, il réutilise la version candidate. Remplacez la référence avec `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Test de vérification de la place de marché des plugins de publication : `pnpm test:docker:release-plugin-marketplace` installe depuis une place de marché locale de fixture, met à jour le plugin installé, le désinstalle, puis vérifie que la CLI du plugin disparaît avec les métadonnées d’installation élaguées.
- Test de vérification d’installation de Skills : `pnpm test:docker:skill-install` installe globalement l’archive tar OpenClaw empaquetée dans Docker, désactive les installations d’archives téléversées dans la configuration, résout le slug de Skill ClawHub actif actuel depuis la recherche, l’installe avec `openclaw skills install`, puis vérifie le Skill installé ainsi que les métadonnées d’origine/verrouillage `.clawhub`.
- Test de vérification du changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement l’archive tar OpenClaw empaquetée dans Docker, passe du paquet `stable` à git `dev`, vérifie le canal persisté et le fonctionnement des plugins après mise à jour, puis revient au paquet `stable` et vérifie l’état de mise à jour.
- Test de vérification de survie à la mise à niveau : `pnpm test:docker:upgrade-survivor` installe l’archive tar OpenClaw empaquetée par-dessus un fixture d’ancien utilisateur non propre contenant des agents, une configuration de canal, des listes d’autorisation de plugins, un état obsolète de dépendances de plugins, ainsi que des fichiers d’espace de travail/session existants. Il exécute la mise à jour du paquet ainsi que doctor en mode non interactif sans fournisseur actif ni clés de canal, puis démarre un Gateway en local loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/état.
- Test de vérification publié de survie à la mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, configure cette référence avec une recette de commandes intégrée, valide la configuration résultante, met à jour cette installation publiée vers l’archive tar candidate, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en local loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz`, ainsi que les budgets d’état RPC. Remplacez une référence avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre les références locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, par exemple `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et étendez les fixtures en forme d’issues avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, par exemple `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique d’installation de plugins OpenClaw externes. Package Acceptance les expose sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, résout les jetons de référence méta tels que `last-stable-4` ou `all-since-2026.4.23`, et Full Release Validation étend la porte de paquet release-soak à `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Test de vérification du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance masquée du transcript de contexte d’exécution ainsi que la réparation par doctor des branches de réécriture de prompt dupliquées affectées.
- Test de vérification d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre actuel, l’installe avec `bun install -g` dans un répertoire personnel isolé, puis vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images groupés au lieu de rester bloqué. Réutilisez une archive tar préconstruite avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test de vérification Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, update et direct-npm. Le test de mise à jour utilise par défaut npm `latest` comme référence stable avant la mise à niveau vers l’archive tar candidate. Remplacez avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localement, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications d’installation non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local à l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm entre les réexécutions locales.
- La CI Install Smoke ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Test de vérification CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, initialise deux agents avec un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json`, puis vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test de vérification d’instantané CDP de navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, puis vérifie que les instantanés de rôles CDP couvrent les URL de liens, les éléments cliquables promus par curseur, les références d’iframe et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` fait passer `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test de vérification de frame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP groupés OpenClaw (serveur MCP stdio réel + test de vérification d’autorisation/refus du profil OpenClaw intégré) : `pnpm test:docker:agent-bundle-mcp-tools` (script : `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Nettoyage Cron/sous-agent MCP (Gateway réel + arrêt d’enfant MCP stdio après des exécutions cron isolées et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test de vérification d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, métadonnées de paquet npm mal formées, références git mobiles, ClawHub kitchen-sink, mises à jour de place de marché et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/exécution kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur local hermétique de fixture ClawHub.
- Test de vérification de mise à jour inchangée de plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test de vérification de matrice de cycle de vie de plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe l’archive tar OpenClaw empaquetée dans un conteneur nu, installe un plugin npm, bascule activation/désactivation, le met à niveau puis le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation retire toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Test de vérification des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre le test de vérification d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, références git mobiles, fixtures ClawHub, mises à jour de place de marché et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation avec code manquant d’un plugin npm avec suivi des ressources.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, prévalent toujours lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la téléchargent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles, car ils valident le comportement de paquet/installation plutôt que l’exécution de l’application construite partagée.

Les exécuteurs Docker pour modèles en direct montent également le checkout actuel en lecture seule et
le préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
d’exécution légère tout en exécutant Vitest avec exactement votre source/config locale.
L’étape de préparation ignore les gros caches uniquement locaux et les sorties de build d’app comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie `.build`
locaux à l’app ou Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier des
artefacts propres à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live du Gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live du Gateway
dans cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un conteneur
Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés, démarre un conteneur
Open WebUI épinglé contre ce Gateway, se connecte via Open WebUI, vérifie que `/api/models` expose
`openclaw/default`, puis envoie une vraie requête de chat via le proxy `/api/chat/completions`
d’Open WebUI.
Définissez `OPENWEBUI_SMOKE_MODE=models` pour les vérifications CI du chemin de release qui doivent
s’arrêter après la connexion à Open WebUI et la découverte des modèles, sans attendre une complétion
de modèle en direct.
La première exécution peut être sensiblement plus lente, car Docker peut devoir télécharger l’image
Open WebUI et Open WebUI peut devoir terminer sa propre initialisation à froid.
Cette voie attend une clé de modèle en direct utilisable. Fournissez-la via l’environnement du
processus, des profils d’authentification préparés ou un `OPENCLAW_PROFILE_FILE` explicite.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de vrai compte
Telegram, Discord ou iMessage. Il démarre un conteneur Gateway préchargé, démarre un second conteneur
qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, les lectures de
transcriptions, les métadonnées de pièces jointes, le comportement de la file d’événements live, le
routage des envois sortants, ainsi que les notifications de canal + permission de style Claude via le
vrai pont MCP stdio. La vérification des notifications inspecte directement les trames MCP stdio
brutes afin que le smoke valide ce que le pont émet réellement, et pas seulement ce qu’un SDK client
spécifique expose par hasard.
`test:docker:agent-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle live. Il
construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio dans le conteneur,
matérialise ce serveur via le runtime MCP du bundle OpenClaw intégré, exécute l’outil, puis vérifie que
`coding` et `messaging` conservent les outils `bundle-mcp`, tandis que `minimal` et
`tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live. Il démarre
un Gateway préchargé avec un vrai serveur de sonde MCP stdio, exécute un tour cron isolé et un tour
enfant ponctuel `sessions_spawn`, puis vérifie que le processus enfant MCP se termine après chaque
exécution.

Smoke manuel ACP de thread en langage naturel (pas CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être de nouveau nécessaire pour valider le routage des threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté vers `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté vers `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` monté et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires config/workspace temporaires et sans montages externes d’authentification CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté vers `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes à un fournisseur montent uniquement les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors des réexécutions qui ne nécessitent pas de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification documentaire

Exécutez les vérifications de docs après les modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appels d’outils du Gateway (OpenAI simulé, vrai Gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de configuration du Gateway (WS `wizard.start`/`wizard.next`, écrit la config + auth imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le vrai Gateway + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de configuration de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Décision :** lorsque les skills sont listées dans le prompt, l’agent choisit-il la bonne skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du sandbox.

Les futures évaluations doivent rester déterministes d’abord :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers skill et le câblage de session.
- Une petite suite de scénarios centrés sur les skills (utiliser vs éviter, gating, injection de prompt).
- Évaluations live facultatives (opt-in, protégées par variables d’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils itèrent sur tous les Plugins découverts et exécutent une
suite d’assertions de forme et de comportement. La voie unitaire `pnpm test` par
défaut ignore intentionnellement ces fichiers partagés de seams et de smoke ;
exécutez explicitement les commandes de contrat lorsque vous touchez aux surfaces
partagées de canaux ou de fournisseurs.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile de message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de thread
- **directory** - API de répertoire/liste
- **group-policy** - Application de la politique de groupe

### Contrats d’état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes d’état des canaux
- **registry** - Forme du registre de Plugins

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat de flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte des Plugins
- **loader** - Chargement des Plugins
- **runtime** - Runtime du fournisseur
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un Plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte des Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (fournisseur mock/stub, ou capture de la transformation exacte de forme de requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live restreint et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/rejeu de requête fournisseur → test direct de modèles
  - bug de pipeline session/historique/outils du Gateway → smoke live du Gateway ou test mock Gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les ids exec à segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les ids de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tester en live](/fr/help/testing-live)
- [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
