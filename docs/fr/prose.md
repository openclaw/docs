---
read_when:
    - Vous souhaitez exécuter ou écrire des fichiers de workflow `.prose`
    - Vous souhaitez activer le plugin OpenProse
    - Vous devez comprendre comment OpenProse s’articule avec les primitives d’OpenClaw
sidebarTitle: OpenProse
summary: OpenProse est un format de workflow axé sur Markdown pour les sessions d’IA multi-agents. Dans OpenClaw, il est fourni sous forme de plugin avec une commande oblique `/prose` et un ensemble de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T15:43:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse est un format de workflow portable, axé sur Markdown, destiné à orchestrer des
sessions d’IA. Dans OpenClaw, il est fourni sous forme de Plugin qui installe un ensemble de Skills
OpenProse et une commande oblique `/prose`. Les programmes résident dans des fichiers `.prose` et peuvent
lancer plusieurs sous-agents avec un flux de contrôle explicite.

<CardGroup cols={3}>
  <Card title="Installer" icon="download" href="#install">
    Activez le Plugin OpenProse et redémarrez le Gateway.
  </Card>
  <Card title="Exécuter un programme" icon="play" href="#slash-command">
    Utilisez `/prose run` pour exécuter un fichier `.prose` ou un programme distant.
  </Card>
  <Card title="Écrire des programmes" icon="pencil" href="#example-parallel-research-and-synthesis">
    Créez des workflows multi-agents avec des étapes parallèles et séquentielles.
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

    Vous devriez voir `open-prose` comme activé. La commande de Skill `/prose` est désormais
    disponible dans le chat.

  </Step>
</Steps>

Depuis une copie de travail du dépôt, vous pouvez installer directement le Plugin :
`openclaw plugins install ./extensions/open-prose`

## Commande oblique

OpenProse enregistre `/prose` comme commande de Skill invocable par l’utilisateur :

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` est résolu en `https://p.prose.md/<handle>/<slug>`.
Les URL directes sont récupérées telles quelles avec l’outil `web_fetch`.

Les exécutions distantes de premier niveau sont explicites. Les importations distantes au sein d’un programme `.prose` sont
des dépendances de code transitives : avant qu’OpenProse ne récupère une cible `use` distante,
il affiche la liste des importations résolues et exige que l’opérateur réponde exactement
`approve remote prose imports` pour cette exécution.

## Fonctionnalités

- Recherche et synthèse multi-agents avec parallélisme explicite.
- Workflows reproductibles et sécurisés par approbation (revue de code, triage d’incidents, pipelines de contenu).
- Programmes `.prose` réutilisables que vous pouvez exécuter sur les environnements d’exécution d’agents pris en charge.

## Exemple : recherche et synthèse en parallèle

```prose
# Recherche et synthèse avec deux agents s’exécutant en parallèle.

input topic: "Que devons-nous rechercher ?"

agent researcher:
  model: sonnet
  prompt: "Vous effectuez des recherches approfondies et citez vos sources."

agent writer:
  model: opus
  prompt: "Vous rédigez un résumé concis."

parallel:
  findings = session: researcher
    prompt: "Recherchez {topic}."
  draft = session: writer
    prompt: "Résumez {topic}."

session "Fusionnez les résultats et le brouillon en une réponse finale."
  context: { findings, draft }
```

## Correspondance avec l’environnement d’exécution OpenClaw

Les programmes OpenProse correspondent aux primitives OpenClaw :

| Concept OpenProse          | Outil OpenClaw                                   |
| ------------------------- | ----------------------------------------------- |
| Lancement de session / outil Task | `sessions_spawn`                                |
| Lecture / écriture de fichiers | `read` / `write`                                |
| Récupération Web          | `web_fetch` (`exec` + curl lorsqu’une requête POST est nécessaire) |

<Warning>
  Si votre liste d’autorisation d’outils bloque `sessions_spawn`, `read`, `write` ou
  `web_fetch`, les programmes OpenProse échoueront. Vérifiez votre
  [configuration de la liste d’autorisation des outils](/fr/gateway/config-tools).
</Warning>

## Emplacements des fichiers

OpenProse conserve son état sous `.prose/` dans votre espace de travail :

```text
.prose/
├── .env                      # configuration (clé=valeur), p. ex. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copie du programme en cours d’exécution
│       ├── state.md          # état de l’exécution
│       ├── bindings/
│       ├── imports/          # exécutions imbriquées de programmes distants
│       └── agents/
└── agents/                   # agents persistants limités au projet
```

Les agents persistants au niveau utilisateur (partagés entre les projets) résident dans :

```text
~/.prose/agents/
```

## Systèmes de stockage de l’état

<AccordionGroup>
  <Accordion title="système de fichiers (par défaut)">
    L’état est écrit dans `.prose/runs/...` dans l’espace de travail. Aucune
    dépendance supplémentaire n’est requise.
  </Accordion>
  <Accordion title="dans le contexte">
    État transitoire conservé dans la fenêtre de contexte ; sélectionnez-le avec `--in-context`.
    Adapté aux programmes petits et de courte durée.
  </Accordion>
  <Accordion title="sqlite (expérimental)">
    Sélectionnez-le avec `--state=sqlite`. Nécessite le binaire `sqlite3` dans `PATH`
    (revient au système de fichiers s’il est absent) ; l’état est stocké dans
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (expérimental)">
    Sélectionnez-le avec `--state=postgres`. Nécessite `psql` et une chaîne de connexion dans
    `OPENPROSE_POSTGRES_URL` (définissez-la dans `.prose/.env`).

    <Warning>
      Les identifiants Postgres sont transmis aux journaux des sous-agents. Utilisez une base de données
      dédiée avec le minimum de privilèges.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sécurité

Traitez les fichiers `.prose` comme du code. Examinez-les avant de les exécuter, y compris les importations
`use` distantes. Les requêtes `/prose run https://...` de premier niveau sont explicites, mais
les importations distantes transitives nécessitent une approbation pour chaque exécution avant d’être récupérées ou
exécutées. Utilisez les listes d’autorisation d’outils et les mécanismes d’approbation d’OpenClaw pour contrôler les effets
de bord. Pour des workflows déterministes soumis à approbation, comparez avec
[Lobster](/fr/tools/lobster).

## Ressources associées

<CardGroup cols={2}>
  <Card title="Référence des Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Découvrez comment l’ensemble de Skills d’OpenProse est chargé et quels contrôles s’appliquent.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    La couche native de coordination multi-agents d’OpenClaw.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="volume-high">
    Ajoutez une sortie audio à vos workflows.
  </Card>
  <Card title="Commandes obliques" href="/fr/tools/slash-commands" icon="terminal">
    Toutes les commandes de chat disponibles, y compris /prose.
  </Card>
</CardGroup>

Site officiel : [https://www.prose.md](https://www.prose.md)
