---
read_when:
    - Vous souhaitez utiliser l’infrastructure du SDK GitHub Copilot pour un agent
    - Vous avez besoin d’exemples de configuration pour le runtime `copilot`
    - Vous connectez un agent à un abonnement Copilot (github / openclaw / copilot) et souhaitez l’exécuter via la CLI Copilot
summary: Exécutez les tours de l’agent intégré OpenClaw via le harnais externe du SDK GitHub Copilot
title: Harnais du SDK Copilot
x-i18n:
    generated_at: "2026-07-16T13:34:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

Le plugin externe `@openclaw/copilot` exécute les tours d’agent Copilot d’abonnement intégrés
via la CLI GitHub Copilot (`@github/copilot-sdk`) plutôt que via
le harnais intégré d’OpenClaw. La session de la CLI Copilot possède la boucle
d’agent de bas niveau : exécution native des outils, Compaction native (`infiniteSessions`) et
état du fil géré par la CLI sous `copilotHome`. OpenClaw conserve la gestion des canaux
de discussion, des fichiers de session, de la sélection du modèle, des outils dynamiques (reliés), des approbations,
de la livraison des médias, du miroir visible de la transcription, des questions secondaires `/btw` (voir
[Questions secondaires (`/btw`)](#side-questions-btw)) et de `openclaw doctor`.

Pour une vue d’ensemble de la séparation entre modèle, fournisseur et environnement d’exécution, commencez par
[Environnements d’exécution des agents](/fr/concepts/agent-runtimes).

## Prérequis

- OpenClaw avec le plugin `@openclaw/copilot` installé.
- Si votre configuration utilise `plugins.allow`, incluez `copilot` (l’identifiant de manifeste déclaré par le
  plugin). Une entrée de liste d’autorisation correspondant au nom du paquet npm
  `@openclaw/copilot` ne correspondra pas et laissera le plugin bloqué, même si
  `agentRuntime.id: "copilot"` est défini.
- Un abonnement GitHub Copilot capable de piloter la CLI Copilot, ou une
  variable d’environnement `gitHubToken` / entrée de profil d’authentification pour les exécutions sans interface ou Cron.
- Un répertoire `copilotHome` accessible en écriture. La valeur par défaut est `<agentDir>/copilot` lorsque
  OpenClaw fournit un répertoire d’agent, sinon
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` exécute le [contrat de diagnostic](#doctor) du plugin pour
la propriété de l’état de session et les futures migrations de configuration. Il ne sonde pas
l’environnement de la CLI Copilot.

## Installation

L’environnement d’exécution Copilot est fourni sous forme de plugin externe afin que le paquet principal `openclaw`
n’inclue pas `@github/copilot-sdk` ni son binaire de CLI
`@github/copilot-<platform>-<arch>` propre à chaque plateforme (environ 260 MB au total).
Installez-le uniquement pour les agents qui choisissent cet environnement d’exécution :

```bash
openclaw plugins install @openclaw/copilot
```

L’assistant de configuration installe automatiquement le plugin la première fois que vous sélectionnez
un modèle `github-copilot/*` **et** que votre configuration achemine ce modèle (ou son
fournisseur) vers l’environnement d’exécution Copilot via `agentRuntime: { id: "copilot" }` ; consultez
[Prise en main rapide](#quickstart). Sans cette activation explicite, OpenClaw utilise son fournisseur
GitHub Copilot intégré et n’installe jamais ce plugin.

L’environnement d’exécution résout le SDK dans cet ordre :

1. `import("@github/copilot-sdk")` à partir du paquet `@openclaw/copilot`
   installé.
2. Le répertoire de repli `~/.openclaw/npm-runtime/copilot/` (ancienne cible
   d’installation à la demande).

Un SDK manquant produit une erreur unique avec le code `COPILOT_SDK_MISSING` et la
commande de réinstallation ci-dessus.

## Prise en main rapide

Associez un modèle (ou un fournisseur) au harnais :

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Définissez `agentRuntime.id` sur une seule entrée de modèle pour n’acheminer que ce modèle via
le harnais, ou sur un fournisseur pour acheminer tous les modèles de ce fournisseur.

`github-copilot/auto` est le point de départ portable. Les modèles Copilot nommés dépendent
du compte et de la politique de l’organisation ; vérifiez que votre
CLI Copilot authentifiée expose effectivement un modèle avant de l’associer.

## Fournisseurs pris en charge

Le harnais prend en charge le fournisseur canonique `github-copilot` (détenu par
`extensions/github-copilot`), ainsi que les entrées `models.providers` personnalisées lorsque le
modèle possède un `baseUrl` non vide et l’une des formes `api` suivantes :

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (complétions compatibles avec OpenAI)
- `openai-completions`
- `openai-responses`

Les identifiants de fournisseurs natifs (`openai`, `anthropic`, `google`, `ollama`) restent sous la responsabilité de
leurs environnements d’exécution natifs. Utilisez un identifiant de fournisseur personnalisé distinct pour acheminer plutôt un point de terminaison
via le BYOK Copilot.

Les points de terminaison BYOK Copilot doivent être des URL HTTPS publiques. Le harnais fournit au
SDK Copilot un proxy de bouclage par tentative, puis transfère le trafic du fournisseur
via le chemin de récupération protégé d’OpenClaw afin que l’épinglage DNS et la politique SSRF restent
sous la responsabilité d’OpenClaw. Utilisez l’environnement d’exécution OpenClaw natif pour les serveurs de modèles
Ollama locaux, LM Studio ou du réseau local.

## BYOK

Le BYOK Copilot utilise le contrat de fournisseur personnalisé au niveau de la session du SDK. OpenClaw
transmet le point de terminaison résolu du modèle, la clé d’API, le mode de jeton porteur, les en-têtes, l’identifiant du modèle
ainsi que les limites de contexte et de sortie ; la logique de transport du fournisseur reste dans le SDK, et non
dans le cœur.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Les sessions BYOK sont identifiées séparément des sessions d’abonnement et des autres
points de terminaison ou identifiants BYOK. La rotation de la clé, des en-têtes, du modèle ou du point de terminaison
démarre une nouvelle session du SDK Copilot au lieu de reprendre un état incompatible.

## Authentification

Ordre de priorité, appliqué pour chaque agent pendant `runCopilotAttempt` :

1. **`useLoggedInUser: true` explicite** dans l’entrée de la tentative — utilise
   l’utilisateur connecté à la CLI Copilot sous le `copilotHome` de l’agent.
2. **`gitHubToken` explicite** dans l’entrée de la tentative (nécessite `profileId` +
   `profileVersion`). Pour les appels directs de la CLI et les tests qui doivent
   contourner la résolution du profil d’authentification.
3. **`resolvedApiKey` + `authProfileId` résolus par le contrat** — le chemin principal
   en production. Le cœur résout le profil d’authentification `github-copilot`
   configuré pour l’agent (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) avant
   d’appeler le harnais, de sorte qu’un profil d’authentification `github-copilot:<profile>` fonctionne
   de bout en bout pour les configurations sans interface, Cron ou à plusieurs profils, sans variable d’environnement.
4. **Repli sur les variables d’environnement**, vérifiées dans cet ordre (la première valeur non vide l’emporte,
   les chaînes vides sont considérées comme absentes ; reflète la priorité du fournisseur `github-copilot`
   livré dans `extensions/github-copilot/auth.ts`) :
   1. `OPENCLAW_GITHUB_TOKEN` — remplacement propre au harnais ; vous permet d’associer un
      jeton au harnais OpenClaw sans perturber la configuration système de `gh` /
      la CLI Copilot.
   2. `COPILOT_GITHUB_TOKEN` — variable d’environnement standard du SDK / de la CLI Copilot.
   3. `GH_TOKEN` — variable d’environnement standard de la CLI `gh`.
   4. `GITHUB_TOKEN` — repli générique sur un jeton GitHub.

   L’identifiant du profil de pool synthétisé est `env:<NAME>` ; la version du profil est une
   empreinte sha256 non réversible du jeton, de sorte que la rotation de la valeur d’environnement
   invalide proprement le pool de clients.

5. **`useLoggedInUser` par défaut** lorsqu’aucun signal de jeton n’est disponible.

Chaque agent dispose de son propre `copilotHome`, afin que les jetons, les sessions et la
configuration de la CLI Copilot ne fuient jamais entre les agents d’une même machine. Valeur par défaut :
`<agentDir>/copilot` (maintient l’état du SDK hors du même répertoire que
`models.json` / `auth-profiles.json` d’OpenClaw), ou
`~/.openclaw/agents/<agentId>/copilot` lorsqu’aucun répertoire d’agent n’est fourni.
Remplacez cette valeur avec `copilotHome: <path>` dans l’entrée de la tentative pour utiliser un
emplacement personnalisé (par exemple, un montage partagé pour la migration).

Les tests en conditions réelles du harnais utilisent `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` pour fournir directement un
jeton. La configuration partagée des tests en conditions réelles supprime `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
et `GITHUB_TOKEN` après avoir placé les véritables profils d’authentification dans le répertoire personnel de test
isolé, de sorte qu’une valeur `gh auth token` transmise via la variable dédiée évite
les omissions erronées sans fuir dans les suites sans rapport.

## Surface de configuration

Le harnais lit la configuration à partir de l’entrée propre à chaque tentative (`runCopilotAttempt({...})`)
ainsi que d’un petit ensemble de valeurs d’environnement par défaut dans `extensions/copilot/src/` :

| Champ                    | Objectif                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Répertoire d’état de la CLI propre à chaque agent (valeurs par défaut ci-dessus).                                                                                                                                                                                                                                                 |
| `model`                  | Chaîne ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omettez ce champ pour utiliser la sélection de modèle normale de l’agent ; le harnais vérifie que le fournisseur résolu est pris en charge.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Correspond à la résolution de `ThinkLevel` / `ReasoningLevel` d’OpenClaw dans `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Remplacement facultatif du bloc `infiniteSessions` du SDK piloté par `harness.compact`. Peut être conservé tel quel en toute sécurité.                                                                                                                                                                                        |
| `hooksConfig`            | Configuration native facultative `SessionHooks` du SDK Copilot pour les rappels d’outil/MCP, d’invite utilisateur, de session et d’erreur. Distincte des hooks de cycle de vie portables d’OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Remplacement facultatif du gestionnaire `onPermissionRequest` du SDK pour les types d’outils intégrés au SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). La valeur par défaut est `rejectAllPolicy` comme filet de sécurité ; consultez [Autorisations et ask_user](#permissions-and-ask_user) pour comprendre pourquoi il n’est en réalité jamais déclenché. |
| `enableSessionTelemetry` | Indicateur facultatif de télémétrie de session du SDK.                                                                                                                                                                                                                                                            |

Les hooks de plugin OpenClaw ne nécessitent aucune configuration de tentative propre à Copilot. Le
harnais exécute `before_prompt_build` (ainsi que l’ancien hook de compatibilité `before_agent_start`),
`llm_input`, `llm_output` et `agent_end` via les
assistants standard du harnais. Les Compactions réussies du SDK exécutent également
`before_compaction` et `after_compaction`. Les outils OpenClaw reliés exécutent
`before_tool_call` et signalent `after_tool_call` ; `hooksConfig` reste destiné aux
rappels natifs propres au SDK sans équivalent portable.

Aucune autre partie d’OpenClaw n’a besoin de connaître ces champs. Les autres plugins,
canaux et le code du cœur ne voient que la forme standard `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Lorsque `harness.compact` s’exécute, le harnais du SDK Copilot :

1. Reprend la session du SDK suivie sans poursuivre le travail en attente.
2. Appelle la RPC de Compaction de l’historique propre à la session du SDK.
3. Renvoie le résultat de la Compaction du SDK sans écrire de fichiers marqueurs de compatibilité
   dans l’espace de travail.

Le miroir de transcription côté OpenClaw (ci-dessous) continue de recevoir les
messages postérieurs à la Compaction, afin que l’historique de discussion visible par l’utilisateur reste cohérent.

## Mise en miroir de la transcription

`runCopilotAttempt` écrit en double, à chaque tour, les messages pouvant être répliqués dans la
transcription d’audit OpenClaw via
`extensions/copilot/src/dual-write-transcripts.ts`. La réplication est limitée à chaque
session (`copilot:${sessionId}`) et indexée par message
(`${role}:${sha256_16(role,content)}`) ; ainsi, les entrées des tours précédents réémises
entrent en collision avec les clés existantes sur le disque au lieu d’être dupliquées.

Deux couches de confinement des défaillances encadrent la réplication afin qu’un échec
d’écriture de la transcription ne fasse jamais échouer la tentative : un wrapper interne en mode meilleur effort, ainsi qu’une
protection en profondeur `.catch(...)` au niveau de la tentative. Les échecs sont journalisés, mais pas
exposés.

## Questions secondaires (`/btw`)

`/btw` n’est **pas** natif dans ce harnais. `createCopilotAgentHarness()`
laisse délibérément `harness.runSideQuestion` non défini
(comme vérifié dans `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`) ;
le répartiteur `/btw` d’OpenClaw (`src/agents/btw.ts`) poursuit donc avec le
même chemin que pour chaque environnement d’exécution autre que Codex : le fournisseur de modèle
configuré est appelé directement avec une courte invite de question secondaire, puis sa réponse est diffusée via
`streamSimple` (aucune session CLI, aucun emplacement supplémentaire dans le pool).

Cela réserve les sessions Copilot CLI à la boucle principale des tours de l’agent et
maintient le comportement de `/btw` identique à celui des autres environnements d’exécution autres que Codex.

## Diagnostic

`extensions/copilot/doctor-contract-api.ts` est chargé automatiquement par
`src/plugins/doctor-contract-registry.ts`. Il fournit :

- Un `legacyConfigRules` vide (aucun champ retiré pour le moment).
- Un `normalizeCompatibilityConfig` sans effet (conservé afin que les futurs retraits de champs
  disposent d’un emplacement stable dans l’arborescence).
- Une entrée `sessionRouteStateOwners` : fournisseur `github-copilot`, environnement d’exécution
  `copilot`, clé de session CLI `copilot`, préfixe de profil d’authentification `github-copilot:`.

## Limites

- Le harnais revendique `github-copilot` ainsi que les identifiants de fournisseurs BYOK personnalisés sans propriétaire.
  Les identifiants de fournisseurs natifs détenus par un manifeste restent associés à leur environnement d’exécution propriétaire, même lorsque
  `agentRuntime.id` est forcé à `copilot`.
- Aucune interface TUI ; la TUI de PI reste la solution de repli pour les environnements d’exécution sans interface
  équivalente.
- L’état de session PI n’est pas migré lorsqu’un agent passe à `copilot`.
  La sélection s’effectue pour chaque tentative ; les sessions PI existantes restent valides.
- `ask_user` utilise le même chemin d’invite et de réponse OpenClaw que le harnais Codex :
  lorsque le SDK Copilot demande une saisie utilisateur, OpenClaw publie une
  invite bloquante dans le canal actif ou la TUI, et le prochain message utilisateur
  mis en file d’attente satisfait la requête du SDK.

## Autorisations et ask_user

L’application des autorisations pour les outils OpenClaw raccordés s’effectue **dans le wrapper de l’outil**,
et non via le rappel `onPermissionRequest` du SDK. Le même
`wrapToolWithBeforeToolCallHook` que celui utilisé par PI
(`src/agents/agent-tools.before-tool-call.ts`) est appliqué par
`createOpenClawCodingTools` à chaque outil de codage : la détection des boucles, les politiques des
plugins de confiance, les hooks précédant les appels d’outils et les approbations de plugins en deux phases via
le Gateway (`plugin.approval.request`) empruntent tous exactement le même chemin de code
que les tentatives PI natives.

Chaque outil du SDK renvoyé par le pont d’outils Copilot porte les marqueurs suivants :

- `overridesBuiltInTool: true` — remplace l’outil intégré de même nom de Copilot CLI
  (modification, lecture, écriture, bash, etc.) afin que chaque appel d’outil soit redirigé
  vers OpenClaw.
- `skipPermission: true` — indique au SDK de ne pas déclencher
  `onPermissionRequest({kind: "custom-tool"})` avant d’appeler l’outil. Le
  `execute()` encapsulé effectue déjà le contrôle plus complet de la politique OpenClaw ; une
  invite au niveau du SDK contournerait l’application des règles d’OpenClaw
  (tout autoriser) ou bloquerait chaque appel d’outil (tout refuser) — aucune de ces options
  ne correspond à la parité avec PI.

Le harnais Codex intégré à l’arborescence utilise la même séparation : les outils OpenClaw raccordés sont
encapsulés (`extensions/codex/src/app-server/dynamic-tools.ts`) et les
types d’approbation natifs propres à codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) sont acheminés via `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L’équivalent du SDK Copilot
— `rejectAllPolicy` fermé par défaut pour tout type autre que `custom-tool`
qui atteindrait un jour `onPermissionRequest` — constitue le même filet de sécurité et ne
se déclenche jamais en pratique, car `overridesBuiltInTool: true` remplace chaque
outil intégré.

Pour que la couche d’outils encapsulés prenne des décisions de politique équivalentes à celles de PI, le
harnais transmet à `createOpenClawCodingTools` l’intégralité du contexte des outils de tentative PI :
l’identité (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, etc.), le canal et le routage (`groupId`,
`currentChannelId`, `replyToMode`, options des outils de messagerie), l’authentification
(`authProfileStore`), l’identité de l’exécution (`sessionKey` / `runSessionKey` dérivée
de `sandboxSessionKey`, `runId`), le contexte du modèle (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) et les hooks d’exécution
(`onToolOutcome`, `onYield`). Sans ces champs, les listes d’autorisation réservées au propriétaire
refusent silencieusement par défaut, les politiques de confiance des plugins ne peuvent pas être associées à la bonne
portée et `session_status: "current"` est résolu en une clé de bac à sable obsolète. Le
constructeur du pont est `extensions/copilot/src/tool-bridge.ts`, reproduisant l’appel PI
de référence dans `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` résout le contexte du bac à sable par l’intermédiaire du point d’intégration partagé
`resolveSandboxContext`, transmet au SDK un répertoire de travail effectif
et transmet `sandbox` ainsi que l’espace de travail de création des sous-agents au pont
d’outils. Le pont transmet également les contrôles bornés de construction des outils qu’il
peut appliquer à la frontière du SDK : `includeCoreTools`, la liste d’autorisation des outils de
l’environnement d’exécution et `toolConstructionPlan`.

Le pont utilise également l’utilitaire partagé de surface d’outils du harnais provenant de
`openclaw/plugin-sdk/agent-harness-tool-runtime` pour assurer la parité avec PI. Lorsque
la recherche d’outils est activée, le SDK voit des outils de contrôle compacts ainsi qu’un exécuteur de
catalogue masqué, au lieu de tous les schémas d’outils OpenClaw. Lorsque le mode code est
activé, l’utilitaire construit la même surface de contrôle du mode code et le même cycle de vie du catalogue
que ceux utilisés par les autres harnais d’agents. Les valeurs par défaut allégées pour les modèles locaux,
le filtrage des schémas compatibles avec l’environnement d’exécution, l’hydratation des répertoires et le
nettoyage du catalogue restent tous dans l’utilitaire partagé afin que les harnais Copilot et
apparentés à Codex ne divergent pas.

### Jeton GitHub au niveau de la session

Le contrat du SDK Copilot distingue le jeton GitHub **au niveau du client**
(`CopilotClientOptions.gitHubToken`, qui authentifie le processus CLI lui-même)
du jeton **au niveau de la session** (`SessionConfig.gitHubToken`, qui détermine
l’exclusion de contenu, le routage du modèle et le quota de cette session ; pris en charge à la fois sur
`createSession` et `resumeSession`). Le harnais résout l’authentification une seule fois via
`resolveCopilotAuth` et définit les deux champs lorsque le mode d’authentification est `gitHubToken`
(un `auth.gitHubToken` explicite ou un `resolvedApiKey` résolu conformément au contrat à partir
d’un profil d’authentification `github-copilot` configuré). Lorsque le mode résolu est
`useLoggedInUser`, le champ au niveau de la session est omis afin que le SDK continue
à déduire l’identité de l’identité connectée.

`ask_user` utilise `SessionConfig.onUserInputRequest`. Le pont accepte les index
ou les libellés de choix pour les requêtes à choix fixe, accepte les réponses libres lorsque
la requête du SDK les autorise et annule une requête en attente lorsque la tentative OpenClaw
est interrompue.

## Voir aussi

- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Plugins de harnais d’agents (référence du SDK)](/fr/plugins/sdk-agent-harness)
