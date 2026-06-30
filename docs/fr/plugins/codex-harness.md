---
read_when:
    - Vous souhaitez utiliser le harnais app-server Codex inclus
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements Codex uniquement échouent au lieu de se rabattre sur OpenClaw
summary: Exécuter les tours d’agent intégrés d’OpenClaw via le harnais de serveur d’application Codex inclus
title: Harnais Codex
x-i18n:
    generated_at: "2026-06-30T14:01:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le Plugin `codex` groupé permet à OpenClaw d’exécuter des tours d’agent OpenAI intégrés
via l’app-server Codex au lieu du harness OpenClaw intégré.

Utilisez le harness Codex lorsque vous voulez que Codex possède la session d’agent de bas niveau :
reprise native de thread, continuation native d’outils, compaction native et
exécution app-server. OpenClaw possède toujours les canaux de chat, les fichiers de session, la
sélection du modèle, les outils dynamiques OpenClaw, les approbations, la livraison des médias et le miroir visible
de la transcription.

La configuration normale utilise des références de modèles OpenAI canoniques comme `openai/gpt-5.5`.
Ne configurez pas d’anciennes références GPT Codex. Placez l’ordre d’authentification des agents OpenAI
sous `auth.order.openai` ; les anciens identifiants de profils d’authentification Codex et
les anciennes entrées d’ordre d’authentification Codex sont un état hérité réparé par
`openclaw doctor --fix`.

Lorsqu’aucun sandbox OpenClaw n’est actif, OpenClaw démarre les threads de l’app-server Codex
avec le mode de code natif Codex activé tout en laissant le mode code uniquement désactivé par défaut.
Cela garde disponibles l’espace de travail natif Codex et les capacités de code, tandis que
les outils dynamiques OpenClaw continuent via le pont app-server `item/tool/call`.
Le sandboxing OpenClaw actif et les politiques d’outils restreintes désactivent entièrement le mode de code natif,
sauf si vous activez explicitement le chemin expérimental exec-server de sandbox.

Cette fonctionnalité native Codex est distincte de
[OpenClaw code mode](/fr/reference/code-mode), qui est un runtime QuickJS-WASI optionnel
pour les exécutions OpenClaw génériques avec une forme d’entrée `exec` différente.

Pour la séparation plus large modèle/fournisseur/runtime, commencez par
[Agent runtimes](/fr/concepts/agent-runtimes). En bref :
`openai/gpt-5.5` est la référence de modèle, `codex` est le runtime, et Telegram,
Discord, Slack ou un autre canal reste la surface de communication.

## Exigences

- OpenClaw avec le Plugin `codex` groupé disponible.
- Si votre configuration utilise `plugins.allow`, incluez `codex`.
- App-server Codex `0.125.0` ou plus récent. Le Plugin groupé gère par défaut un binaire
  app-server Codex compatible, donc les commandes locales `codex` sur `PATH` n’affectent pas
  le démarrage normal du harness.
- Authentification Codex disponible via `openclaw models auth login --provider openai`,
  un compte app-server dans le répertoire personnel Codex de l’agent, ou un profil d’authentification Codex explicite
  par clé API.

Pour la précédence d’authentification, l’isolation d’environnement, les commandes app-server personnalisées, la
découverte de modèles et tous les champs de configuration, consultez
[Codex harness reference](/fr/plugins/codex-harness-reference).

## Démarrage rapide

La plupart des utilisateurs qui veulent Codex dans OpenClaw veulent ce chemin : connectez-vous avec un
abonnement ChatGPT/Codex, activez le Plugin `codex` groupé et utilisez une
référence de modèle canonique `openai/gpt-*`.

Connectez-vous avec OAuth Codex :

```bash
openclaw models auth login --provider openai
```

Activez le Plugin `codex` groupé et sélectionnez un modèle d’agent OpenAI :

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

Redémarrez le Gateway après avoir modifié la configuration des Plugins. Si un chat existant
a déjà une session, utilisez `/new` ou `/reset` avant de tester les changements de runtime afin que le prochain
tour résolve le harness depuis la configuration actuelle.

## Configuration

La configuration de démarrage rapide est la configuration minimale viable du harness Codex. Définissez les options du
harness Codex dans la configuration OpenClaw, et utilisez la CLI uniquement pour l’authentification Codex :

| Besoin                                 | Définir                                                                         | Emplacement                         |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Activer le harness                     | `plugins.entries.codex.enabled: true`                                            | Configuration OpenClaw             |
| Garder une installation de Plugin autorisée | Inclure `codex` dans `plugins.allow`                                             | Configuration OpenClaw             |
| Router les tours d’agent OpenAI via Codex | `agents.defaults.model` ou `agents.list[].model` comme `openai/gpt-*`           | Configuration d’agent OpenClaw     |
| Se connecter avec OAuth ChatGPT/Codex  | `openclaw models auth login --provider openai`                                   | Profil d’authentification CLI      |
| Ajouter une clé API de secours pour les exécutions Codex | Profil de clé API `openai:*` listé après l’authentification par abonnement dans `auth.order.openai` | Profil d’authentification CLI + configuration OpenClaw |
| Échouer en mode fermé lorsque Codex est indisponible | `agentRuntime.id: "codex"` du fournisseur ou du modèle                          | Configuration modèle/fournisseur OpenClaw |
| Utiliser le trafic direct de l’API OpenAI | `agentRuntime.id: "openclaw"` du fournisseur ou du modèle avec l’authentification OpenAI normale | Configuration modèle/fournisseur OpenClaw |
| Ajuster le comportement de l’app-server | `plugins.entries.codex.config.appServer.*`                                       | Configuration du Plugin Codex      |
| Activer les applications Plugin Codex natives | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuration du Plugin Codex      |
| Activer Codex Computer Use             | `plugins.entries.codex.config.computerUse.*`                                     | Configuration du Plugin Codex      |

Utilisez des références de modèle `openai/gpt-*` pour les tours d’agent OpenAI adossés à Codex. Préférez
`auth.order.openai` pour un ordre abonnement d’abord / clé API de secours. Les identifiants de profils d’authentification
Codex hérités existants et l’ordre d’authentification Codex hérité sont un état hérité réservé à doctor ;
n’écrivez pas de nouvelles références GPT Codex héritées.

Ne définissez pas `compaction.model` ni `compaction.provider` sur les agents adossés à Codex.
Codex compacte via son état de thread app-server natif, donc OpenClaw ignore
ces remplacements locaux de résumeur au runtime et `openclaw doctor --fix` les supprime
lorsque l’agent utilise Codex.

Lossless reste pris en charge comme moteur de contexte pour l’assemblage, l’ingestion et
la maintenance autour des tours Codex. Configurez-le via
`plugins.slots.contextEngine: "lossless-claw"` et
`plugins.entries.lossless-claw.config.summaryModel`, et non via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migre l’ancienne
forme `compaction.provider: "lossless-claw"` vers l’emplacement de moteur de contexte Lossless
lorsque Codex est le runtime actif, mais Codex natif possède toujours la Compaction.

Le harness app-server Codex natif prend en charge les moteurs de contexte qui nécessitent
un assemblage de pré-prompt. Les backends CLI génériques, y compris `codex-cli`, ne fournissent pas
cette capacité hôte.

Pour les agents adossés à Codex, `/compact` démarre la Compaction app-server Codex native sur
le thread lié. OpenClaw n’attend pas l’achèvement, n’impose pas de délai d’expiration OpenClaw,
ne redémarre pas l’app-server partagé et ne se rabat pas sur un moteur de contexte ou un
résumeur OpenAI public. Si la liaison de thread Codex native est manquante ou
obsolète, la commande échoue en mode fermé afin que l’opérateur voie la vraie frontière de runtime
au lieu de changer silencieusement de backend de Compaction.

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
des Responses OpenAI simples.

Le reste de cette page couvre les variantes courantes entre lesquelles les utilisateurs doivent choisir :
forme de déploiement, routage avec échec en mode fermé, politique d’approbation guardian, Plugins Codex natifs
et Computer Use. Pour les listes complètes d’options, les valeurs par défaut, les énumérations, la découverte,
l’isolation d’environnement, les délais d’expiration et les champs de transport app-server, consultez
[Codex harness reference](/fr/plugins/codex-harness-reference).

## Vérifier le runtime Codex

Utilisez `/status` dans le chat où vous attendez Codex. Un tour d’agent OpenAI adossé à Codex
affiche :

```text
Runtime: OpenAI Codex
```

Vérifiez ensuite l’état de l’app-server Codex :

```text
/codex status
/codex models
```

`/codex status` signale la connectivité app-server, le compte, les limites de débit, les serveurs MCP
et les Skills. `/codex models` liste le catalogue app-server Codex en direct pour
le harness et le compte. Si `/status` est surprenant, consultez
[Dépannage](#troubleshooting).

## Routage et sélection de modèle

Gardez les références de fournisseur et la politique de runtime séparées :

- Utilisez `openai/gpt-*` pour les tours d’agent OpenAI via Codex.
- N’utilisez pas de références GPT Codex héritées dans la configuration. Exécutez `openclaw doctor --fix` pour
  réparer les références héritées et les épingles de route de session obsolètes.
- `agentRuntime.id: "codex"` est optionnel pour le mode automatique OpenAI normal, mais utile
  lorsqu’un déploiement doit échouer en mode fermé si Codex est indisponible.
- `agentRuntime.id: "openclaw"` inscrit volontairement un fournisseur ou un modèle dans le runtime
  intégré OpenClaw lorsque c’est intentionnel.
- `/codex ...` contrôle les conversations app-server Codex natives depuis le chat.
- ACP/acpx est un chemin de harness externe distinct. Utilisez-le uniquement lorsque l’utilisateur demande
  ACP/acpx ou un adaptateur de harness externe.

Routage des commandes courantes :

| Intention de l’utilisateur                           | Utiliser                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Attacher le chat actuel                              | `/codex bind [--cwd <path>]`                                                                          |
| Reprendre un thread Codex existant                   | `/codex resume <thread-id>`                                                                           |
| Lister ou filtrer les threads Codex                  | `/codex threads [filter]`                                                                             |
| Lister les Plugins Codex natifs                      | `/codex plugins list`                                                                                 |
| Activer ou désactiver un Plugin Codex natif configuré | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Attacher une session CLI Codex existante sur un nœud appairé | `/codex sessions --host <node> [filter]`, puis `/codex resume <session-id> --host <node> --bind here` |
| Envoyer uniquement un retour Codex                   | `/codex diagnostics [note]`                                                                           |
| Démarrer une tâche ACP/acpx                          | Commandes de session ACP/acpx, pas `/codex`                                                          |

| Cas d’utilisation                                    | Configurer                                                             | Vérifier                                | Notes                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif    | `openai/gpt-*` plus Plugin `codex` activé                              | `/status` affiche `Runtime: OpenAI Codex` | Chemin recommandé                     |
| Échec fermé si Codex est indisponible                | Provider ou modèle `agentRuntime.id: "codex"`                          | Le tour échoue au lieu d’utiliser le fallback intégré | À utiliser pour les déploiements Codex uniquement |
| Trafic direct par clé API OpenAI via OpenClaw         | Provider ou modèle `agentRuntime.id: "openclaw"` et auth OpenAI normale | `/status` affiche le runtime OpenClaw   | À utiliser uniquement lorsque OpenClaw est intentionnel |
| Configuration héritée                                | anciennes refs GPT Codex                                               | `openclaw doctor --fix` la réécrit      | Ne pas écrire de nouvelle configuration de cette façon |
| Adaptateur Codex ACP/acpx                            | ACP `sessions_spawn({ runtime: "acp" })`                               | État de tâche/session ACP               | Séparé du harnais Codex natif         |

`agents.defaults.imageModel` suit la même séparation par préfixe. Utilisez `openai/gpt-*`
pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension
d’images doit passer par un tour limité du serveur d’application Codex. N’utilisez pas
les anciennes refs GPT Codex ; doctor réécrit ce préfixe hérité en `openai/gpt-*`.

## Modèles de déploiement

### Déploiement Codex de base

Utilisez la configuration quickstart lorsque tous les tours d’agent OpenAI doivent utiliser Codex par
défaut.

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

### Déploiement avec providers mixtes

Cette forme conserve Claude comme agent par défaut et ajoute un agent Codex nommé :

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

Avec cette configuration, l’agent `main` utilise son chemin de provider normal et l’agent
`codex` utilise le serveur d’application Codex.

### Déploiement Codex à échec fermé

Pour les tours d’agent OpenAI, `openai/gpt-*` se résout déjà vers Codex lorsque le
Plugin intégré est disponible. Ajoutez une politique de runtime explicite lorsque vous voulez une règle
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

Lorsque Codex est forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si le
serveur d’application est trop ancien ou si le serveur d’application ne peut pas démarrer.

## Politique du serveur d’application

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec le transport
stdio. Définissez `appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un
exécutable différent. Utilisez le transport WebSocket uniquement lorsqu’un serveur d’application est déjà
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

Les sessions de serveur d’application stdio locales adoptent par défaut la posture d’opérateur local de confiance :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Si les exigences Codex locales interdisent cette
posture YOLO implicite, OpenClaw sélectionne à la place les permissions guardian autorisées.
Lorsqu’un sandbox OpenClaw est actif pour la session, OpenClaw désactive le Code Mode
natif de Codex, les serveurs MCP utilisateur et l’exécution de Plugin adossée à une application pour ce
tour au lieu de s’appuyer sur le sandboxing côté hôte Codex. L’accès shell est exposé
via des outils dynamiques adossés au sandbox OpenClaw tels que `sandbox_exec` et
`sandbox_process` lorsque les outils exec/process normaux sont disponibles.

Utilisez le mode exec normalisé d’OpenClaw lorsque vous voulez une auto-review native Codex avant les
échappements de sandbox ou les permissions supplémentaires :

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

Pour les sessions de serveur d’application Codex, OpenClaw mappe `tools.exec.mode: "auto"` vers des approbations
revues par Codex Guardian, généralement
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et
`sandbox: "workspace-write"` lorsque les exigences locales autorisent ces valeurs.
Dans `tools.exec.mode: "auto"`, OpenClaw ne préserve pas les anciens remplacements Codex non sûrs
`approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ; utilisez
`tools.exec.mode: "full"` pour une posture Codex intentionnelle sans approbation. Le préréglage hérité
`plugins.entries.codex.config.appServer.mode: "guardian"` fonctionne toujours, mais
`tools.exec.mode: "auto"` est la surface OpenClaw normalisée.

Pour la comparaison au niveau des modes avec les approbations exec hôte et les permissions ACPX,
consultez [Modes de permission](/fr/tools/permission-modes).

Pour chaque champ de serveur d’application, l’ordre d’authentification, l’isolation de l’environnement, la découverte et le
comportement de délai d’expiration, consultez [Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le Plugin intégré enregistre `/codex` comme commande slash sur tout canal qui
prend en charge les commandes texte OpenClaw.

L’exécution et le contrôle natifs nécessitent un propriétaire ou un client Gateway `operator.admin`.
Cela inclut la liaison ou la reprise de fils, l’envoi ou l’arrêt de tours,
le changement de modèle, de mode rapide ou d’état de permission, la compaction ou la revue, et
le détachement d’une liaison. Les autres expéditeurs autorisés conservent l’accès en lecture seule à l’état, à l’aide,
au compte, au modèle, au fil, au serveur MCP, aux Skills et aux commandes d’inspection de liaison.

Formes courantes :

- `/codex status` vérifie la connectivité au serveur d’application, les modèles, le compte, les limites de débit,
  les serveurs MCP et les Skills.
- `/codex models` liste les modèles de serveur d’application Codex en direct.
- `/codex threads [filter]` liste les fils récents du serveur d’application Codex.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un
  fil Codex existant.
- `/codex compact` demande au serveur d’application Codex de compacter le fil attaché.
- `/codex review` démarre la revue native Codex pour le fil attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer le feedback Codex pour le
  fil attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP du serveur d’application Codex.
- `/codex skills` liste les skills du serveur d’application Codex.

Pour la plupart des rapports de support, commencez par `/diagnostics [note]` dans la conversation
où le bogue s’est produit. Cette commande crée un rapport de diagnostics Gateway et, pour les sessions de
harnais Codex, demande l’approbation pour envoyer le bundle de feedback Codex pertinent.
Consultez [Export de diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité et le comportement en
conversation de groupe.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement le téléversement du feedback Codex
pour le fil actuellement attaché sans le bundle complet de diagnostics Gateway.

### Inspecter les fils Codex localement

La manière la plus rapide d’inspecter une exécution Codex défectueuse consiste souvent à ouvrir le fil Codex
natif directement :

```bash
codex resume <thread-id>
```

Récupérez l’id de fil dans la réponse `/diagnostics` terminée, `/codex binding` ou
`/codex threads [filter]`.

Pour les mécanismes de téléversement et les limites de diagnostics au niveau du runtime, consultez
[Runtime du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

L’authentification est sélectionnée dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Exécutez `openclaw doctor --fix` pour migrer les anciens
   ids de profils d’authentification Codex hérités et l’ancien ordre d’authentification Codex.
2. Le compte existant du serveur d’application dans le home Codex de cet agent.
3. Pour les lancements locaux de serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsque OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex généré. Cela
permet de garder les clés API au niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer par accident les tours de serveur d’application Codex natif via l’API.
Les profils Codex explicites à clé API et le fallback local stdio par clé d’environnement utilisent la connexion au serveur d’application
au lieu de l’environnement hérité du processus enfant. Les connexions au serveur d’application WebSocket
ne reçoivent pas de fallback de clé API d’environnement Gateway ; utilisez un profil d’authentification explicite ou le
propre compte du serveur d’application distant.
Lorsque des Plugins Codex natifs sont configurés, OpenClaw installe ou actualise ces
Plugins via le serveur d’application connecté avant d’exposer les applications appartenant au Plugin au
fil Codex. `app/list` reste la source de vérité pour les ids d’application,
l’accessibilité et les métadonnées, mais OpenClaw possède la décision d’activation par fil :
si la politique autorise une application accessible listée, OpenClaw envoie
`thread/start.config.apps[appId].enabled = true` même lorsque `app/list` indique actuellement
que cette application est désactivée. Ce chemin n’invente pas d’installation d’application pour
des ids inconnus ; OpenClaw active uniquement les Plugins de marketplace avec `plugin/install`
puis actualise l’inventaire.

Si un profil d’abonnement atteint une limite d’usage Codex, OpenClaw enregistre l’heure de réinitialisation
lorsque Codex en signale une et essaie le profil d’authentification ordonné suivant pour la même
exécution Codex. Lorsque l’heure de réinitialisation est passée, le profil d’abonnement redevient éligible
sans changer le modèle `openai/gpt-*` sélectionné ni le runtime Codex.

Pour les lancements locaux de serveur d’application stdio, OpenClaw définit `CODEX_HOME` sur un répertoire par agent
afin que la configuration Codex, les fichiers d’authentification/compte, le cache/les données de Plugin et l’état des
fils natifs ne lisent ni n’écrivent par défaut le `~/.codex` personnel de l’opérateur.
OpenClaw préserve le `HOME` normal du processus ; les sous-processus exécutés par Codex
peuvent toujours trouver la configuration et les tokens du home utilisateur, et Codex peut découvrir les entrées partagées
`$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json`.

Si un déploiement nécessite une isolation supplémentaire de l’environnement, ajoutez ces variables à
`appServer.clearEnv` :

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

`appServer.clearEnv` affecte uniquement le processus enfant du serveur d’application Codex généré.
OpenClaw retire `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement local :
`CODEX_HOME` reste par agent, et `HOME` reste hérité afin que
les sous-processus puissent utiliser l’état normal du home utilisateur.

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas d’outils dynamiques qui dupliquent les opérations d’espace de travail natives de Codex : `read`, `write`, `edit`, `apply_patch`, `exec`, `process` et `update_plan`. La plupart des autres outils d’intégration OpenClaw, comme la messagerie, les médias, cron, le navigateur, les nœuds, Gateway et `heartbeat_respond`, sont disponibles via la recherche d’outils Codex sous l’espace de noms `openclaw`, ce qui réduit le contexte initial du modèle. La recherche Web utilise par défaut l’outil hébergé `web_search` de Codex lorsque la recherche est activée et qu’aucun fournisseur géré n’est sélectionné. La recherche hébergée native et l’outil dynamique géré `web_search` d’OpenClaw s’excluent mutuellement, afin que la recherche gérée ne puisse pas contourner les restrictions de domaine natives. OpenClaw utilise l’outil géré lorsque la recherche hébergée est indisponible, explicitement désactivée ou remplacée par un fournisseur géré sélectionné. OpenClaw garde l’extension autonome `web.run` de Codex désactivée, car le trafic de serveur d’application de production rejette son espace de noms `web` défini par l’utilisateur. `tools.web.search.enabled: false` désactive les deux chemins, tout comme les exécutions uniquement LLM avec outils désactivés. Codex traite `"cached"` comme une préférence et le résout en accès externe en direct pour les tours de serveur d’application sans restriction. Le repli géré automatique échoue de manière fermée lorsque des `allowedDomains` natifs sont définis, afin que la liste d’autorisation ne puisse pas être contournée. Les changements persistants de politique de recherche effective font pivoter le fil Codex lié avant le tour suivant. Les restrictions transitoires par tour utilisent un fil temporaire restreint et préservent la liaison existante pour une reprise ultérieure. `sessions_yield` et les réponses sources uniquement par outil de message restent directes, car ce sont des contrats de contrôle de tour. `sessions_spawn` reste recherchable afin que le `spawn_agent` natif de Codex demeure la surface principale de sous-agent Codex, tandis que la délégation explicite OpenClaw ou ACP reste disponible via l’espace de noms d’outils dynamiques `openclaw`. Les instructions de collaboration Heartbeat indiquent à Codex de rechercher `heartbeat_respond` avant de terminer un tour Heartbeat lorsque l’outil n’est pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur d’application Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage de la charge utile complète des outils.

Champs de Plugin Codex de premier niveau pris en charge :

| Champ                      | Par défaut     | Signification                                                                            |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial d’outils Codex. |
| `codexDynamicToolsExclude` | `[]`           | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours de serveur d’application Codex. |
| `codexPlugins`             | désactivé      | Prise en charge native des plugins/applications Codex pour les plugins sélectionnés installés depuis une source migrée. |

Champs `appServer` pris en charge :

| Champ                                         | Valeur par défaut                                      | Signification                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                                                                      |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite.                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | non défini                                            | URL de l’app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | non défini                                            | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou un SecretInput tel que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                   |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. OpenClaw conserve le `CODEX_HOME` par agent et le `HOME` hérité pour les lancements locaux.                                                                                                                                             |
| `codeModeOnly`                                | `false`                                                | Active la surface d’outils Codex limitée au mode code. Les outils dynamiques d’OpenClaw restent enregistrés auprès de Codex afin que les appels `tools.*` imbriqués reviennent via le pont app-server `item/tool/call`.                                                                                                                                                                        |
| `remoteWorkspaceRoot`                         | non défini                                            | Racine distante de l’espace de travail de l’app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail depuis l’espace de travail OpenClaw résolu, conserve le suffixe cwd actuel sous cette racine distante et envoie uniquement le cwd final de l’app-server à Codex. Si le cwd est en dehors de la racine d’espace de travail OpenClaw résolue, OpenClaw échoue en mode fermé au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration pour les appels de plan de contrôle de l’app-server.                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre silencieuse après que Codex accepte un tour ou après une requête app-server limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité de complétion et de progression utilisée après un transfert d’outil, une complétion d’outil natif, une progression brute de l’assistant après outil, une complétion de raisonnement brut ou une progression de raisonnement pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes où la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour une exécution YOLO ou examinée par un gardien. Les exigences stdio locales qui omettent `danger-full-access`, l’approbation `never` ou le relecteur `user` font du gardien la valeur par défaut implicite.                                                                                                                                                                      |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation de gardien autorisée | Politique d’approbation native Codex envoyée au démarrage, à la reprise ou au tour du fil. Les valeurs par défaut du gardien privilégient `"on-request"` lorsqu’elle est autorisée.                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable de gardien autorisé | Mode de bac à sable natif Codex envoyé au démarrage ou à la reprise du fil. Les valeurs par défaut du gardien privilégient `"workspace-write"` lorsqu’elle est autorisée, sinon `"read-only"`. Lorsqu’un bac à sable OpenClaw est actif, les tours `danger-full-access` utilisent Codex `workspace-write` avec un accès réseau dérivé du paramètre de sortie du bac à sable OpenClaw.            |
| `approvalsReviewer`                           | `"user"` ou un relecteur de gardien autorisé           | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsque cela est autorisé, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                                                                                                                                               |
| `serviceTier`                                 | non défini                                            | Niveau de service optionnel de l’app-server Codex. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flexible, `null` efface la substitution, et l’ancien `"fast"` est accepté comme `"priority"`.                                                                                                                                                                |
| `networkProxy`                                | désactivé                                             | Active la mise en réseau du profil d’autorisations Codex pour les commandes app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la sélectionne avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre auprès de Codex app-server 0.132.0 ou version ultérieure un environnement Codex adossé au bac à sable OpenClaw, afin que l’exécution native Codex puisse s’exécuter dans le bac à sable OpenClaw actif.                                                                                                                                                        |

`appServer.networkProxy` est explicite car il modifie le contrat de bac à sable Codex. Lorsqu’il est activé, OpenClaw définit également `features.network_proxy.enabled` et `default_permissions` dans la configuration du fil Codex afin que le profil d’autorisations généré puisse démarrer la mise en réseau gérée par Codex. Par défaut, OpenClaw génère un nom de profil `openclaw-network-<fingerprint>` résistant aux collisions à partir du corps du profil ; utilisez `profileName` uniquement lorsqu’un nom local stable est requis.

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

Si le runtime app-server normal était `danger-full-access`, l’activation de `networkProxy` utilise un accès au système de fichiers de style espace de travail pour le profil d’autorisations généré. L’application réseau gérée par Codex est une mise en réseau en bac à sable, donc un profil en accès complet ne protégerait pas le trafic sortant.
Les entrées de domaine utilisent `allow` ou `deny` ; les entrées de socket Unix utilisent les valeurs Codex `allow` ou `none`.

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par
défaut un watchdog OpenClaw de 90 secondes. Un argument positif `timeoutMs` par
appel prolonge ou raccourcit ce budget d’outil spécifique. L’outil `image_generate`
utilise `agents.defaults.imageGenerationModel.timeoutMs` lorsque l’appel d’outil ne
fournit pas son propre délai d’expiration, ou sinon une valeur par défaut de
génération d’image de 120 secondes. L’outil `image` de compréhension des médias
utilise `tools.media.image.timeoutSeconds` ou sa valeur par défaut média de
60 secondes. Pour la compréhension d’images, ce délai s’applique à la requête
elle-même et n’est pas réduit par le travail de préparation antérieur. Les budgets
d’outils dynamiques sont plafonnés à 600000 ms. En cas d’expiration du délai,
OpenClaw interrompt le signal de l’outil lorsque cela est pris en charge et renvoie
une réponse d’outil dynamique en échec à Codex afin que le tour puisse continuer au
lieu de laisser la session en `processing`. Ce watchdog est le budget dynamique
externe `item/tool/call` ; les délais d’expiration de requêtes propres aux
fournisseurs s’exécutent à l’intérieur de cet appel et conservent leur propre
sémantique d’expiration.

Après que Codex a accepté un tour, et après qu’OpenClaw a répondu à une requête
app-server limitée au tour, le harnais s’attend à ce que Codex progresse dans le
tour courant et finisse finalement le tour natif avec `turn/completed`. Si
l’app-server reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw tente au mieux d’interrompre le tour Codex, enregistre un diagnostic
d’expiration de délai et libère la voie de session OpenClaw afin que les messages
de chat suivants ne soient pas mis en file derrière un vieux tour natif. La plupart
des notifications non terminales pour le même tour désarment ce court watchdog,
car Codex a prouvé que le tour est encore actif. Les transferts d’outils utilisent
un budget d’inactivité post-outil plus long : après qu’OpenClaw renvoie une
réponse `item/tool/call`, après la fin d’éléments d’outils natifs comme
`commandExecution`, après les achèvements bruts `custom_tool_call_output`, et
après la progression brute d’assistant post-outil, les achèvements de raisonnement
brut ou la progression du raisonnement. Le garde utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré,
et sinon cinq minutes par défaut. Ce même budget post-outil prolonge également le
watchdog de progression pour la fenêtre de synthèse silencieuse avant que Codex
n’émette l’événement suivant du tour courant. Les notifications globales de
l’app-server, comme les mises à jour de limites de débit, ne réinitialisent pas la
progression d’inactivité du tour. Les achèvements de raisonnement, les achèvements
`agentMessage` de commentaire et la progression brute de raisonnement ou
d’assistant avant outil peuvent être suivis d’une réponse finale automatique ; ils
utilisent donc le garde de réponse post-progression au lieu de libérer
immédiatement la voie de session. Seuls les éléments `agentMessage` terminés
finaux/non-commentaire et les achèvements bruts d’assistant avant outil arment la
libération de sortie d’assistant : si Codex devient ensuite silencieux sans
`turn/completed`, OpenClaw tente au mieux d’interrompre le tour natif et libère la
voie de session. Les échecs d’app-server stdio rejouables sans risque, y compris
les expirations d’inactivité de fin de tour sans preuve d’assistant, d’outil,
d’élément actif ou d’effet de bord, sont réessayés une fois sur une nouvelle
tentative d’app-server. Les expirations non sûres retirent tout de même le client
app-server bloqué et libèrent la voie de session OpenClaw. Elles effacent aussi la
liaison obsolète du fil natif au lieu d’être rejouées automatiquement. Les
expirations de surveillance d’achèvement exposent un texte d’expiration propre à
Codex : les cas rejouables sans risque indiquent que la réponse peut être
incomplète, tandis que les cas non sûrs demandent à l’utilisateur de vérifier
l’état courant avant de réessayer. Les diagnostics publics d’expiration incluent
des champs structurels comme la dernière méthode de notification de l’app-server,
l’id/le type/le rôle de l’élément de réponse brute d’assistant, les nombres de
requêtes/éléments actifs et l’état de surveillance armé. Lorsque la dernière
notification est un élément de réponse brute d’assistant, ils incluent aussi un
aperçu borné du texte de l’assistant. Ils n’incluent pas le prompt brut ni le
contenu d’outil.

Les remplacements par variables d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La config
est préférable pour les déploiements reproductibles, car elle conserve le
comportement du plugin dans le même fichier révisé que le reste de la
configuration du harnais Codex.

## Plugins Codex natifs

La prise en charge des plugins Codex natifs utilise les propres capacités
d’application et de plugin de l’app-server Codex dans le même fil Codex que le
tour du harnais OpenClaw. OpenClaw ne traduit pas les plugins Codex en outils
dynamiques OpenClaw synthétiques `codex_plugin_*`.

`codexPlugins` n’affecte que les sessions qui sélectionnent le harnais Codex
natif. Il n’a aucun effet sur les exécutions du harnais intégré, les exécutions
normales du fournisseur OpenAI, les liaisons de conversation ACP ou les autres
harnais.

Config migrée minimale :

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

La config d’application du fil est calculée lorsqu’OpenClaw établit une session
de harnais Codex ou remplace une liaison obsolète de fil Codex. Elle n’est pas
recalculée à chaque tour. Après avoir modifié `codexPlugins`, utilisez `/new`,
`/reset` ou redémarrez le gateway afin que les futures sessions du harnais Codex
démarrent avec l’ensemble d’applications mis à jour.

Pour l’éligibilité à la migration, l’inventaire des applications, la politique
d’actions destructrices, les sollicitations et les diagnostics de plugins natifs,
consultez [Plugins Codex natifs](/fr/plugins/codex-native-plugins).

L’accès aux applications et plugins côté OpenAI est contrôlé par le compte Codex
connecté et, pour les espaces de travail Business et Enterprise/Edu, par les
contrôles d’applications de l’espace de travail. Consultez
[Utiliser Codex avec votre forfait ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
pour la vue d’ensemble d’OpenAI sur les contrôles de compte et d’espace de travail.

## Computer Use

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

La version courte : OpenClaw n’intègre pas l’application de contrôle du bureau et
n’exécute pas lui-même les actions de bureau. Il prépare l’app-server Codex,
vérifie que le serveur MCP `computer-use` est disponible, puis laisse Codex
posséder les appels d’outils MCP natifs pendant les tours en mode Codex.

## Limites d’exécution

Le harnais Codex ne modifie que l’exécuteur d’agent intégré de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw
  d’exécuter ces outils ; OpenClaw reste donc dans le chemin d’exécution.
- Les outils shell, patch, MCP et d’application native propres à Codex
  appartiennent à Codex. OpenClaw peut observer ou bloquer certains événements
  natifs via le relais pris en charge, mais il ne réécrit pas les arguments des
  outils natifs.
- Codex possède la compaction native. OpenClaw conserve un miroir de transcription
  pour l’historique des canaux, la recherche, `/new`, `/reset` et les futurs
  changements de modèle ou de harnais, mais il ne remplace pas la compaction
  Codex par un résumeur OpenClaw ou de moteur de contexte.
- La génération de médias, la compréhension des médias, la TTS, les approbations
  et la sortie des outils de messagerie continuent de passer par les paramètres
  fournisseur/modèle OpenClaw correspondants.
- `tool_result_persist` s’applique aux résultats d’outils de transcription
  appartenant à OpenClaw, pas aux enregistrements de résultats d’outils natifs de
  Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion des
autorisations natives, l’orientation de file, les mécanismes d’envoi de retours
Codex et les détails de compaction, consultez
[Exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme fournisseur `/model` normal :** c’est attendu pour
les nouvelles configs. Sélectionnez un modèle `openai/gpt-*`, activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut `codex`.

**OpenClaw utilise le harnais intégré au lieu de Codex :** assurez-vous que la
référence de modèle est `openai/gpt-*` sur le fournisseur OpenAI officiel et que
le plugin Codex est installé et activé. Si vous avez besoin d’une preuve stricte
pendant les tests, définissez `agentRuntime.id: "codex"` au niveau du fournisseur
ou du modèle. Un runtime Codex forcé échoue au lieu de revenir à OpenClaw.

**Le runtime OpenAI Codex revient au chemin de clé API :** collectez un extrait
expurgé du gateway qui montre le modèle, le runtime, le fournisseur sélectionné
et l’échec. Demandez aux collaborateurs affectés d’exécuter cette commande en
lecture seule sur leur hôte OpenClaw :

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
`No API key`. Une exécution corrigée doit montrer le chemin OAuth OpenAI au lieu
d’un simple échec de clé API OpenAI.

**La config de références de modèles Codex héritées reste présente :** exécutez
`openclaw doctor --fix`. Doctor réécrit les références de modèles héritées vers
`openai/*`, supprime les anciennes broches de session et de runtime d’agent
entier, et préserve les remplacements de profils d’authentification existants.

**L’app-server est rejeté :** utilisez l’app-server Codex `0.125.0` ou une
version plus récente. Les préversions de même version ou les versions suffixées
par une build comme `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées, car
OpenClaw teste le plancher stable du protocole `0.125.0`.

**`/codex status` ne peut pas se connecter :** vérifiez que le plugin `codex`
fourni est activé, que `plugins.allow` l’inclut lorsqu’une liste d’autorisation
est configurée, et que tout `appServer.command`, `url`, `authToken` ou en-tête
personnalisé est valide.

**La découverte de modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte.
Consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`,
`authToken`, les en-têtes, et que l’app-server distant parle la même version du
protocole d’app-server Codex.

**Les outils shell ou patch natifs sont bloqués avec `Native hook relay unavailable` :**
le fil Codex essaie encore d’utiliser un identifiant de relais de hook natif
qu’OpenClaw n’a plus enregistré. Il s’agit d’un problème de transport de hook
Codex natif, pas d’un échec de backend ACP, de fournisseur, de GitHub ou de
commande shell. Démarrez une nouvelle session dans le chat affecté avec `/new`
ou `/reset`, puis réessayez une commande sans risque. Si cela fonctionne une fois
mais que l’appel d’outil natif suivant échoue à nouveau, considérez `/new` comme
un contournement temporaire uniquement : copiez le prompt dans une nouvelle
session après avoir redémarré l’app-server Codex ou OpenClaw Gateway, afin que
les anciens fils soient supprimés et que les enregistrements de hooks natifs
soient recréés.

**Un modèle non-Codex utilise le harnais intégré :** c’est attendu, sauf si la
politique de runtime du fournisseur ou du modèle le route vers un autre harnais.
Les références de fournisseurs non-OpenAI simples restent sur leur chemin de
fournisseur normal en mode `auto`.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez la récupération du relais de hook natif ci-dessus. Consultez
[Codex Computer Use](/fr/plugins/codex-computer-use#troubleshooting).

## Associé

- [Référence du harness Codex](/fr/plugins/codex-harness-reference)
- [Runtime du harness Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Aide OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [État](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
