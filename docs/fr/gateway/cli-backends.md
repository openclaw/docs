---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d’API échouent.
    - Vous utilisez Codex CLI ou d’autres CLI d’IA locales et souhaitez les réutiliser.
    - Vous souhaitez comprendre le pont MCP en local loopback pour l’accès aux outils du backend CLI.
summary: 'Backends CLI : solution de repli CLI d’IA locale avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-04-23T14:55:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends CLI (runtime de repli)

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de repli texte uniquement** lorsque les fournisseurs d’API sont indisponibles,
limités par le débit, ou temporairement défaillants. C’est volontairement prudent :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils Gateway via un pont MCP en local loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (afin que les tours suivants restent cohérents).
- **Les images peuvent être transmises** si la CLI accepte les chemins d’image.

Ceci est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses texte qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison thread/conversation et sessions de codage externes persistantes, utilisez
[ACP Agents](/fr/tools/acp-agents) à la place. Les backends CLI ne sont pas ACP.

## Démarrage rapide, adapté aux débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le Plugin OpenAI fourni
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
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

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire n’est nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI fourni comme **fournisseur principal de messages** sur un
hôte Gateway, OpenClaw charge désormais automatiquement le plugin fourni propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme solution de repli

Ajoutez un backend CLI à votre liste de repli afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Remarques :

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez aussi y inclure les modèles de votre backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’attente), OpenClaw essaiera
  ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **id de fournisseur** (par ex. `codex-cli`, `my-cli`).
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
          // Les CLI de type Codex peuvent à la place pointer vers un fichier de prompt :
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

1. **Sélectionne un backend** en fonction du préfixe du fournisseur (`codex-cli/...`).
2. **Construit un prompt système** à l’aide du même prompt OpenClaw + contexte d’espace de travail.
3. **Exécute la CLI** avec un id de session (si pris en charge) afin de conserver un historique cohérent.
   Le backend `claude-cli` fourni maintient un processus Claude stdio actif par
   session OpenClaw et envoie les tours suivants via stream-json sur stdin.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Conserve les ids de session** par backend, afin que les tours suivants réutilisent la même session CLI.

<Note>
Le backend Anthropic `claude-cli` fourni est de nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’utilisation de Claude CLI dans le style OpenClaw est de nouveau autorisée, donc OpenClaw considère
l’utilisation de `claude -p` comme approuvée pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI `codex-cli` fourni transmet le prompt système d’OpenClaw via
le remplacement de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas un indicateur de type Claude
`--append-system-prompt`, donc OpenClaw écrit le prompt assemblé dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic `claude-cli` fourni reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact de Skills OpenClaw dans le prompt système ajouté, et
un Plugin Claude Code temporaire transmis avec `--plugin-dir`. Le plugin ne contient
que les Skills éligibles pour cet agent/cette session, afin que le résolveur de Skills natif de Claude Code
voie le même ensemble filtré que celui qu’OpenClaw annoncerait autrement dans
le prompt. Les remplacements d’env/API key des Skills sont toujours appliqués par OpenClaw à l’environnement du processus enfant pour l’exécution.

Avant qu’OpenClaw puisse utiliser le backend `claude-cli` fourni, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà sur `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (espace réservé `{sessionId}`) lorsque l’id doit être inséré
  dans plusieurs indicateurs.
- Si la CLI utilise une **sous-commande de reprise** avec des indicateurs différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : envoie toujours un id de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoie un id de session uniquement si un id a déjà été stocké.
  - `none` : n’envoie jamais d’id de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours suivants réutilisent le processus Claude actif tant
  qu’il est actif. Le stdio chaud est désormais le comportement par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si la Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend à partir de l’id de session Claude stocké. Les ids de session stockés
  sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, afin que les liaisons fantômes soient effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions CLI stockées assurent une continuité gérée par le fournisseur. La réinitialisation implicite quotidienne de session
  ne les interrompt pas ; `/reset` et les politiques explicites `session.reset`, si.

Remarques sur la sérialisation :

- `serialize: true` conserve l’ordre des exécutions sur la même voie.
- La plupart des CLI sérialisent sur une seule voie de fournisseur.
- OpenClaw abandonne la réutilisation d’une session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris un id de profil d’authentification modifié, une API key statique, un token statique,
  ou l’identité du compte OAuth lorsque la CLI en expose une. La rotation des tokens d’accès
  et de rafraîchissement OAuth n’interrompt pas la session CLI stockée. Si une CLI n’expose pas
  un id de compte OAuth stable, OpenClaw laisse cette CLI faire respecter les autorisations de reprise.

## Images (transmission directe)

Si votre CLI accepte les chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont passés comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute
les chemins de fichiers au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins simples.

## Entrées / sorties

- `output: "json"` (par défaut) essaie d’analyser le JSON et d’extraire le texte + l’id de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’usage depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (gérées par le plugin)

Le Plugin OpenAI fourni enregistre également une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le Plugin Google fourni enregistre également une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : la Gemini CLI locale doit être installée et disponible comme
`gemini` sur `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques sur le JSON de Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’usage se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé dans OpenClaw en `cacheRead`.
- Si `stats.input` est absent, OpenClaw dérive les tokens d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Remplacez uniquement si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut gérées par le plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du plugin :

- Les plugins les enregistrent avec `api.registerCliBackend(...)`.
- Le `id` du backend devient le préfixe du fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du plugin.
- Le nettoyage de configuration spécifique au backend reste géré par le plugin via le hook optionnel
  `normalizeConfig`.

Les plugins qui ont besoin de petites couches de compatibilité de prompt/message peuvent déclarer
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

`input` réécrit le prompt système et le prompt utilisateur passés à la CLI. `output`
réécrit les deltas de streaming de l’assistant et le texte final analysé avant qu’OpenClaw ne traite
ses propres marqueurs de contrôle et la remise au canal.

Pour les CLI qui émettent du JSONL compatible avec le stream-json de Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Overlays Bundle MCP

Les backends CLI ne reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
choisir une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement fourni actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration inline pour `mcp_servers`
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque Bundle MCP est activé, OpenClaw :

- lance un serveur MCP HTTP en local loopback qui expose les outils Gateway au processus CLI
- authentifie le pont avec un token par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils à la session, au compte et au contexte de canal en cours
- charge les serveurs bundle-MCP activés pour l’espace de travail courant
- les fusionne avec toute forme existante de configuration/paramètres MCP du backend
- réécrit la configuration de lancement à l’aide du mode d’intégration géré par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte quand même une configuration stricte lorsqu’un
backend choisit Bundle MCP afin que les exécutions en arrière-plan restent isolées.

## Limitations

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils Gateway que lorsqu’ils choisissent
  `bundleMcp: true`.
- **Le streaming est spécifique au backend.** Certains backends diffusent en JSONL ; d’autres mettent en tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas de JSONL), ce qui est moins
  structuré que l’exécution initiale avec `--json`. Les sessions OpenClaw continuent de fonctionner
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).
