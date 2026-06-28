---
read_when:
    - Amorçage manuel d’un espace de travail
summary: Modèle d’espace de travail pour TOOLS.md
title: Modèle TOOLS.md
x-i18n:
    generated_at: "2026-04-24T07:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# TOOLS.md - Notes locales

Les Skills définissent _comment_ les outils fonctionnent. Ce fichier est destiné à _vos_ spécificités — les éléments uniques à votre configuration.

## Ce qui va ici

Des choses comme :

- Noms et emplacements des caméras
- Hôtes SSH et alias
- Voix préférées pour le TTS
- Noms des enceintes/pièces
- Surnoms des appareils
- Tout ce qui est spécifique à l’environnement

## Exemples

```markdown
### Caméras

- living-room → Zone principale, grand angle 180°
- front-door → Entrée, déclenchement sur mouvement

### SSH

- home-server → 192.168.1.100, utilisateur : admin

### TTS

- Voix préférée : "Nova" (chaleureuse, légèrement britannique)
- Enceinte par défaut : HomePod de la cuisine
```

## Pourquoi séparer ?

Les Skills sont partagées. Votre configuration vous appartient. Les garder séparées signifie que vous pouvez mettre à jour les Skills sans perdre vos notes, et partager des Skills sans divulguer votre infrastructure.

---

Ajoutez tout ce qui vous aide à faire votre travail. C’est votre antisèche.

## Lié

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
