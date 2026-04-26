---
read_when:
    - Vous choisissez entre Pi, Codex, ACP ou un autre runtime d’agent natif
    - Vous êtes dérouté par les libellés de fournisseur/modèle/runtime dans le statut ou la configuration
    - Vous documentez la parité de prise en charge pour un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les runtimes d’agent
title: Runtimes d’agent
x-i18n:
    generated_at: "2026-04-26T11:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Un **runtime d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs, puis renvoie
le tour terminé à OpenClaw.

Il est facile de confondre les runtimes avec les fournisseurs, car les deux apparaissent près de la
configuration du modèle. Ce sont des couches différentes :

| Layer         | Examples                              | Ce que cela signifie                                                  |
| ------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Fournisseur   | `openai`, `anthropic`, `openai-codex` | Comment OpenClaw s’authentifie, découvre les modèles et nomme les références de modèle. |
| Modèle        | `gpt-5.5`, `claude-opus-4-6`          | Le modèle sélectionné pour le tour de l’agent.                        |
| Runtime d’agent | `pi`, `codex`, `claude-cli`         | La boucle de bas niveau ou le backend qui exécute le tour préparé.   |
| Canal         | Telegram, Discord, Slack, WhatsApp    | L’endroit où les messages entrent et sortent d’OpenClaw.             |

Vous verrez aussi le mot **harness** dans le code. Un harness est l’implémentation
qui fournit un runtime d’agent. Par exemple, le harness Codex intégré
implémente le runtime `codex`. La configuration publique utilise `agentRuntime.id` ; `openclaw
doctor --fix` réécrit les anciennes clés de politique de runtime vers cette forme.

Il existe deux familles de runtimes :

- Les **harnesses embarqués** s’exécutent à l’intérieur de la boucle d’agent préparée d’OpenClaw. Aujourd’hui, cela
  correspond au runtime `pi` intégré ainsi qu’aux harnesses de Plugin enregistrés tels que
  `codex`.
- Les **backends CLI** exécutent un processus CLI local tout en conservant la référence de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-7` avec
  `agentRuntime.id: "claude-cli"` signifie « sélectionner le modèle Anthropic, exécuter
  via Claude CLI ». `claude-cli` n’est pas un identifiant de harness embarqué et ne doit pas
  être transmis à la sélection d’AgentHarness.

## Trois choses nommées Codex

La plupart des confusions viennent du fait que trois surfaces différentes partagent le nom Codex :

| Surface                                              | Nom/configuration OpenClaw            | Ce que cela fait                                                                                  |
| ---------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Route de fournisseur OAuth Codex                     | références de modèle `openai-codex/*` | Utilise l’abonnement OAuth ChatGPT/Codex via le runner PI normal d’OpenClaw.                     |
| Runtime natif d’app-server Codex                     | `agentRuntime.id: "codex"`            | Exécute le tour d’agent embarqué via le harness app-server Codex intégré.                         |
| Adaptateur ACP Codex                                 | `runtime: "acp"`, `agentId: "codex"`  | Exécute Codex via le plan de contrôle ACP/acpx externe. À utiliser uniquement si ACP/acpx est explicitement demandé. |
| Ensemble de commandes natives de contrôle du chat Codex | `/codex ...`                        | Lie, reprend, pilote, arrête et inspecte les fils app-server Codex depuis le chat.               |
| Route API OpenAI Platform pour les modèles de type GPT/Codex | références de modèle `openai/*` | Utilise l’authentification par clé API OpenAI sauf si un remplacement de runtime, tel que `runtime: "codex"`, exécute le tour. |

Ces surfaces sont volontairement indépendantes. Activer le Plugin `codex` rend
les fonctionnalités natives d’app-server disponibles ; cela ne réécrit pas
`openai-codex/*` en `openai/*`, ne modifie pas les sessions existantes, et ne
fait pas d’ACP la valeur par défaut pour Codex. Sélectionner `openai-codex/*` signifie « utiliser la route du fournisseur OAuth Codex » sauf si vous forcez séparément un runtime.

La configuration Codex courante utilise le fournisseur `openai` avec le runtime `codex` :

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

Cela signifie qu’OpenClaw sélectionne une référence de modèle OpenAI, puis demande au
runtime app-server Codex d’exécuter le tour d’agent embarqué. Cela ne signifie pas que le canal, le
catalogue du fournisseur de modèles ou le magasin de sessions OpenClaw deviennent Codex.

Lorsque le Plugin `codex` intégré est activé, le contrôle Codex en langage naturel
doit utiliser la surface de commandes native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) au lieu d’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin de
l’adaptateur ACP. Claude Code, Gemini CLI, OpenCode, Cursor et les harnesses externes similaires
utilisent toujours ACP.

Voici l’arbre de décision côté agent :

1. Si l’utilisateur demande **liaison/contrôle/fil/reprise/pilotage/arrêt Codex**, utilisez la
   surface de commandes native `/codex` lorsque le Plugin `codex` intégré est activé.
2. Si l’utilisateur demande **Codex comme runtime embarqué**, utilisez
   `openai/<model>` avec `agentRuntime.id: "codex"`.
3. Si l’utilisateur demande **l’authentification OAuth/abonnement Codex sur le runner normal d’OpenClaw**,
   utilisez `openai-codex/<model>` et laissez le runtime sur PI.
4. Si l’utilisateur dit explicitement **ACP**, **acpx** ou **adaptateur ACP Codex**, utilisez
   ACP avec `runtime: "acp"` et `agentId: "codex"`.
5. Si la demande concerne **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   un autre harness externe**, utilisez ACP/acpx, pas le runtime natif de sous-agent.

| Vous voulez dire...                      | Utiliser...                                  |
| ---------------------------------------- | -------------------------------------------- |
| Contrôle de chat/fil app-server Codex    | `/codex ...` depuis le Plugin `codex` intégré |
| Runtime d’agent embarqué app-server Codex | `agentRuntime.id: "codex"`                  |
| OAuth OpenAI Codex sur le runner PI      | références de modèle `openai-codex/*`        |
| Claude Code ou autre harness externe     | ACP/acpx                                     |

Pour la séparation des préfixes de la famille OpenAI, voir [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge du runtime
Codex, voir [Harness Codex](/fr/plugins/codex-harness#v1-support-contract).

## Propriété du runtime

Différents runtimes possèdent différentes parties de la boucle.

| Surface                     | PI embarqué OpenClaw                    | App-server Codex                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via le runner PI embarqué | App-server Codex                                                            |
| État canonique du fil       | Transcription OpenClaw                  | Fil Codex, plus miroir de transcription OpenClaw                            |
| Outils dynamiques OpenClaw  | Boucle d’outils native OpenClaw         | Reliés via l’adaptateur Codex                                               |
| Outils natifs shell et fichiers | Chemin PI/OpenClaw                   | Outils natifs Codex, reliés via des hooks natifs lorsqu’ils sont pris en charge |
| Moteur de contexte          | Assemblage natif du contexte OpenClaw   | Contexte assemblé par les projets OpenClaw dans le tour Codex               |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné | Compaction native Codex, avec notifications OpenClaw et maintien du miroir |
| Livraison du canal          | OpenClaw                                | OpenClaw                                                                    |

Cette répartition de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de Plugin.
- Si le runtime natif possède la surface, OpenClaw a besoin d’événements de runtime ou de hooks natifs.
- Si le runtime natif possède l’état canonique du fil, OpenClaw doit refléter et projeter le contexte, et non réécrire des éléments internes non pris en charge.

## Sélection du runtime

OpenClaw choisit un runtime embarqué après la résolution du fournisseur et du modèle :

1. Le runtime enregistré d’une session l’emporte. Les modifications de configuration ne basculent pas à chaud
   une transcription existante vers un autre système de fils natif.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force ce runtime pour les nouvelles sessions ou les sessions réinitialisées.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` peut définir
   `auto`, `pi`, un identifiant de harness embarqué enregistré tel que `codex`, ou un
   alias de backend CLI pris en charge tel que `claude-cli`.
4. En mode `auto`, les runtimes de Plugin enregistrés peuvent réclamer des paires fournisseur/modèle prises en charge.
5. Si aucun runtime ne réclame un tour en mode `auto` et que `fallback: "pi"` est défini
   (par défaut), OpenClaw utilise PI comme repli de compatibilité. Définissez
   `fallback: "none"` pour faire échouer la sélection non appariée en mode `auto`.

Les runtimes de Plugin explicites échouent en mode fermé par défaut. Par exemple,
`runtime: "codex"` signifie Codex ou une erreur de sélection claire sauf si vous définissez
`fallback: "pi"` dans la même portée de remplacement. Un remplacement de runtime n’hérite pas
d’un paramètre de repli plus large ; ainsi, un `runtime: "codex"` au niveau agent n’est pas silencieusement
redirigé vers PI simplement parce que les valeurs par défaut utilisaient `fallback: "pi"`.

Les alias de backend CLI sont différents des identifiants de harness embarqués. La forme préférée pour Claude CLI est :

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

Les références héritées telles que `claude-cli/claude-opus-4-7` restent prises en charge pour la
compatibilité, mais les nouvelles configurations doivent conserver la forme canonique fournisseur/modèle et placer
le backend d’exécution dans `agentRuntime.id`.

Le mode `auto` est volontairement conservateur. Les runtimes de Plugin peuvent réclamer
des paires fournisseur/modèle qu’ils comprennent, mais le Plugin Codex ne réclame pas le
fournisseur `openai-codex` en mode `auto`. Cela conserve
`openai-codex/*` comme route OAuth Codex PI explicite et évite de déplacer silencieusement
des configurations authentifiées par abonnement vers le harness app-server natif.

Si `openclaw doctor` avertit que le Plugin `codex` est activé alors que
`openai-codex/*` passe toujours par PI, traitez cela comme un diagnostic, pas comme une
migration. Conservez la configuration inchangée si PI Codex OAuth est ce que vous voulez.
Basculez vers `openai/<model>` plus `agentRuntime.id: "codex"` uniquement si vous voulez une
exécution native app-server Codex.

## Contrat de compatibilité

Lorsqu’un runtime n’est pas PI, il doit documenter quelles surfaces OpenClaw il prend en charge.
Utilisez cette forme pour la documentation des runtimes :

| Question                               | Pourquoi c’est important                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Qui possède la boucle de modèle ?      | Détermine où ont lieu les tentatives, la continuation des outils et les décisions de réponse finale. |
| Qui possède l’historique canonique du fil ? | Détermine si OpenClaw peut modifier l’historique ou seulement le refléter.               |
| Les outils dynamiques OpenClaw fonctionnent-ils ? | La messagerie, les sessions, Cron et les outils possédés par OpenClaw en dépendent. |
| Les hooks d’outils dynamiques fonctionnent-ils ? | Les plugins attendent `before_tool_call`, `after_tool_call` et du middleware autour des outils possédés par OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ? | Les outils shell, patch et ceux possédés par le runtime nécessitent une prise en charge des hooks natifs pour la politique et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les plugins de mémoire et de contexte dépendent du cycle de vie assemble, ingest, after-turn et compaction. |
| Quelles données de Compaction sont exposées ? | Certains plugins n’ont besoin que de notifications, tandis que d’autres ont besoin de métadonnées conservées/supprimées. |
| Qu’est-ce qui est intentionnellement non pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec PI lorsque le runtime natif possède davantage d’état. |

Le contrat de prise en charge du runtime Codex est documenté dans
[Harness Codex](/fr/plugins/codex-harness#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Interprétez-les comme
des diagnostics, et non comme des noms de fournisseur.

- Une référence de modèle telle que `openai/gpt-5.5` vous indique le fournisseur/modèle sélectionné.
- Un identifiant de runtime tel que `codex` vous indique quelle boucle exécute le tour.
- Un libellé de canal tel que Telegram ou Discord vous indique où la conversation a lieu.

Si une session affiche toujours PI après une modification de la configuration du runtime, démarrez une nouvelle session
avec `/new` ou effacez la session actuelle avec `/reset`. Les sessions existantes conservent leur runtime
enregistré afin qu’une transcription ne soit pas rejouée à travers deux systèmes de session natifs incompatibles.

## Liens connexes

- [Harness Codex](/fr/plugins/codex-harness)
- [OpenAI](/fr/providers/openai)
- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [Statut](/fr/cli/status)
