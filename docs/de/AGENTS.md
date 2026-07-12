---
x-i18n:
    generated_at: "2026-07-12T14:57:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Dokumentationsleitfaden

Dieses Verzeichnis umfasst die Erstellung der Dokumentation, die Linkregeln für Mintlify und die Richtlinien für die Internationalisierung der Dokumentation.

## Mintlify-Regeln

- Die Dokumentation wird auf Mintlify gehostet (`https://docs.openclaw.ai`).
- Interne Dokumentationslinks in `docs/**/*.md` müssen relativ zum Stammverzeichnis bleiben und dürfen weder die Endung `.md` noch `.mdx` enthalten (Beispiel: `[Config](/gateway/configuration)`).
- Abschnittsübergreifende Verweise sollten Anker auf Pfaden relativ zum Stammverzeichnis verwenden (Beispiel: `[Hooks](/gateway/configuration-reference#hooks)`).
- Überschriften in der Dokumentation sollten Gedankenstriche und Apostrophe vermeiden, da die Ankererzeugung von Mintlify dabei fehleranfällig ist.
- README-Dateien und andere von GitHub gerenderte Dokumentation sollten absolute Dokumentations-URLs beibehalten, damit Links außerhalb von Mintlify funktionieren.
- Dokumentationsinhalte müssen allgemein bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; verwenden Sie Platzhalter wie `user@gateway-host`.

## Regeln für Dokumentationsinhalte

- Ordnen Sie für Dokumentation, UI-Texte und Auswahllisten Dienste/Provider alphabetisch, sofern der Abschnitt nicht ausdrücklich die Laufzeit- oder automatische Erkennungsreihenfolge beschreibt.
- Halten Sie die Benennung gebündelter Plugins mit den repositoryweiten Regeln zur Plugin-Terminologie in der Stammdatei `AGENTS.md` konsistent.
- Generierte Dokumentation niemals manuell bearbeiten: `docs/plugins/reference/**`, `docs/plugins/reference.md` und `docs/plugins/plugin-inventory.md` werden durch `pnpm plugins:inventory:gen` erzeugt; `docs/docs_map.md` durch `pnpm docs:map:gen`; `docs/maturity/**` durch `pnpm maturity:render`.

## Interne Dokumentation

- Langlebige private Dokumentation für Betreiber gehört in `~/Projects/manager/docs/`.
- Repo-lokale interne Arbeits- oder Spiegelungsdokumentation kann unter dem ignorierten Pfad `docs/internal/` abgelegt werden.
- Fügen Sie Seiten unter `docs/internal/**` niemals zur Navigation in `docs/docs.json` hinzu und verlinken Sie sie nicht aus der öffentlichen Dokumentation.
- `scripts/docs-sync-publish.mjs` schließt `docs/internal/**` von der Veröffentlichung im öffentlichen Repository `openclaw/docs` aus und entfernt diese Dateien, falls eine Seite später erzwungenermaßen hinzugefügt wird.
- Interne Dokumentation darf Repo-Pfade, Namen privater Apps, Namen von 1Password-Elementen und Runbooks erwähnen, darf jedoch niemals geheime Werte enthalten.

## Bearbeitung der Reifegrad-Scorecard

`taxonomy.yaml` und `qa/maturity-scores.yaml` sind die Quelldaten; generierte Reifegraddokumente unter `docs/maturity/` sind Projektionen und sollten hinsichtlich Bewertung, LTS, Taxonomie, QA-Profil oder Evidenztabellen nicht manuell bearbeitet werden.
`scripts/qa/render-maturity-docs.ts` ist für die Generierung zuständig; verwenden Sie `pnpm maturity:render`, um die eingecheckte Dokumentation zu aktualisieren, und `pnpm maturity:check`, um sie zu überprüfen.
`.github/workflows/maturity-scorecard.yml` erzeugt Artefaktvorschauen und kann PRs für generierte Dokumentation öffnen; `.github/workflows/openclaw-release-checks.yml` startet diesen Workflow für die Release-QA.
Belassen Sie deterministische `qa-evidence.json.scorecard`-Daten in GitHub-Actions-Artefakten, sofern ein Maintainer nicht ausdrücklich eine bereinigte eingecheckte Projektion anfordert.
Manuelle Überschreibungen müssen den Quellzustand in einem PR ändern und den Grund sowie öffentliche oder geschwärzte Nachweise erläutern.

## Internationalisierung der Dokumentation

- Fremdsprachige Dokumentation wird in diesem Repository nicht gepflegt. Die generierte Veröffentlichungsausgabe befindet sich im separaten Repository `openclaw/docs` (das lokal häufig als `../openclaw-docs` geklont wird).
- Fügen Sie hier unter `docs/<locale>/**` keine lokalisierten Dokumente hinzu und bearbeiten Sie dort keine.
- Behandeln Sie die englische Dokumentation in diesem Repository zusammen mit den Glossardateien als maßgebliche Quelle.
- Pipeline: Aktualisieren Sie hier die englische Dokumentation, aktualisieren Sie bei Bedarf `docs/.i18n/glossary.<locale>.json` und lassen Sie anschließend im Repository `openclaw/docs` die Synchronisierung des Veröffentlichungs-Repositorys und `scripts/docs-i18n` ausführen.
- Bevor Sie `scripts/docs-i18n` erneut ausführen, fügen Sie Glossareinträge für alle neuen technischen Begriffe, Seitentitel oder kurzen Navigationsbeschriftungen hinzu, die auf Englisch bleiben oder eine feste Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` dient als Schutzprüfung für geänderte englische Dokumentationstitel und kurze interne Dokumentationsbeschriftungen.
- Der Übersetzungsspeicher befindet sich in den generierten Dateien `docs/.i18n/*.tm.jsonl` im Veröffentlichungs-Repository.
- Siehe `docs/.i18n/README.md`.
