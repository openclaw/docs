---
read_when:
    - Initialisation manuelle d’un espace de travail
summary: Modèle d’espace de travail pour HEARTBEAT.md
title: Modèle HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T03:05:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Modèle HEARTBEAT.md

`HEARTBEAT.md` se trouve dans l’espace de travail de l’agent et contient la liste de contrôle périodique du Heartbeat. Laissez-le vide, ou avec uniquement des espaces, des commentaires Markdown, des titres ATX, des éléments de liste vides (`- `, `* [ ]`) ou des délimiteurs de bloc de code, afin qu’OpenClaw ignore entièrement l’appel au modèle du Heartbeat (`reason=empty-heartbeat-file`).

Contenu fourni par défaut :

```markdown
<!-- Modèle de Heartbeat ; un contenu composé uniquement de commentaires empêche les appels planifiés à l’API du Heartbeat. -->

# Laissez ce fichier vide (ou uniquement avec des commentaires) pour ignorer les appels à l’API du Heartbeat.

# Ajoutez des tâches ci-dessous lorsque vous souhaitez que l’agent vérifie périodiquement quelque chose.
```

Ajoutez de courtes tâches sous les lignes de commentaires uniquement lorsque vous souhaitez effectuer des vérifications périodiques. Gardez ce fichier concis : les exécutions du Heartbeat le lisent à chaque cycle (par défaut toutes les 30 minutes), de sorte que des instructions trop volumineuses consomment des jetons à chaque réveil.

Pour effectuer uniquement les vérifications arrivées à échéance plutôt que d’utiliser une simple liste de contrôle, utilisez un bloc `tasks:` structuré comprenant les champs `interval` et `prompt` pour chaque tâche ; consultez [HEARTBEAT.md](/fr/gateway/heartbeat#heartbeatmd-optional) pour connaître le format et le comportement.

## Voir aussi

- [Heartbeat](/fr/gateway/heartbeat)
- [Configuration du Heartbeat](/fr/gateway/config-agents)
