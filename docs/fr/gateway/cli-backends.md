---
read_when:
    - Vous souhaitez disposer d’une solution de repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez Codex CLI ou d’autres CLI d’IA locales et souhaitez les réutiliser
    - Vous voulez comprendre le pont loopback MCP pour l’accès aux outils du backend CLI
summary: 'Backends CLI : solution de repli CLI d’IA locale avec pont d’outils MCP optionnel'
title: Moteurs CLI
x-i18n:
    generated_at: "2026-05-02T20:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter des **CLI d’IA locaux** comme **solution de secours en texte uniquement** lorsque les fournisseurs d’API sont indisponibles,
soumis à des limites de débit ou se comportent temporairement de manière incorrecte. C’est volontairement conservateur :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils du Gateway via un pont MCP de bouclage.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (les tours de suivi restent donc cohérents).
- **Les images peuvent être transmises** si le CLI accepte les chemins d’image.

Cela est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses texte qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison de fil de discussion/conversation et sessions de codage externes persistantes, utilisez plutôt
[agents ACP](/fr/tools/acp-agents). Les backends CLI ne sont pas ACP.

## Démarrage rapide adapté aux débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le Plugin OpenAI intégré
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si votre Gateway s’exécute sous launchd/systemd et que PATH est minimal, ajoutez simplement le
chemin de la commande :

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

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire n’est nécessaire au-delà du CLI lui-même.

Si vous utilisez un backend CLI intégré comme **fournisseur de messages principal** sur un
hôte Gateway, OpenClaw charge maintenant automatiquement le Plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme solution de secours

Ajoutez un backend CLI à votre liste de solutions de secours afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

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

Remarques :

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez aussi y inclure vos modèles de backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw essaiera
  ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **identifiant de fournisseur** (par exemple `codex-cli`, `my-cli`).
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
          serialize: true,
        },
      },
    },
  },
}
```

## Fonctionnement

1. **Sélectionne un backend** selon le préfixe de fournisseur (`codex-cli/...`).
2. **Construit un prompt système** à l’aide du même prompt OpenClaw et du même contexte d’espace de travail.
3. **Exécute le CLI** avec un identifiant de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend `claude-cli` intégré garde un processus stdio Claude actif par
   session OpenClaw et envoie les tours de suivi via stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les identifiants de session** par backend, afin que les suivis réutilisent la même session CLI.

<Note>
Le backend Anthropic `claude-cli` intégré est de nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’usage de Claude CLI façon OpenClaw est de nouveau autorisé ; OpenClaw traite donc
l’utilisation de `claude -p` comme approuvée pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI `codex-cli` intégré transmet le prompt système d’OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas de flag
`--append-system-prompt` façon Claude ; OpenClaw écrit donc le prompt assemblé dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic `claude-cli` intégré reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact des Skills OpenClaw dans le prompt système ajouté, et
un Plugin Claude Code temporaire transmis avec `--plugin-dir`. Le Plugin contient
uniquement les Skills éligibles pour cet agent/cette session, afin que le résolveur de Skills natif
de Claude Code voie le même ensemble filtré qu’OpenClaw annoncerait autrement dans
le prompt. Les remplacements d’environnement/de clé API des Skills sont toujours appliqués par OpenClaw à
l’environnement du processus enfant pour l’exécution.

Claude CLI dispose également de son propre mode d’autorisation non interactif. OpenClaw le mappe
à la politique d’exécution existante au lieu d’ajouter une configuration propre à Claude : lorsque la
politique d’exécution effectivement demandée est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres par agent `agents.list[].tools.exec` remplacent `tools.exec` global pour
cet agent. Pour forcer un mode Claude différent, définissez des arguments backend bruts explicites
tels que `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` et les `resumeArgs` correspondants.

Avant qu’OpenClaw puisse utiliser le backend `claude-cli` intégré, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà dans `PATH`.

## Sessions

- Si le CLI prend en charge les sessions, définissez `sessionArg` (par exemple `--session-id`) ou
  `sessionArgs` (espace réservé `{sessionId}`) lorsque l’ID doit être inséré
  dans plusieurs flags.
- Si le CLI utilise une **sous-commande de reprise** avec des flags différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un identifiant de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoyer un identifiant de session uniquement s’il en a déjà été stocké un auparavant.
  - `none` : ne jamais envoyer d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude actif pendant
  qu’il l’est. Stdio chaud est maintenant la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend à partir de l’identifiant de session Claude stocké. Les identifiants de
  session stockés sont vérifiés par rapport à une transcription de projet lisible existante avant
  la reprise ; les liaisons fantômes sont donc effacées avec `reason=transcript-missing`
  au lieu de lancer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions Claude en direct conservent des gardes bornées de sortie JSONL. Les valeurs par défaut autorisent jusqu’à
  8 Mio et 20 000 lignes JSONL brutes par tour. Les tours Claude riches en outils peuvent
  les augmenter par backend avec
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  et `maxTurnLines` ; OpenClaw limite ces paramètres à 64 Mio et 100 000
  lignes.
- Les sessions CLI stockées sont une continuité appartenant au fournisseur. La réinitialisation quotidienne implicite de session
  ne les interrompt pas ; `/reset` et les politiques explicites `session.reset` le font toujours.

Remarques sur la sérialisation :

- `serialize: true` garde les exécutions d’une même voie dans l’ordre.
- La plupart des CLI sérialisent sur une seule voie de fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris un changement d’ID de profil d’authentification, de clé API statique, de jeton statique ou d’identité
  de compte OAuth lorsque le CLI en expose une. La rotation des jetons OAuth d’accès et d’actualisation
  n’interrompt pas la session CLI stockée. Si un CLI n’expose pas d’identifiant de compte OAuth
  stable, OpenClaw laisse ce CLI appliquer les autorisations de reprise.

## Préambule de secours à partir des sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non CLI dans
[`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw amorce
la tentative suivante avec un préambule de contexte extrait de la transcription JSONL locale
de Claude Code dans `~/.claude/projects/`. Sans cet amorçage, le fournisseur de secours
démarrerait à froid, car la transcription de session propre à OpenClaw est vide
pour les exécutions `claude-cli`.

- Le préambule privilégie le dernier résumé `/compact` ou marqueur `compact_boundary`,
  puis ajoute les tours postérieurs à la frontière les plus récents jusqu’à un budget de caractères.
  Les tours antérieurs à la frontière sont supprimés, car le résumé les représente déjà.
- Les blocs d’outils sont fusionnés en indications compactes `(tool call: name)` et
  `(tool result: …)` afin de préserver honnêtement le budget de prompt. Le résumé est
  étiqueté `(truncated)` s’il déborde.
- Les basculements `claude-cli` vers `claude-cli` du même fournisseur s’appuient sur le
  `--resume` propre à Claude et ignorent le préambule.
- L’amorçage réutilise la validation existante du chemin de fichier de session Claude ; les
  chemins arbitraires ne peuvent donc pas être lus.

## Images (transmission)

Si votre CLI accepte les chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins bruts.

## Entrées / sorties

- `output: "json"` (par défaut) tente d’analyser le JSON et d’extraire le texte et l’identifiant de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’utilisation depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (appartenant au Plugin)

Le Plugin OpenAI intégré enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le Plugin Google intégré enregistre aussi une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : le Gemini CLI local doit être installé et disponible sous
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques sur le JSON de Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’utilisation se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est absent, OpenClaw déduit les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Remplacez uniquement si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut appartenant au Plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- Le backend `id` devient le préfixe de fournisseur dans les références de modèles.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de la configuration propre au backend reste détenu par le Plugin via le hook optionnel
  `normalizeConfig`.

Les Plugins qui ont besoin de petits adaptateurs de compatibilité pour les invites/messages peuvent déclarer
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

`input` réécrit l’invite système et l’invite utilisateur transmises à la CLI. `output`
réécrit les deltas d’assistant diffusés et le texte final analysé avant qu’OpenClaw ne traite
ses propres marqueurs de contrôle et la livraison au canal.

Pour les CLI qui émettent du JSONL compatible avec le flux JSON Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Superpositions MCP groupées

Les backends CLI ne reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
opter pour une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement groupé actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration en ligne pour `mcp_servers` ; le serveur
  local loopback OpenClaw généré est marqué avec le mode d’approbation d’outils par serveur de Codex
  afin que les appels MCP ne puissent pas rester bloqués sur des invites d’approbation locales
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le MCP groupé est activé, OpenClaw :

- lance un serveur MCP HTTP loopback qui expose les outils Gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils à la session, au compte et au contexte de canal actuels
- charge les serveurs MCP groupés activés pour l’espace de travail actuel
- les fusionne avec toute forme de configuration/paramètres MCP backend existante
- réécrit la configuration de lancement en utilisant le mode d’intégration détenu par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte tout de même une configuration stricte lorsqu’un
backend opte pour le MCP groupé afin que les exécutions en arrière-plan restent isolées.

Les environnements d’exécution MCP groupés limités à la session sont mis en cache pour être réutilisés au sein d’une session, puis
collectés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10
minutes par défaut ; définissez `0` pour désactiver). Les exécutions intégrées ponctuelles comme les sondes d’authentification,
la génération de slug et le rappel Active Memory demandent un nettoyage en fin d’exécution afin que les
processus enfants stdio et les flux Streamable HTTP/SSE ne survivent pas à l’exécution.

## Limitations

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils Gateway que lorsqu’ils optent pour
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent du JSONL ; d’autres mettent en mémoire tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas de JSONL), ce qui est moins
  structuré que l’exécution initiale avec `--json`. Les sessions OpenClaw fonctionnent tout de même
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).

## Associé

- [Runbook Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
