---
read_when:
    - Vous souhaitez utiliser l’infrastructure du SDK GitHub Copilot pour un agent
    - Vous avez besoin d’exemples de configuration pour le runtime `copilot`
    - Vous connectez un agent à un abonnement Copilot (github / openclaw / copilot) et souhaitez qu’il s’exécute via la CLI Copilot
summary: Exécuter les tours d’agent intégré OpenClaw via le banc d’essai externe du SDK GitHub Copilot
title: Harnais du SDK Copilot
x-i18n:
    generated_at: "2026-07-12T15:38:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Le plugin externe `@openclaw/copilot` exécute les tours d’agent Copilot avec abonnement intégré via la CLI GitHub Copilot (`@github/copilot-sdk`) plutôt que via le moteur intégré d’OpenClaw. La session de la CLI Copilot gère la boucle d’agent de bas niveau : exécution native des outils, Compaction native (`infiniteSessions`) et état des fils de discussion géré par la CLI sous `copilotHome`. OpenClaw continue de gérer les canaux de discussion, les fichiers de session, la sélection du modèle, les outils dynamiques (reliés), les approbations, la livraison des médias, le miroir visible de la transcription, les questions secondaires `/btw` (voir [Questions secondaires (`/btw`)](#side-questions-btw)) et `openclaw doctor`.

Pour une vue d’ensemble de la séparation entre modèle, fournisseur et environnement d’exécution, commencez par
[Environnements d’exécution des agents](/fr/concepts/agent-runtimes).

## Prérequis

- OpenClaw avec le plugin `@openclaw/copilot` installé.
- Si votre configuration utilise `plugins.allow`, incluez `copilot` (l’identifiant de manifeste déclaré par le plugin). Une entrée de liste d’autorisation correspondant au nom du paquet npm `@openclaw/copilot` ne concordera pas et laissera le plugin bloqué, même si `agentRuntime.id: "copilot"` est défini.
- Un abonnement GitHub Copilot permettant d’utiliser la CLI Copilot, ou une variable d’environnement `gitHubToken` / une entrée de profil d’authentification pour les exécutions sans interface ou Cron.
- Un répertoire `copilotHome` accessible en écriture. La valeur par défaut est `<agentDir>/copilot` lorsqu’OpenClaw fournit un répertoire d’agent, sinon
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` exécute le [contrat doctor](#doctor) du plugin pour la propriété de l’état des sessions et les futures migrations de configuration. Il ne vérifie pas l’environnement de la CLI Copilot.

## Installation

L’environnement d’exécution Copilot est distribué sous forme de plugin externe afin que le paquet principal `openclaw` n’embarque ni `@github/copilot-sdk` ni son binaire CLI `@github/copilot-<platform>-<arch>` propre à la plateforme (environ 260 Mo au total). Installez-le uniquement pour les agents qui choisissent cet environnement d’exécution :

```bash
openclaw plugins install @openclaw/copilot
```

L’assistant de configuration installe automatiquement le plugin la première fois que vous sélectionnez un modèle `github-copilot/*` **et** que votre configuration achemine ce modèle (ou son fournisseur) vers l’environnement d’exécution Copilot via `agentRuntime: { id: "copilot" }` ; voir [Démarrage rapide](#quickstart). Sans cette activation explicite, OpenClaw utilise son fournisseur GitHub Copilot intégré et n’installe jamais ce plugin.

L’environnement d’exécution résout le SDK dans cet ordre :

1. `import("@github/copilot-sdk")` depuis le paquet `@openclaw/copilot` installé.
2. Le répertoire de secours `~/.openclaw/npm-runtime/copilot/` (ancienne cible d’installation à la demande).

L’absence du SDK produit une erreur unique portant le code `COPILOT_SDK_MISSING` et la commande de réinstallation ci-dessus.

## Démarrage rapide

Associez un modèle (ou un fournisseur) au moteur :

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

Définissez `agentRuntime.id` sur une entrée de modèle unique pour n’acheminer que ce modèle via le moteur, ou sur un fournisseur pour acheminer tous les modèles de ce fournisseur.

`github-copilot/auto` est le point de départ portable. Les modèles Copilot nommés dépendent des politiques du compte et de l’organisation ; vérifiez que votre CLI Copilot authentifiée expose effectivement un modèle avant de l’associer.

## Fournisseurs pris en charge

Le moteur prend en charge le fournisseur canonique `github-copilot` (détenu par `extensions/github-copilot`), ainsi que les entrées personnalisées `models.providers` lorsque le modèle possède un `baseUrl` non vide et l’une des formes `api` suivantes :

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (complétions compatibles avec OpenAI)
- `openai-completions`
- `openai-responses`

Les identifiants de fournisseurs natifs (`openai`, `anthropic`, `google`, `ollama`) restent gérés par leurs environnements d’exécution natifs. Utilisez plutôt un identifiant de fournisseur personnalisé distinct pour acheminer un point de terminaison via Copilot BYOK.

Les points de terminaison Copilot BYOK doivent être des URL HTTPS publiques. Le moteur fournit au SDK Copilot un proxy de bouclage pour chaque tentative, puis transmet le trafic du fournisseur via le chemin de récupération protégé d’OpenClaw afin que l’épinglage DNS et la politique SSRF restent gérés par OpenClaw. Utilisez l’environnement d’exécution OpenClaw natif pour Ollama local, LM Studio ou les serveurs de modèles du réseau local.

## BYOK

Copilot BYOK utilise le contrat de fournisseur personnalisé au niveau de la session du SDK. OpenClaw transmet le point de terminaison résolu du modèle, la clé API, le mode jeton porteur, les en-têtes, l’identifiant du modèle ainsi que les limites de contexte et de sortie ; la logique de transport du fournisseur reste dans le SDK, et non dans le cœur.

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

Les sessions BYOK sont indexées séparément des sessions d’abonnement, ainsi que des autres points de terminaison ou identifiants BYOK. La rotation de la clé, des en-têtes, du modèle ou du point de terminaison démarre une nouvelle session du SDK Copilot au lieu de reprendre un état incompatible.

## Authentification

Ordre de priorité, appliqué par agent pendant `runCopilotAttempt` :

1. **`useLoggedInUser: true` explicite** dans l’entrée de la tentative — utilise l’utilisateur connecté de la CLI Copilot sous le `copilotHome` de l’agent.
2. **`gitHubToken` explicite** dans l’entrée de la tentative (nécessite `profileId` + `profileVersion`). Pour les appels directs de la CLI et les tests qui doivent contourner la résolution du profil d’authentification.
3. **`resolvedApiKey` + `authProfileId` résolus par le contrat** — le chemin principal en production. Le cœur résout le profil d’authentification `github-copilot` configuré pour l’agent (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) avant d’appeler le moteur, de sorte qu’un profil d’authentification `github-copilot:<profile>` fonctionne de bout en bout pour les configurations sans interface, Cron ou à plusieurs profils, sans variables d’environnement.
4. **Solution de repli par variable d’environnement**, vérifiée dans cet ordre (la première valeur non vide l’emporte, les chaînes vides sont considérées comme absentes ; reflète l’ordre de priorité du fournisseur `github-copilot` distribué dans `extensions/github-copilot/auth.ts`) :
   1. `OPENCLAW_GITHUB_TOKEN` — remplacement propre au moteur ; vous permet d’associer un jeton au moteur OpenClaw sans perturber la configuration système de `gh` / de la CLI Copilot.
   2. `COPILOT_GITHUB_TOKEN` — variable d’environnement standard du SDK / de la CLI Copilot.
   3. `GH_TOKEN` — variable d’environnement standard de la CLI `gh`.
   4. `GITHUB_TOKEN` — solution de repli générique pour le jeton GitHub.

   L’identifiant de profil de pool synthétisé est `env:<NAME>` ; la version du profil est une empreinte sha256 non réversible du jeton, de sorte que la rotation de la valeur d’environnement invalide proprement le pool de clients.

5. **`useLoggedInUser` par défaut** lorsqu’aucun signal de jeton n’est disponible.

Chaque agent dispose de son propre `copilotHome` afin que les jetons, sessions et configurations de la CLI Copilot ne soient jamais partagés entre les agents d’une même machine. Valeur par défaut :
`<agentDir>/copilot` (conserve l’état du SDK hors du répertoire contenant les fichiers `models.json` / `auth-profiles.json` d’OpenClaw), ou
`~/.openclaw/agents/<agentId>/copilot` lorsqu’aucun répertoire d’agent n’est fourni.
Utilisez `copilotHome: <path>` dans l’entrée de la tentative pour définir un emplacement personnalisé (par exemple, un montage partagé pour une migration).

Les tests réels du moteur utilisent `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` pour fournir directement un jeton. La configuration partagée des tests réels supprime `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` et `GITHUB_TOKEN` après avoir placé les profils d’authentification réels dans le répertoire personnel de test isolé, afin qu’une valeur `gh auth token` transmise par la variable dédiée évite les ignorances erronées sans fuiter vers des suites sans rapport.

## Surface de configuration

Le moteur lit la configuration depuis l’entrée de chaque tentative (`runCopilotAttempt({...})`), ainsi que depuis un petit ensemble de valeurs par défaut d’environnement dans `extensions/copilot/src/` :

| Champ                    | Objectif                                                                                                                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Répertoire d’état de la CLI propre à chaque agent (valeurs par défaut ci-dessus).                                                                                                                                                                                                              |
| `model`                  | Chaîne ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omettez-le pour utiliser la sélection habituelle du modèle de l’agent ; le moteur vérifie que le fournisseur résolu est pris en charge.                                                                                     |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Correspond à la résolution `ThinkLevel` / `ReasoningLevel` d’OpenClaw dans `auto-reply/thinking.ts`.                                                                                                                                                |
| `infiniteSessionConfig`  | Remplacement facultatif du bloc `infiniteSessions` du SDK piloté par `harness.compact`. Vous pouvez le laisser tel quel en toute sécurité.                                                                                                                                                      |
| `hooksConfig`            | Configuration native facultative `SessionHooks` du SDK Copilot pour les rappels d’outil/MCP, d’invite utilisateur, de session et d’erreur. Distincte des hooks de cycle de vie portables d’OpenClaw.                                                                                            |
| `permissionPolicy`       | Remplacement facultatif du gestionnaire `onPermissionRequest` du SDK pour les types d’outils intégrés du SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Utilise par défaut `rejectAllPolicy` comme filet de sécurité ; voir [Autorisations et ask_user](#permissions-and-ask_user) pour comprendre pourquoi il ne se déclenche jamais réellement. |
| `enableSessionTelemetry` | Indicateur facultatif de télémétrie de session du SDK.                                                                                                                                                                                                                                         |

Les hooks de plugin OpenClaw ne nécessitent aucune configuration de tentative propre à Copilot. Le moteur exécute `before_prompt_build` (ainsi que l’ancien hook de compatibilité `before_agent_start`), `llm_input`, `llm_output` et `agent_end` via les assistants standard du moteur. Les Compactions réussies du SDK exécutent également `before_compaction` et `after_compaction`. Les outils OpenClaw reliés exécutent `before_tool_call` et signalent `after_tool_call` ; `hooksConfig` reste réservé aux rappels natifs propres au SDK sans équivalent portable.

Rien d’autre dans OpenClaw n’a besoin de connaître ces champs. Les autres plugins, canaux et le code du cœur ne voient que la forme standard `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Lorsque `harness.compact` s’exécute, le moteur du SDK Copilot :

1. Reprend la session du SDK suivie sans poursuivre les travaux en attente.
2. Appelle la RPC de Compaction de l’historique propre à la session du SDK.
3. Renvoie le résultat de la Compaction du SDK sans écrire de fichiers marqueurs de compatibilité sous l’espace de travail.

Le miroir de transcription côté OpenClaw (ci-dessous) continue de recevoir les messages postérieurs à la Compaction, de sorte que l’historique de discussion visible par l’utilisateur reste cohérent.

## Mise en miroir de la transcription

`runCopilotAttempt` écrit en double les messages pouvant être mis en miroir de chaque tour dans la transcription d’audit d’OpenClaw via
`extensions/copilot/src/dual-write-transcripts.ts`. Le miroir est limité à chaque session (`copilot:${sessionId}`) et indexé par message
(`${role}:${sha256_16(role,content)}`), de sorte que les entrées réémises des tours précédents entrent en collision avec les clés existantes sur le disque au lieu d’être dupliquées.

Deux niveaux de confinement des défaillances entourent le miroir afin qu’un échec
d’écriture de la transcription ne fasse jamais échouer la tentative : un wrapper interne
fonctionnant au mieux, auquel s’ajoute un `.catch(...)` de défense en profondeur au niveau
de la tentative. Les échecs sont journalisés, mais ne sont pas remontés.

## Questions annexes (`/btw`)

`/btw` n’est **pas** natif dans ce harnais. `createCopilotAgentHarness()`
laisse délibérément `harness.runSideQuestion` indéfini
(comme vérifié dans `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
de sorte que le répartiteur `/btw` d’OpenClaw (`src/agents/btw.ts`) bascule vers le
même chemin que celui utilisé pour chaque runtime autre que Codex : le fournisseur de modèle
configuré est appelé directement avec une courte invite de question annexe, puis sa réponse
est diffusée via `streamSimple` (aucune session CLI, aucun emplacement supplémentaire dans le pool).

Cela réserve les sessions Copilot CLI à la boucle principale de tours de l’agent et
maintient le comportement de `/btw` identique à celui des autres runtimes hors Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` est chargé automatiquement par
`src/plugins/doctor-contract-registry.ts`. Il fournit :

- Un `legacyConfigRules` vide (aucun champ retiré pour le moment).
- Un `normalizeCompatibilityConfig` sans opération (conservé afin que les futurs retraits
  de champs disposent d’un emplacement stable dans l’arborescence).
- Une entrée `sessionRouteStateOwners` : fournisseur `github-copilot`, runtime
  `copilot`, clé de session CLI `copilot`, préfixe de profil d’authentification `github-copilot:`.

## Limites

- Le harnais revendique `github-copilot` ainsi que les identifiants de fournisseurs BYOK
  personnalisés sans propriétaire. Les identifiants de fournisseurs natifs appartenant au
  manifeste restent associés à leur runtime propriétaire, même lorsque
  `agentRuntime.id` est forcé à `copilot`.
- Aucune interface TUI ; la TUI de PI reste la solution de repli pour les runtimes sans
  interface homologue.
- L’état de session PI n’est pas migré lorsqu’un agent passe à `copilot`.
  La sélection s’effectue par tentative ; les sessions PI existantes restent valides.
- `ask_user` utilise le même chemin d’invite et de réponse OpenClaw que le harnais
  Codex : lorsque le SDK Copilot demande une saisie utilisateur, OpenClaw publie une
  invite bloquante dans le canal ou la TUI active, et le prochain message utilisateur
  mis en file d’attente satisfait la requête du SDK.

## Autorisations et ask_user

L’application des autorisations pour les outils OpenClaw relayés s’effectue **dans le
wrapper de l’outil**, et non par l’intermédiaire du rappel `onPermissionRequest` du SDK. Le même
`wrapToolWithBeforeToolCallHook` que celui utilisé par PI
(`src/agents/agent-tools.before-tool-call.ts`) est appliqué par
`createOpenClawCodingTools` à chaque outil de codage : la détection des boucles, les politiques
des plugins de confiance, les hooks précédant les appels d’outils et les approbations de plugins
en deux phases via le Gateway (`plugin.approval.request`) suivent tous exactement le même
chemin de code que les tentatives PI natives.

L’outil SDK renvoyé par `convertOpenClawToolToSdkTool` comporte les marqueurs suivants :

- `overridesBuiltInTool: true` — remplace l’outil intégré de Copilot CLI portant
  le même nom (edit, read, write, bash, ...) afin que chaque appel d’outil soit redirigé
  vers OpenClaw.
- `skipPermission: true` — indique au SDK de ne pas déclencher
  `onPermissionRequest({kind: "custom-tool"})` avant d’appeler l’outil. La méthode
  `execute()` wrappée effectue déjà le contrôle de politique OpenClaw plus complet ; une
  invite au niveau du SDK court-circuiterait l’application des règles d’OpenClaw
  (tout autoriser) ou bloquerait chaque appel d’outil (tout refuser) — aucun des deux
  comportements ne correspond à la parité avec PI.

Le harnais Codex intégré à l’arborescence utilise la même séparation : les outils OpenClaw
relayés sont wrappés (`extensions/codex/src/app-server/dynamic-tools.ts`) et les types
d’approbation natifs propres au codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) passent par `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L’équivalent dans le SDK Copilot
— la politique restrictive par défaut `rejectAllPolicy` pour tout type autre que
`custom-tool` qui atteindrait `onPermissionRequest` — constitue le même filet de sécurité,
et elle n’est jamais déclenchée en pratique, car `overridesBuiltInTool: true` remplace chaque
outil intégré.

Pour que la couche d’outils wrappés prenne des décisions de politique équivalentes à celles
de PI, le harnais transmet à `createOpenClawCodingTools` l’intégralité du contexte des outils
de tentative de PI : identité (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), canal et routage (`groupId`,
`currentChannelId`, `replyToMode`, options des outils de messagerie), authentification
(`authProfileStore`), identité d’exécution (`sessionKey` / `runSessionKey` dérivés
de `sandboxSessionKey`, `runId`), contexte du modèle (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) et hooks d’exécution
(`onToolOutcome`, `onYield`). Sans ces champs, les listes d’autorisation réservées au
propriétaire refusent silencieusement l’accès par défaut, les politiques de confiance des plugins
ne peuvent pas déterminer la portée correcte et `session_status: "current"` est résolu
vers une ancienne clé de sandbox. Le constructeur du pont est
`extensions/copilot/src/tool-bridge.ts`, qui reproduit l’appel de référence de PI dans
`src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` résout le contexte de sandbox par l’intermédiaire du point d’intégration partagé
`resolveSandboxContext`, transmet au SDK un répertoire de travail effectif et transmet
`sandbox` ainsi que l’espace de travail de création des sous-agents au pont d’outils.
Le pont transmet également les contrôles bornés de construction d’outils qu’il peut appliquer
à la frontière du SDK : `includeCoreTools`, la liste d’autorisation des outils du runtime
et `toolConstructionPlan`.

Le pont utilise également l’assistant partagé de surface d’outils du harnais depuis
`openclaw/plugin-sdk/agent-harness-tool-runtime` afin d’assurer la parité avec PI. Lorsque
la recherche d’outils est activée, le SDK reçoit des outils de contrôle compacts ainsi qu’un
exécuteur de catalogue masqué, au lieu de chaque schéma d’outil OpenClaw. Lorsque le mode code
est activé, l’assistant construit la même surface de contrôle du mode code et le même cycle de vie
du catalogue que ceux utilisés par les autres harnais d’agents. Les valeurs par défaut allégées
pour les modèles locaux, le filtrage des schémas compatibles avec le runtime, l’hydratation des
répertoires et le nettoyage du catalogue restent tous dans l’assistant partagé afin d’éviter
toute divergence entre les harnais Copilot et ceux apparentés à Codex.

### Jeton GitHub au niveau de la session

Le contrat du SDK Copilot distingue le jeton GitHub **au niveau du client**
(`CopilotClientOptions.gitHubToken`, qui authentifie le processus CLI lui-même)
du jeton **au niveau de la session** (`SessionConfig.gitHubToken`, qui détermine
l’exclusion de contenu, le routage du modèle et le quota pour cette session ; pris en charge
par `createSession` comme par `resumeSession`). Le harnais résout l’authentification une seule
fois via `resolveCopilotAuth` et définit les deux champs lorsque le mode d’authentification est
`gitHubToken` (un `auth.gitHubToken` explicite ou une `resolvedApiKey` résolue par contrat depuis
un profil d’authentification `github-copilot` configuré). Lorsque le mode résolu est
`useLoggedInUser`, le champ au niveau de la session est omis afin que le SDK continue de
déduire l’identité à partir de l’identité de l’utilisateur connecté.

`ask_user` utilise `SessionConfig.onUserInputRequest`. Le pont accepte les indices
ou les libellés de choix pour les requêtes à choix fixe, accepte les réponses en texte libre
lorsque la requête du SDK les autorise et annule une requête en attente lorsque la tentative
OpenClaw est interrompue.

## Pages connexes

- [Runtimes d’agents](/fr/concepts/agent-runtimes)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Plugins de harnais d’agents (référence du SDK)](/fr/plugins/sdk-agent-harness)
