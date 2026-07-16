---
read_when:
    - Configuration des SecretRefs pour les identifiants des fournisseurs et les références `auth-profiles.json`
    - Recharger, auditer, configurer et appliquer les secrets d’exploitation en toute sécurité en production
    - Comprendre l’échec immédiat au démarrage, le filtrage des surfaces inactives et le comportement fondé sur le dernier état valide connu
sidebarTitle: Secrets management
summary: 'Gestion des secrets : contrat SecretRef, comportement des instantanés d’exécution et nettoyage unidirectionnel sécurisé'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-07-16T13:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw prend en charge les SecretRefs additifs afin que les identifiants pris en charge n’aient pas besoin d’être stockés en texte brut dans la configuration.

<Note>
Le texte brut reste pris en charge. Les SecretRefs sont facultatifs pour chaque identifiant.
</Note>

<Warning>
Les identifiants en texte brut restent lisibles par l’agent s’ils se trouvent dans des fichiers que celui-ci peut inspecter, notamment `openclaw.json`, `auth-profiles.json`, `.env` ou les fichiers `agents/*/agent/models.json` générés. Les SecretRefs ne réduisent ce périmètre d’exposition local qu’une fois tous les identifiants pris en charge migrés et lorsque `openclaw secrets audit --check` ne signale plus aucun résidu en texte brut.
</Warning>

## Modèle d’exécution

- Les secrets sont résolus dans un instantané d’exécution en mémoire, de manière anticipée lors de l’activation, et non à la demande dans les chemins de requête.
- Le démarrage échoue immédiatement lorsqu’un SecretRef effectivement actif ne peut pas être résolu.
- Le rechargement est un remplacement atomique : soit il réussit entièrement, soit le dernier instantané valide connu est conservé.
- Les violations de stratégie (par exemple, un profil d’authentification en mode OAuth combiné à une entrée SecretRef) font échouer l’activation avant le remplacement de l’instantané d’exécution.
- Les requêtes d’exécution lisent uniquement l’instantané actif en mémoire. Les identifiants SecretRef des fournisseurs de modèles transitent par le stockage d’authentification et les options de flux sous forme de sentinelles locales au processus jusqu’à leur sortie. Les chemins de livraison sortante (livraison des réponses et fils de discussion Discord, envois d’actions Telegram) lisent également cet instantané et ne résolvent pas de nouveau les références à chaque envoi.

Cela évite que les indisponibilités des fournisseurs de secrets affectent les chemins critiques des requêtes.

## Injection à la sortie (sentinelles)

Pour les identifiants de fournisseurs de modèles reposant sur des SecretRefs, OpenClaw crée une sentinelle opaque et locale au processus lors de la résolution de l’authentification du modèle. Le stockage d’authentification, les options de flux, la configuration du SDK, les journaux, les objets d’erreur et la plupart des mécanismes d’introspection d’exécution voient donc une valeur telle que `oc-sent-v1-...`, et non l’identifiant du fournisseur. La récupération protégée du modèle et les sondes d’intégrité gérées des fournisseurs locaux remplacent les sentinelles connues dans les valeurs d’URL et d’en-tête juste avant que chaque requête quitte le processus.

Les valeurs inconnues ayant la forme d’une sentinelle provoquent un échec sécurisé avant toute activité réseau. OpenClaw refuse d’envoyer la requête plutôt que de transmettre une sentinelle non résolue à un fournisseur. Les valeurs de secrets résolues sont également enregistrées afin d’être masquées dans les journaux lorsqu’elles correspondent exactement, comme mesure de défense en profondeur.

Les adaptateurs de fournisseurs utilisent le point d’injection le plus tardif pris en charge par leur SDK :

- Les SDK disposant d’une option de récupération personnalisée reçoivent la fonction de récupération protégée d’OpenClaw, de sorte que le SDK conserve la sentinelle.
- Les SDK dépourvus d’option de récupération personnalisée extraient la valeur de la sentinelle juste avant la construction du client. Les flux de fournisseurs détenus par des Plugins et les environnements d’exécution d’agents l’extraient lors du dernier transfert détenu par le cœur, car ces transports ne partagent pas la fonction de récupération protégée d’OpenClaw.

Les sentinelles réduisent l’exposition en texte brut tout au long de la chaîne d’appel du modèle, mais elles ne constituent pas une isolation de processus. La valeur réelle existe toujours dans la mémoire du même processus et apparaît à la limite de l’adaptateur final. Les identifiants d’environnement en texte brut qui ne sont pas configurés au moyen de SecretRefs restent en texte brut et ne relèvent pas de ce mécanisme.

Définissez `OPENCLAW_SECRET_SENTINELS=off` (accepte également `0` ou `false`, sans distinction entre majuscules et minuscules) pour désactiver la création de sentinelles lors de la réponse à un incident ou du dépannage de problèmes de compatibilité. Ce mécanisme d’arrêt d’urgence ne désactive pas l’enregistrement du masquage des valeurs exactes.

## Limite d’accès de l’agent

Les SecretRefs empêchent la persistance des identifiants dans la configuration et les fichiers de modèles générés, mais ne constituent pas une limite d’isolation de processus. Un identifiant en texte brut laissé sur le disque dans un chemin accessible en lecture par l’agent reste lisible au moyen des outils de fichiers ou d’interpréteur de commandes, contournant ainsi le masquage au niveau de l’API.

Pour les déploiements en production où les fichiers accessibles à l’agent sont concernés, considérez la migration comme terminée uniquement lorsque toutes les conditions suivantes sont remplies :

- Les identifiants pris en charge utilisent des SecretRefs plutôt que des valeurs en texte brut.
- Les anciens résidus en texte brut sont supprimés de `openclaw.json`, `auth-profiles.json`, `.env` et des fichiers `models.json` générés.
- `openclaw secrets audit --check` ne signale plus aucun problème après la migration.
- Tous les identifiants restants non pris en charge ou soumis à rotation sont protégés par une isolation du système d’exploitation, une isolation de conteneur ou un proxy d’identifiants externe.

C’est pourquoi le flux d’audit, de configuration et d’application constitue une étape de sécurité obligatoire de la migration, et pas seulement un outil pratique.

<Warning>
Les SecretRefs ne sécurisent pas les fichiers arbitraires accessibles en lecture. Les sauvegardes, les configurations copiées, les anciens catalogues de modèles générés et les catégories d’identifiants non prises en charge restent des secrets de production jusqu’à leur suppression, leur déplacement hors de la limite de confiance de l’agent ou leur isolation distincte.
</Warning>

## Filtrage des surfaces actives

Les SecretRefs sont validés uniquement sur les surfaces effectivement actives :

- **Surfaces activées** : les références non résolues bloquent le démarrage ou le rechargement.
- **Surfaces inactives** : les références non résolues ne bloquent pas le démarrage ou le rechargement ; elles produisent un diagnostic `SECRETS_REF_IGNORED_INACTIVE_SURFACE` non fatal.

<Accordion title="Exemples de surfaces inactives">
- Entrées de canaux ou de comptes désactivées.
- Identifiants de canal de premier niveau dont aucun compte activé n’hérite.
- Surfaces d’outils ou de fonctionnalités désactivées.
- Clés propres aux fournisseurs de recherche Web non sélectionnés par `tools.web.search.provider`. En mode automatique (fournisseur non défini), les clés sont consultées selon leur ordre de priorité pour la détection automatique jusqu’à ce que l’une d’elles soit résolue ; après la sélection, les clés des fournisseurs non sélectionnés sont inactives.
- Le matériel d’authentification SSH du bac à sable (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, ainsi que les remplacements propres à chaque agent) n’est actif que lorsque le backend effectif du bac à sable est `ssh` et que son mode n’est pas `off`, pour l’agent par défaut ou un agent activé.
- Les SecretRefs `gateway.remote.token` / `gateway.remote.password` sont actifs si l’une des conditions suivantes est remplie :
  - `gateway.mode=remote`
  - `gateway.remote.url` est configuré
  - `gateway.tailscale.mode` vaut `serve` ou `funnel`
  - En mode local sans ces surfaces distantes : `gateway.remote.token` est actif lorsque l’authentification par jeton peut prévaloir et qu’aucun jeton d’environnement ou d’authentification n’est configuré ; `gateway.remote.password` est actif uniquement lorsque l’authentification par mot de passe peut prévaloir et qu’aucun mot de passe d’environnement ou d’authentification n’est configuré.
- Le SecretRef `gateway.auth.token` est inactif pour la résolution de l’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée du jeton d’environnement prévaut pour cette exécution.

</Accordion>

## Diagnostics de la surface d’authentification du Gateway

Lorsqu’un SecretRef est défini sur `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, le démarrage ou le rechargement du Gateway consigne l’état de la surface sous le code `SECRETS_GATEWAY_AUTH_SURFACE` :

- `active` : le SecretRef fait partie de la surface d’authentification effective et doit être résolu.
- `inactive` : une autre surface d’authentification prévaut, ou l’authentification distante est désactivée ou inactive.

L’entrée de journal comprend la raison appliquée par la stratégie de surface active.

## Vérification préalable des références lors de l’intégration

Lors de l’intégration interactive, la sélection du stockage SecretRef exécute une validation préalable avant l’enregistrement :

- Références d’environnement : valide le nom de la variable d’environnement et confirme qu’une valeur non vide est visible pendant la configuration.
- Références de fournisseur (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Flux de démarrage rapide : lorsque `gateway.auth.token` est déjà un SecretRef, l’intégration le résout avant la sonde ou l’initialisation du tableau de bord (pour les références `env`, `file` et `exec`) en utilisant le même mécanisme d’échec immédiat.

En cas d’échec de la validation, l’erreur s’affiche et vous pouvez réessayer.

## Contrat SecretRef

Une forme d’objet unique partout :

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
    - `id` ne doit pas contenir `.` ni `..` comme segments de chemin délimités par des barres obliques (par exemple, `a/../b` est rejeté)

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
- Lit le fichier local situé à `path`.
- `mode: "json"` (valeur par défaut) attend une charge utile sous forme d’objet JSON et résout `id` comme pointeur JSON.
- `mode: "singleValue"` attend l’identifiant de référence `"value"` et renvoie le contenu brut du fichier (sans le saut de ligne final).
- Le chemin doit satisfaire aux vérifications de propriété et d’autorisations ; `timeoutMs` (valeur par défaut : 5000) et `maxBytes` (valeur par défaut : 1 MiB) limitent la lecture.
- Échec sécurisé sous Windows : si la vérification des ACL n’est pas disponible pour le chemin, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner la vérification.

</Accordion>

<Accordion title="Fournisseur exec">
- Exécute directement le chemin absolu du binaire configuré, sans shell.
- Par défaut, `command` doit être un fichier ordinaire, et non un lien symbolique. Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande utilisant des liens symboliques (par exemple, les shims Homebrew) et associez-le à `trustedDirs` (par exemple `["/opt/homebrew"]`) afin que seuls les chemins du gestionnaire de paquets soient admissibles.
- Prend en charge `timeoutMs` (valeur par défaut : 5000), `noOutputTimeoutMs` (valeur par défaut égale à `timeoutMs`), `maxOutputBytes` (valeur par défaut : 1 MiB), la liste d’autorisation `env`/`passEnv`, ainsi que `trustedDirs`.
- `jsonOnly` utilise `true` par défaut. Avec `jsonOnly: false` et un seul identifiant demandé, une sortie stdout en texte brut non JSON est acceptée comme valeur de cet identifiant.
- Échec sécurisé sous Windows : si la vérification des ACL n’est pas disponible pour le chemin de la commande, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin d’ignorer la vérification.
- Les fournisseurs exec gérés par des plugins peuvent utiliser `pluginIntegration` au lieu d’une copie de `command`/`args`. OpenClaw résout les détails actuels de la commande à partir du manifeste du plugin installé au démarrage ou au rechargement ; si le plugin est désactivé, supprimé, non approuvé ou ne déclare plus l’intégration, les SecretRefs actives de ce fournisseur échouent de manière sécurisée.

Charge utile de la requête (stdin) :

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Charge utile de la réponse (stdout) :

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erreurs facultatives par identifiant :

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` est un diagnostic facultatif lisible par machine. OpenClaw affiche les codes reconnus
`NOT_FOUND` et `AMBIGUOUS_DUPLICATE_KEY` avec le fournisseur et l’identifiant de référence. Les autres
codes et champs de forme libre tels que `message` sont acceptés pour assurer la compatibilité avec le protocole v1,
mais ne sont pas affichés, car la sortie du résolveur peut contenir des éléments d’identification.

</Accordion>

## Clés API stockées dans des fichiers

Ne placez pas de chaînes `file:...` dans le bloc `env` de la configuration. Ce bloc est littéral et ne permet aucune substitution ; `file:...` n’y est donc jamais résolu.

Utilisez plutôt une SecretRef de fichier sur un champ d’identification pris en charge :

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

Pour `mode: "singleValue"`, la SecretRef `id` est `"value"`. Pour `mode: "json"`, utilisez un pointeur JSON absolu tel que `"/providers/xai/apiKey"`.

Consultez [Surface d’identification SecretRef](/fr/reference/secretref-credential-surface) pour connaître les champs qui acceptent des SecretRefs.

## Exemples d’intégration exec

Pour consulter un guide consacré à 1Password couvrant les comptes de service, la compétence d’agent incluse et le dépannage, consultez [1Password](/gateway/1password).

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
    Utilisez un wrapper de résolveur pour associer les identifiants SecretRef aux clés d’éléments Bitwarden Secrets Manager. Le dépôt comprend `scripts/secrets/openclaw-bws-resolver.mjs` ; installez-le ou copiez-le vers un chemin absolu de confiance sur l’hôte qui exécute le Gateway.

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

    Le résolveur regroupe les identifiants demandés, exécute `bws secret list` et renvoie les valeurs des champs `key` des secrets correspondants. Utilisez des clés conformes au contrat d’identifiant SecretRef exec, telles que `openclaw/providers/openai/apiKey` ; les clés au format de variables d’environnement contenant des traits de soulignement sont rejetées avant l’exécution du résolveur. Si plusieurs secrets Bitwarden visibles partagent la clé demandée, le résolveur signale cet identifiant comme ambigu au lieu de choisir arbitrairement. Après avoir mis à jour la configuration, vérifiez le chemin du résolveur :

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
    Utilisez un petit wrapper de résolveur pour associer directement les identifiants SecretRef aux entrées `pass`. Enregistrez-le en tant qu’exécutable dans un chemin absolu conforme aux vérifications de chemin de votre fournisseur exec, par exemple `/usr/local/bin/openclaw-pass-resolver`. Le shebang `#!/usr/bin/env node` résout `node` depuis le `PATH` du processus du résolveur ; incluez donc `PATH` dans `passEnv`. Si `pass` ne se trouve pas dans ce `PATH`, définissez `PASS_BIN` dans l’environnement parent et incluez-le également dans `passEnv` :

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
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
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

    Conservez le secret sur la première ligne de l’entrée `pass`, ou personnalisez le wrapper afin qu’il renvoie plutôt la sortie `pass show` complète. Après avoir mis à jour la configuration, vérifiez à la fois l’audit statique et le chemin du résolveur exec :

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

Les variables d’environnement des serveurs MCP configurées via `plugins.entries.acpx.config.mcpServers` acceptent SecretInput, ce qui permet de conserver les clés API et les jetons hors de la configuration en texte clair :

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

Les valeurs de chaîne en texte clair restent prises en charge. Les références de modèle d’environnement telles que `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus lors de l’activation du Gateway, avant le lancement du processus du serveur MCP. Comme pour les autres surfaces SecretRef, les références non résolues ne bloquent l’activation que lorsque le plugin `acpx` est effectivement actif.

## Éléments d’authentification SSH du bac à sable

Le moteur de bac à sable principal `ssh` prend également en charge les SecretRefs pour les éléments d’authentification SSH :

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

- OpenClaw résout ces références lors de l’activation du bac à sable, et non de manière différée à chaque appel SSH.
- Les valeurs résolues sont écrites dans un répertoire temporaire avec des permissions de fichiers restrictives (`0o600`) et utilisées dans la configuration SSH générée.
- Si le backend effectif du bac à sable n’est pas `ssh` (ou si le mode du bac à sable est `off`), ces références restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants canoniques pris en charge ou non sont répertoriés dans [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).

<Note>
Les identifiants générés à l’exécution ou renouvelés, ainsi que le matériel d’actualisation OAuth, sont intentionnellement exclus de la résolution SecretRef en lecture seule.
</Note>

## Comportement requis et priorité

- Champ sans référence : inchangé.
- Champ avec une référence : requis sur les surfaces actives pendant l’activation.
- Si une valeur en texte brut et une référence sont toutes deux présentes, la référence est prioritaire sur les chemins de priorité pris en charge.
- La sentinelle de masquage `__OPENCLAW_REDACTED__` est réservée au masquage et à la restauration internes de la configuration ; elle est rejetée en tant que donnée de configuration littérale soumise.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement à l’exécution)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants `auth-profiles.json` sont prioritaires sur les références `openclaw.json`)

Compatibilité avec Google Chat : `serviceAccountRef` est prioritaire sur la valeur en texte brut `serviceAccount` ; la valeur en texte brut est ignorée dès que la référence associée est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute lors des événements suivants :

- Démarrage (vérification préalable, puis activation finale)
- Chemin d’application à chaud du rechargement de la configuration
- Chemin de vérification du redémarrage lors du rechargement de la configuration
- Rechargement manuel via `secrets.reload`
- Vérification préalable du RPC d’écriture de la configuration du Gateway (`config.set` / `config.apply` / `config.patch`), qui vérifie la résolvabilité des SecretRef sur les surfaces actives dans la charge utile de configuration soumise avant de conserver les modifications

Contrat d’activation :

- En cas de réussite, l’instantané est remplacé de manière atomique.
- Un échec au démarrage interrompt le démarrage du Gateway.
- Un échec du rechargement à l’exécution conserve le dernier instantané valide connu.
- Un échec de la vérification préalable du RPC d’écriture rejette la configuration soumise ; la configuration sur disque et l’instantané actif à l’exécution restent tous deux inchangés.
- Fournir un jeton de canal explicite propre à l’appel à un assistant ou à un outil sortant ne déclenche pas l’activation de SecretRef ; les points d’activation restent le démarrage, le rechargement et l’appel explicite à `secrets.reload`.

## Signaux de dégradation et de récupération

Lorsque l’activation lors du rechargement échoue après un état sain, OpenClaw passe à un état dégradé des secrets et émet une seule fois des événements système et des codes de journalisation :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- État dégradé : l’exécution conserve le dernier instantané valide connu.
- Récupération : signal émis une seule fois après l’activation réussie suivante.
- Les échecs répétés alors que l’état est déjà dégradé consignent des avertissements, mais ne réémettent pas l’événement.
- L’échec immédiat au démarrage n’émet jamais d’événement de dégradation, car l’exécution n’est jamais devenue active.

## Résolution des chemins de commande

Les chemins de commande peuvent activer la résolution SecretRef prise en charge par l’intermédiaire d’un RPC d’instantané du Gateway. Deux comportements généraux s’appliquent :

<Tabs>
  <Tab title="Chemins de commande stricts">
    Par exemple, les chemins de mémoire distante `openclaw memory` et `openclaw qr --remote` lorsqu’il nécessite des références de secrets partagés distants. Ils lisent l’instantané actif et échouent immédiatement lorsqu’une SecretRef requise est indisponible.
  </Tab>
  <Tab title="Chemins de commande en lecture seule">
    Par exemple `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, ainsi que les flux de réparation du diagnostic et de la configuration en lecture seule. Ils privilégient également l’instantané actif, mais passent en mode dégradé au lieu d’interrompre l’opération lorsqu’une SecretRef ciblée est indisponible.

    Comportement en lecture seule :

    - Lorsque le Gateway est en cours d’exécution, ces commandes lisent d’abord l’instantané actif.
    - Si la résolution par le Gateway est incomplète ou si le Gateway est indisponible, elles tentent une solution de repli locale ciblée pour cette surface de commande.
    - Si une SecretRef ciblée reste indisponible, la commande poursuit son exécution avec une sortie en lecture seule dégradée et un diagnostic explicite indiquant que la référence est configurée, mais indisponible dans ce chemin de commande.
    - Ce comportement dégradé est limité à la commande ; il n’affaiblit pas les chemins de démarrage, de rechargement, d’envoi ou d’authentification à l’exécution.

  </Tab>
</Tabs>

Autres remarques :

- L’actualisation de l’instantané après la rotation d’un secret du backend est gérée par `openclaw secrets reload`.
- Méthode RPC du Gateway utilisée par ces chemins de commande : `secrets.resolve`.

## Flux d’audit et de configuration

Flux par défaut pour l’opérateur :

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

Ne considérez pas la migration comme terminée tant que le nouvel audit n’est pas exempt de problèmes. Si l’audit signale encore des valeurs en texte brut au repos, le risque d’accès par l’agent subsiste, même lorsque les API d’exécution renvoient des valeurs masquées.

Si vous enregistrez un plan au lieu de l’appliquer pendant `configure`, appliquez ce plan enregistré avec `openclaw secrets apply --from <plan-path>` avant le nouvel audit.

<AccordionGroup>
  <Accordion title="audit des secrets">
    Les constats comprennent :

    - Valeurs en texte brut au repos (`openclaw.json`, `auth-profiles.json`, `.env` et `agents/*/agent/models.json` générés).
    - Résidus en texte brut d’en-têtes sensibles de fournisseurs dans les entrées `models.json` générées.
    - Références non résolues.
    - Masquage par priorité (`auth-profiles.json` prioritaire sur les références `openclaw.json`).
    - Résidus hérités (`auth.json`, rappels OAuth).

    Remarque sur l’exécution : par défaut, l’audit ignore les vérifications de résolvabilité des SecretRef d’exécution afin d’éviter les effets secondaires des commandes. Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs d’exécution pendant l’audit.

    Remarque sur les résidus d’en-têtes : la détection des en-têtes sensibles des fournisseurs repose sur une heuristique fondée sur leur nom (noms courants d’en-têtes d’authentification ou d’identifiants et fragments tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

  </Accordion>
  <Accordion title="configuration des secrets">
    Assistant interactif qui :

    - Configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajout/modification/suppression).
    - Permet de sélectionner les champs pris en charge contenant des secrets dans `openclaw.json`, ainsi que `auth-profiles.json` pour la portée d’un agent.
    - Peut créer une nouvelle association `auth-profiles.json` directement dans le sélecteur de cible.
    - Recueille les détails de SecretRef (`source`, `provider`, `id`).
    - Exécute la résolution préalable et peut appliquer immédiatement les modifications.

    Remarque sur l’exécution : la vérification préalable ignore les contrôles de SecretRef d’exécution, sauf si `--allow-exec` est défini. Si vous appliquez directement depuis `configure --apply` et que le plan comprend des références ou des fournisseurs d’exécution, conservez également `--allow-exec` pour l’étape d’application.

    Modes utiles :

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valeurs par défaut de l’application `configure` :

    - Supprimer les identifiants statiques correspondants de `auth-profiles.json` pour les fournisseurs ciblés.
    - Supprimer les entrées statiques héritées `api_key` de `auth.json`.
    - Supprimer les lignes de secrets connus correspondantes de `<config-dir>/.env`.

  </Accordion>
  <Accordion title="application des secrets">
    Appliquer un plan enregistré :

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Remarque sur l’exécution : la simulation ignore les vérifications d’exécution, sauf si `--allow-exec` est défini ; le mode écriture rejette les plans contenant des SecretRef ou des fournisseurs d’exécution, sauf si `--allow-exec` est défini.

    Pour obtenir les détails du contrat strict relatif aux cibles et aux chemins, ainsi que les règles exactes de rejet, consultez [Contrat du plan d’application des secrets](/fr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Politique de sécurité à sens unique

<Warning>
OpenClaw n’écrit intentionnellement aucune sauvegarde de restauration contenant d’anciennes valeurs de secrets en texte brut.
</Warning>

Modèle de sécurité :

- La vérification préalable doit réussir avant le mode écriture.
- L’activation à l’exécution est validée avant la validation définitive.
- L’application met à jour les fichiers au moyen d’un remplacement atomique et tente, dans la mesure du possible, de les restaurer en cas d’échec.

## Remarques sur la compatibilité avec l’authentification héritée

Pour les identifiants statiques, l’exécution ne dépend plus du stockage d’authentification hérité en texte brut.

- La source des identifiants à l’exécution est l’instantané résolu en mémoire.
- Les entrées statiques héritées `api_key` sont supprimées lorsqu’elles sont détectées.
- Le comportement de compatibilité lié à OAuth reste distinct.

## Remarque sur l’interface Web

Certaines unions SecretInput sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Pages associées

- [Authentification](/fr/gateway/authentication) - configuration de l’authentification
- [CLI : secrets](/fr/cli/secrets) - commandes CLI
- [SecretRef de Vault](/fr/plugins/vault) - configuration du fournisseur HashiCorp Vault
- [Variables d’environnement](/fr/help/environment) - priorité des variables d’environnement
- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) - surface d’identifiants
- [Contrat du plan d’application des secrets](/fr/gateway/secrets-plan-contract) - détails du contrat du plan
- [Sécurité](/fr/gateway/security) - posture de sécurité
