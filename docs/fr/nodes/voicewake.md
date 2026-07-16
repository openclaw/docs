---
read_when:
    - Modification du comportement ou des valeurs par défaut des mots d’activation vocale
    - Ajout de nouvelles plateformes Node nécessitant la synchronisation du mot d’activation
summary: Mots d’activation vocale globaux (gérés par le Gateway) et leur synchronisation entre les Node
title: Activation vocale
x-i18n:
    generated_at: "2026-07-16T13:29:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Les mots d’activation constituent **une liste globale unique appartenant au Gateway** — il n’existe aucune liste personnalisée par Node. L’interface utilisateur de n’importe quel Node ou de n’importe quelle application peut modifier la liste ; le Gateway conserve la modification et la diffuse à chaque client connecté.

- **macOS** : bouton d’activation/désactivation local de l’activation vocale. Nécessite macOS 26+ ; consultez [Activation vocale (macOS)](/fr/platforms/mac/voicewake) pour plus de détails sur l’exécution et le PTT.
- **iOS** : bouton d’activation/désactivation local de l’activation vocale dans Settings.
- **Android** : bouton d’activation/désactivation local de l’activation vocale et éditeur de mots d’activation dans Settings → Voice. Nécessite la reconnaissance vocale Android sur l’appareil.

## Stockage

Les mots d’activation et les règles de routage résident dans la base de données d’état du Gateway, `~/.openclaw/state/openclaw.sqlite` par défaut (remplacez cette valeur avec `OPENCLAW_STATE_DIR`), dans les tables `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Les anciens `settings/voicewake.json` et `settings/voicewake-routing.json` servent uniquement d’entrées de migration pour `openclaw doctor --fix` — l’environnement d’exécution ne les lit jamais.

## Protocole

### Liste des déclencheurs

| Méthode          | Paramètres               | Résultat                 |
| ---------------- | ------------------------ | ------------------------ |
| `voicewake.get` | aucun                    | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalise l’entrée : supprime les espaces en début et fin, élimine les entrées vides, conserve au maximum 32 déclencheurs et tronque chacun à 64 unités de code UTF-16 sans diviser les paires de substitution. Si le résultat est vide, les valeurs par défaut intégrées sont utilisées (`openclaw`, `claude`, `computer`).

### Routage (du déclencheur vers la cible)

| Méthode                 | Paramètres                           | Résultat                             |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | aucun                                | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "réveil robot", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Chaque route `target` prend en charge exactement l’un des éléments suivants :

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limites : au maximum 32 routes et un texte de déclencheur de 64 caractères au maximum. Les déclencheurs de route sont normalisés pour la correspondance et la détection des doublons en les convertissant en minuscules, en supprimant la ponctuation au début et à la fin de chaque mot et en regroupant les espaces (`"Hey, Bot!!"` et `"hey bot"` correspondent et sont comptés comme des doublons) — cette normalisation est plus stricte que la simple suppression des espaces en début et fin utilisée pour la liste globale des déclencheurs ci-dessus.

### Événements

| Événement                   | Charge utile                          |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Les deux sont diffusés à chaque client WebSocket disposant de la portée de lecture (application macOS, WebChat et autres clients similaires), ainsi qu’à chaque Node connecté. Un Node reçoit également les deux sous forme d’instantané initial immédiatement après sa connexion.

## Comportement des clients

- **macOS** : appelle `voicewake.set`/`voicewake.get` et écoute `voicewake.changed` pour rester synchronisé avec les autres clients.
- **iOS** : appelle `voicewake.set`/`voicewake.get` et écoute `voicewake.changed` afin que la détection locale des mots d’activation reste réactive.
- **Android** : appelle `voicewake.set`/`voicewake.get`, écoute `voicewake.changed` et annonce `voiceWake` lorsqu’elle est activée. La reconnaissance reste effectuée sur l’appareil et uniquement au premier plan ; elle est suspendue lorsque Talk, la dictée manuelle, l’enregistrement d’une note vocale ou la lecture vocale d’un message utilise l’audio.

## Voir aussi

- [Mode Talk](/fr/nodes/talk)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
