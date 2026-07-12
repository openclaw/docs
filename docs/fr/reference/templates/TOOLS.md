---
read_when:
    - Initialisation manuelle d’un espace de travail
summary: Modèle d’espace de travail pour TOOLS.md
title: Modèle TOOLS.md
x-i18n:
    generated_at: "2026-07-12T15:59:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Notes locales

Les Skills définissent _comment_ les outils fonctionnent. Ce fichier est destiné à _vos_ spécificités, c’est-à-dire aux éléments propres à votre configuration : noms et emplacements des caméras, hôtes et alias SSH, voix TTS préférées, noms des haut-parleurs et des pièces, surnoms des appareils et tout autre élément propre à l’environnement.

## Exemples

```markdown
### Caméras

- salon → Zone principale, grand-angle à 180°
- porte-d’entrée → Entrée, déclenchement par mouvement

### SSH

- serveur-domestique → 192.168.1.100, utilisateur : admin

### TTS

- Voix préférée : "Nova" (chaleureuse, avec un léger accent britannique)
- Haut-parleur par défaut : HomePod de la cuisine
```

## Pourquoi les séparer ?

Les Skills sont partagés. Votre configuration vous appartient. Les séparer vous permet de mettre à jour les Skills sans perdre vos notes, et de partager les Skills sans divulguer votre infrastructure.

---

Ajoutez tout ce qui vous aide à accomplir votre travail. C’est votre aide-mémoire.

## Voir aussi

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
