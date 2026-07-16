---
read_when:
    - Vous souhaitez une solution de repli fiable en cas de défaillance des fournisseurs d’API
    - Vous exécutez des CLI d’IA locales et souhaitez les réutiliser
    - Vous souhaitez comprendre le pont de bouclage MCP pour l’accès aux outils du backend CLI
summary: 'Backends CLI : solution de secours locale pour la CLI d’IA avec pont d’outils MCP facultatif'
title: Backends CLI
x-i18n:
    generated_at: "2026-07-16T13:14:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw peut exécuter une CLI d’IA locale comme solution de secours en mode texte uniquement lorsque les fournisseurs d’API sont indisponibles, limitent le débit ou fonctionnent mal. Cette approche est volontairement prudente :

- Les outils OpenClaw ne sont pas injectés directement, mais un backend doté de `bundleMcp: true` peut recevoir les outils du Gateway par l’intermédiaire d’un pont MCP en boucle locale.
- Diffusion JSONL pour les CLI qui la prennent en charge.
- Les sessions sont prises en charge, afin que les échanges suivants restent cohérents.
- Les images sont transmises si la CLI accepte les chemins d’images.

Utilisez cette fonctionnalité comme filet de sécurité pour obtenir des réponses textuelles qui « fonctionnent toujours », et non comme voie principale. Pour un environnement d’exécution complet avec contrôles de session ACP, tâches en arrière-plan, liaison aux fils de discussion/conversations et sessions de codage externes persistantes, utilisez plutôt les [agents ACP](/fr/tools/acp-agents) ; les backends CLI ne sont pas ACP.

<Tip>
  Vous créez un nouveau Plugin de backend ? Consultez [Plugins de backend CLI](/fr/plugins/cli-backend-plugins). Cette page explique comment configurer et exploiter un backend déjà enregistré.
</Tip>

## Démarrage rapide

Le Plugin Anthropic intégré enregistre un backend `claude-cli` par défaut. Il fonctionne donc sans configuration supplémentaire, à condition que Claude Code soit installé et que la connexion soit établie :

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` est l’identifiant d’agent par défaut lorsqu’aucune liste d’agents explicite n’est configurée ; sinon, remplacez-le par votre propre identifiant d’agent.

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

Si vous utilisez un backend CLI intégré comme fournisseur principal de messages sur un hôte de Gateway, OpenClaw charge automatiquement le Plugin intégré propriétaire lorsque votre configuration référence ce backend dans une référence de modèle ou sous `agents.defaults.cliBackends`.

## Utilisation comme solution de secours

Ajoutez le backend CLI à votre liste de solutions de secours afin qu’il ne s’exécute qu’en cas d’échec des modèles principaux :

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

Si vous utilisez `agents.defaults.models` comme liste d’autorisation, incluez-y également les modèles de votre backend CLI. Lorsque le fournisseur principal échoue (authentification, limites de débit, délais d’expiration), OpenClaw essaie ensuite le backend CLI.

## Configuration

Tous les backends CLI se trouvent sous `agents.defaults.cliBackends`, indexés par identifiant de fournisseur (par exemple `claude-cli`, `my-cli`). L’identifiant du fournisseur devient la partie gauche de la référence de modèle : `<provider>/<model>`.

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
          // Indicateur dédié au fichier d’invite :
          // systemPromptFileArg: "--system-file",
          // Ou indicateur de remplacement de configuration de style Codex :
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Activez cette option uniquement si ce backend peut réinitialiser les sessions invalidées à partir
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
2. Construit une invite système à l’aide de la même invite OpenClaw et du même contexte d’espace de travail.
3. Exécute la CLI avec un identifiant de session (si cette fonctionnalité est prise en charge) afin que l’historique reste cohérent. Le backend `claude-cli` intégré maintient un processus stdio Claude actif pour chaque session OpenClaw et envoie les échanges suivants via l’entrée standard stream-json.
4. Analyse la sortie (JSON ou texte brut) et renvoie le texte final.
5. Conserve les identifiants de session pour chaque backend afin que les échanges suivants réutilisent la même session CLI.

### Particularités de la CLI Claude

Le backend `claude-cli` intégré privilégie le résolveur de compétences natif de Claude Code. Lorsque l’instantané actuel des compétences contient au moins une compétence sélectionnée disposant d’un chemin matérialisé, OpenClaw transmet un Plugin Claude Code temporaire via `--plugin-dir` et omet le catalogue de compétences OpenClaw redondant de l’invite système ajoutée. En l’absence de compétence de Plugin matérialisée, OpenClaw conserve le catalogue de l’invite comme solution de secours. Les remplacements de variables d’environnement et de clés d’API des compétences continuent de s’appliquer à l’environnement du processus enfant pendant l’exécution.

La CLI Claude dispose de son propre mode d’autorisation non interactif ; OpenClaw le met en correspondance avec la politique d’exécution existante au lieu d’ajouter une configuration propre à Claude. Pour les sessions Claude actives gérées par OpenClaw, la politique d’exécution effective fait autorité : le mode YOLO (`tools.exec.security: "full"` et `tools.exec.ask: "off"`) lance normalement Claude avec `--permission-mode bypassPermissions`, tandis qu’une politique restrictive le lance avec `--permission-mode default`. Les Gateways exécutés en tant que root utilisent également `default`, car Claude Code refuse le mode de contournement pour root ; OpenClaw continue de répondre aux demandes de contrôle des outils stdio de Claude conformément à la politique d’exécution configurée. Les paramètres `agents.list[].tools.exec` propres à chaque agent remplacent le paramètre global `tools.exec` pour cet agent. Les arguments bruts du backend peuvent toujours inclure `--permission-mode`, mais les lancements Claude actifs normalisent cet indicateur afin qu’il corresponde à la politique effective et aux restrictions de l’hôte.

Le backend met également en correspondance les niveaux `/think` d’OpenClaw avec l’indicateur natif `--effort` de Claude Code : `minimal`/`low` -> `low`, `medium` -> `medium`, et `high`/`xhigh`/`max` sont transmis directement. Les niveaux d’effort Fable 5 pris en charge restent ainsi identiques pour les voies Claude CLI reposant sur un abonnement et celles utilisant une clé d’API. `adaptive` supprime les indicateurs `--effort` configurés sans les remplacer, de sorte que Claude Code détermine l’effort effectif à partir de son propre environnement, de ses paramètres et des valeurs par défaut du modèle. Pour que `/think` affecte la CLI lancée, les autres backends CLI doivent disposer d’un Plugin propriétaire déclarant un mécanisme équivalent de mise en correspondance des arguments.

Avant qu’OpenClaw puisse utiliser `claude-cli`, Claude Code doit être connecté sur le même hôte :

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Pour les installations Docker, Claude Code doit être installé et connecté dans le répertoire personnel persistant du conteneur, et pas uniquement sur l’hôte ; consultez [Backend CLI Claude dans Docker](/fr/install/docker#claude-cli-backend-in-docker).

Définissez `agents.defaults.cliBackends.claude-cli.command` uniquement lorsque le binaire `claude` ne figure pas déjà dans `PATH`.

## Sessions

- Si la CLI prend en charge les sessions, définissez `sessionArg` (par exemple `--session-id`), ou `sessionArgs` (espace réservé `{sessionId}`) lorsque l’identifiant doit être inséré dans plusieurs indicateurs.
- Si la CLI utilise une sous-commande de reprise avec des indicateurs différents, définissez `resumeArgs` (remplace `args` lors de la reprise) et, éventuellement, `resumeOutput` pour les reprises non JSON.
- `sessionMode` :
  - `always` : toujours envoyer un identifiant de session (un nouvel UUID si aucun n’est enregistré).
  - `existing` : envoyer un identifiant de session uniquement si un identifiant a déjà été enregistré.
  - `none` : ne jamais envoyer d’identifiant de session.
- `claude-cli` utilise par défaut `liveSession: "claude-stdio"`, `output: "jsonl"` et `input: "stdin"`, afin que les échanges suivants réutilisent le processus Claude actif tant qu’il est disponible, y compris avec les configurations personnalisées qui omettent les champs de transport. Si le Gateway redémarre ou si le processus inactif se termine, OpenClaw reprend à partir de l’identifiant de session Claude enregistré. Avant la reprise, les identifiants de session enregistrés sont vérifiés par rapport à une transcription de projet lisible ; si la transcription est absente, la liaison est supprimée (avec une journalisation sous `reason=transcript-missing`) au lieu de démarrer silencieusement une nouvelle session sous `--resume`.
- Les sessions Claude actives conservent des limites de sécurité pour la sortie JSONL : 8 Mio et 20,000 lignes JSONL brutes par échange par défaut. Augmentez-les pour chaque backend avec `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` et `maxTurnLines` ; OpenClaw plafonne ces paramètres à 64 Mio et 100,000 lignes.
- Les sessions CLI enregistrées assurent une continuité appartenant au fournisseur. La réinitialisation quotidienne implicite de la session ne les interrompt pas ; les politiques `/reset` et `session.reset` explicites continuent de le faire.
- Les nouvelles sessions CLI ne sont normalement réinitialisées qu’à partir du résumé de Compaction d’OpenClaw et de la partie qui suit la Compaction. Pour récupérer de courtes sessions invalidées avant la Compaction, un backend peut activer `reseedFromRawTranscriptWhenUncompacted: true`. La réinitialisation à partir de la transcription brute reste limitée en taille et aux invalidations sûres, telles qu’une transcription CLI manquante, une fin d’utilisation d’outil orpheline, des changements de politique de messages, d’invite système, de répertoire de travail ou de MCP, ou une nouvelle tentative après expiration de la session ; les changements de profil d’authentification ou d’époque des identifiants ne réinitialisent jamais l’historique de transcription brute.

Sérialisation : `serialize: true` maintient dans l’ordre les exécutions d’une même voie (la plupart des CLI sérialisent sur une seule voie de fournisseur). OpenClaw cesse également de réutiliser la session CLI enregistrée lorsque l’identité d’authentification sélectionnée change, notamment en cas de modification de l’identifiant du profil d’authentification, de la clé d’API statique, du jeton statique ou de l’identité du compte OAuth lorsque la CLI en expose une ; la seule rotation des jetons d’accès ou d’actualisation OAuth n’interrompt pas la session. Si une CLI ne dispose pas d’un identifiant de compte OAuth stable, OpenClaw la laisse appliquer ses propres autorisations de reprise.

## Préambule de secours issu des sessions claude-cli

Lorsqu’une tentative `claude-cli` bascule vers un candidat non-CLI dans [`agents.defaults.model.fallbacks`](/fr/concepts/model-failover), OpenClaw initialise la tentative suivante avec un préambule contextuel extrait de la transcription JSONL locale de Claude Code (sous `~/.claude/projects/`, indexée par espace de travail). Sans cette initialisation, le fournisseur de secours démarre sans contexte, car la transcription de session propre à OpenClaw est vide pour les exécutions `claude-cli`.

- Le préambule privilégie le résumé `/compact` ou le marqueur `compact_boundary` le plus récent, puis ajoute les échanges les plus récents suivant cette limite, jusqu’à atteindre un budget de caractères. Les échanges antérieurs à cette limite sont supprimés, car le résumé les représente déjà.
- Les blocs d’outils sont regroupés sous forme d’indications `(tool call: name)` et `(tool result: …)` compactes afin de préserver l’exactitude du budget de l’invite ; un résumé trop volumineux est tronqué et marqué `(truncated)`.
- Les basculements du même fournisseur de `claude-cli` vers `claude-cli` s’appuient sur le mécanisme `--resume` propre à Claude et ignorent le préambule.
- L’initialisation réutilise la validation existante du chemin du fichier de session Claude, ce qui empêche la lecture de chemins arbitraires.

## Images

Si votre CLI accepte les chemins d’images, définissez `imageArg` :

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw écrit les images en base64 dans des fichiers temporaires. Si `imageArg` est défini, ces chemins sont transmis comme arguments de la CLI ; sinon, OpenClaw ajoute les chemins des fichiers à l’invite (injection de chemin), ce qui fonctionne avec les CLI qui chargent automatiquement les fichiers locaux à partir de chemins en texte brut.

## Entrées et sorties

- `output: "text"` (par défaut) traite la sortie standard comme réponse finale.
- `output: "json"` tente d’analyser le JSON et d’en extraire le texte ainsi qu’un identifiant de session.
- `output: "jsonl"` analyse un flux JSONL et en extrait le message final de l’agent ainsi que les identifiants de session lorsqu’ils sont présents.
- Pour la sortie JSON de la CLI Gemini, OpenClaw lit le texte de la réponse depuis `response` et les données d’utilisation depuis `stats` lorsque `usage` est absent ou vide. La configuration intégrée par défaut de la CLI Gemini utilise `stream-json` ; les anciens remplacements `--output-format json` continuent d’utiliser l’analyseur JSON.

Modes d’entrée :

- `input: "arg"` (par défaut) transmet le prompt comme dernier argument de la CLI.
- `input: "stdin"` envoie le prompt via l'entrée standard.
- Si le prompt est très long et que `maxPromptArgChars` est défini, l'entrée standard est utilisée à la place.

## Valeurs par défaut détenues par les plugins

Les valeurs par défaut des backends CLI font partie de la surface du plugin :

- Les plugins les enregistrent avec `api.registerCliBackend(...)`.
- Le `id` du backend devient le préfixe du fournisseur dans les références de modèles.
- La configuration utilisateur dans `agents.defaults.cliBackends.<id>` remplace toujours la valeur par défaut du plugin.
- Le nettoyage de la configuration propre au backend reste sous la responsabilité du plugin grâce au hook facultatif `normalizeConfig`.

Anthropic détient `claude-cli` et Google détient `google-gemini-cli`. Les exécutions d'agents OpenAI Codex utilisent le harnais du serveur d'application Codex via `openai/*` ; OpenClaw n'enregistre plus de backend `codex-cli` intégré.

Le plugin Anthropic intégré s'enregistre pour `claude-cli` :

| Clé                   | Valeur                                                                                                                                                                                                         |
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

| Clé                       | Valeur                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | identique, avec `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Prérequis : la CLI Gemini locale doit être installée et disponible dans `PATH` sous le nom `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`).

Remarques sur la sortie de la CLI Gemini :

- L'analyseur `stream-json` par défaut lit les événements `message` de l'assistant, les événements d'outils, l'utilisation `result` finale et les événements d'erreur fatale de Gemini.
- Si vous remplacez les arguments de Gemini par `--output-format json`, OpenClaw normalise à nouveau ce backend vers `output: "json"` et lit le texte de la réponse dans le champ JSON `response`.
- L'utilisation se rabat sur `stats` lorsque `usage` est absent ou vide ; `stats.cached` est normalisé en `cacheRead` d'OpenClaw et, si `stats.input` est manquant, les jetons d'entrée sont dérivés de `stats.input_tokens - stats.cached`.

Ne remplacez les valeurs par défaut que si nécessaire (le plus souvent par un chemin `command` absolu).

## Surcouches de transformation de texte

Les plugins qui nécessitent de petites adaptations de compatibilité des prompts ou des messages peuvent déclarer des transformations de texte bidirectionnelles sans remplacer un fournisseur ni un backend CLI :

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` réécrit le prompt système et le prompt utilisateur transmis à la CLI. `output` réécrit le texte de l'assistant diffusé en continu et le texte final analysé avant qu'OpenClaw ne traite ses propres marqueurs de contrôle et la remise au canal ; pour les appels de modèles adossés à un fournisseur, il restaure également les valeurs de chaîne dans les arguments structurés des appels d'outils après la réparation du flux et avant l'exécution des outils. Les fragments JSON bruts du fournisseur restent inchangés ; les consommateurs doivent utiliser la charge utile structurée partielle, de fin ou de résultat.

Pour les CLI qui émettent des événements JSONL propres au fournisseur, définissez `jsonlDialect` dans la configuration de ce backend : `claude-stream-json` pour les flux compatibles avec Claude Code, `gemini-stream-json` pour les événements `stream-json` de la CLI Gemini.

## Responsabilité de la compaction native

Certains backends CLI exécutent un agent qui compacte sa propre transcription. OpenClaw ne doit donc pas exécuter son mécanisme de synthèse de protection sur ceux-ci : cela entre en conflit avec la propre compaction du backend et peut provoquer l'échec définitif du tour.

`claude-cli` ne possède aucun point de terminaison de harnais (Claude Code effectue la compaction en interne) ; il déclare donc `ownsNativeCompaction: true`, et le chemin de compaction d'OpenClaw renvoie l'entrée de session inchangée. OpenClaw transmet le budget de contexte effectif de l'exécution par l'intermédiaire de la variable [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) documentée par Claude Code, afin de maintenir la compaction automatique native alignée sur les limites `contextTokens` configurées d'Anthropic. Les sessions avec un harnais natif, comme Codex, continuent plutôt d'être acheminées vers le point de terminaison de compaction de leur harnais.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Ne déclarez `ownsNativeCompaction` que pour un backend qui prend réellement en charge la compaction : il doit limiter de manière fiable sa propre transcription à proximité de la fenêtre de contexte et conserver une session pouvant être reprise (par exemple `--resume` / `--session-id`), faute de quoi une session différée peut rester au-dessus du budget.

## Surcouches MCP du bundle

Les backends CLI ne reçoivent pas directement les appels d'outils d'OpenClaw, mais un backend peut choisir d'utiliser une surcouche de configuration MCP générée avec `bundleMcp: true`. Comportement intégré actuel :

- `claude-cli` : fichier de configuration MCP strict généré.
- `google-gemini-cli` : fichier de paramètres système Gemini généré.

Lorsque le MCP du bundle est activé, OpenClaw :

- lance un serveur MCP HTTP en boucle locale qui expose les outils du Gateway au processus CLI, authentifié par une autorisation de contexte propre à l'exécution (`OPENCLAW_MCP_TOKEN`), active uniquement pour la tentative d'exécution en cours ;
- lie l'accès aux outils au contexte de session, de compte et de canal sélectionné par le Gateway au lieu de faire confiance aux en-têtes du processus enfant ;
- charge les serveurs MCP du bundle activés pour l'espace de travail actuel et les fusionne avec toute structure de configuration ou de paramètres MCP existante du backend ;
- réécrit la configuration de lancement à l'aide du mode d'intégration détenu par le backend dans le plugin responsable.

Si aucun serveur MCP n'est activé, OpenClaw injecte tout de même une configuration stricte lorsqu'un backend choisit d'utiliser le MCP du bundle, afin que les exécutions en arrière-plan restent isolées.

Les environnements d'exécution MCP intégrés limités à une session sont mis en cache afin d'être réutilisés au sein d'une session, puis supprimés après `mcp.sessionIdleTtlMs` millisecondes d'inactivité (10 minutes par défaut ; définissez `0` pour désactiver cette suppression). Les exécutions intégrées ponctuelles, comme les vérifications d'authentification, la génération de slugs et le rappel de la mémoire active, demandent un nettoyage à la fin de l'exécution afin que les processus enfants stdio et les flux HTTP/SSE diffusables ne survivent pas à l'exécution.

## Limite de l'historique de réamorçage

Lorsqu'une nouvelle session CLI est initialisée à partir d'une transcription OpenClaw antérieure (par exemple après une nouvelle tentative `session_expired`), le bloc `<conversation_history>` rendu est limité afin d'éviter que les prompts de réamorçage ne deviennent démesurés. La valeur par défaut est de 12,288 caractères (environ 3,000 jetons).

Pour les backends de la CLI Claude, cette limite est plutôt ajustée en fonction de la fenêtre de contexte Claude résolue : les fenêtres de contexte plus grandes reçoivent une portion plus importante de l'historique antérieur, jusqu'à un plafond fixe ; les autres backends CLI conservent la valeur par défaut prudente. Cette limite régit uniquement le bloc d'historique antérieur du prompt de réamorçage ; les limites de sortie des sessions actives sont réglées séparément sous `reliability.outputLimits` (voir [Sessions](#sessions)).

## Limites

- Aucun appel direct aux outils OpenClaw : OpenClaw n'injecte pas d'appels d'outils dans le protocole du backend CLI. Les backends ne voient les outils du Gateway que lorsqu'ils choisissent d'utiliser `bundleMcp: true`.
- La diffusion en continu dépend du backend : certains backends diffusent du JSONL, tandis que d'autres mettent les données en mémoire tampon jusqu'à la fin du processus.
- Les sorties structurées dépendent du propre format JSON de la CLI.

## Dépannage

| Symptôme               | Correction                                                               |
| --------------------- | ----------------------------------------------------------------- |
| CLI introuvable         | Définissez `command` sur un chemin complet.                                     |
| Nom de modèle incorrect      | Utilisez `modelAliases` pour associer `provider/model` à l'identifiant de modèle de la CLI. |
| Aucune continuité de session | Vérifiez que `sessionArg` est défini et que `sessionMode` n'est pas `none`.       |
| Images ignorées        | Définissez `imageArg` et vérifiez que la CLI prend en charge les chemins de fichiers.            |

## Voir aussi

- [Guide d'exploitation du Gateway](/fr/gateway)
- [Modèles locaux](/fr/gateway/local-models)
