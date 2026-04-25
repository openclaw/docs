---
read_when:
    - Planung einer umfassenden Modernisierung der OpenClaw-Anwendung
    - Aktualisierung der Frontend-Implementierungsstandards für App- oder Control-UI-Arbeiten
    - Eine umfassende Produktqualitätsprüfung in phasenweise Engineering-Arbeit überführen
summary: Umfassender Plan zur Anwendungsmodernisierung mit Aktualisierungen der Kompetenzen für die Frontend-Bereitstellung
title: Plan zur Anwendungsmodernisierung
x-i18n:
    generated_at: "2026-04-25T13:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Plan zur Anwendungsmodernisierung

## Ziel

Die Anwendung soll zu einem saubereren, schnelleren und wartbareren Produkt weiterentwickelt werden, ohne aktuelle Workflows zu beeinträchtigen oder Risiken in umfassenden Refactorings zu verstecken. Die Arbeit sollte in kleinen, überprüfbaren Teilstücken landen, mit Nachweisen für jede berührte Oberfläche.

## Grundsätze

- Behalten Sie die aktuelle Architektur bei, es sei denn, eine Grenze verursacht nachweislich Churn, Leistungskosten oder für Benutzer sichtbare Fehler.
- Bevorzugen Sie für jedes Problem den kleinsten korrekten Patch und wiederholen Sie dann den Vorgang.
- Trennen Sie erforderliche Korrekturen von optionalem Feinschliff, damit Maintainer wertvolle Arbeit mit hohem Nutzen landen können, ohne auf subjektive Entscheidungen warten zu müssen.
- Halten Sie das Verhalten gegenüber Plugins dokumentiert und abwärtskompatibel.
- Verifizieren Sie das ausgelieferte Verhalten, Abhängigkeitsverträge und Tests, bevor Sie behaupten, eine Regression sei behoben.
- Verbessern Sie zuerst den Hauptpfad für Benutzer: Onboarding, Authentifizierung, Chat, Anbietereinrichtung, Plugin-Verwaltung und Diagnose.

## Phase 1: Baseline-Prüfung

Erfassen Sie den aktuellen Stand der Anwendung, bevor Sie Änderungen vornehmen.

- Identifizieren Sie die wichtigsten Benutzer-Workflows und die Code-Oberflächen, denen sie gehören.
- Listen Sie tote Bedienelemente, doppelte Einstellungen, unklare Fehlerzustände und teure Renderpfade auf.
- Erfassen Sie die aktuellen Validierungsbefehle für jede Oberfläche.
- Kennzeichnen Sie Probleme als erforderlich, empfohlen oder optional.
- Dokumentieren Sie bekannte Blocker, die eine Prüfung durch die zuständigen Owner erfordern, insbesondere Änderungen an API, Sicherheit, Release und Plugin-Verträgen.

Definition of done:

- Eine Problemliste mit Referenzen zu Dateien relativ zum Repo-Root.
- Jedes Problem hat einen Schweregrad, eine Owner-Oberfläche, die erwartete Auswirkung auf Benutzer und einen vorgeschlagenen Validierungspfad.
- Es werden keine spekulativen Bereinigungspunkte mit erforderlichen Korrekturen vermischt.

## Phase 2: Produkt- und UX-Bereinigung

Priorisieren Sie sichtbare Workflows und beseitigen Sie Verwirrung.

- Straffen Sie den Text für Onboarding und leere Zustände rund um Modell-Authentifizierung, Gateway-Status und Plugin-Einrichtung.
- Entfernen oder deaktivieren Sie tote Bedienelemente, wenn keine Aktion möglich ist.
- Halten Sie wichtige Aktionen über responsive Breiten hinweg sichtbar, anstatt sie hinter fragilen Layout-Annahmen zu verbergen.
- Konsolidieren Sie wiederholte Statustexte, damit Fehler eine einzige Quelle der Wahrheit haben.
- Fügen Sie progressive Offenlegung für erweiterte Einstellungen hinzu und halten Sie die Kerneinrichtung gleichzeitig schnell.

Empfohlene Validierung:

- Manueller Happy Path für die Ersteinrichtung und den Start bestehender Benutzer.
- Fokussierte Tests für Routing, Persistenz der Konfiguration oder Logik zur Statusableitung.
- Browser-Screenshots für geänderte responsive Oberflächen.

## Phase 3: Straffung der Frontend-Architektur

Verbessern Sie die Wartbarkeit ohne umfassende Neuschreibung.

- Verschieben Sie wiederholte Transformationen von UI-Status in schmale typisierte Helfer.
- Halten Sie Verantwortlichkeiten für Datenabruf, Persistenz und Darstellung getrennt.
- Bevorzugen Sie bestehende Hooks, Stores und Komponentenmuster gegenüber neuen Abstraktionen.
- Teilen Sie übergroße Komponenten nur auf, wenn dadurch Kopplung reduziert oder Tests klarer werden.
- Vermeiden Sie die Einführung breit angelegten globalen Status für lokale Panel-Interaktionen.

Erforderliche Leitplanken:

- Ändern Sie kein öffentliches Verhalten als Nebeneffekt der Dateiaufteilung.
- Erhalten Sie das Barrierefreiheitsverhalten für Menüs, Dialoge, Tabs und Tastaturnavigation.
- Verifizieren Sie, dass Lade-, Leer-, Fehler- und optimistische Zustände weiterhin gerendert werden.

## Phase 4: Leistung und Zuverlässigkeit

Zielen Sie auf gemessene Schmerzpunkte statt auf breit angelegte theoretische Optimierung.

- Messen Sie Start, Routenwechsel, große Listen und Kosten von Chat-Transkripten.
- Ersetzen Sie wiederholt teure abgeleitete Daten durch memoized Selektoren oder gecachte Helfer, wenn Profiling den Nutzen belegt.
- Reduzieren Sie vermeidbare Netzwerk- oder Dateisystem-Scans auf Hot Paths.
- Behalten Sie deterministische Reihenfolge für Prompt-, Registry-, Datei-, Plugin- und Netzwerkeingaben vor der Konstruktion von Modell-Payloads bei.
- Fügen Sie leichtgewichtige Regressionstests für Hot Helpers und Vertragsgrenzen hinzu.

Definition of done:

- Jede Leistungsänderung dokumentiert Baseline, erwartete Auswirkung, tatsächliche Auswirkung und verbleibende Lücke.
- Kein Performance-Patch landet ausschließlich auf Basis von Intuition, wenn günstige Messung verfügbar ist.

## Phase 5: Härtung von Typen, Verträgen und Tests

Erhöhen Sie die Korrektheit an den Grenzpunkten, von denen Benutzer und Plugin-Autoren abhängen.

- Ersetzen Sie lose Runtime-Strings durch discriminated unions oder geschlossene Codelisten.
- Validieren Sie externe Eingaben mit bestehenden Schema-Helfern oder zod.
- Fügen Sie Vertragstests rund um Plugin-Manifeste, Anbieter-Kataloge, Nachrichten des Gateway-Protokolls und das Verhalten bei Konfigurationsmigrationen hinzu.
- Behalten Sie Kompatibilitätspfade in doctor- oder Reparatur-Flows statt in versteckten Migrationen zur Startzeit.
- Vermeiden Sie testseitige Kopplung an Plugin-Interna; verwenden Sie SDK-Fassaden und dokumentierte Barrels.

Empfohlene Validierung:

- `pnpm check:changed`
- Gezielte Tests für jede geänderte Grenze.
- `pnpm build`, wenn Lazy Boundaries, Packaging oder veröffentlichte Oberflächen geändert werden.

## Phase 6: Dokumentation und Release-Bereitschaft

Halten Sie benutzerseitige Dokumentation am Verhalten ausgerichtet.

- Aktualisieren Sie die Dokumentation bei Änderungen an Verhalten, API, Konfiguration, Onboarding oder Plugins.
- Fügen Sie Changelog-Einträge nur für für Benutzer sichtbare Änderungen hinzu.
- Verwenden Sie für Benutzer sichtbare Plugin-Terminologie; nutzen Sie interne Paketnamen nur dort, wo sie für Mitwirkende erforderlich sind.
- Bestätigen Sie, dass Release- und Installationsanweisungen weiterhin zur aktuellen Befehlsoberfläche passen.

Definition of done:

- Relevante Dokumentation wird im selben Branch wie die Verhaltensänderungen aktualisiert.
- Prüfungen auf generierte Dokumentation oder API-Drift bestehen, wenn der Bereich betroffen ist.
- Das Handoff benennt jede übersprungene Validierung und warum sie übersprungen wurde.

## Empfohlener erster Teilabschnitt

Beginnen Sie mit einem abgegrenzten Durchlauf für Control UI und Onboarding:

- Prüfen Sie die Oberflächen für Ersteinrichtung, Bereitschaft der Anbieter-Authentifizierung, Gateway-Status und Plugin-Einrichtung.
- Entfernen Sie tote Aktionen und machen Sie Fehlerzustände klarer.
- Fügen Sie fokussierte Tests für Statusableitung und Persistenz der Konfiguration hinzu oder aktualisieren Sie sie.
- Führen Sie `pnpm check:changed` aus.

Dies liefert hohen Benutzerwert bei begrenztem Architekturrisiko.

## Aktualisierung der Frontend-Skills

Verwenden Sie diesen Abschnitt, um die frontendfokussierte `SKILL.md` zu aktualisieren, die mit der Modernisierungsaufgabe bereitgestellt wurde. Wenn Sie diese Anleitung als repo-lokalen OpenClaw-Skill übernehmen, erstellen Sie zuerst `.agents/skills/openclaw-frontend/SKILL.md`, behalten Sie das Frontmatter bei, das zu diesem Ziel-Skill gehört, und fügen Sie dann die folgende Anleitung zum Body hinzu oder ersetzen Sie ihn damit.

```markdown
# Standards für die Frontend-Bereitstellung

Verwenden Sie diesen Skill bei der Implementierung oder Überprüfung benutzerseitiger React-, Next.js-, Desktop-Webview- oder App-UI-Arbeiten.

## Betriebsregeln

- Gehen Sie vom bestehenden Produkt-Workflow und den vorhandenen Code-Konventionen aus.
- Bevorzugen Sie den kleinsten korrekten Patch, der den aktuellen Benutzerpfad verbessert.
- Trennen Sie im Handoff erforderliche Korrekturen von optionalem Feinschliff.
- Erstellen Sie keine Marketingseiten, wenn die Anfrage eine Anwendungsoberfläche betrifft.
- Halten Sie Aktionen über unterstützte Viewport-Größen hinweg sichtbar und nutzbar.
- Entfernen Sie tote Bedienelemente, anstatt Steuerelemente stehen zu lassen, die nichts ausführen können.
- Erhalten Sie Lade-, Leer-, Fehler-, Erfolgs- und Berechtigungszustände.
- Verwenden Sie bestehende Design-System-Komponenten, Hooks, Stores und Symbole, bevor Sie neue Primitive hinzufügen.

## Checkliste für die Implementierung

1. Identifizieren Sie die primäre Benutzeraufgabe und die Komponente oder Route, der sie gehört.
2. Lesen Sie vor der Bearbeitung die lokalen Komponentenmuster.
3. Patchen Sie die schmalste Oberfläche, die das Problem löst.
4. Fügen Sie responsive Einschränkungen für Steuerelemente mit festem Format, Toolbars, Grids und Zähler hinzu, damit Text und Hover-Zustände das Layout nicht unerwartet vergrößern können.
5. Halten Sie Verantwortlichkeiten für Datenladen, Statusableitung und Rendering klar getrennt.
6. Fügen Sie Tests hinzu, wenn Logik, Persistenz, Routing, Berechtigungen oder gemeinsame Helfer geändert werden.
7. Verifizieren Sie den wichtigsten Happy Path und den relevantesten Edge Case.

## Qualitätskriterien für die Darstellung

- Text muss auf Mobilgeräten und Desktop innerhalb seines Containers passen.
- Toolbars dürfen umbrechen, aber Steuerelemente müssen erreichbar bleiben.
- Buttons sollten vertraute Symbole verwenden, wenn das Symbol klarer ist als Text.
- Cards sollten für wiederholte Elemente, Modals und eingerahmte Werkzeuge verwendet werden, nicht für jeden Seitenabschnitt.
- Vermeiden Sie monotone Farbpaletten und dekorative Hintergründe, die mit operativen Inhalten konkurrieren.
- Dichte Produktoberflächen sollten für schnelles Erfassen, Vergleichen und wiederholte Nutzung optimiert sein.

## Handoff-Format

Berichten Sie:

- Was geändert wurde.
- Welches Benutzerverhalten sich geändert hat.
- Welche erforderliche Validierung bestanden wurde.
- Welche Validierung übersprungen wurde und aus welchem konkreten Grund.
- Optionale Folgearbeiten, klar getrennt von erforderlichen Korrekturen.
```
