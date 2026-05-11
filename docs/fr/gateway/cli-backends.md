---
read_when:
    - Vous voulez une solution de repli fiable en cas de défaillance des fournisseurs d’API
    - Vous exécutez Codex CLI ou d’autres CLI d’IA locaux et souhaitez les réutiliser
    - Vous voulez comprendre le pont de bouclage MCP pour l’accès aux outils backend de la CLI
summary: 'Backends CLI : repli vers une CLI d’IA locale avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-05-11T20:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de secours en texte seul** lorsque les fournisseurs d’API sont indisponibles,
soumis à des limites de débit ou se comportent temporairement mal. C’est volontairement conservateur :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils du Gateway via un pont MCP local loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (ainsi, les tours de suivi restent cohérents).
- **Les images peuvent être transmises** si la CLI accepte les chemins d’image.

Ceci est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses textuelles qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison de fil/conversation et sessions de codage externes persistantes, utilisez plutôt
[Agents ACP](/fr/tools/acp-agents). Les backends CLI ne sont pas ACP.

<Tip>
  Vous créez un nouveau plugin de backend ? Utilisez
  [Plugins de backend CLI](/fr/plugins/cli-backend-plugins). Cette page s’adresse aux utilisateurs
  qui configurent et exploitent un backend déjà enregistré.
</Tip>

## Démarrage rapide pour débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le plugin OpenAI groupé
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si votre Gateway s’exécute sous launchd/systemd et que PATH est minimal, ajoutez seulement le
chemin de commande :

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI groupé comme **fournisseur de messages principal** sur un
hôte Gateway, OpenClaw charge maintenant automatiquement le plugin groupé propriétaire lorsque votre configuration
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
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Notes :

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez aussi y inclure vos modèles de backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, expirations), OpenClaw essaiera
  ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **id de fournisseur** (par exemple `codex-cli`, `my-cli`).
L’id de fournisseur devient la partie gauche de votre référence de modèle :

```
<provider>/<model>
```

### Exemple de configuration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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

1. **Sélectionne un backend** en fonction du préfixe du fournisseur (`codex-cli/...`).
2. **Construit une invite système** avec la même invite OpenClaw et le même contexte d’espace de travail.
3. **Exécute la CLI** avec un id de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend `claude-cli` groupé garde un processus stdio Claude actif par
   session OpenClaw et envoie les tours de suivi sur stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les ids de session** par backend, afin que les suivis réutilisent la même session CLI.

<Note>
Le backend Anthropic `claude-cli` groupé est de nouveau pris en charge. Des membres d’Anthropic
nous ont indiqué que l’usage de Claude CLI dans le style OpenClaw est à nouveau autorisé ; OpenClaw traite donc
l’usage de `claude -p` comme approuvé pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI `codex-cli` groupé transmet l’invite système d’OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas de drapeau de style Claude
`--append-system-prompt`, donc OpenClaw écrit l’invite assemblée dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic `claude-cli` groupé reçoit l’instantané des Skills OpenClaw
de deux manières : le catalogue compact de Skills OpenClaw dans l’invite système ajoutée, et
un plugin Claude Code temporaire passé avec `--plugin-dir`. Le plugin contient
uniquement les Skills éligibles pour cet agent/cette session, afin que le résolveur de Skills natif de Claude Code
voie le même ensemble filtré qu’OpenClaw annoncerait autrement dans
l’invite. Les substitutions d’env/clé API des Skills sont toujours appliquées par OpenClaw à
l’environnement du processus enfant pour l’exécution.

Claude CLI dispose également de son propre mode d’autorisation non interactif. OpenClaw le mappe
sur la politique d’exécution existante au lieu d’ajouter une configuration spécifique à Claude : lorsque la
politique d’exécution demandée effective est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres par agent `agents.list[].tools.exec` remplacent `tools.exec` global pour
cet agent. Pour forcer un autre mode Claude, définissez des arguments backend bruts explicites
tels que `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` et les `resumeArgs` correspondants.

Le backend Anthropic `claude-cli` groupé mappe aussi les niveaux OpenClaw `/think`
sur le drapeau natif `--effort` de Claude Code pour les niveaux non désactivés. `minimal` et
`low` correspondent à `low`, `adaptive` et `medium` correspondent à `medium`, et `high`,
`xhigh` et `max` correspondent directement. Les autres backends CLI nécessitent que leur plugin propriétaire
déclare un mappeur argv équivalent avant que `/think` puisse affecter la CLI lancée.

Avant qu’OpenClaw puisse utiliser le backend `claude-cli` groupé, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà sur `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par exemple `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) lorsque l’ID doit être inséré
  dans plusieurs drapeaux.
- Si la CLI utilise une **sous-commande de reprise** avec des drapeaux différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un id de session (nouvel UUID si aucun n’est stocké).
  - `existing` : n’envoyer un id de session que si un a déjà été stocké.
  - `none` : ne jamais envoyer d’id de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude actif pendant
  qu’il est actif. Le stdio chaud est maintenant le comportement par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend depuis l’id de session Claude stocké. Les ids de session stockés
  sont vérifiés par rapport à une transcription de projet lisible existante avant
  la reprise, afin que les liaisons fantômes soient effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions Claude en direct conservent des garde-fous bornés pour la sortie JSONL. Les valeurs par défaut autorisent jusqu’à
  8 MiB et 20 000 lignes JSONL brutes par tour. Les tours Claude intensifs en outils peuvent les augmenter
  par backend avec
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  et `maxTurnLines` ; OpenClaw borne ces paramètres à 64 MiB et 100 000
  lignes.
- Les sessions CLI stockées sont une continuité détenue par le fournisseur. La réinitialisation quotidienne implicite de session
  ne les coupe pas ; `/reset` et les politiques explicites `session.reset` le font toujours.
- Les nouvelles sessions CLI ne réensemencent normalement qu’à partir du résumé de compaction d’OpenClaw
  plus la queue post-compaction. Pour récupérer de courtes sessions invalidées
  avant la compaction, un backend peut choisir cette option avec
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw garde malgré tout le réensemencement de transcription brute
  borné et le limite aux invalidations sûres telles que les transcriptions CLI manquantes,
  les changements d’invite système/MCP ou les nouvelles tentatives après expiration de session ; les changements de profil
  d’authentification ou d’époque d’identifiants ne réensemencent jamais l’historique de transcription brute.

Notes de sérialisation :

- `serialize: true` garde les exécutions d’une même voie dans l’ordre.
- La plupart des CLI se sérialisent sur une voie de fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris un id de profil d’authentification modifié, une clé API statique, un jeton statique ou une identité
  de compte OAuth lorsque la CLI en expose une. La rotation des jetons d’accès et d’actualisation OAuth
  ne coupe pas la session CLI stockée. Si une CLI n’expose pas d’id de compte OAuth
  stable, OpenClaw laisse cette CLI appliquer les autorisations de reprise.

## Préambule de secours depuis les sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non CLI dans
[`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw ensemence
la tentative suivante avec un préambule de contexte récolté depuis la transcription JSONL locale
de Claude Code à `~/.claude/projects/`. Sans cette graine, le fournisseur de secours
démarrerait à froid, car la transcription de session propre à OpenClaw est vide
pour les exécutions `claude-cli`.

- Le préambule préfère le dernier résumé `/compact` ou marqueur `compact_boundary`,
  puis ajoute les tours post-frontière les plus récents jusqu’à un budget de caractères.
  Les tours pré-frontière sont supprimés, car le résumé les représente déjà.
- Les blocs d’outils sont coalescés en indications compactes `(tool call: name)` et
  `(tool result: …)` pour préserver honnêtement le budget de l’invite. Le résumé est
  étiqueté `(truncated)` s’il déborde.
- Les bascules `claude-cli` vers `claude-cli` du même fournisseur s’appuient sur le propre
  `--resume` de Claude et ignorent le préambule.
- La graine réutilise la validation existante du chemin de fichier de session Claude, donc
  les chemins arbitraires ne peuvent pas être lus.

## Images (transmission)

Si votre CLI accepte les chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont passés comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers à l’invite (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux depuis des chemins en texte brut.

## Entrées / sorties

- `output: "json"` (par défaut) essaie d’analyser le JSON et d’extraire le texte + l’id de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’utilisation depuis `stats` lorsque `usage` est manquant ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les identifiants
  de session lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) passe l’invite comme dernier argument CLI.
- `input: "stdin"` envoie l’invite via stdin.
- Si l’invite est très longue et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le plugin)

Le plugin OpenAI groupé enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le Plugin Google intégré enregistre également une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : le CLI Gemini local doit être installé et disponible sous le nom
`gemini` dans le `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Notes sur le JSON du CLI Gemini :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’utilisation se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est manquant, OpenClaw déduit les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Remplacez seulement si nécessaire (cas courant : chemin absolu de `command`).

## Valeurs par défaut propres aux Plugins

Les valeurs par défaut du backend CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe du fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de configuration propre au backend reste géré par le Plugin via le hook facultatif
  `normalizeConfig`.

Les Plugins qui ont besoin de petits adaptateurs de compatibilité pour les prompts/messages peuvent déclarer
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

`input` réécrit le prompt système et le prompt utilisateur transmis au CLI. `output`
réécrit les deltas d’assistant diffusés et le texte final analysé avant qu’OpenClaw ne traite
ses propres marqueurs de contrôle et la livraison au canal.

Pour les CLI qui émettent du JSONL compatible avec `stream-json` de Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Superpositions MCP groupées

Les backends CLI ne reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
activer une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement intégré actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration en ligne pour `mcp_servers` ; le serveur
  loopback OpenClaw généré est marqué avec le mode d’approbation d’outil par serveur de Codex
  afin que les appels MCP ne puissent pas rester bloqués sur des invites d’approbation locales
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le MCP groupé est activé, OpenClaw :

- lance un serveur MCP HTTP loopback qui expose les outils Gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils au contexte de la session, du compte et du canal actuels
- charge les serveurs MCP groupés activés pour l’espace de travail actuel
- les fusionne avec toute forme de configuration/paramètres MCP de backend existante
- réécrit la configuration de lancement à l’aide du mode d’intégration propre au backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte quand même une configuration stricte lorsqu’un
backend active le MCP groupé afin que les exécutions en arrière-plan restent isolées.

Les runtimes MCP intégrés à portée de session sont mis en cache pour réutilisation dans une session, puis
nettoyés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10
minutes par défaut ; définissez `0` pour désactiver). Les exécutions intégrées ponctuelles, comme les sondes d’authentification,
la génération de slugs et le rappel Active Memory, demandent un nettoyage à la fin de l’exécution afin que les
enfants stdio et les flux Streamable HTTP/SSE ne survivent pas à l’exécution.

## Limites

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils Gateway que lorsqu’ils activent
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent du JSONL ; d’autres mettent en mémoire tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON du CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (sans JSONL), ce qui est moins
  structuré que l’exécution initiale avec `--json`. Les sessions OpenClaw fonctionnent tout de même
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Pas de continuité de session** : vérifiez que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que le CLI prend en charge les chemins de fichier).

## Associé

- [Runbook Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
