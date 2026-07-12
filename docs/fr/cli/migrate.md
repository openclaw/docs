---
read_when:
    - Vous souhaitez migrer depuis Hermes ou un autre système d’agents vers OpenClaw
    - Vous ajoutez un fournisseur de migration géré par un plugin
summary: Référence de la CLI pour `openclaw migrate` (importer l’état depuis un autre système d’agents)
title: Migrer
x-i18n:
    generated_at: "2026-07-12T02:31:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importez l’état depuis un autre système d’agents au moyen d’un fournisseur de migration géré par un plugin. Les fournisseurs intégrés prennent en charge Claude, Codex CLI et [Hermes](/fr/install/migrating-hermes) ; les plugins peuvent enregistrer des fournisseurs supplémentaires.

<Tip>
Pour des guides destinés aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude) et [Migrer depuis Hermes](/fr/install/migrating-hermes). Le [centre de migration](/fr/install/migrating) répertorie tous les parcours.
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

L’exécution de `openclaw migrate <provider>` sans autre option planifie et prévisualise la migration, puis demande une confirmation avant de l’appliquer dans un TTY. `openclaw migrate plan <provider>` et `openclaw migrate apply <provider>` séparent la prévisualisation et l’application en deux sous-commandes acceptant les mêmes options.

<ParamField path="<provider>" type="string">
  Nom d’un fournisseur de migration enregistré, par exemple `hermes`. Exécutez `openclaw migrate list` pour afficher les fournisseurs installés.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Génère le plan et quitte sans modifier l’état.
</ParamField>
<ParamField path="--from <path>" type="string">
  Remplace le répertoire d’état source. La valeur par défaut est `~/.hermes` pour Hermes, `~/.codex` (ou `$CODEX_HOME`) pour Codex et `~/.claude` pour Claude.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importe les identifiants pris en charge sans demander de confirmation. L’application interactive demande une confirmation avant d’importer les identifiants d’authentification détectés, avec oui sélectionné par défaut ; en mode non interactif, `--yes` nécessite `--include-secrets` pour les importer.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Ignore l’importation des identifiants d’authentification, y compris la demande de confirmation interactive.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Autorise l’application à remplacer les cibles existantes lorsque le plan signale des conflits.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignore la demande de confirmation. Obligatoire en mode non interactif.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Sélectionne un élément de copie de Skill par nom de Skill ou identifiant d’élément. Répétez l’option pour migrer plusieurs Skills. Lorsque cette option est omise, les migrations Codex interactives affichent un sélecteur à cases à cocher et les migrations non interactives conservent tous les Skills planifiés.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Sélectionne un élément d’installation de plugin Codex par nom de plugin ou identifiant d’élément. Répétez l’option pour migrer plusieurs plugins Codex. Lorsque cette option est omise, les migrations Codex interactives affichent un sélecteur natif à cases à cocher pour les plugins Codex et les migrations non interactives conservent tous les plugins planifiés. S’applique uniquement aux plugins Codex `openai-curated` installés depuis la source et détectés par l’inventaire de l’app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex uniquement. Force un nouveau parcours `app/list` de l’app-server Codex source avant de planifier l’activation native des plugins. Désactivé par défaut afin de préserver la rapidité de la planification de la migration.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Chemin ou répertoire de l’archive de sauvegarde préalable à la migration. Transmis à `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignore la sauvegarde préalable à l’application. Nécessite `--force` lorsqu’un état OpenClaw local existe.
</ParamField>
<ParamField path="--force" type="boolean">
  Obligatoire avec `--no-backup` lorsque l’application refuserait autrement d’ignorer la sauvegarde.
</ParamField>
<ParamField path="--json" type="boolean">
  Affiche le plan ou le résultat de l’application au format JSON. Avec `--json` sans `--yes`, l’application affiche le plan et ne modifie pas l’état.
</ParamField>

## Modèle de sécurité

`openclaw migrate` privilégie d’abord la prévisualisation.

<AccordionGroup>
  <Accordion title="Prévisualisation avant l’application">
    Le fournisseur renvoie un plan détaillé avant toute modification, notamment les conflits, les éléments ignorés et les éléments sensibles. Les plans JSON, la sortie d’application et les rapports de migration masquent les clés imbriquées pouvant contenir des secrets, telles que les clés d’API, les jetons, les en-têtes d’autorisation, les cookies et les mots de passe.

    `openclaw migrate apply <provider>` prévisualise le plan et demande une confirmation avant de modifier l’état, sauf si `--yes` est défini. En mode non interactif, l’application nécessite `--yes`.

  </Accordion>
  <Accordion title="Sauvegardes">
    L’application crée et vérifie une sauvegarde OpenClaw avant d’appliquer la migration. Si aucun état OpenClaw local n’existe encore, l’étape de sauvegarde est ignorée et la migration se poursuit. Pour ignorer une sauvegarde lorsqu’un état existe, transmettez à la fois `--no-backup` et `--force`.
  </Accordion>
  <Accordion title="Conflits">
    L’application refuse de continuer lorsque le plan comporte des conflits. Examinez le plan, puis relancez la commande avec `--overwrite` si le remplacement des cibles existantes est intentionnel. Les fournisseurs peuvent néanmoins créer des sauvegardes au niveau des éléments pour les fichiers remplacés dans le répertoire du rapport de migration.
  </Accordion>
  <Accordion title="Secrets">
    L’application interactive demande s’il faut importer les identifiants d’authentification détectés, avec oui sélectionné par défaut. Utilisez `--no-auth-credentials` pour les ignorer, ou `--include-secrets` avec `--yes` pour importer les identifiants sans intervention.
  </Accordion>
</AccordionGroup>

## Fournisseur Claude

Le fournisseur Claude intégré détecte par défaut l’état de Claude Code dans `~/.claude`. Utilisez `--from <path>` pour importer un répertoire personnel ou une racine de projet Claude Code spécifique.

<Tip>
Pour un guide destiné aux utilisateurs, consultez [Migrer depuis Claude](/fr/install/migrating-claude).
</Tip>

### Éléments importés depuis Claude

- Les fichiers de projet `CLAUDE.md` et `.claude/CLAUDE.md` dans l’espace de travail de l’agent OpenClaw (`AGENTS.md`).
- Le fichier utilisateur `~/.claude/CLAUDE.md`, ajouté à la suite du fichier `USER.md` de l’espace de travail.
- Les définitions de serveurs MCP provenant du fichier de projet `.mcp.json`, de Claude Code `~/.claude.json` (y compris ses entrées propres à chaque projet) et de Claude Desktop `claude_desktop_config.json`.
- Les répertoires de Skills Claude qui contiennent un fichier `SKILL.md` (`~/.claude/skills` pour l’utilisateur et `.claude/skills` pour le projet).
- Les fichiers Markdown de commandes Claude (`~/.claude/commands` pour l’utilisateur et `.claude/commands` pour le projet), convertis en Skills OpenClaw à invocation manuelle uniquement.

### État archivé et à examiner manuellement

Les hooks, autorisations et valeurs d’environnement par défaut de Claude, le fichier de projet `CLAUDE.local.md`, le répertoire `.claude/rules`, les répertoires `agents/` de l’utilisateur et du projet, ainsi que l’historique du projet (`projects`, `cache` et `plans` sous `~/.claude`) sont conservés dans le rapport de migration ou signalés comme éléments à examiner manuellement. OpenClaw n’exécute pas les hooks, ne copie pas les listes d’autorisation étendues et n’importe pas automatiquement l’état des identifiants OAuth/Desktop.

## Fournisseur Codex

Le fournisseur Codex intégré détecte par défaut l’état de Codex CLI dans `~/.codex`, ou dans `CODEX_HOME` lorsque cette variable d’environnement est définie. Utilisez `--from <path>` pour inventorier un répertoire personnel Codex spécifique.

Utilisez ce fournisseur lorsque vous passez au harnais Codex d’OpenClaw et souhaitez transférer délibérément des ressources personnelles utiles de Codex CLI. Les lancements locaux de l’app-server Codex utilisent un `CODEX_HOME` propre à chaque agent ; ils ne lisent donc pas votre répertoire personnel `~/.codex` par défaut. Le processus hérite néanmoins du `HOME` normal, de sorte que Codex peut accéder aux entrées partagées de Skills et de places de marché de plugins sous `$HOME/.agents/*`, tandis que les sous-processus peuvent trouver la configuration et les jetons du répertoire personnel de l’utilisateur.

L’exécution de `openclaw migrate codex` dans un terminal interactif prévisualise le plan complet, puis ouvre des sélecteurs à cases à cocher avant la confirmation finale de l’application. Les éléments de copie de Skills sont proposés en premier. Utilisez `Toggle all on` ou `Toggle all off` pour effectuer une sélection groupée. Appuyez sur Space pour basculer l’état des lignes, ou sur Enter pour activer la ligne en surbrillance et continuer. Les Skills planifiés sont cochés initialement, ceux en conflit sont décochés, et `Skip for now` ignore les copies de Skills pour cette exécution tout en poursuivant avec la sélection des plugins. Lorsque des plugins Codex organisés et installés depuis la source peuvent être migrés et que `--plugin` n’a pas été fourni, la migration demande ensuite quels plugins Codex natifs activer, selon leur nom. Les éléments de plugin sont cochés initialement, sauf si la configuration cible des plugins Codex d’OpenClaw contient déjà ce plugin. Les plugins cibles existants sont décochés initialement et affichent une indication de conflit telle que `conflict: plugin exists` ; choisissez `Toggle all off` pour ne migrer aucun plugin Codex natif pendant cette exécution, ou `Skip for now` pour arrêter avant l’application.

Pour les exécutions scriptées ou précises, sélectionnez explicitement un ou plusieurs Skills ou plugins :

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Éléments importés depuis Codex

- Les répertoires de Skills Codex CLI sous `$CODEX_HOME/skills`, à l’exclusion du cache `.system` de Codex.
- Les AgentSkills personnels sous `$HOME/.agents/skills`, copiés dans l’espace de travail de l’agent OpenClaw actuel afin d’être gérés par agent.
- Les plugins Codex `openai-curated` installés depuis la source et détectés au moyen de `plugin/list` de l’app-server Codex. La planification lit `plugin/read` pour chaque plugin installé et activé.

La migration des plugins adossés à une application comporte des contrôles supplémentaires :

- Les plugins adossés à une application nécessitent que le compte de l’app-server Codex source soit associé à un abonnement ChatGPT. Les réponses indiquant un compte non-ChatGPT ou absent sont ignorées avec `codex_subscription_required`.
- Par défaut, la migration n’appelle pas `app/list` sur la source. Les plugins adossés à une application qui passent le contrôle du compte sont donc planifiés sans vérification de l’accessibilité de l’application source, et les échecs de transport lors de la recherche du compte sont ignorés avec `codex_account_unavailable`.
- Transmettez `--verify-plugin-apps` pour forcer un nouvel instantané `app/list` de la source et exiger que chaque application détenue soit présente, activée et accessible avant de planifier l’activation native. Dans ce mode, les échecs de transport lors de la recherche du compte entraînent une vérification de l’inventaire des applications sources. L’instantané est conservé en mémoire uniquement pendant le processus en cours ; il n’est jamais écrit dans la sortie de migration ni dans la configuration cible.

Les plugins désactivés, les détails de plugin illisibles, les comptes sources soumis à une condition d’abonnement et, lorsque `--verify-plugin-apps` est défini, les applications absentes, désactivées ou inaccessibles deviennent des éléments ignorés à examiner manuellement, assortis de motifs typés, au lieu d’entrées de configuration cible. L’application appelle `plugin/install` sur l’app-server pour chaque plugin admissible sélectionné, même si l’app-server cible indique déjà que ce plugin est installé et activé. Les plugins Codex migrés ne sont utilisables que dans les sessions qui sélectionnent le harnais Codex natif ; ils ne sont pas accessibles aux exécutions de fournisseurs OpenClaw, aux liaisons de conversations ACP ni aux autres harnais.

### État Codex à examiner manuellement

Le fichier Codex `config.toml`, les fichiers natifs `hooks/hooks.json`, les places de marché non organisées, les paquets de plugins mis en cache qui ne sont pas des plugins organisés installés depuis la source, ainsi que les plugins installés depuis la source qui échouent au contrôle d’abonnement de la source ne sont pas activés automatiquement. Lorsque `--verify-plugin-apps` est défini, les plugins qui échouent au contrôle de l’inventaire des applications sources sont également ignorés. Tous ces éléments sont copiés ou signalés dans le rapport de migration afin d’être examinés manuellement.

Pour les plugins organisés migrés et installés depuis la source, l’application écrit :

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- une entrée de plugin explicite contenant `marketplaceName: "openai-curated"` et `pluginName` pour chaque plugin sélectionné

La migration n’écrit jamais `plugins["*"]` et ne stocke jamais les chemins locaux du cache de la place de marché.

Les plugins ignorés ne sont pas écrits dans la configuration cible. Les échecs d’abonnement côté source sont signalés sur les éléments manuels avec des motifs typés : `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` ou `plugin_read_unavailable`. Avec `--verify-plugin-apps`, les échecs d’inventaire des applications côté source peuvent également apparaître sous la forme `app_inaccessible`, `app_disabled`, `app_missing` ou `app_inventory_unavailable`. Les installations côté cible nécessitant une authentification sont signalées sur l’élément de plugin concerné avec `status: "skipped"`, `reason: "auth_required"` et des identifiants d’application expurgés ; leurs entrées de configuration explicites sont écrites comme désactivées jusqu’à ce que vous les réautorisiez et les activiez. Les autres échecs d’installation produisent des résultats `error` limités à l’élément concerné.

Si l’inventaire des plugins du serveur d’applications Codex est indisponible pendant la planification, la migration utilise à la place les éléments consultatifs du bundle mis en cache, plutôt que de faire échouer toute la migration.

## Fournisseur Hermes

Le fournisseur Hermes intégré détecte par défaut l’état dans `~/.hermes`. Utilisez `--from <path>` lorsque Hermes se trouve ailleurs.

### Ce qu’importe Hermes

- La configuration du modèle par défaut depuis `config.yaml`.
- Les fournisseurs de modèles configurés et les points de terminaison personnalisés compatibles avec OpenAI depuis `providers` et `custom_providers`.
- Les définitions des serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
- `SOUL.md` et `AGENTS.md` dans l’espace de travail de l’agent OpenClaw.
- `memories/MEMORY.md` et `memories/USER.md`, ajoutés aux fichiers de mémoire de l’espace de travail.
- Les valeurs par défaut de configuration de la mémoire de fichiers OpenClaw, ainsi que les éléments d’archivage ou de révision manuelle pour les fournisseurs de mémoire externes tels que Honcho.
- Les Skills comprenant un fichier `SKILL.md` sous `skills/<name>/`.
- Les valeurs de configuration propres à chaque Skill depuis `skills.config`.
- Les identifiants OAuth OpenAI d’OpenCode depuis le fichier `auth.json` d’OpenCode lorsque la migration interactive des identifiants est acceptée ou lorsque `--include-secrets` est défini. Les entrées OAuth du fichier `auth.json` de Hermes constituent un état hérité signalé afin d’effectuer manuellement une nouvelle authentification OpenAI ou une réparation avec Doctor.
- Les clés d’API et jetons pris en charge depuis le fichier `.env` de Hermes et le fichier `auth.json` d’OpenCode lorsque la migration interactive des identifiants est acceptée ou lorsque `--include-secrets` est défini.

### Clés `.env` prises en charge

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### État destiné uniquement à l’archivage

L’état de Hermes qu’OpenClaw ne peut pas interpréter de manière sûre est copié dans le rapport de migration pour révision manuelle, mais n’est pas chargé dans la configuration ou les identifiants actifs d’OpenClaw. Cela préserve les états opaques ou non sûrs sans prétendre qu’OpenClaw peut les exécuter ou leur faire confiance automatiquement : `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Après l’application

```bash
openclaw doctor
```

## Contrat des plugins

Les sources de migration sont des plugins. Un plugin déclare les identifiants de ses fournisseurs dans `openclaw.plugin.json` :

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Lors de l’exécution, le plugin appelle `api.registerMigrationProvider(...)`. Le fournisseur implémente `detect`, `plan` et `apply`. Le cœur gère l’orchestration de la CLI, la politique de sauvegarde, les invites, la sortie JSON et la vérification préalable des conflits. Le cœur transmet le plan révisé à `apply(ctx, plan)`, et les fournisseurs ne peuvent reconstruire le plan que lorsque cet argument est absent à des fins de compatibilité.

Les plugins fournisseurs peuvent utiliser `openclaw/plugin-sdk/migration` pour construire les éléments et calculer les totaux récapitulatifs, ainsi que `openclaw/plugin-sdk/migration-runtime` pour les copies de fichiers tenant compte des conflits, les copies de rapports destinées uniquement à l’archivage, les enveloppes d’exécution de configuration mises en cache et les rapports de migration.

## Intégration à l’intégration initiale

L’intégration initiale peut proposer une migration lorsqu’un fournisseur détecte une source connue. `openclaw onboard --flow import` et `openclaw setup --wizard --import-from hermes` utilisent tous deux le même fournisseur de migration de plugin et affichent toujours un aperçu avant l’application.

<Note>
Les importations lors de l’intégration initiale nécessitent une nouvelle installation d’OpenClaw. Réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail si vous disposez déjà d’un état local. Les importations avec sauvegarde et écrasement ou fusion sont soumises à une activation fonctionnelle pour les installations existantes.
</Note>

## Voir aussi

- [Migration depuis Hermes](/fr/install/migrating-hermes) : procédure destinée aux utilisateurs.
- [Migration depuis Claude](/fr/install/migrating-claude) : procédure destinée aux utilisateurs.
- [Migration](/fr/install/migrating) : déplacer OpenClaw vers une nouvelle machine.
- [Doctor](/fr/gateway/doctor) : contrôle d’intégrité après l’application d’une migration.
- [Plugins](/fr/tools/plugin) : installation et enregistrement des plugins.
