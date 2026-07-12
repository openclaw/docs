---
read_when:
    - Vous venez de Claude Code ou Claude Desktop et souhaitez conserver les instructions, les serveurs MCP et les Skills
    - Vous devez comprendre ce qu’OpenClaw importe automatiquement et ce qui reste uniquement archivé.
summary: Déplacez l’état local de Claude Code et Claude Desktop vers OpenClaw avec un aperçu de l’importation
title: Migration depuis Claude
x-i18n:
    generated_at: "2026-07-12T02:44:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importe l’état Claude local via le fournisseur de migration Claude intégré. Le fournisseur affiche un aperçu de chaque élément avant de modifier l’état, masque les secrets dans les plans et les rapports, et crée une sauvegarde vérifiée avant l’application.

<Note>
Les importations lors de l’intégration nécessitent une nouvelle configuration d’OpenClaw. Si vous disposez déjà d’un état OpenClaw local, réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail, ou utilisez directement `openclaw migrate` avec `--overwrite` après avoir examiné le plan.
</Note>

## Deux méthodes d’importation

<Tabs>
  <Tab title="Assistant d’intégration">
    L’assistant propose Claude lorsqu’il détecte un état Claude local.

    ```bash
    openclaw onboard --flow import
    ```

    Vous pouvez également indiquer une source précise :

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Utilisez `openclaw migrate` pour les exécutions scriptées ou reproductibles. Consultez [`openclaw migrate`](/fr/cli/migrate) pour la référence complète.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Ajoutez `--from <path>` pour importer un répertoire personnel Claude Code ou une racine de projet spécifique.

  </Tab>
</Tabs>

## Éléments importés

<AccordionGroup>
  <Accordion title="Instructions et mémoire">
    - Le contenu des fichiers de projet `CLAUDE.md` et `.claude/CLAUDE.md` est copié ou ajouté au fichier `AGENTS.md` de l’espace de travail de l’agent OpenClaw.
    - Le contenu du fichier utilisateur `~/.claude/CLAUDE.md` est ajouté au fichier `USER.md` de l’espace de travail.

  </Accordion>
  <Accordion title="Serveurs MCP">
    Les définitions de serveurs MCP sont importées depuis le fichier de projet `.mcp.json`, le fichier Claude Code `~/.claude.json` et le fichier Claude Desktop `claude_desktop_config.json`, lorsqu’ils sont présents.
  </Accordion>
  <Accordion title="Skills et commandes">
    - Les Skills Claude comportant un fichier `SKILL.md` sont copiées dans le répertoire des Skills de l’espace de travail OpenClaw.
    - Les fichiers Markdown de commandes Claude situés dans `.claude/commands/` ou `~/.claude/commands/` sont convertis en Skills OpenClaw avec `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Éléments conservés uniquement dans l’archive

Le fournisseur copie les éléments suivants dans le rapport de migration afin qu’ils puissent être examinés manuellement, mais ne les charge **pas** dans la configuration OpenClaw active :

- Les hooks Claude
- Les autorisations Claude et les listes étendues d’outils autorisés
- Les valeurs par défaut de l’environnement Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Les sous-agents Claude situés dans `.claude/agents/` ou `~/.claude/agents/`
- Les répertoires de caches, de plans et d’historique des projets Claude Code
- Les extensions Claude Desktop et les identifiants stockés par le système d’exploitation

OpenClaw refuse d’exécuter automatiquement les hooks, d’accorder sa confiance aux listes d’autorisations ou de décoder l’état opaque des identifiants OAuth et Desktop. Déplacez manuellement ce dont vous avez besoin après avoir examiné l’archive.

## Sélection de la source

Sans `--from`, OpenClaw inspecte le répertoire personnel Claude Code par défaut situé dans `~/.claude`, le fichier d’état échantillonné de Claude Code `~/.claude.json` et la configuration MCP de Claude Desktop sous macOS.

Lorsque `--from` désigne une racine de projet, OpenClaw importe uniquement les fichiers Claude de ce projet, tels que `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` et `.mcp.json`. Il ne lit pas votre répertoire personnel Claude global lors de l’importation depuis une racine de projet.

## Procédure recommandée

<Steps>
  <Step title="Afficher un aperçu du plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Le plan répertorie tout ce qui sera modifié, notamment les conflits, les éléments ignorés et les valeurs sensibles masquées dans les champs MCP `env` ou `headers` imbriqués.

  </Step>
  <Step title="Appliquer avec une sauvegarde">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw crée et vérifie une sauvegarde avant l’application.

  </Step>
  <Step title="Exécuter le diagnostic">
    ```bash
    openclaw doctor
    ```

    Le [diagnostic](/fr/gateway/doctor) recherche d’éventuels problèmes de configuration ou d’état après l’importation.

  </Step>
  <Step title="Redémarrer et vérifier">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Vérifiez que le Gateway fonctionne correctement et que vos instructions, serveurs MCP et Skills importés sont chargés.

  </Step>
</Steps>

## Gestion des conflits

L’application refuse de continuer lorsque le plan signale des conflits, c’est-à-dire lorsqu’un fichier ou une valeur de configuration existe déjà à la destination.

<Warning>
Relancez la commande avec `--overwrite` uniquement si vous souhaitez remplacer la destination existante. Les fournisseurs peuvent néanmoins créer des sauvegardes individuelles des fichiers remplacés dans le répertoire du rapport de migration.
</Warning>

Les conflits sont inhabituels dans une nouvelle installation d’OpenClaw. Ils apparaissent généralement lorsque vous relancez l’importation dans une configuration qui contient déjà des modifications utilisateur.

## Sortie JSON pour l’automatisation

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` est requis pour `migrate apply` en dehors d’un terminal interactif. Sans cette option, OpenClaw renvoie une erreur au lieu d’effectuer l’application ; les scripts et l’intégration continue doivent donc transmettre explicitement `--yes`. Affichez d’abord un aperçu avec `--dry-run --json`, puis appliquez les modifications avec `--json --yes` une fois le plan vérifié.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="L’état Claude se trouve en dehors de ~/.claude">
    Transmettez `--from /actual/path` avec la CLI ou `--import-source /actual/path` lors de l’intégration.
  </Accordion>
  <Accordion title="L’intégration refuse l’importation dans une configuration existante">
    Les importations lors de l’intégration nécessitent une nouvelle configuration. Réinitialisez l’état et recommencez l’intégration, ou utilisez directement `openclaw migrate apply claude`, qui prend en charge `--overwrite` et le contrôle explicite des sauvegardes.
  </Accordion>
  <Accordion title="Les serveurs MCP de Claude Desktop n’ont pas été importés">
    Claude Desktop lit `claude_desktop_config.json` depuis un chemin propre à la plateforme. Faites pointer `--from` vers le répertoire de ce fichier si OpenClaw ne l’a pas détecté automatiquement.
  </Accordion>
  <Accordion title="Les commandes Claude ont été converties en Skills avec l’invocation par le modèle désactivée">
    Ce comportement est intentionnel. Les commandes Claude sont déclenchées par l’utilisateur ; OpenClaw les importe donc comme Skills avec `disable-model-invocation: true`. Modifiez le frontmatter de chaque Skill si vous souhaitez que l’agent les invoque automatiquement.
  </Accordion>
</AccordionGroup>

## Voir aussi

- [`openclaw migrate`](/fr/cli/migrate) : référence complète de la CLI, contrat de Plugin et structures JSON.
- [Guide de migration](/fr/install/migrating) : toutes les méthodes de migration.
- [Migration depuis Hermes](/fr/install/migrating-hermes) : l’autre méthode d’importation entre systèmes.
- [Intégration](/fr/cli/onboard) : déroulement de l’assistant et options non interactives.
- [Diagnostic](/fr/gateway/doctor) : contrôle de l’état de fonctionnement après la migration.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement de `AGENTS.md`, `USER.md` et des Skills.
