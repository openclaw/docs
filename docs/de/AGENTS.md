---
x-i18n:
    generated_at: "2026-06-27T17:08:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Docs-Leitfaden

Dieses Verzeichnis ist zuständig für das Erstellen von Dokumentation, Mintlify-Linkregeln und die Docs-i18n-Richtlinie.

## Mintlify-Regeln

- Die Docs werden auf Mintlify gehostet (`https://docs.openclaw.ai`).
- Interne Dokumentationslinks in `docs/**/*.md` müssen wurzelrelativ bleiben, ohne Suffix `.md` oder `.mdx` (Beispiel: `[Config](/gateway/configuration)`).
- Abschnittsquerverweise sollten Anker auf wurzelrelativen Pfaden verwenden (Beispiel: `[Hooks](/gateway/configuration-reference#hooks)`).
- Dokumentationsüberschriften sollten Gedankenstriche und Apostrophe vermeiden, weil die Ankererzeugung von Mintlify dort fragil ist.
- README und andere von GitHub gerenderte Docs sollten absolute Docs-URLs behalten, damit Links außerhalb von Mintlify funktionieren.
- Docs-Inhalte müssen generisch bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; verwenden Sie Platzhalter wie `user@gateway-host`.

## Regeln für Docs-Inhalte

- Ordnen Sie für Docs, UI-Texte und Auswahllisten Dienste/Provider alphabetisch, es sei denn, der Abschnitt beschreibt ausdrücklich die Laufzeitreihenfolge oder die Reihenfolge der automatischen Erkennung.
- Halten Sie die Benennung gebündelter Plugins konsistent mit den repo-weiten Plugin-Terminologieregeln im Root-`AGENTS.md`.

## Interne Docs

- Langlebige private Betreiber-Dokumente gehören nach `~/Projects/manager/docs/`.
- Repo-lokale interne Arbeits-/Spiegeldokumente können unter dem ignorierten Pfad `docs/internal/` liegen.
- Fügen Sie niemals Seiten unter `docs/internal/**` zur Navigation in `docs/docs.json` hinzu und verlinken Sie sie nicht aus öffentlichen Docs.
- `scripts/docs-sync-publish.mjs` schließt `docs/internal/**` aus und entfernt es aus dem öffentlichen Publish-Repo `openclaw/docs`, falls eine Seite später erzwungen hinzugefügt wird.
- Interne Docs dürfen Repo-Pfade, private App-Namen, 1Password-Item-Namen und Runbooks erwähnen, aber niemals geheime Werte enthalten.

## Bearbeitung der Reifegrad-Scorecard

`taxonomy.yaml` und `qa/maturity-scores.yaml` sind die Quelleingaben; generierte Reifegrad-Dokumente unter `docs/maturity/` sind Projektionen und sollten nicht manuell für Score, LTS, Taxonomie, QA-Profil oder Nachweistabellen bearbeitet werden.
`scripts/qa/render-maturity-docs.ts` ist für die Generierung zuständig; verwenden Sie `pnpm maturity:render`, um committete Docs zu aktualisieren, und `pnpm maturity:check`, um sie zu verifizieren.
`.github/workflows/maturity-scorecard.yml` rendert Artefaktvorschauen und kann PRs für generierte Docs öffnen; `.github/workflows/openclaw-release-checks.yml` löst diesen Workflow für Release-QA aus.
Bewahren Sie deterministische `qa-evidence.json.scorecard`-Daten in GitHub-Actions-Artefakten auf, es sei denn, ein Maintainer bittet ausdrücklich um eine bereinigte, committete Projektion.
Manuelle Überschreibungen müssen den Quellzustand in einem PR ändern und den Grund sowie öffentliche oder redigierte Nachweise erklären.

## Docs i18n

- Fremdsprachige Docs werden in diesem Repo nicht gepflegt. Die generierte Publish-Ausgabe liegt im separaten Repo `openclaw/docs` (lokal oft als `../openclaw-docs` geklont).
- Fügen Sie hier keine lokalisierten Docs unter `docs/<locale>/**` hinzu und bearbeiten Sie sie nicht.
- Behandeln Sie englische Docs in diesem Repo sowie Glossardateien als maßgebliche Quelle.
- Pipeline: Aktualisieren Sie hier die englischen Docs, aktualisieren Sie bei Bedarf `docs/.i18n/glossary.<locale>.json`, und lassen Sie dann die Publish-Repo-Synchronisierung und `scripts/docs-i18n` in `openclaw/docs` laufen.
- Bevor Sie `scripts/docs-i18n` erneut ausführen, fügen Sie Glossareinträge für alle neuen technischen Begriffe, Seitentitel oder kurzen Navigationslabels hinzu, die auf Englisch bleiben oder eine feste Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` ist der Guard für geänderte englische Dokumentationstitel und kurze interne Dokumentationslabels.
- Translation Memory befindet sich in generierten `docs/.i18n/*.tm.jsonl`-Dateien im Publish-Repo.
- Siehe `docs/.i18n/README.md`.
