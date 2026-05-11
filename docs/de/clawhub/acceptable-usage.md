---
read_when:
    - Uploads auf Missbrauch oder Richtlinienverstöße überprüfen
    - Moderationsdokumentation oder Handlungsanleitungen für Prüfende schreiben
    - Entscheiden, ob ein Skill ausgeblendet oder ein Benutzer gesperrt werden sollte
summary: 'Marketplace-Richtlinie: was ClawHub zulässt und was es nicht hostet.'
x-i18n:
    generated_at: "2026-05-11T22:19:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Zulässige Nutzung

Diese Seite beschreibt, welche Arten von Skills und Inhalten für ClawHub akzeptabel sind und welche Missbrauchs-Workflows dort nicht gehostet werden.

Diese Regeln sind bewusst praxisorientiert. Uns geht es vor allem um End-to-End-Missbrauchs-Workflows, nicht nur um isolierte Schlüsselwörter. Wenn ein Skill dafür gebaut ist, Schutzmaßnahmen zu umgehen, Plattformen zu missbrauchen, Menschen zu betrügen, in die Privatsphäre einzudringen oder nicht einvernehmliches Verhalten zu ermöglichen, gehört er nicht auf ClawHub.

## Aktuelle Muster, die wir ausdrücklich akzeptieren

- Frontend- und Design-System-Arbeit, die reale Komponenten, semantische Tokens, zugängliche Zustände und getestete Nutzerabläufe verwendet.
- shadcn/ui-Komposition, die installierte Quellkomponenten, Projekt-Aliase und dokumentierte Varianten statt einmaligem Markup verwendet.
- UI5-JavaScript-zu-TypeScript-Konvertierung, die Kommentare erhält, konkrete UI5-Typen verwendet und generierte Control-Schnittstellen überprüfbar hält.
- Defensive Sicherheitsprüfung, Moderations-Tooling und Prompts zur Missbrauchserkennung, die Belege zeigen und Grenzen für menschliche Freigaben klar halten.
- Einwilligungsbasierte Workflow-Automatisierung für persönliche oder Team-Konten mit expliziten Zugangsdaten, transparenter Einrichtung und Dry-Run- oder Vorschaumodi.
- Dokumentation, Migrations-Runbooks, Entwicklerwerkzeuge und Test-Fixtures mit engem Bezug zur unterstützten Software.

## Nicht akzeptabel

- Workflows zur Umgehung von Sicherheitsmaßnahmen oder für unautorisierten Zugriff.
  - Beispiele: Umgehung der Authentifizierung, Kontoübernahme, CAPTCHA-Umgehung, Umgehung von Cloudflare oder Anti-Bot-Maßnahmen, Umgehung von Ratenbegrenzungen, heimliches Scraping zur Aushebelung von Schutzmaßnahmen, Übernahme laufender Anrufe oder Agenten, wiederverwendbarer Sitzungsdiebstahl, automatische Genehmigung von Pairing-Abläufen für nicht freigegebene Nutzer.

- Plattformmissbrauch und Umgehung von Sperren.
  - Beispiele: heimliche Konten nach Sperren, Account-Warming/Farming, gefälschtes Engagement, Aufbau von Karma oder Followern, Multi-Account-Automatisierung, Massenveröffentlichungen, Spam-Bots, Marketplace- oder Social-Automatisierung, die darauf ausgelegt ist, Erkennung zu vermeiden.

- Betrug, Scams und täuschende Finanz-Workflows.
  - Beispiele: gefälschte Zertifikate, gefälschte Rechnungen, täuschende Zahlungsabläufe, Scam-Outreach, gefälschte Social Proofs, Tools, die Ausgaben oder Belastungen ohne klare menschliche Freigabe und transparente Kontrollen ermöglichen, oder Workflows mit synthetischen Identitäten, die Konten für Betrug erstellen sollen.

- In die Privatsphäre eingreifendes Scraping, Anreicherung oder Überwachung.
  - Beispiele: Scraping von Kontaktdaten in großem Umfang für Spam, Doxxing, Stalking, Lead-Extraktion kombiniert mit unaufgefordertem Outreach, verdeckte Überwachung, Gesichtssuche oder biometrisches Matching ohne klare Einwilligung oder Kauf, Veröffentlichung, Herunterladen oder operative Nutzung geleakter Daten oder Breach-Dumps.

- Nicht einvernehmliche Imitation oder täuschende Identitätsmanipulation.
  - Beispiele: Face Swap, digitale Zwillinge, gefälschte Personas, geklonte Influencer oder anderes Tooling zur Identitätsmanipulation, das zur Imitation oder Irreführung verwendet wird.

- Explizite sexuelle Inhalte und Adult-Generierung mit deaktivierten Sicherheitsfunktionen.
  - Beispiele: NSFW-Bild-/Video-/Content-Generierung, Adult-Content-Wrapper um Drittanbieter-APIs oder Skills, deren Hauptzweck explizite sexuelle Inhalte sind.

- Versteckte, unsichere oder irreführende Ausführungsanforderungen.
  - Beispiele: verschleierte Installationsbefehle, `curl | sh`, nicht deklarierte Secret-Anforderungen, nicht deklarierte Nutzung privater Schlüssel, Remote-Ausführung von `npx @latest` ohne klare Überprüfbarkeit, irreführende Metadaten, die verbergen, was der Skill wirklich zum Ausführen benötigt.

## Aktuelle Muster, die wir ausdrücklich nicht akzeptieren

- „Erstelle heimliche Verkäuferkonten nach Marketplace-Sperren.“
- „Ändere Telegram-Pairing so, dass nicht freigegebene Nutzer automatisch Pairing-Codes erhalten.“
- „Baue Reddit-/Twitter-Konten mit nicht erkennbarer Automatisierung auf.“
- „Generiere professionelle Zertifikate oder Rechnungen für beliebige Nutzung.“
- „Generiere NSFW-Inhalte mit deaktivierten Sicherheitsprüfungen.“
- „Scrape Leads, reichern Sie Kontakte an und starten Sie Cold Outreach in großem Umfang.“
- „Kaufe, veröffentliche oder lade geleakte Daten oder Breach-Dumps herunter.“
- „Erstelle E-Mail- oder Social-Konten massenhaft mit synthetischen Identitäten oder CAPTCHA-Lösung.“

## Hinweise für Reviewer

- Kontext ist wichtig. Dasselbe Thema kann in einem eng begrenzten defensiven oder einwilligungsbasierten Umfeld legitim und als Missbrauchs-Workflow verpackt inakzeptabel sein.
- Wir sollten zum Handeln tendieren, wenn ein Skill eindeutig auf Umgehung, Täuschung oder nicht einvernehmliche Nutzung optimiert ist.
- Wiederholte Uploads in diesen Kategorien sind Gründe, Inhalte auszublenden und das Konto zu sperren.

## Durchsetzung

- Wir können Skills, die gegen die Regeln verstoßen, ausblenden, entfernen oder endgültig löschen.
- Wir können Tokens widerrufen, zugehörige Inhalte per Soft Delete löschen und Wiederholungstäter oder schwere Verstöße sperren.
- Bei offensichtlichem Missbrauch garantieren wir keine Durchsetzung erst nach vorheriger Warnung.
