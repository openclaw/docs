---
read_when:
    - Vous choisissez entre OpenClaw, Codex, ACP ou un autre environnement d’exécution d’agent natif
    - Les libellés de fournisseur, de modèle ou d’environnement d’exécution dans l’état ou la configuration vous semblent confus
    - Vous documentez la parité de prise en charge d’un environnement d’exécution natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les environnements d’exécution des agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-07-12T15:11:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **environnement d’exécution d’agent** possède une boucle de modèle préparée : il reçoit le prompt,
pilote la sortie du modèle, gère les appels d’outils natifs et renvoie le tour terminé
à OpenClaw.

Il est facile de confondre les environnements d’exécution avec les fournisseurs, car les deux apparaissent près de la
configuration du modèle. Il s’agit de couches différentes :

| Couche                        | Exemples                                     | Signification                                                                                         |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Fournisseur                   | `anthropic`, `github-copilot`, `openai`      | Façon dont OpenClaw s’authentifie, découvre les modèles et nomme les références de modèles.           |
| Modèle                        | `claude-opus-4-6`, `gpt-5.6-sol`             | Modèle sélectionné pour le tour de l’agent.                                                           |
| Environnement d’exécution d’agent | `claude-cli`, `codex`, `copilot`, `openclaw` | Boucle de bas niveau ou backend qui exécute le tour préparé.                                          |
| Canal                         | Discord, Slack, Telegram, WhatsApp           | Emplacement par lequel les messages entrent dans OpenClaw et en sortent.                              |

Un **harness** est l’implémentation qui fournit un environnement d’exécution d’agent (terme
du code). Par exemple, le harness Codex intégré implémente l’environnement d’exécution `codex`.
La configuration publique utilise `agentRuntime.id` dans les entrées de fournisseur ou de modèle ; les clés
d’environnement d’exécution au niveau de l’agent entier sont obsolètes et ignorées. `openclaw doctor --fix` supprime les anciennes
épingles d’environnement d’exécution au niveau de l’agent entier et réécrit les anciennes références de modèles d’environnement d’exécution en références
canoniques fournisseur/modèle, avec une politique d’environnement d’exécution limitée au modèle lorsque nécessaire.

Deux familles d’environnements d’exécution :

- Les **harness intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw : l’environnement
  d’exécution `openclaw` intégré, ainsi que les harness de Plugin enregistrés tels que
  `codex` et `copilot`.
- Les **backends CLI** exécutent un processus CLI local tout en conservant la référence de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-8` avec un
  `agentRuntime.id: "claude-cli"` limité au modèle signifie « sélectionner le modèle Anthropic, l’exécuter
  via Claude CLI ». `claude-cli` n’est pas un identifiant de harness intégré et ne doit pas
  être transmis à la sélection d’AgentHarness.

Le harness `copilot` est un harness de Plugin externe distinct et facultatif pour la
CLI GitHub Copilot ; consultez [Environnement d’exécution d’agent GitHub Copilot](/fr/plugins/copilot) pour
la décision destinée aux utilisateurs entre PI, Codex et l’environnement d’exécution d’agent GitHub Copilot.

## Surfaces Codex

Plusieurs surfaces partagent le nom Codex :

| Surface                                               | Nom/configuration OpenClaw              | Fonction                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Environnement d’exécution natif du serveur d’application Codex | Références de modèles `openai/*`        | Exécute les tours d’agent intégrés OpenAI via le serveur d’application Codex. Il s’agit de la configuration d’abonnement ChatGPT/Codex habituelle. |
| Profils d’authentification OAuth Codex                | Profils OAuth `openai`                  | Stocke l’authentification d’abonnement ChatGPT/Codex utilisée par le harness du serveur d’application Codex.                    |
| Adaptateur ACP Codex                                  | `runtime: "acp"`, `agentId: "codex"`    | Exécute Codex via le plan de contrôle ACP/acpx externe. À utiliser uniquement lorsqu’ACP/acpx est explicitement demandé.         |
| Ensemble natif de commandes de contrôle de conversation Codex | `/codex ...`                            | Lie, reprend, dirige, arrête et inspecte les fils du serveur d’application Codex depuis la conversation.                        |
| Route API OpenAI Platform pour les surfaces hors agent | `openai/*` avec authentification par clé API | API OpenAI directes telles que les images, les embeddings, la parole et le temps réel.                                          |

Ces surfaces sont intentionnellement indépendantes. L’activation du Plugin `codex`
rend disponibles les fonctionnalités natives du serveur d’application ; `openclaw doctor --fix` prend en charge
la réparation des anciennes routes Codex et le nettoyage des épingles de session obsolètes. La sélection de `openai/*`
pour un modèle d’agent signifie désormais « exécuter ceci via Codex », sauf si une surface
API OpenAI hors agent est utilisée.

La configuration courante d’un abonnement ChatGPT/Codex utilise OAuth Codex pour l’authentification, mais
conserve la référence de modèle sous la forme `openai/*` et sélectionne l’environnement d’exécution `codex` :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Cela signifie qu’OpenClaw sélectionne une référence de modèle OpenAI, puis demande à l’environnement d’exécution du
serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas « utiliser la facturation
de l’API » et ne signifie pas que le canal, le catalogue des fournisseurs de modèles ou le
stockage des sessions OpenClaw devient Codex.

Lorsque le Plugin `codex` intégré est activé, utilisez la surface de commandes native `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) pour contrôler Codex en langage naturel plutôt qu’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin de
l’adaptateur ACP. Claude Code, Gemini CLI, OpenCode, Cursor et les harness externes similaires
continuent d’utiliser ACP.

Arbre de décision :

1. **Liaison/contrôle/fil/reprise/direction/arrêt de Codex** -> surface de commandes native `/codex` lorsque le Plugin `codex` intégré est activé.
2. **Codex comme environnement d’exécution intégré** ou expérience d’agent Codex normale adossée à un abonnement -> `openai/<model>`.
3. **OpenClaw explicitement choisi pour un modèle OpenAI** -> conservez la référence de modèle sous la forme `openai/<model>` et définissez la politique d’environnement d’exécution du fournisseur/modèle sur `agentRuntime.id: "openclaw"`. Un profil OAuth `openai` sélectionné est acheminé en interne via le transport d’authentification Codex d’OpenClaw.
4. **Anciennes références de modèles Codex dans la configuration** -> réparez-les avec `openclaw doctor --fix` en `openai/<model>` ; doctor conserve la route d’authentification Codex en ajoutant `agentRuntime.id: "codex"` limité au fournisseur/modèle lorsque l’ancienne référence de modèle l’impliquait. Les anciennes références de modèles **`codex-cli/*`** sont réparées vers la même route de serveur d’application Codex `openai/<model>` ; OpenClaw ne conserve plus de backend CLI Codex intégré.
5. **ACP, acpx ou adaptateur ACP Codex explicitement demandé** -> `runtime: "acp"` et `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou un autre harness externe** -> ACP/acpx, et non l’environnement d’exécution natif des sous-agents.

| Vous voulez dire...                                    | Utilisez...                                             |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Contrôle de conversation/fil du serveur d’application Codex | `/codex ...` depuis le Plugin `codex` intégré           |
| Environnement d’exécution d’agent intégré du serveur d’application Codex | Références de modèles d’agent `openai/*`                |
| OAuth OpenAI Codex                                     | Profils OAuth `openai`                                  |
| Claude Code ou autre harness externe                   | ACP/acpx                                                |

Pour la séparation des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge de l’environnement d’exécution
Codex, consultez [Environnement d’exécution du harness Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Propriété de l’environnement d’exécution

Les différents environnements d’exécution possèdent différentes parties de la boucle :

| Surface                         | Intégration OpenClaw                                      | Serveur d’application Codex                                                       |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Propriétaire de la boucle de modèle | OpenClaw, via l’exécuteur intégré OpenClaw                | Serveur d’application Codex                                                       |
| État canonique du fil           | Transcription OpenClaw                                    | Fil Codex, avec miroir de transcription OpenClaw                                  |
| Outils dynamiques OpenClaw      | Boucle d’outils native OpenClaw                           | Reliés via l’adaptateur Codex                                                     |
| Outils natifs de shell et de fichiers | Chemin OpenClaw                                           | Outils natifs Codex, reliés via des hooks natifs lorsqu’ils sont pris en charge   |
| Moteur de contexte              | Assemblage de contexte natif OpenClaw                     | OpenClaw projette le contexte assemblé dans le tour Codex                          |
| Compaction                      | OpenClaw ou moteur de contexte sélectionné                | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir     |
| Livraison par canal             | OpenClaw                                                  | OpenClaw                                                                          |

Règle de conception : si OpenClaw possède la surface, il peut fournir le comportement normal des hooks de Plugin.
Si l’environnement d’exécution natif possède la surface, OpenClaw a besoin d’événements d’environnement d’exécution
ou de hooks natifs. Si l’environnement d’exécution natif possède l’état canonique du fil,
OpenClaw reflète et projette le contexte au lieu de réécrire des éléments internes
non pris en charge.

## Sélection de l’environnement d’exécution

OpenClaw résout un environnement d’exécution intégré après la résolution du fournisseur et du modèle, dans
cet ordre :

1. La **politique d’environnement d’exécution limitée au modèle** prévaut. Elle se trouve dans une entrée de modèle
   de fournisseur configurée, ou dans `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Un caractère générique de fournisseur
   tel que `agents.defaults.models["vllm/*"].agentRuntime` s’applique
   après la politique exacte du modèle, afin que les modèles de fournisseur découverts dynamiquement puissent
   partager un environnement d’exécution sans remplacer les exceptions exactes propres à chaque modèle.
2. **Politique d’environnement d’exécution limitée au fournisseur** : `models.providers.<provider>.agentRuntime`.
3. **Mode `auto`** : les environnements d’exécution de Plugin enregistrés peuvent revendiquer les paires fournisseur/modèle prises en charge.
4. Si rien ne revendique le tour en mode `auto`, OpenClaw utilise
   `openclaw` comme environnement d’exécution de compatibilité. Utilisez un identifiant d’environnement d’exécution explicite lorsque
   l’exécution doit être stricte.

Les épingles d’environnement d’exécution au niveau de la session entière et de l’agent entier sont ignorées : `OPENCLAW_AGENT_RUNTIME`,
l’état de session `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
et `agents.list[].agentRuntime`. Exécutez `openclaw doctor --fix` pour supprimer la configuration obsolète
de l’environnement d’exécution au niveau de l’agent entier et convertir les anciennes références de modèles d’environnement d’exécution lorsque l’intention
peut être préservée.

Les environnements d’exécution de Plugin explicitement définis pour un fournisseur/modèle échouent en mode fermé : `agentRuntime.id: "codex"`
sur un fournisseur ou un modèle signifie Codex, ou une erreur claire de sélection/d’environnement d’exécution ; il n’est
jamais réacheminé silencieusement vers OpenClaw. Seul `auto` peut acheminer un tour sans correspondance
vers OpenClaw.

Les alias des backends CLI diffèrent des identifiants de harness intégrés. Forme Claude CLI recommandée :

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

Les anciennes références telles que `claude-cli/claude-opus-4-7` restent prises en charge pour
la compatibilité, mais les nouvelles configurations doivent conserver la forme canonique fournisseur/modèle et
placer le backend d’exécution dans la politique d’environnement d’exécution du fournisseur/modèle.

Les anciennes références `codex-cli/*` sont différentes : doctor les migre vers `openai/*` afin
qu’elles s’exécutent via le harness du serveur d’application Codex au lieu de préserver un backend
CLI Codex.

Le mode `auto` est intentionnellement conservateur pour la plupart des fournisseurs. Les modèles d’agent OpenAI
font exception : un environnement d’exécution non défini et `auto` sont tous deux résolus vers le harness Codex.
La configuration explicite de l’environnement d’exécution OpenClaw reste une route de compatibilité facultative
pour les tours d’agent `openai/*` ; lorsqu’elle est associée à un profil OAuth `openai`
sélectionné, OpenClaw achemine ce chemin en interne via le transport d’authentification
Codex tout en conservant la référence de modèle publique sous la forme `openai/*`. Les épingles de session d’environnement d’exécution
OpenAI obsolètes sont ignorées par la sélection de l’environnement d’exécution et peuvent être nettoyées avec
`openclaw doctor --fix`.

Si `openclaw doctor` avertit que le Plugin `codex` est activé alors que d’anciennes
références de modèles Codex subsistent dans la configuration, considérez cela comme un état de route obsolète et exécutez
`openclaw doctor --fix` pour les réécrire en `openai/*` avec l’environnement d’exécution Codex.

## Environnement d’exécution d’agent GitHub Copilot

Le plugin externe `@openclaw/copilot` enregistre un runtime `copilot` activable
explicitement et reposant sur la CLI GitHub Copilot (`@github/copilot-sdk`). Il revendique le
fournisseur d’abonnement canonique `github-copilot` et n’est **jamais** sélectionné par
`auto`. Activez-le par modèle ou par fournisseur via `agentRuntime.id` :

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

Le harness revendique son fournisseur, son runtime, sa clé de session CLI et son préfixe
de profil d’authentification dans `extensions/copilot/doctor-contract-api.ts`, que `openclaw doctor`
charge automatiquement. Pour la configuration, l’authentification, la mise en miroir des transcriptions, la Compaction, le
contrat déclaratif de doctor et la décision plus générale entre les SDK PI, Codex et Copilot,
consultez [Runtime d’agent GitHub Copilot](/fr/plugins/copilot).

## Contrat de compatibilité

Lorsqu’un runtime n’est pas OpenClaw, sa documentation doit indiquer les surfaces OpenClaw
qu’il prend en charge :

| Question                                              | Pourquoi est-ce important ?                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Qui contrôle la boucle du modèle ?                    | Détermine où s’effectuent les nouvelles tentatives, la poursuite des outils et les décisions concernant la réponse finale.      |
| Qui contrôle l’historique canonique du fil ?          | Détermine si OpenClaw peut modifier l’historique ou seulement le mettre en miroir.                                               |
| Les outils dynamiques d’OpenClaw fonctionnent-ils ?   | La messagerie, les sessions, Cron et les outils contrôlés par OpenClaw en dépendent.                                             |
| Les hooks d’outils dynamiques fonctionnent-ils ?      | Les Plugins attendent `before_tool_call`, `after_tool_call` et un middleware autour des outils contrôlés par OpenClaw.          |
| Les hooks d’outils natifs fonctionnent-ils ?          | Le shell, les correctifs et les outils contrôlés par le runtime nécessitent la prise en charge de hooks natifs pour la stratégie et l’observation. |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les Plugins de mémoire et de contexte dépendent des étapes d’assemblage, d’ingestion, d’après-tour et de Compaction.            |
| Quelles données de Compaction sont exposées ?         | Certains Plugins ont seulement besoin de notifications ; d’autres ont besoin des métadonnées conservées/supprimées.             |
| Qu’est-ce qui n’est intentionnellement pas pris en charge ? | Les utilisateurs ne doivent pas supposer une équivalence avec OpenClaw lorsque le runtime natif contrôle davantage d’état. |

Le contrat de prise en charge du runtime Codex est documenté dans
[Runtime du harness Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Interprétez-les comme
des diagnostics, et non comme des noms de fournisseurs :

- Une référence de modèle telle que `openai/gpt-5.6-sol` correspond au fournisseur/modèle sélectionné.
- Un identifiant de runtime tel que `codex` correspond à la boucle qui exécute le tour.
- Un libellé de canal tel que Telegram ou Discord indique où se déroule la conversation.

Si une exécution affiche un runtime inattendu, examinez d’abord la stratégie de runtime
du fournisseur/modèle sélectionné. Les anciens verrouillages de runtime de session ne déterminent plus le routage.

## Ressources associées

- [Harness Codex](/fr/plugins/codex-harness)
- [Runtime du harness Codex](/fr/plugins/codex-harness-runtime)
- [Runtime d’agent GitHub Copilot](/fr/plugins/copilot)
- [OpenAI](/fr/providers/openai)
- [Plugins de harness d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
