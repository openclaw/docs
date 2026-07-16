---
read_when:
    - Sie installieren, konfigurieren oder prüfen das acpx-Plugin.
summary: OpenClaw-ACP-Runtime-Backend mit Plugin-eigener Sitzungs- und Transportverwaltung.
title: ACPx-Plugin
x-i18n:
    generated_at: "2026-07-16T13:20:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# ACPx-Plugin

OpenClaw-ACP-Runtime-Backend mit Plugin-eigener Sitzungs- und Transportverwaltung.

## Distribution

- Paket: `@openclaw/acpx`
- Installationsweg: npm; ClawHub

## Oberfläche

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Native Pi-Sitzungen

Die gebündelte Runtime erkennt Pis Sitzungsspeicher auf dem Gateway und auf gekoppelten
Nodes automatisch. Gespeicherte Sitzungen werden in der Sitzungsseitenleiste in der Gruppe **Pi** angezeigt,
wobei Transkripte aus Pis dokumentiertem JSONL-Sitzungsformat schreibgeschützt durchsucht werden können. Der
Katalog berücksichtigt projektbezogene und globale `settings.json`-Sitzungsverzeichnisse sowie
`PI_CODING_AGENT_DIR` und `PI_CODING_AGENT_SESSION_DIR`. Relative Pfade werden ausgehend
vom Verzeichnis aufgelöst, das die jeweilige `settings.json`-Datei enthält.

Deaktivieren Sie **Pi Session Catalog** unter **Config > Plugins > ACPX Runtime**, um
die Erkennung auszuschalten. Sie ist standardmäßig aktiviert.

<!-- openclaw-plugin-reference:manual-end -->

## Verwandte Dokumentation

- [acpx](/de/tools/acp-agents-setup)
