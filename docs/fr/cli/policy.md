---
read_when:
    - Vous souhaitez vérifier les paramètres d’OpenClaw par rapport à un fichier policy.jsonc créé manuellement
    - Vous souhaitez que les problèmes de politique apparaissent dans l’analyse de doctor
    - Vous avez besoin d’un hachage d’attestation de politique comme preuve d’audit
summary: Référence de la CLI pour les contrôles de conformité `openclaw policy`
title: Politique
x-i18n:
    generated_at: "2026-07-12T15:09:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` est fourni par le Plugin Policy intégré. Il constitue une couche de
conformité d’entreprise appliquée aux paramètres OpenClaw existants, et non un second système
de configuration. Vous définissez les exigences dans `policy.jsonc` ; OpenClaw observe l’espace
de travail actif comme éléments probants ; la politique signale les écarts via `doctor --lint`. La politique
n’impose pas les appels d’outils et ne réécrit pas le comportement d’exécution au moment des requêtes,
et elle n’atteste pas les magasins d’identifiants propres aux agents tels que `auth-profiles.json`.

La politique vérifie les canaux configurés, les serveurs MCP, les fournisseurs de modèles, la
posture réseau contre les SSRF, l’accès entrant et aux canaux, l’exposition du Gateway et la posture
des commandes des Nodes, l’accès des agents à l’espace de travail, la posture du bac à sable, la posture
de traitement des données, la posture des fournisseurs de secrets et des profils d’authentification,
ainsi que les métadonnées des outils régis (`TOOLS.md`). Utilisez-la lorsqu’un espace de travail
nécessite une déclaration durable et vérifiable telle que « Telegram ne doit pas être activé » ou
« les outils régis doivent déclarer des métadonnées de risque et de propriétaire ». Si vous avez
seulement besoin d’un comportement local sans attestation ni détection des écarts, une configuration
ordinaire suffit.

## Démarrage rapide

```bash
openclaw plugins enable policy
```

Le Plugin reste activé même lorsque `policy.jsonc` est absent, afin que doctor puisse
signaler l’artefact manquant au lieu d’ignorer silencieusement les vérifications.

Rédigez `policy.jsonc` manuellement ; il n’est pas généré à partir des paramètres actuels. Chaque
section de premier niveau est un espace de noms de règles : une vérification ne s’exécute que lorsqu’une règle
concrète y figure (les sections ou clés non prises en charge échouent avec
`policy/policy-jsonc-invalid` au lieu d’être silencieusement ignorées). Exemple minimal
couvrant toutes les sections prises en charge :

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram n’est pas approuvé pour cet espace de travail.",
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

Remarques transversales qui ne ressortent pas clairement des tableaux de règles ci-dessous :

- Omettre `gateway.bind` tout en interdisant les liaisons autres que la boucle locale signifie que vous acceptez
  la valeur par défaut de l’exécution ; définissez `gateway.bind: "loopback"` pour une conformité stricte.
- Pour un agent en lecture seule, définissez le `mode` du bac à sable sur `all` ou `non-main` dans les
  valeurs par défaut ou l’agent concernés, et `workspaceAccess` sur `none` ou `ro`. Un mode de bac à sable
  absent ou défini sur `off` ne satisfait pas une politique de lecture seule.
- `agents.workspace.denyTools` accepte `exec`, `process`, `write`, `edit`,
  `apply_patch`. Les groupes de refus d’outils de configuration `group:fs` (modification de fichiers) et
  `group:runtime` (shell/processus) satisfont la posture équivalente.
- Les vérifications d’approbation d’exécution lisent l’artefact actif `exec-approvals.json` uniquement lorsqu’une
  règle `execApprovals` est présente ; un artefact absent ou non valide constitue un élément probant
  inobservable, et non une réussite synthétique.
- Les éléments probants relatifs aux secrets et aux profils d’authentification enregistrent uniquement la posture
  du fournisseur/de la source et les métadonnées SecretRef, jamais les valeurs brutes. La politique ne lit ni
  n’atteste les magasins d’identifiants propres aux agents tels que `auth-profiles.json`.
- Les éléments probants relatifs au traitement des données concernent uniquement la posture au niveau de la configuration
  (mode de masquage, option de capture de télémétrie, mode de maintenance des sessions, paramètre d’indexation
  des transcriptions). Ils n’inspectent pas les journaux, les exportations de télémétrie, les transcriptions ou
  les fichiers de mémoire, et un résultat conforme ne prouve pas qu’ils ne contiennent aucune donnée personnelle
  ni aucun secret.

### Référence des règles de politique

Chaque règle ci-dessous est facultative ; une vérification ne s’exécute que lorsque la règle est présente. L’état
observé correspond à la configuration OpenClaw existante ou aux métadonnées de l’espace de travail.

#### Superpositions délimitées

Utilisez `scopes.<scopeName>` lorsque des agents ou des canaux spécifiques nécessitent une politique
plus stricte que la référence de premier niveau. Le nom de la portée est simplement une étiquette ; la correspondance utilise le
sélecteur à l’intérieur de la portée. Les superpositions sont additives : la règle globale continue de s’exécuter,
et la règle délimitée peut ajouter son propre constat concernant les mêmes éléments probants.

| Sélecteur    | Sections prises en charge                                                        | À utiliser lorsque                                           |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Un ou plusieurs agents d’exécution nécessitent des règles plus strictes. |
| `channelIds` | `ingress.channels`                                                             | Un ou plusieurs canaux nécessitent des règles d’accès entrant plus strictes. |

Si une entrée `agentIds` n’est pas présente dans `agents.list[]`, OpenClaw évalue
la règle délimitée par rapport à la posture globale/par défaut héritée pour cet identifiant
d’agent d’exécution au lieu de l’ignorer.

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

Un même agent peut apparaître dans plusieurs portées si chacune régit un champ différent,
comme ci-dessus. Un champ délimité répété pour le même agent doit être aussi restrictif ou
plus restrictif ; une revendication dupliquée plus faible est rejetée (les listes d’autorisation sont
des sous-ensembles, les listes de refus sont des surensembles, les booléens requis sont fixes).

Les règles de posture des conteneurs (`sandbox.containers.*`) sont vérifiées uniquement par rapport aux
éléments probants que le moteur de bac à sable de l’agent correspondant peut exposer. Si un moteur ne peut pas
observer une règle que vous avez activée pour lui, la politique signale
`policy/sandbox-container-posture-unobservable` au lieu de réussir ; limitez les règles de conteneur
aux groupes d’agents qui utilisent un moteur capable de les exposer.

La règle de premier niveau `ingress.session.requireDmScope` reste globale ; `session.dmScope` ne constitue
pas un élément probant attribuable à un canal et ne peut donc pas être délimité par `channelIds`.

Chaque portée présente dans `policy.jsonc` doit être valide et applicable.

#### Canaux

| Champ de politique                     | État observé                            | À utiliser lorsque                                               |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Fournisseur et état d’activation de `channels.*` | Interdire les canaux configurés d’un fournisseur tel que `telegram`. |
| `channels.denyRules[].reason`        | Message du constat et contexte du conseil de correction | Expliquer pourquoi le fournisseur est interdit.               |

#### Serveurs MCP

| Champ de politique   | État observé        | À utiliser lorsque                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | Identifiants `mcp.servers.*` | Exiger que chaque serveur MCP configuré figure dans une liste d’autorisation. |
| `mcp.servers.deny`  | Identifiants `mcp.servers.*` | Interdire des identifiants précis de serveurs MCP configurés.            |

#### Fournisseurs de modèles

| Champ de politique        | État observé                                     | À utiliser lorsque                                                                  |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | Identifiants `models.providers.*` et références de modèles sélectionnées | Exiger que les fournisseurs configurés et les références de modèles sélectionnées utilisent des fournisseurs approuvés. |
| `models.providers.deny`  | Identifiants `models.providers.*` et références de modèles sélectionnées | Interdire les fournisseurs configurés et les références de modèles sélectionnées selon l’identifiant du fournisseur. |

#### Réseau

| Champ de politique             | État observé                        | À utiliser lorsque                                                     |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Échappatoires SSRF vers le réseau privé | Définir sur `false` pour exiger que l’accès au réseau privé reste désactivé. |

#### Accès entrant et accès aux canaux

| Champ de stratégie                         | État observé                                                   | À utiliser lorsque                                                         |
| ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`           | `session.dmScope`                                              | Exiger une portée d’isolation des messages directs ayant été examinée.     |
| `ingress.channels.allowDmPolicies`         | `channels.*.dmPolicy` et anciens champs de stratégie de messages directs des canaux | Autoriser uniquement les stratégies de messages directs des canaux ayant été examinées. |
| `ingress.channels.denyOpenGroups`          | Stratégie d’entrée des canaux, comptes et groupes              | Refuser l’entrée des groupes ouverts pour les canaux et comptes configurés. |
| `ingress.channels.requireMentionInGroups`  | Configuration des filtres de mention pour les canaux, comptes, groupes, serveurs et niveaux imbriqués | Exiger des filtres de mention lorsque l’entrée des groupes est ouverte ou soumise à une mention. |

#### Gateway

| Champ de stratégie                       | État observé                                             | À utiliser lorsque                                                                    |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind`  | `gateway.bind`                                           | Définir sur `false` pour exiger que le Gateway soit lié à l’interface de bouclage.    |
| `gateway.exposure.allowTailscaleFunnel`  | Configuration d’exposition serve/funnel du Gateway via Tailscale | Définir sur `false` pour refuser l’exposition par Tailscale Funnel.                   |
| `gateway.auth.requireAuth`               | `gateway.auth.mode`                                      | Définir sur `true` pour rejeter la désactivation de l’authentification du Gateway.    |
| `gateway.auth.requireExplicitRateLimit`  | `gateway.auth.rateLimit`                                 | Définir sur `true` pour exiger une configuration explicite de limitation du débit d’authentification. |
| `gateway.controlUi.allowInsecure`        | Options d’authentification, d’appareil ou d’origine non sécurisées de l’interface de contrôle | Définir sur `false` pour refuser les options d’exposition non sécurisée de l’interface de contrôle. |
| `gateway.remote.allow`                   | Mode/configuration du Gateway distant                    | Définir sur `false` pour refuser le mode Gateway distant.                             |
| `gateway.http.denyEndpoints`             | Points de terminaison de l’API HTTP du Gateway           | Refuser des identifiants de points de terminaison tels que `chatCompletions` ou `responses`. |
| `gateway.http.requireUrlAllowlists`      | Entrées de récupération d’URL HTTP du Gateway            | Définir sur `true` pour exiger des listes d’URL autorisées pour les entrées de récupération d’URL. |
| `gateway.nodes.denyCommands`             | `gateway.nodes.denyCommands`                             | Exiger que des identifiants exacts de commandes de Node tels que `system.run` soient refusés dans la configuration OpenClaw. |

`gateway.nodes.denyCommands` est une règle de sur-ensemble de refus exacte et sensible à la casse.
Utilisez-la lorsque la stratégie doit prouver que les commandes de Node privilégiées sont explicitement
refusées par la configuration OpenClaw. Un déploiement qui autorise intentionnellement une commande de
Node privilégiée doit mettre à jour `policy.jsonc` après examen au lieu de s’appuyer uniquement sur
`gateway.nodes.allowCommands`.

#### Espace de travail de l’agent

| Champ de stratégie                | État observé                                                                         | À utiliser lorsque                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess`  | `agents.defaults.sandbox.workspaceAccess` et `agents.list[].sandbox.workspaceAccess` | Autoriser uniquement les valeurs d’accès à l’espace de travail du bac à sable telles que `none` ou `ro`. |
| `agents.workspace.denyTools`      | Configuration globale et par agent du refus d’outils                                 | Exiger le refus des outils de modification (`exec`, `process`, `write`, `edit`, `apply_patch`). |

#### Configuration de sécurité du bac à sable

| Champ de stratégie                                    | État observé                                            | À utiliser lorsque                                                  |
| ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` et mode par agent        | Autoriser uniquement les modes de bac à sable examinés tels que `all` ou `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` et backend par agent  | Autoriser uniquement les backends de bac à sable examinés tels que `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Mode réseau du bac à sable/navigateur basé sur un conteneur | Refuser le mode réseau de l’hôte.                                   |
| `sandbox.containers.denyContainerNamespaceJoin`       | Mode réseau du bac à sable/navigateur basé sur un conteneur | Refuser de rejoindre l’espace de noms réseau d’un autre conteneur.  |
| `sandbox.containers.requireReadOnlyMounts`            | Mode de montage du bac à sable/navigateur basé sur un conteneur | Exiger que les montages soient en lecture seule.                    |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Cibles de montage du bac à sable/navigateur basé sur un conteneur | Refuser les montages de sockets d’exécution de conteneurs.          |
| `sandbox.containers.denyUnconfinedProfiles`           | Configuration des profils de sécurité des conteneurs    | Refuser les profils de sécurité de conteneurs non confinés.         |
| `sandbox.browser.requireCdpSourceRange`                | Plage source CDP du navigateur du bac à sable           | Exiger que l’exposition CDP du navigateur déclare une plage source. |

La stratégie considère l’absence de `sandbox.mode` comme sa valeur par défaut implicite `off`, de sorte que
`sandbox.requireMode` signale qu’un bac à sable nouvellement créé ou non configuré se trouve hors d’une
liste d’autorisation telle que `["all"]`.

#### Traitement des données

| Champ de stratégie                                  | État observé                                                                         | À utiliser lorsque                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Définissez sur `true` pour rejeter `logging.redactSensitive: "off"`.                 |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Définissez sur `true` pour rejeter la capture du contenu de télémétrie.              |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Définissez sur `true` pour exiger le mode effectif de maintenance de session `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` et `agents.*.memorySearch.experimental.sessionMemory`  | Définissez sur `true` pour rejeter l’indexation des transcriptions de session en mémoire. |

#### Secrets

| Champ de stratégie                 | État observé                                             | À utiliser lorsque                                                               |
| ---------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders`  | SecretRefs de configuration et déclarations `secrets.providers.*` | Définissez sur `true` pour exiger que les SecretRefs pointent vers des fournisseurs déclarés. |
| `secrets.denySources`              | Sources des fournisseurs de secrets et sources SecretRef | Refusez des sources telles que `exec`, `file` ou un autre nom de source configuré. |
| `secrets.allowInsecureProviders`   | Indicateurs de posture non sécurisée des fournisseurs de secrets | Définissez sur `false` pour rejeter les fournisseurs qui adoptent une posture non sécurisée. |

#### Approbations d’exécution

Les vérifications des approbations d’exécution lisent l’artefact d’exécution `exec-approvals.json` :
`~/.openclaw/exec-approvals.json` par défaut, ou
`$OPENCLAW_STATE_DIR/exec-approvals.json` lorsque `OPENCLAW_STATE_DIR` est défini.
Les règles de posture sous `execApprovals.defaults.*` ou `execApprovals.agents.*`
exigent des preuves lisibles provenant de l’artefact ; un artefact manquant ou non valide est signalé comme
une preuve non observable plutôt que comme une validation au mieux. Une fois l’artefact lisible, les champs omis
héritent des valeurs d’exécution par défaut : une valeur `defaults.security` manquante vaut `full`, et
une sécurité d’agent manquante hérite de cette valeur par défaut. Les preuves incluent `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, l’éventuel `argPattern`, la posture effective
`autoAllowSkills` et la source de l’entrée — jamais le chemin du socket/jeton,
`commandText`, `lastUsedCommand`, les chemins résolus ni les horodatages.

| Champ de stratégie                           | État observé                                                                           | À utiliser lorsque                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                  | Chemin actif d’exécution vers `exec-approvals.json`                                    | Définissez sur `true` pour exiger que l’artefact d’approbations existe et puisse être analysé. |
| `execApprovals.defaults.allowSecurity`       | `defaults.security`, avec `full` comme valeur par défaut                               | Autorisez uniquement les modes de sécurité d’approbation par défaut approuvés.               |
| `execApprovals.agents.allowSecurity`         | `agents.*.security`, héritant des valeurs par défaut                                   | Autorisez uniquement les modes effectifs de sécurité d’approbation par agent approuvés.      |
| `execApprovals.agents.allowAutoAllowSkills`  | `defaults.autoAllowSkills` et `agents.*.autoAllowSkills`, héritant des valeurs d’exécution par défaut | Définissez sur `false` pour exiger des listes d’autorisation manuelles strictes sans approbation CLI implicite des Skills. |
| `execApprovals.agents.allowlist.expected`    | Ensemble des entrées de motif `agents.*.allowlist[]` et des éventuelles entrées argPattern | Exigez que la liste d’autorisation des approbations corresponde à l’ensemble de motifs vérifié. |

Exemple : exigez l’artefact d’approbations, refusez les valeurs par défaut permissives et autorisez
uniquement la posture d’approbation d’exécution vérifiée pour les agents sélectionnés.

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
          // Les agents sélectionnés peuvent utiliser la posture "allowlist" validée, mais pas "full".
          "allowSecurity": ["allowlist"],
          // false signifie que les CLI de Skills doivent figurer dans la liste d’autorisation validée au lieu
          // d’être implicitement approuvées par autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Entrée simple : motif exact d’exécutable validé sans argPattern.
              "travel-hub",
              // Entrée contrainte : motif accompagné d’une expression régulière d’arguments validée.
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

| Champ de stratégie               | État observé                                  | Utilisation                                                                                                       |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata`  | Métadonnées de fournisseur et de mode de `auth.profiles.*` | Exiger des clés de métadonnées telles que `provider` et `mode` dans les profils d’authentification de la configuration. |
| `auth.profiles.allowModes`       | `auth.profiles.*.mode`                        | Autoriser uniquement les modes de profil d’authentification pris en charge, tels que `api_key`, `aws-sdk`, `oauth` ou `token`. |

#### Métadonnées des outils

| Champ de stratégie       | État observé                         | Utilisation                                                                                                      |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata`  | Déclarations `TOOLS.md` régies       | Exiger que les outils régis déclarent des clés de métadonnées telles que `risk`, `sensitivity` ou `owner`.       |

#### Posture des outils

| Champ de stratégie               | État observé                                                | Utilisation                                                                                                              |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tools.profiles.allow`           | `tools.profile` et `agents.list[].tools.profile`            | Autoriser uniquement les identifiants de profil d’outil tels que `minimal`, `messaging` ou `coding`.                    |
| `tools.fs.requireWorkspaceOnly`  | `tools.fs.workspaceOnly` et remplacements de `tools.fs` par agent | Définir sur `true` pour exiger une posture des outils de système de fichiers limitée à l’espace de travail.              |
| `tools.exec.allowSecurity`       | `tools.exec.security` et sécurité d’exécution par agent     | Autoriser uniquement les modes de sécurité d’exécution tels que `deny` ou `allowlist`.                                   |
| `tools.exec.requireAsk`          | `tools.exec.ask` et mode de demande d’exécution par agent   | Exiger une posture d’approbation telle que `always`.                                                                     |
| `tools.exec.allowHosts`          | `tools.exec.host` et routage de l’hôte d’exécution par agent | Autoriser uniquement les modes de routage de l’hôte d’exécution tels que `sandbox`.                                      |
| `tools.elevated.allow`           | `tools.elevated.enabled` et posture avec élévation par agent | Définir sur `false` pour exiger que le mode d’outil avec élévation reste désactivé.                                       |
| `tools.alsoAllow.expected`       | `tools.alsoAllow` et `tools.alsoAllow` par agent            | Exiger des entrées `alsoAllow` exactes et signaler les autorisations d’outils additives manquantes ou inattendues.       |
| `tools.denyTools`                | `tools.deny` et `agents.list[].tools.deny`                  | Exiger que les listes de refus d’outils configurées incluent des identifiants ou des groupes d’outils tels que `group:runtime` et `group:fs`. |

## Exécuter les vérifications

Exécutez uniquement les vérifications de stratégie pendant la rédaction :

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` exécute uniquement l’ensemble des vérifications de stratégie et émet les preuves, les constatations
et les hachages d’attestation. Les mêmes constatations apparaissent également dans
`openclaw doctor --lint` lorsque le Plugin Policy est activé.

Comparez un fichier de stratégie d’opérateur à une référence rédigée :

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` vérifie la syntaxe d’un fichier de stratégie par rapport à celle d’un autre fichier de stratégie ; il
n’inspecte ni l’état d’exécution, ni les preuves, ni les identifiants d’authentification, ni les secrets. Il utilise les mêmes
métadonnées de règles que celles qui régissent les surcharges de portée : les listes d’autorisation doivent rester identiques ou
plus restrictives, les listes de refus doivent rester identiques ou plus larges, les booléens obligatoires doivent conserver
leur valeur, les chaînes ordonnées ne peuvent évoluer que vers l’extrémité la plus stricte de
l’ordre configuré, et les listes exactes doivent correspondre. La référence peut être une
stratégie rédigée par l’organisation ; la stratégie vérifiée peut ajouter des valeurs plus strictes ou
des règles supplémentaires. Une règle vérifiée de premier niveau peut satisfaire une règle de référence limitée à une portée lorsqu’elle
est aussi restrictive ou plus restrictive. Les noms de portée ne doivent pas nécessairement correspondre entre
les fichiers ; la comparaison s’effectue selon le sélecteur (`agentIds`/`channelIds`) et le champ.

Comparaison sans erreur (`--json`) :

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

La sortie sans erreur de `policy check --json` inclut des hachages stables qu’un opérateur ou
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

## Configurer la stratégie

La configuration de la stratégie se trouve sous `plugins.entries.policy.config`.

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

| Paramètre                 | Objectif                                                                        |
| ------------------------- | ------------------------------------------------------------------------------- |
| `enabled`                 | Activer les vérifications de stratégie avant même que `policy.jsonc` existe.    |
| `workspaceRepairs`        | Autoriser `doctor --fix` à modifier les paramètres de l’espace de travail gérés par la stratégie. |
| `expectedHash`            | Verrouillage facultatif par hachage de l’artefact de stratégie approuvé.        |
| `expectedAttestationHash` | Verrouillage facultatif par hachage de la dernière vérification de stratégie sans erreur acceptée. |
| `path`                    | Emplacement de l’artefact de stratégie relatif à l’espace de travail.           |

Définissez `plugins.entries.policy.config.enabled` sur `false` pour désactiver les vérifications de
stratégie d’un espace de travail tout en laissant le Plugin installé.

## Accepter l’état de la stratégie

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
`workspace.hash` identifie cette charge utile de preuves. `findingsHash` identifie
l’ensemble exact des constatations. `checkedAt` enregistre le moment où la vérification a été exécutée.
`attestationHash` identifie l’affirmation stable (hachage de la stratégie, hachage des preuves,
hachage des constatations et état sans erreur/avec erreurs) et exclut délibérément `checkedAt`,
de sorte que le même état de stratégie produise toujours le même hachage d’attestation. Ensemble,
ces quatre valeurs forment le tuple d’audit d’une vérification de stratégie.

Si un Gateway ou un superviseur utilise la stratégie pour bloquer, approuver ou annoter une
action d’exécution, il doit enregistrer le hachage d’attestation de la dernière vérification
sans erreur. `checkedAt` reste dans la sortie JSON pour les journaux d’audit, mais ne fait pas partie du
hachage stable.

Cycle de vie de l’acceptation de l’état de la stratégie :

1. Rédigez ou examinez `policy.jsonc`.
2. Exécutez `openclaw policy check --json`.
3. Si aucune erreur n’est détectée, enregistrez `attestation.policy.hash` comme `expectedHash`.
4. Enregistrez `attestation.attestationHash` comme `expectedAttestationHash`.
5. Réexécutez `openclaw doctor --lint` dans la CI ou les barrières de publication.

Si les règles de politique changent intentionnellement, mettez à jour les deux hachages acceptés à partir d’une
vérification propre. Si seuls les paramètres de l’espace de travail changent (la politique reste identique),
seul `expectedAttestationHash` change généralement.

L’activation ou la mise à niveau des règles `agents.workspace` ajoute des éléments de preuve `agentWorkspace`
au hachage de l’espace de travail et au hachage d’attestation ; examinez les nouveaux éléments de preuve et
actualisez les hachages d’attestation acceptés après l’activation. L’activation ou la mise à niveau
des règles de posture des outils ajoute des éléments de preuve `toolPosture` de la même manière.

`openclaw policy watch` réexécute la vérification et signale lorsque les éléments de preuve actuels ne
correspondent plus à `expectedAttestationHash` :

```bash
openclaw policy watch --json
```

Utilisez `--once` dans la CI ou dans les scripts qui nécessitent une seule évaluation de dérive. Sans
`--once`, la commande interroge par défaut toutes les deux secondes ; utilisez `--interval-ms` pour modifier
l’intervalle.

## Constats

| Identifiant de vérification                               | Constat                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La politique est activée, mais `policy.jsonc` est manquant.                                          |
| `policy/policy-jsonc-invalid`                            | La politique ne peut pas être analysée ou contient des entrées de règle mal formées.                 |
| `policy/policy-hash-mismatch`                            | La politique ne correspond pas à la valeur `expectedHash` configurée.                                |
| `policy/attestation-hash-mismatch`                       | Les éléments de preuve actuels de la politique ne correspondent plus à l’attestation acceptée.       |
| `policy/policy-conformance-invalid`                      | Un fichier de politique de référence ou vérifié contient une syntaxe de comparaison non valide.      |
| `policy/policy-conformance-missing`                      | Il manque dans un fichier de politique vérifié une règle requise par le fichier de politique de référence. |
| `policy/policy-conformance-weaker`                       | Un fichier de politique vérifié contient une valeur moins stricte que le fichier de politique de référence. |
| `policy/channels-denied-provider`                        | Un canal activé correspond à une règle de refus de canal.                                            |
| `policy/mcp-denied-server`                               | Un serveur MCP configuré est refusé par la politique.                                                |
| `policy/mcp-unapproved-server`                           | Un serveur MCP configuré ne figure pas dans la liste d’autorisation.                                 |
| `policy/models-denied-provider`                          | Un fournisseur de modèles configuré ou une référence de modèle utilise un fournisseur refusé.       |
| `policy/models-unapproved-provider`                      | Un fournisseur de modèles configuré ou une référence de modèle ne figure pas dans la liste d’autorisation. |
| `policy/network-private-access-enabled`                  | Une échappatoire SSRF vers le réseau privé est activée alors que la politique l’interdit.             |
| `policy/ingress-dm-policy-unapproved`                    | Une politique de messages privés d’un canal ne figure pas dans la liste d’autorisation de la politique. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` ne correspond pas à la portée d’isolation des messages privés requise par la politique. |
| `policy/ingress-open-groups-denied`                      | La politique de groupe d’un canal est `open` alors que la politique interdit l’entrée des groupes ouverts. |
| `policy/ingress-group-mention-required`                  | Une entrée de canal ou de groupe désactive les contrôles de mention alors que la politique les exige. |
| `policy/gateway-non-loopback-bind`                       | La posture de liaison du Gateway autorise une exposition hors boucle locale alors que la politique l’interdit. |
| `policy/gateway-auth-disabled`                           | L’authentification du Gateway est désactivée alors que la politique l’exige.                          |
| `policy/gateway-rate-limit-missing`                      | La posture de limitation du débit d’authentification du Gateway n’est pas explicite alors que la politique l’exige. |
| `policy/gateway-control-ui-insecure`                     | Les options d’exposition non sécurisée de l’interface de contrôle du Gateway sont activées.          |
| `policy/gateway-tailscale-funnel`                        | L’exposition Tailscale Funnel du Gateway est activée alors que la politique l’interdit.              |
| `policy/gateway-remote-enabled`                          | Le mode distant du Gateway est actif alors que la politique l’interdit.                              |
| `policy/gateway-http-endpoint-enabled`                   | Un point de terminaison de l’API HTTP du Gateway est activé alors qu’il est interdit par la politique. |
| `policy/gateway-http-url-fetch-unrestricted`             | L’entrée de récupération d’URL HTTP du Gateway ne dispose pas d’une liste d’autorisation d’URL requise. |
| `policy/gateway-node-command-denied`                     | Une commande de Node interdite par la politique ne l’est pas dans la configuration OpenClaw.         |
| `policy/agents-workspace-access-denied`                  | Le mode sandbox de l’agent ou l’accès à l’espace de travail ne figure pas dans la liste d’autorisation de la politique. |
| `policy/agents-tool-not-denied`                          | Une configuration d’agent ou par défaut ne refuse pas un outil dont le refus est requis par la politique. |
| `policy/tools-profile-unapproved`                        | Un profil d’outils global ou propre à un agent ne figure pas dans la liste d’autorisation.            |
| `policy/tools-fs-workspace-only-required`                | Les outils de système de fichiers ne sont pas configurés avec une posture de chemin limitée à l’espace de travail. |
| `policy/tools-exec-security-unapproved`                  | Le mode de sécurité d’exécution ne figure pas dans la liste d’autorisation de la politique.           |
| `policy/tools-exec-ask-unapproved`                       | Le mode de demande d’exécution ne figure pas dans la liste d’autorisation de la politique.            |
| `policy/tools-exec-host-unapproved`                      | Le routage de l’hôte d’exécution ne figure pas dans la liste d’autorisation de la politique.          |
| `policy/tools-elevated-enabled`                          | Le mode d’outil avec privilèges élevés est activé alors que la politique l’interdit.                  |
| `policy/tools-also-allow-missing`                        | Une liste `alsoAllow` configurée ne contient pas une entrée requise par la politique.                 |
| `policy/tools-also-allow-unexpected`                     | Une liste `alsoAllow` configurée contient une entrée non prévue par la politique.                     |
| `policy/tools-required-deny-missing`                     | Une liste globale ou propre à un agent d’outils refusés ne contient pas un outil dont le refus est requis. |
| `policy/sandbox-mode-unapproved`                         | Le mode sandbox ne figure pas dans la liste d’autorisation de la politique.                           |
| `policy/sandbox-backend-unapproved`                      | Le backend du sandbox ne figure pas dans la liste d’autorisation de la politique.                     |
| `policy/sandbox-container-posture-unobservable`          | Une règle de posture de conteneur est activée pour un backend qui ne peut pas l’observer.              |
| `policy/sandbox-container-host-network-denied`           | Un sandbox ou un navigateur reposant sur un conteneur utilise le mode réseau de l’hôte.               |
| `policy/sandbox-container-namespace-join-denied`         | Un sandbox ou un navigateur reposant sur un conteneur rejoint l’espace de noms d’un autre conteneur.  |
| `policy/sandbox-container-mount-mode-required`           | Un montage de sandbox ou de navigateur reposant sur un conteneur n’est pas en lecture seule.          |
| `policy/sandbox-container-runtime-socket-mount`          | Un montage de sandbox ou de navigateur reposant sur un conteneur expose le socket d’exécution du conteneur. |
| `policy/sandbox-container-unconfined-profile`            | Le profil du sandbox de conteneur est non confiné alors que la politique l’interdit.                  |
| `policy/sandbox-browser-cdp-source-range-missing`        | La plage source CDP du navigateur sandbox est manquante alors que la politique en exige une.          |
| `policy/data-handling-redaction-disabled`                | La caviardisation des journaux sensibles est désactivée alors que la politique l’exige.               |
| `policy/data-handling-telemetry-content-capture`         | La capture du contenu de télémétrie est activée alors que la politique l’interdit.                    |
| `policy/data-handling-session-retention-not-enforced`    | La maintenance de la conservation des sessions n’est pas appliquée alors que la politique l’exige.   |
| `policy/data-handling-session-transcript-memory-enabled` | L’indexation en mémoire des transcriptions de session est activée alors que la politique l’interdit.  |
| `policy/secrets-unmanaged-provider`                      | Une référence SecretRef de configuration fait référence à un fournisseur non déclaré sous `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un fournisseur de secrets de configuration ou une référence SecretRef utilise une source interdite par la politique. |
| `policy/secrets-insecure-provider`                       | Un fournisseur de secrets opte pour une posture non sécurisée alors que la politique l’interdit.     |
| `policy/auth-profile-invalid-metadata`                   | Il manque à un profil d’authentification de configuration des métadonnées valides de fournisseur ou de mode. |
| `policy/auth-profile-unapproved-mode`                    | Le mode d’un profil d’authentification de configuration ne figure pas dans la liste d’autorisation de la politique. |
| `policy/exec-approvals-missing`                          | La politique exige `exec-approvals.json`, mais l’artefact est manquant.                              |
| `policy/exec-approvals-invalid`                          | L’artefact configuré d’approbations d’exécution ne peut pas être analysé.                             |
| `policy/exec-approvals-default-security-unapproved`      | Les valeurs par défaut d’approbation d’exécution utilisent un mode de sécurité qui ne figure pas dans la liste d’autorisation de la politique. |
| `policy/exec-approvals-agent-security-unapproved`        | Le mode de sécurité effectif d’approbation d’exécution propre à un agent ne figure pas dans la liste d’autorisation. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agent d’approbation d’exécution autorise implicitement et automatiquement les CLI de Skills alors que la politique l’interdit. |
| `policy/exec-approvals-allowlist-missing`                | Il manque dans la liste d’autorisation des approbations un motif requis par la politique.            |
| `policy/exec-approvals-allowlist-unexpected`             | La liste d’autorisation des approbations contient un motif non prévu par la politique.                |
| `policy/tools-missing-risk-level`                        | Il manque des métadonnées de risque à une déclaration d’outil régie.                                 |
| `policy/tools-unknown-risk-level`                        | Une déclaration d’outil régie utilise une valeur de risque inconnue.                                 |
| `policy/tools-missing-sensitivity-token`                 | Il manque des métadonnées de sensibilité à une déclaration d’outil régie.                            |
| `policy/tools-missing-owner`                             | Il manque des métadonnées de propriétaire à une déclaration d’outil régie.                           |
| `policy/tools-unknown-sensitivity-token`                 | Une déclaration d’outil régie utilise une valeur de sensibilité inconnue.                            |

Un constat peut inclure à la fois `target` (l’élément observé de l’espace de travail qui
n’est pas conforme) et `requirement` (la règle rédigée qui a produit ce constat).
Les deux sont actuellement des chaînes d’adresse `oc://`, mais les noms des champs décrivent le rôle
dans la politique plutôt que le format de l’adresse.

Exemples de constats :

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Le canal 'telegram' utilise le fournisseur interdit 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram n’est pas approuvé pour cet espace de travail."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "L’outil 'deploy' de TOOLS.md n’a aucune classification explicite des risques.",
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
  "message": "Le serveur MCP 'remote' ne figure pas dans la liste d’autorisation de la politique.",
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
  "message": "La référence de modèle 'anthropic/claude-sonnet-4.7' utilise le fournisseur non approuvé 'anthropic'.",
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
  "message": "Le paramètre réseau 'browser-private-network' autorise l’accès au réseau privé.",
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
  "message": "Le paramètre de liaison du Gateway 'gateway-bind' permet une exposition hors interface de bouclage.",
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
  "message": "La commande de Node du Gateway 'system.run' est interdite par la politique, mais pas par la configuration d’OpenClaw.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Ajoutez 'system.run' à gateway.nodes.denyCommands ou mettez à jour la politique après examen."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "La valeur sandbox workspaceAccess 'rw' de agents.defaults n’est pas autorisée par la politique.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Réparation

`doctor --lint` et `policy check` sont en lecture seule.

`doctor --fix` ne modifie les paramètres d’espace de travail gérés par la politique que lorsque
`workspaceRepairs` est explicitement activé ; sinon, les vérifications indiquent ce qu’elles
répareraient et laissent les paramètres inchangés.

Dans cette version, la réparation peut désactiver les canaux interdits par `channels.denyRules` et
appliquer les réparations automatiques de restriction répertoriées ci-dessous. Activez `workspaceRepairs`
uniquement après avoir examiné le fichier de politique, car une règle valide peut modifier
la configuration de l’espace de travail :

- définir `tools.elevated.enabled=false` lorsqu’une politique globale interdit les outils élevés
- ajouter les identifiants d’outils manquants dont l’interdiction est requise à `tools.deny` ou
  `agents.list[].tools.deny` lorsque la politique exige que ces outils soient interdits
- définir les options non sécurisées `gateway.controlUi.*` sur `false`
- définir `gateway.mode=local` lorsque la politique interdit le mode Gateway distant
- définir les chemins signalés `gateway.http.endpoints.*.enabled` sur `false` lorsque la politique
  interdit les points de terminaison de l’API HTTP du Gateway
- définir les chemins `groupPolicy` signalés pour les entrées de canaux sur `allowlist` lorsque la politique
  interdit les entrées de groupes ouvertes
- définir les chemins `requireMention` signalés pour les entrées de canaux sur `true` lorsque la politique
  exige des mentions dans les groupes
- définir `logging.redactSensitive=tools` lorsque la politique exige la
  caviardisation des données sensibles dans les journaux
- définir `diagnostics.otel.captureContent=false`, ou
  `diagnostics.otel.captureContent.enabled=false` pour les paramètres de capture de télémétrie
  sous forme d’objet, lorsque la politique interdit la capture du contenu de télémétrie

Les réparations d’outils élevés à portée limitée sont uniquement détectées. Les réparations de gestion des données à portée limitée sont
également ignorées lorsque le constat signale une configuration partagée de journalisation ou de télémétrie,
car la modification du paramètre partagé aurait une incidence au-delà de la cible de la politique
à portée limitée.

Les réparations d’interdictions requises à portée limitée sont ignorées lorsque le constat signale une valeur
`tools.deny` racine héritée, car l’ajout de l’outil requis à la configuration racine aurait une incidence
au-delà de la cible de la politique à portée limitée. Les réparations d’interdictions requises propres à un agent peuvent mettre à jour
le chemin `agents.list[].tools.deny` signalé.

Les réparations d’entrées de canaux à portée limitée sont ignorées lorsque le constat signale une valeur
`channels.defaults.*` héritée, car la modification de la valeur par défaut partagée du canal aurait une incidence
au-delà de la cible de la politique à portée limitée. Les constats concernant la liste d’autorisation de récupération d’URL HTTP du Gateway
restent manuels, car la réparation automatique ne peut pas choisir les valeurs correctes de la liste
d’autorisation des URL de points de terminaison.

Les constats relatifs à la liaison du Gateway et aux commandes de Node restent soumis à examen. Lorsque
`policy/gateway-non-loopback-bind` ou `policy/gateway-node-command-denied`
peut être associé à un chemin de configuration, `doctor --fix` signale la modification proposée de
`gateway.bind` ou `gateway.nodes.denyCommands` comme un aperçu ignoré
à titre indicatif. Il n’applique pas la modification, et le constat n’est pas considéré comme
réparé tant qu’un opérateur n’a pas examiné et mis à jour la configuration ou la politique.

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

| Commande         | `0`                                                               | `1`                                                                         | `2`                                      |
| ---------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| `policy check`   | Aucun constat au seuil défini.                                    | Un ou plusieurs constats ont atteint le seuil.                              | Échec d’un argument ou de l’exécution.   |
| `policy compare` | Le fichier de politique est au moins aussi strict que la référence. | Le fichier de politique est invalide, absent ou moins strict que les règles de référence. | Échec d’un argument ou de l’exécution.   |
| `policy watch`   | Aucun constat et le hachage accepté est à jour.                   | Des constats existent ou l’attestation acceptée est obsolète.               | Échec d’un argument ou de l’exécution.   |

## Voir aussi

- [Mode lint de Doctor](/fr/cli/doctor#lint-mode)
- [CLI des chemins](/fr/cli/path)
