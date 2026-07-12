---
read_when:
    - Ajout d’une liste de contrôle BOOT.md
summary: Modèle d’espace de travail pour BOOT.md
title: Modèle BOOT.md
x-i18n:
    generated_at: "2026-07-12T15:53:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Ajoutez ici des instructions de démarrage courtes et explicites. Le hook `boot-md` intégré exécute ce fichier une fois par espace de travail d’agent à chaque démarrage du Gateway, si le fichier existe et contient des caractères autres que des espaces. Plusieurs agents partageant un espace de travail ne déclenchent qu’une seule exécution.

Le hook est fourni désactivé. Activez-le d’abord :

```bash
openclaw hooks enable boot-md
```

Si un élément de la liste de contrôle envoie un message, utilisez l’outil de messagerie, puis répondez avec le jeton silencieux exact `NO_REPLY` (sans distinction entre majuscules et minuscules).

## Ressources connexes

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Hooks](/fr/automation/hooks#boot-md)
