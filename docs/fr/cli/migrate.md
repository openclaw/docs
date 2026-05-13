---
read_when:
    - Vous souhaitez migrer depuis Hermes ou un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration propre au Plugin
summary: Référence CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agents)
title: Migrer
x-i18n:
    generated_at: "2026-05-13T02:52:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importez l’état depuis un autre système d’agent via un fournisseur de migration détenu par un Plugin. Les fournisseurs intégrés couvrent l’état de la CLI Codex, [Claude](/fr/install/migrating-claude) et [Hermes](/fr/install/migrating-hermes) ; les Plugins tiers peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour des guides pas à pas destinés aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude) et [Migrer depuis Hermes](/fr/install/migrating-hermes). Le [hub de migration](/fr/install/migrating) liste tous les chemins.
</Tip>

## Commandes

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  Crée le plan et quitte sans modifier l’état.
</ParamField>
<ParamField path="--from <path>" type="string">
  Remplace le répertoire d’état source. Hermes utilise `~/.hermes` par défaut.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importe les identifiants pris en charge. Désactivé par défaut.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Autorise l’application à remplacer les cibles existantes lorsque le plan signale des conflits.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignore l’invite de confirmation. Obligatoire en mode non interactif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Sélectionne un élément de copie de skill par nom de skill ou identifiant d’élément. Répétez l’option pour migrer plusieurs skills. En cas d’omission, les migrations Codex interactives affichent un sélecteur à cases à cocher, et les migrations non interactives conservent tous les skills planifiés.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Sélectionne un élément d’installation de Plugin Codex par nom de Plugin ou identifiant d’élément. Répétez l’option pour migrer plusieurs Plugins Codex. En cas d’omission, les migrations Codex interactives affichent un sélecteur natif à cases à cocher de Plugins Codex, et les migrations non interactives conservent tous les Plugins planifiés. Cela s’applique uniquement aux Plugins Codex `openai-curated` installés côté source et découverts par l’inventaire du serveur d’applications Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex uniquement. Force une nouvelle traversée `app/list` du serveur d’applications Codex source avant de planifier l’activation native du Plugin. Désactivé par défaut pour garder la planification de migration rapide.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignore la sauvegarde préalable à l’application. Nécessite `--force` lorsqu’un état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatoire avec `--no-backup` lorsque l’application refuserait autrement d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Affiche le plan ou le résultat d’application au format JSON. Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` privilégie l’aperçu.

<AccordionGroup>
  <Accordion title="Aperçu avant application">
    Le fournisseur renvoie un plan détaillé par élément avant toute modification, avec les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration masquent les clés imbriquées qui ressemblent à des secrets, comme les clés API, les jetons, les en-têtes d’autorisation, les cookies et les mots de passe.

    `openclaw migrate apply <provider>` affiche un aperçu du plan et demande confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, l’application nécessite `--yes`.

  </Accordion>
  <Accordion title="Sauvegardes">
    L’application crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. Si aucun état OpenClaw local n’existe encore, l’étape de sauvegarde est ignorée et la migration peut continuer. Pour ignorer une sauvegarde lorsqu’un état existe, passez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflits">
    L’application refuse de continuer lorsque le plan comporte des conflits. Examinez le plan, puis relancez avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent toujours écrire des sauvegardes par élément pour les fichiers écrasés dans le répertoire du rapport de migration.
  </Accordion>
  <Accordion title="Secrets">
    Les secrets ne sont jamais importés par défaut. Utilisez `--include-secrets` pour importer les identifiants pris en charge.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude intégré détecte l’état de Claude Code dans `~/.claude` par défaut. Utilisez `--from <path>` pour importer un répertoire personnel Claude Code ou une racine de projet spécifique.

<Tip>
Pour un guide pas à pas destiné aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude).
</Tip>

### Ce que Claude importe

- Les fichiers `CLAUDE.md` de projet et `.claude/CLAUDE.md` dans l’espace de travail de l’agent OpenClaw.
- Le fichier utilisateur `~/.claude/CLAUDE.md` ajouté à `USER.md` dans l’espace de travail.
- Les définitions de serveurs MCP depuis le fichier de projet `.mcp.json`, Claude Code `~/.claude.json` et Claude Desktop `claude_desktop_config.json`.
- Les répertoires de skills Claude qui incluent `SKILL.md`.
- Les fichiers Markdown de commandes Claude convertis en skills OpenClaw à invocation manuelle uniquement.

### État archivé et à examiner manuellement

Les hooks Claude, autorisations, valeurs par défaut d’environnement, mémoire locale, règles limitées à des chemins, sous-agents, caches, plans et historique de projet sont conservés dans le rapport de migration ou signalés comme éléments à examiner manuellement. OpenClaw n’exécute pas les hooks, ne copie pas les listes d’autorisation générales et n’importe pas automatiquement l’état des identifiants OAuth/Desktop.

## Fournisseur Codex

Le fournisseur Codex intégré détecte l’état de la CLI Codex dans `~/.codex` par défaut, ou dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour inventorier un répertoire personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous passez au harness Codex OpenClaw et que vous souhaitez promouvoir délibérément des ressources personnelles utiles de la CLI Codex. Les lancements locaux du serveur d’applications Codex utilisent des répertoires `CODEX_HOME` et `HOME` propres à chaque agent ; ils ne lisent donc pas votre état personnel de la CLI Codex par défaut.

L’exécution de `openclaw migrate codex` dans un terminal interactif affiche un aperçu du plan complet, puis ouvre des sélecteurs à cases à cocher avant la confirmation finale d’application. Les éléments de copie de skill sont demandés en premier. Utilisez `Toggle all on` ou `Toggle all off` pour une sélection en lot. Appuyez sur Espace pour basculer les lignes, ou appuyez sur Entrée pour activer la ligne en surbrillance et continuer. Les skills planifiés commencent cochés, les skills en conflit commencent décochés, et `Skip for now` ignore les copies de skills pour cette exécution tout en continuant vers la sélection de Plugins. Lorsque des Plugins Codex organisés installés côté source peuvent être migrés et que `--plugin` n’a pas été fourni, la migration demande ensuite l’activation native des Plugins Codex par nom de Plugin. Les éléments de Plugin commencent cochés, sauf si la configuration du Plugin Codex OpenClaw cible contient déjà ce Plugin. Les Plugins cibles existants commencent décochés et affichent une indication de conflit telle que `conflict: plugin exists` ; choisissez `Toggle all off` pour ne migrer aucun Plugin Codex natif dans cette exécution, ou `Skip for now` pour arrêter avant l’application. Pour les exécutions scriptées ou exactes, passez `--skill <name>` une fois par skill, par exemple :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Utilisez `--plugin <name>` pour limiter de manière non interactive la migration des Plugins Codex natifs à un ou plusieurs Plugins organisés installés côté source :

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Ce que Codex importe

- Les répertoires de skills de la CLI Codex sous `$CODEX_HOME/skills`, à l’exclusion du cache `.system` de Codex.
- Les AgentSkills personnels sous `$HOME/.agents/skills`, copiés dans l’espace de travail de l’agent OpenClaw actuel lorsque vous souhaitez une propriété par agent.
- Les Plugins Codex `openai-curated` installés côté source et découverts via `plugin/list` du serveur d’applications Codex. La planification lit `plugin/read` pour chaque Plugin installé et activé. Les Plugins adossés à une application exigent que la réponse de compte du serveur d’applications Codex source soit un compte avec abonnement ChatGPT ; les réponses de compte non ChatGPT ou manquantes sont ignorées avec `codex_subscription_required`. Par défaut, la migration n’appelle pas `app/list` côté source ; les Plugins adossés à une application qui passent la vérification du compte sont donc planifiés sans vérification de l’accessibilité de l’application source, et les échecs de transport de recherche de compte sont ignorés avec `codex_account_unavailable`. Passez `--verify-plugin-apps` lorsque vous voulez que la migration force un nouvel instantané `app/list` source et exige que chaque application possédée soit présente, activée et accessible avant de planifier l’activation native. Dans ce mode, les échecs de transport de recherche de compte retombent sur la vérification de l’inventaire des applications source. L’instantané de l’inventaire des applications source est conservé en mémoire pour le processus actuel ; il n’est pas écrit dans la sortie de migration ni dans la configuration cible. Les Plugins désactivés, les détails de Plugin illisibles, les comptes source soumis à abonnement et, lorsque la vérification est demandée, les applications manquantes, désactivées, inaccessibles ou les échecs d’inventaire des applications source deviennent des éléments ignorés manuels avec des raisons typées au lieu d’entrées de configuration cible.
  L’application appelle `plugin/install` du serveur d’applications pour chaque Plugin éligible sélectionné, même si le serveur d’applications cible indique déjà que ce Plugin est installé et activé. Les Plugins Codex migrés ne sont utilisables que dans les sessions qui sélectionnent le harness Codex natif ; ils ne sont pas exposés à Pi, aux exécutions normales du fournisseur OpenAI, aux liaisons de conversation ACP ni aux autres harnesses.

### État Codex à examiner manuellement

Le fichier Codex `config.toml`, les `hooks/hooks.json` natifs, les places de marché non organisées, les bundles de Plugins mis en cache qui ne sont pas des Plugins organisés installés côté source, et les Plugins installés côté source qui échouent à la vérification d’abonnement source ne sont pas activés automatiquement. Lorsque `--verify-plugin-apps` est défini, les Plugins qui échouent à la vérification d’inventaire des applications source sont également ignorés. Ils sont copiés ou signalés dans le rapport de migration pour examen manuel.

Pour les Plugins organisés installés côté source qui sont migrés, l’application écrit :

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- une entrée de Plugin explicite avec `marketplaceName: "openai-curated"` et `pluginName` pour chaque Plugin sélectionné

La migration n’écrit jamais `plugins["*"]` et ne stocke jamais les chemins de cache de place de marché locale. Les échecs d’abonnement côté source sont signalés sur les éléments manuels avec des raisons typées comme `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` ou `plugin_read_unavailable`. Avec `--verify-plugin-apps`, les échecs d’inventaire des applications source peuvent également apparaître sous la forme `app_inaccessible`, `app_disabled`, `app_missing` ou `app_inventory_unavailable`. Les Plugins ignorés ne sont pas écrits dans la configuration cible.
Les installations côté cible nécessitant une authentification sont signalées sur l’élément de Plugin concerné avec `status: "skipped"`, `reason: "auth_required"` et des identifiants d’application assainis. Leurs entrées de configuration explicites sont écrites désactivées jusqu’à ce que vous les réautorisiez et les activiez. Les autres échecs d’installation sont des résultats `error` limités à l’élément.

Si l’inventaire des Plugins du serveur d’applications Codex est indisponible pendant la planification, la migration se rabat sur des éléments consultatifs de bundles mis en cache au lieu de faire échouer toute la migration.

## Fournisseur Hermes

Le fournisseur Hermes intégré détecte l’état dans `~/.hermes` par défaut. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce que Hermes importe

- Configuration du modèle par défaut à partir de `config.yaml`.
- Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles avec OpenAI à partir de `providers` et `custom_providers`.
- Définitions des serveurs MCP à partir de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md` ajoutés aux fichiers de mémoire de l’espace de travail.
- Paramètres par défaut de configuration de mémoire pour la mémoire fichier d’OpenClaw, plus des éléments d’archive ou à réviser manuellement pour les fournisseurs de mémoire externes tels que Honcho.
- Skills qui incluent un fichier `SKILL.md` sous `skills/<name>/`.
- Valeurs de configuration propres à chaque Skill à partir de `skills.config`.
- Clés API prises en charge à partir de `.env`, uniquement avec `--include-secrets`.

### Clés `.env` prises en charge

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### État réservé à l’archive

L’état Hermes qu’OpenClaw ne peut pas interpréter en toute sécurité est copié dans le rapport de migration pour révision manuelle, mais il n’est pas chargé dans la configuration ou les identifiants OpenClaw actifs. Cela préserve l’état opaque ou non sûr sans prétendre qu’OpenClaw peut l’exécuter ou lui faire automatiquement confiance :

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

Les sources de migration sont des plugins. Un plugin déclare ses identifiants de fournisseur dans `openclaw.plugin.json` :

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

À l’exécution, le plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le noyau possède l’orchestration CLI, la politique de sauvegarde, les invites, la sortie JSON et le précontrôle des conflits. Le noyau transmet le plan relu à `apply(ctx, plan)`, et les fournisseurs peuvent reconstruire le plan uniquement lorsque cet argument est absent, à des fins de compatibilité.

Les plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour la construction des éléments et les décomptes récapitulatifs, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers conscientes des conflits, les copies de rapport réservées à l’archive, les wrappers de runtime de configuration mis en cache et les rapports de migration.

## Intégration à l’onboarding

L’onboarding peut proposer une migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de plugin et affichent toujours un aperçu avant application.

<Note>
Les imports d’onboarding nécessitent une installation OpenClaw fraîche. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous avez déjà un état local. Les imports avec sauvegarde plus écrasement ou fusion sont protégés par un feature gate pour les installations existantes.
</Note>

## Connexe

- [Migrer depuis Hermes](/fr/install/migrating-hermes) : guide utilisateur.
- [Migrer depuis Claude](/fr/install/migrating-claude) : guide utilisateur.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : vérification de santé après application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement de plugins.
