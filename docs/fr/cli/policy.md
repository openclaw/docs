---
read_when:
    - Vous voulez vérifier les paramètres d’OpenClaw par rapport à un fichier policy.jsonc défini
    - Vous voulez des constats de politique dans le lint de doctor
    - Vous avez besoin d’un hachage d’attestation de politique pour les preuves d’audit
summary: Référence CLI pour les contrôles de conformité `openclaw policy`
title: Politique
x-i18n:
    generated_at: "2026-06-27T17:20:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` est fourni par le Plugin Policy intégré. Policy est une
couche de conformité d’entreprise au-dessus des paramètres OpenClaw existants.
Il n’ajoute pas un second système de configuration. `policy.jsonc` définit les
exigences rédigées, OpenClaw observe l’espace de travail actif comme preuve, et
les contrôles de santé de la politique signalent les dérives via `doctor --lint`.
Le signal de conformité final est une exécution propre de `doctor --lint` ; la
politique contribue des constats à cette surface de lint partagée au lieu de
créer une porte de santé séparée.

Policy gère actuellement les canaux configurés, les serveurs MCP, les fournisseurs de modèles,
la posture SSRF réseau, la posture d’accès entrant/canal, la posture d’exposition du Gateway, la posture de l’espace de travail des agents,
la posture de traitement des données, la posture du fournisseur de secrets/profil d’authentification de la configuration OpenClaw, et les déclarations d’outils
gouvernés. Par exemple, l’IT ou un opérateur d’espace de travail peut enregistrer que Telegram
n’est pas un fournisseur de canal approuvé, restreindre les serveurs MCP et les références de modèles aux
entrées approuvées, exiger que l’accès fetch/navigateur au réseau privé reste
désactivé, exiger que l’isolation des sessions en messages directs et la posture d’entrée des canaux
restent dans des limites examinées, exiger que l’exposition bind/auth/HTTP du Gateway reste dans des
limites examinées, exiger que l’accès à l’espace de travail des agents et les refus d’outils restent dans une
posture examinée, exiger que les SecretRefs de configuration OpenClaw utilisent des fournisseurs gérés, exiger
que les profils d’authentification de configuration portent des métadonnées de fournisseur/mode, exiger que les outils gouvernés
portent des métadonnées de risque et de sensibilité, exiger la rédaction des journaux sensibles, refuser
la capture de contenu de télémétrie, exiger la maintenance de rétention des sessions, refuser l’indexation mémoire
des transcriptions de session, puis utiliser `doctor --lint` comme porte de conformité
partagée.

Utilisez la politique lorsqu’un espace de travail a besoin d’une déclaration durable telle que « ces canaux
ne doivent pas être activés » ou « les outils gouvernés doivent déclarer des métadonnées d’approbation », ainsi que d’une
méthode répétable pour prouver qu’OpenClaw reste conforme à cette déclaration. Utilisez
uniquement la configuration normale et la documentation de l’espace de travail lorsque vous avez seulement besoin du comportement local et
que vous n’avez pas besoin de constats de politique ni de sortie d’attestation.

## Démarrage rapide

Activez le Plugin Policy intégré avant la première utilisation :

```bash
openclaw plugins enable policy
```

Lorsque la politique est activée, doctor peut charger les contrôles de santé de la politique sans activer
de Plugins arbitraires. Le Plugin reste activé si `policy.jsonc` est absent, afin que
doctor puisse signaler l’artefact manquant.

La politique est rédigée, et non générée à partir des paramètres actuels de l’utilisateur. Une politique minimale
pour les canaux, les serveurs MCP, les fournisseurs de modèles, la posture réseau, l’accès entrant/canal, l’exposition du Gateway,
la posture de l’espace de travail des agents, la posture du runtime sandbox configuré, la posture de traitement
des données OpenClaw, la posture du fournisseur de secrets/profil d’authentification de configuration, la posture du fichier d’approbation d’exécution
et les métadonnées d’outils ressemble à ceci :

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

Les règles font autorité. Un bloc de catégorie n’est qu’un espace de noms ; les contrôles s’exécutent
lorsqu’une règle concrète est présente. OpenClaw lit les paramètres `channels.*` actuels,
`mcp.servers.*`, `models.providers.*`, certaines références de modèles d’agent, les paramètres SSRF réseau,
la portée des sessions en messages directs, la politique DM de canal, la politique de groupe de canal,
les portes de mention canal/groupe, la posture bind/auth/Control UI/Tailscale/remote/HTTP du Gateway,
la posture d’accès à l’espace de travail sandbox des agents dans la configuration OpenClaw et la posture de refus d’outils,
la posture de configuration de traitement des données, la provenance du fournisseur de secrets
de configuration et de SecretRef, les métadonnées de profil d’authentification de configuration, la posture d’outils globale/par agent
configurée, et les déclarations `TOOLS.md` comme preuves, puis
signale l’état observé qui n’est pas conforme. Si une politique refuse les binds du Gateway non-loopback,
omettez `gateway.bind` uniquement lorsque vous
acceptez d’examiner la valeur par défaut du runtime ; définissez `gateway.bind=loopback` pour
une conformité stricte de la configuration. Pour une posture d’agent en lecture seule, configurez le mode sandbox
sur les valeurs par défaut ou l’agent applicables et définissez `workspaceAccess` sur `none` ou
`ro` ; un mode sandbox omis ou `off` ne satisfait pas une politique lecture seule/sans écriture.
`agents.workspace.denyTools` prend en charge `exec`, `process`, `write`,
`edit` et `apply_patch` ; la configuration OpenClaw `group:fs` couvre les outils de mutation de fichiers
et `group:runtime` couvre les outils shell/processus. La politique de posture des outils observe
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled`, ainsi que les mêmes remplacements par agent
`agents.list[].tools.*`. La politique d’approbation d’exécution lit l’artefact produit nommé
`exec-approvals.json` uniquement lorsqu’une règle `execApprovals` est
présente ; les preuves enregistrent les valeurs par défaut, la posture par agent et les modèles de liste d’autorisation
sans jetons de socket ni texte de dernière commande utilisée. La politique n’applique pas les appels d’outils
au runtime. Les preuves de secrets enregistrent
la posture fournisseur/source et les métadonnées SecretRef, jamais les valeurs brutes des secrets. La politique
ne lit ni n’atteste les magasins d’identifiants par agent tels que `auth-profiles.json` ;
ces magasins restent détenus par les flux d’authentification et d’identifiants existants.
Les preuves de traitement des données concernent uniquement la posture au niveau de la configuration : elles vérifient le
mode de rédaction configuré, les bascules de capture de contenu de télémétrie, le mode de maintenance des sessions, et
les paramètres d’indexation mémoire des transcriptions de session. Elles n’inspectent pas les journaux bruts,
les exports de télémétrie, le contenu des transcriptions, les fichiers mémoire, et ne prouvent pas qu’aucune donnée personnelle
ni aucun secret n’existent.

### Référence des règles de politique

Chaque champ de politique ci-dessous est facultatif. Un contrôle s’exécute uniquement lorsque la règle correspondante est
présente dans `policy.jsonc`. L’état observé correspond à la configuration OpenClaw existante ou aux
métadonnées de l’espace de travail ; la politique signale la dérive mais ne réécrit pas le comportement du runtime
sauf si un chemin de réparation est explicitement disponible et activé.
Les fichiers de politique sont stricts : les sections ou clés de règle non prises en charge sont signalées comme
`policy/policy-jsonc-invalid` au lieu d’être ignorées.

Les superpositions de politique gardent les règles globales de premier niveau comme règles globales, puis permettent à des blocs de portée nommés
d’ajouter des sections de politique normales plus strictes pour des sélecteurs explicites. Un nom de portée est
seulement un compartiment descriptif ; la correspondance utilise les valeurs de sélecteur à l’intérieur de la portée.
La superposition est additive : les revendications globales continuent de s’exécuter, et une revendication portée peut émettre
son propre constat contre la même configuration observée.

#### Superpositions avec portée

Utilisez `scopes.<scopeName>` lorsqu’un ensemble d’agents ou de canaux a besoin d’une
politique plus stricte que la base de référence de premier niveau. Les sections à portée d’agent utilisent `agentIds`, qui
prend en charge `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`,
et `execApprovals.*`. L’entrée
à portée de canal utilise `channelIds`, qui prend en charge `ingress.channels.*`. Les sections non prises en charge
sont rejetées au lieu d’être ignorées. Si une entrée `agentIds` n’est pas
présente dans `agents.list[]`, OpenClaw évalue la règle à portée contre la posture héritée
globale/par défaut pour cet identifiant d’agent de runtime.

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

Le même agent peut apparaître dans plusieurs portées lorsque chaque portée gouverne des
champs différents, comme illustré ci-dessus. Un champ à portée répété pour le même agent doit être
aussi restrictif ou plus restrictif selon les métadonnées de politique ; les revendications dupliquées plus faibles
sont rejetées. Les métadonnées de rigueur traitent les listes d’autorisation comme des sous-ensembles,
les listes de refus comme des sur-ensembles, et les booléens requis comme des exigences fixes.

La politique de posture de conteneur est évaluée uniquement contre les preuves qu’OpenClaw peut
observer pour l’agent correspondant. Si une règle `sandbox.containers.*` activée s’applique
à un agent dont le backend sandbox ne peut pas exposer ce champ, la politique signale
`policy/sandbox-container-posture-unobservable` au lieu de considérer la revendication comme
réussie. Utilisez des portées `agentIds` séparées pour les groupes d’agents qui utilisent différents
backends sandbox, et laissez les règles de conteneur non prises en charge non définies ou à false pour les
groupes où ces champs ne peuvent pas être observés.

`ingress.session.requireDmScope` de premier niveau reste global, car
`session.dmScope` n’est pas une preuve attribuable à un canal.

| Sélecteur    | Sections prises en charge                                                           | À utiliser lorsque                                       |
| ------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` et `execApprovals`    | Un ou plusieurs agents d’exécution ont besoin de règles plus strictes. |
| `channelIds` | `ingress.channels`                                                                 | Un ou plusieurs canaux ont besoin de règles d’ingress plus strictes. |

Chaque portée présente dans `policy.jsonc` doit être valide et applicable.

#### Canaux

| Champ de stratégie                  | État observé                            | À utiliser lorsque                                               |
| ----------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Fournisseur `channels.*` et état activé | Refuser les canaux configurés provenant d’un fournisseur tel que `telegram`. |
| `channels.denyRules[].reason`        | Message de constat et contexte d’indice de réparation | Expliquer pourquoi le fournisseur est refusé.                    |

#### Serveurs MCP

| Champ de stratégie | État observé        | À utiliser lorsque                                          |
| ------------------ | ------------------- | ----------------------------------------------------------- |
| `mcp.servers.allow` | Identifiants `mcp.servers.*` | Exiger que chaque serveur MCP configuré figure dans une liste d’autorisation. |
| `mcp.servers.deny`  | Identifiants `mcp.servers.*` | Refuser des identifiants de serveurs MCP configurés précis. |

#### Fournisseurs de modèles

| Champ de stratégie        | État observé                                      | À utiliser lorsque                                                                  |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `models.providers.allow`  | Identifiants `models.providers.*` et refs de modèle sélectionnées | Exiger que les fournisseurs configurés et les refs de modèle sélectionnées utilisent des fournisseurs approuvés. |
| `models.providers.deny`   | Identifiants `models.providers.*` et refs de modèle sélectionnées | Refuser les fournisseurs configurés et les refs de modèle sélectionnées par identifiant de fournisseur. |

#### Réseau

| Champ de stratégie                | État observé                            | À utiliser lorsque                                             |
| --------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `network.privateNetwork.allow`    | Échappatoires SSRF du réseau privé      | Définir sur `false` pour exiger que l’accès au réseau privé reste désactivé. |

#### Ingress et accès aux canaux

| Champ de stratégie                         | État observé                                                   | À utiliser lorsque                                             |
| ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `ingress.session.requireDmScope`           | `session.dmScope`                                              | Exiger une portée d’isolation des messages directs revue.      |
| `ingress.channels.allowDmPolicies`         | `channels.*.dmPolicy` et champs hérités de stratégie DM de canal | Autoriser uniquement les stratégies de canal de messages directs revues. |
| `ingress.channels.denyOpenGroups`          | Stratégie d’ingress de canal, de compte et de groupe           | Refuser l’ingress de groupe ouvert pour les canaux et comptes configurés. |
| `ingress.channels.requireMentionInGroups`  | Configuration de canal, compte, groupe, guilde et garde de mention imbriquée | Exiger des gardes de mention lorsque l’ingress de groupe est ouvert ou soumis à mention. |

#### Gateway

| Champ de stratégie                       | État observé                                     | À utiliser lorsque                                             |
| ---------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind`  | `gateway.bind`                                   | Définir sur `false` pour exiger une liaison Gateway en local loopback. |
| `gateway.exposure.allowTailscaleFunnel`  | Posture Gateway Tailscale serve/funnel           | Définir sur `false` pour refuser l’exposition Tailscale Funnel. |
| `gateway.auth.requireAuth`               | `gateway.auth.mode`                              | Définir sur `true` pour rejeter l’auth Gateway désactivée.     |
| `gateway.auth.requireExplicitRateLimit`  | `gateway.auth.rateLimit`                         | Définir sur `true` pour exiger une configuration explicite de limite de débit d’auth. |
| `gateway.controlUi.allowInsecure`        | Bascules d’auth/appareil/origine non sécurisées de l’interface utilisateur de contrôle | Définir sur `false` pour refuser les bascules d’exposition non sécurisées de l’interface utilisateur de contrôle. |
| `gateway.remote.allow`                   | Mode/configuration Gateway distant               | Définir sur `false` pour refuser le mode Gateway distant.      |
| `gateway.http.denyEndpoints`             | Points de terminaison de l’API HTTP Gateway      | Refuser des identifiants de point de terminaison tels que `chatCompletions` ou `responses`. |
| `gateway.http.requireUrlAllowlists`      | Entrées de récupération d’URL HTTP Gateway       | Définir sur `true` pour exiger des listes d’autorisation d’URL sur les entrées de récupération d’URL. |

#### Espace de travail de l’agent

| Champ de stratégie                 | État observé                                                                          | À utiliser lorsque                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess`   | `agents.defaults.sandbox.workspaceAccess` et `agents.list[].sandbox.workspaceAccess`  | Autoriser uniquement les valeurs d’accès à l’espace de travail du sandbox, telles que `none` ou `ro`. |
| `agents.workspace.denyTools`       | Configuration globale et par agent de refus d’outils                                  | Exiger que les outils de mutation de l’espace de travail/de l’exécution, tels que `exec`, `process`, `write`, `edit` ou `apply_patch`, soient refusés. |

#### Posture du sandbox

| Champ de stratégie                                  | État observé                                           | À utiliser lorsque                                             |
| --------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| `sandbox.requireMode`                               | `agents.defaults.sandbox.mode` et mode par agent       | Autoriser uniquement les modes de sandbox revus, tels que `all` ou `non-main`. |
| `sandbox.allowBackends`                             | `agents.defaults.sandbox.backend` et backend par agent | Autoriser uniquement les backends de sandbox revus, tels que `docker`. |
| `sandbox.containers.denyHostNetwork`                | Mode réseau du sandbox/navigateur appuyé par conteneur | Refuser le mode réseau hôte.                                   |
| `sandbox.containers.denyContainerNamespaceJoin`     | Mode réseau du sandbox/navigateur appuyé par conteneur | Refuser la jonction à l’espace de noms réseau d’un autre conteneur. |
| `sandbox.containers.requireReadOnlyMounts`          | Mode de montage du sandbox/navigateur appuyé par conteneur | Exiger que les montages soient en lecture seule.               |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Cibles de montage du sandbox/navigateur appuyé par conteneur | Refuser les montages de sockets d’exécution de conteneur.      |
| `sandbox.containers.denyUnconfinedProfiles`         | Posture des profils de sécurité de conteneur           | Refuser les profils de sécurité de conteneur non confinés.     |
| `sandbox.browser.requireCdpSourceRange`             | Plage source CDP du navigateur sandbox                 | Exiger que l’exposition CDP du navigateur déclare une plage source. |

La stratégie traite l’absence de `sandbox.mode` comme la valeur par défaut implicite `off`, donc
`sandbox.requireMode` signale un sandbox neuf ou non configuré comme extérieur à une
liste d’autorisation telle que `["all"]`.

#### Traitement des données

| Champ de stratégie                                 | État observé                                                                        | À utiliser lorsque                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`   | `logging.redactSensitive`                                                           | Définir sur `true` pour rejeter `logging.redactSensitive: "off"`. |
| `dataHandling.telemetry.denyContentCapture`        | `diagnostics.otel.captureContent`                                                   | Définir sur `true` pour rejeter la capture de contenu de télémétrie. |
| `dataHandling.retention.requireSessionMaintenance` | `session.maintenance.mode`                                                          | Définir sur `true` pour exiger le mode effectif de maintenance de session `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` et `agents.*.memorySearch.experimental.sessionMemory` | Définir sur `true` pour rejeter l’indexation des transcriptions de session dans la mémoire. |

#### Secrets

| Champ de stratégie              | État observé                                            | À utiliser lorsque                                             |
| ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Déclarations Config SecretRefs et `secrets.providers.*` | Définir sur `true` pour exiger que les SecretRefs pointent vers des fournisseurs déclarés. |
| `secrets.denySources`             | Sources de fournisseur de secrets et sources SecretRef  | Refuser des sources telles que `exec`, `file` ou un autre nom de source configuré. |
| `secrets.allowInsecureProviders`  | Indicateurs de posture non sécurisée de fournisseur de secrets | Définir sur `false` pour rejeter les fournisseurs qui optent pour une posture non sécurisée. |

#### Approbations exec

La stratégie d’approbations exec observe l’artefact d’exécution actif `exec-approvals.json`.
Par défaut, il s’agit de `~/.openclaw/exec-approvals.json` ; lorsque
`OPENCLAW_STATE_DIR` est défini, Policy lit
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Les règles de posture réelles telles que
`execApprovals.defaults.*` ou `execApprovals.agents.*` exigent une preuve d’artefact
lisible ; un artefact manquant ou non valide est signalé comme preuve non observable
au lieu de devenir une réussite au mieux contre des valeurs par défaut d’exécution synthétiques. Une fois
l’artefact lisible, les champs d’approbation omis héritent des valeurs par défaut d’exécution : `defaults.security` manquant
vaut `full`, et la sécurité d’agent manquante hérite de cette
valeur par défaut. La preuve inclut `defaults`, `agents.*` et
`agents.*.allowlist[].pattern`, ainsi que les éléments optionnels `argPattern`, la posture effective
`autoAllowSkills` et la source de l’entrée. Elle n’inclut pas le
chemin/token de socket, `commandText`, `lastUsedCommand`, les chemins résolus ni les horodatages.

| Champ de politique                         | État observé                                                                           | À utiliser quand                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Chemin actif du runtime `exec-approvals.json`                                          | Définir sur `true` pour exiger que l’artéfact d’approbations existe et soit analysable. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, avec `full` par défaut                                            | Autoriser uniquement les modes de sécurité d’approbation par défaut approuvés.          |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, héritant des valeurs par défaut                                   | Autoriser uniquement les modes de sécurité d’approbation effectifs par agent approuvés. |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` et `agents.*.autoAllowSkills`, héritant des valeurs par défaut du runtime | Définir sur `false` pour exiger des listes d’autorisation manuelles strictes sans approbation implicite de CLI de Skills. |
| `execApprovals.agents.allowlist.expected`   | Modèle agrégé `agents.*.allowlist[]` et entrées `argPattern` facultatives              | Exiger que la liste d’autorisation des approbations corresponde à l’ensemble de modèles relu. |

Par exemple, exigez l’artéfact d’approbations, refusez les valeurs par défaut
permissives et autorisez uniquement la posture d’approbation d’exécution relue
pour les agents sélectionnés :

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| Champ de politique           | État observé                                | À utiliser quand                                                                           |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Métadonnées de fournisseur et de mode `auth.profiles.*` | Exiger des clés de métadonnées comme `provider` et `mode` sur les profils d’authentification de configuration. |
| `auth.profiles.allowModes`   | `auth.profiles.*.mode`                      | Autoriser uniquement les modes de profil d’authentification pris en charge comme `api_key`, `aws-sdk`, `oauth` ou `token`. |

#### Métadonnées des outils

| Champ de politique     | État observé                     | À utiliser quand                                                                           |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Déclarations gouvernées `TOOLS.md` | Exiger que les outils gouvernés déclarent des clés de métadonnées comme `risk`, `sensitivity` ou `owner`. |

#### Posture des outils

| Champ de politique             | État observé                                               | À utiliser quand                                                                                           |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`         | `tools.profile` et `agents.list[].tools.profile`           | Autoriser uniquement les identifiants de profils d’outils comme `minimal`, `messaging` ou `coding`.        |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` et remplacements `tools.fs` par agent | Définir sur `true` pour exiger une posture d’outil de système de fichiers limitée à l’espace de travail.   |
| `tools.exec.allowSecurity`     | `tools.exec.security` et sécurité d’exécution par agent    | Autoriser uniquement les modes de sécurité d’exécution comme `deny` ou `allowlist`.                        |
| `tools.exec.requireAsk`        | `tools.exec.ask` et mode de demande d’exécution par agent  | Exiger une posture d’approbation comme `always`.                                                           |
| `tools.exec.allowHosts`        | `tools.exec.host` et routage d’hôte d’exécution par agent  | Autoriser uniquement les modes de routage d’hôte d’exécution comme `sandbox`.                              |
| `tools.elevated.allow`         | `tools.elevated.enabled` et posture élevée par agent       | Définir sur `false` pour exiger que le mode d’outil élevé reste désactivé.                                 |
| `tools.alsoAllow.expected`     | `tools.alsoAllow` et `tools.alsoAllow` par agent           | Exiger les entrées `alsoAllow` exactes et signaler les attributions d’outils additives manquantes ou inattendues. |
| `tools.denyTools`              | `tools.deny` et `agents.list[].tools.deny`                 | Exiger que les listes de refus d’outils configurées incluent des identifiants ou groupes d’outils comme `group:runtime` et `group:fs`. |

Exécutez les vérifications limitées aux politiques pendant la rédaction :

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` exécute uniquement l’ensemble de vérifications de politique et
émet les preuves, les constats et les hachages d’attestation. Les mêmes constats
apparaissent également dans `openclaw doctor --lint` lorsque le Plugin Policy est
activé.

Comparez un fichier de politique opérateur à un fichier de politique de référence rédigé :

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` compare la syntaxe d’un fichier de politique à celle d’un autre.
Il n’inspecte pas l’état du runtime OpenClaw, les preuves, les identifiants
d’authentification ni les secrets. La commande utilise les mêmes métadonnées de
règles de politique que celles qui gouvernent les superpositions délimitées : les
listes d’autorisation doivent rester identiques ou plus étroites, les listes de
refus doivent rester identiques ou plus larges, les booléens requis doivent
conserver leur valeur requise, les chaînes ordonnées doivent uniquement évoluer
vers l’extrémité la plus restrictive de l’ordre configuré, et les listes exactes
doivent correspondre.

Le fichier de référence peut être une politique rédigée par l’organisation. La
politique vérifiée peut utiliser des valeurs plus strictes ou ajouter des règles
de politique supplémentaires. Une règle vérifiée de niveau supérieur peut aussi
satisfaire une règle de référence délimitée lorsqu’elle est aussi restrictive ou
plus restrictive, car la politique de niveau supérieur s’applique largement. Les
noms de périmètre n’ont pas besoin de correspondre ; la comparaison délimitée est
indexée par valeur de sélecteur comme `agentIds` ou `channelIds` et par le champ
de politique vérifié.

Exemple de sortie JSON de comparaison propre signalant uniquement l’état de
comparaison des fichiers de politique :

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Exemple de sortie propre `policy check --json` incluant des hachages stables qui
peuvent être enregistrés par un opérateur ou un superviseur :

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

La configuration de politique se trouve sous `plugins.entries.policy.config`.

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

| Paramètre                 | Objectif                                                        |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Activer les vérifications de politique même avant que `policy.jsonc` existe. |
| `workspaceRepairs`        | Autoriser `doctor --fix` à modifier les paramètres d’espace de travail gérés par la politique. |
| `expectedHash`            | Verrouillage de hachage facultatif pour l’artéfact de politique approuvé. |
| `expectedAttestationHash` | Verrouillage de hachage facultatif pour la dernière vérification de politique propre acceptée. |
| `path`                    | Emplacement relatif à l’espace de travail de l’artéfact de politique. |

Définissez `plugins.entries.policy.config.enabled` sur `false` pour désactiver
les vérifications de politique pour un espace de travail tout en laissant le
plugin installé.

Les exigences de métadonnées d’outils sont rédigées dans `policy.jsonc` avec
`tools.requireMetadata`, par exemple `["risk", "sensitivity", "owner"]`.

## Accepter l’état de politique

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

Le hachage de politique identifie l’artefact de règles rédigé. Le bloc de preuves
enregistre l’état OpenClaw observé utilisé par les vérifications de politique. La
valeur `workspace.hash` identifie cette charge utile de preuves pour le périmètre vérifié.
Le hachage des constats identifie l’ensemble exact de constats renvoyé par la vérification.
`checkedAt` enregistre le moment où l’évaluation a été exécutée. Le hachage d’attestation identifie
la revendication stable : hachage de politique, hachage des preuves, hachage des constats, et si le
résultat était propre. Il n’inclut volontairement pas `checkedAt`, afin que le même
état de politique produise la même attestation lors de vérifications répétées. Ensemble,
ces éléments forment le tuple d’audit pour cette vérification de politique.

Si un Gateway ou un superviseur ultérieur utilise la politique pour bloquer, approuver ou annoter une
action d’exécution, il doit enregistrer le hachage d’attestation de la dernière vérification de politique
propre. `checkedAt` reste dans la sortie JSON pour les journaux d’audit, mais ne fait pas partie du
hachage d’attestation stable.

Utilisez ce cycle de vie lors de l’acceptation de l’état de politique :

1. Rédigez ou révisez `policy.jsonc`.
2. Exécutez `openclaw policy check --json`.
3. Si le résultat est propre, enregistrez `attestation.policy.hash` comme `expectedHash`.
4. Enregistrez `attestation.attestationHash` comme `expectedAttestationHash`.
5. Réexécutez `openclaw doctor --lint` dans la CI ou les portes de publication.

Si les règles de politique changent intentionnellement, mettez à jour les deux hachages acceptés à partir d’une
vérification propre. Si les paramètres de l’espace de travail changent intentionnellement mais que la politique reste la même,
seul `expectedAttestationHash` change généralement.

L’activation ou la mise à niveau des règles `agents.workspace` ajoute des preuves `agentWorkspace` au
hachage de l’espace de travail et au hachage d’attestation. Les opérateurs doivent examiner les nouvelles
preuves et actualiser les hachages d’attestation acceptés après l’activation de ces règles.
L’activation ou la mise à niveau des règles de posture des outils ajoute des preuves `toolPosture` de la
même manière.

`openclaw policy watch` exécute la même vérification de manière répétée et signale lorsque les
preuves actuelles ne correspondent plus à `expectedAttestationHash` :

```bash
openclaw policy watch --json
```

Utilisez `--once` dans la CI ou les scripts qui n’ont besoin que d’une seule évaluation de dérive. Sans
`--once`, la commande interroge toutes les deux secondes par défaut ; utilisez `--interval-ms` pour
choisir un intervalle différent.

## Constats

La politique vérifie actuellement :

| Identifiant de contrôle                                 | Constat                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La politique est activée, mais `policy.jsonc` est manquant.                       |
| `policy/policy-jsonc-invalid`                            | La politique ne peut pas être analysée ou contient des entrées de règles mal formées. |
| `policy/policy-hash-mismatch`                            | La politique ne correspond pas à l’`expectedHash` configuré.                      |
| `policy/attestation-hash-mismatch`                       | Les preuves de politique actuelles ne correspondent plus à l’attestation acceptée. |
| `policy/policy-conformance-invalid`                      | Un fichier de politique de référence ou vérifié contient une syntaxe de comparaison invalide. |
| `policy/policy-conformance-missing`                      | Il manque à un fichier de politique vérifié une règle requise par le fichier de politique de référence. |
| `policy/policy-conformance-weaker`                       | Un fichier de politique vérifié contient une valeur plus faible que le fichier de politique de référence. |
| `policy/channels-denied-provider`                        | Un canal activé correspond à une règle de refus de canal.                         |
| `policy/mcp-denied-server`                               | Un serveur MCP configuré est refusé par la politique.                             |
| `policy/mcp-unapproved-server`                           | Un serveur MCP configuré est hors de la liste d’autorisation.                     |
| `policy/models-denied-provider`                          | Un fournisseur de modèles configuré ou une référence de modèle utilise un fournisseur refusé. |
| `policy/models-unapproved-provider`                      | Un fournisseur de modèles configuré ou une référence de modèle est hors de la liste d’autorisation. |
| `policy/network-private-access-enabled`                  | Un mécanisme d’échappement SSRF vers le réseau privé est activé alors que la politique le refuse. |
| `policy/ingress-dm-policy-unapproved`                    | Une politique de messages directs de canal est hors de la liste d’autorisation de la politique. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` ne correspond pas au périmètre d’isolation des messages directs requis par la politique. |
| `policy/ingress-open-groups-denied`                      | Une politique de groupe de canal vaut `open` alors que la politique refuse l’entrée de groupes ouverts. |
| `policy/ingress-group-mention-required`                  | Une entrée de canal ou de groupe désactive les barrières de mention alors que la politique les exige. |
| `policy/gateway-non-loopback-bind`                       | La posture de liaison du Gateway autorise une exposition hors boucle locale alors que la politique la refuse. |
| `policy/gateway-auth-disabled`                           | L’authentification du Gateway est désactivée alors que la politique exige l’authentification. |
| `policy/gateway-rate-limit-missing`                      | La posture de limitation de débit de l’authentification du Gateway n’est pas explicite alors que la politique l’exige. |
| `policy/gateway-control-ui-insecure`                     | Les bascules d’exposition non sécurisée de l’interface de contrôle Gateway sont activées. |
| `policy/gateway-tailscale-funnel`                        | L’exposition Tailscale Funnel du Gateway est activée alors que la politique la refuse. |
| `policy/gateway-remote-enabled`                          | Le mode distant du Gateway est actif alors que la politique le refuse.             |
| `policy/gateway-http-endpoint-enabled`                   | Un point de terminaison d’API HTTP du Gateway est activé alors que la politique le refuse. |
| `policy/gateway-http-url-fetch-unrestricted`             | L’entrée de récupération d’URL HTTP du Gateway ne dispose pas d’une liste d’autorisation d’URL requise. |
| `policy/agents-workspace-access-denied`                  | Le mode sandbox de l’agent ou l’accès à l’espace de travail est hors de la liste d’autorisation de la politique. |
| `policy/agents-tool-not-denied`                          | Un agent ou une configuration par défaut ne refuse pas un outil requis par la politique. |
| `policy/tools-profile-unapproved`                        | Un profil d’outils global ou par agent configuré est hors de la liste d’autorisation. |
| `policy/tools-fs-workspace-only-required`                | Les outils de système de fichiers ne sont pas configurés avec une posture de chemins limitée à l’espace de travail. |
| `policy/tools-exec-security-unapproved`                  | Le mode de sécurité Exec est hors de la liste d’autorisation de la politique.      |
| `policy/tools-exec-ask-unapproved`                       | Le mode de demande Exec est hors de la liste d’autorisation de la politique.       |
| `policy/tools-exec-host-unapproved`                      | Le routage hôte Exec est hors de la liste d’autorisation de la politique.          |
| `policy/tools-elevated-enabled`                          | Le mode d’outil élevé est activé alors que la politique le refuse.                 |
| `policy/tools-also-allow-missing`                        | Il manque à une liste `alsoAllow` configurée une entrée requise par la politique.  |
| `policy/tools-also-allow-unexpected`                     | Une liste `alsoAllow` configurée inclut une entrée non attendue par la politique.  |
| `policy/tools-required-deny-missing`                     | Une liste de refus d’outils globale ou par agent n’inclut pas un outil refusé requis. |
| `policy/sandbox-mode-unapproved`                         | Le mode sandbox est hors de la liste d’autorisation de la politique.              |
| `policy/sandbox-backend-unapproved`                      | Le backend sandbox est hors de la liste d’autorisation de la politique.           |
| `policy/sandbox-container-posture-unobservable`          | Une règle de posture de conteneur est activée pour un backend qui ne peut pas l’observer. |
| `policy/sandbox-container-host-network-denied`           | Un sandbox ou navigateur adossé à un conteneur utilise le mode réseau hôte.       |
| `policy/sandbox-container-namespace-join-denied`         | Un sandbox ou navigateur adossé à un conteneur rejoint l’espace de noms d’un autre conteneur. |
| `policy/sandbox-container-mount-mode-required`           | Un montage de sandbox ou de navigateur adossé à un conteneur n’est pas en lecture seule. |
| `policy/sandbox-container-runtime-socket-mount`          | Un montage de sandbox ou de navigateur adossé à un conteneur expose le socket du runtime de conteneur. |
| `policy/sandbox-container-unconfined-profile`            | Le profil sandbox de conteneur est non confiné alors que la politique le refuse.   |
| `policy/sandbox-browser-cdp-source-range-missing`        | La plage source CDP du navigateur sandbox est manquante alors que la politique en exige une. |
| `policy/data-handling-redaction-disabled`                | La rédaction des journaux sensibles est désactivée alors que la politique l’exige. |
| `policy/data-handling-telemetry-content-capture`         | La capture du contenu de télémétrie est activée alors que la politique la refuse.  |
| `policy/data-handling-session-retention-not-enforced`    | La maintenance de la rétention des sessions n’est pas appliquée alors que la politique l’exige. |
| `policy/data-handling-session-transcript-memory-enabled` | L’indexation en mémoire des transcriptions de session est activée alors que la politique la refuse. |
| `policy/secrets-unmanaged-provider`                      | Un SecretRef de configuration référence un fournisseur non déclaré sous `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un fournisseur de secrets de configuration ou un SecretRef utilise une source refusée par la politique. |
| `policy/secrets-insecure-provider`                       | Un fournisseur de secrets opte pour une posture non sécurisée alors que la politique la refuse. |
| `policy/auth-profile-invalid-metadata`                   | Il manque à un profil d’authentification de configuration des métadonnées valides de fournisseur ou de mode. |
| `policy/auth-profile-unapproved-mode`                    | Un mode de profil d’authentification de configuration est hors de la liste d’autorisation de la politique. |
| `policy/exec-approvals-missing`                          | La politique exige `exec-approvals.json`, mais l’artefact est manquant.            |
| `policy/exec-approvals-invalid`                          | L’artefact d’approbations Exec configuré ne peut pas être analysé.                 |
| `policy/exec-approvals-default-security-unapproved`      | Les valeurs par défaut d’approbation Exec utilisent un mode de sécurité hors de la liste d’autorisation de la politique. |
| `policy/exec-approvals-agent-security-unapproved`        | Un mode de sécurité d’approbation Exec effectif par agent est hors de la liste d’autorisation. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agent d’approbation Exec autorise implicitement automatiquement les CLI de Skills alors que la politique le refuse. |
| `policy/exec-approvals-allowlist-missing`                | Il manque à la liste d’autorisation des approbations un motif requis par la politique. |
| `policy/exec-approvals-allowlist-unexpected`             | La liste d’autorisation des approbations inclut un motif non attendu par la politique. |
| `policy/tools-missing-risk-level`                        | Il manque à une déclaration d’outil gouverné des métadonnées de risque.           |
| `policy/tools-unknown-risk-level`                        | Une déclaration d’outil gouverné utilise une valeur de risque inconnue.           |
| `policy/tools-missing-sensitivity-token`                 | Il manque à une déclaration d’outil gouverné des métadonnées de sensibilité.      |
| `policy/tools-missing-owner`                             | Il manque à une déclaration d’outil gouverné des métadonnées de propriétaire.     |
| `policy/tools-unknown-sensitivity-token`                 | Une déclaration d’outil gouverné utilise une valeur de sensibilité inconnue.      |

Les constats de politique peuvent inclure à la fois `target` et `requirement`. `target` est l’élément
observé de l’espace de travail qui n’est pas conforme. `requirement` est la règle de
politique rédigée qui en a fait un constat. Les deux valeurs sont aujourd’hui des adresses, généralement
des chemins `oc://`, mais les noms de champs décrivent leur rôle dans la politique plutôt que le
format d’adresse.

Exemple de constat JSON :

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

Exemple de constat d’outil :

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

Exemple de constat MCP :

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

Exemple de constat de fournisseur de modèles :

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

Exemple de constat réseau :

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

Exemple de résultat d’exposition du Gateway :

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

Exemple de résultat d’espace de travail d’agent :

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

`doctor --fix` ne modifie les paramètres d’espace de travail gérés par la politique que lorsque
`workspaceRepairs` est explicitement activé. Sans cette activation explicite, les vérifications de politique
signalent ce qu’elles répareraient et laissent les paramètres inchangés.

Dans cette version, la réparation peut désactiver des canaux activés dans la configuration OpenClaw
mais refusés par `channels.denyRules`. N’activez `workspaceRepairs` qu’après avoir
examiné le fichier de politique, car une règle de refus valide peut désactiver un
canal configuré :

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

| Commande         | `0`                                                              | `1`                                                                      | `2`                                  |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `policy check`   | Aucun résultat au seuil.                                         | Un ou plusieurs résultats ont atteint le seuil.                          | Échec d’argument ou d’exécution.     |
| `policy compare` | Le fichier de politique est au moins aussi strict que la base.   | Le fichier de politique est invalide, manquant ou plus faible que les règles de base. | Échec d’argument ou d’exécution. |
| `policy watch`   | Aucun résultat et le hachage accepté est à jour.                 | Des résultats existent ou l’attestation acceptée est obsolète.           | Échec d’argument ou d’exécution.     |

## Connexe

- [Mode lint de Doctor](/fr/cli/doctor#lint-mode)
- [CLI Path](/fr/cli/path)
