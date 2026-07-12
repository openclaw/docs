---
read_when:
    - Vous choisissez entre OpenClaw, Codex, ACP ou un autre environnement d’exécution natif pour agents
    - Vous ne comprenez pas les libellés de fournisseur, de modèle ou d’environnement d’exécution dans l’état ou la configuration
    - Vous documentez la parité de prise en charge d’un environnement d’exécution natif
summary: Comment OpenClaw sépare les fournisseurs de modèles, les modèles, les canaux et les environnements d’exécution des agents
title: Environnements d’exécution des agents
x-i18n:
    generated_at: "2026-07-12T02:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **environnement d’exécution d’agent** possède une boucle de modèle préparée : il reçoit le prompt,
pilote la sortie du modèle, gère les appels d’outils natifs et renvoie le tour terminé
à OpenClaw.

Les environnements d’exécution sont faciles à confondre avec les fournisseurs, car tous deux apparaissent près de la
configuration du modèle. Il s’agit de couches différentes :

| Couche                        | Exemples                                     | Signification                                                                                 |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Fournisseur                   | `anthropic`, `github-copilot`, `openai`      | Manière dont OpenClaw s’authentifie, découvre les modèles et nomme les références de modèles. |
| Modèle                        | `claude-opus-4-6`, `gpt-5.6-sol`             | Modèle sélectionné pour le tour de l’agent.                                                   |
| Environnement d’exécution d’agent | `claude-cli`, `codex`, `copilot`, `openclaw` | Boucle de bas niveau ou backend qui exécute le tour préparé.                                  |
| Canal                         | Discord, Slack, Telegram, WhatsApp           | Emplacement où les messages entrent dans OpenClaw et en sortent.                              |

Un **harness** est l’implémentation qui fournit un environnement d’exécution d’agent (terme de
code). Par exemple, le harness Codex intégré implémente l’environnement d’exécution `codex`.
La configuration publique utilise `agentRuntime.id` dans les entrées de fournisseur ou de modèle ; les clés d’environnement
d’exécution portant sur l’agent entier sont obsolètes et ignorées. `openclaw doctor --fix` supprime les anciens
verrouillages d’environnement d’exécution portant sur l’agent entier et réécrit les références de modèles d’environnement d’exécution obsolètes en références
canoniques de fournisseur/modèle, ainsi qu’en stratégie d’environnement d’exécution limitée au modèle lorsque nécessaire.

Deux familles d’environnements d’exécution :

- Les **harnesses intégrés** s’exécutent dans la boucle d’agent préparée d’OpenClaw : l’environnement
  d’exécution `openclaw` intégré, ainsi que les harnesses de plugins enregistrés tels que
  `codex` et `copilot`.
- Les **backends CLI** exécutent un processus CLI local tout en conservant la référence de modèle
  canonique. Par exemple, `anthropic/claude-opus-4-8` avec
  `agentRuntime.id: "claude-cli"` limité au modèle signifie « sélectionner le modèle Anthropic et l’exécuter
  via Claude CLI ». `claude-cli` n’est pas un identifiant de harness intégré et ne doit pas
  être transmis à la sélection d’AgentHarness.

Le harness `copilot` est un harness de plugin externe distinct et optionnel pour la
CLI GitHub Copilot ; consultez [Environnement d’exécution d’agent GitHub Copilot](/fr/plugins/copilot) pour
le choix destiné à l’utilisateur entre PI, Codex et l’environnement d’exécution d’agent GitHub Copilot.

## Surfaces Codex

Plusieurs surfaces partagent le nom Codex :

| Surface                                              | Nom/configuration OpenClaw             | Fonction                                                                                                                            |
| ---------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Environnement d’exécution natif du serveur d’application Codex | Références de modèles `openai/*`       | Exécute les tours d’agent intégrés d’OpenAI via le serveur d’application Codex. Il s’agit de la configuration d’abonnement ChatGPT/Codex habituelle. |
| Profils d’authentification OAuth Codex               | Profils OAuth `openai`                 | Stocke l’authentification de l’abonnement ChatGPT/Codex consommée par le harness du serveur d’application Codex.                    |
| Adaptateur ACP Codex                                 | `runtime: "acp"`, `agentId: "codex"`   | Exécute Codex via le plan de contrôle externe ACP/acpx. À utiliser uniquement quand ACP/acpx est explicitement demandé.             |
| Ensemble natif de commandes de contrôle de discussion Codex | `/codex ...`                     | Lie, reprend, oriente, arrête et inspecte les fils du serveur d’application Codex depuis la discussion.                            |
| Route de l’API OpenAI Platform pour les surfaces sans agent | `openai/*` avec authentification par clé d’API | API OpenAI directes telles que les images, les plongements, la parole et le temps réel.                                    |

Ces surfaces sont volontairement indépendantes. L’activation du plugin `codex`
rend disponibles les fonctionnalités natives du serveur d’application ; `openclaw doctor --fix` prend en charge
la réparation des anciennes routes Codex et le nettoyage des verrouillages de session obsolètes. Sélectionner `openai/*`
pour un modèle d’agent signifie désormais « exécuter ceci via Codex », sauf si une surface d’API OpenAI
sans agent est utilisée.

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
serveur d’application Codex d’exécuter le tour d’agent intégré. Cela ne signifie pas « utiliser la
facturation de l’API » et ne signifie pas que le canal, le catalogue des fournisseurs de modèles ou le
stockage des sessions OpenClaw devient Codex.

Lorsque le plugin `codex` intégré est activé, utilisez la surface de commandes native `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) pour contrôler Codex en langage naturel plutôt qu’ACP. Utilisez ACP pour
Codex uniquement lorsque l’utilisateur demande explicitement ACP/acpx ou teste le chemin de
l’adaptateur ACP. Claude Code, Gemini CLI, OpenCode, Cursor et les harnesses externes similaires
continuent d’utiliser ACP.

Arbre de décision :

1. **Liaison/contrôle/fil/reprise/orientation/arrêt de Codex** -> surface de commandes native `/codex` lorsque le plugin `codex` intégré est activé.
2. **Codex comme environnement d’exécution intégré** ou expérience d’agent Codex normale adossée à un abonnement -> `openai/<model>`.
3. **OpenClaw explicitement choisi pour un modèle OpenAI** -> conservez la référence de modèle sous la forme `openai/<model>` et définissez la stratégie d’environnement d’exécution du fournisseur/modèle sur `agentRuntime.id: "openclaw"`. Un profil OAuth `openai` sélectionné est acheminé en interne via le transport d’authentification Codex d’OpenClaw.
4. **Anciennes références de modèles Codex dans la configuration** -> réparez-les avec `openclaw doctor --fix` en `openai/<model>` ; doctor conserve la route d’authentification Codex en ajoutant `agentRuntime.id: "codex"` limité au fournisseur/modèle lorsque l’ancienne référence de modèle l’impliquait. Les anciennes références de modèles **`codex-cli/*`** sont réparées vers la même route de serveur d’application Codex `openai/<model>` ; OpenClaw ne conserve plus de backend CLI Codex intégré.
5. **ACP, acpx ou adaptateur ACP Codex explicitement demandé** -> `runtime: "acp"` et `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou un autre harness externe** -> ACP/acpx, et non l’environnement d’exécution natif des sous-agents.

| Vous voulez dire...                                    | Utilisez...                                               |
| ------------------------------------------------------ | --------------------------------------------------------- |
| Contrôle des discussions/fils du serveur d’application Codex | `/codex ...` du plugin `codex` intégré               |
| Environnement d’exécution d’agent intégré au serveur d’application Codex | Références de modèles d’agent `openai/*`     |
| OAuth OpenAI Codex                                     | Profils OAuth `openai`                                    |
| Claude Code ou un autre harness externe                | ACP/acpx                                                  |

Pour la répartition des préfixes de la famille OpenAI, consultez [OpenAI](/fr/providers/openai) et
[Fournisseurs de modèles](/fr/concepts/model-providers). Pour le contrat de prise en charge de l’environnement d’exécution
Codex, consultez [Environnement d’exécution du harness Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Responsabilité des environnements d’exécution

Les différents environnements d’exécution prennent en charge des portions différentes de la boucle :

| Surface                        | Intégration OpenClaw                                   | Serveur d’application Codex                                                     |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Responsable de la boucle du modèle | OpenClaw, via l’exécuteur intégré OpenClaw         | Serveur d’application Codex                                                     |
| État canonique du fil          | Transcription OpenClaw                                 | Fil Codex, avec miroir de la transcription OpenClaw                             |
| Outils dynamiques OpenClaw     | Boucle d’outils native OpenClaw                        | Reliés via l’adaptateur Codex                                                    |
| Outils natifs de shell et de fichiers | Chemin OpenClaw                                  | Outils natifs Codex, reliés via des hooks natifs lorsqu’ils sont pris en charge |
| Moteur de contexte             | Assemblage de contexte natif OpenClaw                  | OpenClaw projette le contexte assemblé dans le tour Codex                        |
| Compaction                     | OpenClaw ou moteur de contexte sélectionné             | Compaction native Codex, avec notifications OpenClaw et maintenance du miroir   |
| Livraison au canal             | OpenClaw                                               | OpenClaw                                                                        |

Règle de conception : si OpenClaw est responsable de la surface, il peut fournir le comportement normal des hooks de
plugin. Si l’environnement d’exécution natif est responsable de la surface, OpenClaw a besoin d’événements d’environnement
d’exécution ou de hooks natifs. Si l’environnement d’exécution natif est responsable de l’état canonique du fil,
OpenClaw met en miroir et projette le contexte plutôt que de réécrire des éléments internes non pris en charge.

## Sélection de l’environnement d’exécution

OpenClaw résout un environnement d’exécution intégré après la résolution du fournisseur et du modèle, dans
l’ordre suivant :

1. La **stratégie d’environnement d’exécution limitée au modèle** est prioritaire. Elle se trouve dans une entrée de modèle
   de fournisseur configurée, ou dans `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Un caractère générique de fournisseur
   tel que `agents.defaults.models["vllm/*"].agentRuntime` s’applique
   après la stratégie exacte du modèle, afin que les modèles de fournisseur découverts dynamiquement puissent
   partager un environnement d’exécution sans remplacer les exceptions exactes propres à chaque modèle.
2. **Stratégie d’environnement d’exécution limitée au fournisseur** : `models.providers.<provider>.agentRuntime`.
3. **Mode `auto`** : les environnements d’exécution de plugins enregistrés peuvent revendiquer les paires fournisseur/modèle prises en charge.
4. Si rien ne revendique le tour en mode `auto`, OpenClaw se rabat sur
   `openclaw` comme environnement d’exécution de compatibilité. Utilisez un identifiant d’environnement d’exécution explicite lorsque
   l’exécution doit être stricte.

Les verrouillages d’environnement d’exécution portant sur la session entière et l’agent entier sont ignorés : `OPENCLAW_AGENT_RUNTIME`,
l’état de session `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
et `agents.list[].agentRuntime`. Exécutez `openclaw doctor --fix` pour supprimer la
configuration obsolète d’environnement d’exécution portant sur l’agent entier et convertir les anciennes références de modèles d’environnement d’exécution lorsque l’intention
peut être préservée.

Les environnements d’exécution de plugins explicitement définis pour un fournisseur/modèle échouent en mode fermé : `agentRuntime.id: "codex"`
sur un fournisseur ou un modèle signifie Codex, ou une erreur claire de sélection/d’environnement d’exécution ; il n’est
jamais réacheminé silencieusement vers OpenClaw. Seul `auto` peut acheminer vers OpenClaw un
tour sans correspondance.

Les alias de backend CLI diffèrent des identifiants de harnesses intégrés. Forme Claude CLI recommandée :

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
la compatibilité, mais les nouvelles configurations doivent conserver la forme canonique du fournisseur/modèle et
placer le backend d’exécution dans la stratégie d’environnement d’exécution du fournisseur/modèle.

Les anciennes références `codex-cli/*` sont différentes : doctor les migre vers `openai/*` afin
qu’elles s’exécutent via le harness du serveur d’application Codex au lieu de conserver un backend
CLI Codex.

Le mode `auto` est volontairement prudent pour la plupart des fournisseurs. Les modèles d’agent OpenAI
constituent l’exception : un environnement d’exécution non défini et `auto` se résolvent tous deux vers le harness
Codex. Une configuration explicite de l’environnement d’exécution OpenClaw reste une route de compatibilité
optionnelle pour les tours d’agent `openai/*` ; lorsqu’elle est associée à un profil OAuth
`openai` sélectionné, OpenClaw achemine ce chemin en interne via le transport d’authentification
Codex tout en conservant la référence de modèle publique sous la forme `openai/*`. Les verrouillages de session d’environnement
d’exécution OpenAI obsolètes sont ignorés par la sélection de l’environnement d’exécution et peuvent être nettoyés avec
`openclaw doctor --fix`.

Si `openclaw doctor` avertit que le plugin `codex` est activé alors que d’anciennes
références de modèles Codex subsistent dans la configuration, considérez cela comme un ancien état de route et exécutez
`openclaw doctor --fix` pour les réécrire en `openai/*` avec l’environnement d’exécution Codex.

## Environnement d’exécution d’agent GitHub Copilot

Le plugin externe `@openclaw/copilot` enregistre un environnement d’exécution `copilot` à activation explicite,
reposant sur la CLI GitHub Copilot (`@github/copilot-sdk`). Il revendique le
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

Le harnais revendique son fournisseur, son environnement d’exécution, sa clé de session CLI et le
préfixe de son profil d’authentification dans `extensions/copilot/doctor-contract-api.ts`, qu’`openclaw doctor`
charge automatiquement. Pour la configuration, l’authentification, la mise en miroir des transcriptions, la Compaction, le
contrat déclaratif de doctor et le choix plus général entre les SDK PI, Codex et Copilot,
consultez [Environnement d’exécution d’agent GitHub Copilot](/fr/plugins/copilot).

## Contrat de compatibilité

Lorsqu’un environnement d’exécution n’est pas OpenClaw, sa documentation doit indiquer les fonctionnalités d’OpenClaw
qu’il prend en charge :

| Question                               | Pourquoi est-ce important ?                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Qui contrôle la boucle du modèle ?               | Détermine où s’effectuent les nouvelles tentatives, la poursuite de l’utilisation des outils et les décisions relatives à la réponse finale.                   |
| Qui contrôle l’historique canonique du fil ?     | Détermine si OpenClaw peut modifier l’historique ou seulement le mettre en miroir.                                   |
| Les outils dynamiques d’OpenClaw fonctionnent-ils ?        | La messagerie, les sessions, Cron et les outils gérés par OpenClaw en dépendent.                                 |
| Les hooks d’outils dynamiques fonctionnent-ils ?            | Les Plugins s’attendent à disposer de `before_tool_call`, `after_tool_call` et d’un intergiciel autour des outils gérés par OpenClaw. |
| Les hooks d’outils natifs fonctionnent-ils ?             | Le shell, les correctifs et les outils gérés par l’environnement d’exécution nécessitent la prise en charge de hooks natifs pour l’application des politiques et l’observation.        |
| Le cycle de vie du moteur de contexte s’exécute-t-il ? | Les Plugins de mémoire et de contexte dépendent des phases d’assemblage, d’ingestion, d’après-tour et de Compaction.      |
| Quelles données de Compaction sont exposées ?       | Certains Plugins ont uniquement besoin de notifications ; d’autres ont besoin des métadonnées des éléments conservés ou supprimés.                          |
| Qu’est-ce qui n’est intentionnellement pas pris en charge ?     | Les utilisateurs ne doivent pas supposer une équivalence avec OpenClaw lorsque l’environnement d’exécution natif gère davantage d’état.            |

Le contrat de prise en charge de l’environnement d’exécution Codex est documenté dans
[Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

## Libellés d’état

La sortie d’état peut afficher à la fois les libellés `Execution` et `Runtime`. Interprétez-les comme
des informations de diagnostic, et non comme des noms de fournisseurs :

- Une référence de modèle telle que `openai/gpt-5.6-sol` correspond au fournisseur et au modèle sélectionnés.
- Un identifiant d’environnement d’exécution tel que `codex` désigne la boucle qui exécute le tour.
- Un libellé de canal tel que Telegram ou Discord indique où se déroule la conversation.

Si une exécution affiche un environnement d’exécution inattendu, examinez d’abord la politique d’environnement d’exécution
du fournisseur et du modèle sélectionnés. Les anciens verrouillages d’environnement d’exécution de session ne déterminent plus le routage.

## Voir aussi

- [Harnais Codex](/fr/plugins/codex-harness)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Environnement d’exécution d’agent GitHub Copilot](/fr/plugins/copilot)
- [OpenAI](/fr/providers/openai)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Modèles](/fr/concepts/models)
- [État](/fr/cli/status)
