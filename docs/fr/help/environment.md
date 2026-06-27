---
read_when:
    - Vous devez savoir quelles variables d’environnement sont chargées, et dans quel ordre
    - Vous déboguez des clés API manquantes dans le Gateway
    - Vous documentez l’authentification des fournisseurs ou les environnements de déploiement
summary: Où OpenClaw charge les variables d’environnement et l’ordre de priorité
title: Variables d’environnement
x-i18n:
    generated_at: "2026-06-27T17:35:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw récupère les variables d’environnement depuis plusieurs sources. La règle est de **ne jamais remplacer les valeurs existantes**.
Les fichiers `.env` de l’espace de travail sont une source moins fiable : OpenClaw ignore les identifiants des fournisseurs et les contrôles d’exécution protégés provenant du `.env` de l’espace de travail avant d’appliquer la précédence.

## Précédence (de la plus élevée à la plus basse)

1. **Environnement du processus** (ce que le processus Gateway possède déjà depuis le shell/daemon parent).
2. **`.env` dans le répertoire de travail actuel** (valeur par défaut de dotenv ; ne remplace pas ; les identifiants des fournisseurs et les contrôles d’exécution protégés sont ignorés).
3. **`.env` global** dans `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env` ; recommandé pour les clés d’API des fournisseurs ; ne remplace pas).
4. **Bloc `env` de configuration** dans `~/.openclaw/openclaw.json` (appliqué uniquement si la valeur est absente).
5. **Import facultatif depuis le shell de connexion** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), appliqué uniquement pour les clés attendues manquantes.

Sur les nouvelles installations Ubuntu qui utilisent le répertoire d’état par défaut, OpenClaw traite aussi `~/.config/openclaw/gateway.env` comme repli de compatibilité après le `.env` global. Si les deux fichiers existent et divergent, OpenClaw conserve `~/.openclaw/.env` et affiche un avertissement.

Si le fichier de configuration est entièrement absent, l’étape 4 est ignorée ; l’import depuis le shell s’exécute tout de même s’il est activé.

## Identifiants des fournisseurs et `.env` de l’espace de travail

Ne conservez pas les clés d’API des fournisseurs uniquement dans un `.env` d’espace de travail. OpenClaw ignore les variables d’environnement d’identifiants des fournisseurs provenant des fichiers `.env` d’espace de travail, y compris les clés courantes comme `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` et `FIRECRAWL_API_KEY`.

Utilisez l’une de ces sources fiables pour les identifiants des fournisseurs :

- L’environnement du processus Gateway, par exemple un shell, une unité launchd/systemd, un secret de conteneur ou un secret CI.
- Le fichier dotenv global d’exécution dans `~/.openclaw/.env` ou `$OPENCLAW_STATE_DIR/.env`.
- Le bloc `env` de configuration dans `~/.openclaw/openclaw.json`.
- L’import facultatif depuis le shell de connexion lorsque `env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1` est activé.

Si vous stockiez auparavant les clés des fournisseurs uniquement dans un `.env` d’espace de travail, déplacez-les vers l’une des sources fiables ci-dessus. Le `.env` de l’espace de travail peut toujours fournir des variables de projet ordinaires qui ne sont pas des identifiants, des redirections de point de terminaison, des substitutions d’hôte ou des contrôles d’exécution `OPENCLAW_*`.

Consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security#workspace-env-files) pour la justification de sécurité.

## Bloc `env` de configuration

Deux façons équivalentes de définir des variables d’environnement inline (les deux ne remplacent pas les valeurs existantes) :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

Le bloc `env` de configuration accepte uniquement des valeurs de chaîne littérales. Il ne développe pas les valeurs
`file:...` ; par exemple, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
est transmis aux fournisseurs sous la forme exacte de cette chaîne.

Pour les clés de fournisseur adossées à un fichier, utilisez un SecretRef sur le champ d’identifiant qui
le prend en charge :

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Consultez [Gestion des secrets](/fr/gateway/secrets) et la
[surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) pour
les champs pris en charge.

## Import de l’environnement du shell

`env.shellEnv` exécute votre shell de connexion et importe uniquement les clés attendues **manquantes** :

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Équivalents en variables d’environnement :

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Instantanés du shell d’exécution

Sur les hôtes Gateway non Windows, les commandes `exec` bash et zsh utilisent par défaut un instantané de démarrage.
Définissez `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dans l’environnement du processus Gateway pour désactiver ce chemin.
Les valeurs `false`, `no` et `off` le désactivent aussi. Les valeurs `exec.env` propres à chaque appel ne peuvent pas basculer
les instantanés ni rediriger le cache des instantanés.

## Variables d’environnement injectées à l’exécution

OpenClaw injecte aussi des marqueurs de contexte dans les processus enfants créés :

- `OPENCLAW_SHELL=exec` : défini pour les commandes exécutées via l’outil `exec`.
- `OPENCLAW_SHELL=acp` : défini pour les créations de processus du backend d’exécution ACP (par exemple `acpx`).
- `OPENCLAW_SHELL=acp-client` : défini pour `openclaw acp client` lorsqu’il crée le processus de pont ACP.
- `OPENCLAW_SHELL=tui-local` : défini pour les commandes shell `!` locales du TUI.
- `OPENCLAW_CLI=1` : défini pour les processus enfants créés par le point d’entrée CLI.

Ce sont des marqueurs d’exécution (pas une configuration utilisateur requise). Ils peuvent être utilisés dans la logique de shell/profil
pour appliquer des règles propres au contexte.

## Variables d’environnement d’interface utilisateur

- `OPENCLAW_THEME=light` : force la palette claire du TUI lorsque votre terminal a un arrière-plan clair.
- `OPENCLAW_THEME=dark` : force la palette sombre du TUI.
- `COLORFGBG` : si votre terminal l’exporte, OpenClaw utilise l’indication de couleur d’arrière-plan pour choisir automatiquement la palette du TUI.

## Substitution de variables d’environnement dans la configuration

Vous pouvez référencer directement des variables d’environnement dans les valeurs de chaîne de configuration avec la syntaxe `${VAR_NAME}` :

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Consultez [Configuration : substitution de variables d’environnement](/fr/gateway/configuration-reference#env-var-substitution) pour les détails complets.

## Références secrètes et chaînes `${ENV}`

OpenClaw prend en charge deux modèles pilotés par l’environnement :

- Substitution de chaîne `${VAR}` dans les valeurs de configuration.
- Objets SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) pour les champs qui prennent en charge les références de secrets.

Les deux sont résolus depuis l’environnement du processus au moment de l’activation. Les détails de SecretRef sont documentés dans [Gestion des secrets](/fr/gateway/secrets).
Le bloc `env` de configuration lui-même ne résout pas les SecretRefs ni les valeurs abrégées
`file:...`.

## Variables d’environnement liées aux chemins

| Variable                 | Objectif                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | Remplace le répertoire personnel utilisé pour les valeurs par défaut des chemins internes d’OpenClaw (`~/.openclaw/`, répertoires d’agents, sessions, identifiants, onboarding de l’installateur et checkout de développement par défaut). Utile lors de l’exécution d’OpenClaw avec un utilisateur de service dédié. |
| `OPENCLAW_STATE_DIR`     | Remplace le répertoire d’état (par défaut `~/.openclaw`).                                                                                                                                                                                       |
| `OPENCLAW_CONFIG_PATH`   | Remplace le chemin du fichier de configuration (par défaut `~/.openclaw/openclaw.json`).                                                                                                                                                         |
| `OPENCLAW_INCLUDE_ROOTS` | Liste de chemins de répertoires dans lesquels les directives `$include` peuvent résoudre des fichiers hors du répertoire de configuration (par défaut : aucun — `$include` est confiné au répertoire de configuration). Tilde développé.          |

## Journalisation

| Variable                         | Objectif                                                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Remplace le niveau de journalisation pour le fichier et la console (par exemple `debug`, `trace`). Prend le pas sur `logging.level` et `logging.consoleLevel` dans la configuration. Les valeurs invalides sont ignorées avec un avertissement. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Émet des diagnostics ciblés de temporisation des requêtes/réponses du modèle au niveau `info` sans activer les journaux de débogage globaux.                                                     |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostics de charge utile du modèle : `summary`, `tools` ou `full-redacted`. `full-redacted` est plafonné et expurgé, mais peut inclure le texte des prompts/messages.                         |
| `OPENCLAW_DEBUG_SSE`             | Diagnostics de streaming : `events` pour la temporisation de début/fin, `peek` pour inclure les cinq premiers événements SSE expurgés.                                                           |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostics de surface de modèle en mode code, y compris le masquage des outils fournisseur et l’application exec/wait-only.                                                                     |

### `OPENCLAW_HOME`

Lorsqu’il est défini, `OPENCLAW_HOME` remplace le répertoire personnel système (`$HOME` / `os.homedir()`) pour les valeurs par défaut des chemins internes d’OpenClaw. Cela inclut le répertoire d’état par défaut, le chemin de configuration, les répertoires d’agents, les identifiants, l’espace de travail d’onboarding de l’installateur et le checkout de développement par défaut utilisé par `openclaw update --channel dev`.

**Précédence :** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > repli du répertoire personnel Termux `PREFIX` sur Android > `os.homedir()`

**Exemple** (LaunchDaemon macOS) :

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` peut aussi être défini sur un chemin avec tilde (par exemple `~/svc`), qui est développé avec la même chaîne de repli du répertoire personnel de l’OS avant utilisation.

Les variables de chemin explicites comme `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` et `OPENCLAW_GIT_DIR` conservent la précédence. Les tâches liées au compte de l’OS, comme la détection des fichiers de démarrage du shell, la configuration du gestionnaire de paquets et le développement de `~` côté hôte, peuvent toujours utiliser le véritable répertoire personnel système.

## Utilisateurs de nvm : échecs TLS de web_fetch

Si Node.js a été installé via **nvm** (et non via le gestionnaire de paquets système), le `fetch()` intégré utilise
le magasin d’AC groupées de nvm, auquel il peut manquer des AC racines modernes (ISRG Root X1/X2 pour Let’s Encrypt,
DigiCert Global Root G2, etc.). Cela fait échouer `web_fetch` avec `"fetch failed"` sur la plupart des sites HTTPS.

Sur Linux, OpenClaw détecte automatiquement nvm et applique le correctif dans l’environnement de démarrage réel :

- `openclaw gateway install` écrit `NODE_EXTRA_CA_CERTS` dans l’environnement du service systemd
- le point d’entrée CLI `openclaw` se ré-exécute lui-même avec `NODE_EXTRA_CA_CERTS` défini avant le démarrage de Node

**Correction manuelle (pour les versions plus anciennes ou les lancements directs `node ...`) :**

Exportez la variable avant de démarrer OpenClaw :

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Ne vous fiez pas à l’écriture de cette variable uniquement dans `~/.openclaw/.env` ; Node lit
`NODE_EXTRA_CA_CERTS` au démarrage du processus.

## Variables d’environnement héritées

OpenClaw lit uniquement les variables d’environnement `OPENCLAW_*`. Les préfixes hérités
`CLAWDBOT_*` et `MOLTBOT_*` des versions précédentes sont silencieusement
ignorés.

Si certains sont encore définis sur le processus Gateway au démarrage, OpenClaw émet un
seul avertissement de dépréciation Node (`OPENCLAW_LEGACY_ENV_VARS`) listant les
préfixes détectés et le nombre total. Renommez chaque valeur en remplaçant le
préfixe hérité par `OPENCLAW_` (par exemple `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`) ; les anciens noms n’ont aucun effet.

## Connexe

- [Configuration du Gateway](/fr/gateway/configuration)
- [FAQ : variables d’environnement et chargement .env](/fr/help/faq#env-vars-and-env-loading)
- [Vue d’ensemble des modèles](/fr/concepts/models)
