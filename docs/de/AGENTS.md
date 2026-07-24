---
x-i18n:
    generated_at: "2026-07-24T03:38:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Dokumentationsleitfaden

Dieses Verzeichnis ist für die Erstellung der Dokumentation, die Mintlify-Linkregeln und die i18n-Richtlinie der Dokumentation zuständig.

## Mintlify-Regeln

- Die Dokumentation wird auf Mintlify (`https://docs.openclaw.ai`) gehostet.
- Interne Dokumentationslinks in `docs/**/*.md` müssen relativ zum Stammverzeichnis bleiben und dürfen kein Suffix `.md` oder `.mdx` enthalten (Beispiel: `[Config](/gateway/configuration)`).
- Abschnittsübergreifende Verweise sollten Anker auf stammverzeichnisrelativen Pfaden verwenden (Beispiel: `[Hooks](/gateway/configuration-reference#hooks)`).
- Überschriften in der Dokumentation sollten Gedankenstriche und Apostrophe vermeiden, da die Ankererzeugung von Mintlify damit fehleranfällig ist.
- README-Dateien und andere von GitHub gerenderte Dokumentationen sollten absolute Dokumentations-URLs beibehalten, damit die Links außerhalb von Mintlify funktionieren.
- Dokumentationsinhalte müssen allgemein bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; verwenden Sie Platzhalter wie `user@gateway-host`.

## Regeln für Dokumentationsinhalte

- Ordnen Sie Dienste/Provider in der Dokumentation, in UI-Texten und in Auswahllisten alphabetisch, sofern der Abschnitt nicht ausdrücklich die Laufzeitreihenfolge oder die Reihenfolge der automatischen Erkennung beschreibt.
- Halten Sie die Benennung gebündelter Plugins mit den repositoryweiten Regeln zur Plugin-Terminologie in der `AGENTS.md` im Stammverzeichnis konsistent.
- Generierte Dokumentation, niemals manuell bearbeiten: `docs/plugins/reference/**`, `docs/plugins/reference.md` und `docs/plugins/plugin-inventory.md` stammen aus `pnpm plugins:inventory:gen`; `docs/docs_map.md` aus `pnpm docs:map:gen`; `docs/maturity/**` aus `pnpm maturity:render`.

## Interne Dokumentation

- Langfristig gepflegte private Betriebsdokumentation gehört in `~/Projects/manager/docs/`.
- Repositorylokale interne Arbeits- oder Spiegeldokumentation kann unter dem ignorierten `docs/internal/` liegen.
- Fügen Sie `docs/internal/**`-Seiten niemals zur Navigation in `docs/docs.json` hinzu und verlinken Sie sie nicht aus der öffentlichen Dokumentation.
- `scripts/docs-sync-publish.mjs` schließt `docs/internal/**` aus dem öffentlichen Veröffentlichungs-Repository `openclaw/docs` aus und entfernt es daraus, falls eine Seite später zwangsweise hinzugefügt wird.
- Interne Dokumentation darf Repository-Pfade, private App-Namen, Namen von 1Password-Elementen und Runbooks erwähnen, aber niemals geheime Werte enthalten.

## Bearbeitung der Reifegrad-Scorecard

`taxonomy.yaml` und `qa/maturity-scores.yaml` sind die Quelleingaben; generierte Reifegraddokumente unter `docs/maturity/` sind Projektionen und sollten hinsichtlich Bewertung, LTS, Taxonomie, QA-Profil oder Evidenztabellen nicht manuell bearbeitet werden.
`scripts/qa/render-maturity-docs.ts` ist für die Generierung zuständig; verwenden Sie `pnpm maturity:render`, um versionierte Dokumente zu aktualisieren, und `pnpm maturity:check`, um sie zu überprüfen.
`.github/workflows/maturity-scorecard.yml` rendert Artefaktvorschauen und kann Pull Requests für generierte Dokumente öffnen; `.github/workflows/openclaw-release-checks.yml` löst dies für die Release-QA aus.
Bewahren Sie deterministische `qa-evidence.json.scorecard`-Daten in GitHub-Actions-Artefakten auf, sofern ein Maintainer nicht ausdrücklich eine bereinigte, versionierte Projektion anfordert.
Manuelle Überschreibungen müssen den Quellzustand in einem Pull Request ändern und den Grund sowie öffentliche oder redigierte Nachweise erläutern.

## Dokumentations-i18n

- Fremdsprachige Dokumentation wird in diesem Repository nicht gepflegt. Die generierte Veröffentlichungsausgabe befindet sich im separaten Repository `openclaw/docs` (lokal häufig als `../openclaw-docs` geklont).
- Fügen Sie hier unter `docs/<locale>/**` keine lokalisierte Dokumentation hinzu und bearbeiten Sie sie dort nicht.
- Behandeln Sie die englische Dokumentation in diesem Repository sowie die Glossardateien als maßgebliche Quelle.
- Pipeline: Aktualisieren Sie hier die englische Dokumentation, aktualisieren Sie `docs/.i18n/glossary.<locale>.json` nach Bedarf und lassen Sie anschließend die Synchronisierung des Veröffentlichungs-Repositorys sowie `scripts/docs-i18n` in `openclaw/docs` ausführen.
- Fügen Sie vor der erneuten Ausführung von `scripts/docs-i18n` Glossareinträge für alle neuen technischen Begriffe, Seitentitel oder kurzen Navigationsbezeichnungen hinzu, die auf Englisch bleiben oder eine feste Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` dient als Schutzmechanismus für geänderte englische Dokumentationstitel und kurze interne Dokumentationsbezeichnungen.
- Der Übersetzungsspeicher befindet sich in generierten `docs/.i18n/*.tm.jsonl`-Dateien im Veröffentlichungs-Repository.
- Siehe `docs/.i18n/README.md`.
