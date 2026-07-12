---
read_when:
    - Vous avez besoin de connaître précisément la sémantique ou les valeurs par défaut des champs de configuration
    - Vous validez des blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration du Gateway pour les clés principales d’OpenClaw, les valeurs par défaut et les liens vers les références dédiées aux sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-07-12T21:39:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0388cacfc5eb2b33f7a55775e4c7d289e0955409fc9b1e3f84199371fe4d1c4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Référence détaillée des champs de `~/.openclaw/openclaw.json` : clés, valeurs par défaut et liens vers des pages plus approfondies sur les sous-systèmes. Pour obtenir des instructions de configuration axées sur les tâches, consultez [Configuration](/fr/gateway/configuration). Les catalogues de commandes propres aux canaux et aux plugins, ainsi que les paramètres avancés de mémoire/QMD, figurent sur leurs pages respectives, et non ici.

Le format de configuration est **JSON5** (commentaires et virgules finales autorisés). Tous les champs sont facultatifs ; OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

Le code fait autorité sur cette page :

- `openclaw config schema` affiche le schéma JSON utilisé en temps réel pour la validation et l’interface de contrôle, avec les métadonnées intégrées/des plugins/des canaux fusionnées.
- Les agents doivent appeler l’action `config.schema.lookup` de l’outil `gateway` pour obtenir un nœud de schéma exact limité au chemin avant de modifier la configuration.
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hachage de référence de ce document par rapport à la surface actuelle du schéma.

Références approfondies dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration de Dreaming sous `plugins.entries.memory-core.config.dreaming`.
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées et fournies.
- Pages des canaux/plugins propriétaires pour les surfaces de commandes propres aux canaux.

---

## Canaux

Les clés de configuration propres à chaque canal se trouvent dans [Configuration - canaux](/fr/gateway/config-channels) : `channels.*` pour Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et les autres canaux intégrés (authentification, contrôle d’accès, comptes multiples, filtrage par mention).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Consultez [Configuration - agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, réflexion, Heartbeat, mémoire, médias, Skills, bac à sable)
- `multiAgent.*` (routage et liaisons multi-agent)
- `session.*` (cycle de vie des sessions, Compaction, élagage)
- `messages.*` (distribution des messages, synthèse vocale, rendu Markdown)
- `talk.*` (mode conversation)
  - `talk.consultThinkingLevel` : remplacement du niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les consultations en temps réel du mode conversation de Control UI
  - `talk.consultFastMode` : remplacement ponctuel par le mode rapide pour les consultations en temps réel du mode conversation de Control UI
  - `talk.speechLocale` : identifiant de paramètres régionaux BCP 47 facultatif pour la reconnaissance vocale du mode conversation sous iOS/macOS
  - `talk.silenceTimeoutMs` : lorsque cette valeur n’est pas définie, le mode conversation conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting` : solution de repli du relais Gateway pour les transcriptions en temps réel finalisées du mode conversation qui ignorent `openclaw_agent_consult`

## Outils et fournisseurs personnalisés

La politique des outils, les options expérimentales, la configuration des outils adossés à des fournisseurs et la configuration des fournisseurs personnalisés ou de leur URL de base se trouvent dans [Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Modèles

Les définitions des fournisseurs, les listes d’autorisation de modèles et la configuration de fournisseurs personnalisés se trouvent dans
[Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls).
La racine `models` contrôle également le comportement global du catalogue de modèles.

```json5
{
  models: {
    // Facultatif. Valeur par défaut : true. Nécessite un redémarrage du Gateway en cas de modification.
    pricing: { enabled: false },
  },
}
```

- `models.mode` : comportement du catalogue des fournisseurs (`merge` ou `replace`).
- `models.providers` : table des fournisseurs personnalisés indexée par identifiant de fournisseur.
- `models.providers.*.localService` : gestionnaire facultatif de processus à la demande pour les
  serveurs de modèles locaux. OpenClaw sonde le point de terminaison de contrôle d’intégrité configuré, lance
  la `command` absolue si nécessaire, attend que le service soit prêt, puis envoie la requête
  au modèle. Consultez [Services de modèles locaux](/fr/gateway/local-model-services).
- `models.pricing.enabled` : contrôle l’initialisation en arrière-plan de la tarification, qui
  démarre une fois que les sidecars et les canaux ont atteint le chemin d’état prêt du Gateway. Lorsque la valeur est `false`,
  le Gateway ignore la récupération des catalogues tarifaires d’OpenRouter et de LiteLLM ; les valeurs
  `models.providers.*.models[].cost` configurées restent utilisables pour les estimations de coût locales.

## MCP

Les définitions de serveurs MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont
utilisées par OpenClaw intégré et par d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`,
`show`, `set` et `unset` gèrent ce bloc sans se connecter au
serveur cible pendant la modification de la configuration.

```json5
{
  mcp: {
    // Facultatif. Valeur par défaut : 600000 ms (10 minutes). Définissez 0 pour désactiver l’éviction en cas d’inactivité.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Contrôles facultatifs de projection du serveur d’application Codex.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers` : définitions nommées de serveurs MCP stdio ou distants pour les environnements d’exécution qui
  exposent les outils MCP configurés.
  Les entrées distantes utilisent `transport: "streamable-http"` ou `transport: "sse"` ;
  `type: "http"` est un alias natif de la CLI que `openclaw mcp set` et
  `openclaw doctor --fix` normalisent dans le champ canonique `transport`.
- `mcp.servers.<name>.enabled` : définissez la valeur sur `false` pour conserver une définition de serveur enregistrée
  tout en l’excluant de la découverte MCP d’OpenClaw intégré et de la projection des outils.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs` : délai d’expiration des requêtes MCP
  par serveur, en secondes ou en millisecondes.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs` : délai d’expiration de la
  connexion par serveur, en secondes ou en millisecondes.
- `mcp.servers.<name>.supportsParallelToolCalls` : indication facultative de concurrence pour
  les adaptateurs qui peuvent choisir d’effectuer ou non des appels parallèles aux outils MCP.
- `mcp.servers.<name>.auth` : définissez la valeur sur `"oauth"` pour les serveurs MCP HTTP qui nécessitent
  OAuth. Exécutez `openclaw mcp login <name>` pour stocker les jetons dans l’état d’OpenClaw.
- `mcp.servers.<name>.oauth` : remplacements facultatifs de la portée OAuth, de l’URL de redirection et de l’URL
  des métadonnées du client.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey` : contrôles TLS HTTP
  pour les points de terminaison privés et le TLS mutuel.
- `mcp.servers.<name>.toolFilter` : sélection facultative des outils par serveur. `include`
  limite les outils MCP découverts aux noms correspondants ; `exclude` masque les noms
  correspondants. Les entrées sont des noms exacts d’outils MCP ou de simples motifs glob avec `*`. Les serveurs disposant
  de ressources ou de prompts génèrent également des noms d’outils utilitaires (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), auxquels le
  même filtre s’applique.
- `mcp.servers.<name>.codex` : contrôles facultatifs de projection du serveur d’application Codex.
  Ce bloc constitue des métadonnées OpenClaw destinées uniquement aux fils du serveur d’application Codex ; il n’affecte pas
  les sessions ACP, la configuration générique du harnais Codex ni les autres adaptateurs d’exécution.
  Une valeur `codex.agents` non vide limite le serveur aux identifiants d’agents OpenClaw répertoriés.
  Les listes d’agents ciblés vides, composées d’espaces ou non valides sont rejetées par la validation de la configuration
  et omises par le chemin de projection de l’environnement d’exécution au lieu de devenir globales.
  `codex.defaultToolsApprovalMode` émet le paramètre natif
  `default_tools_approval_mode` de Codex pour ce serveur. OpenClaw supprime le bloc `codex`
  avant de transmettre la configuration native `mcp_servers` à Codex. Omettez ce bloc pour
  conserver la projection du serveur pour chaque agent du serveur d’application Codex avec le
  comportement d’approbation MCP par défaut de Codex.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité des environnements d’exécution MCP intégrés limités à une session.
  Les exécutions intégrées ponctuelles demandent un nettoyage à la fin de l’exécution ; ce TTL sert de solution de secours pour
  les sessions de longue durée et les futurs appelants.
- Les modifications sous `mcp.*` sont appliquées à chaud en libérant les environnements d’exécution MCP de session mis en cache.
  La prochaine découverte ou utilisation d’un outil les recrée à partir de la nouvelle configuration, de sorte que les entrées
  `mcp.servers` supprimées sont éliminées immédiatement au lieu d’attendre le TTL d’inactivité.
- La découverte à l’exécution prend également en compte les notifications de modification de la liste des outils MCP en supprimant
  le catalogue mis en cache pour cette session. Les serveurs qui annoncent des ressources ou
  des prompts obtiennent des outils utilitaires permettant de répertorier et de lire les ressources, ainsi que de répertorier et récupérer
  les prompts. Les échecs répétés d’appels d’outils suspendent brièvement le serveur concerné avant
  qu’un nouvel appel soit tenté.

Consultez [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et
[Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour connaître le comportement à l’exécution.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou chaîne en texte brut
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled` : liste d’autorisation facultative réservée aux Skills intégrés (sans effet sur les Skills gérés ou de l’espace de travail).
- `load.extraDirs` : racines supplémentaires de Skills partagés (priorité la plus faible).
- `load.allowSymlinkTargets` : racines cibles réelles approuvées vers lesquelles les liens symboliques de Skills peuvent
  être résolus lorsque le lien se trouve en dehors de sa racine source configurée.
- `workshop.allowSymlinkTargetWrites` : autorise l’application de Skill Workshop à écrire
  via des cibles de liens symboliques déjà approuvées (valeur par défaut : false).
- `install.preferBrew` : lorsque la valeur est true, privilégie les programmes d’installation Homebrew si `brew` est
  disponible, avant de recourir à d’autres types de programmes d’installation.
- `install.nodeManager` : préférence du programme d’installation Node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives` : autorise les clients Gateway `operator.admin`
  approuvés à installer des archives zip privées préparées via `skills.upload.*`
  (valeur par défaut : false). Cela active uniquement le chemin des archives téléversées ; les installations
  ClawHub normales ne l’exigent pas.
- `entries.<skillKey>.enabled: false` désactive une Skill, même si elle est intégrée ou installée.
- `entries.<skillKey>.apiKey` : raccourci pour les Skills déclarant une variable d’environnement principale (chaîne en texte brut ou objet SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes` : limitent la découverte des Skills et le prompt de Skills présenté au modèle.
- Les paramètres d’autonomie et d’approbation de Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) sont documentés dans [Configuration des Skills](/fr/tools/skills-config).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Chargés depuis les répertoires de paquet ou de bundle sous `~/.openclaw/extensions` et `<workspace>/.openclaw/extensions`, ainsi que depuis les fichiers ou répertoires répertoriés dans `plugins.load.paths`.
- Placez les fichiers de plugin autonomes dans `plugins.load.paths` ; les racines d’extension détectées automatiquement ignorent les fichiers `.js`, `.mjs` et `.ts` de premier niveau afin que les scripts auxiliaires présents dans ces racines ne bloquent pas le démarrage.
- La détection accepte les plugins OpenClaw natifs ainsi que les bundles Codex et Claude compatibles, y compris les bundles Claude sans manifeste utilisant l’arborescence par défaut.
- **Les modifications de configuration nécessitent un redémarrage du Gateway.**
- `allow` : liste d’autorisation facultative (seuls les plugins répertoriés sont chargés). `deny` est prioritaire.
- `plugins.entries.<id>.apiKey` : champ pratique de clé d’API au niveau du plugin (lorsque le plugin le prend en charge).
- `plugins.entries.<id>.env` : table des variables d’environnement limitée au plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque la valeur est `false`, le cœur bloque `before_prompt_build` et ignore les champs modifiant le prompt provenant de l’ancien `before_agent_start`, tout en conservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de plugins natifs et aux répertoires de hooks fournis par les bundles pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque la valeur est `true`, les plugins approuvés non intégrés peuvent lire le contenu brut des conversations depuis des hooks typés tels que `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : autorise explicitement ce plugin à demander des remplacements de `provider` et de `model` pour chaque exécution de sous-agent en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements approuvés des sous-agents. Utilisez `"*"` uniquement si vous souhaitez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowModelOverride` : autorise explicitement ce plugin à demander des remplacements de modèle pour `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements approuvés des complétions LLM du plugin. Utilisez `"*"` uniquement si vous souhaitez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowAgentIdOverride` : autorise explicitement ce plugin à exécuter `api.runtime.llm.complete` avec un identifiant d’agent autre que celui par défaut.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma du plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte et d’exécution des plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du plugin propriétaire, et non par un registre central d’options OpenClaw.

### Configuration du harnais Codex

Le plugin `codex` intégré possède les paramètres du harnais natif du serveur d’application Codex sous
`plugins.entries.codex.config`. Consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference) pour l’ensemble de la surface de configuration
et le [harnais Codex](/fr/plugins/codex-harness) pour le modèle d’exécution.

`codexPlugins` s’applique uniquement aux sessions qui sélectionnent le harnais Codex natif.
Il n’active pas les plugins Codex pour les exécutions de fournisseurs OpenClaw, les liaisons de conversation
ACP ni aucun harnais autre que Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled` : active la prise en charge
  native des plugins et applications Codex pour le harnais Codex. Valeur par défaut : `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins` : expose toutes
  les applications actuellement accessibles et connectées au compte Codex authentifié dans
  chaque nouveau fil Codex natif. Valeur par défaut : `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions` :
  politique par défaut relative aux actions destructrices pour les sollicitations configurées des applications de plugin.
  Utilisez `true` pour accepter sans invite les schémas d’approbation Codex sûrs, `false`
  pour les refuser, `"auto"` pour acheminer les approbations requises par Codex via les
  approbations de plugins OpenClaw, ou `"ask"` pour demander une confirmation pour chaque action
  d’écriture ou destructrice du plugin sans approbation persistante. Le mode `"ask"` efface
  les remplacements persistants d’approbation Codex propres à chaque outil pour l’application concernée et sélectionne
  le réviseur humain des approbations pour cette application avant le démarrage du fil Codex.
  Valeur par défaut : `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled` : active une
  entrée de plugin configurée lorsque la valeur globale `codexPlugins.enabled` est également vraie.
  Valeur par défaut : `true` pour les entrées explicites.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName` :
  identité stable de la place de marché, requise avec `pluginName` pour chaque entrée
  résolue. Prend en charge `"openai-curated"` et `"workspace-directory"`. Les entrées
  auxquelles il manque l’un de ces champs d’identité sont ignorées.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName` : identité
  stable du plugin Codex, requise avec `marketplaceName`. Une entrée
  `workspace-directory` doit utiliser exactement le `summary.id` qualifié par la place de marché
  renvoyé par `plugin/list`, par exemple
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions` :
  remplacement de la politique relative aux actions destructrices pour chaque plugin. Lorsqu’il est omis, la valeur globale
  `allow_destructive_actions` est utilisée. La valeur propre au plugin accepte les
  mêmes politiques `true`, `false`, `"auto"` ou `"ask"`.

Chaque application de plugin admise qui utilise `"ask"` achemine les demandes d’approbation
de cette application vers le réviseur humain. Les autres applications et les approbations de fils ne concernant pas une application conservent leur
réviseur configuré ; les politiques de plugins mixtes n’héritent donc pas du comportement `"ask"`.

`codexPlugins.enabled` est la directive d’activation globale. Les entrées de plugins
explicites écrites par la migration constituent l’ensemble persistant d’éligibilité à l’installation
sélectionnée et à la réparation. Les entrées `workspace-directory` configurées manuellement doivent déjà
être installées et activées, et les applications qu’elles possèdent doivent être accessibles ; OpenClaw
ne les installe pas et ne les authentifie pas. Si Codex rejette la requête explicite du catalogue de l’espace de travail,
les entrées d’espace de travail activées échouent de manière fermée avec
`marketplace_missing`, tandis que les entrées sélectionnées du catalogue par défaut restent
disponibles. `plugins["*"]` n’est pas pris en charge, il n’existe aucun commutateur `install`, et
les valeurs locales `marketplacePath` ne sont intentionnellement pas des champs de configuration, car elles
sont propres à l’hôte. Consultez
[Plugins Codex natifs](/fr/plugins/codex-native-plugins) pour connaître les exigences de version et
de disponibilité du serveur d’application.

Les vérifications de disponibilité de `app/list` sont mises en cache pendant une heure et actualisées
de manière asynchrone lorsqu’elles deviennent obsolètes. La configuration des applications du fil Codex est calculée lors de l’établissement
de la session du harnais Codex, et non à chaque tour ; utilisez `/new`, `/reset` ou un redémarrage
du Gateway après avoir modifié la configuration des plugins natifs.

`codexPlugins.allow_all_plugins` capture toutes les applications de compte actuellement accessibles
dans chaque nouveau fil Codex natif. Il n’installe ni plugins ni applications, et
les applications inaccessibles restent exclues. Les applications du compte utilisent la politique globale
`codexPlugins.allow_destructive_actions`. Les entrées de plugins explicites sont
prioritaires lorsque la même application est présente dans les deux chemins. Si `app/list` ne peut pas être
lu, l’exposition à l’échelle du compte échoue de manière fermée.

- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur de récupération de contenu web Firecrawl.
  - `apiKey` : clé API Firecrawl facultative pour bénéficier de limites plus élevées (accepte SecretRef). Utilise à défaut `plugins.entries.firecrawl.config.webSearch.apiKey`, l’ancienne clé `tools.web.fetch.firecrawl.apiKey` ou la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev` ; les remplacements auto-hébergés doivent cibler des points de terminaison privés/internes).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration de la requête d’extraction en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres de xAI X Search (recherche web Grok).
  - `enabled` : activer le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par exemple `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de Dreaming de la mémoire. Consultez [Dreaming](/fr/concepts/dreaming) pour connaître les phases et les seuils.
  - `enabled` : interrupteur principal de Dreaming (par défaut `false`).
  - `frequency` : cadence Cron de chaque cycle complet de Dreaming (`"0 3 * * *"` par défaut).
  - `model` : remplacement facultatif du modèle du sous-agent Dream Diary. Nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true` ; associez-le à `allowedModels` pour restreindre les cibles. En cas d’indisponibilité du modèle, une nouvelle tentative est effectuée avec le modèle par défaut de la session ; les échecs liés à la confiance ou à la liste d’autorisation ne déclenchent pas de repli silencieux.
  - la politique des phases et les seuils sont des détails d’implémentation (et non des clés de configuration destinées aux utilisateurs).
- La configuration complète de la mémoire se trouve dans la [référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les plugins activés de l’ensemble Claude peuvent également fournir des valeurs OpenClaw par défaut intégrées à partir de `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisissez l’identifiant du plugin de mémoire actif, ou `"none"` pour désactiver les plugins de mémoire.
- `plugins.slots.contextEngine` : choisissez l’identifiant du plugin de moteur de contexte actif ; la valeur par défaut est `"legacy"`, sauf si vous installez et sélectionnez un autre moteur.

Consultez [Plugins](/fr/tools/plugin).

---

## Engagements

`commitments` contrôle la mémoire de suivi déduite : OpenClaw peut détecter les suivis à effectuer dans les tours de conversation et les transmettre lors des exécutions de Heartbeat.

- `commitments.enabled` : activer l’extraction masquée par le LLM, le stockage et la transmission par Heartbeat des engagements de suivi déduits. Valeur par défaut : `false`.
- `commitments.maxPerDay` : nombre maximal d’engagements de suivi déduits transmis par session d’agent sur une journée glissante. Valeur par défaut : `3`.

Consultez [Engagements déduits](/fr/concepts/commitments).

---

## Navigateur

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // à activer uniquement pour un accès fiable au réseau privé
      // allowPrivateNetwork: true, // ancien alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` désactive `act:evaluate` et `wait --fn`.
- `tabCleanup` récupère les onglets suivis de l’agent principal après une période d’inactivité ou lorsqu’une
  session dépasse sa limite. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver individuellement ces modes de nettoyage.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini, de sorte que la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement si vous accordez délibérément votre confiance à la navigation du navigateur sur le réseau privé.
- En mode strict, les points de terminaison des profils CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage des réseaux privés lors des vérifications d’accessibilité et de détection.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge en tant qu’alias hérité.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour définir des exceptions explicites.
- Les profils distants autorisent uniquement la connexion (démarrage, arrêt et réinitialisation désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous souhaitez qu’OpenClaw détecte `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous fournit directement une URL WebSocket DevTools.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s’appliquent à l’accessibilité CDP distante et
  `attachOnly`, ainsi qu’aux requêtes d’ouverture d’onglets. Les profils de bouclage gérés
  conservent les valeurs CDP locales par défaut. L’énumération persistante des onglets Playwright
  distants utilise la valeur la plus élevée comme délai maximal d’exécution.
- Si un service CDP géré en externe est accessible par l’intermédiaire de l’interface de bouclage, définissez
  `attachOnly: true` pour ce profil ; sinon, OpenClaw traite le port de bouclage comme celui d’un
  profil de navigateur local géré et peut signaler des erreurs de propriété du port local.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent se connecter sur
  l’hôte sélectionné ou par l’intermédiaire d’un Node de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil
  de navigateur basé sur Chromium spécifique, tel que Brave ou Edge.
- Les profils `existing-session` peuvent définir `cdpUrl` lorsque Chrome est déjà en cours d’exécution
  derrière un point de terminaison de détection HTTP(S) DevTools ou un point de terminaison WS(S) direct. Dans ce
  mode, OpenClaw transmet le point de terminaison à Chrome MCP au lieu d’utiliser la connexion automatique ;
  `userDataDir` est ignoré pour les arguments de lancement de Chrome MCP.
- Les profils `existing-session` conservent les limitations actuelles de l’acheminement Chrome MCP :
  actions pilotées par instantané/référence au lieu d’un ciblage par sélecteur CSS, points d’extension de téléversement
  d’un seul fichier, aucune substitution du délai d’expiration des boîtes de dialogue, aucun `wait --load networkidle`, et aucune
  action `responsebody`, exportation PDF, interception des téléchargements ou action par lots.
- Les profils locaux gérés `openclaw` attribuent automatiquement `cdpPort` et `cdpUrl` ; définissez
  explicitement `cdpUrl` uniquement pour les profils CDP distants ou la connexion à un point de terminaison
  de session existante.
- Les profils locaux gérés peuvent définir `executablePath` afin de remplacer la valeur globale
  `browser.executablePath` pour ce profil. Utilisez cette option pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils locaux gérés utilisent `browser.localLaunchTimeoutMs` pour la détection HTTP CDP
  de Chrome après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour
  vérifier que le WebSocket CDP est prêt après le lancement. Augmentez ces valeurs sur les hôtes plus lents où Chrome
  démarre correctement, mais où les vérifications de disponibilité entrent en concurrence avec le démarrage. Les deux valeurs doivent être
  des entiers positifs inférieurs ou égaux à `120000` ms ; les valeurs de configuration non valides sont rejetées.
- Ordre de détection automatique : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` et `browser.profiles.<name>.executablePath` acceptent tous deux
  `~` et `~/...` pour représenter le répertoire personnel de votre système d’exploitation avant le lancement de Chromium.
  Le tilde est également développé pour la valeur `userDataDir` propre à chaque profil `existing-session`.
- Service de contrôle : interface de bouclage uniquement (port dérivé de `gateway.port`, valeur par défaut `18791`).
- `extraArgs` ajoute des indicateurs de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, le dimensionnement de la fenêtre ou des indicateurs de débogage).

---

## Interface utilisateur

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texte court, URL d’image ou URI de données
    },
  },
}
```

- `seamColor` : couleur d’accentuation de l’interface native de l’application (teinte de la bulle du mode conversation, etc.).
- `assistant` : remplacement de l’identité dans l’interface de contrôle. Utilise par défaut l’identité de l’agent actif.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | distant
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // aucun | jeton | mot de passe | proxy de confiance
      token: "your-token",
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // pour mode=trusted-proxy ; voir /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // désactivé | service | tunnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // titres d’objectif générés par l’IA, à activer pour les appels d’outils (consomme des jetons du modèle utilitaire)
      // embedSandbox: "scripts", // strict | scripts | approuvé
      // allowExternalEmbedUrls: false, // dangereux : autoriser les URL http(s) externes absolues pour le contenu intégré
      // chatMessageMaxWidth: "min(1280px, 82%)", // largeur maximale facultative de la transcription de discussion centrée
      // allowedOrigins: ["https://control.example.com"], // requis pour une interface de contrôle hors bouclage
      // dangerouslyAllowHostHeaderOriginFallback: false, // mode dangereux de repli sur l’origine de l’en-tête Host
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Facultatif. Valeur par défaut : false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Facultatif. Non défini/désactivé par défaut.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Approbation automatique vérifiée par SSH. Valeur par défaut : activée (true).
        // Définissez false pour désactiver uniquement la vérification SSH ; cela n’affecte pas
        // autoApproveCidrs ci-dessus. Pour un appairage manuel uniquement des Nodes, définissez false ET
        // ne définissez pas autoApproveCidrs. Transmettez un objet pour ajuster : { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Refus HTTP supplémentaires pour /tools/invoke
      deny: ["browser"],
      // Retirer des outils de la liste de refus HTTP par défaut pour les appelants propriétaires/administrateurs
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Détails des champs du Gateway">

- `mode` : `local` (exécuter le Gateway) ou `remote` (se connecter à un Gateway distant). Le Gateway refuse de démarrer sauf si la valeur est `local`.
- `port` : port multiplexé unique pour WS + HTTP. Ordre de priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IPv4 Tailscale si disponible, sinon interface de bouclage) ou `custom` (une adresse IPv4). Une adresse `tailnet` résolue et toute adresse `custom` autre que `127.0.0.1` ou `0.0.0.0` nécessitent une écoute sur `127.0.0.1` sur le même port pour les clients du même hôte ; le démarrage échoue si l’une des deux écoutes ne peut pas se lier. L’exposition hors interface de bouclage reste limitée à l’interface sélectionnée.
- **Alias de liaison hérités** : utilisez les valeurs du mode de liaison dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), et non les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Remarque concernant Docker** : la liaison `loopback` par défaut écoute sur `127.0.0.1` dans le conteneur. Avec le réseau en pont Docker (`-p 18789:18789`), le trafic arrive sur `eth0` ; le Gateway est donc inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Authentification** : requise par défaut. Les liaisons hors interface de bouclage nécessitent l’authentification du Gateway. En pratique, cela signifie un jeton/mot de passe partagé ou un proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’intégration génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris avec des SecretRefs), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Le démarrage ainsi que les flux d’installation/réparation du service échouent si les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode explicite sans authentification. À utiliser uniquement pour les configurations locales de confiance sur l’interface de bouclage ; ce mode n’est volontairement pas proposé par les invites d’intégration.
- `gateway.auth.mode: "trusted-proxy"` : délègue l’authentification du navigateur/de l’utilisateur à un proxy inverse tenant compte de l’identité et fait confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)). Par défaut, ce mode attend une source de proxy **hors interface de bouclage** ; les proxys inverses sur l’interface de bouclage du même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`. Les appelants internes du même hôte peuvent utiliser `gateway.auth.password` comme solution de repli locale directe ; `gateway.auth.token` reste mutuellement exclusif avec le mode de proxy de confiance.
- `gateway.auth.allowTailscale` : lorsque la valeur est `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification de l’interface de contrôle/WebSocket (vérification via `tailscale whois`). Les points de terminaison de l’API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent à la place le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est de confiance. La valeur par défaut est `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif des échecs d’authentification. S’applique par adresse IP cliente et par périmètre d’authentification (le secret partagé et le jeton d’appareil sont suivis indépendamment). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone Tailscale Serve de l’interface de contrôle, les tentatives ayant échoué pour la même paire `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Des tentatives incorrectes simultanées provenant du même client peuvent donc déclencher le limiteur dès la deuxième requête, au lieu que les deux passent simultanément comme de simples non-correspondances.
  - La valeur par défaut de `gateway.auth.rateLimit.exemptLoopback` est `true` ; définissez-la sur `false` lorsque vous souhaitez intentionnellement limiter également le débit du trafic localhost (pour les configurations de test ou les déploiements de proxy stricts).
- Les tentatives d’authentification WS provenant d’un navigateur sont toujours limitées, sans exemption de l’interface de bouclage (défense en profondeur contre les attaques par force brute sur localhost depuis un navigateur).
- Sur l’interface de bouclage, ces verrouillages provenant d’un navigateur sont isolés pour chaque valeur `Origin`
  normalisée, afin que les échecs répétés d’une origine localhost ne verrouillent pas automatiquement
  une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, liaison sur l’interface de bouclage) ou `funnel` (public, nécessite une authentification).
- `tailscale.serviceName` : nom de service Tailscale facultatif pour le mode Serve, tel
  que `svc:openclaw`. Lorsqu’il est défini, OpenClaw le transmet à `tailscale serve
--service` afin que l’interface de contrôle puisse être exposée via un service nommé plutôt
  que via le nom d’hôte de l’appareil. La valeur doit respecter le format de nom de service Tailscale `svc:<dns-label>` ;
  le démarrage indique l’URL de service dérivée.
- `tailscale.preserveFunnel` : lorsque la valeur est `true` et `tailscale.mode = "serve"`, OpenClaw
  vérifie `tailscale funnel status` avant de réappliquer Serve au démarrage et ignore
  cette étape si une route Funnel configurée en externe couvre déjà le port du Gateway.
  Valeur par défaut : `false`.
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines de navigateur pour les connexions WebSocket au Gateway. Requise pour les origines de navigateur publiques hors interface de bouclage. Les chargements privés de l’interface depuis le même domaine sur le LAN/Tailnet, provenant de l’interface de bouclage, d’hôtes RFC1918/locaux au lien, `.local`, `.ts.net` ou CGNAT Tailscale, sont acceptés sans activer la solution de repli basée sur l’en-tête Host.
- `controlUi.toolTitles` : active les titres d’objectif générés par l’IA pour les appels d’outils dans la discussion de l’interface de contrôle. Valeur par défaut : `false` (le rendu des outils reste entièrement déterministe, sans appel de modèle en arrière-plan). Lorsque cette option est activée, la méthode `chat.toolTitles` étiquette les appels complexes via le routage standard du modèle utilitaire — le `utilityModel` de l’agent (une décision de l’opérateur susceptible d’envoyer des arguments d’outil limités au fournisseur choisi, comme pour toute tâche utilitaire), ou le petit modèle par défaut déclaré par le fournisseur de la session (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) — et met les résultats en cache dans la base de données d’état propre à l’agent afin que les consultations répétées ne soient jamais facturées de nouveau. `utilityModel: \"\"` désactive les titres comme pour toute autre tâche utilitaire ; les titres ne se replient jamais sur le modèle principal.
- `controlUi.chatMessageMaxWidth` : largeur maximale facultative de la transcription centrée de la discussion dans l’interface de contrôle. Accepte des valeurs de largeur CSS contraintes telles que `960px`, `82%`, `min(1280px, 82%)` et `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active la solution de repli d’origine basée sur l’en-tête Host pour les déploiements qui s’appuient intentionnellement sur une politique d’origine basée sur cet en-tête.
- `terminal.enabled` : active le terminal opérateur limité au périmètre administrateur. Valeur par défaut : `false`. Le terminal démarre un PTY hôte dans l’espace de travail de l’agent sélectionné, hérite de l’environnement du processus Gateway et est refusé aux agents dont la configuration est `sandbox.mode: "all"`. Activez-le uniquement dans les déploiements d’opérateurs de confiance ; toute modification redémarre le Gateway et met à jour la politique de sécurité du contenu de l’interface de contrôle.
- `terminal.shell` : exécutable d’interpréteur de commandes facultatif. Lorsqu’il n’est pas défini, OpenClaw utilise `$SHELL` sous Unix et `%ComSpec%` sous Windows.
- `terminal.detachedSessionTimeoutSeconds` : durée pendant laquelle une session de terminal survit après la perte de sa connexion (rechargement de la page, mise en veille de l’ordinateur portable), tout en restant rattachable via `terminal.attach` avec relecture de sa sortie récente. Valeur par défaut : `300`. Définissez `0` pour interrompre les sessions dès la perte de leur connexion. Les sessions détachées continuent d’exécuter leurs commandes ; réduisez donc cette durée sur les hôtes partagés ou exposés.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit utiliser `wss://` pour les hôtes publics ; le protocole en clair `ws://` n’est accepté que pour l’interface de bouclage, le LAN, les adresses locales au lien, `.local`, `.ts.net` et les hôtes CGNAT Tailscale.
- `remote.remotePort` : port du Gateway sur l’hôte SSH distant. Valeur par défaut : `18789` ; utilisez cette option lorsque le port du tunnel local diffère du port du Gateway distant.
- `remote.sshHostKeyPolicy` : politique de clé d’hôte du tunnel SSH sous macOS. `strict` est la valeur par défaut et exige une clé déjà approuvée. `openssh` constitue une activation explicite de la configuration OpenSSH effective pour les alias gérés ; vérifiez les paramètres SSH correspondants de l’utilisateur et du système avant de l’utiliser. L’application macOS et `configure-remote` rétablissent cette politique sur `strict` lors d’un changement de cible, sauf nouvelle activation explicite.
- `gateway.remote.token` / `.password` sont des champs d’identifiants du client distant. Ils ne configurent pas à eux seuls l’authentification du Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé après que les versions iOS reposant sur un relais ont publié leurs inscriptions auprès du Gateway. Les versions publiques de l’App Store utilisent le relais OpenClaw hébergé. Les URL de relais personnalisées doivent correspondre à un chemin de compilation/déploiement iOS délibérément distinct, dont l’URL de relais pointe vers ce relais.
- `gateway.push.apns.relay.timeoutMs` : délai d’expiration de l’envoi du Gateway vers le relais, en millisecondes. Valeur par défaut : `10000`.
- Les inscriptions reposant sur un relais sont déléguées à une identité de Gateway spécifique. L’application iOS associée récupère `gateway.identity.get`, inclut cette identité dans l’inscription au relais et transmet au Gateway une autorisation d’envoi limitée à cette inscription. Un autre Gateway ne peut pas réutiliser cette inscription stockée.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : remplacements temporaires par variables d’environnement pour la configuration de relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP sur l’interface de bouclage. Les URL de relais de production doivent rester en HTTPS.
- `gateway.handshakeTimeoutMs` : délai d’expiration, en millisecondes, de la négociation WebSocket du Gateway avant authentification. Valeur par défaut : `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` est prioritaire lorsqu’elle est définie. Augmentez cette valeur sur les hôtes chargés ou peu puissants, où les clients locaux peuvent se connecter alors que la phase de préparation au démarrage n’est pas encore stabilisée.
- `gateway.channelHealthCheckMinutes` : intervalle, en minutes, du moniteur d’état des canaux. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’état. Valeur par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil d’obsolescence des sockets, en minutes. Conservez une valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`. Valeur par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages par le moniteur d’état, par canal/compte, sur une heure glissante. Valeur par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation facultative, par canal, des redémarrages du moniteur d’état tout en conservant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement par compte pour les canaux à plusieurs comptes. Lorsqu’il est défini, il est prioritaire sur le remplacement au niveau du canal.
- Les chemins d’appel du Gateway local peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et ne peut pas être résolu, la résolution échoue de manière fermée (aucune solution de repli distante ne masque l’échec).
- `trustedProxies` : adresses IP des proxys inverses qui terminent TLS ou injectent les en-têtes du client transféré. Ne répertoriez que les proxys que vous contrôlez. Les entrées d’interface de bouclage restent valides pour les configurations de proxy/détection locale sur le même hôte (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes provenant de l’interface de bouclage admissibles pour `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque la valeur est `true`, le Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Valeur par défaut : `false`, pour un comportement d’échec fermé.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation CIDR/IP facultative permettant d’approuver automatiquement le premier appairage d’un appareil Node sans périmètre demandé. Elle est désactivée lorsqu’elle n’est pas définie. Cela n’approuve pas automatiquement l’appairage opérateur/navigateur/interface de contrôle/WebChat, ni les mises à niveau de rôle, de périmètre, de métadonnées ou de clé publique.
- `gateway.nodes.pairing.sshVerify` : approbation automatique vérifiée par SSH pour le premier appairage d’un appareil Node (activée par défaut). Le Gateway se reconnecte en SSH à l’hôte demandeur de l’appairage (BatchMode, clés d’hôte strictes) et n’approuve que si la clé d’appareil correspond exactement à celle de `openclaw node identity`. Le seuil d’admissibilité est identique à celui de `autoApproveCidrs` ; les sondes sont limitées aux adresses sources privées/CGNAT, sauf si `cidrs` les remplace. Définissez `false` pour désactiver cette fonction, ou `{ user, identity, timeoutMs, cidrs }` pour l’ajuster. Voir [Appairage des Nodes](/fr/gateway/pairing#ssh-verified-device-auto-approval-default).
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : filtrage global d’autorisation/de refus pour les commandes de Node déclarées, après l’appairage et l’évaluation de la liste d’autorisation de la plateforme. Utilisez `allowCommands` pour autoriser explicitement les commandes de Node dangereuses telles que `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` et `sms.send` ; `denyCommands` supprime une commande même si une valeur par défaut de la plateforme ou une autorisation explicite l’inclurait autrement. L’autorisation Santé d’iOS, l’autorisation SMS d’Android et l’autorisation des commandes du Gateway sont indépendantes. Lorsqu’un Node modifie sa liste de commandes déclarées, rejetez puis réapprouvez l’appairage de cet appareil afin que le Gateway enregistre l’instantané mis à jour des commandes.
  - `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour la requête HTTP `POST /tools/invoke` (étend la liste de refus par défaut).
  - `gateway.tools.allow` : retire des noms d’outils de la liste de refus HTTP par défaut pour
  les appelants propriétaires/administrateurs. Cela ne confère pas aux appelants
  `operator.write` porteurs d’une identité un accès de propriétaire/administrateur ;
  `cron`, `gateway` et `nodes` restent indisponibles pour les appelants non propriétaires,
  même lorsqu’ils figurent dans la liste d’autorisation.

</Accordion>

### Points de terminaison compatibles avec OpenAI

- RPC HTTP d’administration : désactivé par défaut en tant que plugin `admin-http-rpc`. Activez le plugin pour enregistrer `POST /api/v1/admin/rpc`. Consultez [RPC HTTP d’administration](/fr/plugins/admin-http-rpc).
- Chat Completions : désactivé par défaut. Activez-le avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses : `gateway.http.endpoints.responses.enabled`.
- Renforcement des entrées URL de Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont considérées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération par URL.
- En-tête facultatif de renforcement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation de plusieurs instances

Exécutez plusieurs Gateway sur un même hôte avec des ports et des répertoires d’état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Options pratiques : `--dev` (utilise `~/.openclaw-dev` + le port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

Consultez [Plusieurs Gateway](/fr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled` : active la terminaison TLS au niveau de l’écouteur du Gateway (HTTPS/WSS) (valeur par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire locale de certificat et de clé auto-signés lorsque des fichiers explicites ne sont pas configurés ; uniquement pour un usage local/de développement.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; limitez-en les autorisations.
- `caPath` : chemin facultatif vers le bundle d’autorités de certification pour la vérification des clients ou les chaînes de confiance personnalisées.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode` : contrôle la manière dont les modifications de configuration sont appliquées à l’exécution.
  - `"off"` : ignore les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"` : redémarre toujours le processus du Gateway lors d’une modification de configuration.
  - `"hot"` : applique les modifications dans le processus sans redémarrage.
  - `"hybrid"` (valeur par défaut) : tente d’abord un rechargement à chaud ; revient à un redémarrage si nécessaire.
- `debounceMs` : fenêtre d’anti-rebond en ms avant l’application des modifications de configuration (entier positif ou nul ; valeur par défaut : `300`).
- `deferralTimeoutMs` : durée maximale facultative en ms pendant laquelle attendre la fin des opérations en cours avant de forcer un redémarrage ou un rechargement à chaud du canal. Omettez-la pour utiliser l’attente limitée par défaut (`300000`) ; définissez-la sur `0` pour attendre indéfiniment et consigner périodiquement des avertissements signalant que des opérations sont toujours en attente.

---

## Environnements de workers cloud

Les workers cloud sont facultatifs. Si `cloudWorkers` est absent ou si `profiles` est vide, OpenClaw n’accepte aucune nouvelle création de worker. Les enregistrements durables créés précédemment continuent d’être réconciliés et restent visibles ; la projection existante du Gateway/Node reste inchangée.

Chaque fournisseur de workers doit renvoyer une `hostKey` SSH provenant d’une sortie de provisionnement fiable, exactement sous la forme `algorithm base64`, sans nom d’hôte ni commentaire. L’amorçage écrit cette clé dans un fichier `known_hosts` isolé, utilise `StrictHostKeyChecking=yes` et échoue avant d’ouvrir une connexion si le fournisseur ne la fournit pas. Il n’existe aucun mécanisme de confiance à la première utilisation.

La configuration du tunnel s’effectue à la demande plutôt que pendant le provisionnement. Lorsqu’il est démarré, le Gateway effectue une redirection inverse d’un socket Unix local au worker vers son point de terminaison WebSocket en boucle locale. Le socket réside dans un répertoire distant attribué aléatoirement et accessible uniquement à son propriétaire ; contrairement à un port TCP en boucle locale, il n’est pas accessible aux autres comptes d’un worker multi-utilisateur et ne peut pas entrer en conflit avec le port d’un autre environnement. Les messages de maintien de connexion SSH et le délai de reconnexion plafonné ne s’exécutent que tant que le propriétaire du tunnel reste actuel. L’arrêt du tunnel empêche les reconnexions avant de fermer le processus SSH.

Le trafic de contrôle et le transfert de l’espace de travail utilisent des connexions SSH distinctes. Tous deux réutilisent la même identité résolue et le même fichier `known_hosts` isolé avec clé épinglée, mais le transfert de l’espace de travail ne partage pas le multiplexage des connexions SSH avec le tunnel de longue durée ; rsync ne peut donc pas bloquer le trafic de contrôle.

### Profil Crabbox

Le fournisseur `crabbox` intégré provisionne un bail compatible SSH via la CLI Crabbox locale. Le champ interne `settings.provider` sélectionne le backend Crabbox ; il est distinct de l’identifiant externe du fournisseur OpenClaw.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Valeur par défaut ; utilisez "npm" uniquement pour une version publiée du Gateway.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Chemin absolu facultatif. Valeur par défaut : ../crabbox/bin/crabbox adjacent, puis PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (obligatoire) : backend Crabbox transmis via `--provider`. Utilisez un backend dont la sortie d’inspection comprend un point de terminaison SSH ; `aws` sélectionne le backend AWS direct.
- `settings.class` (obligatoire) : classe de machine Crabbox transmise à `--class`.
- `settings.ttl` et `settings.idleTimeout` (obligatoires) : chaînes de durée Go positives transmises à `--ttl` et `--idle-timeout`. Ces mécanismes de sécurité côté fournisseur sont distincts de la politique `lifetime` stockée par OpenClaw ci-dessous.
- `settings.binary` : chemin absolu facultatif vers l’exécutable Crabbox. S’il n’est pas défini, OpenClaw vérifie d’abord le dépôt Crabbox adjacent, puis les entrées exécutables de `PATH`, et invoque enfin `crabbox` afin que l’absence de la CLI reste une erreur visible du fournisseur.

Les paramètres inconnus sont rejetés. Les identifiants Crabbox et la configuration de compte propre au backend restent sous la responsabilité de Crabbox ; ne les placez pas dans `settings`. OpenClaw invoque uniquement la CLI locale et n’effectue aucun appel réseau au fournisseur depuis ce plugin. Le provisionnement transmet toujours `--keep=true` ; OpenClaw gère le cycle de vie externe et détruit le bail avec `crabbox stop`.

<Warning>
  OpenClaw résout le chemin `sshKey` local au bail de Crabbox par l’intermédiaire du résolveur de secrets appartenant au fournisseur. La sortie actuelle de `crabbox inspect --json` n’expose pas de `sshHostKey` provisionnée ; les workers reposant sur Crabbox échouent donc toujours de manière fermée avant l’amorçage ou la configuration du tunnel. Crabbox doit provisionner une clé d’hôte faisant autorité pour chaque bail et renvoyer `sshHostKey` exactement sous la forme `algorithm base64`, sans nom d’hôte ni commentaire. Son cache `known_hosts` actuel, local au bail, ne constitue pas un élément de confiance issu du provisionnement.
</Warning>

### Profil de développement SSH statique

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles` : profils de workers nommés avec des identifiants non vides dont les espaces de début et de fin sont supprimés. Chaque profil sélectionne un fournisseur enregistré par un plugin.
- `provider` : identifiant non vide du fournisseur de workers. Les exemples utilisent le fournisseur `crabbox` intégré et le fournisseur `static-ssh` du QA Lab.
- `install` : méthode d’installation du worker. `"bundle"` (valeur par défaut) transfère un bundle identifié par le hachage de son contenu à partir de la version installée du Gateway et prend en charge les versions publiées, de développement et non publiées. `"npm"` est une optimisation facultative destinée à une version empaquetée non modifiée ; elle installe `openclaw@<exact gateway version>` depuis le registre npm public et n’installe jamais `latest`.
- Les plugins de fournisseurs intégrés sont sélectionnés automatiquement lorsqu’ils sont configurés, mais les désactivations explicites et `plugins.allow` s’appliquent toujours. Incluez l’identifiant du fournisseur (par exemple `crabbox`) lorsqu’une liste d’autorisation est configurée. Les plugins de fournisseurs externes doivent également être installés et explicitement activés.
- `settings` : JSON limité appartenant au fournisseur. Le plugin sélectionné définit et valide ses clés ; utilisez des [objets SecretRef](/fr/gateway/secrets) pour les valeurs contenant des secrets. Le fournisseur SSH statique exige `host`, `user`, `hostKey` et `keyRef` ; la valeur par défaut de `port` est `22`. `hostKey` doit être une seule ligne de clé d’hôte publique OpenSSH (`algorithm base64`) obtenue auprès de l’hôte connu ou par un autre canal fiable, sans préfixe d’options.
- `lifetime.idleTimeoutMinutes` : nombre entier positif de minutes stocké pour la future politique de récupération en cas d’inactivité.
- `lifetime.maxLifetimeMinutes` : nombre entier positif de minutes stocké pour la future politique de cycle de vie.

Un environnement d’exécution Node pris en charge (22.19+, 23.11+ ou 24+) doit déjà être installé sur le worker. La méthode facultative `"npm"` nécessite également `npm` et un accès HTTPS sortant au registre npm public. La configuration de la chaîne d’outils en réseau relève de la politique du fournisseur ; l’amorçage signale une erreur exploitable au lieu d’installer lui-même les chaînes d’outils.

Cette base installe et vérifie la version du Gateway et fournit le cycle de vie de démarrage/arrêt du tunnel, mais elle ne lance pas la CLI OpenClaw générale. Le point d’entrée autonome du worker et la boucle seront ajoutés lors de la prochaine étape des workers cloud.

Chaque enregistrement durable d’environnement conserve ses paramètres de fournisseur validés, sa méthode d’installation résolue et sa politique de durée de vie dans un instantané du profil pris au moment de la création. La modification ou la suppression d’un profil nommé affecte les nouvelles créations ; les enregistrements existants poursuivent la réconciliation du cycle de vie avec cet instantané, à condition que le plugin propriétaire reste disponible.

Les valeurs de durée de vie ne sont que des données dans la première version des workers cloud ; leur application automatique sera ajoutée lors de travaux ultérieurs sur le cycle de vie. Les modifications de profil nécessitent un redémarrage du Gateway.

<Warning>
  Le fournisseur `static-ssh` est un environnement de développement du QA Lab issu de l’arborescence des sources et est exclu des distributions empaquetées. Un worker exécuté sur son hôte partagé peut lire des données sans rapport présentes sur l’hôte ; n’utilisez donc pas ce fournisseur comme frontière d’isolation en production.
  Son opérateur doit fournir la `hostKey` attendue ; OpenClaw n’apprendra ni n’acceptera de clé lors de la première connexion.
  La destruction de son bail libère uniquement l’enregistrement logique d’OpenClaw ; elle n’arrête ni ne nettoie l’hôte.
</Warning>

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "De : {{messages[0].from}}\nObjet : {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Authentification : `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Les jetons de hook dans la chaîne de requête sont rejetés.

Remarques concernant la validation et la sécurité :

- `hooks.enabled=true` nécessite un `hooks.token` non vide.
- `hooks.token` doit être distinct du secret partagé d’authentification actif du Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) ; au démarrage, un avertissement de sécurité non fatal est consigné lorsqu’une réutilisation est détectée.
- `openclaw security audit` signale la réutilisation de l’authentification des hooks et du Gateway comme un problème critique, y compris lorsque l’authentification par mot de passe du Gateway est fournie uniquement au moment de l’audit (`--auth password --password <password>`). Exécutez `openclaw doctor --fix` pour renouveler un `hooks.token` persistant réutilisé, puis mettez à jour les émetteurs de hooks externes afin qu’ils utilisent le nouveau jeton de hook.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié tel que `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limitez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mappage ou un préréglage utilise un `sessionKey` basé sur un modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés de mappage statiques ne nécessitent pas cette activation explicite.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - Le `sessionKey` provenant de la charge utile de la requête est accepté uniquement lorsque `hooks.allowRequestSessionKey=true` (valeur par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` de mappage rendues à partir d’un modèle sont considérées comme fournies de l’extérieur et nécessitent également `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mappage">

- `match.path` correspond au sous-chemin après `/hooks` (par exemple, `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de la charge utile pour les chemins génériques.
- Les modèles tels que `{{messages[0].subject}}` lisent les données de la charge utile.
- `transform` peut pointer vers un module JS/TS qui renvoie une action de hook.
  - `transform.module` doit être un chemin relatif et rester dans `hooks.transformsDir` (les chemins absolus et les traversées de répertoires sont refusés).
  - Conservez `hooks.transformsDir` sous `~/.openclaw/hooks/transforms` ; les répertoires de Skills de l’espace de travail sont refusés. Si `openclaw doctor` signale ce chemin comme non valide, déplacez le module de transformation dans le répertoire de transformations des hooks ou supprimez `hooks.transformsDir`.
- `agentId` achemine vers un agent précis ; les identifiants inconnus reviennent à l’agent par défaut.
- `allowedAgentIds` : limite l’acheminement effectif vers les agents, y compris le chemin de l’agent par défaut lorsque `agentId` est omis (`*` ou omission = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d’agent par hook sans `sessionKey` explicite.
- `allowRequestSessionKey` : autorise les appelants de `/hooks/agent` et les clés de session de mappage pilotées par un modèle à définir `sessionKey` (valeur par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d’autorisation facultative de préfixes pour les valeurs `sessionKey` explicites (requête + mappage), par exemple `["hook:"]`. Elle devient obligatoire lorsqu’un mappage ou un préréglage utilise un `sessionKey` basé sur un modèle.
- `deliver: true` envoie la réponse finale à un canal ; `channel` utilise `last` par défaut.
- `model` remplace le LLM pour cette exécution de hook (il doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le préréglage Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez cet acheminement par message, définissez `hooks.allowRequestSessionKey: true` et limitez `hooks.allowedSessionKeyPrefixes` à l’espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le préréglage par un `sessionKey` statique au lieu de la valeur par défaut basée sur un modèle.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Le Gateway démarre automatiquement `gog gmail watch serve` au démarrage lorsqu’il est configuré. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour le désactiver.
- N’exécutez pas une instance distincte de `gog gmail watch serve` parallèlement au Gateway.

---

## Hôte du Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // ou OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Sert du HTML/CSS/JS modifiable par l’agent et A2UI via HTTP sur le port du Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : conservez `gateway.bind: "loopback"` (valeur par défaut).
- Liaisons autres que loopback : les routes Canvas nécessitent l’authentification du Gateway (jeton/mot de passe/proxy de confiance), comme les autres surfaces HTTP du Gateway.
- Les WebViews de Node n’envoient généralement pas d’en-têtes d’authentification ; une fois qu’un Node est appairé et connecté, le Gateway publie des URL de capacité limitées au Node pour l’accès à Canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du Node et expirent rapidement. Aucun mécanisme de repli basé sur l’adresse IP n’est utilisé.
- Injecte le client de rechargement à chaud dans le HTML servi.
- Crée automatiquement un fichier `index.html` initial lorsqu’il est vide.
- Sert également A2UI à l’adresse `/__openclaw__/a2ui/`.
- Les modifications nécessitent un redémarrage du Gateway.
- Désactivez le rechargement à chaud pour les répertoires volumineux ou en cas d’erreurs `EMFILE`.

---

## Découverte

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (valeur par défaut) : omet `cliPath` + `sshPort` des enregistrements TXT.
- `full` : inclut `cliPath` + `sshPort` ; la diffusion multicast sur le réseau local nécessite toujours que le Plugin `bonjour` intégré soit activé.
- `off` : désactive la diffusion multicast sur le réseau local sans modifier l’activation du Plugin.
- Le Plugin `bonjour` intégré démarre automatiquement sur les hôtes macOS et doit être activé explicitement sur Linux, Windows et les déploiements conteneurisés du Gateway.
- Le nom d’hôte utilise par défaut le nom d’hôte du système lorsqu’il constitue une étiquette DNS valide, avec repli sur `openclaw`. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive entièrement la diffusion mDNS et prévaut sur `discovery.mdns.mode`.

### Zone étendue (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour la découverte entre réseaux, associez-la à un serveur DNS (CoreDNS recommandé) + un DNS fractionné Tailscale.

Configuration : `openclaw dns setup --apply`.

---

## Environnement

### `env` (variables d’environnement intégrées)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Les variables d’environnement intégrées sont appliquées uniquement si la clé est absente de l’environnement du processus.
- Fichiers `.env` : `.env` du CWD + `~/.openclaw/.env` (aucun des deux ne remplace les variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis le profil de votre shell de connexion.
- Consultez [Environnement](/fr/help/environment) pour connaître l’ordre de priorité complet.

### Substitution des variables d’environnement

Référencez les variables d’environnement dans n’importe quelle chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Seuls les noms en majuscules sont reconnus : `[A-Z_][A-Z0-9_]*`.
- Les variables absentes ou vides provoquent une erreur lors du chargement de la configuration.
- Échappez avec `$${VAR}` pour obtenir un `${VAR}` littéral.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secrets sont additives : les valeurs en texte clair continuent de fonctionner.

### `SecretRef`

Utilisez une seule forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- Motif de `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- Motif de l’identifiant pour `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- Identifiant pour `source: "file"` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- Motif de l’identifiant pour `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (prend en charge les sélecteurs de style AWS `secret#json_key`)
- Les identifiants de `source: "exec"` ne doivent pas contenir de segments de chemin `.` ou `..` délimités par des barres obliques (par exemple, `a/../b` est refusé)

### Surface d’identifiants prise en charge

- Matrice canonique : [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)
- `secrets apply` cible les chemins d’identifiants `openclaw.json` pris en charge.
- Les références de `auth-profiles.json` sont incluses dans la résolution à l’exécution et dans la couverture des audits.

### Configuration des fournisseurs de secrets

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // fournisseur d’environnement explicite facultatif
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Remarques :

- Le fournisseur `file` prend en charge `mode: "json"` et `mode: "singleValue"` (`id` doit être `"value"` en mode singleValue).
- Les chemins des fournisseurs file et exec échouent de manière sécurisée lorsque la vérification des ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour les chemins de confiance qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` nécessite un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande avec lien symbolique sont refusés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins avec lien symbolique tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification du répertoire de confiance s’applique au chemin cible résolu.
- L’environnement enfant de `exec` est minimal par défaut ; transmettez explicitement les variables requises avec `passEnv`.
- Les références de secrets sont résolues au moment de l’activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement cet instantané.
- Le filtrage des surfaces actives s’applique pendant l’activation : les références non résolues sur les surfaces activées font échouer le démarrage ou le rechargement, tandis que les surfaces inactives sont ignorées avec des diagnostics.

---

## Stockage de l’authentification

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Les profils propres à chaque agent sont stockés dans `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` prend en charge les références au niveau des valeurs (`keyRef` pour `api_key`, `tokenRef` pour `token`) dans les modes d’identifiants statiques.
- Les anciens mappages plats de `auth-profiles.json`, tels que `{ "provider": { "apiKey": "..." } }`, ne constituent pas un format d’exécution ; `openclaw doctor --fix` les réécrit sous forme de profils de clé d’API canoniques `provider:default` avec une sauvegarde `.legacy-flat.*.bak`.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d’authentification reposant sur SecretRef.
- Les identifiants statiques à l’exécution proviennent d’instantanés résolus en mémoire ; les anciennes entrées statiques de `auth.json` sont supprimées lorsqu’elles sont détectées.
- Importations OAuth héritées depuis `~/.openclaw/credentials/oauth.json`.
- Consultez [OAuth](/fr/concepts/oauth).
- Comportement des secrets à l’exécution et outils `audit/configure/apply` : [Gestion des secrets](/fr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours` : délai d’attente de base en heures lorsqu’un profil échoue en raison de véritables
  erreurs de facturation/crédit insuffisant (valeur par défaut : `5`). Un texte de facturation explicite peut
  toujours être classé ici, même pour des réponses `401`/`403`, mais les mécanismes de
  correspondance de texte propres à un fournisseur restent limités au fournisseur qui les possède (par exemple,
  `Key limit exceeded` d’OpenRouter). Les messages HTTP `402` réessayables relatifs à une fenêtre d’utilisation ou
  à une limite de dépenses d’organisation/espace de travail restent plutôt dans le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : remplacements facultatifs par fournisseur du délai d’attente de facturation en heures.
- `billingMaxHours` : plafond en heures de la croissance exponentielle du délai d’attente de facturation (valeur par défaut : `24`).
- `authPermanentBackoffMinutes` : délai d’attente de base en minutes pour les échecs `auth_permanent` à haut niveau de confiance (valeur par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes de la croissance du délai d’attente `auth_permanent` (valeur par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de délai d’attente (valeur par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profils d’authentification chez le même fournisseur pour les erreurs de surcharge avant de basculer vers le modèle de secours (valeur par défaut : `1`). Les formats signalant un fournisseur occupé, tels que `ModelNotReadyException`, sont classés ici.
- `overloadedBackoffMs` : délai fixe avant de réessayer une rotation de fournisseur/profil surchargé (valeur par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profils d’authentification chez le même fournisseur pour les erreurs de limitation de débit avant de basculer vers le modèle de secours (valeur par défaut : `1`). Cette catégorie de limitation de débit comprend les textes propres aux fournisseurs tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

---

## Audit

```json5
{
  audit: {
    enabled: true,
    messages: "off", // désactivé | direct | tous
  },
}
```

Le Gateway enregistre des événements d’audit contenant **uniquement des métadonnées** pour les exécutions d’agents et les actions
d’outils dans la base de données d’état partagée. Les métadonnées du cycle de vie des messages
font l’objet d’une activation distincte. Le registre stocke l’identité, les informations temporelles, les noms d’outils et les résultats
normalisés, mais jamais les prompts, le corps des messages, les arguments des outils, les résultats ni le texte brut
des erreurs. Les lignes de messages ne stockent pas les identifiants bruts de compte de plateforme, de conversation,
de message ni de cible. Les clés de session d’exécution/d’outil restent disponibles pour la corrélation
et peuvent elles-mêmes contenir des identifiants de compte de plateforme ou de pair. Les enregistrements
expirent après 30 jours et le registre est limité à 100 000 lignes. Interrogez-les avec
[`openclaw audit`](/fr/cli/audit) ou l’appel RPC Gateway
[`audit.activity.list`](/fr/gateway/protocol#audit-ledger-rpc). Consultez
[Historique d’audit](/fr/gateway/audit) pour le modèle de données complet, la sémantique de confidentialité
et les limites de couverture.

- `enabled` : enregistre les nouveaux événements d’audit (valeur par défaut : `true`). Le registre est activé
  par défaut, car une piste d’audit activée seulement après un incident ne peut pas expliquer
  celui-ci. Définir cette option sur `false` interrompt l’insertion de nouveaux événements après le redémarrage du Gateway ;
  les enregistrements existants restent lisibles jusqu’à leur expiration. La réactivation
  reprend l’enregistrement à partir de ce moment-là — l’intervalle manquant n’est pas reconstitué.
- `messages` : portée des métadonnées de messages (valeur par défaut : `"off"`). `"direct"` enregistre
  uniquement les conversations directes connues. `"all"` enregistre également les groupes, les canaux et
  les types de conversations inconnus. Les deux modes restent dépourvus de contenu et remplacent les
  identifiants bruts par des pseudonymes à clé locaux à l’installation lorsque la corrélation est
  disponible. Il s’agit d’aides à la corrélation plutôt que d’une anonymisation ; la base de données
  d’état stocke la clé de dérivation, contrairement aux exportations RPC et CLI.

Le Gateway en cours d’exécution capture `audit.enabled` et `audit.messages` au démarrage ;
redémarrez-le après avoir modifié l’un ou l’autre paramètre. La couverture des messages comprend actuellement
les messages entrants acceptés qui atteignent la distribution centrale et une ligne terminale par
charge utile logique d’origine d’une réponse sortante qui atteint la livraison durable partagée.
Les chemins locaux aux Plugins et les chemins d’envoi direct qui contournent ces limites partagées ne sont
pas encore couverts. Le processus d’écriture en arrière-plan
à capacité limitée fonctionne au mieux et ne constitue pas une archive de conformité sans perte.

---

## Journalisation

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // élégant | compact | json
    redactSensitive: "tools", // désactivé | outils
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Fichier journal par défaut : `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Définissez `logging.file` pour utiliser un chemin stable.
- `consoleLevel` passe à `debug` lorsque `--verbose` est utilisé.
- `maxFileBytes` : taille maximale du fichier journal actif en octets avant rotation (entier positif ; valeur par défaut : `104857600` = 100 MB). OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif.
- `redactSensitive` / `redactPatterns` : masquage au mieux pour la sortie de console, les fichiers journaux, les enregistrements de journaux OTLP et le texte persistant des transcriptions de session. `redactSensitive: "off"` désactive uniquement cette politique générale de journalisation/transcription ; les surfaces de sécurité de l’interface utilisateur, des outils et des diagnostics masquent toujours les secrets avant leur émission.

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled` : commutateur principal de la sortie d’instrumentation (valeur par défaut : `true`).
- `flags` : tableau de chaînes d’indicateurs activant une sortie de journal ciblée (prend en charge les caractères génériques comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d’ancienneté sans progression en ms pour classer les sessions de traitement de longue durée comme `session.long_running`, `session.stalled` ou `session.stuck` (valeur par défaut : `120000`). Une progression de réponse, d’outil, d’état, de bloc ou ACP réinitialise le minuteur ; les diagnostics `session.stuck` répétés appliquent un délai d’attente croissant tant que l’état reste inchangé.
- `stuckSessionAbortMs` : seuil d’ancienneté sans progression en ms avant que les travaux actifs bloqués admissibles puissent être interrompus et vidés à des fins de récupération. Lorsqu’il n’est pas défini, OpenClaw utilise la fenêtre étendue plus sûre pour les exécutions intégrées, d’au moins 5 minutes et 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot` : capture un instantané de stabilité expurgé avant une erreur de mémoire insuffisante lorsque la pression mémoire atteint `critical` (valeur par défaut : `false`). Définissez cette option sur `true` pour ajouter l’analyse/l’écriture du fichier de lot de stabilité tout en conservant les événements normaux de pression mémoire.
- `otel.enabled` : active le pipeline d’exportation OpenTelemetry (valeur par défaut : `false`). Pour la configuration complète, le catalogue des signaux et le modèle de confidentialité, consultez [Exportation OpenTelemetry](/fr/gateway/opentelemetry).
- `otel.endpoint` : URL du collecteur pour l’exportation OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint` : points de terminaison OTLP facultatifs propres à chaque signal. Lorsqu’ils sont définis, ils remplacent `otel.endpoint` uniquement pour le signal concerné.
- `otel.protocol` : `"http/protobuf"` (valeur par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’exportation OTel.
- `otel.serviceName` : nom du service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : active l’exportation des traces, des métriques ou des journaux.
- `otel.logsExporter` : destination d’exportation des journaux : `"otlp"` (valeur par défaut), `"stdout"` pour un objet JSON par ligne de sortie standard, ou `"both"`.
- `otel.sampleRate` : taux d’échantillonnage des traces de `0` à `1`.
- `otel.flushIntervalMs` : intervalle de vidage périodique de la télémétrie en ms.
- `otel.captureContent` : capture facultative du contenu brut pour les attributs d’étendue OTEL. Désactivée par défaut. La valeur booléenne `true` capture le contenu des messages/outils hors système ; la forme objet permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` et `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` : commutateur d’environnement pour le dernier format expérimental des étendues d’inférence GenAI, notamment les noms d’étendue `{gen_ai.operation.name} {gen_ai.request.model}`, le type d’étendue `CLIENT` et `gen_ai.provider.name` à la place de l’ancien `gen_ai.system`. Par défaut, les étendues conservent `openclaw.model.call` et `gen_ai.system` pour assurer la compatibilité ; les métriques GenAI utilisent des attributs sémantiques bornés.
- `OPENCLAW_OTEL_PRELOADED=1` : commutateur d’environnement pour les hôtes ayant déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK appartenant au Plugin tout en maintenant les écouteurs de diagnostic actifs.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` et `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` : variables d’environnement de point de terminaison propres à chaque signal, utilisées lorsque la clé de configuration correspondante n’est pas définie.
- `cacheTrace.enabled` : journalise les instantanés de trace du cache pour les exécutions intégrées (valeur par défaut : `false`).
- `cacheTrace.filePath` : chemin de sortie du fichier JSONL de trace du cache (valeur par défaut : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem` : contrôle les éléments inclus dans la sortie de trace du cache (tous définis sur `true` par défaut).

---

## Mise à jour

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel` : canal de publication — `"stable"`, `"extended-stable"`, `"beta"` ou `"dev"`. Le canal extended-stable concerne uniquement les paquets : les commandes au premier plan gèrent l’installation, tandis que le Gateway peut émettre des indications de mise à jour en lecture seule.
- `checkOnStart` : vérifie les mises à jour npm au démarrage du Gateway (valeur par défaut : `true`). Les sélections extended-stable enregistrées utilisent la même indication en lecture seule et le même calendrier d’indication toutes les 24 heures.
- `auto.enabled` : active la mise à jour automatique en arrière-plan pour les installations de paquets des canaux stable et bêta (valeur par défaut : `false`). Le canal extended-stable n’est jamais appliqué automatiquement.
- `auto.stableDelayHours` : délai minimal en heures avant l’application automatique du canal stable (valeur par défaut : `6` ; maximum : `168`).
- `auto.stableJitterHours` : fenêtre supplémentaire en heures pour étaler le déploiement du canal stable (valeur par défaut : `12` ; maximum : `168`).
- `auto.betaCheckIntervalHours` : fréquence en heures des vérifications du canal bêta (valeur par défaut : `1` ; maximum : `24`). Les paramètres de délai/décalage du canal stable et d’interrogation du canal bêta ne s’appliquent pas au canal extended-stable.

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // direct | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled` : activation globale de la fonctionnalité ACP (valeur par défaut : `true` ; définissez-la sur `false` pour masquer les options de répartition et de création ACP).
- `dispatch.enabled` : activation indépendante de la répartition des tours de session ACP (valeur par défaut : `true`). Définissez-la sur `false` pour conserver les commandes ACP disponibles tout en bloquant leur exécution.
- `backend` : identifiant du backend d’exécution ACP par défaut (doit correspondre à un Plugin d’exécution ACP enregistré).
  Installez d’abord le Plugin du backend et, si `plugins.allow` est défini, incluez l’identifiant du Plugin du backend (par exemple `acpx`), sans quoi le backend ACP ne sera pas chargé.
- `fallbacks` : liste ordonnée des identifiants de backends ACP de secours essayés lorsque le backend principal échoue rapidement avec une erreur apparemment temporaire (indisponibilité, limitation du débit, quota épuisé ou surcharge), avant d’avoir produit la moindre sortie. Chaque entrée doit correspondre au backend d’un Plugin d’exécution ACP enregistré.
- `defaultAgent` : identifiant de l’agent cible ACP de secours lorsque les créations ne précisent pas de cible explicite.
- `allowedAgents` : liste d’autorisation des identifiants d’agents admis pour les sessions d’exécution ACP ; une liste vide signifie qu’aucune restriction supplémentaire ne s’applique.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage après inactivité, en ms, pour le texte diffusé.
- `stream.maxChunkChars` : taille maximale d’un fragment avant le fractionnement de la projection du bloc diffusé.
- `stream.repeatSuppression` : supprime les lignes d’état ou d’outil répétées à chaque tour (valeur par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse progressivement ; `"final_only"` met en mémoire tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur précédant le texte visible après des événements d’outil masqués (valeur par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie de l’assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes d’état ou de mise à jour ACP projetées.
- `stream.tagVisibility` : association des noms de balises à des valeurs booléennes remplaçant leur visibilité pour les événements diffusés.
- `runtime.ttlMinutes` : TTL d’inactivité, en minutes, des processus de session ACP avant qu’ils puissent être nettoyés.
- `runtime.installCommand` : commande d’installation facultative à exécuter lors de l’amorçage d’un environnement d’exécution ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` contrôle le style du slogan de la bannière :
  - `"random"` (par défaut) : slogans humoristiques/saisonniers en rotation.
  - `"default"` : slogan neutre fixe (`All your chats, one OpenClaw.`).
  - `"off"` : aucun texte de slogan (le titre et la version de la bannière restent affichés).
- Pour masquer toute la bannière (et pas seulement les slogans), définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

---

## Assistant de configuration

Métadonnées écrites par les processus de configuration guidée de la CLI (`onboard`, `configure`, `doctor`) :

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identité

Voir les champs d’identité de `agents.list` sous [Valeurs par défaut des agents](/fr/gateway/config-agents#agent-defaults).

---

## Bridge (hérité, supprimé)

Les versions actuelles n’incluent plus le bridge TCP. Les Nodes se connectent via le WebSocket du Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue jusqu’à leur suppression ; `openclaw doctor --fix` peut supprimer les clés inconnues).

<Accordion title="Configuration héritée du bridge (référence historique)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // valeur par défaut ; répartition Cron + exécution isolée du tour d’agent Cron
    webhook: "https://example.invalid/legacy", // solution de repli obsolète pour les tâches stockées avec notify:true
    webhookToken: "replace-with-dedicated-token", // jeton bearer facultatif pour l’authentification des Webhooks sortants
    sessionRetention: "24h", // chaîne de durée ou false
    runLog: {
      maxBytes: "2mb", // 2_000_000 octets par défaut
      keepLines: 2000, // 2000 par défaut
    },
  },
}
```

- `sessionRetention` : durée de conservation des sessions d’exécution Cron isolées terminées avant l’élagage des lignes de session SQLite. Contrôle également le nettoyage des transcriptions Cron supprimées et archivées. Valeur par défaut : `24h` ; définissez-la sur `false` pour désactiver cette fonctionnalité.
- `runLog.maxBytes` : accepté à des fins de compatibilité avec les anciens journaux d’exécution Cron basés sur des fichiers. Valeur par défaut : `2_000_000` octets.
- `runLog.keepLines` : lignes les plus récentes de l’historique d’exécution SQLite conservées par tâche. Valeur par défaut : `2000`.
- `webhookToken` : jeton bearer utilisé pour l’envoi de requêtes POST par le Webhook Cron (`delivery.mode = "webhook"`) ; s’il est omis, aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL de Webhook de repli héritée et obsolète (http/https), utilisée par `openclaw doctor --fix` pour migrer les tâches stockées qui comportent encore `notify: true` ; l’envoi à l’exécution utilise `delivery.mode="webhook"` avec `delivery.to` pour chaque tâche, ou `delivery.completionDestination` lors de la conservation de l’envoi des annonces.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches cron en cas d’erreurs transitoires (valeur par défaut : `3` ; plage : `0`-`10`).
- `backoffMs` : tableau des délais d’attente en ms pour chaque nouvelle tentative (valeur par défaut : `[30000, 60000, 300000]` ; 1-10 entrées).
- `retryOn` : types d’erreurs qui déclenchent de nouvelles tentatives : `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez ce champ pour réessayer pour tous les types d’erreurs transitoires.

Les tâches ponctuelles restent activées jusqu’à épuisement des tentatives, puis sont désactivées tout en conservant l’état d’erreur final. Les tâches récurrentes utilisent la même politique de nouvelle tentative pour les erreurs transitoires afin de s’exécuter à nouveau après le délai d’attente, avant leur prochain créneau planifié ; en cas d’erreur permanente ou d’épuisement des tentatives pour les erreurs transitoires, elles reprennent la planification récurrente normale avec un délai d’attente après erreur.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled` : active les alertes d’échec pour les tâches cron (valeur par défaut : `false`).
- `after` : nombre d’échecs consécutifs avant le déclenchement d’une alerte (entier positif, minimum : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre les alertes répétées pour une même tâche (entier non négatif).
- `includeSkipped` : comptabilise les exécutions consécutives ignorées dans le seuil d’alerte (valeur par défaut : `false`). Les exécutions ignorées sont suivies séparément et n’affectent pas le délai d’attente après une erreur d’exécution.
- `mode` : mode de livraison : `"announce"` envoie l’alerte au moyen d’un message de canal ; `"webhook"` la publie sur le Webhook configuré.
- `accountId` : identifiant facultatif du compte ou du canal auquel limiter la livraison des alertes.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destination par défaut des notifications d’échec des tâches cron pour toutes les tâches.
- `mode` : `"announce"` ou `"webhook"` ; la valeur par défaut est `"announce"` lorsque les données de destination sont suffisantes.
- `channel` : remplacement du canal pour la livraison des annonces. `"last"` réutilise le dernier canal de livraison connu.
- `to` : destination explicite de l’annonce ou URL du Webhook. Obligatoire en mode Webhook.
- `accountId` : remplacement facultatif du compte pour la livraison.
- Le paramètre `delivery.failureDestination` propre à chaque tâche remplace cette valeur globale par défaut.
- Lorsqu’aucune destination d’échec globale ni propre à la tâche n’est définie, les tâches qui livrent déjà leurs résultats via `announce` utilisent cette destination d’annonce principale en cas d’échec.
- `delivery.failureDestination` est uniquement pris en charge pour les tâches avec `sessionTarget="isolated"`, sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Consultez [Tâches cron](/fr/automation/cron-jobs). Les exécutions cron isolées sont suivies en tant que [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle pour les médias

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                               |
| `{{RawBody}}`      | Corps brut (sans enveloppes d’historique ou d’expéditeur)      |
| `{{BodyStripped}}` | Corps sans les mentions de groupe                              |
| `{{From}}`         | Identifiant de l’expéditeur                                    |
| `{{To}}`           | Identifiant de la destination                                  |
| `{{MessageSid}}`   | Identifiant du message du canal                                |
| `{{SessionId}}`    | UUID de la session actuelle                                    |
| `{{IsNewSession}}` | `"true"` lorsqu’une nouvelle session est créée                 |
| `{{MediaUrl}}`     | Pseudo-URL du média entrant                                    |
| `{{MediaPath}}`    | Chemin local du média                                          |
| `{{MediaType}}`    | Type de média (image/audio/document/…)                          |
| `{{Transcript}}`   | Transcription audio                                            |
| `{{Prompt}}`       | Invite de média résolue pour les entrées de la CLI             |
| `{{MaxChars}}`     | Nombre maximal de caractères de sortie résolu pour la CLI      |
| `{{ChatType}}`     | `"direct"` ou `"group"`                                        |
| `{{GroupSubject}}` | Sujet du groupe (dans la mesure du possible)                   |
| `{{GroupMembers}}` | Aperçu des membres du groupe (dans la mesure du possible)      |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (dans la mesure du possible)   |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (dans la mesure du possible) |
| `{{Provider}}`     | Indication du fournisseur (whatsapp, telegram, discord, etc.)  |

---

## Inclusions de configuration (`$include`)

Répartissez la configuration dans plusieurs fichiers :

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportement de fusion :**

- Fichier unique : remplace l’objet conteneur.
- Tableau de fichiers : fusion profonde dans l’ordre indiqué (les fichiers ultérieurs remplacent les précédents).
- Clés sœurs : fusionnées après les inclusions (elles remplacent les valeurs incluses).
- Inclusions imbriquées : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus par rapport au fichier qui effectue l’inclusion, mais doivent rester dans le répertoire de configuration de premier niveau (`dirname` de `openclaw.json`). Les formes absolues ou contenant `../` sont autorisées uniquement si leur résolution reste à l’intérieur de cette limite. Définissez `OPENCLAW_INCLUDE_ROOTS` (chemins absolus) pour autoriser des racines supplémentaires en dehors du répertoire de configuration.
- Limites : les chemins ne doivent pas contenir d’octets nuls et doivent comporter strictement moins de 4096 caractères avant et après leur résolution ; chaque fichier inclus est limité à 2 MB.
- Les écritures appartenant à OpenClaw qui ne modifient qu’une seule section de premier niveau adossée à une inclusion de fichier unique sont répercutées dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les inclusions racines, les tableaux d’inclusions et les inclusions comportant des remplacements par des clés sœurs sont en lecture seule pour les écritures appartenant à OpenClaw ; ces écritures échouent de manière sécurisée au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, les erreurs d’analyse, les inclusions circulaires, les formats de chemin non valides et les longueurs excessives.

---

## Rubriques connexes

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Doctor](/fr/gateway/doctor)
