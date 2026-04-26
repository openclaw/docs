---
read_when:
    - Modification du comportement ou des valeurs par défaut des mots d’activation vocale
    - Ajout de nouvelles plateformes de nœuds nécessitant la synchronisation des mots d’activation vocale
summary: Mots d’activation vocale globaux (gérés par la Gateway) et mode de synchronisation sur les nœuds
title: Réveil vocal
x-i18n:
    generated_at: "2026-04-26T11:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw traite les **mots d’activation** comme une liste globale unique gérée par la **Gateway**.

- Il n’existe **pas de mots d’activation personnalisés par nœud**.
- **Toute UI de nœud/application peut modifier** la liste ; les modifications sont persistées par la Gateway et diffusées à tout le monde.
- macOS et iOS conservent des bascules locales **Réveil vocal activé/désactivé** (l’UX locale et les autorisations diffèrent).
- Android garde actuellement le réveil vocal désactivé et utilise un flux micro manuel dans l’onglet Voice.

## Stockage (hôte Gateway)

Les mots d’activation sont stockés sur la machine Gateway à l’emplacement :

- `~/.openclaw/settings/voicewake.json`

Structure :

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocole

### Méthodes

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` avec les paramètres `{ triggers: string[] }` → `{ triggers: string[] }`

Remarques :

- Les déclencheurs sont normalisés (espaces supprimés en début/fin, valeurs vides supprimées). Les listes vides reviennent aux valeurs par défaut.
- Des limites sont appliquées pour des raisons de sécurité (plafonds de nombre/longueur).

### Méthodes de routage (déclencheur → cible)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` avec les paramètres `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Structure de `VoiceWakeRoutingConfig` :

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Les cibles de route prennent en charge exactement l’une des formes suivantes :

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Événements

- `voicewake.changed` charge utile `{ triggers: string[] }`
- `voicewake.routing.changed` charge utile `{ config: VoiceWakeRoutingConfig }`

Qui les reçoit :

- Tous les clients WebSocket (application macOS, WebChat, etc.)
- Tous les nœuds connectés (iOS/Android), ainsi qu’au moment de la connexion d’un nœud sous forme de push initial de « l’état actuel ».

## Comportement du client

### Application macOS

- Utilise la liste globale pour contrôler les déclencheurs `VoiceWakeRuntime`.
- Modifier « Trigger words » dans les paramètres de réveil vocal appelle `voicewake.set`, puis s’appuie sur la diffusion pour garder les autres clients synchronisés.

### Nœud iOS

- Utilise la liste globale pour la détection de déclencheurs `VoiceWakeManager`.
- Modifier les mots d’activation dans Réglages appelle `voicewake.set` (via la Gateway WS) et maintient également la réactivité de la détection locale des mots d’activation.

### Nœud Android

- Le réveil vocal est actuellement désactivé dans l’exécution/les réglages Android.
- La voix sur Android utilise une capture micro manuelle dans l’onglet Voice au lieu de déclencheurs par mot d’activation.

## Liens connexes

- [Mode Talk](/fr/nodes/talk)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
