---
read_when:
    - Vous souhaitez voir quelles Skills sont disponibles et prêtes à être exécutées
    - Vous souhaitez effectuer une recherche dans ClawHub ou installer des Skills depuis ClawHub, Git ou des répertoires locaux.
    - Vous souhaitez vérifier une Skills ClawHub avec ClawHub
    - Vous souhaitez déboguer les binaires, variables d’environnement ou configurations manquants pour les Skills
summary: Référence de la CLI pour `openclaw skills` (rechercher/installer/mettre à jour/vérifier/lister/informations/vérifier/workshop)
title: Skills
x-i18n:
    generated_at: "2026-07-12T02:32:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspectez les Skills locales, recherchez dans ClawHub, installez des compétences depuis ClawHub, Git ou des répertoires locaux, vérifiez les compétences ClawHub et mettez à jour les installations suivies par ClawHub.

Voir aussi :

- Système de Skills : [Skills](/fr/tools/skills)
- Atelier de compétences : [Atelier de compétences](/fr/tools/skill-workshop)
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

`search`, `update` et `verify` utilisent directement ClawHub. `install @owner/<slug>`
installe une compétence ClawHub, `install git:owner/repo[@ref]` clone une
compétence Git et `install ./path` copie un répertoire local de compétence. Par
défaut, `install`, `update` et `verify` ciblent le répertoire `skills/` de
l’espace de travail actif ; avec `--global`, ils ciblent le répertoire partagé
des Skills gérées. `list`/`info`/`check` inspectent toujours les Skills locales
visibles pour l’espace de travail et la configuration actuels. Les commandes
liées à un espace de travail déterminent l’espace de travail cible à partir de
`--agent <id>`, puis du répertoire de travail actuel lorsqu’il se trouve dans
l’espace de travail d’un agent configuré, puis de l’agent par défaut.

Les installations depuis Git et des répertoires locaux exigent que `SKILL.md`
se trouve à la racine de la source. Le slug d’installation provient du champ
`name` du frontmatter de `SKILL.md` lorsqu’il est valide, puis du nom du
répertoire source ou du dépôt ; utilisez `--as <slug>` pour le remplacer.
`--version` est réservé à ClawHub. Les installations de compétences ne prennent
pas en charge les spécifications de paquets npm ni les chemins d’archives ZIP
ou autres, et `openclaw skills update` met uniquement à jour les installations
suivies par ClawHub.

Les installations de dépendances de compétences adossées au Gateway et
déclenchées depuis l’intégration initiale ou les paramètres des Skills utilisent
à la place le chemin de requête distinct `skills.install`.

Remarques :

| Option/comportement              | Description                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Requête facultative ; omettez-la pour parcourir le flux de recherche ClawHub par défaut.                                                                                                                                                                                          |
| `search --limit <n>`             | Limite le nombre de résultats renvoyés.                                                                                                                                                                                                                                           |
| `install git:owner/repo[@ref]`   | Installe une compétence Git. Les références de branche peuvent contenir des barres obliques, comme `git:owner/repo@feature/foo`.                                                                                                                                                  |
| `install ./path/to/skill`        | Installe un répertoire local dont la racine contient `SKILL.md`.                                                                                                                                                                                                                   |
| `install --as <slug>`            | Remplace le slug déduit pour les installations depuis Git et des répertoires locaux.                                                                                                                                                                                              |
| `install --version <version>`    | S’applique uniquement aux références de compétences ClawHub.                                                                                                                                                                                                                      |
| `install --force`                | Écrase un dossier de compétence existant dans l’espace de travail pour le même slug.                                                                                                                                                                                              |
| `install/update --force-install` | Installe une compétence ClawHub en attente et adossée à GitHub avant la fin de l’analyse de ClawHub.                                                                                                                                                                              |
| `--global`                       | Cible le répertoire partagé des Skills gérées ; ne peut pas être combiné avec `--agent <id>`.                                                                                                                                                                                     |
| `--agent <id>`                   | Cible l’espace de travail d’un agent configuré ; remplace la déduction fondée sur le répertoire de travail actuel.                                                                                                                                                                |
| `update @owner/<slug>`           | Met à jour une seule compétence suivie. Ajoutez `--global` pour cibler le répertoire partagé des Skills gérées plutôt que l’espace de travail.                                                                                                                                    |
| `update --all`                   | Met à jour les installations ClawHub suivies dans l’espace de travail sélectionné, ou dans le répertoire partagé des Skills gérées avec `--global`.                                                                                                                              |
| `verify @owner/<slug>`           | Affiche par défaut l’enveloppe JSON `clawhub.skill.verify.v1` de ClawHub. Il n’existe pas d’option `--json`, car JSON est déjà le format par défaut. Les slugs seuls sont acceptés pour compatibilité lorsque la compétence est déjà installée ou ne présente aucune ambiguïté ; les références qualifiées par le propriétaire évitent toute ambiguïté sur l’éditeur. |
| Provenance de `verify`           | Lorsque ClawHub renvoie une provenance de source déterminée par le serveur, le JSON de vérification inclut également une valeur `openclaw.verifiedSourceUrl` épinglée à un commit. Les URL sources indisponibles ou autodéclarées restent uniquement dans l’enveloppe de provenance brute et ne sont pas promues. |
| Sélecteur de version de `verify` | `verify` utilise `.clawhub/origin.json` pour les compétences ClawHub installées et vérifie donc la version installée auprès du registre dont elle provient. `--version` et `--tag` remplacent le sélecteur de version, mais conservent ce registre installé lorsque les métadonnées d’origine existent. |
| `verify --card`                  | Affiche la fiche Markdown générée de la compétence plutôt que le JSON. Renvoie un code de sortie non nul lorsque ClawHub renvoie `ok: false` ou `decision: "fail"` ; les signatures non signées sont fournies à titre informatif, sauf modification de la politique de ClawHub. |
| Empreinte de la fiche de compétence | Les lots ClawHub installés peuvent inclure un fichier `skill-card.md` généré. OpenClaw considère la vérification comme une décision du serveur ClawHub et ne rejette pas une compétence installée uniquement parce que cette fiche générée modifie l’empreinte du lot. |
| `check --agent <id>`             | Vérifie l’espace de travail de l’agent sélectionné et indique quelles compétences prêtes sont réellement visibles dans le prompt ou l’interface de commande de cet agent.                                                                                                        |
| `list`                           | Action par défaut lorsqu’aucune sous-commande n’est fournie.                                                                                                                                                                                                                       |
| Sortie de `list`/`info`/`check`  | La sortie mise en forme est envoyée vers stdout. Avec `--json`, la charge utile exploitable par machine reste sur stdout pour les pipelines et les scripts.                                                                                                                       |

Les installations et mises à jour de compétences communautaires ClawHub
vérifient la confiance avant le téléchargement. Les versions archivées et
versionnées de la communauté utilisent les métadonnées de confiance propres à
la version exacte. Les compétences GitHub adossées au résolveur s’appuient sur
le résolveur d’installation de ClawHub pour appliquer la politique d’analyse et
d’installation forcée avant qu’il ne renvoie un commit épinglé ; utilisez
`--force-install` pour installer une compétence GitHub en attente avant la fin
de cette analyse. Les versions communautaires malveillantes ou bloquées sont
refusées. Les versions communautaires risquées nécessitent une vérification et
`--acknowledge-clawhub-risk` lorsqu’une commande non interactive doit continuer
après cette vérification. Les éditeurs officiels de compétences ClawHub et les
sources de compétences intégrées à OpenClaw ignorent cette demande de
confirmation liée à la confiance accordée à la version.

## Atelier de compétences

`openclaw skills workshop` gère les propositions de compétences en attente dans
l’espace de travail sélectionné. Les propositions ne deviennent pas des
compétences actives tant qu’elles ne sont pas appliquées. Pour le stockage des
propositions, les protections des fichiers auxiliaires, les méthodes du Gateway
et la politique d’approbation, consultez
[Atelier de compétences](/fr/tools/skill-workshop).

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

`propose-create`, `propose-update` et `revise` acceptent également `--goal <text>`
et `--evidence <text>` pour consigner la motivation de la proposition et les notes
justificatives avec le contenu de `--proposal`/`--proposal-dir`.

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Skills](/fr/tools/skills)
