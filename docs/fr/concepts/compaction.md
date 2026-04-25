---
read_when:
    - Vous souhaitez comprendre la Compaction automatique et `/compact`
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Chaque modèle possède une fenêtre de contexte -- le nombre maximal de jetons qu’il peut traiter.
Lorsqu’une conversation s’approche de cette limite, OpenClaw effectue une **Compaction** des anciens messages
en un résumé afin que la discussion puisse continuer.

## Fonctionnement

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans le transcript de session.
3. Les messages récents sont conservés intacts.

Lorsque OpenClaw découpe l’historique en blocs de Compaction, il conserve les appels d’outils
de l’assistant associés à leurs entrées `toolResult` correspondantes. Si un point de découpage tombe
au milieu d’un bloc d’outil, OpenClaw déplace la frontière afin que la paire reste groupée et
que la fin actuelle non résumée soit préservée.

L’historique complet de la conversation reste stocké sur disque. La Compaction modifie uniquement ce que le
modèle voit au tour suivant.

## Compaction automatique

La Compaction automatique est activée par défaut. Elle s’exécute lorsque la session s’approche de la limite de
contexte, ou lorsque le modèle renvoie une erreur de dépassement de contexte (dans ce cas,
OpenClaw effectue une Compaction puis réessaie). Les signatures de dépassement typiques incluent
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` et `ollama error: context length
exceeded`.

<Info>
Avant d’effectuer une Compaction, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes
dans les fichiers de [memory](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

Utilisez le paramètre `agents.defaults.compaction` dans votre `openclaw.json` pour configurer le comportement de la Compaction (mode, jetons cibles, etc.).
La synthèse de Compaction préserve par défaut les identifiants opaques (`identifierPolicy: "strict"`). Vous pouvez remplacer ce comportement avec `identifierPolicy: "off"` ou fournir un texte personnalisé avec `identifierPolicy: "custom"` et `identifierInstructions`.

Vous pouvez facultativement spécifier un modèle différent pour la synthèse de Compaction via `agents.defaults.compaction.model`. Cela est utile lorsque votre modèle principal est un modèle local ou petit et que vous souhaitez que les résumés de Compaction soient produits par un modèle plus performant. Cette substitution accepte toute chaîne `provider/model-id` :

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

Cela fonctionne également avec des modèles locaux, par exemple un second modèle Ollama dédié à la synthèse ou un spécialiste de la Compaction finement ajusté :

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

## Fournisseurs de Compaction enfichables

Les plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` dans l’API plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue la synthèse au lieu d’utiliser le pipeline LLM intégré.

Pour utiliser un fournisseur enregistré, définissez l’identifiant du fournisseur dans votre configuration :

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

Définir un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et OpenClaw préserve toujours le contexte du suffixe des tours récents et des tours scindés après la sortie du fournisseur. Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient à la synthèse LLM intégrée.

## Compaction automatique (activée par défaut)

Lorsqu’une session s’approche ou dépasse la fenêtre de contexte du modèle, OpenClaw déclenche la Compaction automatique et peut réessayer la requête d’origine en utilisant le contexte compacté.

Vous verrez :

- `🧹 Auto-compaction complete` en mode verbeux
- `/status` affichant `🧹 Compactions: <count>`

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage silencieux de la mémoire** afin de stocker
des notes durables sur le disque. Voir [Memory](/fr/concepts/memory) pour les détails et la configuration.

## Compaction manuelle

Tapez `/compact` dans n’importe quelle discussion pour forcer une Compaction. Ajoutez des instructions pour guider
le résumé :

```
/compact Focus on the API design decisions
```

Lorsque `agents.defaults.compaction.keepRecentTokens` est défini, la Compaction manuelle
respecte ce point de coupure Pi et conserve la fin récente dans le contexte reconstruit. Sans
budget explicite de conservation, la Compaction manuelle se comporte comme un point de contrôle strict et
continue à partir du seul nouveau résumé.

## Utiliser un modèle différent

Par défaut, la Compaction utilise le modèle principal de votre agent. Vous pouvez utiliser un modèle plus
performant pour obtenir de meilleurs résumés :

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Notifications de Compaction

Par défaut, la Compaction s’exécute silencieusement. Pour afficher de brèves notifications lorsque la Compaction
commence et lorsqu’elle se termine, activez `notifyUser` :

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

Lorsqu’elle est activée, l’utilisateur voit de courts messages d’état autour de chaque exécution de Compaction
(par exemple, "Compacting context..." et "Compaction complete").

## Compaction vs élagage

|                  | Compaction                    | Élagage                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ce que cela fait** | Résume les anciennes conversations | Coupe les anciens résultats d’outil |
| **Enregistré ?**       | Oui (dans le transcript de session)   | Non (en mémoire uniquement, par requête) |
| **Portée**        | Conversation entière           | Résultats d’outil uniquement                |

L’[élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui
réduit la sortie des outils sans effectuer de résumé.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle est peut-être petite, ou les sorties
d’outils peuvent être volumineuses. Essayez d’activer
l’[élagage de session](/fr/concepts/session-pruning).

**Le contexte semble figé après la Compaction ?** Utilisez `/compact Focus on <topic>` pour
guider le résumé, ou activez le [vidage de mémoire](/fr/concepts/memory) afin que les notes
persistent.

**Besoin d’un nouveau départ ?** `/new` démarre une nouvelle session sans effectuer de Compaction.

Pour la configuration avancée (jetons de réserve, préservation des identifiants, moteurs de
contexte personnalisés, Compaction côté serveur OpenAI), consultez le
[Guide approfondi de la gestion de session](/fr/reference/session-management-compaction).

## Liens associés

- [Session](/fr/concepts/session) — gestion et cycle de vie des sessions
- [Session Pruning](/fr/concepts/session-pruning) — réduction des résultats d’outil
- [Context](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Hooks](/fr/automation/hooks) — Hooks du cycle de vie de la Compaction (`before_compaction, after_compaction`)
