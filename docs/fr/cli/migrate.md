---
read_when:
    - Vous souhaitez migrer depuis Hermes ou un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration appartenant à un Plugin
summary: Référence CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agents)
title: Migrer
x-i18n:
    generated_at: "2026-05-06T07:16:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importez l’état depuis un autre système d’agent via un fournisseur de migration appartenant à un Plugin. Les fournisseurs intégrés couvrent l’état de Codex CLI, [Claude](/fr/install/migrating-claude) et [Hermes](/fr/install/migrating-hermes) ; les Plugins tiers peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour les guides destinés aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude) et [Migrer depuis Hermes](/fr/install/migrating-hermes). Le [hub de migration](/fr/install/migrating) répertorie tous les chemins.
</Tip>

## Commandes

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nom d’un fournisseur de migration enregistré, par exemple `hermes`. Exécutez `openclaw migrate list` pour voir les fournisseurs installés.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Construire le plan et quitter sans modifier l’état.
</ParamField>
<ParamField path="--from <path>" type="string">
  Remplacer le répertoire d’état source. Hermes utilise `~/.hermes` par défaut.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importer les identifiants pris en charge. Désactivé par défaut.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Autoriser l’application à remplacer les cibles existantes lorsque le plan signale des conflits.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignorer l’invite de confirmation. Requis en mode non interactif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Sélectionner un élément de copie de compétence par nom de compétence ou identifiant d’élément. Répétez l’option pour migrer plusieurs Skills. En cas d’omission, les migrations Codex interactives affichent un sélecteur avec cases à cocher et les migrations non interactives conservent toutes les Skills planifiées.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignorer la sauvegarde préalable à l’application. Requiert `--force` lorsque l’état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Requis avec `--no-backup` lorsque l’application refuserait autrement d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Afficher le plan ou le résultat d’application au format JSON. Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` commence toujours par un aperçu.

<AccordionGroup>
  <Accordion title="Aperçu avant application">
    Le fournisseur renvoie un plan détaillé avant toute modification, incluant les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration masquent les clés imbriquées ressemblant à des secrets, comme les clés API, les jetons, les en-têtes d’autorisation, les cookies et les mots de passe.

    `openclaw migrate apply <provider>` affiche un aperçu du plan et demande confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, l’application requiert `--yes`.

  </Accordion>
  <Accordion title="Sauvegardes">
    L’application crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. Si aucun état OpenClaw local n’existe encore, l’étape de sauvegarde est ignorée et la migration peut continuer. Pour ignorer une sauvegarde lorsque l’état existe, passez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflits">
    L’application refuse de continuer lorsque le plan contient des conflits. Passez le plan en revue, puis relancez avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent tout de même écrire des sauvegardes au niveau des éléments pour les fichiers remplacés dans le répertoire du rapport de migration.
  </Accordion>
  <Accordion title="Secrets">
    Les secrets ne sont jamais importés par défaut. Utilisez `--include-secrets` pour importer les identifiants pris en charge.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude intégré détecte par défaut l’état de Claude Code dans `~/.claude`. Utilisez `--from <path>` pour importer un dossier personnel Claude Code ou une racine de projet spécifique.

<Tip>
Pour un guide destiné aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude).
</Tip>

### Ce que Claude importe

- `CLAUDE.md` de projet et `.claude/CLAUDE.md` dans l’espace de travail de l’agent OpenClaw.
- `~/.claude/CLAUDE.md` utilisateur ajouté à `USER.md` de l’espace de travail.
- Définitions de serveurs MCP depuis `.mcp.json` de projet, `~/.claude.json` de Claude Code et `claude_desktop_config.json` de Claude Desktop.
- Répertoires de Skills Claude qui incluent `SKILL.md`.
- Fichiers Markdown de commandes Claude convertis en Skills OpenClaw avec invocation manuelle uniquement.

### État archivé et à réviser manuellement

Les hooks, permissions, valeurs par défaut d’environnement, mémoire locale, règles limitées à des chemins, sous-agents, caches, plans et historique de projet Claude sont conservés dans le rapport de migration ou signalés comme éléments à réviser manuellement. OpenClaw n’exécute pas les hooks, ne copie pas les listes d’autorisation larges et n’importe pas automatiquement l’état des identifiants OAuth/Desktop.

## Fournisseur Codex

Le fournisseur Codex intégré détecte par défaut l’état de Codex CLI dans `~/.codex`, ou
dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour
inventorier un dossier personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous migrez vers le harnais Codex d’OpenClaw et que vous souhaitez
promouvoir délibérément des ressources personnelles utiles de Codex CLI. Les lancements locaux du serveur d’application Codex
utilisent des répertoires `CODEX_HOME` et `HOME` propres à chaque agent ; ils ne lisent donc pas
votre état personnel Codex CLI par défaut.

L’exécution de `openclaw migrate codex` dans un terminal interactif affiche l’aperçu du
plan complet, puis ouvre un sélecteur avec cases à cocher pour les éléments de copie de Skills avant la confirmation finale
d’application. Utilisez `Toggle all on` ou `Toggle all off` pour une sélection groupée ;
les Skills planifiées commencent cochées, les Skills en conflit commencent décochées, et `Skip for now`
laisse les Skills inchangées sans appliquer. Pour les exécutions scriptées ou exactes, passez
`--skill <name>` une fois par Skill, par exemple :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Ce que Codex importe

- Répertoires de Skills Codex CLI sous `$CODEX_HOME/skills`, à l’exclusion du
  cache `.system` de Codex.
- AgentSkills personnelles sous `$HOME/.agents/skills`, copiées dans l’espace de travail
  de l’agent OpenClaw actuel lorsque vous souhaitez une propriété par agent.

### État Codex à réviser manuellement

Les Plugins natifs Codex, `config.toml` et `hooks/hooks.json` natif ne sont pas
activés automatiquement. Les Plugins peuvent exposer des serveurs MCP, des applications, des hooks ou d’autres
comportements exécutables ; le fournisseur les signale donc pour révision au lieu de les charger
dans OpenClaw. Les fichiers de configuration et de hooks sont copiés dans le rapport de migration
pour révision manuelle.

## Fournisseur Hermes

Le fournisseur Hermes intégré détecte par défaut l’état dans `~/.hermes`. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce que Hermes importe

- Configuration de modèle par défaut depuis `config.yaml`.
- Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles OpenAI depuis `providers` et `custom_providers`.
- Définitions de serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md` ajoutés aux fichiers de mémoire de l’espace de travail.
- Valeurs par défaut de configuration mémoire pour la mémoire fichier OpenClaw, ainsi que des éléments archivés ou à réviser manuellement pour les fournisseurs de mémoire externes comme Honcho.
- Skills qui incluent un fichier `SKILL.md` sous `skills/<name>/`.
- Valeurs de configuration par Skill depuis `skills.config`.
- Clés API prises en charge depuis `.env`, uniquement avec `--include-secrets`.

### Clés `.env` prises en charge

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### État archivé uniquement

L’état Hermes qu’OpenClaw ne peut pas interpréter en sécurité est copié dans le rapport de migration pour révision manuelle, mais il n’est pas chargé dans la configuration ou les identifiants OpenClaw actifs. Cela préserve l’état opaque ou non sûr sans prétendre qu’OpenClaw peut l’exécuter ou lui faire automatiquement confiance :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Après l’application

```bash
openclaw doctor
```

## Contrat de Plugin

Les sources de migration sont des Plugins. Un Plugin déclare ses identifiants de fournisseur dans `openclaw.plugin.json` :

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

À l’exécution, le Plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le noyau possède l’orchestration CLI, la politique de sauvegarde, les invites, la sortie JSON et la prévalidation des conflits. Le noyau transmet le plan révisé à `apply(ctx, plan)`, et les fournisseurs ne peuvent reconstruire le plan que lorsque cet argument est absent pour compatibilité.

Les Plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour la construction d’éléments et les compteurs de résumé, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers tenant compte des conflits, les copies de rapport d’archive uniquement, les wrappers config-runtime mis en cache et les rapports de migration.

## Intégration à l’onboarding

L’onboarding peut proposer une migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de Plugin et affichent toujours un aperçu avant application.

<Note>
Les imports d’onboarding nécessitent une installation OpenClaw fraîche. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous disposez déjà d’un état local. Les imports avec sauvegarde plus remplacement ou fusion sont soumis à un indicateur de fonctionnalité pour les installations existantes.
</Note>

## Connexe

- [Migrer depuis Hermes](/fr/install/migrating-hermes) : guide destiné aux utilisateurs.
- [Migrer depuis Claude](/fr/install/migrating-claude) : guide destiné aux utilisateurs.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : contrôle de santé après l’application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement de Plugins.
