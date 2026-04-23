---
read_when:
    - Vous voulez un repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez Codex CLI ou d’autres CLI IA locales et voulez les réutiliser
    - Vous voulez comprendre la passerelle MCP loopback pour l’accès aux outils depuis un backend CLI
summary: 'Backends CLI : repli CLI IA local avec passerelle d’outils MCP optionnelle'
title: Backends CLI
x-i18n:
    generated_at: "2026-04-23T07:03:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends CLI (runtime de repli)

OpenClaw peut exécuter des **CLI IA locales** comme **repli texte uniquement** lorsque les fournisseurs d’API sont indisponibles,
soumis à une limitation de débit ou temporairement défaillants. Cette approche est volontairement prudente :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir des outils Gateway via une passerelle MCP loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (ainsi les tours de suivi restent cohérents).
- **Les images peuvent être transmises** si la CLI accepte des chemins d’image.

Ceci est conçu comme un **filet de sécurité** plutôt qu’un chemin principal. Utilisez-le lorsque vous
voulez des réponses texte « qui fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches d’arrière-plan,
liaison thread/conversation et sessions de codage externes persistantes, utilisez plutôt
[ACP Agents](/fr/tools/acp-agents). Les backends CLI ne sont pas ACP.

## Démarrage rapide convivial pour les débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le plugin OpenAI inclus
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

Si vous utilisez un backend CLI inclus comme **fournisseur principal de messages** sur un
hôte Gateway, OpenClaw charge désormais automatiquement le plugin inclus propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## Utilisation comme repli

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

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez y inclure aussi vos modèles de backend CLI.
- Si le fournisseur principal échoue (authentification, limitations de débit, délais d’expiration), OpenClaw essaiera
  ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **identifiant de fournisseur** (par ex. `codex-cli`, `my-cli`).
L’identifiant du fournisseur devient la partie gauche de votre référence de modèle :

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

1. **Sélectionne un backend** selon le préfixe du fournisseur (`codex-cli/...`).
2. **Construit un prompt système** en utilisant le même prompt OpenClaw + contexte d’espace de travail.
3. **Exécute la CLI** avec un identifiant de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend inclus `claude-cli` maintient en vie un processus Claude stdio par
   session OpenClaw et envoie les tours de suivi via stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Conserve les identifiants de session** par backend, de sorte que les suivis réutilisent la même session CLI.

<Note>
Le backend inclus Anthropic `claude-cli` est de nouveau pris en charge. Le personnel d’Anthropic
nous a dit que l’utilisation de Claude CLI dans le style OpenClaw est de nouveau autorisée, donc OpenClaw considère
l’usage de `claude -p` comme approuvé pour cette intégration à moins qu’Anthropic ne publie
une nouvelle politique.
</Note>

Le backend inclus OpenAI `codex-cli` transmet le prompt système OpenClaw via
le remplacement de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas d’indicateur de type Claude
`--append-system-prompt`, donc OpenClaw écrit le prompt assemblé dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend inclus Anthropic `claude-cli` reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact des Skills OpenClaw dans le prompt système ajouté, et
un plugin Claude Code temporaire passé avec `--plugin-dir`. Le plugin contient
uniquement les Skills admissibles pour cet agent/cette session, de sorte que le résolveur natif de Skills de Claude Code
voit le même ensemble filtré que celui qu’OpenClaw annoncerait autrement dans le
prompt. Les remplacements de variables d’environnement/API key des Skills sont toujours appliqués par OpenClaw à l’environnement du processus enfant pour l’exécution.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (espace réservé `{sessionId}`) lorsque l’identifiant doit être inséré
  dans plusieurs indicateurs.
- Si la CLI utilise une **sous-commande de reprise** avec des indicateurs différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : envoie toujours un identifiant de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoie un identifiant de session uniquement si un identifiant a déjà été stocké.
  - `none` : n’envoie jamais d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude live pendant
  qu’il est actif. Le stdio à chaud est désormais le comportement par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si la Gateway redémarre ou que le processus inactif
  s’arrête, OpenClaw reprend à partir de l’identifiant de session Claude stocké. Les identifiants de session
  stockés sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, afin que les liaisons fantômes soient supprimées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions CLI stockées sont une continuité détenue par le fournisseur. La réinitialisation implicite
  quotidienne de session ne les coupe pas ; `/reset` et les politiques explicites `session.reset`, si.

Remarques sur la sérialisation :

- `serialize: true` maintient les exécutions du même canal dans l’ordre.
- La plupart des CLI sérialisent sur un seul canal fournisseur.
- OpenClaw abandonne la réutilisation d’une session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris en cas de changement d’identifiant de profil d’authentification, de clé API statique, de jeton statique ou d’identité de compte OAuth
  lorsque la CLI en expose une. La rotation des jetons d’accès et de rafraîchissement OAuth
  ne coupe pas la session CLI stockée. Si une CLI n’expose pas un identifiant de compte OAuth
  stable, OpenClaw laisse cette CLI appliquer les autorisations de reprise.

## Images (transmission directe)

Si votre CLI accepte des chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont passés comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute
les chemins de fichier au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins simples.

## Entrées / sorties

- `output: "json"` (par défaut) tente d’analyser du JSON et d’extraire le texte + l’identifiant de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’usage depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse des flux JSONL (par exemple Codex CLI `--json`) et extrait le message agent final ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) passe le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le plugin)

Le plugin OpenAI inclus enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le plugin Google inclus enregistre aussi une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : la CLI Gemini locale doit être installée et disponible sous
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques sur le JSON Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’usage revient à `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est absent, OpenClaw dérive les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Ne remplacez que si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut détenues par le plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du plugin :

- Les plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du plugin.
- Le nettoyage de configuration spécifique au backend reste détenu par le plugin via le hook
  optionnel `normalizeConfig`.

Les plugins qui ont besoin de petites couches de compatibilité prompt/message peuvent déclarer
des transformations de texte bidirectionnelles sans remplacer un fournisseur ou un backend CLI :

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
réécrit les deltas assistant diffusés et le texte final analysé avant qu’OpenClaw ne gère
ses propres marqueurs de contrôle et la livraison sur canal.

Pour les CLI qui émettent du JSONL compatible avec le stream-json Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Superpositions bundle MCP

Les backends CLI **ne** reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
activer une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement inclus actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration en ligne pour `mcp_servers`
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque bundle MCP est activé, OpenClaw :

- lance un serveur MCP HTTP loopback qui expose les outils Gateway au processus CLI
- authentifie la passerelle avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils à la session, au compte et au contexte de canal courants
- charge les serveurs bundle-MCP activés pour l’espace de travail courant
- les fusionne avec toute forme de configuration/paramètres MCP backend existante
- réécrit la configuration de lancement à l’aide du mode d’intégration détenu par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte tout de même une configuration stricte lorsqu’un
backend active bundle MCP afin que les exécutions d’arrière-plan restent isolées.

## Limites

- **Pas d’appels directs aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils Gateway que lorsqu’ils activent
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent en JSONL ; d’autres mettent en tampon
  jusqu’à la fin.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas JSONL), ce qui est moins
  structuré que l’exécution initiale `--json`. Les sessions OpenClaw continuent néanmoins à fonctionner normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).
