---
read_when:
    - Vous choisissez entre PI, Codex, ACP ou un autre environnement d’exécution d’agent natif
    - Les libellés fournisseur/modèle/environnement d’exécution dans l’état ou la configuration prêtent à confusion
    - Vous documentez la parité de prise en charge d’un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les environnements d’exécution des agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-05-02T07:03:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **environnement d’exécution d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs et renvoie
le tour terminé à OpenClaw.

Les environnements d’exécution se confondent facilement avec les fournisseurs, car les deux apparaissent près de la
configuration du modèle. Ce sont des couches différentes :

| Couche        | Exemples                              | Signification                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Fournisseur   | `openai`, `anthropic`, `openai-codex` | La façon dont OpenClaw s’authentifie, découvre les modèles et nomme les références de modèle. |
| Modèle        | `gpt-5.5`, `claude-opus-4-6`          | Le modèle sélectionné pour le tour de l’agent.                      |
| Environnement d’exécution d’agent | `pi`, `codex`, `claude-cli`           | La boucle ou le backend de bas niveau qui exécute le tour préparé.  |
| Canal         | Telegram, Discord, Slack, WhatsApp    | L’endroit où les messages entrent dans OpenClaw et en sortent.      |

Vous verrez aussi le mot **harnais** dans le code. Un harnais est l’implémentation
qui fournit un environnement d’exécution d’agent. Par exemple, le harnais Codex inclus
implémente l’environnement d’exécution `codex`. La configuration publique utilise `agentRuntime.id` ; `openclaw
doctor --fix` réécrit les anciennes clés de politique d’exécution sous cette forme.

Il existe deux familles d’environnements d’exécution :

- Les **harnais intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw. Aujourd’hui, cela
  correspond à l’environnement d’exécution intégré `pi`, plus les harnais de plugins enregistrés tels que
  `codex`.
- Les **backends CLI** exécutent un processus CLI local tout en gardant la référence de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-7` avec
  `agentRuntime.id: "claude-cli"` signifie « sélectionner le modèle Anthropic, exécuter
  via Claude CLI ». `claude-cli` n’est pas un identifiant de harnais intégré et ne doit pas
  être passé à la sélection AgentHarness.

## Surfaces Codex

La majeure partie de la confusion vient de plusieurs surfaces différentes qui partagent le nom Codex :

| Surface                                              | Nom/configuration OpenClaw                       | Rôle                                                                                               |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Environnement d’exécution natif Codex app-server     | `openai/*` plus `agentRuntime.id: "codex"` | Exécute le tour d’agent intégré via Codex app-server. C’est la configuration habituelle avec abonnement ChatGPT/Codex. |
| Route fournisseur Codex OAuth                        | Références de modèle `openai-codex/*`      | Utilise l’OAuth d’abonnement ChatGPT/Codex via le lanceur PI normal d’OpenClaw.                               |
| Adaptateur Codex ACP                                 | `runtime: "acp"`, `agentId: "codex"`       | Exécute Codex via le plan de contrôle externe ACP/acpx. À utiliser uniquement lorsque ACP/acpx est explicitement demandé.        |
| Jeu de commandes natif de contrôle de chat Codex      | `/codex ...`                               | Lie, reprend, oriente, arrête et inspecte les fils Codex app-server depuis le chat.                            |
| Route API OpenAI Platform pour les modèles de style GPT/Codex | Références de modèle `openai/*`            | Utilise l’authentification par clé API OpenAI, sauf si un remplacement d’environnement d’exécution, comme `agentRuntime.id: "codex"`, exécute le tour.     |

Ces surfaces sont volontairement indépendantes. Activer le Plugin `codex` rend
les fonctionnalités natives app-server disponibles ; cela ne réécrit pas
`openai-codex/*` en `openai/*`, ne modifie pas les sessions existantes et ne
fait pas d’ACP la valeur par défaut de Codex. Sélectionner `openai-codex/*` signifie « utiliser la route
fournisseur Codex OAuth », sauf si vous forcez séparément un environnement d’exécution.

La configuration courante avec abonnement ChatGPT/Codex utilise Codex OAuth pour l’authentification, mais conserve
la référence de modèle en `openai/*` et sélectionne l’environnement d’exécution `codex` :

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

Cela signifie qu’OpenClaw sélectionne une référence de modèle OpenAI, puis demande à l’environnement d’exécution Codex app-server
d’exécuter le tour d’agent intégré. Cela ne signifie pas « utiliser la facturation API » et
cela ne signifie pas que le canal, le catalogue de fournisseurs de modèles ou le stockage de sessions OpenClaw
devient Codex.

Lorsque le Plugin `codex` inclus est activé, le contrôle Codex en langage naturel
doit utiliser la surface de commande native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) plutôt qu’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin
de l’adaptateur ACP. Claude Code, Gemini CLI, OpenCode, Cursor et les harnais externes
similaires utilisent toujours ACP.

Voici l’arbre de décision destiné aux agents :

1. Si l’utilisateur demande **liaison/contrôle/fil/reprise/orientation/arrêt Codex**, utilisez la
   surface de commande native `/codex` lorsque le Plugin `codex` inclus est activé.
2. Si l’utilisateur demande **Codex comme environnement d’exécution intégré** ou veut l’expérience normale
   d’agent Codex adossée à un abonnement, utilisez
   `openai/<model>` avec `agentRuntime.id: "codex"`.
3. Si l’utilisateur demande **l’authentification Codex OAuth/abonnement sur le lanceur OpenClaw
   normal**, utilisez `openai-codex/<model>` et laissez l’environnement d’exécution sur PI.
4. Si l’utilisateur dit explicitement **ACP**, **acpx** ou **adaptateur Codex ACP**, utilisez
   ACP avec `runtime: "acp"` et `agentId: "codex"`.
5. Si la demande concerne **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   un autre harnais externe**, utilisez ACP/acpx, pas l’environnement d’exécution de sous-agent natif.

| Vous voulez dire...                    | Utilisez...                                  |
| --------------------------------------- | -------------------------------------------- |
| Contrôle de chat/fil Codex app-server   | `/codex ...` depuis le Plugin `codex` inclus |
| Environnement d’exécution d’agent intégré Codex app-server | `agentRuntime.id: "codex"`                   |
| OpenAI Codex OAuth sur le lanceur PI    | Références de modèle `openai-codex/*`        |
| Claude Code ou autre harnais externe    | ACP/acpx                                     |

Pour la séparation des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge de l’environnement d’exécution Codex,
consultez [Harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

## Propriété de l’environnement d’exécution

Les différents environnements d’exécution possèdent des parties différentes de la boucle.

| Surface                     | Intégré OpenClaw PI                    | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via le lanceur intégré PI | Codex app-server                                                            |
| État de fil canonique       | Transcription OpenClaw                  | Fil Codex, plus miroir de transcription OpenClaw                            |
| Outils dynamiques OpenClaw  | Boucle d’outils native OpenClaw         | Relayés via l’adaptateur Codex                                              |
| Outils shell et fichier natifs | Chemin PI/OpenClaw                   | Outils natifs Codex, relayés via des hooks natifs lorsqu’ils sont pris en charge |
| Moteur de contexte          | Assemblage de contexte natif OpenClaw   | OpenClaw projette le contexte assemblé dans le tour Codex                    |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir |
| Distribution par canal      | OpenClaw                                | OpenClaw                                                                    |

Cette répartition de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de plugins.
- Si l’environnement d’exécution natif possède la surface, OpenClaw a besoin d’événements d’exécution ou de hooks natifs.
- Si l’environnement d’exécution natif possède l’état de fil canonique, OpenClaw doit mettre en miroir et projeter le contexte, et non réécrire des éléments internes non pris en charge.

## Sélection de l’environnement d’exécution

OpenClaw choisit un environnement d’exécution intégré après la résolution du fournisseur et du modèle :

1. L’environnement d’exécution enregistré d’une session l’emporte. Les changements de configuration ne basculent pas à chaud une
   transcription existante vers un autre système de fils natif.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force cet environnement d’exécution pour les sessions nouvelles ou réinitialisées.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` peut définir
   `auto`, `pi`, un identifiant de harnais intégré enregistré tel que `codex`, ou un
   alias de backend CLI pris en charge tel que `claude-cli`.
4. En mode `auto`, les environnements d’exécution de plugins enregistrés peuvent revendiquer les paires fournisseur/modèle
   prises en charge.
5. Si aucun environnement d’exécution ne revendique un tour en mode `auto` et que `fallback: "pi"` est défini
   (valeur par défaut), OpenClaw utilise PI comme repli de compatibilité. Définissez
   `fallback: "none"` pour faire échouer à la place la sélection non appariée en mode `auto`.

Les environnements d’exécution de plugins explicites échouent fermement par défaut. Par exemple,
`agentRuntime.id: "codex"` signifie Codex ou une erreur de sélection claire, sauf si vous définissez
`fallback: "pi"` dans la même portée de remplacement. Un remplacement d’environnement d’exécution n’hérite pas
d’un réglage de repli plus large, donc un `agentRuntime.id: "codex"` au niveau agent n’est pas
silencieusement rerouté vers PI simplement parce que les valeurs par défaut utilisaient `fallback: "pi"`.

Les alias de backend CLI sont différents des identifiants de harnais intégrés. La forme Claude CLI
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
compatibilité, mais la nouvelle configuration doit garder le fournisseur/modèle canonique et placer
le backend d’exécution dans `agentRuntime.id`.

Le mode `auto` est volontairement conservateur. Les environnements d’exécution de plugins peuvent revendiquer
les paires fournisseur/modèle qu’ils comprennent, mais le Plugin Codex ne revendique pas le
fournisseur `openai-codex` en mode `auto`. Cela conserve
`openai-codex/*` comme route explicite Codex OAuth via PI et évite de déplacer silencieusement
les configurations d’authentification par abonnement vers le harnais natif app-server.

Si `openclaw doctor` avertit que le Plugin `codex` est activé alors que
`openai-codex/*` passe toujours par PI, traitez cela comme un diagnostic, pas comme une
migration. Gardez la configuration inchangée lorsque PI Codex OAuth est ce que vous voulez.
Passez à `openai/<model>` plus `agentRuntime.id: "codex"` uniquement lorsque vous voulez l’exécution native
Codex app-server.

## Contrat de compatibilité

Lorsqu’un environnement d’exécution n’est pas PI, il doit documenter les surfaces OpenClaw qu’il prend en charge.
Utilisez cette forme pour la documentation des environnements d’exécution :

| Question                               | Pourquoi c’est important                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Qui possède la boucle du modèle ?               | Détermine où se produisent les nouvelles tentatives, la continuation des outils et les décisions de réponse finale.                   |
| Qui possède l’historique canonique du fil ?     | Détermine si OpenClaw peut modifier l’historique ou seulement le refléter.                                   |
| Les outils dynamiques d’OpenClaw fonctionnent-ils ?        | La messagerie, les sessions, Cron et les outils appartenant à OpenClaw en dépendent.                                 |
| Les hooks d’outils dynamiques fonctionnent-ils ?            | Les Plugins attendent `before_tool_call`, `after_tool_call` et un middleware autour des outils appartenant à OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ?             | Le shell, les correctifs et les outils appartenant à l’environnement d’exécution ont besoin de la prise en charge des hooks natifs pour la politique et l’observation.        |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les Plugins de mémoire et de contexte dépendent du cycle de vie d’assemblage, d’ingestion, d’après-tour et de compaction.      |
| Quelles données de compaction sont exposées ?       | Certains Plugins n’ont besoin que de notifications, tandis que d’autres ont besoin des métadonnées conservées/supprimées.                    |
| Qu’est-ce qui est intentionnellement non pris en charge ?     | Les utilisateurs ne doivent pas supposer une équivalence PI lorsque l’environnement d’exécution natif possède davantage d’état.                  |

Le contrat de prise en charge de l’environnement d’exécution Codex est documenté dans
[Harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Lisez-les comme des
diagnostics, pas comme des noms de fournisseurs.

- Une référence de modèle comme `openai/gpt-5.5` indique le fournisseur/modèle sélectionné.
- Un identifiant d’environnement d’exécution comme `codex` indique quelle boucle exécute le tour.
- Un libellé de canal comme Telegram ou Discord indique où la conversation se déroule.

Si une session affiche encore PI après la modification de la configuration de l’environnement d’exécution, démarrez une nouvelle session
avec `/new` ou effacez la session actuelle avec `/reset`. Les sessions existantes conservent leur
environnement d’exécution enregistré afin qu’une transcription ne soit pas rejouée à travers deux systèmes de session natifs incompatibles.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
