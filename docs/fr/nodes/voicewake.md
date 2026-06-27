---
read_when:
    - Modification du comportement ou des valeurs par défaut des mots de réveil vocaux
    - Ajout de nouvelles plateformes Node nécessitant la synchronisation du mot d’activation
summary: Mots de réveil vocaux globaux (gérés par le Gateway) et leur synchronisation entre les nœuds
title: Réveil vocal
x-i18n:
    generated_at: "2026-06-27T17:41:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw traite les **mots de réveil comme une seule liste globale** détenue par le **Gateway**.

- Il n’existe **aucun mot de réveil personnalisé par nœud**.
- **Toute interface utilisateur de nœud/application peut modifier** la liste ; les changements sont persistés par le Gateway et diffusés à tout le monde.
- macOS et iOS conservent des boutons locaux pour **activer/désactiver Voice Wake** (l’UX locale et les permissions diffèrent).
- Android garde actuellement Voice Wake désactivé et utilise un flux de micro manuel dans l’onglet Voice.

## Stockage (hôte du Gateway)

Les mots de réveil et les règles de routage sont stockés dans la base de données d’état du gateway :

- `~/.openclaw/state/openclaw.sqlite`

Les tables actives sont :

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Les anciens fichiers `settings/voicewake.json` et `settings/voicewake-routing.json` sont
uniquement des entrées de migration pour doctor ; à l’exécution, les tables SQLite sont lues et écrites.

## Protocole

### Méthodes

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` avec les paramètres `{ triggers: string[] }` → `{ triggers: string[] }`

Notes :

- Les déclencheurs sont normalisés (espaces supprimés en début et fin, valeurs vides supprimées). Les listes vides reviennent aux valeurs par défaut.
- Des limites sont appliquées par sécurité (plafonds de nombre/longueur).

### Méthodes de routage (déclencheur → cible)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` avec les paramètres `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Forme de `VoiceWakeRoutingConfig` :

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Les cibles de route prennent en charge exactement l’un des éléments suivants :

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Événements

- charge utile `voicewake.changed` `{ triggers: string[] }`
- charge utile `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Qui le reçoit :

- Tous les clients WebSocket (application macOS, WebChat, etc.)
- Tous les nœuds connectés (iOS/Android), ainsi que lors de la connexion d’un nœud sous forme d’envoi initial de « l’état actuel ».

## Comportement client

### Application macOS

- Utilise la liste globale pour filtrer les déclencheurs `VoiceWakeRuntime`.
- La modification de « Trigger words » dans les paramètres Voice Wake appelle `voicewake.set`, puis s’appuie sur la diffusion pour maintenir les autres clients synchronisés.

### Nœud iOS

- Utilise la liste globale pour la détection des déclencheurs `VoiceWakeManager`.
- La modification de Wake Words dans Settings appelle `voicewake.set` (via le WS du Gateway) et garde également la détection locale des mots de réveil réactive.

### Nœud Android

- Voice Wake est actuellement désactivé dans l’exécution/les Settings Android.
- La voix Android utilise la capture micro manuelle dans l’onglet Voice au lieu des déclencheurs par mots de réveil.

## Connexe

- [Mode conversation](/fr/nodes/talk)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
