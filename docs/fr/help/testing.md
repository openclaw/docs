---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajouter des tests de régression pour les bogues de modèle/fournisseur
    - Déboguer le comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et couverture de chaque test'
title: Tests
x-i18n:
    generated_at: "2026-06-27T17:37:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw dispose de trois suites Vitest (unitaires/intégration, e2e, réelles) et d’un petit ensemble
d’exécuteurs Docker. Ce document est un guide « notre façon de tester » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage).
- Comment les tests réels découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèles/fournisseurs.

<Note>
**La pile QA (qa-lab, qa-channel, voies de transport réelles)** est documentée séparément :

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation) - architecture, surface de commande, création de scénarios.
- [QA matricielle](/fr/concepts/qa-matrix) - référence pour `pnpm openclaw qa matrix`.
- [Tableau de maturité](/fr/maturity/scorecard) - comment les preuves de QA de release soutiennent les décisions de stabilité et de LTS.
- [Canal QA](/fr/channels/qa-channel) - le plugin de transport synthétique utilisé par les scénarios adossés au dépôt.

Cette page couvre l’exécution des suites de test ordinaires et des exécuteurs Docker/Parallels. La section des exécuteurs propres à la QA ci-dessous ([Exécuteurs propres à la QA](#qa-specific-runners)) liste les invocations `qa` concrètes et renvoie aux références ci-dessus.
</Note>

## Démarrage rapide

La plupart du temps :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine généreuse : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées quand vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quand vous touchez aux tests ou voulez davantage de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

## Répertoires temporaires de test

Préférez les helpers partagés dans `test/helpers/temp-dir.ts` pour les répertoires
temporaires appartenant aux tests. Ils rendent la propriété explicite et gardent le nettoyage dans le même
cycle de vie de test :

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Utilisez `makeTempDir(tempDirs, prefix)` et `cleanupTempDirs(tempDirs)` quand un test
possède déjà un tableau ou un ensemble de chemins. Évitez les nouveaux appels `fs.mkdtemp*` bruts dans
les tests sauf si un cas vérifie explicitement le comportement brut des répertoires temporaires. Ajoutez un
commentaire d’autorisation auditables avec une raison concrète quand un test a intentionnellement besoin d’un
répertoire temporaire brut :

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Pour la visibilité de migration, `node scripts/report-test-temp-creations.mjs` signale
la nouvelle création de répertoires temporaires bruts dans les lignes de diff ajoutées sans bloquer les styles
de nettoyage existants. Sa portée de fichier suit intentionnellement la même classification des chemins de test
utilisée par `scripts/changed-lanes.mjs` au lieu de maintenir une heuristique séparée de noms de fichiers
de helpers de test, tout en ignorant l’implémentation du helper partagé elle-même.
`check:changed` exécute ce rapport pour les chemins de test modifiés comme signal CI
informatif uniquement ; les constats sont des annotations d’avertissement GitHub, pas des échecs.

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite réelle (modèles + sondes d’outil/image Gateway) : `pnpm test:live`
- Cibler silencieusement un fichier réel : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Rapports de performance d’exécution : déclenchez `OpenClaw Performance` avec
  `live_openai_candidate=true` pour un vrai tour d’agent `openai/gpt-5.5` ou
  `deep_profile=true` pour les artefacts CPU/tas/trace de Kova. Les exécutions quotidiennes planifiées
  publient les artefacts des voies fournisseur simulé, profilage approfondi et GPT 5.5 vers
  `openclaw/clawgrit-reports` quand `CLAWGRIT_REPORTS_TOKEN` est configuré. Le
  rapport fournisseur simulé inclut aussi les mesures au niveau source du démarrage du Gateway, de la mémoire,
  de la pression plugin, de la boucle répétée hello-loop avec faux modèle et du démarrage CLI.
- Balayage de modèles réels Docker : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent aussi un petit tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lors de l’isolation des échecs fournisseur.
  - Couverture CI : les vérifications quotidiennes `OpenClaw Scheduled Live And E2E Checks` et les vérifications manuelles
    `OpenClaw Release Checks` appellent toutes deux le workflow réel/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des jobs de matrice de modèles réels Docker séparés
    fragmentés par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/release.
- Smoke test de conversation liée Codex native : `pnpm test:docker:live-codex-bind`
  - Exécute une voie réelle Docker contre le chemin app-server Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison plugin native au lieu d’ACP.
- Smoke test du harnais app-server Codex : `pnpm test:docker:live-codex-harness`
  - Exécute des tours d’agent Gateway via le harnais app-server Codex appartenant au plugin,
    vérifie `/codex status` et `/codex models`, et exerce par défaut les sondes image,
    MCP Cron, sous-agent et Guardian. Désactivez la sonde sous-agent avec
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` lors de l’isolation d’autres échecs
    app-server Codex. Pour une vérification sous-agent ciblée, désactivez les autres sondes :
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Cela quitte après la sonde sous-agent sauf si
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` est défini.
- Smoke test d’installation Codex à la demande : `pnpm test:docker:codex-on-demand`
  - Installe l’archive tarball OpenClaw empaquetée dans Docker, exécute l’onboarding par clé API OpenAI,
    et vérifie que le plugin Codex plus la dépendance `@openai/codex`
    ont été téléchargés à la demande dans la racine du projet npm géré.
- Smoke test de dépendance d’outil plugin réel : `pnpm test:docker:live-plugin-tool`
  - Empaquette un plugin de fixture avec une vraie dépendance `slugify`, l’installe via
    `npm-pack:`, vérifie la dépendance sous la racine du projet npm géré,
    puis demande à un modèle OpenAI réel d’appeler l’outil plugin et de renvoyer le slug
    caché.
- Smoke test de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in de précaution renforcée pour la surface de commande de secours du canal de messages.
    Elle exerce `/crestodian status`, met en file une modification persistante de modèle,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke test Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans config avec un faux CLI Claude sur `PATH`
    et vérifie que le repli du planificateur approximatif se traduit en écriture de config typée
    auditée.
- Smoke test Docker de premier lancement Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre depuis un répertoire d’état OpenClaw vide, vérifie le point d’entrée Crestodian
    moderne d’onboarding, applique les écritures setup/modèle/agent/plugin Discord + SecretRef,
    valide la config et vérifie les entrées d’audit. Le même chemin de configuration Ring 0
    est aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke test de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription assistant stocke `usage.cost` normalisé.

<Tip>
Quand vous n’avez besoin que d’un cas en échec, préférez restreindre les tests réels via les variables d’environnement de liste d’autorisation décrites ci-dessous.
</Tip>

## Exécuteurs propres à la QA

Ces commandes se placent à côté des suites de test principales quand vous avez besoin du réalisme de QA-lab :

La CI exécute QA Lab dans des workflows dédiés. La parité agentique est imbriquée sous
`QA-Lab - All Lanes` et la validation de release, pas dans un workflow PR autonome.
La validation large doit utiliser `Full Release Validation` avec
`rerun_group=qa-parity` ou le groupe QA des release-checks. Les vérifications de release
stables/par défaut gardent le trempage exhaustif réel/Docker derrière `run_release_soak=true` ; le
profil `full` force le trempage. `QA-Lab - All Lanes`
s’exécute chaque nuit sur `main` et depuis un déclenchement manuel avec la voie de parité simulée, la voie
Matrix réelle, la voie Telegram réelle gérée par Convex et la voie Discord réelle gérée par Convex
comme jobs parallèles. La QA planifiée et les vérifications de release passent explicitement
`--profile fast` à Matrix, tandis que l’entrée par défaut du CLI Matrix et du workflow manuel
reste `all` ; le déclenchement manuel peut fragmenter `all` en jobs `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`. `OpenClaw Release
Checks` exécute la parité plus les voies Matrix rapide et Telegram avant l’approbation de release,
en utilisant `mock-openai/gpt-5.5` pour les vérifications de transport de release afin qu’elles restent
déterministes et évitent le démarrage normal des plugins fournisseur. Ces gateways de transport réels
désactivent la recherche en mémoire ; le comportement mémoire reste couvert par les suites de parité
QA.

Les fragments de média réels de release complète utilisent
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, qui contient déjà
`ffmpeg` et `ffprobe`. Les fragments de modèles/backends réels Docker utilisent l’image partagée
`ghcr.io/openclaw/openclaw-live-test:<sha>` construite une fois par commit sélectionné,
puis la récupèrent avec `OPENCLAW_SKIP_DOCKER_BUILD=1` au lieu de reconstruire
dans chaque fragment.

- `pnpm openclaw qa suite`
  - Exécute les scénarios QA adossés au dépôt directement sur l’hôte.
  - Écrit les artefacts de premier niveau `qa-evidence.json`, `qa-suite-summary.json` et
    `qa-suite-report.md` pour l’ensemble de scénarios sélectionné, y compris les
    sélections de scénarios de flux mixtes, Vitest et Playwright.
  - Lorsqu’il est lancé par `pnpm openclaw qa run --qa-profile <profile>`, intègre la
    fiche d’évaluation du profil de taxonomie sélectionné dans le même `qa-evidence.json`.
    `smoke-ci` écrit des preuves allégées, ce qui définit `evidenceMode: "slim"` et omet
    `execution` pour chaque entrée. `release` couvre la tranche organisée de préparation à la publication ;
    `all` sélectionne chaque catégorie de maturité active et est destiné aux déclenchements explicites du workflow
    Profile Evidence QA lorsqu’un artefact complet de fiche d’évaluation est
    nécessaire.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancien couloir série.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    des fixtures et des protocoles simulés sans remplacer le couloir
    `mock-openai` conscient des scénarios.
- `pnpm openclaw qa coverage --match <query>`
  - Recherche dans les ID de scénarios, titres, surfaces, ID de couverture, références docs, références code,
    plugins et exigences fournisseur, puis affiche les cibles de suite correspondantes.
  - Utilisez cette commande avant une exécution QA Lab lorsque vous connaissez le comportement ou le chemin de fichier touché
    mais pas le plus petit scénario. Elle est uniquement consultative ; choisissez toujours la preuve mock,
    live, Multipass, Matrix ou transport à partir du comportement modifié.
- `pnpm test:plugins:kitchen-sink-live`
  - Exécute le parcours intensif live du plugin OpenAI Kitchen Sink via QA Lab. Il
    installe le package externe Kitchen Sink, vérifie l’inventaire de surface du SDK de plugin,
    sonde `/healthz` et `/readyz`, enregistre les preuves CPU/RSS du Gateway,
    exécute un tour OpenAI live et vérifie les diagnostics adversariaux.
    Nécessite une authentification OpenAI live comme `OPENAI_API_KEY`. Dans les sessions Testbox hydratées,
    il source automatiquement le profil d’authentification live Testbox lorsque l’aide
    `openclaw-testbox-env` est présente.
- `pnpm test:gateway:cpu-scenarios`
  - Exécute le banc de démarrage du Gateway plus un petit pack de scénarios QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) et écrit un résumé combiné d’observation CPU
    sous `.artifacts/gateway-cpu-scenarios/`.
  - Signale par défaut uniquement les observations de CPU élevé soutenu (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), afin que les courtes pointes de démarrage soient enregistrées comme métriques
    sans ressembler à la régression de Gateway bloqué pendant plusieurs minutes.
  - Utilise les artefacts `dist` construits ; exécutez d’abord un build lorsque le checkout ne dispose pas
    déjà d’une sortie runtime fraîche.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport et le résumé QA normaux plus les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour un travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm tarball depuis le checkout actuel, l’installe globalement dans
    Docker, exécute l’onboarding non interactif par clé API OpenAI, configure Telegram
    par défaut, vérifie que le runtime de plugin empaqueté se charge sans réparation de dépendances
    au démarrage, exécute doctor, puis exécute un tour d’agent local contre un
    endpoint OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter le même couloir d’installation empaquetée
    avec Discord.
- `pnpm test:docker:session-runtime-context`
  - Exécute un smoke Docker déterministe de l’application construite pour les transcriptions de contexte runtime
    intégré. Il vérifie que le contexte runtime OpenClaw masqué est persisté comme un
    message personnalisé non affiché au lieu de fuiter dans le tour utilisateur visible,
    puis injecte une session JSONL cassée affectée et vérifie que
    `openclaw doctor --fix` la réécrit vers la branche active avec une sauvegarde.
- `pnpm test:docker:npm-telegram-live`
  - Installe un candidat de package OpenClaw dans Docker, exécute l’onboarding du package installé,
    configure Telegram via la CLI installée, puis réutilise le couloir QA Telegram live
    avec ce package installé comme Gateway SUT.
  - Le wrapper monte uniquement la source du harnais `qa-lab` depuis le checkout ; le
    package installé possède `dist`, `openclaw/plugin-sdk` et le runtime des plugins groupés,
    afin que le couloir ne mélange pas les plugins du checkout actuel dans le package
    testé.
  - Par défaut, utilise `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` ; définissez
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` pour tester à la place une archive tarball locale résolue
    plutôt que d’installer depuis le registre.
  - Émet par défaut des mesures RTT répétées dans `qa-evidence.json` avec
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Remplacez
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` pour ajuster l’exécution RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` accepte une liste séparée par des virgules
    d’ID de vérification QA Telegram à échantillonner ; lorsqu’il n’est pas défini, la vérification
    par défaut compatible RTT est `telegram-mentioned-message-reply`.
  - Utilise les mêmes identifiants d’environnement Telegram ou source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/publication, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents dans CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - Le wrapper valide sur l’hôte l’environnement des identifiants Telegram ou Convex avant
    le travail Docker de build/installation. Définissez `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    uniquement lorsque vous déboguez délibérément la configuration préalable aux identifiants.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé uniquement pour ce couloir. Lorsque des identifiants Convex
    sont sélectionnés et qu’aucun rôle n’est défini, le wrapper utilise `ci` dans CI et
    `maintainer` hors CI.
  - GitHub Actions expose ce couloir comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Il ne s’exécute pas à la fusion. Le workflow utilise l’environnement
    `qa-live-shared` et les baux d’identifiants CI Convex.
- GitHub Actions expose également `Package Acceptance` pour une preuve produit en exécution latérale
  contre un package candidat. Il accepte une référence de confiance, une spécification npm publiée,
  une URL HTTPS de tarball plus SHA-256, ou un artefact tarball provenant d’une autre exécution, téléverse
  le `openclaw-current.tgz` normalisé comme `package-under-test`, puis exécute le
  planificateur E2E Docker existant avec des profils de couloir smoke, package, product, full ou custom.
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

- La preuve par URL exacte de tarball exige un condensat et utilise la politique de sécurité des URL publiques :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Les miroirs de tarball d’entreprise/privés utilisent une politique explicite de source de confiance :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lit `.github/package-trusted-sources.json` depuis la référence de workflow de confiance et n’accepte pas d’identifiants d’URL ni de contournement de réseau privé en entrée de workflow. Si la politique nommée déclare une authentification bearer, configurez le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- La preuve par artefact télécharge un artefact tarball depuis une autre exécution Actions :

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empaquète et installe le build OpenClaw actuel dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les channels/plugins groupés via des modifications de configuration.
  - Vérifie que la découverte de configuration laisse absents les plugins téléchargeables non configurés,
    que la première réparation doctor configurée installe explicitement chaque plugin téléchargeable
    manquant, et qu’un second redémarrage n’exécute pas de réparation de dépendances
    masquée.
  - Installe également une référence npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour du candidat
    nettoie les débris de dépendances de plugins hérités sans réparation postinstall côté
    harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation empaquetée sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package de référence demandé, puis exécute
    la commande `openclaw update` installée dans le même invité et vérifie la
    version installée, l’état de mise à jour, la disponibilité du Gateway et un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows` ou `--platform linux` pendant
    l’itération sur un invité. Utilisez `--json` pour le chemin de l’artefact de résumé et
    l’état par couloir.
  - Le couloir OpenAI utilise `openai/gpt-5.5` par défaut pour la preuve live de tour d’agent.
    Passez `--model <provider/model>` ou définissez
    `OPENCLAW_PARALLELS_OPENAI_MODEL` lorsque vous validez délibérément un autre
    modèle OpenAI.
  - Encadrez les longues exécutions locales avec un délai d’expiration hôte afin que les blocages de transport Parallels ne puissent pas
    consommer le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit les journaux de couloirs imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log` ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans doctor post-mise à jour et le travail
    de mise à jour de package sur un invité froid ; cela reste sain lorsque le journal de débogage npm
    imbriqué progresse.
  - N’exécutez pas ce wrapper agrégé en parallèle avec des couloirs smoke Parallels
    macOS, Windows ou Linux individuels. Ils partagent l’état de VM et peuvent entrer en collision sur
    la restauration de snapshot, la distribution de package ou l’état du Gateway invité.
  - La preuve post-mise à jour exécute la surface normale des plugins groupés, car
    les façades de capacité comme la parole, la génération d’images et la compréhension
    des médias sont chargées via les API runtime groupées même lorsque le tour d’agent
    lui-même vérifie uniquement une réponse textuelle simple.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur de fournisseur AIMock local pour les tests
    de fumée directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker. Checkout source uniquement - les installations empaquetées n’incluent pas `qa-lab`.
  - CLI complète, catalogue de profils/scénarios, variables d’environnement et disposition des artefacts : [QA Matrix](/fr/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé en utilisant les jetons du bot pilote et du bot SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id du groupe doit être l’identifiant numérique de conversation Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants partagés mutualisés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour opter pour des baux mutualisés.
  - Les valeurs par défaut couvrent canary, le filtrage des mentions, l’adressage des commandes, `/status`, les réponses bot-à-bot mentionnées et les réponses aux commandes natives du noyau. Les valeurs par défaut de `mock-openai` couvrent aussi les régressions déterministes de chaîne de réponses et de diffusion en continu du message final Telegram. Utilisez `--list-scenarios` pour les sondes facultatives comme `session_status`.
  - Quitte avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot-à-bot stable, activez Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot pilote peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et `qa-evidence.json` sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT depuis la requête d’envoi du pilote jusqu’à la réponse SUT observée.

`Mantis Telegram Live` est le wrapper de preuves PR autour de cette voie. Il exécute la
référence candidate avec des identifiants Telegram loués via Convex, affiche le paquet de rapport/preuves QA
expurgé dans un navigateur de bureau Crabbox, enregistre une preuve MP4,
génère un GIF rogné sur le mouvement, téléverse le paquet d’artefacts et publie des preuves PR
inline via la Mantis GitHub App lorsque `pr_number` est défini. Les mainteneurs peuvent
le démarrer depuis l’interface Actions via `Mantis Scenario` (`scenario_id:
telegram-live`) ou directement depuis un commentaire de pull request :

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` est le wrapper agentique natif Telegram Desktop
avant/après pour la preuve visuelle de PR. Démarrez-le depuis l’interface Actions avec
des `instructions` libres, via `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), ou depuis un commentaire de PR :

```text
@openclaw-mantis telegram desktop proof
```

L’agent Mantis lit la PR, décide quel comportement visible dans Telegram prouve le
changement, exécute la voie de preuve Crabbox Telegram Desktop avec utilisateur réel sur les références de base et
candidate, itère jusqu’à ce que les GIF natifs soient utiles, écrit un manifeste
`motionPreview` apparié et publie le même tableau de GIF à 2 colonnes via la
Mantis GitHub App lorsque `pr_number` est défini.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Loue ou réutilise un bureau Linux Crabbox, installe Telegram Desktop natif, configure OpenClaw avec un jeton de bot SUT Telegram loué, démarre le Gateway et enregistre des preuves par capture d’écran/MP4 depuis le bureau VNC visible.
  - Utilise par défaut `--credential-source convex` afin que les workflows n’aient besoin que du secret du courtier Convex. Utilisez `--credential-source env` avec les mêmes variables `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - Telegram Desktop a toujours besoin d’une connexion/d’un profil utilisateur. Le jeton de bot configure seulement OpenClaw. Utilisez `--telegram-profile-archive-env <name>` pour une archive de profil `.tgz` en base64, ou utilisez `--keep-lease` et connectez-vous manuellement via VNC une fois.
  - Écrit `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` et `telegram-desktop-builder.mp4` sous le répertoire de sortie.

Les voies de transport live partagent un contrat standard unique afin que les nouveaux transports ne divergent pas ; la matrice de couverture par voie se trouve dans [vue d’ensemble QA → Couverture des transports live](/fr/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` est la large suite synthétique et ne fait pas partie de cette matrice.

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
la QA de transport live, QA lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie des heartbeats pour ce
bail pendant l’exécution de la voie, puis libère le bail à l’arrêt. Le nom de section est antérieur à la
prise en charge de Discord, Slack et WhatsApp ; le contrat de bail est partagé entre les types.

Échafaudage de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut env : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, sinon `maintainer`)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (valeur par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (valeur par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (valeur par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (valeur par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (valeur par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en local loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajouter/supprimer/lister le pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du courtier,
le préfixe d’endpoint, le délai d’expiration HTTP et l’accessibilité admin/list sans afficher les
valeurs secrètes. Utilisez `--json` pour une sortie lisible par machine dans les scripts et les utilitaires
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
- `groupId` doit être une chaîne d’identifiant numérique de conversation Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

Forme du payload pour le type utilisateur réel Telegram :

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` et `telegramApiId` doivent être des chaînes numériques.
- `tdlibArchiveSha256` et `desktopTdataArchiveSha256` doivent être des chaînes hexadécimales SHA-256.
- `kind: "telegram-user"` est réservé au workflow de preuve Mantis Telegram Desktop. Les voies génériques QA Lab ne doivent pas l’acquérir.

Payloads multicanaux validés par le courtier :

- Discord : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Les voies Slack peuvent aussi louer depuis le pool, mais la validation des payloads Slack vit actuellement
dans le runner QA Slack plutôt que dans le courtier. Utilisez
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
pour les lignes Slack.

### Ajouter un canal à QA

L’architecture et les noms des helpers de scénario pour les nouveaux adaptateurs de canal se trouvent dans [vue d’ensemble QA → Ajouter un canal](/fr/concepts/qa-e2e-automation#adding-a-channel). Le seuil minimal : implémenter le runner de transport sur la couture hôte `qa-lab` partagée, déclarer `qaRunners` dans le manifeste du plugin, monter comme `openclaw qa <runner>` et rédiger les scénarios sous `qa/scenarios/`.

## Suites de tests (quoi s’exécute où)

Pensez aux suites comme à un « réalisme croissant » (et à une instabilité/un coût croissants) :

### Unitaires / intégration (par défaut)

- Commande : `pnpm test`
- Config : les exécutions non ciblées utilisent l’ensemble de shards `vitest.full-*.config.ts` et peuvent développer les shards multiprojets en configs par projet pour la planification parallèle
- Fichiers : inventaires noyau/unitaires sous `src/**/*.test.ts`, `packages/**/*.test.ts` et `test/**/*.test.ts` ; les tests unitaires UI s’exécutent dans le shard dédié `unit-ui`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration in-process (authentification du Gateway, routage, outillage, analyse, config)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
  - Les tests du résolveur et du chargeur de surface publique doivent prouver le comportement de fallback large `api.js` et
    `runtime-api.js` avec de petites fixtures de plugin générées, pas avec
    de vraies API source de plugin groupé. Les chargements réels d’API de plugin appartiennent aux
    suites de contrat/intégration détenues par les plugins.

Politique de dépendances natives :

- Les installations de test par défaut ignorent les builds natifs optionnels Discord opus. La voix Discord utilise `libopus-wasm` groupé, et `@discordjs/opus` reste désactivé dans `allowBuilds` afin que les tests locaux et les voies Testbox ne compilent pas l’addon natif.
- Comparez les performances natives opus dans le dépôt de benchmark `libopus-wasm`, pas dans les boucles d’installation/test OpenClaw par défaut. Ne définissez pas `@discordjs/opus` sur `true` dans le `allowBuilds` par défaut ; cela force des boucles d’installation/test sans rapport à compiler du code natif.

<AccordionGroup>
  <Accordion title="Projets, shards et voies limitées">

    - Un `pnpm test` non ciblé exécute douze configurations de lots plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul énorme processus natif du projet racine. Cela réduit le pic RSS sur les machines chargées et évite que le travail auto-reply/extension prive de ressources des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle de surveillance multi-lots n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichiers/répertoires via les voies limitées au périmètre concerné, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût complet de démarrage du projet racine.
    - `pnpm test:changed` développe par défaut les chemins git modifiés en voies peu coûteuses et limitées au périmètre concerné : modifications directes de tests, fichiers frères `*.test.ts`, mappages explicites de sources et dépendants locaux du graphe d’import. Les modifications de configuration/setup/package ne déclenchent pas d’exécution large des tests, sauf si vous utilisez explicitement `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` est la porte de vérification locale intelligente normale pour les travaux étroits. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, outillage Docker live et outillage, puis exécute les commandes de typecheck, lint et garde correspondantes. Elle n’exécute pas les tests Vitest ; appelez `pnpm test:changed` ou un `pnpm test <target>` explicite pour la preuve de test. Les montées de version limitées aux métadonnées de release exécutent des vérifications ciblées version/config/dépendance racine, avec une garde qui rejette les modifications de package en dehors du champ de version de niveau supérieur.
    - Les modifications du harnais Docker ACP live exécutent des vérifications ciblées : syntaxe shell pour les scripts d’authentification Docker live et simulation du planificateur Docker live. Les modifications de `package.json` ne sont incluses que lorsque le diff est limité à `scripts["test:docker:live-*"]` ; les modifications de dépendance, d’export, de version et d’autres surfaces de package utilisent toujours les gardes plus larges.
    - Les tests unitaires à import léger provenant des agents, commandes, plugins, assistants auto-reply, `plugin-sdk` et zones similaires d’utilitaires purs passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers avec état ou fortement liés au runtime restent sur les voies existantes.
    - Certains fichiers sources d’assistants `plugin-sdk` et `commands` mappent aussi les exécutions en mode modifié vers des tests frères explicites dans ces voies légères, afin que les modifications d’assistants évitent de relancer toute la suite lourde de ce répertoire.
    - `auto-reply` dispose de compartiments dédiés pour les assistants core de niveau supérieur, les tests d’intégration `reply.*` de niveau supérieur et le sous-arbre `src/auto-reply/reply/**`. La CI divise en outre le sous-arbre reply en lots agent-runner, dispatch et commands/state-routing, afin qu’un compartiment lourd en imports ne possède pas toute la fin d’exécution Node.
    - La CI normale PR/main ignore volontairement le balayage par lots des extensions et le lot `agentic-plugins` réservé aux releases. La validation complète de release déclenche le workflow enfant séparé `Plugin Prerelease` pour ces suites lourdes en plugins/extensions sur les candidates de release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte runtime de compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions ciblées d’assistants pour les limites de routage et de normalisation pures.
    - Gardez les suites d’intégration de l’exécuteur intégré en bonne santé :
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` et
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les ids limités au périmètre concerné et le comportement de compaction circulent toujours dans les vrais chemins `run.ts` / `compact.ts` ; les tests d’assistants seuls ne remplacent pas suffisamment ces chemins d’intégration.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - La configuration Vitest de base utilise `threads` par défaut.
    - La configuration Vitest partagée fixe `isolate: false` et utilise l’exécuteur non isolé dans les projets racine, e2e et configurations live.
    - La voie UI racine conserve son setup `jsdom` et son optimiseur, mais s’exécute elle aussi sur l’exécuteur non isolé partagé.
    - Chaque lot `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute par défaut `--no-maglev` aux processus Node enfants de Vitest afin de réduire le brassage de compilation V8 pendant les grandes exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le comportement V8 standard.
    - `scripts/run-vitest.mjs` termine les exécutions Vitest explicites hors surveillance après 5 minutes sans sortie stdout ni stderr. Définissez `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` pour désactiver le chien de garde lors d’une investigation volontairement silencieuse.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` affiche les voies architecturales déclenchées par un diff.
    - Le hook pre-commit se limite au formatage. Il remet en staging les fichiers formatés et n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant la remise ou le push lorsque vous avez besoin de la porte de vérification locale intelligente.
    - `pnpm test:changed` passe par défaut par des voies peu coûteuses et limitées au périmètre concerné. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque l’agent décide qu’une modification de harnais, de configuration, de package ou de contrat a réellement besoin d’une couverture Vitest plus large.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec un plafond de workers plus élevé.
    - L’auto-ajustement local des workers est volontairement conservateur et se réduit lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest simultanées causent moins de dégâts par défaut.
    - La configuration Vitest de base marque les fichiers de projets/config comme `forceRerunTriggers` afin que les relances en mode modifié restent correctes lorsque le câblage des tests change.
    - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` active le rapport des durées d’import Vitest ainsi que la sortie de ventilation des imports.
    - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
    - Les données de durée des lots sont écrites dans `.artifacts/vitest-shard-timings.json`. Les exécutions sur configuration complète utilisent le chemin de configuration comme clé ; les lots CI avec motif d’inclusion ajoutent le nom du lot afin que les lots filtrés puissent être suivis séparément.
    - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les imports de démarrage, gardez les dépendances lourdes derrière une jointure locale étroite `*.runtime.ts` et moquez directement cette jointure au lieu d’importer en profondeur des assistants runtime uniquement pour les transmettre à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le `test:changed` routé au chemin natif du projet racine pour ce diff committé et affiche le temps mural ainsi que le RSS maximal macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre sale actuel en acheminant la liste des fichiers modifiés via `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour les surcoûts de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+tas de l’exécuteur pour la suite unitaire avec le parallélisme par fichier désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Périmètre :
  - Démarre un vrai Gateway loopback avec les diagnostics activés par défaut
  - Envoie une activité synthétique de messages gateway, mémoire et charges utiles volumineuses via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (agrégat du dépôt)

- Commande : `pnpm test:e2e`
- Périmètre :
  - Exécute la voie E2E de smoke du gateway
  - Exécute la voie E2E navigateur simulée de la Control UI
- Attentes :
  - Compatible CI et sans clé
  - Nécessite l’installation de Playwright Chromium

### E2E (smoke gateway)

- Commande : `pnpm test:e2e:gateway`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` et tests E2E de plugins groupés sous `extensions/`
- Valeurs runtime par défaut :
  - Utilise les `threads` Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le surcoût d’E/S console.
- Surcharges utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Périmètre :
  - Comportement gateway multi-instance de bout en bout
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsque la voie est activée dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E (navigateur simulé Control UI)

- Commande : `pnpm test:ui:e2e`
- Configuration : `test/vitest/vitest.ui-e2e.config.ts`
- Fichiers : `ui/src/**/*.e2e.test.ts`
- Périmètre :
  - Démarre la Control UI Vite
  - Pilote une vraie page Chromium via Playwright
  - Remplace le WebSocket du Gateway par des mocks déterministes dans le navigateur
- Attentes :
  - S’exécute en CI dans le cadre de `pnpm test:e2e`
  - Aucun vrai Gateway, agent ni clé fournisseur requis
  - La dépendance navigateur doit être présente (`pnpm --dir ui exec playwright install chromium`)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Périmètre :
  - Réutilise un gateway OpenShell local actif
  - Crée un bac à sable depuis un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exec SSH
  - Vérifie le comportement de système de fichiers canonique distant via le pont fs du bac à sable
- Attentes :
  - Activation explicite uniquement ; ne fait pas partie de l’exécution `pnpm test:e2e` par défaut
  - Nécessite une CLI locale `openshell` ainsi qu’un démon Docker fonctionnel
  - Nécessite un gateway OpenShell local actif et sa source de configuration
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le bac à sable de test
- Surcharges utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` pour exposer la configuration du gateway enregistré au test isolé
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` pour remplacer l’IP de gateway Docker utilisée par le fixture de politique hôte

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests en direct de plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Non stable en CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l’argent / utilise les limites de débit
  - Préférer l’exécution de sous-ensembles restreints plutôt que « tout »
- Les exécutions en direct utilisent les clés API déjà exportées et les profils d’authentification préparés.
- Par défaut, les exécutions en direct isolent toujours `HOME` et copient le matériel de configuration/authentification dans un répertoire personnel de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests en direct utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...` et masque les journaux d’amorçage du Gateway/le bavardage Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous souhaitez récupérer les journaux de démarrage complets.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou une substitution par exécution en direct via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie de progression/heartbeat :
  - Les suites en direct émettent désormais des lignes de progression vers stderr afin que les longs appels aux fournisseurs soient visiblement actifs même lorsque la capture de la console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception de la console Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions en direct.
  - Ajustez les heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les heartbeats de Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Modification du réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs propres à un fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests en direct (avec accès réseau)

Pour la matrice de modèles en direct, les validations rapides du backend CLI, les validations rapides ACP, le harnais du serveur d’application Codex et tous les tests en direct des fournisseurs de médias (Deepgram, BytePlus, ComfyUI, image, musique, vidéo, harnais média) - ainsi que la gestion des identifiants pour les exécutions en direct - consultez [Tester les suites en direct](/fr/help/testing-live). Pour la checklist dédiée de mise à jour et de validation des plugins, consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs de modèles en direct : `test:docker:live-models` et `test:docker:live-gateway` exécutent uniquement leur fichier en direct correspondant aux clés de profil dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local, l’espace de travail et le fichier d’environnement de profil facultatif. Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker en direct conservent leurs propres limites pratiques lorsque nécessaire :
  `test:docker:live-models` utilise par défaut l’ensemble organisé et pris en charge à fort signal, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Définissez `OPENCLAW_LIVE_MAX_MODELS`
  ou les variables d’environnement Gateway lorsque vous souhaitez explicitement une limite plus petite ou une analyse plus large.
- `test:docker:all` construit l’image Docker en direct une fois via `test:docker:live-build`, empaquette OpenClaw une fois sous forme de tarball npm via `scripts/package-openclaw-for-docker.mjs`, puis construit/réutilise deux images `scripts/e2e/Dockerfile`. L’image minimale n’est que l’exécuteur Node/Git pour les voies d’installation/mise à jour/dépendances de plugins ; ces voies montent le tarball préconstruit. L’image fonctionnelle installe le même tarball dans `/app` pour les voies de fonctionnalité de l’application compilée. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. L’agrégat utilise un planificateur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que les limites de ressources empêchent les voies lourdes en direct, d’installation npm et multiservices de démarrer toutes en même temps. Si une seule voie est plus lourde que les limites actives, le planificateur peut tout de même la démarrer lorsque le pool est vide, puis la laisse s’exécuter seule jusqu’à ce que de la capacité soit à nouveau disponible. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` uniquement lorsque l’hôte Docker dispose de plus de marge. L’exécuteur effectue par défaut une vérification préalable Docker, supprime les conteneurs OpenClaw E2E obsolètes, affiche l’état toutes les 30 secondes, stocke les durées des voies réussies dans `.artifacts/docker-tests/lane-timings.json` et utilise ces durées pour démarrer les voies les plus longues en premier lors des exécutions suivantes. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker, ou `node scripts/test-docker-all.mjs --plan-json` pour afficher le plan CI des voies sélectionnées, les besoins en package/image et les identifiants.
- `Package Acceptance` est la barrière de package native GitHub pour « ce tarball installable fonctionne-t-il comme un produit ? » Elle résout un package candidat depuis `source=npm`, `source=ref`, `source=url` ou `source=artifact`, l’envoie comme `package-under-test`, puis exécute les voies Docker E2E réutilisables contre ce tarball exact au lieu de réempaqueter la ref sélectionnée. Les profils sont ordonnés par couverture : `smoke`, `package`, `product` et `full`. Consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins) pour le contrat package/mise à jour/plugin, la matrice de survivance des mises à niveau publiées, les valeurs par défaut de publication et le triage des échecs.
- Les vérifications de build et de publication exécutent `scripts/check-cli-bootstrap-imports.mjs` après tsdown. Le garde parcourt le graphe statique compilé depuis `dist/entry.js` et `dist/cli/run-main.js` et échoue si le démarrage avant distribution importe des dépendances de package telles que Commander, l’interface d’invite, undici ou la journalisation avant la distribution de commande ; il maintient aussi le fragment d’exécution du Gateway groupé sous le budget et rejette les imports statiques de chemins Gateway froids connus. La validation rapide de la CLI empaquetée couvre aussi l’aide racine, l’aide d’onboarding, l’aide de doctor, status, le schéma de configuration et une commande de liste des modèles.
- La compatibilité héritée de Package Acceptance est plafonnée à `2026.4.25` (`2026.4.25-beta.*` inclus). Jusqu’à cette limite, le harnais tolère uniquement les lacunes de métadonnées de package expédié : entrées d’inventaire QA privées omises, `gateway install --wrapper` manquant, fichiers de patch manquants dans la fixture git dérivée du tarball, `update.channel` persistant manquant, emplacements hérités des enregistrements d’installation de plugins, persistance manquante des enregistrements d’installation de la marketplace et migration des métadonnées de configuration pendant `plugins update`. Pour les packages après `2026.4.25`, ces chemins sont des échecs stricts.
- Exécuteurs de validation rapide de conteneurs : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.
- Les voies Docker/Bash E2E qui installent le tarball OpenClaw empaqueté via `scripts/lib/openclaw-e2e-instance.sh` plafonnent `npm install` à `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (par défaut `600s` ; définissez `0` pour désactiver l’enveloppe à des fins de débogage).

Les exécuteurs Docker de modèles en direct montent aussi uniquement les répertoires d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans modifier le stockage d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Validation rapide de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec une couverture stricte Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` et `pnpm test:docker:live-acp-bind:opencode`)
- Validation rapide du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Validation rapide du harnais du serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Validations rapides d’observabilité : `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` et `pnpm qa:observability:smoke` sont des voies privées QA de checkout source. Elles ne font intentionnellement pas partie des voies de publication Docker de package, car le tarball npm omet QA Lab.
- Validation rapide Open WebUI en direct : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Validation rapide onboarding/canal/agent du tarball npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement le tarball OpenClaw empaqueté dans Docker, configure OpenAI via l’onboarding par référence d’environnement ainsi que Telegram par défaut, exécute doctor, puis exécute un tour d’agent OpenAI simulé. Réutilisez un tarball préconstruit avec `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Test smoke du parcours utilisateur de version : `pnpm test:docker:release-user-journey` installe globalement le tarball OpenClaw empaqueté dans un répertoire personnel Docker propre, exécute l’onboarding, configure un fournisseur OpenAI simulé, exécute un tour d’agent, installe/désinstalle des Plugins externes, configure ClickClack avec une fixture locale, vérifie la messagerie sortante/entrante, redémarre Gateway et exécute doctor.
- Test smoke de l’onboarding typé de version : `pnpm test:docker:release-typed-onboarding` installe le tarball empaqueté, pilote `openclaw onboard` via un vrai TTY, configure OpenAI comme fournisseur env-ref, vérifie qu’aucune clé brute n’est persistée, et exécute un tour d’agent simulé.
- Test smoke média/mémoire de version : `pnpm test:docker:release-media-memory` installe le tarball empaqueté, vérifie la compréhension d’image depuis une pièce jointe PNG, la sortie de génération d’image compatible OpenAI, le rappel de recherche mémoire, et la survie du rappel après redémarrage de Gateway.
- Test smoke du parcours utilisateur de mise à niveau de version : `pnpm test:docker:release-upgrade-user-journey` installe par défaut la dernière base publiée plus ancienne que le tarball candidat, configure l’état fournisseur/Plugin/ClickClack sur le paquet publié, met à niveau vers le tarball candidat, puis réexécute le parcours principal agent/Plugin/canal. S’il n’existe aucune base publiée plus ancienne, il réutilise la version candidate. Remplacez la base avec `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Test smoke du marketplace de Plugins de version : `pnpm test:docker:release-plugin-marketplace` installe depuis un marketplace de fixture locale, met à jour le Plugin installé, le désinstalle, et vérifie que la CLI du Plugin disparaît avec les métadonnées d’installation supprimées.
- Test smoke d’installation de Skills : `pnpm test:docker:skill-install` installe globalement le tarball OpenClaw empaqueté dans Docker, désactive les installations d’archives téléversées dans la configuration, résout le slug de Skill ClawHub actif courant depuis la recherche, l’installe avec `openclaw skills install`, et vérifie la Skill installée ainsi que les métadonnées d’origine/verrouillage `.clawhub`.
- Test smoke de changement de canal de mise à jour : `pnpm test:docker:update-channel-switch` installe globalement le tarball OpenClaw empaqueté dans Docker, bascule du paquet `stable` vers git `dev`, vérifie le canal persisté et le fonctionnement post-mise à jour des Plugins, puis revient au paquet `stable` et vérifie l’état de mise à jour.
- Test smoke de survivance de mise à niveau : `pnpm test:docker:upgrade-survivor` installe le tarball OpenClaw empaqueté par-dessus une fixture d’ancien utilisateur sale avec agents, configuration de canal, listes d’autorisation de Plugins, état obsolète des dépendances de Plugins, et fichiers d’espace de travail/session existants. Il exécute la mise à jour de paquet ainsi que doctor en mode non interactif sans fournisseur actif ni clés de canal, puis démarre un Gateway en loopback et vérifie la préservation de la configuration/de l’état ainsi que les budgets de démarrage/état.
- Test smoke publié de survivance de mise à niveau : `pnpm test:docker:published-upgrade-survivor` installe `openclaw@latest` par défaut, amorce des fichiers réalistes d’utilisateur existant, configure cette base avec une recette de commandes intégrée, valide la configuration résultante, met à jour cette installation publiée vers le tarball candidat, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en loopback et vérifie les intentions configurées, la préservation de l’état, le démarrage, `/healthz`, `/readyz`, et les budgets d’état RPC. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, demandez au planificateur agrégé d’étendre des bases locales exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` telles que `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, et étendez des fixtures de forme issue avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` telles que `reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour la réparation automatique d’installation de Plugins OpenClaw externes. Package Acceptance expose ces valeurs sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, résout des jetons de base méta tels que `last-stable-4` ou `all-since-2026.4.23`, et Full Release Validation étend la porte de paquet release-soak à `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Test smoke du contexte d’exécution de session : `pnpm test:docker:session-runtime-context` vérifie la persistance du transcript de contexte d’exécution masqué ainsi que la réparation par doctor des branches dupliquées affectées de réécriture de prompt.
- Test smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre courant, l’installe avec `bun install -g` dans un répertoire personnel isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de rester bloqué. Réutilisez un tarball préconstruit avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test smoke Docker de l’installeur : `bash scripts/test-install-sh-docker.sh` partage un même cache npm entre ses conteneurs root, update et direct-npm. Le test smoke de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers le tarball candidat. Remplacez localement avec `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, ou avec l’entrée `update_baseline_version` du workflow Install Smoke sur GitHub. Les vérifications de l’installeur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation local à l’utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des réexécutions locales.
- Install Smoke CI ignore la mise à jour globale direct-npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cet environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Test smoke CLI de suppression par les agents d’un espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, amorce deux agents avec un espace de travail dans un répertoire personnel de conteneur isolé, exécute `agents delete --json`, et vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Test smoke d’instantané CDP du navigateur : `pnpm test:docker:browser-cdp-snapshot` (script : `scripts/e2e/browser-cdp-snapshot-docker.sh`) construit l’image E2E source plus une couche Chromium, démarre Chromium avec CDP brut, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP couvrent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe, et les métadonnées de frame.
- Régression de raisonnement minimal OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` augmente `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway amorcé + pont stdio + test smoke de frame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle OpenClaw (serveur MCP stdio réel + test smoke allow/deny du profil OpenClaw intégré) : `pnpm test:docker:agent-bundle-mcp-tools` (script : `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (Gateway réel + démontage d’enfant MCP stdio après exécutions Cron isolées et sous-agent one-shot) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hoistées, métadonnées de paquet npm mal formées, refs git mouvantes, kitchen-sink ClawHub, mises à jour marketplace, et activation/inspection du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
  Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour ignorer le bloc ClawHub, ou remplacez la paire paquet/runtime kitchen-sink par défaut avec `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` et `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sans `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, le test utilise un serveur de fixture ClawHub local hermétique.
- Test smoke de mise à jour inchangée de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test smoke de matrice de cycle de vie Plugin : `pnpm test:docker:plugin-lifecycle-matrix` installe le tarball OpenClaw empaqueté dans un conteneur nu, installe un Plugin npm, bascule activation/désactivation, le met à niveau et le rétrograde via un registre npm local, supprime le code installé, puis vérifie que la désinstallation supprime encore l’état obsolète tout en journalisant les métriques RSS/CPU pour chaque phase du cycle de vie.
- Test smoke des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Plugins : `pnpm test:docker:plugins` couvre les tests smoke d’installation/mise à jour pour chemin local, `file:`, registre npm avec dépendances hoistées, refs git mouvantes, fixtures ClawHub, mises à jour marketplace, et activation/inspection du bundle Claude. `pnpm test:docker:plugin-update` couvre le comportement de mise à jour inchangée pour les Plugins installés. `pnpm test:docker:plugin-lifecycle-matrix` couvre l’installation, l’activation, la désactivation, la mise à niveau, la rétrogradation et la désinstallation en cas de code manquant d’un Plugin npm avec suivi des ressources.

Pour préconstruire et réutiliser manuellement l’image fonctionnelle partagée :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image propres à une suite, tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et installeur conservent leurs propres Dockerfiles parce qu’ils valident le comportement de paquet/installation plutôt que l’exécution d’application construite partagée.

Les runners Docker de modèles live montent également le checkout actuel en lecture seule et
le préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image
runtime légère tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les grands caches locaux uniquement et les sorties de build d’applications comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie `.build` locaux à l’application ou
Gradle, afin que les exécutions Docker live ne passent pas des minutes à copier
des artefacts propres à la machine.
Ils définissent également `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live du Gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez également
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live du Gateway
de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
Définissez `OPENWEBUI_SMOKE_MODE=models` pour les vérifications CI du chemin de release qui doivent s’arrêter
après la connexion Open WebUI et la découverte du modèle, sans attendre une complétion
de modèle live.
La première exécution peut être sensiblement plus lente, car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette voie attend une clé de modèle live utilisable. Fournissez-la via l’environnement
du processus, des profils d’authentification préparés, ou un `OPENCLAW_PROFILE_FILE` explicite.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est intentionnellement déterministe et ne nécessite pas de
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
prérempli, lance un second conteneur qui exécute `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture des transcriptions, les métadonnées des pièces jointes,
le comportement de la file d’événements live, le routage des envois sortants, ainsi que les notifications de canal +
permission de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes, afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client spécifique expose par hasard.
`test:docker:agent-bundle-mcp-tools` est déterministe et ne nécessite pas de clé de
modèle live. Il construit l’image Docker du dépôt, démarre un vrai serveur de sondage MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle OpenClaw embarqué,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les outils
`bundle-mcp`, tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et ne nécessite pas de clé de modèle live.
Il démarre un Gateway prérempli avec un vrai serveur de sondage MCP stdio, exécute un
tour Cron isolé et un tour enfant ponctuel `sessions_spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel de thread ACP en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être de nouveau nécessaire pour valider le routage des threads ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` monté et sourcé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement sourcées depuis `OPENCLAW_PROFILE_FILE`, avec des répertoires temporaires de configuration/espace de travail et aucun montage externe d’authentification CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes à un fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors des réexécutions qui ne nécessitent pas de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence des docs

Exécutez les vérifications de docs après les modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous devez également vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans fournisseurs réels :

- Appels d’outils du Gateway (OpenAI simulé, vrai Gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de configuration du Gateway (WS `wizard.start`/`wizard.next`, écrit la configuration + authentification appliquée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d’outils simulé via le vrai Gateway + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque les Skills sont listées dans le prompt, l’agent choisit-il la bonne skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du sandbox.

Les évaluations futures doivent d’abord rester déterministes :

- Un runner de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, la lecture des fichiers de skills et le câblage de session.
- Une petite suite de scénarios axés sur les skills (utiliser vs éviter, garde-fous, injection de prompt).
- Des évaluations live optionnelles (sur inscription, protégées par variables d’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils parcourent tous les plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire `pnpm test` par défaut
ignore intentionnellement ces fichiers partagés de seam et de smoke ; exécutez explicitement
les commandes de contrat lorsque vous touchez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de Plugin de base (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de la charge utile des messages
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de thread
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
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte de Plugins
- **loader** - Chargement de Plugins
- **runtime** - Runtime de fournisseur
- **shape** - Forme/interface de Plugin
- **wizard** - Assistant de configuration

### Quand exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un Plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte des Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression compatible CI (fournisseur simulé/stubbé, ou capture de la transformation exacte de la forme de requête)
- Si c’est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live restreint et opt-in via variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/relecture de requête fournisseur → test direct des modèles
  - bug de pipeline session/historique/outils du Gateway → smoke live du Gateway ou test simulé du Gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants d’exécution contenant des segments de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les identifiants de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Connexe

- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)
- [CI](/fr/ci)
