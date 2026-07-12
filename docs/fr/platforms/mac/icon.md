---
read_when:
    - Modification du comportement de l’icône de la barre des menus
summary: États et animations de l’icône de la barre des menus pour OpenClaw sur macOS
title: Icône de la barre de menus
x-i18n:
    generated_at: "2026-07-12T15:36:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# États de l’icône de la barre des menus

Périmètre : application macOS (`apps/macos`). Rendu : `CritterIconRenderer.makeIcon(...)`. Gestion de l’animation et de l’état : `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## États

| État                    | Déclencheur                               | Apparence                                                                                                   |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Inactif                 | Par défaut                                | Animation normale de clignement/oscillation ; les yeux ouverts conservent un reflet brillant                |
| En pause                | `isPaused=true`                           | Les antennes retombent (« hors service ») avec les yeux ouverts ; aucun mouvement                           |
| Endormi                 | Gateway déconnecté/non configuré          | Les antennes retombent et les yeux se ferment en paupières `⌣ ⌣` ; aucun mouvement                         |
| Célébration             | Message envoyé (`sendCelebrationTick`)    | Les yeux affichent brièvement des arcs joyeux `∩ ∩` pendant ~0.9s, accompagnés d’un coup de patte           |
| Réveil vocal (grandes oreilles) | Mot de réveil entendu              | Les antennes se redressent et s’allongent (`earScale=1.9`) ; elles reprennent leur état normal après un silence |
| En cours de travail     | `isWorking=true` ou `IconState` actif     | Oscillation plus rapide des pattes (`legWiggle` jusqu’à `1.0`) avec un léger décalage horizontal, ajoutée à l’oscillation au repos |

Un badge d’activité d’outil (pastille avec un symbole SF, par exemple `chevron.left.slash.chevron.right` pour l’exécution) peut s’afficher par-dessus la même icône de créature lorsqu’une session comporte une tâche ou un outil actif. Ce badge provient de `IconState`/`ActivityKind` ; consultez [Barre des menus](/fr/platforms/mac/menu-bar) pour le modèle d’état complet.

## Oreilles de réveil vocal

- Déclencheur : `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, appelé depuis le pipeline de capture du réveil vocal (`VoiceWakeRuntime`) et depuis les outils de débogage/test du réveil vocal (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Arrêt : `stopVoiceEars()`, appelé lorsque la capture se termine.
- Fenêtre de silence avant la finalisation : `2.0s` normalement, `5.0s` si seul le mot déclencheur a été entendu sans aucune parole supplémentaire (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Pendant l’amplification, les minuteurs de clignement, d’oscillation, des pattes et des oreilles au repos sont suspendus (`earBoostActive` contrôle la tâche d’animation dans `CritterStatusLabel+Behavior`).

## Formes et dimensions

- Canevas : image modèle de 18x18pt, rendue dans un tampon bitmap de 36x36px (2x) afin que l’icône reste nette sur les écrans Retina.
- L’échelle des oreilles vaut `1.0` par défaut ; l’amplification vocale définit `earScale=1.9` sans modifier le cadre global.
- `antennaDroop` (0-1) rabat les antennes pour les poses en pause et endormie.
- Le mouvement précipité des pattes utilise `legWiggle` jusqu’à `1.0`, avec une légère oscillation horizontale.

## Remarques comportementales

- Aucun commutateur CLI/courtier externe ne contrôle les oreilles ni l’état de travail ; tous deux sont pilotés en interne par les signaux de l’application (`AppState.setWorking`, `AppState.triggerVoiceEars`) afin d’éviter des basculements intempestifs.
- Toute nouvelle TTL doit rester courte (bien inférieure à 10s) afin que l’icône revienne rapidement à son état de référence si une tâche se bloque.

## Pages associées

- [Barre des menus](/fr/platforms/mac/menu-bar)
- [Application macOS](/fr/platforms/macos)
