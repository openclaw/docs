---
read_when:
    - Einen Workspace manuell bootstrappen.
summary: Workspace-Vorlage für `TOOLS.md`
title: Vorlage für `TOOLS.md`
x-i18n:
    generated_at: "2026-04-24T06:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# TOOLS.md - Lokale Notizen

Skills definieren, _wie_ Tools funktionieren. Diese Datei ist für _Ihre_ Besonderheiten gedacht — also für Dinge, die in Ihrem Setup einzigartig sind.

## Was hier hineingehört

Dinge wie:

- Namen und Orte von Kameras
- SSH-Hosts und Aliase
- Bevorzugte Stimmen für TTS
- Namen von Lautsprechern/Räumen
- Gerätenicknames
- Alles, was umgebungsspezifisch ist

## Beispiele

```markdown
### Kameras

- living-room → Hauptbereich, 180° Weitwinkel
- front-door → Eingang, bewegungsgesteuert

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Bevorzugte Stimme: "Nova" (warm, leicht britisch)
- Standardlautsprecher: Kitchen HomePod
```

## Warum getrennt?

Skills sind gemeinsam genutzt. Ihr Setup gehört Ihnen. Wenn Sie beides trennen, können Sie Skills aktualisieren, ohne Ihre Notizen zu verlieren, und Skills teilen, ohne Ihre Infrastruktur offenzulegen.

---

Fügen Sie alles hinzu, was Ihnen bei Ihrer Arbeit hilft. Das ist Ihr Spickzettel.

## Verwandt

- [Agent workspace](/de/concepts/agent-workspace)
