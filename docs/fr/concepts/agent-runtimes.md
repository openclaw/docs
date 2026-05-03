---
read_when:
    - Vous choisissez entre PI, Codex, ACP ou un autre environnement d’exécution d’agent natif
    - Les libellés de fournisseur/modèle/environnement d’exécution dans le statut ou la configuration vous prêtent à confusion
    - Vous documentez la parité de prise en charge d’un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les environnements d’exécution des agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-05-03T07:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs et renvoie
le tour terminé à OpenClaw.

Les runtimes sont faciles à confondre avec les fournisseurs, car les deux apparaissent
près de la configuration du modèle. Ce sont des couches différentes :

| Couche        | Exemples                              | Signification                                                        |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Fournisseur   | `openai`, `anthropic`, `openai-codex` | Comment OpenClaw s’authentifie, découvre les modèles et nomme les références de modèle. |
| Modèle        | `gpt-5.5`, `claude-opus-4-6`          | Le modèle sélectionné pour le tour de l’agent.                       |
| Runtime d’agent | `pi`, `codex`, `claude-cli`         | La boucle de bas niveau ou le backend qui exécute le tour préparé.   |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Où les messages entrent et sortent d’OpenClaw.                       |

Vous verrez aussi le mot **harness** dans le code. Un harness est l’implémentation
qui fournit un runtime d’agent. Par exemple, le harness Codex intégré
implémente le runtime `codex`. La configuration publique utilise `agentRuntime.id` ; `openclaw
doctor --fix` réécrit les anciennes clés de stratégie de runtime dans cette forme.

Il existe deux familles de runtimes :

- Les **harnesses intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw. Aujourd’hui,
  il s’agit du runtime `pi` intégré, ainsi que des harnesses de Plugin enregistrés tels que
  `codex`.
- Les **backends CLI** exécutent un processus CLI local tout en conservant la référence de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-7` avec
  `agentRuntime.id: "claude-cli"` signifie « sélectionner le modèle Anthropic, exécuter
  via Claude CLI ». `claude-cli` n’est pas un id de harness intégré et ne doit pas
  être transmis à la sélection AgentHarness.

## Surfaces Codex

La plupart des confusions viennent de plusieurs surfaces différentes qui partagent le nom Codex :

| Surface                                              | Nom/configuration OpenClaw                 | Ce qu’elle fait                                                                                              |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Runtime natif de serveur d’application Codex         | `openai/*` plus `agentRuntime.id: "codex"` | Exécute le tour d’agent intégré via le serveur d’application Codex. C’est la configuration habituelle d’abonnement ChatGPT/Codex. |
| Route de fournisseur OAuth Codex                     | Références de modèle `openai-codex/*`      | Utilise l’OAuth d’abonnement ChatGPT/Codex via le runner PI OpenClaw normal.                                 |
| Adaptateur ACP Codex                                 | `runtime: "acp"`, `agentId: "codex"`       | Exécute Codex via le plan de contrôle externe ACP/acpx. À utiliser uniquement quand ACP/acpx est explicitement demandé. |
| Ensemble de commandes natives de contrôle de chat Codex | `/codex ...`                            | Lie, reprend, pilote, arrête et inspecte les threads du serveur d’application Codex depuis le chat.          |
| Route API OpenAI Platform pour les modèles de style GPT/Codex | Références de modèle `openai/*`     | Utilise l’authentification par clé API OpenAI, sauf si une surcharge de runtime, comme `agentRuntime.id: "codex"`, exécute le tour. |

Ces surfaces sont volontairement indépendantes. Activer le Plugin `codex` rend
les fonctionnalités natives du serveur d’application disponibles ; cela ne réécrit pas
`openai-codex/*` en `openai/*`, ne change pas les sessions existantes et ne
fait pas d’ACP le comportement par défaut de Codex. Sélectionner `openai-codex/*` signifie « utiliser la route de fournisseur OAuth Codex », sauf si vous forcez séparément un runtime.

La configuration courante d’abonnement ChatGPT/Codex utilise Codex OAuth pour l’authentification, mais conserve
la référence de modèle sous la forme `openai/*` et sélectionne le runtime `codex` :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Cela signifie qu’OpenClaw sélectionne une référence de modèle OpenAI, puis demande au runtime
du serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas « utiliser la facturation API »,
et cela ne signifie pas que le canal, le catalogue de fournisseurs de modèles ou le magasin de sessions OpenClaw
devient Codex.

Quand le Plugin `codex` intégré est activé, le contrôle Codex en langage naturel
doit utiliser la surface de commandes native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) au lieu d’ACP. Utilisez ACP pour
Codex uniquement quand l’utilisateur demande explicitement ACP/acpx ou teste le chemin de l’adaptateur ACP.
Claude Code, Gemini CLI, OpenCode, Cursor et les harnesses externes similaires
utilisent toujours ACP.

Voici l’arbre de décision destiné aux agents :

1. Si l’utilisateur demande **liaison/contrôle/thread/reprise/pilotage/arrêt Codex**, utilisez la
   surface de commandes native `/codex` quand le Plugin `codex` intégré est activé.
2. Si l’utilisateur demande **Codex comme runtime intégré** ou veut l’expérience d’agent Codex normale
   adossée à l’abonnement, utilisez
   `openai/<model>` avec `agentRuntime.id: "codex"`.
3. Si l’utilisateur demande **l’authentification OAuth/abonnement Codex sur le runner OpenClaw normal**,
   utilisez `openai-codex/<model>` et laissez le runtime sur PI.
4. Si l’utilisateur dit explicitement **ACP**, **acpx** ou **adaptateur ACP Codex**, utilisez
   ACP avec `runtime: "acp"` et `agentId: "codex"`.
5. Si la demande concerne **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   un autre harness externe**, utilisez ACP/acpx, et non le runtime de sous-agent natif.

| Vous voulez dire...                     | Utilisez...                                  |
| --------------------------------------- | -------------------------------------------- |
| Contrôle de chat/thread du serveur d’application Codex | `/codex ...` depuis le Plugin `codex` intégré |
| Runtime d’agent intégré du serveur d’application Codex | `agentRuntime.id: "codex"`                   |
| OpenAI Codex OAuth sur le runner PI     | Références de modèle `openai-codex/*`        |
| Claude Code ou autre harness externe    | ACP/acpx                                     |

Pour la séparation des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge du runtime Codex,
consultez [harness Codex](/fr/plugins/codex-harness#v1-support-contract).

## Propriété du runtime

Les différents runtimes possèdent différentes parties de la boucle.

| Surface                     | PI intégré d’OpenClaw                  | Serveur d’application Codex                                                |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via le runner PI intégré | Serveur d’application Codex                                                 |
| État canonique du thread    | Transcription OpenClaw                 | Thread Codex, plus miroir de transcription OpenClaw                         |
| Outils dynamiques OpenClaw  | Boucle d’outils native OpenClaw        | Reliés via l’adaptateur Codex                                               |
| Outils natifs de shell et de fichiers | Chemin PI/OpenClaw           | Outils natifs Codex, reliés via des hooks natifs lorsque c’est pris en charge |
| Moteur de contexte          | Assemblage de contexte natif OpenClaw  | OpenClaw projette le contexte assemblé dans le tour Codex                   |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir |
| Livraison de canal          | OpenClaw                                | OpenClaw                                                                    |

Cette répartition de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de Plugin.
- Si le runtime natif possède la surface, OpenClaw a besoin d’événements de runtime ou de hooks natifs.
- Si le runtime natif possède l’état canonique du thread, OpenClaw doit mettre en miroir et projeter le contexte, pas réécrire des éléments internes non pris en charge.

## Sélection du runtime

OpenClaw choisit un runtime intégré après la résolution du fournisseur et du modèle :

1. Le runtime enregistré d’une session l’emporte. Les changements de configuration ne basculent pas à chaud
   une transcription existante vers un autre système de thread natif.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force ce runtime pour les sessions nouvelles ou réinitialisées.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` peut définir
   `auto`, `pi`, un id de harness intégré enregistré comme `codex`, ou un
   alias de backend CLI pris en charge comme `claude-cli`.
4. En mode `auto`, les runtimes de Plugin enregistrés peuvent revendiquer les paires fournisseur/modèle
   prises en charge.
5. Si aucun runtime ne revendique un tour en mode `auto`, OpenClaw utilise PI comme
   runtime de compatibilité. Utilisez un id de runtime explicite lorsque l’exécution doit être
   stricte.

Les runtimes de Plugin explicites échouent de manière fermée. Par exemple, `agentRuntime.id: "codex"`
signifie Codex ou une erreur claire de sélection/runtime ; il n’est jamais redirigé silencieusement
vers PI.

Les alias de backend CLI sont différents des ids de harness intégrés. La forme Claude CLI
préférée est :

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

Les références héritées comme `claude-cli/claude-opus-4-7` restent prises en charge pour
la compatibilité, mais les nouvelles configurations doivent conserver le fournisseur/modèle canonique et placer
le backend d’exécution dans `agentRuntime.id`.

Le mode `auto` est volontairement conservateur. Les runtimes de Plugin peuvent revendiquer
les paires fournisseur/modèle qu’ils comprennent, mais le Plugin Codex ne revendique pas le
fournisseur `openai-codex` en mode `auto`. Cela garde
`openai-codex/*` comme route OAuth Codex PI explicite et évite de déplacer silencieusement
des configurations d’authentification par abonnement vers le harness natif du serveur d’application.

Si `openclaw doctor` avertit que le Plugin `codex` est activé alors que
`openai-codex/*` passe toujours par PI, traitez cela comme un diagnostic, pas comme une
migration. Gardez la configuration inchangée quand PI Codex OAuth est ce que vous voulez.
Passez à `openai/<model>` plus `agentRuntime.id: "codex"` uniquement lorsque vous voulez une exécution native
par le serveur d’application Codex.

## Contrat de compatibilité

Quand un runtime n’est pas PI, il doit documenter les surfaces OpenClaw qu’il prend en charge.
Utilisez cette forme pour la documentation des runtimes :

| Question                               | Pourquoi c’est important                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Qui possède la boucle de modèle ?      | Détermine où se produisent les nouvelles tentatives, la continuation des outils et les décisions de réponse finale. |
| Qui possède l’historique canonique du thread ? | Détermine si OpenClaw peut modifier l’historique ou seulement le mettre en miroir.          |
| Les outils dynamiques OpenClaw fonctionnent-ils ? | La messagerie, les sessions, cron et les outils possédés par OpenClaw en dépendent.       |
| Les hooks d’outils dynamiques fonctionnent-ils ? | Les Plugins attendent `before_tool_call`, `after_tool_call` et le middleware autour des outils possédés par OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ? | Les outils de shell, de patch et possédés par le runtime ont besoin de la prise en charge des hooks natifs pour la stratégie et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les Plugins de mémoire et de contexte dépendent de l’assemblage, de l’ingestion, de l’après-tour et du cycle de vie de Compaction. |
| Quelles données de Compaction sont exposées ? | Certains Plugins n’ont besoin que de notifications, tandis que d’autres ont besoin des métadonnées conservées/supprimées. |
| Qu’est-ce qui est intentionnellement non pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec PI là où le runtime natif possède plus d’état. |

Le contrat de prise en charge du runtime Codex est documenté dans
[harness Codex](/fr/plugins/codex-harness#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Considérez-les comme
des diagnostics, pas comme des noms de fournisseurs.

- Une référence de modèle comme `openai/gpt-5.5` indique le fournisseur/modèle sélectionné.
- Un identifiant de runtime comme `codex` indique quelle boucle exécute le tour.
- Un libellé de canal comme Telegram ou Discord indique où se déroule la conversation.

Si une session affiche encore PI après la modification de la configuration du runtime, démarrez une nouvelle session
avec `/new` ou effacez la session actuelle avec `/reset`. Les sessions existantes conservent leur
runtime enregistré afin qu’une transcription ne soit pas rejouée via deux systèmes de session natifs
incompatibles.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
