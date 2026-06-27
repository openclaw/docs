---
read_when:
    - Vous souhaitez exécuter ou écrire des fichiers de workflow .prose
    - Vous voulez activer le plugin OpenProse
    - Vous devez comprendre comment OpenProse correspond aux primitives OpenClaw
sidebarTitle: OpenProse
summary: OpenProse est un format de workflow centré sur Markdown pour les sessions d’IA multi-agent. Dans OpenClaw, il est fourni sous forme de plugin avec une commande slash /prose et un pack de Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:02:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse est un format de workflow portable, orienté Markdown, pour orchestrer des
sessions d’IA. Dans OpenClaw, il est fourni comme Plugin qui installe un pack de
Skills OpenProse et une commande slash `/prose`. Les programmes résident dans
des fichiers `.prose` et peuvent lancer plusieurs sous-agents avec un flux de
contrôle explicite.

<CardGroup cols={3}>
  <Card title="Installer" icon="download" href="#install">
    Activez le Plugin OpenProse et redémarrez le Gateway.
  </Card>
  <Card title="Exécuter un programme" icon="play" href="#slash-command">
    Utilisez `/prose run` pour exécuter un fichier `.prose` ou un programme distant.
  </Card>
  <Card title="Écrire des programmes" icon="pencil" href="#example">
    Créez des workflows multi-agents avec des étapes parallèles et séquentielles.
  </Card>
</CardGroup>

## Installer

<Steps>
  <Step title="Activer le Plugin">
    Les plugins intégrés sont désactivés par défaut. Activez OpenProse :

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

    Vous devriez voir `open-prose` comme activé. La commande Skills `/prose` est
    maintenant disponible dans la discussion.

  </Step>
</Steps>

Pour une copie locale : `openclaw plugins install ./path/to/local/open-prose-plugin`

## Commande slash

OpenProse enregistre `/prose` comme commande Skills invocable par l’utilisateur :

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` se résout en `https://p.prose.md/<handle>/<slug>`.
Les URL directes sont récupérées telles quelles avec l’outil `web_fetch`.

Les exécutions distantes de premier niveau sont explicites. Les imports distants
à l’intérieur d’un programme `.prose` sont des dépendances de code transitives :
avant qu’OpenProse récupère une cible distante `use`, il affiche la liste
d’imports résolue et exige que l’opérateur réponde exactement
`approve remote prose imports` pour cette exécution.

## Ce qu’il peut faire

- Recherche et synthèse multi-agents avec parallélisme explicite.
- Workflows répétables et sûrs par approbation (revue de code, triage d’incident, pipelines de contenu).
- Programmes `.prose` réutilisables que vous pouvez exécuter sur les runtimes d’agents pris en charge.

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

## Correspondance avec le runtime OpenClaw

Les programmes OpenProse correspondent aux primitives OpenClaw :

| Concept OpenProse        | Outil OpenClaw   |
| ------------------------ | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read / write        | `read` / `write` |
| Web fetch                | `web_fetch`      |

<Warning>
  Si votre liste d’autorisation d’outils bloque `sessions_spawn`, `read`,
  `write` ou `web_fetch`, les programmes OpenProse échoueront. Vérifiez votre
  [configuration de liste d’autorisation des outils](/fr/gateway/config-tools).
</Warning>

## Emplacements des fichiers

OpenProse conserve l’état sous `.prose/` dans votre espace de travail :

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Les agents persistants au niveau utilisateur résident ici :

```text
~/.prose/agents/
```

## Backends d’état

<AccordionGroup>
  <Accordion title="système de fichiers (par défaut)">
    L’état est écrit dans `.prose/runs/...` dans l’espace de travail. Aucune
    dépendance supplémentaire n’est requise.
  </Accordion>
  <Accordion title="dans le contexte">
    État transitoire conservé dans la fenêtre de contexte. Adapté aux petits
    programmes de courte durée.
  </Accordion>
  <Accordion title="sqlite (expérimental)">
    Nécessite le binaire `sqlite3` dans `PATH`.
  </Accordion>
  <Accordion title="postgres (expérimental)">
    Nécessite `psql` et une chaîne de connexion.

    <Warning>
      Les identifiants Postgres sont transmis aux journaux des sous-agents.
      Utilisez une base de données dédiée avec les privilèges minimaux.
    </Warning>

  </Accordion>
</AccordionGroup>

## Sécurité

Traitez les fichiers `.prose` comme du code. Relisez-les avant de les exécuter,
y compris les imports `use` distants. Les requêtes `/prose run https://...` de
premier niveau sont explicites, mais les imports distants transitifs nécessitent
une approbation par exécution avant d’être récupérés ou exécutés. Utilisez les
listes d’autorisation d’outils et les portes d’approbation d’OpenClaw pour
contrôler les effets de bord. Pour les workflows déterministes soumis à
approbation, comparez avec [Lobster](/fr/tools/lobster).

## Associé

<CardGroup cols={2}>
  <Card title="Référence Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Comment le pack Skills d’OpenProse se charge et quelles portes s’appliquent.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    La couche native de coordination multi-agents d’OpenClaw.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="volume-high">
    Ajoutez une sortie audio à vos workflows.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Toutes les commandes de discussion disponibles, y compris /prose.
  </Card>
</CardGroup>

Site officiel : [https://www.prose.md](https://www.prose.md)
