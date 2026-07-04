---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajout de tests de non-régression pour les bogues de modèle/fournisseur
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-07-04T03:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unité/intégration, e2e, live) et d’un petit ensemble
de runners Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, pré-push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour les problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport live)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) - architecture, surface de commande, création de scénarios.
- [QA Matrix](/fr/concepts/qa-matrix) - référence pour `pnpm openclaw qa matrix`.
- [Tableau de maturité](/fr/maturity/scorecard) - comment les preuves QA de release soutiennent les décisions de stabilité et de LTS.
- [Canal QA](/fr/channels/qa-channel) - le Plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de tests régulières et des runners Docker/Parallels. La section ci-dessous propre aux runners QA ([Runners propres à QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Gate complet (attendu avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution plus rapide de toute la suite en local sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichiers route désormais aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou souhaitez davantage de confiance :

- Gate de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

## Répertoires temporaires de test

Préférez les helpers partagés dans `test/helpers/temp-dir.ts` pour les répertoires
temporaires détenus par les tests. Ils rendent la propriété explicite et gardent le nettoyage dans le même
cycle de vie de test :

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` n’expose volontairement aucune méthode de nettoyage manuel ; Vitest
possède le nettoyage après chaque test. Les helpers de plus bas niveau existants restent disponibles pour les tests qui
n’ont pas encore migré, mais les tests nouveaux et migrés doivent utiliser le tracker
à nettoyage automatique. Évitez les nouveaux usages manuels de `makeTempDir`, `cleanupTempDirs` ou
`createTempDirTracker`, ainsi que les nouveaux appels nus à `fs.mkdtemp*` dans les tests,
sauf si un cas vérifie explicitement le comportement brut des répertoires temporaires. Ajoutez un commentaire
d’autorisation auditable avec une raison concrète lorsqu’un test a intentionnellement besoin d’un répertoire temporaire
nu :

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Pour la visibilité de migration, `node scripts/report-test-temp-creations.mjs` signale
les nouvelles créations nues de répertoires temporaires et les nouveaux usages manuels des helpers partagés dans les lignes
ajoutées du diff, sans bloquer les styles de nettoyage existants. Sa portée de fichiers suit volontairement
la même classification de chemins de test que `scripts/changed-lanes.mjs`
au lieu de maintenir une heuristique séparée de noms de fichiers de helpers de test, tout en ignorant
l’implémentation du helper partagé elle-même. `check:changed` exécute ce rapport pour
les chemins de test modifiés comme signal CI en avertissement uniquement ; les constats sont des annotations
d’avertissement GitHub, pas des échecs.

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performance runtime : déclenchez `OpenClaw Performance` avec
  `live_openai_candidate=true` pour un vrai tour d’agent `openai/gpt-5.5` ou
  `deep_profile=true` pour les artefacts CPU/heap/trace Kova. Les exécutions planifiées quotidiennes
  publient les artefacts des voies mock-provider, deep-profile et GPT 5.5 vers
  `openclaw/clawgrit-reports` lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport mock-provider inclut aussi les chiffres de démarrage Gateway au niveau source, de mémoire,
  de pression Plugin, de boucle hello répétée avec faux modèle et de démarrage CLI.
- Balayage live des modèles Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un minuscule tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des échecs fournisseur.
  - Couverture CI : les workflows quotidiens `OpenClaw Scheduled Live And E2E Checks` et manuels
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des jobs de matrice live Docker séparés
    par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal dans `scripts/ci-hydrate-live-auth.sh`
    ainsi que `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/release.
- Smoke de discussion liée Codex native : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker contre le chemin app-server Codex, lie un DM
    Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et qu’une pièce jointe image
    passent par la liaison de Plugin native au lieu d’ACP.
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex détenu par le Plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    MCP cron, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lorsque vous isolez d’autres échecs
    app-server Codex. Pour une vérification ciblée du sous-agent, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke d’installation Codex à la demande : `pnpm test:docker:codex-on-demand`
  - Installe le tarball OpenClaw empaqueté dans Docker, exécute l’onboarding avec clé API OpenAI,
    et vérifie que le Plugin Codex ainsi que la dépendance `@openai/codex`
    ont été téléchargés à la demande dans la racine du projet npm géré.
- Smoke de dépendance d’outil de Plugin live : `pnpm test:docker:live-plugin-tool`
  - Empaquète un Plugin fixture avec une vraie dépendance `slugify`, l’installe via
    `npm-pack:`, vérifie la dépendance sous la racine du projet npm géré,
    puis demande à un modèle OpenAI live d’appeler l’outil Plugin et de renvoyer le slug
    masqué.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in de ceinture et bretelles pour la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans config avec une fausse CLI Claude sur `PATH`
    et vérifie que le fallback de planificateur flou se traduit par une écriture de config typée
    auditée.
- Smoke Docker de premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, vérifie le point d’entrée Crestodian
    d’onboarding moderne, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la config et vérifie les entrées d’audit. Le même chemin de configuration Ring 0
    est aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que le
  transcript assistant stocke `usage.cost` normalisé.

<Tip>
Lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Runners propres à QA

Ces commandes se trouvent à côté des suites de tests principales lorsque vous avez besoin du réalisme de QA-lab :

CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de release, pas dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des checks de release. Les checks de release
stables/par défaut gardent le soak live/Docker exhaustif derrière `run_release_soak=true` ; le
profil `full` force le soak. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis un déclenchement manuel avec la voie de parité mock, la voie
Matrix live, la voie Telegram live gérée par Convex et la voie Discord live
gérée par Convex comme jobs parallèles. Les checks QA planifiés et de release passent explicitement
Matrix `--profile fast`, tandis que l’entrée par défaut de la CLI Matrix et du workflow manuel
reste `all` ; le déclenchement manuel peut fragmenter `all` en jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité ainsi que les voies Matrix rapide et Telegram avant l’approbation
de release, en utilisant `mock-openai/gpt-5.5` pour les checks de transport de release afin qu’ils restent
déterministes et évitent le démarrage normal des Plugins fournisseur. Ces Gateways de transport live
désactivent la recherche mémoire ; le comportement mémoire reste couvert par les suites de parité QA.

Les fragments media live de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui possède déjà
`ffmpeg` et `ffprobe`. Les fragments live Docker modèle/backend utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit
sélectionné, puis la tirent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque fragment.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Écrit les artefacts de premier niveau `qa-evidence.json`, `qa-suite-summary.json` et
    `qa-suite-report.md` pour l’ensemble de scénarios sélectionné, y compris
    les sélections de scénarios à flux mixtes, Vitest et Playwright.
  - Lorsqu’il est lancé par `pnpm openclaw qa run --qa-profile <profile>`, intègre la
    fiche d’évaluation du profil de taxonomie sélectionné dans le même `qa-evidence.json`.
    `smoke-ci` écrit des preuves allégées, ce qui définit `evidenceMode: "slim"` et omet
    `execution` pour chaque entrée. `release` couvre la tranche organisée de préparation à la publication ;
    `all` sélectionne chaque catégorie de maturité active et est destiné aux lancements explicites du workflow
    Profile Evidence QA lorsqu’un artefact de fiche d’évaluation complet est
    nécessaire.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des workers
    gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour la couverture expérimentale
    par fixture et mock de protocole, sans remplacer la voie `mock-openai`
    consciente des scénarios.
- `pnpm openclaw qa coverage --match <query>`
  - Recherche dans les ID de scénarios, les titres, les surfaces, les ID de couverture, les références de docs, les références de code,
    les plugins et les exigences de fournisseur, puis affiche les cibles de suite correspondantes.
  - Utilisez ceci avant une exécution QA Lab lorsque vous connaissez le comportement ou le chemin de fichier touché,
    mais pas le plus petit scénario. C’est seulement indicatif ; choisissez tout de même la preuve mock,
    live, Multipass, Matrix ou de transport d’après le comportement modifié.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute l’épreuve complète live du Plugin OpenAI Kitchen Sink via QA Lab. Elle
    installe le paquet Kitchen Sink externe, vérifie l’inventaire de surface du SDK de plugin,
    sonde `/healthz` et `/readyz`, enregistre les preuves CPU/RSS du gateway,
    exécute un tour OpenAI live et vérifie les diagnostics adversariaux.
    Nécessite une authentification OpenAI live telle que `OPENAI_API_KEY`. Dans les sessions Testbox
    hydratées, elle source automatiquement le profil live-auth Testbox lorsque l’aide
    `openclaw-testbox-env` est présente.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du gateway plus un petit paquet de scénarios QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné des observations CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Ne signale par défaut que les observations de CPU chaud soutenues (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les brèves pointes de démarrage soient enregistrées comme métriques
    sans ressembler à la régression de gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; exécutez d’abord une build lorsque le checkout ne dispose pas
    déjà d’une sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection de fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de config du fournisseur live QA et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm à partir du checkout courant, l’installe globalement dans
    Docker, exécute l’onboarding non interactif par clé API OpenAI, configure Telegram
    par défaut, vérifie que le runtime du plugin empaqueté se charge sans réparation de dépendance
    au démarrage, exécute doctor et lance un tour d’agent local contre un endpoint OpenAI
    mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’app construite pour les transcriptions de contexte runtime
    intégré. Il vérifie que le contexte runtime OpenClaw masqué est persisté comme un
    message personnalisé non affiché au lieu de fuiter dans le tour utilisateur visible,
    puis ensemence un JSONL de session cassée affectée et vérifie que
    `openclaw doctor --fix` le réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un candidat de paquet OpenClaw dans Docker, exécute l’onboarding de paquet installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram live
    avec ce paquet installé comme Gateway SUT.
  - Le wrapper ne monte que la source du harness `qa-lab` depuis le checkout ; le
    paquet installé possède `dist`, `openclaw/plugin-sdk` et le runtime du plugin
    groupé, afin que la voie ne mélange pas les plugins du checkout courant dans le paquet
    testé.
  - Par défaut, `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester une archive locale résolue au lieu
    d’installer depuis le registre.
  - Émet par défaut une mesure répétée du RTT dans `qa-evidence.json` avec
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Remplacez
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster l’exécution RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepte une liste d’ID de contrôles QA
    Telegram séparés par des virgules à échantillonner ; lorsqu’il n’est pas défini, le contrôle compatible RTT
    par défaut est `telegram-mentioned-message-reply`.
  - Utilise les mêmes identifiants env Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/publication, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne Convex automatiquement.
  - Le wrapper valide les variables d’environnement d’identifiants Telegram ou Convex sur l’hôte avant
    le travail de build/installation Docker. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lorsque vous déboguez délibérément la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement. Lorsque les identifiants Convex
    sont sélectionnés et qu’aucun rôle n’est défini, le wrapper utilise `ci` en CI et
    `maintainer` hors CI.
  - GitHub Actions expose cette voie comme le workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Il ne s’exécute pas au merge. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose aussi `Package Acceptance` pour la preuve produit en exécution annexe
  contre un paquet candidat. Il accepte une référence de confiance, une spec npm publiée,
  une URL HTTPS d’archive plus SHA-256, ou un artefact d’archive d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le planificateur
  Docker E2E existant avec des profils de voie smoke, package, product, full ou custom.
  Définissez `telegram_mode=mock-openai` ou `live-frontier` pour exécuter le workflow QA
  Telegram contre le même artefact `package-under-test`.
  - Dernière preuve produit beta :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- La preuve par URL exacte d’archive exige un condensat et utilise la politique de sécurité des URL publiques :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Les miroirs d’archives d’entreprise/privés utilisent une politique explicite de source de confiance :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lit `.github/package-trusted-sources.json` depuis la référence de workflow de confiance et n’accepte pas d’identifiants d’URL ni de contournement de réseau privé via entrée de workflow. Si la politique nommée déclare une authentification bearer, configurez le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La preuve par artefact télécharge un artefact d’archive depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaquète et installe la build OpenClaw courante dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les plugins/canaux groupés via des modifications
    de config.
  - Vérifie que la découverte de configuration laisse les plugins téléchargeables non configurés absents,
    que la première réparation doctor configurée installe explicitement chaque plugin
    téléchargeable manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendance
    masquée.
  - Installe aussi une ancienne baseline npm connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour du candidat
    nettoie les débris de dépendances de plugin héritées sans réparation postinstall
    côté harness.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation empaquetée sur les invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le paquet baseline demandé, puis exécute la commande
    `openclaw update` installée dans le même invité et vérifie la version installée,
    l’état de mise à jour, la disponibilité du gateway et un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état de chaque voie.
  - La voie OpenAI utilise `openai/gpt-5.5` par défaut pour la preuve de tour d’agent live.
    Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Enveloppez les longues exécutions locales dans un timeout hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux de voie imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans le doctor post-mise à jour et le travail de
    mise à jour des paquets sur un invité froid ; cela reste sain lorsque le journal de débogage npm
    imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec les voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état de VM et peuvent entrer en collision sur
    la restauration de snapshot, le service de paquets ou l’état du gateway invité.
  - La preuve post-mise à jour exécute la surface normale de plugin groupé, car
    les façades de capacité telles que la parole, la génération d’images et la compréhension
    des médias sont chargées via les API runtime groupées, même lorsque le tour d’agent
    lui-même ne vérifie qu’une réponse texte simple.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour les tests de fumée directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix avec un homeserver Tuwunel jetable adossé à Docker. Checkout source uniquement - les installations packagées n’incluent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram avec un vrai groupe privé à l’aide des jetons de bot pilote et SUT fournis par l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’id numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour les baux mutualisés.
  - Les valeurs par défaut couvrent le canari, le filtrage des mentions, l’adressage des commandes, `/status`, les réponses mentionnées de bot à bot et les réponses aux commandes natives du noyau. Les valeurs par défaut `mock-openai` couvrent aussi les régressions déterministes de chaîne de réponses et de streaming du message final Telegram. Utilisez `--list-scenarios` pour les sondes facultatives comme `session_status`.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie d’échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et `qa-evidence.json` sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT depuis la requête d’envoi du pilote jusqu’à la réponse SUT observée.

`Mantis Telegram Live` est l’enveloppe de preuve de PR autour de cette voie. Elle exécute la
référence candidate avec des identifiants Telegram loués via Convex, affiche le paquet de rapport/preuve QA
caviardé dans un navigateur de bureau Crabbox, enregistre une preuve MP4,
génère un GIF recadré sur le mouvement, téléverse le paquet d’artefacts et publie la preuve de PR
en ligne via la Mantis GitHub App lorsque `pr_number` est défini. Les mainteneurs peuvent
la démarrer depuis l’interface Actions via `Mantis Scenario` (`scenario_id:
telegram-live`) ou directement depuis un commentaire de pull request :

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` est l’enveloppe agentique native Telegram Desktop
avant/après pour la preuve visuelle de PR. Démarrez-la depuis l’interface Actions avec
des `instructions` libres, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), ou depuis un commentaire de PR :

```text
@openclaw-mantis telegram desktop proof
```

L’agent Mantis lit la PR, décide quel comportement visible dans Telegram prouve le
changement, exécute la voie de preuve Crabbox Telegram Desktop utilisateur réel sur les références de base et
candidate, itère jusqu’à ce que les GIF natifs soient utiles, écrit un manifeste
`motionPreview` apparié et publie le même tableau de GIF à 2 colonnes via la
Mantis GitHub App lorsque `pr_number` est défini.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Loue ou réutilise un bureau Linux Crabbox, installe Telegram Desktop natif, configure OpenClaw avec un jeton de bot SUT Telegram loué, démarre le Gateway et enregistre des preuves capture d’écran/MP4 depuis le bureau VNC visible.
  - Utilise par défaut `--credential-source convex` afin que les workflows n’aient besoin que du secret du courtier Convex. Utilisez `--credential-source env` avec les mêmes variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop a toujours besoin d’une connexion/d’un profil utilisateur. Le jeton de bot configure uniquement OpenClaw. Utilisez `--telegram-profile-archive-env <name>` pour une archive de profil `.tgz` en base64, ou utilisez `--keep-lease` et connectez-vous manuellement via VNC une fois.
  - Écrit `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` et `telegram-desktop-builder.mp4` sous le répertoire de sortie.

Les voies de transport live partagent un contrat standard unique afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [vue d’ensemble QA → Couverture du transport live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la suite synthétique large et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
la QA de transport live, le labo QA acquiert un bail exclusif depuis un pool adossé à Convex, envoie des Heartbeat pour ce
bail pendant l’exécution de la voie et libère le bail à l’arrêt. Le nom de la section est antérieur à la
prise en charge de Discord, Slack et WhatsApp ; le contrat de bail est partagé entre les types.

Échafaudage de projet Convex de référence :

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en local loopback pour le développement local uniquement.

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
le préfixe de point de terminaison, le délai d’expiration HTTP et l’accessibilité admin/liste sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les
utilitaires CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

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
- `groupId` doit être une chaîne d’id de chat Telegram numérique.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

Forme du payload pour le type utilisateur réel Telegram :

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` et `telegramApiId` doivent être des chaînes numériques.
- `tdlibArchiveSha256` et `desktopTdataArchiveSha256` doivent être des chaînes hexadécimales SHA-256.
- `kind: "telegram-user"` est réservé au workflow de preuve Mantis Telegram Desktop. Les voies génériques du QA Lab ne doivent pas l’acquérir.

Payloads multicanaux validés par le courtier :

- Discord : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Les voies Slack peuvent aussi louer depuis le pool, mais la validation du payload Slack réside actuellement
dans l’exécuteur QA Slack plutôt que dans le courtier. Utilisez
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
pour les lignes Slack.

### Ajouter un canal à la QA

L’architecture et les noms des assistants de scénario pour les nouveaux adaptateurs de canal se trouvent dans [vue d’ensemble QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le seuil minimal : implémenter l’exécuteur de transport sur la couture hôte partagée `qa-lab`, déclarer `qaRunners` dans le manifeste du Plugin, monter comme `openclaw qa <runner>` et rédiger des scénarios sous `qa/scenarios/`.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Config : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer les shards multiprojets en configs par projet pour la planification parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires d’UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification du Gateway, routage, outillage, parsing, config)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune clé réelle requise
  - Doit être rapide et stable
  - Les tests de résolveur et de chargeur de surface publique doivent prouver le comportement de fallback large de `api.js` et
    `runtime-api.js` avec de petites fixtures de Plugin générées, et non
    avec les API source de vrais plugins groupés. Les chargements de vraies API de Plugin appartiennent aux
    suites de contrat/intégration appartenant aux plugins.

Politique des dépendances natives :

- Les installations de test par défaut ignorent les builds natifs facultatifs opus Discord. La voix Discord utilise `libopus-wasm` groupé, et `@discordjs/opus` reste désactivé dans `allowBuilds` afin que les tests locaux et les voies Testbox ne compilent pas l’addon natif.
- Comparez les performances d’opus natif dans le dépôt de benchmark `libopus-wasm`, et non dans les boucles d’installation/test OpenClaw par défaut. Ne définissez pas `@discordjs/opus` sur `true` dans le `allowBuilds` par défaut ; cela fait compiler du code natif à des boucles d’installation/test sans rapport.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Les exécutions non ciblées de `pnpm test` lancent douze configurations de shards plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique processus natif géant de projet racine. Cela réduit le RSS maximal sur les machines chargées et évite que le travail auto-reply/extension affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-shards n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichier/répertoire via des voies à portée limitée, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
    - `pnpm test:changed` étend par défaut les chemins git modifiés en voies à portée limitée peu coûteuses : modifications directes de tests, fichiers frères `*.test.ts`, mappages sources explicites et dépendants locaux du graphe d’importation. Les modifications de config/setup/package ne lancent pas de tests larges sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de vérification locale intelligente normale pour les travaux ciblés. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou `pnpm test <target>` explicite pour la preuve par test. Les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine, avec une garde qui rejette les changements de package en dehors du champ de version de premier niveau.
    - Les modifications du harnais Docker ACP live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker live et dry-run du planificateur Docker live. Les changements de `package.json` ne sont inclus que lorsque le diff se limite à `scripts["test:docker:live-*"]` ; les modifications de dépendances, d’exports, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires légers en importation provenant des agents, commandes, plugins, helpers auto-reply, `plugin-sdk` et zones similaires de purs utilitaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou lourds en runtime restent sur les voies existantes.
    - Certains fichiers sources helper de `plugin-sdk` et `commands` mappent également les exécutions en mode modifié vers des tests frères explicites dans ces voies légères, afin que les modifications de helpers évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de buckets dédiés pour les helpers core de premier niveau, les tests d’intégration `reply.*` de premier niveau et le sous-arbre `src/auto-reply/reply/**`. La CI divise en outre le sous-arbre reply en shards agent-runner, dispatch et commands/state-routing afin qu’un bucket lourd en importations ne possède pas toute la queue Node.
    - La CI normale PR/main ignore intentionnellement le balayage par lots des extensions et le shard `agentic-plugins` réservé aux releases. Full Release Validation déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les release candidates.

  </Accordion>

  <Accordion title="Couverture de l’exécuteur intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte runtime de Compaction,
      conservez les deux niveaux de couverture.
    - Ajoutez des régressions helper ciblées pour les frontières de routage pur et de normalisation.
    - Gardez les suites d’intégration de l’exécuteur intégré en bon état :
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` et
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants à portée limitée et le comportement de Compaction circulent toujours
      par les vrais chemins `run.ts` / `compact.ts` ; les tests uniquement sur les helpers
      ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool Vitest et de l’isolation">

    - La config Vitest de base utilise `threads` par défaut.
    - La config Vitest partagée fixe `isolate: false` et utilise l’exécuteur
      non isolé dans les projets racine, e2e et configs live.
    - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute également sur
      l’exécuteur non isolé partagé.
    - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la config Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute `--no-maglev` par défaut pour les processus Node
      enfants de Vitest afin de réduire le churn de compilation V8 pendant les grandes exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8
      d’origine.
    - `scripts/run-vitest.mjs` termine les exécutions Vitest explicites hors surveillance après
      5 minutes sans sortie stdout ni stderr. Définissez
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` pour désactiver la surveillance lors d’une
      investigation intentionnellement silencieuse.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` affiche les voies architecturales qu’un diff déclenche.
    - Le hook pre-commit ne fait que du formatage. Il remet en stage les fichiers formatés et
      n’exécute pas lint, typecheck ni tests.
    - Exécutez explicitement `pnpm check:changed` avant la remise ou le push lorsque vous
      avez besoin de la porte de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies à portée limitée peu coûteuses. Utilisez
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent
      décide qu’une modification de harnais, config, package ou contrat a vraiment besoin d’une
      couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec un plafond de workers plus élevé.
    - L’auto-scaling local des workers est intentionnellement conservateur et réduit la charge
      lorsque la moyenne de charge de l’hôte est déjà élevée, de sorte que plusieurs exécutions
      Vitest concurrentes causent moins de dégâts par défaut.
    - La config Vitest de base marque les projets/fichiers de config comme
      `forceRerunTriggers` afin que les réexécutions en mode modifié restent correctes lorsque le
      câblage des tests change.
    - La config garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ;
      définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport de durée d’importation de Vitest ainsi que
      la sortie de décomposition des importations.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Les données de durée des shards sont écrites dans `.artifacts/vitest-shard-timings.json`.
      Les exécutions avec configuration complète utilisent le chemin de configuration comme clé ; les shards CI
      à motif d’inclusion ajoutent le nom du shard afin que les shards filtrés puissent être suivis
      séparément.
    - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les importations de démarrage,
      gardez les dépendances lourdes derrière une interface locale étroite `*.runtime.ts` et
      moquez directement cette interface au lieu d’importer en profondeur des helpers d’exécution uniquement
      pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le
      `test:changed` routé au chemin natif du projet racine pour ce diff validé
      et affiche le temps écoulé ainsi que le RSS maximal sur macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail
      sale actuel en routant la liste des fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      les surcoûts de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+tas du runner pour la
      suite unitaire avec le parallélisme par fichier désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un Gateway loopback réel avec les diagnostics activés par défaut
  - Envoie une activité synthétique de messages gateway, de mémoire et de grandes charges utiles via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les helpers de persistance du bundle de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (agrégat du dépôt)

- Commande : `pnpm test:e2e`
- Portée :
  - Exécute la voie E2E de smoke du gateway
  - Exécute la voie E2E navigateur mockée de Control UI
- Attentes :
  - Compatible CI et sans clé
  - Nécessite l’installation de Playwright Chromium

### E2E (smoke du gateway)

- Commande : `pnpm test:e2e:gateway`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins groupés sous `extensions/`
- Valeurs par défaut à l’exécution :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le surcoût d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement de bout en bout du gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune clé réelle requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E (navigateur mocké de Control UI)

- Commande : `pnpm test:ui:e2e`
- Configuration : `test/vitest/vitest.ui-e2e.config.ts`
- Fichiers : `ui/src/**/*.e2e.test.ts`
- Portée :
  - Démarre la Control UI Vite
  - Pilote une vraie page Chromium via Playwright
  - Remplace le WebSocket du Gateway par des mocks déterministes dans le navigateur
- Attentes :
  - S’exécute en CI dans le cadre de `pnpm test:e2e`
  - Aucun vrai Gateway, agent ni clé de fournisseur requis
  - La dépendance navigateur doit être présente (`pnpm --dir ui exec playwright install chromium`)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Réutilise un gateway OpenShell local actif
  - Crée un bac à sable à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Sur adhésion uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI locale `openshell` ainsi qu’un démon Docker fonctionnel
  - Nécessite un gateway OpenShell local actif et sa source de configuration
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le bac à sable de test
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou script wrapper non par défaut
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` pour exposer la configuration du gateway enregistré au test isolé
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` pour remplacer l’IP du gateway Docker utilisée par la fixture de politique d’hôte

### Live (fournisseurs réels + modèles réels)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et les tests live de plugins groupés sous `extensions/`
- Valeur par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise les limites de débit
  - Préférer exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions live utilisent les clés d’API déjà exportées et les profils d’authentification préparés.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de configuration/authentification dans un répertoire personnel de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...` et coupe les journaux d’amorçage du Gateway ainsi que le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les journaux de démarrage complets.
- Rotation des clés d’API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format séparé par virgules/points-virgules ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une substitution par test live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture de console de Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception de console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeats de Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Modification du réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs spécifiques au fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests live (touchant au réseau)

Pour la matrice de modèles live, les smokes de backend CLI, les smokes ACP, le
harnais de serveur d’application Codex, et tous les tests live de fournisseurs
média (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média) - ainsi
que la gestion des identifiants pour les exécutions live - consultez
[Tester les suites live](/fr/help/testing-live). Pour la checklist dédiée aux mises à jour et à la
validation des plugins, consultez
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se divisent en deux catégories :

- Exécuteurs de modèles live : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live correspondant aux clés de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local, votre espace de travail et un fichier d’environnement de profil facultatif. Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs live Docker conservent leurs propres plafonds pratiques si nécessaire :
  `test:docker:live-models` utilise par défaut l’ensemble organisé et pris en charge à fort signal, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Définissez `OPENCLAW_LIVE_MAX_MODELS`
  ou les variables d’environnement du Gateway lorsque vous voulez explicitement un plafond plus petit ou une analyse plus large.
- `test:docker:all` construit l’image Docker live une seule fois via `test:docker:live-build`, empaquette OpenClaw une seule fois comme archive npm avec `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image nue est uniquement l’exécuteur Node/Git pour les voies installation/mise à jour/dépendances de plugin ; ces voies montent l’archive préconstruite. L’image fonctionnelle installe la même archive dans `/app` pour les voies de fonctionnalité de l’application construite. Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les plafonds de ressources empêchent les voies live lourdes, d’installation npm et multiservices de toutes démarrer en même temps. Si une seule voie est plus lourde que les plafonds actifs, le planificateur peut quand même la démarrer lorsque le pool est vide, puis la maintient seule en cours d’exécution jusqu’à ce que de la capacité redevienne disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. L’exécuteur effectue un prévol Docker par défaut, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les durées des voies réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces durées pour démarrer les voies plus longues en premier lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des voies sélectionnées, les besoins en paquet/image et les identifiants.
- `Package Acceptance` est la barrière de paquet native GitHub pour « cette archive installable fonctionne-t-elle comme un produit ? ». Elle résout un paquet candidat depuis `source=npm`, `source=ref`, `source=url`, ou `source=artifact`, le téléverse comme `package-under-test`, puis exécute les voies Docker E2E réutilisables contre cette archive exacte au lieu de réempaqueter la référence sélectionnée. Les profils sont ordonnés par étendue : `smoke`, `package`, `product`, et `full`. Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat de paquet/mise à jour/plugin, la matrice de survivance de mise à niveau publiée, les valeurs par défaut de publication et le triage des échecs.
- Les vérifications de construction et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe construit statique depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant répartition importe des dépendances de paquet comme Commander, l’interface de prompt, undici ou la journalisation avant la répartition de commande ; il maintient aussi le segment groupé d’exécution du Gateway sous le budget et rejette les imports statiques de chemins froids connus du Gateway. Le smoke de CLI empaquetée couvre aussi l’aide racine, l’aide d’onboard, l’aide de doctor, l’état, le schéma de configuration et une commande de liste de modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harnais tolère uniquement les lacunes de métadonnées de paquet livré : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de correctifs manquants dans la fixture git dérivée de l’archive, `update.channel` persistant manquant, emplacements hérités des enregistrements d’installation de plugin, persistance manquante des enregistrements d’installation marketplace, et migration des métadonnées de configuration pendant `plugins update`. Pour les paquets après `2026.4.25`, ces chemins sont des échecs stricts.
- Exécuteurs de smoke de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de plus haut niveau.
- Les voies Docker/Bash E2E qui installent l’archive OpenClaw empaquetée via `scripts/lib/openclaw-e2e-instance.sh` plafonnent `npm install` à `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (par défaut `600s` ; définissez `0` pour désactiver l’enveloppe à des fins de débogage).

Les exécuteurs Docker de modèles live montent également en bind uniquement les répertoires d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans modifier le stockage d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais de serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smokes d’observabilité : `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, et `pnpm qa:observability:smoke` sont des voies QA privées de checkout source. Elles ne font intentionnellement pas partie des voies de publication Docker de paquet, car l’archive npm omet QA Lab.
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke d’intégration/canal/agent avec archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement l’archive OpenClaw empaquetée dans Docker, configure OpenAI via une intégration par référence d’environnement ainsi que Telegram par défaut, exécute doctor, et exécute un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke test du parcours utilisateur de release : `pnpm test:docker:release-user-journey` installe globalement le tarball OpenClaw empaqueté dans un home Docker propre, exécute l’onboarding, configure un provider OpenAI simulé, exécute un tour d’agent, installe/désinstalle des plugins externes, configure ClickClack avec une fixture locale, vérifie la messagerie sortante/entrante, redémarre Gateway, puis exécute doctor.
- Smoke test de l’onboarding typé de release : `pnpm test:docker:release-typed-onboarding` installe le tarball empaqueté, pilote `openclaw onboard` via un vrai TTY, configure OpenAI comme provider référencé par variable d’environnement, vérifie qu’aucune clé brute n’est persistée, puis exécute un tour d’agent simulé.
- Smoke test média/mémoire de release : `pnpm test:docker:release-media-memory` installe le tarball empaqueté, vérifie la compréhension d’image depuis une pièce jointe PNG, la sortie de génération d’images compatible OpenAI, le rappel de recherche mémoire, ainsi que la survie du rappel après redémarrage de Gateway.
- Smoke test du parcours utilisateur de mise à niveau de release : `pnpm test:docker:release-upgrade-user-journey` installe par défaut la plus récente base publiée antérieure au tarball candidat, configure l’état provider/plugin/ClickClack sur le package publié, met à niveau vers le tarball candidat, puis réexécute le parcours principal agent/plugin/canal. S’il n’existe aucune base publiée plus ancienne, il réutilise la version candidate. Remplacez la base avec `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke test de la marketplace de plugins de release : `pnpm test:docker:release-plugin-marketplace` installe depuis une marketplace fixture locale, met à jour le plugin installé, le désinstalle, puis vérifie que la CLI du plugin disparaît avec les métadonnées d’installation élaguées.
- Smoke test d’installation de Skill : `pnpm test:docker:skill-install` installe globalement le tarball OpenClaw empaqueté dans Docker, désactive les installations d’archives téléversées dans la configuration, résout le slug de Skill ClawHub actif actuel depuis la recherche, l’installe avec `openclaw skills install`, puis vérifie la Skill installée ainsi que les métadonnées d’origine/verrou `.clawhub`.
- Smoke test de bascule de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement le tarball OpenClaw empaqueté dans Docker, bascule du package `stable` vers le git `dev`, vérifie le canal persisté et le fonctionnement post-mise à jour des plugins, puis rebascule vers le package `stable` et vérifie l’état de mise à jour.
- Smoke test de survie après mise à niveau : `pnpm test:docker:upgrade-survivor` installe le tarball OpenClaw empaqueté par-dessus une fixture sale d’ancien utilisateur avec agents, configuration de canal, listes d’autorisation de plugins, état obsolète de dépendances de plugins, et fichiers d’espace de travail/session existants. Il exécute la mise à jour du package et doctor non interactif sans provider actif ni clés de canal, puis démarre un Gateway local loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/état.
- Smoke test de survie après mise à niveau publiée : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, injecte des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commandes intégrée, valide la configuration résultante, met à jour cette installation publiée vers le tarball candidat, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway local loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz`, et les budgets d’état RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre les bases locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, par exemple `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et d’étendre les fixtures en forme d’issues avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, par exemple `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique de l’installation de plugins OpenClaw externes. Package Acceptance expose ces éléments sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, et `published_upgrade_survivor_scenarios`, résout les jetons de base méta tels que `last-stable-4` ou `all-since-2026.4.23`, et Full Release Validation étend la porte package de release-soak à `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke test du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance du transcript de contexte d’exécution masqué ainsi que la réparation par doctor des branches dupliquées affectées de réécriture de prompt.
- Smoke test d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre courant, l’installe avec `bun install -g` dans un home isolé, puis vérifie que `openclaw infer image providers --json` renvoie les providers d’image groupés au lieu de rester bloqué. Réutilisez un tarball préconstruit avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un seul cache npm entre ses conteneurs root, update et direct-npm. Le smoke test de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers le tarball candidat. Remplacez localement avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications d’installateur non-root conservent un cache npm isolé afin que les entrées de cache possédées par root ne masquent pas le comportement d’installation local à l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement quand la couverture directe de `npm install -g` est nécessaire.
- Smoke test CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, injecte deux agents avec un espace de travail dans un home de conteneur isolé, exécute `agents delete --json`, puis vérifie un JSON valide et le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Smoke test d’instantané CDP navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, puis vérifie que les instantanés de rôle CDP couvrent les URL de liens, les éléments cliquables promus par le curseur, les refs d’iframe et les métadonnées de frame.
- Régression OpenAI Responses web_search avec raisonnement minimal : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` augmente `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma provider et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway injecté + pont stdio + smoke test raw Claude notification-frame) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle OpenClaw (serveur MCP stdio réel + smoke test d’autorisation/refus de profil OpenClaw intégré) : `pnpm test:docker:agent-bundle-mcp-tools` (script : `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Nettoyage Cron/subagent MCP (Gateway réel + nettoyage d’enfant MCP stdio après exécutions cron isolées et subagent ponctuelles) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke test d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, métadonnées de package npm mal formées, refs git mobiles, ClawHub kitchen-sink, mises à jour de marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire package/runtime kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur fixture ClawHub local hermétique.
- Smoke test de mise à jour inchangée de plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test de matrice de cycle de vie de plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe le tarball OpenClaw empaqueté dans un conteneur nu, installe un plugin npm, bascule activation/désactivation, le met à niveau et le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime toujours l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Smoke test de métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre les smoke tests d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hissées, refs git mobiles, fixtures ClawHub, mises à jour de marketplace, et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation de plugin npm suivie en ressources, l’activation, la désactivation, la mise à niveau, la rétrogradation, et la désinstallation avec code manquant.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Quand `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et d’installateur conservent leurs propres Dockerfiles, car ils valident le comportement de package/d’installation plutôt que l’exécution applicative construite partagée.

Les exécuteurs Docker à modèle live montent aussi le checkout actuel en lecture seule et
le préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
runtime légère tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les grands caches locaux uniquement et les sorties de build d’applications comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie `.build` locaux à l’application ou
Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier des artefacts
spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live de Gateway ne démarrent pas
de véritables workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live de Gateway
de cette voie Docker.
`test:docker:openwebui` est un smoke test de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
Définissez `OPENWEBUI_SMOKE_MODE=models` pour les vérifications CI du chemin de release qui doivent s’arrêter
après la connexion à Open WebUI et la découverte du modèle, sans attendre une complétion de modèle
live.
La première exécution peut être sensiblement plus lente, car Docker peut devoir extraire l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette voie attend une clé de modèle live utilisable. Fournissez-la via l’environnement
du processus, des profils d’authentification préparés, ou un `OPENCLAW_PROFILE_FILE` explicite.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
prérempli, démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture de transcriptions, les métadonnées de pièces jointes,
le comportement de la file d’événements live, le routage d’envoi sortant, ainsi que les notifications de canal
et de permissions de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le smoke test valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client spécifique expose par hasard.
`test:docker:agent-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de modèle
live. Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle OpenClaw embarqué,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp`, tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway prérempli avec un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `sessions_spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke test manuel ACP de thread en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il peut être de nouveau nécessaire pour la validation du routage de threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` monté et sourcé avant d’exécuter les tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires de configuration/espace de travail temporaires et aucun montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes à un fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de réexécutions qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke test Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence des docs

Exécutez les vérifications de docs après les modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez aussi vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outils Gateway (OpenAI simulé, vrai Gateway + boucle agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écrit la configuration + auth appliquée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Appel d’outils simulé via le vrai Gateway + boucle agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque les Skills sont listés dans le prompt, l’agent choisit-il la bonne compétence (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, le transfert de l’historique de session et les limites du bac à sable.

Les futures évaluations doivent rester déterministes en priorité :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de Skills et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, garde-fous, injection de prompt).
- Des évaluations live optionnelles (opt-in, gardées par l’environnement) seulement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré se conforme à son
contrat d’interface. Ils parcourent tous les Plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire par défaut `pnpm test` ignore intentionnellement
ces fichiers de smoke test et de jonction partagée ; exécutez explicitement les commandes de contrat
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
- **outbound-payload** - Structure de charge utile de message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des identifiants de thread
- **directory** - API d’annuaire/liste
- **group-policy** - Application de la politique de groupe

### Contrats d’état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes d’état des canaux
- **registry** - Forme du registre de Plugins

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte de Plugins
- **loader** - Chargement de Plugins
- **runtime** - Runtime de fournisseur
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un Plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte de Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez une régression compatible CI si possible (fournisseur simulé/stub, ou capture de la transformation exacte de la forme de requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live restreint et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/relecture de requête fournisseur → test direct des modèles
  - bug de pipeline session/historique/outils Gateway → smoke test Gateway live ou test Gateway simulé compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées de registre (`listSecretTargetRegistryEntries()`), puis affirme que les ids exec à segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les ids de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tester le live](/fr/help/testing-live)
- [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
