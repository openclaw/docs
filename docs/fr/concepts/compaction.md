---
read_when:
    - Vous voulez comprendre la compaction automatique et /compact
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-04-30T07:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Chaque modèle dispose d’une fenêtre de contexte : le nombre maximal de tokens qu’il peut traiter. Lorsqu’une conversation approche cette limite, OpenClaw effectue une **Compaction** des anciens messages en un résumé afin que le chat puisse continuer.

## Fonctionnement

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de session.
3. Les messages récents sont conservés intacts.

Quand OpenClaw découpe l’historique en segments de Compaction, il garde les appels d’outils de l’assistant associés à leurs entrées `toolResult` correspondantes. Si un point de découpe tombe à l’intérieur d’un bloc d’outil, OpenClaw déplace la limite afin que la paire reste groupée et que la fin actuelle non résumée soit préservée.

L’historique complet de la conversation reste sur le disque. La Compaction ne change que ce que le modèle voit au tour suivant.

## Compaction automatique

La Compaction automatique est activée par défaut. Elle s’exécute lorsque la session approche de la limite de contexte, ou lorsque le modèle renvoie une erreur de dépassement de contexte (auquel cas OpenClaw effectue une Compaction puis réessaie).

Vous verrez :

- `🧹 Auto-compaction complete` en mode détaillé.
- `/status` affichant `🧹 Compactions: <count>`.

<Info>
Avant d’effectuer une Compaction, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes dans les fichiers de [mémoire](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

<AccordionGroup>
  <Accordion title="Signatures de dépassement reconnues">
    OpenClaw détecte le dépassement de contexte à partir de ces motifs d’erreur de fournisseur :

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manuelle

Saisissez `/compact` dans n’importe quel chat pour forcer une Compaction. Ajoutez des instructions pour guider le résumé :

```
/compact Focus on the API design decisions
```

Lorsque `agents.defaults.compaction.keepRecentTokens` est défini, la Compaction manuelle respecte ce point de coupure Pi et conserve la fin récente dans le contexte reconstruit. Sans budget de conservation explicite, la Compaction manuelle se comporte comme un point de contrôle strict et continue uniquement à partir du nouveau résumé.

## Configuration

Configurez la Compaction sous `agents.defaults.compaction` dans votre `openclaw.json`. Les réglages les plus courants sont listés ci-dessous ; pour la référence complète, consultez [Approfondissement de la gestion de session](/fr/reference/session-management-compaction).

### Utiliser un autre modèle

Par défaut, la Compaction utilise le modèle principal de l’agent. Définissez `agents.defaults.compaction.model` pour déléguer le résumé à un modèle plus performant ou spécialisé. La substitution accepte toute chaîne `provider/model-id` :

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

Cela fonctionne aussi avec les modèles locaux, par exemple un second modèle Ollama dédié au résumé :

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

Lorsqu’il n’est pas défini, la Compaction utilise le modèle principal de l’agent.

### Préservation des identifiants

Le résumé de Compaction préserve par défaut les identifiants opaques (`identifierPolicy: "strict"`). Utilisez `identifierPolicy: "off"` pour désactiver ce comportement, ou `identifierPolicy: "custom"` avec `identifierInstructions` pour des consignes personnalisées.

### Garde de taille en octets de la transcription active

Lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini, OpenClaw déclenche une Compaction locale normale avant une exécution si le JSONL actif atteint cette taille. C’est utile pour les sessions de longue durée où la gestion du contexte côté fournisseur peut garder le contexte du modèle sain tandis que la transcription locale continue de grossir. Cela ne découpe pas les octets JSONL bruts ; cela demande au pipeline de Compaction normal de créer un résumé sémantique.

<Warning>
Le garde de taille en octets nécessite `truncateAfterCompaction: true`. Sans rotation de la transcription, le fichier actif ne rétrécirait pas et le garde resterait inactif.
</Warning>

### Transcriptions successeures

Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé, OpenClaw ne réécrit pas la transcription existante sur place. Il crée une nouvelle transcription successeure active à partir du résumé de Compaction, de l’état préservé et de la fin non résumée, puis conserve le JSONL précédent comme source de point de contrôle archivée.
Les transcriptions successeures suppriment aussi les longs tours utilisateur exactement dupliqués qui arrivent
dans une courte fenêtre de nouvelle tentative, afin que les tempêtes de nouvelles tentatives du canal ne soient pas transportées dans la
prochaine transcription active après la Compaction.

Les points de contrôle pré-Compaction ne sont conservés que tant qu’ils restent sous le plafond de taille des
points de contrôle d’OpenClaw ; les transcriptions actives surdimensionnées sont quand même compactées, mais OpenClaw
ignore le grand instantané de débogage au lieu de doubler l’utilisation du disque.

### Avis de Compaction

Par défaut, la Compaction s’exécute silencieusement. Définissez `notifyUser` pour afficher de brefs messages d’état au démarrage et à la fin de la Compaction :

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

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage silencieux de la mémoire** pour stocker des notes durables sur le disque. Définissez `agents.defaults.compaction.memoryFlush.model` lorsque ce tour de maintenance doit utiliser un modèle local au lieu du modèle de conversation actif :

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

La substitution de modèle pour le vidage de la mémoire est exacte et n’hérite pas de la chaîne de repli de la session active. Consultez [Mémoire](/fr/concepts/memory) pour les détails et la configuration.

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` dans l’API du plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue le résumé au lieu d’utiliser le pipeline LLM intégré.

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

Définir un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et OpenClaw préserve toujours le contexte suffixe des tours récents et des tours découpés après la sortie du fournisseur.

<Note>
Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient au résumé LLM intégré.
</Note>

## Compaction ou élagage

|                  | Compaction                    | Élagage                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ce que cela fait** | Résume les anciennes conversations | Tronque les anciens résultats d’outils |
| **Enregistré ?**       | Oui (dans la transcription de session)   | Non (en mémoire uniquement, par requête) |
| **Portée**        | Conversation entière           | Résultats d’outils uniquement                |

[L’élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui tronque la sortie des outils sans la résumer.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle est peut-être petite, ou les sorties d’outils peuvent être volumineuses. Essayez d’activer [l’élagage de session](/fr/concepts/session-pruning).

**Le contexte semble obsolète après la Compaction ?** Utilisez `/compact Focus on <topic>` pour guider le résumé, ou activez le [vidage de la mémoire](/fr/concepts/memory) afin que les notes survivent.

**Besoin de repartir de zéro ?** `/new` démarre une nouvelle session sans effectuer de Compaction.

Pour la configuration avancée (tokens réservés, préservation des identifiants, moteurs de contexte personnalisés, Compaction côté serveur OpenAI), consultez [Approfondissement de la gestion de session](/fr/reference/session-management-compaction).

## Connexe

- [Session](/fr/concepts/session) : gestion de session et cycle de vie.
- [Élagage de session](/fr/concepts/session-pruning) : troncature des résultats d’outils.
- [Contexte](/fr/concepts/context) : comment le contexte est construit pour les tours de l’agent.
- [Hooks](/fr/automation/hooks) : hooks de cycle de vie de la Compaction (`before_compaction`, `after_compaction`).
