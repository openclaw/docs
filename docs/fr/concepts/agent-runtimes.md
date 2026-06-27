---
read_when:
    - Vous choisissez entre OpenClaw, Codex, ACP ou un autre runtime d’agent natif
    - Vous êtes déconcerté par les libellés de fournisseur, de modèle ou d’exécution dans l’état ou la configuration
    - Vous documentez la parité de prise en charge pour un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les runtimes d’agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-06-27T17:22:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs et renvoie
le tour terminé à OpenClaw.

Les runtimes peuvent facilement être confondus avec les fournisseurs, car les deux
apparaissent près de la configuration du modèle. Ce sont des couches différentes :

| Couche        | Exemples                                     | Ce que cela signifie                                                        |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Fournisseur   | `openai`, `anthropic`, `github-copilot`      | Comment OpenClaw s’authentifie, découvre les modèles et nomme les références de modèle. |
| Modèle        | `gpt-5.5`, `claude-opus-4-6`                 | Le modèle sélectionné pour le tour de l’agent.                              |
| Runtime d’agent | `openclaw`, `codex`, `copilot`, `claude-cli` | La boucle ou le backend de bas niveau qui exécute le tour préparé.          |
| Canal         | Telegram, Discord, Slack, WhatsApp           | Où les messages entrent dans OpenClaw et en sortent.                        |

Vous verrez aussi le mot **harnais** dans le code. Un harnais est l’implémentation
qui fournit un runtime d’agent. Par exemple, le harnais Codex intégré
implémente le runtime `codex`. La configuration publique utilise `agentRuntime.id` sur
les entrées de fournisseur ou de modèle ; les clés de runtime au niveau de l’agent entier sont héritées et ignorées.
`openclaw doctor --fix` supprime les anciens verrouillages de runtime au niveau de l’agent entier et réécrit
les anciennes références de modèle de runtime en références fournisseur/modèle canoniques, plus une politique de runtime
scopée au modèle lorsque nécessaire.

Il existe deux familles de runtimes :

- Les **harnais intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw. Aujourd’hui, cela
  comprend le runtime `openclaw` intégré ainsi que les harnais de Plugin enregistrés, tels que
  `codex` et `copilot`.
- Les **backends CLI** exécutent un processus CLI local tout en conservant la référence de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-8` avec
  un `agentRuntime.id: "claude-cli"` scopé au modèle signifie « sélectionner le modèle Anthropic,
  exécuter via Claude CLI ». `claude-cli` n’est pas un identifiant de harnais intégré
  et ne doit pas être transmis à la sélection AgentHarness.

Le harnais `copilot` est un harnais de Plugin externe distinct, activable explicitement, pour la
CLI GitHub Copilot ; consultez [runtime d’agent GitHub Copilot](/fr/plugins/copilot)
pour la décision côté utilisateur entre PI, Codex et le runtime d’agent GitHub Copilot.

## Surfaces Codex

La plupart des confusions viennent de plusieurs surfaces différentes qui partagent le nom Codex :

| Surface                                          | Nom/configuration OpenClaw            | Ce qu’elle fait                                                                                                  |
| ------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Runtime natif du serveur d’application Codex     | Références de modèle `openai/*`      | Exécute les tours d’agent OpenAI intégrés via le serveur d’application Codex. C’est la configuration habituelle d’abonnement ChatGPT/Codex. |
| Profils d’authentification OAuth Codex           | Profils OAuth `openai`               | Stocke l’authentification d’abonnement ChatGPT/Codex consommée par le harnais du serveur d’application Codex.   |
| Adaptateur ACP Codex                             | `runtime: "acp"`, `agentId: "codex"` | Exécute Codex via le plan de contrôle externe ACP/acpx. À utiliser uniquement quand ACP/acpx est explicitement demandé. |
| Ensemble de commandes natives de contrôle de chat Codex | `/codex ...`                         | Lie, reprend, oriente, arrête et inspecte les fils du serveur d’application Codex depuis le chat.               |
| Route API OpenAI Platform pour les surfaces hors agent | `openai/*` plus authentification par clé API | Utilisée pour les API OpenAI directes comme les images, les embeddings, la parole et le temps réel.             |

Ces surfaces sont intentionnellement indépendantes. Activer le Plugin `codex` rend
les fonctionnalités natives du serveur d’application disponibles ; `openclaw doctor --fix` prend en charge la réparation
des anciennes routes Codex et le nettoyage des verrouillages de session obsolètes. Sélectionner
`openai/*` pour un modèle d’agent signifie désormais « exécuter ceci via Codex », sauf si une
surface API OpenAI hors agent est utilisée.

La configuration courante d’abonnement ChatGPT/Codex utilise OAuth Codex pour l’authentification, mais conserve
la référence de modèle sous la forme `openai/*` et sélectionne le runtime `codex` :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Cela signifie qu’OpenClaw sélectionne une référence de modèle OpenAI, puis demande au runtime
du serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas « utiliser la facturation API »,
et cela ne signifie pas que le canal, le catalogue des fournisseurs de modèles ou le magasin de sessions OpenClaw
devient Codex.

Quand le Plugin `codex` intégré est activé, le contrôle Codex en langage naturel
doit utiliser la surface de commande native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) au lieu d’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin de l’adaptateur ACP.
Claude Code, Gemini CLI, OpenCode, Cursor et les harnais externes similaires
utilisent toujours ACP.

Voici l’arbre de décision destiné aux agents :

1. Si l’utilisateur demande **liaison/contrôle/fil/reprise/orientation/arrêt Codex**, utilisez la
   surface de commande native `/codex` lorsque le Plugin `codex` intégré est activé.
2. Si l’utilisateur demande **Codex comme runtime intégré** ou souhaite l’expérience normale
   d’agent Codex adossée à un abonnement, utilisez `openai/<model>`.
3. Si l’utilisateur choisit explicitement **OpenClaw pour un modèle OpenAI**, conservez la référence de modèle
   sous la forme `openai/<model>` et définissez la politique de runtime fournisseur/modèle sur
   `agentRuntime.id: "openclaw"`. Un profil OAuth `openai` sélectionné est acheminé
   en interne via le transport d’authentification Codex d’OpenClaw.
4. Si l’ancienne configuration contient encore des **références de modèle Codex héritées**, réparez-la en
   `openai/<model>` avec `openclaw doctor --fix` ; doctor conserve la route d’authentification Codex
   en ajoutant `agentRuntime.id: "codex"` scopé au fournisseur/modèle lorsque l’ancienne référence de modèle
   l’impliquait.
   Les anciennes **références de modèle `codex-cli/*`** sont réparées vers la même route de serveur d’application Codex
   `openai/<model>` ; OpenClaw ne conserve plus de backend CLI Codex intégré.
5. Si l’utilisateur dit explicitement **ACP**, **acpx** ou **adaptateur ACP Codex**, utilisez
   ACP avec `runtime: "acp"` et `agentId: "codex"`.
6. Si la demande concerne **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   un autre harnais externe**, utilisez ACP/acpx, pas le runtime de sous-agent natif.

| Vous voulez dire...                      | Utilisez...                                  |
| ---------------------------------------- | -------------------------------------------- |
| Contrôle de chat/fil du serveur d’application Codex | `/codex ...` depuis le Plugin `codex` intégré |
| Runtime d’agent intégré du serveur d’application Codex | Références de modèle d’agent `openai/*`       |
| OAuth OpenAI Codex                       | Profils OAuth `openai`                       |
| Claude Code ou autre harnais externe     | ACP/acpx                                     |

Pour la séparation des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge du runtime Codex,
consultez [runtime du harnais Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Propriété du runtime

Différents runtimes possèdent différentes parties de la boucle.

| Surface                     | OpenClaw intégré                              | Serveur d’application Codex                                                   |
| --------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via l’exécuteur intégré OpenClaw     | Serveur d’application Codex                                                   |
| État de fil canonique       | Transcription OpenClaw                        | Fil Codex, plus miroir de transcription OpenClaw                              |
| Outils dynamiques OpenClaw  | Boucle d’outils OpenClaw native               | Reliés via l’adaptateur Codex                                                 |
| Outils natifs de shell et de fichiers | Chemin OpenClaw                                | Outils natifs Codex, reliés via des hooks natifs lorsque pris en charge       |
| Moteur de contexte          | Assemblage de contexte OpenClaw natif         | OpenClaw projette le contexte assemblé dans le tour Codex                     |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné    | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir |
| Livraison par canal         | OpenClaw                                      | OpenClaw                                                                      |

Cette répartition de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de Plugin.
- Si le runtime natif possède la surface, OpenClaw a besoin d’événements de runtime ou de hooks natifs.
- Si le runtime natif possède l’état de fil canonique, OpenClaw doit refléter et projeter le contexte, pas réécrire des internes non pris en charge.

## Sélection du runtime

OpenClaw choisit un runtime intégré après la résolution du fournisseur et du modèle :

1. La politique de runtime scopée au modèle prévaut. Elle peut se trouver dans une entrée de modèle
   de fournisseur configurée ou dans `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Un joker de fournisseur
   comme `agents.defaults.models["vllm/*"].agentRuntime` s’applique après la politique de modèle exacte,
   afin que les modèles de fournisseur découverts dynamiquement puissent partager un même
   runtime sans remplacer les exceptions exactes par modèle.
2. La politique de runtime scopée au fournisseur vient ensuite à
   `models.providers.<provider>.agentRuntime`.
3. En mode `auto`, les runtimes de Plugin enregistrés peuvent revendiquer les paires fournisseur/modèle
   prises en charge.
4. Si aucun runtime ne revendique un tour en mode `auto`, OpenClaw utilise `openclaw` comme
   runtime de compatibilité. Utilisez un identifiant de runtime explicite lorsque l’exécution doit être
   stricte.

Les verrouillages de runtime au niveau de la session entière et de l’agent entier sont ignorés. Cela inclut
`OPENCLAW_AGENT_RUNTIME`, l’état de session `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` et `agents.list[].agentRuntime`. Exécutez
`openclaw doctor --fix` pour supprimer la configuration de runtime obsolète au niveau de l’agent entier et convertir
les anciennes références de modèle de runtime lorsque OpenClaw peut en préserver l’intention.

Les runtimes de Plugin explicites fournisseur/modèle échouent de façon fermée. Par exemple,
`agentRuntime.id: "codex"` sur un fournisseur ou un modèle signifie Codex ou une erreur claire
de sélection/runtime ; il n’est jamais réacheminé silencieusement vers OpenClaw.

Les alias de backend CLI sont différents des identifiants de harnais intégrés. La forme Claude CLI préférée est :

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Les références héritées comme `claude-cli/claude-opus-4-7` restent prises en charge pour
compatibilité, mais une nouvelle configuration doit conserver le fournisseur/modèle canonique et placer
le backend d’exécution dans la politique de runtime fournisseur/modèle.

Les anciennes références `codex-cli/*` sont différentes : doctor les migre vers `openai/*` afin
qu’elles s’exécutent via le harnais du serveur d’application Codex au lieu de préserver un backend CLI
Codex.

Le mode `auto` est intentionnellement conservateur pour la plupart des fournisseurs. Les modèles d’agent OpenAI
font exception : un runtime non défini et `auto` se résolvent tous deux vers le harnais Codex.
La configuration explicite du runtime OpenClaw reste une route de compatibilité activable explicitement pour les tours d’agent
`openai/*` ; lorsqu’elle est associée à un profil OAuth `openai` sélectionné,
OpenClaw achemine ce chemin en interne via le transport d’authentification Codex tout en
conservant la référence de modèle publique sous la forme `openai/*`. Les verrouillages de session de runtime OpenAI obsolètes sont
ignorés par la sélection du runtime et peuvent être nettoyés avec `openclaw doctor --fix`.

Si `openclaw doctor` avertit que le plugin `codex` est activé alors que des références de modèles Codex héritées restent dans la configuration, traitez cela comme un état de route hérité. Exécutez `openclaw doctor --fix` pour le réécrire en `openai/*` avec le runtime Codex.

## Runtime d’agent GitHub Copilot

Le plugin externe `@openclaw/copilot` enregistre un runtime `copilot` à activation explicite, adossé à la CLI GitHub Copilot (`@github/copilot-sdk`). Il revendique le fournisseur d’abonnement canonique `github-copilot` et n’est **jamais** sélectionné par `auto`. Activez-le par modèle ou par fournisseur via `agentRuntime.id` :

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Le harness revendique son fournisseur, son runtime, sa clé de session CLI et son préfixe de profil d’authentification dans `extensions/copilot/doctor-contract-api.ts`, que `openclaw doctor` charge automatiquement. Pour la configuration, l’authentification, la mise en miroir des transcriptions, la Compaction, le contrat doctor déclaratif et la décision plus large entre SDK PI, Codex et Copilot, consultez [Runtime d’agent GitHub Copilot](/fr/plugins/copilot).

## Contrat de compatibilité

Lorsqu’un runtime n’est pas OpenClaw, il doit documenter les surfaces OpenClaw qu’il prend en charge.
Utilisez cette forme pour la documentation de runtime :

| Question                               | Pourquoi c’est important                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Qui possède la boucle de modèle ?      | Détermine où se produisent les nouvelles tentatives, la continuation des outils et les décisions de réponse finale. |
| Qui possède l’historique canonique du fil ? | Détermine si OpenClaw peut modifier l’historique ou seulement le mettre en miroir.                               |
| Les outils dynamiques OpenClaw fonctionnent-ils ? | La messagerie, les sessions, Cron et les outils détenus par OpenClaw en dépendent.                              |
| Les hooks d’outils dynamiques fonctionnent-ils ? | Les plugins attendent `before_tool_call`, `after_tool_call` et un middleware autour des outils détenus par OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ? | Le shell, les patchs et les outils détenus par le runtime nécessitent la prise en charge des hooks natifs pour la politique et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les plugins de mémoire et de contexte dépendent des cycles assemble, ingest, after-turn et compaction.           |
| Quelles données de compaction sont exposées ? | Certains plugins n’ont besoin que de notifications, tandis que d’autres ont besoin de métadonnées conservées/supprimées. |
| Qu’est-ce qui est intentionnellement non pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec OpenClaw lorsque le runtime natif possède davantage d’état. |

Le contrat de prise en charge du runtime Codex est documenté dans
[Runtime de harness Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Lisez-les comme des diagnostics, et non comme des noms de fournisseurs.

- Une référence de modèle telle que `openai/gpt-5.5` indique le fournisseur/modèle sélectionné.
- Un identifiant de runtime tel que `codex` indique quelle boucle exécute le tour.
- Un libellé de canal tel que Telegram ou Discord indique où la conversation a lieu.

Si une exécution affiche encore un runtime inattendu, inspectez d’abord la politique de runtime du fournisseur/modèle sélectionné. Les épingles de runtime de session héritées ne décident plus du routage.

## Connexe

- [Harness Codex](/fr/plugins/codex-harness)
- [Runtime de harness Codex](/fr/plugins/codex-harness-runtime)
- [Runtime d’agent GitHub Copilot](/fr/plugins/copilot)
- [OpenAI](/fr/providers/openai)
- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
