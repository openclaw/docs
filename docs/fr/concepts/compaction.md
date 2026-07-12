---
read_when:
    - Vous souhaitez comprendre la Compaction automatique et `/compact`
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour respecter les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-07-12T15:12:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Chaque modèle dispose d’une fenêtre de contexte : le nombre maximal de tokens qu’il peut traiter. Lorsqu’une conversation approche de cette limite, OpenClaw **compacte** les messages les plus anciens dans un résumé afin que la discussion puisse continuer.

## Fonctionnement

1. Les tours de conversation les plus anciens sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de la session.
3. Les messages récents sont conservés intacts.

OpenClaw conserve les appels d’outils de l’assistant avec leurs entrées `toolResult` correspondantes lorsqu’il choisit un point de séparation pour la Compaction. Si ce point se situe dans un bloc d’outil, OpenClaw déplace la limite afin de conserver la paire ensemble et de préserver la fin actuelle non résumée.

L’historique complet de la conversation reste sur le disque. La Compaction modifie uniquement ce que le modèle voit au tour suivant.

<Note>
Les nouvelles configurations définissent par défaut `agents.defaults.compaction.mode` sur `"safeguard"` (garde-fous plus stricts, audits de la qualité des résumés). Définissez explicitement `mode: "default"` pour désactiver ce comportement.
</Note>

## Compaction automatique

La Compaction automatique est activée par défaut. Elle s’exécute lorsque la session approche de la limite de contexte ou lorsque le modèle renvoie une erreur de dépassement du contexte (auquel cas OpenClaw compacte puis réessaie).

Vous verrez :

- `embedded run auto-compaction start` / `complete` dans les journaux normaux du Gateway.
- `🧹 Auto-compaction complete` en mode détaillé.
- `/status` affichant `🧹 Compactions: <count>`.

<Info>
Avant la Compaction, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes dans les fichiers de [mémoire](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

<AccordionGroup>
  <Accordion title="Schémas d’erreur de dépassement reconnus par OpenClaw">
    OpenClaw reconnaît des dizaines de chaînes d’erreur de dépassement propres aux fournisseurs (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter, entre autres). Exemples courants :

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manuelle

Saisissez `/compact` dans n’importe quelle discussion pour forcer une Compaction. Ajoutez des instructions pour orienter le résumé :

```text
/compact Concentrez-vous sur les décisions de conception de l’API
```

Lorsque `agents.defaults.compaction.keepRecentTokens` est défini (valeur par défaut : 20,000), la Compaction manuelle respecte ce point de coupure et conserve la fin récente dans le contexte reconstruit. Sans budget de conservation explicite, la Compaction manuelle se comporte comme un point de contrôle strict et se poursuit uniquement à partir du nouveau résumé.

## Configuration

Configurez la Compaction sous `agents.defaults.compaction` dans votre fichier `openclaw.json`. Les paramètres les plus courants sont répertoriés ci-dessous ; pour consulter la référence complète, reportez-vous à l’[étude approfondie de la gestion des sessions](/fr/reference/session-management-compaction).

### Utilisation d’un autre modèle

Par défaut, la Compaction utilise le modèle principal de l’agent. Définissez `agents.defaults.compaction.model` pour déléguer la génération du résumé à un modèle plus performant ou spécialisé. La valeur de remplacement accepte une chaîne `provider/model-id` ou un alias simple configuré sous `agents.defaults.models` :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Les alias simples configurés sont résolus vers leur fournisseur et leur modèle canoniques avant le début de la Compaction. Si une valeur simple correspond à la fois à un alias et à un ID de modèle littéral configuré, l’ID de modèle littéral est prioritaire. Une valeur simple sans correspondance reste un ID de modèle sur le fournisseur actif.

Cela fonctionne également avec les modèles locaux, par exemple un second modèle Ollama dédié à la génération de résumés :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Lorsque ce paramètre n’est pas défini, la Compaction commence avec le modèle actif de la session. Si la génération du résumé échoue avec une erreur de fournisseur autorisant le recours à un modèle de repli, OpenClaw réessaie cette tentative de Compaction à l’aide de la chaîne de modèles de repli existante de la session. Le choix du modèle de repli est temporaire et n’est pas réenregistré dans l’état de la session. Une valeur de remplacement explicite pour `agents.defaults.compaction.model` reste exacte et n’hérite pas de la chaîne de repli de la session.

### Conservation des identifiants

La génération du résumé de Compaction conserve les identifiants opaques par défaut (`identifierPolicy: "strict"`). Utilisez `identifierPolicy: "off"` pour désactiver ce comportement, ou `identifierPolicy: "custom"` avec `identifierInstructions` pour fournir des instructions personnalisées.

### Limite en octets de la transcription active

Lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini, OpenClaw
déclenche une Compaction locale normale avant une exécution si l’historique de la transcription atteint
cette taille. Cela est utile pour les sessions de longue durée dans lesquelles la gestion du contexte
côté fournisseur peut maintenir le contexte du modèle en bon état alors que l’historique persistant de la transcription
continue de croître. Cette limite ne divise pas les octets bruts ; elle demande au pipeline normal de
Compaction de créer un résumé sémantique.

<Warning>
La limite en octets s’applique à l’historique actif de la transcription SQLite. Les anciens artefacts de point de contrôle
JSONL ne constituent pas la cible active de la Compaction.
</Warning>

### Transcriptions successeures

Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé, OpenClaw ne réécrit pas la transcription existante sur place. Il crée une nouvelle transcription successeure active à partir du résumé de la Compaction, de l’état conservé et de la fin non résumée, puis enregistre les métadonnées du point de contrôle qui orientent les flux de branchement et de restauration vers cette version successeure compactée.
Les transcriptions successeures suppriment également les tours utilisateur longs qui sont des doublons exacts et arrivent
dans une courte fenêtre de nouvelle tentative, afin que les vagues de nouvelles tentatives des canaux ne soient pas reportées dans la
prochaine transcription active après la Compaction.

OpenClaw n’écrit plus de copies `.checkpoint.*.jsonl` distinctes pour les nouvelles
Compactions. Les fichiers de point de contrôle existants hérités peuvent encore être utilisés tant qu’ils sont référencés
et sont supprimés par le nettoyage normal des sessions.

### Notifications de Compaction

Par défaut, la Compaction s’exécute silencieusement. Définissez `notifyUser` pour afficher de brefs messages d’état au début et à la fin de la Compaction, et pour signaler un état dégradé lorsque les tentatives de vidage de la mémoire avant la Compaction sont épuisées, mais que la réponse se poursuit malgré tout :

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Vidage de la mémoire

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage silencieux de la mémoire** afin d’enregistrer des notes persistantes sur le disque. Définissez `agents.defaults.compaction.memoryFlush.model` lorsque ce tour de maintenance doit utiliser un modèle local plutôt que le modèle actif de la conversation :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

La valeur de remplacement du modèle de vidage de la mémoire est exacte et n’hérite pas de la chaîne de repli de la session active. Consultez [Mémoire](/fr/concepts/memory) pour plus de détails et d’informations sur la configuration.

## Fournisseurs de Compaction modulaires

Les Plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` dans l’API du Plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue la génération du résumé au lieu d’utiliser le pipeline LLM intégré.

Pour utiliser un fournisseur enregistré, définissez son identifiant dans votre configuration :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

La définition d’un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de conservation des identifiants que le chemin intégré, et OpenClaw conserve toujours le contexte suffixe des tours récents et des tours séparés après la sortie du fournisseur.

<Note>
Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient à la génération de résumé LLM intégrée.
</Note>

## Compaction et élagage

|                     | Compaction                                  | Élagage                                        |
| ------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Fonction**        | Résume les conversations les plus anciennes | Supprime les anciens résultats d’outils        |
| **Enregistré ?**    | Oui (dans la transcription de la session)   | Non (uniquement en mémoire, par requête)        |
| **Portée**          | Conversation entière                        | Résultats d’outils uniquement                   |

L’[élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui réduit les sorties des outils sans les résumer.

## Résolution des problèmes

**Compactions trop fréquentes ?** La fenêtre de contexte du modèle est peut-être petite, ou les sorties des outils sont peut-être volumineuses. Essayez d’activer l’[élagage de session](/fr/concepts/session-pruning).

**Le contexte semble obsolète après la Compaction ?** Utilisez `/compact Focus on <topic>` pour orienter le résumé, ou activez le [vidage de la mémoire](/fr/concepts/memory) afin que les notes soient conservées.

**Besoin de repartir de zéro ?** `/new` démarre une nouvelle session sans effectuer de Compaction.

Pour la configuration avancée (tokens réservés, conservation des identifiants, moteurs de contexte personnalisés, Compaction côté serveur OpenAI), consultez l’[étude approfondie de la gestion des sessions](/fr/reference/session-management-compaction).

## Voir aussi

- [Session](/fr/concepts/session) : gestion et cycle de vie des sessions.
- [Élagage de session](/fr/concepts/session-pruning) : réduction des résultats d’outils.
- [Contexte](/fr/concepts/context) : création du contexte pour les tours de l’agent.
- [Hooks](/fr/automation/hooks) : hooks du cycle de vie de la Compaction (`before_compaction`, `after_compaction`).
