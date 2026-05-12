---
read_when:
    - Vous souhaitez migrer depuis Hermes ou un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration appartenant à un Plugin
summary: Référence CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agents)
title: Migrer
x-i18n:
    generated_at: "2026-05-12T00:58:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importez l’état depuis un autre système d’agent via un fournisseur de migration géré par un plugin. Les fournisseurs intégrés couvrent l’état de Codex CLI, [Claude](/fr/install/migrating-claude) et [Hermes](/fr/install/migrating-hermes) ; les plugins tiers peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour les guides destinés aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude) et [Migrer depuis Hermes](/fr/install/migrating-hermes). Le [hub de migration](/fr/install/migrating) répertorie tous les parcours.
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
  Autoriser l’application à remplacer des cibles existantes lorsque le plan signale des conflits.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignorer l’invite de confirmation. Requis en mode non interactif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Sélectionner un élément de copie de compétence par nom de compétence ou identifiant d’élément. Répétez l’option pour migrer plusieurs compétences. Lorsqu’elle est omise, les migrations Codex interactives affichent un sélecteur à cases à cocher et les migrations non interactives conservent toutes les compétences planifiées.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Sélectionner un élément d’installation de plugin Codex par nom de plugin ou identifiant d’élément. Répétez l’option pour migrer plusieurs plugins Codex. Lorsqu’elle est omise, les migrations Codex interactives affichent un sélecteur natif à cases à cocher de plugins Codex et les migrations non interactives conservent tous les plugins planifiés. Cela s’applique uniquement aux plugins Codex `openai-curated` installés depuis la source et découverts par l’inventaire du serveur d’application Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignorer la sauvegarde préalable à l’application. Nécessite `--force` lorsqu’un état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Requis avec `--no-backup` lorsque l’application refuserait sinon d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimer le plan ou le résultat d’application au format JSON. Avec `--json` et sans `--yes`, l’application imprime le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` fonctionne d’abord en prévisualisation.

<AccordionGroup>
  <Accordion title="Prévisualiser avant d’appliquer">
    Le fournisseur renvoie un plan détaillé avant toute modification, incluant les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration masquent les clés imbriquées ressemblant à des secrets, comme les clés d’API, jetons, en-têtes d’autorisation, cookies et mots de passe.

    `openclaw migrate apply <provider>` prévisualise le plan et demande confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, l’application nécessite `--yes`.

  </Accordion>
  <Accordion title="Sauvegardes">
    L’application crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. Si aucun état OpenClaw local n’existe encore, l’étape de sauvegarde est ignorée et la migration peut continuer. Pour ignorer une sauvegarde lorsqu’un état existe, passez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflits">
    L’application refuse de continuer lorsque le plan comporte des conflits. Examinez le plan, puis relancez avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent tout de même écrire des sauvegardes par élément pour les fichiers remplacés dans le répertoire du rapport de migration.
  </Accordion>
  <Accordion title="Secrets">
    Les secrets ne sont jamais importés par défaut. Utilisez `--include-secrets` pour importer les identifiants pris en charge.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude intégré détecte l’état de Claude Code dans `~/.claude` par défaut. Utilisez `--from <path>` pour importer un répertoire personnel Claude Code ou une racine de projet spécifique.

<Tip>
Pour un guide destiné aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude).
</Tip>

### Ce que Claude importe

- Les fichiers `CLAUDE.md` du projet et `.claude/CLAUDE.md` dans l’espace de travail de l’agent OpenClaw.
- Le fichier utilisateur `~/.claude/CLAUDE.md` ajouté à `USER.md` de l’espace de travail.
- Les définitions de serveurs MCP depuis `.mcp.json` du projet, `~/.claude.json` de Claude Code et `claude_desktop_config.json` de Claude Desktop.
- Les répertoires de compétences Claude qui incluent `SKILL.md`.
- Les fichiers Markdown de commandes Claude convertis en compétences OpenClaw avec invocation manuelle uniquement.

### État archivé et à révision manuelle

Les hooks Claude, permissions, valeurs par défaut d’environnement, mémoire locale, règles limitées à des chemins, sous-agents, caches, plans et historique de projet sont conservés dans le rapport de migration ou signalés comme éléments à révision manuelle. OpenClaw n’exécute pas les hooks, ne copie pas de listes d’autorisation larges et n’importe pas automatiquement l’état des identifiants OAuth/Desktop.

## Fournisseur Codex

Le fournisseur Codex intégré détecte l’état de Codex CLI dans `~/.codex` par défaut, ou
dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour
inventorier un répertoire personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous passez au harnais Codex d’OpenClaw et que vous souhaitez
promouvoir délibérément des ressources personnelles utiles de Codex CLI. Les lancements du serveur
d’application Codex local utilisent des répertoires `CODEX_HOME` et `HOME` propres à chaque agent,
ils ne lisent donc pas votre état personnel de Codex CLI par défaut.

L’exécution de `openclaw migrate codex` dans un terminal interactif prévisualise le plan
complet, puis ouvre des sélecteurs à cases à cocher avant la confirmation finale d’application. Les éléments de
copie de compétences sont demandés en premier. Utilisez `Toggle all on` ou `Toggle all off` pour une
sélection en masse ; les compétences planifiées commencent cochées, les compétences en conflit commencent décochées, et
`Skip for now` ignore les copies de compétences pour cette exécution tout en continuant vers la sélection
des plugins. Lorsque des plugins Codex sélectionnés installés depuis la source sont migrables et que
`--plugin` n’a pas été fourni, la migration demande ensuite l’activation native du plugin Codex
par nom de plugin. Les éléments de plugin
commencent cochés sauf si la configuration du plugin Codex cible d’OpenClaw possède déjà ce
plugin. Les plugins cibles existants commencent décochés et affichent une indication de conflit comme
`conflict: plugin exists` ; choisissez `Toggle all off` pour ne migrer aucun plugin Codex
natif dans cette exécution, ou `Skip for now` pour arrêter avant l’application. Pour les exécutions scriptées ou
exactes, passez `--skill <name>` une fois par compétence, par exemple :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Utilisez `--plugin <name>` pour limiter la migration non interactive des plugins Codex natifs
à un ou plusieurs plugins sélectionnés installés depuis la source :

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Ce que Codex importe

- Les répertoires de compétences Codex CLI sous `$CODEX_HOME/skills`, à l’exclusion du
  cache `.system` de Codex.
- Les AgentSkills personnels sous `$HOME/.agents/skills`, copiés dans l’espace de travail
  de l’agent OpenClaw actuel lorsque vous souhaitez une propriété par agent.
- Les plugins Codex `openai-curated` installés depuis la source et découverts via
  `plugin/list` du serveur d’application Codex. L’application appelle `plugin/install` du serveur d’application pour chaque
  plugin sélectionné, même si le serveur d’application cible signale déjà ce plugin comme
  installé et activé. Les plugins Codex migrés ne sont utilisables que dans les sessions qui
  sélectionnent le harnais Codex natif ; ils ne sont pas exposés à Pi, aux exécutions normales du
  fournisseur OpenAI, aux liaisons de conversation ACP ni aux autres harnais.

### État Codex à révision manuelle

Le fichier Codex `config.toml`, les `hooks/hooks.json` natifs, les places de marché non sélectionnées et
les bundles de plugins mis en cache qui ne sont pas des plugins sélectionnés installés depuis la source ne sont pas
activés automatiquement. Ils sont copiés ou signalés dans le rapport de migration pour
révision manuelle.

Pour les plugins sélectionnés installés depuis la source qui ont été migrés, l’application écrit :

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- une entrée de plugin explicite avec `marketplaceName: "openai-curated"` et
  `pluginName` pour chaque plugin sélectionné

La migration n’écrit jamais `plugins["*"]` et ne stocke jamais les chemins de cache
de place de marché locaux. Les installations nécessitant une authentification sont signalées sur l’élément de plugin concerné avec
`status: "skipped"`, `reason: "auth_required"` et des identifiants d’application nettoyés.
Leurs entrées de configuration explicites sont écrites comme désactivées jusqu’à ce que vous réautorisiez et
les activiez. Les autres échecs d’installation produisent des résultats `error` limités à l’élément.

Si l’inventaire des plugins du serveur d’application Codex est indisponible pendant la planification, la migration
se rabat sur des éléments d’avis de bundle mis en cache au lieu d’échouer toute la
migration.

## Fournisseur Hermes

Le fournisseur Hermes intégré détecte l’état dans `~/.hermes` par défaut. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce que Hermes importe

- La configuration de modèle par défaut depuis `config.yaml`.
- Les fournisseurs de modèles configurés et les points de terminaison personnalisés compatibles OpenAI depuis `providers` et `custom_providers`.
- Les définitions de serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md` ajoutés aux fichiers de mémoire de l’espace de travail.
- Les valeurs par défaut de configuration de mémoire pour la mémoire fichier OpenClaw, ainsi que des éléments d’archive ou à révision manuelle pour les fournisseurs de mémoire externes comme Honcho.
- Les compétences qui incluent un fichier `SKILL.md` sous `skills/<name>/`.
- Les valeurs de configuration par compétence depuis `skills.config`.
- Les clés d’API prises en charge depuis `.env`, uniquement avec `--include-secrets`.

### Clés `.env` prises en charge

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### État archivé uniquement

L’état Hermes qu’OpenClaw ne peut pas interpréter en toute sécurité est copié dans le rapport de migration pour révision manuelle, mais il n’est pas chargé dans la configuration ou les identifiants OpenClaw actifs. Cela préserve l’état opaque ou non sûr sans prétendre qu’OpenClaw peut l’exécuter ou lui faire confiance automatiquement :

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

## Contrat de plugin

Les sources de migration sont des plugins. Un plugin déclare ses identifiants de fournisseur dans `openclaw.plugin.json` :

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

À l’exécution, le plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le cœur possède l’orchestration CLI, la politique de sauvegarde, les invites, la sortie JSON et la vérification préalable des conflits. Le cœur transmet le plan validé à `apply(ctx, plan)`, et les fournisseurs ne peuvent reconstruire le plan que lorsque cet argument est absent pour compatibilité.

Les plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour la construction d’éléments et les comptes de synthèse, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers sensibles aux conflits, les copies de rapport archivées uniquement, les wrappers de runtime de configuration mis en cache et les rapports de migration.

## Intégration à l’onboarding

L’onboarding peut proposer une migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de plugin et affichent toujours une prévisualisation avant l’application.

<Note>
Les importations d’onboarding nécessitent une installation OpenClaw propre. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous avez déjà un état local. Les importations avec sauvegarde puis écrasement ou avec fusion sont soumises à un indicateur de fonctionnalité pour les installations existantes.
</Note>

## Connexe

- [Migration depuis Hermes](/fr/install/migrating-hermes) : guide pas à pas destiné aux utilisateurs.
- [Migration depuis Claude](/fr/install/migrating-claude) : guide pas à pas destiné aux utilisateurs.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : vérification de l’état après l’application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement de plugin.
