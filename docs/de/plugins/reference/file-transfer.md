---
read_when:
    - Sie installieren, konfigurieren oder prüfen das Dateiübertragungs-Plugin.
summary: Dateien auf gekoppelten Nodes über dedizierte Node-Befehle abrufen, auflisten und schreiben. Umgeht die Kürzung der bash-Standardausgabe, indem für Binärdateien bis zu 16 MB base64 über node.invoke verwendet wird.
title: Dateiübertragungs-Plugin
x-i18n:
    generated_at: "2026-07-12T01:56:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Dateiübertragungs-Plugin

Rufen Sie Dateien auf gekoppelten Nodes über dedizierte Node-Befehle ab, listen Sie sie auf und schreiben Sie sie. Umgeht die Kürzung der Bash-Standardausgabe durch die Verwendung von Base64 über `node.invoke` für Binärdateien bis zu 16 MB.

## Bereitstellung

- Paket: `@openclaw/file-transfer`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Verträge: Tools
