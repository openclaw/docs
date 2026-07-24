---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das Dateiübertragungs-Plugin
summary: Dateien auf gekoppelten Nodes über dedizierte Node-Befehle abrufen, auflisten und schreiben. Umgeht die Kürzung der bash-Standardausgabe, indem für Binärdateien bis zu 16 MB Base64 über node.invoke verwendet wird.
title: Dateiübertragungs-Plugin
x-i18n:
    generated_at: "2026-07-24T04:03:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Dateiübertragungs-Plugin

Dateien auf gekoppelten Nodes über dedizierte Node-Befehle abrufen, auflisten und schreiben. Umgeht die Kürzung der Bash-Standardausgabe, indem für Binärdateien bis zu 16 MB Base64 über node.invoke verwendet wird.

## Distribution

- Paket: `@openclaw/file-transfer`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Verträge: `tools`
