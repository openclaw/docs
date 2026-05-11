---
read_when:
    - Vous choisissez entre PI, Codex, ACP ou un autre environnement d’exécution d’agent natif
    - Vous êtes dérouté par les libellés provider/model/runtime dans le statut ou la configuration
    - Vous documentez la parité de prise en charge d’un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les environnements d’exécution des agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-05-11T20:30:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs et renvoie
le tour terminé à OpenClaw.

Les runtimes sont faciles à confondre avec les fournisseurs, car les deux apparaissent près de la
configuration des modèles. Ce sont des couches différentes :

| Couche        | Exemples                              | Ce que cela signifie                                                   |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Fournisseur   | `openai`, `anthropic`, `openai-codex` | Comment OpenClaw s’authentifie, découvre les modèles et nomme les refs de modèle. |
| Modèle        | `gpt-5.5`, `claude-opus-4-6`          | Le modèle sélectionné pour le tour de l’agent.                         |
| Runtime d’agent | `pi`, `codex`, `claude-cli`         | La boucle ou le backend bas niveau qui exécute le tour préparé.        |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Là où les messages entrent dans OpenClaw et en sortent.                |

Vous verrez aussi le mot **harness** dans le code. Un harness est l’implémentation
qui fournit un runtime d’agent. Par exemple, le harness Codex intégré
implémente le runtime `codex`. La configuration publique utilise `agentRuntime.id` sur
les entrées de fournisseur ou de modèle ; les clés de runtime au niveau de l’agent entier sont héritées et ignorées.
`openclaw doctor --fix` supprime les anciens verrouillages de runtime au niveau de l’agent entier et réécrit
les refs de modèle de runtime héritées en refs fournisseur/modèle canoniques, avec une politique de
runtime au niveau du modèle lorsque nécessaire.

Il existe deux familles de runtimes :

- Les **harnesses intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw. Aujourd’hui, cela
  correspond au runtime `pi` intégré ainsi qu’aux harnesses de plugins enregistrés comme
  `codex`.
- Les **backends CLI** exécutent un processus CLI local tout en conservant la ref de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-7` avec
  `agentRuntime.id: "claude-cli"` au niveau du modèle signifie « sélectionner le modèle Anthropic,
  exécuter via Claude CLI ». `claude-cli` n’est pas un id de harness intégré
  et ne doit pas être transmis à la sélection AgentHarness.

## Surfaces Codex

La plupart des confusions viennent de plusieurs surfaces différentes qui partagent le nom Codex :

| Surface                                          | Nom/config OpenClaw                 | Ce qu’elle fait                                                                                                  |
| ------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Runtime natif de serveur d’application Codex     | refs de modèle `openai/*`           | Exécute les tours d’agent intégrés OpenAI via le serveur d’application Codex. C’est la configuration habituelle avec abonnement ChatGPT/Codex. |
| Profils d’authentification OAuth Codex           | fournisseur d’authentification `openai-codex` | Stocke l’authentification d’abonnement ChatGPT/Codex consommée par le harness de serveur d’application Codex. |
| Adaptateur Codex ACP                             | `runtime: "acp"`, `agentId: "codex"` | Exécute Codex via le plan de contrôle externe ACP/acpx. À utiliser uniquement lorsque ACP/acpx est explicitement demandé. |
| Jeu de commandes natif de contrôle de chat Codex | `/codex ...`                        | Lie, reprend, dirige, arrête et inspecte les fils Codex du serveur d’application depuis le chat. |
| Route API OpenAI Platform pour les surfaces non-agent | `openai/*` plus authentification par clé API | Utilisée pour les API OpenAI directes comme les images, les embeddings, la parole et le temps réel. |

Ces surfaces sont volontairement indépendantes. Activer le plugin `codex` rend
les fonctionnalités natives du serveur d’application disponibles ; `openclaw doctor --fix` gère la réparation des routes héritées
`openai-codex/*` et le nettoyage des verrouillages de session obsolètes. Sélectionner
`openai/*` comme modèle d’agent signifie désormais « exécuter ceci via Codex », sauf si une
surface API OpenAI non-agent est utilisée.

La configuration courante avec abonnement ChatGPT/Codex utilise OAuth Codex pour l’authentification, mais conserve
la ref de modèle sous la forme `openai/*` et sélectionne le runtime `codex` :

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
de serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas « utiliser la facturation API »,
et cela ne signifie pas que le canal, le catalogue de fournisseurs de modèles ou le stockage de sessions OpenClaw
devient Codex.

Lorsque le plugin `codex` intégré est activé, le contrôle Codex en langage naturel
doit utiliser la surface de commande native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) au lieu d’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin
de l’adaptateur ACP. Claude Code, Gemini CLI, OpenCode, Cursor et les harnesses externes
similaires utilisent toujours ACP.

Voici l’arbre de décision côté agent :

1. Si l’utilisateur demande **Codex bind/control/thread/resume/steer/stop**, utilisez la
   surface de commande native `/codex` lorsque le plugin `codex` intégré est activé.
2. Si l’utilisateur demande **Codex comme runtime intégré** ou souhaite l’expérience normale
   d’agent Codex adossée à un abonnement, utilisez `openai/<model>`.
3. Si l’utilisateur choisit explicitement **PI pour un modèle OpenAI**, conservez la ref de modèle
   sous la forme `openai/<model>` et définissez la politique de runtime fournisseur/modèle sur
   `agentRuntime.id: "pi"`. Un profil d’authentification `openai-codex` sélectionné est routé
   en interne via le transport d’authentification Codex hérité de PI.
4. Si la configuration héritée contient encore des **refs de modèle `openai-codex/*`**, réparez-la en
   `openai/<model>` avec `openclaw doctor --fix` ; doctor conserve la route d’authentification Codex
   en ajoutant `agentRuntime.id: "codex"` au niveau fournisseur/modèle lorsque l’ancienne ref de modèle
   l’impliquait.
5. Si l’utilisateur dit explicitement **ACP**, **acpx** ou **adaptateur Codex ACP**, utilisez
   ACP avec `runtime: "acp"` et `agentId: "codex"`.
6. Si la demande concerne **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   un autre harness externe**, utilisez ACP/acpx, pas le runtime de sous-agent natif.

| Vous voulez dire...                    | Utilisez...                                  |
| -------------------------------------- | ------------------------------------------- |
| Contrôle de chat/fil du serveur d’application Codex | `/codex ...` depuis le plugin `codex` intégré |
| Runtime d’agent intégré du serveur d’application Codex | refs de modèle d’agent `openai/*`            |
| OAuth OpenAI Codex                     | profils d’authentification `openai-codex`   |
| Claude Code ou autre harness externe   | ACP/acpx                                    |

Pour la séparation des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge du runtime Codex,
consultez [Runtime du harness Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Propriété du runtime

Les différents runtimes possèdent des parties différentes de la boucle.

| Surface                     | PI intégré d’OpenClaw                    | Serveur d’application Codex                                                  |
| --------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via le runner intégré PI       | Serveur d’application Codex                                                   |
| État canonique du fil       | Transcription OpenClaw                   | Fil Codex, plus miroir de transcription OpenClaw                              |
| Outils dynamiques OpenClaw  | Boucle d’outils native OpenClaw          | Transmis via l’adaptateur Codex                                               |
| Outils natifs de shell et de fichiers | Chemin PI/OpenClaw                      | Outils natifs Codex, transmis via des hooks natifs lorsque pris en charge      |
| Moteur de contexte          | Assemblage de contexte natif OpenClaw    | OpenClaw projette le contexte assemblé dans le tour Codex                     |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir |
| Livraison par canal         | OpenClaw                                 | OpenClaw                                                                      |

Cette séparation de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de plugin.
- Si le runtime natif possède la surface, OpenClaw a besoin d’événements de runtime ou de hooks natifs.
- Si le runtime natif possède l’état canonique du fil, OpenClaw doit refléter et projeter le contexte, sans réécrire des éléments internes non pris en charge.

## Sélection du runtime

OpenClaw choisit un runtime intégré après la résolution du fournisseur et du modèle :

1. La politique de runtime au niveau du modèle l’emporte. Elle peut se trouver dans une entrée de modèle
   fournisseur configurée ou dans `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`.
2. La politique de runtime au niveau du fournisseur vient ensuite à
   `models.providers.<provider>.agentRuntime`.
3. En mode `auto`, les runtimes de plugins enregistrés peuvent revendiquer les paires fournisseur/modèle
   prises en charge.
4. Si aucun runtime ne revendique un tour en mode `auto`, OpenClaw utilise PI comme
   runtime de compatibilité. Utilisez un id de runtime explicite lorsque l’exécution doit être
   stricte.

Les verrouillages de runtime au niveau de la session entière et de l’agent entier sont ignorés. Cela inclut
`OPENCLAW_AGENT_RUNTIME`, l’état de session `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` et `agents.list[].agentRuntime`. Exécutez
`openclaw doctor --fix` pour supprimer la configuration obsolète de runtime au niveau de l’agent entier et convertir
les refs de modèle de runtime héritées lorsque OpenClaw peut en préserver l’intention.

Les runtimes de plugin explicites au niveau fournisseur/modèle échouent de manière fermée. Par exemple,
`agentRuntime.id: "codex"` sur un fournisseur ou un modèle signifie Codex ou une erreur claire
de sélection/runtime ; il n’est jamais routé silencieusement vers PI.

Les alias de backend CLI sont différents des ids de harness intégrés. La forme Claude CLI
préférée est :

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Les refs héritées comme `claude-cli/claude-opus-4-7` restent prises en charge pour
compatibilité, mais les nouvelles configurations doivent conserver le fournisseur/modèle canonique et placer
le backend d’exécution dans la politique de runtime fournisseur/modèle.

Le mode `auto` est volontairement conservateur pour la plupart des fournisseurs. Les modèles d’agent OpenAI
font exception : un runtime non défini et `auto` se résolvent tous deux vers le harness Codex.
La configuration de runtime PI explicite reste une route de compatibilité opt-in pour les tours d’agent
`openai/*` ; lorsqu’elle est associée à un profil d’authentification `openai-codex` sélectionné,
OpenClaw route PI en interne via le transport d’authentification Codex hérité tout en
conservant la ref de modèle publique sous la forme `openai/*`. Les verrouillages de session OpenAI PI obsolètes sont
ignorés par la sélection du runtime et peuvent être nettoyés avec `openclaw doctor --fix`.

Si `openclaw doctor` avertit que le plugin `codex` est activé alors que
`openai-codex/*` reste dans la configuration, considérez cela comme un état de route hérité. Exécutez
`openclaw doctor --fix` pour le réécrire en `openai/*` avec le runtime Codex.

## Contrat de compatibilité

Lorsqu’un runtime n’est pas PI, il doit documenter les surfaces OpenClaw qu’il prend en charge.
Utilisez cette forme pour la documentation des runtimes :

| Question                               | Pourquoi c’est important                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Qui possède la boucle de modèle ?      | Détermine où les nouvelles tentatives, la poursuite des outils et les décisions de réponse finale se produisent. |
| Qui possède l’historique de fil canonique ? | Détermine si OpenClaw peut modifier l’historique ou seulement le refléter.                       |
| Les outils dynamiques OpenClaw fonctionnent-ils ? | La messagerie, les sessions, Cron et les outils appartenant à OpenClaw en dépendent.             |
| Les hooks d’outils dynamiques fonctionnent-ils ? | Les Plugins s’attendent à `before_tool_call`, `after_tool_call` et à des middlewares autour des outils appartenant à OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ? | Shell, patch et les outils appartenant au runtime nécessitent la prise en charge des hooks natifs pour la politique et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les Plugins de mémoire et de contexte dépendent du cycle de vie assemble, ingest, after-turn et compaction. |
| Quelles données de compaction sont exposées ? | Certains Plugins n’ont besoin que de notifications, tandis que d’autres ont besoin de métadonnées conservées/supprimées. |
| Qu’est-ce qui est intentionnellement non pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec PI lorsque le runtime natif possède davantage d’état. |

Le contrat de prise en charge du runtime Codex est documenté dans
[Runtime du harnais Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Lisez-les comme
des diagnostics, et non comme des noms de fournisseurs.

- Une référence de modèle telle que `openai/gpt-5.5` indique le fournisseur/modèle sélectionné.
- Un identifiant de runtime tel que `codex` indique quelle boucle exécute le tour.
- Un libellé de canal tel que Telegram ou Discord indique où la conversation a lieu.

Si une exécution affiche encore un runtime inattendu, inspectez d’abord la politique de runtime
du fournisseur/modèle sélectionné. Les anciens pins de runtime de session ne décident plus du routage.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
