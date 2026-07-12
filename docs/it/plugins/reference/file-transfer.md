---
read_when:
    - Stai installando, configurando o verificando il plugin per il trasferimento di file
summary: Recupera, elenca e scrive file sui Node associati tramite comandi Node dedicati. Evita il troncamento di stdout di bash usando base64 tramite `node.invoke` per file binari fino a 16 MB.
title: Plugin per il trasferimento di file
x-i18n:
    generated_at: "2026-07-12T07:18:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin per il trasferimento di file

Recupera, elenca e scrive file sui nodi associati tramite comandi dedicati per i nodi. Evita il troncamento dell'output standard di bash utilizzando base64 tramite node.invoke per file binari fino a 16 MB.

## Distribuzione

- Pacchetto: `@openclaw/file-transfer`
- Modalità di installazione: incluso in OpenClaw

## Interfaccia

contratti: strumenti
