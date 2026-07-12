---
read_when:
    - Vous souhaitez voir quelles Skills sont disponibles et prêtes à être exécutées
    - Vous souhaitez effectuer une recherche sur ClawHub ou installer des Skills depuis ClawHub, Git ou des répertoires locaux
    - Vous souhaitez vérifier une compétence ClawHub avec ClawHub
    - Vous souhaitez déboguer les binaires, variables d’environnement ou configurations manquants pour les Skills
summary: Référence de la CLI pour `openclaw skills` (rechercher/installer/mettre à jour/vérifier/lister/afficher les informations/contrôler/atelier)
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:13:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspectez les Skills locaux, recherchez dans ClawHub, installez des Skills depuis ClawHub, Git ou des répertoires locaux, vérifiez les Skills ClawHub et mettez à jour les installations suivies par ClawHub.

Voir aussi :

- Système de Skills : [Skills](/fr/tools/skills)
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
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
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

`search`, `update` et `verify` utilisent directement ClawHub. `install @owner/<slug>` installe un Skill ClawHub, `install git:owner/repo[@ref]` clone un Skill Git et `install ./path` copie un répertoire de Skill local. Par défaut, `install`, `update` et `verify` ciblent le répertoire `skills/` de l’espace de travail actif ; avec `--global`, ils ciblent le répertoire partagé des Skills gérés. `list`/`info`/`check` inspectent toujours les Skills locaux visibles pour l’espace de travail et la configuration actuels. Les commandes associées à un espace de travail déterminent l’espace de travail cible à partir de `--agent <id>`, puis du répertoire de travail actuel s’il se trouve dans l’espace de travail d’un agent configuré, puis de l’agent par défaut.

Les installations depuis Git et des répertoires locaux nécessitent un fichier `SKILL.md` à la racine de la source. Le slug d’installation provient d’abord de la valeur `name` du frontmatter de `SKILL.md` lorsqu’elle est valide, puis du nom du répertoire source ou du dépôt ; utilisez `--as <slug>` pour le remplacer. `--version` est réservé à ClawHub. Les installations de Skills ne prennent pas en charge les spécifications de paquets npm ni les chemins de fichiers zip ou d’archives, et `openclaw skills update` met uniquement à jour les installations suivies par ClawHub.

Les installations de dépendances de Skills gérées par le Gateway et déclenchées depuis l’intégration initiale ou les paramètres des Skills utilisent plutôt le chemin de requête distinct `skills.install`.

Remarques :

| Option/comportement              | Description                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Requête facultative ; omettez-la pour parcourir le flux de recherche ClawHub par défaut.                                                                                                                                                                                          |
| `search --limit <n>`             | Limite le nombre de résultats renvoyés.                                                                                                                                                                                                                                           |
| `install git:owner/repo[@ref]`   | Installe un Skill Git. Les références de branche peuvent contenir des barres obliques, comme `git:owner/repo@feature/foo`.                                                                                                                                                        |
| `install ./path/to/skill`        | Installe un répertoire local dont la racine contient `SKILL.md`.                                                                                                                                                                                                                  |
| `install --as <slug>`            | Remplace le slug déduit pour les installations depuis Git et des répertoires locaux.                                                                                                                                                                                              |
| `install --version <version>`    | S’applique uniquement aux références de Skills ClawHub.                                                                                                                                                                                                                          |
| `install --force`                | Écrase le dossier de Skill existant dans l’espace de travail pour le même slug.                                                                                                                                                                                                   |
| `install/update --force-install` | Installe un Skill ClawHub en attente et hébergé sur GitHub avant la fin de l’analyse de ClawHub.                                                                                                                                                                                  |
| `--global`                       | Cible le répertoire partagé des Skills gérés ; ne peut pas être combiné avec `--agent <id>`.                                                                                                                                                                                       |
| `--agent <id>`                   | Cible l’espace de travail d’un agent configuré ; remplace la déduction fondée sur le répertoire de travail actuel.                                                                                                                                                                |
| `update @owner/<slug>`           | Met à jour un seul Skill suivi. Ajoutez `--global` pour cibler le répertoire partagé des Skills gérés plutôt que l’espace de travail.                                                                                                                                              |
| `update --all`                   | Met à jour les installations ClawHub suivies dans l’espace de travail sélectionné, ou dans le répertoire partagé des Skills gérés avec `--global`.                                                                                                                                |
| `verify @owner/<slug>`           | Affiche par défaut l’enveloppe JSON `clawhub.skill.verify.v1` de ClawHub. Il n’existe pas d’option `--json`, car JSON est déjà le format par défaut. Les slugs sans propriétaire sont acceptés pour assurer la compatibilité lorsque le Skill est déjà installé ou sans ambiguïté ; les références qualifiées par le propriétaire évitent toute ambiguïté sur l’éditeur. |
| Provenance de `verify`           | Lorsque ClawHub renvoie une provenance de source résolue par le serveur, le JSON de vérification inclut également une valeur `openclaw.verifiedSourceUrl` épinglée à un commit. Les URL sources indisponibles ou autodéclarées restent uniquement dans l’enveloppe de provenance brute et ne sont pas promues. |
| Sélecteur de version de `verify` | `verify` utilise `.clawhub/origin.json` pour les Skills ClawHub installés et vérifie donc la version installée auprès du registre dont elle provient. `--version` et `--tag` remplacent le sélecteur de version, mais conservent ce registre installé lorsque les métadonnées d’origine existent. |
| `verify --card`                  | Affiche la fiche de Skill générée au format Markdown au lieu de JSON. Se termine avec un code différent de zéro lorsque ClawHub renvoie `ok: false` ou `decision: "fail"` ; les signatures non signées sont fournies à titre informatif, sauf modification de la politique de ClawHub. |
| Empreinte de la fiche de Skill   | Les paquets ClawHub installés peuvent inclure un fichier `skill-card.md` généré. OpenClaw considère la vérification comme une décision du serveur ClawHub et ne rejette pas un Skill installé uniquement parce que cette fiche générée modifie l’empreinte du paquet. |
| `check --agent <id>`             | Vérifie l’espace de travail de l’agent sélectionné et indique quels Skills prêts sont réellement visibles dans l’invite ou l’interface de commande de cet agent.                                                                                                                  |
| `list`                           | Action par défaut lorsqu’aucune sous-commande n’est fournie.                                                                                                                                                                                                                      |
| Sortie de `list`/`info`/`check`  | La sortie mise en forme est envoyée vers stdout. Avec `--json`, la charge utile lisible par une machine reste sur stdout pour les pipelines et les scripts.                                                                                                                        |

Les installations et mises à jour de Skills ClawHub communautaires vérifient le niveau de confiance avant le téléchargement. Les versions d’archives communautaires versionnées utilisent les métadonnées de confiance propres à la version exacte. Les Skills GitHub traités par un résolveur s’appuient sur le résolveur d’installation de ClawHub pour appliquer la politique d’analyse et d’installation forcée avant de renvoyer un commit épinglé ; utilisez `--force-install` pour installer un Skill en attente et hébergé sur GitHub avant la fin de cette analyse. Les versions communautaires malveillantes ou bloquées sont refusées. Les versions communautaires risquées nécessitent une vérification et l’option `--acknowledge-clawhub-risk` lorsqu’une commande non interactive doit continuer après cette vérification. Les éditeurs officiels de Skills ClawHub et les sources de Skills intégrées à OpenClaw contournent cette demande de confirmation liée au niveau de confiance de la version.

## Atelier de Skills

`openclaw skills workshop` gère les propositions de Skills en attente dans l’espace de travail sélectionné. Les propositions ne deviennent pas des Skills actifs tant qu’elles n’ont pas été appliquées. Pour en savoir plus sur le stockage des propositions, les protections des fichiers auxiliaires, les méthodes du Gateway et la politique d’approbation, consultez [Atelier de Skills](/fr/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Liste de contrôle qualité reproductible" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Liste de contrôle qualité reproductible" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Doublon"
openclaw skills workshop quarantine <proposal-id> --reason "Nécessite un examen de sécurité"
```

`propose-create`, `propose-update` et `revise` acceptent également `--goal <text>`
et `--evidence <text>` pour consigner la motivation de la proposition et les notes
justificatives avec le contenu de `--proposal`/`--proposal-dir`.

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Skills](/fr/tools/skills)
