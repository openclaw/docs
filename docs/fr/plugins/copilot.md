---
read_when:
    - Vous souhaitez utiliser le harnais du SDK GitHub Copilot pour un agent
    - Vous avez besoin d’exemples de configuration pour le runtime `copilot`
    - Vous connectez un agent à l’abonnement Copilot (github / openclaw / copilot) et souhaitez l’exécuter via la CLI Copilot
summary: Exécuter les tours d’agent intégré OpenClaw via le harnais externe du SDK GitHub Copilot
title: Harnais SDK Copilot
x-i18n:
    generated_at: "2026-06-27T17:48:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Le plugin externe `@openclaw/copilot` permet à OpenClaw d'exécuter des tours
d'agent Copilot par abonnement intégré via la GitHub Copilot CLI (`@github/copilot-sdk`)
au lieu du harnais PI intégré.

Utilisez le harnais Copilot SDK lorsque vous voulez que la session Copilot CLI possède la
boucle d'agent de bas niveau : exécution native des outils, compaction native
(`infiniteSessions`) et état de fil géré par la CLI sous `copilotHome`.
OpenClaw possède toujours les canaux de chat, les fichiers de session, la sélection de
modèle, les outils dynamiques OpenClaw (pontés), les approbations, la livraison des médias,
le miroir visible de la transcription, les questions annexes `/btw` (gérées par le repli PI
dans l'arborescence — voir
[Questions annexes (`/btw`)](#side-questions-btw)), et `openclaw doctor`.

Pour la séparation plus large modèle/fournisseur/runtime, commencez par
[Runtimes d'agent](/fr/concepts/agent-runtimes).

## Prérequis

- OpenClaw avec le plugin `@openclaw/copilot` installé.
- Si votre configuration utilise `plugins.allow`, incluez `copilot` (l'id de manifeste
  déclaré par le plugin). Une liste d'autorisation restrictive qui utilise le nom de
  paquet npm `@openclaw/copilot` laissera le plugin bloqué et le runtime ne se chargera pas,
  même avec `agentRuntime.id: "copilot"`.
- Un abonnement GitHub Copilot capable de piloter la Copilot CLI (ou une entrée
  `gitHubToken` env / profil d'authentification pour les exécutions headless / cron).
- Un répertoire `copilotHome` accessible en écriture. Le harnais utilise par défaut
  `<agentDir>/copilot` quand OpenClaw fournit un répertoire d'agent, sinon
  `~/.openclaw/agents/<agentId>/copilot` pour une isolation complète par agent.

`openclaw doctor` exécute le
[contrat doctor](#doctor) du plugin pour la propriété déclarative de l'état de session et les futures
migrations de compatibilité. Il n'exécute pas les sondes d'environnement de la Copilot CLI.

## Installation du Plugin

Le runtime Copilot est un plugin externe afin que le paquet principal `openclaw` n'embarque
pas la dépendance `@github/copilot-sdk` ni son binaire CLI spécifique à la plateforme
`@github/copilot-<platform>-<arch>`. Ensemble, ils ajoutent environ
260 Mo ; installez-les donc uniquement pour les agents qui optent pour ce runtime :

```bash
openclaw plugins install @openclaw/copilot
```

L'assistant installe le plugin la première fois que vous sélectionnez un modèle
`github-copilot/*` **et** que votre configuration opte le modèle (ou son fournisseur)
dans le runtime d'agent Copilot via
`agentRuntime: { id: "copilot" }` (voir [Démarrage rapide](#quickstart) ci-dessous).
Sans cette adhésion explicite, openclaw utilise son fournisseur GitHub Copilot intégré
et n'installe jamais le plugin runtime.

Le runtime résout le SDK dans cet ordre :

1. `import("@github/copilot-sdk")` depuis le paquet `@openclaw/copilot` installé.
2. Le répertoire de repli bien connu `~/.openclaw/npm-runtime/copilot/` (la cible
   héritée d'installation à la demande).

Un SDK manquant produit une seule erreur avec le code `COPILOT_SDK_MISSING`
et la commande de réinstallation du plugin ci-dessus.

## Démarrage rapide

Épinglez un modèle (ou un fournisseur) au harnais :

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

Les deux routes sont équivalentes. Utilisez `agentRuntime.id` sur une seule entrée de modèle
quand seul ce modèle doit être routé via le harnais ; définissez `agentRuntime.id` sur un
fournisseur quand tous les modèles sous ce fournisseur doivent l'utiliser.

`github-copilot/auto` est le point de départ portable. Les modèles Copilot nommés dépendent
des politiques de compte et d'organisation ; n'en épinglez donc un qu'après avoir confirmé
que la Copilot CLI authentifiée l'expose.

## Fournisseurs pris en charge

Le harnais annonce la prise en charge du fournisseur canonique `github-copilot`
(le même id possédé par `extensions/github-copilot`) :

- `github-copilot`

Il prend aussi en charge les entrées personnalisées `models.providers` lorsque le modèle
sélectionné a une `baseUrl` non vide et l'une de ces formes d'API :

- `openai-responses`
- `openai-completions`
- `ollama` (complétions compatibles OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Les ids de fournisseurs natifs comme `openai`, `anthropic`, `google` et `ollama` restent
possédés par leurs runtimes natifs. Utilisez un id de fournisseur personnalisé distinct
lors du routage d'un endpoint via Copilot BYOK.

Les endpoints Copilot BYOK doivent être des URL HTTPS de réseau public. Le harnais fournit
au Copilot SDK une URL de proxy loopback par tentative, puis transfère le trafic fournisseur
via le chemin fetch protégé d'OpenClaw afin que l'épinglage DNS et la politique SSRF restent
possédés par OpenClaw. Utilisez le runtime OpenClaw natif pour Ollama local, LM Studio
ou les serveurs de modèles LAN.

## BYOK

Copilot BYOK utilise le contrat de fournisseur personnalisé au niveau session du SDK. OpenClaw
transmet l'endpoint de modèle résolu, la clé API, le mode jeton porteur, les en-têtes, l'id de modèle
et les limites de contexte/sortie sans déplacer la logique de transport fournisseur dans
le cœur.

Par exemple :

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

Les sessions BYOK sont indexées séparément des sessions par abonnement et des autres
endpoints ou empreintes d'identifiants. La rotation de la clé, des en-têtes, du modèle ou
de l'endpoint crée une nouvelle session Copilot SDK au lieu de reprendre un état incompatible.

## Authentification

Priorité par agent, appliquée pendant `runCopilotAttempt` :

1. **`useLoggedInUser: true` explicite** sur l'entrée de tentative. Utilise l'utilisateur connecté
   de la Copilot CLI résolu sous le `copilotHome` de l'agent.
2. **`gitHubToken` explicite** sur l'entrée de tentative (avec `profileId` +
   `profileVersion`). Utile pour les invocations CLI directes et les tests où l'appelant
   veut contourner la résolution de profil d'authentification.
3. **`resolvedApiKey` + `authProfileId` résolus par contrat** depuis la forme
   `EmbeddedRunAttemptParams`. C'est le **chemin principal de production** :
   le cœur résout le profil d'authentification `github-copilot` configuré de l'agent
   (via `src/infra/provider-usage.auth.ts:resolveProviderAuths`) avant
   d'invoquer le harnais, et le harnais consomme directement les deux champs.
   Cela fait fonctionner de bout en bout un profil d'authentification `github-copilot:<profile>`
   pour les configurations headless / cron / multi-profils sans variables d'environnement.
4. **Repli par variable d'environnement** pour les exécutions CLI directes / dogfood où aucun
   profil d'authentification n'est configuré. Le runtime vérifie les variables suivantes par
   ordre de priorité, en miroir du fournisseur `github-copilot` livré
   (`extensions/github-copilot/auth.ts`) et de la configuration documentée du Copilot SDK :
   1. `OPENCLAW_GITHUB_TOKEN` -- remplacement spécifique au harnais ; définissez-le
      pour épingler un jeton pour le harnais OpenClaw sans perturber la configuration
      `gh` / Copilot CLI à l'échelle du système.
   2. `COPILOT_GITHUB_TOKEN` -- variable d'environnement standard Copilot SDK / CLI.
   3. `GH_TOKEN` -- variable d'environnement standard de la CLI `gh` (correspond à la priorité
      existante du fournisseur `github-copilot`).
   4. `GITHUB_TOKEN` -- repli générique de jeton GitHub.

   La première valeur non vide l'emporte ; les chaînes vides sont traitées comme
   absentes. L'id de profil de pool synthétisé est `env:<NAME>` et la
   `profileVersion` est une empreinte sha256 non réversible du jeton, de sorte que
   la rotation de la valeur env invalide proprement le pool client.

5. **`useLoggedInUser` par défaut** lorsqu'aucun signal de jeton n'est disponible.

Chaque agent obtient un `copilotHome` dédié afin que les jetons, sessions et configurations
Copilot CLI ne fuient pas entre agents sur la même machine. La valeur par défaut est
`<agentDir>/copilot` quand l'hôte fournit au harnais un répertoire d'agent
(isolant l'état SDK des fichiers `models.json` / `auth-profiles.json` d'OpenClaw dans
le même répertoire), ou `~/.openclaw/agents/<agentId>/copilot` sinon.
Remplacez-la avec `copilotHome: <path>` sur l'entrée de tentative lorsque vous avez besoin
d'un emplacement personnalisé (par exemple, un montage partagé pour une migration).

Les tests de harnais live utilisent `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` lorsqu'un jeton direct
est nécessaire. La configuration partagée des tests live nettoie intentionnellement
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` et `GITHUB_TOKEN` après avoir préparé de vrais profils
d'authentification dans le home de test isolé ; transmettre une valeur `gh auth token`
via la variable dédiée aux tests live évite donc les faux skips sans exposer
le jeton à des suites sans rapport.

## Surface de configuration

Le harnais lit sa configuration depuis l'entrée par tentative
(`runCopilotAttempt({...})`) plus un petit ensemble de valeurs par défaut env dans
`extensions/copilot/src/` :

- `copilotHome` — répertoire d'état CLI par agent (valeurs par défaut documentées ci-dessus).
- `model` — chaîne ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Si omis, OpenClaw utilise la sélection de modèle normale de l'agent et le harnais vérifie
  que le fournisseur résolu est pris en charge.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Correspond à la résolution
  `ThinkLevel` / `ReasoningLevel` d'OpenClaw dans
  `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — remplacement facultatif pour le bloc SDK
  `infiniteSessions` piloté par `harness.compact`. Les valeurs par défaut peuvent être
  laissées telles quelles.
- `hooksConfig` — configuration facultative de compatibilité native Copilot SDK `SessionHooks`
  pour les rappels outil/MCP, invite utilisateur, session et erreur.
  Elle est séparée des hooks de cycle de vie portables d'OpenClaw.
- `permissionPolicy` — remplacement facultatif du gestionnaire SDK
  `onPermissionRequest` utilisé pour les types d'outils SDK intégrés
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). La valeur par défaut
  est `rejectAllPolicy` comme filet de sécurité ; en pratique, le SDK n'invoque jamais
  aucun de ces types, car chaque outil OpenClaw ponté est enregistré avec
  `overridesBuiltInTool: true` et
  `skipPermission: true`, de sorte que 100 % des appels d'outils passent par le
  `execute()` enveloppé d'OpenClaw. Voir [Autorisations et ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — indicateur facultatif de télémétrie de session SDK.

Les hooks de plugins OpenClaw n'ont pas besoin de configuration de tentative spécifique à Copilot. Le
harnais exécute `before_prompt_build` (et le hook de compatibilité hérité `before_agent_start`),
`llm_input`, `llm_output` et `agent_end` via les helpers standard du harnais. Les compactions
SDK réussies exécutent aussi `before_compaction` et `after_compaction`. Les outils OpenClaw
pontés continuent d'exécuter `before_tool_call` et de signaler `after_tool_call` ; `hooksConfig`
reste destiné aux rappels uniquement SDK natifs qui n'ont pas d'équivalent portable.

Rien dans le reste d'OpenClaw n'a besoin de connaître ces champs. Les autres plugins,
canaux et le code cœur ne voient que la forme standard
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Quand `harness.compact` s'exécute, le harnais Copilot SDK :

1. Reprend la session SDK suivie sans continuer le travail en attente.
2. Appelle le RPC de compaction d'historique limité à la session du SDK.
3. Renvoie le résultat de compaction SDK sans écrire de fichiers marqueurs de compatibilité
   sous l'espace de travail.

Le miroir de transcription côté OpenClaw (voir ci-dessous) continue de recevoir les messages
post-compaction, afin que l'historique de chat visible par l'utilisateur reste cohérent.

## Miroir de transcription

`runCopilotAttempt` écrit en double les messages reflétables de chaque tour dans la
transcription d'audit OpenClaw via
`extensions/copilot/src/dual-write-transcripts.ts`. Le miroir est
limité par session (`copilot:${sessionId}`) et utilise une identité par message
(`${role}:${sha256_16(role,content)}`), de sorte que les réémissions d'entrées des tours précédents
entrent en collision avec les clés sur disque existantes et ne créent pas de doublons.

Le miroir est enveloppé dans deux couches de confinement des échecs afin qu'un échec d'écriture
de transcription ne puisse pas faire échouer la tentative : un wrapper interne en meilleur effort et
un `.catch(...)` de défense en profondeur au niveau de la tentative. Les échecs sont journalisés mais
pas remontés.

## Questions annexes (`/btw`)

`/btw` n’est **pas** natif dans ce harnais. `createCopilotAgentHarness()`
laisse délibérément `harness.runSideQuestion` indéfini, si bien que le répartiteur
`/btw` d’OpenClaw (`src/agents/btw.ts`) bascule vers le même chemin de repli PI
dans l’arborescence qu’il utilise pour chaque runtime non-Codex : le fournisseur
de modèle configuré est appelé directement avec un court prompt de question
secondaire, puis le résultat est renvoyé en flux via `streamSimple` (pas de
session CLI, pas d’emplacement supplémentaire dans le pool).

Cela réserve les sessions CLI Copilot à la boucle principale de tour de l’agent,
et garde le comportement de `/btw` identique à celui des autres runtimes adossés
à PI. Le contrat est vérifié dans
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
sous `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` est chargé automatiquement par
`src/plugins/doctor-contract-registry.ts`. Il fournit :

- Un `legacyConfigRules` vide (aucun champ retiré au MVP).
- Un `normalizeCompatibilityConfig` sans effet (conservé afin que les futurs
  retraits de champs aient un emplacement stable dans l’arborescence).
- Une entrée `sessionRouteStateOwners` revendiquant le fournisseur
  `github-copilot` ; le runtime `copilot` ; la clé de session CLI `copilot` ;
  le préfixe de profil d’authentification `github-copilot:`.

## Limites

- Le harnais revendique `github-copilot` ainsi que les identifiants de
  fournisseurs BYOK personnalisés non détenus. Les identifiants de fournisseurs
  natifs détenus par le manifeste restent sur leur runtime propriétaire, même
  lorsque `agentRuntime.id` est forcé à `copilot`.
- Le harnais ne fournit pas le TUI ; le TUI de PI n’est pas affecté et reste le
  repli pour tous les runtimes qui n’ont pas de surface homologue.
- L’état de session PI n’est pas migré lorsqu’un agent passe à `copilot`.
  La sélection se fait par tentative ; les sessions PI existantes restent valides.
- `ask_user` utilise le même chemin de prompt et de réponse OpenClaw que le
  harnais Codex. Lorsque le SDK Copilot demande une saisie utilisateur, OpenClaw
  publie un prompt bloquant sur le canal/TUI actif, et le prochain message
  utilisateur en file d’attente résout la requête du SDK.

## Autorisations et ask_user

L’application des autorisations pour les outils OpenClaw pontés se fait **dans
l’enveloppe de l’outil**, et non via le callback `onPermissionRequest` du SDK. Le
même `wrapToolWithBeforeToolCallHook` que PI utilise
(`src/agents/pi-tools.before-tool-call.ts`) est appliqué par
`createOpenClawCodingTools` à chaque outil de codage : détection de boucles,
politiques de Plugins de confiance, hooks avant appel d’outil et approbations de
Plugins en deux phases via le Gateway (`plugin.approval.request`) s’exécutent tous
avec exactement le même chemin de code que les tentatives PI natives.

Pour laisser cette enveloppe prendre la décision, l’outil SDK renvoyé par
`convertOpenClawToolToSdkTool` est marqué avec :

- `overridesBuiltInTool: true` — remplace l’outil intégré de même nom du CLI
  Copilot (edit, read, write, bash, …) afin que chaque invocation d’outil soit
  redirigée vers OpenClaw.
- `skipPermission: true` — indique au SDK de ne pas déclencher
  `onPermissionRequest({kind: "custom-tool"})` avant d’invoquer l’outil.
  Le `execute()` enveloppé effectue en interne la vérification de politique
  OpenClaw plus riche ; un prompt au niveau SDK court-circuiterait soit
  l’application des règles d’OpenClaw (si nous autorisons tout), soit bloquerait
  chaque appel d’outil (si nous rejetons tout) — aucun des deux ne correspond à
  la parité PI.

Le harnais Codex dans l’arborescence utilise la même séparation : les outils
OpenClaw pontés sont enveloppés
(`extensions/codex/src/app-server/dynamic-tools.ts`) et les types d’approbation
natifs _propres_ au codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) sont routés via `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L’équivalent du SDK
Copilot — la `rejectAllPolicy` fermée par défaut pour tout type non
`custom-tool` qui atteindrait jamais `onPermissionRequest` — est le même filet de
sécurité, et il ne se déclenche pas en pratique, car `overridesBuiltInTool: true`
remplace chaque outil intégré.

Pour que la couche d’outils enveloppés prenne des décisions de politique
équivalentes à PI, le harnais transmet le contexte complet d’outil de tentative
PI à `createOpenClawCodingTools` — identité (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, …), canal/routage (`groupId`, `currentChannelId`,
`replyToMode`, options des outils de message), authentification
(`authProfileStore`), identité d’exécution (`sessionKey`/`runSessionKey` dérivées
de `sandboxSessionKey`, `runId`), contexte de modèle (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) et hooks d’exécution
(`onToolOutcome`, `onYield`). Sans ces champs, les listes d’autorisation réservées
au propriétaire se comportent silencieusement comme un refus par défaut, les
politiques de confiance des Plugins ne peuvent pas se résoudre dans la bonne
portée, et `session_status: "current"` se résout vers une clé de sandbox obsolète.
Le constructeur de pont se trouve dans `extensions/copilot/src/tool-bridge.ts` et
reflète l’appel de référence de PI à
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt` résout déjà
le contexte de sandbox via la couture partagée `resolveSandboxContext`, transmet
au SDK un répertoire de travail effectif, et transfère `sandbox` ainsi que l’espace
de travail de création de sous-agent au pont d’outils. Le pont transmet aussi les
contrôles bornés de construction d’outils qu’il peut appliquer à la frontière du
SDK : `includeCoreTools`, la liste d’autorisation d’outils du runtime et
`toolConstructionPlan`.

Le pont utilise aussi l’aide partagée de surface d’outils de harnais depuis
`openclaw/plugin-sdk/agent-harness-tool-runtime` pour la parité PI. Lorsque la
recherche d’outils est activée, le SDK voit des outils de contrôle compacts ainsi
qu’un exécuteur de catalogue masqué au lieu de chaque schéma d’outil OpenClaw.
Lorsque le mode code est activé, l’aide construit la même surface de contrôle du
mode code et le même cycle de vie de catalogue que ceux utilisés par les autres
harnais d’agents. Les valeurs par défaut allégées pour modèles locaux, le filtrage
de schémas compatible avec le runtime, l’hydratation des répertoires et le
nettoyage de catalogue restent tous dans l’aide partagée afin que Copilot et les
harnais adjacents à Codex ne divergent pas.

### Jeton GitHub au niveau session

Le contrat du SDK Copilot distingue le jeton GitHub **au niveau client**
(`CopilotClientOptions.gitHubToken`, utilisé pour authentifier le processus CLI
lui-même) du jeton **au niveau session** (`SessionConfig.gitHubToken`, qui
détermine l’exclusion de contenu, le routage de modèle et le quota pour cette
session, et qui est honoré à la fois par `createSession` et `resumeSession`). Le
harnais résout l’authentification une seule fois via `resolveCopilotAuth` et
définit les deux champs lorsque le mode d’authentification est `gitHubToken` (un
`auth.gitHubToken` explicite ou une `resolvedApiKey` résolue par contrat depuis un
profil d’authentification `github-copilot` configuré). Lorsque le mode résolu est
`useLoggedInUser`, le champ au niveau session est omis afin que le SDK continue à
déduire l’identité à partir de l’identité connectée.

`ask_user` utilise `SessionConfig.onUserInputRequest`. Le pont accepte les index
ou libellés de choix pour les requêtes à choix fixes, accepte les réponses libres
lorsque la requête du SDK les autorise, et annule une requête en attente lorsque
la tentative OpenClaw est interrompue.

## Liens connexes

- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Plugins de harnais d’agent (référence SDK)](/fr/plugins/sdk-agent-harness)
