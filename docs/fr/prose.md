---
read_when:
    - Vous souhaitez exécuter ou écrire des fichiers de workflow `.prose`
    - Vous souhaitez activer le plugin OpenProse
    - Vous devez comprendre comment OpenProse correspond aux primitives d’OpenClaw
sidebarTitle: OpenProse
summary: OpenProse est un format de workflow privilégiant Markdown pour les sessions d’IA multi-agents. Dans OpenClaw, il est fourni sous forme de Plugin avec une commande oblique `/prose` et un ensemble de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T03:00:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse est un format de workflow portable, axé sur Markdown, qui permet d’orchestrer des
sessions d’IA. Dans OpenClaw, il est fourni sous forme de Plugin qui installe un ensemble de Skills
OpenProse et une commande barre oblique `/prose`. Les programmes résident dans des fichiers `.prose` et peuvent
lancer plusieurs sous-agents avec un flux de contrôle explicite.

<CardGroup cols={3}>
  <Card title="Installer" icon="download" href="#install">
    Activez le Plugin OpenProse et redémarrez le Gateway.
  </Card>
  <Card title="Exécuter un programme" icon="play" href="#slash-command">
    Utilisez `/prose run` pour exécuter un fichier `.prose` ou un programme distant.
  </Card>
  <Card title="Écrire des programmes" icon="pencil" href="#example-parallel-research-and-synthesis">
    Créez des workflows multi-agents comportant des étapes parallèles et séquentielles.
  </Card>
</CardGroup>

## Installation

<Steps>
  <Step title="Activer le Plugin">
    OpenProse est inclus, mais désactivé par défaut. Activez-le :

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Redémarrer le Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Vérifier">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` devrait apparaître comme activé. La commande de Skill `/prose` est désormais
    disponible dans le chat.

  </Step>
</Steps>

Depuis une copie de travail du dépôt, vous pouvez installer directement le Plugin :
`openclaw plugins install ./extensions/open-prose`

## Commande barre oblique

OpenProse enregistre `/prose` comme commande de Skill pouvant être appelée par l’utilisateur :

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` correspond à `https://p.prose.md/<handle>/<slug>`.
Les URL directes sont récupérées telles quelles avec l’outil `web_fetch`.

Les exécutions distantes de premier niveau sont explicites. Les importations distantes dans un programme `.prose` sont
des dépendances de code transitives : avant qu’OpenProse ne récupère une cible `use` distante,
il affiche la liste résolue des importations et exige que l’opérateur réponde exactement
`approve remote prose imports` pour cette exécution.

## Fonctionnalités

- Recherche et synthèse multi-agents avec parallélisme explicite.
- Workflows reproductibles et sécurisés par des approbations (revue de code, triage d’incidents, chaînes de production de contenu).
- Programmes `.prose` réutilisables, exécutables sur les environnements d’exécution d’agents pris en charge.

## Exemple : recherche et synthèse parallèles

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## Correspondance avec l’environnement d’exécution OpenClaw

Les programmes OpenProse correspondent aux primitives OpenClaw :

| Concept OpenProse          | Outil OpenClaw                                  |
| ------------------------- | ----------------------------------------------- |
| Lancement de session / outil Task | `sessions_spawn`                                |
| Lecture / écriture de fichiers | `read` / `write`                                |
| Récupération Web          | `web_fetch` (`exec` + curl lorsqu’une requête POST est nécessaire) |

<Warning>
  Si votre liste d’outils autorisés bloque `sessions_spawn`, `read`, `write` ou
  `web_fetch`, les programmes OpenProse échoueront. Vérifiez votre
  [configuration de la liste d’outils autorisés](/fr/gateway/config-tools).
</Warning>

## Emplacements des fichiers

OpenProse conserve son état sous `.prose/` dans votre espace de travail :

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Les agents persistants au niveau utilisateur, partagés entre les projets, se trouvent dans :

```text
~/.prose/agents/
```

## Systèmes de stockage de l’état

<AccordionGroup>
  <Accordion title="système de fichiers (par défaut)">
    L’état est écrit dans `.prose/runs/...` au sein de l’espace de travail. Aucune
    dépendance supplémentaire n’est requise.
  </Accordion>
  <Accordion title="dans le contexte">
    L’état transitoire est conservé dans la fenêtre de contexte ; sélectionnez ce mode avec `--in-context`.
    Il convient aux programmes de petite taille et de courte durée.
  </Accordion>
  <Accordion title="sqlite (expérimental)">
    Sélectionnez ce mode avec `--state=sqlite`. Il nécessite le binaire `sqlite3` dans `PATH`
    (avec repli sur le système de fichiers s’il est absent) ; l’état est enregistré dans
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (expérimental)">
    Sélectionnez ce mode avec `--state=postgres`. Il nécessite `psql` et une chaîne de connexion dans
    `OPENPROSE_POSTGRES_URL` (définissez-la dans `.prose/.env`).

    <Warning>
      Les identifiants Postgres sont transmis aux journaux des sous-agents. Utilisez une base de données dédiée,
      dotée des privilèges minimaux.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sécurité

Traitez les fichiers `.prose` comme du code. Examinez-les avant de les exécuter, y compris les importations
`use` distantes. Les requêtes `/prose run https://...` de premier niveau sont explicites, mais
les importations distantes transitives nécessitent une approbation pour chaque exécution avant leur récupération ou
leur exécution. Utilisez les listes d’outils autorisés et les points de contrôle d’approbation d’OpenClaw pour maîtriser les effets
de bord. Pour des workflows déterministes soumis à approbation, consultez
[Lobster](/fr/tools/lobster).

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Référence des Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Découvrez comment l’ensemble de Skills d’OpenProse est chargé et quels contrôles s’appliquent.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Couche native de coordination multi-agents d’OpenClaw.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="volume-high">
    Ajoutez une sortie audio à vos workflows.
  </Card>
  <Card title="Commandes barre oblique" href="/fr/tools/slash-commands" icon="terminal">
    Toutes les commandes de chat disponibles, y compris /prose.
  </Card>
</CardGroup>

Site officiel : [https://www.prose.md](https://www.prose.md)
