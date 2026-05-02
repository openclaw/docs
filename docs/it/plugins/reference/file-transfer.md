---
read_when:
    - Stai installando, configurando o verificando il Plugin per il trasferimento dei file
summary: Recupera, elenca e scrivi file sui nodi associati tramite comandi dedicati per i nodi. Evita il troncamento di stdout di bash usando base64 su node.invoke per binari fino a 16 MB.
title: Plugin di trasferimento file
x-i18n:
    generated_at: "2026-05-02T20:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin File Transfer

Recupera, elenca e scrive file sui nodi associati tramite comandi nodo dedicati. Aggira il troncamento dello stdout di bash usando base64 tramite node.invoke per binari fino a 16 MB.

## Distribuzione

- Pacchetto: `@openclaw/file-transfer`
- Percorso di installazione: incluso in OpenClaw

## Superficie

contratti: strumenti
