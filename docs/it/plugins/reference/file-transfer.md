---
read_when:
    - Si sta installando, configurando o verificando il plugin per il trasferimento di file
summary: Recupera, elenca e scrive file sui Node associati tramite comandi Node dedicati. Evita il troncamento di stdout di bash utilizzando base64 tramite node.invoke per file binari fino a 16 MB.
title: Plugin per il trasferimento di file
x-i18n:
    generated_at: "2026-07-16T14:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin per il trasferimento di file

Recupera, elenca e scrive file sui nodi associati tramite comandi dedicati per i nodi. Evita il troncamento dello stdout di bash utilizzando base64 tramite node.invoke per file binari fino a 16 MB.

## Distribuzione

- Pacchetto: `@openclaw/file-transfer`
- Percorso di installazione: incluso in OpenClaw

## Superficie

contratti: `tools`
