---
read_when:
    - Vous souhaitez migrer de Hermes ou d’un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration appartenant au Plugin
summary: Référence CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agents)
title: Migrer
x-i18n:
    generated_at: "2026-05-11T20:27:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importez l’état depuis un autre système d’agent via un fournisseur de migration détenu par un Plugin. Les fournisseurs intégrés couvrent l’état de Codex CLI, [Claude](/fr/install/migrating-claude) et [Hermes](/fr/install/migrating-hermes) ; les Plugins tiers peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour des guides destinés aux utilisateurs, consultez [Migration depuis Claude](/fr/install/migrating-claude) et [Migration depuis Hermes](/fr/install/migrating-hermes). Le [hub de migration](/fr/install/migrating) répertorie tous les parcours.
</Tip>

## Commandes

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
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
  Sélectionner un élément de copie de compétence par nom de compétence ou identifiant d’élément. Répétez l’indicateur pour migrer plusieurs compétences. Lorsqu’il est omis, les migrations Codex interactives affichent un sélecteur à cases à cocher et les migrations non interactives conservent toutes les compétences planifiées.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Sélectionner un élément d’installation de Plugin Codex par nom de Plugin ou identifiant d’élément. Répétez l’indicateur pour migrer plusieurs Plugins Codex. Lorsqu’il est omis, les migrations Codex interactives affichent un sélecteur natif à cases à cocher pour Plugins Codex et les migrations non interactives conservent tous les Plugins planifiés. Cela s’applique uniquement aux Plugins Codex `openai-curated` installés depuis la source et découverts par l’inventaire du serveur d’application Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignorer la sauvegarde préalable à l’application. Nécessite `--force` lorsque l’état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Requis avec `--no-backup` lorsque l’application refuserait autrement d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Afficher le plan ou le résultat d’application au format JSON. Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` donne priorité à l’aperçu.

<AccordionGroup>
  <Accordion title="Aperçu avant application">
    Le fournisseur renvoie un plan détaillé avant tout changement, incluant les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration expurgent les clés imbriquées ressemblant à des secrets, comme les clés API, les jetons, les en-têtes d’autorisation, les cookies et les mots de passe.

    `openclaw migrate apply <provider>` affiche un aperçu du plan et demande confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, l’application nécessite `--yes`.

  </Accordion>
  <Accordion title="Sauvegardes">
    L’application crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. Si aucun état OpenClaw local n’existe encore, l’étape de sauvegarde est ignorée et la migration peut continuer. Pour ignorer une sauvegarde lorsque l’état existe, passez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflits">
    L’application refuse de continuer lorsque le plan comporte des conflits. Examinez le plan, puis relancez avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent tout de même écrire des sauvegardes au niveau des éléments pour les fichiers remplacés dans le répertoire de rapports de migration.
  </Accordion>
  <Accordion title="Secrets">
    Les secrets ne sont jamais importés par défaut. Utilisez `--include-secrets` pour importer les identifiants pris en charge.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude intégré détecte l’état Claude Code dans `~/.claude` par défaut. Utilisez `--from <path>` pour importer un répertoire personnel ou une racine de projet Claude Code spécifique.

<Tip>
Pour un guide destiné aux utilisateurs, consultez [Migration depuis Claude](/fr/install/migrating-claude).
</Tip>

### Ce que Claude importe

- Le `CLAUDE.md` du projet et `.claude/CLAUDE.md` dans l’espace de travail de l’agent OpenClaw.
- Le `~/.claude/CLAUDE.md` utilisateur ajouté à `USER.md` dans l’espace de travail.
- Les définitions de serveurs MCP depuis `.mcp.json` du projet, `~/.claude.json` de Claude Code et `claude_desktop_config.json` de Claude Desktop.
- Les répertoires de Skills Claude qui incluent `SKILL.md`.
- Les fichiers Markdown de commandes Claude convertis en Skills OpenClaw avec invocation manuelle uniquement.

### État archivé et à révision manuelle

Les hooks Claude, permissions, valeurs d’environnement par défaut, mémoire locale, règles limitées aux chemins, sous-agents, caches, plans et historique de projet sont conservés dans le rapport de migration ou signalés comme éléments à réviser manuellement. OpenClaw n’exécute pas les hooks, ne copie pas les listes d’autorisation larges et n’importe pas automatiquement l’état OAuth/Desktop des identifiants.

## Fournisseur Codex

Le fournisseur Codex intégré détecte l’état Codex CLI dans `~/.codex` par défaut, ou dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour inventorier un répertoire personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous passez au harnais Codex OpenClaw et que vous voulez promouvoir délibérément des ressources personnelles utiles de Codex CLI. Les lancements du serveur d’application Codex local utilisent des répertoires `CODEX_HOME` et `HOME` propres à chaque agent ; ils ne lisent donc pas votre état personnel Codex CLI par défaut.

L’exécution de `openclaw migrate codex` dans un terminal interactif affiche un aperçu du plan complet, puis ouvre des sélecteurs à cases à cocher avant la confirmation finale d’application. Les éléments de copie de Skills sont demandés en premier. Utilisez `Toggle all on` ou `Toggle all off` pour la sélection en lot ; les Skills planifiées commencent cochées, les Skills en conflit commencent décochées, et `Skip for now` ignore les copies de Skills pour cette exécution tout en continuant vers la sélection de Plugins. Lorsque des Plugins Codex organisés installés depuis la source sont migrables et que `--plugin` n’a pas été fourni, la migration demande ensuite l’activation de Plugins Codex natifs par nom de Plugin. Les éléments de Plugin commencent cochés sauf si la configuration du Plugin Codex OpenClaw cible possède déjà ce Plugin. Les Plugins cibles existants commencent décochés et affichent une indication de conflit telle que `conflict: plugin exists` ; choisissez `Toggle all off` pour ne migrer aucun Plugin Codex natif lors de cette exécution, ou `Skip for now` pour arrêter avant l’application. Pour des exécutions scriptées ou exactes, passez `--skill <name>` une fois par compétence, par exemple :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Utilisez `--plugin <name>` pour limiter la migration de Plugins Codex natifs de manière non interactive à un ou plusieurs Plugins organisés installés depuis la source :

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Ce que Codex importe

- Les répertoires de Skills Codex CLI sous `$CODEX_HOME/skills`, à l’exclusion du cache `.system` de Codex.
- Les AgentSkills personnels sous `$HOME/.agents/skills`, copiés dans l’espace de travail de l’agent OpenClaw actuel lorsque vous souhaitez une propriété par agent.
- Les Plugins Codex `openai-curated` installés depuis la source et découverts via `plugin/list` du serveur d’application Codex. L’application appelle `plugin/install` du serveur d’application pour chaque Plugin sélectionné, même si le serveur d’application cible indique déjà que ce Plugin est installé et activé. Les Plugins Codex migrés ne sont utilisables que dans les sessions qui sélectionnent le harnais Codex natif ; ils ne sont pas exposés à Pi, aux exécutions normales du fournisseur OpenAI, aux liaisons de conversation ACP ni à d’autres harnais.

### État Codex à révision manuelle

Le `config.toml` Codex, les `hooks/hooks.json` natifs, les places de marché non organisées et les bundles de Plugins mis en cache qui ne sont pas des Plugins organisés installés depuis la source ne sont pas activés automatiquement. Ils sont copiés ou signalés dans le rapport de migration pour révision manuelle.

Pour les Plugins organisés installés depuis la source qui ont été migrés, l’application écrit :

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- une entrée de Plugin explicite avec `marketplaceName: "openai-curated"` et `pluginName` pour chaque Plugin sélectionné

La migration n’écrit jamais `plugins["*"]` et ne stocke jamais les chemins de cache de place de marché locale. Les installations nécessitant une authentification sont signalées sur l’élément de Plugin concerné avec `status: "skipped"`, `reason: "auth_required"` et des identifiants d’application nettoyés. Leurs entrées de configuration explicites sont écrites désactivées jusqu’à ce que vous les réautorisiez et les activiez. Les autres échecs d’installation sont des résultats `error` limités à l’élément.

Si l’inventaire des Plugins du serveur d’application Codex est indisponible pendant la planification, la migration se rabat sur des éléments consultatifs de bundle mis en cache au lieu de faire échouer toute la migration.

## Fournisseur Hermes

Le fournisseur Hermes intégré détecte l’état dans `~/.hermes` par défaut. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce que Hermes importe

- La configuration de modèle par défaut depuis `config.yaml`.
- Les fournisseurs de modèles configurés et les points de terminaison personnalisés compatibles OpenAI depuis `providers` et `custom_providers`.
- Les définitions de serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md` ajoutés aux fichiers de mémoire de l’espace de travail.
- Les valeurs par défaut de configuration de mémoire pour la mémoire de fichiers OpenClaw, plus des éléments archivés ou à révision manuelle pour les fournisseurs de mémoire externes comme Honcho.
- Les Skills qui incluent un fichier `SKILL.md` sous `skills/<name>/`.
- Les valeurs de configuration par Skill depuis `skills.config`.
- Les clés API prises en charge depuis `.env`, uniquement avec `--include-secrets`.

### Clés `.env` prises en charge

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### État archivé uniquement

L’état Hermes qu’OpenClaw ne peut pas interpréter en toute sécurité est copié dans le rapport de migration pour révision manuelle, mais il n’est pas chargé dans la configuration ou les identifiants OpenClaw actifs. Cela conserve l’état opaque ou dangereux sans prétendre qu’OpenClaw peut l’exécuter ou lui faire confiance automatiquement :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Après application

```bash
openclaw doctor
```

## Contrat de Plugin

Les sources de migration sont des Plugins. Un Plugin déclare ses identifiants de fournisseurs dans `openclaw.plugin.json` :

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

À l’exécution, le Plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le cœur possède l’orchestration CLI, la politique de sauvegarde, les invites, la sortie JSON et le précontrôle des conflits. Le cœur transmet le plan examiné à `apply(ctx, plan)`, et les fournisseurs ne peuvent reconstruire le plan que lorsque cet argument est absent pour compatibilité.

Les Plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour la construction d’éléments et les décomptes récapitulatifs, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers sensibles aux conflits, les copies de rapports archivés uniquement, les wrappers d’exécution de configuration mis en cache et les rapports de migration.

## Intégration à l’onboarding

L’onboarding peut proposer une migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de Plugin et affichent toujours un aperçu avant l’application.

<Note>
Les importations lors de l’intégration nécessitent une configuration OpenClaw neuve. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous avez déjà un état local. Les importations avec sauvegarde puis remplacement ou fusion sont soumises à un indicateur de fonctionnalité pour les configurations existantes.
</Note>

## Voir aussi

- [Migration depuis Hermes](/fr/install/migrating-hermes) : guide pas à pas destiné aux utilisateurs.
- [Migration depuis Claude](/fr/install/migrating-claude) : guide pas à pas destiné aux utilisateurs.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : contrôle d’intégrité après l’application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement des Plugins.
