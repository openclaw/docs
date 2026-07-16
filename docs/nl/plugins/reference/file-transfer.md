---
read_when:
    - Je installeert, configureert of controleert de Plugin voor bestandsoverdracht
summary: Haal bestanden op, geef ze weer en schrijf ze op gekoppelde nodes via speciale node-opdrachten. Omzeilt afkapping van bash-stdout door base64 via node.invoke te gebruiken voor binaire bestanden tot 16 MB.
title: Plugin voor bestandsoverdracht
x-i18n:
    generated_at: "2026-07-16T16:05:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin voor bestandsoverdracht

Haal bestanden op, geef ze weer en schrijf ze op gekoppelde nodes via speciale node-opdrachten. Omzeilt de afkapping van bash-stdout door voor binaire bestanden tot 16 MB base64 via node.invoke te gebruiken.

## Distributie

- Pakket: `@openclaw/file-transfer`
- Installatieroute: inbegrepen bij OpenClaw

## Oppervlak

contracten: `tools`
