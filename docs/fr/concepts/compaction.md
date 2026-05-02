---
read_when:
    - Vous souhaitez comprendre l’auto-compaction et /compact
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-05-02T07:03:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Chaque modèle a une fenêtre de contexte : le nombre maximal de tokens qu’il peut traiter. Lorsqu’une conversation approche cette limite, OpenClaw **compacte** les anciens messages en un résumé afin que le chat puisse continuer.

## Fonctionnement

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de session.
3. Les messages récents sont conservés intacts.

Quand OpenClaw divise l’historique en morceaux de Compaction, il conserve les appels d’outils de l’assistant associés à leurs entrées `toolResult` correspondantes. Si un point de division tombe à l’intérieur d’un bloc d’outil, OpenClaw déplace la limite afin que la paire reste groupée et que la fin actuelle non résumée soit préservée.

L’historique complet de la conversation reste sur disque. La Compaction ne change que ce que le modèle voit au tour suivant.

## Compaction automatique

La Compaction automatique est activée par défaut. Elle s’exécute lorsque la session approche de la limite de contexte, ou lorsque le modèle renvoie une erreur de dépassement de contexte, auquel cas OpenClaw compacte puis réessaie.

Vous verrez :

- `🧹 Auto-compaction complete` en mode détaillé.
- `/status` affichant `🧹 Compactions: <count>`.

<Info>
Avant de compacter, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes dans des fichiers de [mémoire](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

<AccordionGroup>
  <Accordion title="Signatures de dépassement reconnues">
    OpenClaw détecte le dépassement de contexte à partir de ces motifs d’erreur des fournisseurs :

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

Lorsque `agents.defaults.compaction.keepRecentTokens` est défini, la Compaction manuelle respecte ce point de coupure Pi et conserve la fin récente dans le contexte reconstruit. Sans budget de conservation explicite, la Compaction manuelle se comporte comme un point de contrôle strict et continue uniquement depuis le nouveau résumé.

## Configuration

Configurez la Compaction sous `agents.defaults.compaction` dans votre `openclaw.json`. Les réglages les plus courants sont listés ci-dessous ; pour la référence complète, consultez [Session management deep dive](/fr/reference/session-management-compaction).

### Utiliser un modèle différent

Par défaut, la Compaction utilise le modèle principal de l’agent. Définissez `agents.defaults.compaction.model` pour déléguer la synthèse à un modèle plus performant ou spécialisé. La surcharge accepte n’importe quelle chaîne `provider/model-id` :

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

Cela fonctionne aussi avec des modèles locaux, par exemple un second modèle Ollama dédié à la synthèse :

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

Lorsqu’elle n’est pas définie, la Compaction commence avec le modèle actif de la session. Si la synthèse échoue avec une erreur de fournisseur éligible au modèle de secours, OpenClaw réessaie cette tentative de Compaction via la chaîne de secours de modèles existante de la session. Le choix de secours est temporaire et n’est pas réécrit dans l’état de session. Une surcharge explicite `agents.defaults.compaction.model` reste exacte et n’hérite pas de la chaîne de secours de la session.

### Préservation des identifiants

La synthèse de Compaction préserve par défaut les identifiants opaques (`identifierPolicy: "strict"`). Utilisez `identifierPolicy: "off"` pour la désactiver, ou `identifierPolicy: "custom"` avec `identifierInstructions` pour fournir des consignes personnalisées.

### Garde sur les octets de transcription active

Lorsque `agents.defaults.compaction.maxActiveTranscriptBytes` est défini, OpenClaw déclenche une Compaction locale normale avant une exécution si le JSONL actif atteint cette taille. C’est utile pour les sessions longues où la gestion du contexte côté fournisseur peut maintenir le contexte du modèle en bon état tandis que la transcription locale continue de croître. Cela ne divise pas les octets JSONL bruts ; cela demande au pipeline normal de Compaction de créer un résumé sémantique.

<Warning>
La garde sur les octets nécessite `truncateAfterCompaction: true`. Sans rotation de transcription, le fichier actif ne rétrécirait pas et la garde resterait inactive.
</Warning>

### Transcriptions successeurs

Lorsque `agents.defaults.compaction.truncateAfterCompaction` est activé, OpenClaw ne réécrit pas la transcription existante sur place. Il crée une nouvelle transcription successeur active à partir du résumé de Compaction, de l’état préservé et de la fin non résumée, puis conserve le JSONL précédent comme source de point de contrôle archivée.
Les transcriptions successeurs suppriment aussi les longs tours utilisateur exactement dupliqués qui arrivent
dans une courte fenêtre de nouvelle tentative, afin que les tempêtes de relance du canal ne soient pas reportées dans la
prochaine transcription active après Compaction.

Les points de contrôle pré-Compaction ne sont conservés que tant qu’ils restent sous le
plafond de taille des points de contrôle d’OpenClaw ; les transcriptions actives surdimensionnées sont tout de même compactées, mais OpenClaw
ignore le grand instantané de débogage au lieu de doubler l’utilisation du disque.

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

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage de mémoire silencieux** afin de stocker des notes durables sur disque. Définissez `agents.defaults.compaction.memoryFlush.model` lorsque ce tour de maintenance doit utiliser un modèle local plutôt que le modèle de conversation actif :

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

La surcharge du modèle de vidage de mémoire est exacte et n’hérite pas de la chaîne de secours de la session active. Consultez [Mémoire](/fr/concepts/memory) pour les détails et la configuration.

## Fournisseurs de Compaction enfichables

Les Plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` dans l’API de Plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue la synthèse au lieu d’utiliser le pipeline LLM intégré.

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

Définir un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et OpenClaw préserve toujours le contexte suffixe des tours récents et des tours divisés après la sortie du fournisseur.

<Note>
Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient à la synthèse LLM intégrée.
</Note>

## Compaction ou élagage

|                  | Compaction                         | Élagage                                      |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| **Ce que cela fait** | Résume les anciennes conversations | Tronque les anciens résultats d’outils      |
| **Enregistré ?** | Oui (dans la transcription de session) | Non (en mémoire seulement, par requête) |
| **Portée**       | Conversation entière               | Résultats d’outils uniquement               |

[L’élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui tronque la sortie des outils sans la résumer.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle peut être petite, ou les sorties d’outils peuvent être volumineuses. Essayez d’activer [l’élagage de session](/fr/concepts/session-pruning).

**Le contexte semble obsolète après Compaction ?** Utilisez `/compact Focus on <topic>` pour guider le résumé, ou activez le [vidage de mémoire](/fr/concepts/memory) afin que les notes survivent.

**Besoin de repartir de zéro ?** `/new` démarre une nouvelle session sans Compaction.

Pour la configuration avancée (tokens réservés, préservation des identifiants, moteurs de contexte personnalisés, Compaction côté serveur OpenAI), consultez [Session management deep dive](/fr/reference/session-management-compaction).

## Connexe

- [Session](/fr/concepts/session) : gestion et cycle de vie des sessions.
- [Élagage de session](/fr/concepts/session-pruning) : troncature des résultats d’outils.
- [Contexte](/fr/concepts/context) : construction du contexte pour les tours d’agent.
- [Hooks](/fr/automation/hooks) : hooks de cycle de vie de la Compaction (`before_compaction`, `after_compaction`).
