---
read_when:
    - Vous installez, configurez ou auditez le plugin de transfert de fichiers
summary: Récupérez, répertoriez et écrivez des fichiers sur des Nodes appairés à l’aide de commandes de Node dédiées. Contourne la troncature de la sortie standard de bash en utilisant base64 via node.invoke pour les fichiers binaires d’une taille maximale de 16 Mo.
title: Plugin de transfert de fichiers
x-i18n:
    generated_at: "2026-07-16T13:38:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin de transfert de fichiers

Récupérez, répertoriez et écrivez des fichiers sur des Nodes appairés au moyen de commandes Node dédiées. Contourne la troncature de la sortie standard de bash en utilisant base64 via node.invoke pour les fichiers binaires jusqu’à 16 Mo.

## Distribution

- Paquet : `@openclaw/file-transfer`
- Mode d’installation : inclus dans OpenClaw

## Surface

contrats : `tools`
