---
read_when:
    - Vous voulez utiliser le harnais de serveur d’application Codex inclus
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous voulez que les déploiements réservés à Codex échouent au lieu de se rabattre sur PI
summary: Exécuter les tours d’agent intégré OpenClaw via le harnais app-server Codex inclus
title: Harnais Codex
x-i18n:
    generated_at: "2026-04-30T20:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin `codex` fourni permet à OpenClaw d’exécuter des tours d’agent intégrés via le
serveur d’application Codex au lieu du harnais PI intégré.

Utilisez-le lorsque vous voulez que Codex possède la session d’agent de bas niveau :
découverte des modèles, reprise native de thread, compaction native et exécution par
serveur d’application. OpenClaw possède toujours les canaux de chat, les fichiers de
session, la sélection du modèle, les outils, les approbations, la livraison des médias
et le miroir de transcript visible.

Si vous essayez de vous orienter, commencez par
[Environnements d’exécution d’agents](/fr/concepts/agent-runtimes). En bref :
`openai/gpt-5.5` est la référence de modèle, `codex` est l’environnement d’exécution,
et Telegram, Discord, Slack ou un autre canal reste la surface de communication.

## Ce que ce plugin change

Le plugin `codex` fourni apporte plusieurs capacités distinctes :

| Capacité                          | Comment l’utiliser                                  | Ce que cela fait                                                              |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Environnement d’exécution intégré natif | `agentRuntime.id: "codex"`                          | Exécute les tours d’agent intégrés d’OpenClaw via le serveur d’application Codex. |
| Commandes natives de contrôle du chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Lie et contrôle les threads du serveur d’application Codex depuis une conversation de messagerie. |
| Fournisseur/catalogue du serveur d’application Codex | internes `codex`, exposés via le harnais            | Permet à l’environnement d’exécution de découvrir et de valider les modèles du serveur d’application. |
| Chemin de compréhension des médias Codex | chemins de compatibilité de modèles d’image `codex/*` | Exécute des tours bornés du serveur d’application Codex pour les modèles de compréhension d’image pris en charge. |
| Relais de hooks natif             | Hooks de plugin autour des événements natifs Codex  | Permet à OpenClaw d’observer/bloquer les événements de finalisation et d’outils natifs Codex pris en charge. |

L’activation du plugin rend ces capacités disponibles. Elle ne fait **pas** ce qui suit :

- commencer à utiliser Codex pour chaque modèle OpenAI
- convertir les références de modèle `openai-codex/*` vers l’environnement d’exécution natif
- faire d’ACP/acpx le chemin Codex par défaut
- basculer à chaud les sessions existantes qui ont déjà enregistré un environnement d’exécution PI
- remplacer la livraison des canaux OpenClaw, les fichiers de session, le stockage des profils d’authentification ou
  le routage des messages

Le même plugin possède aussi la surface de commandes natives de contrôle du chat `/codex`. Si
le plugin est activé et que l’utilisateur demande à lier, reprendre, piloter, arrêter ou inspecter
des threads Codex depuis le chat, les agents doivent préférer `/codex ...` à ACP. ACP reste
le repli explicite lorsque l’utilisateur demande ACP/acpx ou teste l’adaptateur ACP
Codex.

Les tours Codex natifs conservent les hooks de plugin OpenClaw comme couche publique de compatibilité.
Ce sont des hooks OpenClaw en processus, pas des hooks de commande Codex `hooks.json` :

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` pour les enregistrements de transcript miroirs
- `before_agent_finalize` via le relais Codex `Stop`
- `agent_end`

Les plugins peuvent aussi enregistrer un middleware de résultats d’outils neutre vis-à-vis de l’environnement d’exécution pour réécrire
les résultats d’outils dynamiques OpenClaw après l’exécution de l’outil par OpenClaw et avant que le
résultat ne soit renvoyé à Codex. C’est distinct du hook de plugin public
`tool_result_persist`, qui transforme les écritures de résultats d’outils de transcript
possédées par OpenClaw.

Pour la sémantique des hooks de plugin eux-mêmes, consultez [Hooks de plugin](/fr/plugins/hooks)
et [Comportement de garde des plugins](/fr/tools/plugin).

Le harnais est désactivé par défaut. Les nouvelles configurations doivent conserver les références de modèle OpenAI
canoniques sous la forme `openai/gpt-*` et forcer explicitement
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` lorsqu’elles
veulent une exécution native par serveur d’application. Les références de modèle héritées `codex/*` sélectionnent encore automatiquement
le harnais pour la compatibilité, mais les préfixes de fournisseurs hérités adossés à un environnement d’exécution
ne sont pas affichés comme choix normaux de modèle/fournisseur.

Si le plugin `codex` est activé mais que le modèle principal est encore
`openai-codex/*`, `openclaw doctor` émet un avertissement au lieu de changer la route. C’est
intentionnel : `openai-codex/*` reste le chemin OAuth/abonnement PI de Codex, et
l’exécution native par serveur d’application reste un choix explicite d’environnement d’exécution.

## Carte des routes

Utilisez ce tableau avant de modifier la configuration :

| Comportement souhaité                         | Référence de modèle       | Configuration de l’environnement d’exécution | Exigence de plugin         | Libellé d’état attendu         |
| --------------------------------------------- | ------------------------- | -------------------------------------------- | -------------------------- | ------------------------------ |
| API OpenAI via l’exécuteur OpenClaw normal    | `openai/gpt-*`            | omis ou `runtime: "pi"`                      | fournisseur OpenAI         | `Runtime: OpenClaw Pi Default` |
| OAuth/abonnement Codex via PI                 | `openai-codex/gpt-*`      | omis ou `runtime: "pi"`                      | fournisseur OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Tours intégrés natifs du serveur d’application Codex | `openai/gpt-*`            | `agentRuntime.id: "codex"`                   | plugin `codex`             | `Runtime: OpenAI Codex`        |
| Fournisseurs mixtes avec mode automatique conservateur | références propres aux fournisseurs | `agentRuntime.id: "auto"`                    | environnements d’exécution de plugins facultatifs | Dépend de l’environnement d’exécution sélectionné |
| Session explicite de l’adaptateur ACP Codex   | dépend du prompt/modèle ACP | `sessions_spawn` avec `runtime: "acp"`       | backend `acpx` sain        | état de tâche/session ACP      |

La séparation importante est fournisseur contre environnement d’exécution :

- `openai-codex/*` répond à « quelle route de fournisseur/authentification PI doit-il utiliser ? »
- `agentRuntime.id: "codex"` répond à « quelle boucle doit exécuter ce
  tour intégré ? »
- `/codex ...` répond à « à quelle conversation Codex native ce chat doit-il se lier
  ou laquelle doit-il contrôler ? »
- ACP répond à « quel processus de harnais externe acpx doit-il lancer ? »

## Choisir le bon préfixe de modèle

Les routes de la famille OpenAI dépendent du préfixe. Utilisez `openai-codex/*` lorsque vous voulez
OAuth Codex via PI ; utilisez `openai/*` lorsque vous voulez un accès direct à l’API OpenAI ou
lorsque vous forcez le harnais natif du serveur d’application Codex :

| Référence de modèle                           | Chemin d’environnement d’exécution            | À utiliser lorsque                                                        |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | fournisseur OpenAI via la plomberie OpenClaw/PI | Vous voulez l’accès actuel direct à l’API OpenAI Platform avec `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex via OpenClaw/PI            | Vous voulez l’authentification d’abonnement ChatGPT/Codex avec l’exécuteur PI par défaut. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harnais du serveur d’application Codex        | Vous voulez l’exécution native par serveur d’application Codex pour le tour d’agent intégré. |

GPT-5.5 est actuellement limité à l’abonnement/OAuth dans OpenClaw. Utilisez
`openai-codex/gpt-5.5` pour OAuth PI, ou `openai/gpt-5.5` avec le harnais du
serveur d’application Codex. L’accès direct par clé d’API pour `openai/gpt-5.5` est pris en charge
dès qu’OpenAI active GPT-5.5 sur l’API publique.

Les références héritées `codex/gpt-*` restent acceptées comme alias de compatibilité. La migration de compatibilité de Doctor
réécrit les références d’environnement d’exécution principales héritées en références de modèle canoniques
et enregistre séparément la politique d’environnement d’exécution, tandis que les références héritées utilisées uniquement en repli
sont laissées inchangées parce que l’environnement d’exécution est configuré pour l’ensemble du conteneur d’agent.
Les nouvelles configurations OAuth PI Codex doivent utiliser `openai-codex/gpt-*` ; les nouvelles configurations de harnais
natif du serveur d’application doivent utiliser `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` suit la même séparation de préfixes. Utilisez
`openai-codex/gpt-*` lorsque la compréhension d’image doit passer par le chemin du fournisseur OAuth OpenAI
Codex. Utilisez `codex/gpt-*` lorsque la compréhension d’image doit s’exécuter
via un tour borné du serveur d’application Codex. Le modèle du serveur d’application Codex doit
annoncer la prise en charge de l’entrée image ; les modèles Codex texte seul échouent avant le démarrage
du tour média.

Utilisez `/status` pour confirmer le harnais effectif de la session actuelle. Si la
sélection est surprenante, activez la journalisation de débogage pour le sous-système `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` du gateway. Il
inclut l’identifiant du harnais sélectionné, la raison de sélection, la politique d’environnement d’exécution/repli et,
en mode `auto`, le résultat de prise en charge de chaque plugin candidat.

### Ce que signifient les avertissements de doctor

`openclaw doctor` avertit lorsque toutes ces conditions sont vraies :

- le plugin `codex` fourni est activé ou autorisé
- le modèle principal d’un agent est `openai-codex/*`
- l’environnement d’exécution effectif de cet agent n’est pas `codex`

Cet avertissement existe parce que les utilisateurs s’attendent souvent à ce que « plugin Codex activé » implique
« environnement d’exécution natif du serveur d’application Codex ». OpenClaw ne fait pas ce saut. L’avertissement
signifie :

- **Aucun changement n’est requis** si vous vouliez ChatGPT/Codex OAuth via PI.
- Changez le modèle en `openai/<model>` et définissez
  `agentRuntime.id: "codex"` si vous vouliez l’exécution native par serveur d’application.
- Les sessions existantes nécessitent toujours `/new` ou `/reset` après un changement d’environnement d’exécution,
  car les épingles d’environnement d’exécution de session sont persistantes.

La sélection du harnais n’est pas un contrôle de session en direct. Lorsqu’un tour intégré s’exécute,
OpenClaw enregistre l’identifiant du harnais sélectionné sur cette session et continue à l’utiliser pour
les tours ultérieurs avec le même identifiant de session. Modifiez la configuration `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` lorsque vous voulez que les futures sessions utilisent un autre harnais ;
utilisez `/new` ou `/reset` pour démarrer une nouvelle session avant de basculer une conversation existante
entre PI et Codex. Cela évite de rejouer un transcript dans deux systèmes de session natifs
incompatibles.

Les sessions héritées créées avant les épingles de harnais sont traitées comme épinglées à PI dès qu’elles
ont un historique de transcript. Utilisez `/new` ou `/reset` pour faire passer cette conversation à
Codex après avoir modifié la configuration.

`/status` affiche l’environnement d’exécution effectif du modèle. Le harnais PI par défaut apparaît comme
`Runtime: OpenClaw Pi Default`, et le harnais du serveur d’application Codex apparaît comme
`Runtime: OpenAI Codex`.

## Exigences

- OpenClaw avec le plugin `codex` fourni disponible.
- Serveur d’application Codex `0.125.0` ou plus récent. Le plugin fourni gère par défaut un binaire
  compatible du serveur d’application Codex, donc les commandes locales `codex` sur le `PATH`
  n’affectent pas le démarrage normal du harnais.
- Authentification Codex disponible pour le processus du serveur d’application ou pour le pont d’authentification Codex
  d’OpenClaw. Les lancements locaux du serveur d’application utilisent un répertoire personnel Codex géré par OpenClaw pour chaque
  agent et un `HOME` enfant isolé ; ils ne lisent donc pas votre compte personnel
  `~/.codex`, vos skills, plugins, configurations, états de thread ou
  `$HOME/.agents/skills` natifs par défaut.

Le plugin bloque les handshakes de serveur d’application plus anciens ou sans version. Cela maintient
OpenClaw sur la surface de protocole contre laquelle il a été testé.

Pour les tests smoke live et Docker, l’authentification provient généralement du compte CLI Codex
ou d’un profil d’authentification OpenClaw `openai-codex`. Les lancements locaux du serveur d’application stdio peuvent
aussi se rabattre sur `CODEX_API_KEY` / `OPENAI_API_KEY` lorsqu’aucun compte n’est présent.

## Configuration minimale

Utilisez `openai/gpt-5.5`, activez le plugin fourni et forcez le harnais `codex` :

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, incluez aussi `codex` :

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

Les configurations héritées qui définissent `agents.defaults.model` ou le modèle d’un agent sur
`codex/<model>` activent toujours automatiquement le plugin `codex` fourni. Les nouvelles configurations doivent
préférer `openai/<model>` plus l’entrée explicite `agentRuntime` ci-dessus.

## Ajouter Codex aux côtés d’autres modèles

Ne définissez pas `agentRuntime.id: "codex"` globalement si le même agent doit pouvoir basculer librement
entre Codex et les modèles de fournisseurs non-Codex. Un runtime forcé s'applique à chaque
tour intégré pour cet agent ou cette session. Si vous sélectionnez un modèle Anthropic alors que
ce runtime est forcé, OpenClaw essaie tout de même le harnais Codex et échoue en mode fermé
au lieu de router silencieusement ce tour via PI.

Utilisez plutôt l'une de ces formes :

- Placez Codex sur un agent dédié avec `agentRuntime.id: "codex"`.
- Gardez l'agent par défaut sur `agentRuntime.id: "auto"` et le fallback PI pour l'utilisation normale avec
  fournisseurs mixtes.
- Utilisez les anciennes références `codex/*` uniquement pour la compatibilité. Les nouvelles configs doivent préférer
  `openai/*` avec une politique de runtime Codex explicite.

Par exemple, ceci garde l'agent par défaut sur la sélection automatique normale et
ajoute un agent Codex séparé :

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
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Avec cette forme :

- L'agent `main` par défaut utilise le chemin fournisseur normal et le fallback de compatibilité PI.
- L'agent `codex` utilise le harnais app-server Codex.
- Si Codex est absent ou non pris en charge pour l'agent `codex`, le tour échoue
  au lieu d'utiliser discrètement PI.

## Routage des commandes d'agent

Les agents doivent router les demandes utilisateur selon l'intention, pas seulement selon le mot « Codex » :

| L'utilisateur demande...                                 | L'agent doit utiliser...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| « Associe cette discussion à Codex »                     | `/codex bind`                                    |
| « Reprends le thread Codex `<id>` ici »                  | `/codex resume <id>`                             |
| « Affiche les threads Codex »                            | `/codex threads`                                 |
| « Dépose un rapport de support pour une mauvaise exécution Codex » | `/diagnostics [note]`                            |
| « Envoie uniquement un retour Codex pour ce thread joint » | `/codex diagnostics [note]`                      |
| « Utilise Codex comme runtime pour cet agent »           | modification de config vers `agentRuntime.id`    |
| « Utilise mon abonnement ChatGPT/Codex avec OpenClaw normal » | références de modèle `openai-codex/*`            |
| « Exécute Codex via ACP/acpx »                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| « Démarre Claude Code/Gemini/OpenCode/Cursor dans un thread » | ACP/acpx, pas `/codex` ni des sous-agents natifs |

OpenClaw n'annonce les consignes de spawn ACP aux agents que lorsque ACP est activé,
dispatchable et adossé à un backend de runtime chargé. Si ACP n'est pas disponible,
le prompt système et les Skills de Plugin ne doivent pas enseigner à l'agent le
routage ACP.

## Déploiements Codex uniquement

Forcez le harnais Codex lorsque vous devez prouver que chaque tour d'agent intégré
utilise Codex. Les runtimes de Plugin explicites n'ont par défaut aucun fallback PI, donc
`fallback: "none"` est facultatif mais souvent utile comme documentation :

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Remplacement par l'environnement :

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Avec Codex forcé, OpenClaw échoue tôt si le Plugin Codex est désactivé, si
l'app-server est trop ancien ou si l'app-server ne peut pas démarrer. Définissez
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` uniquement si vous voulez intentionnellement que PI gère
la sélection de harnais manquante.

## Codex par agent

Vous pouvez rendre un agent exclusivement Codex pendant que l'agent par défaut conserve la
sélection automatique normale :

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Utilisez les commandes de session normales pour changer d'agents et de modèles. `/new` crée une nouvelle
session OpenClaw, et le harnais Codex crée ou reprend son thread app-server
auxiliaire selon les besoins. `/reset` efface l'association de session OpenClaw pour ce thread
et permet au tour suivant de résoudre à nouveau le harnais à partir de la config actuelle.

## Découverte de modèles

Par défaut, le Plugin Codex demande à l'app-server les modèles disponibles. Si
la découverte échoue ou expire, il utilise un catalogue de fallback intégré pour :

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Vous pouvez ajuster la découverte sous `plugins.entries.codex.config.discovery` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et s'en tienne au
catalogue de fallback :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Connexion et politique de l'app-server

Par défaut, le Plugin démarre localement le binaire Codex géré par OpenClaw avec :

```bash
codex app-server --listen stdio://
```

Le binaire géré est déclaré comme dépendance de runtime de Plugin intégrée et préparé
avec le reste des dépendances du Plugin `codex`. Cela garde la version de l'app-server
liée au Plugin intégré au lieu de dépendre de la CLI Codex séparée qui se trouve
installée localement. Définissez `appServer.command` uniquement lorsque vous
voulez intentionnellement exécuter un autre exécutable.

Par défaut, OpenClaw démarre les sessions locales du harnais Codex en mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. C'est la posture d'opérateur local de confiance utilisée
pour les Heartbeats autonomes : Codex peut utiliser les outils shell et réseau sans
s'arrêter sur des invites d'approbation natives auxquelles personne n'est là pour répondre.

Pour activer les approbations examinées par le gardien Codex, définissez `appServer.mode:
"guardian"` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Le mode gardien utilise le chemin d'approbation avec revue automatique native de Codex. Lorsque Codex demande à
sortir du bac à sable, à écrire hors de l'espace de travail ou à ajouter des permissions comme l'accès
réseau, Codex route cette demande d'approbation vers le réviseur natif au lieu d'une
invite humaine. Le réviseur applique le cadre de risque de Codex et approuve ou refuse
la demande spécifique. Utilisez le mode gardien lorsque vous voulez plus de garde-fous que le mode YOLO
tout en ayant besoin que des agents sans supervision continuent de progresser.

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"`.
Les champs de politique individuels remplacent toujours `mode`, afin que les déploiements avancés puissent combiner
le préréglage avec des choix explicites. L'ancienne valeur de réviseur `guardian_subagent` est
toujours acceptée comme alias de compatibilité, mais les nouvelles configs doivent utiliser
`auto_review`.

Pour un app-server déjà en cours d'exécution, utilisez le transport WebSocket :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Les lancements d'app-server stdio héritent par défaut de l'environnement de processus d'OpenClaw,
mais OpenClaw possède le pont de compte app-server Codex et définit à la fois
`CODEX_HOME` et `HOME` vers des répertoires par agent dans l'état OpenClaw de cet agent.
Le chargeur de Skills propre à Codex lit `$CODEX_HOME/skills` et
`$HOME/.agents/skills`, donc les deux valeurs sont isolées pour les lancements d'app-server
locaux. Cela garde les Skills, plugins, configs, comptes et états de thread natifs Codex
scopés à l'agent OpenClaw au lieu de fuiter depuis le répertoire personnel CLI Codex
de l'opérateur.

Les plugins OpenClaw et les instantanés de Skills OpenClaw passent toujours par le registre de
plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles de la CLI Codex ne le font pas. Si vous avez
des Skills ou plugins CLI Codex utiles qui doivent devenir partie intégrante d'un agent OpenClaw,
inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Le fournisseur de migration Codex copie les Skills dans l'espace de travail de l'agent OpenClaw
actuel. Les plugins, hooks et fichiers de config natifs Codex sont signalés ou archivés
pour revue manuelle au lieu d'être activés automatiquement, car ils peuvent
exécuter des commandes, exposer des serveurs MCP ou transporter des identifiants.

L'authentification est sélectionnée dans cet ordre :

1. Un profil d'authentification OpenClaw Codex explicite pour l'agent.
2. Le compte existant de l'app-server dans le répertoire Codex de cet agent.
3. Pour les lancements locaux d'app-server stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu'aucun compte app-server n'est présent et que l'authentification OpenAI est
   encore requise.

Lorsqu'OpenClaw voit un profil d'authentification Codex de type abonnement ChatGPT, il retire
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
garde les clés API au niveau du Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer accidentellement les tours natifs de l'app-server Codex via l'API.
Les profils explicites avec clé API Codex et le fallback local par clé d'environnement stdio utilisent la connexion app-server
au lieu de l'environnement hérité du processus enfant. Les connexions WebSocket à l'app-server
ne reçoivent pas le fallback de clé API d'environnement du Gateway ; utilisez un profil d'authentification explicite ou le
compte propre à l'app-server distant.

Si un déploiement nécessite une isolation d'environnement supplémentaire, ajoutez ces variables à
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

`appServer.clearEnv` affecte uniquement le processus enfant app-server Codex lancé.

Champs `appServer` pris en charge :

| Champ               | Valeur par défaut                       | Signification                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                             |
| `command`           | binaire Codex géré                       | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré ; définissez-le uniquement pour une substitution explicite.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Arguments pour le transport stdio.                                                                                                                                                                                                       |
| `url`               | non défini                               | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | non défini                               | Jeton Bearer pour le transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | En-têtes WebSocket supplémentaires.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. `CODEX_HOME` et `HOME` sont réservés à l’isolation Codex par agent d’OpenClaw lors des lancements locaux. |
| `requestTimeoutMs`  | `60000`                                  | Délai d’expiration des appels au plan de contrôle app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Préréglage pour une exécution YOLO ou validée par guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Politique d’approbation native Codex envoyée au démarrage, à la reprise ou au tour d’un fil.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox natif Codex envoyé au démarrage ou à la reprise d’un fil.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives. `guardian_subagent` reste un alias hérité.                                                                                                                         |
| `serviceTier`       | non défini                               | Niveau de service app-server Codex facultatif : `"fast"`, `"flex"` ou `null`. Les anciennes valeurs invalides sont ignorées.                                                                                                                            |

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs` : chaque requête Codex `item/tool/call` doit recevoir
une réponse OpenClaw dans les 30 secondes. En cas d’expiration, OpenClaw abandonne le signal
d’outil lorsque c’est pris en charge et renvoie à Codex une réponse d’outil dynamique en échec afin que
le tour puisse continuer au lieu de laisser la session en `processing`.

Après qu’OpenClaw a répondu à une requête app-server Codex limitée au tour, le harnais
s’attend aussi à ce que Codex termine le tour natif avec `turn/completed`. Si l’app-server
reste silencieux pendant 60 secondes après cette réponse, OpenClaw interrompt au mieux
le tour Codex, enregistre un délai d’expiration diagnostique et libère la voie de session
OpenClaw afin que les messages de discussion suivants ne soient pas mis en file derrière un tour
natif obsolète.

Les substitutions d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour des tests locaux ponctuels. La configuration est
préférable pour les déploiements répétables, car elle conserve le comportement du plugin dans le
même fichier relu que le reste de la configuration du harnais Codex.

## Utilisation de l’ordinateur

Computer Use est couvert dans son propre guide de configuration :
[Codex Computer Use](/fr/plugins/codex-computer-use).

Version courte : OpenClaw n’intègre pas l’app de contrôle du bureau et n’exécute pas
lui-même les actions de bureau. Il prépare l’app-server Codex, vérifie que le serveur MCP
`computer-use` est disponible, puis laisse Codex gérer les appels d’outils MCP natifs
pendant les tours en mode Codex.

Pour un accès direct au pilote TryCua en dehors du flux marketplace Codex, enregistrez
`cua-driver mcp` avec `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consultez [Codex Computer Use](/fr/plugins/codex-computer-use) pour la distinction
entre Computer Use appartenant à Codex et l’enregistrement MCP direct.

Configuration minimale :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

La configuration peut être vérifiée ou installée depuis la surface de commande :

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use est spécifique à macOS et peut nécessiter des autorisations locales de l’OS avant que le
serveur MCP Codex puisse contrôler les apps. Si `computerUse.enabled` vaut true et que le serveur MCP
n’est pas disponible, les tours en mode Codex échouent avant le démarrage du fil au lieu de
s’exécuter silencieusement sans les outils Computer Use natifs. Consultez
[Codex Computer Use](/fr/plugins/codex-computer-use) pour les choix de marketplace,
les limites du catalogue distant, les raisons d’état et le dépannage.

Lorsque `computerUse.autoInstall` vaut true, OpenClaw peut enregistrer le marketplace standard
Codex Desktop groupé depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
n’a pas encore découvert de marketplace local. Utilisez `/new` ou `/reset` après
avoir modifié la configuration du runtime ou de Computer Use afin que les sessions existantes ne conservent pas une ancienne
liaison de fil PI ou Codex.

## Recettes courantes

Codex local avec le transport stdio par défaut :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validation du harnais Codex uniquement :

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approbations Codex validées par guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server distant avec en-têtes explicites :

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Le changement de modèle reste contrôlé par OpenClaw. Lorsqu’une session OpenClaw est attachée
à un fil Codex existant, le tour suivant renvoie à nouveau à l’app-server
le modèle OpenAI, le provider, la politique d’approbation, le sandbox et le niveau de service
actuellement sélectionnés. Passer de `openai/gpt-5.5` à `openai/gpt-5.2` conserve la
liaison du fil, mais demande à Codex de continuer avec le modèle nouvellement sélectionné.

## Commande Codex

Le plugin groupé enregistre `/codex` comme commande slash autorisée. Elle est
générique et fonctionne sur tout canal prenant en charge les commandes texte OpenClaw.

Formes courantes :

- `/codex status` affiche la connectivité app-server en direct, les modèles, le compte, les limites de débit, les serveurs MCP et les skills.
- `/codex models` liste les modèles app-server Codex en direct.
- `/codex threads [filter]` liste les fils Codex récents.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un fil Codex existant.
- `/codex compact` demande à l’app-server Codex de compacter le fil attaché.
- `/codex review` lance la revue native Codex pour le fil attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer le retour de diagnostics Codex pour le fil attaché.
- `/codex computer-use status` vérifie le plugin Computer Use configuré et le serveur MCP.
- `/codex computer-use install` installe le plugin Computer Use configuré et recharge les serveurs MCP.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` liste l’état des serveurs MCP app-server Codex.
- `/codex skills` liste les skills app-server Codex.

### Flux de débogage courant

Lorsqu’un agent adossé à Codex fait quelque chose de surprenant dans Telegram, Discord, Slack,
ou un autre canal, commencez par la conversation où le problème s’est produit :

1. Exécutez `/diagnostics bad tool choice after image upload` ou une autre note courte
   décrivant ce que vous avez vu.
2. Approuvez la demande de diagnostics une fois. L’approbation crée le zip local de diagnostics
   Gateway et, comme la session utilise le harnais Codex, envoie aussi
   le bundle de retour Codex pertinent aux serveurs OpenAI.
3. Copiez la réponse de diagnostics terminée dans le rapport de bogue ou le fil d’assistance.
   Elle inclut le chemin du bundle local, le résumé de confidentialité, les ids de session OpenClaw,
   les ids de fil Codex et une ligne `Inspect locally` pour chaque fil Codex.
4. Si vous souhaitez déboguer vous-même l’exécution, lancez la commande `Inspect locally`
   affichée dans un terminal. Elle ressemble à `codex resume <thread-id>` et ouvre le
   fil Codex natif afin que vous puissiez inspecter la conversation, la continuer localement,
   ou demander à Codex pourquoi il a choisi un outil ou un plan particulier.

Utilisez `/codex diagnostics [note]` uniquement lorsque vous voulez spécifiquement l’envoi de feedback Codex pour le fil actuellement attaché, sans l’ensemble complet de diagnostics du Gateway OpenClaw. Pour la plupart des rapports de support, `/diagnostics [note]` est le meilleur point de départ, car il relie l’état local du Gateway et les identifiants de fil Codex dans une seule réponse. Consultez [Export de diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité complet et le comportement en discussion de groupe.

Le cœur d’OpenClaw expose également `/diagnostics [note]`, réservé aux propriétaires, comme commande générale de diagnostics du Gateway. Son invite d’approbation affiche le préambule sur les données sensibles, renvoie vers [Export de diagnostics](/fr/gateway/diagnostics) et demande `openclaw gateway diagnostics export --json` au moyen d’une approbation d’exécution explicite à chaque fois. N’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation, OpenClaw envoie un rapport copiable avec le chemin de l’ensemble local et un résumé du manifeste. Lorsque la session OpenClaw active utilise le harnais Codex, cette même approbation autorise également l’envoi des ensembles de feedback Codex pertinents aux serveurs OpenAI. L’invite d’approbation indique que le feedback Codex sera envoyé, mais elle ne liste pas les identifiants de session ou de fil Codex avant l’approbation.

Si `/diagnostics` est invoqué par un propriétaire dans une discussion de groupe, OpenClaw garde le canal partagé propre : le groupe ne reçoit qu’un court avis, tandis que le préambule des diagnostics, les invites d’approbation et les identifiants de session/fil Codex sont envoyés au propriétaire via la route d’approbation privée. S’il n’existe aucune route privée vers le propriétaire, OpenClaw refuse la demande du groupe et demande au propriétaire de l’exécuter depuis un message privé.

L’envoi Codex approuvé appelle `feedback/upload` du serveur d’application Codex et demande au serveur d’application d’inclure les journaux pour chaque fil listé et pour les sous-fils Codex engendrés lorsqu’ils sont disponibles. L’envoi passe par le chemin de feedback normal de Codex vers les serveurs OpenAI ; si le feedback Codex est désactivé dans ce serveur d’application, la commande renvoie l’erreur du serveur d’application. La réponse de diagnostics terminée liste les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales `codex resume <thread-id>` pour les fils qui ont été envoyés. Si vous refusez ou ignorez l’approbation, OpenClaw n’affiche pas ces identifiants Codex. Cet envoi ne remplace pas l’export local des diagnostics du Gateway.

`/codex resume` écrit le même fichier de liaison sidecar que celui utilisé par le harnais pour les tours normaux. Au message suivant, OpenClaw reprend ce fil Codex, transmet le modèle OpenClaw actuellement sélectionné au serveur d’application et garde l’historique étendu activé.

### Inspecter un fil Codex depuis la CLI

Le moyen le plus rapide de comprendre une mauvaise exécution Codex consiste souvent à ouvrir directement le fil Codex natif :

```sh
codex resume <thread-id>
```

Utilisez cela lorsque vous remarquez un bug dans une conversation de canal et que vous voulez inspecter la session Codex problématique, la poursuivre localement ou demander à Codex pourquoi il a fait un choix particulier d’outil ou de raisonnement. Le chemin le plus simple consiste généralement à exécuter d’abord `/diagnostics [note]` : après votre approbation, le rapport terminé liste chaque fil Codex et affiche une commande `Inspect locally`, par exemple `codex resume <thread-id>`. Vous pouvez copier cette commande directement dans un terminal.

Vous pouvez aussi obtenir un identifiant de fil avec `/codex binding` pour la discussion actuelle ou `/codex threads [filter]` pour les fils récents du serveur d’application Codex, puis exécuter la même commande `codex resume` dans votre shell.

Cette surface de commande nécessite le serveur d’application Codex `0.125.0` ou version ultérieure. Les méthodes de contrôle individuelles sont signalées comme `unsupported by this Codex app-server` si un serveur d’application futur ou personnalisé n’expose pas cette méthode JSON-RPC.

## Limites des hooks

Le harnais Codex comporte trois couches de hooks :

| Couche                                | Propriétaire             | Objectif                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin OpenClaw              | OpenClaw                 | Compatibilité produit/plugin entre les harnais PI et Codex.         |
| Middleware d’extension du serveur d’application Codex | Plugins groupés avec OpenClaw | Comportement d’adaptateur par tour autour des outils dynamiques OpenClaw. |
| Hooks natifs Codex                    | Codex                    | Cycle de vie Codex bas niveau et politique d’outils native depuis la configuration Codex. |

OpenClaw n’utilise pas les fichiers Codex `hooks.json` de projet ou globaux pour router le comportement des plugins OpenClaw. Pour le pont de permissions et d’outils natifs pris en charge, OpenClaw injecte une configuration Codex par fil pour `PreToolUse`, `PostToolUse`, `PermissionRequest` et `Stop`. Les autres hooks Codex, tels que `SessionStart` et `UserPromptSubmit`, restent des contrôles de niveau Codex ; ils ne sont pas exposés comme hooks de Plugin OpenClaw dans le contrat v1.

Pour les outils dynamiques OpenClaw, OpenClaw exécute l’outil après que Codex a demandé l’appel, de sorte qu’OpenClaw déclenche le comportement de plugin et de middleware qu’il possède dans l’adaptateur de harnais. Pour les outils natifs Codex, Codex possède l’enregistrement canonique de l’outil. OpenClaw peut refléter certains événements, mais il ne peut pas réécrire le fil Codex natif, sauf si Codex expose cette opération via le serveur d’application ou des rappels de hooks natifs.

Les projections de Compaction et du cycle de vie LLM proviennent des notifications du serveur d’application Codex et de l’état de l’adaptateur OpenClaw, et non de commandes de hooks Codex natives. Les événements `before_compaction`, `after_compaction`, `llm_input` et `llm_output` d’OpenClaw sont des observations au niveau de l’adaptateur, pas des captures octet pour octet de la requête interne ou des charges utiles de Compaction de Codex.

Les notifications `hook/started` et `hook/completed` natives Codex du serveur d’application sont projetées comme événements d’agent `codex_app_server.hook` pour la trajectoire et le débogage. Elles n’invoquent pas les hooks de Plugin OpenClaw.

## Contrat de prise en charge v1

Le mode Codex n’est pas PI avec un autre appel de modèle en dessous. Codex possède une plus grande partie de la boucle de modèle native, et OpenClaw adapte ses surfaces de plugin et de session autour de cette limite.

Pris en charge dans le runtime Codex v1 :

| Surface                                       | Prise en charge                         | Pourquoi                                                                                                                                                                                             |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boucle de modèle OpenAI via Codex             | Pris en charge                          | Le serveur d’application Codex possède le tour OpenAI, la reprise de fil native et la continuation d’outil native.                                                                                    |
| Routage et livraison des canaux OpenClaw      | Pris en charge                          | Telegram, Discord, Slack, WhatsApp, iMessage et les autres canaux restent en dehors du runtime de modèle.                                                                                             |
| Outils dynamiques OpenClaw                    | Pris en charge                          | Codex demande à OpenClaw d’exécuter ces outils, donc OpenClaw reste dans le chemin d’exécution.                                                                                                       |
| Plugins de prompt et de contexte              | Pris en charge                          | OpenClaw construit des superpositions de prompt et projette le contexte dans le tour Codex avant de démarrer ou de reprendre le fil.                                                                   |
| Cycle de vie du moteur de contexte            | Pris en charge                          | L’assemblage, l’ingestion ou la maintenance après tour, et la coordination de Compaction du moteur de contexte s’exécutent pour les tours Codex.                                                       |
| Hooks d’outils dynamiques                     | Pris en charge                          | `before_tool_call`, `after_tool_call` et le middleware de résultat d’outil s’exécutent autour des outils dynamiques possédés par OpenClaw.                                                            |
| Hooks de cycle de vie                         | Pris en charge comme observations d’adaptateur | `llm_input`, `llm_output`, `agent_end`, `before_compaction` et `after_compaction` se déclenchent avec des charges utiles honnêtes en mode Codex.                                                       |
| Porte de révision de réponse finale           | Pris en charge via le relais de hook natif | Le `Stop` de Codex est relayé vers `before_agent_finalize` ; `revise` demande à Codex un passage de modèle supplémentaire avant la finalisation.                                                       |
| Blocage ou observation du shell, des patchs et de MCP natifs | Pris en charge via le relais de hook natif | `PreToolUse` et `PostToolUse` de Codex sont relayés pour les surfaces d’outils natives validées, y compris les charges utiles MCP sur le serveur d’application Codex `0.125.0` ou version ultérieure. Le blocage est pris en charge ; la réécriture des arguments ne l’est pas. |
| Politique de permissions native               | Pris en charge via le relais de hook natif | `PermissionRequest` de Codex peut être routé via la politique OpenClaw lorsque le runtime l’expose. Si OpenClaw ne renvoie aucune décision, Codex poursuit via son chemin normal de gardien ou d’approbation utilisateur. |
| Capture de trajectoire du serveur d’application | Pris en charge                        | OpenClaw enregistre la requête envoyée au serveur d’application et les notifications reçues du serveur d’application.                                                                                 |

Non pris en charge dans le runtime Codex v1 :

| Surface                                             | Limite V1                                                                                                                                          | Chemin futur                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Mutation des arguments d’outil natifs               | Les hooks pré-outil natifs Codex peuvent bloquer, mais OpenClaw ne réécrit pas les arguments d’outils natifs Codex.                               | Nécessite la prise en charge des hooks/schémas Codex pour remplacer l’entrée d’outil.         |
| Historique de transcription natif Codex modifiable  | Codex possède l’historique canonique du fil natif. OpenClaw possède un miroir et peut projeter un contexte futur, mais ne doit pas muter des éléments internes non pris en charge. | Ajouter des API explicites de serveur d’application Codex si une intervention sur le fil natif est nécessaire. |
| `tool_result_persist` pour les enregistrements d’outils natifs Codex | Ce hook transforme les écritures de transcription possédées par OpenClaw, pas les enregistrements d’outils natifs Codex.                           | Pourrait mettre en miroir les enregistrements transformés, mais la réécriture canonique nécessite la prise en charge de Codex. |
| Métadonnées riches de Compaction native             | OpenClaw observe le début et la fin de la Compaction, mais ne reçoit pas de liste stable des éléments conservés/supprimés, de delta de jetons ni de charge utile de résumé. | Nécessite des événements de Compaction Codex plus riches.                                      |
| Intervention de Compaction                          | Les hooks de Compaction OpenClaw actuels sont de niveau notification en mode Codex.                                                                 | Ajouter des hooks Codex pré/post Compaction si les plugins doivent opposer un veto ou réécrire la Compaction native. |
| Capture octet pour octet des requêtes d’API modèle  | OpenClaw peut capturer les requêtes et notifications du serveur d’application, mais le cœur Codex construit la requête finale à l’API OpenAI en interne. | Nécessite un événement de traçage des requêtes modèle Codex ou une API de débogage.            |

## Outils, médias et Compaction

Le harnais Codex modifie uniquement l’exécuteur d’agent embarqué de bas niveau.

OpenClaw construit toujours la liste d’outils et reçoit les résultats d’outils dynamiques du
harnais. Le texte, les images, la vidéo, la musique, le TTS, les approbations et la sortie des outils de messagerie
continuent à passer par le chemin de livraison OpenClaw normal.

Le relais de hooks natifs est intentionnellement générique, mais le contrat de prise en charge v1 est
limité aux chemins d’outils et d’autorisations natifs Codex qu’OpenClaw teste. Dans
l’exécution Codex, cela inclut les charges utiles shell, patch et MCP `PreToolUse`,
`PostToolUse` et `PermissionRequest`. Ne supposez pas que chaque futur
événement de hook Codex est une surface de Plugin OpenClaw tant que le contrat d’exécution ne le
nomme pas.

Pour `PermissionRequest`, OpenClaw ne renvoie des décisions explicites d’autorisation ou de refus
que lorsque la politique décide. Un résultat sans décision n’est pas une autorisation. Codex le traite comme une absence de
décision de hook et poursuit vers son propre gardien ou chemin d’approbation utilisateur.

Les sollicitations d’approbation d’outil MCP de Codex sont routées via le flux
d’approbation de Plugin d’OpenClaw lorsque Codex marque `_meta.codex_approval_kind` comme
`"mcp_tool_call"`. Les invites Codex `request_user_input` sont renvoyées au
chat d’origine, et le prochain message de suivi en file d’attente répond à cette requête de serveur
native au lieu d’être orienté comme contexte supplémentaire. Les autres requêtes de sollicitation MCP
échouent toujours fermées.

Le pilotage de la file d’exécution active correspond à `turn/steer` du serveur d’application Codex. Avec le
mode par défaut `messages.queue.mode: "steer"`, OpenClaw regroupe les messages de chat en file d’attente
pendant la fenêtre de silence configurée et les envoie comme une seule requête `turn/steer` dans
l’ordre d’arrivée. Le mode hérité `queue` envoie des requêtes `turn/steer` séparées. Les tours de
revue Codex et de Compaction manuelle peuvent rejeter le pilotage dans le même tour, auquel cas
OpenClaw utilise la file de suivi lorsque le mode sélectionné autorise le repli. Voir
[File de pilotage](/fr/concepts/queue-steering).

Lorsque le modèle sélectionné utilise le harnais Codex, la Compaction du fil natif est
déléguée au serveur d’application Codex. OpenClaw conserve un miroir de transcription pour l’historique des canaux,
la recherche, `/new`, `/reset` et les futurs changements de modèle ou de harnais. Le
miroir inclut l’invite utilisateur, le texte final de l’assistant et les enregistrements légers de
raisonnement ou de plan Codex lorsque le serveur d’application les émet. Aujourd’hui, OpenClaw ne
consigne que les signaux de début et de fin de Compaction native. Il n’expose pas encore de
résumé de Compaction lisible par un humain ni de liste auditable des entrées que Codex
a conservées après la Compaction.

Comme Codex possède le fil natif canonique, `tool_result_persist` ne
réécrit actuellement pas les enregistrements de résultats d’outils natifs Codex. Il ne s’applique que lorsque
OpenClaw écrit un résultat d’outil dans une transcription de session possédée par OpenClaw.

La génération de médias ne nécessite pas PI. La compréhension d’images, de vidéos, de musique, de PDF, de TTS et de médias
continue à utiliser les paramètres fournisseur/modèle correspondants tels que
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` et
`messages.tts`.

## Dépannage

**Codex n’apparaît pas comme fournisseur `/model` normal :** c’est attendu pour
les nouvelles configurations. Sélectionnez un modèle `openai/gpt-*` avec
`agentRuntime.id: "codex"` (ou une référence héritée `codex/*`), activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise PI au lieu de Codex :** `agentRuntime.id: "auto"` peut toujours utiliser PI comme
backend de compatibilité lorsqu’aucun harnais Codex ne revendique l’exécution. Définissez
`agentRuntime.id: "codex"` pour forcer la sélection de Codex pendant les tests. Une
exécution Codex forcée échoue désormais au lieu de se rabattre sur PI, sauf si vous
définissez explicitement `agentRuntime.fallback: "pi"`. Une fois le serveur d’application Codex
sélectionné, ses échecs remontent directement sans configuration de repli supplémentaire.

**Le serveur d’application est rejeté :** mettez Codex à niveau afin que l’établissement de liaison du serveur d’application
signale la version `0.125.0` ou une version plus récente. Les préversions de même version ou les versions avec suffixe de build
comme `0.125.0-alpha.2` ou `0.125.0+custom` sont rejetées, car le
plancher de protocole stable `0.125.0` est celui qu’OpenClaw teste.

**La découverte des modèles est lente :** réduisez `plugins.entries.codex.config.discovery.timeoutMs`
ou désactivez la découverte.

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`, `authToken`,
et que le serveur d’application distant parle la même version du protocole de serveur d’application Codex.

**Un modèle non Codex utilise PI :** c’est attendu sauf si vous avez forcé
`agentRuntime.id: "codex"` pour cet agent ou sélectionné une référence héritée
`codex/*`. Les références simples `openai/gpt-*` et autres références de fournisseur restent sur leur chemin de
fournisseur normal en mode `auto`. Si vous forcez `agentRuntime.id: "codex"`, chaque tour embarqué
pour cet agent doit être un modèle OpenAI pris en charge par Codex.

**Computer Use est installé mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez `/new` ou `/reset` ; si cela persiste, redémarrez
le Gateway pour effacer les enregistrements de hooks natifs obsolètes. Si `computer-use.list_apps`
expire, redémarrez Codex Computer Use ou Codex Desktop, puis réessayez.

## Associés

- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Exécutions d’agent](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [État](/fr/cli/status)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Référence de configuration](/fr/gateway/configuration-reference)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
