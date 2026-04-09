---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d'API échouent
    - Vous utilisez Codex CLI ou d'autres CLI d'IA locales et voulez les réutiliser
    - Vous voulez comprendre le pont loopback MCP pour l'accès aux outils de backend CLI
summary: 'Backends CLI : solution de repli d''IA locale avec pont d''outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-04-09T01:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b458f9fe6fa64c47864c8c180f3dedfd35c5647de470a2a4d31c26165663c20
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends CLI (runtime de repli)

OpenClaw peut exécuter des **CLI d'IA locales** comme **solution de repli texte uniquement** lorsque les fournisseurs d'API sont indisponibles,
soumis à des limites de débit ou temporairement défaillants. Ce comportement est volontairement conservateur :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir des outils de passerelle via un pont MCP loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (pour que les tours de suivi restent cohérents).
- **Les images peuvent être transmises** si la CLI accepte des chemins d'image.

Cela est conçu comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-le lorsque vous
voulez des réponses texte « qui fonctionnent toujours » sans dépendre d'API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison thread/conversation et sessions de codage externes persistantes, utilisez
[ACP Agents](/fr/tools/acp-agents) à la place. Les backends CLI ne sont pas ACP.

## Démarrage rapide pour débutants

Vous pouvez utiliser Codex CLI **sans aucune configuration** (le plugin OpenAI intégré
enregistre un backend par défaut) :

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Si votre passerelle s'exécute sous launchd/systemd et que PATH est minimal, ajoutez simplement le
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

C'est tout. Aucune clé, aucune configuration d'authentification supplémentaire n'est nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI intégré comme **fournisseur principal de messages** sur un
hôte de passerelle, OpenClaw charge désormais automatiquement le plugin intégré propriétaire lorsque votre configuration
référence explicitement ce backend dans une référence de modèle ou sous
`agents.defaults.cliBackends`.

## L'utiliser comme solution de repli

Ajoutez un backend CLI à votre liste de repli pour qu'il ne s'exécute que lorsque les modèles principaux échouent :

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

- Si vous utilisez `agents.defaults.models` (liste d'autorisation), vous devez aussi y inclure les modèles de votre backend CLI.
- Si le fournisseur principal échoue (authentification, limites de débit, délais d'expiration), OpenClaw
  essaiera ensuite le backend CLI.

## Vue d'ensemble de la configuration

Tous les backends CLI se trouvent sous :

```
agents.defaults.cliBackends
```

Chaque entrée est indexée par un **ID de fournisseur** (par ex. `codex-cli`, `my-cli`).
L'ID de fournisseur devient la partie gauche de votre référence de modèle :

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
          // Les CLI de type Codex peuvent plutôt pointer vers un fichier de prompt :
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
2. **Construit un prompt système** en utilisant le même prompt OpenClaw + contexte d'espace de travail.
3. **Exécute la CLI** avec un ID de session (si pris en charge) pour que l'historique reste cohérent.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les ID de session** par backend, afin que les suivis réutilisent la même session CLI.

<Note>
Le backend `claude-cli` Anthropic intégré est de nouveau pris en charge. Le personnel d'Anthropic
nous a indiqué que l'utilisation de Claude CLI à la manière d'OpenClaw est à nouveau autorisée, donc OpenClaw considère
l'utilisation de `claude -p` comme approuvée pour cette intégration, sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend `codex-cli` OpenAI intégré transmet le prompt système d'OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n'expose pas d'option de type Claude
`--append-system-prompt`, donc OpenClaw écrit le prompt assemblé dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par ex. `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) lorsque l'ID doit être inséré
  dans plusieurs options.
- Si la CLI utilise une **sous-commande de reprise** avec des options différentes, définissez
  `resumeArgs` (remplace `args` lors de la reprise) et éventuellement `resumeOutput`
  (pour les reprises non JSON).
- `sessionMode` :
  - `always` : toujours envoyer un ID de session (nouvel UUID si aucun n'est stocké).
  - `existing` : envoyer un ID de session uniquement si un ID a déjà été stocké.
  - `none` : ne jamais envoyer d'ID de session.

Remarques sur la sérialisation :

- `serialize: true` maintient l'ordre des exécutions sur la même voie.
- La plupart des CLI sérialisent sur une voie de fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l'état d'authentification du backend change, notamment en cas de reconnexion, rotation de jeton ou modification d'un profil d'authentification.

## Images (transmission directe)

Si votre CLI accepte des chemins d'image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers au prompt (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
les fichiers locaux à partir de chemins bruts.

## Entrées / sorties

- `output: "json"` (par défaut) essaie d'analyser le JSON et d'extraire le texte + l'ID de session.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l'usage depuis `stats` lorsque `usage` est absent ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l'agent ainsi que les identifiants de session
  lorsqu'ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d'entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé.

## Valeurs par défaut (détenues par le plugin)

Le plugin OpenAI intégré enregistre aussi une valeur par défaut pour `codex-cli` :

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Le plugin Google intégré enregistre aussi une valeur par défaut pour `google-gemini-cli` :

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prérequis : la CLI Gemini locale doit être installée et disponible comme
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Remarques sur le JSON de Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L'usage se rabat sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est absent, OpenClaw déduit les jetons d'entrée à partir de
  `stats.input_tokens - stats.cached`.

Remplacez uniquement si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut détenues par le plugin

Les valeurs par défaut des backends CLI font désormais partie de la surface du plugin :

- Les plugins les enregistrent avec `api.registerCliBackend(...)`.
- L'`id` du backend devient le préfixe du fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du plugin.
- Le nettoyage de configuration spécifique au backend reste détenu par le plugin via le hook facultatif
  `normalizeConfig`.

## Superpositions Bundle MCP

Les backends CLI **ne** reçoivent **pas** directement les appels d'outils OpenClaw, mais un backend peut
opter pour une superposition de configuration MCP générée avec `bundleMcp: true`.

Comportement intégré actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : surcharges de configuration inline pour `mcp_servers`
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque bundle MCP est activé, OpenClaw :

- lance un serveur MCP HTTP loopback qui expose les outils de passerelle au processus CLI
- authentifie le pont avec un jeton par session (`OPENCLAW_MCP_TOKEN`)
- limite l'accès aux outils à la session, au compte et au contexte de canal en cours
- charge les serveurs bundle-MCP activés pour l'espace de travail actuel
- les fusionne avec toute forme de configuration/paramètres MCP backend existante
- réécrit la configuration de lancement en utilisant le mode d'intégration détenu par le backend depuis l'extension propriétaire

Si aucun serveur MCP n'est activé, OpenClaw injecte tout de même une configuration stricte lorsqu'un
backend opte pour bundle MCP afin que les exécutions en arrière-plan restent isolées.

## Limitations

- **Aucun appel direct aux outils OpenClaw.** OpenClaw n'injecte pas d'appels d'outils dans
  le protocole de backend CLI. Les backends ne voient les outils de passerelle que lorsqu'ils optent pour
  `bundleMcp: true`.
- **Le streaming est spécifique au backend.** Certains backends diffusent du JSONL ; d'autres mettent en tampon
  jusqu'à la fin.
- **Les sorties structurées** dépendent du format JSON de la CLI.
- **Les sessions Codex CLI** reprennent via une sortie texte (pas de JSONL), ce qui est moins
  structuré que l'exécution initiale `--json`. Les sessions OpenClaw continuent de fonctionner
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` avec un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n'est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que la CLI prend en charge les chemins de fichier).
