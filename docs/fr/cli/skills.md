---
read_when:
    - Vous voulez voir quelles Skills sont disponibles et prêtes à être exécutées
    - Vous voulez effectuer une recherche dans ClawHub ou installer des Skills depuis ClawHub, Git ou des répertoires locaux
    - Vous voulez vérifier une skill ClawHub avec ClawHub
    - Vous souhaitez déboguer les binaires, l’environnement et la configuration manquants pour les Skills
summary: Référence CLI pour `openclaw skills` (rechercher/installer/mettre à jour/vérifier/lister/infos/vérifier/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:21:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecter les Skills locales, rechercher dans ClawHub, installer des Skills depuis ClawHub/Git/des
répertoires locaux, vérifier les Skills ClawHub et mettre à jour les installations suivies par ClawHub.

Associé :

- Système Skills : [Skills](/fr/tools/skills)
- Atelier de Skills : [Atelier de Skills](/fr/tools/skill-workshop)
- Configuration des Skills : [Configuration des Skills](/fr/tools/skills-config)
- Installations ClawHub : [ClawHub](/fr/clawhub/cli)

## Commandes

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` et `verify` utilisent directement ClawHub. `install @owner/<slug>`
installe une Skill ClawHub, `install git:owner/repo[@ref]` clone une Skill Git, et
`install ./path` copie un répertoire de Skill local. Par défaut, `install`, `update`
et `verify` ciblent le répertoire `skills/` de l’espace de travail actif ; avec `--global`,
ils ciblent le répertoire partagé de Skills gérées. `list`/`info`/`check` inspectent
toujours les Skills locales visibles par l’espace de travail et la configuration actuels.
Les commandes adossées à un espace de travail résolvent l’espace de travail cible depuis `--agent <id>`, puis
le répertoire de travail actuel lorsqu’il se trouve dans un espace de travail d’agent configuré,
puis l’agent par défaut.

Les installations depuis Git et depuis un répertoire local attendent `SKILL.md` à la racine de la source. Le
slug d’installation provient du frontmatter `name` de `SKILL.md` lorsqu’il est valide, puis du
répertoire source ou du nom du dépôt ; utilisez `--as <slug>` pour le remplacer. `--version`
est réservé à ClawHub. Les installations de Skills ne prennent pas en charge les spécifications de paquets npm ni les chemins
zip/archive, et `openclaw skills update` met à jour uniquement les installations suivies par ClawHub.

Les installations de dépendances de Skills adossées au Gateway déclenchées depuis l’onboarding ou les paramètres Skills
utilisent à la place le chemin de requête distinct `skills.install`.

Notes :

- `search [query...]` accepte une requête facultative ; omettez-la pour parcourir le flux de recherche
  ClawHub par défaut.
- `search --limit <n>` limite les résultats renvoyés.
- `install git:owner/repo[@ref]` installe une Skill Git. Les références de branche peuvent contenir
  des barres obliques, comme `git:owner/repo@feature/foo`.
- `install ./path/to/skill` installe un répertoire local dont la racine contient
  `SKILL.md`.
- `install --as <slug>` remplace le slug inféré pour les installations depuis Git et depuis un répertoire local.
- `install --version <version>` s’applique uniquement aux références de Skills ClawHub.
- `install --force` écrase un dossier de Skill d’espace de travail existant pour le même
  slug.
- Les installations et mises à jour de Skills communautaires ClawHub vérifient la confiance avant le téléchargement.
  Les versions d’archive communautaires versionnées utilisent des métadonnées de confiance de version exacte.
  Les Skills GitHub adossées au résolveur s’appuient sur le résolveur d’installation de ClawHub pour appliquer
  la politique d’analyse et d’installation forcée avant de renvoyer un commit épinglé. Les versions communautaires malveillantes ou
  bloquées sont refusées. Les versions communautaires risquées nécessitent
  une revue et `--acknowledge-clawhub-risk` lorsqu’une commande non interactive doit
  continuer après cette revue. Les éditeurs officiels de Skills ClawHub et les sources de Skills
  OpenClaw groupées contournent cette invite de confiance de version.
- `--global` cible le répertoire partagé de Skills gérées et ne peut pas être combiné
  avec `--agent <id>`.
- `--agent <id>` cible un espace de travail d’agent configuré et remplace l’inférence depuis le
  répertoire de travail actuel.
- `update @owner/<slug>` met à jour une seule Skill suivie. Ajoutez `--global` pour
  cibler le répertoire partagé de Skills gérées au lieu de l’espace de travail.
- `update --all` met à jour les installations ClawHub suivies dans l’espace de travail sélectionné, ou
  dans le répertoire partagé de Skills gérées lorsqu’il est combiné avec `--global`.
- `verify @owner/<slug>` affiche par défaut l’enveloppe JSON `clawhub.skill.verify.v1`
  de ClawHub. Il n’y a pas de drapeau `--json`, car JSON est déjà la
  valeur par défaut. Les slugs nus restent acceptés pour compatibilité lorsque la Skill est
  déjà installée ou non ambiguë, mais les références qualifiées par propriétaire évitent
  l’ambiguïté d’éditeur.
- Lorsque ClawHub renvoie une provenance de source résolue côté serveur, le JSON de vérification inclut également
  un `openclaw.verifiedSourceUrl` épinglé à un commit. Les URL de source indisponibles ou
  autodéclarées restent uniquement dans l’enveloppe de provenance brute et ne sont pas
  promues.
- `verify` utilise `.clawhub/origin.json` pour les Skills ClawHub installées, de sorte qu’il
  vérifie la version installée auprès du registre dont elle provient. `--version`
  et `--tag` remplacent le sélecteur de version, mais conservent ce registre installé
  lorsque les métadonnées d’origine existent.
- `verify --card` affiche le Markdown de Skill Card généré au lieu du JSON. La
  commande se termine avec un code non nul lorsque ClawHub renvoie `ok: false` ou `decision: "fail"` ;
  les signatures non signées sont informatives, sauf si la politique ClawHub change.
- Les bundles ClawHub installés peuvent inclure un `skill-card.md` généré. OpenClaw
  traite la vérification comme une décision du serveur ClawHub et ne rejette pas une
  Skill installée simplement parce que cette carte générée modifie l’empreinte du bundle.
- `check --agent <id>` vérifie l’espace de travail de l’agent sélectionné et indique quelles
  Skills prêtes sont réellement visibles dans le prompt ou la surface de commande de cet agent.
- `list` est l’action par défaut lorsqu’aucune sous-commande n’est fournie.
- `list`, `info` et `check` écrivent leur sortie rendue vers stdout. Avec
  `--json`, cela signifie que la charge utile lisible par machine reste sur stdout pour les tubes
  et les scripts.

## Atelier de Skills

`openclaw skills workshop` gère les propositions de Skills en attente dans l’espace de travail
sélectionné. Les propositions ne sont pas des Skills actives tant qu’elles ne sont pas appliquées. Pour le stockage des propositions,
les protections des fichiers de support, les méthodes Gateway et la politique d’approbation, consultez
[Atelier de Skills](/fr/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Associé

- [Référence CLI](/fr/cli)
- [Skills](/fr/tools/skills)
