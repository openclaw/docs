---
read_when:
    - Vous voulez utiliser le harnais de serveur d’application Codex intégré
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements Codex uniquement échouent au lieu de se rabattre sur OpenClaw
summary: Exécuter les tours d’agent intégrés d’OpenClaw via le harnais app-server Codex fourni
title: Harnais Codex
x-i18n:
    generated_at: "2026-07-04T10:38:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` inclus permet à OpenClaw d’exécuter des tours d’agent OpenAI intégrés
via Codex app-server au lieu du harnais OpenClaw intégré.

Utilisez le harnais Codex lorsque vous voulez que Codex possède la session d’agent de bas niveau :
reprise native de fil, continuation native d’outil, compaction native et
exécution app-server. OpenClaw possède toujours les canaux de discussion, les fichiers de session, la
sélection de modèle, les outils dynamiques OpenClaw, les approbations, la livraison des médias et le miroir
visible de la transcription.

La configuration normale utilise des références de modèles OpenAI canoniques comme `openai/gpt-5.5`.
Ne configurez pas de références GPT Codex héritées. Placez l’ordre d’authentification de l’agent OpenAI
sous `auth.order.openai` ; les anciens identifiants de profils d’authentification Codex hérités et
les anciennes entrées d’ordre d’authentification Codex sont un état hérité réparé par
`openclaw doctor --fix`.

Lorsqu’aucun bac à sable OpenClaw n’est actif, OpenClaw démarre les fils Codex app-server
avec le mode code natif Codex activé tout en laissant le mode code uniquement désactivé par défaut.
Cela garde disponibles l’espace de travail natif et les capacités de code de Codex, tandis que
les outils dynamiques OpenClaw continuent de passer par le pont app-server `item/tool/call`.
Le bac à sable OpenClaw actif et les politiques d’outils restreintes désactivent entièrement le mode code natif,
sauf si vous activez explicitement le chemin expérimental sandbox exec-server.

Cette fonctionnalité native Codex est distincte du
[mode code OpenClaw](/fr/reference/code-mode), qui est un runtime QuickJS-WASI à activation explicite
pour les exécutions OpenClaw génériques avec une forme d’entrée `exec` différente.

Pour la séparation plus générale entre modèle, fournisseur et runtime, commencez par
[Runtimes d’agent](/fr/concepts/agent-runtimes). La version courte est :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Prérequis

- OpenClaw avec le Plugin `codex` inclus disponible.
- Si votre configuration utilise `plugins.allow`, incluez `codex`.
- Codex app-server `0.125.0` ou plus récent. Le Plugin inclus gère par défaut un binaire
  Codex app-server compatible, donc les commandes `codex` locales sur `PATH` n’affectent pas
  le démarrage normal du harnais.
- Authentification Codex disponible via `openclaw models auth login --provider openai`,
  un compte app-server dans le dossier personnel Codex de l’agent, ou un profil d’authentification
  Codex explicite par clé API.

Pour la priorité d’authentification, l’isolation d’environnement, les commandes app-server personnalisées, la découverte des modèles
et tous les champs de configuration, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Démarrage rapide

La plupart des utilisateurs qui veulent Codex dans OpenClaw veulent ce chemin : se connecter avec un
abonnement ChatGPT/Codex, activer le Plugin `codex` inclus et utiliser une
référence de modèle canonique `openai/gpt-*`.

Connectez-vous avec Codex OAuth :

```bash
openclaw models auth login --provider openai
```

Activez le Plugin `codex` inclus et sélectionnez un modèle d’agent OpenAI :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, ajoutez-y aussi `codex` :

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Redémarrez le Gateway après avoir modifié la configuration des Plugins. Si une discussion existante
a déjà une session, utilisez `/new` ou `/reset` avant de tester les changements de runtime afin que le prochain
tour résolve le harnais depuis la configuration actuelle.

## Partager des fils avec Codex Desktop et la CLI

La valeur par défaut `appServer.homeScope: "agent"` garde chaque agent OpenClaw isolé
de l’état Codex natif de l’opérateur. Pour permettre à un propriétaire de demander à OpenClaw d’inspecter
et de gérer les mêmes fils natifs affichés par Codex Desktop et la CLI Codex,
activez explicitement le dossier personnel Codex utilisateur :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Le mode dossier personnel utilisateur est disponible uniquement avec le transport stdio local. Il utilise
`$CODEX_HOME` lorsqu’il est défini et `~/.codex` sinon, y compris l’authentification,
la configuration, les Plugins et le magasin de fils Codex natifs de ce dossier personnel. OpenClaw n’injecte pas de
profil d’authentification OpenClaw dans cet app-server.

Les tours propriétaire obtiennent l’outil `codex_threads`. Il peut lister, rechercher, lire, dupliquer,
renommer, archiver et restaurer des fils natifs. Demandez à l’agent de dupliquer un fil lorsque
vous voulez le poursuivre dans OpenClaw ; la duplication est attachée à la session OpenClaw actuelle
et reste visible pour les autres clients Codex natifs. L’archivage nécessite une confirmation explicite
que le fil est fermé ailleurs.

Ne reprenez pas et n’écrivez pas le même fil simultanément depuis OpenClaw et un autre
client Codex. Codex coordonne les rédacteurs actifs au sein d’un même processus app-server, pas
entre des processus Desktop, CLI et OpenClaw indépendants. La duplication crée une
continuation séparée et constitue le chemin de coexistence sûr.

## Configuration

La configuration de démarrage rapide est la configuration minimale viable du harnais Codex. Définissez les options du
harnais Codex dans la configuration OpenClaw, et utilisez la CLI uniquement pour l’authentification Codex :

| Besoin                                 | Définir                                                                         | Où                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Activer le harnais                     | `plugins.entries.codex.enabled: true`                                            | Configuration OpenClaw             |
| Conserver une installation de Plugin autorisée | Inclure `codex` dans `plugins.allow`                                             | Configuration OpenClaw             |
| Acheminer les tours d’agent OpenAI via Codex | `agents.defaults.model` ou `agents.list[].model` comme `openai/gpt-*`            | Configuration d’agent OpenClaw     |
| Se connecter avec ChatGPT/Codex OAuth  | `openclaw models auth login --provider openai`                                   | Profil d’authentification CLI      |
| Ajouter une clé API de secours pour les exécutions Codex | Profil de clé API `openai:*` listé après l’authentification par abonnement dans `auth.order.openai` | Profil d’authentification CLI + configuration OpenClaw |
| Échouer de manière fermée lorsque Codex est indisponible | Fournisseur ou modèle `agentRuntime.id: "codex"`                                 | Configuration de modèle/fournisseur OpenClaw |
| Utiliser du trafic direct vers l’API OpenAI | Fournisseur ou modèle `agentRuntime.id: "openclaw"` avec l’authentification OpenAI normale | Configuration de modèle/fournisseur OpenClaw |
| Ajuster le comportement app-server     | `plugins.entries.codex.config.appServer.*`                                       | Configuration du Plugin Codex      |
| Activer les applications Plugin Codex natives | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuration du Plugin Codex      |
| Activer l’utilisation de l’ordinateur Codex | `plugins.entries.codex.config.computerUse.*`                                     | Configuration du Plugin Codex      |

Utilisez les références de modèles `openai/gpt-*` pour les tours d’agent OpenAI adossés à Codex. Préférez
`auth.order.openai` pour un ordre abonnement d’abord, clé API de secours ensuite. Les identifiants de profils
d’authentification Codex hérités existants et l’ordre d’authentification Codex hérité sont un état hérité
réservé au doctor ; n’écrivez pas de nouvelles références GPT Codex héritées.

Ne définissez pas `compaction.model` ou `compaction.provider` sur les agents adossés à Codex.
Codex compacte via son état de fil app-server natif, donc OpenClaw ignore
ces remplacements locaux de résumeur à l’exécution et `openclaw doctor --fix` les supprime
lorsque l’agent utilise Codex.

Lossless reste pris en charge comme moteur de contexte pour l’assemblage, l’ingestion et
la maintenance autour des tours Codex. Configurez-le via
`plugins.slots.contextEngine: "lossless-claw"` et
`plugins.entries.lossless-claw.config.summaryModel`, et non via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migre l’ancienne
forme `compaction.provider: "lossless-claw"` vers l’emplacement de moteur de contexte Lossless
lorsque Codex est le runtime actif, mais Codex natif reste propriétaire de la compaction.

Le harnais natif Codex app-server prend en charge les moteurs de contexte qui nécessitent
un assemblage avant invite. Les backends CLI génériques, y compris `codex-cli`, ne fournissent pas
cette capacité d’hôte.

Pour les agents adossés à Codex, `/compact` démarre la compaction native Codex app-server sur
le fil lié. OpenClaw n’attend pas la fin, n’impose pas de délai d’expiration OpenClaw,
ne redémarre pas l’app-server partagé et ne se replie pas sur un moteur de contexte ou
un résumeur OpenAI public. Si la liaison de fil Codex native est manquante ou
obsolète, la commande échoue de manière fermée afin que l’opérateur voie la vraie limite du runtime
au lieu de changer silencieusement de backend de compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Dans cette forme, les deux profils passent toujours par Codex pour les tours d’agent
`openai/gpt-*`. La clé API est seulement un secours d’authentification, pas une demande de basculer vers OpenClaw ou
vers OpenAI Responses brut.

Le reste de cette page couvre les variantes courantes entre lesquelles les utilisateurs doivent choisir :
forme de déploiement, routage à échec fermé, politique d’approbation guardian, Plugins Codex
natifs et utilisation de l’ordinateur. Pour les listes complètes d’options, valeurs par défaut, énumérations, découverte,
isolation d’environnement, délais d’expiration et champs de transport app-server, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vérifier le runtime Codex

Utilisez `/status` dans la discussion où vous attendez Codex. Un tour d’agent OpenAI adossé à Codex
affiche :

```text
Runtime: OpenAI Codex
```

Vérifiez ensuite l’état Codex app-server :

```text
/codex status
/codex models
```

`/codex status` signale la connectivité app-server, le compte, les limites de débit, les serveurs MCP
et les Skills. `/codex models` liste le catalogue Codex app-server en direct pour
le harnais et le compte. Si `/status` vous surprend, consultez
[Dépannage](#troubleshooting).

## Routage et sélection de modèle

Gardez séparées les références de fournisseur et la politique de runtime :

- Utilisez `openai/gpt-*` pour les tours d’agent OpenAI via Codex.
- N’utilisez pas de références GPT Codex héritées dans la configuration. Exécutez `openclaw doctor --fix` pour
  réparer les références héritées et les anciens verrouillages de route de session.
- `agentRuntime.id: "codex"` est facultatif pour le mode automatique OpenAI normal, mais utile
  lorsqu’un déploiement doit échouer de manière fermée si Codex est indisponible.
- `agentRuntime.id: "openclaw"` inscrit explicitement un fournisseur ou un modèle dans le runtime intégré
  OpenClaw lorsque c’est intentionnel.
- `/codex ...` contrôle les conversations natives Codex app-server depuis la discussion.
- ACP/acpx est un chemin de harnais externe séparé. Utilisez-le uniquement lorsque l’utilisateur demande
  ACP/acpx ou un adaptateur de harnais externe.

Routage des commandes courantes :

| Intention utilisateur                                | Utiliser                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Joindre la discussion actuelle                       | `/codex bind [--cwd <path>]`                                                                          |
| Reprendre un fil Codex existant                      | `/codex resume <thread-id>`                                                                           |
| Lister ou filtrer les fils Codex                     | `/codex threads [filter]`                                                                             |
| Lister les plugins Codex natifs                      | `/codex plugins list`                                                                                 |
| Activer ou désactiver un plugin Codex natif configuré | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Joindre une session Codex CLI existante sur un nœud appairé | `/codex sessions --host <node> [filter]`, puis `/codex resume <session-id> --host <node> --bind here` |
| Envoyer uniquement des commentaires Codex            | `/codex diagnostics [note]`                                                                           |
| Démarrer une tâche ACP/acpx                          | Commandes de session ACP/acpx, pas `/codex`                                                           |

| Cas d’usage                                           | Configurer                                                             | Vérifier                                | Notes                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif     | `openai/gpt-*` plus plugin `codex` activé                              | `/status` affiche `Runtime: OpenAI Codex` | Chemin recommandé                     |
| Échouer en mode fermé si Codex est indisponible       | Fournisseur ou modèle `agentRuntime.id: "codex"`                       | Le tour échoue au lieu d’un repli intégré | À utiliser pour les déploiements Codex uniquement |
| Acheminer le trafic par clé API OpenAI directe via OpenClaw | Fournisseur ou modèle `agentRuntime.id: "openclaw"` et auth OpenAI normale | `/status` affiche le runtime OpenClaw   | À utiliser uniquement quand OpenClaw est intentionnel |
| Configuration héritée                                 | Anciennes références GPT Codex                                         | `openclaw doctor --fix` les réécrit     | Ne pas écrire de nouvelle configuration ainsi |
| Adaptateur Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                               | Statut de tâche/session ACP             | Séparé du harnais Codex natif         |

`agents.defaults.imageModel` suit la même séparation par préfixe. Utilisez `openai/gpt-*`
pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension d’image
doit passer par un tour app-server Codex borné. N’utilisez pas
les anciennes références GPT Codex ; doctor réécrit ce préfixe hérité en `openai/gpt-*`.

## Modèles de déploiement

### Déploiement Codex de base

Utilisez la configuration de démarrage rapide quand tous les tours d’agent OpenAI doivent utiliser Codex
par défaut.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### Déploiement avec fournisseurs mixtes

Cette forme garde Claude comme agent par défaut et ajoute un agent Codex nommé :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

Avec cette configuration, l’agent `main` utilise son chemin fournisseur normal et l’agent
`codex` utilise l’app-server Codex.

### Déploiement Codex en échec fermé

Pour les tours d’agent OpenAI, `openai/gpt-*` se résout déjà vers Codex lorsque le
plugin groupé est disponible. Ajoutez une politique de runtime explicite lorsque vous voulez une règle
écrite d’échec fermé :

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Avec Codex forcé, OpenClaw échoue tôt si le plugin Codex est désactivé, si
l’app-server est trop ancien, ou si l’app-server ne peut pas démarrer.

## Politique d’app-server

Par défaut, le plugin démarre localement le binaire Codex géré par OpenClaw avec le transport
stdio. Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un
exécutable différent. Utilisez le transport WebSocket uniquement lorsqu’un app-server est déjà
en cours d’exécution ailleurs :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Les sessions app-server stdio locales utilisent par défaut la posture d’opérateur local de confiance :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Si les exigences Codex locales interdisent cette
posture YOLO implicite, OpenClaw sélectionne plutôt les permissions de gardien autorisées.
Lorsqu’un bac à sable OpenClaw est actif pour la session, OpenClaw désactive le
Code Mode natif de Codex, les serveurs MCP utilisateur et l’exécution de plugins adossée à l’application pour ce
tour au lieu de s’appuyer sur le bac à sable côté hôte de Codex. L’accès shell est exposé
via des outils dynamiques adossés au bac à sable OpenClaw, comme `sandbox_exec` et
`sandbox_process`, lorsque les outils exec/process normaux sont disponibles.

Utilisez le mode exec OpenClaw normalisé lorsque vous voulez l’auto-review natif de Codex avant
les échappements de bac à sable ou les permissions supplémentaires :

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Pour les sessions app-server Codex, OpenClaw mappe `tools.exec.mode: "auto"` vers les
approbations revues par Guardian de Codex, généralement
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et
`sandbox: "workspace-write"` lorsque les exigences locales autorisent ces valeurs.
Dans `tools.exec.mode: "auto"`, OpenClaw ne préserve pas les anciens remplacements Codex non sûrs
`approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ; utilisez
`tools.exec.mode: "full"` pour une posture Codex intentionnelle sans approbation. L’ancien
préréglage `plugins.entries.codex.config.appServer.mode: "guardian"` fonctionne toujours,
mais `tools.exec.mode: "auto"` est la surface OpenClaw normalisée.

Pour la comparaison au niveau des modes avec les approbations exec hôte et les permissions ACPX,
consultez [Modes de permission](/fr/tools/permission-modes).

Pour chaque champ app-server, l’ordre d’authentification, l’isolation d’environnement, la découverte et
le comportement de délai d’expiration, consultez [Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le plugin groupé enregistre `/codex` comme commande slash sur tout canal qui
prend en charge les commandes texte OpenClaw.

L’exécution et le contrôle natifs nécessitent un propriétaire ou un client Gateway `operator.admin`.
Cela inclut la liaison ou la reprise de fils, l’envoi ou l’arrêt de tours,
le changement d’état de modèle, de mode rapide ou de permission, la compaction ou la revue, et
la suppression d’une liaison. Les autres expéditeurs autorisés conservent les commandes en lecture seule pour le statut, l’aide,
le compte, le modèle, le fil, le serveur MCP, les compétences et l’inspection des liaisons.

Formes courantes :

- `/codex status` vérifie la connectivité app-server, les modèles, le compte, les limites de débit,
  les serveurs MCP et les skills.
- `/codex models` liste les modèles app-server Codex actifs.
- `/codex threads [filter]` liste les fils app-server Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un
  fil Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le fil attaché.
- `/codex review` démarre la revue native Codex pour le fil attaché.
- `/codex diagnostics [note]` demande avant d’envoyer les commentaires Codex pour le
  fil attaché.
- `/codex account` affiche le statut du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP app-server Codex.
- `/codex skills` liste les skills app-server Codex.

Pour la plupart des rapports de support, commencez par `/diagnostics [note]` dans la conversation
où le bug s’est produit. Cela crée un rapport de diagnostics Gateway et, pour les sessions
du harnais Codex, demande l’approbation d’envoyer le paquet de commentaires Codex pertinent.
Consultez [Export de diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité et le comportement
des discussions de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement le téléversement des
commentaires Codex pour le fil actuellement attaché sans le paquet complet de diagnostics
Gateway.

### Inspecter les fils Codex localement

Le moyen le plus rapide d’inspecter une mauvaise exécution Codex est souvent d’ouvrir directement le fil
Codex natif :

```bash
codex resume <thread-id>
```

Récupérez l’id du fil dans la réponse `/diagnostics` terminée, `/codex binding`, ou
`/codex threads [filter]`.

Pour les mécanismes de téléversement et les limites de diagnostics au niveau du runtime, consultez
[Runtime du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

Dans le répertoire personnel par agent par défaut, l’authentification est sélectionnée dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Exécutez `openclaw doctor --fix` pour migrer les anciens
   ids de profil d’authentification Codex hérités et l’ancien ordre d’authentification Codex.
2. Le compte existant de l’app-server dans le répertoire personnel Codex de cet agent.
3. Pour les lancements d’app-server stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et que l’authentification OpenAI est
   toujours requise.

Quand OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
garde les clés API au niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer accidentellement les tours app-server Codex natifs via l’API.
Les profils explicites par clé API Codex et le repli local de clé d’environnement stdio utilisent la connexion
app-server au lieu de l’environnement hérité du processus enfant. Les connexions app-server WebSocket
ne reçoivent pas le repli de clé API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le
propre compte de l’app-server distant.
Lorsque des plugins Codex natifs sont configurés, OpenClaw installe ou actualise ces
plugins via l’app-server connecté avant d’exposer les applications appartenant aux plugins au
fil Codex. `app/list` reste la source de vérité pour les ids d’application,
l’accessibilité et les métadonnées, mais OpenClaw possède la décision d’activation par fil :
si la politique autorise une application accessible listée, OpenClaw envoie
`thread/start.config.apps[appId].enabled = true` même lorsque `app/list` signale actuellement
cette application comme désactivée. Ce chemin n’invente pas l’installation d’application pour
des ids inconnus ; OpenClaw active uniquement les plugins de marketplace avec `plugin/install`
puis actualise l’inventaire.

Si un profil d’abonnement atteint une limite d’utilisation Codex, OpenClaw enregistre l’heure de réinitialisation
quand Codex en signale une et essaie le profil d’authentification ordonné suivant pour la même
exécution Codex. Lorsque l’heure de réinitialisation est passée, le profil d’abonnement redevient éligible
sans changer le modèle `openai/gpt-*` sélectionné ni le runtime Codex.

Pour les lancements locaux du serveur d’application stdio, OpenClaw définit `CODEX_HOME` sur un répertoire par agent afin que la configuration Codex, les fichiers d’authentification/de compte, le cache/les données des plugins et l’état natif des fils ne lisent ni n’écrivent par défaut dans le `~/.codex` personnel de l’opérateur. OpenClaw conserve le `HOME` normal du processus ; les sous-processus exécutés par Codex peuvent toujours trouver la configuration et les jetons du répertoire utilisateur, et Codex peut découvrir les entrées partagées `$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json`. Avec `appServer.homeScope: "user"`, OpenClaw utilise à la place le répertoire d’accueil Codex natif de l’utilisateur et son compte existant, sans injecter de profil d’authentification OpenClaw.

Si un déploiement nécessite une isolation supplémentaire de l’environnement, ajoutez ces variables à `appServer.clearEnv` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` n’affecte que le processus enfant du serveur d’application Codex lancé. OpenClaw retire `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement local : `CODEX_HOME` reste pointé vers la portée d’agent ou d’utilisateur sélectionnée, et `HOME` reste hérité afin que les sous-processus puissent utiliser l’état normal du répertoire utilisateur.

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations d’espace de travail natives de Codex : `read`, `write`, `edit`, `apply_patch`, `exec`, `process` et `update_plan`. La plupart des autres outils d’intégration OpenClaw, tels que la messagerie, les médias, Cron, le navigateur, les nœuds, Gateway et `heartbeat_respond`, sont disponibles via la recherche d’outils Codex dans l’espace de noms `openclaw`, ce qui réduit le contexte initial du modèle. La recherche Web utilise par défaut l’outil hébergé `web_search` de Codex lorsque la recherche est activée et qu’aucun fournisseur géré n’est sélectionné. La recherche hébergée native et l’outil dynamique `web_search` géré par OpenClaw s’excluent mutuellement afin que la recherche gérée ne puisse pas contourner les restrictions de domaine natives. OpenClaw utilise l’outil géré lorsque la recherche hébergée est indisponible, explicitement désactivée ou remplacée par un fournisseur géré sélectionné. OpenClaw garde l’extension autonome `web.run` de Codex désactivée, car le trafic de serveur d’application de production rejette son espace de noms `web` défini par l’utilisateur. `tools.web.search.enabled: false` désactive les deux chemins, tout comme les exécutions LLM uniquement avec outils désactivés. Codex traite `"cached"` comme une préférence et la résout en accès externe en direct pour les tours de serveur d’application sans restriction. Le basculement automatique géré échoue en mode fermé lorsque des `allowedDomains` natifs sont définis, afin que la liste d’autorisation ne puisse pas être contournée. Les changements persistants de politique de recherche effective font pivoter le fil Codex lié avant le tour suivant. Les restrictions transitoires par tour utilisent un fil restreint temporaire et préservent la liaison existante pour une reprise ultérieure. Les réponses sources `sessions_yield` et limitées aux outils de message restent directes, car il s’agit de contrats de contrôle de tour. `sessions_spawn` reste recherchable afin que le `spawn_agent` natif de Codex demeure la surface principale de sous-agent Codex, tandis que la délégation explicite OpenClaw ou ACP reste disponible via l’espace de noms d’outils dynamiques `openclaw`. Les instructions de collaboration Heartbeat indiquent à Codex de rechercher `heartbeat_respond` avant de terminer un tour Heartbeat lorsque l’outil n’est pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur d’application Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage de la charge utile complète des outils.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Valeur par défaut | Signification                                                                                          |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"`    | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex. |
| `codexDynamicToolsExclude` | `[]`              | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours du serveur d’application Codex.   |
| `codexPlugins`             | désactivé         | Prise en charge native des plugins/applications Codex pour les plugins organisés migrés installés depuis la source. |

Champs `appServer` pris en charge :

| Champ                                         | Par défaut                                            | Signification                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état de Codex par agent OpenClaw. `"user"` partage le `$CODEX_HOME` natif ou `~/.codex`, utilise l’authentification native et active la gestion des fils réservée au propriétaire. La portée utilisateur nécessite stdio.                                                                                                                                                                          |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez-le non défini pour utiliser le binaire géré ; définissez-le uniquement pour un remplacement explicite.                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                                                   |
| `url`                                         | non défini                                            | URL WebSocket du serveur d’application.                                                                                                                                                                                                                                                                                                                                                                              |
| `authToken`                                   | non défini                                            | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput comme `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus serveur d’application stdio lancé après qu’OpenClaw a construit son environnement hérité. OpenClaw conserve le `CODEX_HOME` sélectionné et le `HOME` hérité pour les lancements locaux.                                                                                                                                                    |
| `codeModeOnly`                                | `false`                                                | Active la surface d’outils Codex limitée au mode code. Les outils dynamiques OpenClaw restent enregistrés auprès de Codex afin que les appels `tools.*` imbriqués reviennent via le pont `item/tool/call` du serveur d’application.                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | non défini                                            | Racine de l’espace de travail distant du serveur d’application Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail à partir de l’espace de travail OpenClaw résolu, conserve le suffixe du cwd actuel sous cette racine distante et envoie uniquement le cwd final du serveur d’application à Codex. Si le cwd est en dehors de la racine résolue de l’espace de travail OpenClaw, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway vers le serveur d’application distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration pour les appels du plan de contrôle du serveur d’application.                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre silencieuse après que Codex accepte un tour ou après une requête de serveur d’application limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité de complétion et de progression utilisée après un transfert d’outil, une complétion d’outil native, une progression brute de l’assistant après outil, une complétion de raisonnement brut ou une progression de raisonnement pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes où la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour une exécution YOLO ou relue par un gardien. Les exigences stdio locales qui omettent `danger-full-access`, l’approbation `never` ou le relecteur `user` rendent le gardien implicite par défaut.                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation de gardien autorisée | Politique d’approbation native de Codex envoyée au démarrage, à la reprise ou au tour du fil. Les valeurs par défaut du gardien privilégient `"on-request"` lorsqu’elle est autorisée.                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable de gardien autorisé | Mode de bac à sable natif de Codex envoyé au démarrage ou à la reprise du fil. Les valeurs par défaut du gardien privilégient `"workspace-write"` lorsqu’il est autorisé, sinon `"read-only"`. Lorsqu’un bac à sable OpenClaw est actif, les tours `danger-full-access` utilisent Codex `workspace-write` avec un accès réseau dérivé du paramètre de sortie du bac à sable OpenClaw.                              |
| `approvalsReviewer`                           | `"user"` ou un relecteur de gardien autorisé           | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsque c’est autorisé, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                                                                                                                                                                     |
| `serviceTier`                                 | non défini                                            | Niveau de service facultatif du serveur d’application Codex. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flexible, `null` efface le remplacement, et l’ancien `"fast"` est accepté comme `"priority"`.                                                                                                                                                                           |
| `networkProxy`                                | désactivé                                             | Active la mise en réseau du profil d’autorisations Codex pour les commandes du serveur d’application. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la sélectionne avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre un environnement Codex adossé au bac à sable OpenClaw auprès du serveur d’application Codex 0.132.0 ou plus récent, afin que l’exécution native Codex puisse s’exécuter dans le bac à sable OpenClaw actif.                                                                                                                                                                        |

`appServer.networkProxy` est explicite, car il modifie le contrat du bac à sable
Codex. Lorsqu’il est activé, OpenClaw définit aussi `features.network_proxy.enabled` et
`default_permissions` dans la configuration du fil Codex afin que le profil
d’autorisation généré puisse démarrer la mise en réseau gérée par Codex. Par
défaut, OpenClaw génère un nom de profil résistant aux collisions
`openclaw-network-<fingerprint>` à partir du corps du profil ; utilisez
`profileName` uniquement lorsqu’un nom local stable est requis.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Si l’exécution normale de l’app-server utilisait `danger-full-access`, l’activation de
`networkProxy` utilise un accès au système de fichiers de type espace de travail pour le
profil d’autorisation généré. L’application réseau gérée par Codex correspond à un réseau
sandboxé ; un profil en accès complet ne protégerait donc pas le trafic sortant.
Les entrées de domaine utilisent `allow` ou `deny` ; les entrées de socket Unix utilisent les
valeurs Codex `allow` ou `none`.

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par défaut un
watchdog OpenClaw de 90 secondes. Un argument `timeoutMs` positif propre à l’appel étend
ou raccourcit ce budget d’outil spécifique. L’outil `image_generate` utilise
`agents.defaults.imageGenerationModel.timeoutMs` lorsque l’appel d’outil ne fournit pas son
propre délai d’expiration, ou sinon une valeur par défaut de génération d’image de
120 secondes. L’outil `image` de compréhension multimédia utilise
`tools.media.image.timeoutSeconds` ou sa valeur multimédia par défaut de 60 secondes. Pour
la compréhension d’image, ce délai s’applique à la requête elle-même et n’est pas réduit par
le travail de préparation effectué auparavant. Les budgets d’outils dynamiques sont plafonnés
à 600000 ms. En cas de délai d’expiration, OpenClaw interrompt le signal de l’outil lorsque
c’est pris en charge et renvoie à Codex une réponse d’outil dynamique en échec afin que le
tour puisse continuer au lieu de laisser la session en `processing`.
Ce watchdog constitue le budget dynamique externe `item/tool/call` ; les délais d’expiration
de requête propres au fournisseur s’exécutent à l’intérieur de cet appel et conservent leur
propre sémantique de délai d’expiration.

Après que Codex a accepté un tour, puis après qu’OpenClaw a répondu à une requête
app-server limitée au tour, le harnais attend de Codex qu’il progresse dans le tour courant et
termine finalement le tour natif avec `turn/completed`. Si l’app-server reste silencieux pendant
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw tente au mieux d’interrompre le tour
Codex, enregistre un diagnostic de délai d’expiration et libère la voie de session OpenClaw
afin que les messages de chat suivants ne soient pas mis en file derrière un ancien tour natif
bloqué. La plupart des notifications non terminales du même tour désarment ce watchdog
court, car Codex a prouvé que le tour est toujours actif. Les transferts vers des outils utilisent
un budget d’inactivité post-outil plus long : après qu’OpenClaw renvoie une réponse
`item/tool/call`, après la fin d’éléments d’outils natifs tels que `commandExecution`, après des
achèvements bruts `custom_tool_call_output`, et après une progression brute post-outil de
l’assistant, des achèvements de raisonnement bruts ou une progression de raisonnement. La
garde utilise `appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré
et utilise sinon cinq minutes par défaut. Ce même budget post-outil étend aussi le watchdog de
progression pour la fenêtre de synthèse silencieuse avant que Codex n’émette le prochain
événement du tour courant. Les notifications globales de l’app-server, comme les mises à
jour de limites de débit, ne réinitialisent pas la progression d’inactivité du tour. Les
achèvements de raisonnement, les achèvements `agentMessage` de commentaire et la
progression brute de raisonnement ou d’assistant avant outil peuvent être suivis d’une réponse
finale automatique ; ils utilisent donc la garde de réponse post-progression au lieu de libérer
immédiatement la voie de session. Seuls les éléments `agentMessage` finalisés finaux/non
commentaires et les achèvements bruts d’assistant avant outil arment la libération de sortie
assistant : si Codex devient ensuite silencieux sans `turn/completed`, OpenClaw tente au
mieux d’interrompre le tour natif et libère la voie de session. Si un autre observateur de tour
remporte cette course de libération, OpenClaw accepte quand même l’élément final assistant
terminé une fois qu’aucune requête native, aucun élément ni aucun achèvement d’outil
dynamique ne reste actif, et que la libération de sortie assistant appartient toujours au dernier
élément terminé, sans achèvement d’élément ultérieur. Cela peut préserver la réponse finale
après un travail d’outil terminé sans rejouer le tour. Les deltas partiels de l’assistant, les
réponses antérieures obsolètes et les achèvements ultérieurs vides ne sont pas admissibles.
Les échecs app-server stdio rejouables sans risque, y compris les délais d’expiration
d’inactivité d’achèvement de tour sans preuve d’assistant, d’outil, d’élément actif ou d’effet de
bord, sont réessayés une fois sur une nouvelle tentative d’app-server. Les délais d’expiration
non sûrs retirent quand même le client app-server bloqué et libèrent la voie de session
OpenClaw. Ils effacent aussi l’ancienne liaison de thread natif au lieu d’être rejoués
automatiquement. Les délais d’expiration de surveillance d’achèvement affichent un texte
spécifique à Codex : les cas rejouables sans risque indiquent que la réponse peut être
incomplète, tandis que les cas non sûrs demandent à l’utilisateur de vérifier l’état actuel avant
de réessayer. Les diagnostics publics de délai d’expiration incluent des champs structurels
comme la dernière méthode de notification app-server, l’id/le type/le rôle de l’élément de
réponse assistant brut, les nombres de requêtes/d’éléments actifs et l’état de surveillance
armée. Lorsque la dernière notification est un élément de réponse assistant brut, ils incluent
aussi un aperçu borné du texte de l’assistant. Ils n’incluent pas le prompt brut ni le contenu
des outils.

Les substitutions d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour des tests locaux ponctuels. La
configuration est préférable pour les déploiements reproductibles, car elle conserve le
comportement du Plugin dans le même fichier révisé que le reste de la configuration du
harnais Codex.

## Plugins Codex natifs

La prise en charge des Plugins Codex natifs utilise les capacités d’application et de Plugin
propres à l’app-server Codex dans le même thread Codex que le tour du harnais OpenClaw.
OpenClaw ne traduit pas les Plugins Codex en outils dynamiques OpenClaw synthétiques
`codex_plugin_*`.

`codexPlugins` affecte uniquement les sessions qui sélectionnent le harnais Codex natif. Il n’a
aucun effet sur les exécutions du harnais intégré, les exécutions normales du fournisseur
OpenAI, les liaisons de conversation ACP ni les autres harnais.

Configuration migrée minimale :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configuration de l’application du thread est calculée lorsqu’OpenClaw établit une session
de harnais Codex ou remplace une ancienne liaison de thread Codex. Elle n’est pas
recalculée à chaque tour. Après avoir modifié `codexPlugins`, utilisez `/new`, `/reset` ou
redémarrez le gateway afin que les futures sessions de harnais Codex démarrent avec le jeu
d’applications mis à jour.

Pour l’éligibilité à la migration, l’inventaire des applications, la stratégie d’actions
destructrices, les sollicitations et les diagnostics de Plugin natif, consultez
[Plugins Codex natifs](/fr/plugins/codex-native-plugins).

L’accès aux applications et Plugins côté OpenAI est contrôlé par le compte Codex connecté
et, pour les espaces de travail Business et Enterprise/Edu, par les contrôles d’applications de
l’espace de travail. Consultez
[Utiliser Codex avec votre forfait ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
pour la présentation OpenAI des comptes et des contrôles d’espace de travail.

## Computer Use

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

Version courte : OpenClaw n’intègre pas l’application de contrôle du bureau et n’exécute pas
lui-même les actions de bureau. Il prépare l’app-server Codex, vérifie que le serveur MCP
`computer-use` est disponible, puis laisse Codex posséder les appels d’outils MCP natifs
pendant les tours en mode Codex.

## Frontières d’exécution

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw
  d’exécuter ces outils, OpenClaw reste donc dans le chemin d’exécution.
- Les outils shell, patch, MCP et applications natives propres à Codex appartiennent à Codex.
  OpenClaw peut observer ou bloquer certains événements natifs via le relais pris en charge,
  mais il ne réécrit pas les arguments des outils natifs.
- Codex possède la compaction native. OpenClaw conserve un miroir de transcript pour
  l’historique du canal, la recherche, `/new`, `/reset` et les futurs changements de modèle ou
  de harnais, mais il ne remplace pas la compaction Codex par un résumé OpenClaw ou de
  moteur de contexte.
- La génération multimédia, la compréhension multimédia, le TTS, les approbations et la
  sortie d’outils de messagerie continuent de passer par les paramètres fournisseur/modèle
  OpenClaw correspondants.
- `tool_result_persist` s’applique aux résultats d’outils de transcript appartenant à OpenClaw,
  pas aux enregistrements de résultats d’outils natifs Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion native des
autorisations, le pilotage de file d’attente, les mécanismes d’envoi de retours Codex et les
détails de compaction, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme fournisseur `/model` normal :** c’est attendu pour les
nouvelles configurations. Sélectionnez un modèle `openai/gpt-*`, activez
`plugins.entries.codex.enabled`, puis vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise le harnais intégré au lieu de Codex :** assurez-vous que la référence de
modèle est `openai/gpt-*` sur le fournisseur OpenAI officiel et que le Plugin Codex est
installé et activé. Si vous avez besoin d’une preuve stricte pendant les tests, définissez
`agentRuntime.id: "codex"` au niveau du fournisseur ou du modèle. Une exécution Codex
forcée échoue au lieu de se rabattre sur OpenClaw.

**L’exécution OpenAI Codex se rabat sur le chemin par clé d’API :** collectez un extrait
Gateway expurgé qui montre le modèle, l’exécution, le fournisseur sélectionné et l’échec.
Demandez aux collaborateurs concernés d’exécuter cette commande en lecture seule sur leur
hôte OpenClaw :

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Les extraits utiles incluent généralement `openai/gpt-5.5` ou `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` ou `harnessRuntime`,
`candidateProvider: "openai"`, et un résultat `401`, `Incorrect API key` ou
`No API key`. Une exécution corrigée doit montrer le chemin OAuth OpenAI au lieu d’un échec
OpenAI ordinaire par clé d’API.

**Il reste des références de modèles Codex héritées dans la configuration :** exécutez
`openclaw doctor --fix`. Doctor réécrit les références de modèles héritées en `openai/*`,
supprime les anciennes épingles de session et d’exécution au niveau de l’agent entier, et
préserve les substitutions de profils d’authentification existantes.

**L’app-server est rejeté :** utilisez l’app-server Codex `0.125.0` ou une version plus récente.
Les préversions de même version ou les versions suffixées par build comme
`0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées, car OpenClaw teste le plancher stable
du protocole `0.125.0`.

**`/codex status` ne peut pas se connecter :** vérifiez que le Plugin `codex` groupé est activé,
que `plugins.allow` l’inclut lorsqu’une liste d’autorisation est configurée, et que tout
`appServer.command`, `url`, `authToken` ou en-tête personnalisé est valide.

**La découverte de modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte. Consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`, les
en-têtes, et que l’app-server distant parle la même version du protocole app-server Codex.

**Le shell natif ou les outils de patch sont bloqués avec `Native hook relay unavailable` :**
le fil Codex essaie encore d’utiliser un identifiant de relais de hook natif
qu’OpenClaw n’a plus enregistré. Il s’agit d’un problème de transport de hook
Codex natif, et non d’un échec du backend ACP, du fournisseur, de GitHub ou
d’une commande shell. Démarrez une nouvelle session dans la discussion concernée
avec `/new` ou `/reset`, puis réessayez une commande sans risque. Si cela
fonctionne une fois mais que l’appel suivant à l’outil natif échoue à nouveau,
traitez `/new` uniquement comme une solution de contournement temporaire :
copiez le prompt dans une nouvelle session après avoir redémarré le serveur
d’application Codex ou le Gateway OpenClaw, afin que les anciens fils soient
abandonnés et que les enregistrements de hooks natifs soient recréés.

**Un modèle non-Codex utilise le harnais intégré :** c’est attendu sauf si la
politique d’exécution du fournisseur ou du modèle le route vers un autre
harnais. Les références de fournisseur non-OpenAI simples restent sur leur
chemin de fournisseur normal en mode `auto`.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez la récupération du relais de hook
natif ci-dessus. Consultez [Codex Computer Use](/fr/plugins/codex-computer-use#troubleshooting).

## Connexe

- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Aide OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Export des diagnostics](/fr/gateway/diagnostics)
- [État](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
