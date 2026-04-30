---
read_when:
    - Vous souhaitez migrer de Hermes ou d’un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration géré par un Plugin
summary: Référence CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agents)
title: Migrer
x-i18n:
    generated_at: "2026-04-30T20:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe l’état depuis un autre système d’agent via un fournisseur de migration détenu par un Plugin. Les fournisseurs inclus couvrent l’état de la CLI Codex, [Claude](/fr/install/migrating-claude) et [Hermes](/fr/install/migrating-hermes) ; les plugins tiers peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour des guides destinés aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude) et [Migrer depuis Hermes](/fr/install/migrating-hermes). Le [hub de migration](/fr/install/migrating) répertorie tous les chemins.
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
  Génère le plan et quitte sans modifier l’état.
</ParamField>
<ParamField path="--from <path>" type="string">
  Remplace le répertoire d’état source. Hermes utilise `~/.hermes` par défaut.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importe les identifiants pris en charge. Désactivé par défaut.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Autorise apply à remplacer les cibles existantes lorsque le plan signale des conflits.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignore l’invite de confirmation. Requis en mode non interactif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Sélectionne un élément de copie de compétence par nom de compétence ou identifiant d’élément. Répétez l’option pour migrer plusieurs compétences. En cas d’omission, les migrations Codex interactives affichent un sélecteur à cases à cocher et les migrations non interactives conservent toutes les compétences prévues.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignore la sauvegarde préalable à l’application. Nécessite `--force` lorsqu’un état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Requis avec `--no-backup` lorsque apply refuserait autrement d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Affiche le plan ou le résultat d’application au format JSON. Avec `--json` et sans `--yes`, apply affiche le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` privilégie l’aperçu.

<AccordionGroup>
  <Accordion title="Aperçu avant application">
    Le fournisseur renvoie un plan détaillé avant toute modification, incluant les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration masquent les clés imbriquées qui semblent secrètes, comme les clés d’API, les jetons, les en-têtes d’autorisation, les cookies et les mots de passe.

    `openclaw migrate apply <provider>` affiche un aperçu du plan et demande confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, apply nécessite `--yes`.

  </Accordion>
  <Accordion title="Sauvegardes">
    Apply crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. S’il n’existe encore aucun état OpenClaw local, l’étape de sauvegarde est ignorée et la migration peut continuer. Pour ignorer une sauvegarde lorsqu’un état existe, passez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflits">
    Apply refuse de continuer lorsque le plan comporte des conflits. Examinez le plan, puis réexécutez avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent tout de même écrire des sauvegardes au niveau des éléments pour les fichiers remplacés dans le répertoire de rapport de migration.
  </Accordion>
  <Accordion title="Secrets">
    Les secrets ne sont jamais importés par défaut. Utilisez `--include-secrets` pour importer les identifiants pris en charge.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude inclus détecte l’état Claude Code dans `~/.claude` par défaut. Utilisez `--from <path>` pour importer un dossier personnel Claude Code ou une racine de projet spécifique.

<Tip>
Pour un guide destiné aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude).
</Tip>

### Ce que Claude importe

- `CLAUDE.md` du projet et `.claude/CLAUDE.md` dans l’espace de travail de l’agent OpenClaw.
- `~/.claude/CLAUDE.md` utilisateur ajouté à `USER.md` dans l’espace de travail.
- Définitions de serveurs MCP depuis `.mcp.json` du projet, `~/.claude.json` de Claude Code et `claude_desktop_config.json` de Claude Desktop.
- Répertoires de Skills Claude qui incluent `SKILL.md`.
- Fichiers Markdown de commandes Claude convertis en Skills OpenClaw avec invocation manuelle uniquement.

### État archivé et à examiner manuellement

Les hooks Claude, les permissions, les valeurs par défaut d’environnement, la mémoire locale, les règles limitées à des chemins, les sous-agents, les caches, les plans et l’historique de projet sont conservés dans le rapport de migration ou signalés comme éléments à examiner manuellement. OpenClaw n’exécute pas les hooks, ne copie pas les listes d’autorisation larges et n’importe pas automatiquement l’état des identifiants OAuth/Desktop.

## Fournisseur Codex

Le fournisseur Codex inclus détecte l’état de la CLI Codex dans `~/.codex` par défaut, ou
dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour
inventorier un dossier personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous passez au harnais Codex d’OpenClaw et que vous souhaitez
promouvoir délibérément des ressources personnelles utiles de la CLI Codex. Les lancements locaux du
serveur d’application Codex utilisent des répertoires `CODEX_HOME` et `HOME` propres à chaque agent ; ils ne lisent donc pas
votre état personnel de la CLI Codex par défaut.

L’exécution de `openclaw migrate codex` dans un terminal interactif affiche un aperçu du plan
complet, puis ouvre un sélecteur à cases à cocher pour les éléments de copie de skills avant la
confirmation finale d’application. Toutes les skills sont sélectionnées au départ ; décochez toute skill que vous ne souhaitez pas
copier dans cet agent. Pour les exécutions scriptées ou exactes, passez `--skill <name>` une fois
par skill, par exemple :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Ce que Codex importe

- Répertoires de Skills de la CLI Codex sous `$CODEX_HOME/skills`, à l’exclusion du cache
  `.system` de Codex.
- AgentSkills personnels sous `$HOME/.agents/skills`, copiés dans l’espace de travail actuel de
  l’agent OpenClaw lorsque vous voulez une propriété par agent.

### État Codex à examiner manuellement

Les plugins natifs Codex, `config.toml` et les `hooks/hooks.json` natifs ne sont pas
activés automatiquement. Les plugins peuvent exposer des serveurs MCP, des applications, des hooks ou d’autres
comportements exécutables ; le fournisseur les signale donc pour examen au lieu de les charger
dans OpenClaw. Les fichiers de configuration et de hooks sont copiés dans le rapport de migration
pour examen manuel.

## Fournisseur Hermes

Le fournisseur Hermes inclus détecte l’état dans `~/.hermes` par défaut. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce que Hermes importe

- Configuration du modèle par défaut depuis `config.yaml`.
- Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles OpenAI depuis `providers` et `custom_providers`.
- Définitions de serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md` ajoutés aux fichiers de mémoire de l’espace de travail.
- Valeurs par défaut de configuration mémoire pour la mémoire fichier OpenClaw, plus éléments archivés ou à examiner manuellement pour les fournisseurs de mémoire externes comme Honcho.
- Skills qui incluent un fichier `SKILL.md` sous `skills/<name>/`.
- Valeurs de configuration par skill depuis `skills.config`.
- Clés d’API prises en charge depuis `.env`, uniquement avec `--include-secrets`.

### Clés `.env` prises en charge

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### État uniquement archivé

L’état Hermes qu’OpenClaw ne peut pas interpréter en toute sécurité est copié dans le rapport de migration pour examen manuel, mais il n’est pas chargé dans la configuration ou les identifiants OpenClaw actifs. Cela préserve l’état opaque ou dangereux sans prétendre qu’OpenClaw peut l’exécuter ou lui faire automatiquement confiance :

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

Les sources de migration sont des plugins. Un plugin déclare ses identifiants de fournisseur dans `openclaw.plugin.json` :

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

À l’exécution, le plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le noyau possède l’orchestration CLI, la politique de sauvegarde, les invites, la sortie JSON et la vérification préalable des conflits. Le noyau transmet le plan examiné à `apply(ctx, plan)`, et les fournisseurs ne peuvent reconstruire le plan que lorsque cet argument est absent, pour compatibilité.

Les plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour la construction d’éléments et les décomptes récapitulatifs, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers tenant compte des conflits, les copies de rapport uniquement archivées, les wrappers de runtime de configuration mis en cache et les rapports de migration.

## Intégration à l’onboarding

L’onboarding peut proposer la migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de plugin et affichent toujours un aperçu avant application.

<Note>
Les imports d’onboarding nécessitent une configuration OpenClaw fraîche. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous avez déjà un état local. Les imports avec sauvegarde plus remplacement ou fusion sont soumis à un indicateur de fonctionnalité pour les configurations existantes.
</Note>

## Connexe

- [Migrer depuis Hermes](/fr/install/migrating-hermes) : guide destiné aux utilisateurs.
- [Migrer depuis Claude](/fr/install/migrating-claude) : guide destiné aux utilisateurs.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : contrôle d’intégrité après application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement de plugins.
