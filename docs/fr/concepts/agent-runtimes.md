---
read_when:
    - Vous choisissez entre PI, Codex, ACP ou un autre runtime d’agent natif
    - Vous êtes dérouté par les libellés de fournisseur/modèle/runtime dans l’état ou la configuration
    - Vous documentez la parité de prise en charge pour un harnais natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les runtimes d’agent
title: Runtimes d’agent
x-i18n:
    generated_at: "2026-04-25T13:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Un **runtime d’agent** est le composant qui possède une boucle de modèle préparée : il
reçoit le prompt, pilote la sortie du modèle, gère les appels d’outils natifs et renvoie
le tour terminé à OpenClaw.

Il est facile de confondre les runtimes avec les fournisseurs, car les deux apparaissent près de la
configuration du modèle. Ce sont des couches différentes :

| Couche           | Exemples                              | Signification                                                         |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Fournisseur      | `openai`, `anthropic`, `openai-codex` | Comment OpenClaw s’authentifie, découvre les modèles et nomme les références de modèle. |
| Modèle           | `gpt-5.5`, `claude-opus-4-6`          | Le modèle sélectionné pour le tour de l’agent.                        |
| Runtime d’agent  | `pi`, `codex`, runtimes adossés à ACP | La boucle de bas niveau qui exécute le tour préparé.                  |
| Canal            | Telegram, Discord, Slack, WhatsApp    | L’endroit où les messages entrent et sortent d’OpenClaw.              |

Vous verrez aussi le mot **harness** dans le code et la configuration. Un harness est
l’implémentation qui fournit un runtime d’agent. Par exemple, le harness Codex fourni
implémente le runtime `codex`. La clé de configuration s’appelle toujours
`embeddedHarness` pour des raisons de compatibilité, mais la documentation destinée aux utilisateurs et la sortie d’état
devraient généralement parler de runtime.

La configuration Codex courante utilise le fournisseur `openai` avec le runtime `codex` :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Cela signifie qu’OpenClaw sélectionne une référence de modèle OpenAI, puis demande au
runtime du serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas que le canal, le
catalogue de fournisseurs de modèles ou le magasin de sessions OpenClaw deviennent Codex.

Pour la séparation des préfixes de la famille OpenAI, voir [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge du runtime Codex,
voir [Harness Codex](/fr/plugins/codex-harness#v1-support-contract).

## Propriété du runtime

Différents runtimes possèdent différentes parts de la boucle.

| Surface                     | Pi intégré OpenClaw                    | Serveur d’application Codex                                                   |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw via l’exécuteur Pi intégré | Serveur d’application Codex                                                   |
| État canonique du fil       | Transcription OpenClaw                 | Fil Codex, plus miroir de transcription OpenClaw                              |
| Outils dynamiques OpenClaw  | Boucle d’outils native OpenClaw        | Reliés via l’adaptateur Codex                                                 |
| Outils shell et fichiers natifs | Chemin Pi/OpenClaw                  | Outils natifs Codex, reliés via des hooks natifs lorsque pris en charge       |
| Moteur de contexte          | Assemblage de contexte natif OpenClaw  | Contexte assemblé par les projets OpenClaw dans le tour Codex                 |
| Compaction                  | OpenClaw ou moteur de contexte sélectionné | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir |
| Distribution par canal      | OpenClaw                               | OpenClaw                                                                      |

Cette séparation de propriété est la règle de conception principale :

- Si OpenClaw possède la surface, OpenClaw peut fournir le comportement normal des hooks de Plugin.
- Si le runtime natif possède la surface, OpenClaw a besoin d’événements de runtime ou de hooks natifs.
- Si le runtime natif possède l’état canonique du fil, OpenClaw doit mettre en miroir et projeter le contexte, et non réécrire des éléments internes non pris en charge.

## Sélection du runtime

OpenClaw choisit un runtime intégré après la résolution du fournisseur et du modèle :

1. Le runtime enregistré d’une session l’emporte. Les changements de configuration ne basculent pas à chaud
   une transcription existante vers un autre système de fil natif.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force ce runtime pour les sessions nouvelles ou réinitialisées.
3. `agents.defaults.embeddedHarness.runtime` ou
   `agents.list[].embeddedHarness.runtime` peuvent définir `auto`, `pi` ou un
   ID de runtime enregistré tel que `codex`.
4. En mode `auto`, les runtimes de Plugin enregistrés peuvent revendiquer des paires
   fournisseur/modèle prises en charge.
5. Si aucun runtime ne revendique un tour en mode `auto` et que `fallback: "pi"` est défini
   (valeur par défaut), OpenClaw utilise Pi comme solution de compatibilité. Définissez
   `fallback: "none"` pour faire échouer la sélection non correspondante en mode `auto`.

Les runtimes de Plugin explicites échouent en mode fermé par défaut. Par exemple,
`runtime: "codex"` signifie Codex ou une erreur de sélection claire, sauf si vous définissez
`fallback: "pi"` dans la même portée de remplacement. Un remplacement de runtime n’hérite pas
d’un paramètre de repli plus large ; ainsi, un `runtime: "codex"` au niveau agent n’est pas
silencieusement rerouté vers Pi simplement parce que les valeurs par défaut utilisaient `fallback: "pi"`.

## Contrat de compatibilité

Lorsqu’un runtime n’est pas Pi, il doit documenter quelles surfaces OpenClaw il prend en charge.
Utilisez cette structure pour la documentation du runtime :

| Question                               | Pourquoi c’est important                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Qui possède la boucle de modèle ?      | Détermine où se produisent les réessais, la continuation d’outil et les décisions de réponse finale. |
| Qui possède l’historique canonique du fil ? | Détermine si OpenClaw peut modifier l’historique ou seulement le mettre en miroir.        |
| Les outils dynamiques OpenClaw fonctionnent-ils ? | La messagerie, les sessions, Cron et les outils possédés par OpenClaw en dépendent. |
| Les hooks d’outils dynamiques fonctionnent-ils ? | Les Plugins attendent `before_tool_call`, `after_tool_call` et un middleware autour des outils possédés par OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ? | Les outils shell, patch et possédés par le runtime ont besoin de la prise en charge des hooks natifs pour la politique et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les Plugins de mémoire et de contexte dépendent du cycle de vie assemble, ingest, after-turn et Compaction. |
| Quelles données de Compaction sont exposées ? | Certains Plugins n’ont besoin que de notifications, tandis que d’autres ont besoin de métadonnées conservées/supprimées. |
| Qu’est-ce qui est volontairement non pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec Pi là où le runtime natif possède davantage d’état. |

Le contrat de prise en charge du runtime Codex est documenté dans
[Harness Codex](/fr/plugins/codex-harness#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Lisez-les comme
des diagnostics, et non comme des noms de fournisseurs.

- Une référence de modèle telle que `openai/gpt-5.5` vous indique le fournisseur/modèle sélectionné.
- Un ID de runtime tel que `codex` vous indique quelle boucle exécute le tour.
- Un libellé de canal tel que Telegram ou Discord vous indique où la conversation a lieu.

Si une session affiche toujours Pi après modification de la configuration du runtime, démarrez une nouvelle session
avec `/new` ou effacez la session actuelle avec `/reset`. Les sessions existantes conservent leur
runtime enregistré afin qu’une transcription ne soit pas rejouée à travers deux systèmes de session natifs incompatibles.

## Lié

- [Harness Codex](/fr/plugins/codex-harness)
- [OpenAI](/fr/providers/openai)
- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
