---
read_when:
    - Vous installez, configurez ou auditez le Plugin de transfert de fichiers
summary: Récupérez, listez et écrivez des fichiers sur les nœuds appairés via des commandes de nœud dédiées. Contourne la troncature de stdout de bash en utilisant base64 via node.invoke pour les fichiers binaires jusqu’à 16 Mo.
title: Plugin de transfert de fichiers
x-i18n:
    generated_at: "2026-05-02T20:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin File Transfer

Récupérez, listez et écrivez des fichiers sur des nœuds appairés via des commandes de nœud dédiées. Contourne la troncature de stdout de bash en utilisant base64 via node.invoke pour les binaires jusqu’à 16 Mo.

## Distribution

- Paquet : `@openclaw/file-transfer`
- Route d’installation : inclus dans OpenClaw

## Surface

contrats : outils
