---
read_when:
    - Vous voulez un repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez Codex CLI ou d’autres CLI IA locales et souhaitez les réutiliser
    - Vous voulez comprendre le pont MCP local loopback pour l’accès aux outils du backend CLI
summary: 'Backends CLI : repli vers une CLI IA locale avec pont d’outil MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-04-25T13:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw peut exécuter des **CLI IA locales** comme **repli texte uniquement** lorsque les fournisseurs d’API sont indisponibles,
limités en débit ou temporairement défaillants. Cette approche est volontairement conservative :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils de la gateway via un pont MCP local loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (pour que les tours de suivi restent cohérents).
- **Les images peuvent être transmises** si la CLI accepte des chemins d’image.

Cela est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses texte « qui fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches d’arrière-plan,
liaison de fil/conversation et sessions de codage externes persistantes, utilisez
[ACP Agents](/fr/tools/acp-agents) à la place. Les backends CLI ne sont pas ACP.

## Démarrage rapide adapté aux débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le plugin OpenAI inclus
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si votre gateway s’exécute sous launchd/systemd et que PATH est minimal, ajoutez simplement le
chemin de commande :

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
hôte gateway, OpenClaw charge désormais automatiquement le plugin inclus propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme repli

Ajoutez un backend CLI à votre liste de repli afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

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

Remarques :

- Si vous utilisez `agents.defaults.models` (liste d’autorisations), vous devez y inclure aussi les modèles de votre backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw
  essaiera ensuite le backend CLI.

## Vue d’ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **identifiant de fournisseur** (par ex. `codex-cli`, `my-cli`).
L’identifiant du fournisseur devient la partie gauche de votre référence de modèle :

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
          // Pour les CLI avec un indicateur prompt-file dédié :
          // systemPromptFileArg: "--system-file",
          // Les CLI de type Codex peuvent pointer vers un fichier de prompt à la place :
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
   Le backend `claude-cli` inclus maintient un processus Claude stdio en vie par
   session OpenClaw et envoie les tours de suivi via stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Conserve les identifiants de session** par backend, afin que les suivis réutilisent la même session CLI.

<Note>
Le backend Anthropic `claude-cli` inclus est de nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’utilisation de Claude CLI dans le style OpenClaw est de nouveau autorisée, donc OpenClaw considère
l’usage de `claude -p` comme autorisé pour cette intégration sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI `codex-cli` inclus transmet le prompt système d’OpenClaw via
le remplacement de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas d’indicateur
`--append-system-prompt` de type Claude, donc OpenClaw écrit le prompt assemblé dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic `claude-cli` inclus reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact des Skills OpenClaw dans le prompt système ajouté, et
un plugin Claude Code temporaire transmis avec `--plugin-dir`. Le plugin contient
uniquement les Skills éligibles pour cet agent/cette session, afin que le résolveur natif de Skills de Claude Code voie le même ensemble filtré qu’OpenClaw annoncerait autrement dans
le prompt. Les remplacements de variables d’environnement/clés API des Skills sont toujours appliqués par OpenClaw à l’environnement du processus enfant pour l’exécution.

Claude CLI possède aussi son propre mode d’autorisation non interactif. OpenClaw le mappe
à la politique d’exécution existante au lieu d’ajouter une configuration spécifique à Claude : lorsque la
politique d’exécution effective demandée est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres `agents.list[].tools.exec` par agent remplacent les paramètres globaux `tools.exec` pour
cet agent. Pour forcer un mode Claude différent, définissez des arguments bruts explicites du backend
tels que `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` et les `resumeArgs` correspondants.

Avant qu’OpenClaw puisse utiliser le backend `claude-cli` inclus, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà sur le `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (espace réservé `{sessionId}`) lorsque l’identifiant doit être inséré
  dans plusieurs indicateurs.
- Si la CLI utilise une **sous-commande de reprise** avec des indicateurs différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un identifiant de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoyer un identifiant de session uniquement s’il a déjà été stocké.
  - `none` : ne jamais envoyer d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude actif pendant
  qu’il est en activité. Le stdio à chaud est désormais la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si la Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend à partir de l’identifiant de session Claude stocké. Les identifiants de session stockés sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, de sorte que les liaisons fantômes sont effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions CLI stockées sont une continuité détenue par le fournisseur. La réinitialisation implicite
  quotidienne de session ne les coupe pas ; `/reset` et les politiques explicites `session.reset`, oui.

Remarques sur la sérialisation :

- `serialize: true` maintient l’ordre des exécutions sur la même voie.
- La plupart des CLI sérialisent sur une voie fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris en cas de changement d’identifiant de profil d’authentification, de clé API statique, de jeton statique ou d’identité de compte OAuth lorsque la CLI en expose une. La rotation des jetons d’accès et d’actualisation OAuth ne coupe pas la session CLI stockée. Si une CLI n’expose pas
  d’identifiant de compte OAuth stable, OpenClaw laisse cette CLI faire respecter les autorisations de reprise.

## Images (transmission)

Si votre CLI accepte des chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute
les chemins de fichiers au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins simples.

## Entrées / sorties

- `output: "json"` (par défaut) tente d’analyser le JSON et d’extraire le texte + l’identifiant de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’usage depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le plugin)

Le plugin OpenAI inclus enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le plugin Google inclus enregistre aussi une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : la CLI Gemini locale doit être installée et disponible comme
`gemini` sur le `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques JSON de Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’usage se replie sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` dans OpenClaw.
- Si `stats.input` est absent, OpenClaw dérive les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Ne remplacez que si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut détenues par le plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du plugin :

- Les plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du plugin.
- Le nettoyage de configuration spécifique au backend reste détenu par le plugin via le hook
  facultatif `normalizeConfig`.

Les plugins qui ont besoin de petits shims de compatibilité de prompt/message peuvent déclarer
des transformations de texte bidirectionnelles sans remplacer un fournisseur ni un backend CLI :

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
réécrit les deltas de streaming de l’assistant et le texte final analysé avant qu’OpenClaw ne traite
ses propres marqueurs de contrôle et la distribution de canal.

Pour les CLI qui émettent du JSONL compatible avec le stream-json de Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Superpositions MCP incluses

Les backends CLI **ne** reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
opter pour une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement inclus actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration inline pour `mcp_servers` ; le serveur loopback OpenClaw généré est marqué avec le mode d’approbation des outils par serveur de Codex afin que les appels MCP ne puissent pas se bloquer sur des invites d’approbation locales
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le MCP inclus est activé, OpenClaw :

- lance un serveur MCP HTTP local loopback qui expose les outils de la gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils au contexte actuel de session, de compte et de canal
- charge les serveurs MCP bundle-MCP activés pour l’espace de travail actuel
- les fusionne avec toute forme existante de configuration/paramètres MCP du backend
- réécrit la configuration de lancement en utilisant le mode d’intégration détenu par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte tout de même une configuration stricte lorsqu’un
backend opte pour le MCP inclus afin que les exécutions en arrière-plan restent isolées.

Les runtimes MCP inclus à portée de session sont mis en cache pour être réutilisés au sein d’une session, puis
nettoyés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10
minutes par défaut ; définissez `0` pour désactiver). Les exécutions embarquées ponctuelles telles que les sondes d’authentification,
la génération de slug et le rappel de Active Memory demandent un nettoyage à la fin de l’exécution afin que les processus
enfants stdio et les flux Streamable HTTP/SSE ne survivent pas à l’exécution.

## Limites

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils de la gateway que lorsqu’ils activent
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent en JSONL ; d’autres mettent en tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas de JSONL), ce qui est moins
  structuré que l’exécution initiale avec `--json`. Les sessions OpenClaw continuent de fonctionner
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).

## Voir aussi

- [Guide opérationnel de la gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
