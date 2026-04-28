---
read_when:
    - Configuration des SecretRefs pour les identifiants des fournisseurs et les références `auth-profiles.json`
    - Exploiter le rechargement, l’audit, la configuration et l’application des secrets en toute sécurité en production
    - Comprendre l’échec rapide au démarrage, le filtrage des surfaces inactives et le comportement last-known-good
sidebarTitle: Secrets management
summary: 'Gestion des secrets : contrat SecretRef, comportement d’instantané runtime et nettoyage unidirectionnel sûr'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-04-26T11:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw prend en charge les SecretRefs additives afin que les identifiants pris en charge n’aient pas besoin d’être stockés en clair dans la configuration.

<Note>
Le texte brut fonctionne toujours. Les SecretRefs sont activés de manière facultative pour chaque identifiant.
</Note>

## Objectifs et modèle runtime

Les secrets sont résolus dans un instantané runtime en mémoire.

- La résolution est anticipée pendant l’activation, et non paresseuse sur les chemins de requête.
- Le démarrage échoue rapidement lorsqu’une SecretRef effectivement active ne peut pas être résolue.
- Le rechargement utilise un échange atomique : succès complet, ou conservation du dernier instantané valide connu.
- Les violations de politique SecretRef (par exemple profils d’authentification en mode OAuth combinés avec une entrée SecretRef) font échouer l’activation avant l’échange runtime.
- Les requêtes runtime lisent uniquement depuis l’instantané actif en mémoire.
- Après la première activation/charge réussie de la configuration, les chemins de code runtime continuent de lire cet instantané actif en mémoire jusqu’à ce qu’un rechargement réussi le remplace.
- Les chemins de distribution sortante lisent également depuis cet instantané actif (par exemple la distribution de réponse/fil Discord et les envois d’actions Telegram) ; ils ne re-résolvent pas les SecretRefs à chaque envoi.

Cela permet de tenir les pannes de fournisseur de secrets à l’écart des chemins de requête critiques.

## Filtrage des surfaces actives

Les SecretRefs ne sont validées que sur les surfaces effectivement actives.

- Surfaces activées : les références non résolues bloquent le démarrage/le rechargement.
- Surfaces inactives : les références non résolues ne bloquent pas le démarrage/le rechargement.
- Les références inactives émettent des diagnostics non fatals avec le code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Exemples de surfaces inactives">
    - Entrées de canal/compte désactivées.
    - Identifiants de canal de niveau supérieur dont aucun compte activé n’hérite.
    - Surfaces d’outil/fonctionnalité désactivées.
    - Clés spécifiques au fournisseur de recherche web qui ne sont pas sélectionnées par `tools.web.search.provider`. En mode auto (fournisseur non défini), les clés sont consultées par ordre de priorité pour l’auto-détection du fournisseur jusqu’à ce que l’une se résolve. Après sélection, les clés des fournisseurs non sélectionnés sont traitées comme inactives jusqu’à leur sélection.
    - Le matériel d’authentification SSH du sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus les remplacements par agent) n’est actif que lorsque le backend sandbox effectif est `ssh` pour l’agent par défaut ou un agent activé.
    - Les SecretRefs `gateway.remote.token` / `gateway.remote.password` sont actives si l’une de ces conditions est vraie :
      - `gateway.mode=remote`
      - `gateway.remote.url` est configuré
      - `gateway.tailscale.mode` vaut `serve` ou `funnel`
      - En mode local sans ces surfaces distantes :
        - `gateway.remote.token` est actif lorsque l’authentification par jeton peut l’emporter et qu’aucun jeton env/auth n’est configuré.
        - `gateway.remote.password` n’est actif que lorsque l’authentification par mot de passe peut l’emporter et qu’aucun mot de passe env/auth n’est configuré.
    - La SecretRef `gateway.auth.token` est inactive pour la résolution d’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée du jeton env l’emporte pour ce runtime.

  </Accordion>
</AccordionGroup>

## Diagnostics de surface d’authentification Gateway

Lorsqu’une SecretRef est configurée sur `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, le démarrage/le rechargement de la Gateway journalise explicitement l’état de la surface :

- `active` : la SecretRef fait partie de la surface d’authentification effective et doit être résolue.
- `inactive` : la SecretRef est ignorée pour ce runtime parce qu’une autre surface d’authentification l’emporte, ou parce que l’authentification distante est désactivée/inactive.

Ces entrées sont journalisées avec `SECRETS_GATEWAY_AUTH_SURFACE` et incluent la raison utilisée par la politique de surface active, afin que vous puissiez voir pourquoi un identifiant a été traité comme actif ou inactif.

## Prévalidation des références d’intégration

Lorsque l’intégration s’exécute en mode interactif et que vous choisissez le stockage SecretRef, OpenClaw exécute une validation préalable avant l’enregistrement :

- Références env : valide le nom de variable d’environnement et confirme qu’une valeur non vide est visible pendant la configuration.
- Références fournisseur (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Chemin de réutilisation quickstart : lorsque `gateway.auth.token` est déjà une SecretRef, l’intégration le résout avant le bootstrap probe/dashboard (pour les références `env`, `file` et `exec`) en utilisant la même barrière d’échec rapide.

Si la validation échoue, l’intégration affiche l’erreur et vous permet de réessayer.

## Contrat SecretRef

Utilisez partout la même forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
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
    - `id` doit être un pointeur JSON absolu (`/...`)
    - Échappement RFC6901 dans les segments : `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit correspondre à `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` ne doit pas contenir `.` ou `..` comme segments de chemin délimités par des slashs (par exemple `a/../b` est rejeté)

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
    - Liste d’autorisations facultative via `allowlist`.
    - Les valeurs env manquantes/vides font échouer la résolution.

  </Accordion>
  <Accordion title="Fournisseur file">
    - Lit un fichier local depuis `path`.
    - `mode: "json"` attend une charge utile d’objet JSON et résout `id` comme pointeur.
    - `mode: "singleValue"` attend l’identifiant de référence `"value"` et renvoie le contenu du fichier.
    - Le chemin doit passer les vérifications de propriété/autorisations.
    - Remarque fail-closed Windows : si la vérification ACL n’est pas disponible pour un chemin, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité du chemin.

  </Accordion>
  <Accordion title="Fournisseur exec">
    - Exécute le chemin binaire absolu configuré, sans shell.
    - Par défaut, `command` doit pointer vers un fichier ordinaire (pas un symlink).
    - Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande symlinkés (par exemple les shims Homebrew). OpenClaw valide le chemin cible résolu.
    - Associez `allowSymlinkCommand` à `trustedDirs` pour les chemins de gestionnaire de paquets (par exemple `["/opt/homebrew"]`).
    - Prend en charge le délai maximal, le délai maximal sans sortie, les limites d’octets de sortie, la liste d’autorisations env et les répertoires de confiance.
    - Remarque fail-closed Windows : si la vérification ACL n’est pas disponible pour le chemin de commande, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité du chemin.

    Charge utile de requête (stdin) :

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Charge utile de réponse (stdout) :

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Erreurs facultatives par identifiant :

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

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
            allowSymlinkCommand: true, // requis pour les binaires Homebrew symlinkés
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
  <Accordion title="CLI HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // requis pour les binaires Homebrew symlinkés
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
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // requis pour les binaires Homebrew symlinkés
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

Les variables env du serveur MCP configurées via `plugins.entries.acpx.config.mcpServers` prennent en charge SecretInput. Cela permet de garder les clés API et les jetons hors de la configuration en clair :

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

Les valeurs de chaîne en clair continuent de fonctionner. Les références env-template comme `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus pendant l’activation de la Gateway avant que le processus du serveur MCP ne soit lancé. Comme pour les autres surfaces SecretRef, les références non résolues ne bloquent l’activation que lorsque le Plugin `acpx` est effectivement actif.

## Matériel d’authentification SSH du sandbox

Le backend sandbox `ssh` du cœur prend également en charge les SecretRefs pour le matériel d’authentification SSH :

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

Comportement runtime :

- OpenClaw résout ces références pendant l’activation du sandbox, et non paresseusement à chaque appel SSH.
- Les valeurs résolues sont écrites dans des fichiers temporaires avec des autorisations restrictives et utilisées dans la configuration SSH générée.
- Si le backend sandbox effectif n’est pas `ssh`, ces références restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants canoniques pris en charge et non pris en charge sont listés dans :

- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)

<Note>
Les identifiants émis au runtime ou rotatifs, ainsi que le matériel de rafraîchissement OAuth, sont volontairement exclus de la résolution SecretRef en lecture seule.
</Note>

## Comportement requis et priorité

- Champ sans référence : inchangé.
- Champ avec référence : requis sur les surfaces actives pendant l’activation.
- Si le texte brut et la référence sont tous deux présents, la référence est prioritaire sur les chemins de priorité pris en charge.
- Le marqueur d’expurgation `__OPENCLAW_REDACTED__` est réservé à l’expurgation/restauration interne de configuration et est rejeté comme donnée de configuration soumise littérale.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement runtime)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants de `auth-profiles.json` sont prioritaires sur les références de `openclaw.json`)

Comportement de compatibilité Google Chat :

- `serviceAccountRef` est prioritaire sur `serviceAccount` en clair.
- La valeur en clair est ignorée lorsqu’une référence sœur est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute sur :

- Démarrage (prévalidation plus activation finale)
- Chemin d’application à chaud du rechargement de configuration
- Chemin de vérification de redémarrage du rechargement de configuration
- Rechargement manuel via `secrets.reload`
- Prévalidation RPC d’écriture de configuration Gateway (`config.set` / `config.apply` / `config.patch`) pour la résolubilité des SecretRef sur surface active dans la charge utile de configuration soumise avant la persistance des modifications

Contrat d’activation :

- Le succès échange l’instantané de manière atomique.
- Un échec au démarrage interrompt le démarrage de la Gateway.
- Un échec de rechargement runtime conserve le dernier instantané valide connu.
- Un échec de prévalidation d’écriture RPC rejette la configuration soumise et conserve inchangés à la fois la configuration sur disque et l’instantané runtime actif.
- Fournir un jeton de canal explicite par appel à un helper/outil sortant ne déclenche pas l’activation SecretRef ; les points d’activation restent le démarrage, le rechargement et `secrets.reload` explicite.

## Signaux dégradés et rétablis

Lorsque l’activation au rechargement échoue après un état sain, OpenClaw entre dans un état de secrets dégradé.

Événement système ponctuel et codes de journal :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- Dégradé : le runtime conserve le dernier instantané valide connu.
- Rétabli : émis une seule fois après la prochaine activation réussie.
- Les échecs répétés alors que l’état est déjà dégradé journalisent des avertissements mais n’inondent pas les événements.
- L’échec rapide au démarrage n’émet pas d’événements dégradés car le runtime n’est jamais devenu actif.

## Résolution sur les chemins de commande

Les chemins de commande peuvent choisir d’utiliser la résolution SecretRef prise en charge via la RPC d’instantané Gateway.

Il existe deux grands comportements :

<Tabs>
  <Tab title="Chemins de commande stricts">
    Par exemple les chemins de mémoire distante `openclaw memory` et `openclaw qr --remote` lorsqu’il a besoin de références de secret partagé distantes. Ils lisent depuis l’instantané actif et échouent rapidement lorsqu’une SecretRef requise n’est pas disponible.
  </Tab>
  <Tab title="Chemins de commande en lecture seule">
    Par exemple `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, ainsi que les flux doctor/réparation de configuration en lecture seule. Ils préfèrent également l’instantané actif, mais se dégradent au lieu d’interrompre lorsqu’une SecretRef ciblée n’est pas disponible dans ce chemin de commande.

    Comportement en lecture seule :

    - Lorsque la Gateway est en cours d’exécution, ces commandes lisent d’abord depuis l’instantané actif.
    - Si la résolution Gateway est incomplète ou si la Gateway n’est pas disponible, elles tentent un repli local ciblé pour la surface de commande spécifique.
    - Si une SecretRef ciblée reste indisponible, la commande continue avec une sortie dégradée en lecture seule et des diagnostics explicites comme « configuré mais indisponible dans ce chemin de commande ».
    - Ce comportement dégradé est local à la commande uniquement. Il n’affaiblit pas les chemins runtime de démarrage, rechargement ou envoi/authentification.

  </Tab>
</Tabs>

Autres remarques :

- Le rafraîchissement d’instantané après rotation des secrets backend est géré par `openclaw secrets reload`.
- Méthode RPC Gateway utilisée par ces chemins de commande : `secrets.resolve`.

## Workflow d’audit et de configuration

Flux opérateur par défaut :

<Steps>
  <Step title="Auditer l’état actuel">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurer les SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Ré-auditer">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Les constats incluent :

    - valeurs en clair au repos (`openclaw.json`, `auth-profiles.json`, `.env` et `agents/*/agent/models.json` généré)
    - résidus d’en-têtes sensibles de fournisseur en clair dans les entrées `models.json` générées
    - références non résolues
    - masquage de priorité (`auth-profiles.json` prioritaire sur les références de `openclaw.json`)
    - résidus hérités (`auth.json`, rappels OAuth)

    Remarque exec :

    - Par défaut, l’audit ignore les vérifications de résolubilité des SecretRef exec afin d’éviter les effets de bord des commandes.
    - Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs exec pendant l’audit.

    Remarque sur les résidus d’en-tête :

    - La détection des en-têtes sensibles de fournisseur repose sur une heuristique de nom (noms et fragments d’en-tête d’authentification/identifiant courants tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interactif qui :

    - configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajout/modification/suppression)
    - vous permet de sélectionner les champs pris en charge contenant des secrets dans `openclaw.json` ainsi que `auth-profiles.json` pour une portée d’agent
    - peut créer directement un nouveau mapping `auth-profiles.json` dans le sélecteur cible
    - capture les détails SecretRef (`source`, `provider`, `id`)
    - exécute une prévalidation de résolution
    - peut appliquer immédiatement

    Remarque exec :

    - La prévalidation ignore les vérifications SecretRef exec sauf si `--allow-exec` est défini.
    - Si vous appliquez directement depuis `configure --apply` et que le plan inclut des références/fournisseurs exec, laissez également `--allow-exec` défini pour l’étape d’application.

    Modes utiles :

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valeurs par défaut de l’application de `configure` :

    - nettoie les identifiants statiques correspondants de `auth-profiles.json` pour les fournisseurs ciblés
    - nettoie les entrées statiques héritées `api_key` de `auth.json`
    - nettoie les lignes de secret connues correspondantes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Appliquez un plan enregistré :

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Remarque exec :

    - L’exécution à blanc ignore les vérifications exec sauf si `--allow-exec` est défini.
    - Le mode écriture rejette les plans contenant des SecretRefs/fournisseurs exec sauf si `--allow-exec` est défini.

    Pour les détails stricts du contrat cible/chemin et les règles exactes de rejet, voir [Contrat de plan Secrets Apply](/fr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Politique de sécurité unidirectionnelle

<Warning>
OpenClaw n’écrit volontairement pas de sauvegardes de restauration contenant des valeurs de secrets en clair historiques.
</Warning>

Modèle de sécurité :

- la prévalidation doit réussir avant le mode écriture
- l’activation runtime est validée avant validation
- apply met à jour les fichiers à l’aide d’un remplacement atomique de fichier et d’une restauration au mieux en cas d’échec

## Notes de compatibilité d’authentification héritée

Pour les identifiants statiques, le runtime ne dépend plus du stockage d’authentification hérité en clair.

- La source des identifiants runtime est l’instantané résolu en mémoire.
- Les entrées statiques héritées `api_key` sont nettoyées lorsqu’elles sont découvertes.
- Le comportement de compatibilité lié à OAuth reste séparé.

## Remarque interface web

Certaines unions SecretInput sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Liens connexes

- [Authentification](/fr/gateway/authentication) — configuration de l’authentification
- [CLI : secrets](/fr/cli/secrets) — commandes CLI
- [Variables d’environnement](/fr/help/environment) — priorité des variables d’environnement
- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) — surface d’identifiants
- [Contrat de plan Secrets Apply](/fr/gateway/secrets-plan-contract) — détails du contrat de plan
- [Sécurité](/fr/gateway/security) — posture de sécurité
