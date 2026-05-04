---
read_when:
    - Vous voulez une solution de repli fiable lorsque les fournisseurs d’API échouent
    - Vous exécutez Codex CLI ou d’autres CLI d’IA locales et souhaitez les réutiliser
    - Vous voulez comprendre le pont de loopback MCP pour l’accès aux outils du backend CLI
summary: 'Backends CLI : solution de repli vers une CLI d’IA locale avec pont d’outils MCP facultatif'
title: Interfaces dorsales CLI
x-i18n:
    generated_at: "2026-05-04T18:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter des **CLI d’IA locales** comme **solution de repli en texte seul** lorsque les fournisseurs d’API sont indisponibles,
soumis à une limite de débit ou se comportent temporairement de manière incorrecte. Cette approche est volontairement conservatrice :

- **Les outils OpenClaw ne sont pas injectés directement**, mais les backends avec `bundleMcp: true`
  peuvent recevoir les outils du Gateway via un pont MCP en local loopback.
- **Streaming JSONL** pour les CLI qui le prennent en charge.
- **Les sessions sont prises en charge** (les tours de suivi restent donc cohérents).
- **Les images peuvent être transmises** si la CLI accepte les chemins d’images.

Cette fonctionnalité est conçue comme un **filet de sécurité** plutôt que comme un chemin principal. Utilisez-la lorsque vous
voulez des réponses textuelles qui « fonctionnent toujours » sans dépendre d’API externes.

Si vous voulez un runtime de harnais complet avec contrôles de session ACP, tâches en arrière-plan,
liaison de fil/conversation et sessions de codage externes persistantes, utilisez plutôt
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

C’est tout. Aucune clé, aucune configuration d’authentification supplémentaire nécessaire au-delà de la CLI elle-même.

Si vous utilisez un backend CLI intégré comme **fournisseur de messages principal** sur un
hôte Gateway, OpenClaw charge désormais automatiquement le Plugin intégré propriétaire lorsque votre configuration
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
- Si le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw
  essaiera ensuite le backend CLI.

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

1. **Sélectionne un backend** d’après le préfixe du fournisseur (`codex-cli/...`).
2. **Construit une invite système** à partir de la même invite OpenClaw et du même contexte d’espace de travail.
3. **Exécute la CLI** avec un id de session (si pris en charge) afin que l’historique reste cohérent.
   Le backend intégré `claude-cli` garde un processus Claude stdio actif par
   session OpenClaw et envoie les tours de suivi via stream-json stdin.
4. **Analyse la sortie** (JSON ou texte brut) et renvoie le texte final.
5. **Persiste les ids de session** par backend, afin que les tours de suivi réutilisent la même session CLI.

<Note>
Le backend Anthropic intégré `claude-cli` est de nouveau pris en charge. Le personnel d’Anthropic
nous a indiqué que l’usage de Claude CLI façon OpenClaw est à nouveau autorisé, donc OpenClaw considère
l’utilisation de `claude -p` comme approuvée pour cette intégration sauf si Anthropic publie
une nouvelle politique.
</Note>

Le backend OpenAI intégré `codex-cli` transmet l’invite système d’OpenClaw via
la surcharge de configuration `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex n’expose pas de flag façon Claude
`--append-system-prompt`, donc OpenClaw écrit l’invite assemblée dans un
fichier temporaire pour chaque nouvelle session Codex CLI.

Le backend Anthropic intégré `claude-cli` reçoit l’instantané des Skills OpenClaw
de deux façons : le catalogue compact des Skills OpenClaw dans l’invite système ajoutée, et
un Plugin Claude Code temporaire transmis avec `--plugin-dir`. Le Plugin contient
uniquement les Skills admissibles pour cet agent/cette session, donc le résolveur de Skills natif de Claude Code
voit le même ensemble filtré qu’OpenClaw annoncerait autrement dans
l’invite. Les substitutions d’environnement/de clé d’API des Skills sont toujours appliquées par OpenClaw à
l’environnement du processus enfant pour l’exécution.

Claude CLI possède aussi son propre mode d’autorisation non interactif. OpenClaw le mappe
sur la politique d’exécution existante au lieu d’ajouter une configuration propre à Claude : lorsque la
politique d’exécution demandée effective est YOLO (`tools.exec.security: "full"` et
`tools.exec.ask: "off"`), OpenClaw ajoute `--permission-mode bypassPermissions`.
Les paramètres par agent `agents.list[].tools.exec` remplacent `tools.exec` global pour
cet agent. Pour forcer un autre mode Claude, définissez des arguments bruts explicites de backend
comme `--permission-mode default` ou `--permission-mode acceptEdits` sous
`agents.defaults.cliBackends.claude-cli.args` et les `resumeArgs` correspondants.

Le backend Anthropic intégré `claude-cli` mappe aussi les niveaux OpenClaw `/think`
vers le flag natif `--effort` de Claude Code pour les niveaux non désactivés. `minimal` et
`low` correspondent à `low`, `adaptive` et `medium` correspondent à `medium`, et `high`,
`xhigh` et `max` correspondent directement. Les autres backends CLI ont besoin que leur Plugin propriétaire
déclare un mappeur argv équivalent avant que `/think` puisse affecter la CLI lancée.

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
  - `always` : toujours envoyer un id de session (nouvel UUID si aucun n’est stocké).
  - `existing` : envoyer un id de session uniquement si un a déjà été stocké.
  - `none` : ne jamais envoyer d’id de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"`,
  et `input: "stdin"` afin que les tours de suivi réutilisent le processus Claude actif tant
  qu’il l’est. Le stdio préchauffé est désormais la valeur par défaut, y compris pour les configurations personnalisées
  qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif
  se termine, OpenClaw reprend depuis l’id de session Claude stocké. Les ids de session
  stockés sont vérifiés par rapport à un transcript de projet lisible existant avant
  la reprise, donc les liaisons fantômes sont effacées avec `reason=transcript-missing`
  au lieu de démarrer silencieusement une nouvelle session Claude CLI sous `--resume`.
- Les sessions Claude actives gardent des garde-fous bornés de sortie JSONL. Les valeurs par défaut autorisent jusqu’à
  8 Mio et 20 000 lignes JSONL brutes par tour. Les tours Claude utilisant beaucoup d’outils peuvent les augmenter
  par backend avec
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  et `maxTurnLines` ; OpenClaw borne ces paramètres à 64 Mio et 100 000
  lignes.
- Les sessions CLI stockées relèvent de la continuité détenue par le fournisseur. La réinitialisation quotidienne implicite de session
  ne les coupe pas ; `/reset` et les politiques explicites `session.reset` le font toujours.

Notes sur la sérialisation :

- `serialize: true` maintient l’ordre des exécutions sur la même voie.
- La plupart des CLI sérialisent sur une seule voie fournisseur.
- OpenClaw abandonne la réutilisation de session CLI stockée lorsque l’identité d’authentification sélectionnée change,
  y compris en cas de changement d’id de profil d’authentification, de clé d’API statique, de jeton statique ou d’identité de
  compte OAuth lorsque la CLI en expose une. La rotation des jetons OAuth d’accès et d’actualisation
  ne coupe pas la session CLI stockée. Si une CLI n’expose pas d’id de compte OAuth
  stable, OpenClaw laisse cette CLI appliquer les autorisations de reprise.

## Préambule de repli depuis les sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non CLI dans
[`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw amorce
la tentative suivante avec un préambule de contexte collecté depuis le transcript JSONL local
de Claude Code à `~/.claude/projects/`. Sans cette amorce, le fournisseur de repli
démarrerait à froid, car le transcript de session propre à OpenClaw est vide
pour les exécutions `claude-cli`.

- Le préambule privilégie le dernier résumé `/compact` ou marqueur `compact_boundary`,
  puis ajoute les tours postérieurs à la limite les plus récents jusqu’à un budget de caractères.
  Les tours antérieurs à la limite sont ignorés, car le résumé les représente déjà.
- Les blocs d’outils sont fusionnés en indices compacts `(tool call: name)` et
  `(tool result: …)` afin de garder le budget d’invite réaliste. Le résumé est
  étiqueté `(truncated)` s’il déborde.
- Les replis `claude-cli` vers `claude-cli` du même fournisseur reposent sur le propre
  `--resume` de Claude et ignorent le préambule.
- L’amorce réutilise la validation existante du chemin de fichier de session Claude, de sorte que
  des chemins arbitraires ne peuvent pas être lus.

## Images (transmission)

Si votre CLI accepte les chemins d’images, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrira les images base64 dans des fichiers temporaires. Si `imageArg` est défini, ces
chemins sont transmis comme arguments CLI. Si `imageArg` est absent, OpenClaw ajoute les
chemins de fichiers à l’invite (injection de chemin), ce qui suffit pour les CLI qui chargent automatiquement
des fichiers locaux depuis de simples chemins.

## Entrées / sorties

- `output: "json"` (par défaut) essaie d’analyser le JSON et d’extraire le texte + l’id de session.
- Pour la sortie JSON Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et
  l’utilisation depuis `stats` lorsque `usage` est manquant ou vide.
- `output: "jsonl"` analyse les flux JSONL (par exemple Codex CLI `--json`) et extrait le message final de l’agent ainsi que les identifiants de session
  lorsqu’ils sont présents.
- `output: "text"` traite stdout comme la réponse finale.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet l’invite comme dernier argument CLI.
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

Prérequis : la CLI Gemini locale doit être installée et disponible comme
`gemini` dans `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Notes JSON Gemini CLI :

- Le texte de réponse est lu depuis le champ JSON `response`.
- L’utilisation se replie sur `stats` lorsque `usage` est absent ou vide.
- `stats.cached` est normalisé en `cacheRead` OpenClaw.
- Si `stats.input` est manquant, OpenClaw déduit les tokens d’entrée à partir de
  `stats.input_tokens - stats.cached`.

À surcharger uniquement si nécessaire (cas courant : chemin `command` absolu).

## Valeurs par défaut propres au Plugin

Les valeurs par défaut du backend CLI font désormais partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe du fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` surcharge toujours la valeur par défaut du Plugin.
- Le nettoyage de configuration propre au backend reste détenu par le Plugin via le hook optionnel
  `normalizeConfig`.

Les Plugins qui ont besoin de minuscules shims de compatibilité pour les prompts/messages peuvent déclarer
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
réécrit les deltas de l’assistant diffusés en streaming et le texte final analysé avant qu’OpenClaw gère
ses propres marqueurs de contrôle et la livraison au canal.

Pour les CLI qui émettent du JSONL compatible avec Claude Code stream-json, définissez
`jsonlDialect: "claude-stream-json"` dans la configuration de ce backend.

## Overlays MCP groupés

Les backends CLI ne reçoivent **pas** directement les appels d’outils OpenClaw, mais un backend peut
opter pour un overlay de configuration MCP généré avec `bundleMcp: true`.

Comportement groupé actuel :

- `claude-cli` : fichier de configuration MCP strict généré
- `codex-cli` : surcharges de configuration en ligne pour `mcp_servers` ; le serveur loopback
  OpenClaw généré est marqué avec le mode d’approbation d’outil par serveur de Codex
  afin que les appels MCP ne puissent pas rester bloqués sur des prompts d’approbation locale
- `google-gemini-cli` : fichier de paramètres système Gemini généré

Lorsque le MCP groupé est activé, OpenClaw :

- lance un serveur MCP HTTP loopback qui expose les outils du Gateway au processus CLI
- authentifie le pont avec un token par session (`OPENCLAW_MCP_TOKEN`)
- limite l’accès aux outils au contexte de la session, du compte et du canal actuels
- charge les serveurs bundle-MCP activés pour l’espace de travail actuel
- les fusionne avec toute forme existante de configuration/paramètres MCP du backend
- réécrit la configuration de lancement avec le mode d’intégration détenu par le backend depuis l’extension propriétaire

Si aucun serveur MCP n’est activé, OpenClaw injecte tout de même une configuration stricte lorsqu’un
backend opte pour le MCP groupé afin que les exécutions en arrière-plan restent isolées.

Les runtimes MCP groupés limités à la session sont mis en cache pour être réutilisés dans une session, puis
nettoyés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10
minutes par défaut ; définissez `0` pour désactiver). Les exécutions intégrées ponctuelles comme les sondes d’authentification,
la génération de slug et les requêtes de rappel d’active-memory nettoient à la fin de l’exécution afin que les
processus enfants stdio et les flux HTTP/SSE Streamable ne survivent pas à l’exécution.

## Limites

- **Aucun appel d’outil OpenClaw direct.** OpenClaw n’injecte pas d’appels d’outils dans
  le protocole du backend CLI. Les backends ne voient les outils du Gateway que lorsqu’ils optent pour
  `bundleMcp: true`.
- **Le streaming est propre au backend.** Certains backends diffusent du JSONL en streaming ; d’autres mettent en mémoire tampon
  jusqu’à la sortie.
- **Les sorties structurées** dépendent du format JSON du CLI.
- **Les sessions Codex CLI** reprennent via la sortie texte (pas de JSONL), ce qui est moins
  structuré que l’exécution initiale avec `--json`. Les sessions OpenClaw fonctionnent tout de même
  normalement.

## Dépannage

- **CLI introuvable** : définissez `command` sur un chemin complet.
- **Nom de modèle incorrect** : utilisez `modelAliases` pour mapper `provider/model` → modèle CLI.
- **Aucune continuité de session** : assurez-vous que `sessionArg` est défini et que `sessionMode` n’est pas
  `none` (Codex CLI ne peut actuellement pas reprendre avec une sortie JSON).
- **Images ignorées** : définissez `imageArg` (et vérifiez que le CLI prend en charge les chemins de fichiers).

## Connexe

- [Runbook du Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
