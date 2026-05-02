---
read_when:
    - Je installeert, configureert of controleert de bestandsoverdracht-Plugin
summary: Haal bestanden op, geef bestanden weer en schrijf bestanden op gekoppelde nodes via specifieke node-opdrachten. Omzeilt bash stdout-afkapping door base64 via node.invoke te gebruiken voor binaire bestanden tot 16 MB.
title: Bestandsoverdrachtplugin
x-i18n:
    generated_at: "2026-05-02T20:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Bestandsoverdracht-Plugin

Haal bestanden op, vermeld ze en schrijf ze op gekoppelde Nodes via speciale Node-opdrachten. Omzeilt afkapping van `bash`-`stdout` door base64 via node.invoke te gebruiken voor binaire bestanden tot 16 MB.

## Distributie

- Pakket: `@openclaw/file-transfer`
- Installatieroute: meegeleverd met OpenClaw

## Interface

contracts: tools
