---
read_when:
    - Vous souhaitez une solution de secours fiable lorsque les fournisseurs d’API rencontrent une défaillance
    - Vous exécutez des CLI d’IA locales et souhaitez les réutiliser
    - Vous souhaitez comprendre le pont de bouclage MCP permettant au backend CLI d’accéder aux outils
summary: 'Backends CLI : solution de repli vers une CLI d’IA locale avec passerelle facultative vers les outils MCP'
title: Backends CLI
x-i18n:
    generated_at: "2026-07-12T15:20:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter une CLI d’IA locale comme solution de repli en mode texte uniquement lorsque les fournisseurs d’API sont indisponibles, soumis à des limites de débit ou défaillants. Cette solution est volontairement prudente :

- Les outils OpenClaw ne sont pas injectés directement, mais un backend avec `bundleMcp: true` peut recevoir les outils du Gateway par l’intermédiaire d’un pont MCP en boucle locale.
- Diffusion JSONL pour les CLI qui la prennent en charge.
- Les sessions sont prises en charge afin que les échanges suivants restent cohérents.
- Les images sont transmises si la CLI accepte les chemins d’image.

Utilisez cette solution comme filet de sécurité pour obtenir des réponses textuelles qui « fonctionnent toujours », et non comme voie principale. Pour un environnement d’exécution complet avec les contrôles de session ACP, les tâches en arrière-plan, la liaison aux fils de discussion/conversations et les sessions de codage externes persistantes, utilisez plutôt les [agents ACP](/fr/tools/acp-agents) ; les backends CLI ne sont pas ACP.

<Tip>
  Vous développez un nouveau Plugin de backend ? Consultez [Plugins de backend CLI](/fr/plugins/cli-backend-plugins). Cette page explique comment configurer et exploiter un backend déjà enregistré.
</Tip>

## Démarrage rapide

Le Plugin Anthropic intégré enregistre un backend `claude-cli` par défaut. Il fonctionne donc sans configuration supplémentaire, à condition que Claude Code soit installé et qu’une session y soit ouverte :

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` est l’identifiant d’agent par défaut lorsqu’aucune liste explicite d’agents n’est configurée ; sinon, remplacez-le par votre propre identifiant d’agent.

Si le Gateway s’exécute sous launchd/systemd avec un `PATH` minimal, indiquez explicitement le chemin du binaire :

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

Si vous utilisez un backend CLI intégré comme fournisseur de messages principal sur un hôte Gateway, OpenClaw charge automatiquement le Plugin intégré propriétaire lorsque votre configuration référence ce backend dans une référence de modèle ou sous `agents.defaults.cliBackends`.

## Utilisation comme solution de repli

Ajoutez le backend CLI à votre liste de solutions de repli afin qu’il ne s’exécute que lorsque les modèles principaux échouent :

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

Si vous utilisez `agents.defaults.models` comme liste d’autorisation, incluez-y également les modèles de votre backend CLI. Lorsque le fournisseur principal échoue (authentification, limites de débit, délais d’attente), OpenClaw essaie ensuite le backend CLI.

## Configuration

Tous les backends CLI se trouvent sous `agents.defaults.cliBackends`, indexés par identifiant de fournisseur (par exemple `claude-cli`, `my-cli`). L’identifiant de fournisseur devient la partie gauche de la référence de modèle : `<provider>/<model>`.

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
          // Indicateur dédié au fichier de prompt :
          // systemPromptFileArg: "--system-file",
          // Ou indicateur de remplacement de configuration de type Codex :
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Activez cette option uniquement si ce backend peut réamorcer les sessions invalidées à partir
          // de l’historique brut et limité de la transcription OpenClaw avant la Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Fonctionnement

1. Sélectionne un backend selon le préfixe du fournisseur (`claude-cli/...`).
2. Construit un prompt système en utilisant le même prompt OpenClaw et le même contexte d’espace de travail.
3. Exécute la CLI avec un identifiant de session (s’il est pris en charge) afin que l’historique reste cohérent. Le backend `claude-cli` intégré maintient un processus stdio Claude actif pour chaque session OpenClaw et envoie les échanges suivants via l’entrée standard stream-json.
4. Analyse la sortie (JSON ou texte brut) et renvoie le texte final.
5. Conserve les identifiants de session pour chaque backend afin que les échanges suivants réutilisent la même session CLI.

### Spécificités de Claude CLI

Le backend `claude-cli` intégré privilégie le résolveur natif de Skills de Claude Code. Lorsque l’instantané actuel des Skills contient au moins une compétence sélectionnée disposant d’un chemin matérialisé, OpenClaw transmet un Plugin Claude Code temporaire via `--plugin-dir` et omet du prompt système ajouté le catalogue redondant des Skills OpenClaw. Sans compétence de Plugin matérialisée, OpenClaw conserve le catalogue du prompt comme solution de repli. Les remplacements de variables d’environnement ou de clés d’API des compétences continuent de s’appliquer à l’environnement du processus enfant pendant l’exécution.

Claude CLI possède son propre mode d’autorisation non interactif ; OpenClaw le fait correspondre à la politique d’exécution existante au lieu d’ajouter une configuration propre à Claude. Pour les sessions Claude actives gérées par OpenClaw, la politique d’exécution effective fait autorité : le mode YOLO (`tools.exec.security: "full"` et `tools.exec.ask: "off"`) lance Claude avec `--permission-mode bypassPermissions`, tandis qu’une politique restrictive le lance avec `--permission-mode default`. Les paramètres `agents.list[].tools.exec` propres à chaque agent remplacent le paramètre global `tools.exec` pour cet agent. Les arguments bruts du backend peuvent toujours inclure `--permission-mode`, mais les lancements actifs de Claude normalisent cet indicateur pour qu’il corresponde à la politique effective.

Le backend fait également correspondre les niveaux `/think` d’OpenClaw à l’indicateur natif `--effort` de Claude Code : `minimal`/`low` -> `low`, `medium` -> `medium`, et `high`/`xhigh`/`max` sont transmis directement. `adaptive` supprime les indicateurs `--effort` configurés et ne fournit aucun remplacement ; Claude Code détermine donc l’effort effectif à partir de son propre environnement, de ses paramètres et des valeurs par défaut du modèle. Pour que `/think` affecte la CLI lancée, les autres backends CLI doivent faire déclarer un mécanisme équivalent de mise en correspondance des arguments par leur Plugin propriétaire.

Avant qu’OpenClaw puisse utiliser `claude-cli`, une session doit être ouverte dans Claude Code sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Pour les installations Docker, Claude Code doit être installé et connecté dans le répertoire personnel persistant du conteneur, et pas uniquement sur l’hôte ; consultez [Backend Claude CLI dans Docker](/fr/install/docker#claude-cli-backend-in-docker).

Définissez `agents.defaults.cliBackends.claude-cli.command` uniquement si le binaire `claude` ne se trouve pas déjà dans le `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par exemple `--session-id`) ou `sessionArgs` (espace réservé `{sessionId}`) lorsque l’identifiant doit être inséré dans plusieurs indicateurs.
- Si la CLI utilise une sous-commande de reprise avec des indicateurs différents, définissez `resumeArgs` (qui remplace `args` lors de la reprise) et éventuellement `resumeOutput` pour les reprises non JSON.
- `sessionMode` :
  - `always` : envoie toujours un identifiant de session (un nouvel UUID si aucun n’est enregistré).
  - `existing` : envoie un identifiant de session uniquement si l’un d’eux a déjà été enregistré.
  - `none` : n’envoie jamais d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"` et `input: "stdin"`. Les échanges suivants réutilisent donc le processus Claude actif tant qu’il fonctionne, y compris avec les configurations personnalisées qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif se termine, OpenClaw reprend à partir de l’identifiant de session Claude enregistré. Avant la reprise, les identifiants de session enregistrés sont vérifiés par rapport à une transcription de projet lisible ; si la transcription est absente, la liaison est supprimée (journalisée sous `reason=transcript-missing`) au lieu de démarrer silencieusement une nouvelle session avec `--resume`.
- Les sessions Claude actives conservent des limites de protection de sortie JSONL : 8 MiB et 20,000 lignes JSONL brutes par échange par défaut. Augmentez-les pour chaque backend avec `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` et `maxTurnLines` ; OpenClaw limite ces paramètres à 64 MiB et 100,000 lignes.
- Les sessions CLI enregistrées assurent une continuité appartenant au fournisseur. La réinitialisation quotidienne implicite des sessions ne les interrompt pas ; `/reset` et les politiques explicites `session.reset` le font toujours.
- Les nouvelles sessions CLI ne sont normalement réamorcées qu’à partir du résumé de Compaction d’OpenClaw et de la fin de transcription postérieure à la Compaction. Pour récupérer de courtes sessions invalidées avant la Compaction, un backend peut activer `reseedFromRawTranscriptWhenUncompacted: true`. Le réamorçage à partir de la transcription brute reste limité en taille et réservé aux invalidations sûres, telles qu’une transcription CLI absente, une fin d’utilisation d’outil orpheline, des modifications de politique de messages, de prompt système, de répertoire de travail ou de MCP, ou une nouvelle tentative après expiration de session ; les changements de profil d’authentification ou d’époque des identifiants ne réamorcent jamais l’historique brut de la transcription.

Sérialisation : `serialize: true` maintient l’ordre des exécutions sur une même voie (la plupart des CLI sérialisent sur une seule voie de fournisseur). OpenClaw abandonne également la réutilisation d’une session CLI enregistrée lorsque l’identité d’authentification sélectionnée change, notamment en cas de changement d’identifiant de profil d’authentification, de clé d’API statique, de jeton statique ou d’identité de compte OAuth lorsque la CLI en expose une ; la rotation des seuls jetons OAuth d’accès ou d’actualisation n’interrompt pas la session. Si une CLI ne dispose pas d’un identifiant de compte OAuth stable, OpenClaw laisse cette CLI appliquer ses propres autorisations de reprise.

## Préambule de repli issu des sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non CLI dans [`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw initialise la tentative suivante avec un préambule de contexte extrait de la transcription JSONL locale de Claude Code (sous `~/.claude/projects/`, indexée par espace de travail). Sans cet amorçage, le fournisseur de repli démarre sans contexte, car la transcription de session propre à OpenClaw est vide pour les exécutions `claude-cli`.

- Le préambule privilégie le résumé `/compact` ou le marqueur `compact_boundary` le plus récent, puis ajoute les échanges les plus récents postérieurs à cette limite jusqu’à atteindre un budget de caractères. Les échanges antérieurs à la limite sont supprimés, car le résumé les représente déjà.
- Les blocs d’outils sont regroupés sous forme d’indications compactes `(tool call: name)` et `(tool result: …)` afin de respecter le budget du prompt ; un résumé trop volumineux est tronqué et étiqueté `(truncated)`.
- Les replis de `claude-cli` vers `claude-cli` chez le même fournisseur reposent sur le propre mécanisme `--resume` de Claude et ignorent le préambule.
- L’amorçage réutilise la validation existante du chemin du fichier de session Claude ; aucun chemin arbitraire ne peut donc être lu.

## Images

Si votre CLI accepte les chemins d’image, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrit les images en base64 dans des fichiers temporaires. Si `imageArg` est défini, ces chemins sont transmis comme arguments de la CLI ; sinon, OpenClaw ajoute les chemins de fichiers au prompt (injection de chemins), ce qui fonctionne pour les CLI qui chargent automatiquement les fichiers locaux à partir de chemins en texte brut.

## Entrées et sorties

- `output: "text"` (valeur par défaut) traite stdout comme réponse finale.
- `output: "json"` tente d’analyser le JSON et d’en extraire le texte ainsi qu’un identifiant de session.
- `output: "jsonl"` analyse un flux JSONL et extrait le message final de l’agent ainsi que les identifiants de session lorsqu’ils sont présents.
- Pour la sortie JSON de Gemini CLI, OpenClaw lit le texte de réponse depuis `response` et les données d’utilisation depuis `stats` lorsque `usage` est absent ou vide. La configuration intégrée par défaut de Gemini CLI utilise `stream-json` ; les anciens remplacements `--output-format json` utilisent toujours l’analyseur JSON.

Modes d’entrée :

- `input: "arg"` (valeur par défaut) transmet le prompt comme dernier argument de la CLI.
- `input: "stdin"` envoie le prompt via stdin.
- Si le prompt est très long et que `maxPromptArgChars` est défini, stdin est utilisé à la place.

## Valeurs par défaut appartenant aux Plugins

Les valeurs par défaut des backends CLI font partie de la surface du Plugin :

- Les Plugins les enregistrent avec `api.registerCliBackend(...)`.
- L’`id` du backend devient le préfixe du fournisseur dans les références de modèle.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du Plugin.
- Le nettoyage de la configuration propre au backend reste sous la responsabilité du Plugin grâce au hook facultatif `normalizeConfig`.

Anthropic possède `claude-cli` et Google possède `google-gemini-cli`. Les exécutions de l’agent OpenAI Codex utilisent l’environnement d’exécution du serveur d’application Codex via `openai/*` ; OpenClaw n’enregistre plus de backend `codex-cli` intégré.

Le Plugin Anthropic intégré enregistre pour `claude-cli` :

| Clé                   | Valeur                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Le plugin Google intégré s'enregistre pour `google-gemini-cli` :

| Clé                       | Valeur                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | identique, avec `--resume {sessionId}`                                                  |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Prérequis : la CLI Gemini locale doit être installée et disponible dans le `PATH` sous le nom `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`).

Remarques sur la sortie de la CLI Gemini :

- L'analyseur `stream-json` par défaut lit les événements `message` de l'assistant, les événements d'outils, l'utilisation indiquée dans le `result` final et les événements d'erreur fatale de Gemini.
- Si vous remplacez les arguments de Gemini par `--output-format json`, OpenClaw renormalise ce backend vers `output: "json"` et lit le texte de la réponse dans le champ JSON `response`.
- L'utilisation se rabat sur `stats` lorsque `usage` est absent ou vide ; `stats.cached` est normalisé en `cacheRead` d'OpenClaw et, si `stats.input` est absent, les jetons d'entrée sont calculés à partir de `stats.input_tokens - stats.cached`.

Ne remplacez les valeurs par défaut que si nécessaire (le plus souvent pour définir un chemin `command` absolu).

## Surcouches de transformation de texte

Les plugins qui nécessitent de petits adaptateurs de compatibilité pour les invites ou les messages peuvent déclarer des transformations de texte bidirectionnelles sans remplacer un fournisseur ni un backend de CLI :

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` réécrit l'invite système et l'invite utilisateur transmises à la CLI. `output` réécrit le texte diffusé de l'assistant et le texte final analysé avant qu'OpenClaw ne traite ses propres marqueurs de contrôle et la remise au canal ; pour les appels de modèle reposant sur un fournisseur, il restaure également les valeurs de chaîne dans les arguments structurés des appels d'outils après la réparation du flux et avant l'exécution des outils. Les fragments JSON bruts du fournisseur restent inchangés ; les consommateurs doivent utiliser la charge utile structurée partielle, finale ou de résultat.

Pour les CLI qui émettent des événements JSONL propres au fournisseur, définissez `jsonlDialect` dans la configuration de ce backend : `claude-stream-json` pour les flux compatibles avec Claude Code, `gemini-stream-json` pour les événements `stream-json` de la CLI Gemini.

## Propriété de la Compaction native

Certains backends de CLI exécutent un agent qui compacte sa propre transcription ; OpenClaw ne doit donc pas exécuter son outil de synthèse de protection sur ceux-ci, car cela entrerait en conflit avec la Compaction propre au backend et pourrait provoquer l'échec complet du tour.

`claude-cli` ne possède aucun point de terminaison de harnais (Claude Code effectue la Compaction en interne) ; il déclare donc `ownsNativeCompaction: true`, et le chemin de Compaction d'OpenClaw renvoie l'entrée de session sans la modifier. Les sessions avec harnais natif, telles que Codex, continuent d'être acheminées vers le point de terminaison de Compaction de leur harnais.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Ne déclarez `ownsNativeCompaction` que pour un backend qui prend réellement en charge la Compaction : il doit limiter de manière fiable sa propre transcription à proximité de la fenêtre de contexte et conserver une session pouvant être reprise (par exemple avec `--resume` / `--session-id`), faute de quoi une session différée peut rester au-delà du budget.

## Surcouches MCP intégrées

Les backends de CLI ne reçoivent pas directement les appels d'outils OpenClaw, mais un backend peut choisir d'utiliser une surcouche de configuration MCP générée avec `bundleMcp: true`. Comportement intégré actuel :

- `claude-cli` : fichier de configuration MCP strict généré.
- `google-gemini-cli` : fichier de paramètres système Gemini généré.

Lorsque le MCP intégré est activé, OpenClaw :

- lance un serveur HTTP MCP en boucle locale qui expose les outils du Gateway au processus de la CLI, authentifié par une autorisation de contexte propre à chaque exécution (`OPENCLAW_MCP_TOKEN`), active uniquement pour la tentative d'exécution en cours ;
- lie l'accès aux outils à la session, au compte et au contexte de canal sélectionnés par le Gateway au lieu de faire confiance aux en-têtes du processus enfant ;
- charge les serveurs MCP intégrés activés pour l'espace de travail actuel et les fusionne avec toute structure existante de configuration ou de paramètres MCP du backend ;
- réécrit la configuration de lancement à l'aide du mode d'intégration propre au backend, défini par le plugin qui en est responsable.

Si aucun serveur MCP n'est activé, OpenClaw injecte tout de même une configuration stricte lorsqu'un backend choisit d'utiliser le MCP intégré, afin que les exécutions en arrière-plan restent isolées.

Les environnements d'exécution MCP intégrés limités à une session sont mis en cache afin d'être réutilisés au sein de cette session, puis supprimés après `mcp.sessionIdleTtlMs` millisecondes d'inactivité (10 minutes par défaut ; définissez `0` pour désactiver cette suppression). Les exécutions intégrées ponctuelles, telles que les sondes d'authentification, la génération de slugs et le rappel d'Active Memory, demandent un nettoyage à la fin de l'exécution afin que les processus enfants stdio et les flux HTTP/SSE diffusables ne survivent pas à l'exécution.

## Limite de l'historique de réensemencement

Lorsqu'une nouvelle session de CLI est initialisée à partir d'une transcription OpenClaw antérieure (par exemple après une nouvelle tentative due à `session_expired`), le bloc `<conversation_history>` généré est limité afin d'éviter une croissance excessive des invites de réensemencement. La valeur par défaut est de 12,288 caractères (environ 3,000 jetons).

Les backends de CLI Claude adaptent plutôt cette limite à la fenêtre de contexte Claude résolue : les fenêtres de contexte plus grandes reçoivent une plus grande portion de l'historique antérieur, jusqu'à un plafond fixe ; les autres backends de CLI conservent la valeur prudente par défaut. Cette limite ne régit que le bloc d'historique antérieur de l'invite de réensemencement ; les limites de sortie des sessions actives sont réglées séparément sous `reliability.outputLimits` (voir [Sessions](#sessions)).

## Limitations

- Aucun appel direct d'outils OpenClaw : OpenClaw n'injecte pas d'appels d'outils dans le protocole du backend de CLI. Les backends ne voient les outils du Gateway que lorsqu'ils choisissent d'utiliser `bundleMcp: true`.
- La diffusion en continu dépend du backend : certains backends diffusent du JSONL, tandis que d'autres mettent les données en mémoire tampon jusqu'à la fin de l'exécution.
- Les sorties structurées dépendent du propre format JSON de la CLI.

## Dépannage

| Symptôme                         | Solution                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| CLI introuvable                  | Définissez `command` sur un chemin complet.                                         |
| Nom de modèle incorrect          | Utilisez `modelAliases` pour associer `provider/model` à l'identifiant de modèle de la CLI. |
| Aucune continuité de session     | Vérifiez que `sessionArg` est défini et que `sessionMode` n'est pas `none`.         |
| Images ignorées                  | Définissez `imageArg` et vérifiez que la CLI prend en charge les chemins de fichiers. |

## Pages connexes

- [Guide d'exploitation du Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
