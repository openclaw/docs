---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez des CLI d’IA locales et souhaitez les réutiliser
    - Vous voulez comprendre le pont de bouclage MCP pour l’accès des outils au backend CLI
summary: 'Backends CLI : recours local à la CLI d’IA avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-06-27T17:28:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de secours en texte seul** lorsque les fournisseurs d’API sont indisponibles,
soumis à des limites de débit ou se comportent temporairement de façon incorrecte. C’est volontairement conservateur :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils Gateway via un pont MCP local loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (les tours de suivi restent donc cohérents).
- **Les images peuvent être transmises** si la CLI accepte les chemins d’image.

Ceci est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses textuelles qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison de fil/conversation et sessions de codage externes persistantes, utilisez plutôt
[Agents ACP](/fr/tools/acp-agents). Les backends CLI ne sont pas ACP.

<Tip>
  Vous créez un nouveau Plugin de backend ? Utilisez
  [Plugins de backend CLI](/fr/plugins/cli-backend-plugins). Cette page s’adresse aux utilisateurs
  qui configurent et exploitent un backend déjà enregistré.
</Tip>

## Démarrage rapide adapté aux débutants

Vous pouvez utiliser Claude Code CLI **sans aucune configuration** (le Plugin Anthropic intégré
enregistre un backend par défaut) :

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` est l’identifiant d’agent par défaut lorsqu’aucune liste d’agents explicite n’est configurée. Si
vous utilisez plusieurs agents, remplacez-le par l’identifiant d’agent que vous voulez exécuter.

Si votre Gateway s’exécute sous launchd/systemd et que PATH est minimal, ajoutez uniquement le
chemin de la commande :

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI intégré comme **fournisseur de messages principal** sur un
hôte Gateway, OpenClaw charge désormais automatiquement le Plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme solution de secours

Ajoutez un backend CLI à votre liste de secours afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Remarques :

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez aussi y inclure vos modèles de backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw essaiera
  ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **identifiant de fournisseur** (par ex. `claude-cli`, `my-cli`).
L’identifiant de fournisseur devient la partie gauche de votre référence de modèle :

```
<provider>/<model>
```

### Exemple de configuration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Fonctionnement

1. **Sélectionne un backend** d’après le préfixe de fournisseur (`claude-cli/...`).
2. **Construit une invite système** avec la même invite OpenClaw + le même contexte d’espace de travail.
3. **Exécute la CLI** avec un identifiant de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend intégré `claude-cli` garde un processus stdio Claude actif par
   session OpenClaw et envoie les tours de suivi via stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les identifiants de session** par backend, afin que les suivis réutilisent la même session CLI.

<Note>
Le backend Anthropic intégré `claude-cli` est de nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est de nouveau autorisé ; OpenClaw considère donc
l’usage de `claude -p` comme approuvé pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend Anthropic intégré `claude-cli` privilégie le résolveur de skill natif de Claude Code
pour les Skills OpenClaw. Lorsque l’instantané de Skills actuel inclut au moins
une skill sélectionnée avec un chemin matérialisé, OpenClaw transmet un Plugin Claude
Code temporaire avec `--plugin-dir` et omet le catalogue de Skills OpenClaw dupliqué
de l’invite système ajoutée. Si l’instantané n’a aucune skill Plugin matérialisée,
OpenClaw conserve le catalogue d’invite comme solution de secours. Les remplacements d’environnement/de clé d’API de skill
sont toujours appliqués par OpenClaw à l’environnement du processus enfant pour
l’exécution.

Claude CLI possède également son propre mode d’autorisation non interactif. OpenClaw le mappe
à la politique d’exécution existante au lieu d’ajouter une configuration de politique propre à Claude.
Pour les sessions live Claude gérées par OpenClaw, la politique d’exécution OpenClaw effective fait
autorité : YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`) lance Claude avec
`--permission-mode bypassPermissions`, tandis qu’une politique d’exécution effective restrictive
lance Claude avec `--permission-mode default`. Les paramètres par agent
`agents.list[].tools.exec` remplacent `tools.exec` global pour cet
agent. Les args bruts du backend Claude peuvent toujours inclure `--permission-mode`, mais les lancements live
de Claude normalisent ce drapeau pour correspondre à la politique d’exécution OpenClaw effective.

Le backend Anthropic intégré `claude-cli` mappe aussi les niveaux `/think` d’OpenClaw
au drapeau natif `--effort` de Claude Code pour les niveaux non désactivés. `minimal` et
`low` correspondent à `low`, `adaptive` et `medium` correspondent à `medium`, et `high`,
`xhigh` et `max` correspondent directement. Les autres backends CLI nécessitent que leur Plugin propriétaire
déclare un mappeur argv équivalent avant que `/think` puisse affecter la CLI lancée.

Avant qu’OpenClaw puisse utiliser le backend intégré `claude-cli`, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Les installations Docker nécessitent que Claude Code soit installé et connecté dans le répertoire personnel persistant
du conteneur, pas seulement sur l’hôte. Consultez
[Backend Claude CLI dans Docker](/fr/install/docker#claude-cli-backend-in-docker).

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà dans `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) lorsque l’identifiant doit être inséré
  dans plusieurs drapeaux.
- Si la CLI utilise une **sous-commande de reprise** avec des drapeaux différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un identifiant de session (nouvel UUID si aucun n’est stocké).
  - `existing` : n’envoyer un identifiant de session que si un a été stocké auparavant.
  - `none` : ne jamais envoyer d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude live tant
  qu’il est actif. Le stdio chaud est désormais la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend à partir de l’identifiant de session Claude stocké. Les identifiants de session
  stockés sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, de sorte que les liaisons fantômes sont effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions live Claude conservent des garde-fous de sortie JSONL bornés. Les valeurs par défaut autorisent jusqu’à
  8 Mio et 20 000 lignes JSONL brutes par tour. Les tours Claude très chargés en outils peuvent les augmenter
  par backend avec
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  et `maxTurnLines` ; OpenClaw borne ces paramètres à 64 Mio et 100 000
  lignes.
- Les sessions CLI stockées constituent une continuité détenue par le fournisseur. La réinitialisation quotidienne implicite de session
  ne les coupe pas ; `/reset` et les politiques explicites `session.reset` le font toujours.
- Les nouvelles sessions CLI se réamorcent normalement uniquement depuis le résumé de Compaction d’OpenClaw
  plus la fin post-Compaction. Pour récupérer des sessions courtes invalidées
  avant la Compaction, un backend peut s’inscrire avec
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw garde toujours le réamorçage de transcription brute
  borné et le limite aux invalidations sûres, comme les transcriptions CLI manquantes,
  les changements d’invite système/MCP ou une nouvelle tentative après expiration de session ; les changements de profil
  d’authentification ou d’époque d’identifiants ne réamorcent jamais l’historique brut de transcription.

Notes de sérialisation :

- `serialize: true` garde les exécutions sur la même voie dans l’ordre.
- La plupart des CLI sérialisent sur une seule voie fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris un identifiant de profil d’authentification modifié, une clé d’API statique, un jeton statique ou l’identité
  de compte OAuth lorsque la CLI en expose une. La rotation des jetons d’accès et d’actualisation OAuth
  ne coupe pas la session CLI stockée. Si une CLI n’expose pas d’identifiant de compte OAuth
  stable, OpenClaw laisse cette CLI appliquer les autorisations de reprise.

## Prélude de secours depuis les sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non CLI dans
[`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw amorce
la tentative suivante avec un prélude de contexte extrait de la transcription JSONL locale
de Claude Code à `~/.claude/projects/`. Sans cet amorçage, le fournisseur de secours
démarrerait à froid, car la propre transcription de session d’OpenClaw est vide
pour les exécutions `claude-cli`.

- Le prélude privilégie le dernier résumé `/compact` ou marqueur `compact_boundary`,
  puis ajoute les tours post-frontière les plus récents jusqu’à un budget
  de caractères. Les tours pré-frontière sont supprimés, car le résumé les représente déjà.
- Les blocs d’outils sont fusionnés en indications compactes `(tool call: name)` et
  `(tool result: …)` afin de préserver honnêtement le budget d’invite. Le résumé est
  marqué `(truncated)` s’il déborde.
- Les secours `claude-cli` vers `claude-cli` avec le même fournisseur s’appuient sur le propre
  `--resume` de Claude et ignorent le prélude.
- L’amorçage réutilise la validation existante du chemin de fichier de session Claude, de sorte que
  des chemins arbitraires ne peuvent pas être lus.

## Images (transmission)

Si votre CLI accepte les chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers à l’invite (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux depuis des chemins en texte brut.

## Entrées / sorties

- `output: "json"` (par défaut) tente d’analyser le JSON et d’extraire le texte + l’identifiant de session.
- Pour la sortie JSON Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et l’utilisation
  depuis `stats` lorsque `usage` est absent ou vide. La valeur par défaut intégrée de Gemini CLI
  utilise `stream-json`, mais les anciens remplacements `--output-format json` utilisent toujours l’analyseur
  JSON.
- `output: "jsonl"` analyse les flux JSONL et extrait le message final de l’agent ainsi que les identifiants
  de session lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le Plugin)

Les valeurs par défaut des backends CLI groupés résident avec leur Plugin propriétaire. Par exemple,
Anthropic possède `claude-cli` et Google possède `google-gemini-cli`. Les exécutions d’agent OpenAI Codex
utilisent le harnais de serveur d’application Codex via `openai/*` ; OpenClaw
n’enregistre plus de backend `codex-cli` groupé.

Le Plugin Anthropic groupé enregistre une valeur par défaut pour `claude-cli` :

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Le Plugin Google groupé enregistre également une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : la CLI Gemini locale doit être installée et disponible en tant que
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Notes sur la sortie de Gemini CLI :

- Le parseur `stream-json` par défaut lit les événements assistant `message`, les événements d’outils,
  l’utilisation finale `result` et les événements d’erreur Gemini fatale.
- Si vous remplacez les arguments Gemini par `--output-format json`, OpenClaw normalise ce
  backend à nouveau vers `output: "json"` et lit le texte de réponse depuis le champ JSON `response`.
- L’utilisation se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est manquant, OpenClaw déduit les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Ne remplacez ces valeurs que si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut détenues par le Plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe du fournisseur dans les références de modèles.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de configuration propre au backend reste détenu par le Plugin via le hook facultatif
  `normalizeConfig`.

Les Plugins qui ont besoin de petites cales de compatibilité pour les prompts/messages peuvent déclarer
des transformations de texte bidirectionnelles sans remplacer un fournisseur ni un backend CLI :

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` réécrit le prompt système et le prompt utilisateur transmis à la CLI. `output`
réécrit les deltas d’assistant diffusés en streaming et le texte final analysé avant qu’OpenClaw ne traite
ses propres marqueurs de contrôle et la livraison au canal.

Pour les CLI qui émettent des événements JSONL propres au fournisseur, définissez `jsonlDialect` dans la
configuration de ce backend. Les dialectes pris en charge sont `claude-stream-json` pour les flux compatibles avec Claude
Code et `gemini-stream-json` pour les événements `stream-json` de Gemini CLI.

## Propriété de la compaction native

Certains backends CLI exécutent un agent qui compacte sa **propre** transcription ; OpenClaw ne doit donc
pas exécuter son récapitulateur de protection contre eux : cela entre en conflit avec la propre
compaction du backend et peut faire échouer brutalement le tour.

`claude-cli` n’a pas d’endpoint de harnais : Claude Code compacte en interne ; il déclare donc
`ownsNativeCompaction: true`, et OpenClaw renvoie une opération sans effet depuis le chemin de compaction.
Les sessions de harnais natives telles que Codex continuent plutôt d’être routées vers leur endpoint de compaction de harnais.

Comme le backend possède la compaction, l’ancien palliatif qui consistait à définir
`contextTokens: 1_000_000` uniquement pour empêcher la protection d’OpenClaw de se déclencher sur une
session claude-cli n’est **plus nécessaire** : l’opt-out le remplace.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Ne déclarez `ownsNativeCompaction` que pour un backend qui possède réellement sa compaction : il
doit limiter de manière fiable sa propre transcription lorsqu’elle approche de sa fenêtre de contexte et conserver une
session reprenable (par ex. `--resume` / `--session-id`) ; sinon une session différée peut
rester au-dessus du budget. Les sessions `agentHarnessId` correspondantes restent routées vers l’endpoint du harnais.

## Superpositions MCP de bundle

Les backends CLI ne reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
opter pour une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement groupé actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le bundle MCP est activé, OpenClaw :

- démarre un serveur MCP HTTP local loopback qui expose les outils du Gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils au contexte de la session, du compte et du canal actuels
- charge les serveurs bundle-MCP activés pour l’espace de travail actuel
- les fusionne avec toute forme de configuration/paramètres MCP existante du backend
- réécrit la configuration de lancement en utilisant le mode d’intégration détenu par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte quand même une configuration stricte lorsqu’un
backend opte pour le bundle MCP afin que les exécutions en arrière-plan restent isolées.

Les runtimes MCP groupés à portée de session sont mis en cache pour être réutilisés au sein d’une session, puis
supprimés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10
minutes par défaut ; définissez `0` pour désactiver). Les exécutions intégrées ponctuelles comme les sondes d’authentification,
la génération de slugs et le rappel Active Memory demandent un nettoyage en fin d’exécution afin que les enfants stdio
et les flux Streamable HTTP/SSE ne survivent pas à l’exécution.

## Limite d’historique de réamorçage

Lorsqu’une nouvelle session CLI est amorcée à partir d’une transcription OpenClaw antérieure (par
exemple après une nouvelle tentative `session_expired`), le bloc
`<conversation_history>` rendu est plafonné afin d’éviter que les prompts de réamorçage
n’explosent. La valeur par défaut est de `12288` caractères (environ 3000 jetons).

Les backends Claude CLI utilisent automatiquement une limite plus élevée dérivée du palier de contexte
Claude résolu. Les exécutions Claude standard à 200K jetons conservent une tranche de transcription
plus importante, et les exécutions Claude à 1M de jetons conservent une tranche encore plus importante, tandis que les autres backends CLI
conservent la valeur par défaut prudente.

- La limite ne régit que le bloc d’historique antérieur du prompt de réamorçage. Les limites de sortie
  des sessions actives sont réglées séparément sous `reliability.outputLimits`
  (voir [Sessions](#sessions)).

## Limites

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils du Gateway que lorsqu’ils optent pour
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent du JSONL ; d’autres mettent en mémoire tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON de la CLI.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none`.
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).

## Connexe

- [Runbook Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
