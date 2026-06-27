---
read_when:
    - Configuration des SecretRefs pour les identifiants des fournisseurs et les références `auth-profiles.json`
    - Exploiter le rechargement, l’audit, la configuration et l’application des secrets en toute sécurité en production
    - Comprendre le fail-fast au démarrage, le filtrage des surfaces inactives et le comportement de dernière version connue fonctionnelle
sidebarTitle: Secrets management
summary: 'Gestion des secrets : contrat SecretRef, comportement des instantanés d’exécution et nettoyage unidirectionnel sûr'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-06-27T17:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw prend en charge les SecretRefs additifs afin que les identifiants pris en charge n’aient pas besoin d’être stockés en clair dans la configuration.

<Note>
Le texte clair fonctionne toujours. Les SecretRefs sont activés explicitement pour chaque identifiant.
</Note>

<Warning>
Les identifiants en clair restent lisibles par l’agent s’ils sont stockés dans des fichiers que
l’agent peut inspecter, notamment `openclaw.json`, `auth-profiles.json`, `.env` ou les
fichiers générés `agents/*/agent/models.json`. Les SecretRefs réduisent ce rayon
d’impact local uniquement après la migration de chaque identifiant pris en charge et lorsque
`openclaw secrets audit --check` ne signale plus aucun résidu de secret en clair.
</Warning>

## Objectifs et modèle d’exécution

Les secrets sont résolus dans un instantané d’exécution en mémoire.

- La résolution est effectuée avec empressement pendant l’activation, et non paresseusement sur les chemins de requête.
- Le démarrage échoue rapidement lorsqu’un SecretRef effectivement actif ne peut pas être résolu.
- Le rechargement utilise un échange atomique : réussite complète, ou conservation du dernier instantané valide connu.
- Les violations de la politique SecretRef (par exemple des profils d’authentification en mode OAuth combinés à une entrée SecretRef) font échouer l’activation avant l’échange d’exécution.
- Les requêtes d’exécution lisent uniquement l’instantané actif en mémoire.
- Après la première activation/charge réussie de la configuration, les chemins de code d’exécution continuent de lire cet instantané actif en mémoire jusqu’à ce qu’un rechargement réussi le remplace.
- Les chemins de livraison sortants lisent également cet instantané actif (par exemple la livraison de réponses/fils Discord et les envois d’actions Telegram) ; ils ne résolvent pas à nouveau les SecretRefs à chaque envoi.

Cela évite que les pannes du fournisseur de secrets affectent les chemins de requête critiques.

## Limite d’accès de l’agent

Les SecretRefs empêchent la persistance des identifiants dans les surfaces de configuration
et de modèles générés prises en charge, mais ils ne constituent pas une limite d’isolation
de processus. Si un identifiant en clair reste sur le disque dans un chemin que l’agent peut lire,
l’agent peut contourner la réduction d’information au niveau de l’API en utilisant des outils de fichier
ou de shell pour inspecter ce fichier.

Pour les déploiements de production où les fichiers accessibles par l’agent sont concernés, considérez
la migration SecretRef comme terminée uniquement lorsque toutes les conditions suivantes sont vraies :

- les identifiants pris en charge utilisent des SecretRefs au lieu de valeurs en clair
- les résidus hérités en clair ont été supprimés de `openclaw.json`,
  `auth-profiles.json`, `.env` et des fichiers `models.json` générés
- `openclaw secrets audit --check` est propre après la migration
- tout identifiant restant non pris en charge ou rotatif est protégé par l’isolation du
  système d’exploitation, l’isolation de conteneur ou un proxy d’identifiants externe

C’est pourquoi le flux audit/configuration/application est une barrière de migration de sécurité, et non
un simple assistant de commodité.

<Warning>
Les SecretRefs ne rendent pas sûrs des fichiers arbitraires lisibles. Les sauvegardes, les configurations copiées,
les anciens catalogues de modèles générés et les classes d’identifiants non prises en charge doivent être traités
comme des secrets de production jusqu’à ce qu’ils soient supprimés, déplacés hors de la limite de confiance
de l’agent, ou protégés par une couche d’isolation distincte.
</Warning>

## Filtrage des surfaces actives

Les SecretRefs ne sont validés que sur les surfaces effectivement actives.

- Surfaces activées : les références non résolues bloquent le démarrage/rechargement.
- Surfaces inactives : les références non résolues ne bloquent pas le démarrage/rechargement.
- Les références inactives émettent des diagnostics non fatals avec le code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Exemples de surfaces inactives">
    - Entrées de canal/compte désactivées.
    - Identifiants de canal de niveau supérieur dont aucun compte activé n’hérite.
    - Surfaces d’outil/fonctionnalité désactivées.
    - Clés propres au fournisseur de recherche Web qui ne sont pas sélectionnées par `tools.web.search.provider`. En mode auto (fournisseur non défini), les clés sont consultées par ordre de priorité pour la détection automatique du fournisseur jusqu’à ce qu’une soit résolue. Après la sélection, les clés de fournisseurs non sélectionnés sont traitées comme inactives jusqu’à leur sélection.
    - Le matériel d’authentification SSH de sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus les remplacements par agent) est actif uniquement lorsque le backend de sandbox effectif est `ssh` pour l’agent par défaut ou un agent activé.
    - Les SecretRefs `gateway.remote.token` / `gateway.remote.password` sont actifs si l’une de ces conditions est vraie :
      - `gateway.mode=remote`
      - `gateway.remote.url` est configuré
      - `gateway.tailscale.mode` vaut `serve` ou `funnel`
      - En mode local sans ces surfaces distantes :
        - `gateway.remote.token` est actif lorsque l’authentification par jeton peut l’emporter et qu’aucun jeton env/auth n’est configuré.
        - `gateway.remote.password` est actif uniquement lorsque l’authentification par mot de passe peut l’emporter et qu’aucun mot de passe env/auth n’est configuré.
    - Le SecretRef `gateway.auth.token` est inactif pour la résolution de l’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée de jeton env l’emporte pour cette exécution.

  </Accordion>
</AccordionGroup>

## Diagnostics de la surface d’authentification Gateway

Lorsqu’un SecretRef est configuré sur `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, le démarrage/rechargement du Gateway journalise explicitement l’état de la surface :

- `active` : le SecretRef fait partie de la surface d’authentification effective et doit être résolu.
- `inactive` : le SecretRef est ignoré pour cette exécution parce qu’une autre surface d’authentification l’emporte, ou parce que l’authentification distante est désactivée/inactive.

Ces entrées sont journalisées avec `SECRETS_GATEWAY_AUTH_SURFACE` et incluent la raison utilisée par la politique de surfaces actives, afin que vous puissiez voir pourquoi un identifiant a été traité comme actif ou inactif.

## Prévalidation de référence pendant l’onboarding

Lorsque l’onboarding s’exécute en mode interactif et que vous choisissez le stockage SecretRef, OpenClaw exécute une validation préalable avant l’enregistrement :

- Références env : valide le nom de la variable env et confirme qu’une valeur non vide est visible pendant la configuration.
- Références fournisseur (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Chemin de réutilisation du quickstart : lorsque `gateway.auth.token` est déjà un SecretRef, l’onboarding le résout avant l’amorçage probe/dashboard (pour les références `env`, `file` et `exec`) en utilisant la même barrière d’échec rapide.

Si la validation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.

## Contrat SecretRef

Utilisez une forme d’objet unique partout :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Les champs SecretInput pris en charge acceptent également des raccourcis de chaîne exacts :

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit correspondre à `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit être un pointeur JSON absolu (`/...`)
    - Échappement RFC6901 dans les segments : `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit correspondre à `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (prend en charge des sélecteurs comme `secret#json_key`)
    - `id` ne doit pas contenir `.` ni `..` comme segments de chemin délimités par des barres obliques (par exemple `a/../b` est rejeté)

  </Tab>
</Tabs>

## Configuration des fournisseurs

Définissez les fournisseurs sous `secrets.providers` :

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
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

<AccordionGroup>
  <Accordion title="Fournisseur env">
    - Liste d’autorisation facultative via `allowlist`.
    - Les valeurs env manquantes/vides font échouer la résolution.

  </Accordion>
  <Accordion title="Fournisseur file">
    - Lit le fichier local depuis `path`.
    - `mode: "json"` attend une charge utile d’objet JSON et résout `id` comme pointeur.
    - `mode: "singleValue"` attend l’id de référence `"value"` et renvoie le contenu du fichier.
    - Le chemin doit réussir les contrôles de propriété/permissions.
    - Note d’échec fermé sous Windows : si la vérification ACL n’est pas disponible pour un chemin, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les contrôles de sécurité du chemin.

  </Accordion>
  <Accordion title="Fournisseur exec">
    - Exécute le chemin binaire absolu configuré, sans shell.
    - Par défaut, `command` doit pointer vers un fichier normal (pas un lien symbolique).
    - Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande par lien symbolique (par exemple les shims Homebrew). OpenClaw valide le chemin cible résolu.
    - Associez `allowSymlinkCommand` à `trustedDirs` pour les chemins de gestionnaires de paquets (par exemple `["/opt/homebrew"]`).
    - Prend en charge le délai d’expiration, le délai d’expiration sans sortie, les limites d’octets de sortie, la liste d’autorisation env et les répertoires de confiance.
    - Note d’échec fermé sous Windows : si la vérification ACL n’est pas disponible pour le chemin de commande, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les contrôles de sécurité du chemin.
    - Les fournisseurs exec gérés par Plugin peuvent utiliser `pluginIntegration` au lieu de
      `command`/`args` copiés. OpenClaw résout les détails de commande actuels
      depuis le manifeste du Plugin installé pendant le démarrage/rechargement. Si le Plugin est
      désactivé, supprimé, non fiable ou ne déclare plus l’intégration,
      les SecretRefs actifs utilisant ce fournisseur échouent en mode fermé.

    Charge utile de requête (stdin) :

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Charge utile de réponse (stdout) :

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Erreurs facultatives par id :

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Clés d’API adossées à des fichiers

Ne placez pas de chaînes `file:...` dans le bloc `env` de la configuration. Le bloc `env` est
littéral et non prioritaire, donc `file:...` n’est pas résolu.

Utilisez plutôt un SecretRef de fichier sur un champ d’identifiant pris en charge :

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

Pour `mode: "singleValue"`, l’`id` SecretRef est `"value"`. Pour
`mode: "json"`, utilisez un pointeur JSON absolu tel que
`"/providers/xai/apiKey"`.

Consultez [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) pour
les champs de configuration qui acceptent les SecretRefs.

## Exemples d’intégration exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    Utilisez un wrapper de résolution lorsque vous voulez que les identifiants SecretRef correspondent aux clés d’éléments Bitwarden
    Secrets Manager. Le dépôt inclut
    `scripts/secrets/openclaw-bws-resolver.mjs` ; installez-le ou copiez-le vers un chemin absolu
    approuvé sur l’hôte qui exécute le Gateway.

    Prérequis :

    - CLI Bitwarden Secrets Manager (`bws`) installée sur l’hôte du Gateway.
    - `BWS_ACCESS_TOKEN` disponible pour le service Gateway.
    - `PATH` transmis au résolveur, ou `BWS_BIN` défini sur le chemin absolu du binaire
      `bws`.
    - `BWS_SERVER_URL` doit être défini dans l’environnement lors de l’utilisation d’une instance
      Bitwarden auto-hébergée.

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

    Le résolveur regroupe les identifiants demandés, exécute `bws secret list` et renvoie
    les valeurs des champs `key` de secrets correspondants. Utilisez des clés qui respectent le contrat
    d’identifiant SecretRef exec, comme `openclaw/providers/openai/apiKey` ; les clés de style
    variable d’environnement avec des traits de soulignement sont rejetées avant l’exécution du résolveur. Si plusieurs
    secrets Bitwarden visibles ont la même clé demandée, le résolveur
    échoue pour cet identifiant en le considérant comme ambigu au lieu d’en choisir un. Après la mise à jour de la configuration,
    vérifiez le chemin du résolveur :

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    Utilisez un petit wrapper de résolution lorsque vous voulez que les identifiants SecretRef correspondent directement aux
    entrées `pass`. Enregistrez-le comme exécutable dans un chemin absolu qui satisfait
    vos contrôles de chemin de fournisseur exec, par exemple
    `/usr/local/bin/openclaw-pass-resolver`. Le shebang `#!/usr/bin/env node`
    résout `node` depuis le `PATH` du processus de résolution ; incluez donc `PATH` dans
    `passEnv`. Si `pass` ne se trouve pas dans ce `PATH`, définissez `PASS_BIN` dans l’environnement
    parent et incluez-le aussi dans `passEnv` :

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

    Conservez le secret sur la première ligne de l’entrée `pass`, ou personnalisez le
    wrapper si vous voulez renvoyer plutôt toute la sortie de `pass show`. Après
    la mise à jour de la configuration, vérifiez à la fois l’audit statique et le chemin du résolveur exec :

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

## Variables d’environnement du serveur MCP

Les variables d’environnement du serveur MCP configurées via `plugins.entries.acpx.config.mcpServers` prennent en charge SecretInput. Cela évite de placer les clés API et les jetons dans une configuration en texte clair :

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

Les valeurs de chaîne en texte clair fonctionnent toujours. Les références de modèle d’environnement comme `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus pendant l’activation du Gateway, avant la création du processus du serveur MCP. Comme pour les autres surfaces SecretRef, les références non résolues ne bloquent l’activation que lorsque le plugin `acpx` est effectivement actif.

## Données d’authentification SSH du sandbox

Le backend de sandbox principal `ssh` prend aussi en charge les SecretRefs pour les données d’authentification SSH :

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

- OpenClaw résout ces références pendant l’activation du sandbox, pas paresseusement lors de chaque appel SSH.
- Les valeurs résolues sont écrites dans des fichiers temporaires avec des permissions restrictives et utilisées dans la configuration SSH générée.
- Si le backend de sandbox effectif n’est pas `ssh`, ces références restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants canoniques pris en charge et non pris en charge sont listés dans :

- [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface)

<Note>
Les identifiants créés à l’exécution ou rotatifs, ainsi que les données de rafraîchissement OAuth, sont intentionnellement exclus de la résolution SecretRef en lecture seule.
</Note>

## Comportement requis et précédence

- Champ sans référence : inchangé.
- Champ avec référence : requis sur les surfaces actives pendant l’activation.
- Si du texte clair et une référence sont tous deux présents, la référence est prioritaire sur les chemins de précédence pris en charge.
- La sentinelle de masquage `__OPENCLAW_REDACTED__` est réservée au masquage et à la restauration internes de la configuration, et elle est rejetée comme donnée de configuration littérale soumise.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement à l’exécution)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants `auth-profiles.json` sont prioritaires sur les références `openclaw.json`)

Comportement de compatibilité Google Chat :

- `serviceAccountRef` est prioritaire sur `serviceAccount` en texte clair.
- La valeur en texte clair est ignorée lorsque la référence sœur est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute lors de :

- Démarrage (préflight plus activation finale)
- Chemin d’application à chaud du rechargement de configuration
- Chemin de vérification avec redémarrage du rechargement de configuration
- Rechargement manuel via `secrets.reload`
- Préflight RPC d’écriture de configuration du Gateway (`config.set` / `config.apply` / `config.patch`) pour vérifier que les SecretRefs des surfaces actives peuvent être résolus dans la charge utile de configuration soumise avant de persister les modifications

Contrat d’activation :

- Une réussite remplace l’instantané atomiquement.
- Un échec au démarrage interrompt le démarrage du Gateway.
- Un échec de rechargement à l’exécution conserve le dernier instantané valide connu.
- Un échec de préflight d’écriture RPC rejette la configuration soumise et laisse inchangés la configuration sur disque et l’instantané d’exécution actif.
- Fournir un jeton de canal explicite par appel à un appel sortant d’assistant ou d’outil ne déclenche pas l’activation SecretRef ; les points d’activation restent le démarrage, le rechargement et `secrets.reload` explicite.

## Signaux dégradés et récupérés

Quand l’activation au moment du rechargement échoue après un état sain, OpenClaw passe à l’état de secrets dégradé.

Codes d’événement système ponctuel et de journal :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- Dégradé : l’exécution conserve le dernier instantané valide connu.
- Récupéré : émis une fois après la prochaine activation réussie.
- Les échecs répétés alors que l’état est déjà dégradé journalisent des avertissements, mais ne saturent pas les événements.
- L’échec rapide au démarrage n’émet pas d’événements dégradés, car l’exécution n’est jamais devenue active.

## Résolution des chemins de commandes

Les chemins de commandes peuvent opter pour la résolution SecretRef prise en charge via la RPC d’instantané du Gateway.

Il existe deux grands comportements :

<Tabs>
  <Tab title="Chemins de commande stricts">
    Par exemple, les chemins de mémoire distante `openclaw memory` et `openclaw qr --remote` lorsqu’il a besoin de refs de secret partagé distant. Ils lisent depuis l’instantané actif et échouent rapidement lorsqu’une SecretRef requise est indisponible.
  </Tab>
  <Tab title="Chemins de commande en lecture seule">
    Par exemple `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, ainsi que les flux doctor/config de réparation en lecture seule. Ils privilégient aussi l’instantané actif, mais se dégradent au lieu d’abandonner lorsqu’une SecretRef ciblée est indisponible dans ce chemin de commande.

    Comportement en lecture seule :

    - Lorsque le Gateway est en cours d’exécution, ces commandes lisent d’abord depuis l’instantané actif.
    - Si la résolution du Gateway est incomplète ou si le Gateway est indisponible, elles tentent un repli local ciblé pour la surface de commande concernée.
    - Si une SecretRef ciblée reste indisponible, la commande continue avec une sortie en lecture seule dégradée et des diagnostics explicites comme « configuré mais indisponible dans ce chemin de commande ».
    - Ce comportement dégradé est local à la commande uniquement. Il n’affaiblit pas le démarrage du runtime, le rechargement, ni les chemins d’envoi/auth.

  </Tab>
</Tabs>

Autres notes :

- Le rafraîchissement de l’instantané après rotation de secret backend est géré par `openclaw secrets reload`.
- Méthode RPC du Gateway utilisée par ces chemins de commande : `secrets.resolve`.

## Flux d’audit et de configuration

Flux opérateur par défaut :

<Steps>
  <Step title="Auditer l’état actuel">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurer et appliquer les SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Réauditer">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Ne considérez pas la migration comme terminée tant que le réaudit n’est pas propre. Si l’audit
signale encore des valeurs en clair au repos, le risque d’accès par l’agent est toujours présent
même lorsque les API du runtime renvoient des valeurs masquées.

Si vous enregistrez un plan au lieu de l’appliquer pendant `configure`, appliquez ce plan enregistré
avec `openclaw secrets apply --from <plan-path>` avant le réaudit.

<AccordionGroup>
  <Accordion title="secrets audit">
    Les constats incluent :

    - valeurs en clair au repos (`openclaw.json`, `auth-profiles.json`, `.env` et `agents/*/agent/models.json` généré)
    - résidus d’en-têtes sensibles de fournisseurs en clair dans les entrées `models.json` générées
    - refs non résolues
    - masquage par précédence (`auth-profiles.json` prioritaire sur les refs de `openclaw.json`)
    - résidus hérités (`auth.json`, rappels OAuth)

    Note sur exec :

    - Par défaut, l’audit ignore les vérifications de résolvabilité des SecretRef exec pour éviter les effets de bord des commandes.
    - Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs exec pendant l’audit.

    Note sur les résidus d’en-têtes :

    - La détection des en-têtes sensibles de fournisseurs repose sur des heuristiques de nommage (noms et fragments courants d’en-têtes auth/identifiants, comme `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Assistant interactif qui :

    - configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajout/modification/suppression)
    - vous permet de sélectionner les champs pris en charge contenant des secrets dans `openclaw.json` ainsi que `auth-profiles.json` pour une portée d’agent
    - peut créer un nouveau mappage `auth-profiles.json` directement dans le sélecteur de cible
    - capture les détails SecretRef (`source`, `provider`, `id`)
    - exécute la résolution préliminaire
    - peut appliquer immédiatement

    Note sur exec :

    - La vérification préliminaire ignore les contrôles de SecretRef exec sauf si `--allow-exec` est défini.
    - Si vous appliquez directement depuis `configure --apply` et que le plan inclut des refs/fournisseurs exec, gardez aussi `--allow-exec` défini pour l’étape d’application.

    Modes utiles :

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valeurs par défaut d’application de `configure` :

    - nettoyer les identifiants statiques correspondants de `auth-profiles.json` pour les fournisseurs ciblés
    - nettoyer les entrées héritées statiques `api_key` de `auth.json`
    - nettoyer les lignes de secrets connues correspondantes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Appliquer un plan enregistré :

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Note sur exec :

    - dry-run ignore les contrôles exec sauf si `--allow-exec` est défini.
    - le mode écriture rejette les plans contenant des SecretRefs/fournisseurs exec sauf si `--allow-exec` est défini.

    Pour les détails du contrat strict de cible/chemin et les règles exactes de rejet, consultez [Contrat de plan Secrets Apply](/fr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Politique de sécurité à sens unique

<Warning>
OpenClaw n’écrit volontairement aucune sauvegarde de restauration contenant d’anciennes valeurs de secrets en clair.
</Warning>

Modèle de sécurité :

- la vérification préliminaire doit réussir avant le mode écriture
- l’activation du runtime est validée avant la validation finale
- apply met à jour les fichiers avec remplacement atomique et restauration au mieux en cas d’échec

## Notes de compatibilité de l’auth héritée

Pour les identifiants statiques, le runtime ne dépend plus du stockage auth hérité en clair.

- La source des identifiants du runtime est l’instantané résolu en mémoire.
- Les entrées héritées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes.
- Le comportement de compatibilité lié à OAuth reste séparé.

## Note sur l’interface Web

Certaines unions SecretInput sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Connexe

- [Authentification](/fr/gateway/authentication) — configuration auth
- [CLI : secrets](/fr/cli/secrets) — commandes CLI
- [Variables d’environnement](/fr/help/environment) — précédence de l’environnement
- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) — surface d’identifiants
- [Contrat de plan Secrets Apply](/fr/gateway/secrets-plan-contract) — détails du contrat de plan
- [Sécurité](/fr/gateway/security) — posture de sécurité
