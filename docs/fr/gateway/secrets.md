---
read_when:
    - Configuration des SecretRefs pour les identifiants des fournisseurs et les références `auth-profiles.json`
    - Recharger, auditer, configurer et appliquer les secrets d’exploitation en toute sécurité en production
    - Comprendre l’échec immédiat au démarrage, le filtrage des surfaces inactives et le comportement fondé sur le dernier état valide connu
sidebarTitle: Secrets management
summary: 'Gestion des secrets : contrat SecretRef, comportement des instantanés d’exécution et nettoyage unidirectionnel sécurisé'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-07-12T15:29:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw prend en charge les SecretRefs additifs afin que les identifiants pris en charge n’aient pas besoin d’être stockés en texte clair dans la configuration.

<Note>
Le texte clair reste pris en charge. Les SecretRefs sont facultatifs pour chaque identifiant.
</Note>

<Warning>
Les identifiants en texte clair restent lisibles par l’agent s’ils se trouvent dans des fichiers que celui-ci peut inspecter, notamment `openclaw.json`, `auth-profiles.json`, `.env` ou les fichiers générés `agents/*/agent/models.json`. Les SecretRefs ne réduisent ce périmètre d’exposition local qu’une fois tous les identifiants pris en charge migrés et lorsque `openclaw secrets audit --check` ne signale plus aucun résidu en texte clair.
</Warning>

## Modèle d’exécution

- Les secrets sont résolus dans un instantané d’exécution en mémoire, de manière anticipée lors de l’activation, et non à la demande dans les chemins de requête.
- Le démarrage échoue immédiatement lorsqu’un SecretRef effectivement actif ne peut pas être résolu.
- Le rechargement est un remplacement atomique : réussite complète, ou conservation du dernier instantané valide connu.
- Les violations de stratégie (par exemple, un profil d’authentification en mode OAuth combiné à une entrée SecretRef) font échouer l’activation avant le remplacement de l’instantané d’exécution.
- Les requêtes d’exécution lisent uniquement l’instantané actif en mémoire. Les identifiants SecretRef des fournisseurs de modèles transitent par le stockage d’authentification et les options de flux sous forme de sentinelles locales au processus jusqu’à leur sortie. Les chemins de remise sortante (remise de réponses/fils Discord, envois d’actions Telegram) lisent également cet instantané et ne résolvent pas à nouveau les références à chaque envoi.

Cela évite que les indisponibilités des fournisseurs de secrets affectent les chemins critiques de requête.

## Injection au moment de la sortie (sentinelles)

Pour les identifiants de fournisseurs de modèles reposant sur des SecretRefs, OpenClaw crée une sentinelle opaque locale au processus lors de la résolution de l’authentification du modèle. Le stockage d’authentification, les options de flux, la configuration du SDK, les journaux, les objets d’erreur et la plupart des mécanismes d’introspection à l’exécution voient donc une valeur telle que `oc-sent-v1-...`, et non l’identifiant du fournisseur. La récupération protégée du modèle et les sondes d’intégrité gérées des fournisseurs locaux remplacent les sentinelles connues dans les valeurs d’URL et d’en-tête juste avant que chaque requête ne quitte le processus.

Les valeurs inconnues ayant la forme d’une sentinelle provoquent un échec sécurisé avant toute activité réseau. OpenClaw refuse d’envoyer la requête plutôt que de transmettre une sentinelle non résolue à un fournisseur. Les valeurs de secrets résolues sont également enregistrées afin d’être masquées dans les journaux par correspondance exacte, comme mesure de défense en profondeur.

Les adaptateurs de fournisseurs utilisent le point d’injection le plus tardif pris en charge par leur SDK :

- Les SDK dotés d’une option de récupération personnalisée reçoivent la fonction de récupération protégée d’OpenClaw, afin que le SDK conserve la sentinelle.
- Les SDK dépourvus d’option de récupération personnalisée extraient la valeur de la sentinelle juste avant la construction du client. Les flux de fournisseurs appartenant à des Plugins et les infrastructures d’agents l’extraient lors du transfert final géré par le cœur, car ces transports ne partagent pas la fonction de récupération protégée d’OpenClaw.

Les sentinelles réduisent l’exposition du texte clair dans la chaîne d’appel du modèle, mais elles ne constituent pas une isolation de processus. La valeur réelle existe toujours dans la mémoire du même processus et apparaît à la limite de l’adaptateur final. Les identifiants d’environnement en texte clair qui ne sont pas configurés par l’intermédiaire de SecretRefs restent en texte clair et ne relèvent pas de ce mécanisme.

Définissez `OPENCLAW_SECRET_SENTINELS=off` (accepte également `0` ou `false`, sans distinction entre majuscules et minuscules) pour désactiver la création de sentinelles lors d’une réponse à incident ou d’un diagnostic de compatibilité. Ce mécanisme d’arrêt ne désactive pas l’enregistrement du masquage par correspondance exacte des valeurs.

## Limite d’accès de l’agent

Les SecretRefs empêchent la persistance des identifiants dans la configuration et les fichiers de modèles générés, mais ils ne constituent pas une limite d’isolation de processus. Un identifiant en texte clair laissé sur le disque dans un chemin lisible par l’agent reste accessible par les outils de fichiers ou de shell, contournant ainsi le masquage au niveau de l’API.

Pour les déploiements en production où les fichiers accessibles à l’agent sont concernés, considérez la migration comme terminée uniquement lorsque toutes les conditions suivantes sont remplies :

- Les identifiants pris en charge utilisent des SecretRefs plutôt que des valeurs en texte clair.
- Les anciens résidus en texte clair sont supprimés de `openclaw.json`, `auth-profiles.json`, `.env` et des fichiers `models.json` générés.
- `openclaw secrets audit --check` ne signale aucun problème après la migration.
- Tous les identifiants restants, non pris en charge ou soumis à rotation, sont protégés par une isolation du système d’exploitation, une isolation de conteneur ou un proxy externe d’identifiants.

C’est pourquoi le workflow d’audit/configuration/application constitue une barrière de migration de sécurité, et pas seulement un utilitaire pratique.

<Warning>
Les SecretRefs ne sécurisent pas les fichiers arbitraires qui restent lisibles. Les sauvegardes, les configurations copiées, les anciens catalogues de modèles générés et les catégories d’identifiants non prises en charge restent des secrets de production jusqu’à leur suppression, leur déplacement hors de la limite de confiance de l’agent ou leur isolation distincte.
</Warning>

## Filtrage des surfaces actives

Les SecretRefs sont validés uniquement sur les surfaces effectivement actives :

- **Surfaces activées** : les références non résolues bloquent le démarrage/rechargement.
- **Surfaces inactives** : les références non résolues ne bloquent pas le démarrage/rechargement ; elles émettent un diagnostic non bloquant `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Exemples de surfaces inactives">
- Entrées de canal/compte désactivées.
- Identifiants de canal de niveau supérieur dont aucun compte activé n’hérite.
- Surfaces d’outil/de fonctionnalité désactivées.
- Clés spécifiques à un fournisseur de recherche Web qui n’est pas sélectionné par `tools.web.search.provider`. En mode automatique (fournisseur non défini), les clés sont consultées selon leur ordre de priorité pour la détection automatique jusqu’à ce que l’une d’elles soit résolue ; après la sélection, les clés des fournisseurs non sélectionnés sont inactives.
- Le matériel d’authentification SSH de l’environnement isolé (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, ainsi que les remplacements par agent) est actif uniquement lorsque le backend effectif de l’environnement isolé est `ssh` et que le mode de l’environnement isolé n’est pas `off`, pour l’agent par défaut ou un agent activé.
- Les SecretRefs `gateway.remote.token` / `gateway.remote.password` sont actifs si l’une des conditions suivantes est remplie :
  - `gateway.mode=remote`
  - `gateway.remote.url` est configuré
  - `gateway.tailscale.mode` vaut `serve` ou `funnel`
  - En mode local sans ces surfaces distantes : `gateway.remote.token` est actif lorsque l’authentification par jeton peut prévaloir et qu’aucun jeton d’environnement/d’authentification n’est configuré ; `gateway.remote.password` est actif uniquement lorsque l’authentification par mot de passe peut prévaloir et qu’aucun mot de passe d’environnement/d’authentification n’est configuré.
- Le SecretRef `gateway.auth.token` est inactif pour la résolution de l’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée de jeton provenant de l’environnement prévaut pour cette exécution.

</Accordion>

## Diagnostics des surfaces d’authentification du Gateway

Lorsqu’un SecretRef est défini sur `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, le démarrage/rechargement du Gateway journalise l’état de la surface sous le code `SECRETS_GATEWAY_AUTH_SURFACE` :

- `active` : le SecretRef fait partie de la surface d’authentification effective et doit être résolu.
- `inactive` : une autre surface d’authentification prévaut, ou l’authentification distante est désactivée/inactive.

L’entrée de journal inclut la raison utilisée par la stratégie de surface active.

## Prévalidation des références lors de l’intégration initiale

Lors de l’intégration initiale interactive, le choix du stockage SecretRef exécute une validation préalable avant l’enregistrement :

- Références d’environnement : valide le nom de la variable d’environnement et confirme qu’une valeur non vide est visible pendant la configuration.
- Références de fournisseur (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Flux de démarrage rapide : lorsque `gateway.auth.token` est déjà un SecretRef, l’intégration initiale le résout avant l’amorçage de la sonde/du tableau de bord (pour les références `env`, `file` et `exec`) à l’aide de la même barrière d’échec immédiat.

Un échec de validation affiche l’erreur et vous permet de réessayer.

## Contrat SecretRef

Une seule forme d’objet partout :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Les chaînes abrégées sont également acceptées dans les champs SecretInput :

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit correspondre à `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit être un pointeur JSON absolu (`/...`), ou la valeur littérale `value` pour les fournisseurs `singleValue`
    - Échappement RFC 6901 dans les segments : `~` devient `~0`, `/` devient `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit correspondre à `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (prend en charge les sélecteurs tels que `secret#json_key`)
    - `id` ne doit pas contenir `.` ou `..` en tant que segments de chemin délimités par des barres obliques (par exemple, `a/../b` est rejeté)

  </Tab>
</Tabs>

## Configuration des fournisseurs

Définissez les fournisseurs sous `secrets.providers` :

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // ou "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<Accordion title="Fournisseur d’environnement">
- Liste d’autorisation facultative de noms exacts via `allowlist`.
- Les valeurs d’environnement absentes ou vides font échouer la résolution.

</Accordion>

<Accordion title="Fournisseur de fichiers">
- Lit le fichier local indiqué par `path`.
- `mode: "json"` (valeur par défaut) attend une charge utile sous forme d’objet JSON et résout `id` comme un pointeur JSON.
- `mode: "singleValue"` attend l’identifiant de référence `"value"` et renvoie le contenu brut du fichier (le saut de ligne final est supprimé).
- Le chemin doit satisfaire les vérifications de propriété/autorisations ; `timeoutMs` (valeur par défaut : 5000) et `maxBytes` (valeur par défaut : 1 MiB) limitent la lecture.
- Échec sécurisé sous Windows : si la vérification des ACL n’est pas disponible pour le chemin, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner la vérification.

</Accordion>

<Accordion title="Fournisseur d’exécution">
- Exécute directement le chemin absolu du binaire configuré, sans shell.
- Par défaut, `command` doit être un fichier ordinaire, et non un lien symbolique. Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande contenant des liens symboliques (par exemple les shims Homebrew), et associez-le à `trustedDirs` (par exemple `["/opt/homebrew"]`) afin que seuls les chemins du gestionnaire de paquets soient admissibles.
- Prend en charge `timeoutMs` (valeur par défaut : 5000), `noOutputTimeoutMs` (valeur par défaut égale à `timeoutMs`), `maxOutputBytes` (valeur par défaut : 1 MiB), la liste d’autorisation `env`/`passEnv` et `trustedDirs`.
- `jsonOnly` vaut `true` par défaut. Avec `jsonOnly: false` et un seul identifiant demandé, une sortie standard simple non-JSON est acceptée comme valeur de cet identifiant.
- Échec sécurisé sous Windows : si la vérification des ACL n’est pas disponible pour le chemin de la commande, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner la vérification.
- Les fournisseurs d’exécution gérés par un Plugin peuvent utiliser `pluginIntegration` au lieu d’une copie de `command`/`args`. OpenClaw résout les détails actuels de la commande à partir du manifeste du Plugin installé lors du démarrage/rechargement ; si le Plugin est désactivé, supprimé, non fiable ou ne déclare plus l’intégration, les SecretRefs actifs de ce fournisseur provoquent un échec sécurisé.

Charge utile de la requête (entrée standard) :

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Charge utile de la réponse (sortie standard) :

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erreurs facultatives par identifiant :

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` est un diagnostic facultatif lisible par machine. OpenClaw affiche les codes reconnus
`NOT_FOUND` et `AMBIGUOUS_DUPLICATE_KEY` avec le fournisseur et l’identifiant de référence. Les autres
codes et champs libres tels que `message` sont acceptés pour assurer la compatibilité avec le protocole v1,
mais ne sont pas affichés, car la sortie du résolveur peut contenir des éléments d’identification.

</Accordion>

## Clés d’API reposant sur des fichiers

Ne placez pas de chaînes `file:...` dans le bloc `env` de la configuration. Ce bloc est littéral et ne permet pas de remplacement ; `file:...` n’y est donc jamais résolu.

Utilisez plutôt un SecretRef de fichier dans un champ d’identifiants pris en charge :

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

Pour `mode: "singleValue"`, l’`id` du SecretRef est `"value"`. Pour `mode: "json"`, utilisez un pointeur JSON absolu tel que `"/providers/xai/apiKey"`.

Consultez [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) pour connaître les champs qui acceptent les SecretRefs.

## Exemples d’intégration exec

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // requis pour les binaires Homebrew liés symboliquement
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Utilisez un wrapper de résolution pour associer les identifiants SecretRef aux clés d’éléments de Bitwarden Secrets Manager. Le dépôt inclut `scripts/secrets/openclaw-bws-resolver.mjs` ; installez-le ou copiez-le vers un chemin absolu approuvé sur l’hôte qui exécute le Gateway.

    Prérequis :

    - La CLI Bitwarden Secrets Manager (`bws`) doit être installée sur l’hôte du Gateway.
    - `BWS_ACCESS_TOKEN` doit être disponible pour le service Gateway.
    - `PATH` doit être transmis au résolveur, ou `BWS_BIN` doit être défini sur le chemin absolu du binaire `bws`.
    - `BWS_SERVER_URL` doit être défini dans l’environnement lors de l’utilisation d’une instance Bitwarden auto-hébergée.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Le résolveur regroupe les identifiants demandés, exécute `bws secret list` et renvoie les valeurs des champs `key` de secrets correspondants. Utilisez des clés qui respectent le contrat des identifiants SecretRef exec, telles que `openclaw/providers/openai/apiKey` ; les clés de style variable d’environnement contenant des traits de soulignement sont rejetées avant l’exécution du résolveur. Si plusieurs secrets Bitwarden visibles partagent la clé demandée, le résolveur signale cet identifiant comme ambigu au lieu de choisir arbitrairement. Après avoir mis à jour la configuration, vérifiez le chemin du résolveur :

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="CLI HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // requis pour les binaires Homebrew liés symboliquement
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    Utilisez un petit wrapper de résolution pour associer directement les identifiants SecretRef aux entrées `pass`. Enregistrez-le comme exécutable à un chemin absolu qui satisfait les contrôles de chemin de votre fournisseur exec, par exemple `/usr/local/bin/openclaw-pass-resolver`. Le shebang `#!/usr/bin/env node` résout `node` à partir du `PATH` du processus de résolution ; incluez donc `PATH` dans `passEnv`. Si `pass` ne se trouve pas dans ce `PATH`, définissez `PASS_BIN` dans l’environnement parent et incluez-le également dans `passEnv` :

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Échec de l’analyse de la requête : ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass s’est terminé avec le code ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Configurez ensuite le fournisseur exec et faites pointer `apiKey` vers le chemin de l’entrée `pass` :

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Conservez le secret sur la première ligne de l’entrée `pass`, ou personnalisez le wrapper pour qu’il renvoie plutôt la sortie complète de `pass show`. Après avoir mis à jour la configuration, vérifiez à la fois l’audit statique et le chemin du résolveur exec :

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // requis pour les binaires Homebrew liés symboliquement
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Variables d’environnement des serveurs MCP

Les variables d’environnement des serveurs MCP configurées via `plugins.entries.acpx.config.mcpServers` acceptent SecretInput, ce qui évite de stocker les clés d’API et les jetons en clair dans la configuration :

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Les valeurs de chaîne en clair restent prises en charge. Les références de modèle d’environnement telles que `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus pendant l’activation du Gateway, avant le lancement du processus du serveur MCP. Comme pour les autres surfaces SecretRef, les références non résolues ne bloquent l’activation que lorsque le plugin `acpx` est effectivement actif.

## Données d’authentification SSH du bac à sable

Le backend de bac à sable `ssh` du cœur prend également en charge les SecretRefs pour les données d’authentification SSH :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Comportement à l’exécution :

- OpenClaw résout ces références pendant l’activation du bac à sable, et non de manière différée à chaque appel SSH.
- Les valeurs résolues sont écrites dans un répertoire temporaire avec des autorisations de fichier restrictives (`0o600`) et utilisées dans la configuration SSH générée.
- Si le backend de bac à sable effectif n’est pas `ssh` (ou si le mode de bac à sable est `off`), ces références restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants canoniques pris en charge et non pris en charge sont répertoriés dans [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).

<Note>
Les identifiants générés à l’exécution ou soumis à rotation, ainsi que les données d’actualisation OAuth, sont intentionnellement exclus de la résolution SecretRef en lecture seule.
</Note>

## Comportement requis et priorité

- Champ sans référence : inchangé.
- Champ avec une référence : requis sur les surfaces actives pendant l’activation.
- Si une valeur en clair et une référence sont toutes deux présentes, la référence prévaut sur les chemins de priorité pris en charge.
- La sentinelle de masquage `__OPENCLAW_REDACTED__` est réservée au masquage et à la restauration internes de la configuration ; elle est rejetée lorsqu’elle est soumise comme donnée de configuration littérale.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement à l’exécution)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants de `auth-profiles.json` prévalent sur les références de `openclaw.json`)

Compatibilité Google Chat : `serviceAccountRef` prévaut sur la valeur en clair `serviceAccount` ; la valeur en clair est ignorée dès que la référence associée est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute lors des opérations suivantes :

- Démarrage (vérification préalable, puis activation finale)
- Chemin d’application à chaud du rechargement de la configuration
- Chemin de vérification du redémarrage lors du rechargement de la configuration
- Rechargement manuel via `secrets.reload`
- Vérification préalable du RPC d’écriture de la configuration du Gateway (`config.set` / `config.apply` / `config.patch`), qui contrôle la résolubilité des SecretRefs des surfaces actives dans la charge utile de configuration soumise avant de conserver les modifications

Contrat d’activation :

- En cas de réussite, l’instantané est remplacé de manière atomique.
- Un échec au démarrage interrompt le démarrage du Gateway.
- Un échec du rechargement à l’exécution conserve le dernier instantané valide connu.
- Un échec de la vérification préalable du RPC d’écriture rejette la configuration soumise ; la configuration sur disque et l’instantané d’exécution actif restent tous deux inchangés.
- La fourniture explicite d’un jeton de canal propre à un appel à un assistant ou outil sortant ne déclenche pas l’activation de SecretRef ; les points d’activation restent le démarrage, le rechargement et l’appel explicite à `secrets.reload`.

## Signaux de dégradation et de récupération

Lorsque l’activation au moment du rechargement échoue après un état sain, OpenClaw passe à un état dégradé des secrets et émet des événements système ponctuels et des codes de journal :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- Dégradé : l’environnement d’exécution conserve le dernier instantané valide connu.
- Rétabli : émis une seule fois après l’activation réussie suivante.
- Les échecs répétés alors que l’état est déjà dégradé consignent des avertissements, mais n’émettent pas de nouveau l’événement.
- L’échec immédiat au démarrage n’émet jamais d’événement de dégradation, car l’environnement d’exécution n’est jamais devenu actif.

## Résolution des chemins de commande

Les chemins de commande peuvent activer la résolution des SecretRef prises en charge au moyen d’un RPC d’instantané du Gateway. Deux grands comportements s’appliquent :

<Tabs>
  <Tab title="Chemins de commande stricts">
    Par exemple, les chemins de mémoire distante de `openclaw memory` et `openclaw qr --remote` lorsqu’il nécessite des références distantes de secrets partagés. Ils lisent l’instantané actif et échouent immédiatement lorsqu’une SecretRef requise est indisponible.
  </Tab>
  <Tab title="Chemins de commande en lecture seule">
    Par exemple, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, ainsi que les flux de réparation en lecture seule du diagnostic et de la configuration. Ils privilégient également l’instantané actif, mais passent en mode dégradé au lieu d’abandonner lorsqu’une SecretRef ciblée est indisponible.

    Comportement en lecture seule :

    - Lorsque le Gateway est en cours d’exécution, ces commandes lisent d’abord l’instantané actif.
    - Si la résolution par le Gateway est incomplète ou si le Gateway est indisponible, elles tentent une solution de repli locale ciblée pour la surface de cette commande.
    - Si une SecretRef ciblée reste indisponible, la commande poursuit son exécution avec une sortie en lecture seule dégradée et un diagnostic explicite indiquant que la référence est configurée, mais indisponible dans ce chemin de commande.
    - Ce comportement dégradé est limité à la commande ; il n’assouplit pas les chemins de démarrage, de rechargement, d’envoi ou d’authentification de l’environnement d’exécution.

  </Tab>
</Tabs>

Autres remarques :

- L’actualisation de l’instantané après la rotation d’un secret du système dorsal est gérée par `openclaw secrets reload`.
- Méthode RPC du Gateway utilisée par ces chemins de commande : `secrets.resolve`.

## Flux d’audit et de configuration

Flux par défaut de l’opérateur :

<Steps>
  <Step title="Auditer l’état actuel">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurer et appliquer les SecretRef">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Effectuer un nouvel audit">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Ne considérez pas la migration comme terminée tant que le nouvel audit n’est pas exempt de problèmes. Si l’audit signale encore des valeurs en texte brut au repos, le risque d’accès par l’agent demeure, même lorsque les API de l’environnement d’exécution renvoient des valeurs masquées.

Si vous enregistrez un plan au lieu de l’appliquer pendant `configure`, appliquez ce plan enregistré avec `openclaw secrets apply --from <plan-path>` avant le nouvel audit.

<AccordionGroup>
  <Accordion title="audit des secrets">
    Les constatations comprennent :

    - Valeurs en texte brut au repos (`openclaw.json`, `auth-profiles.json`, `.env` et fichiers `agents/*/agent/models.json` générés).
    - Résidus en texte brut d’en-têtes sensibles de fournisseurs dans les entrées `models.json` générées.
    - Références non résolues.
    - Masquage dû à la priorité (`auth-profiles.json` prenant le pas sur les références de `openclaw.json`).
    - Résidus hérités (`auth.json`, rappels OAuth).

    Remarque sur l’exécution : par défaut, l’audit ignore les vérifications de résolubilité des SecretRef de type exec afin d’éviter les effets secondaires des commandes. Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs exec pendant l’audit.

    Remarque sur les résidus d’en-têtes : la détection des en-têtes sensibles de fournisseurs repose sur une heuristique fondée sur leur nom (noms courants d’en-têtes d’authentification ou d’identifiants et fragments tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

  </Accordion>
  <Accordion title="configuration des secrets">
    Assistant interactif qui :

    - Configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajout/modification/suppression).
    - Vous permet de sélectionner les champs pris en charge contenant des secrets dans `openclaw.json`, ainsi que dans `auth-profiles.json` pour le périmètre d’un agent.
    - Peut créer directement une nouvelle correspondance `auth-profiles.json` dans le sélecteur de cible.
    - Recueille les détails de la SecretRef (`source`, `provider`, `id`).
    - Exécute une résolution préalable et peut appliquer les modifications immédiatement.

    Remarque sur l’exécution : la vérification préalable ignore les contrôles des SecretRef de type exec, sauf si `--allow-exec` est défini. Si vous appliquez directement depuis `configure --apply` et que le plan comprend des références ou des fournisseurs exec, conservez également `--allow-exec` pour l’étape d’application.

    Modes utiles :

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valeurs par défaut de l’application de `configure` :

    - Supprimer de `auth-profiles.json` les identifiants statiques correspondants pour les fournisseurs ciblés.
    - Supprimer de `auth.json` les entrées statiques héritées `api_key`.
    - Supprimer de `<config-dir>/.env` les lignes de secrets connues correspondantes.

  </Accordion>
  <Accordion title="application des secrets">
    Appliquez un plan enregistré :

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Remarque sur l’exécution : la simulation ignore les contrôles exec, sauf si `--allow-exec` est défini ; le mode écriture rejette les plans contenant des SecretRef ou des fournisseurs exec, sauf si `--allow-exec` est défini.

    Pour plus de détails sur le contrat strict des cibles et chemins, ainsi que sur les règles exactes de rejet, consultez [Contrat de plan d’application des secrets](/fr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Politique de sécurité à sens unique

<Warning>
OpenClaw n’écrit intentionnellement aucune sauvegarde de restauration contenant d’anciennes valeurs de secrets en texte brut.
</Warning>

Modèle de sécurité :

- La vérification préalable doit réussir avant le mode écriture.
- L’activation de l’environnement d’exécution est validée avant la validation définitive.
- L’application met à jour les fichiers par remplacement atomique et tente de les restaurer en cas d’échec, dans la mesure du possible.

## Remarques sur la compatibilité avec l’authentification héritée

Pour les identifiants statiques, l’environnement d’exécution ne dépend plus d’un stockage d’authentification hérité en texte brut.

- La source des identifiants de l’environnement d’exécution est l’instantané résolu en mémoire.
- Les entrées statiques héritées `api_key` sont supprimées lorsqu’elles sont détectées.
- Le comportement de compatibilité lié à OAuth reste distinct.

## Remarque sur l’interface Web

Certaines unions SecretInput sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Pages connexes

- [Authentification](/fr/gateway/authentication) - configuration de l’authentification
- [CLI : secrets](/fr/cli/secrets) - commandes de la CLI
- [SecretRef de Vault](/fr/plugins/vault) - configuration du fournisseur HashiCorp Vault
- [Variables d’environnement](/fr/help/environment) - priorité des variables d’environnement
- [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface) - surface des identifiants
- [Contrat de plan d’application des secrets](/fr/gateway/secrets-plan-contract) - détails du contrat de plan
- [Sécurité](/fr/gateway/security) - posture de sécurité
