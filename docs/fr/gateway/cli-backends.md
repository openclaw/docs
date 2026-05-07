---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez Codex CLI ou d’autres CLI d’IA locales et souhaitez les réutiliser
    - Vous voulez comprendre le pont de rebouclage MCP pour l’accès aux outils côté serveur de la CLI
summary: 'Moteurs CLI : solution de repli vers un CLI d’IA local avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-05-07T13:16:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de repli textuelle uniquement** lorsque les fournisseurs d’API sont indisponibles,
soumis à des limites de débit ou se comportent temporairement de manière incorrecte. Cette approche est volontairement conservatrice :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils du Gateway via un pont MCP en local loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** afin que les tours de suivi restent cohérents.
- **Les images peuvent être transmises** si la CLI accepte les chemins d’images.

Cette fonctionnalité est conçue comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-la lorsque vous
voulez des réponses textuelles qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison thread/conversation et sessions de codage externes persistantes, utilisez plutôt
[Agents ACP](/fr/tools/acp-agents). Les backends CLI ne sont pas ACP.

<Tip>
  Vous créez un nouveau Plugin de backend ? Utilisez
  [Plugins de backend CLI](/fr/plugins/cli-backend-plugins). Cette page s’adresse aux utilisateurs
  qui configurent et exploitent un backend déjà enregistré.
</Tip>

## Démarrage rapide convivial pour les débutants

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

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire n’est nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI intégré comme **fournisseur de messages principal** sur un
hôte Gateway, OpenClaw charge maintenant automatiquement le Plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## Utilisation comme solution de repli

Ajoutez un backend CLI à votre liste de solutions de repli afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

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

- Si vous utilisez `agents.defaults.models` (liste d’autorisation), vous devez également y inclure vos modèles de backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’attente), OpenClaw essaiera
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

1. **Sélectionne un backend** en fonction du préfixe de fournisseur (`codex-cli/...`).
2. **Construit une invite système** avec la même invite OpenClaw et le même contexte d’espace de travail.
3. **Exécute la CLI** avec un identifiant de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend intégré `claude-cli` maintient un processus stdio Claude actif par
   session OpenClaw et envoie les tours de suivi sur stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les identifiants de session** par backend, afin que les suivis réutilisent la même session CLI.

<Note>
Le backend Anthropic intégré `claude-cli` est de nouveau pris en charge. Des membres du personnel Anthropic
nous ont indiqué que l’usage de Claude CLI de type OpenClaw était à nouveau autorisé, donc OpenClaw considère
l’utilisation de `claude -p` comme approuvée pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI intégré `codex-cli` transmet l’invite système d’OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas de flag de type Claude
`--append-system-prompt`, donc OpenClaw écrit l’invite assemblée dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic intégré `claude-cli` reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact de Skills OpenClaw dans l’invite système ajoutée, et
un Plugin Claude Code temporaire transmis avec `--plugin-dir`. Le Plugin contient
uniquement les Skills éligibles pour cet agent/cette session, donc le résolveur natif de Skills
de Claude Code voit le même ensemble filtré qu’OpenClaw annoncerait autrement dans
l’invite. Les surcharges d’environnement/de clé d’API des Skills sont toujours appliquées par OpenClaw à
l’environnement du processus enfant pour l’exécution.

Claude CLI dispose également de son propre mode d’autorisation non interactif. OpenClaw le mappe
à la politique d’exécution existante au lieu d’ajouter une configuration spécifique à Claude : lorsque la
politique d’exécution effective demandée est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres par agent `agents.list[].tools.exec` remplacent le `tools.exec` global pour
cet agent. Pour forcer un mode Claude différent, définissez des arguments backend bruts explicites
tels que `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` ainsi que les `resumeArgs` correspondants.

Le backend Anthropic intégré `claude-cli` mappe aussi les niveaux OpenClaw `/think`
au flag natif `--effort` de Claude Code pour les niveaux autres que off. `minimal` et
`low` correspondent à `low`, `adaptive` et `medium` correspondent à `medium`, et `high`,
`xhigh` et `max` correspondent directement. Les autres backends CLI ont besoin que leur Plugin propriétaire
déclare un mappeur argv équivalent avant que `/think` puisse affecter la CLI générée.

Avant qu’OpenClaw puisse utiliser le backend intégré `claude-cli`, Claude Code lui-même
doit déjà être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Utilisez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude`
n’est pas déjà dans `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par exemple `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) lorsque l’ID doit être inséré
  dans plusieurs flags.
- Si la CLI utilise une **sous-commande de reprise** avec des flags différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : envoie toujours un identifiant de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoie un identifiant de session uniquement si un identifiant a été stocké auparavant.
  - `none` : n’envoie jamais d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude actif tant
  qu’il l’est. Le stdio chaud est désormais la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou que le processus inactif
  se termine, OpenClaw reprend depuis l’identifiant de session Claude stocké. Les identifiants de session
  stockés sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, donc les liaisons fantômes sont effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions Claude actives conservent des garde-fous bornés pour la sortie JSONL. Les valeurs par défaut autorisent jusqu’à
  8 Mio et 20 000 lignes JSONL brutes par tour. Les tours Claude très chargés en outils peuvent les augmenter
  par backend avec
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  et `maxTurnLines` ; OpenClaw plafonne ces paramètres à 64 Mio et 100 000
  lignes.
- Les sessions CLI stockées constituent une continuité propre au fournisseur. La réinitialisation quotidienne implicite de session
  ne les coupe pas ; `/reset` et les politiques explicites `session.reset` le font toujours.

Notes de sérialisation :

- `serialize: true` garde les exécutions de même voie dans l’ordre.
- La plupart des CLI sérialisent sur une seule voie fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  notamment un changement d’identifiant de profil d’authentification, de clé d’API statique, de jeton statique ou d’identité
  de compte OAuth lorsque la CLI en expose une. La rotation des jetons d’accès et d’actualisation OAuth
  ne coupe pas la session CLI stockée. Si une CLI n’expose pas un
  identifiant de compte OAuth stable, OpenClaw laisse cette CLI faire respecter les autorisations de reprise.

## Prélude de repli depuis les sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non-CLI dans
[`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw amorce
la tentative suivante avec un prélude de contexte extrait de la transcription JSONL locale de Claude Code
dans `~/.claude/projects/`. Sans cet amorçage, le fournisseur de repli
démarrerait à froid, car la transcription de session propre à OpenClaw est vide
pour les exécutions `claude-cli`.

- Le prélude préfère le dernier résumé `/compact` ou marqueur `compact_boundary`,
  puis ajoute les tours post-limite les plus récents jusqu’à un budget de caractères.
  Les tours pré-limite sont supprimés parce que le résumé les représente déjà.
- Les blocs d’outils sont coalescés en indications compactes `(tool call: name)` et
  `(tool result: …)` afin de garder le budget d’invite sincère. Le résumé est
  étiqueté `(truncated)` s’il déborde.
- Les replis même fournisseur de `claude-cli` vers `claude-cli` reposent sur le propre
  `--resume` de Claude et ignorent le prélude.
- L’amorçage réutilise la validation existante du chemin de fichier de session Claude, de sorte que
  les chemins arbitraires ne peuvent pas être lus.

## Images (transmission)

Si votre CLI accepte les chemins d’images, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers à l’invite (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux depuis de simples chemins.

## Entrées / sorties

- `output: "json"` (par défaut) tente d’analyser le JSON et d’extraire le texte + l’identifiant de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’utilisation depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les
  identifiants de session lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet l’invite comme dernier argument CLI.
- `input: "stdin"` envoie l’invite via stdin.
- Si l’invite est très longue et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (propriété du Plugin)

Le Plugin OpenAI intégré enregistre également une valeur par défaut pour `codex-cli` :

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

Prérequis : la CLI Gemini locale doit être installée et disponible sous le nom
`gemini` dans le `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Notes JSON de la CLI Gemini :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’utilisation se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est absent, OpenClaw déduit les jetons d’entrée à partir de
  `stats.input_tokens - stats.cached`.

Remplacez uniquement si nécessaire (courant : chemin absolu de `command`).

## Valeurs par défaut propres au Plugin

Les valeurs par défaut du backend CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe du fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de configuration propre au backend reste géré par le Plugin via le hook optionnel
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
ses propres marqueurs de contrôle et la remise au canal.

Pour les CLI qui émettent des JSONL compatibles avec Claude Code stream-json, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Superpositions MCP groupées

Les backends CLI ne reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
opter pour une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement groupé actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration en ligne pour `mcp_servers` ; le serveur
  local loopback OpenClaw généré est marqué avec le mode d’approbation d’outil par serveur de Codex
  afin que les appels MCP ne puissent pas se bloquer sur des invites d’approbation locales
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque MCP groupé est activé, OpenClaw :

- lance un serveur MCP HTTP local loopback qui expose les outils Gateway au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils au contexte de la session, du compte et du canal actuels
- charge les serveurs MCP groupés activés pour l’espace de travail actuel
- les fusionne avec toute forme existante de configuration/paramètres MCP du backend
- réécrit la configuration de lancement en utilisant le mode d’intégration détenu par le backend de l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte quand même une configuration stricte lorsqu’un
backend opte pour MCP groupé afin que les exécutions en arrière-plan restent isolées.

Les runtimes MCP groupés limités à la session sont mis en cache pour être réutilisés au sein d’une session, puis
supprimés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10
minutes par défaut ; définissez `0` pour désactiver). Les exécutions intégrées ponctuelles, comme les sondes d’authentification,
la génération de slugs et le rappel d’active-memory, demandent le nettoyage en fin d’exécution afin que les enfants stdio
et les flux HTTP/SSE Streamable ne survivent pas à l’exécution.

## Limitations

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils Gateway que lorsqu’ils optent pour
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent du JSONL en streaming ; d’autres mettent en mémoire tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (sans JSONL), ce qui est moins
  structuré que l’exécution initiale avec `--json`. Les sessions OpenClaw fonctionnent tout de même
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).

## Connexe

- [Runbook Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
