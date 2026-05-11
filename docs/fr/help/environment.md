---
read_when:
    - Vous devez savoir quelles variables d’environnement sont chargées et dans quel ordre
    - Vous déboguez des clés API manquantes dans le Gateway
    - Vous documentez l’authentification des fournisseurs ou les environnements de déploiement
summary: Où OpenClaw charge les variables d’environnement et l’ordre de priorité
title: Variables d’environnement
x-i18n:
    generated_at: "2026-05-11T20:40:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw extrait les variables d’environnement depuis plusieurs sources. La règle est **ne jamais remplacer les valeurs existantes**.

## Priorité (plus élevée → plus faible)

1. **Environnement du processus** (ce que le processus Gateway possède déjà depuis le shell/daemon parent).
2. **`.env` dans le répertoire de travail courant** (valeur par défaut de dotenv ; ne remplace pas).
3. **`.env` global** à `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env` ; ne remplace pas).
4. **Bloc `env` de configuration** dans `~/.openclaw/openclaw.json` (appliqué uniquement si absent).
5. **Import facultatif depuis le shell de connexion** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), appliqué uniquement pour les clés attendues manquantes.

Sur les nouvelles installations Ubuntu qui utilisent le répertoire d’état par défaut, OpenClaw traite aussi `~/.config/openclaw/gateway.env` comme solution de compatibilité de secours après le `.env` global. Si les deux fichiers existent et divergent, OpenClaw conserve `~/.openclaw/.env` et affiche un avertissement.

Si le fichier de configuration est entièrement absent, l’étape 4 est ignorée ; l’import depuis le shell s’exécute quand même s’il est activé.

## Bloc `env` de configuration

Deux façons équivalentes de définir des variables d’environnement en ligne (toutes deux sans remplacement) :

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

## Import de l’environnement shell

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

## Variables d’environnement injectées à l’exécution

OpenClaw injecte également des marqueurs de contexte dans les processus enfants lancés :

- `OPENCLAW_SHELL=exec` : défini pour les commandes exécutées via l’outil `exec`.
- `OPENCLAW_SHELL=acp` : défini pour les lancements de processus du backend d’exécution ACP (par exemple `acpx`).
- `OPENCLAW_SHELL=acp-client` : défini pour `openclaw acp client` lorsqu’il lance le processus de pont ACP.
- `OPENCLAW_SHELL=tui-local` : défini pour les commandes shell `!` du TUI local.

Ce sont des marqueurs d’exécution (pas une configuration utilisateur requise). Ils peuvent être utilisés dans la logique de shell/profil
pour appliquer des règles propres au contexte.

## Variables d’environnement d’interface utilisateur

- `OPENCLAW_THEME=light` : force la palette claire du TUI lorsque votre terminal a un arrière-plan clair.
- `OPENCLAW_THEME=dark` : force la palette sombre du TUI.
- `COLORFGBG` : si votre terminal l’exporte, OpenClaw utilise l’indication de couleur d’arrière-plan pour choisir automatiquement la palette du TUI.

## Substitution de variables d’environnement dans la configuration

Vous pouvez référencer directement des variables d’environnement dans les valeurs de chaîne de configuration à l’aide de la syntaxe `${VAR_NAME}` :

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

Consultez [Configuration : substitution de variables d’environnement](/fr/gateway/configuration-reference#env-var-substitution) pour plus de détails.

## Références secrètes et chaînes `${ENV}`

OpenClaw prend en charge deux modèles pilotés par l’environnement :

- Substitution de chaînes `${VAR}` dans les valeurs de configuration.
- Objets SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) pour les champs qui prennent en charge les références de secrets.

Les deux sont résolus depuis l’environnement du processus au moment de l’activation. Les détails de SecretRef sont documentés dans [Gestion des secrets](/fr/gateway/secrets).

## Variables d’environnement liées aux chemins

| Variable                 | Objectif                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Remplace le répertoire personnel utilisé pour toute la résolution interne des chemins (`~/.openclaw/`, répertoires d’agents, sessions, identifiants). Utile lors de l’exécution d’OpenClaw en tant qu’utilisateur de service dédié. |
| `OPENCLAW_STATE_DIR`     | Remplace le répertoire d’état (par défaut `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH`   | Remplace le chemin du fichier de configuration (par défaut `~/.openclaw/openclaw.json`).                                                                                                             |
| `OPENCLAW_INCLUDE_ROOTS` | Liste de chemins de répertoires où les directives `$include` peuvent résoudre des fichiers en dehors du répertoire de configuration (par défaut : aucun — `$include` est confiné au répertoire de configuration). Expansion du tilde appliquée.  |

## Journalisation

| Variable                         | Objectif                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Remplace le niveau de journalisation pour le fichier et la console (par ex. `debug`, `trace`). Prend le pas sur `logging.level` et `logging.consoleLevel` dans la configuration. Les valeurs invalides sont ignorées avec un avertissement. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Émet des diagnostics ciblés de temporisation des requêtes/réponses de modèle au niveau `info` sans activer les journaux de débogage globaux.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostics de charge utile du modèle : `summary`, `tools` ou `full-redacted`. `full-redacted` est plafonné et expurgé, mais peut inclure du texte de prompt/message.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnostics de streaming : `events` pour la temporisation début/fin, `peek` pour inclure les cinq premiers événements SSE expurgés.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostics de surface de modèle en mode code, y compris le masquage des outils fournisseur et l’application de l’exécution/attente uniquement.                                                                                          |

### `OPENCLAW_HOME`

Lorsqu’il est défini, `OPENCLAW_HOME` remplace le répertoire personnel système (`$HOME` / `os.homedir()`) pour toute la résolution interne des chemins. Cela permet une isolation complète du système de fichiers pour les comptes de service sans interface.

**Priorité :** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemple** (macOS LaunchDaemon) :

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` peut également être défini sur un chemin avec tilde (par ex. `~/svc`), qui est développé à l’aide de `$HOME` avant utilisation.

## Utilisateurs de nvm : échecs TLS de web_fetch

Si Node.js a été installé via **nvm** (et non via le gestionnaire de paquets du système), le `fetch()` intégré utilise
le magasin d’autorités de certification fourni avec nvm, auquel il peut manquer des autorités racines modernes (ISRG Root X1/X2 pour Let's Encrypt,
DigiCert Global Root G2, etc.). Cela provoque l’échec de `web_fetch` avec `"fetch failed"` sur la plupart des sites HTTPS.

Sous Linux, OpenClaw détecte automatiquement nvm et applique le correctif dans l’environnement de démarrage réel :

- `openclaw gateway install` écrit `NODE_EXTRA_CA_CERTS` dans l’environnement du service systemd
- le point d’entrée CLI `openclaw` se relance lui-même avec `NODE_EXTRA_CA_CERTS` défini avant le démarrage de Node

**Correctif manuel (pour les anciennes versions ou les lancements directs `node ...`) :**

Exportez la variable avant de démarrer OpenClaw :

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Ne vous fiez pas uniquement à l’écriture de cette variable dans `~/.openclaw/.env` ; Node lit
`NODE_EXTRA_CA_CERTS` au démarrage du processus.

## Variables d’environnement héritées

OpenClaw lit uniquement les variables d’environnement `OPENCLAW_*`. Les préfixes hérités
`CLAWDBOT_*` et `MOLTBOT_*` des versions précédentes sont ignorés silencieusement.

Si l’un d’eux est encore défini sur le processus Gateway au démarrage, OpenClaw émet un
seul avertissement de dépréciation Node (`OPENCLAW_LEGACY_ENV_VARS`) listant les
préfixes détectés et le nombre total. Renommez chaque valeur en remplaçant le
préfixe hérité par `OPENCLAW_` (par exemple `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`) ; les anciens noms n’ont aucun effet.

## Connexe

- [Configuration du Gateway](/fr/gateway/configuration)
- [FAQ : variables d’environnement et chargement .env](/fr/help/faq#env-vars-and-env-loading)
- [Vue d’ensemble des modèles](/fr/concepts/models)
