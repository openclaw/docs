---
read_when:
    - Sie installieren, konfigurieren oder überprüfen das Dateiübertragungs-Plugin
summary: Dateien auf gekoppelten Nodes über dedizierte Node-Befehle abrufen, auflisten und schreiben. Umgeht die Kürzung von bash stdout, indem base64 über node.invoke für Binärdateien bis zu 16 MB verwendet wird.
title: Dateiübertragungs-Plugin
x-i18n:
    generated_at: "2026-05-02T20:54:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# File Transfer-Plugin

Dateien auf gekoppelten Nodes über dedizierte Node-Befehle abrufen, auflisten und schreiben. Umgeht die Abschneidung von bash-stdout, indem base64 über `node.invoke` für Binärdateien bis 16 MB verwendet wird.

## Verteilung

- Paket: `@openclaw/file-transfer`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

contracts: tools
