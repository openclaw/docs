---
read_when:
    - Vous souhaitez vérifier les paramètres d’OpenClaw par rapport à un fichier policy.jsonc défini manuellement
    - Vous souhaitez que les problèmes de politique soient signalés par l’analyse de doctor
    - Vous avez besoin d’un hachage d’attestation de politique à titre de preuve d’audit.
summary: Référence de la CLI pour les contrôles de conformité de `openclaw policy`
title: Politique
x-i18n:
    generated_at: "2026-07-12T02:27:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` est fourni par le Plugin Policy intégré. Il constitue une couche de
conformité d’entreprise appliquée aux paramètres OpenClaw existants, et non un second
système de configuration. Vous définissez les exigences dans `policy.jsonc` ; OpenClaw
observe l’espace de travail actif comme élément de preuve ; la stratégie signale les
écarts au moyen de `doctor --lint`. La stratégie n’impose pas les appels d’outils et ne
réécrit pas le comportement d’exécution lors du traitement des requêtes ; elle
n’atteste pas non plus les magasins d’identifiants propres aux agents, tels que
`auth-profiles.json`.

La stratégie vérifie les canaux configurés, les serveurs MCP, les fournisseurs de
modèles, la posture réseau relative aux SSRF, les accès entrants et aux canaux,
l’exposition du Gateway et la posture des commandes des nœuds, l’accès des agents à
l’espace de travail, la posture du bac à sable, la posture de traitement des données,
la posture des fournisseurs de secrets et des profils d’authentification, ainsi que
les métadonnées des outils régis (`TOOLS.md`). Utilisez-la lorsqu’un espace de travail
nécessite une déclaration durable et vérifiable, telle que « Telegram ne doit pas être
activé » ou « les outils régis doivent déclarer des métadonnées de risque et de
propriétaire ». Si vous avez uniquement besoin d’un comportement local sans attestation
ni détection des écarts, la configuration ordinaire suffit.

## Démarrage rapide

```bash
openclaw plugins enable policy
```

Le Plugin reste activé même lorsque `policy.jsonc` est absent, afin que doctor puisse
signaler l’artefact manquant au lieu d’ignorer silencieusement les vérifications.

Rédigez `policy.jsonc` manuellement ; il n’est pas généré à partir des paramètres
actuels. Chaque section de premier niveau constitue un espace de noms de règles :
une vérification ne s’exécute que lorsqu’une règle concrète y est présente (les
sections ou clés non prises en charge échouent avec
`policy/policy-jsonc-invalid` au lieu d’être ignorées silencieusement). Exemple
minimal couvrant toutes les sections prises en charge :

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Remarques transversales qui ne ressortent pas clairement des tableaux de règles
ci-dessous :

- Omettre `gateway.bind` tout en interdisant les liaisons hors local loopback
  signifie que vous acceptez la valeur par défaut à l’exécution ; définissez
  `gateway.bind: "loopback"` pour une conformité stricte.
- Pour un agent en lecture seule, définissez le `mode` du bac à sable sur `all`
  ou `non-main` dans les valeurs par défaut ou l’agent concerné, et
  `workspaceAccess` sur `none` ou `ro`. Un mode de bac à sable absent ou défini
  sur `off` ne satisfait pas une stratégie de lecture seule.
- `agents.workspace.denyTools` accepte `exec`, `process`, `write`, `edit`,
  `apply_patch`. Les groupes de refus d’outils de la configuration `group:fs`
  (modification de fichiers) et `group:runtime` (shell/processus) satisfont la
  posture équivalente.
- Les vérifications d’approbation d’exécution lisent l’artefact actif
  `exec-approvals.json` uniquement lorsqu’une règle `execApprovals` est
  présente ; un artefact absent ou non valide constitue une preuve non
  observable, et non une réussite synthétique.
- Les éléments de preuve relatifs aux secrets et aux profils d’authentification
  enregistrent uniquement la posture du fournisseur ou de la source ainsi que
  les métadonnées SecretRef, jamais les valeurs brutes. La stratégie ne lit ni
  n’atteste les magasins d’identifiants propres aux agents, tels que
  `auth-profiles.json`.
- Les éléments de preuve relatifs au traitement des données portent uniquement
  sur la posture au niveau de la configuration (mode de masquage, option de
  capture de télémétrie, mode de maintenance des sessions, paramètre
  d’indexation des transcriptions). Ils n’inspectent ni les journaux, ni les
  exportations de télémétrie, ni les transcriptions, ni les fichiers de mémoire,
  et un résultat conforme ne prouve pas qu’ils ne contiennent aucune donnée
  personnelle ni aucun secret.

### Référence des règles de stratégie

Toutes les règles ci-dessous sont facultatives ; une vérification ne s’exécute
que lorsque la règle est présente. L’état observé correspond à la configuration
OpenClaw existante ou aux métadonnées de l’espace de travail.

#### Superpositions ciblées

Utilisez `scopes.<scopeName>` lorsque certains agents ou canaux nécessitent une
stratégie plus stricte que la référence de premier niveau. Le nom de la portée
est uniquement une étiquette ; la correspondance utilise le sélecteur situé
dans la portée. Les superpositions sont cumulatives : la règle globale
s’exécute toujours, et la règle ciblée peut ajouter son propre constat à partir
des mêmes éléments de preuve.

| Sélecteur    | Sections prises en charge                                                        | Cas d’utilisation                                             |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Un ou plusieurs agents d’exécution nécessitent des règles plus strictes. |
| `channelIds` | `ingress.channels`                                                              | Un ou plusieurs canaux nécessitent des règles d’accès entrant plus strictes. |

Si une entrée `agentIds` n’est pas présente dans `agents.list[]`, OpenClaw
évalue la règle ciblée par rapport à la posture globale ou par défaut héritée
pour cet identifiant d’agent d’exécution, au lieu de l’ignorer.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Un même agent peut apparaître dans plusieurs portées si chacune régit un champ
différent, comme ci-dessus. Un champ ciblé répété pour le même agent doit être
aussi restrictif ou plus restrictif ; une déclaration dupliquée moins stricte
est rejetée (les listes d’autorisation sont des sous-ensembles, les listes de
refus sont des surensembles et les valeurs booléennes requises sont fixes).

Les règles de posture des conteneurs (`sandbox.containers.*`) sont vérifiées
uniquement par rapport aux éléments de preuve que le moteur de bac à sable de
l’agent correspondant peut exposer. Si un moteur ne peut pas observer une règle
que vous avez activée pour lui, la stratégie signale
`policy/sandbox-container-posture-unobservable` au lieu de la considérer comme
satisfaite ; limitez les règles de conteneur aux groupes d’agents qui utilisent
un moteur capable de les exposer.

La règle de premier niveau `ingress.session.requireDmScope` reste globale ;
`session.dmScope` ne constitue pas un élément de preuve attribuable à un canal
et ne peut donc pas être ciblé par `channelIds`.

Chaque portée présente dans `policy.jsonc` doit être valide et applicable.

#### Canaux

| Champ de stratégie                    | État observé                            | Cas d’utilisation                                             |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `channels.denyRules[].when.provider`  | Fournisseur `channels.*` et état activé | Interdire les canaux configurés provenant d’un fournisseur tel que `telegram`. |
| `channels.denyRules[].reason`         | Message du constat et contexte du conseil de correction | Expliquer pourquoi le fournisseur est interdit. |

#### Serveurs MCP

| Champ de stratégie   | État observé          | Cas d’utilisation                                             |
| -------------------- | --------------------- | ------------------------------------------------------------- |
| `mcp.servers.allow`  | Identifiants `mcp.servers.*` | Exiger que chaque serveur MCP configuré figure dans une liste d’autorisation. |
| `mcp.servers.deny`   | Identifiants `mcp.servers.*` | Interdire certains identifiants de serveurs MCP configurés.   |

#### Fournisseurs de modèles

| Champ de stratégie        | État observé                                      | Cas d’utilisation                                                               |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `models.providers.allow`  | Identifiants `models.providers.*` et références des modèles sélectionnés | Exiger que les fournisseurs configurés et les références des modèles sélectionnés utilisent des fournisseurs approuvés. |
| `models.providers.deny`   | Identifiants `models.providers.*` et références des modèles sélectionnés | Interdire les fournisseurs configurés et les références des modèles sélectionnés selon l’identifiant du fournisseur. |

#### Réseau

| Champ de stratégie                 | État observé                                  | Cas d’utilisation                                                        |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `network.privateNetwork.allow`     | Échappatoires SSRF vers le réseau privé       | Définir sur `false` pour exiger que l’accès au réseau privé reste désactivé. |

#### Accès entrant et accès aux canaux

| Champ de stratégie                       | État observé                                                  | À utiliser pour                                                                 |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                             | Exiger une portée d’isolation des messages directs ayant fait l’objet d’un examen. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` et anciens champs de stratégie de messages directs des canaux | Autoriser uniquement les stratégies de canal de messages directs ayant fait l’objet d’un examen. |
| `ingress.channels.denyOpenGroups`         | Stratégie d’entrée des canaux, comptes et groupes             | Refuser l’entrée de groupes ouverts pour les canaux et comptes configurés.      |
| `ingress.channels.requireMentionInGroups` | Configuration des contrôles de mention des canaux, comptes, groupes, serveurs et niveaux imbriqués | Exiger des contrôles de mention lorsque l’entrée de groupe est ouverte ou soumise à une mention. |

#### Gateway

| Champ de stratégie                      | État observé                                                   | À utiliser pour                                                                     |
| --------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                                 | Définir sur `false` pour exiger que le Gateway soit lié à l’interface de bouclage.  |
| `gateway.exposure.allowTailscaleFunnel` | Configuration d’exposition serve/funnel du Gateway via Tailscale | Définir sur `false` pour refuser l’exposition par Tailscale Funnel.                 |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                            | Définir sur `true` pour refuser la désactivation de l’authentification du Gateway.  |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                                       | Définir sur `true` pour exiger une configuration explicite de limitation du débit d’authentification. |
| `gateway.controlUi.allowInsecure`       | Options non sécurisées d’authentification, d’appareil et d’origine de l’interface de contrôle | Définir sur `false` pour refuser les options d’exposition non sécurisée de l’interface de contrôle. |
| `gateway.remote.allow`                  | Mode et configuration du Gateway distant                      | Définir sur `false` pour refuser le mode Gateway distant.                           |
| `gateway.http.denyEndpoints`            | Points de terminaison de l’API HTTP du Gateway                 | Refuser des identifiants de points de terminaison tels que `chatCompletions` ou `responses`. |
| `gateway.http.requireUrlAllowlists`     | Entrées de récupération d’URL HTTP du Gateway                  | Définir sur `true` pour exiger des listes d’URL autorisées pour les entrées de récupération d’URL. |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                                   | Exiger que des identifiants exacts de commandes de nœud tels que `system.run` soient refusés dans la configuration OpenClaw. |

`gateway.nodes.denyCommands` est une règle de sur-ensemble de refus exacte et sensible à la casse.
Utilisez-la lorsque la stratégie doit prouver que les commandes privilégiées de nœud sont explicitement
refusées par la configuration OpenClaw. Un déploiement qui autorise intentionnellement une commande
privilégiée de nœud doit mettre à jour `policy.jsonc` après examen au lieu de s’appuyer uniquement sur
`gateway.nodes.allowCommands`.

#### Espace de travail de l’agent

| Champ de stratégie                | État observé                                                                          | À utiliser pour                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` et `agents.list[].sandbox.workspaceAccess` | Autoriser uniquement les valeurs d’accès de l’espace de travail du bac à sable telles que `none` ou `ro`. |
| `agents.workspace.denyTools`     | Configuration globale et par agent de refus des outils                                | Exiger le refus des outils de modification (`exec`, `process`, `write`, `edit`, `apply_patch`). |

#### Configuration de sécurité du bac à sable

| Champ de stratégie                                   | État observé                                           | À utiliser pour                                                         |
| ---------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` et mode par agent       | Autoriser uniquement les modes de bac à sable examinés tels que `all` ou `non-main`. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` et moteur par agent  | Autoriser uniquement les moteurs de bac à sable examinés tels que `docker`. |
| `sandbox.containers.denyHostNetwork`                 | Mode réseau du bac à sable ou navigateur fondé sur des conteneurs | Refuser le mode réseau de l’hôte.                                       |
| `sandbox.containers.denyContainerNamespaceJoin`      | Mode réseau du bac à sable ou navigateur fondé sur des conteneurs | Refuser de rejoindre l’espace de noms réseau d’un autre conteneur.      |
| `sandbox.containers.requireReadOnlyMounts`           | Mode de montage du bac à sable ou navigateur fondé sur des conteneurs | Exiger des montages en lecture seule.                                   |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Cibles de montage du bac à sable ou navigateur fondé sur des conteneurs | Refuser les montages de sockets d’exécution de conteneurs.              |
| `sandbox.containers.denyUnconfinedProfiles`          | Configuration des profils de sécurité des conteneurs   | Refuser les profils de sécurité de conteneur non confinés.              |
| `sandbox.browser.requireCdpSourceRange`              | Plage source CDP du navigateur du bac à sable          | Exiger que l’exposition CDP du navigateur déclare une plage source.     |

La stratégie considère un `sandbox.mode` absent comme sa valeur implicite par défaut `off`. Ainsi,
`sandbox.requireMode` signale qu’un bac à sable nouveau ou non configuré ne figure pas dans une
liste d’autorisation telle que `["all"]`.

#### Traitement des données

| Champ de stratégie                                  | État observé                                                                        | À utiliser pour                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                           | Définir sur `true` pour refuser `logging.redactSensitive: "off"`.             |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                   | Définir sur `true` pour refuser la capture de contenu par la télémétrie.      |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                          | Définir sur `true` pour exiger le mode effectif de maintenance de session `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` et `agents.*.memorySearch.experimental.sessionMemory` | Définir sur `true` pour refuser l’indexation des transcriptions de session dans la mémoire. |

#### Secrets

| Champ de stratégie                | État observé                                            | À utiliser pour                                                                 |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Références SecretRef de la configuration et déclarations `secrets.providers.*` | Définir sur `true` pour exiger que les références SecretRef pointent vers des fournisseurs déclarés. |
| `secrets.denySources`             | Sources des fournisseurs de secrets et des références SecretRef | Refuser des sources telles que `exec`, `file` ou un autre nom de source configuré. |
| `secrets.allowInsecureProviders`  | Indicateurs de configuration non sécurisée des fournisseurs de secrets | Définir sur `false` pour refuser les fournisseurs qui optent pour une configuration non sécurisée. |

#### Approbations d’exécution

Les vérifications des approbations d’exécution lisent l’artefact d’exécution `exec-approvals.json` :
`~/.openclaw/exec-approvals.json` par défaut, ou
`$OPENCLAW_STATE_DIR/exec-approvals.json` lorsque `OPENCLAW_STATE_DIR` est défini.
Les règles de configuration sous `execApprovals.defaults.*` ou `execApprovals.agents.*`
exigent des preuves lisibles provenant de l’artefact ; un artefact absent ou non valide est signalé
comme une preuve non observable plutôt que comme une validation au mieux. Une fois l’artefact lisible,
les champs omis héritent des valeurs d’exécution par défaut : une valeur `defaults.security` absente vaut `full`,
et la sécurité d’un agent absente hérite de cette valeur par défaut. Les preuves comprennent `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, l’éventuel `argPattern`, la configuration effective
d’`autoAllowSkills` et la source de l’entrée — jamais le chemin ou le jeton du socket,
`commandText`, `lastUsedCommand`, les chemins résolus ni les horodatages.

| Champ de stratégie                            | État observé                                                                          | À utiliser pour                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                   | Chemin actif d’exécution de `exec-approvals.json`                                     | Définir sur `true` pour exiger que l’artefact d’approbations existe et puisse être analysé. |
| `execApprovals.defaults.allowSecurity`        | `defaults.security`, avec `full` comme valeur par défaut                              | Autoriser uniquement les modes de sécurité d’approbation par défaut approuvés.         |
| `execApprovals.agents.allowSecurity`          | `agents.*.security`, héritant des valeurs par défaut                                  | Autoriser uniquement les modes de sécurité d’approbation effectifs approuvés par agent. |
| `execApprovals.agents.allowAutoAllowSkills`   | `defaults.autoAllowSkills` et `agents.*.autoAllowSkills`, héritant des valeurs d’exécution par défaut | Définir sur `false` pour exiger des listes d’autorisation manuelles strictes sans approbation implicite de la CLI des Skills. |
| `execApprovals.agents.allowlist.expected`     | Ensemble des entrées de motif `agents.*.allowlist[]` et des entrées facultatives `argPattern` | Exiger que la liste d’autorisation des approbations corresponde à l’ensemble de motifs examiné. |

Exemple : exiger l’artefact d’approbations, refuser les valeurs par défaut permissives et autoriser
uniquement la configuration d’approbation d’exécution examinée pour les agents sélectionnés.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Modes de sécurité : "deny", "allowlist" ou "full".
      // Cette valeur par défaut autorise uniquement la posture restrictive "deny".
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Les agents sélectionnés peuvent utiliser la posture "allowlist" examinée, mais pas "full".
          "allowSecurity": ["allowlist"],
          // false signifie que les CLI des Skills doivent figurer dans la liste d’autorisation examinée au lieu
          // d’être implicitement approuvées par autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Entrée simple : motif exact d’exécutable examiné, sans argPattern.
              "travel-hub",
              // Entrée contrainte : motif accompagné d’une expression régulière d’arguments examinée.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Profils d’authentification

| Champ de politique              | État observé                                 | Utilisation                                                                                |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Métadonnées de fournisseur et de mode de `auth.profiles.*` | Exiger des clés de métadonnées telles que `provider` et `mode` sur les profils d’authentification de la configuration. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Autoriser uniquement les modes de profil d’authentification pris en charge, tels que `api_key`, `aws-sdk`, `oauth` ou `token`. |

#### Métadonnées des outils

| Champ de politique      | État observé                    | Utilisation                                                                                |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Déclarations `TOOLS.md` régies  | Exiger que les outils régis déclarent des clés de métadonnées telles que `risk`, `sensitivity` ou `owner`. |

#### Posture des outils

| Champ de politique              | État observé                                               | Utilisation                                                                                              |
| ------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` et `agents.list[].tools.profile`           | Autoriser uniquement les identifiants de profil d’outil tels que `minimal`, `messaging` ou `coding`.     |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` et remplacements `tools.fs` propres à chaque agent | Définir sur `true` pour exiger une posture des outils de système de fichiers limitée à l’espace de travail. |
| `tools.exec.allowSecurity`      | `tools.exec.security` et sécurité d’exécution propre à chaque agent | Autoriser uniquement les modes de sécurité d’exécution tels que `deny` ou `allowlist`.                   |
| `tools.exec.requireAsk`         | `tools.exec.ask` et mode de demande d’exécution propre à chaque agent | Exiger une posture d’approbation telle que `always`.                                                     |
| `tools.exec.allowHosts`         | `tools.exec.host` et routage de l’hôte d’exécution propre à chaque agent | Autoriser uniquement les modes de routage de l’hôte d’exécution tels que `sandbox`.                      |
| `tools.elevated.allow`          | `tools.elevated.enabled` et posture élevée propre à chaque agent | Définir sur `false` pour exiger que le mode élevé des outils reste désactivé.                            |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` et `tools.alsoAllow` propre à chaque agent | Exiger des entrées `alsoAllow` exactes et signaler les autorisations d’outils supplémentaires manquantes ou inattendues. |
| `tools.denyTools`               | `tools.deny` et `agents.list[].tools.deny`                 | Exiger que les listes configurées de refus d’outils incluent des identifiants ou groupes d’outils tels que `group:runtime` et `group:fs`. |

## Exécuter les vérifications

Exécutez uniquement les vérifications de politique pendant la rédaction :

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` exécute uniquement l’ensemble des vérifications de politique et produit les éléments de preuve, les constats
et les empreintes d’attestation. Les mêmes constats apparaissent également dans
`openclaw doctor --lint` lorsque le Plugin Policy est activé.

Comparez un fichier de politique d’opérateur à une référence rédigée :

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` vérifie la syntaxe d’un fichier de politique par rapport à celle d’un autre fichier de politique ; il
n’inspecte pas l’état d’exécution, les éléments de preuve, les identifiants d’accès ni les secrets. Il utilise les mêmes
métadonnées de règles que celles qui régissent les superpositions délimitées : les listes d’autorisation doivent rester identiques ou
plus restrictives, les listes de refus doivent rester identiques ou plus larges, les booléens obligatoires doivent conserver
leur valeur, les chaînes ordonnées ne peuvent évoluer que vers l’extrémité la plus stricte de
l’ordre configuré, et les listes exactes doivent correspondre. La référence peut être une
politique rédigée par l’organisation ; la politique vérifiée peut ajouter des valeurs plus strictes ou
des règles supplémentaires. Une règle vérifiée de premier niveau peut satisfaire une règle de référence délimitée lorsqu’elle
est aussi restrictive ou plus restrictive. Les noms de portées n’ont pas besoin de correspondre entre
les fichiers ; la comparaison utilise le sélecteur (`agentIds`/`channelIds`) et le champ comme clés.

Comparaison sans constat (`--json`) :

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Une sortie sans constat de `policy check --json` inclut des empreintes stables qu’un opérateur ou
un superviseur peut enregistrer :

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Configurer la politique

La configuration de la politique se trouve sous `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Paramètre                 | Objectif                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| `enabled`                 | Activer les vérifications de politique même avant l’existence de `policy.jsonc`. |
| `workspaceRepairs`        | Autoriser `doctor --fix` à modifier les paramètres de l’espace de travail gérés par la politique. |
| `expectedHash`            | Verrouillage facultatif par empreinte de l’artefact de politique approuvé. |
| `expectedAttestationHash` | Verrouillage facultatif par empreinte de la dernière vérification de politique sans constat acceptée. |
| `path`                    | Emplacement de l’artefact de politique relatif à l’espace de travail.     |

Définissez `plugins.entries.policy.config.enabled` sur `false` pour désactiver les vérifications de
politique d’un espace de travail tout en laissant le Plugin installé.

## Accepter l’état de la politique

Exemple de sortie JSON :

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` identifie l’artefact de règles rédigé. `evidence`
enregistre l’état OpenClaw observé utilisé par les vérifications, et
`workspace.hash` identifie cette charge utile de preuve. `findingsHash` identifie
l’ensemble exact des constats. `checkedAt` enregistre la date d’exécution de la vérification.
`attestationHash` identifie l’affirmation stable (empreinte de la politique, empreinte des preuves,
empreinte des constats et état sans constat/avec constats) et exclut délibérément `checkedAt`,
de sorte qu’un même état de politique produit toujours la même empreinte d’attestation. Ensemble,
ces quatre valeurs forment le tuple d’audit d’une vérification de politique.

Si un Gateway ou un superviseur utilise la politique pour bloquer, approuver ou annoter une
action d’exécution, il doit enregistrer l’empreinte d’attestation de la dernière vérification
sans constat. `checkedAt` reste dans la sortie JSON pour les journaux d’audit, mais ne fait pas partie de
l’empreinte stable.

Cycle de vie de l’acceptation de l’état de la politique :

1. Rédigez ou examinez `policy.jsonc`.
2. Exécutez `openclaw policy check --json`.
3. En l’absence de constat, enregistrez `attestation.policy.hash` comme `expectedHash`.
4. Enregistrez `attestation.attestationHash` comme `expectedAttestationHash`.
5. Réexécutez `openclaw doctor --lint` dans les contrôles de CI ou de publication.

Si les règles de politique changent intentionnellement, mettez à jour les deux hachages acceptés à partir d’une vérification propre. Si seuls les paramètres de l’espace de travail changent (la politique reste identique), seul `expectedAttestationHash` change généralement.

L’activation ou la mise à niveau des règles `agents.workspace` ajoute des éléments de preuve `agentWorkspace` au hachage de l’espace de travail et au hachage d’attestation ; examinez les nouveaux éléments de preuve et actualisez les hachages d’attestation acceptés après l’activation. L’activation ou la mise à niveau des règles de posture des outils ajoute de la même manière des éléments de preuve `toolPosture`.

`openclaw policy watch` réexécute la vérification et signale lorsque les éléments de preuve actuels ne correspondent plus à `expectedAttestationHash` :

```bash
openclaw policy watch --json
```

Utilisez `--once` dans la CI ou dans les scripts nécessitant une seule évaluation de dérive. Sans `--once`, la commande interroge par défaut toutes les deux secondes ; utilisez `--interval-ms` pour modifier l’intervalle.

## Constats

| Identifiant de vérification                              | Constat                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La politique est activée, mais `policy.jsonc` est absent.                         |
| `policy/policy-jsonc-invalid`                            | La politique ne peut pas être analysée ou contient des entrées de règles mal formées. |
| `policy/policy-hash-mismatch`                            | La politique ne correspond pas à la valeur `expectedHash` configurée.             |
| `policy/attestation-hash-mismatch`                       | Les éléments de preuve actuels de la politique ne correspondent plus à l’attestation acceptée. |
| `policy/policy-conformance-invalid`                      | Un fichier de politique de référence ou vérifié contient une syntaxe de comparaison non valide. |
| `policy/policy-conformance-missing`                      | Il manque dans un fichier de politique vérifié une règle requise par le fichier de politique de référence. |
| `policy/policy-conformance-weaker`                       | Un fichier de politique vérifié contient une valeur moins stricte que celle du fichier de politique de référence. |
| `policy/channels-denied-provider`                        | Un canal activé correspond à une règle d’interdiction de canal.                   |
| `policy/mcp-denied-server`                               | Un serveur MCP configuré est interdit par la politique.                           |
| `policy/mcp-unapproved-server`                           | Un serveur MCP configuré ne figure pas dans la liste d’autorisation.              |
| `policy/models-denied-provider`                          | Un fournisseur de modèles configuré ou une référence de modèle utilise un fournisseur interdit. |
| `policy/models-unapproved-provider`                      | Un fournisseur de modèles configuré ou une référence de modèle ne figure pas dans la liste d’autorisation. |
| `policy/network-private-access-enabled`                  | Un mécanisme de contournement SSRF pour les réseaux privés est activé alors que la politique l’interdit. |
| `policy/ingress-dm-policy-unapproved`                    | Une politique de messages privés d’un canal ne figure pas dans la liste d’autorisation de la politique. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` ne correspond pas à la portée d’isolation des messages privés exigée par la politique. |
| `policy/ingress-open-groups-denied`                      | Une politique de groupe d’un canal est définie sur `open` alors que la politique interdit les entrées de groupes ouverts. |
| `policy/ingress-group-mention-required`                  | Une entrée de canal ou de groupe désactive les contrôles de mention alors que la politique les exige. |
| `policy/gateway-non-loopback-bind`                       | La posture de liaison du Gateway autorise une exposition hors de local loopback alors que la politique l’interdit. |
| `policy/gateway-auth-disabled`                           | L’authentification du Gateway est désactivée alors que la politique l’exige.       |
| `policy/gateway-rate-limit-missing`                      | La posture de limitation du débit d’authentification du Gateway n’est pas explicite alors que la politique l’exige. |
| `policy/gateway-control-ui-insecure`                     | Les options d’exposition non sécurisée de l’interface de contrôle du Gateway sont activées. |
| `policy/gateway-tailscale-funnel`                        | L’exposition du Gateway par Tailscale Funnel est activée alors que la politique l’interdit. |
| `policy/gateway-remote-enabled`                          | Le mode distant du Gateway est actif alors que la politique l’interdit.           |
| `policy/gateway-http-endpoint-enabled`                   | Un point de terminaison de l’API HTTP du Gateway est activé alors que la politique l’interdit. |
| `policy/gateway-http-url-fetch-unrestricted`             | L’entrée de récupération d’URL HTTP du Gateway ne dispose pas de la liste d’autorisation d’URL requise. |
| `policy/gateway-node-command-denied`                     | Une commande Node interdite par la politique ne l’est pas dans la configuration OpenClaw. |
| `policy/agents-workspace-access-denied`                  | Le mode de bac à sable de l’agent ou l’accès à l’espace de travail ne figure pas dans la liste d’autorisation de la politique. |
| `policy/agents-tool-not-denied`                          | La configuration d’un agent ou la configuration par défaut n’interdit pas un outil qui doit l’être selon la politique. |
| `policy/tools-profile-unapproved`                        | Un profil d’outils global ou propre à un agent ne figure pas dans la liste d’autorisation. |
| `policy/tools-fs-workspace-only-required`                | Les outils du système de fichiers ne sont pas configurés avec une posture limitant les chemins à l’espace de travail. |
| `policy/tools-exec-security-unapproved`                  | Le mode de sécurité d’exécution ne figure pas dans la liste d’autorisation de la politique. |
| `policy/tools-exec-ask-unapproved`                       | Le mode de demande d’exécution ne figure pas dans la liste d’autorisation de la politique. |
| `policy/tools-exec-host-unapproved`                      | Le routage de l’hôte d’exécution ne figure pas dans la liste d’autorisation de la politique. |
| `policy/tools-elevated-enabled`                          | Le mode privilégié des outils est activé alors que la politique l’interdit.       |
| `policy/tools-also-allow-missing`                        | Il manque dans une liste `alsoAllow` configurée une entrée requise par la politique. |
| `policy/tools-also-allow-unexpected`                     | Une liste `alsoAllow` configurée comprend une entrée non prévue par la politique. |
| `policy/tools-required-deny-missing`                     | Une liste globale ou propre à un agent d’outils interdits ne comprend pas un outil qui doit l’être. |
| `policy/sandbox-mode-unapproved`                         | Le mode de bac à sable ne figure pas dans la liste d’autorisation de la politique. |
| `policy/sandbox-backend-unapproved`                      | Le moteur de bac à sable ne figure pas dans la liste d’autorisation de la politique. |
| `policy/sandbox-container-posture-unobservable`          | Une règle de posture de conteneur est activée pour un moteur qui ne peut pas l’observer. |
| `policy/sandbox-container-host-network-denied`           | Un bac à sable ou un navigateur reposant sur un conteneur utilise le mode réseau de l’hôte. |
| `policy/sandbox-container-namespace-join-denied`         | Un bac à sable ou un navigateur reposant sur un conteneur rejoint l’espace de noms d’un autre conteneur. |
| `policy/sandbox-container-mount-mode-required`           | Un montage de bac à sable ou de navigateur reposant sur un conteneur n’est pas en lecture seule. |
| `policy/sandbox-container-runtime-socket-mount`          | Un montage de bac à sable ou de navigateur reposant sur un conteneur expose le socket du moteur d’exécution de conteneurs. |
| `policy/sandbox-container-unconfined-profile`            | Le profil du bac à sable de conteneur est sans confinement alors que la politique l’interdit. |
| `policy/sandbox-browser-cdp-source-range-missing`        | Il manque la plage source CDP du navigateur en bac à sable alors que la politique en exige une. |
| `policy/data-handling-redaction-disabled`                | La censure des données sensibles dans les journaux est désactivée alors que la politique l’exige. |
| `policy/data-handling-telemetry-content-capture`         | La capture du contenu de télémétrie est activée alors que la politique l’interdit. |
| `policy/data-handling-session-retention-not-enforced`    | La maintenance de la conservation des sessions n’est pas appliquée alors que la politique l’exige. |
| `policy/data-handling-session-transcript-memory-enabled` | L’indexation en mémoire des transcriptions de session est activée alors que la politique l’interdit. |
| `policy/secrets-unmanaged-provider`                      | Une SecretRef de configuration référence un fournisseur non déclaré sous `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un fournisseur de secrets configuré ou une SecretRef utilise une source interdite par la politique. |
| `policy/secrets-insecure-provider`                       | Un fournisseur de secrets accepte une posture non sécurisée alors que la politique l’interdit. |
| `policy/auth-profile-invalid-metadata`                   | Il manque dans un profil d’authentification configuré des métadonnées valides de fournisseur ou de mode. |
| `policy/auth-profile-unapproved-mode`                    | Le mode d’un profil d’authentification configuré ne figure pas dans la liste d’autorisation de la politique. |
| `policy/exec-approvals-missing`                          | La politique exige `exec-approvals.json`, mais cet artefact est absent.            |
| `policy/exec-approvals-invalid`                          | L’artefact configuré d’approbations d’exécution ne peut pas être analysé.          |
| `policy/exec-approvals-default-security-unapproved`      | Les valeurs par défaut d’approbation d’exécution utilisent un mode de sécurité qui ne figure pas dans la liste d’autorisation de la politique. |
| `policy/exec-approvals-agent-security-unapproved`        | Le mode de sécurité effectif d’approbation d’exécution propre à un agent ne figure pas dans la liste d’autorisation. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agent d’approbation d’exécution autorise implicitement et automatiquement les CLI de Skills alors que la politique l’interdit. |
| `policy/exec-approvals-allowlist-missing`                | Il manque dans la liste d’autorisation des approbations un motif requis par la politique. |
| `policy/exec-approvals-allowlist-unexpected`             | La liste d’autorisation des approbations comprend un motif non prévu par la politique. |
| `policy/tools-missing-risk-level`                        | Il manque des métadonnées de risque dans une déclaration d’outil soumise à la gouvernance. |
| `policy/tools-unknown-risk-level`                        | Une déclaration d’outil soumise à la gouvernance utilise une valeur de risque inconnue. |
| `policy/tools-missing-sensitivity-token`                 | Il manque des métadonnées de sensibilité dans une déclaration d’outil soumise à la gouvernance. |
| `policy/tools-missing-owner`                             | Il manque des métadonnées de propriétaire dans une déclaration d’outil soumise à la gouvernance. |
| `policy/tools-unknown-sensitivity-token`                 | Une déclaration d’outil soumise à la gouvernance utilise une valeur de sensibilité inconnue. |

Un constat peut inclure à la fois `target` (l’élément observé dans l’espace de travail qui n’est pas conforme) et `requirement` (la règle définie qui a produit le constat). Ces deux champs sont actuellement des chaînes d’adresse `oc://`, mais leurs noms décrivent leur rôle dans la politique plutôt que le format de l’adresse.

Exemples de constats :

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Réparation

`doctor --lint` et `policy check` sont en lecture seule.

`doctor --fix` ne modifie les paramètres de l’espace de travail gérés par la politique que lorsque
`workspaceRepairs` est explicitement activé ; sinon, les vérifications indiquent ce qu’elles
répareraient et laissent les paramètres inchangés.

Dans cette version, la réparation peut désactiver les canaux interdits par `channels.denyRules` et
appliquer les réparations automatiques de restriction répertoriées ci-dessous. N’activez
`workspaceRepairs` qu’après avoir examiné le fichier de politique, car une règle valide peut modifier
la configuration de l’espace de travail :

- définir `tools.elevated.enabled=false` lorsqu’une politique globale interdit les outils à privilèges élevés
- ajouter les identifiants d’outils manquants dont l’interdiction est obligatoire à `tools.deny` ou
  `agents.list[].tools.deny` lorsque la politique exige que ces outils soient interdits
- définir les options non sécurisées `gateway.controlUi.*` sur `false`
- définir `gateway.mode=local` lorsque la politique interdit le mode Gateway distant
- définir sur `false` les chemins `gateway.http.endpoints.*.enabled` signalés lorsque la politique
  interdit les points de terminaison de l’API HTTP du Gateway
- définir sur `allowlist` les chemins `groupPolicy` signalés pour les entrées de canal lorsque la politique
  interdit les entrées de groupe ouvertes
- définir sur `true` les chemins `requireMention` signalés pour les entrées de canal lorsque la politique
  exige des mentions dans les groupes
- définir `logging.redactSensitive=tools` lorsque la politique exige le masquage des données sensibles
  dans les journaux
- définir `diagnostics.otel.captureContent=false`, ou
  `diagnostics.otel.captureContent.enabled=false` pour les paramètres de capture télémétrique
  sous forme d’objet, lorsque la politique interdit la capture du contenu télémétrique

Les réparations ciblées des outils à privilèges élevés sont uniquement détectées. Les réparations
ciblées du traitement des données sont également ignorées lorsque le constat signale une configuration
partagée de journalisation ou de télémétrie, car la modification du paramètre partagé affecterait
davantage que la cible de politique concernée.

Les réparations ciblées des interdictions obligatoires sont ignorées lorsque le constat signale un
`tools.deny` racine hérité, car l’ajout de l’outil requis à la configuration racine affecterait
davantage que la cible de politique concernée. Les réparations locales à un agent des interdictions
obligatoires peuvent mettre à jour le chemin `agents.list[].tools.deny` signalé.

Les réparations ciblées des entrées de canal sont ignorées lorsque le constat signale un
`channels.defaults.*` hérité, car la modification de la valeur par défaut partagée du canal affecterait
davantage que la cible de politique concernée. Les constats relatifs à la liste d’autorisation de
récupération d’URL HTTP du Gateway restent manuels, car la réparation automatique ne peut pas choisir
les valeurs correctes de la liste d’autorisation des URL de point de terminaison.

Les constats relatifs à la liaison et aux commandes de nœud du Gateway nécessitent toujours un examen. Lorsque
`policy/gateway-non-loopback-bind` ou `policy/gateway-node-command-denied`
peut être associé à un chemin de configuration, `doctor --fix` signale la modification proposée de
`gateway.bind` ou `gateway.nodes.denyCommands` comme un aperçu ignoré à titre indicatif.
Il n’applique pas la modification, et le constat n’est pas considéré comme réparé tant qu’un opérateur
n’a pas examiné et mis à jour la configuration ou la politique.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Codes de sortie

| Commande         | `0`                                                            | `1`                                                                          | `2`                                      |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| `policy check`   | Aucun constat n’atteint le seuil.                              | Un ou plusieurs constats ont atteint le seuil.                               | Échec d’un argument ou de l’exécution.   |
| `policy compare` | Le fichier de politique est au moins aussi strict que la base. | Le fichier de politique est invalide, absent ou moins strict que les règles de base. | Échec d’un argument ou de l’exécution.   |
| `policy watch`   | Aucun constat et le hachage accepté est à jour.                | Des constats existent ou l’attestation acceptée est obsolète.                | Échec d’un argument ou de l’exécution.   |

## Voir aussi

- [Mode de lint de Doctor](/fr/cli/doctor#lint-mode)
- [CLI des chemins](/fr/cli/path)
