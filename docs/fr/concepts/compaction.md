---
read_when:
    - Vous souhaitez comprendre l’auto-compaction et /compact
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites des modèles
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Chaque modèle possède une fenêtre de contexte : le nombre maximal de tokens qu’il peut traiter. Lorsqu’une conversation approche cette limite, OpenClaw **compacte** les anciens messages en un résumé afin que la discussion puisse continuer.

## Fonctionnement

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de session.
3. Les messages récents sont conservés intacts.

Quand OpenClaw divise l’historique en fragments de Compaction, il conserve les appels d’outils de l’assistant avec leurs entrées `toolResult` correspondantes. Si un point de coupure tombe à l’intérieur d’un bloc d’outil, OpenClaw déplace la limite afin que la paire reste ensemble et que la fin actuelle non résumée soit préservée.

L’historique complet de la conversation reste sur le disque. La Compaction ne change que ce que le modèle voit au tour suivant.

## Auto-compaction

L’auto-compaction est activée par défaut. Elle s’exécute lorsque la session approche de la limite de contexte, ou lorsque le modèle renvoie une erreur de dépassement de contexte (auquel cas OpenClaw compacte et réessaie).

Vous verrez :

- `embedded run auto-compaction start` / `complete` dans les journaux Gateway normaux.
- `🧹 Auto-compaction complete` en mode détaillé.
- `/status` affichant `🧹 Compactions: <count>`.

<Info>
Avant de compacter, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes dans des fichiers [mémoire](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

<AccordionGroup>
  <Accordion title="Signatures de dépassement reconnues">
    OpenClaw détecte les dépassements de contexte à partir de ces motifs d’erreur de fournisseurs :

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manuelle

Saisissez `/compact` dans n’importe quelle discussion pour forcer une Compaction. Ajoutez des instructions pour orienter le résumé :

```
/compact Focus on the API design decisions
```

Lorsque `agents.defaults.compaction.keepRecentTokens` est défini, la Compaction manuelle respecte ce point de coupure OpenClaw et conserve la fin récente dans le contexte reconstruit. Sans budget de conservation explicite, la Compaction manuelle se comporte comme un point de contrôle strict et continue uniquement à partir du nouveau résumé.

## Configuration

Configurez la Compaction sous `agents.defaults.compaction` dans votre `openclaw.json`. Les réglages les plus courants sont listés ci-dessous ; pour la référence complète, consultez [Présentation approfondie de la gestion de session](/fr/reference/session-management-compaction).

### Utiliser un modèle différent

Par défaut, la Compaction utilise le modèle principal de l’agent. Définissez `agents.defaults.compaction.model` pour déléguer la synthèse à un modèle plus performant ou spécialisé. Le remplacement accepte une chaîne `provider/model-id` ou un alias brut configuré sous `agents.defaults.models` :

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

Les alias bruts configurés sont résolus vers leur fournisseur et leur modèle canoniques avant le début de la Compaction. Si une valeur brute correspond à la fois à un alias et à un ID de modèle littéral configuré, l’ID de modèle littéral l’emporte. Une valeur brute sans correspondance reste un ID de modèle sur le fournisseur actif.

Cela fonctionne aussi avec les modèles locaux, par exemple un second modèle Ollama dédié à la synthèse :

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

Lorsqu’elle n’est pas définie, la Compaction démarre avec le modèle de session actif. Si la synthèse échoue avec une erreur de fournisseur éligible au repli de modèle, OpenClaw réessaie cette tentative de Compaction via la chaîne de repli de modèle existante de la session. Le choix de repli est temporaire et n’est pas réécrit dans l’état de session. Un remplacement explicite `agents.defaults.compaction.model` reste exact et n’hérite pas de la chaîne de repli de session.

### Préservation des identifiants

La synthèse de Compaction préserve par défaut les identifiants opaques (`identifierPolicy: "strict"`). Remplacez par `identifierPolicy: "off"` pour désactiver cette option, ou par `identifierPolicy: "custom"` avec `identifierInstructions` pour des consignes personnalisées.

### Garde de taille en octets de la transcription active

Lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini, OpenClaw déclenche une Compaction locale normale avant une exécution si le JSONL actif atteint cette taille. C’est utile pour les sessions de longue durée où la gestion du contexte côté fournisseur peut garder le contexte du modèle sain pendant que la transcription locale continue de croître. Cela ne découpe pas les octets JSONL bruts ; cela demande au pipeline de Compaction normal de créer un résumé sémantique.

<Warning>
La garde de taille en octets nécessite `truncateAfterCompaction: true`. Sans rotation de transcription, le fichier actif ne rétrécirait pas et la garde resterait inactive.
</Warning>

### Transcriptions successeures

Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé, OpenClaw ne réécrit pas la transcription existante sur place. Il crée une nouvelle transcription active successeure à partir du résumé de Compaction, de l’état préservé et de la fin non résumée, puis enregistre des métadonnées de point de contrôle qui dirigent les flux de branchement/restauration vers ce successeur compacté.
Les transcriptions successeures suppriment aussi les longs tours utilisateur exactement dupliqués qui arrivent
dans une courte fenêtre de nouvelle tentative, afin que les tempêtes de retries de canal ne soient pas reportées dans la
transcription active suivante après la Compaction.

OpenClaw n’écrit plus de copies `.checkpoint.*.jsonl` séparées pour les nouvelles
Compactions. Les fichiers de points de contrôle hérités existants peuvent encore être utilisés tant qu’ils sont référencés
et sont élagués par le nettoyage normal des sessions.

### Avis de Compaction

Par défaut, la Compaction s’exécute silencieusement. Définissez `notifyUser` pour afficher de brefs messages d’état lorsque la Compaction commence et se termine :

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

### Vidage de mémoire

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage silencieux de mémoire** afin de stocker sur disque des notes durables. Définissez `agents.defaults.compaction.memoryFlush.model` lorsque ce tour de maintenance doit utiliser un modèle local au lieu du modèle de conversation actif :

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

Le remplacement de modèle de vidage de mémoire est exact et n’hérite pas de la chaîne de repli de la session active. Consultez [Mémoire](/fr/concepts/memory) pour les détails et la configuration.

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` sur l’API du Plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue la synthèse au lieu du pipeline LLM intégré.

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

Définir un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et OpenClaw préserve toujours le contexte de suffixe des tours récents et des tours scindés après la sortie du fournisseur.

<Note>
Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient à la synthèse LLM intégrée.
</Note>

## Compaction ou élagage

|                  | Compaction                    | Élagage                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ce que cela fait** | Résume les anciennes conversations | Tronque les anciens résultats d’outils |
| **Enregistré ?** | Oui (dans la transcription de session) | Non (en mémoire seulement, par requête) |
| **Portée**       | Conversation entière          | Résultats d’outils uniquement    |

[L’élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui tronque la sortie des outils sans la résumer.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle peut être petite, ou les sorties d’outils peuvent être volumineuses. Essayez d’activer [l’élagage de session](/fr/concepts/session-pruning).

**Le contexte semble obsolète après la Compaction ?** Utilisez `/compact Focus on <topic>` pour orienter le résumé, ou activez le [vidage de mémoire](/fr/concepts/memory) afin que les notes survivent.

**Besoin de repartir de zéro ?** `/new` démarre une nouvelle session sans Compaction.

Pour la configuration avancée (tokens réservés, préservation des identifiants, moteurs de contexte personnalisés, Compaction côté serveur OpenAI), consultez la [Présentation approfondie de la gestion de session](/fr/reference/session-management-compaction).

## Associés

- [Session](/fr/concepts/session) : gestion de session et cycle de vie.
- [Élagage de session](/fr/concepts/session-pruning) : troncature des résultats d’outils.
- [Contexte](/fr/concepts/context) : façon dont le contexte est construit pour les tours d’agent.
- [Hooks](/fr/automation/hooks) : hooks du cycle de vie de la Compaction (`before_compaction`, `after_compaction`).
