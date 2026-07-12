---
read_when:
    - Modification du comportement ou des valeurs par défaut des mots d’activation vocale
    - Ajout de nouvelles plateformes Node nécessitant la synchronisation du mot d’activation
summary: Mots de réveil vocaux globaux (gérés par le Gateway) et leur synchronisation entre les Node
title: Activation vocale
x-i18n:
    generated_at: "2026-07-12T15:36:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

Les mots d’activation constituent **une liste globale unique appartenant au Gateway** — il n’existe aucune liste personnalisée par nœud. N’importe quel nœud ou interface d’application peut modifier la liste ; le Gateway conserve la modification et la diffuse à chaque client connecté.

- **macOS** : bouton local permettant d’activer ou de désactiver Voice Wake. Nécessite macOS 26+ ; consultez [Réveil vocal (macOS)](/fr/platforms/mac/voicewake) pour plus de détails sur l’exécution et le PTT.
- **iOS** : bouton local permettant d’activer ou de désactiver Voice Wake dans Settings.
- **Android** : ne prend pas en charge Voice Wake. L’onglet Voice utilise une capture manuelle du microphone plutôt que des déclencheurs par mot d’activation.

## Stockage

Les mots d’activation et les règles de routage résident dans la base de données d’état du Gateway, `~/.openclaw/state/openclaw.sqlite` par défaut (modifiable avec `OPENCLAW_STATE_DIR`), dans les tables `voicewake_triggers`, `voicewake_routing_config` et `voicewake_routing_routes`. Les anciens fichiers `settings/voicewake.json` et `settings/voicewake-routing.json` servent uniquement d’entrées de migration pour `openclaw doctor --fix` — l’environnement d’exécution ne les lit jamais.

## Protocole

### Liste des déclencheurs

| Méthode         | Paramètres               | Résultat                 |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | aucun                    | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalise l’entrée : supprime les espaces en début et en fin, élimine les entrées vides, conserve au maximum 32 déclencheurs et tronque chacun à 64 unités de code UTF-16 sans scinder les paires de substitution. Si le résultat est vide, les valeurs intégrées par défaut sont utilisées (`openclaw`, `claude`, `computer`).

### Routage (du déclencheur vers la cible)

| Méthode                 | Paramètres                           | Résultat                             |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | aucun                                | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Chaque `target` de route prend en charge exactement l’une des valeurs suivantes :

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limites : au maximum 32 routes et 64 caractères au maximum pour le texte du déclencheur. Pour la mise en correspondance et la détection des doublons, les déclencheurs de route sont normalisés en les convertissant en minuscules, en supprimant la ponctuation au début et à la fin de chaque mot et en réduisant les espaces consécutifs (`"Hey, Bot!!"` et `"hey bot"` correspondent et sont considérés comme des doublons) — cette normalisation est plus stricte que la simple suppression des espaces en début et en fin utilisée pour la liste globale des déclencheurs ci-dessus.

### Événements

| Événement                    | Charge utile                         |
| ---------------------------- | ------------------------------------ |
| `voicewake.changed`          | `{ triggers: string[] }`             |
| `voicewake.routing.changed`  | `{ config: VoiceWakeRoutingConfig }` |

Les deux sont diffusés à chaque client WebSocket disposant de la portée de lecture (application macOS, WebChat et autres clients similaires), ainsi qu’à chaque nœud connecté. Un nœud reçoit également les deux sous forme d’instantané initial juste après sa connexion.

## Comportement des clients

- **macOS** : appelle `voicewake.set`/`voicewake.get` et écoute `voicewake.changed` pour rester synchronisé avec les autres clients.
- **iOS** : appelle `voicewake.set`/`voicewake.get` et écoute `voicewake.changed` pour maintenir la réactivité de la détection locale des mots d’activation.
- **Android** : n’annonce pas la capacité `voiceWake` et ne reçoit pas les mises à jour des mots d’activation.

## Voir aussi

- [Mode conversation](/fr/nodes/talk)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
