---
read_when:
    - Vous souhaitez utiliser l’environnement d’exécution du SDK GitHub Copilot pour un agent
    - Vous avez besoin d’exemples de configuration pour l’environnement d’exécution `copilot`
    - Vous connectez un agent à un abonnement Copilot (github / openclaw / copilot) et souhaitez l’exécuter via la CLI Copilot
summary: Exécuter les tours de l’agent intégré d’OpenClaw via le banc d’essai externe du SDK GitHub Copilot
title: Harness du SDK Copilot
x-i18n:
    generated_at: "2026-07-12T03:04:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Le plugin externe `@openclaw/copilot` exécute les tours d’agent Copilot intégrés à l’abonnement via la CLI GitHub Copilot (`@github/copilot-sdk`) plutôt que par le harnais intégré d’OpenClaw. La session de la CLI Copilot prend en charge la boucle d’agent de bas niveau : exécution native des outils, compaction native (`infiniteSessions`) et état des fils de discussion géré par la CLI sous `copilotHome`. OpenClaw reste responsable des canaux de discussion, des fichiers de session, de la sélection du modèle, des outils dynamiques (reliés), des approbations, de la livraison des médias, du miroir visible de la transcription, des questions annexes `/btw` (voir [Questions annexes (`/btw`)](#side-questions-btw)) et de `openclaw doctor`.

Pour une vue d’ensemble de la séparation entre modèle, fournisseur et environnement d’exécution, commencez par [Environnements d’exécution des agents](/fr/concepts/agent-runtimes).

## Prérequis

- OpenClaw avec le plugin `@openclaw/copilot` installé.
- Si votre configuration utilise `plugins.allow`, incluez `copilot` (l’identifiant de manifeste déclaré par le plugin). Une entrée de liste d’autorisation correspondant au nom du paquet npm `@openclaw/copilot` ne correspondra pas et laissera le plugin bloqué, même si `agentRuntime.id: "copilot"` est défini.
- Un abonnement GitHub Copilot permettant d’utiliser la CLI Copilot, ou une variable d’environnement `gitHubToken` / une entrée de profil d’authentification pour les exécutions sans interface ou via Cron.
- Un répertoire `copilotHome` accessible en écriture. La valeur par défaut est `<agentDir>/copilot` lorsqu’OpenClaw fournit un répertoire d’agent, sinon `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` exécute le [contrat de diagnostic](#doctor) du plugin pour la propriété de l’état des sessions et les futures migrations de configuration. Il ne sonde pas l’environnement de la CLI Copilot.

## Installation

L’environnement d’exécution Copilot est distribué sous forme de plugin externe afin que le paquet principal `openclaw` n’embarque ni `@github/copilot-sdk` ni son binaire CLI `@github/copilot-<platform>-<arch>` propre à la plateforme (environ 260 Mo au total). Installez-le uniquement pour les agents qui choisissent cet environnement d’exécution :

```bash
openclaw plugins install @openclaw/copilot
```

L’assistant de configuration installe automatiquement le plugin la première fois que vous sélectionnez un modèle `github-copilot/*` **et** que votre configuration achemine ce modèle (ou son fournisseur) vers l’environnement d’exécution Copilot via `agentRuntime: { id: "copilot" }` ; voir [Démarrage rapide](#quickstart). Sans cette activation explicite, OpenClaw utilise son fournisseur GitHub Copilot intégré et n’installe jamais ce plugin.

L’environnement d’exécution résout le SDK dans cet ordre :

1. `import("@github/copilot-sdk")` depuis le paquet `@openclaw/copilot` installé.
2. Le répertoire de repli `~/.openclaw/npm-runtime/copilot/` (ancienne cible d’installation à la demande).

L’absence du SDK produit une seule erreur portant le code `COPILOT_SDK_MISSING` et la commande de réinstallation ci-dessus.

## Démarrage rapide

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

Définissez `agentRuntime.id` sur une seule entrée de modèle pour n’acheminer que ce modèle via le harnais, ou sur un fournisseur pour acheminer tous les modèles de ce fournisseur.

`github-copilot/auto` constitue le point de départ portable. Les modèles Copilot nommés dépendent du compte et des politiques de l’organisation ; vérifiez que votre CLI Copilot authentifiée expose effectivement un modèle avant de l’associer.

## Fournisseurs pris en charge

Le harnais prend en charge le fournisseur canonique `github-copilot` (géré par `extensions/github-copilot`), ainsi que les entrées personnalisées de `models.providers` lorsque le modèle possède une valeur `baseUrl` non vide et l’une des formes `api` suivantes :

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (complétions compatibles avec OpenAI)
- `openai-completions`
- `openai-responses`

Les identifiants de fournisseurs natifs (`openai`, `anthropic`, `google`, `ollama`) restent gérés par leurs environnements d’exécution natifs. Utilisez plutôt un identifiant de fournisseur personnalisé distinct pour acheminer un point de terminaison via le BYOK de Copilot.

Les points de terminaison BYOK de Copilot doivent être des URL HTTPS publiques. Le harnais fournit au SDK Copilot un proxy local loopback propre à chaque tentative, puis transmet le trafic du fournisseur par le chemin de récupération protégé d’OpenClaw afin que l’épinglage DNS et la politique SSRF restent sous la responsabilité d’OpenClaw. Utilisez l’environnement d’exécution natif d’OpenClaw pour les serveurs de modèles Ollama locaux, LM Studio ou du réseau local.

## BYOK

Le BYOK de Copilot utilise le contrat de fournisseur personnalisé du SDK au niveau de la session. OpenClaw transmet le point de terminaison résolu du modèle, la clé d’API, le mode de jeton porteur, les en-têtes, l’identifiant du modèle ainsi que les limites de contexte et de sortie ; la logique de transport du fournisseur reste dans le SDK, et non dans le cœur.

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

Les sessions BYOK sont indexées séparément des sessions d’abonnement et des autres points de terminaison ou identifiants BYOK. La rotation de la clé, des en-têtes, du modèle ou du point de terminaison démarre une nouvelle session du SDK Copilot au lieu de reprendre un état incompatible.

## Authentification

Ordre de priorité appliqué par agent pendant `runCopilotAttempt` :

1. **`useLoggedInUser: true` explicite** dans l’entrée de la tentative — utilise l’utilisateur connecté à la CLI Copilot sous le `copilotHome` de l’agent.
2. **`gitHubToken` explicite** dans l’entrée de la tentative (nécessite `profileId` + `profileVersion`). Pour les appels directs à la CLI et les tests devant contourner la résolution du profil d’authentification.
3. **`resolvedApiKey` + `authProfileId` résolus par le contrat** — le chemin principal en production. Le cœur résout le profil d’authentification `github-copilot` configuré pour l’agent (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) avant d’appeler le harnais, de sorte qu’un profil d’authentification `github-copilot:<profile>` fonctionne de bout en bout pour les configurations sans interface, via Cron ou à plusieurs profils, sans variables d’environnement.
4. **Repli sur les variables d’environnement**, vérifiées dans cet ordre (la première valeur non vide l’emporte ; les chaînes vides sont considérées comme absentes ; cet ordre reflète la priorité du fournisseur `github-copilot` distribué dans `extensions/github-copilot/auth.ts`) :
   1. `OPENCLAW_GITHUB_TOKEN` — remplacement propre au harnais ; permet d’associer un jeton au harnais OpenClaw sans perturber la configuration globale de `gh` / de la CLI Copilot.
   2. `COPILOT_GITHUB_TOKEN` — variable d’environnement standard du SDK / de la CLI Copilot.
   3. `GH_TOKEN` — variable d’environnement standard de la CLI `gh`.
   4. `GITHUB_TOKEN` — repli générique pour le jeton GitHub.

   L’identifiant de profil de pool synthétisé est `env:<NAME>` ; la version du profil est une empreinte sha256 non réversible du jeton, de sorte que la rotation de la valeur d’environnement invalide proprement le pool de clients.

5. **`useLoggedInUser` par défaut** lorsqu’aucun signal de jeton n’est disponible.

Chaque agent dispose de son propre `copilotHome`, afin que les jetons, sessions et configurations de la CLI Copilot ne puissent jamais fuiter entre des agents exécutés sur la même machine. Valeur par défaut : `<agentDir>/copilot` (conserve l’état du SDK hors du répertoire contenant les fichiers `models.json` / `auth-profiles.json` d’OpenClaw), ou `~/.openclaw/agents/<agentId>/copilot` lorsqu’aucun répertoire d’agent n’est fourni. Remplacez cette valeur par `copilotHome: <path>` dans l’entrée de la tentative pour utiliser un emplacement personnalisé (par exemple, un montage partagé pour une migration).

Les tests en conditions réelles du harnais utilisent `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` pour fournir directement un jeton. La configuration partagée des tests en conditions réelles efface `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` et `GITHUB_TOKEN` après avoir préparé de véritables profils d’authentification dans le répertoire personnel isolé du test. Ainsi, une valeur `gh auth token` transmise via la variable dédiée évite les ignorés injustifiés sans fuiter dans les suites sans rapport.

## Surface de configuration

Le harnais lit la configuration depuis l’entrée propre à chaque tentative (`runCopilotAttempt({...})`), ainsi que depuis un petit ensemble de valeurs d’environnement par défaut dans `extensions/copilot/src/` :

| Champ                    | Objectif                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `copilotHome`            | Répertoire d’état de la CLI propre à chaque agent (valeurs par défaut ci-dessus).                                                                                                                                                                                                                                                                             |
| `model`                  | Chaîne ou `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omettez ce champ pour utiliser la sélection de modèle normale de l’agent ; le harnais vérifie que le fournisseur résolu est pris en charge.                                                                                                                                                 |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Correspond à la résolution `ThinkLevel` / `ReasoningLevel` d’OpenClaw dans `auto-reply/thinking.ts`.                                                                                                                                                                                                                |
| `infiniteSessionConfig`  | Remplacement facultatif du bloc `infiniteSessions` du SDK piloté par `harness.compact`. Vous pouvez le laisser tel quel sans risque.                                                                                                                                                                                                                           |
| `hooksConfig`            | Configuration native facultative `SessionHooks` du SDK Copilot pour les rappels d’outil/MCP, d’invite utilisateur, de session et d’erreur. Distincte des hooks portables du cycle de vie d’OpenClaw.                                                                                                                                                            |
| `permissionPolicy`       | Remplacement facultatif du gestionnaire `onPermissionRequest` du SDK pour les types d’outils intégrés au SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). La valeur par défaut est `rejectAllPolicy` comme filet de sécurité ; voir [Autorisations et ask_user](#permissions-and-ask_user) pour comprendre pourquoi il ne se déclenche en réalité jamais. |
| `enableSessionTelemetry` | Indicateur facultatif de télémétrie de session du SDK.                                                                                                                                                                                                                                                                                                       |

Les hooks de plugin OpenClaw ne nécessitent aucune configuration de tentative propre à Copilot. Le harnais exécute `before_prompt_build` (ainsi que l’ancien hook de compatibilité `before_agent_start`), `llm_input`, `llm_output` et `agent_end` via les assistants standard du harnais. Les compactions réussies du SDK exécutent également `before_compaction` et `after_compaction`. Les outils OpenClaw reliés exécutent `before_tool_call` et signalent `after_tool_call` ; `hooksConfig` reste destiné aux rappels natifs propres au SDK sans équivalent portable.

Aucune autre partie d’OpenClaw n’a besoin de connaître ces champs. Les autres plugins, canaux et le code du cœur ne voient que la forme standard `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Lorsque `harness.compact` s’exécute, le harnais du SDK Copilot :

1. Reprend la session suivie du SDK sans poursuivre les travaux en attente.
2. Appelle la RPC de compaction de l’historique propre à la session du SDK.
3. Renvoie le résultat de la compaction du SDK sans écrire de fichiers marqueurs de compatibilité dans l’espace de travail.

Le miroir de transcription côté OpenClaw (ci-dessous) continue de recevoir les messages postérieurs à la compaction, de sorte que l’historique de discussion visible par l’utilisateur reste cohérent.

## Mise en miroir de la transcription

`runCopilotAttempt` écrit simultanément les messages pouvant être mis en miroir de chaque tour dans la transcription d’audit d’OpenClaw via `extensions/copilot/src/dual-write-transcripts.ts`. Le miroir est limité à chaque session (`copilot:${sessionId}`) et indexé par message (`${role}:${sha256_16(role,content)}`), de sorte que les entrées réémises de tours précédents entrent en collision avec les clés existantes sur disque au lieu d’être dupliquées.

Deux couches de confinement des défaillances enveloppent le miroir afin qu’un échec
d’écriture de la transcription ne fasse jamais échouer la tentative : un wrapper interne
en mode meilleur effort, complété par un `.catch(...)` de défense en profondeur au
niveau de la tentative. Les échecs sont consignés dans les journaux, sans être exposés.

## Questions annexes (`/btw`)

`/btw` n’est **pas** natif dans ce harnais. `createCopilotAgentHarness()`
laisse délibérément `harness.runSideQuestion` non défini
(comme vérifié dans `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
de sorte que le répartiteur `/btw` d’OpenClaw (`src/agents/btw.ts`) se rabat sur le
même chemin que pour chaque environnement d’exécution autre que Codex : le fournisseur
de modèle configuré est appelé directement avec une courte invite de question annexe,
puis sa réponse est retransmise en flux via `streamSimple` (aucune session CLI, aucun
emplacement supplémentaire dans le pool).

Cela réserve les sessions de la CLI Copilot à la boucle principale des tours de l’agent
et maintient un comportement de `/btw` identique à celui des autres environnements
d’exécution autres que Codex.

## Diagnostic

`extensions/copilot/doctor-contract-api.ts` est chargé automatiquement par
`src/plugins/doctor-contract-registry.ts`. Il fournit :

- Un `legacyConfigRules` vide (aucun champ retiré pour le moment).
- Un `normalizeCompatibilityConfig` sans effet (conservé afin que les futurs
  retraits de champs disposent d’un emplacement stable dans le dépôt).
- Une entrée `sessionRouteStateOwners` : fournisseur `github-copilot`,
  environnement d’exécution `copilot`, clé de session CLI `copilot`, préfixe
  de profil d’authentification `github-copilot:`.

## Limitations

- Le harnais revendique `github-copilot` ainsi que les identifiants de fournisseurs
  BYOK personnalisés sans propriétaire. Les identifiants de fournisseurs natifs
  appartenant à un manifeste restent associés à leur environnement d’exécution
  propriétaire, même lorsque `agentRuntime.id` est forcé à `copilot`.
- Aucune interface TUI ; la TUI de PI reste la solution de repli pour les
  environnements d’exécution sans interface équivalente.
- L’état de session PI n’est pas migré lorsqu’un agent passe à `copilot`.
  La sélection s’effectue pour chaque tentative ; les sessions PI existantes
  restent valides.
- `ask_user` utilise le même chemin d’invite et de réponse d’OpenClaw que le
  harnais Codex : lorsque le SDK Copilot demande une saisie utilisateur,
  OpenClaw publie une invite bloquante dans le canal actif ou la TUI, et le
  prochain message utilisateur mis en file d’attente résout la requête du SDK.

## Autorisations et ask_user

L’application des autorisations pour les outils OpenClaw reliés s’effectue
**dans le wrapper de l’outil**, et non au moyen du rappel `onPermissionRequest`
du SDK. Le même `wrapToolWithBeforeToolCallHook` que celui utilisé par PI
(`src/agents/agent-tools.before-tool-call.ts`) est appliqué par
`createOpenClawCodingTools` à chaque outil de programmation : la détection
des boucles, les politiques des Plugins approuvés, les hooks préalables aux
appels d’outils et les approbations de Plugins en deux phases via le Gateway
(`plugin.approval.request`) empruntent tous exactement le même chemin de code
que les tentatives PI natives.

L’outil du SDK renvoyé par `convertOpenClawToolToSdkTool` est marqué avec :

- `overridesBuiltInTool: true` — remplace l’outil intégré de même nom dans la
  CLI Copilot (édition, lecture, écriture, bash, etc.) afin que chaque appel
  d’outil soit redirigé vers OpenClaw.
- `skipPermission: true` — indique au SDK de ne pas déclencher
  `onPermissionRequest({kind: "custom-tool"})` avant d’appeler l’outil. La
  méthode `execute()` enveloppée effectue déjà la vérification plus complète
  de la politique OpenClaw ; une invite au niveau du SDK court-circuiterait
  l’application des règles d’OpenClaw (tout autoriser) ou bloquerait chaque
  appel d’outil (tout refuser) — aucune de ces options ne correspond à la
  parité avec PI.

Le harnais Codex du dépôt utilise la même séparation : les outils OpenClaw
reliés sont enveloppés (`extensions/codex/src/app-server/dynamic-tools.ts`) et
les propres types d’approbation natifs de `codex-app-server`
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) sont acheminés par
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L’équivalent dans le
SDK Copilot — la politique `rejectAllPolicy`, fermée par défaut, pour tout type
autre que `custom-tool` qui atteindrait `onPermissionRequest` — constitue le
même filet de sécurité. En pratique, il ne se déclenche jamais, car
`overridesBuiltInTool: true` remplace chaque outil intégré.

Pour que la couche d’outils enveloppés prenne des décisions de politique
équivalentes à celles de PI, le harnais transmet à `createOpenClawCodingTools`
l’intégralité du contexte d’outil de tentative de PI : identité
(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, etc.),
canal et routage (`groupId`, `currentChannelId`, `replyToMode`, options des
outils de messagerie), authentification (`authProfileStore`), identité
d’exécution (`sessionKey` / `runSessionKey` dérivés de `sandboxSessionKey`,
`runId`), contexte du modèle (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) et hooks d’exécution (`onToolOutcome`,
`onYield`). Sans ces champs, les listes d’autorisation réservées au
propriétaire refusent silencieusement les accès par défaut, les politiques
de confiance des Plugins ne peuvent pas déterminer la portée correcte, et
`session_status: "current"` se résout en une clé de bac à sable obsolète. Le
constructeur du pont se trouve dans `extensions/copilot/src/tool-bridge.ts`
et reproduit l’appel de référence de PI situé dans
`src/agents/embedded-agent-runner/run/attempt.ts:1262`. `runAttempt` résout
le contexte du bac à sable au moyen du point d’intégration partagé
`resolveSandboxContext`, transmet au SDK un répertoire de travail effectif,
puis fournit au pont d’outils `sandbox` ainsi que l’espace de travail de
création des sous-agents. Le pont transmet également les contrôles bornés
de construction des outils qu’il peut appliquer à la frontière du SDK :
`includeCoreTools`, la liste d’autorisation des outils de l’environnement
d’exécution et `toolConstructionPlan`.

Le pont utilise également l’utilitaire partagé de surface d’outils du harnais
provenant de `openclaw/plugin-sdk/agent-harness-tool-runtime` afin d’assurer
la parité avec PI. Lorsque la recherche d’outils est activée, le SDK voit des
outils de contrôle compacts ainsi qu’un exécuteur de catalogue masqué, au lieu
de tous les schémas d’outils OpenClaw. Lorsque le mode code est activé,
l’utilitaire construit la même surface de contrôle du mode code et le même
cycle de vie du catalogue que ceux utilisés par les autres harnais d’agents.
Les valeurs par défaut allégées pour les modèles locaux, le filtrage des
schémas compatible avec l’environnement d’exécution, l’hydratation des
répertoires et le nettoyage du catalogue restent tous dans l’utilitaire
partagé afin d’éviter toute divergence entre les harnais Copilot et ceux
apparentés à Codex.

### Jeton GitHub au niveau de la session

Le contrat du SDK Copilot distingue le jeton GitHub **au niveau du client**
(`CopilotClientOptions.gitHubToken`, qui authentifie le processus CLI lui-même)
du jeton **au niveau de la session** (`SessionConfig.gitHubToken`, qui
détermine l’exclusion de contenu, le routage du modèle et le quota pour cette
session, et qui est pris en compte par `createSession` comme par
`resumeSession`). Le harnais résout l’authentification une seule fois via
`resolveCopilotAuth` et définit les deux champs lorsque le mode
d’authentification est `gitHubToken` (un `auth.gitHubToken` explicite ou un
`resolvedApiKey` résolu par contrat à partir d’un profil d’authentification
`github-copilot` configuré). Lorsque le mode résolu est `useLoggedInUser`, le
champ au niveau de la session est omis afin que le SDK continue à déduire
l’identité à partir de l’identité connectée.

`ask_user` utilise `SessionConfig.onUserInputRequest`. Le pont accepte les
index ou les libellés de choix pour les requêtes à choix fixe, accepte les
réponses en texte libre lorsque la requête du SDK les autorise et annule une
requête en attente lorsque la tentative OpenClaw est interrompue.

## Ressources associées

- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Plugins de harnais d’agents (référence du SDK)](/fr/plugins/sdk-agent-harness)
