---
read_when:
    - Planung eines umfassenden Modernisierungsdurchlaufs für die OpenClaw-Anwendung
    - Aktualisierung der Frontend-Implementierungsstandards für App- oder Control-UI-Arbeiten
    - Eine umfassende Produktqualitätsprüfung in phasenweise Entwicklungsarbeit überführen
summary: Umfassender Plan zur Anwendungsmodernisierung mit Aktualisierungen der Skills für die Frontend-Bereitstellung
title: Plan zur Anwendungsmodernisierung
x-i18n:
    generated_at: "2026-05-06T07:02:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## Ziel

Die Anwendung in Richtung eines saubereren, schnelleren und besser wartbaren Produkts weiterentwickeln, ohne
bestehende Workflows zu beschädigen oder Risiken in breiten Refactorings zu verstecken. Die Arbeit sollte
in kleinen, reviewbaren Abschnitten landen, jeweils mit Nachweis für jede berührte Oberfläche.

## Prinzipien

- Bewahren Sie die aktuelle Architektur, außer eine Grenze verursacht nachweislich Änderungsaufwand,
  Performance-Kosten oder für Benutzer sichtbare Fehler.
- Bevorzugen Sie für jedes Problem den kleinsten korrekten Patch, und wiederholen Sie das Vorgehen dann.
- Trennen Sie erforderliche Korrekturen von optionalem Feinschliff, damit Maintainer hochwertige
  Arbeit übernehmen können, ohne auf subjektive Entscheidungen warten zu müssen.
- Halten Sie Plugin-seitiges Verhalten dokumentiert und abwärtskompatibel.
- Verifizieren Sie ausgeliefertes Verhalten, Dependency-Verträge und Tests, bevor Sie behaupten, dass eine
  Regression behoben ist.
- Verbessern Sie zuerst den wichtigsten Benutzerpfad: Onboarding, Authentifizierung, Chat, Provider-Einrichtung,
  Plugin-Management und Diagnose.

## Phase 1: Baseline-Audit

Inventarisieren Sie die aktuelle Anwendung, bevor Sie sie ändern.

- Identifizieren Sie die wichtigsten Benutzer-Workflows und die Code-Oberflächen, die sie besitzen.
- Listen Sie tote Interaktionsangebote, doppelte Einstellungen, unklare Fehlerzustände und teure
  Render-Pfade auf.
- Erfassen Sie die aktuellen Validierungsbefehle für jede Oberfläche.
- Markieren Sie Probleme als erforderlich, empfohlen oder optional.
- Dokumentieren Sie bekannte Blocker, die Owner-Review benötigen, insbesondere Änderungen an API, Sicherheit,
  Release und Plugin-Verträgen.

Definition of done:

- Eine Problemliste mit repo-root-Dateiverweisen.
- Jedes Problem hat Schweregrad, Owner-Oberfläche, erwartete Benutzerwirkung und einen vorgeschlagenen
  Validierungspfad.
- Keine spekulativen Aufräumpunkte sind mit erforderlichen Korrekturen vermischt.

## Phase 2: Produkt- und UX-Bereinigung

Priorisieren Sie sichtbare Workflows und beseitigen Sie Verwirrung.

- Schärfen Sie Onboarding-Texte und Leerzustände rund um Modell-Authentifizierung, Gateway-Status
  und Plugin-Einrichtung.
- Entfernen oder deaktivieren Sie tote Interaktionsangebote, wenn keine Aktion möglich ist.
- Halten Sie wichtige Aktionen über responsive Breiten hinweg sichtbar, statt sie hinter fragilen
  Layout-Annahmen zu verstecken.
- Konsolidieren Sie wiederholte Statussprache, damit Fehler eine einzige Quelle der Wahrheit haben.
- Fügen Sie schrittweise Offenlegung für erweiterte Einstellungen hinzu, während die Kerneinrichtung schnell bleibt.

Empfohlene Validierung:

- Manueller Happy Path für die Ersteinrichtung und den Start bestehender Benutzer.
- Fokussierte Tests für jede Logik zu Routing, Konfigurationspersistenz oder Statusableitung.
- Browser-Screenshots für geänderte responsive Oberflächen.

## Phase 3: Straffung der Frontend-Architektur

Verbessern Sie die Wartbarkeit ohne breite Neuschreibung.

- Verschieben Sie wiederholte UI-State-Transformationen in schmale typisierte Helper.
- Halten Sie Verantwortlichkeiten für Datenabruf, Persistenz und Darstellung getrennt.
- Bevorzugen Sie bestehende Hooks, Stores und Komponenten-Muster gegenüber neuen Abstraktionen.
- Teilen Sie übergroße Komponenten nur, wenn dadurch Kopplung reduziert oder Tests klarer werden.
- Vermeiden Sie die Einführung breiten globalen State für lokale Panel-Interaktionen.

Erforderliche Leitplanken:

- Ändern Sie öffentliches Verhalten nicht als Nebeneffekt von Dateiaufteilungen.
- Halten Sie Accessibility-Verhalten für Menüs, Dialoge, Tabs und Tastaturnavigation intakt.
- Verifizieren Sie, dass Lade-, Leer-, Fehler- und optimistische Zustände weiterhin gerendert werden.

## Phase 4: Performance und Zuverlässigkeit

Zielen Sie auf gemessene Schmerzpunkte statt auf breite theoretische Optimierung.

- Messen Sie Kosten für Start, Routenwechsel, große Listen und Chat-Transkripte.
- Ersetzen Sie wiederholte teure abgeleitete Daten durch memoized Selectors oder gecachte
  Helper, wenn Profiling den Wert belegt.
- Reduzieren Sie vermeidbare Netzwerk- oder Dateisystem-Scans auf Hot Paths.
- Halten Sie deterministische Reihenfolge für Prompt-, Registry-, Datei-, Plugin- und Netzwerk-
  Eingaben vor der Konstruktion von Modell-Payloads ein.
- Fügen Sie leichtgewichtige Regressionstests für Hot Helper und Vertragsgrenzen hinzu.

Definition of done:

- Jede Performance-Änderung erfasst Baseline, erwartete Auswirkung, tatsächliche Auswirkung und
  verbleibende Lücke.
- Kein Performance-Patch landet ausschließlich auf Basis von Intuition, wenn günstige Messung verfügbar ist.

## Phase 5: Härtung von Typen, Verträgen und Tests

Erhöhen Sie die Korrektheit an den Grenzpunkten, von denen Benutzer und Plugin-Autoren abhängen.

- Ersetzen Sie lose Runtime-Strings durch discriminated unions oder geschlossene Codelisten.
- Validieren Sie externe Eingaben mit bestehenden Schema-Helpern oder zod.
- Fügen Sie Vertragstests rund um Plugin-Manifeste, Provider-Kataloge, Gateway-Protokollnachrichten
  und Verhalten bei Konfigurationsmigration hinzu.
- Halten Sie Kompatibilitätspfade in Doctor- oder Reparatur-Flows statt in versteckten Migrationen
  zur Startzeit.
- Vermeiden Sie testseitige Kopplung an Plugin-Interna; verwenden Sie SDK-Fassaden und dokumentierte
  Barrels.

Empfohlene Validierung:

- `pnpm check:changed`
- Gezielte Tests für jede geänderte Grenze.
- `pnpm build`, wenn Lazy Boundaries, Packaging oder veröffentlichte Oberflächen geändert werden.

## Phase 6: Dokumentation und Release-Bereitschaft

Halten Sie benutzerorientierte Dokumentation mit dem Verhalten synchron.

- Aktualisieren Sie Dokumentation bei Änderungen an Verhalten, API, Konfiguration, Onboarding oder Plugin.
- Fügen Sie Changelog-Einträge nur für benutzersichtbare Änderungen hinzu.
- Halten Sie Plugin-Terminologie benutzerorientiert; verwenden Sie interne Paketnamen nur dort,
  wo sie für Beitragende benötigt werden.
- Bestätigen Sie, dass Release- und Installationsanweisungen weiterhin zur aktuellen Befehlsoberfläche passen.

Definition of done:

- Relevante Dokumentation wird im selben Branch wie Verhaltensänderungen aktualisiert.
- Prüfungen auf generierte Dokumentation oder API-Drift bestehen, wenn sie berührt wurden.
- Die Übergabe nennt jede übersprungene Validierung und warum sie übersprungen wurde.

## Empfohlener erster Abschnitt

Beginnen Sie mit einem eng gefassten Durchgang für Control UI und Onboarding:

- Auditieren Sie Ersteinrichtung, Provider-Auth-Bereitschaft, Gateway-Status und Plugin-
  Einrichtungsoberflächen.
- Entfernen Sie tote Aktionen und klären Sie Fehlerzustände.
- Fügen Sie fokussierte Tests für Statusableitung und Konfigurationspersistenz hinzu oder aktualisieren Sie sie.
- Führen Sie `pnpm check:changed` aus.

Dies liefert hohen Benutzerwert bei begrenztem Architekturrisiko.

## Frontend-Skill-Update

Verwenden Sie diesen Abschnitt, um das frontend-fokussierte `SKILL.md` zu aktualisieren, das mit der
Modernisierungsaufgabe geliefert wurde. Wenn Sie diese Anleitung als repo-lokalen OpenClaw-Skill übernehmen,
erstellen Sie zuerst `.agents/skills/openclaw-frontend/SKILL.md`, behalten Sie das Frontmatter,
das in diesen Ziel-Skill gehört, und fügen Sie dann die Body-Anleitung mit dem folgenden Inhalt hinzu
oder ersetzen Sie sie dadurch.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
