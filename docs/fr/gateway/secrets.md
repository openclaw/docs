---
read_when:
    - Configuration des SecretRefs pour les identifiants des fournisseurs et les références `auth-profiles.json`
    - Exploiter en toute sécurité le rechargement, l’audit, la configuration et l’application des secrets en production
    - Comprendre l’échec rapide au démarrage, le filtrage des surfaces inactives et le comportement du dernier état connu comme fonctionnel
sidebarTitle: Secrets management
summary: 'Gestion des secrets : contrat SecretRef, comportement des instantanés d’exécution et nettoyage irréversible sécurisé'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-04-30T07:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw prend en charge les SecretRefs additives afin que les identifiants pris en charge n’aient pas besoin d’être stockés en clair dans la configuration.

<Note>
Le texte en clair fonctionne toujours. Les SecretRefs sont optionnelles pour chaque identifiant.
</Note>

## Objectifs et modèle d’exécution

Les secrets sont résolus dans un instantané d’exécution en mémoire.

- La résolution est effectuée de manière anticipée pendant l’activation, pas paresseusement sur les chemins de requête.
- Le démarrage échoue rapidement lorsqu’une SecretRef effectivement active ne peut pas être résolue.
- Le rechargement utilise un échange atomique : réussite complète, ou conservation du dernier instantané valide connu.
- Les violations de politique SecretRef (par exemple des profils d’authentification en mode OAuth combinés à une entrée SecretRef) font échouer l’activation avant l’échange d’exécution.
- Les requêtes d’exécution lisent uniquement l’instantané actif en mémoire.
- Après la première activation/charge de configuration réussie, les chemins de code d’exécution continuent à lire cet instantané actif en mémoire jusqu’à ce qu’un rechargement réussi le remplace.
- Les chemins de livraison sortants lisent également depuis cet instantané actif (par exemple la livraison de réponses/fils Discord et les envois d’actions Telegram) ; ils ne re-résolvent pas les SecretRefs à chaque envoi.

Cela maintient les pannes de fournisseurs de secrets hors des chemins de requête critiques.

## Filtrage des surfaces actives

Les SecretRefs sont validées uniquement sur les surfaces effectivement actives.

- Surfaces activées : les refs non résolues bloquent le démarrage/rechargement.
- Surfaces inactives : les refs non résolues ne bloquent pas le démarrage/rechargement.
- Les refs inactives émettent des diagnostics non fatals avec le code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Exemples de surfaces inactives">
    - Entrées de canal/compte désactivées.
    - Identifiants de canal de niveau supérieur dont aucun compte activé n’hérite.
    - Surfaces d’outil/fonctionnalité désactivées.
    - Clés propres au fournisseur de recherche Web qui ne sont pas sélectionnées par `tools.web.search.provider`. En mode automatique (fournisseur non défini), les clés sont consultées par ordre de priorité pour l’auto-détection du fournisseur jusqu’à ce qu’une clé soit résolue. Après la sélection, les clés des fournisseurs non sélectionnés sont traitées comme inactives jusqu’à ce qu’elles soient sélectionnées.
    - Le matériel d’authentification SSH du bac à sable (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus les remplacements par agent) n’est actif que lorsque le backend de bac à sable effectif est `ssh` pour l’agent par défaut ou un agent activé.
    - Les SecretRefs `gateway.remote.token` / `gateway.remote.password` sont actives si l’une de ces conditions est vraie :
      - `gateway.mode=remote`
      - `gateway.remote.url` est configuré
      - `gateway.tailscale.mode` vaut `serve` ou `funnel`
      - En mode local sans ces surfaces distantes :
        - `gateway.remote.token` est actif lorsque l’authentification par jeton peut prévaloir et qu’aucun jeton env/auth n’est configuré.
        - `gateway.remote.password` est actif uniquement lorsque l’authentification par mot de passe peut prévaloir et qu’aucun mot de passe env/auth n’est configuré.
    - La SecretRef `gateway.auth.token` est inactive pour la résolution de l’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée de jeton d’environnement prévaut pour cette exécution.

  </Accordion>
</AccordionGroup>

## Diagnostics de surface d’authentification du Gateway

Lorsqu’une SecretRef est configurée sur `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` ou `gateway.remote.password`, le démarrage/rechargement du Gateway journalise explicitement l’état de la surface :

- `active` : la SecretRef fait partie de la surface d’authentification effective et doit être résolue.
- `inactive` : la SecretRef est ignorée pour cette exécution, car une autre surface d’authentification prévaut, ou parce que l’authentification distante est désactivée/non active.

Ces entrées sont journalisées avec `SECRETS_GATEWAY_AUTH_SURFACE` et incluent la raison utilisée par la politique de surface active, afin que vous puissiez voir pourquoi un identifiant a été traité comme actif ou inactif.

## Prévalidation des références lors de l’onboarding

Lorsque l’onboarding s’exécute en mode interactif et que vous choisissez le stockage SecretRef, OpenClaw exécute une validation préalable avant l’enregistrement :

- Refs env : valide le nom de variable d’environnement et confirme qu’une valeur non vide est visible pendant la configuration.
- Refs de fournisseur (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Chemin de réutilisation quickstart : lorsque `gateway.auth.token` est déjà une SecretRef, l’onboarding la résout avant le bootstrap de la sonde/du tableau de bord (pour les refs `env`, `file` et `exec`) avec le même garde-fou d’échec rapide.

Si la validation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.

## Contrat SecretRef

Utilisez partout la même forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
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
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validation :

    - `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
    - `id` doit correspondre à `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` ne doit pas contenir `.` ou `..` comme segments de chemin délimités par des barres obliques (par exemple `a/../b` est rejeté)

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
    - Liste d’autorisation optionnelle via `allowlist`.
    - Les valeurs d’environnement manquantes/vides font échouer la résolution.

  </Accordion>
  <Accordion title="Fournisseur file">
    - Lit le fichier local depuis `path`.
    - `mode: "json"` attend une charge utile d’objet JSON et résout `id` comme pointeur.
    - `mode: "singleValue"` attend l’id de ref `"value"` et renvoie le contenu du fichier.
    - Le chemin doit réussir les vérifications de propriété/permissions.
    - Note d’échec fermé Windows : si la vérification ACL n’est pas disponible pour un chemin, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner les vérifications de sécurité du chemin.

  </Accordion>
  <Accordion title="Fournisseur exec">
    - Exécute le chemin binaire absolu configuré, sans shell.
    - Par défaut, `command` doit pointer vers un fichier régulier (pas un lien symbolique).
    - Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande en lien symbolique (par exemple les shims Homebrew). OpenClaw valide le chemin cible résolu.
    - Associez `allowSymlinkCommand` à `trustedDirs` pour les chemins de gestionnaires de paquets (par exemple `["/opt/homebrew"]`).
    - Prend en charge le délai d’expiration, le délai d’expiration sans sortie, les limites d’octets de sortie, la liste d’autorisation d’environnement et les répertoires de confiance.
    - Note d’échec fermé Windows : si la vérification ACL n’est pas disponible pour le chemin de commande, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur afin de contourner les vérifications de sécurité du chemin.

    Charge utile de requête (stdin) :

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Charge utile de réponse (stdout) :

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Erreurs optionnelles par id :

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
  <Accordion title="CLI HashiCorp Vault">
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

Les variables d’environnement du serveur MCP configurées via `plugins.entries.acpx.config.mcpServers` prennent en charge SecretInput. Cela évite de placer les clés API et les jetons dans la configuration en clair :

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

Les valeurs de chaîne en clair fonctionnent toujours. Les refs de modèle d’environnement comme `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus pendant l’activation du Gateway avant que le processus du serveur MCP ne soit lancé. Comme pour les autres surfaces SecretRef, les refs non résolues bloquent l’activation uniquement lorsque le Plugin `acpx` est effectivement actif.

## Matériel d’authentification SSH du bac à sable

Le backend de bac à sable `ssh` du cœur prend également en charge les SecretRefs pour le matériel d’authentification SSH :

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

Comportement d’exécution :

- OpenClaw résout ces références pendant l’activation du bac à sable, et non paresseusement lors de chaque appel SSH.
- Les valeurs résolues sont écrites dans des fichiers temporaires avec des permissions restrictives et utilisées dans la configuration SSH générée.
- Si le backend de bac à sable effectif n’est pas `ssh`, ces références restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants canoniques pris en charge et non pris en charge sont répertoriés dans :

- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)

<Note>
Les identifiants créés à l’exécution ou rotatifs et le matériel d’actualisation OAuth sont volontairement exclus de la résolution SecretRef en lecture seule.
</Note>

## Comportement requis et précédence

- Champ sans référence : inchangé.
- Champ avec référence : requis sur les surfaces actives pendant l’activation.
- Si du texte en clair et une référence sont tous deux présents, la référence a priorité sur les chemins de précédence pris en charge.
- La sentinelle de caviardage `__OPENCLAW_REDACTED__` est réservée au caviardage et à la restauration internes de la configuration, et est rejetée comme donnée de configuration littérale soumise.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement à l’exécution)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants `auth-profiles.json` ont priorité sur les références `openclaw.json`)

Comportement de compatibilité Google Chat :

- `serviceAccountRef` a priorité sur le `serviceAccount` en texte clair.
- La valeur en texte clair est ignorée lorsque la référence sœur est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute lors de :

- Démarrage (précontrôle puis activation finale)
- Chemin d’application à chaud du rechargement de configuration
- Chemin de vérification de redémarrage du rechargement de configuration
- Rechargement manuel via `secrets.reload`
- Précontrôle RPC d’écriture de configuration du Gateway (`config.set` / `config.apply` / `config.patch`) pour la résolubilité SecretRef de surface active dans la charge utile de configuration soumise avant la persistance des modifications

Contrat d’activation :

- Une réussite remplace l’instantané atomiquement.
- Un échec au démarrage interrompt le démarrage du Gateway.
- Un échec de rechargement à l’exécution conserve le dernier instantané valide connu.
- Un échec de précontrôle Write-RPC rejette la configuration soumise et laisse à la fois la configuration disque et l’instantané d’exécution actif inchangés.
- Fournir un jeton de canal explicite par appel à un appel d’assistant ou d’outil sortant ne déclenche pas l’activation SecretRef ; les points d’activation restent le démarrage, le rechargement et `secrets.reload` explicite.

## Signaux de dégradation et de récupération

Lorsque l’activation au moment du rechargement échoue après un état sain, OpenClaw entre dans un état de secrets dégradé.

Événement système unique et codes de journalisation :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- Dégradé : l’exécution conserve le dernier instantané valide connu.
- Récupéré : émis une seule fois après la prochaine activation réussie.
- Les échecs répétés alors que l’état est déjà dégradé journalisent des avertissements, mais ne saturent pas les événements.
- L’échec rapide au démarrage n’émet pas d’événements dégradés, car l’exécution n’est jamais devenue active.

## Résolution des chemins de commande

Les chemins de commande peuvent opter pour la résolution SecretRef prise en charge via la RPC d’instantané du Gateway.

Il existe deux grands comportements :

<Tabs>
  <Tab title="Chemins de commande stricts">
    Par exemple les chemins de mémoire distante `openclaw memory` et `openclaw qr --remote` lorsqu’ils nécessitent des références de secret partagé distant. Ils lisent depuis l’instantané actif et échouent rapidement lorsqu’un SecretRef requis est indisponible.
  </Tab>
  <Tab title="Chemins de commande en lecture seule">
    Par exemple `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, ainsi que les flux de doctor/config repair en lecture seule. Ils préfèrent aussi l’instantané actif, mais se dégradent au lieu d’abandonner lorsqu’un SecretRef ciblé est indisponible dans ce chemin de commande.

    Comportement en lecture seule :

    - Lorsque le Gateway est en cours d’exécution, ces commandes lisent d’abord depuis l’instantané actif.
    - Si la résolution du Gateway est incomplète ou si le Gateway est indisponible, elles tentent un repli local ciblé pour la surface de commande spécifique.
    - Si un SecretRef ciblé reste indisponible, la commande continue avec une sortie en lecture seule dégradée et des diagnostics explicites tels que « configuré mais indisponible dans ce chemin de commande ».
    - Ce comportement dégradé est uniquement local à la commande. Il n’affaiblit pas les chemins de démarrage, de rechargement, d’envoi ou d’authentification à l’exécution.

  </Tab>
</Tabs>

Autres notes :

- L’actualisation de l’instantané après rotation de secret backend est gérée par `openclaw secrets reload`.
- Méthode RPC du Gateway utilisée par ces chemins de commande : `secrets.resolve`.

## Workflow d’audit et de configuration

Flux opérateur par défaut :

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
  <Step title="Réauditer">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Les constats incluent :

    - valeurs en texte clair au repos (`openclaw.json`, `auth-profiles.json`, `.env` et `agents/*/agent/models.json` généré)
    - résidus d’en-têtes fournisseur sensibles en texte clair dans les entrées `models.json` générées
    - références non résolues
    - masquage par précédence (`auth-profiles.json` prioritaire sur les références `openclaw.json`)
    - résidus hérités (`auth.json`, rappels OAuth)

    Note d’exécution :

    - Par défaut, l’audit ignore les vérifications de résolubilité SecretRef exec afin d’éviter les effets de bord des commandes.
    - Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs exec pendant l’audit.

    Note sur les résidus d’en-têtes :

    - La détection des en-têtes fournisseur sensibles repose sur une heuristique de noms (noms et fragments courants d’en-têtes d’authentification ou d’identifiants tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Assistant interactif qui :

    - configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajouter/modifier/supprimer)
    - vous permet de sélectionner les champs pris en charge contenant des secrets dans `openclaw.json`, ainsi que `auth-profiles.json` pour une portée d’agent
    - peut créer un nouveau mappage `auth-profiles.json` directement dans le sélecteur de cible
    - capture les détails SecretRef (`source`, `provider`, `id`)
    - exécute une résolution de précontrôle
    - peut appliquer immédiatement

    Note d’exécution :

    - Le précontrôle ignore les vérifications SecretRef exec sauf si `--allow-exec` est défini.
    - Si vous appliquez directement depuis `configure --apply` et que le plan inclut des références/fournisseurs exec, gardez aussi `--allow-exec` défini pour l’étape d’application.

    Modes utiles :

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valeurs par défaut d’application de `configure` :

    - nettoyer les identifiants statiques correspondants de `auth-profiles.json` pour les fournisseurs ciblés
    - nettoyer les entrées `api_key` statiques héritées de `auth.json`
    - nettoyer les lignes de secrets connus correspondantes de `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Appliquer un plan enregistré :

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Note d’exécution :

    - dry-run ignore les vérifications exec sauf si `--allow-exec` est défini.
    - le mode écriture rejette les plans contenant des SecretRefs/fournisseurs exec sauf si `--allow-exec` est défini.

    Pour les détails stricts du contrat cible/chemin et les règles exactes de rejet, consultez [Contrat de plan Secrets Apply](/fr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Politique de sécurité à sens unique

<Warning>
OpenClaw n’écrit volontairement pas de sauvegardes de restauration contenant des valeurs secrètes historiques en texte clair.
</Warning>

Modèle de sécurité :

- le précontrôle doit réussir avant le mode écriture
- l’activation à l’exécution est validée avant la validation
- l’application met à jour les fichiers avec remplacement atomique et restauration au mieux en cas d’échec

## Notes de compatibilité de l’authentification héritée

Pour les identifiants statiques, l’exécution ne dépend plus du stockage d’authentification hérité en texte clair.

- La source des identifiants d’exécution est l’instantané en mémoire résolu.
- Les entrées `api_key` statiques héritées sont nettoyées lorsqu’elles sont découvertes.
- Le comportement de compatibilité lié à OAuth reste séparé.

## Note sur l’interface Web

Certaines unions SecretInput sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Associé

- [Authentification](/fr/gateway/authentication) — configuration de l’authentification
- [CLI : secrets](/fr/cli/secrets) — commandes CLI
- [Variables d’environnement](/fr/help/environment) — précédence de l’environnement
- [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface) — surface d’identifiants
- [Contrat de plan Secrets Apply](/fr/gateway/secrets-plan-contract) — détails du contrat de plan
- [Sécurité](/fr/gateway/security) — posture de sécurité
