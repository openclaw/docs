---
x-i18n:
    generated_at: "2026-07-12T01:22:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Dokumentationsleitfaden

Dieses Verzeichnis ist für die Erstellung der Dokumentation, die Mintlify-Linkregeln und die Internationalisierungsrichtlinien der Dokumentation zuständig.

## Mintlify-Regeln

- Die Dokumentation wird auf Mintlify (`https://docs.openclaw.ai`) gehostet.
- Interne Dokumentationslinks in `docs/**/*.md` müssen relativ zum Stammverzeichnis bleiben und dürfen kein Suffix `.md` oder `.mdx` enthalten (Beispiel: `[Konfiguration](/gateway/configuration)`).
- Abschnittsübergreifende Verweise sollten Anker auf stammrelativen Pfaden verwenden (Beispiel: `[Hooks](/gateway/configuration-reference#hooks)`).
- Überschriften in der Dokumentation sollten Gedankenstriche und Apostrophe vermeiden, da die Ankererzeugung von Mintlify dabei fehleranfällig ist.
- README-Dateien und andere von GitHub gerenderte Dokumentation sollten absolute Dokumentations-URLs beibehalten, damit Links außerhalb von Mintlify funktionieren.
- Dokumentationsinhalte müssen allgemein bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; verwenden Sie Platzhalter wie `user@gateway-host`.

## Inhaltsregeln für die Dokumentation

- Ordnen Sie Dienste/Provider in der Dokumentation, in UI-Texten und in Auswahllisten alphabetisch, sofern der Abschnitt nicht ausdrücklich die Laufzeitreihenfolge oder die Reihenfolge der automatischen Erkennung beschreibt.
- Halten Sie die Benennung gebündelter Plugins mit den repositoryweiten Regeln zur Plugin-Terminologie in der Stammdatei `AGENTS.md` konsistent.
- Generierte Dokumentation darf niemals manuell bearbeitet werden: `docs/plugins/reference/**`, `docs/plugins/reference.md` und `docs/plugins/plugin-inventory.md` werden mit `pnpm plugins:inventory:gen` erzeugt; `docs/docs_map.md` mit `pnpm docs:map:gen`; `docs/maturity/**` mit `pnpm maturity:render`.

## Interne Dokumentation

- Langfristig verwendete private Betriebsdokumentation gehört nach `~/Projects/manager/docs/`.
- Repositorylokale interne Arbeits- oder Spiegelungsdokumentation kann unter dem ignorierten Pfad `docs/internal/` abgelegt werden.
- Fügen Sie Seiten unter `docs/internal/**` niemals zur Navigation in `docs/docs.json` hinzu und verlinken Sie sie nicht aus der öffentlichen Dokumentation.
- `scripts/docs-sync-publish.mjs` schließt `docs/internal/**` aus und entfernt diese Dateien aus dem öffentlichen Veröffentlichungs-Repository `openclaw/docs`, falls später eine Seite erzwungen hinzugefügt wird.
- Interne Dokumentation darf Repositorypfade, private App-Namen, Namen von 1Password-Elementen und Runbooks erwähnen, aber niemals geheime Werte enthalten.

## Bearbeitung der Reifegradbewertung

`taxonomy.yaml` und `qa/maturity-scores.yaml` sind die Quelldaten; die generierte Reifegraddokumentation unter `docs/maturity/` ist eine Projektion und sollte hinsichtlich Bewertung, LTS, Taxonomie, QA-Profil oder Evidenztabellen nicht manuell bearbeitet werden.
`scripts/qa/render-maturity-docs.ts` steuert die Generierung; verwenden Sie `pnpm maturity:render`, um die eingecheckte Dokumentation zu aktualisieren, und `pnpm maturity:check`, um sie zu überprüfen.
`.github/workflows/maturity-scorecard.yml` rendert Artefaktvorschauen und kann PRs für generierte Dokumentation öffnen; `.github/workflows/openclaw-release-checks.yml` startet diesen Workflow für die Release-QA.
Bewahren Sie deterministische `qa-evidence.json.scorecard`-Daten in GitHub-Actions-Artefakten auf, sofern ein Maintainer nicht ausdrücklich eine bereinigte, eingecheckte Projektion verlangt.
Manuelle Überschreibungen müssen den Quellzustand in einem PR ändern und den Grund sowie öffentliche oder geschwärzte Nachweise erläutern.

## Internationalisierung der Dokumentation

- Fremdsprachige Dokumentation wird in diesem Repository nicht gepflegt. Die generierte Veröffentlichungsausgabe befindet sich im separaten Repository `openclaw/docs` (das lokal häufig als `../openclaw-docs` geklont wird).
- Fügen Sie hier keine lokalisierte Dokumentation unter `docs/<locale>/**` hinzu und bearbeiten Sie sie nicht.
- Behandeln Sie die englische Dokumentation in diesem Repository zusammen mit den Glossardateien als maßgebliche Quelle.
- Pipeline: Aktualisieren Sie hier die englische Dokumentation, aktualisieren Sie bei Bedarf `docs/.i18n/glossary.<locale>.json` und lassen Sie anschließend die Synchronisierung des Veröffentlichungs-Repositorys sowie `scripts/docs-i18n` in `openclaw/docs` ausführen.
- Fügen Sie vor der erneuten Ausführung von `scripts/docs-i18n` Glossareinträge für alle neuen technischen Begriffe, Seitentitel oder kurzen Navigationsbezeichnungen hinzu, die auf Englisch bleiben oder eine festgelegte Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` dient als Schutzprüfung für geänderte englische Dokumentationstitel und kurze interne Dokumentationsbezeichnungen.
- Der Übersetzungsspeicher befindet sich in den generierten Dateien `docs/.i18n/*.tm.jsonl` im Veröffentlichungs-Repository.
- Siehe `docs/.i18n/README.md`.
