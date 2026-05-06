---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez Codex CLI ou d’autres CLI d’IA en local et souhaitez les réutiliser
    - Vous souhaitez comprendre le pont de bouclage MCP pour l’accès aux outils du backend CLI
summary: 'Moteurs CLI : solution de repli CLI d’IA locale avec pont d’outils MCP facultatif'
title: Moteurs CLI
x-i18n:
    generated_at: "2026-05-06T07:22:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de repli en texte seul** lorsque les fournisseurs d’API sont indisponibles,
limités en débit ou se comportent temporairement de façon incorrecte. C’est volontairement conservateur :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils Gateway via un pont MCP en loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (les échanges suivants restent donc cohérents).
- **Les images peuvent être transmises** si la CLI accepte les chemins d’images.

C’est conçu comme un **filet de sécurité** plutôt qu’un chemin principal. Utilisez-le quand vous
voulez des réponses textuelles qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison fil/conversation et sessions de codage externes persistantes, utilisez plutôt
[Agents ACP](/fr/tools/acp-agents). Les backends CLI ne sont pas ACP.

## Démarrage rapide pour débutants

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
hôte Gateway, OpenClaw charge désormais automatiquement le Plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L’utiliser comme solution de repli

Ajoutez un backend CLI à votre liste de replis afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

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
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw essaiera ensuite
  le backend CLI.

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
          serialize: true,
        },
      },
    },
  },
}
```

## Fonctionnement

1. **Sélectionne un backend** selon le préfixe du fournisseur (`codex-cli/...`).
2. **Construit une invite système** en utilisant la même invite OpenClaw et le même contexte d’espace de travail.
3. **Exécute la CLI** avec un id de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend intégré `claude-cli` garde un processus Claude stdio actif par
   session OpenClaw et envoie les échanges suivants sur stdin stream-json.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les ids de session** par backend, afin que les échanges suivants réutilisent la même session CLI.

<Note>
Le backend Anthropic intégré `claude-cli` est à nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’usage de Claude CLI à la manière d’OpenClaw est à nouveau autorisé, donc OpenClaw traite
l’usage de `claude -p` comme approuvé pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI intégré `codex-cli` transmet l’invite système d’OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas de drapeau de type Claude
`--append-system-prompt`, donc OpenClaw écrit l’invite assemblée dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic intégré `claude-cli` reçoit l’instantané des Skills OpenClaw
de deux manières : le catalogue compact des Skills OpenClaw dans l’invite système ajoutée, et
un Plugin Claude Code temporaire passé avec `--plugin-dir`. Le Plugin contient
uniquement les Skills éligibles pour cet agent/cette session, donc le résolveur natif de Skills
de Claude Code voit le même ensemble filtré qu’OpenClaw annoncerait autrement dans
l’invite. Les surcharges d’environnement/de clé API des Skills restent appliquées par OpenClaw à
l’environnement du processus enfant pour l’exécution.

Claude CLI possède aussi son propre mode d’autorisations non interactif. OpenClaw le mappe
sur la politique d’exécution existante au lieu d’ajouter une configuration propre à Claude : lorsque la
politique d’exécution demandée effective est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres par agent `agents.list[].tools.exec` remplacent `tools.exec` global pour
cet agent. Pour forcer un mode Claude différent, définissez des arguments bruts explicites du backend
comme `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` et les `resumeArgs` correspondants.

Le backend Anthropic intégré `claude-cli` mappe aussi les niveaux OpenClaw `/think`
vers le drapeau natif `--effort` de Claude Code pour les niveaux autres que off. `minimal` et
`low` sont mappés sur `low`, `adaptive` et `medium` sur `medium`, et `high`,
`xhigh` et `max` directement. Les autres backends CLI ont besoin que leur Plugin propriétaire
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
  dans plusieurs drapeaux.
- Si la CLI utilise une **sous-commande de reprise** avec des drapeaux différents, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un id de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoyer un id de session uniquement si un id était déjà stocké.
  - `none` : ne jamais envoyer d’id de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les échanges suivants réutilisent le processus Claude actif tant
  qu’il l’est. Le stdio chaud est désormais la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend depuis l’id de session Claude stocké. Les ids de session
  stockés sont vérifiés par rapport à une transcription de projet existante et lisible avant
  la reprise, afin que les liaisons fantômes soient effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions Claude actives conservent des garde-fous bornés pour la sortie JSONL. Les valeurs par défaut autorisent jusqu’à
  8 Mio et 20 000 lignes JSONL brutes par échange. Les échanges Claude riches en outils peuvent les augmenter
  par backend avec
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  et `maxTurnLines` ; OpenClaw plafonne ces paramètres à 64 Mio et 100 000
  lignes.
- Les sessions CLI stockées sont une continuité détenue par le fournisseur. La réinitialisation quotidienne implicite de session
  ne les coupe pas ; `/reset` et les politiques explicites `session.reset` le font toujours.

Notes de sérialisation :

- `serialize: true` conserve l’ordre des exécutions sur la même voie.
- La plupart des CLI sérialisent sur une voie fournisseur unique.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  notamment un id de profil d’authentification modifié, une clé API statique, un jeton statique ou l’identité de
  compte OAuth lorsque la CLI en expose une. La rotation des jetons d’accès et d’actualisation OAuth
  ne coupe pas la session CLI stockée. Si une CLI n’expose pas un id de compte OAuth
  stable, OpenClaw laisse cette CLI appliquer les autorisations de reprise.

## Prélude de repli depuis les sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non-CLI dans
[`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw amorce
la tentative suivante avec un prélude de contexte extrait de la transcription JSONL locale de Claude Code
dans `~/.claude/projects/`. Sans cet amorçage, le fournisseur de repli
démarrerait à froid, car la propre transcription de session d’OpenClaw est vide
pour les exécutions `claude-cli`.

- Le prélude privilégie le dernier résumé `/compact` ou marqueur `compact_boundary`,
  puis ajoute les échanges post-frontière les plus récents jusqu’à un budget de caractères.
  Les échanges pré-frontière sont supprimés, car le résumé les représente déjà.
- Les blocs d’outils sont fusionnés en indices compacts `(tool call: name)` et
  `(tool result: …)` afin de préserver le budget d’invite. Le résumé est
  étiqueté `(truncated)` s’il déborde.
- Les replis `claude-cli` vers `claude-cli` avec le même fournisseur s’appuient sur le propre
  `--resume` de Claude et ignorent le prélude.
- L’amorçage réutilise la validation existante du chemin de fichier de session Claude, donc
  les chemins arbitraires ne peuvent pas être lus.

## Images (transmission directe)

Si votre CLI accepte les chemins d’images, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images en base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont passés comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers à l’invite (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins bruts.

## Entrées / sorties

- `output: "json"` (par défaut) essaie d’analyser le JSON et d’extraire le texte + l’id de session.
- Pour la sortie JSON Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’utilisation depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les
  identifiants de session lorsqu’ils sont présents.
- `output: "text"` traite stdout comme réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) passe l’invite comme dernier argument CLI.
- `input: "stdin"` envoie l’invite via stdin.
- Si l’invite est très longue et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le Plugin)

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

Prérequis : la Gemini CLI locale doit être installée et disponible comme
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Notes JSON Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L'utilisation se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est manquant, OpenClaw déduit les tokens d'entrée à partir de
  `stats.input_tokens - stats.cached`.

Remplacez uniquement si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut détenues par le Plugin

Les valeurs par défaut du backend CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L'`id` du backend devient le préfixe de fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de configuration propre au backend reste détenu par le Plugin via le hook
  `normalizeConfig` facultatif.

Les Plugins qui ont besoin de minuscules adaptateurs de compatibilité de prompt/message peuvent déclarer
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
réécrit les deltas d'assistant diffusés en streaming et le texte final analysé avant qu'OpenClaw ne traite
ses propres marqueurs de contrôle et la livraison au canal.

Pour les CLI qui émettent du JSONL compatible avec le stream-json de Claude Code, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Surcouches MCP groupées

Les backends CLI ne reçoivent **pas** directement les appels d'outils OpenClaw, mais un backend peut
activer une surcouche de configuration MCP générée avec `bundleMcp: true`.

Comportement groupé actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : remplacements de configuration en ligne pour `mcp_servers` ; le serveur
  local loopback OpenClaw généré est marqué avec le mode d'approbation d'outils par serveur de Codex
  afin que les appels MCP ne puissent pas se bloquer sur des prompts d'approbation locaux
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le MCP groupé est activé, OpenClaw :

- lance un serveur MCP HTTP local loopback qui expose les outils Gateway au processus CLI
- authentifie le pont avec un token propre à la session (`OPENCLAW_MCP_TOKEN`)
- limite l'accès aux outils au contexte de la session, du compte et du canal actuels
- charge les serveurs MCP groupés activés pour l'espace de travail actuel
- les fusionne avec toute forme de configuration/paramètres MCP de backend existante
- réécrit la configuration de lancement en utilisant le mode d'intégration détenu par le backend depuis l'extension propriétaire

Si aucun serveur MCP n'est activé, OpenClaw injecte tout de même une configuration stricte lorsqu'un
backend active le MCP groupé afin que les exécutions en arrière-plan restent isolées.

Les runtimes MCP groupés à portée de session sont mis en cache pour réutilisation au sein d'une session, puis
nettoyés après `mcp.sessionIdleTtlMs` millisecondes d'inactivité (10 minutes par défaut ;
définissez `0` pour désactiver). Les exécutions intégrées ponctuelles comme les sondes d'authentification,
la génération de slug et le rappel Active Memory demandent un nettoyage en fin d'exécution afin que les enfants stdio
et les flux Streamable HTTP/SSE ne survivent pas à l'exécution.

## Limites

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n'injecte pas d'appels d'outils dans
  le protocole du backend CLI. Les backends ne voient les outils Gateway que lorsqu'ils activent
  `bundleMcp: true`.
- **Le streaming dépend du backend.** Certains backends diffusent du JSONL ; d'autres mettent en mémoire tampon
  jusqu'à la sortie.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via la sortie texte (pas de JSONL), ce qui est moins
  structuré que l'exécution initiale avec `--json`. Les sessions OpenClaw fonctionnent tout de même
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n'est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichiers).

## Connexe

- [Runbook Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
