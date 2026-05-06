---
read_when:
    - Modifier le comportement de l’icône de la barre des menus
summary: États et animations de l’icône de la barre de menus pour OpenClaw sur macOS
title: Icône de la barre de menus
x-i18n:
    generated_at: "2026-05-06T07:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
---

# États de l’icône de la barre de menus

Auteur : steipete · Mis à jour : 2025-12-06 · Portée : application macOS (`apps/macos`)

- **Inactif :** Animation normale de l’icône (clignement, léger frétillement occasionnel).
- **En pause :** L’élément d’état utilise `appearsDisabled` ; aucun mouvement.
- **Déclencheur vocal (grandes oreilles) :** Le détecteur de réveil vocal appelle `AppState.triggerVoiceEars(ttl: nil)` quand le mot de réveil est entendu, en conservant `earBoostActive=true` pendant la capture de l’énoncé. Les oreilles s’agrandissent (1,9x), reçoivent des trous circulaires pour améliorer la lisibilité, puis redescendent via `stopVoiceEars()` après 1 s de silence. Déclenché uniquement depuis le pipeline vocal intégré à l’application.
- **En travail (agent en cours d’exécution) :** `AppState.isWorking=true` pilote un micro-mouvement de « course queue/pattes » : frétillement plus rapide des pattes et léger décalage pendant qu’un travail est en cours. Actuellement activé autour des exécutions d’agent WebChat ; ajoutez le même basculement autour des autres tâches longues lorsque vous les raccordez.

Points de raccordement

- Réveil vocal : l’appel runtime/tester appelle `AppState.triggerVoiceEars(ttl: nil)` au déclenchement et `stopVoiceEars()` après 1 s de silence pour correspondre à la fenêtre de capture.
- Activité de l’agent : définissez `AppStateStore.shared.setWorking(true/false)` autour des plages de travail (déjà fait dans l’appel d’agent WebChat). Gardez les plages courtes et réinitialisez dans des blocs `defer` pour éviter les animations bloquées.

Formes et tailles

- Icône de base dessinée dans `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- L’échelle des oreilles vaut `1.0` par défaut ; le renforcement vocal définit `earScale=1.9` et active `earHoles=true` sans changer le cadre global (image de modèle 18×18 pt rendue dans un tampon Retina 36×36 px).
- La course utilise un frétillement des pattes jusqu’à environ 1,0 avec une petite oscillation horizontale ; elle s’ajoute à tout frétillement d’inactivité existant.

Notes comportementales

- Aucun basculement CLI/broker externe pour les oreilles/l’état de travail ; gardez-le interne aux signaux propres de l’application afin d’éviter les battements accidentels.
- Gardez les TTL courts (&lt;10 s) afin que l’icône revienne rapidement à son état de base si une tâche se bloque.

## Associé

- [Barre de menus](/fr/platforms/mac/menu-bar)
- [Application macOS](/fr/platforms/macos)
