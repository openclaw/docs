---
read_when:
    - Vous devez savoir quelles variables d’environnement sont chargées et dans quel ordre
    - Vous dépannez des clés API manquantes dans le Gateway
    - Vous documentez les environnements d’authentification ou de déploiement des fournisseurs
summary: Emplacements depuis lesquels OpenClaw charge les variables d’environnement et ordre de priorité
title: Variables d’environnement
x-i18n:
    generated_at: "2026-07-12T15:29:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw charge les variables d’environnement depuis plusieurs sources. La règle est de **ne jamais remplacer les valeurs existantes**.
Les fichiers `.env` de l’espace de travail constituent une source moins fiable : OpenClaw ignore les identifiants des fournisseurs et les contrôles d’exécution protégés provenant du fichier `.env` de l’espace de travail avant d’appliquer l’ordre de priorité.

## Ordre de priorité (du plus élevé au plus faible)

1. **Environnement du processus** (ce que le processus Gateway reçoit déjà du shell ou du démon parent).
2. **Fichier `.env` dans le répertoire de travail actuel** (comportement par défaut de dotenv ; ne remplace aucune valeur ; les identifiants des fournisseurs et les contrôles d’exécution protégés sont ignorés).
3. **Fichier `.env` global** dans `~/.openclaw/.env` (également `$OPENCLAW_STATE_DIR/.env` ; recommandé pour les clés d’API des fournisseurs ; ne remplace aucune valeur).
4. **Bloc `env` de la configuration** dans `~/.openclaw/openclaw.json` (appliqué uniquement si la valeur est absente).
5. **Importation facultative depuis le shell de connexion** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), appliquée uniquement aux clés attendues absentes.

Sur les nouvelles installations Ubuntu qui utilisent le répertoire d’état par défaut, OpenClaw traite également `~/.config/openclaw/gateway.env` comme solution de repli de compatibilité après le fichier `.env` global. Si les deux fichiers existent et contiennent des valeurs différentes, OpenClaw conserve celles de `~/.openclaw/.env` et affiche un avertissement.

Si le fichier de configuration est entièrement absent, l’étape 4 est ignorée ; l’importation depuis le shell s’exécute tout de même si elle est activée.

## Identifiants des fournisseurs et fichier `.env` de l’espace de travail

Ne conservez pas les clés d’API des fournisseurs uniquement dans un fichier `.env` d’espace de travail. OpenClaw bloque un vaste ensemble de clés d’identification des fournisseurs et de redirection des points de terminaison provenant des fichiers `.env` d’espace de travail, notamment toutes les variables d’environnement d’authentification connues des fournisseurs (par exemple `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), ainsi que toute clé se terminant par `_API_HOST`, `_BASE_URL` ou `_HOMESERVER`, et l’intégralité des espaces de noms `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` et `OPENAI_API_KEY_*`.

Utilisez plutôt l’une des sources fiables suivantes pour les identifiants des fournisseurs :

- L’environnement du processus Gateway, tel qu’un shell, une unité launchd/systemd, un secret de conteneur ou un secret de CI.
- Le fichier dotenv d’exécution global dans `~/.openclaw/.env` ou `$OPENCLAW_STATE_DIR/.env`.
- Le bloc `env` de la configuration dans `~/.openclaw/openclaw.json`.
- L’importation facultative depuis le shell de connexion lorsque `env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1` est activé.

Si vous stockiez auparavant les clés des fournisseurs uniquement dans un fichier `.env` d’espace de travail, déplacez-les vers l’une des sources fiables ci-dessus. Le fichier `.env` de l’espace de travail peut toujours fournir des variables de projet ordinaires qui ne sont ni des identifiants, ni des redirections de points de terminaison, ni des remplacements d’hôtes, ni des contrôles d’exécution `OPENCLAW_*`.

Consultez [Fichiers `.env` de l’espace de travail](/fr/gateway/security#workspace-env-files) pour connaître les raisons de sécurité.

## Bloc `env` de la configuration

Deux méthodes équivalentes permettent de définir des variables d’environnement intégrées (aucune ne remplace les valeurs existantes) :

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

Le bloc `env` de la configuration accepte uniquement des valeurs de chaîne littérales. Il ne développe pas les valeurs
`file:...` ; par exemple, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
est transmis aux fournisseurs exactement sous cette forme.

Pour les clés de fournisseur stockées dans des fichiers, utilisez une SecretRef dans le champ d’identification qui
la prend en charge :

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
[surface d’identification SecretRef](/fr/reference/secretref-credential-surface) pour connaître
les champs pris en charge.

## Importation de l’environnement du shell

`env.shellEnv` exécute votre shell de connexion et importe uniquement les clés attendues **absentes** :

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

Variables d’environnement équivalentes :

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (valeur par défaut : `15000`)

## Instantanés du shell Exec

Sur les hôtes Gateway autres que Windows, les commandes `exec` de bash et zsh utilisent par défaut un instantané de démarrage.
Définissez `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dans l’environnement du processus Gateway pour désactiver ce chemin.
Les valeurs `false`, `no` et `off` le désactivent également. Les valeurs `exec.env` propres à chaque appel ne peuvent ni activer ou désactiver
les instantanés, ni rediriger leur cache.

## Variables d’environnement injectées à l’exécution

OpenClaw injecte également des marqueurs de contexte dans les processus enfants lancés :

- `OPENCLAW_SHELL=exec` : défini pour les commandes exécutées par l’intermédiaire de l’outil `exec`.
- `OPENCLAW_SHELL=acp-client` : défini pour `openclaw acp client` lorsqu’il lance le processus de pont ACP.
- `OPENCLAW_SHELL=tui-local` : défini pour les commandes shell `!` locales de la TUI.
- `OPENCLAW_CLI=1` : défini pour les processus enfants lancés par le point d’entrée de la CLI.

Il s’agit de marqueurs d’exécution (et non d’une configuration utilisateur requise). Ils peuvent être utilisés dans la logique du shell ou du profil
pour appliquer des règles propres au contexte.

## Variables d’environnement de l’interface utilisateur

- `OPENCLAW_THEME=light` : force la palette claire de la TUI lorsque votre terminal possède un arrière-plan clair.
- `OPENCLAW_THEME=dark` : force la palette sombre de la TUI.
- `COLORFGBG` : si votre terminal l’exporte, OpenClaw utilise l’indication de couleur d’arrière-plan pour choisir automatiquement la palette de la TUI.

## Substitution des variables d’environnement dans la configuration

Vous pouvez référencer directement des variables d’environnement dans les valeurs de chaîne de la configuration avec la syntaxe `${VAR_NAME}` :

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

Consultez [Configuration : substitution des variables d’environnement](/fr/gateway/configuration-reference#env-var-substitution) pour obtenir tous les détails.

## Références de secrets et chaînes `${ENV}`

OpenClaw prend en charge deux modèles reposant sur l’environnement :

- La substitution de chaînes `${VAR}` dans les valeurs de configuration.
- Les objets SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) pour les champs qui prennent en charge les références de secrets.

Les deux sont résolus à partir de l’environnement du processus au moment de l’activation. Les détails de SecretRef sont documentés dans [Gestion des secrets](/fr/gateway/secrets).
Le bloc `env` de la configuration ne résout lui-même ni les SecretRefs ni les
valeurs abrégées `file:...`.

## Variables d’environnement relatives aux chemins

| Variable                 | Rôle                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Remplace le répertoire personnel utilisé pour les chemins internes par défaut d’OpenClaw (`~/.openclaw/`, répertoires des agents, sessions, identifiants, espace de travail d’intégration de l’installateur et extraction de développement par défaut). Utile lors de l’exécution d’OpenClaw avec un compte de service dédié. |
| `OPENCLAW_STATE_DIR`     | Remplace le répertoire d’état (par défaut `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Remplace le chemin du fichier de configuration (par défaut `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Liste de chemins de répertoires dans lesquels les directives `$include` peuvent résoudre des fichiers en dehors du répertoire de configuration (par défaut : aucun — `$include` est limité au répertoire de configuration). Le tilde est développé.                                                         |

## Journalisation

| Variable                         | Rôle                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Remplace le niveau de journalisation pour le fichier et la console (par exemple `debug`, `trace`). Prend le pas sur `logging.level` et `logging.consoleLevel` dans la configuration. Les valeurs non valides sont ignorées avec un avertissement. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Émet des diagnostics ciblés sur la durée des requêtes et réponses du modèle au niveau `info` sans activer les journaux de débogage globaux.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostics de la charge utile du modèle : `summary`, `tools` ou `full-redacted`. `full-redacted` est limité et expurgé, mais peut inclure le texte des invites ou des messages.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnostics de diffusion en continu : `events` pour la durée du premier événement et de la fin, `peek` pour inclure les cinq premiers événements SSE expurgés.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostics de la surface du modèle en mode code, notamment le masquage des outils du fournisseur et l’application directe ou compacte des contrôles.                                                                                  |

### `OPENCLAW_HOME`

Lorsqu’elle est définie, `OPENCLAW_HOME` remplace le répertoire personnel du système (`$HOME` / `os.homedir()`) pour les chemins internes par défaut d’OpenClaw. Cela comprend le répertoire d’état par défaut, le chemin de configuration, les répertoires des agents, les identifiants, l’espace de travail d’intégration de l’installateur et l’extraction de développement par défaut utilisée par `openclaw update --channel dev`.

**Ordre de priorité :** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > répertoire personnel de repli de `PREFIX` pour Termux sous Android > `os.homedir()`

**Exemple** (LaunchDaemon macOS) :

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` peut également être défini sur un chemin contenant un tilde (par exemple `~/svc`), qui est développé avant utilisation à l’aide de la même chaîne de repli du répertoire personnel du système d’exploitation.

Les variables de chemin explicites telles que `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` et `OPENCLAW_GIT_DIR` restent prioritaires. Les tâches liées au compte du système d’exploitation, telles que la détection du fichier de démarrage du shell, la configuration du gestionnaire de paquets et le développement de `~` sur l’hôte, peuvent toujours utiliser le véritable répertoire personnel du système.

## Utilisateurs de nvm : échecs TLS de web_fetch

Si Node.js a été installé avec **nvm** (et non avec le gestionnaire de paquets du système), la fonction `fetch()` intégrée utilise
le magasin d’autorités de certification fourni avec nvm, auquel certaines autorités de certification racines modernes peuvent manquer (ISRG Root X1/X2 pour Let's Encrypt,
DigiCert Global Root G2, etc.). Cela entraîne l’échec de `web_fetch` avec `"fetch failed"` sur la plupart des sites HTTPS.

Sous Linux, OpenClaw détecte automatiquement nvm et applique le correctif dans l’environnement de démarrage réel :

- `openclaw gateway install` écrit `NODE_EXTRA_CA_CERTS` dans l’environnement du service systemd
- le point d’entrée de la CLI `openclaw` se réexécute lui-même avec `NODE_EXTRA_CA_CERTS` défini avant le démarrage de Node

**Correctif manuel (pour les anciennes versions ou les lancements directs avec `node ...`) :**

Exportez la variable avant de démarrer OpenClaw :

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Ne vous contentez pas d’écrire cette variable uniquement dans `~/.openclaw/.env` ; Node lit
`NODE_EXTRA_CA_CERTS` au démarrage du processus.

## Variables d’environnement obsolètes

OpenClaw lit uniquement les variables d’environnement `OPENCLAW_*`. Les préfixes obsolètes
`CLAWDBOT_*` et `MOLTBOT_*` des versions antérieures sont silencieusement
ignorés.

Si l’un d’eux est encore défini dans le processus Gateway au démarrage, OpenClaw émet un
seul avertissement d’obsolescence Node (`OPENCLAW_LEGACY_ENV_VARS`) indiquant les
préfixes détectés et leur nombre total. Renommez chaque valeur en remplaçant le
préfixe obsolète par `OPENCLAW_` (par exemple `CLAWDBOT_GATEWAY_TOKEN` par
`OPENCLAW_GATEWAY_TOKEN`) ; les anciens noms n’ont aucun effet.

## Voir aussi

- [Configuration du Gateway](/fr/gateway/configuration)
- [FAQ : variables d’environnement et chargement des fichiers .env](/fr/help/faq#env-vars-and-env-loading)
- [Présentation des modèles](/fr/concepts/models)
