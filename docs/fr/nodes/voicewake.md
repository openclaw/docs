---
read_when:
    - Modifier le comportement ou les valeurs par défaut des mots d’activation vocale
    - Ajout de nouvelles plateformes Node nécessitant la synchronisation du mot d’activation
summary: Mots d’activation vocale globaux (gérés par le Gateway) et leur synchronisation entre les nœuds
title: Réveil vocal
x-i18n:
    generated_at: "2026-05-06T07:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw traite les **mots d’activation comme une liste globale unique** détenue par le **Gateway**.

- Il n’y a **aucun mot d’activation personnalisé par nœud**.
- **Toute UI de nœud/application peut modifier** la liste ; les changements sont persistés par le Gateway et diffusés à tous.
- macOS et iOS conservent des bascules locales **Réveil vocal activé/désactivé** (l’UX locale et les autorisations diffèrent).
- Android garde actuellement le réveil vocal désactivé et utilise un flux manuel de micro dans l’onglet Voix.

## Stockage (hôte du Gateway)

Les mots d’activation sont stockés sur la machine du gateway à l’emplacement suivant :

- `~/.openclaw/settings/voicewake.json`

Forme :

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocole

### Méthodes

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` avec les paramètres `{ triggers: string[] }` → `{ triggers: string[] }`

Notes :

- Les déclencheurs sont normalisés (espaces supprimés, valeurs vides retirées). Les listes vides reviennent aux valeurs par défaut.
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

- Charge utile `voicewake.changed` `{ triggers: string[] }`
- Charge utile `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Qui les reçoit :

- Tous les clients WebSocket (application macOS, WebChat, etc.)
- Tous les nœuds connectés (iOS/Android), ainsi qu’au moment de la connexion du nœud sous forme d’envoi initial de « l’état actuel ».

## Comportement client

### Application macOS

- Utilise la liste globale pour filtrer les déclencheurs de `VoiceWakeRuntime`.
- La modification de « Mots déclencheurs » dans les réglages du réveil vocal appelle `voicewake.set`, puis s’appuie sur la diffusion pour garder les autres clients synchronisés.

### Nœud iOS

- Utilise la liste globale pour la détection des déclencheurs par `VoiceWakeManager`.
- La modification des mots d’activation dans les réglages appelle `voicewake.set` (via le WS du Gateway) et garde également la détection locale des mots d’activation réactive.

### Nœud Android

- Le réveil vocal est actuellement désactivé dans le runtime/les réglages Android.
- La voix sur Android utilise une capture micro manuelle dans l’onglet Voix au lieu de déclencheurs par mots d’activation.

## Associé

- [Mode conversation](/fr/nodes/talk)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
