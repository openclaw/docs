---
read_when:
    - Vous choisissez entre PI, Codex, ACP ou un autre environnement d’exécution d’agent natif
    - Vous êtes dérouté par les libellés fournisseur/modèle/environnement d’exécution dans l’état ou la configuration
    - Vous documentez la parité de prise en charge d’un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les environnements d’exécution d’agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-05-07T13:15:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs et renvoie
le tour terminé à OpenClaw.

Les runtimes sont faciles à confondre avec les fournisseurs, car les deux apparaissent près de la
configuration du modèle. Ce sont des couches différentes :

| Couche        | Exemples                              | Ce que cela signifie                                                     |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| Fournisseur   | `openai`, `anthropic`, `openai-codex` | Comment OpenClaw s’authentifie, découvre les modèles et nomme les refs de modèle. |
| Modèle        | `gpt-5.5`, `claude-opus-4-6`          | Le modèle sélectionné pour le tour d’agent.                              |
| Runtime d’agent | `pi`, `codex`, `claude-cli`           | La boucle ou le backend de bas niveau qui exécute le tour préparé.       |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Où les messages entrent dans OpenClaw et en sortent.                     |

Vous verrez aussi le mot **harnais** dans le code. Un harnais est l’implémentation
qui fournit un runtime d’agent. Par exemple, le harnais Codex intégré
implémente le runtime `codex`. La configuration publique utilise `agentRuntime.id` ; `openclaw
doctor --fix` réécrit les anciennes clés de politique de runtime dans cette forme.

Il existe deux familles de runtimes :

- Les **harnais intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw. Aujourd’hui, cela
  correspond au runtime `pi` intégré plus les harnais de plugins enregistrés comme
  `codex`.
- Les **backends CLI** exécutent un processus CLI local tout en gardant la ref de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-7` avec
  `agentRuntime.id: "claude-cli"` signifie « sélectionner le modèle Anthropic, exécuter
  via Claude CLI ». `claude-cli` n’est pas un id de harnais intégré et ne doit pas
  être transmis à la sélection AgentHarness.

## Surfaces Codex

La plupart des confusions viennent de plusieurs surfaces différentes qui partagent le nom Codex :

| Surface                                          | Nom/configuration OpenClaw           | Ce qu’elle fait                                                                                                   |
| ------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Runtime natif de serveur d’application Codex     | refs de modèle `openai/*`            | Exécute les tours d’agent intégrés OpenAI via le serveur d’application Codex. C’est la configuration habituelle avec abonnement ChatGPT/Codex. |
| Profils d’authentification OAuth Codex           | fournisseur d’authentification `openai-codex` | Stocke l’authentification d’abonnement ChatGPT/Codex consommée par le harnais du serveur d’application Codex. |
| Adaptateur ACP Codex                             | `runtime: "acp"`, `agentId: "codex"` | Exécute Codex via le plan de contrôle externe ACP/acpx. À utiliser uniquement lorsqu’ACP/acpx est explicitement demandé. |
| Ensemble de commandes natives de contrôle du chat Codex | `/codex ...`                         | Lie, reprend, dirige, arrête et inspecte les threads du serveur d’application Codex depuis le chat.              |
| Route API OpenAI Platform pour les surfaces non-agent | `openai/*` plus authentification par clé API | Utilisée pour les API OpenAI directes comme les images, embeddings, la parole et le temps réel.                 |

Ces surfaces sont intentionnellement indépendantes. Activer le plugin `codex` rend
les fonctionnalités natives du serveur d’application disponibles ; `openclaw doctor --fix` possède la réparation des anciennes
routes `openai-codex/*` et le nettoyage des épingles de session obsolètes. Sélectionner
`openai/*` pour un modèle d’agent signifie désormais « exécuter ceci via Codex », sauf si une
surface API OpenAI non-agent est utilisée.

La configuration courante avec abonnement ChatGPT/Codex utilise OAuth Codex pour l’authentification, mais conserve
la ref de modèle sous la forme `openai/*` et sélectionne le runtime `codex` :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Cela signifie qu’OpenClaw sélectionne une ref de modèle OpenAI, puis demande au runtime
du serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas
« utiliser la facturation API », et cela ne signifie pas que le canal, le catalogue des fournisseurs de modèles ou le magasin de sessions OpenClaw
devient Codex.

Lorsque le plugin `codex` intégré est activé, le contrôle Codex en langage naturel
doit utiliser la surface de commande native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) au lieu d’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin de
l’adaptateur ACP. Claude Code, Gemini CLI, OpenCode, Cursor et les harnais externes
similaires utilisent toujours ACP.

Voici l’arbre de décision côté agent :

1. Si l’utilisateur demande **bind/control/thread/resume/steer/stop pour Codex**, utilisez la
   surface de commande native `/codex` lorsque le plugin `codex` intégré est activé.
2. Si l’utilisateur demande **Codex comme runtime intégré** ou veut l’expérience normale
   d’agent Codex adossée à un abonnement, utilisez `openai/<model>`.
3. Si l’utilisateur choisit explicitement **PI pour un modèle OpenAI**, conservez la ref de modèle
   sous la forme `openai/<model>` et définissez `agentRuntime.id: "pi"`. Un profil d’authentification
   `openai-codex` sélectionné est routé en interne via le transport d’authentification Codex
   hérité de PI.
4. Si l’ancienne configuration contient encore des **refs de modèle `openai-codex/*`**, réparez-la en
   `openai/<model>` avec `openclaw doctor --fix`.
5. Si l’utilisateur dit explicitement **ACP**, **acpx** ou **adaptateur ACP Codex**, utilisez
   ACP avec `runtime: "acp"` et `agentId: "codex"`.
6. Si la demande concerne **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   un autre harnais externe**, utilisez ACP/acpx, pas le runtime de sous-agent natif.

| Vous voulez dire...                     | Utilisez...                                  |
| --------------------------------------- | -------------------------------------------- |
| Contrôle chat/thread du serveur d’application Codex | `/codex ...` depuis le plugin `codex` intégré |
| Runtime d’agent intégré du serveur d’application Codex | refs de modèle d’agent `openai/*`            |
| OAuth OpenAI Codex                      | profils d’authentification `openai-codex`    |
| Claude Code ou autre harnais externe    | ACP/acpx                                     |

Pour la séparation des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge du runtime Codex,
consultez [Harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

## Propriété du runtime

Différents runtimes possèdent différentes parties de la boucle.

| Surface                     | PI intégré d’OpenClaw                  | Serveur d’application Codex                                                   |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via le runner intégré PI       | Serveur d’application Codex                                                   |
| État canonique du thread    | Transcription OpenClaw                 | Thread Codex, plus miroir de transcription OpenClaw                           |
| Outils dynamiques OpenClaw  | Boucle d’outils native OpenClaw        | Pontés via l’adaptateur Codex                                                 |
| Outils natifs shell et fichiers | Chemin PI/OpenClaw                     | Outils natifs Codex, pontés via des hooks natifs lorsqu’ils sont pris en charge |
| Moteur de contexte          | Assemblage de contexte natif OpenClaw  | OpenClaw projette le contexte assemblé dans le tour Codex                     |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir |
| Livraison canal             | OpenClaw                               | OpenClaw                                                                      |

Cette répartition de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de plugin.
- Si le runtime natif possède la surface, OpenClaw a besoin d’événements de runtime ou de hooks natifs.
- Si le runtime natif possède l’état canonique du thread, OpenClaw doit mettre en miroir et projeter le contexte, pas réécrire des éléments internes non pris en charge.

## Sélection du runtime

OpenClaw choisit un runtime intégré après la résolution du fournisseur et du modèle :

1. Le runtime enregistré d’une session l’emporte. Les changements de configuration ne basculent pas à chaud une
   transcription existante vers un système de threads natif différent.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force ce runtime pour les sessions nouvelles ou réinitialisées.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` peut définir
   `auto`, `pi`, un id de harnais intégré enregistré comme `codex`, ou un
   alias de backend CLI pris en charge comme `claude-cli`.
4. En mode `auto`, les runtimes de plugins enregistrés peuvent revendiquer des paires fournisseur/modèle
   prises en charge.
5. Si aucun runtime ne revendique un tour en mode `auto`, OpenClaw utilise PI comme
   runtime de compatibilité. Utilisez un id de runtime explicite lorsque l’exécution doit être
   stricte.

Les runtimes de plugins explicites échouent de façon fermée. Par exemple, `agentRuntime.id: "codex"`
signifie Codex ou une erreur claire de sélection/runtime ; il n’est jamais routé silencieusement
vers PI.

Les alias de backend CLI sont différents des ids de harnais intégrés. La forme préférée
pour Claude CLI est :

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Les refs héritées comme `claude-cli/claude-opus-4-7` restent prises en charge pour
compatibilité, mais les nouvelles configurations doivent conserver le fournisseur/modèle canonique et placer
le backend d’exécution dans `agentRuntime.id`.

Le mode `auto` est intentionnellement conservateur pour la plupart des fournisseurs. Les modèles d’agent OpenAI
sont l’exception : un runtime non défini et `auto` se résolvent tous deux vers le harnais Codex.
La configuration explicite du runtime PI reste une route de compatibilité opt-in pour les
tours d’agent `openai/*` ; lorsqu’elle est associée à un profil d’authentification `openai-codex` sélectionné,
OpenClaw route PI en interne via le transport d’authentification Codex hérité tout en
conservant la ref de modèle publique sous la forme `openai/*`. Les épingles de session OpenAI PI obsolètes sans
configuration explicite sont réparées vers Codex.

Si `openclaw doctor` avertit que le plugin `codex` est activé alors que
`openai-codex/*` reste dans la configuration, traitez cela comme un état de route hérité. Exécutez
`openclaw doctor --fix` pour le réécrire en `openai/*` avec le runtime Codex.

## Contrat de compatibilité

Lorsqu’un runtime n’est pas PI, il doit documenter les surfaces OpenClaw qu’il prend en charge.
Utilisez cette forme pour les docs de runtime :

| Question                               | Pourquoi c’est important                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Qui possède la boucle de modèle ?      | Détermine où les reprises, la continuation des outils et les décisions de réponse finale ont lieu. |
| Qui possède l’historique canonique du thread ? | Détermine si OpenClaw peut modifier l’historique ou seulement le mettre en miroir.                  |
| Les outils dynamiques OpenClaw fonctionnent-ils ? | La messagerie, les sessions, cron et les outils possédés par OpenClaw en dépendent.                |
| Les hooks d’outils dynamiques fonctionnent-ils ? | Les Plugins attendent `before_tool_call`, `after_tool_call` et un middleware autour des outils possédés par OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ? | Le shell, les patchs et les outils possédés par le runtime nécessitent une prise en charge des hooks natifs pour la politique et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les plugins de mémoire et de contexte dépendent des cycles de vie d’assemblage, d’ingestion, d’après-tour et de compaction. |
| Quelles données de compaction sont exposées ? | Certains plugins n’ont besoin que de notifications, tandis que d’autres ont besoin de métadonnées conservées/supprimées. |
| Qu’est-ce qui est intentionnellement non pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec PI lorsque le runtime natif possède plus d’état. |

Le contrat de support du runtime Codex est documenté dans
[harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Considérez-les comme
des diagnostics, et non comme des noms de fournisseurs.

- Une référence de modèle comme `openai/gpt-5.5` indique le fournisseur/modèle sélectionné.
- Un id de runtime comme `codex` indique quelle boucle exécute le tour.
- Un libellé de canal comme Telegram ou Discord indique où la conversation a lieu.

Si une session affiche encore PI après une modification de la configuration du runtime, démarrez une nouvelle session
avec `/new` ou effacez la session actuelle avec `/reset`. Les sessions existantes conservent leur
runtime enregistré afin qu’une transcription ne soit pas rejouée via deux systèmes de session natifs
incompatibles.

## Connexe

- [harnais Codex](/fr/plugins/codex-harness)
- [OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
