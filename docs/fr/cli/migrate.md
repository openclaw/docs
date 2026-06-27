---
read_when:
    - Vous souhaitez migrer depuis Hermes ou un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration appartenant au Plugin
summary: Référence CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agent)
title: Migrer
x-i18n:
    generated_at: "2026-06-27T17:19:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importez l’état depuis un autre système d’agent via un fournisseur de migration détenu par un plugin. Les fournisseurs groupés couvrent l’état de la CLI Codex, [Claude](/fr/install/migrating-claude) et [Hermes](/fr/install/migrating-hermes) ; les Plugins tiers peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour des guides pas à pas destinés aux utilisateurs, consultez [Migration depuis Claude](/fr/install/migrating-claude) et [Migration depuis Hermes](/fr/install/migrating-hermes). Le [hub de migration](/fr/install/migrating) répertorie tous les parcours.
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
  Construire le plan et quitter sans modifier l’état.
</ParamField>
<ParamField path="--from <path>" type="string">
  Remplacer le répertoire d’état source. Hermes utilise `~/.hermes` par défaut.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importer les identifiants pris en charge sans invite. L’application interactive demande confirmation avant d’importer les identifiants d’authentification détectés, avec oui sélectionné par défaut ; le mode non interactif `--yes` nécessite `--include-secrets` pour les importer.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Ignorer l’import des identifiants d’authentification, y compris l’invite interactive.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Autoriser l’application à remplacer les cibles existantes lorsque le plan signale des conflits.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignorer l’invite de confirmation. Requis en mode non interactif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Sélectionner un élément de copie de skill par nom de skill ou identifiant d’élément. Répétez l’option pour migrer plusieurs skills. En cas d’omission, les migrations Codex interactives affichent un sélecteur de cases à cocher, et les migrations non interactives conservent toutes les skills planifiées.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Sélectionner un élément d’installation de Plugin Codex par nom de Plugin ou identifiant d’élément. Répétez l’option pour migrer plusieurs Plugins Codex. En cas d’omission, les migrations Codex interactives affichent un sélecteur de cases à cocher de Plugins Codex natifs, et les migrations non interactives conservent tous les Plugins planifiés. Cela s’applique uniquement aux Plugins Codex `openai-curated` installés à la source et découverts par l’inventaire du serveur d’applications Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex uniquement. Forcer un nouveau parcours `app/list` du serveur d’applications Codex source avant de planifier l’activation de Plugins natifs. Désactivé par défaut pour garder la planification de migration rapide.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignorer la sauvegarde préalable à l’application. Nécessite `--force` lorsqu’un état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Requis avec `--no-backup` lorsque l’application refuserait autrement d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Afficher le plan ou le résultat d’application au format JSON. Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` donne la priorité à l’aperçu.

<AccordionGroup>
  <Accordion title="Preview before apply">
    Le fournisseur renvoie un plan détaillé par élément avant toute modification, avec les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration masquent les clés imbriquées qui ressemblent à des secrets, comme les clés d’API, les jetons, les en-têtes d’autorisation, les cookies et les mots de passe.

    `openclaw migrate apply <provider>` affiche un aperçu du plan et demande confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, l’application nécessite `--yes`.

  </Accordion>
  <Accordion title="Backups">
    L’application crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. Si aucun état OpenClaw local n’existe encore, l’étape de sauvegarde est ignorée et la migration peut continuer. Pour ignorer une sauvegarde lorsqu’un état existe, passez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    L’application refuse de continuer lorsque le plan comporte des conflits. Examinez le plan, puis réexécutez avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent tout de même écrire des sauvegardes par élément pour les fichiers écrasés dans le répertoire du rapport de migration.
  </Accordion>
  <Accordion title="Secrets">
    L’application interactive demande s’il faut importer les identifiants d’authentification détectés, avec oui sélectionné par défaut. Utilisez `--no-auth-credentials` pour les ignorer, ou `--include-secrets` pour l’import d’identifiants sans surveillance avec `--yes`.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude groupé détecte par défaut l’état de Claude Code dans `~/.claude`. Utilisez `--from <path>` pour importer un répertoire personnel Claude Code ou une racine de projet spécifique.

<Tip>
Pour un guide pas à pas destiné aux utilisateurs, consultez [Migration depuis Claude](/fr/install/migrating-claude).
</Tip>

### Ce que Claude importe

- Le `CLAUDE.md` du projet et `.claude/CLAUDE.md` dans l’espace de travail d’agent OpenClaw.
- Le `~/.claude/CLAUDE.md` utilisateur ajouté à `USER.md` dans l’espace de travail.
- Les définitions de serveurs MCP depuis le `.mcp.json` du projet, `~/.claude.json` de Claude Code et `claude_desktop_config.json` de Claude Desktop.
- Les répertoires de skills Claude qui incluent `SKILL.md`.
- Les fichiers Markdown de commandes Claude convertis en skills OpenClaw avec invocation manuelle uniquement.

### État archivé et à examiner manuellement

Les hooks, autorisations, valeurs d’environnement par défaut, mémoire locale, règles limitées à des chemins, sous-agents, caches, plans et historique de projet Claude sont conservés dans le rapport de migration ou signalés comme éléments à examiner manuellement. OpenClaw n’exécute pas les hooks, ne copie pas les listes d’autorisation larges et n’importe pas automatiquement l’état des identifiants OAuth/Desktop.

## Fournisseur Codex

Le fournisseur Codex groupé détecte par défaut l’état de la CLI Codex dans `~/.codex`, ou
dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour
inventorier un répertoire personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous passez au harnais Codex OpenClaw et que vous voulez
promouvoir délibérément des ressources personnelles utiles de la CLI Codex. Les lancements du serveur d’applications
Codex local utilisent un `CODEX_HOME` par agent, ils ne lisent donc pas votre
`~/.codex` personnel par défaut. Le processus normal `HOME` reste hérité, donc Codex
peut voir les entrées de marché de skills/Plugins partagées dans `$HOME/.agents/*` et
les sous-processus peuvent trouver la configuration et les jetons du répertoire personnel utilisateur.

L’exécution de `openclaw migrate codex` dans un terminal interactif affiche l’aperçu du
plan complet, puis ouvre des sélecteurs à cases à cocher avant la confirmation finale d’application. Les éléments de
copie de skills sont demandés en premier. Utilisez `Toggle all on` ou `Toggle all off` pour la sélection
en lot. Appuyez sur Espace pour basculer les lignes, ou sur Entrée pour activer la ligne
mise en surbrillance et continuer. Les skills planifiées commencent cochées, les skills en conflit commencent décochées, et
`Skip for now` ignore les copies de skills pour cette exécution tout en poursuivant vers la sélection de Plugins.
Lorsque des Plugins Codex curated installés à la source sont migrables et que
`--plugin` n’a pas été fourni, la migration demande ensuite l’activation de Plugins Codex natifs
par nom de Plugin. Les éléments de Plugin
commencent cochés sauf si la configuration du Plugin Codex OpenClaw cible contient déjà ce
Plugin. Les Plugins cibles existants commencent décochés et affichent un indice de conflit tel que
`conflict: plugin exists` ; choisissez `Toggle all off` pour ne migrer aucun Plugin Codex natif
dans cette exécution, ou `Skip for now` pour arrêter avant l’application. Pour les exécutions scriptées ou
exactes, passez `--skill <name>` une fois par skill, par exemple :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Utilisez `--plugin <name>` pour limiter la migration de Plugins Codex natifs de façon non interactive
à un ou plusieurs Plugins curated installés à la source :

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Ce que Codex importe

- Les répertoires de skills de la CLI Codex sous `$CODEX_HOME/skills`, à l’exclusion du
  cache `.system` de Codex.
- Les AgentSkills personnels sous `$HOME/.agents/skills`, copiés dans l’espace de travail
  de l’agent OpenClaw actuel lorsque vous voulez une propriété par agent.
- Les Plugins Codex `openai-curated` installés à la source et découverts via
  `plugin/list` du serveur d’applications Codex. La planification lit `plugin/read` pour chaque Plugin
  installé et activé. Les Plugins adossés à une application exigent que la réponse du compte
  du serveur d’applications Codex source soit un compte d’abonnement ChatGPT ; les réponses
  de compte non ChatGPT ou manquantes sont ignorées avec `codex_subscription_required`. Par défaut,
  la migration n’appelle pas `app/list` source, donc les Plugins adossés à une application qui passent la
  vérification du compte sont planifiés sans vérification d’accessibilité de l’application source, et
  les échecs de transport de recherche de compte sont ignorés avec `codex_account_unavailable`. Passez
  `--verify-plugin-apps` lorsque vous voulez que la migration force un nouvel instantané
  `app/list` source et exige que chaque application détenue soit présente, activée et
  accessible avant de planifier l’activation native. Dans ce mode, les échecs de transport
  de recherche de compte passent à la vérification de l’inventaire des applications source. L’instantané
  de l’inventaire des applications source est conservé en mémoire pour le processus actuel ; il
  n’est pas écrit dans la sortie de migration ni dans la configuration cible. Les Plugins désactivés,
  les détails de Plugin illisibles, les comptes source soumis à abonnement et, lorsque
  la vérification est demandée, les applications manquantes, les applications désactivées, les applications inaccessibles ou
  les échecs d’inventaire des applications source deviennent des éléments ignorés manuels avec des raisons
  typées au lieu d’entrées de configuration cible.
  L’application appelle `plugin/install` du serveur d’applications pour chaque Plugin éligible sélectionné,
  même si le serveur d’applications cible signale déjà ce Plugin comme installé et
  activé. Les Plugins Codex migrés ne sont utilisables que dans les sessions qui sélectionnent le
  harnais Codex natif ; ils ne sont pas exposés aux exécutions de fournisseurs OpenClaw,
  aux liaisons de conversation ACP ni à d’autres harnais.

### État Codex à examiner manuellement

Codex `config.toml`, les `hooks/hooks.json` natifs, les marchés non curated, les paquets
de Plugins en cache qui ne sont pas des Plugins curated installés à la source, et les Plugins installés à la source
qui échouent au contrôle d’abonnement source ne sont pas activés automatiquement.
Lorsque `--verify-plugin-apps` est défini, les Plugins qui échouent au contrôle d’inventaire
des applications source sont également ignorés. Ils sont copiés ou signalés dans le rapport de migration pour
examen manuel.

Pour les Plugins curated installés à la source migrés, l’application écrit :

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- une entrée de Plugin explicite avec `marketplaceName: "openai-curated"` et
  `pluginName` pour chaque Plugin sélectionné

La migration n’écrit jamais `plugins["*"]` et ne stocke jamais les chemins du cache local de marketplace. Les échecs d’abonnement côté source sont signalés sur les éléments manuels avec des raisons typées telles que `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` ou `plugin_read_unavailable`. Avec `--verify-plugin-apps`, les échecs d’inventaire des applications source peuvent aussi apparaître sous la forme `app_inaccessible`, `app_disabled`, `app_missing` ou `app_inventory_unavailable`. Les plugins ignorés ne sont pas écrits dans la configuration cible.
Les installations côté cible nécessitant une authentification sont signalées sur l’élément de plugin concerné avec `status: "skipped"`, `reason: "auth_required"` et des identifiants d’application assainis. Leurs entrées de configuration explicites sont écrites comme désactivées jusqu’à ce que vous les réautorisiez et les activiez. Les autres échecs d’installation sont des résultats `error` limités à l’élément.

Si l’inventaire des plugins du serveur d’applications Codex est indisponible pendant la planification, la migration se rabat sur les éléments consultatifs de bundle mis en cache au lieu d’échouer toute la migration.

## Fournisseur Hermes

Le fournisseur Hermes intégré détecte l’état dans `~/.hermes` par défaut. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce qu’importe Hermes

- La configuration du modèle par défaut depuis `config.yaml`.
- Les fournisseurs de modèles configurés et les points de terminaison personnalisés compatibles avec OpenAI depuis `providers` et `custom_providers`.
- Les définitions de serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md` ajoutés aux fichiers de mémoire de l’espace de travail.
- Les valeurs par défaut de configuration de mémoire pour la mémoire fichier OpenClaw, ainsi que les éléments d’archive ou de revue manuelle pour les fournisseurs de mémoire externes comme Honcho.
- Les Skills qui incluent un fichier `SKILL.md` sous `skills/<name>/`.
- Les valeurs de configuration par Skill depuis `skills.config`.
- Les identifiants OAuth OpenAI d’OpenCode depuis le fichier OpenCode `auth.json` lorsque la migration interactive des identifiants est acceptée, ou lorsque `--include-secrets` est défini. Les entrées OAuth de Hermes `auth.json` sont un état hérité signalé pour une réauthentification OpenAI manuelle ou une réparation par doctor.
- Les clés API et jetons pris en charge depuis Hermes `.env` et OpenCode `auth.json` lorsque la migration interactive des identifiants est acceptée, ou lorsque `--include-secrets` est défini.

### Clés `.env` prises en charge

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### État archivé uniquement

L’état Hermes qu’OpenClaw ne peut pas interpréter de manière sûre est copié dans le rapport de migration pour une revue manuelle, mais il n’est pas chargé dans la configuration ni les identifiants OpenClaw actifs. Cela préserve l’état opaque ou dangereux sans prétendre qu’OpenClaw peut l’exécuter ou lui faire confiance automatiquement :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
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

À l’exécution, le plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le noyau possède l’orchestration CLI, la politique de sauvegarde, les invites, la sortie JSON et le contrôle préalable des conflits. Le noyau transmet le plan révisé à `apply(ctx, plan)`, et les fournisseurs peuvent reconstruire le plan uniquement lorsque cet argument est absent pour compatibilité.

Les plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour la construction d’éléments et les décomptes de synthèse, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers sensibles aux conflits, les copies de rapport archivées uniquement, les enveloppes de runtime de configuration mises en cache et les rapports de migration.

## Intégration de l’onboarding

L’onboarding peut proposer une migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de plugin et affichent toujours un aperçu avant l’application.

<Note>
Les imports d’onboarding nécessitent une installation OpenClaw neuve. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous disposez déjà d’un état local. Les imports avec sauvegarde puis écrasement ou fusion sont soumis à un feature gate pour les installations existantes.
</Note>

## Articles associés

- [Migration depuis Hermes](/fr/install/migrating-hermes) : guide pas à pas destiné aux utilisateurs.
- [Migration depuis Claude](/fr/install/migrating-claude) : guide pas à pas destiné aux utilisateurs.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : vérification de santé après l’application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement de plugin.
