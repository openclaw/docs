---
read_when:
    - Manuelles Initialisieren eines Arbeitsbereichs
summary: Workspace-Vorlage für TOOLS.md
title: TOOLS.md-Vorlage
x-i18n:
    generated_at: "2026-07-12T16:00:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md – Lokale Notizen

Skills definieren, _wie_ Werkzeuge funktionieren. Diese Datei ist für _Ihre_ Besonderheiten bestimmt – alles, was nur für Ihre Einrichtung gilt: Kameranamen und -standorte, SSH-Hosts und -Aliasse, bevorzugte TTS-Stimmen, Lautsprecher-/Raumnamen, Gerätenamen und alles Umgebungsspezifische.

## Beispiele

```markdown
### Kameras

- living-room → Hauptbereich, 180°-Weitwinkel
- front-door → Eingang, bewegungsgesteuert

### SSH

- home-server → 192.168.1.100, Benutzer: admin

### TTS

- Bevorzugte Stimme: "Nova" (warm, leicht britisch)
- Standardlautsprecher: HomePod in der Küche
```

## Warum getrennt?

Skills werden gemeinsam genutzt. Ihre Einrichtung gehört Ihnen. Wenn Sie beides getrennt halten, können Sie Skills aktualisieren, ohne Ihre Notizen zu verlieren, und Skills teilen, ohne Informationen über Ihre Infrastruktur preiszugeben.

---

Fügen Sie alles hinzu, was Ihnen bei Ihrer Arbeit hilft. Dies ist Ihr Spickzettel.

## Verwandte Themen

- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
